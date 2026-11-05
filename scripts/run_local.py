"""Latch Local Development Launcher

Starts both the Worker Daemon (port 7000) and Control Plane (port 8000) locally.
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
WORKER_DIR = ROOT_DIR / "worker"

def main():
    import dotenv
    dotenv.load_dotenv(ROOT_DIR / ".env")

    print("=" * 60)
    print("  Starting Latch Local Environment")
    print("=" * 60)

    # 1. Start Worker Daemon (port 7000)
    print("[1/2] Starting Worker Daemon on http://127.0.0.1:7000 ...")
    worker_env = os.environ.copy()
    worker_env["LATCH_BIND_IP"] = "127.0.0.1"
    worker_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "agentd:app", "--host", "127.0.0.1", "--port", "7000"],
        cwd=str(WORKER_DIR),
        env=worker_env,
    )

    # 2. Start Control Plane (port 8000)
    print("[2/2] Starting Control Plane on http://127.0.0.1:8000 ...")
    control_env = os.environ.copy()
    control_env["LATCH_WORKER_HOSTS"] = "127.0.0.1:7000"
    control_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "latch.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(ROOT_DIR),
        env=control_env,
    )

    print("\n" + "=" * 60)
    print("  Latch is running locally!")
    print("  Dashboard:        http://localhost:8000")
    print("  Worker:           http://localhost:7000/health")
    print("  Default Password: latch-admin-secret")
    print("=" * 60 + "\n")
    print("Press Ctrl+C to stop all services.\n")

    def shutdown(signum, frame):
        print("\nShutting down services...")
        for p in (control_proc, worker_proc):
            try:
                p.terminate()
            except Exception:
                pass
        for p in (control_proc, worker_proc):
            try:
                p.wait(timeout=5)
            except Exception:
                p.kill()
        print("Shutdown complete.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(1)
            if worker_proc.poll() is not None:
                print("Worker process terminated unexpectedly.")
                break
            if control_proc.poll() is not None:
                print("Control plane process terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        shutdown(None, None)

if __name__ == "__main__":
    main()

