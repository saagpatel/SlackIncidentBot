#!/usr/bin/env bash
set -euo pipefail

# codex-os-managed
max_bytes="${ASSET_MAX_BYTES:-12000000}"
mkdir -p .perf-results
fail=0
count=0
largest_file=""
largest_size=0
target_dir=""
if [[ -f .cargo/config.toml ]]; then
  target_dir=$(sed -n 's/.*target-dir *= *"\([^"]*\)".*/\1/p' .cargo/config.toml | head -n1)
fi
target_dir="${target_dir:-target}"
binary_path="${target_dir%/}/release/incident-bot"

if [[ ! -f "$binary_path" ]]; then
  cat > .perf-results/assets.json <<JSON
{
  "status": "not-run",
  "reason": "release binary missing",
  "maxBytes": ${max_bytes}
}
JSON
  echo "No release binary found at $binary_path; skipping asset check."
  exit 0
fi

size=$(wc -c < "$binary_path")
count=1
largest_file="$binary_path"
largest_size=$size
if (( size > max_bytes )); then
  echo "Asset too large (>${max_bytes} bytes): $binary_path"
  fail=1
fi

status="pass"
if (( fail != 0 )); then
  status="fail"
fi

cat > .perf-results/assets.json <<JSON
{
  "status": "${status}",
  "maxBytes": ${max_bytes},
  "checkedFiles": ${count},
  "largestFile": "${largest_file}",
  "largestSize": ${largest_size},
  "roots": ["${target_dir%/}/release"]
}
JSON

exit $fail
