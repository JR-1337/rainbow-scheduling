#!/usr/bin/env bash
# Diff current audit findings against the most recent prior report for the same scope.
# Args: 1=scope-slug (e.g. "src-utils-hooks-components"), 2=current findings file (one finding per line)
# Outputs to stdout: REGRESSED / FIXED / PERSISTING counts and lists.

set -uo pipefail

SLUG="${1:-}"
CURRENT="${2:-}"

if [ -z "$SLUG" ] || [ -z "$CURRENT" ]; then
  echo "usage: diff-prior.sh <slug> <current-findings-file>" >&2
  exit 2
fi

# Find the most recent prior report for this scope (excluding today's, if any).
TODAY="$(date -u +%Y-%m-%d)"
PRIOR=$(/bin/ls -1t docs/audit-*-"$SLUG".md 2>/dev/null | grep -v "audit-$TODAY-" | head -1 || true)

if [ -z "$PRIOR" ]; then
  echo "FIRST_RUN: no prior report for slug '$SLUG' — diff skipped"
  exit 0
fi

echo "PRIOR_REPORT: $PRIOR"

# Extract `[CAT] path:line` keys from prior report.
grep -oE '^\[[A-L]\] [^ ]+:[0-9]+' "$PRIOR" | sort -u > /tmp/audit-prior.keys
grep -oE '^\[[A-L]\] [^ ]+:[0-9]+' "$CURRENT" | sort -u > /tmp/audit-current.keys

REGRESSED=$(comm -13 /tmp/audit-prior.keys /tmp/audit-current.keys)
FIXED=$(comm -23 /tmp/audit-prior.keys /tmp/audit-current.keys)
PERSISTING=$(comm -12 /tmp/audit-prior.keys /tmp/audit-current.keys)

echo "REGRESSED_COUNT: $(echo "$REGRESSED" | grep -c . || true)"
echo "FIXED_COUNT: $(echo "$FIXED" | grep -c . || true)"
echo "PERSISTING_COUNT: $(echo "$PERSISTING" | grep -c . || true)"
echo
echo "REGRESSED:"
echo "$REGRESSED"
echo
echo "FIXED:"
echo "$FIXED"
echo
echo "PERSISTING:"
echo "$PERSISTING"
