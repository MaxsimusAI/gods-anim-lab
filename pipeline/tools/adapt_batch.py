# -*- coding: utf-8 -*-
"""
Strict <= 180x220 px (mob) / <= 126x154 px (lite) 25-frame (5x5) sprite sheet adapter
with:
1. Full 25-frame solid foreground union (mask_i > 0.42) + per-frame mask_i > 0.30 protection
   so raised bows, spears, sickles, and wings are NEVER clipped or feathered out.
2. Exact human-crown normalization via bodyRatioBt / bodyRatioTi so body height matches live Arena 1 1:1
   regardless of weapon height or headroom.
3. Automatic weapon release point `wpt: [dx, dy]` measurement on the impact frame for FX2 («Кузница»).
4. Strict QA checks (`raw_edge_clip`, `frozen_idle`, `frozen_action`, `vanish_area`, `explode_area`)
   plus 5x5 contact sheets for visual verification.
"""
import os, sys, json, time
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["ORT_INTRA_OP_NUM_THREADS"] = "2"
from concurrent.futures import ProcessPoolExecutor, as_completed
import numpy as np
from PIL import Image, ImageDraw
from rembg import remove, new_session
from scipy import ndimage as _ndi

HERE = os.environ["KL_HERE"]
FRAMES_PILOT = os.path.join(HERE, "frames_pilot")
FRAMES_ALL = os.path.join(HERE, "frames_all")
REPO_SHEETS = os.path.join(HERE, "gods-anim-lab-repo", "assets", "sheets")
QA_DIR = os.path.join(HERE, "qa_sheets")
METRICS_JSON = os.path.join(HERE, "adapted_all_metrics.json")

os.makedirs(REPO_SHEETS, exist_ok=True)
os.makedirs(QA_DIR, exist_ok=True)

MAX_MOB_W = 180
MAX_MOB_H = 220
TARGET_FIG_H_MOB = 198

LIVE_M = json.load(open(os.path.join(HERE, "live_bt_metrics.json"), encoding="utf-8"))
NEW10_M = json.load(open(os.path.join(HERE, "new_10_art_metrics.json"), encoding="utf-8"))

def get_body_ratio(clip_id):
    parts = clip_id.split("_")
    gid = parts[0]
    game = parts[1] if len(parts) > 1 else "bt"
    if gid in LIVE_M:
        return float(LIVE_M[gid].get("bodyRatioBt" if game == "bt" else "bodyRatioTi", 0.94))
    if gid in NEW10_M:
        return float(NEW10_M[gid].get("bodyRatioBt" if game == "bt" else "bodyRatioTi", 0.96))
    return 0.95

ram_mb = lambda w, h, n: round(w * h * n * 4 / 2**20, 2)

# Maxim 12.11: a god's 4 new sheets together must weigh no more than his sheets in the live game
# (both decoded RAM and file KB). 180x220 is only the absolute ceiling. A wide animation is stored smaller.
BUDGET_K = float(os.environ.get("KL_BUDGET_K", "0.95"))
SHARE = {"idle": 0.31, "atk": 0.23, "sup": 0.23, "hyp": 0.23}
OVR_PATH = os.path.join(HERE, "impact_overrides.json")
OVR = json.load(open(OVR_PATH, encoding="utf-8")) if os.path.exists(OVR_PATH) else {}

def god_budget(clip_id):
    gid, _, slot = clip_id.split("_")[:3]
    lm = LIVE_M.get(gid)
    if not lm:
        return None
    ram = sum(v["mob"]["ramMb"] for v in lm["sheets"].values())
    kb = sum(v["mob"]["kb"] for v in lm["sheets"].values())
    sh = SHARE.get(slot, 0.23)
    return {"px": ram * BUDGET_K * sh * 2**20 / (25 * 4), "kb": kb * BUDGET_K * sh, "liveRam": round(ram, 2), "liveKb": round(kb, 1)}

def save_sheet_budget(frames_rgba, path, kb_cap, q0=82):
    """Lower WebP quality step by step until the file fits kb_cap. Returns (bytes, quality)."""
    for q in (q0, 76, 70, 64, 58, 52, 46):
        sz = save_sheet(frames_rgba, 5, 5, path, quality=q, alpha_quality=min(93, q + 12))
        if kb_cap is None or sz / 1024.0 <= kb_cap:
            return sz, q
    return sz, q
_WORKER_SESSION = None

def _init_worker():
    global _WORKER_SESSION
    _WORKER_SESSION = new_session("isnet-general-use")

def premul(a):
    f = a.astype(np.float32)
    f[..., :3] *= f[..., 3:4] / 255.0
    return f

def unpremul(f):
    a = f[..., 3:4]
    rgb = np.where(a > 0, f[..., :3] * 255.0 / np.maximum(a, 1e-6), 0)
    out = np.concatenate([np.clip(rgb, 0, 255), np.clip(a, 0, 255)], -1).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    return out

def crop_resize_rgba(a, box, w, h):
    x0, y0, x1, y1 = box
    f = premul(a)
    chans = []
    for c in range(4):
        im = Image.fromarray(np.ascontiguousarray(np.clip(f[..., c], 0, 255)).astype(np.uint8), "L")
        chans.append(np.array(im.resize((w, h), Image.Resampling.LANCZOS, box=(x0, y0, x1, y1))).astype(np.float32))
    return unpremul(np.stack(chans, -1))

def seam_fix(fr, tail=2):
    fr = list(fr)
    p0 = premul(fr[0])
    for j in range(tail):
        i = len(fr) - tail + j
        t = (j + 1) / (tail + 1)
        fr[i] = unpremul(premul(fr[i]) * (1.0 - t) + p0 * t)
    return fr

def save_sheet(frames_rgba, cols, rows, path, quality=80, alpha_quality=92):
    h, w = frames_rgba[0].shape[:2]
    sheet = Image.new("RGBA", (w * cols, h * rows), (0, 0, 0, 0))
    for idx, f in enumerate(frames_rgba):
        c, r = idx % cols, idx // cols
        sheet.paste(Image.fromarray(f, "RGBA"), (c * w, r * h))
    sheet.save(path, "WEBP", quality=quality, method=4, alpha_quality=alpha_quality)
    return os.path.getsize(path)

def bg_profile(a):
    H, W, _ = a.shape
    bw = max(12, int(W * 0.11))
    bh = max(8, int(H * 0.04))
    top_l = a[2:min(2 + bh, H), 2:min(2 + bw, W)]
    top_r = a[2:min(2 + bh, H), max(0, W - 2 - bw):W - 2]
    top_g = np.median(np.concatenate([top_l, top_r], axis=1), axis=(0, 1))
    bot_l = a[max(0, H - 2 - int(H * 0.06)):H - 2, 2:min(2 + bw, W)]
    bot_g = np.median(bot_l, axis=(0, 1))
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    return top_g[None, None, :] * (1.0 - ys) + bot_g[None, None, :] * ys

def matte_frame(im_rgb, session):
    a = np.asarray(im_rgb).astype(np.float32)
    H, W, _ = a.shape
    g = bg_profile(a)
    m = np.asarray(remove(im_rgb, session=session, only_mask=True)).astype(np.float32) / 255.0

    sat = a.max(axis=2) - a.min(axis=2)
    bright = np.maximum(a.max(axis=2) - g.max(axis=2), 0.0)
    diff_max = np.abs(a - g).max(axis=2)

    magic_sig = np.maximum(bright, sat * 0.90)
    k_magic = np.clip((magic_sig - 20.0) / 50.0, 0.0, 1.0) * (a.max(axis=2) >= g.mean(axis=2) - 6.0)
    k_detail = np.clip((diff_max - 28.0) / 50.0, 0.0, 1.0) * (a.mean(axis=2) >= g.mean(axis=2) - 12.0)

    is_dark_floor = (a.mean(axis=2) < g.mean(axis=2) - 8.0) & (m < 0.35)
    k = np.where(is_dark_floor, 0.0, np.maximum(k_magic, k_detail))

    margin_x = max(8.0, W * 0.035)
    body_x = 1.5
    xs = np.arange(W, dtype=np.float32)
    fx_magic = np.minimum(xs / margin_x, (W - 1 - xs) / margin_x).clip(0.0, 1.0) ** 1.25
    fx_body = np.minimum(xs / body_x, (W - 1 - xs) / body_x).clip(0.0, 1.0)
    al = np.maximum(m * fx_body[None, :], k * fx_magic[None, :])

    aa = np.clip(al, 0.15, 1.0)[..., None]
    c = np.where(al[..., None] < 0.995, (a - (1.0 - aa) * g) / aa, a)
    c = np.clip(c, 0, 255)
    out = np.dstack([c, np.clip(al * 255.0, 0, 255)]).astype(np.uint8)
    out[out[..., 3] < 6] = 0
    return out, m

def select_25_indices(raw_files, clip_dir, is_idle=False, clip_id=None):
    o = OVR.get(clip_id or "")
    if o and "imp" in o and not is_idle:
        # o = {"imp": video frame of the release, "k": sheet frame it must land on, "v0": first, "v1": last}
        n = len(raw_files); v0 = int(o.get("v0", 0)); v1 = int(o.get("v1", n - 1)); k = int(o["k"]); imp = int(o["imp"])
        # "skip": [[lo, hi], ...] video frames that must not be used (full-frame flashes, a weapon held outside the frame):
        # they are removed from the timeline and the rest is resampled evenly, so nothing freezes
        bad = set()
        for lo, hi in o.get("skip", []):
            bad.update(range(int(lo), int(hi) + 1))
        pre = [x for x in range(v0, imp + 1) if x not in bad or x == imp]
        post = [x for x in range(imp, v1 + 1) if x not in bad or x == imp]
        a = [pre[int(round(t))] for t in np.linspace(0, len(pre) - 1, k + 1)]
        b = [post[int(round(t))] for t in np.linspace(0, len(post) - 1, 25 - k)]
        return [min(n - 1, max(0, x)) for x in a + b[1:]]
    if is_idle or len(raw_files) <= 26:
        return np.linspace(0, len(raw_files) - 1, 25).round().astype(int).tolist()
    step_s = max(1, Image.open(os.path.join(clip_dir, raw_files[0])).height // 160)
    thumbs = [np.asarray(Image.open(os.path.join(clip_dir, f)).convert("RGB"), dtype=np.float32)[::step_s, ::step_s] for f in raw_files]
    unique = [0]
    for i in range(1, len(thumbs)):
        if float(np.abs(thumbs[i] - thumbs[unique[-1]]).mean()) > 0.20:
            unique.append(i)
    if len(unique) < 25:
        return np.linspace(0, len(raw_files) - 1, 25).round().astype(int).tolist()
    u_thumbs = [thumbs[i] for i in unique]
    step_d = [0.0] + [float(np.abs(u_thumbs[j] - u_thumbs[j - 1]).mean()) for j in range(1, len(u_thumbs))]
    act = [j for j in range(1, len(u_thumbs)) if step_d[j] > 0.50]
    j_start = max(0, act[0] - 1) if act else 0
    j_end = min(len(unique) - 1, act[-1] + 1) if act else len(unique) - 1
    lin24 = np.linspace(j_start, j_end, 24).round().astype(int).tolist()
    return [0] + [unique[j] for j in lin24]

def detect_impact_frame(frames_rgba):
    n = len(frames_rgba)
    lo, hi = max(1, int(n * 0.20)), min(n - 1, int(n * 0.78))
    best_i, best_score = 11, -1.0
    f0 = frames_rgba[0].astype(np.float32)
    for i in range(lo, hi):
        a = frames_rgba[i]
        sat = a[..., :3].max(axis=2).astype(int) - a[..., :3].min(axis=2).astype(int)
        glow = (a[..., 3] > 45) & (sat > 40) & (a[..., :3].max(axis=2) > 170)
        motion = np.abs(a.astype(np.float32) - f0).mean() * 55.0
        sc = float(glow.sum()) + motion
        if sc > best_score:
            best_score, best_i = sc, i
    return best_i

def measure_wpt(fr_mob, imp, fig_norm):
    """
    Measure weapon/magic release point on impact frame in SHEETS_V2 coordinates:
    [dx, dy] in fractions of human body height relative to [ax, foot] (+dx = right, -dy = upward from feet).
    """
    a = fr_mob[imp]
    f0 = fr_mob[0]
    h, w = a.shape[:2]
    ax_px = fig_norm["ax"] * w
    foot_px = fig_norm["foot"] * h
    body_h = max(24.0, (fig_norm["foot"] - fig_norm["top"]) * h)

    sat = a[..., :3].max(axis=2).astype(np.float32) - a[..., :3].min(axis=2).astype(np.float32)
    lum = a[..., :3].max(axis=2).astype(np.float32)
    diff = np.abs(a[..., :3].astype(np.float32) - f0[..., :3].astype(np.float32)).mean(axis=2)
    vis = (a[..., 3] > 70)
    ys, xs = np.indices((h, w), dtype=np.float32)
    # Weight active forward (+x) and upper/chest region with glow + motion
    forward_bias = np.clip((xs - ax_px) / (body_h * 0.35), -0.3, 1.4)
    chest_band = (ys >= fig_norm["top"] * h - body_h * 0.25) & (ys <= foot_px - body_h * 0.16)
    score = vis * chest_band * (diff * 1.4 + sat * 0.55 + np.maximum(0.0, lum - 175.0) * 0.65) * (1.0 + 0.65 * np.maximum(0.0, forward_bias))
    if float(score.max()) < 5.0:
        return [0.34, -0.76]
    thr = np.percentile(score[score > 0], 92) if (score > 0).sum() >= 12 else float(score.max()) * 0.75
    sel = score >= thr
    wx = float((xs[sel] * score[sel]).sum() / np.maximum(1e-5, score[sel].sum()))
    wy = float((ys[sel] * score[sel]).sum() / np.maximum(1e-5, score[sel].sum()))
    dx = round(float(np.clip((wx - ax_px) / body_h, -0.45, 0.78)), 3)
    dy = round(float(np.clip((wy - foot_px) / body_h, -1.25, -0.18)), 3)
    return [dx, dy]

def check_defects(fr_mob, is_idle, raw_edge_clipped=False):
    issues = []
    if raw_edge_clipped:
        issues.append("raw_edge_clip")
    a0 = float((fr_mob[0][..., 3] > 60).sum())
    if a0 < 400:
        issues.append("empty_f0")
        return issues, 0.0
    areas = [float((f[..., 3] > 60).sum()) / a0 for f in fr_mob]
    diffs = [float(np.abs(f.astype(np.float32) - fr_mob[0].astype(np.float32)).mean()) for f in fr_mob[2:22]]
    max_diff = max(diffs) if diffs else 0.0
    if not is_idle and max_diff < 1.2:
        issues.append(f"frozen_action({max_diff:.2f})")
    if is_idle and max_diff < 0.45:
        issues.append(f"weak_idle({max_diff:.2f})")
    if min(areas) < 0.56:
        issues.append(f"vanish_area({min(areas):.2f})")
    if max(areas) > 1.85:
        issues.append(f"explode_area({max(areas):.2f})")
    return issues, round(max_diff, 2)

def save_5x5_qa(fr_mob, clip_id, fig_norm, imp, wpt, defects):
    h, w = fr_mob[0].shape[:2]
    cols, rows = 5, 5
    pad = 2
    head_h = 22
    board = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad) + head_h + pad), (18, 22, 32))
    dr = ImageDraw.Draw(board)
    top_y = int(round(fig_norm["top"] * h))
    foot_y = int(round(fig_norm["foot"] * h))
    ax_x = int(round(fig_norm["ax"] * w))
    body_h = max(20.0, (fig_norm["foot"] - fig_norm["top"]) * h)
    wpx = int(round(ax_x + wpt[0] * body_h))
    wpy = int(round(foot_y + wpt[1] * body_h))

    for idx, sf in enumerate(fr_mob):
        c, r = idx % cols, idx // cols
        ox = pad + c * (w + pad)
        oy = head_h + r * (h + pad)
        cell = Image.new("RGBA", (w, h), (32, 38, 54, 255))
        cell.alpha_composite(Image.fromarray(sf, "RGBA"), (0, 0))
        board.paste(cell.convert("RGB"), (ox, oy))
        dr.line([(ox, oy + top_y), (ox + w - 1, oy + top_y)], fill=(74, 222, 128), width=1)
        dr.line([(ox, oy + foot_y), (ox + w - 1, oy + foot_y)], fill=(74, 222, 128), width=1)
        dr.text((ox + 2, oy + 1), f"{idx:02d}", fill=(255, 220, 100) if idx == imp else (180, 195, 220))
        if idx == imp and not clip_id.endswith("_idle"):
            dr.ellipse([(ox + wpx - 3, oy + wpy - 3), (ox + wpx + 3, oy + wpy + 3)], outline=(255, 90, 90), width=2)
    title = f"{clip_id} | {w}x{h}px | imp=#{imp} wpt={wpt}" + (f" | !{','.join(defects)}" if defects else " | OK")
    dr.text((4, 4), title, fill=(255, 110, 100) if defects else (150, 245, 175))
    out_p = os.path.join(QA_DIR, f"grid5x5_{clip_id}.jpg")
    board.save(out_p, quality=88)

def process_one_clip(task):
    clip_id, cdir = task
    session = _WORKER_SESSION or new_session("isnet-general-use")
    files = sorted([f for f in os.listdir(cdir) if f.endswith(".png")])
    is_idle = clip_id.endswith("_idle")
    idx25 = select_25_indices(files, cdir, is_idle=is_idle, clip_id=clip_id)
    needed = sorted(set(idx25))

    im0 = Image.open(os.path.join(cdir, files[0])).convert("RGB")
    src_W, src_H = im0.size
    rgba0, mask0 = matte_frame(im0, session)
    rgba_cache = {0: rgba0}
    mask_cache = {0: mask0}
    for fi in needed:
        if fi == 0:
            continue
        im = Image.open(os.path.join(cdir, files[fi])).convert("RGB")
        rgba_i, mask_i = matte_frame(im, session)
        rgba_cache[fi] = rgba_i
        mask_cache[fi] = mask_i

    mys, mxs = np.nonzero(mask0 > 0.45)
    if len(mys) < 20:
        mys, mxs = np.nonzero(rgba0[..., 3] > 50)
    fig_x0, fig_y0, fig_x1, fig_y1 = int(mxs.min()), int(mys.min()), int(mxs.max() + 1), int(mys.max() + 1)
    body_ratio = get_body_ratio(clip_id)
    human_y0 = fig_y1 - body_ratio * (fig_y1 - fig_y0)
    human_h_src = max(20.0, float(fig_y1 - human_y0))
    fig_ax_src = 0.5 * (fig_x0 + fig_x1)

    # Full 25-frame solid body + weapon union (NEVER clip any bow, spear, sword, wing, or limb!)
    sx0, sy0, sx1, sy1 = fig_x0, fig_y0, fig_x1, fig_y1
    raw_edge_clipped = False
    min_sup = max(2, int(round(2 * src_H / 640.0)))
    for fi in needed:
        ms = mask_cache[fi] > 0.42
        # Kling fix: sparks / streaks detached from the body must not stretch the body window.
        # Keep the main body component (+ any detached part >= 8% of it, e.g. a thrown weapon).
        lab, nlab = _ndi.label(ms)
        if nlab > 1:
            areas = _ndi.sum(ms, lab, index=np.arange(1, nlab + 1))
            keep_ids = [i + 1 for i, a in enumerate(areas) if a >= 0.08 * areas.max()]
            ms = np.isin(lab, keep_ids)
        # thin vertical/horizontal wisps attached to the body: need real row/column support
        rc = ms.sum(axis=1)
        cc = ms.sum(axis=0)
        sup_r = max(min_sup, int(0.02 * (fig_x1 - fig_x0)))
        sup_c = max(min_sup, int(0.012 * (fig_y1 - fig_y0)))
        rys = np.nonzero(rc >= sup_r)[0]
        cxs = np.nonzero(cc >= sup_c)[0]
        if len(rys):
            sy0 = min(sy0, int(rys.min()))
            sy1 = max(sy1, int(rys.max() + 1))
        if len(cxs):
            sx0 = min(sx0, int(cxs.min()))
            sx1 = max(sx1, int(cxs.max() + 1))
        if (ms[:2, :].sum() >= 4) or (ms[-2:, :].sum() >= 4) or (ms[:, :2].sum() >= 4) or (ms[:, -2:].sum() >= 4):
            raw_edge_clipped = True

    nom_scale = TARGET_FIG_H_MOB / human_h_src
    pad_px = 2.0   # 12.11 Maxim: no unused space in the frame
    pad_src = max(2, int(round(pad_px / nom_scale)))

    # Guaranteed unclipped solid box across all 25 frames:
    wx0 = max(0, sx0 - pad_src)
    wy0 = max(0, sy0 - pad_src)
    wx1 = min(src_W, sx1 + pad_src)
    wy1 = min(src_H, sy1 + pad_src)

    # Optionally include subtle connected magic wisps ONLY inside remaining budget <= 180x220 at nom_scale
    max_w_nom = int(MAX_MOB_W / nom_scale)
    max_h_nom = int(MAX_MOB_H / nom_scale)
    halo_cap_x = max(0, int(round(16.0 / nom_scale)))
    halo_cap_y = max(0, int(round(16.0 / nom_scale)))
    hx0, hy0, hx1, hy1 = wx0, wy0, wx1, wy1
    for fi in needed:
        al_i = rgba_cache[fi][..., 3] > 110
        rys = np.nonzero(al_i.sum(axis=1) >= min_sup + 1)[0]
        cxs = np.nonzero(al_i.sum(axis=0) >= min_sup + 1)[0]
        if len(rys):
            hy0 = min(hy0, max(0, sy0 - pad_src - halo_cap_y, int(rys.min())))
            hy1 = max(hy1, min(src_H, sy1 + pad_src + halo_cap_y, int(rys.max() + 1)))
        if len(cxs):
            hx0 = min(hx0, max(0, sx0 - pad_src - halo_cap_x, int(cxs.min())))
            hx1 = max(hx1, min(src_W, sx1 + pad_src + halo_cap_x, int(cxs.max() + 1)))
    if (hx1 - hx0) <= max_w_nom:
        wx0, wx1 = hx0, hx1
    if (hy1 - hy0) <= max_h_nom:
        wy0, wy1 = hy0, hy1

    _pd = OVR.get(clip_id, {}).get("pad")   # manual window extension, fractions of the window: {"l":..,"r":..,"t":..,"b":..}
    if _pd:
        _ww, _wh = wx1 - wx0, wy1 - wy0
        wx0 = max(0, int(wx0 - _pd.get("l", 0) * _ww)); wx1 = min(src_W, int(wx1 + _pd.get("r", 0) * _ww))
        wy0 = max(0, int(wy0 - _pd.get("t", 0) * _wh)); wy1 = min(src_H, int(wy1 + _pd.get("b", 0) * _wh))
    # 12.11 Maxim: body quality is never traded for effects. If the window is so big (wide wings, long bolts) that the
    # weight budget would store the body smaller than `body_min` px, the window is cropped around the body instead:
    # the body keeps its size, the effect fades softly at the new edge (and the game continues it).
    crop_edges = ""
    _bm = OVR.get(clip_id, {}).get("body_min")
    _bud0 = god_budget(clip_id)
    if _bm and _bud0 and not is_idle:
        a_max = _bud0["px"] / ((float(_bm) / human_h_src) ** 2)
        if (wx1 - wx0) * (wy1 - wy0) > a_max:
            min_w = min(wx1 - wx0, int((fig_x1 - fig_x0) * 1.10) + 2 * pad_src)
            min_h = min(wy1 - wy0, int((fig_y1 - fig_y0) * 1.04) + 2 * pad_src)
            tw = int(max(min_w, a_max / float(wy1 - wy0)))
            if tw < (wx1 - wx0):
                nx0 = int(round(fig_ax_src - tw / 2.0)); nx0 = max(wx0, min(nx0, wx1 - tw)); nx1 = nx0 + tw
                if nx0 > wx0: crop_edges += "L"
                if nx1 < wx1: crop_edges += "R"
                wx0, wx1 = nx0, nx1
            if (wx1 - wx0) * (wy1 - wy0) > a_max:
                th = int(max(min_h, a_max / float(wx1 - wx0)))
                if th < (wy1 - wy0):
                    wy0 = wy1 - th; crop_edges += "T"
    win = (wx0, wy0, wx1, wy1)
    win_w, win_h = max(16, wx1 - wx0), max(16, wy1 - wy0)

    k_res = src_H / 1280.0
    # 12.11 Maxim: a baked effect must never end in a hard cut at the frame edge -> effect (non-body) pixels dissolve
    # over the outer 8% of the frame; the body is protected by its own mask below; the engine continues the effect
    fw_x = max(3.0, 10.0 * k_res, 0.08 * win_w)
    fw_top = max(3.0, 10.0 * k_res, 0.07 * win_h)
    fw_bot = max(2.5, 8.0 * k_res)
    xx = np.arange(win_w, dtype=np.float32)
    yy = np.arange(win_h, dtype=np.float32)
    ex = np.minimum(xx / fw_x, (win_w - 1 - xx) / fw_x).clip(0.0, 1.0)
    ey_t = np.clip(yy / fw_top, 0.0, 1.0)
    ey_b = np.clip((win_h - 1 - yy) / fw_bot, 0.0, 1.0)
    feather = ex[None, :] * ey_t[:, None] * ey_b[:, None]
    # 12.11 (batch 3): where the window edge IS the edge of the Kling video, a cloak/wing/weapon is cut by a straight
    # line. Fade everything (body too) over the last ~3.5% at such edges, so the cut is soft, never a ruler line.
    cut = np.ones((win_h, win_w), np.float32)
    cw_x = max(4.0, 0.035 * win_w); cw_y = max(4.0, 0.03 * win_h)
    if wx0 <= 1 or "L" in crop_edges: cut *= np.clip(xx / cw_x, 0.0, 1.0)[None, :]
    if wx1 >= src_W - 1 or "R" in crop_edges: cut *= np.clip((win_w - 1 - xx) / cw_x, 0.0, 1.0)[None, :]
    if wy0 <= 1 or "T" in crop_edges: cut *= np.clip(yy / cw_y, 0.0, 1.0)[:, None]

    # Hand-off map (Maxim 27.10 / 12.11): where a baked effect is cut by the frame edge, the game continues it
    # with a programmatic effect. For every sheet frame record edge, position along the edge and strength.
    ho = {"top": [], "bottom": [], "left": [], "right": []}
    ho_rgb = np.zeros(3, np.float64); ho_n = 0
    if not is_idle:
        e_th = max(3, int(round(0.025 * win_h)))
        for i, fi in enumerate(idx25):
            a_sub = rgba_cache[fi][wy0:wy1, wx0:wx1]
            rgb_sub = a_sub[..., :3].astype(np.int32)
            lum_ok = (rgb_sub.max(axis=2) > 185) & ((rgb_sub.max(axis=2) - rgb_sub.min(axis=2)) > 70)   # luminous effect, not cloth
            eff = (a_sub[..., 3] > 70) & (mask_cache[fi][wy0:wy1, wx0:wx1] < 0.15) & lum_ok
            for name, strip, axis_len in (("top", eff[:e_th, :], win_w), ("bottom", eff[-e_th:, :], win_w),
                                          ("left", eff[:, :e_th].T, win_h), ("right", eff[:, -e_th:].T, win_h)):
                cnt = int(strip.sum())
                if cnt < max(10, 0.012 * axis_len * e_th):
                    continue
                along = np.nonzero(strip)[1]
                ho[name].append([i, round(float(along.mean()) / float(axis_len), 3), round(min(1.0, cnt / float(axis_len * e_th) * 4.0), 2)])
                px = (a_sub[:e_th, :] if name == "top" else a_sub[-e_th:, :] if name == "bottom" else a_sub[:, :e_th] if name == "left" else a_sub[:, -e_th:])
                sel = (px[..., 3] > 70) & (px[..., :3].max(axis=2) > 185) & ((px[..., :3].max(axis=2).astype(np.int32) - px[..., :3].min(axis=2)) > 70)
                if sel.any():
                    ho_rgb += px[..., :3][sel].astype(np.float64).sum(axis=0); ho_n += int(sel.sum())
    ho = {k: v for k, v in ho.items() if v}
    if ho and ho_n:
        c = np.clip(ho_rgb / ho_n, 0, 255).astype(int)
        mx = max(1, int(c.max())); c = np.clip(c * (255.0 / mx), 0, 255).astype(int)   # full-brightness tint
        ho["col"] = "#%02x%02x%02x" % (int(c[0]), int(c[1]), int(c[2]))

    # CRITICAL FIX: protect solid body/weapon pixels using EACH FRAME'S OWN mask_cache[fi], NEVER mask0!
    for fi in needed:
        arr = rgba_cache[fi]
        m_sub_i = mask_cache[fi][wy0:wy1, wx0:wx1]
        keep_i = np.maximum(feather, (m_sub_i > 0.30).astype(np.float32)) * cut
        sub = arr[wy0:wy1, wx0:wx1].copy()
        sub[..., 3] = np.clip(sub[..., 3].astype(np.float32) * keep_i, 0, 255).astype(np.uint8)
        sub[sub[..., 3] < 6] = 0
        arr[wy0:wy1, wx0:wx1] = sub

    # STRICT HARD CEILING: w_mob <= 180, h_mob <= 220 ALWAYS!
    bud = god_budget(clip_id)
    scale_mob = min(
        TARGET_FIG_H_MOB / human_h_src,
        float(MAX_MOB_W) / float(win_w),
        float(MAX_MOB_H) / float(win_h),
        (bud["px"] / float(win_w * win_h)) ** 0.5 if bud else 9.0,
        # 13.11: optional ceiling for the stored body (px) - when an action would be stored bigger than the god's
        # other actions and blow the KB budget at the lowest quality step
        (float(OVR.get(clip_id, {}).get("body_max")) / human_h_src) if (OVR.get(clip_id, {}).get("body_max") and not is_idle) else 9.0,
    )
    w_mob = min(MAX_MOB_W, max(16, int(round(win_w * scale_mob))))
    h_mob = min(MAX_MOB_H, max(16, int(round(win_h * scale_mob))))
    w_lite = min(126, max(16, int(round(w_mob * 0.70))))
    h_lite = min(154, max(16, int(round(h_mob * 0.70))))

    _sf = (lambda L: seam_fix(L, tail=2)) if is_idle else (lambda L: L)   # only the idle loops; an action ends on its own last frame
    fr_mob = _sf([crop_resize_rgba(rgba_cache[fi], win, w_mob, h_mob) for fi in idx25])
    fr_lite = _sf([crop_resize_rgba(rgba_cache[fi], win, w_lite, h_lite) for fi in idx25])

    slug = clip_id.replace("_", "-")
    fn_mob = f"{slug}-mob.webp"
    fn_lite = f"{slug}-lite.webp"
    sz_mob, q_mob = save_sheet_budget(fr_mob, os.path.join(REPO_SHEETS, fn_mob), bud["kb"] if bud else None, q0=82)
    sz_lite, q_lite = save_sheet_budget(fr_lite, os.path.join(REPO_SHEETS, fn_lite), bud["kb"] * 0.55 if bud else None, q0=min(72, q_mob))

    fig_norm = {
        "top": round(float(human_y0 - wy0) / float(win_h), 4),
        "foot": round(float(fig_y1 - wy0) / float(win_h), 4),
        "ax": round(float(fig_ax_src - wx0) / float(win_w), 4),
    }
    imp = 0 if is_idle else (int(OVR[clip_id]["k"]) if "k" in OVR.get(clip_id, {}) else detect_impact_frame(fr_mob))
    wpt = [0.0, -0.62] if is_idle else measure_wpt(fr_mob, imp, fig_norm)
    _o = OVR.get(clip_id, {}) if not is_idle else {}
    if "wf" in _o:   # manual release point as a fraction of the sheet frame: [x 0..1, y 0..1]
        _h, _w = fr_mob[imp].shape[:2]
        _bh = max(24.0, (fig_norm["foot"] - fig_norm["top"]) * _h)
        wpt = [round((_o["wf"][0] - fig_norm["ax"]) * _w / _bh, 3), round((_o["wf"][1] - fig_norm["foot"]) * _h / _bh, 3)]
    # wf = the same point as a fraction of the sheet frame; the engine uses it directly (exact by construction)
    _h2, _w2 = fr_mob[imp].shape[:2]
    _bh2 = max(24.0, (fig_norm["foot"] - fig_norm["top"]) * _h2)
    wf = [round(float(_o["wf"][0]), 3), round(float(_o["wf"][1]), 3)] if "wf" in _o else \
         [round(min(1.0, max(0.0, fig_norm["ax"] + wpt[0] * _bh2 / _w2)), 3), round(min(1.0, max(0.0, fig_norm["foot"] + wpt[1] * _bh2 / _h2)), 3)]
    defects, max_diff = check_defects(fr_mob, is_idle, raw_edge_clipped=raw_edge_clipped)

    strip_frames = [fr_mob[0], fr_mob[imp if not is_idle else 12], fr_mob[18]]
    sw = w_mob * 3 + 8
    sh = h_mob + 18
    strip = Image.new("RGB", (sw, sh), (22, 26, 40))
    dr = ImageDraw.Draw(strip)
    top_y = int(round(fig_norm["top"] * h_mob))
    foot_y = int(round(fig_norm["foot"] * h_mob))
    for si, sf in enumerate(strip_frames):
        ox = si * (w_mob + 3)
        cell = Image.new("RGBA", (w_mob, h_mob), (30, 36, 54, 255))
        cell.alpha_composite(Image.fromarray(sf, "RGBA"), (0, 0))
        strip.paste(cell.convert("RGB"), (ox, 16))
        dr.line([(ox, 16 + top_y), (ox + w_mob, 16 + top_y)], fill=(74, 222, 128), width=1)
        dr.line([(ox, 16 + foot_y), (ox + w_mob, 16 + foot_y)], fill=(74, 222, 128), width=1)
    lbl = f"{clip_id} [{w_mob}x{h_mob}] r#{imp}" + (f" !{','.join(defects)}" if defects else "")
    dr.text((2, 2), lbl, fill=(255, 110, 100) if defects else (220, 235, 255))
    strip_path = os.path.join(QA_DIR, f"strip_{clip_id}.jpg")
    strip.save(strip_path, quality=88)

    save_5x5_qa(fr_mob, clip_id, fig_norm, imp, wpt, defects)

    info = {
        "id": clip_id,
        "srcRes": f"{src_W}x{src_H}",
        "frames": 25, "cols": 5, "rows": 5,
        "impact": imp,
        "rel": round(imp / 24.0, 3),
        "wpt": wpt,
        "wf": wf,
        "maxDiff": max_diff,
        "fig": fig_norm,
        "defects": defects,
        "crop": crop_edges or None,
        "ho": ho or None,
        "q": q_mob, "bodyPx": int(round((fig_norm["foot"] - fig_norm["top"]) * h_mob)),
        "budget": ({"kb": round(bud["kb"], 1), "liveRam": bud["liveRam"], "liveKb": bud["liveKb"]} if bud else None),
        "mob": {"file": fn_mob, "w": w_mob, "h": h_mob, "kb": round(sz_mob / 1024.0, 1), "ramMb": ram_mb(w_mob, h_mob, 25)},
        "lite": {"file": fn_lite, "w": w_lite, "h": h_lite, "kb": round(sz_lite / 1024.0, 1), "ramMb": ram_mb(w_lite, h_lite, 25)},
    }
    return clip_id, info, strip_path

def build_qa_boards(strip_paths):
    if not strip_paths:
        return []
    per_board = 24
    boards = []
    for bi in range(0, len(strip_paths), per_board):
        chunk = strip_paths[bi:bi + per_board]
        ims = [Image.open(p) for p in chunk]
        cols = 3
        rows = (len(ims) + cols - 1) // cols
        cw = max(im.width for im in ims) + 8
        ch = max(im.height for im in ims) + 8
        board = Image.new("RGB", (cols * cw + 8, rows * ch + 8), (14, 16, 24))
        for idx, im in enumerate(ims):
            c, r = idx % cols, idx // cols
            board.paste(im, (6 + c * cw, 6 + r * ch))
        bpath = os.path.join(QA_DIR, f"qa_board_{bi // per_board + 1:02d}.jpg")
        board.save(bpath, quality=86)
        boards.append(bpath)
    return boards

def main():
    force = "--force" in sys.argv
    only_filter = [a for a in sys.argv[1:] if not a.startswith("--")]
    # Only one adapter at a time: every run rewrites the metrics file, a parallel run silently deletes the other's entries.
    import fcntl
    _lock = open(METRICS_JSON + ".lock", "w")
    try:
        fcntl.flock(_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        sys.exit("another adapt_batch.py is running - wait for it (parallel runs lose metrics)")
    existing = {}
    if os.path.exists(METRICS_JSON):
        existing = json.load(open(METRICS_JSON, encoding="utf-8"))
        # Frame folders are temporary (deleted to save disk, absent in a fresh workspace): never drop entries because of them.
        # Only rejected/old takes are dropped.
        existing = {k: v for k, v in existing.items() if "take" not in k and "rejected" not in k}

    tasks = []
    for root_dir in (FRAMES_PILOT, FRAMES_ALL):
        if not os.path.isdir(root_dir):
            continue
        for cname in sorted(os.listdir(root_dir)):
            if cname.endswith("_360p"):
                continue
            cdir = os.path.join(root_dir, cname)
            if not os.path.isdir(cdir):
                continue
            if only_filter and not any(f in cname for f in only_filter):
                continue
            pngs = [f for f in os.listdir(cdir) if f.endswith(".png")]
            if len(pngs) < 15:
                continue
            slug = cname.replace("_", "-")
            mob_p = os.path.join(REPO_SHEETS, f"{slug}-mob.webp")
            if not force and not only_filter and cname in existing and "wpt" in existing[cname] and os.path.exists(mob_p):
                continue
            tasks.append((cname, cdir))

    print(f"Adapting {len(tasks)} clips (already cached: {len(existing)})...")
    t0 = time.time()
    new_strips = []
    if tasks:
        workers = min(2, max(1, len(tasks)))
        with ProcessPoolExecutor(max_workers=workers, initializer=_init_worker) as ex:
            futs = {ex.submit(process_one_clip, t): t[0] for t in tasks}
            done = 0
            for fut in as_completed(futs):
                cid, info, sp = fut.result()
                existing[cid] = info
                new_strips.append((cid, sp))
                done += 1
                m = info["mob"]
                flag = f" DEFECTS={info['defects']}" if info["defects"] else ""
                print(f"  [{done}/{len(tasks)}] {cid:24s} -> mob {m['w']}x{m['h']} ({m['kb']}KB, {m['ramMb']}MB) diff={info['maxDiff']} wpt={info['wpt']}{flag}")
                if done % 8 == 0:
                    with open(METRICS_JSON, "w", encoding="utf-8") as f:
                        json.dump(dict(sorted(existing.items())), f, indent=2)

    with open(METRICS_JSON, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(existing.items())), f, indent=2)

    all_strips = [os.path.join(QA_DIR, f"strip_{cid}.jpg") for cid in sorted(existing.keys()) if os.path.exists(os.path.join(QA_DIR, f"strip_{cid}.jpg"))]
    boards = build_qa_boards(all_strips)
    over = [k for k, v in existing.items() if v["mob"]["w"] > MAX_MOB_W or v["mob"]["h"] > MAX_MOB_H]
    flagged = {k: v["defects"] for k, v in existing.items() if v["defects"]}
    print(f"\nDone in {time.time() - t0:.1f}s! Total adapted: {len(existing)} | Over 180x220: {len(over)} | Flagged: {len(flagged)}")
    if flagged:
        for k, df in flagged.items():
            print(f"  ! {k}: {df}")

if __name__ == "__main__":
    main()
