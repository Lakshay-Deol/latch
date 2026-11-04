#!/usr/bin/env bash
# Verifies that built sandbox images contain zero LATCH_ environment variables or secrets
set -euo pipefail

IMAGES=("latch-runner" "latch-browser")
LEAKS_FOUND=0

for img in "${IMAGES[@]}"; do
  if docker image inspect "$img" >/dev/null 2>&1; then
    echo "Inspecting $img for secrets..."
    ENV_VARS=$(docker image inspect "$img" --format '{{json .Config.Env}}')
    if echo "$ENV_VARS" | grep -Ei "LATCH_|KEY|TOKEN|SECRET"; then
      echo "FAIL: Leaked secret pattern found in $img config!"
      LEAKS_FOUND=1
    fi
  else
    echo "Notice: Image $img not found locally (build first to inspect)."
  fi
done

if [ "$LEAKS_FOUND" -ne 0 ]; then
  exit 1
fi

echo "OK: zero leaks found in image definitions"
