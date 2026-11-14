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

# Playbook L1 / T4 (13.11): weight is compared PER ANIMATION. Each new sheet is measured against the matching live sheet
# (live idle for idle; the live sheet the slot uses in the game - own or via clipMap - for atk/sup/hyp), in KB and RAM.
# Soft target: the WebP quality is stepped down to reach the live KB; the body is NEVER shrunk for it (L4).
OVR_PATH = os.path.join(HERE, "impact_overrides.json")
OVR = json.load(open(OVR_PATH, encoding="utf-8")) if os.path.exists(OVR_PATH) else {}

def live_ref(clip_id):
    gid, _, slot = clip_id.split("_")[:3]
    lm = LIVE_M.get(gid)
    if not lm:
        return None
    sh = lm["sheets"]
    key = slot if slot in sh else lm.get("clipMap", {}).get(slot)
    if key not in sh:
        key = next((k for k in ("atk", "sup", "hyp") if k in sh), None) if slot != "idle" else None
    if key not in sh:
        return None
    m = sh[key]["mob"]
    return {"key": key, "w": m["w"], "h": m["h"], "kb": m["kb"], "ramMb": m["ramMb"]}

def god_budget(clip_id):
    r = live_ref(clip_id)
    if not r:
        return None
    return {"px": float(r["w"] * r["h"]), "kb": float(r["kb"]), "liveRam": r["ramMb"], "liveKb": r["kb"], "key": r["key"]}

def idle_body_px(clip_id):
    """L4: stored body height (px) of this god-style's idle sheet; every action sheet is stored at the same body size."""
    gid, st = clip_id.split("_")[:2]
    try:
        m = json.load(open(METRICS_JSON, encoding="utf-8")).get(f"{gid}_{st}_idle")
    except Exception:
        m = None
    return float(m["bodyPxF"]) if m and m.get("bodyPxF") else (float(m["bodyPx"]) if m and m.get("v") == 21 else None)

def save_sheet_budget(frames_rgba, path, kb_cap, q0=82):
    """Lower WebP quality step by step until the file fits kb_cap. Returns (bytes, quality)."""
    for q in [x for x in (82, 76, 70, 64, 58, 52, 46) if x <= q0]:
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
    # 14.11 (Kali's belly, Ao Guang's robe): on full-size frames the mask model drops flat body areas whose colour is close to
    # the gray background; on a small frame (420 px high, as the cuts before the sharp cut used) it keeps them. The small
    # mask, eroded so that it never touches the outline, is added to the full-size one: the edge stays sharp, the inside solid.
    if os.environ.get("KL_MASK2", "1") == "1" and H > 600:
        from scipy import ndimage as _ni2
        _sm = im_rgb.resize((max(2, int(round(W * 420.0 / H))), 420), Image.LANCZOS)
        _m2 = np.asarray(remove(_sm, session=session, only_mask=True).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255.0
        _er = max(3, int(H * 0.006))
        m = np.maximum(m, _ni2.grey_erosion(_m2, size=(2 * _er + 1, 2 * _er + 1)))
        # thin body parts (a cape lining 10 px wide) do not survive the erosion: there the small mask is taken where the pixel
        # is not background-coloured, so the soft outside rim of the upscaled mask (pure background) adds nothing (Lucifer TI)
        _dm = np.abs(np.asarray(im_rgb).astype(np.float32) - bg_profile(np.asarray(im_rgb).astype(np.float32))).max(axis=2)
        m = np.maximum(m, _m2 * np.clip((_dm - 10.0) / 15.0, 0.0, 1.0))

    sat = a.max(axis=2) - a.min(axis=2)
    bright = np.maximum(a.max(axis=2) - g.max(axis=2), 0.0)
    diff_max = np.abs(a - g).max(axis=2)

    magic_sig = np.maximum(bright, sat * 0.90)
    k_magic = np.clip((magic_sig - 20.0) / 50.0, 0.0, 1.0) * (a.max(axis=2) >= g.mean(axis=2) - 6.0)
    k_detail = np.clip((diff_max - 28.0) / 50.0, 0.0, 1.0) * (a.mean(axis=2) >= g.mean(axis=2) - 12.0)

    # 13.11 (v21): dark but clearly coloured effect pixels (dark-green vines, dark-red smoke) are content, not floor shadow:
    # they used to be dropped unless the body mask caught them, so vines flickered between solid and dotted outlines.
    k_dark = np.clip((sat - 42.0) / 38.0, 0.0, 1.0)
    is_dark_floor = (a.mean(axis=2) < g.mean(axis=2) - 8.0) & (m < 0.35) & (sat < 42.0)
    # 14.11 (Hel BT strike, Maxim «плохо вырезан фон»): Kling smoke = gray, unsaturated, a little brighter than the background;
    # k_detail made it a translucent gray slab. Opt-in (KL_DESMOKE=1): outside the body mask, unsaturated mid-contrast pixels are
    # background. Thin white hair strands are high-contrast and stay.
    if os.environ.get("KL_DESMOKE") == "1":
        smoke = (sat < 22.0) & (m < 0.35) & (diff_max < 80.0)
        k_detail = np.where(smoke, 0.0, k_detail)
        k_magic = np.where(smoke, 0.0, k_magic)
    k = np.where(is_dark_floor, 0.0, np.maximum(np.maximum(k_magic, k_detail), k_dark))
    # 14.11 (Anansi BT ult): a kneeling leg in black trousers got a low body mask for three frames and turned see-through -
    # pixels darker than the background are kept only by the mask. Opt-in (KL_DARKBODY=1): clearly dark pixels (far from the
    # background colour, so not a soft floor shadow) that are connected to the solid body count as body.
    if os.environ.get("KL_DARKBODY", "1") == "1":   # default ON since 14.11 15:50 (fixed Anansi, Ares, see-through dark limbs); KL_DARKBODY=0 switches it off
        from scipy import ndimage as _ni
        dk = (a.mean(axis=2) < g.mean(axis=2) - 12.0) & (diff_max > 45.0)
        lab, _n = _ni.label(dk | (m > 0.5))
        keep = np.zeros(_n + 1, bool); keep[np.unique(lab[m > 0.5])] = True; keep[0] = False
        k = np.maximum(k, np.where(dk & keep[lab], np.clip((diff_max - 45.0) / 25.0, 0.0, 1.0), 0.0))

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
    if o and "idx" in o and not is_idle:
        # explicit list of the 25 video frames: pins the moments of a published take when it is only re-cut sharper
        # (the automatic choice below depends on the frame size and the denoise, so it can drift on full-size frames)
        return [min(len(raw_files) - 1, max(0, int(x))) for x in o["idx"]]
    if o and "imp" in o and not is_idle:
        # o = {"imp": video frame of the release, "k": sheet frame it must land on, "v0": first, "v1": last}
        n = len(raw_files); v0 = int(o.get("v0", 0)); v1 = int(o.get("v1", n - 1)); k = int(o["k"]); imp = int(o["imp"])
        # "skip": [[lo, hi], ...] video frames that must not be used (full-frame flashes, a weapon held outside the frame):
        # they are removed from the timeline and the rest is resampled evenly, so nothing freezes
        if o.get("skip"):
            raise SystemExit(f"{clip_id}: override 'skip' is FORBIDDEN (playbook L6) - remove it; re-shoot if the clip is unusable without it")
        bad = set()
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
        _neg_pad = "".join(e for e, k in (("L", "l"), ("R", "r"), ("T", "t"), ("B", "b")) if _pd.get(k, 0) < 0)
    # L4 (13.11): one body scale for all slots. An action sheet is stored at the body size of the god's idle sheet.
    # If the content window does not fit 180x220 at that scale, the window is cropped AROUND THE BODY (effects fade softly
    # at the new edge and the game continues them); the body is never shrunk. If the crop would cut solid body/weapon
    # pixels, the sheet is flagged `solid_cut` = defect -> the clip is re-shot with a compact motion.
    crop_edges = _neg_pad if _pd else ""
    solid_cut = 0.0
    _bm = None
    # Skill v2, section 4: a PROTECTED take is re-cut whole - never cropped around the body, never re-shot. With
    # {"fit": true} in impact_overrides.json the clip keeps its full window and is stored at the largest scale at which
    # that window fits 180x220 (scale_mob below); its stored body px is reported, not flagged as body_small.
    _fit = bool(OVR.get(clip_id, {}).get("fit")) and not is_idle
    if not is_idle and not _fit:
        _ib = idle_body_px(clip_id)
        if _ib is None:
            raise RuntimeError(f"{clip_id}: the idle of this god-style is not cut with adapter v21 yet - cut the idle first (L4)")
        _bm = max(_ib, float(OVR.get(clip_id, {}).get("body_min") or 0))
    body_scale = (float(_bm) / human_h_src) if (_bm and not is_idle) else nom_scale
    if _fit:
        body_scale = 1e9   # the frame ceiling decides
    if not is_idle and not _fit:
        max_w = int(MAX_MOB_W / body_scale); max_h = int(MAX_MOB_H / body_scale)
        if (wx1 - wx0) > max_w:
            # keep the solid union if it fits, centred on it; otherwise centre on the body axis
            cx = 0.5 * (sx0 + sx1) if (sx1 - sx0) + 2 * pad_src <= max_w else fig_ax_src
            nx0 = int(round(cx - max_w / 2.0)); nx0 = max(wx0, min(nx0, wx1 - max_w)); nx1 = nx0 + max_w
            if nx0 > wx0: crop_edges += "L"
            if nx1 < wx1: crop_edges += "R"
            wx0, wx1 = nx0, nx1
        if (wy1 - wy0) > max_h:
            ny1 = min(wy1, max(fig_y1 + pad_src, wy0 + max_h)); ny0 = ny1 - max_h
            if ny0 > wy0: crop_edges += "T"
            if ny1 < wy1: crop_edges += "B"
            wy0, wy1 = ny0, ny1
    if crop_edges:
        tot = 0.0; out_px = 0.0
        for fi in needed:
            ms = mask_cache[fi] > 0.42
            tot += float(ms.sum()); out_px += float(ms.sum() - ms[wy0:wy1, wx0:wx1].sum())
        solid_cut = out_px / max(1.0, tot)
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
    if "B" in crop_edges: cut *= np.clip((win_h - 1 - yy) / cw_y, 0.0, 1.0)[:, None]

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

    # STRICT HARD CEILING: w_mob <= 180, h_mob <= 220 ALWAYS (L2). Idle: body up to 198 px inside the ceiling.
    # Action: the idle body scale (L4); the window was already cropped to fit. No weight-driven shrinking (T4).
    bud = god_budget(clip_id)
    scale_mob = min(
        body_scale,
        float(MAX_MOB_W) / float(win_w),
        float(MAX_MOB_H) / float(win_h),
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
    sz_mob, q_mob = save_sheet_budget(fr_mob, os.path.join(REPO_SHEETS, fn_mob), bud["kb"] if bud else None, q0=76)
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
    if solid_cut > 0.004:
        defects.append(f"solid_cut({solid_cut * 100:.1f}%)")
    _body_f = (fig_norm["foot"] - fig_norm["top"]) * h_mob
    if not is_idle and _bm and _body_f < 0.97 * float(_bm):
        defects.append(f"body_small({_body_f:.0f}<{float(_bm):.0f})")

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
        "q": q_mob, "bodyPx": int(round(_body_f)), "bodyPxF": round(_body_f, 2), "v": 21,
        "live": ({"key": bud["key"], "kb": bud["liveKb"], "ramMb": bud["liveRam"],
                  "kbPct": round(100.0 * sz_mob / 1024.0 / bud["liveKb"]), "ramPct": round(100.0 * ram_mb(w_mob, h_mob, 25) / bud["liveRam"])} if bud else None),
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

    bad_skip = [c for c, _ in tasks if OVR.get(c, {}).get("skip")]
    if bad_skip:
        sys.exit(f"override 'skip' is FORBIDDEN (playbook L6), remove it first: {bad_skip}")
    print(f"Adapting {len(tasks)} clips (already cached: {len(existing)})...")
    t0 = time.time()
    new_strips = []
    for phase in (True, False):   # idles first: every action sheet takes the body size of its god's idle sheet (L4)
        ph_tasks = [t for t in tasks if t[0].endswith("_idle") == phase]
        if not ph_tasks:
            continue
        workers = min(2, max(1, len(ph_tasks)))
        with ProcessPoolExecutor(max_workers=workers, initializer=_init_worker) as ex:
            futs = {ex.submit(process_one_clip, t): t[0] for t in ph_tasks}
            done = 0
            for fut in as_completed(futs):
                cid, info, sp = fut.result()
                existing[cid] = info
                new_strips.append((cid, sp))
                done += 1
                m = info["mob"]; lv = info.get("live") or {}
                flag = f" DEFECTS={info['defects']}" if info["defects"] else ""
                print(f"  [{done}/{len(ph_tasks)}] {cid:24s} -> mob {m['w']}x{m['h']} body {info['bodyPx']} q{info['q']} {m['kb']}KB ({lv.get('kbPct')}% of live {lv.get('key')}) RAM {lv.get('ramPct')}% crop={info['crop']}{flag}", flush=True)
                if done % 8 == 0:
                    with open(METRICS_JSON, "w", encoding="utf-8") as f:
                        json.dump(dict(sorted(existing.items())), f, indent=2)
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
