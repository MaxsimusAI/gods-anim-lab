#!/usr/bin/env python3
"""sheet_motion.py — how much the BODY moves in a 5x5 sheet (25 frames), in % of the figure height.

    sheet_motion.py <slot: idle|atk|sup|hyp> sheet.webp [--ref old_sheet.webp]

feet / hips / chest / head : largest sideways shift of that body band against frame 0
sink                       : largest drop of the head-and-shoulders mass (crouch, kneel)
sil                        : largest share of silhouette pixels that changed against frame 0
still                      : frames that are practically the same as the frame before
jerk                       : largest frame-to-frame change divided by the median one

Verdicts. Tested on the sheets Maxim judged on 13.11: flags 4 of the 5 clips he called static (Kitsune BT atk/hyp, TI hyp;
Athena BT atk only against --ref) and passes the 4 he liked; MISSES Zeus TI atk (the arm with the lightning crosses the body
bands) and flags 2 clips he accepted (Agni TI sup, Inti TI sup). A flag is a reason to act; a pass proves nothing — the
reviewer's question "do the legs act?" decides.
  action  BODY STILL  feet < 2 and hips < 5, or feet+hips+sink below half of the reference take (--ref)
  idle    FROZEN      sil < 22 or more than 2 still frames;   LEGS DEAD  feet < 2 and hips < 2
  any     JERK?       jerk > 3  (look at all 25 frames and at the stand at game speed)
A flagged clip is retaken, or the reason why this god stands still is written into the card and told to Maxim.
Known limit: a bright effect in front of a limb can be counted as motion (Athena's glowing spear) — look at the frames.
"""
import sys
import numpy as np
from PIL import Image

def frames(path):
    im = Image.open(path).convert('RGBA'); W, H = im.size; w, h = W // 5, H // 5
    a = np.asarray(im).astype(np.int16); out = []
    for i in range(25):
        f = a[(i // 5) * h:(i // 5 + 1) * h, (i % 5) * w:(i % 5 + 1) * w]
        rgb, al = f[..., :3], f[..., 3]
        sat = rgb.max(-1) - rgb.min(-1); val = rgb.max(-1)
        glow = (val > 200) & (sat > 90) & ((rgb[..., 2] > rgb[..., 0] + 30) | (rgb[..., 0] > rgb[..., 2] + 60))
        out.append((al > 60) & ~glow)
    return out, w, h

def band(m, top, fh, lo, hi):
    r = m[int(top + lo * fh):int(top + hi * fh) + 1]
    xs = np.nonzero(r.sum(0) > 1)[0]
    if len(xs) < 3: return None
    return xs[0], xs[-1], np.nonzero(r)[1].mean()

def measure(path):
    fr, w, h = frames(path)
    m0 = fr[0]; ys = np.nonzero(m0.sum(1) > 2)[0]; top, bot = ys[0], ys[-1]; fh = bot - top + 1
    res = {}
    for name, (lo, hi) in {'feet': (.88, 1.0), 'hips': (.45, .60), 'chest': (.22, .38), 'head': (.02, .14)}.items():
        b0 = band(m0, top, fh, lo, hi); mx = 0.0
        for m in fr:
            b = band(m, top, fh, lo, hi)
            if b and b0: mx = max(mx, abs(b[0] - b0[0]), abs(b[1] - b0[1]), abs(b[2] - b0[2]))
        res[name] = round(100 * mx / fh, 1)
    def crown(m):
        rows = m.sum(1).cumsum(); tot = rows[-1]
        return int(np.searchsorted(rows, 0.12 * tot)) if tot else 0
    c0 = crown(m0); res['sink'] = round(100 * max(crown(m) - c0 for m in fr) / fh, 1)
    area = max(1, m0.sum()); res['sil'] = round(100 * max((m ^ m0).sum() for m in fr) / area, 1)
    d = [100 * (fr[i] ^ fr[i - 1]).sum() / area for i in range(1, 25)]
    res['still'] = int(sum(1 for x in d if x < 1.0))
    med = float(np.median(d)); res['jerk'] = round(max(d) / med, 1) if med > 0 else 0.0
    res['frame'] = f'{w}x{h}'; res['fig'] = int(fh)
    return res

def verdict(slot, r, ref=None):
    v = []
    if slot == 'idle':
        if r['sil'] < 22 or r['still'] > 2: v.append('FROZEN')
        if r['feet'] < 2 and r['hips'] < 2: v.append('LEGS DEAD')
    else:
        s = r['feet'] + r['hips'] + r['sink']
        if r['feet'] < 2 and r['hips'] < 5: v.append('BODY STILL')
        elif ref is not None and s < 0.5 * (ref['feet'] + ref['hips'] + ref['sink']): v.append('BODY STILL (less than half of the reference take)')
    if r['jerk'] > 3: v.append('JERK?')
    return v or ['ok']

if __name__ == '__main__':
    a = sys.argv[1:]; slot = a[0]; ref = None
    if '--ref' in a:
        i = a.index('--ref'); ref = measure(a[i + 1]); a = a[:i] + a[i + 2:]
    for p in a[1:]:
        r = measure(p)
        print(f"{p.split('/')[-1][:30]:30s} {r['frame']:8s} fig {r['fig']:3d} | feet {r['feet']:5.1f} hips {r['hips']:5.1f} chest {r['chest']:5.1f} "
              f"head {r['head']:5.1f} sink {r['sink']:5.1f} | sil {r['sil']:5.1f} still {r['still']:2d} jerk {r['jerk']:4.1f} | {', '.join(verdict(slot, r, ref))}")
