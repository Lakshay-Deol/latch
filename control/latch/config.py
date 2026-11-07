import os
import pathlib

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

_default_data = pathlib.Path(__file__).resolve().parent.parent.parent / "data" if os.name == "nt" else pathlib.Path("/data")
DATA_DIR = pathlib.Path(os.environ.get("LATCH_DATA_DIR", str(_default_data)))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = pathlib.Path(os.environ.get("LATCH_DB_PATH", str(DATA_DIR / "latch.db")))

WORKER_TOKEN = os.environ.get("LATCH_WORKER_TOKEN", "latch-dev-worker-token-change-in-prod")
WORKER_HOSTS = [w.strip() for w in os.environ.get("LATCH_WORKER_HOSTS", os.environ.get("LATCH_WORKERS", "127.0.0.1:7000")).split(",") if w.strip()]
WORKERS = WORKER_HOSTS

INFERENCE_URL = os.environ.get("LATCH_INFERENCE_URL", os.environ.get("VULTR_INFERENCE_URL", "https://api.vultrinference.com/v1"))
INFERENCE_KEY = os.environ.get("LATCH_INFERENCE_KEY", os.environ.get("VULTR_INFERENCE_KEY", "latch-inference-key"))
VULTR_KEY = os.environ.get("LATCH_VULTR_KEY", "")

_s3_ep = os.environ.get("LATCH_S3_ENDPOINT", "")
if _s3_ep and not _s3_ep.startswith("http"):
    _s3_ep = f"https://{_s3_ep}"
S3_ENDPOINT = _s3_ep
S3_ACCESS_KEY = os.environ.get("LATCH_S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.environ.get("LATCH_S3_SECRET_KEY", "")
BUCKET_APIS = os.environ.get("LATCH_BUCKET_APIS", "latch-apis")
BUCKET_SKILLS = os.environ.get("LATCH_BUCKET_SKILLS", "latch-skills")
BUCKET_RECEIPTS = os.environ.get("LATCH_BUCKET_RECEIPTS", "latch-receipts")

GUEST_TTL_HOURS = int(os.environ.get("LATCH_GUEST_TTL_HOURS", "6"))

BROWSE_MODEL = os.environ.get("LATCH_BROWSE_MODEL", "deepseek-v4.1-flash-1017")
CODE_MODEL = os.environ.get("LATCH_CODE_MODEL", "deepseek-v4.1-flash-1017")
EXPLORE_MAX_STEPS = int(os.environ.get("LATCH_EXPLORE_MAX_STEPS", "10"))

# Public base URL
_domain = os.environ.get("LATCH_DOMAIN", "localhost")
_default_proto = "http" if _domain.startswith("localhost") or _domain.startswith("127.0.0.1") else "https"
_default_port = ":8000" if _domain.startswith("localhost") or _domain.startswith("127.0.0.1") else ""
PUBLIC_URL = os.environ.get("LATCH_PUBLIC_URL") or f"{_default_proto}://{_domain}{_default_port}"

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
LIVE_BASE = os.environ.get("LATCH_LIVE_BASE") or PUBLIC_URL
