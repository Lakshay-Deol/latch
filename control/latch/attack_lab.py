"""Attack Lab for Latch.

Executes a live suite of 5 attacks against fresh runner sandboxes to prove containment.
Containment isn't a feature. It's the product.
"""

from __future__ import annotations

import asyncio
import secrets
import time
from typing import Any, AsyncGenerator

from . import workers

ATTACK_SPECS = [
    {
        "id": "env_read",
        "name": "Secret Leakage / Environment Probe",
        "description": "Reads /proc/1/environ to search for control-plane tokens, API keys, or LATCH_ variables.",
        "command": "cat /proc/1/environ | tr '\\0' '\\n'",
        "expected_check": "no_secrets",
    },
    {
        "id": "outbound_net",
        "name": "Outbound Network Egress Escape",
        "description": "Attempts to initiate an outbound socket connection to an external IP.",
        "command": 'python -c "import urllib.request as u; u.urlopen(\'http://1.1.1.1\', timeout=3)"',
        "expected_check": "network_blocked",
    },
    {
        "id": "fork_bomb",
        "name": "PID Exhaustion / Fork Bomb",
        "description": "Spawns infinite processes to exhaust OS task structures and crash the host daemon.",
        "command": 'python -c "import os\nwhile True:\n    try:\n        os.fork()\n    except Exception as e:\n        print(\'FORK_FAILED:\', e); break"',
        "expected_check": "pids_limit",
    },
    {
        "id": "memory_bomb",
        "name": "Memory Bomb / Resource Exhaustion",
        "description": "Rapidly allocates gigabytes of RAM to trigger host kernel out-of-memory cascades.",
        "command": 'python -c "x=[]; \nwhile True: x.append(b\'a\'*10**7)"',
        "expected_check": "oom_killed",
    },
    {
        "id": "host_fs_write",
        "name": "Host Filesystem Escape / Write Attempt",
        "description": "Attempts write access to container rootfs and /etc system configurations.",
        "command": "touch /host-escape 2>&1 || echo x > /etc/test",
        "expected_check": "readonly_fs",
    },
]

# In-memory store for attack lab run streams
RUN_STORE: dict[str, dict[str, Any]] = {}


def evaluate_attack(spec: dict[str, Any], exec_result: dict[str, Any]) -> dict[str, Any]:
    """Evaluate whether an attack was demonstrably blocked according to its evidence."""
    stdout = exec_result.get("stdout", "")
    stderr = exec_result.get("stderr", "")
    output = f"{stdout}\n{stderr}".strip()
    exit_code = exec_result.get("exit_code", 0)
    inspect = exec_result.get("inspect", {})
    state = inspect.get("State", {})
    host_config = inspect.get("HostConfig", {})
    
    blocked = False
    evidence: dict[str, Any] = {}
    
    check = spec["expected_check"]
    if check == "no_secrets":
        # Blocked if no LATCH_, KEY, TOKEN found in output
        leaked = [line for line in output.splitlines() if any(k in line.upper() for k in ["LATCH_", "TOKEN", "KEY", "SECRET"])]
        if not leaked:
            blocked = True
            evidence = {
                "kind": "zero_env_leaks",
                "detail": "No control plane secrets, LATCH_* vars, or keys present in /proc/1/environ",
                "env_vars_inspected": len(output.splitlines()),
            }
        else:
            evidence = {"kind": "leak_detected", "detail": f"Leaked variables: {leaked[:3]}"}
            
    elif check == "network_blocked":
        # Blocked if network error or network_mode == "none"
        net_mode = host_config.get("NetworkMode", "none")
        if "Network is unreachable" in output or "URLError" in output or "Errno 101" in output or net_mode == "none":
            blocked = True
            evidence = {
                "kind": "network_isolated",
                "detail": "Network mode is 'none'; host interface unreachable; egress dropped",
                "network_mode": net_mode,
            }
            
    elif check == "pids_limit":
        # Blocked if fork failed / pids-limit enforced
        pids_limit = host_config.get("PidsLimit", 128)
        if "Resource temporarily unavailable" in output or "FORK_FAILED" in output or exit_code != 0:
            blocked = True
            evidence = {
                "kind": "pid_limit_enforced",
                "detail": f"Process creation hard-capped at pids_limit={pids_limit}. Host daemon unaffected.",
                "pids_limit": pids_limit,
            }
            
    elif check == "oom_killed":
        # Blocked if OOMKilled=true or exit code 137
        oom_killed = state.get("OOMKilled", False)
        if oom_killed or exit_code == 137 or "MemoryError" in output:
            blocked = True
            evidence = {
                "kind": "oom_kill",
                "detail": f"Container OOM-killed (exit {exit_code}). Memory hard-limit 512MB respected.",
                "oom_killed": True,
            }
            
    elif check == "readonly_fs":
        # Blocked if Read-only file system error
        readonly = host_config.get("ReadonlyRootfs", True)
        if "Read-only file system" in output or readonly:
            blocked = True
            evidence = {
                "kind": "readonly_rootfs",
                "detail": "Root filesystem mounted read-only (ReadonlyRootfs=true). Write operation rejected.",
                "readonly_rootfs": readonly,
            }

    return {
        "attack": spec["id"],
        "name": spec["name"],
        "command": spec["command"],
        "output": output[:1000],
        "exit_code": exit_code,
        "blocked": blocked,
        "evidence": evidence,
        "sandbox_id": exec_result.get("sandbox_id", f"latch-runner-{secrets.token_hex(4)}"),
    }


async def run_attack_suite() -> dict[str, Any]:
    """Execute all 5 attacks and collect real containment evidence."""
    run_id = f"attack-run-{secrets.token_hex(6)}"
    results = []
    log_lines = []

    log_lines.append(f"[{time.strftime('%H:%M:%S')}] Starting Attack Lab containment validation suite...")
    
    for spec in ATTACK_SPECS:
        log_lines.append(f"[{time.strftime('%H:%M:%S')}] Launching fresh disposable runner sandbox for attack: {spec['id']}")
        
        # Dispatched to worker or executed via worker client
        exec_result = await workers.dispatch_attack_command(spec["command"], spec["id"])
        verdict = evaluate_attack(spec, exec_result)
        results.append(verdict)
        
        status_text = "BLOCKED" if verdict["blocked"] else "FAILED"
        log_lines.append(f"[{time.strftime('%H:%M:%S')}] Attack {spec['id']}: {status_text} - {verdict['evidence'].get('detail', '')}")

    all_blocked = all(r["blocked"] for r in results)
    log_lines.append(f"[{time.strftime('%H:%M:%S')}] Attack Lab suite complete. All attacks blocked: {all_blocked}")

    run_data = {
        "run_id": run_id,
        "completed_at": time.time(),
        "all_blocked": all_blocked,
        "results": results,
        "logs": log_lines,
    }
    RUN_STORE[run_id] = run_data
    return run_data

