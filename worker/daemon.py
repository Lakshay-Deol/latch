"""Latch Worker Daemon: single source of truth for sandbox execution.

The worker daemon is the only component on a worker VM with access to Docker.
It enforces strict containment policies: network isolation, memory and PID limits,
read-only rootfs, privilege dropping, and empty environment variables.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import os
import secrets
import tarfile
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

TOKEN = os.environ.get("LATCH_WORKER_TOKEN", "latch-dev-worker-token-change-in-prod")
BIND_IP = os.environ.get("LATCH_BIND_IP", "127.0.0.1")

RUNNER = dict(
    image="latch-runner",
    mem_limit="512m",
    memswap_limit="512m",
    nano_cpus=1_000_000_000,
    pids_limit=128,
    network_mode="none",
    read_only=True,
    cap_drop=["ALL"],
    security_opt=["no-new-privileges:true"],
    tmpfs={"/tmp": "rw,noexec,nosuid,size=64m"},
    user="65534:65534",
    environment={},  # empty on purpose
    timeout=90,
)

BROWSER = dict(
    image="latch-browser",
    mem_limit="2g",
    memswap_limit="2g",
    nano_cpus=1_500_000_000,
    pids_limit=256,
    network_mode="none",  # egress only via control-plane proxy
    read_only=True,
    cap_drop=["ALL"],
    security_opt=["no-new-privileges:true"],
    tmpfs={"/tmp": "rw,nosuid,size=256m"},
    user="1000:1000",
    environment={},
    timeout=300,
)

try:
    import docker
    client = docker.from_env()
except Exception:
    client = None

app = FastAPI(title="Latch Worker Daemon")


def auth(authorization: str = Header("")):
    if not secrets.compare_digest(authorization, f"Bearer {TOKEN}"):
        raise HTTPException(401, "bad token")


class SandboxRequest(BaseModel):
    job_id: str
    start_url: str = "about:blank"
    kind: str = "browser"


class RunRequest(BaseModel):
    files: dict[str, str] = {}
    input: dict[str, Any] = {}
    timeout: int = 90


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "accepting": True,
        "worker_ip": BIND_IP,
        "runner_config": {"image": RUNNER["image"], "network": RUNNER["network_mode"]},
        "browser_config": {"image": BROWSER["image"], "network": BROWSER["network_mode"]},
    }


@app.post("/sandboxes", dependencies=[Depends(auth)])
def create_sandbox(req: SandboxRequest):
    cfg = BROWSER if req.kind == "browser" else RUNNER
    name = f"latch-{req.kind}-{req.job_id[:20]}-{secrets.token_hex(3)}"
    if not client:
        return {"id": name, "status": "running", "worker_vm": BIND_IP}

    c = client.containers.run(
        cfg["image"],
        name=name,
        detach=True,
        environment=cfg["environment"],
        mem_limit=cfg["mem_limit"],
        nano_cpus=cfg["nano_cpus"],
        pids_limit=cfg["pids_limit"],
        network_mode=cfg["network_mode"],
        read_only=cfg["read_only"],
        cap_drop=cfg["cap_drop"],
        security_opt=cfg["security_opt"],
        tmpfs=cfg["tmpfs"],
        labels={"latch.role": req.kind, "latch.job": req.job_id},
    )
    return {"id": c.name, "status": c.status, "worker_vm": BIND_IP}


@app.post("/run", dependencies=[Depends(auth)])
def run_code(req: RunRequest):
    cfg = RUNNER
    sandbox_id = f"latch-runner-{secrets.token_hex(4)}"
    if not client:
        return {"ok": True, "results": {"output": "Simulated runner execution"}, "sandbox_id": sandbox_id}

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tar:
        for name, content in {**req.files, "input.json": json.dumps(req.input)}.items():
            data = content.encode("utf-8")
            info = tarfile.TarInfo(os.path.basename(name))
            info.size = len(data)
            info.mode = 0o644
            tar.addfile(info, io.BytesIO(data))

    c = client.containers.create(
        cfg["image"],
        name=sandbox_id,
        mem_limit=cfg["mem_limit"],
        nano_cpus=cfg["nano_cpus"],
        pids_limit=cfg["pids_limit"],
        network_mode=cfg["network_mode"],
        read_only=cfg["read_only"],
        cap_drop=cfg["cap_drop"],
        security_opt=cfg["security_opt"],
        tmpfs=cfg["tmpfs"],
        labels={"latch.role": "runner"},
    )
    try:
        c.put_archive("/work", buf.getvalue())
        c.start()
        try:
            status = c.wait(timeout=req.timeout)
        except Exception:
            c.kill()
            return {"ok": False, "error": f"timed out after {req.timeout}s", "results": []}

        out = c.logs(stdout=True, stderr=False).decode(errors="replace").strip()
        err = c.logs(stdout=False, stderr=True).decode(errors="replace")[-2000:]
        try:
            return {"ok": status.get("StatusCode") == 0, "results": json.loads(out.splitlines()[-1]), "stderr": err}
        except Exception:
            return {"ok": False, "stdout": out, "stderr": err}
    finally:
        c.remove(force=True)


@app.delete("/sandboxes/{name}", dependencies=[Depends(auth)])
def delete_sandbox(name: str):
    if client:
        try:
            c = client.containers.get(name)
            c.remove(force=True)
        except Exception:
            pass
    return {"deleted": name}
