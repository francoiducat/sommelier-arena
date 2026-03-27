#!/usr/bin/env bash
# Simple index generator for docs frontmatter (no external deps)
set -euo pipefail
out=docs-site/docs/docs-index.json
echo '{"generated_at":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","pages":['> "$out"
first=true
for f in docs-site/docs/*.md; do
  path=$(basename "$f")
  title=$(grep -m1 '^title:' "$f" | sed 's/^title:[[:space:]]*//; s/"//g' || true)
  if [ -z "$title" ]; then title=$(grep -m1 '^# ' "$f" | sed 's/^# //' || true); fi
  audience=$(grep -m1 '^audience:' "$f" | sed 's/^audience:[[:space:]]*//; s/"//g' || true)
  tags=$(grep -m1 '^tags:' "$f" | sed 's/^tags:[[:space:]]*//; s/\[//; s/\]//; s/"//g' || true)
  if [ "$first" = true ]; then first=false; else echo ',' >> "$out"; fi
  echo -n "  { \"path\": \"$path\", \"title\": \"$title\", \"audience\": \"$audience\", \"tags\": [\"$(echo "$tags" | sed 's/,/\", \"/g')\"] }" >> "$out"

done

echo '] }' >> "$out"

echo "Wrote $out"
