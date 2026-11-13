#!/bin/bash
# sharp_batch.sh clip... : sharp cut (sharp_prep + sharp_cut, file cap 120 % of live) in a sandbox, then copied into the
# workspace (sheets + metrics) ready for pub1/pubprev. BT: tone matched to art/f0/<god>.webp; TI: no art here -> no tone step.
set -e
K=/home/claude/kl
for c in "$@"; do
  g=${c%%_*}; st=$(echo $c | cut -d_ -f2); d=/tmp/sc/$c; rm -rf $d; mkdir -p $d/raw $d/frames_all/$c $d/gods-anim-lab-repo/assets/sheets
  cp $K/work/{live_bt_metrics,new_10_art_metrics,impact_overrides,adapted_all_metrics}.json $d/
  ffmpeg -v error -y -i $K/b2/mp4/$c.mp4 $d/raw/f_%03d.png
  art=none; [ "$st" = bt ] && [ -f /home/claude/gods-anim-lab/art/f0/$g.webp ] && art=/home/claude/gods-anim-lab/art/f0/$g.webp
  python3 $K/b3/sharp_prep.py $d/raw $d/frames_all/$c $art | tail -2
  rm -rf $d/raw
  (cd /tmp && python3 $K/b3/sharp_cut.py $d 1.2 isnet-general-use $c 2>&1 | grep -E "\->|rror")
  s=$(echo $c | tr _ -); cp $d/gods-anim-lab-repo/assets/sheets/$s-mob.webp $d/gods-anim-lab-repo/assets/sheets/$s-lite.webp $K/work/gods-anim-lab-repo/assets/sheets/
  python3 - $c $d <<PY
import json,sys
c,d=sys.argv[1:3]; S=json.load(open(d+'/adapted_all_metrics.json'))[c]; S['prep']='sharp cut 13.11 (full frames, denoise, tone to art for BT, unsharp, tuned WebP, cap 120 %)'
p='$K/work/adapted_all_metrics.json'; A=json.load(open(p)); A[c]=S; json.dump(A,open(p,'w'),indent=1)
PY
  rm -rf $d/frames_all
done
echo BATCH DONE
