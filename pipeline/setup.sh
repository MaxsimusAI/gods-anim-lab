#!/bin/bash
# Recreates the working folder /home/claude/kl that all pipeline scripts expect (paths are absolute).
# Source videos and tight input canvases are NOT in git (private art): they are on Maxim's computer,
# folder "Kling тест\workspace" (mp4-*.tar, tight.tar, SHA256SUMS.txt). Stage them into the session
# (device bridge) and pass the folder: bash pipeline/setup.sh /path/to/staged/workspace
set -e
R="$(cd "$(dirname "$0")" && pwd)"; K=/home/claude/kl; W="$1"
mkdir -p $K/tools $K/b3 $K/work/frames_all $K/work/gods-anim-lab-repo/assets/sheets $K/work/qa_sheets $K/b2/mp4 $K/tight
cp "$R"/tools/*.py $K/tools/; cp "$R"/b3/* $K/b3/; cp "$R"/work/*.json $K/work/; cp "$R"/shot3.py $K/
cp "$R"/../assets/sheets/*.webp $K/work/gods-anim-lab-repo/assets/sheets/ 2>/dev/null || true
if [ -n "$W" ]; then
  (cd "$W" && sha256sum -c SHA256SUMS.txt)
  for t in "$W"/mp4-*.tar; do tar xf "$t" -C $K/b2/mp4; done
  tar xf "$W"/tight.tar -C $K/tight
fi
echo "workspace ready: $(ls $K/b2/mp4 | wc -l) videos, $(ls $K/tight | wc -l) tight canvases, $(python3 -c "import json;print(len(json.load(open('$K/work/adapted_all_metrics.json'))))") metric entries"
