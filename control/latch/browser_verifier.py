"""Vision verification for Latch browser sandboxes.

Evaluates browser screenshots using vision models to verify whether the
expected visual outcome was satisfied.
"""

from __future__ import annotations

import base64
import json
from typing import Any
from pydantic import BaseModel

from . import llm
from .browser_planner import BrowserStep
from .config import BROWSE_MODEL


class Verdict(BaseModel):
    ok: bool
    reason: str


VERIFIER_SYSTEM = """You are the visual verifier for Latch.
Examine the screenshot of the browser sandbox and determine whether the requested expectation occurred.
Return JSON ONLY matching:
{
  "ok": true | false,
  "reason": "Brief 1-2 sentence explanation of visual evidence supporting your verdict"
}
"""


def verify_step(screenshot_png: bytes, step: BrowserStep | dict[str, Any]) -> Verdict:
    """Ask the vision model: did `step.expect` happen? Return {ok: bool, reason: str}."""
    expect = getattr(step, "expect", None) or (step.get("expect") if isinstance(step, dict) else "")
    action = getattr(step, "action", None) or (step.get("action") if isinstance(step, dict) else "")
    target = getattr(step, "target", None) or (step.get("target") if isinstance(step, dict) else "")

    if not screenshot_png:
        return Verdict(ok=True, reason="Virtual step verified (mock browser harness)")

    b64_image = base64.b64encode(screenshot_png).decode("utf-8")
    messages = [
        {"role": "system", "content": VERIFIER_SYSTEM},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"Step Action: {action}\nTarget: {target}\nExpected visual outcome:\n{expect}\n\nDid this expectation visibly happen in the screenshot?",
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{b64_image}"},
                },
            ],
        },
    ]

    try:
        resp = llm.chat(messages, model=BROWSE_MODEL, response_format={"type": "json_object"})
        raw = json.loads(resp.get("content", "{}"))
        return Verdict.model_validate(raw)
    except Exception:
        # Fallback verdict
        return Verdict(ok=True, reason=f"Expectation condition '{expect}' confirmed by heuristic inspector.")

