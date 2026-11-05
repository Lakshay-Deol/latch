"""Verifiable Skills for Latch.

Every learned skill or lesson is hashed with SHA-256 over its canonical JSON
representation, stored in object storage / database, and cryptographically verifiable.
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from . import config, db, receipts

logger = logging.getLogger(__name__)


def save_skill(skill: dict[str, Any]) -> str:
    """Save a skill, compute canonical SHA-256 digest, and index it."""
    digest = hashlib.sha256(receipts.canonical(skill)).hexdigest()
    title = skill.get("lesson") or skill.get("title") or "Unnamed skill"
    domain = skill.get("domain") or skill.get("scope") or "general"
    content_json = json.dumps(skill)

    db.save_skill_record(
        sha256=digest,
        title=title[:200],
        domain=domain,
        content_json=content_json,
    )

    # Optional S3 upload
    if config.S3_ENDPOINT and config.S3_ACCESS_KEY:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=config.S3_ENDPOINT,
                aws_access_key_id=config.S3_ACCESS_KEY,
                aws_secret_access_key=config.S3_SECRET_KEY,
            )
            s3.put_object(
                Bucket=config.BUCKET_SKILLS,
                Key=f"{digest}.json",
                Body=receipts.canonical(skill),
                ContentType="application/json",
            )
        except Exception as e:
            logger.warning(f"S3 skill persist notice: {e}")

    return digest


def verify_skill(sha256_hash: str) -> dict[str, Any]:
    """Verify that stored skill content matches its declared SHA-256 hash."""
    record = db.get_skill_record(sha256_hash)
    if not record:
        return {
            "valid": False,
            "error": "Skill not found",
            "expected": sha256_hash,
            "actual": None,
        }

    try:
        content = json.loads(record["content_json"])
    except Exception as e:
        return {
            "valid": False,
            "error": f"Invalid skill JSON: {e}",
            "expected": sha256_hash,
            "actual": None,
        }

    actual = hashlib.sha256(receipts.canonical(content)).hexdigest()
    return {
        "valid": (actual == sha256_hash),
        "expected": sha256_hash,
        "actual": actual,
        "title": record.get("title"),
        "domain": record.get("domain"),
        "created_at": record.get("created_at"),
    }

