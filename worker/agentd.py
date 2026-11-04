"""Worker daemon: the only component allowed to create or destroy sandboxes on a worker VM.

Listens on the worker's VPC address only and requires a shared bearer token, so the
control plane never gets raw Docker access to the worker.
"""
import io
import json
import os
import secrets
import tarfile

import docker
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

TOKEN = os.environ.get("LATCH_WORKER_TOKEN", "latch-dev-worker-token-change-in-prod")
BIND_IP = os.environ.get("LATCH_BIND_IP", "127.0.0.1")  # this worker's VPC address
IMAGE = os.environ.get("LATCH_BROWSER_IMAGE", "latch-browser:latest")
RUNNER_IMAGE = os.environ.get("LATCH_RUNNER_IMAGE", "latch-runner:latest")
MEM_LIMIT = os.environ.get("LATCH_SANDBOX_MEM", "2g")
CPU_LIMIT = float(os.environ.get("LATCH_SANDBOX_CPUS", "1.5"))
MIN_FREE_MB = int(os.environ.get("LATCH_MIN_FREE_MB", "1200"))

try:
    client = docker.from_env()
except Exception:
    client = None

app = FastAPI(title="latch worker")


def auth(authorization: str = Header("")):
    if not secrets.compare_digest(authorization, f"Bearer {TOKEN}"):
        raise HTTPException(401, "bad token")


class SandboxRequest(BaseModel):
    job_id: str
    start_url: str = "about:blank"
    kind: str = "browser"


def free_mb():
    try:
        with open("/proc/meminfo") as f:
            info = {line.split(":")[0]: int(line.split()[1]) for line in f}
        return info["MemAvailable"] // 1024
    except Exception:
        return 4096


def describe(c):
    c.reload()
    ports = c.attrs["NetworkSettings"]["Ports"] or {}

    def hostport(p):
        binding = (ports.get(p) or [{}])[0]
        return f"{BIND_IP}:{binding['HostPort']}" if binding.get("HostPort") else None

    return {
        "id": c.name,
        "job_id": c.labels.get("latch.job"),
        "status": c.status,
        "cdp": hostport("9222/tcp"),
        "vnc": hostport("6080/tcp"),
    }


def sandboxes():
    if not client:
        return []
    return client.containers.list(all=True, filters={"label": "latch.role=sandbox"})


@app.get("/health")
def health():
    running = [c for c in sandboxes() if c.status == "running"]
    return {"free_mb": free_mb(), "sandboxes": len(running), "accepting": free_mb() > MIN_FREE_MB}


@app.get("/sandboxes", dependencies=[Depends(auth)])
def list_sandboxes():
    return [describe(c) for c in sandboxes()]


@app.post("/sandboxes", dependencies=[Depends(auth)])
def create_sandbox(req: SandboxRequest):
    if free_mb() < MIN_FREE_MB:
        raise HTTPException(503, "worker full")
    name = f"latch-browser-{req.job_id[:24]}-{secrets.token_hex(3)}"
    c = client.containers.run(
        IMAGE,
        name=name,
        detach=True,
        environment={"START_URL": req.start_url},
        labels={"latch.role": "sandbox", "latch.job": req.job_id},
        # Random host ports, bound to the VPC address only (Docker bypasses ufw).
        ports={"9222/tcp": (BIND_IP, None), "6080/tcp": (BIND_IP, None)},
        mem_limit=MEM_LIMIT,
        nano_cpus=int(CPU_LIMIT * 1e9),
        shm_size="1g",
        cap_drop=["ALL"],
        security_opt=["no-new-privileges"],
        pids_limit=512,
    )
    return describe(c)


class RunRequest(BaseModel):
    files: dict[str, str]  # module file name -> source (generated operation code)
    input: dict            # {"session": ..., "calls": [...]}
    timeout: int = 90


@app.post("/run", dependencies=[Depends(auth)])
def run_code(req: RunRequest):
    """Execute untrusted generated code in a throwaway, capped container and return its JSON output."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tar:
        for name, content in {**req.files, "input.json": json.dumps(req.input)}.items():
            data = content.encode()
            info = tarfile.TarInfo(os.path.basename(name))
            info.size, info.uid, info.mode = len(data), 1000, 0o644
            tar.addfile(info, io.BytesIO(data))
    c = client.containers.create(
        RUNNER_IMAGE,
        labels={"latch.role": "runner"},
        mem_limit="512m", nano_cpus=int(1e9), pids_limit=128,
        cap_drop=["ALL"], security_opt=["no-new-privileges"],
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
        except (ValueError, IndexError):
            return {"ok": False, "error": "runner produced no JSON", "stdout": out[-2000:], "stderr": err, "results": []}
    finally:
        c.remove(force=True)


@app.delete("/sandboxes/{name}", dependencies=[Depends(auth)])
def delete_sandbox(name: str):
    try:
        c = client.containers.get(name)
    except docker.errors.NotFound:
        raise HTTPException(404, "no such sandbox")
    if c.labels.get("latch.role") != "sandbox":
        raise HTTPException(403, "not a sandbox")
    c.remove(force=True)
    return {"deleted": name}
