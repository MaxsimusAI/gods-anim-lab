#!/bin/bash
# pub1.sh "<message>" clip [clip...] : publish ONE or a few reviewed clips to the stand right away (flow, PLAYBOOK §5/§9).
# Serialized with a lock (never two publishes at once). Bumps the sheet version, copies only these sheets, rebuilds the manifest,
# syncs pipeline files, commits and pushes. Prints nothing secret.
set -e
exec 9>/tmp/gods-pub.lock; flock 9
MSG="$1"; shift; K=/home/claude/kl; R=/home/claude/gods-anim-lab
V=$(python3 - <<PY
import json; p='$K/work/kling_done.json'; d=json.load(open(p)); d['ver']=int(d['ver'])+1
json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1); print(d['ver'])
PY
)
# Freeze "yesterday" (= the sheet published before this redo, commit 66ef083 = site v20) before the first overwrite (switch, §9)
for c in "$@"; do s=$(echo $c | tr _ -)
  for t in mob lite; do
    if [ ! -e $R/assets/sheets/v20/$s-$t.webp ] && (cd $R && git cat-file -e 66ef083:assets/sheets/$s-$t.webp 2>/dev/null); then
      (cd $R && git show 66ef083:assets/sheets/$s-$t.webp > assets/sheets/v20/$s-$t.webp); fi
  done
  python3 - "$c" <<PY
import json,subprocess,sys
c=sys.argv[1]; p='$K/work/metrics_v20.json'; M=json.load(open(p))
if c not in M:
    old=json.loads(subprocess.run(['git','-C','$R','show','66ef083:pipeline/work/adapted_all_metrics.json'],capture_output=True,text=True).stdout)
    if c in old: M[c]=old[c]; json.dump(M,open(p,'w'),indent=1)
PY
  cp $K/work/gods-anim-lab-repo/assets/sheets/$s-mob.webp $K/work/gods-anim-lab-repo/assets/sheets/$s-lite.webp $R/assets/sheets/
done
cd $K && KL_HERE=$K/work KL_REPO=$R python3 tools/build_full_manifest.py | tail -1
sed -i -E "s/\?v=[0-9]+/?v=$V/g" $R/index.html
cp $K/tools/adapt_batch.py $K/tools/build_full_manifest.py $R/pipeline/tools/
cp $K/work/adapted_all_metrics.json $K/work/impact_overrides.json $K/work/kling_done.json $K/work/metrics_v20.json $R/pipeline/work/
cp $K/b3/*.py $K/b3/*.sh $K/b3/*.md $R/pipeline/b3/ 2>/dev/null || true
rm -f $R/pipeline/b3/up.sh.bak
cd $R
if git diff --cached --quiet && git status --porcelain | grep -qE "tok|urls|jobs_"; then echo "SECRET-LIKE FILE STAGED"; exit 1; fi
git add -A
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "v$V: $MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TwtrTMgVuTY1biwfC6EyG2"
git -c push.negotiate=true push -q origin HEAD 2>&1 | tail -1
echo "published v$V: $*"
