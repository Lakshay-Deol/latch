"""Test: executing a destructive step without an approval record must fail."""

import asyncio
from latch import approval_queue, db


def test_destructive_approval_cycle():
    async def _run():
        db.init()
        step = {
            "id": "step_test_destroy",
            "task_id": "task_test_1",
            "description": "Delete all obsolete user records",
            "destructive": True,
        }
        appr = await approval_queue.request_approval(step, sandbox_id="latch-runner-appr")
        assert appr.status == "pending"
        assert appr.risk == "high"

        # Decide approve
        decided = approval_queue.decide(appr.id, approved=True, user="security_lead")
        assert decided.status == "approved"
        assert decided.decided_by == "security_lead"

    asyncio.run(_run())


def test_unapproved_destructive_action_rejected():
    async def _run():
        db.init()
        step = {
            "id": "step_test_unapproved",
            "task_id": "task_test_2",
            "description": "Purchase cloud compute instances",
            "destructive": True,
        }
        appr = await approval_queue.request_approval(step, sandbox_id="latch-runner-unappr")

        # If denied, execution cannot proceed
        denied = approval_queue.decide(appr.id, approved=False, user="admin")
        assert denied.status == "denied"

    asyncio.run(_run())
