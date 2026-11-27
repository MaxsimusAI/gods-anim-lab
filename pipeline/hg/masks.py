# isnet body mask of one video frame, cached (mask3/<clip>_<i>.png): the full-size mask plus the small-frame mask eroded (flat body
# areas close to the gray, 14.11 Kali), as the stand's matte_frame did.
import os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
_S = None
def mask_of(clip, i, a):
    global _S
    p = f'/home/claude/hgk/mask3/{clip}_{i:03d}.png'
    if os.path.exists(p): return np.asarray(Image.open(p)).astype(np.float32) / 255.0
    from rembg import remove, new_session
    if _S is None: _S = new_session('isnet-general-use')
    im = Image.fromarray(a.astype(np.uint8)); H, W = a.shape[:2]
    m = np.asarray(remove(im, session=_S, only_mask=True)).astype(np.float32) / 255.0
    sm = im.resize((max(2, int(round(W * 420.0 / H))), 420), Image.LANCZOS)
    m2 = np.asarray(remove(sm, session=_S, only_mask=True).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255.0
    er = max(3, int(H * 0.006)); m = np.maximum(m, ndi.grey_erosion(m2, size=(2 * er + 1, 2 * er + 1)))
    os.makedirs(os.path.dirname(p), exist_ok=True); Image.fromarray((m * 255).astype(np.uint8)).save(p)
    return m
