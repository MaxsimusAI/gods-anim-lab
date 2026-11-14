# solid_fix.py <clip> <bg gray after the tone step, e.g. 164> [--src published|work] : repair of light body parts that the
# matting left see-through (Maxim 14.11, Kitsune BT: «Проблем с хвостом… как будто сильно порезали и он стал
# полупрозрачным»). Works on the SHEET (the source video of that take is not kept): a pixel that is inside the figure
# (2 px away from the outline), partly transparent, and whose ORIGINAL video colour (alpha*c + (1-alpha)*bg) is clearly
# lighter than the background and not strongly coloured (white fur, not fire) becomes solid with its original colour.
# The same 25 moments, nothing else changes. Writes mob+lite into the workspace sheets folder and the new KB into
# adapted_all_metrics.json (entry copied from metrics_pub.json). Prints the share of white pixels that were see-through.
import sys, os, json, numpy as np, webp
from PIL import Image
from scipy import ndimage as ni
clip, bg = sys.argv[1], float(sys.argv[2]); K = '/home/claude/kl'; R = '/home/claude/gods-anim-lab'
s = clip.replace('_', '-'); W = K + '/work/gods-anim-lab-repo/assets/sheets/'
def enc(img, q, path):
    cfg = webp.WebPConfig.new(quality=q, method=6); p = cfg.ptr
    p.filter_strength = 20; p.filter_sharpness = 3; p.sns_strength = 60; p.alpha_quality = min(95, int(q) + 10); p.alpha_filtering = 2
    open(path, 'wb').write(bytes(webp.WebPPicture.from_pil(img).encode(cfg).buffer())); return os.path.getsize(path)
out = {}
for t, er in (('mob', 2), ('lite', 1)):
    src = f'{R}/assets/sheets/{s}-{t}.webp'; im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
    al = im[..., 3] / 255.0; c = im[..., :3]
    orig = al[..., None] * c + (1 - al[..., None]) * bg
    sat = orig.max(-1) - orig.min(-1)
    light = ((orig.max(-1) > bg + 12) & (sat < 60)) | ((orig.max(-1) > bg - 25) & (sat < 45) & (al > 0.12))   # shaded fur has the colour of the background: taken when it is at least 30 % solid
    inside = ni.binary_erosion(al > 0.1, iterations=er + 1)
    fh, fw = im.shape[0] // 5, im.shape[1] // 5        # never bridge two frames of the sheet
    grid = np.ones(al.shape, bool); grid[::fh, :] = False; grid[:, ::fw] = False
    cand = inside & light & (al < 0.97) & grid
    # only fur that belongs to the figure: connected to a solid light area
    solidl = (al >= 0.97) & (orig.max(-1) > bg + 12) & (sat < 60); lab, n = ni.label(cand | solidl); keep = np.zeros(n + 1, bool); keep[np.unique(lab[solidl])] = True; keep[0] = False
    cand &= keep[lab] | ((orig.max(-1) > bg + 12) & (sat < 60) & (al > 0.25))   # clearly light fur needs no solid neighbour (lower tails)
    o = im.copy(); o[..., :3] = np.where(cand[..., None], orig, c); o[..., 3] = np.where(cand, 255, im[..., 3])
    img = Image.fromarray(np.clip(o, 0, 255).astype(np.uint8), 'RGBA')
    cap = os.path.getsize(src) * 1.04; lo, hi, best = 40, 95, None
    while hi - lo > 1:
        m = (lo + hi) // 2
        if enc(img, m, W + f'{s}-{t}.webp') <= cap: lo, best = m, m
        else: hi = m
    kb = enc(img, best or lo, W + f'{s}-{t}.webp') / 1024
    wl = (orig.min(-1) > 170) & (al > 0.2)
    out[t] = round(kb, 1); print(t, 'fixed px', int(cand.sum()), 'see-through share of light px: before %.2f after %.2f' % (float((al[wl] < 0.8).mean()), float(((o[..., 3] / 255.0)[wl] < 0.8).mean())), 'q', best or lo, 'kb', round(kb, 1))
P = json.load(open(K + '/work/metrics_pub.json')); A = json.load(open(K + '/work/adapted_all_metrics.json'))
e = json.loads(json.dumps(P[clip])); e['mob']['kb'] = out['mob']; e['lite']['kb'] = out['lite']; e['v'] = 21
e['prep'] = (e.get('prep') or '') + ' + solid_fix 14.11 (see-through white fur made solid)'
A[clip] = e; json.dump(A, open(K + '/work/adapted_all_metrics.json', 'w'), indent=1)
