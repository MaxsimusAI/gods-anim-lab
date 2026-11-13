# real unused margins of every sheet: python3 margins2.py [god...]  (union of alpha over the 25 frames)
import sys, json, numpy as np
from PIL import Image
M=json.load(open('/home/claude/kl/work/adapted_all_metrics.json')); gods=sys.argv[1:]
tot=0; un=0; rows=[]
for c,m in sorted(M.items()):
    if gods and c.split('_')[0] not in gods: continue
    try: im=np.array(Image.open('/home/claude/kl/work/gods-anim-lab-repo/assets/sheets/'+m['mob']['file']).convert('RGBA'))[...,3]
    except Exception as e: continue
    w,h=m['mob']['w'],m['mob']['h']
    if im.shape[0]<5*h or im.shape[1]<5*w: rows.append((c,'SIZE?',im.shape,w,h)); continue
    u=np.zeros((h,w),bool)
    for r in range(5):
        for q in range(5): u|=im[r*h:(r+1)*h,q*w:(q+1)*w]>24
    ys=np.where(u.any(1))[0]; xs=np.where(u.any(0))[0]
    l,rg,t,b=xs[0],w-1-xs[-1],ys[0],h-1-ys[-1]
    used=(xs[-1]-xs[0]+1)*(ys[-1]-ys[0]+1); tot+=w*h; un+=w*h-used
    # also: share of pixels inside the bbox never touched (empty corners)
    never=1-u[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1].mean()
    rows.append((c,w,h,'L%d R%d T%d B%d'%(l,rg,t,b),'unused %.1f%%'%(100*(w*h-used)/(w*h)),'never-touched inside %.0f%%'%(100*never)))
for r in rows:
    if r[1]=='SIZE?' or any(int(x[1:])>3 for x in r[3].split()): print(*r)
print('sheets',len(rows),'total unused by bbox %.2f%%'%(100*un/max(1,tot)))
