# unused margin of every sheet: union bbox of visible pixels over the 25 frames vs the frame size
import sys, json
import numpy as np
from PIL import Image
M=json.load(open('/home/claude/kl/work/adapted_all_metrics.json')); D='/home/claude/gods-anim-lab/assets/sheets/'
tot0=tot1=0; rows=[]
for c in sorted(M):
    if sys.argv[1:] and not any(c.startswith(g) for g in sys.argv[1:]): continue
    m=M[c]['mob']; w,h=m['w'],m['h']
    try: a=np.array(Image.open(D+m['file']).convert('RGBA'))[...,3]
    except Exception: continue
    u=np.zeros((h,w),bool)
    for r in range(5):
        for q in range(5): u|=a[r*h:(r+1)*h,q*w:(q+1)*w]>24
    ys,xs=np.where(u); x0,x1,y0,y1=xs.min(),xs.max()+1,ys.min(),ys.max()+1
    tot0+=w*h; tot1+=(x1-x0)*(y1-y0)
    rows.append((c,w,h,x0,w-x1,y0,h-y1,round(100*(1-(x1-x0)*(y1-y0)/(w*h)))))
for r in rows:
    if r[-1]>=4: print('%-22s %3dx%3d  empty L%2d R%2d T%2d B%2d  -> %2d%% unused'%r)
print('clips',len(rows),'total unused %.1f%%'%(100*(1-tot1/tot0)))
