# Cut a slash arc from a matted clip frame by its colour and recolour it: python3 arckey.py png x0 y0 x1 y1 out_prefix
import sys, numpy as np
from PIL import Image, ImageFilter
src, x0, y0, x1, y1, pre = sys.argv[1], *map(float, sys.argv[2:6]), sys.argv[6]
im = Image.open(src).convert('RGBA'); W, H = im.size
im = im.crop((int(x0 / 100 * W), int(y0 / 100 * H), int(x1 / 100 * W), int(y1 / 100 * H)))
a = np.array(im).astype(float); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3] / 255
key = np.clip(((r - g) - 90) / 90, 0, 1) * np.clip((b - g + 20) / 80, 0, 1) * np.clip((r - 90) / 120, 0, 1)     # bright magenta of the arc
m = Image.fromarray((key * al * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
mk = np.array(m).astype(float) / 255
h, w = mk.shape; yy, xx = np.mgrid[0:h, 0:w]; e = 0.05
fade = np.clip(np.minimum.reduce([xx / (e * w), (w - 1 - xx) / (e * w), yy / (e * h), (h - 1 - yy) / (e * h)]), 0, 1)
mk = mk * fade * np.clip((a[..., :3].mean(axis=2) - 55) / 50, 0, 1)
tgt_h = 110; s = tgt_h / h
def save(rgb, name):
    o = np.dstack([rgb, mk * 255]).astype(np.uint8)
    O = Image.fromarray(o).resize((max(1, int(w * s)), tgt_h), Image.LANCZOS)
    bb = O.getbbox(); O = O.crop(bb) if bb else O
    O.save(f'/home/claude/gods-anim-lab/assets/hg/new/{name}.webp', quality=88, method=6); O.save(f'fxcut/{name}.png'); print(name, O.size)
rgb = a[..., :3]
save(rgb, pre + '1')                                              # pink, as in the clip
lum = rgb.mean(axis=2, keepdims=True)
save(np.clip(np.concatenate([lum * 0.30 + 28, lum * 0.16 + 14, lum * 0.42 + 40], 2) * (1 - 0.0), 0, 255), pre + '2')   # black slash with a faint violet sheen
save(np.clip(255 - (255 - np.repeat(lum, 3, 2)) * 0.25, 0, 255), pre + '3')     # white slash
