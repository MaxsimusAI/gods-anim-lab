# tone_check.py <art.webp> <sheet.webp>... : frame 0 of each 5x5 sheet against the god's art, both cut to their figure box
# (frame 0 = the Kling input picture = the art). Prints mean lightness L (0-100) and contrast (sd of L) against the art.
# More than +-2 L off the art = PATTERNS check 50 (Kitsune BT 16.11: +5..+6 L before the re-cut, -1..0 after).
import sys, numpy as np, cv2
from PIL import Image
A = Image.open(sys.argv[1]).convert('RGBA')
def bb(im): return im.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
def L(x): return cv2.cvtColor(np.ascontiguousarray(x[..., :3]).astype(np.uint8), cv2.COLOR_RGB2LAB)[..., 0].astype(float) * 100 / 255
for p in sys.argv[2:]:
    S = Image.open(p).convert('RGBA'); f = S.crop((0, 0, S.width // 5, S.height // 5)); fb = bb(f)
    F = np.asarray(f.crop(fb)); a2 = np.asarray(A.crop(bb(A)).resize((fb[2] - fb[0], fb[3] - fb[1]), Image.LANCZOS))
    m = (F[..., 3] > 230) & (a2[..., 3] > 230); lf, la = L(F)[m], L(a2)[m]
    print('%s: mean L %.1f (art %.1f, %+.1f), contrast %.1f (art %.1f, %+.0f %%)' % (p.split('/')[-1], lf.mean(), la.mean(), lf.mean() - la.mean(), lf.std(), la.std(), 100 * (lf.std() / la.std() - 1)))
