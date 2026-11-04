import os
import pathlib

DATA_DIR = pathlib.Path(os.environ.get("LATCH_DATA_DIR", "/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = pathlib.Path(os.environ.get("LATCH_DB_PATH", str(DATA_DIR / "latch.db")))

WORKER_TOKEN = os.environ.get("LATCH_WORKER_TOKEN", "latch-dev-worker-token-change-in-prod")
WORKER_HOSTS = [w.strip() for w in os.environ.get("LATCH_WORKER_HOSTS", os.environ.get("LATCH_WORKERS", "10.10.0.4:7000")).split(",") if w.strip()]
WORKERS = WORKER_HOSTS

INFERENCE_URL = os.environ.get("LATCH_INFERENCE_URL", os.environ.get("VULTR_INFERENCE_URL", "https://api.vultrinference.com/v1"))
INFERENCE_KEY = os.environ.get("LATCH_INFERENCE_KEY", os.environ.get("VULTR_INFERENCE_KEY", "latch-inference-key"))
VULTR_KEY = os.environ.get("LATCH_VULTR_KEY", "")

S3_ENDPOINT = os.environ.get("LATCH_S3_ENDPOINT", "")
S3_ACCESS_KEY = os.environ.get("LATCH_S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.environ.get("LATCH_S3_SECRET_KEY", "")
BUCKET_APIS = os.environ.get("LATCH_BUCKET_APIS", "latch-apis")
BUCKET_SKILLS = os.environ.get("LATCH_BUCKET_SKILLS", "latch-skills")
BUCKET_RECEIPTS = os.environ.get("LATCH_BUCKET_RECEIPTS", "latch-receipts")

GUEST_TTL_HOURS = int(os.environ.get("LATCH_GUEST_TTL_HOURS", "6"))

BROWSE_MODEL = os.environ.get("LATCH_BROWSE_MODEL", "qwen3.8-27b")
CODE_MODEL = os.environ.get("LATCH_CODE_MODEL", "glm-5.3")
EXPLORE_MAX_STEPS = int(os.environ.get("LATCH_EXPLORE_MAX_STEPS", "60"))

# Public base URL
PUBLIC_URL = os.environ.get("LATCH_PUBLIC_URL") or f"https://{os.environ.get('LATCH_DOMAIN', 'localhost')}"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or None
FRONTIER_MODEL = os.environ.get("LATCH_FRONTIER_MODEL", "claude-opus-5")
TOOL_AGENT_MODEL = os.environ.get("LATCH_TOOL_AGENT_MODEL", BROWSE_MODEL)
JUDGE_MODEL = os.environ.get("LATCH_JUDGE_MODEL", "glm-5.3")

ANTHROPIC_PRICES = {
    "claude-opus-5": (5 / 1e6, 25 / 1e6),
    "claude-opus-5-5": (4 / 1e6, 20 / 1e6),
    "claude-sonnet-5": (2 / 1e6, 10 / 1e6),
    "claude-haiku-4-5": (1 / 1e6, 5 / 1e6),
}
HEALTH_CHECK_SECONDS = int(os.environ.get("LATCH_HEALTH_CHECK_SECONDS", "900"))
LIVE_BASE = os.environ.get("LATCH_LIVE_BASE") or f"https://{os.environ.get('LATCH_DOMAIN', 'localhost')}"
