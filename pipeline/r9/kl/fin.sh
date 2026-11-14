#!/bin/bash
# fin.sh clip... : finish a sharp cut whose batch script died after the cut (sheets + metrics from the sandbox into the workspace)
K=/home/claude/kl
for c in "$@"; do d=/tmp/sc/$c; s=$(echo $c | tr _ -)
  [ -f $d/gods-anim-lab-repo/assets/sheets/$s-mob.webp ] || { echo "$c: no sheet in sandbox"; continue; }
  cp $d/gods-anim-lab-repo/assets/sheets/$s-mob.webp $d/gods-anim-lab-repo/assets/sheets/$s-lite.webp $K/work/gods-anim-lab-repo/assets/sheets/
  flock /tmp/am.lock python3 - $c $d <<PY
import json,sys
c,d=sys.argv[1:3]; S=json.load(open(d+'/adapted_all_metrics.json'))[c]; S['prep']='sharp cut 13.11 (full frames, denoise, tone to art for BT, unsharp, tuned WebP, cap 120 %)'
p='$K/work/adapted_all_metrics.json'; A=json.load(open(p)); A[c]=S; json.dump(A,open(p,'w'),indent=1); print(c,'finished',S['mob'])
PY
done
