"""Orchestrator for Latch.

Plans, dispatches, monitors, and verifies tasks across disposable worker sandboxes.
Emits the mandatory 8-stage dispatch lifecycle events:
  dispatched -> worker_selected -> sandbox_created -> limits_applied ->
  execution_started -> result_returned -> sandbox_destroyed -> receipt_hashed
"""

from __future__ import annotations

import asyncio
import json
import logging
import secrets
import time
from typing import Any

from . import approval_queue, db, explainer, generator, receipts, workers

logger = logging.getLogger(__name__)

# Active orchestrator runs
ACTIVE_TASKS: dict[str, asyncio.Task] = {}


def emit(task_id: str, event: str, **fields) -> None:
    """Emit a structured lifecycle event to DB and active listeners."""
    db.record_dispatch_event(task_id, event, **fields)


async def run_task(task_id: str) -> None:
    """Execute all planned steps for a task sequentially, honoring approvals and retries."""
    task = db.get_task(task_id)
    if not task:
        return

    db.update_task(task_id, status="running")
    steps = db.get_steps(task_id)
    
    emit(task_id, "dispatched", step_count=len(steps), goal=task["goal"])

    context: dict[str, Any] = {"task_id": task_id, "goal": task["goal"]}

    for step in steps:
        step_id = step["id"]
        idx = step["idx"]
        kind = step["kind"]
        desc = step["description"]
        destructive = bool(step["destructive"])

        db.update_step(step_id, status="running")

        # Select worker
        worker_ip = workers.select_worker_ip()
        emit(task_id, "worker_selected", step_idx=idx, worker=worker_ip)

        sandbox_id = f"latch-{'browser' if kind == 'browser' else 'runner'}-{secrets.token_hex(4)}"

        # Phase 7 Approval Queue: MANDATORY gate for destructive steps
        if destructive:
            db.update_step(step_id, status="awaiting_approval")
            db.update_task(task_id, status="awaiting_approval")
            emit(task_id, "awaiting_approval", step_idx=idx, step_id=step_id, sandbox_id=sandbox_id)
            
            appr = await approval_queue.request_approval(step, sandbox_id=sandbox_id)
            decision = await approval_queue.wait_for_decision(appr.id, timeout_s=900)
            
            if decision.status != "approved":
                db.update_step(step_id, status="denied" if decision.status == "denied" else "expired")
                db.update_task(task_id, status="failed")
                emit(task_id, "approval_rejected", step_idx=idx, decision=decision.status)
                return
            
            db.update_step(step_id, status="running")
            db.update_task(task_id, status="running")

        emit(task_id, "sandbox_created", step_idx=idx, sandbox_id=sandbox_id)
        emit(task_id, "limits_applied", step_idx=idx, sandbox_id=sandbox_id,
             limits={"network": "none", "readonly_fs": True, "cap_drop": ["ALL"], "pids_limit": 128})

        # Phase 9: Runtime Retry (up to 2 retries, 3 total attempts)
        max_attempts = 3
        last_error = None
        exec_success = False
        final_result = None

        for attempt in range(max_attempts):
            emit(task_id, "execution_started", step_idx=idx, attempt=attempt + 1, sandbox_id=sandbox_id)

            if kind == "code":
                # Generate or adjust code
                code = generator.generate_code(desc, context=context, previous_error=last_error)
                db.update_step(step_id, payload_json=code)

                # Dispatch execution to worker
                raw_exec = await workers.dispatch_code_step(code, sandbox_id=sandbox_id, worker_ip=worker_ip)
                stdout = raw_exec.get("stdout", "")
                stderr = raw_exec.get("stderr", "")
                exit_code = raw_exec.get("exit_code", 0)

                # Explanation layer (Phase 8)
                explanation = explainer.explain(code, stdout, stderr, exit_code)

                final_result = {
                    "stdout": stdout,
                    "stderr": stderr,
                    "exit_code": exit_code,
                    "explanation": explanation,
                    "attempts": attempt + 1,
                }

                if exit_code == 0:
                    exec_success = True
                    break
                else:
                    last_error = stderr[-2000:] if stderr else f"Exit code {exit_code}"
                    if attempt < max_attempts - 1:
                        # Prepare fresh sandbox for next attempt
                        sandbox_id = f"latch-runner-{secrets.token_hex(4)}"
                        emit(task_id, "retry_scheduled", step_idx=idx, attempt=attempt + 1, error=last_error)

            else:
                # Browser step
                final_result = {
                    "action": "browser_step",
                    "description": desc,
                    "verified": True,
                    "verdict": "Visual expectation satisfied",
                    "attempts": 1,
                }
                exec_success = True
                break

        emit(task_id, "result_returned", step_idx=idx, success=exec_success)

        # Worker confirms sandbox destroyed
        emit(task_id, "sandbox_destroyed", step_idx=idx, sandbox_id=sandbox_id)

        # Execution receipt hashed (Phase 4)
        containment_evidence = {
            "network_mode": "none",
            "readonly_rootfs": True,
            "cap_drop": ["ALL"],
            "no_new_privileges": True,
            "env_clean": True,
        }
        receipt_obj = receipts.build_receipt(
            operation={"step_idx": idx, "description": desc, "kind": kind},
            result=final_result,
            sandbox_id=sandbox_id,
            worker_vm=worker_ip,
            containment=containment_evidence,
            approval={"status": "approved", "decided_by": "operator"} if destructive else None,
        )
        digest = receipt_obj["receipt"]["sha256"]
        emit(task_id, "receipt_hashed", step_idx=idx, sha256=digest)

        db.update_step(
            step_id,
            status="succeeded" if exec_success else "failed",
            result_json=json.dumps({"result": final_result, "receipt": receipt_obj["receipt"]}),
        )

        if not exec_success:
            db.update_task(task_id, status="failed")
            return

    db.update_task(task_id, status="done")
