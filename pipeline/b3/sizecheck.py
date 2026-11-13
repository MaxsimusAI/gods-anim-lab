# sizecheck.py [repo]: every sheet the site manifest (assets/gods-data.js) references must exist and its real size must equal
# sheetW x sheetH (frame w*cols x h*rows). Covers the live arena, the new arenas, the "вчера" (v20) packs and static refs.
# Also checks work/metrics_pub.json against the served files for the redone gods. Exit 1 on any problem.
import json,os,re,sys
from PIL import Image
R=sys.argv[1] if len(sys.argv)>1 else '/home/claude/gods-anim-lab'; K='/home/claude/kl/work'
txt=open(f'{R}/assets/gods-data.js',encoding='utf-8').read()
bad=0; seen=set()
for m in re.finditer(r'"src":"([^"]+)"([^{}]*?)"sheetW":(\d+),"sheetH":(\d+)', txt):
    src=m.group(1).split('?')[0]; W,H=int(m.group(3)),int(m.group(4))
    if (src,W,H) in seen: continue
    seen.add((src,W,H)); f=os.path.join(R,src)
    if not os.path.exists(f): bad+=1; print('MISSING',src); continue
    if Image.open(f).size!=(W,H): bad+=1; print('MISMATCH',src,Image.open(f).size,'declared',(W,H))
n_src=len(seen)
M=json.load(open(f'{K}/metrics_pub.json')); G=set(json.load(open(f'{K}/kling_done.json'))['gods']); n=0
for c,mm in M.items():
    if c.split('_')[0] not in G: continue
    for t in ('mob','lite'):
        e=mm.get(t)
        if not isinstance(e,dict) or 'file' not in e: continue
        f=f"{R}/assets/sheets/{e['file']}"; n+=1
        if not os.path.exists(f): bad+=1; print('MISSING(pub)',c,t); continue
        if Image.open(f).size!=(e['w']*mm.get('cols',5), e['h']*mm.get('rows',5)): bad+=1; print('MISMATCH(pub)',c,t)
print(f'sizecheck: {n_src} manifest sheets + {n} published metrics, {bad} problems'); sys.exit(1 if bad else 0)
