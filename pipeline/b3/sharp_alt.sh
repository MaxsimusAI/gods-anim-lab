#!/bin/bash
# sharp_alt.sh <clip> <video.mp4> <vN> "<label>" [imp k] : sharp cut of an ALTERNATIVE take (a "версия N" button on the stand).
# Does not touch the workspace metrics or sheets: output -> repo assets/sheets/alt/<clip>-<vN>-{mob,lite}.webp, metrics ->
# work/metrics_alt.json (list per clip). imp/k = release frame in the video / in the sheet (actions).
set -e
K=/home/claude/kl; c=$1; v=$2; n=$3; lab=$4; imp=$5; kk=$6
g=${c%%_*}; st=$(echo $c | cut -d_ -f2); d=/tmp/alt/$c-$n; rm -rf $d; mkdir -p $d/raw $d/frames_all/$c $d/gods-anim-lab-repo/assets/sheets
cp $K/work/{live_bt_metrics,new_10_art_metrics,impact_overrides,adapted_all_metrics}.json $d/
python3 - "$d" "$c" "$imp" "$kk" <<'PY'
import json,sys
d,c,imp,k=sys.argv[1:5]; p=d+'/impact_overrides.json'; O=json.load(open(p))
if imp: O[c]={'imp':int(imp),'k':int(k),'v0':4,'v1':68}
else: O.pop(c,None)
json.dump(O,open(p,'w'),indent=1)
PY
ffmpeg -v error -y -i $v $d/raw/f_%03d.png
art=none; [ "$st" = bt ] && [ -f /home/claude/gods-anim-lab/art/f0/$g.webp ] && art=/home/claude/gods-anim-lab/art/f0/$g.webp
python3 $K/b3/sharp_prep.py $d/raw $d/frames_all/$c $art | tail -1; rm -rf $d/raw
(cd /tmp && python3 $K/b3/sharp_cut.py $d 1.2 isnet-general-use $c 2>&1 | grep -E "\->|rror")
s=$(echo $c | tr _ -); R=/home/claude/gods-anim-lab/assets/sheets/alt; mkdir -p $R
for t in mob lite; do cp $d/gods-anim-lab-repo/assets/sheets/$s-$t.webp $R/$s-$n-$t.webp; done
python3 - "$d" "$c" "$n" "$lab" <<'PY'
import json,sys,os
d,c,n,lab=sys.argv[1:5]; S=json.load(open(d+'/adapted_all_metrics.json'))[c]; s=c.replace('_','-')
for t in ('mob','lite'): S[t]['file']=f'{s}-{n}-{t}.webp'
S['label']=lab; S['ver']=n
p='/home/claude/kl/work/metrics_alt.json'; M=json.load(open(p)) if os.path.exists(p) else {}
L=[e for e in M.get(c,[]) if e.get('ver')!=n]; L.append(S); L.sort(key=lambda e:e.get('ver','v2')); M[c]=L
json.dump(M,open(p,'w'),ensure_ascii=False,indent=1)
PY
rm -rf $d/frames_all
