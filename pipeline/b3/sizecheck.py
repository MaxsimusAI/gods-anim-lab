# sizecheck.py: every sheet the site manifest declares must match the real file (frame w*cols x h*rows). Exit 1 on mismatch.
import json,os,sys
from PIL import Image
R=sys.argv[1] if len(sys.argv)>1 else '/home/claude/gods-anim-lab'; K='/home/claude/kl/work'
M=json.load(open(f'{K}/metrics_pub.json')); bad=0; n=0
G=set(json.load(open(f'{K}/kling_done.json'))['gods'])  # gods whose new sheets the stand shows
for c,m in M.items():
    if c.split('_')[0] not in G: continue
    for t in ('mob','lite'):
        e=m.get(t)
        if not isinstance(e,dict) or 'file' not in e: continue
        f=f"{R}/assets/sheets/{e['file']}"
        if not os.path.exists(f): continue
        n+=1; W,H=Image.open(f).size; cw,rh=e['w']*m.get('cols',5), e['h']*m.get('rows',5)
        if (W,H)!=(cw,rh): bad+=1; print('MISMATCH',c,t,(W,H),'declared',(cw,rh))
print(f'sizecheck: {n} sheets, {bad} mismatches'); sys.exit(1 if bad else 0)
