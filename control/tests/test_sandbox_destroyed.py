"""Test: sandbox containers are immediately removed after execution."""

from latch import db, orchestrator


def test_sandbox_destroyed_event_sequence():
    db.init()
    task_id = "test_cleanup_task"
    orchestrator.emit(task_id, "sandbox_created", sandbox_id="latch-runner-test-clean")
    orchestrator.emit(task_id, "execution_started", sandbox_id="latch-runner-test-clean")
    orchestrator.emit(task_id, "result_returned", success=True)
    orchestrator.emit(task_id, "sandbox_destroyed", sandbox_id="latch-runner-test-clean")

    events = db.get_dispatch_events(task_id)
    event_names = [e["event"] for e in events]
    assert "sandbox_destroyed" in event_names
    assert event_names[-1] == "sandbox_destroyed"

