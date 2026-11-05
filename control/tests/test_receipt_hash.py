"""Test Phase 4: SHA-256 Execution Receipts.

Asserts:
- Same input -> same SHA-256
- Tampered input -> verification fails
"""

import json
import pytest
from latch import db, receipts


def test_canonical_json_determinism():
    obj1 = {"b": 2, "a": 1, "nested": {"y": True, "x": [3, 2, 1]}}
    obj2 = {"a": 1, "nested": {"x": [3, 2, 1], "y": True}, "b": 2}
    assert receipts.canonical(obj1) == receipts.canonical(obj2)
    assert receipts.compute_digest(obj1, "ok") == receipts.compute_digest(obj2, "ok")


def test_build_and_verify_receipt():
    db.init()
    operation = {"op": "calculate_metrics", "args": [1, 2, 3]}
    result = {"sum": 6, "status": "succeeded"}
    containment = {"network": "none", "readonly": True}

    receipt_obj = receipts.build_receipt(
        operation=operation,
        result=result,
        sandbox_id="latch-runner-test1",
        worker_vm="10.10.0.12",
        containment=containment,
    )
    digest = receipt_obj["receipt"]["sha256"]

    # Valid check
    verification = receipts.verify_receipt(digest)
    assert verification["valid"] is True
    assert verification["expected"] == digest
    assert verification["actual"] == digest


def test_tamper_detection():
    db.init()
    operation = {"op": "sensitive_query"}
    result = {"data": "authentic_output"}
    containment = {"network": "none"}

    receipt_obj = receipts.build_receipt(
        operation=operation,
        result=result,
        sandbox_id="latch-runner-test2",
        worker_vm="10.10.0.12",
        containment=containment,
    )
    digest = receipt_obj["receipt"]["sha256"]

    # Tamper with stored result in DB
    with db.conn() as c:
        c.execute("UPDATE receipts SET result_json=? WHERE sha256=?", (json.dumps({"data": "tampered_output"}), digest))

    # Verification must fail
    tampered_verification = receipts.verify_receipt(digest)
    assert tampered_verification["valid"] is False
    assert tampered_verification["expected"] == digest
    assert tampered_verification["actual"] != digest

