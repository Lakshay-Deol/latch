#!/usr/bin/env bash
# Usage: OLD_NAMES="oldname|abbr1|abbr2" scripts/name_sweep.sh
set -euo pipefail
: "${OLD_NAMES:?set OLD_NAMES to a pipe-separated list of old names/abbreviations}"
if grep -rIniE "$OLD_NAMES" . --exclude-dir=.git --exclude-dir=node_modules --exclude=name_sweep.sh; then
  echo "FAIL: old-name references found"; exit 1
fi
echo "OK: zero old-name references"

