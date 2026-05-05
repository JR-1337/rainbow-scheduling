#!/usr/bin/env bash
# Resolves /audit scope to a list of files.
# Args: 1=mode ("full" | "session"), 2=out-file
#
# full:    everything under src/
# session: files touched since the most recent "s<N> handoff:" commit on main,
#          plus working-tree changes (staged + unstaged + untracked).
#          If no handoff commit is found, falls back to commits since 24h ago.

set -uo pipefail

MODE="${1:-full}"
OUT="${2:-/dev/stdout}"

case "$MODE" in
  full)
    find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | sort -u > "$OUT"
    ;;

  session)
    HANDOFF=$(git log --grep="^s[0-9]\+ handoff:" --pretty=%H -n1 2>/dev/null || echo "")
    TMP="$(mktemp)"
    if [ -n "$HANDOFF" ]; then
      git diff --name-only "$HANDOFF"...HEAD 2>/dev/null > "$TMP" || true
    else
      # Fallback: commits in last 24h
      SINCE=$(date -d '24 hours ago' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -v-24H +%Y-%m-%dT%H:%M:%S 2>/dev/null || echo "1 day ago")
      git log --since="$SINCE" --name-only --pretty=format: 2>/dev/null | grep -v '^$' > "$TMP" || true
    fi
    # Add working-tree changes
    git status --porcelain 2>/dev/null | awk '{print $NF}' >> "$TMP"
    # Filter to source files in src/, dedupe, exist on disk
    grep -E '^src/.*\.(js|jsx|ts|tsx)$' "$TMP" 2>/dev/null \
      | sort -u \
      | while IFS= read -r f; do [ -f "$f" ] && echo "$f"; done > "$OUT"
    rm -f "$TMP"
    ;;

  *)
    echo "usage: scope-resolver.sh {full|session} [out-file]" >&2
    exit 2
    ;;
esac

# Echo a count line to stderr for the caller
COUNT=$(wc -l < "$OUT")
echo "Scope '$MODE' resolved to $COUNT files" >&2
