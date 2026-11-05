"""Browser Planner for Latch.

Plans multi-step browser automation flows for execution in disposable browser sandboxes.
Enforces destructive checks and natural language expectations for visual verification.
"""

from __future__ import annotations

import json
import re
from typing import Literal
from pydantic import BaseModel, Field

from . import llm
from .config import BROWSE_MODEL
from .task_planner import DESTRUCTIVE_KEYWORDS, check_destructive_override


class BrowserStep(BaseModel):
    action: Literal["navigate", "click", "fill", "select", "submit", "wait", "extract"]
    target: str = Field(..., description="URL, CSS selector, or element description")
    value: str | None = None
    destructive: bool = False
    expect: str = Field(..., description="Natural-language expectation for vision verifier to check")


class BrowserPlan(BaseModel):
    steps: list[BrowserStep]


BROWSER_PLANNER_SYSTEM = """You are the browser planner for Latch.
Given a user goal and optional starting URL, return an ordered sequence of browser steps.
Supported actions:
- navigate: target is a URL
- click: target is a selector or label
- fill: target is a selector, value is text to input
- select: target is a selector, value is option to choose
- submit: target is a form or button selector (forces destructive: true)
- wait: target is condition or seconds
- extract: target is data selector or description

For each step, include "expect": a short description of what should visibly be on the screen
if the step succeeded (e.g. 'search results are displayed', 'confirmation modal is open').

Return JSON only matching this schema:
{
  "steps": [
    {
      "action": "navigate" | "click" | "fill" | "select" | "submit" | "wait" | "extract",
      "target": "string",
      "value": "string or null",
      "destructive": false,
      "expect": "visible confirmation condition"
    }
  ]
}
"""


def plan_browser(goal: str, start_url: str | None = None) -> list[BrowserStep]:
    """Generate an ordered plan of browser interactions with visual verification expectations."""
    url_prompt = f"Starting URL: {start_url}\n" if start_url else ""
    messages = [
        {"role": "system", "content": BROWSER_PLANNER_SYSTEM},
        {"role": "user", "content": f"{url_prompt}Goal: {goal}"},
    ]

    try:
        resp = llm.chat(messages, model=BROWSE_MODEL, response_format={"type": "json_object"})
        raw = json.loads(resp.get("content", "{}"))
        plan = BrowserPlan.model_validate(raw)
        steps = plan.steps[:12]
    except Exception:
        # Fallback heuristic plan
        steps = [
            BrowserStep(
                action="navigate",
                target=start_url or "https://example.com",
                expect="Initial page load completed and main content is visible",
            ),
            BrowserStep(
                action="extract",
                target="body",
                expect=f"Page elements relevant to '{goal}' are visible",
            ),
        ]

    for s in steps:
        if s.action == "submit":
            s.destructive = True
        s.destructive = check_destructive_override(f"{s.action} {s.target} {s.expect}", s.destructive)

    return steps

