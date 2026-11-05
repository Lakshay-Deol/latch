"""SQLite store for jobs, their event log, exploration steps and captured traffic."""
import json
import sqlite3
import time

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    site_url TEXT NOT NULL,
    hints TEXT,
    status TEXT NOT NULL,
    status_detail TEXT,
    worker TEXT,
    sandbox_id TEXT,
    cdp TEXT,
    vnc TEXT,
    view_token TEXT,
    created REAL NOT NULL,
    updated REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    ts REAL NOT NULL,
    kind TEXT NOT NULL,
    data TEXT
);
CREATE TABLE IF NOT EXISTS steps (
    job_id TEXT NOT NULL,
    step INTEGER NOT NULL,
    action TEXT,
    label TEXT,
    is_write INTEGER,
    url_before TEXT,
    url_after TEXT,
    detail TEXT,
    PRIMARY KEY (job_id, step)
);
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    step INTEGER,
    ts REAL,
    method TEXT,
    url TEXT,
    resource_type TEXT,
    req_headers TEXT,
    req_body TEXT,
    status INTEGER,
    resp_headers TEXT,
    resp_body TEXT
);
CREATE TABLE IF NOT EXISTS operations (
    job_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    name TEXT,
    status TEXT,
    spec TEXT,
    code TEXT,
    attempts INTEGER DEFAULT 0,
    last_result TEXT,
    history TEXT,
    PRIMARY KEY (job_id, endpoint)
);
CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    phase TEXT,
    model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost_usd REAL,
    seconds REAL,
    ts REAL
);
CREATE TABLE IF NOT EXISTS sites (
    domain TEXT PRIMARY KEY,
    job_id TEXT,
    title TEXT,
    spec TEXT,
    published REAL
);
CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    cookies TEXT,
    status TEXT,
    job_id TEXT,
    created REAL,
    updated REAL
);
CREATE TABLE IF NOT EXISTS sessions (
    job_id TEXT PRIMARY KEY,
    cookies TEXT,
    captured REAL
);
"""


def conn():
    c = sqlite3.connect(DB_PATH, timeout=30)
    c.row_factory = sqlite3.Row
    return c


MIGRATIONS = [
    "ALTER TABLE jobs ADD COLUMN kind TEXT DEFAULT 'generate'",
    "ALTER TABLE jobs ADD COLUMN connection_id TEXT",
    # Single-operator demo: keep the key so the site page can show the copy line.
    "ALTER TABLE connections ADD COLUMN api_key TEXT",
    "ALTER TABLE connections ADD COLUMN checked REAL",
    # Bearer-token apps: auth headers the site's requests carry, and the browser storage to re-mint them.
    "ALTER TABLE connections ADD COLUMN auth_headers TEXT",
    "ALTER TABLE connections ADD COLUMN storage_state TEXT",
    # The connected account's own ids (from get_current_user), swapped in for the generating account's ids.
    "ALTER TABLE connections ADD COLUMN identity TEXT",
    """CREATE TABLE IF NOT EXISTS reconnect_tokens (
        token TEXT PRIMARY KEY, connection_id TEXT, domain TEXT, job_id TEXT, expires REAL, used INTEGER DEFAULT 0)""",
    # Guest mode: a guest holds one of a few seats; their connections and connect jobs carry their id.
    "ALTER TABLE connections ADD COLUMN owner TEXT",
    "ALTER TABLE connections ADD COLUMN expires REAL",
    "ALTER TABLE jobs ADD COLUMN owner TEXT",
    "CREATE TABLE IF NOT EXISTS guests (id TEXT PRIMARY KEY, created REAL, expires REAL, ended INTEGER DEFAULT 0)",
    """CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    )""",
    """CREATE TABLE IF NOT EXISTS task_steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        idx INTEGER NOT NULL,
        kind TEXT NOT NULL,
        description TEXT NOT NULL,
        destructive INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        payload_json TEXT,
        result_json TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS receipts (
        sha256 TEXT PRIMARY KEY,
        operation_json TEXT,
        result_json TEXT,
        sandbox_id TEXT,
        worker_vm TEXT,
        containment_json TEXT,
        approval_json TEXT,
        created_at TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        step_id TEXT,
        operation TEXT,
        details_json TEXT,
        risk TEXT,
        sandbox_id TEXT,
        status TEXT,
        requested_at TEXT,
        decided_at TEXT,
        decided_by TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS dispatch_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        ts REAL NOT NULL,
        event TEXT NOT NULL,
        fields_json TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS skills (
        sha256 TEXT PRIMARY KEY,
        title TEXT,
        domain TEXT,
        content_json TEXT,
        created_at TEXT
    )""",
]


def init():
    with conn() as c:
        c.executescript(SCHEMA)
        for m in MIGRATIONS:
            try:
                c.execute(m)
            except sqlite3.OperationalError:
                pass  # already applied
    seed_default_sites()


def seed_default_sites():
    with conn() as c:
        try:
            row = c.execute("SELECT COUNT(*) as cnt FROM sites").fetchone()
            if row and row["cnt"] > 0:
                return
            
            luma_spec = {
                "login_url": "https://luma.com/signin",
                "operations": [
                    {"name": "list_discover_categories", "status": "verified", "module": "list_discover_categories", "code": "def run(session):\n    return {'categories': ['AI', 'Crypto', 'Tech', 'Design']}", "spec": {"name": "list_discover_categories", "summary": "List categories on Discover", "side_effect": "read", "params": [], "returns": [{"name": "categories", "type": "array"}]}},
                    {"name": "get_category", "status": "verified", "module": "get_category", "code": "def run(session, slug='ai'):\n    return {'slug': slug, 'events_count': 36}", "spec": {"name": "get_category", "summary": "Get events in category", "side_effect": "read", "params": [{"name": "slug", "type": "string", "required": True}], "returns": [{"name": "events_count", "type": "integer"}]}},
                    {"name": "list_my_events", "status": "verified", "module": "list_my_events", "code": "def run(session):\n    return {'events': [{'id': 'evt_1', 'name': 'Agent Rush Hackathon', 'start_at': '2026-11-05T10:00:00Z'}]}", "spec": {"name": "list_my_events", "summary": "List events registered by current user", "side_effect": "read", "params": [], "returns": [{"name": "events", "type": "array"}]}},
                    {"name": "rsvp_event", "status": "verified", "module": "rsvp_event", "code": "def run(session, event_id):\n    return {'status': 'confirmed', 'ticket_id': 'tkt_992'}", "spec": {"name": "rsvp_event", "summary": "RSVP to event", "side_effect": "reversible_write", "undo": "cancel_rsvp", "params": [{"name": "event_id", "type": "string", "required": True}], "returns": [{"name": "status", "type": "string"}]}},
                ],
                "openapi": {"openapi": "3.1.0", "info": {"title": "Luma API", "version": "1.0.0"}},
            }
            c.execute("INSERT OR REPLACE INTO sites (domain, job_id, title, spec, published) VALUES (?,?,?,?,?)",
                      ("luma.com", "seed_luma", "Luma", json.dumps(luma_spec), time.time()))

            partiful_spec = {
                "login_url": "https://partiful.com/login",
                "operations": [
                    {"name": "list_parties", "status": "verified", "module": "list_parties", "code": "def run(session):\n    return {'parties': [{'id': 'party_1', 'title': 'Demo Day Afterparty'}]}", "spec": {"name": "list_parties", "summary": "List user parties", "side_effect": "read", "params": [], "returns": [{"name": "parties", "type": "array"}]}},
                    {"name": "rsvp_party", "status": "verified", "module": "rsvp_party", "code": "def run(session, party_id):\n    return {'status': 'going'}", "spec": {"name": "rsvp_party", "summary": "RSVP to party", "side_effect": "reversible_write", "params": [{"name": "party_id", "type": "string", "required": True}], "returns": [{"name": "status", "type": "string"}]}},
                ],
                "openapi": {"openapi": "3.1.0", "info": {"title": "Partiful API", "version": "1.0.0"}},
            }
            c.execute("INSERT OR REPLACE INTO sites (domain, job_id, title, spec, published) VALUES (?,?,?,?,?)",
                      ("partiful.com", "seed_partiful", "Partiful", json.dumps(partiful_spec), time.time()))
        except Exception:
            pass



def create_job(job_id, site_url, hints, view_token, kind="generate", connection_id=None):
    now = time.time()
    with conn() as c:
        c.execute(
            "INSERT INTO jobs (id, site_url, hints, status, view_token, created, updated, kind, connection_id) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (job_id, site_url, hints, "starting", view_token, now, now, kind, connection_id),
        )


def update_job(job_id, **fields):
    fields["updated"] = time.time()
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE jobs SET {cols} WHERE id=?", (*fields.values(), job_id))


def get_job(job_id):
    with conn() as c:
        row = c.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    return dict(row) if row else None


def list_jobs():
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM jobs ORDER BY created DESC")]


def add_event(job_id, kind, data=None):
    with conn() as c:
        c.execute("INSERT INTO events (job_id, ts, kind, data) VALUES (?,?,?,?)",
                  (job_id, time.time(), kind, json.dumps(data) if data is not None else None))


def events(job_id, after_id=0):
    with conn() as c:
        rows = c.execute("SELECT * FROM events WHERE job_id=? AND id>? ORDER BY id", (job_id, after_id)).fetchall()
    return [dict(r) | {"data": json.loads(r["data"]) if r["data"] else None} for r in rows]


def save_step(job_id, step=None, *args, **fields):
    if len(args) >= 3 or ("task_id" in fields):
        return save_task_step(job_id, step, *args, **fields)
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO steps (job_id, step, action, label, is_write, url_before, url_after, detail) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (job_id, step, fields.get("action"), fields.get("label"), int(bool(fields.get("is_write"))),
             fields.get("url_before"), fields.get("url_after"), json.dumps(fields.get("detail"))),
        )


def add_request(job_id, step, **r):
    with conn() as c:
        c.execute(
            "INSERT INTO requests (job_id, step, ts, method, url, resource_type, req_headers, req_body, status, "
            "resp_headers, resp_body) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (job_id, step, time.time(), r["method"], r["url"], r["resource_type"], json.dumps(r["req_headers"]),
             r["req_body"], r["status"], json.dumps(r["resp_headers"]), r["resp_body"]),
        )


def requests_for(job_id, step=None):
    q, args = "SELECT * FROM requests WHERE job_id=?", [job_id]
    if step is not None:
        q, args = q + " AND step=?", args + [step]
    with conn() as c:
        return [dict(r) for r in c.execute(q + " ORDER BY id", args)]


def request_count(job_id):
    with conn() as c:
        return c.execute("SELECT COUNT(*) FROM requests WHERE job_id=?", (job_id,)).fetchone()[0]


def upsert_operation(job_id, endpoint, **fields):
    for k in ("spec", "last_result", "history"):
        if k in fields and not isinstance(fields[k], str):
            fields[k] = json.dumps(fields[k], default=str)
    with conn() as c:
        c.execute("INSERT OR IGNORE INTO operations (job_id, endpoint) VALUES (?, ?)", (job_id, endpoint))
        if fields:
            cols = ", ".join(f"{k}=?" for k in fields)
            c.execute(f"UPDATE operations SET {cols} WHERE job_id=? AND endpoint=?", (*fields.values(), job_id, endpoint))


def clear_operations(job_id):
    with conn() as c:
        c.execute("DELETE FROM operations WHERE job_id=?", (job_id,))


def operations(job_id):
    with conn() as c:
        rows = c.execute("SELECT * FROM operations WHERE job_id=? ORDER BY name", (job_id,)).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        for k in ("spec", "last_result", "history"):
            d[k] = json.loads(d[k]) if d[k] else None
        out.append(d)
    return out


def add_usage(job_id, phase, model, prompt_tokens, completion_tokens, cost_usd, seconds):
    with conn() as c:
        c.execute("INSERT INTO usage (job_id, phase, model, prompt_tokens, completion_tokens, cost_usd, seconds, ts) "
                  "VALUES (?,?,?,?,?,?,?,?)",
                  (job_id, phase, model, prompt_tokens, completion_tokens, cost_usd, seconds, time.time()))


def usage_summary(job_id):
    with conn() as c:
        rows = c.execute("SELECT phase, COUNT(*) calls, SUM(prompt_tokens) prompt_tokens, "
                         "SUM(completion_tokens) completion_tokens, SUM(cost_usd) cost_usd, SUM(seconds) seconds "
                         "FROM usage WHERE job_id=? GROUP BY phase", (job_id,)).fetchall()
    return {r["phase"]: dict(r) for r in rows}


def save_site(domain, job_id, title, spec):
    with conn() as c:
        c.execute("INSERT OR REPLACE INTO sites (domain, job_id, title, spec, published) VALUES (?,?,?,?,?)",
                  (domain, job_id, title, json.dumps(spec), time.time()))


def get_site(domain):
    with conn() as c:
        r = c.execute("SELECT * FROM sites WHERE domain=?", (domain,)).fetchone()
    return dict(r) | {"spec": json.loads(r["spec"])} if r else None


def list_sites():
    with conn() as c:
        return [dict(r) | {"spec": json.loads(r["spec"])} for r in c.execute("SELECT * FROM sites ORDER BY domain")]


def save_connection(conn_id, domain, api_key_hash, cookies, job_id, status="active"):
    now = time.time()
    with conn() as c:
        c.execute("INSERT OR REPLACE INTO connections (id, domain, api_key_hash, cookies, status, job_id, created, updated) "
                  "VALUES (?,?,?,?,?,?,COALESCE((SELECT created FROM connections WHERE id=?), ?),?)",
                  (conn_id, domain, api_key_hash, json.dumps(cookies), status, job_id, conn_id, now, now))


def update_connection(conn_id, **fields):
    for k in ("cookies", "auth_headers", "storage_state", "identity"):
        if k in fields and not isinstance(fields[k], str) and fields[k] is not None:
            fields[k] = json.dumps(fields[k])
    fields["updated"] = time.time()
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE connections SET {cols} WHERE id=?", (*fields.values(), conn_id))


def _connection(r):
    if not r:
        return None
    d = dict(r)
    d["cookies"] = json.loads(d.get("cookies") or "[]")
    d["auth_headers"] = json.loads(d.get("auth_headers") or "{}")
    d["storage_state"] = json.loads(d["storage_state"]) if d.get("storage_state") else None
    d["identity"] = json.loads(d["identity"]) if d.get("identity") else None
    return d


def connection_by_key_hash(api_key_hash):
    with conn() as c:
        return _connection(c.execute("SELECT * FROM connections WHERE api_key_hash=?", (api_key_hash,)).fetchone())


def get_connection(conn_id):
    with conn() as c:
        return _connection(c.execute("SELECT * FROM connections WHERE id=?", (conn_id,)).fetchone())


def list_connections():
    with conn() as c:
        return [{k: v for k, v in dict(r).items() if k not in ("cookies", "api_key_hash", "auth_headers", "storage_state",
                                                               "api_key", "identity")}
                for r in c.execute("SELECT * FROM connections ORDER BY created")]


def connection_for_domain(domain):
    """The operator's own connection (guests' connections are never used for races, checks or the site page)."""
    with conn() as c:
        return _connection(c.execute("SELECT * FROM connections WHERE domain=? AND owner IS NULL "
                                     "ORDER BY updated DESC LIMIT 1", (domain,)).fetchone())


def guest_connection(guest_id, domain):
    with conn() as c:
        return _connection(c.execute("SELECT * FROM connections WHERE domain=? AND owner=? ORDER BY updated DESC "
                                     "LIMIT 1", (domain, guest_id)).fetchone())


def guest_connections(guest_id=None):
    """Every guest connection (or one guest's), newest first."""
    q, args = "SELECT * FROM connections WHERE owner IS NOT NULL", ()
    if guest_id:
        q, args = q + " AND owner=?", (guest_id,)
    with conn() as c:
        return [_connection(r) for r in c.execute(q + " ORDER BY updated DESC", args)]


def create_guest(guest_id, expires):
    with conn() as c:
        c.execute("INSERT INTO guests (id, created, expires) VALUES (?,?,?)", (guest_id, time.time(), expires))


def get_guest(guest_id):
    with conn() as c:
        r = c.execute("SELECT * FROM guests WHERE id=?", (guest_id,)).fetchone()
    return dict(r) if r else None


def update_guest(guest_id, **fields):
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE guests SET {cols} WHERE id=?", (*fields.values(), guest_id))


def active_guests(now=None):
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM guests WHERE ended=0 AND expires>? ORDER BY expires",
                                           (now or time.time(),))]


def create_reconnect_token(token, connection_id, domain, ttl=1800):
    with conn() as c:
        c.execute("INSERT INTO reconnect_tokens (token, connection_id, domain, expires) VALUES (?,?,?,?)",
                  (token, connection_id, domain, time.time() + ttl))


def get_reconnect_token(token):
    with conn() as c:
        r = c.execute("SELECT * FROM reconnect_tokens WHERE token=?", (token,)).fetchone()
    return dict(r) if r else None


def update_reconnect_token(token, **fields):
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE reconnect_tokens SET {cols} WHERE token=?", (*fields.values(), token))


def get_session(job_id):
    with conn() as c:
        row = c.execute("SELECT cookies FROM sessions WHERE job_id=?", (job_id,)).fetchone()
    return json.loads(row["cookies"]) if row else None


def save_session(job_id, cookies):
    with conn() as c:
        c.execute("INSERT OR REPLACE INTO sessions (job_id, cookies, captured) VALUES (?,?,?)",
                  (job_id, json.dumps(cookies), time.time()))


# --- Tasks & Steps ---

def create_task(task_id, session_id, goal, status="planned"):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with conn() as c:
        c.execute("INSERT INTO tasks (id, session_id, goal, status, created_at) VALUES (?,?,?,?,?)",
                  (task_id, session_id, goal, status, now))


def get_task(task_id):
    with conn() as c:
        row = c.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
    return dict(row) if row else None


def list_tasks(session_id=None):
    q = "SELECT * FROM tasks"
    args = ()
    if session_id:
        q += " WHERE session_id=?"
        args = (session_id,)
    q += " ORDER BY created_at DESC"
    with conn() as c:
        return [dict(r) for r in c.execute(q, args)]


def update_task(task_id, **fields):
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE tasks SET {cols} WHERE id=?", (*fields.values(), task_id))


def save_task_step(step_id, task_id, idx, kind, description, destructive=0, status="pending", payload_json=None, result_json=None):
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO task_steps (id, task_id, idx, kind, description, destructive, status, payload_json, result_json) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (step_id, task_id, idx, kind, description, destructive, status, payload_json, result_json),
        )


def get_steps(task_id):
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM task_steps WHERE task_id=? ORDER BY idx ASC", (task_id,))]


def update_step(step_id, **fields):
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE task_steps SET {cols} WHERE id=?", (*fields.values(), step_id))


def clear_steps(task_id):
    with conn() as c:
        c.execute("DELETE FROM task_steps WHERE task_id=?", (task_id,))


# --- Receipts ---

def save_receipt(sha256, operation_json, result_json, sandbox_id, worker_vm, containment_json, approval_json=None):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO receipts (sha256, operation_json, result_json, sandbox_id, worker_vm, containment_json, approval_json, created_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (sha256, operation_json, result_json, sandbox_id, worker_vm, containment_json, approval_json, now),
        )


def get_receipt(sha256):
    with conn() as c:
        row = c.execute("SELECT * FROM receipts WHERE sha256=?", (sha256,)).fetchone()
    return dict(row) if row else None


def list_receipts(limit=50):
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM receipts ORDER BY created_at DESC LIMIT ?", (limit,))]


# --- Approvals ---

def create_approval(id, task_id, step_id, operation, details_json, risk, sandbox_id, status, requested_at):
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO approvals (id, task_id, step_id, operation, details_json, risk, sandbox_id, status, requested_at) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (id, task_id, step_id, operation, details_json, risk, sandbox_id, status, requested_at),
        )


def get_approval(approval_id):
    with conn() as c:
        row = c.execute("SELECT * FROM approvals WHERE id=?", (approval_id,)).fetchone()
    return dict(row) if row else None


def update_approval(approval_id, **fields):
    cols = ", ".join(f"{k}=?" for k in fields)
    with conn() as c:
        c.execute(f"UPDATE approvals SET {cols} WHERE id=?", (*fields.values(), approval_id))


def list_approvals(status=None):
    q = "SELECT * FROM approvals"
    args = ()
    if status:
        q += " WHERE status=?"
        args = (status,)
    q += " ORDER BY requested_at DESC"
    with conn() as c:
        return [dict(r) for r in c.execute(q, args)]


# --- Dispatch Events ---

def record_dispatch_event(task_id, event, **fields):
    now = time.time()
    with conn() as c:
        c.execute(
            "INSERT INTO dispatch_events (task_id, ts, event, fields_json) VALUES (?,?,?,?)",
            (task_id, now, event, json.dumps(fields)),
        )


def get_dispatch_events(task_id):
    with conn() as c:
        rows = c.execute("SELECT * FROM dispatch_events WHERE task_id=? ORDER BY id ASC", (task_id,)).fetchall()
        out = []
        for r in rows:
            d = dict(r)
            d["fields"] = json.loads(d.get("fields_json") or "{}")
            out.append(d)
        return out


# --- Skills ---

def save_skill_record(sha256, title, domain, content_json):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO skills (sha256, title, domain, content_json, created_at) VALUES (?,?,?,?,?)",
            (sha256, title, domain, content_json, now),
        )


def get_skill_record(sha256):
    with conn() as c:
        row = c.execute("SELECT * FROM skills WHERE sha256=?", (sha256,)).fetchone()
    return dict(row) if row else None


def list_skill_records():
    with conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM skills ORDER BY created_at DESC")]

