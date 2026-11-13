# light version of edges.py (scaled to 360 wide)
import sys, subprocess, numpy as np
W=360
for c in sys.argv[1:]:
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',f'b2/mp4/{c}.mp4'],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1]); H=int(round(h*W/w/2))*2
    p=subprocess.run(['ffmpeg','-v','error','-i',f'b2/mp4/{c}.mp4','-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    a=np.frombuffer(p,np.uint8).reshape(-1,H,W,3)
    bg=np.median(a[0,:6,:6].reshape(-1,3),axis=0).astype(np.int16)
    def cov(sl): x=a[sl].astype(np.int16); return ((np.abs(x-bg).sum(-1)>40).mean(axis=(1,2))*100)
    L=cov((slice(None),slice(None),slice(0,2))); R=cov((slice(None),slice(None),slice(W-2,W))); T=cov((slice(None),slice(0,2),slice(None)))
    f=lambda v:f"{v.max():5.1f} n{int((v>v[0]+3).sum()):2d}"
    print(f"{c:22s} L {f(L)} | R {f(R)} | T {f(T)}",flush=True)
