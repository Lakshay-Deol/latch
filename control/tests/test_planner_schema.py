"""Test: task planner schema validation and keyword safety overrides."""

from latch import task_planner


def test_keyword_safety_net():
    # Destructive keywords must force destructive=True
    keywords = ["delete", "remove", "submit", "send", "purchase", "pay", "rsvp", "cancel", "post"]
    for kw in keywords:
        desc = f"Please {kw} the outdated cache entries"
        assert task_planner.check_destructive_override(desc, currently_destructive=False) is True

    # Benign description stays False if currently_destructive is False
    assert task_planner.check_destructive_override("Read user settings and print summary", False) is False


def test_planner_output_structure():
    plan = task_planner.plan_task("Extract public events and RSVP to the hackathon")
    assert len(plan) > 0
    assert len(plan) <= 12
    # The RSVP step must have destructive=True
    rsvp_steps = [s for s in plan if "rsvp" in s.description.lower()]
    for s in rsvp_steps:
        assert s.destructive is True
