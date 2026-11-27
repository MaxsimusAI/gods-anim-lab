# Matte v3 for Kling clips on the flat gray background (27.11, Maxim 04:08 «много косяков с вырезами»: flicker at the edges of glowing
# rings, a crooked glowing circle, a stone that blinks in and out, opaque patches).
# The background of these clips is one flat gray (125±2, no grain), so every effect is cut by its difference to that gray, the same
# way in every frame (no flicker). The mask model (isnet) only decides where the solid body is - and only where the pixel is not
# flat background (texture or colour), so translucent light it swallows is not turned into an opaque gray slab.
#   fx   = how far the pixel moved from the gray toward the edge of the colour cube (additive light -> its full colour, translucent)
#   body = isnet mask where the pixel has texture or colour; holes inside the body that are not flat background are filled
#   temporal_fill: a body pixel lost in one frame but present in the frames before and after is restored (a stone that blinks)
import numpy as np
from scipy import ndimage as ndi

def bg_gray(frames):
    """the clip's background colour: the most common colour of the left/right margins over the clip"""
    px = np.concatenate([np.concatenate([f[:, :6].reshape(-1, 3), f[:, -6:].reshape(-1, 3)]) for f in frames]).astype(np.float32)
    q = np.round(px)
    vals, cnt = np.unique(q, axis=0, return_counts=True)
    return vals[cnt.argmax()].astype(np.float32)

def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1); return t * t * (3 - 2 * t)

def parts(a, m, g, desmoke=False, edge=0.07, glow2=False, matter_on=True, gray_smoke=False, keep_pieces=False):
    """a: HxWx3 float frame, m: HxW isnet mask 0..1, g: background colour (3,). Returns (fx alpha, body alpha), each HxW 0..1."""
    H, W, _ = a.shape
    dv = a - g[None, None, :]
    d = np.abs(dv).max(2)
    with np.errstate(divide='ignore', invalid='ignore'):
        room = np.where(dv > 0, (255.0 - g)[None, None, :] / np.maximum(dv, 1e-6),
                        np.where(dv < 0, g[None, None, :] / np.maximum(-dv, 1e-6), np.inf)).min(2)
    fx = np.clip(1.0 / np.maximum(room, 1.0), 0, 1) * smooth(d, 3.0, 9.0)   # flat background and compression grain stay empty
    L = a.mean(2); lstd = np.sqrt(np.maximum(ndi.uniform_filter(L * L, 5) - ndi.uniform_filter(L, 5) ** 2, 0))
    sat = a.max(2) - a.min(2)
    smoke = np.zeros_like(d, bool)
    if desmoke:   # Kling's gray smoke: unsaturated, smooth, a little off the background -> not content (neither light nor body)
        smoke = (sat < 14) & (lstd < 2.0) & (d < 60)
        fx = np.where(smoke, fx * smooth(sat, 6, 14), fx)
    content = np.clip(smooth(lstd, 1.0, 3.0) + smooth(d, 5.0, 14.0), 0, 1)   # texture or colour: what the mask may call body
    # light, not matter: brighter than the gray and very smooth (Sun's halo, the bloom round a glowing ring) - the mask model swallows
    # it as body and it turned into an opaque gray-beige disc; it is cut as light (its colour unmixed, translucent)
    glow = (L > g.mean() + 4) & (lstd < 1.2)
    if glow2:   # per clip (a halo or a dome of light the mask swallows whole): any smooth, near-gray, not dark pixel is light
        glow = glow | ((d < 50) & (lstd < 3.5) & (L > g.mean() - 10))
        glow = glow | ((lstd < 2.5) & (sat > 40) & (a.max(2) > g.mean() + 40))   # a smooth bright saturated rim of light (Order's dome)
    body = np.clip(m, 0, 1) * content * ~glow * ~smoke
    if gray_smoke:   # per clip: Kling's textured gray smoke that the mask swallows (Flame's entrance, Void's idle loop): a pixel close to
        # the background's own colour is not body - it stays a translucent effect (27.11, review: opaque gray clouds)
        l15 = ndi.uniform_filter(lstd, 15)   # smoke is smooth (5-px texture ~1) where hair and cloth are rough (~15); near the gray
        gs = 1 - (1 - smooth(l15, 2.0, 5.0)) * (1 - smooth(d, 36.0, 70.0))   # (warm-tinted near fire, so no saturation test)
        if gray_smoke != 2: body = body * gs   # (2: only the haze below, the body untouched - Plague's pale legs are smooth and gray-green)
        else: gs = np.ones_like(gs)
        fx = fx * (1 - (1 - smooth(l15, 2.5, 5.0)) * (1 - smooth(d, 40.0, 60.0)) * (1 - smooth(sat, 50.0, 80.0)))   # and its light: a dull smooth haze near the gray is not light either
    # pieces the mask cut out of haze or light, apart from the figure: not body (they stay light, unmixed and translucent)
    lab0, n0 = ndi.label(body > 0.5)
    if n0 > 1 and not keep_pieces:   # (per clip: Terra's statue stands up from separate stone pieces - they are body)
        area = ndi.sum(np.ones_like(d), lab0, index=np.arange(1, n0 + 1)); big = area.max()
        near = ndi.binary_dilation(lab0 == (area.argmax() + 1), iterations=max(3, int(H * 0.006)))
        keep = np.zeros(n0 + 1, bool); keep[1:] = area >= 0.25 * big
        keep[np.unique(lab0[near])] = True; keep[0] = False
        body = np.where((lab0 > 0) & ~keep[lab0], 0.0, body)
    solid = body > 0.5
    # matter the mask lost (Terra's gray stone pillar in 3 of 8 frames): textured, not glowing pixels joined to the solid body are body
    matter = (lstd > 2.5) & (ndi.uniform_filter(lstd, 15) > 6.0) & (sat < 40) & (a.max(2) < 215) & (d > 4)   # dull and rough: stone, rubble (not soft smoke, not glow, not a tinted dome)
    lab, n = ndi.label(ndi.binary_closing(matter | solid, iterations=1))
    if n and matter_on:
        keep = np.zeros(n + 1, bool); keep[np.unique(lab[solid])] = True; keep[0] = False
        grown = keep[lab] & ~solid
        body = np.where(grown, np.maximum(body, smooth(lstd, 1.0, 2.5) * smooth(d, 3.0, 8.0)), body)
        solid = body > 0.5
    holes = ndi.binary_fill_holes(solid) & ~solid & (content > 0.3)        # inside the body, not flat background (gray stone, silver)
    hl, hn = ndi.label(holes)
    if hn:   # a big hole the mask does not call body is a gap closed by a ribbon or an arm (Void's idle): it stays light, not a gray slab
        area = ndi.sum(np.ones_like(d), hl, index=np.arange(1, hn + 1)); mm = ndi.mean(m, hl, index=np.arange(1, hn + 1))
        ok = np.zeros(hn + 1, bool); ok[1:] = (area < H * W * 0.0015) | (mm > 0.5)
        holes = holes & ok[hl]
    l15h = ndi.uniform_filter(lstd, 15); bgish = (1 - smooth(d, 14.0, 34.0)) * (1 - smooth(l15h, 2.0, 5.0))   # a smooth patch of the gray itself,
    fillw = content * (1 - bgish) * (gs if gray_smoke else 1)                  # closed in by a ring or a ribbon, stays background (Sun, Void)
    body = np.where(holes, np.maximum(body, fillw), body)
    core = ndi.binary_erosion(body > 0.5, iterations=2)                    # solid inside, soft only on the outline
    body = np.where(core, 1.0, body)
    xs = np.arange(W, dtype=np.float32)[None, :]                            # effects cut by the video edge fade out over a band
    fx = fx * smooth(np.minimum(xs, W - 1 - xs), 0, edge * W)
    return fx.astype(np.float32), body.astype(np.float32)

def fill_ok(a, g):
    """where a frame may take the body of its neighbours: only where it is not flat background itself (no ghost of a moving arm)"""
    d = np.abs(a - g[None, None, :]).max(2); L = a.mean(2)
    lstd = np.sqrt(np.maximum(ndi.uniform_filter(L * L, 5) - ndi.uniform_filter(L, 5) ** 2, 0))
    return np.clip(smooth(lstd, 1.0, 3.0) + smooth(d, 6.0, 16.0), 0, 1)

def temporal_fill(bodies, loop=False):
    """a body pixel present in the frames before and after but lost in this one is restored"""
    n = len(bodies); out = []
    for i in range(n):
        p, q = i - 1, i + 1
        if loop: p, q = p % n, q % n
        if 0 <= p < n and 0 <= q < n: out.append(np.maximum(bodies[i], np.minimum(bodies[p], bodies[q])))
        else: out.append(bodies[i])
    return out

def compose(a, g, fx, body):
    """RGBA uint8: body pixels keep the video colour (unmixed on the soft outline only), effects are unmixed to their full colour"""
    sh = 0.5 * body + 0.5 * ndi.minimum_filter(body, 3)                      # the outermost pixel of the body is half background in the
    body = np.where(body > sh + 0.2, sh, body)                               # video: half its alpha, then its colour is unmixed (no light rim)
    al = np.maximum(body, fx)
    dv = a - g[None, None, :]
    aa = np.clip(al, 0.04, 1.0)[..., None]
    bb = np.clip(body, 0.35, 1.0)[..., None]                                # the soft outline of the body: the gray it was mixed with is
    cb = np.where((body < 0.98)[..., None], g[None, None, :] + dv / bb, a)    # taken out, so a dark figure gets no light rim (review 2)
    c = np.where((body >= fx)[..., None], cb, g[None, None, :] + dv / aa)   # body: the video colour (gray stone stays gray)
    out = np.dstack([np.clip(c, 0, 255), np.clip(al * 255.0, 0, 255)]).astype(np.uint8)
    out[out[..., 3] < 4] = 0
    return out
