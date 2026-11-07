#!/bin/bash
set -e
cd /root/latch 2>/dev/null || cd "$(dirname "$0")/.."

echo "[1/4] Pulling latest updates from GitHub..."
git pull origin main

echo "[2/4] Ensuring Playwright Chromium is installed..."
if [ -d "venv" ]; then
    ./venv/bin/playwright install --with-deps chromium || true
elif command -v playwright >/dev/null 2>&1; then
    playwright install --with-deps chromium || true
fi

echo "[3/4] Ensuring sandbox container images exist..."
docker build -t latch-browser:latest sandbox/browser 2>/dev/null || true
docker build -t latch-runner:latest sandbox/runner 2>/dev/null || true

echo "[4/4] Restarting services..."
if systemctl is-active --quiet latch; then
    systemctl restart latch
    echo "Restarted latch systemd service."
fi
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f docker-compose.single.yml build control 2>/dev/null || true
    docker compose -f docker-compose.single.yml up -d --force-recreate control 2>/dev/null || true
fi

echo "============================================="
echo "Latch successfully updated to latest version!"
echo "Check: http://155.138.217.237:8000"
echo "============================================="

