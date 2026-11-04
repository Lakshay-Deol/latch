# Latch

> **Containment isn't a feature. It's the product.**

**Latch** is a web-based agent platform that performs real work — writing and running code or operating a real browser — while every action stays inside an isolated sandbox running on Vultr. It plans tasks, dispatches them to isolated execution environments, pauses for human approval on destructive actions, and returns SHA-256-verifiable receipts.

---

## 1. Execution Patterns

Latch natively supports both core agent execution patterns with verifiable containment:

### Pattern A — Sandboxed Code Execution

```
[ User Goal / Prompt ]
         │
         ▼
[ Task Planner (LLM) ] ──> Generates ordered Python steps
         │
         ▼
[ Approval Queue ] ──────> Pauses if destructive (delete, pay, submit)
         │ (Approved)
         ▼
[ Disposable Runner Sandbox ] ──> mem: 512MB, pids: 128, net: none, ro-rootfs
         │
         ▼
[ Explanation & Receipt ] ──────> SHA-256 canonical digest stored in S3 & SQLite
```

### Pattern B — Sandboxed Browser Automation

```
[ User Goal / Web URL ]
         │
         ▼
[ Browser Planner ] ─────> Action steps with visual expectations
         │
         ▼
[ Approval Queue ] ──────> Pauses before clicks/submits on high-risk actions
         │ (Approved)
         ▼
[ Browser Sandbox (Chromium) ] ──> Playwright in isolated tmpfs display
         │
         ▼
[ Vision Verifier ] ────> Vision model confirms expectation on screenshot
         │
         ▼
[ Execution Receipt ] ──> Verifiable proof & screenshot reference
```

---

## 2. Vultr Architecture

Latch is built ground-up on Vultr Cloud infrastructure:

```
                                  VULTR CLOUD
  ┌────────────────────────────────────────────────────────────────────────┐
  │                                                                        │
  │  [ Vultr Serverless Inference ] ──── (OpenAI-compatible LLM & Vision)   │
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

## 3. Five Containment Proofs (Attack Lab)

Every sandbox is hardened and tested against live attacks in the Attack Lab:

1. **Zero Secret Leakage**: Runner containers have empty environments (`environment={}`). Reading `/proc/1/environ` reveals no `LATCH_*` variables, tokens, or cloud credentials (*Proof: Attack Lab #1*).
2. **Total Egress Isolation**: Sandboxes run with `network_mode="none"`. All outbound TCP/UDP connections are dropped at the kernel level (*Proof: Attack Lab #2*).
3. **PID Bomb Immunity**: Containers are hard-capped at 128 PIDs via cgroups. Fork bombs immediately fail without affecting the host worker VM (*Proof: Attack Lab #3*).
4. **Memory Crash Protection**: Runners are constrained to 512MB RAM with no swap escape. Memory bombs are killed cleanly via kernel OOM with exit code 137 (*Proof: Attack Lab #4*).
5. **Immutable Filesystem**: The container root filesystem is mounted read-only (`ReadonlyRootfs=True`). Host and system directory writes are rejected (*Proof: Attack Lab #5*).

---

## 4. Sample Cryptographic Execution Receipt

Every execution yields an immutable receipt covering the canonical representation of `{operation, result}`:

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
    "timestamp": "2026-11-05T04:00:00Z",
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

Verify any receipt at `GET /receipts/{sha256}/verify` or via the web UI.

---

## 5. 10-Minute Demo Path

To run the complete Latch stack locally or on a single Vultr instance:

```bash
# 1. Clone repository
git clone https://github.com/Lakshay-Deol/latch.git
cd latch

# 2. Configure environment
cp .env.example .env

# 3. Boot single-VM compose stack
docker compose -f docker-compose.single.yml up -d

# 4. Open dashboard
# Browse to http://localhost
```

Or deploy to a fresh Vultr account in one command:

```bash
export LATCH_VULTR_KEY="your-vultr-api-key"
python infra/provision-single.py
```

---

## 6. Vultr Services Utilized

| Vultr Service | Role in Latch |
|---|---|
| **Cloud Compute (VC2 / VHP)** | High-performance Control Plane and isolated Worker VMs |
| **VPC (Virtual Private Cloud)** | Isolated 10.10.0.0/24 subnet for inter-node control traffic |
| **Firewall Groups** | Restricts public access to 80/443 on Control; Worker ports accessible only over VPC |
| **Object Storage (S3)** | Persistent store for verifiable skills (`latch-skills`) and receipts (`latch-receipts`) |
| **Serverless Inference** | Qwen 3.8 (vision verification) and GLM 5.3 (task planning and code generation) |

---

## 7. Demo & Links

- **Live Demo**: *Coming soon*
- **Walkthrough Video**: *Coming soon*
- **Submission**: Agent Rush Hackathon on LabLab.ai
