# floor_fix.py sheet.webp... : remove flat gray floor smoke kept opaque by the matting in the bottom 18 % of each frame
# (unsaturated mid-gray pixels; dark boots and cream trims stay). Re-encodes under the file's own size.
import sys, os, numpy as np, webp
from PIL import Image
for p in sys.argv[1:]:
    im = Image.open(p).convert('RGBA'); A = np.asarray(im).astype(int); H, W = A.shape[:2]; h = H // 5
    rgb = A[..., :3]; sat = rgb.max(-1) - rgb.min(-1); lum = rgb.mean(-1)
    ys = np.arange(H) % h; bottom = (ys >= h * 0.82)[:, None]
    kill = bottom & (sat < 14) & (lum > 105) & (lum < 200) & (A[..., 3] > 0)
    A[..., 3] = np.where(kill, 0, A[..., 3]); img = Image.fromarray(A.astype(np.uint8), 'RGBA'); cap = os.path.getsize(p)
    def enc(q):
        c = webp.WebPConfig.new(quality=q, method=6); pp = c.ptr
        pp.filter_strength = 20; pp.filter_sharpness = 3; pp.sns_strength = 60; pp.alpha_quality = min(95, int(q) + 10); pp.alpha_filtering = 2
        return bytes(webp.WebPPicture.from_pil(img).encode(c).buffer())
    lo, hi, best = 30, 95, None
    while hi - lo > 1:
        m = (lo + hi) // 2
        if len(enc(m)) <= cap: lo, best = m, m
        else: hi = m
    q = best or lo; open(p, 'wb').write(enc(q)); print(os.path.basename(p), 'floor px removed', int(kill.sum()), 'q', q)
