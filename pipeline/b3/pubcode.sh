#!/bin/bash
# pubcode.sh "<message>" : publish a reviewed CODE / notes / records change (no new sheets) with a ?v= bump, so phones fetch
# the new code. Rebuilds the manifest (stand notes), sizecheck, syntax check, secret scan, commit of known paths, push, waits
# for the live ?v=. On failure before the commit it restores kling_done.json and leaves the working tree for a fix.
set -eo pipefail
exec 9>/tmp/gods-pub.lock; flock 9
MSG="$1"; K=/home/claude/kl; R=/home/claude/gods-anim-lab
[ -n "$MSG" ] || { echo 'usage: pubcode.sh "msg"'; exit 1; }
B=$(mktemp -d); cp $K/work/kling_done.json $B/
restore() { trap - ERR INT TERM HUP; cp $B/kling_done.json $K/work/; git -C $R reset -q 2>/dev/null || true
            git -C $R checkout -q -- index.html assets/gods-data.js 2>/dev/null || true
            echo "FAILED - kling_done restored, index.html/manifest reset, code edits kept, nothing published"; exit 1; }
trap restore ERR INT TERM HUP
V=$(python3 - <<PY
import json,re; p='$K/work/kling_done.json'; d=json.load(open(p))
cur=[int(x) for x in re.findall(r'\?v=(\d+)', open('$R/index.html').read())] or [0]
d['ver']=max(int(d['ver']), max(cur))+1
json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1); print(d['ver'])
PY
)
cd $K && KL_HERE=$K/work KL_REPO=$R python3 tools/build_full_manifest.py | tail -1
python3 $K/b3/sizecheck.py $R
sed -i -E "s/\?v=[0-9]+/?v=$V/g" $R/index.html
for f in app.js assets/sim-core.js assets/fx2-stand.js assets/gods-data.js; do node -e "new Function(require('fs').readFileSync('$R/$f','utf8'))"; done
cp $K/work/kling_done.json $R/pipeline/work/
cp $K/b3/*.py $K/b3/*.sh $K/b3/*.md $R/pipeline/b3/ 2>/dev/null || true
cd $R
git add -A -- assets index.html app.js styles.css pipeline LOG.md STATE.md PATTERNS.md TOOLS.md cards remarks_ru.md
git diff --cached --name-only > $B/names.txt
git diff --cached -U0 -- . ':(exclude)pipeline/b3/secret_patterns.txt' > $B/diff.txt
M=$(grep -iE 'tok|urls|jobs_|secret|\.private|\.local' $B/names.txt | grep -v 'secret_patterns.txt' || true)
if [ -n "$M" ]; then echo "SECRET-LIKE FILE STAGED: $M"; false; fi
N=$(grep -E '^\+' $B/diff.txt | grep -ciE -f $K/b3/secret_patterns.txt || true)
if [ "${N:-0}" != "0" ]; then echo "SECRET-LIKE CONTENT STAGED ($N lines)"; false; fi
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "v$V: $MSG

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01TwtrTRNgCDDxeMteWxvwoZ"
trap - ERR INT TERM HUP
git -c push.negotiate=true push -q origin HEAD || { echo "PUSH FAILED - committed locally as v$V, not live"; exit 1; }
for i in $(seq 1 8); do
  got=$(curl -s -m 20 "https://maxsimusai.github.io/gods-anim-lab/index.html?nc=$RANDOM$i" | grep -o '?v=[0-9]*' | head -1 || true)
  [ "$got" = "?v=$V" ] && { echo "published v$V (live)"; exit 0; }; sleep 20
done
echo "pushed v$V (committed, do NOT re-run) but the live site still serves $got after ~5 min - check GitHub Pages"; exit 3
