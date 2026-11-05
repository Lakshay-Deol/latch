"""Explanation layer for Latch.

Generates concise, plain-English explanations of code execution results,
automatically redacting any secrets, tokens, or credentials.
"""

from __future__ import annotations

import re
from . import llm
from .config import CODE_MODEL

EXPLAIN_SYSTEM = """You are the execution explainer for Latch, a sandboxed AI execution engine.
Given the executed Python code, stdout, stderr, and exit code, provide a clear, concise explanation
in 2 to 4 plain-English sentences of:
1. What the code did
2. The key outcome or computation result
3. Any warnings, errors, or limits encountered (if non-zero exit code or stderr present)

Do NOT include code snippets in your explanation. Be direct, factual, and informative.
"""

SECRET_PATTERNS = [
    re.compile(r"LATCH_[A-Z0-9_]+=[^\s]+", re.IGNORECASE),
    re.compile(r"(?:bearer|token|secret|key|password)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-\.]{8,}['\"]?", re.IGNORECASE),
    re.compile(r"[a-zA-Z0-9_\-]{32,}", re.IGNORECASE),
]


def redact_secrets(text: str) -> str:
    """Redact any potential secrets, keys, or bearer tokens."""
    redacted = text
    for pat in SECRET_PATTERNS:
        redacted = pat.sub("[REDACTED]", redacted)
    return redacted


def explain(code: str, stdout: str, stderr: str, exit_code: int) -> str:
    """Generate a 2-4 sentence explanation of sandbox execution, redacting sensitive tokens."""
    safe_stdout = redact_secrets(stdout[:2000])
    safe_stderr = redact_secrets(stderr[:2000])
    safe_code = redact_secrets(code[:2000])

    prompt = f"""Executed Code:
{safe_code}

Exit Code: {exit_code}

Standard Output:
{safe_stdout}

Standard Error:
{safe_stderr}
"""
    messages = [
        {"role": "system", "content": EXPLAIN_SYSTEM},
        {"role": "user", "content": prompt},
    ]

    try:
        resp = llm.chat(messages, model=CODE_MODEL)
        content = resp.get("content", "").strip()
        if content:
            return redact_secrets(content)
    except Exception:
        pass

    # Heuristic fallback if LLM is offline
    if exit_code == 0:
        return f"The code executed successfully (exit code 0). Output produced: {safe_stdout[:120].strip() or 'No standard output'}."
    else:
        return f"Execution stopped with exit code {exit_code}. Error details: {safe_stderr[:150].strip() or 'Non-zero termination'}."

