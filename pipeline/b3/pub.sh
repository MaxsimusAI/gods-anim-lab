#!/bin/bash
# Publish: copy cut sheets into the site repo, rebuild the manifest, bump ?v=. Usage: bash b3/pub.sh <version number>
set -e; V="$1"; [ -n "$V" ] || { echo "usage: pub.sh <version>"; exit 1; }
S=/home/claude/kl/work/gods-anim-lab-repo/assets/sheets; D=/home/claude/gods-anim-lab/assets/sheets
for f in $S/*.webp; do b=$(basename $f); case "$b" in *take*|*rejected*) continue;; esac; cp "$f" $D/; done
cd /home/claude/kl && KL_HERE=/home/claude/kl/work KL_REPO=/home/claude/gods-anim-lab python3 tools/build_full_manifest.py
sed -i -E "s/\?v=[0-9]+/?v=$V/g" /home/claude/gods-anim-lab/index.html
cd /home/claude/gods-anim-lab; for f in $(git status --porcelain assets/sheets | awk '{print $2}'); do grep -q "$(basename $f)" assets/gods-data.js || echo "UNREFERENCED $f"; done
