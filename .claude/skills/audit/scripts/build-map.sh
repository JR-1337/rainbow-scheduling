#!/usr/bin/env bash
# Codebase map builder for /audit Stage 0.5.
# Reads file list from output/scope.txt (produced by scope-resolver.sh).
# Cache key = git-head | scope-hash | dirty-tree-hash. Rebuild if mismatch or >7d old.
#
# Usage: build-map.sh [out-dir]

set -uo pipefail

OUT_DIR="${1:-.claude/skills/audit/output}"
mkdir -p "$OUT_DIR"

SCOPE_FILE="$OUT_DIR/scope.txt"
if [ ! -f "$SCOPE_FILE" ]; then
  echo "build-map.sh: $SCOPE_FILE missing — run scope-resolver.sh first" >&2
  exit 2
fi

MAP_PATH="$OUT_DIR/codebase-map.json"
FP_PATH="$OUT_DIR/codebase-map.fingerprint"

# Fingerprint = git-head | scope-content-hash | dirty-tree-hash
GIT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
DIRTY=$(git status --porcelain 2>/dev/null | sha256sum | cut -c1-12)
SCOPE_HASH=$(sha256sum "$SCOPE_FILE" | cut -c1-12)
FP_NEW="${GIT_HEAD}|${SCOPE_HASH}|${DIRTY}"
SCOPE="$(cat "$SCOPE_FILE" | tr '\n' ' ')"

if [ -f "$FP_PATH" ] && [ -f "$MAP_PATH" ]; then
  FP_OLD=$(cat "$FP_PATH")
  AGE_DAYS=$(( ( $(date +%s) - $(stat -c %Y "$MAP_PATH" 2>/dev/null || echo 0) ) / 86400 ))
  if [ "$FP_NEW" = "$FP_OLD" ] && [ "$AGE_DAYS" -lt 7 ]; then
    echo "Map cache hit (fingerprint match, age=${AGE_DAYS}d): $MAP_PATH"
    exit 0
  fi
fi

# Pass scope file directly to Python via the existing FILE_LIST var
FILE_LIST="$OUT_DIR/.map-files.txt"
cp "$SCOPE_FILE" "$FILE_LIST"

# Hand off to Python — it does the parsing and JSON composition
export FP_NEW SCOPE
python3 <<'PYEOF'
import json, os, re, subprocess, hashlib, time, collections, sys

OUT_DIR = ".claude/skills/audit/output"
FILE_LIST = f"{OUT_DIR}/.map-files.txt"
MAP_PATH = f"{OUT_DIR}/codebase-map.json"

with open(FILE_LIST) as fh:
    files_in = [l.strip() for l in fh if l.strip()]

EXPORT_RE = re.compile(r'^export\s+(const|function|class|default|let|async function|\{)')
IMPORT_RE = re.compile(r'^import\s+')
IMPORT_FROM_RE = re.compile(r"from\s+['\"]([^'\"]+)['\"]")

MARKER_PATTERNS = {
    "security_dangerouslySetInnerHTML": re.compile(r"dangerouslySetInnerHTML"),
    "security_eval": re.compile(r"\beval\("),
    "security_newFunction": re.compile(r"new Function"),
    "security_targetBlank": re.compile(r'target="_blank"'),
    "security_mailto": re.compile(r"mailto:"),
    "a11y_button": re.compile(r"<button"),
    "a11y_input": re.compile(r"<input"),
    "a11y_select": re.compile(r"<select"),
    "a11y_clickableDiv": re.compile(r"<div[^>]*onClick"),
    "a11y_role": re.compile(r"\brole=\""),
    "a11y_aria": re.compile(r"\baria-"),
    "perf_reactMemo": re.compile(r"React\.memo|\bmemo\("),
    "perf_useMemo": re.compile(r"\buseMemo\b"),
    "perf_useCallback": re.compile(r"\buseCallback\b"),
    "perf_filter": re.compile(r"\.filter\("),
    "perf_some": re.compile(r"\.some\("),
    "perf_find": re.compile(r"\.find\("),
    "perf_inlineArrow": re.compile(r"on[A-Z]\w+=\{[^}]*=>[^}]*\}"),
    "correctness_useEffect": re.compile(r"\buseEffect\("),
    "correctness_optionalChain": re.compile(r"\?\."),
}

files = []
for path in files_in:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            content = fh.read()
    except OSError:
        continue
    lines = content.count("\n") + 1
    bytes_ = len(content.encode("utf-8"))
    try:
        mtime = int(os.path.getmtime(path))
    except OSError:
        mtime = 0

    exports = []
    imports = []
    for i, line in enumerate(content.splitlines(), start=1):
        if EXPORT_RE.match(line):
            exports.append({"line": i, "raw": line.strip()[:200]})
        elif IMPORT_RE.match(line):
            m = IMPORT_FROM_RE.search(line)
            imports.append({
                "line": i,
                "from": m.group(1) if m else None,
                "raw": line.strip()[:200],
            })
        if len(exports) > 80 or len(imports) > 80:
            break

    # Augmented 2026-05-01 (s048): per-marker hits with line + 3-line context
    # so the inventory agent can compose findings directly from the map.
    # Cap of 5 hits per marker per file to prevent map bloat.
    markers = []
    file_marker_hits = []  # list of {marker, line, context} for this file
    content_lines = content.splitlines()
    for name, pat in MARKER_PATTERNS.items():
        hits_for_marker = 0
        for i, line in enumerate(content_lines, start=1):
            if pat.search(line):
                ctx_start = max(0, i - 2)
                ctx_end = min(len(content_lines), i + 1)
                context_block = "\n".join(content_lines[ctx_start:ctx_end])[:200]
                file_marker_hits.append({"marker": name, "line": i, "context": context_block})
                hits_for_marker += 1
                if hits_for_marker >= 5:
                    break
        if hits_for_marker > 0:
            markers.append(name)
    if lines > 500:
        markers.append("structural_long")

    files.append({
        "path": path,
        "lines": lines,
        "bytes": bytes_,
        "mtime": mtime,
        "exports": exports,
        "imports": imports,
        "markers": markers,
        "marker_hits": file_marker_hits,
    })

# Resolve relative imports to in-scope files
scope_set = set(f["path"] for f in files)

def resolve(from_path, ref):
    if not ref or not ref.startswith("."):
        return None
    base = os.path.dirname(from_path)
    candidate = os.path.normpath(os.path.join(base, ref))
    for ext in ("", ".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"):
        c = candidate + ext
        if c in scope_set:
            return c
    return None

import_graph = {}
for f in files:
    edges = set()
    for imp in f["imports"]:
        r = resolve(f["path"], imp.get("from"))
        if r:
            edges.add(r)
    import_graph[f["path"]] = sorted(edges)

inverse = collections.defaultdict(list)
for src, dsts in import_graph.items():
    for d in dsts:
        inverse[d].append(src)
inverse = {k: sorted(v) for k, v in inverse.items()}

sizes = sorted(((len(v), k) for k, v in inverse.items()), reverse=True)
threshold = max(2, int(len(sizes) * 0.1))
hot = [k for _, k in sizes[:threshold]]

marker_index = collections.defaultdict(list)
for f in files:
    for hit in f.get("marker_hits", []):
        marker_index[hit["marker"]].append({
            "path": f["path"],
            "line": hit["line"],
            "context": hit["context"],
        })
    # structural_long has no per-line hits; carry it as a path-only entry
    if "structural_long" in f["markers"]:
        marker_index["structural_long"].append({
            "path": f["path"],
            "line": 0,
            "context": f"file is {f['lines']} lines",
        })
marker_index = dict(marker_index)

import os.path as op

# Read fingerprint from env
fp = os.environ.get("FP_NEW", "unknown")

out = {
    "fingerprint": fp,
    "built_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "scope": os.environ.get("SCOPE", "unknown"),
    "file_count": len(files),
    "files": files,
    "import_graph": import_graph,
    "inverse_graph": inverse,
    "hot_files": hot,
    "marker_index": marker_index,
}

with open(MAP_PATH, "w") as fh:
    json.dump(out, fh, indent=2)

print(f"Map written: {MAP_PATH} (files={len(files)}, hot={len(hot)}, markers={len(marker_index)})")
PYEOF

# Persist fingerprint AFTER successful build
echo "$FP_NEW" > "$FP_PATH"
rm -f "$FILE_LIST"

# Export so Python could read; redo the build with env vars set (cleanup of empty file marker)
