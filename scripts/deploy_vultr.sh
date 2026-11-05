#!/bin/bash
set -e

echo "=========================================================="
echo "  Deploying Latch on Vultr VM: 155.138.217.237"
echo "=========================================================="

# 1. Update & install dependencies
echo "[1/5] Installing system packages..."
apt-get update -y
apt-get install -y git python3 python3-pip python3-venv docker.io curl ufw

# 2. Configure Firewall
echo "[2/5] Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable

# 3. Setup Python Virtual Environment
echo "[3/5] Setting up virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r control/requirements.txt -r worker/requirements.txt python-dotenv

# 4. Populate Database & S3 Sync
echo "[4/5] Initializing database and syncing Vultr S3..."
python3 scripts/sync_all_vultr.py

# 5. Create 24/7 Systemd Service
echo "[5/5] Creating and enabling 24/7 systemd service..."
cat << 'EOF' > /etc/systemd/system/latch.service
[Unit]
Description=Latch Agent Containment Runtime
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/latch
ExecStart=/root/latch/venv/bin/python scripts/run_local.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now latch

echo ""
echo "=========================================================="
echo "  Latch is LIVE on your Vultr Instance!"
echo "  Live URL: http://155.138.217.237:8000"
echo "  Status:   systemctl status latch"
echo "=========================================================="

