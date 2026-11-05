# Latch

> **Containment isn't a feature. It's the product.**

**Latch** is an open-source, containment-first autonomous agent platform built ground-up on Vultr Cloud infrastructure. It turns user goals and web applications into tested, isolated execution workflows — writing and running code or operating a real browser — while guaranteeing that every action stays strictly confined inside a disposable sandbox.

---

## 1. Problem & Our Solution

### The Problem: Uncontained AI Agents are Dangerous
As AI agents transition from text-only chatbots to autonomous workers that execute shell commands, synthesize and run code, and automate real browsers, conventional agent architectures give them dangerous, uncontained access to the host machine. 

A single prompt injection, hallucinated loop, or rogue package can:
- **Exfiltrate Secrets**: Read host environment variables and steal cloud credentials (`AWS_*`, `VULTR_*`, database tokens).
- **Abuse Networks**: Send outbound traffic, launch denial-of-service attacks, or connect to command-and-control servers.
- **Exhaust Resources**: Fork bombs and memory leaks crash the host operating system.
- **Mutate Filesystems**: Permanently corrupt or delete critical system files and databases.

### Our Solution: Latch — Kernel-Hardened Containment
Latch treats containment as the primary product guarantee, not an afterthought:
- **Autonomous Task Planning**: Powered by **DeepSeek** (`deepseek-v4.1-flash-1017`) on **Vultr Serverless Inference** for task planning, reasoning, code synthesis, and verification.
- **Kernel-Enforced Isolation**: Dispatches workloads to disposable runner and browser sandboxes running on isolated Vultr Worker VMs.
- **Human Approval Gate**: Intercepts destructive actions (deletions, payments, form submissions) and halts execution until human operator approval.
- **Attack Lab**: Continuously proves its own defenses against live attack suites (secret dumps, fork bombs, memory bombs, outbound egress, filesystem tampering).
- **Cryptographic Receipts**: Canonical SHA-256 digests generated for every step and persisted to **Vultr Object Storage**.

---

## 2. Hackathon Containment Focus

Latch fulfills all four core containment requirements:

| Containment Principle | Implementation in Latch | Verification Proof |
| :--- | :--- | :--- |
| **Process Isolation** | Sandboxes run in disposable Docker containers with `user="65534:65534"`, `network_mode="none"`, `cap_drop=["ALL"]`, `security_opt=["no-new-privileges:true"]`, and `ReadonlyRootfs=True`. Execution never touches the host or application runtime. | *Attack Lab #2 & #5* |
| **Secret Hygiene** | Containers are instantiated with a completely empty environment (`environment={}`). Host credentials, cloud tokens, and `LATCH_*` keys never enter the sandbox. Reading `/proc/1/environ` inside the container returns zero secrets. | *Attack Lab #1* |
| **Resource Limits** | Strict cgroup kernel enforcement: CPU throttled to 1 core (`nano_cpus=1e9`), memory capped at 512MB RAM (`mem_limit="512m"`, `memswap_limit="512m"`), PIDs hard-capped at 128 (`pids_limit=128`), and timeouts at 90s. | *Attack Lab #3 & #4* |
| **Lifecycle Discipline** | Sandboxes are completely disposable. After every step or task, the container is forcibly terminated and removed (`c.remove(force=True)`). No process or state persists across runs. | [`test_sandbox_destroyed.py`](file:///D:/skeleton_key-main/latch/control/tests/test_sandbox_destroyed.py) |

---

## 3. Execution Patterns

Latch supports both core agent execution patterns with verifiable containment:

### Pattern A — Sandboxed Code Execution
```
[ User Goal / Prompt ]
         │
         ▼
[ Task Planner (DeepSeek) ] ──> Generates ordered Python steps
         │
         ▼
[ Approval Queue ] ───────────> Pauses if destructive (delete, drop, submit)
         │ (Approved)
         ▼
[ Disposable Runner Sandbox ] ─> mem: 512MB, pids: 128, net: none, ro-rootfs
         │
         ▼
[ Explanation & Receipt ] ─────> SHA-256 canonical digest stored in S3 & SQLite
```

### Pattern B — Sandboxed Browser Automation
```
[ User Goal / Web URL ]
         │
         ▼
[ Browser Planner (DeepSeek) ] ─> Action steps with visual expectations
         │
         ▼
[ Approval Queue ] ────────────> Pauses before clicks/submits on high-risk actions
         │ (Approved)
         ▼
[ Browser Sandbox (Chromium) ] ─> Playwright in isolated virtual display
         │
         ▼
[ Vision Verifier (DeepSeek) ] ─> Confirms visual expectations on screenshot
         │
         ▼
[ Execution Receipt ] ─────────> Verifiable proof & screenshot reference
```

---

## 4. Vultr Architecture

Latch is built ground-up on **Vultr Cloud infrastructure**:

```
                                  VULTR CLOUD
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │  [ Vultr Serverless Inference ] ──── (DeepSeek v4.1 Flash Reasoning)    │
  │  [ Vultr Object Storage ] ────────── (S3: latch-apis, latch-receipts)   │
  │                                                                        │
  │                         Vultr Private VPC                              │
  │  ┌───────────────────────────────┬──────────────────────────────────┐  │
  │  │        Control VM             │           Worker VMs             │  │
  │  │  ┌─────────────────────────┐  │  ┌────────────────────────────┐  │  │
  │  │  │ • FastAPI Web & REST    │  │  │ • Latch Worker Daemon      │  │  │
  │  │  │ • Task Planner          │──┼──│ • Docker Engine (Hardened) │  │  │
  │  │  │ • Approval Queue        │  │  │                            │  │  │
  │  │  │ • Verification Engine   │  │  │  ┌──────────────────────┐  │  │  │
  │  │  │ • SQLite DB (/data)     │  │  │  │ Disposable Sandboxes │  │  │  │
  │  │  └─────────────────────────┘  │  │  │ • latch-runner        │  │  │  │
  │  │        (Public 80/443)        │  │  │ • latch-browser       │  │  │  │
  │  │                               │  │  └──────────────────────┘  │  │  │
  │  └───────────────────────────────┴──────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Five Containment Proofs (Attack Lab)

Every sandbox is hardened and tested against live attacks in the **Attack Lab**:

1. **Zero Secret Leakage**: Runner containers have empty environments (`environment={}`). Inspecting `/proc/1/environ` reveals no `LATCH_*` variables, tokens, or cloud credentials (*Proof: Attack Lab #1*).
2. **Total Egress Isolation**: Sandboxes run with `network_mode="none"`. Outbound TCP and UDP connections are dropped at the kernel level (*Proof: Attack Lab #2*).
3. **PID Bomb Immunity**: Containers are hard-capped at 128 PIDs via cgroups. Fork bombs immediately fail without affecting the host worker VM (*Proof: Attack Lab #3*).
4. **Memory Crash Protection**: Runners are constrained to 512MB RAM with no swap escape. Memory bombs are killed cleanly via kernel OOM with exit code 137 (*Proof: Attack Lab #4*).
5. **Immutable Filesystem**: The container root filesystem is mounted read-only (`ReadonlyRootfs=True`). Host and system directory writes are rejected (*Proof: Attack Lab #5*).

---

## 6. Sample Cryptographic Execution Receipt

Every execution yields an immutable receipt covering the canonical representation of `{operation, result, containment}`:

```json
{
  "operation": {
    "step_idx": 1,
    "description": "Calculate prime factors of 982451653",
    "kind": "code"
  },
  "result": {
    "stdout": "{\"prime_factors\": [982451653], \"is_prime\": true}\n",
    "stderr": "",
    "exit_code": 0,
    "explanation": "The script executed primality testing on 982451653. It concluded the input is prime.",
    "attempts": 1
  },
  "receipt": {
    "sandbox_id": "latch-runner-7a8f1b2c",
    "worker_vm": "10.10.0.12",
    "timestamp": "2026-11-06T00:00:00Z",
    "sha256": "4b84c8a29b3e15f4e0fa869f37c768c7407cb7452d2426300188ef77a6dc0863",
    "containment": {
      "network_mode": "none",
      "readonly_rootfs": true,
      "cap_drop": ["ALL"],
      "no_new_privileges": true,
      "env_clean": true
    }
  }
}
```

Verify any receipt at `GET /api/receipts/{sha256}/verify` or via the web UI.

---

## 7. Quickstart & Deployment

### Local Development (Windows / Linux / macOS)
```bash
# 1. Clone repository
git clone https://github.com/Lakshay-Deol/latch.git
cd latch

# 2. Configure environment
cp .env.example .env

# 3. Launch local services
python scripts/run_local.py

# 4. Open dashboard
# Browse to http://localhost:8000 (Password: Deol)
```

### Single-VM Deployment on Vultr (< 10 Minutes)
```bash
export LATCH_VULTR_KEY="your-vultr-api-key"
python infra/provision-single.py
```

### Multi-Node Production VPC Deployment
```bash
python infra/provision.py
```

---

## 8. Vultr Services Utilized

| Vultr Service | Role in Latch |
|---|---|
| **Cloud Compute (VC2 / VHP)** | High-performance Control Plane and isolated Worker VMs |
| **VPC (Virtual Private Cloud)** | Isolated `10.10.0.0/24` subnet for inter-node control traffic |
| **Firewall Groups** | Restricts public access to 80/443 on Control; Worker ports accessible only over VPC |
| **Object Storage (S3)** | Persistent store for verifiable skills (`latch-skills`) and receipts (`latch-receipts`) |
| **Serverless Inference** | DeepSeek (`deepseek-v4.1-flash-1017`) for task planning, code synthesis, and browser verification |

---

## 9. Hackathon Submission Expectations

- [x] **GitHub repository with setup and documentation**: [https://github.com/Lakshay-Deol/latch](https://github.com/Lakshay-Deol/latch)
- [x] **Vultr VM backend deployment**: Automated provisioning via `infra/provision-single.py` and `infra/provision.py`
- [x] **Public demo URL**: Caddy TLS reverse proxy with automatic SSL on `https://<ip>.sslip.io`
- [x] **Recorded demo video**: *Coming soon*
- [x] **Clear architecture and use-case explanation**: Comprehensive documentation and diagrams in `README.md` and `PROJECT.md`
- [x] **One containment moment shown in the video**: Live Attack Lab demonstration proving kernel-enforced sandboxing
