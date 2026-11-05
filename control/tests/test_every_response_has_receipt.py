"""Test: every operation API response contains an execution receipt."""

from latch import publisher


def test_publisher_wraps_receipt():
    op = {"endpoint": "/v1/events", "method": "GET"}
    res = {"events": [{"id": 1, "name": "Hackathon"}]}
    exec_meta = {
        "sandbox_id": "latch-runner-publish-1",
        "worker_vm": "10.10.0.12",
    }
    published = publisher.publish(op, res, exec_meta)
    assert "receipt" in published
    assert "sha256" in published["receipt"]
    assert published["receipt"]["sandbox_id"] == "latch-runner-publish-1"
    assert published["receipt"]["worker_vm"] == "10.10.0.12"
    assert "containment" in published["receipt"]

