#!/usr/bin/env bash
# Static-analysis pre-pass for the /audit skill.
# Runs available tools, writes a unified JSON to stdout.
# Tolerates missing tools — emits {"tool": "...", "available": false} entries.

set -uo pipefail

SCOPE="${1:-src}"
OUT_DIR="${2:-.claude/skills/audit/output}"
mkdir -p "$OUT_DIR"

REPORT="$OUT_DIR/static-pass.json"

echo "{" > "$REPORT"
echo "  \"scope\": \"$SCOPE\"," >> "$REPORT"
echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$REPORT"
echo "  \"tools\": [" >> "$REPORT"

# --- knip: dead exports, unused files, unused deps ---
echo "    {" >> "$REPORT"
echo "      \"tool\": \"knip\"," >> "$REPORT"
timeout 90 npx --yes knip --reporter json --no-progress 2>/dev/null > "$OUT_DIR/.knip.json" || true
if [ -s "$OUT_DIR/.knip.json" ] && head -c1 "$OUT_DIR/.knip.json" | grep -q '{'; then
  echo "      \"available\": true," >> "$REPORT"
  echo "      \"output\": $(cat "$OUT_DIR/.knip.json" | head -c 50000)" >> "$REPORT"
else
  echo "      \"available\": false," >> "$REPORT"
  echo "      \"reason\": \"timeout or empty output\"" >> "$REPORT"
fi
echo "    }," >> "$REPORT"

# --- jscpd: duplicate code blocks ---
echo "    {" >> "$REPORT"
echo "      \"tool\": \"jscpd\"," >> "$REPORT"
JSCPD_PATH="src"
if timeout 90 npx --yes jscpd "$JSCPD_PATH" --reporters json --output "$OUT_DIR/.jscpd" --silent 2>/dev/null; then
  if [ -f "$OUT_DIR/.jscpd/jscpd-report.json" ]; then
    echo "      \"available\": true," >> "$REPORT"
    echo "      \"output\": $(cat "$OUT_DIR/.jscpd/jscpd-report.json" | head -c 50000)" >> "$REPORT"
  else
    echo "      \"available\": true," >> "$REPORT"
    echo "      \"output\": {\"duplicates\": []}" >> "$REPORT"
  fi
else
  echo "      \"available\": false," >> "$REPORT"
  echo "      \"reason\": \"timeout or non-zero exit\"" >> "$REPORT"
fi
echo "    }" >> "$REPORT"

echo "  ]" >> "$REPORT"
echo "}" >> "$REPORT"

echo "Static pass complete: $REPORT"
