# edges.py clip... : how much of each frame edge (4 px band) is covered by non-background pixels, per frame.
# prints: clip L/R/T = max coverage % and number of frames above 3 % (frame 0 = art baseline shown too)
import sys, subprocess, numpy as np
def load(c):
    pr=subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',f'b2/mp4/{c}.mp4'],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(pr[0]),int(pr[1])
    p=subprocess.run(['ffmpeg','-v','error','-i',f'b2/mp4/{c}.mp4','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    return np.frombuffer(p,np.uint8).reshape(-1,h,w,3).astype(np.int16)
for c in sys.argv[1:]:
    a=load(c); bg=np.median(a[0,:8,:8].reshape(-1,3),axis=0)
    fg=(np.abs(a-bg).sum(-1)>40)
    L=fg[:,:,:4].mean(axis=(1,2))*100; R=fg[:,:,-4:].mean(axis=(1,2))*100; T=fg[:,:4,:].mean(axis=(1,2))*100
    def s(v): return f"max {v.max():5.1f} (f{int(v.argmax()):02d}) base {v[0]:4.1f} n>{v[0]+3:4.1f}: {int((v>v[0]+3).sum()):2d}"
    print(f"{c:18s} L {s(L)} | R {s(R)} | T {s(T)}")
