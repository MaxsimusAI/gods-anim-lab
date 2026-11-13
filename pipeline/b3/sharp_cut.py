# run2.py <here> <cap_factor> <matting> clip : adapt with better matting, light sharpening after the downscale, tuned WebP to a size cap
import os, sys, importlib.util, numpy as np
here, fac, mat, clip = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
os.environ["KL_HERE"] = here
spec = importlib.util.spec_from_file_location("ab", "/home/claude/kl/tools/adapt_batch.py"); ab = importlib.util.module_from_spec(spec); sys.modules["ab"] = ab
sys.argv = ["adapt_batch.py", clip]; spec.loader.exec_module(ab)
from PIL import Image, ImageFilter
import webp
def _init():
    ab._WORKER_SESSION = ab.new_session(mat)
ab._init_worker = _init
def sharpen(f):
    im = Image.fromarray(f, "RGBA"); rgb = im.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.9, percent=70, threshold=1))
    o = np.array(rgb); return np.dstack([o, f[..., 3]])
def enc(sheet, q, path):
    cfg = webp.WebPConfig.new(quality=q, method=6); p = cfg.ptr
    p.filter_strength = 20; p.filter_sharpness = 3; p.sns_strength = 60; p.alpha_quality = min(95, int(q) + 10); p.alpha_filtering = 2
    pic = webp.WebPPicture.from_pil(sheet); data = pic.encode(cfg).buffer()
    open(path, "wb").write(bytes(data)); return os.path.getsize(path)
def budget(fr, path, kb_cap, q0=82):
    fr = [sharpen(f) for f in fr]
    h, w = fr[0].shape[:2]; sheet = Image.new("RGBA", (w * 5, h * 5), (0, 0, 0, 0))
    for i, f in enumerate(fr): sheet.paste(Image.fromarray(f, "RGBA"), ((i % 5) * w, (i // 5) * h))
    cap = (kb_cap or 9999) * fac * 1024; lo, hi, best = 30, 92, None
    while hi - lo > 1:
        m = (lo + hi) // 2; sz = enc(sheet, m, path)
        if sz <= cap: lo, best = m, m
        else: hi = m
    q = best or lo; sz = enc(sheet, q, path); return sz, q
ab.save_sheet_budget = budget
ab.main()
