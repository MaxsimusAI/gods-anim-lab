# sharp_prep.py src_dir out_dir art.webp|none : step 1 of the sharp cut (Maxim 13.11 21:44 «круто… всё чётко»).
# Full-size video frames -> light NL-means denoise (video grain out, edges kept) -> tone/contrast moved 60 % of the way
# toward the god's art (LAB lightness quantiles + a/b spread), measured on frame 1 (= the input picture). 'none' = no tone step.
import sys, os, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
src, out, art = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
need = set(int(x) for x in sys.argv[4].split(',')) if len(sys.argv) > 4 else None   # only these frames are used by the cut: the rest is copied as is (3x faster)
fs = sorted(f for f in os.listdir(src) if f.endswith('.png'))
lut, sat = np.arange(256, dtype=np.float32), [1.0, 1.0]
if art != 'none' and os.environ.get('KL_TONE') == 'aligned':
    # 16.11 (Kitsune BT, Maxim «слишком высветлена»): the quantile match below compares the whole art with the part of the
    # video figure the mask model keeps. White tails that the mask drops make the video look darker than it is, and the LUT
    # lifted every mid tone (Kitsune: video median 53 -> 73, the robe went milky). Here the art is registered onto video
    # frame 1 (it IS the tight input picture: SIFT + similarity transform) and the curve is fitted pixel to pixel; the 60 %
    # rule is kept. For Kitsune the fitted curve is the identity within 4 levels: her video already has the art's tone.
    A0 = np.array(Image.open(os.environ.get('KL_TONE_ART', art)).convert('RGBA'))
    f0 = np.array(Image.open(os.path.join(src, fs[0])).convert('RGB'))
    Ab = A0.copy(); Ab[..., :3] = (A0[..., :3] * (A0[..., 3:4] / 255.0) + 124 * (1 - A0[..., 3:4] / 255.0)).astype(np.uint8)
    sift = cv2.SIFT_create(4000)
    k1, d1 = sift.detectAndCompute(cv2.cvtColor(f0, cv2.COLOR_RGB2GRAY), None)
    k2, d2 = sift.detectAndCompute(cv2.cvtColor(np.ascontiguousarray(Ab[..., :3]), cv2.COLOR_RGB2GRAY), None)
    good = [x for x, y in cv2.BFMatcher().knnMatch(d2, d1, k=2) if x.distance < 0.7 * y.distance]
    Mx, inl = cv2.estimateAffinePartial2D(np.float32([k2[x.queryIdx].pt for x in good]), np.float32([k1[x.trainIdx].pt for x in good]), ransacReprojThreshold=3)
    if Mx is None or int(inl.sum()) < 60: raise SystemExit('tone aligned: art does not register onto frame 1 (%d inliers)' % (0 if inl is None else int(inl.sum())))
    aw = cv2.warpAffine(A0, Mx, (f0.shape[1], f0.shape[0]), flags=cv2.INTER_AREA, borderValue=(0, 0, 0, 0))
    from scipy import ndimage as _ni
    m0 = np.asarray(remove(Image.fromarray(f0), session=new_session('isnet-general-use'), only_mask=True)) > 200
    M = _ni.binary_erosion((aw[..., 3] > 240) & m0, iterations=3)
    lv = cv2.GaussianBlur(cv2.cvtColor(f0, cv2.COLOR_RGB2LAB).astype(np.float32), (5, 5), 0)
    la = cv2.GaussianBlur(cv2.cvtColor(np.ascontiguousarray(aw[..., :3]), cv2.COLOR_RGB2LAB).astype(np.float32), (5, 5), 0)
    x, y = lv[..., 0][M], la[..., 0][M]; cv, ca = [], []
    for b0 in range(0, 256, 6):
        sel = (x >= b0) & (x < b0 + 6)
        if sel.sum() > 300: cv.append(float(np.median(x[sel]))); ca.append(float(np.median(y[sel])))
    lut = np.interp(np.arange(256), [0.0] + cv + [255.0], [0.0] + list(np.maximum.accumulate(ca)) + [255.0])
    lut = 0.6 * lut + 0.4 * np.arange(256)
    sat = [1 + 0.6 * (float(np.clip(la[..., c][M].std() / max(lv[..., c][M].std(), 1e-3), 1.0, 1.25)) - 1) for c in (1, 2)]
    print('tone aligned: inliers', int(inl.sum()), 'px', int(M.sum()), 'corr %.3f' % float(np.corrcoef(x, y)[0, 1]),
          'curve 40/80/124/170/210 ->', [round(float(lut[i])) for i in (40, 80, 124, 170, 210)], 'sat', [round(s_, 3) for s_ in sat])
elif art != 'none':
    A = np.array(Image.open(art).convert('RGBA')); am = A[..., 3] > 220
    la = cv2.cvtColor(np.ascontiguousarray(A[..., :3]), cv2.COLOR_RGB2LAB).astype(np.float32)[am]
    f0 = np.array(Image.open(os.path.join(src, fs[0])).convert('RGB'))
    m0 = np.asarray(remove(Image.fromarray(f0), session=new_session('isnet-general-use'), only_mask=True)) > 220
    l0 = cv2.cvtColor(f0, cv2.COLOR_RGB2LAB).astype(np.float32)[m0]
    qs = np.linspace(0.01, 0.99, 50)
    # anchors 0->0 and 255->255: without them everything brighter than the body's own 99 % (white-hot flash cores, lightning)
    # was clamped to the art's 99 % lightness and came out flat dull gray (found on Blackbeard's shots, 14.11)
    qv = np.maximum.accumulate(np.concatenate([[0.0], np.quantile(l0[:, 0], qs), [255.0]]) + np.arange(52) * 1e-3)
    lut = np.interp(np.arange(256), qv, np.concatenate([[0.0], np.quantile(la[:, 0], qs), [255.0]]))
    lut = 0.6 * lut + 0.4 * np.arange(256)   # 60 % of the way to the art: no hard jumps
    sat = [1 + 0.6 * (float(np.clip(la[:, c].std() / max(l0[:, c].std(), 1e-3), 1.0, 1.25)) - 1) for c in (1, 2)]
    print('lightness 10/50/90 % video', [round(float(np.quantile(l0[:, 0], q))) for q in (.1, .5, .9)],
          'art', [round(float(np.quantile(la[:, 0], q))) for q in (.1, .5, .9)], 'sat', [round(s, 3) for s in sat])
for i_f, f in enumerate(fs):
    if need is not None and i_f not in need:
        os.link(os.path.join(src, f), os.path.join(out, f)); continue
    im = np.array(Image.open(os.path.join(src, f)).convert('RGB'))
    im = cv2.fastNlMeansDenoisingColored(im, None, 3, 3, 5, 15)
    L = cv2.cvtColor(im, cv2.COLOR_RGB2LAB).astype(np.float32)
    L[..., 0] = lut[np.clip(L[..., 0], 0, 255).astype(np.uint8)]
    for i, c in enumerate((1, 2)):
        L[..., c] = 128 + (L[..., c] - 128) * sat[i]
    Image.fromarray(cv2.cvtColor(np.clip(L, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)).save(os.path.join(out, f))
print('frames', len(fs))
