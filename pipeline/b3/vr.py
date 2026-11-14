# vr.py out.jpg video.mp4 i0 i1 [H=300] : every video frame i0..i1 side by side with numbers (to find the release frame)
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw
out, p, i0, i1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]); H = int(sys.argv[5]) if len(sys.argv) > 5 else 300
w, h = map(int, subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip().split(',')[:2])
W = int(round(w * H / h / 2)) * 2
raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
a = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3); idx = list(range(i0, min(i1, len(a) - 1) + 1))
per = (len(idx) + 1) // 2; o = Image.new('RGB', (per * (W + 3), 2 * (H + 3)), (20, 20, 20)); d = ImageDraw.Draw(o)
for k, i in enumerate(idx):
    x, y = (k % per) * (W + 3), (k // per) * (H + 3); o.paste(Image.fromarray(a[i]), (x, y)); d.text((x + 3, y + 3), str(i), fill=(255, 255, 0))
o.save(out, quality=85); print(out, o.size)
