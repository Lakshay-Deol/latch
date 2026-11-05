"""The generator's skills: lessons learned from mistakes, stored in Vultr Object Storage.

Curated first: every lesson has a status and a source. Lessons the generator learns on its own arrive as
"proposed" (source "auto"); only "approved" lessons are fed into generation prompts. Curated lessons come
from mistakes found and fixed while building and running Latch.
"""
import json
import os
import secrets
import time

try:
    import boto3
except ImportError:
    boto3 = None

from . import config

BUCKET = getattr(config, "BUCKET_SKILLS", "latch-skills")
KEY, LEGACY_KEY = "lessons.json", "lessons.md"


def _local_file():
    return getattr(config, "DATA_DIR", None) and (config.DATA_DIR / KEY)


def _s3():
    endpoint = getattr(config, "S3_ENDPOINT", "") or os.environ.get("S3_ENDPOINT", "")
    key = getattr(config, "S3_ACCESS_KEY", "") or os.environ.get("S3_ACCESS_KEY", "")
    secret = getattr(config, "S3_SECRET_KEY", "") or os.environ.get("S3_SECRET_KEY", "")
    if endpoint and key and secret and boto3:
        try:
            return boto3.client("s3", endpoint_url=endpoint, aws_access_key_id=key, aws_secret_access_key=secret)
        except Exception:
            return None
    return None


def load_all():
    s3 = _s3()
    if s3:
        try:
            return json.loads(s3.get_object(Bucket=BUCKET, Key=KEY)["Body"].read())
        except Exception:
            pass
    local = _local_file()
    if local and local.exists():
        try:
            return json.loads(local.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def save_all(items):
    s3 = _s3()
    if s3:
        try:
            s3.put_object(Bucket=BUCKET, Key=KEY, Body=json.dumps(items, indent=1).encode(), ContentType="application/json")
            return
        except Exception:
            pass
    local = _local_file()
    if local:
        local.write_text(json.dumps(items, indent=1), encoding="utf-8")


def load():
    """Approved lessons as prompt text for the generator."""
    approved = [l for l in load_all() if l.get("status") == "approved" and l.get("scope", "codegen") == "codegen"]
    return "\n".join(f"- {l['lesson']}" for l in approved)


def propose(site, lesson, failure="", fix="", source="auto", status="proposed", scope="codegen", date=None):
    lesson = " ".join((lesson or "").split())[:400]
    if not lesson:
        return None
    items = load_all()
    if any(l["lesson"].lower() == lesson.lower() for l in items):
        return None
    item = {"id": "lsn_" + secrets.token_hex(4), "site": site, "date": date or time.strftime("%Y-%m-%d"),
            "lesson": lesson, "failure": failure[:1200], "fix": fix[:1500], "status": status, "source": source,
            "scope": scope}
    save_all(items + [item])
    return item


def set_status(lesson_id, status):
    items = load_all()
    for l in items:
        if l["id"] == lesson_id:
            l["status"] = status
    save_all(items)
