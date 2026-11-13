#!/bin/bash
# b3/up.sh <key> <ticket>  -> uploads tight/<key>_tight.png, stores the url in tight/urls.json (nothing secret is printed)
k=$1; r=$(curl -sS -F "ticket=$2" -F "file=@/home/claude/kl/tight/${k}_tight.png;type=image/png" https://kling.ai/api/mcp/files)
python3 - "$k" "$r" <<'PY'
import sys,json,re
k,r=sys.argv[1],sys.argv[2]
m=re.search(r'https://[^"\\ ]+kimg/[^"\\ ]+',r)
if not m: print(k,'FAILED',r[:120]); sys.exit(1)
p='/home/claude/kl/tight/urls.json'; u=json.load(open(p)); u[k]=m.group(0); json.dump(u,open(p,'w'),indent=1); print(k,'ok',len(u))
PY
