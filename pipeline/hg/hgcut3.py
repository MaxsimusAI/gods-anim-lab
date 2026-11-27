# Cut the three Kling clips of a higher goddess into 5x5 sheets (25 frames) for the review page - matte v3 (matte3.py, 27.11).
# Options per slot in cut3_opts.json {god: {slot|'*': {ds: 0|1 desmoke (default 1), g2: 0|1 strict light rule, gs: 0|1 smooth dull
# smoke near the gray is neither body nor light (Flame, Wrath, Destruction entrances; Void's idle loop), kp: 0|1 solid pieces
# apart from the figure stay body (Terra's statue)}}}.
# Matting = the stand's matte_frame (rembg isnet + coloured-effect key), copied from pipeline/tools/adapt_batch.py.
# v2 (26.11, fresh-eyes review): one SCALE per goddess (from the idle figure), but a crop window PER CLIP; the entrance
# starts empty (frame 0 cleared); effects cut by the video edge fade out instead of ending in a straight line; specks dropped.
# Usage: python3 hgcut.py <god> [idle=<clip>,app=<clip>,atk=<clip>]   env per slot from cut_opts.json {god: {slot: {ENV: val}}}
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
from scipy import ndimage as ndi
src = open('/home/claude/gods-anim-lab/pipeline/tools/adapt_batch.py', encoding='utf-8').read()
a = src.index('def bg_profile(a):'); b = src.index('def select_25_indices')
NS = {'np': np, 'os': os, 'Image': Image, 'remove': remove, 'new_session': new_session}
exec(src[a:b], NS)
god = sys.argv[1]
clips = {'idle': f'{god}_bt_idle', 'app': f'{god}_bt_app', 'atk': f'{god}_bt_atk'}
if len(sys.argv) > 2:
    for kv in sys.argv[2].split(','): k, v = kv.split('='); clips[k] = v
OPTS = json.load(open('cut_opts.json')).get(god, {}) if os.path.exists('cut_opts.json') else {}
FIG = int(os.environ.get('HG_FIG', '250'))
cache = f'mat/{god}'; os.makedirs(cache, exist_ok=True)
def pick(slot, N):
    if slot == 'app': return [round(i * (N - 1) / 24) for i in range(25)]
    return [round(i * (N - 1) / 25) for i in range(25)]      # loop: frame N-1 equals frame 0, not repeated
def clean(rgba, slot, n):
    a = rgba[..., 3].astype(np.float32)
    if slot == 'app' and n == 0: a[:] = 0                     # the entrance starts on the empty background
    if slot == 'app' and n <= 3:                              # gray haze of the first entrance frames (review 2: frame 1)
        c = rgba[..., :3].astype(np.float32); sat = c.max(2) - c.min(2)
        a[(a < 90) & (sat < 28)] = 0
    lab, k = ndi.label(a > 20)
    if k:
        area = ndi.sum(np.ones_like(a), lab, index=np.arange(1, k + 1))
        small = np.zeros(k + 1, bool); small[1:] = area < 150   # isolated specks (sparks of 1-3 stored px) blink: drop them
        a[small[lab]] = 0
    H, W = a.shape; f = 28.0; ft = 160.0 if slot == 'app' else 90.0   # an effect cut by the video edge fades out; at the top longer
    ys = np.arange(H, dtype=np.float32)[:, None]; xs = np.arange(W, dtype=np.float32)[None, :]
    fs = 0.06 * W   # 27.11 (Maxim 04:08 «много косяков с вырезами»): anything that runs out of a SIDE of the video - a sword, a cloak,
    sd = (np.minimum(xs, W - 1 - xs) / fs).clip(0, 1); sd = sd * sd * (3 - 2 * sd)   # a ring on the ground - dissolves over 6 % of the width
    ramp = np.minimum(np.minimum((ys / ft) ** 1.5, (H - 1 - ys) / f), sd).clip(0, 1)
    out = rgba.copy(); out[..., 3] = np.clip(a * ramp, 0, 255).astype(np.uint8); out[out[..., 3] < 6] = 0
    return out
mats = {}
from matte3 import bg_gray, parts, fill_ok, compose, smooth
from masks import mask_of
OPT3 = json.load(open('cut3_opts.json')) if os.path.exists('cut3_opts.json') else {}
for slot, clip in clips.items():
    o3 = {'ds': 1, 'g2': 0, 'gs': 0, 'kp': 0, **OPT3.get('*', {}), **OPT3.get(god, {}).get('*', {}), **OPT3.get(god, {}).get(slot, {})}
    d = f'fr/{clip}'; fs = sorted(os.listdir(d)); idx = pick(slot, len(fs))
    A = [np.asarray(Image.open(f'{d}/{fs[i]}').convert('RGB')) for i in idx]   # uint8 (memory); parts/compose take float32 copies
    g = bg_gray([a.astype(np.float32) for a in A[::4]])
    P = [parts(a.astype(np.float32), mask_of(clip, i, a.astype(np.float32)), g, desmoke=bool(o3['ds']), glow2=bool(o3['g2']), gray_smoke=int(o3['gs']), keep_pieces=bool(o3['kp'])) for a, i in zip(A, idx)]
    P = [(fx.astype(np.float16), b.astype(np.float16)) for fx, b in P]
    loop = slot != 'app'; n = len(P); out = []
    for k in range(n):
        fx, body = P[k][0].astype(np.float32), P[k][1].astype(np.float32); p, q = k - 1, k + 1
        if loop: p, q = p % n, q % n
        Ak = A[k].astype(np.float32)
        if 0 <= p < n and 0 <= q < n:   # restore only where this frame looks like both neighbours there (a stone the mask lost),
            same = np.maximum(np.abs(Ak - A[p]).max(2), np.abs(Ak - A[q]).max(2))   # not where light or smoke moved (gray ghosts, Order's ring)
            body = np.maximum(body, np.minimum(P[p][1], P[q][1]).astype(np.float32) * fill_ok(Ak, g) * (1 - smooth(same, 35.0, 70.0)))   # (moving cloth differs a little: still restored)
        out.append(clean(compose(Ak, g, fx, body), slot, k))
    mats[slot] = (clip, idx, out); print(clip, o3, 'bg', g, 'matted', len(out), flush=True)
VH, VW = mats['idle'][2][0].shape[:2]
idle0 = mats['idle'][2][0]
yy = np.where((idle0[..., 3] > 128).any(1))[0]; xx = np.where((idle0[..., 3] > 128).any(0))[0]
figH = yy.max() - yy.min() + 1; k = FIG / figH
fy0, fy1, fax = yy.min(), yy.max() + 1, (xx.min() + xx.max()) / 2
def down(f, box, W, H):
    x0, y0, x1, y1 = box
    pm = f.astype(np.float32); pm[..., :3] *= pm[..., 3:4] / 255.0
    ch = [np.array(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8), 'L').resize((W, H), Image.LANCZOS, box=(x0, y0, x1, y1))).astype(np.float32) for c in range(4)]
    o = np.stack(ch, -1); al = o[..., 3:4]; rgb = np.where(al > 0, o[..., :3] * 255.0 / np.maximum(al, 1e-6), 0)
    im = Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), np.clip(al, 0, 255)], -1).astype(np.uint8), 'RGBA')
    r, g, b, a = im.split(); rgb = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=2))
    return Image.merge('RGBA', (*rgb.split(), a))
meta = {'figPx': FIG, 'video': [VW, VH], 'scale': round(k, 5)}
os.makedirs('sheets3', exist_ok=True)
for slot, (clip, idx, out) in mats.items():
    A = np.zeros((VH, VW), bool)
    for f in out: A |= f[..., 3] > 8
    ys, xs = np.where(A); m = 3 / k                            # crop window of this clip, 3 stored px of margin
    x0, x1 = max(0, int(xs.min() - m)), min(VW, int(np.ceil(xs.max() + 1 + m))); y0, y1 = max(0, int(ys.min() - m)), min(VH, int(np.ceil(ys.max() + 1 + m)))
    W, H = round((x1 - x0) * k), round((y1 - y0) * k)
    fig = {'top': round((fy0 - y0) / (y1 - y0), 4), 'foot': round((fy1 - y0) / (y1 - y0), 4), 'ax': round((fax - x0) / (x1 - x0), 4)}
    S = Image.new('RGBA', (W * 5, H * 5), (0, 0, 0, 0))
    for n, f in enumerate(out): S.paste(down(f, (x0, y0, x1, y1), W, H), ((n % 5) * W, (n // 5) * H))
    p = f'sheets3/{god}-bt-{slot}.webp'; S.save(p, 'WEBP', quality=84, method=6, alpha_quality=88)
    meta[slot] = {'file': p, 'kb': round(os.path.getsize(p) / 1024), 'fw': W, 'fh': H, 'fig': fig, 'crop': [x0, y0, x1, y1], 'idx': idx, 'clip': clip,
                  'ramMB': round(W * H * 25 * 4 / 1048576, 2)}
    print(p, (W, H), meta[slot]['kb'], 'KB', fig, flush=True)
meta['matte'] = 'v3'
json.dump(meta, open(f'sheets3/{god}.json', 'w'), indent=1)
