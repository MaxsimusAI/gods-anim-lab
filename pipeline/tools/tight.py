# tight Kling input canvas: python3 tight.py src.png out.png [side=0.14] [top=0.07] [bottom=0.03]
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
side = float(sys.argv[3]) if len(sys.argv) > 3 else 0.14
top = float(sys.argv[4]) if len(sys.argv) > 4 else 0.07
bot = float(sys.argv[5]) if len(sys.argv) > 5 else 0.03
im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox())
W = 1080; fw = round(W * (1 - 2 * side)); fh = round(im.height * fw / im.width)
im = im.resize((fw, fh), Image.LANCZOS)
H = round(fh / (1 - top - bot)); H += H % 2
bg = Image.new('RGB', (W, H), (127, 127, 127)); bg.paste(im, ((W - fw) // 2, H - round(H * bot) - fh), im)
bg.save(out); print(out, bg.size, 'figure', fw, fh)
