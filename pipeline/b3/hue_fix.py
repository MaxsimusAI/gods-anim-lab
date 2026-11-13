# hue_fix.py ref.webp target.webp cap_kb : rotate the hue of the cyan..blue effect pixels of target to the ref's, re-encode
# with the sharp-cut WebP settings under cap_kb (used for Kitsune BT super: the 12.11 video was teal, the accepted sheet sky blue)
import sys, os, numpy as np, webp
from PIL import Image
def hsv(p):
    im = Image.open(p).convert('RGBA'); return np.asarray(im), np.asarray(im.convert('RGB').convert('HSV')).astype(int)
def fx_hue(a, h):
    m = (a[..., 3] > 80) & (h[..., 1] > 110) & (h[..., 2] > 150) & (h[..., 0] > 100) & (h[..., 0] < 190); return np.median(h[..., 0][m])
ra, rh = hsv(sys.argv[1]); a, h = hsv(sys.argv[2]); cap = float(sys.argv[3]) * 1024
d = int(round(fx_hue(ra, rh) - fx_hue(a, h)))
band = (a[..., 3] > 0) & (h[..., 1] > 60) & (h[..., 0] > 95) & (h[..., 0] < 195)
h2 = h.copy(); h2[..., 0] = np.where(band, (h[..., 0] + d) % 256, h[..., 0])
img = Image.fromarray(np.dstack([np.asarray(Image.fromarray(h2.astype(np.uint8), 'HSV').convert('RGB')), a[..., 3]]), 'RGBA')
def enc(q):
    c = webp.WebPConfig.new(quality=q, method=6); p = c.ptr
    p.filter_strength = 20; p.filter_sharpness = 3; p.sns_strength = 60; p.alpha_quality = min(95, int(q) + 10); p.alpha_filtering = 2
    return bytes(webp.WebPPicture.from_pil(img).encode(c).buffer())
lo, hi, best = 30, 92, None
while hi - lo > 1:
    m = (lo + hi) // 2
    if len(enc(m)) <= cap: lo, best = m, m
    else: hi = m
q = best or lo; open(sys.argv[2], 'wb').write(enc(q)); print(os.path.basename(sys.argv[2]), 'hue shift', d, 'q', q, round(os.path.getsize(sys.argv[2]) / 1024, 1), 'KB')
