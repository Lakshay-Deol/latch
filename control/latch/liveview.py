"""Proxies a sandbox's noVNC screen through the control VM.

Sandbox ports stay on the private VPC. The human gets /live/{job}/{token}/..., and the token
is cleared when the job's sandbox is destroyed, so the link expires with the workload.
"""
import asyncio
import secrets

import httpx
import websockets
from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.responses import Response

from . import db

router = APIRouter()


def sandbox_vnc(job_id, token):
    job = db.get_job(job_id)
    if not job or not job["view_token"] or not job["vnc"] or not secrets.compare_digest(job["view_token"], token):
        raise HTTPException(404, "live view not available")
    return job["vnc"]


@router.websocket("/live/{job_id}/{token}/websockify")
async def live_ws(ws: WebSocket, job_id: str, token: str):
    try:
        vnc = sandbox_vnc(job_id, token)
    except HTTPException:
        await ws.close(code=4404)
        return
    # Echo the client's subprotocol only if it offered one; browsers reject an unrequested one.
    offered = ws.scope.get("subprotocols") or []
    proto = "binary" if "binary" in offered else None
    await ws.accept(subprotocol=proto)
    try:
        upstream_cm = websockets.connect(f"ws://{vnc}/websockify", subprotocols=[proto] if proto else None,
                                         max_size=None)
        upstream = await upstream_cm.__aenter__()
    except OSError:
        await ws.close(code=4410)  # sandbox already gone
        return
    try:
        async def client_to_upstream():
            while True:
                msg = await ws.receive()
                if msg["type"] == "websocket.disconnect":
                    break
                await upstream.send(msg.get("bytes") or msg.get("text"))

        async def upstream_to_client():
            async for data in upstream:
                if isinstance(data, bytes):
                    await ws.send_bytes(data)
                else:
                    await ws.send_text(data)

        done, pending = await asyncio.wait(
            [asyncio.create_task(client_to_upstream()), asyncio.create_task(upstream_to_client())],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for t in pending:
            t.cancel()
    finally:
        await upstream_cm.__aexit__(None, None, None)


def render_local_html(site_url: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      margin: 0; padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #1c1917; color: #f5f5f4;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; box-sizing: border-box; text-align: center;
    }}
    .badge {{
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 9999px; background: #292524;
      border: 1px solid #44403c; font-size: 13px; color: #d6d3d1; margin-bottom: 16px;
    }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }}
    h2 {{ margin: 0 0 10px 0; font-size: 20px; font-weight: 600; color: #fff; }}
    p {{ margin: 0 0 20px 0; font-size: 14px; color: #a8a29e; max-width: 460px; line-height: 1.5; }}
    .btn {{
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px; background: #ea580c; color: #fff;
      font-weight: 500; font-size: 14px; text-decoration: none; transition: background 0.15s;
    }}
    .btn:hover {{ background: #c2410c; }}
    .url {{ font-family: monospace; color: #fdba74; word-break: break-all; margin-top: 14px; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="badge"><div class="dot"></div> Local Desktop Sandbox</div>
  <h2>Chromium Browser Window Opened</h2>
  <p>A Chromium browser window has opened on your computer with this site loaded. Interact, navigate, or sign in directly there, then click <strong>Done</strong> below.</p>
  <a class="btn" href="{site_url}" target="_blank" rel="noreferrer">Open Site in New Tab ↗</a>
  <div class="url">{site_url}</div>
</body>
</html>"""


@router.get("/live/{job_id}/{token}/{path:path}")
async def live_http(job_id: str, token: str, path: str):
    if path == "local.html":
        job = db.get_job(job_id)
        if not job or not job.get("view_token") or not secrets.compare_digest(job["view_token"], token):
            raise HTTPException(404, "live view not available")
        return Response(render_local_html(job.get("site_url", "")), media_type="text/html")
    vnc = sandbox_vnc(job_id, token)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"http://{vnc}/{path}")
    except httpx.HTTPError:
        return Response("browser ended", status_code=410, media_type="text/plain")  # sandbox already gone
    return Response(r.content, status_code=r.status_code,
                    media_type=r.headers.get("content-type", "application/octet-stream"))
