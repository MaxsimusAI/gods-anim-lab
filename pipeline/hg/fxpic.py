# fxpic.py art <god> x0 y0 x1 y1 <out-name> [h=96]  : cut a box (percent of the trimmed accepted art) into assets/hg/new/<out>.webp
# fxpic.py clip <png> x0 y0 x1 y1 <out-name> [h=96] : the same from a matted clip frame (RGBA png from mat/)
# The picture keeps the art's own alpha; edges of the box fade over 6 % so a cut never ends in a straight line.
import sys, numpy as np
from PIL import Image
mode, srcn, x0, y0, x1, y1, out = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:7]), sys.argv[7]
H = int(sys.argv[8]) if len(sys.argv) > 8 else 96
ELL = len(sys.argv) > 9 and sys.argv[9] == 'ell'   # a soft oval mask: a piece of a band of fire or light gets soft round ends instead of cut ones
if mode == 'art':
    a = Image.open(f'src/{srcn}.webp').convert('RGBA'); bb = a.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); a = a.crop(bb)
else:
    a = Image.open(srcn).convert('RGBA')
W0, H0 = a.size; box = (round(x0 / 100 * W0), round(y0 / 100 * H0), round(x1 / 100 * W0), round(y1 / 100 * H0))
c = np.asarray(a.crop(box)).astype(np.float32); h, w = c.shape[:2]
ys = np.linspace(0, 1, h)[:, None]; xs = np.linspace(0, 1, w)[None, :]; f = 0.06
ramp = np.minimum(np.minimum(ys / f, (1 - ys) / f), np.minimum(xs / f, (1 - xs) / f)).clip(0, 1)
c[..., 3] *= ramp
if ELL:
    r2 = ((xs - 0.5) / 0.5) ** 2 + ((ys - 0.5) / 0.5) ** 2; m = np.clip(1 - r2, 0, 1); c[..., 3] *= m * m * (3 - 2 * m)
im = Image.fromarray(c.clip(0, 255).astype(np.uint8), 'RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox(); im = im.crop(bb)
im = im.resize((max(1, round(im.width * H / im.height)), H), Image.LANCZOS)
p = f'/home/claude/gods-anim-lab/assets/hg/new/{out}.webp'; im.save(p, 'WEBP', quality=88, alpha_quality=90); im.save(f'fxcut/{out}.png'); print(out, im.size)
