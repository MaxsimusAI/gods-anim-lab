# sheetview.py out.jpg <god> <bt|ti> <atk|sup|hyp> [f0=0] [f1=24] [scale=0.5] : frames f0..f1 of a published 5x5 sheet in a row (frame index on top)
import sys
from PIL import Image, ImageDraw
out, g, st, sl = sys.argv[1:5]; f0 = int(sys.argv[5]) if len(sys.argv) > 5 else 0; f1 = int(sys.argv[6]) if len(sys.argv) > 6 else 24; S = float(sys.argv[7]) if len(sys.argv) > 7 else .5
sh = Image.open(f'/home/claude/fxwork/assets/sheets/{g}-{st}-{sl}-mob.webp').convert('RGBA'); w, h = sh.width // 5, sh.height // 5
W, H = int(w * S), int(h * S); o = Image.new('RGB', (W * (f1 - f0 + 1), H), (40, 46, 62)); d = ImageDraw.Draw(o)
for i, k in enumerate(range(f0, f1 + 1)):
    fr = sh.crop(((k % 5) * w, (k // 5) * h, (k % 5) * w + w, (k // 5) * h + h)).resize((W, H)); o.paste(fr, (i * W, 0), fr); d.text((i * W + 2, 1), f'f{k}', fill=(255, 255, 0))
o.save(out, quality=82); print(o.size, w, h)
