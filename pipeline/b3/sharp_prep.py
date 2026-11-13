# sharp_prep.py src_dir out_dir art.webp|none : step 1 of the sharp cut (Maxim 13.11 21:44 «круто… всё чётко»).
# Full-size video frames -> light NL-means denoise (video grain out, edges kept) -> tone/contrast moved 60 % of the way
# toward the god's art (LAB lightness quantiles + a/b spread), measured on frame 1 (= the input picture). 'none' = no tone step.
import sys, os, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
src, out, art = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
fs = sorted(f for f in os.listdir(src) if f.endswith('.png'))
lut, sat = np.arange(256, dtype=np.float32), [1.0, 1.0]
if art != 'none':
    A = np.array(Image.open(art).convert('RGBA')); am = A[..., 3] > 220
    la = cv2.cvtColor(np.ascontiguousarray(A[..., :3]), cv2.COLOR_RGB2LAB).astype(np.float32)[am]
    f0 = np.array(Image.open(os.path.join(src, fs[0])).convert('RGB'))
    m0 = np.asarray(remove(Image.fromarray(f0), session=new_session('isnet-general-use'), only_mask=True)) > 220
    l0 = cv2.cvtColor(f0, cv2.COLOR_RGB2LAB).astype(np.float32)[m0]
    qs = np.linspace(0.01, 0.99, 50)
    lut = np.interp(np.arange(256), np.quantile(l0[:, 0], qs), np.quantile(la[:, 0], qs))
    lut = 0.6 * lut + 0.4 * np.arange(256)   # 60 % of the way to the art: no hard jumps
    sat = [1 + 0.6 * (float(np.clip(la[:, c].std() / max(l0[:, c].std(), 1e-3), 1.0, 1.25)) - 1) for c in (1, 2)]
    print('lightness 10/50/90 % video', [round(float(np.quantile(l0[:, 0], q))) for q in (.1, .5, .9)],
          'art', [round(float(np.quantile(la[:, 0], q))) for q in (.1, .5, .9)], 'sat', [round(s, 3) for s in sat])
for f in fs:
    im = np.array(Image.open(os.path.join(src, f)).convert('RGB'))
    im = cv2.fastNlMeansDenoisingColored(im, None, 3, 3, 5, 15)
    L = cv2.cvtColor(im, cv2.COLOR_RGB2LAB).astype(np.float32)
    L[..., 0] = lut[np.clip(L[..., 0], 0, 255).astype(np.uint8)]
    for i, c in enumerate((1, 2)):
        L[..., c] = 128 + (L[..., c] - 128) * sat[i]
    Image.fromarray(cv2.cvtColor(np.clip(L, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)).save(os.path.join(out, f))
print('frames', len(fs))
