# vs.py out.jpg video.mp4 [n=16] [H=300] : n evenly spaced frames of a video in 2 rows with frame numbers (first look at a new take)
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw
out, p = sys.argv[1:3]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 16; H = int(sys.argv[4]) if len(sys.argv) > 4 else 300
w, h = map(int, subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')[:2])
W = int(round(w * H / h / 2)) * 2
raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
a = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3); idx = np.linspace(0, len(a) - 1, n).round().astype(int)
per = (n + 1) // 2; o = Image.new('RGB', (per * (W + 3), 2 * (H + 3)), (20, 20, 20)); d = ImageDraw.Draw(o)
for k, i in enumerate(idx):
    x, y = (k % per) * (W + 3), (k // per) * (H + 3); o.paste(Image.fromarray(a[i]), (x, y)); d.text((x + 3, y + 3), str(i), fill=(255, 255, 0))
o.save(out, quality=85); print(out, o.size, len(a), 'frames')
