#!/bin/bash
# freeze_v20.sh clip... : copy the v20 sheet (commit 66ef083) into assets/sheets/v20/ and its metrics into metrics_v20.json for
# clips that were published without it (pub1 on a shallow clone cannot see 66ef083: `git fetch --depth=1 origin <full sha>` first).
R=/home/claude/gods-anim-lab; K=/home/claude/kl; cd $R
git cat-file -e 66ef083:index.html || { echo "66ef083 not fetched"; exit 1; }
for c in "$@"; do s=$(echo $c | tr _ -)
  for t in mob lite; do
    [ ! -e assets/sheets/v20/$s-$t.webp ] && git cat-file -e 66ef083:assets/sheets/$s-$t.webp 2>/dev/null && git show 66ef083:assets/sheets/$s-$t.webp > assets/sheets/v20/$s-$t.webp
  done
done
python3 - "$@" <<PY
import json,subprocess,sys
p='$K/work/metrics_v20.json'; M=json.load(open(p)); n=0
old=json.loads(subprocess.run(['git','-C','$R','show','66ef083:pipeline/work/adapted_all_metrics.json'],capture_output=True,text=True).stdout)
for c in sys.argv[1:]:
    if c not in M and c in old: M[c]=old[c]; n+=1
json.dump(M,open(p,'w'),indent=1); print('metrics_v20 +',n)
PY
cp $K/work/metrics_v20.json $R/pipeline/work/
