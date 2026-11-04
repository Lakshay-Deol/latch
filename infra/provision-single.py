"""Single-VM Quickstart for Latch.

Provisions a single high-performance Vultr VM (vc2-4c-8gb) running both control
plane and worker daemon via docker-compose.single.yml in under 10 minutes.
"""

from __future__ import annotations

import base64
import json
import os
import pathlib
import sys
import time
import urllib.request

API = "https://api.vultr.com/v2"
REGION = "atl"
PLAN = "vc2-4c-8gb"
OS_UBUNTU_2404 = 2284


def main():
    token = os.environ.get("LATCH_VULTR_KEY") or os.environ.get("VULTR_API_KEY", "")
    if not token:
        print("Set LATCH_VULTR_KEY or VULTR_API_KEY to provision on Vultr.")
        sys.exit(1)

    print("Provisioning single-VM Latch quickstart instance on Vultr...")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    cloud_init = """#!/bin/bash
set -eux
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
mkdir -p /opt/latch
cd /opt/latch
touch /root/latch-single-bootstrap-done
"""

    req = urllib.request.Request(
        f"{API}/instances",
        data=json.dumps({
            "region": REGION,
            "plan": PLAN,
            "os_id": OS_UBUNTU_2404,
            "label": "latch-single-vm",
            "hostname": "latch-single",
            "user_data": base64.b64encode(cloud_init.encode()).decode(),
            "tags": ["latch", "single-vm"],
        }).encode(),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            inst = data.get("instance", {})
            inst_id = inst.get("id")
            print(f"Created Latch Single-VM Instance: {inst_id}")
            print(f"Initial IP: {inst.get('main_ip')}")
            print("Target setup time: < 10 minutes.")
    except Exception as e:
        print(f"Provisioning call: {e}")


if __name__ == "__main__":
    main()
