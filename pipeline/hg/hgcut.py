# Cut the three Kling clips of a higher goddess into 5x5 sheets (25 frames) for the review page.
# Matting = the stand's matte_frame (rembg isnet + coloured-effect key), copied from pipeline/tools/adapt_batch.py.
import sys, os, json, re
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove, new_session
src = open('/home/claude/gods-anim-lab/pipeline/tools/adapt_batch.py', encoding='utf-8').read()
a = src.index('def bg_profile(a):'); b = src.index('def select_25_indices')
NS = {'np': np, 'os': os, 'Image': Image, 'remove': remove, 'new_session': new_session}
exec(src[a:b], NS)
god = sys.argv[1]; slots = sys.argv[2].split(',') if len(sys.argv) > 2 else ['idle', 'app', 'atk']
FIG = int(os.environ.get('HG_FIG', '250'))
sess = new_session('isnet-general-use')
cache = f'mat/{god}'; os.makedirs(cache, exist_ok=True)
def frames(clip):
    d = f'fr/{clip}'; fs = sorted(os.listdir(d)); return d, fs
def pick(slot, N):
    if slot == 'app': return [round(i * (N - 1) / 24) for i in range(25)]
    return [round(i * (N - 1) / 25) for i in range(25)]      # loop: frame N-1 equals frame 0, not repeated
mats = {}
for slot in slots:
    clip = f'{god}_bt_{slot}'
    if os.environ.get('HG_TAKE'): clip += os.environ['HG_TAKE'] if slot == 'atk' else ''
    d, fs = frames(clip); idx = pick(slot, len(fs)); out = []
    for i in idx:
        p = f'{cache}/{clip}_{i:03d}.png'
        if not os.path.exists(p):
            im = Image.open(f'{d}/{fs[i]}').convert('RGB')
            rgba, _ = NS['matte_frame'](im, sess); Image.fromarray(rgba, 'RGBA').save(p)
        out.append(np.asarray(Image.open(p)))
    mats[slot] = (clip, idx, out); print(clip, 'matted', len(out), flush=True)
# one crop window for all three clips of the goddess: union of alpha > 8 over all frames
allm = [f for s in mats.values() for f in s[2]]
A = np.zeros(allm[0].shape[:2], bool)
for f in allm: A |= f[..., 3] > 8
ys, xs = np.where(A); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
# figure height from the idle's first frame (solid alpha)
idle0 = mats['idle'][2][0] if 'idle' in mats else allm[0]
yy = np.where((idle0[..., 3] > 128).any(1))[0]; xx = np.where((idle0[..., 3] > 128).any(0))[0]
figH = yy.max() - yy.min() + 1; k = FIG / figH
W, H = round((x1 - x0) * k), round((y1 - y0) * k)
fig = {'top': round((yy.min() - y0) / (y1 - y0), 4), 'foot': round((yy.max() + 1 - y0) / (y1 - y0), 4), 'ax': round(((xx.min() + xx.max()) / 2 - x0) / (x1 - x0), 4)}
def down(f):
    pm = f.astype(np.float32); pm[..., :3] *= pm[..., 3:4] / 255.0
    ch = [np.array(Image.fromarray(np.clip(pm[..., c], 0, 255).astype(np.uint8), 'L').resize((W, H), Image.LANCZOS, box=(x0, y0, x1, y1))).astype(np.float32) for c in range(4)]
    o = np.stack(ch, -1); al = o[..., 3:4]; rgb = np.where(al > 0, o[..., :3] * 255.0 / np.maximum(al, 1e-6), 0)
    im = Image.fromarray(np.concatenate([np.clip(rgb, 0, 255), np.clip(al, 0, 255)], -1).astype(np.uint8), 'RGBA')
    r, g, b, a = im.split(); rgb = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=2))
    return Image.merge('RGBA', (*rgb.split(), a))
meta = {'fw': W, 'fh': H, 'fig': fig, 'figPx': FIG, 'video': list(allm[0].shape[1::-1]), 'crop': [int(x0), int(y0), int(x1), int(y1)]}
os.makedirs('sheets', exist_ok=True)
for slot, (clip, idx, out) in mats.items():
    S = Image.new('RGBA', (W * 5, H * 5), (0, 0, 0, 0))
    for n, f in enumerate(out): S.paste(down(f), ((n % 5) * W, (n // 5) * H))
    p = f'sheets/{god}-bt-{slot}.webp'; S.save(p, 'WEBP', quality=86, method=6, alpha_quality=90)
    meta[slot] = {'file': p, 'kb': round(os.path.getsize(p) / 1024), 'idx': idx, 'clip': clip}
    print(p, S.size, meta[slot]['kb'], 'KB', flush=True)
json.dump(meta, open(f'sheets/{god}.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in meta.items() if k in ('fw', 'fh', 'fig', 'crop')}))
