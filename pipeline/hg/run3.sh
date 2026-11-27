#!/bin/bash
# usage: run3.sh tag god...   cuts each goddess with matte v3 from the clips her v5 sheets use
cd /home/claude/hgk; tag=$1; shift
for g in "$@"; do
  arg=$(python3 -c "import json;m=json.load(open('v5/$g.json'));print(','.join(f'{s}={m[s][\"clip\"]}' for s in ('idle','app','atk')))")
  python3 hgcut3.py $g $arg > cut3_$g.log 2>&1 && echo $g >> run3_$tag.progress || echo "$g FAIL" >> run3_$tag.progress
done
echo DONE >> run3_$tag.progress
