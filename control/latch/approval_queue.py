"""Approval Queue for Latch.

Enforces mandatory human authorization before any destructive action is executed in a sandbox.
No code path may skip approval for a destructive step.
"""

from __future__ import annotations

import asyncio
import datetime
import json
import secrets
from typing import Any
from pydantic import BaseModel

from . import db


class Approval(BaseModel):
    id: str
    task_id: str | None = None
    step_id: str | None = None
    operation: str
    details: dict[str, Any] = {}
    risk: str = "low"  # low | medium | high
    sandbox_id: str
    status: str = "pending"  # pending | approved | denied | expired
    requested_at: str
    decided_at: str | None = None
    decided_by: str | None = None


# Registry of in-flight decision events
_PENDING_EVENTS: dict[str, asyncio.Event] = {}
_PENDING_APPROVALS: dict[str, Approval] = {}


def utcnow_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def assess_risk(operation: str, details: dict[str, Any] | None = None) -> str:
    """Assess risk level: purchase/delete/send/destroy = high; submit/rsvp/post = medium; else low."""
    text = f"{operation} {json.dumps(details or {}) wiggle}".lower()
    if any(w in text for w in ["purchase", "delete", "destroy", "drop", "wipe", "pay", "send_email", "transfer"]):
        return "high"
    if any(w in text for w in ["submit", "rsvp", "post", "create", "modify", "update"]):
        return "medium"
    return "low"


async def request_approval(
    step: Any,
    sandbox_id: str,
    operation_name: str | None = None,
    details: dict[str, Any] | None = None,
) -> Approval:
    """Queue a step for human review and prepare an asyncio Event for awaiting resolution."""
    approval_id = f"appr-{secrets.token_hex(6)}"
    step_id = getattr(step, "id", None) or (step.get("id") if isinstance(step, dict) else None)
    task_id = getattr(step, "task_id", None) or (step.get("task_id") if isinstance(step, dict) else None)
    desc = getattr(step, "description", None) or (step.get("description") if isinstance(step, dict) else "")
    op = operation_name or desc or "destructive_sandbox_action"
    step_details = details or (step.get("payload_json") if isinstance(step, dict) else {})
    if isinstance(step_details, str):
        try:
            step_details = json.loads(step_details)
        except Exception:
            step_details = {"raw": step_details}

    risk = assess_risk(op, step_details)
    appr = Approval(
        id=approval_id,
        task_id=task_id,
        step_id=step_id,
        operation=op,
        details=step_details if isinstance(step_details, dict) else {"details": step_details},
        risk=risk,
        sandbox_id=sandbox_id,
        status="pending",
        requested_at=utcnow_iso(),
    )

    db.create_approval(
        id=appr.id,
        task_id=appr.task_id,
        step_id=appr.step_id,
        operation=appr.operation,
        details_json=json.dumps(appr.details),
        risk=appr.risk,
        sandbox_id=appr.sandbox_id,
        status=appr.status,
        requested_at=appr.requested_at,
    )

    _PENDING_EVENTS[approval_id] = asyncio.Event()
    _PENDING_APPROVALS[approval_id] = appr
    return appr


async def wait_for_decision(approval_id: str, timeout_s: float = 900.0) -> Approval:
    """Block asynchronously until human approves, denies, or the timeout expires."""
    event = _PENDING_EVENTS.get(approval_id)
    if not event:
        # Check DB directly
        rec = db.get_approval(approval_id)
        if rec:
            return Approval(
                id=rec["id"],
                task_id=rec.get("task_id"),
                step_id=rec.get("step_id"),
                operation=rec["operation"],
                details=json.loads(rec.get("details_json") or "{}"),
                risk=rec.get("risk", "low"),
                sandbox_id=rec["sandbox_id"],
                status=rec["status"],
                requested_at=rec["requested_at"],
                decided_at=rec.get("decided_at"),
                decided_by=rec.get("decided_by"),
            )
        raise ValueError(f"Approval {approval_id} not found")

    try:
        await asyncio.wait_for(event.wait(), timeout=timeout_s)
    except asyncio.TimeoutError:
        return decide(approval_id, approved=False, user="timeout_system", status_override="expired")

    return _PENDING_APPROVALS.get(approval_id) or Approval(
        id=approval_id,
        operation="unknown",
        sandbox_id="unknown",
        status="expired",
        requested_at=utcnow_iso(),
    )


def decide(
    approval_id: str,
    approved: bool,
    user: str = "operator",
    status_override: str | None = None,
) -> Approval:
    """Record human decision on a pending approval."""
    status = status_override or ("approved" if approved else "denied")
    decided_at = utcnow_iso()

    db.update_approval(
        approval_id,
        status=status,
        decided_at=decided_at,
        decided_by=user,
    )

    appr = _PENDING_APPROVALS.get(approval_id)
    if appr:
        appr.status = status
        appr.decided_at = decided_at
        appr.decided_by = user
    else:
        rec = db.get_approval(approval_id)
        if rec:
            appr = Approval(
                id=rec["id"],
                task_id=rec.get("task_id"),
                step_id=rec.get("step_id"),
                operation=rec["operation"],
                details=json.loads(rec.get("details_json") or "{}"),
                risk=rec.get("risk", "low"),
                sandbox_id=rec["sandbox_id"],
                status=status,
                requested_at=rec["requested_at"],
                decided_at=decided_at,
                decided_by=user,
            )

    event = _PENDING_EVENTS.get(approval_id)
    if event and not event.is_set():
        event.set()

    return appr
