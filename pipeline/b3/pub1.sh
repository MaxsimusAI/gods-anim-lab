#!/bin/bash
# pub1.sh "<message>" clip [clip...] : publish ONE or a few reviewed clips to the stand right away (flow, PLAYBOOK §5/§9).
# The site manifest is built from work/metrics_pub.json (published cuts), never from fresh unreviewed cuts.
# Serialized with a lock (never two publishes at once). Checks everything BEFORE writing; on any later failure it restores
# kling_done.json, metrics_pub.json and the repo working tree. Bumps the sheet version, copies only these sheets, rebuilds the
# manifest, runs sizecheck, syncs pipeline files, commits only known paths, scans the staged diff for secrets, pushes and
# waits until the live site serves the new ?v=. Prints nothing secret.
set -eo pipefail
exec 9>/tmp/gods-pub.lock; flock 9
MSG="$1"; shift; K=/home/claude/kl; R=/home/claude/gods-anim-lab; W=$K/work/gods-anim-lab-repo/assets/sheets
[ $# -ge 1 ] || { echo "usage: pub1.sh \"msg\" clip..."; exit 1; }

# 1. checks before any write
python3 - "$@" <<PY
import json,os,sys
A=json.load(open('$K/work/adapted_all_metrics.json')); G=json.load(open('$K/work/kling_done.json'))['gods']; bad=[]
for c in sys.argv[1:]:
    s=c.replace('_','-')
    import re
    if not re.fullmatch(r'[a-z]+_(bt|ti)_(idle|atk|sup|hyp)', c): bad.append(c+': not a clip id god_style_slot')
    if 'take' in c or 'rejected' in c: bad.append(c+': take/rejected')
    if c not in A: bad.append(c+': no metrics (not cut)')
    elif A[c].get('v')!=21: bad.append(c+': metrics not v21')
    if c.split('_')[0] not in G: bad.append(c+': god not in kling_done (would not show)')
    for t in ('mob','lite'):
        if not os.path.exists(f'$W/{s}-{t}.webp'): bad.append(f'{c}: no {t} sheet')
if bad: print('REFUSED:', '; '.join(bad)); sys.exit(1)
PY
# the repo must be clean except PLAYBOOK.md (rules are committed with the publish); code changes go in their own reviewed commit
DIRTY=$(git -C $R status --porcelain | grep -v ' PLAYBOOK.md$' || true)
[ -z "$DIRTY" ] || { echo "REFUSED: uncommitted changes in the repo (commit reviewed code separately):"; echo "$DIRTY"; exit 1; }

# 2. backups + restore on failure
B=$(mktemp -d); cp $K/work/kling_done.json $K/work/metrics_pub.json $K/work/metrics_v20.json $B/
restore() { trap - ERR INT TERM HUP
            cp $B/kling_done.json $B/metrics_pub.json $B/metrics_v20.json $K/work/
            git -C $R reset -q -- assets index.html pipeline app.js 2>/dev/null || true
            git -C $R checkout -q -- assets index.html pipeline app.js 2>/dev/null || true
            git -C $R clean -qfd -- assets/sheets pipeline 2>/dev/null || true
            echo "FAILED - kling_done/metrics restored, repo files reset to HEAD (PLAYBOOK.md untouched), nothing published"; exit 1; }
trap restore ERR INT TERM HUP

V=$(python3 - <<PY
import json,re; p='$K/work/kling_done.json'; d=json.load(open(p))
cur=[int(x) for x in re.findall(r'\?v=(\d+)', open('$R/index.html').read())] or [0]
d['ver']=max(int(d['ver']), max(cur))+1   # never reuse a ?v= that browsers may have cached
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
  cp $W/$s-mob.webp $W/$s-lite.webp $R/assets/sheets/
done
# the site is built from PUBLISHED cuts only: copy the metrics of exactly these clips into metrics_pub.json
python3 - "$@" <<PY
import json,sys
A=json.load(open('$K/work/adapted_all_metrics.json')); p='$K/work/metrics_pub.json'; P=json.load(open(p))
for c in sys.argv[1:]: P[c]=A[c]
json.dump(P,open(p,'w'),indent=1)
PY
cd $K && KL_HERE=$K/work KL_REPO=$R python3 tools/build_full_manifest.py | tail -1
python3 $K/b3/sizecheck.py $R
sed -i -E "s/\?v=[0-9]+/?v=$V/g" $R/index.html
for f in app.js assets/sim-core.js assets/fx2-stand.js assets/gods-data.js; do node -e "new Function(require('fs').readFileSync('$R/$f','utf8'))"; done
cp $K/tools/adapt_batch.py $K/tools/build_full_manifest.py $R/pipeline/tools/
cp $K/work/adapted_all_metrics.json $K/work/impact_overrides.json $K/work/kling_done.json $K/work/metrics_v20.json $K/work/metrics_pub.json $R/pipeline/work/
cp $K/b3/*.py $K/b3/*.sh $K/b3/*.md $R/pipeline/b3/ 2>/dev/null || true
rm -f $R/pipeline/b3/up.sh.bak
cd $R
git add -A -- assets index.html pipeline PLAYBOOK.md
# secret scan on files, not pipes (grep -q + pipefail = SIGPIPE = silent pass); patterns live in b3/secret_patterns.txt,
# which is excluded from the content scan so the scanner does not flag itself
git diff --cached --name-only > $B/names.txt
git diff --cached -U0 -- . ':(exclude)pipeline/b3/secret_patterns.txt' > $B/diff.txt
M=$(grep -iE 'tok|urls|jobs_|secret|\.private|\.local' $B/names.txt | grep -v 'secret_patterns.txt' || true)
if [ -n "$M" ]; then echo "SECRET-LIKE FILE STAGED: $M"; false; fi
N=$(grep -E '^\+' $B/diff.txt | grep -ciE -f $K/b3/secret_patterns.txt || true)
if [ "${N:-0}" != "0" ]; then echo "SECRET-LIKE CONTENT STAGED ($N lines)"; false; fi
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "v$V: $MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TwtrTNviSUXmZDB6NkZCAw"
trap - ERR INT TERM HUP
git -c push.negotiate=true push -q origin HEAD || { echo "PUSH FAILED - committed locally as v$V, not live"; exit 1; }
for i in $(seq 1 8); do
  got=$(curl -s -m 20 "https://maxsimusai.github.io/gods-anim-lab/index.html?nc=$RANDOM$i" | grep -o '?v=[0-9]*' | head -1 || true)
  [ "$got" = "?v=$V" ] && { echo "published v$V (live): $*"; exit 0; }; sleep 20
done
echo "pushed v$V (committed, do NOT re-run) but the live site still serves $got after ~5 min - check GitHub Pages"; exit 3
