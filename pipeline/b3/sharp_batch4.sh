#!/bin/bash
# sharp_batch.sh clip... : sharp cut (sharp_prep + sharp_cut, file cap 120 % of live) in a sandbox, then copied into the
# workspace (sheets + metrics) ready for pub1/pubprev. BT: tone matched to art/f0/<god>.webp; TI: no art here -> no tone step.
set -e
K=/home/claude/kl
for c in "$@"; do
  # at most two cuts at a time on this machine (three or more run out of memory: BrokenProcessPool, 14.11)
  slot=""; for i in 0 1; do exec 8>/tmp/slot.$i.lock; if flock -n 8; then slot=$i; break; fi; done
  if [ -z "$slot" ]; then slot=$((RANDOM % 2)); exec 8>/tmp/slot.$slot.lock; flock 8; fi   # blocking wait: a polling waiter starved (14.11)
  # per-clip matting switches from impact_overrides.json: "darkbody": true -> KL_DARKBODY=1, "desmoke": true -> KL_DESMOKE=1
  eval "$(python3 -c "import json,sys;o=json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{});d=o.get('darkbody');print('export KL_DARKBODY=%d KL_DESMOKE=%d KL_DARKBODY_T=%s KL_FURKEY=%d'%(1 if d else 0, int(o.get('desmoke') or 0), 45 if d in (True,None,False) else d, int(o.get('furkey') or 0)))" $c)"
  g=${c%%_*}; st=$(echo $c | cut -d_ -f2); d=/tmp/sc/$c; rm -rf $d; mkdir -p $d/raw $d/frames_all/$c $d/gods-anim-lab-repo/assets/sheets
  flock /tmp/am.lock cp $K/work/{live_bt_metrics,new_10_art_metrics,impact_overrides,adapted_all_metrics}.json $d/
  ffmpeg -v error -y -i $K/b2/mp4/$c.mp4 $d/raw/f_%03d.png
  art=none; [ "$st" = bt ] && [ -f /home/claude/gods-anim-lab/art/f0/$g.webp ] && art=/home/claude/gods-anim-lab/art/f0/$g.webp
  need=$(cd /tmp && python3 $K/b3/need_idx.py $c $d/raw)
  # per-clip tone mode (override "tone": "aligned" = curve fitted on the art registered onto frame 1; "tone_art": a path, e.g. the game art)
  export KL_TONE=$(python3 -c "import json,sys;print(json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{}).get('tone',''))" $c)
  export KL_TONE_ART=$(python3 -c "import json,sys;print(json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{}).get('tone_art',''))" $c)
  [ -n "$KL_TONE_ART" ] || unset KL_TONE_ART
  python3 $K/b3/sharp_prep.py $d/raw $d/frames_all/$c $art $need | tail -2
  rm -rf $d/raw
  export KL_MODEL2=$(python3 -c "import json,sys;print(json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{}).get('model2',''))" $c)
  export KL_BGROBUST=$(python3 -c "import json,sys;print(1 if json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{}).get('bg')=='robust' else 0)" $c)
  mdl=$(python3 -c "import json,sys;print(json.load(open('/home/claude/kl/work/impact_overrides.json')).get(sys.argv[1],{}).get('model','isnet-general-use'))" $c)   # per-clip matting model (override "model")
  (cd /tmp && python3 $K/b3/sharp_cut.py $d 1.2 $mdl $c 2>&1 | grep -E "\->|rror")
  s=$(echo $c | tr _ -); cp $d/gods-anim-lab-repo/assets/sheets/$s-mob.webp $d/gods-anim-lab-repo/assets/sheets/$s-lite.webp $K/work/gods-anim-lab-repo/assets/sheets/
  flock /tmp/am.lock python3 - $c $d <<PY
import json,sys
c,d=sys.argv[1:3]; S=json.load(open(d+'/adapted_all_metrics.json'))[c]; S['prep']='sharp cut 13.11 (full frames, denoise, tone to art for BT, unsharp, tuned WebP, cap 120 %)'
p='$K/work/adapted_all_metrics.json'; A=json.load(open(p)); A[c]=S; json.dump(A,open(p,'w'),indent=1)
PY
  rm -rf $d/frames_all
  flock -u 8
done
echo BATCH DONE
