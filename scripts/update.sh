#!/bin/bash
set -e
cd /root/latch 2>/dev/null || cd "$(dirname "$0")/.."
echo "[1/3] Pulling latest updates from GitHub..."
git pull origin main
echo "[2/3] Rebuilding and updating control container..."
docker compose -f docker-compose.single.yml build control
echo "[3/3] Restarting services..."
docker compose -f docker-compose.single.yml up -d --force-recreate control
echo "============================================="
echo "Latch successfully updated to latest version!"
echo "Check: http://155.138.217.237:8000"
echo "============================================="
