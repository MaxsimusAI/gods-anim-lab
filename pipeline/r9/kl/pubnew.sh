#!/bin/bash
# pubnew.sh "<msg>" clip... : notes from the stage-1 review (Russian line) + status new, then pub1
K=/home/claude/kl; MSG="$1"; shift
python3 - "$@" <<'PY'
import json,sys,subprocess
V=json.load(open('/home/claude/kl/r9/review/stage1_all.json')); a=[]
X=json.load(open('/home/claude/kl/r9/review/extra_ru.json')) if __import__('os').path.exists('/home/claude/kl/r9/review/extra_ru.json') else {}
for c in sys.argv[1:]:
    ru=X.get(c) or (V.get(c) or {}).get('ru') or 'новый дубль.'
    a+=[c,'новый дубль (ждёт вашего взгляда): '+ru.strip()]
subprocess.run(['python3','/home/claude/kl/r9/note.py','new']+a,check=True)
PY
bash $K/b3/pub1.sh "$MSG" "$@" 2>&1 | tail -1 | cut -c1-400
