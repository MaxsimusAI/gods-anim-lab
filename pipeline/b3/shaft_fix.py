# shaft_fix.py sheet.webp frame(1-25) x0 y0 x1 y1 ref_frame : redraw a thin weapon shaft lost by the matting (motion blur) in one
# frame, as a straight line between two points in that frame's own pixel coords (mob scale; lite scaled by the sheet size);
# colour sampled from the shaft of ref_frame. Only fills pixels that are not already opaque. Re-encodes under the file size.
import sys, os, numpy as np, webp
from PIL import Image
p, f, x0, y0, x1, y1, rf = sys.argv[1], int(sys.argv[2]) - 1, *map(float, sys.argv[3:7]), int(sys.argv[7]) - 1
s = float(sys.argv[8]) if len(sys.argv) > 8 else 1.0
im = Image.open(p).convert('RGBA'); A = np.asarray(im).astype(float); W, H = im.size[0] // 5, im.size[1] // 5
ox, oy = f % 5 * W, f // 5 * H; rx, ry = rf % 5 * W, rf // 5 * H
x0, y0, x1, y1 = x0 * s, y0 * s, x1 * s, y1 * s
R = A[ry:ry + H, rx:rx + W]; dark = (R[..., 3] > 200) & (R[..., :3].mean(-1) < 60)
col = np.median(R[dark][:, :3], axis=0) if dark.any() else np.array([25, 22, 24.])
half = max(1.0, 1.4 * s)
n = 0
for yy in range(int(min(y0, y1)), int(max(y0, y1)) + 1):
    t = (yy - y0) / (y1 - y0) if y1 != y0 else 0; xc = x0 + t * (x1 - x0)
    for xx in range(int(xc - half - 1), int(xc + half + 2)):
        d = abs(xx + 0.5 - xc); a = 255 if d <= half - 0.5 else max(0, 255 * (half + 0.5 - d))
        if a <= 0: continue
        px = A[oy + yy, ox + xx]
        if px[3] >= 230: continue
        na = max(px[3], a); px[:3] = (col * a + px[:3] * px[3] * (1 - a / 255)) / max(1, a + px[3] * (1 - a / 255)); px[3] = na; n += 1
img = Image.fromarray(A.clip(0, 255).astype(np.uint8), 'RGBA'); cap = os.path.getsize(p) * 1.02
def enc(q):
    c = webp.WebPConfig.new(quality=q, method=6); pp = c.ptr; pp.filter_strength = 20; pp.filter_sharpness = 3; pp.sns_strength = 60
    pp.alpha_quality = min(95, q + 10); pp.alpha_filtering = 2; return bytes(webp.WebPPicture.from_pil(img).encode(c).buffer())
lo, hi, best = 30, 95, None
while hi - lo > 1:
    m = (lo + hi) // 2
    if len(enc(m)) <= cap: lo, best = m, m
    else: hi = m
open(p, 'wb').write(enc(best or lo)); print(os.path.basename(p), 'shaft px', n, 'colour', col.round(), 'q', best)
