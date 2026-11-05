# PROJECT.md — Latch

## Project Overview

**Latch** is a web-based agent platform that performs real work — writing and running code or operating a real browser — while every action stays inside an isolated sandbox running on Vultr.

It plans tasks, dispatches them to isolated execution environments, pauses for human approval on destructive actions, and returns SHA-256-verifiable receipts.

**Tagline**: Containment isn't a feature. It's the product.

---

## 1. What Latch Does

Latch turns tasks and websites into tested APIs for AI agents, with containment-first safety that is visible, verifiable, and undeniable.

Users log in once, let the agent explore or execute, and receive granular operations that any agent can call. No vision model at run time for text tasks. No screenshot guessing.

Core containment principles:

- Every operation runs inside a disposable Docker sandbox on a Vultr Worker VM.
- Every destructive action pauses for human approval.
- Every learned lesson is SHA-256 hashed and verifiable.
- Every attack against the sandbox is demonstrably blocked in the Attack Lab.

---

## 2. Execution Patterns

Latch supports both patterns:
- **Pattern A — Sandboxed Code Execution**: Generates Python scripts, runs them in locked-down runner containers, and hashes the result.
- **Pattern B — Sandboxed Browser Automation**: Explores web apps in Playwright Chromium containers, captures network requests, and verifies screenshots using vision models.

---

## 3. Architecture

1. **Control VM**: Runs FastAPI control plane, SQLite DB (`/data/latch.db`), task orchestrator, approval queue, and WebSocket status broadcaster.
2. **Worker VMs**: Run hardened `latch-worker` daemons in an isolated Vultr VPC. Daemons build disposable `latch-runner` and `latch-browser` containers.
3. **Vultr Serverless Inference**: DeepSeek (`deepseek-v4.1-flash-1017`) and GLM models for reasoning, task planning, browser verification, and code synthesis.
4. **Vultr Object Storage**: S3-compatible buckets (`latch-apis`, `latch-skills`, `latch-receipts`) storing canonical JSON objects and receipts.

