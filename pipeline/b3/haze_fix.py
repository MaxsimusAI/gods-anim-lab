# haze_fix.py sheet.webp [more...] : remove the matting haze (semi-transparent background kept around baked effects, tinted
# pink/gray by the despill) - pixels with alpha < 110, far (> 4 px) from the solid figure and NOT effect-coloured (the god's
# effect colour dominant channel given by --fx g|b|r, default g) get alpha 0. Re-encodes with the sharp-cut WebP settings
# under the file's own size (removing haze only shrinks it). Prints the share of pixels removed.
import sys, os, numpy as np, webp
from PIL import Image, ImageFilter
args = [a for a in sys.argv[1:] if not a.startswith('--')]; fx = 'g'; amax = 110; gmin = 15; white = False
for a in sys.argv[1:]:
    if a.startswith('--fx='): fx = a[5:]
    if a.startswith('--amax='): amax = int(a[7:])      # stronger pass for a denser slab (e.g. 170)
    if a.startswith('--gmin='): gmin = int(a[7:])      # how much the effect channel must dominate to count as effect
    if a == '--white': white = True                   # tint the white-hot core of the effect to the effect colour
ci = 'rgb'.index(fx)
for p in args:
    im = Image.open(p).convert('RGBA'); A = np.asarray(im).astype(int); a = A[..., 3]
    solid = Image.fromarray(((a > 160) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))
    near = np.asarray(solid) > 0
    rgb = A[..., :3]; other = np.delete(rgb, ci, axis=2).max(-1)
    effect = rgb[..., ci] > other + gmin
    pink = (rgb[..., 0] > rgb[..., 1] + 20) & (rgb[..., 2] > rgb[..., 1] + 20)   # despill tint of the gray background
    kill = ((a > 0) & (a < amax) & ~near & ~effect) | ((a > 0) & (a < 90) & pink & ~effect)
    A2 = A.copy(); A2[..., 3] = np.where(kill, 0, a)
    if white:   # near-white pixels next to strong effect colour -> pale effect colour (no white flicker); hair is not next to it
        strong = Image.fromarray(((rgb[..., ci] > other + 40) & (a > 80)).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(13))
        wm = (rgb.min(-1) > 215) & (np.asarray(strong) > 0) & (a > 0)
        tint = np.array([150, 150, 150]); tint[ci] = 255
        A2[..., :3] = np.where(wm[..., None], (rgb * 0.35 + tint * 0.65).astype(int), A2[..., :3])
        print('  white px tinted:', int(wm.sum()))
    img = Image.fromarray(A2.astype(np.uint8), 'RGBA'); cap = os.path.getsize(p)
    def enc(q):
        c = webp.WebPConfig.new(quality=q, method=6); pp = c.ptr
        pp.filter_strength = 20; pp.filter_sharpness = 3; pp.sns_strength = 60; pp.alpha_quality = min(95, int(q) + 10); pp.alpha_filtering = 2
        return bytes(webp.WebPPicture.from_pil(img).encode(c).buffer())
    lo, hi, best = 30, 95, None
    while hi - lo > 1:
        m = (lo + hi) // 2
        if len(enc(m)) <= cap: lo, best = m, m
        else: hi = m
    q = best or lo; open(p, 'wb').write(enc(q))
    print(os.path.basename(p), 'removed', round(100 * kill.sum() / max(1, (a > 0).sum()), 1), '% of visible px; q', q, round(os.path.getsize(p) / 1024, 1), 'KB')
