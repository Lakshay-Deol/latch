"""Receipt generation and verification for Latch.

Containment isn't a feature. It's the product.
Every execution produces a SHA-256 verifiable cryptographic receipt covering
the exact operation and result, backed by real container containment evidence.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import logging
from typing import Any

from . import config, db

logger = logging.getLogger(__name__)


def utcnow_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def canonical(obj: Any) -> bytes:
    """Return deterministic canonical JSON bytes: sorted keys, compact separators, UTF-8."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_digest(operation: Any, result: Any) -> str:
    """Compute SHA-256 digest over canonical representation of {operation, result}."""
    body = {"operation": operation, "result": result}
    return hashlib.sha256(canonical(body)).hexdigest()


def build_receipt(
    operation: Any,
    result: Any,
    sandbox_id: str,
    worker_vm: str,
    containment: dict[str, Any],
    approval: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Construct an execution receipt and attach SHA-256 proof and containment evidence."""
    body = {"operation": operation, "result": result}
    digest = hashlib.sha256(canonical(body)).hexdigest()

    receipt_meta = {
        "sandbox_id": sandbox_id,
        "worker_vm": worker_vm,
        "timestamp": utcnow_iso(),
        "sha256": digest,
        "containment": containment,
    }
    if approval:
        receipt_meta["approval"] = approval

    full_payload = {
        **body,
        "receipt": receipt_meta,
    }

    # Persist locally in SQLite
    try:
        db.save_receipt(
            sha256=digest,
            operation_json=json.dumps(operation),
            result_json=json.dumps(result),
            sandbox_id=sandbox_id,
            worker_vm=worker_vm,
            containment_json=json.dumps(containment),
            approval_json=json.dumps(approval) if approval else None,
        )
    except Exception as e:
        logger.warning(f"Failed to save receipt to DB: {e}")

    # Optionally persist to S3 object storage
    _persist_to_s3(digest, full_payload)

    return full_payload


def _persist_to_s3(digest: str, payload: dict[str, Any]) -> None:
    if not (config.S3_ENDPOINT and config.S3_ACCESS_KEY and config.S3_SECRET_KEY):
        return
    try:
        import boto3
        s3 = boto3.client(
            "s3",
            endpoint_url=config.S3_ENDPOINT,
            aws_access_key_id=config.S3_ACCESS_KEY,
            aws_secret_access_key=config.S3_SECRET_KEY,
        )
        s3.put_object(
            Bucket=config.BUCKET_RECEIPTS,
            Key=f"{digest}.json",
            Body=canonical(payload),
            ContentType="application/json",
        )
    except Exception as e:
        logger.warning(f"Failed to persist receipt to S3: {e}")


def verify_receipt(sha256_hash: str) -> dict[str, Any]:
    """Verify an execution receipt against its stored hash.
    
    Returns valid: true if the hash matches the canonical digest of {operation, result}.
    """
    row = db.get_receipt(sha256_hash)
    if not row:
        return {
            "valid": False,
            "error": "Receipt not found",
            "expected": sha256_hash,
            "actual": None,
        }

    try:
        operation = json.loads(row["operation_json"])
        result = json.loads(row["result_json"])
    except Exception as e:
        return {
            "valid": False,
            "error": f"Failed to parse stored receipt payload: {e}",
            "expected": sha256_hash,
            "actual": None,
        }

    actual = compute_digest(operation, result)
    return {
        "valid": (actual == sha256_hash),
        "expected": sha256_hash,
        "actual": actual,
        "sandbox_id": row.get("sandbox_id"),
        "worker_vm": row.get("worker_vm"),
        "timestamp": row.get("created_at"),
    }

