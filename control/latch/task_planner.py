"""Task Planner for Latch.

Translates high-level natural language goals into ordered, executable steps (code or browser),
enforcing strict validation, step limits, and keyword safety overrides.
"""

from __future__ import annotations

import json
import re
from typing import Literal
from pydantic import BaseModel, Field

from . import llm
from .config import CODE_MODEL

DESTRUCTIVE_KEYWORDS = {
    "delete",
    "remove",
    "submit",
    "send",
    "purchase",
    "pay",
    "rsvp",
    "cancel",
    "post",
}

SYSTEM_PROMPT = """You are the task planner for Latch, a containment-first AI execution platform.
Break the user's goal down into ordered steps.
Each step must be either:
- 'code': executed in a sandboxed Python runner
- 'browser': executed in a sandboxed Chromium browser

Return ONLY a JSON object matching this schema:
{
  "steps": [
    {
      "kind": "code" | "browser",
      "description": "Short, concrete instruction for this step",
      "destructive": false
    }
  ]
}

Set "destructive": true if the action makes an irreversible external change, writes data,
posts, submits forms, sends emails, or makes purchases.
No preamble, no explanation, only the JSON object.
"""


class PlannedStep(BaseModel):
    kind: Literal["code", "browser"] = "code"
    description: str = Field(..., min_length=1)
    destructive: bool = False


class TaskPlan(BaseModel):
    steps: list[PlannedStep]


def check_destructive_override(description: str, currently_destructive: bool) -> bool:
    """Safety net: force destructive=True if keywords are present."""
    if currently_destructive:
        return True
    desc_lower = description.lower()
    for kw in DESTRUCTIVE_KEYWORDS:
        if re.search(rf"\b{kw}\b", desc_lower):
            return True
    return False


def _heuristic_plan(goal: str) -> list[PlannedStep]:
    """Fallback planner if LLM is unavailable or offline."""
    goal_lower = goal.lower()
    steps: list[PlannedStep] = []
    
    # Check if this is primarily browser-related
    is_browser = any(w in goal_lower for w in ["site", "http", "browse", "navigate", "login", "page", "web", "url"])
    
    if is_browser:
        steps.append(PlannedStep(kind="browser", description=f"Navigate to target and observe initial state for: {goal}"))
        steps.append(PlannedStep(kind="browser", description=f"Locate required elements and extract information"))
        if any(w in goal_lower for w in ["submit", "click", "post", "rsvp", "send", "save"]):
            steps.append(PlannedStep(kind="browser", description=f"Submit requested action for {goal}", destructive=True))
    else:
        steps.append(PlannedStep(kind="code", description=f"Prepare environment and load inputs for: {goal}"))
        steps.append(PlannedStep(kind="code", description=f"Execute computation and process data"))
        steps.append(PlannedStep(kind="code", description=f"Format results and return SHA-256 verifiable output"))
        
    for s in steps:
        s.destructive = check_destructive_override(s.description, s.destructive)
    return steps[:12]


def plan_task(goal: str) -> list[PlannedStep]:
    """Plan a task into an ordered sequence of up to 12 steps.
    
    Uses LLM with JSON validation and retries once on error.
    Applies safety net overrides to flag destructive actions.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Plan steps for this goal:\n{goal}"},
    ]

    for attempt in range(2):
        try:
            resp = llm.chat(messages, model=CODE_MODEL, response_format={"type": "json_object"})
            content = resp.get("content", "").strip()
            # Strip markdown fences if present
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\s*", "", content)
                content = re.sub(r"\s*```$", "", content)
            raw = json.loads(content)
            plan = TaskPlan.model_validate(raw)
            steps = plan.steps[:12]
            for s in steps:
                s.destructive = check_destructive_override(s.description, s.destructive)
            return steps
        except Exception:
            if attempt == 0:
                messages.append({"role": "user", "content": "Your previous response was not valid JSON matching the schema. Please return only the exact JSON object."})
                continue
            break

    # Fallback heuristic
    return _heuristic_plan(goal)

