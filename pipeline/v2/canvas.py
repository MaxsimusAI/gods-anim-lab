#!/usr/bin/env python3
"""canvas.py — the Kling input picture and the room it leaves for motion.

Three modes:
  --mode tight    (IN FORCE, Maxim 12-13.11): builds / describes a tight picture = figure box + margins
                  (default 9 % sides and top, 3 % bottom of the picture).
  --mode measure  (IN FORCE): reads an EXISTING input picture (flat gray background, e.g. tight/<god>_<style>_tight.png)
                  and prints the same numbers for the picture that is really sent to Kling.
  --mode frame    (PROPOSAL, waits for Maxim): the picture has the shape of the future game frame.
tight and measure also print `figure_px_when_whole_picture_fits`: the stored figure height at which the WHOLE video
picture fits a 180x220 frame (nothing the video shows is lost at the cut).
Every mode prints the room in % of the figure height. tight and measure also print how much headroom can be STORED in a
220 px frame when the figure is stored `--stored` px tall with its feet on the bottom edge — pass the god's idle figure
height (`sheet_motion.py` prints it as `fig`; default 212).

Why: the tight picture is the figure box + small margins. Measured on gods 1-5 at the idle's stored scale it is 103-112 % of
the frame ceiling in height (the top ~7 % of the video cannot be stored at that scale) and 69-99 % in width (narrow gods
have less room in the video than the game frame allows).

    canvas.py <figure.png|sheet.webp|picture.png> <god_id> [--mode tight|measure|frame] [--stored <idle figure px>] [--out canvas.png]
                 [--side .09 --top .09 --bottom .03]   (tight)      [--live live_bt_metrics.json --allow 1.0 --shift 0.0]   (frame)

figure  : RGBA cut-out of the god (or a 5x5 sheet: frame 0 is used)
budget  : W = min(180, allow * area of the live action sheet / 220), never narrower than the figure + 2*4 %;  H = 220
figure  : stands at the bottom (2 % margin), top margin 4 %  -> the stored figure height is 220 * 0.94 = 207 px
--shift : moves the figure sideways, in share of the free width (-1 .. 1), to give room on the weapon side
Prints the room the motion may use, in % of the figure height: put these numbers into the shot card.
"""
import sys, json, argparse
from PIL import Image

CEIL_W, CEIL_H, TOP, BOT, MIN_SIDE = 180, 220, 0.04, 0.02, 0.04

def figure(path):
    im = Image.open(path).convert('RGBA')
    if path.endswith('.webp') and im.width % 5 == 0 and im.height % 5 == 0 and im.width > 400:
        im = im.crop((0, 0, im.width // 5, im.height // 5))
    return im.crop(im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())

def measure_picture(path, stored):
    import numpy as np
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    bg = a[2:12, 2:12].reshape(-1, 3).mean(0)
    m = np.abs(a - bg).sum(-1) > 36
    ys = np.nonzero(m.sum(1) > 2)[0]; xs = np.nonzero(m.sum(0) > 2)[0]
    top, bot, left, right = ys[0], ys[-1], xs[0], xs[-1]; H, W = m.shape; fh = bot - top + 1; k = stored / fh
    return dict(mode='measure', stored_figure_px=stored, picture_px=[W, H], picture_in_sheet_px=[round(W * k), round(H * k)],
                room_left_pct=round(100 * left / fh, 1), room_right_pct=round(100 * (W - 1 - right) / fh, 1),
                headroom_in_video_pct=round(100 * top / fh, 1),
                headroom_storable_pct=round(min(100 * top / fh, 100 * max(0.0, CEIL_H - stored) / stored), 1),
                width_vs_frame_ceiling_pct=round(100 * W * k / CEIL_W),
                figure_px_when_whole_picture_fits=int(min(CEIL_H / H, CEIL_W / W) * fh))

def budget(god, live, allow):
    L = live[god]['sheets']; cm = live[god].get('clipMap', {})
    refs = {cm.get(s, s) for s in ('atk', 'sup', 'hyp')} & set(L)
    area = max(L[k]['mob']['w'] * L[k]['mob']['h'] for k in refs) if refs else CEIL_W * CEIL_H
    return min(CEIL_W, int(allow * area / CEIL_H)), area

def plan(fig, god, live, allow=1.15, shift=0.0):
    fh = CEIL_H * (1 - TOP - BOT); k = fh / fig.height; fw = fig.width * k
    W, area = budget(god, live, allow)
    W = max(W, int(round(fw + 2 * MIN_SIDE * fh)))
    over = W > CEIL_W
    W = min(W, CEIL_W) if not over else W
    free = W - fw; left = free / 2 * (1 + shift); right = free - left
    return dict(god=god, frame=[W, CEIL_H], figure=[round(fw), round(fh)], scale=round(k, 4),
                room_left_pct=round(100 * left / fh, 1), room_right_pct=round(100 * right / fh, 1),
                headroom_pct=round(100 * CEIL_H * TOP / fh, 1), live_action_area=area,
                ram_pct_if_full=round(100 * W * CEIL_H / area), figure_wider_than_ceiling=over, _k=k, _left=left)

def build(fig, p, out, px_h=1600):
    s = px_h / CEIL_H; W = int(round(p['frame'][0] * s / 2)) * 2
    f = fig.resize((int(round(p['figure'][0] * s)), int(round(p['figure'][1] * s))), Image.LANCZOS)
    bg = Image.new('RGB', (W, px_h), (127, 127, 127))
    bg.paste(f, (int(round(p['_left'] * s)), px_h - int(round(CEIL_H * BOT * s)) - f.height), f)
    bg.save(out); return bg.size

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('figure'); ap.add_argument('god')
    ap.add_argument('--live', default=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', 'work', 'live_bt_metrics.json'))
    ap.add_argument('--allow', type=float, default=1.0); ap.add_argument('--out'); ap.add_argument('--shift', type=float, default=0.0)
    ap.add_argument('--mode', choices=['tight', 'measure', 'frame'], default='tight'); ap.add_argument('--stored', type=float, default=212.0, help="stored figure height of the god's idle, px")
    ap.add_argument('--side', type=float, default=0.09); ap.add_argument('--top', type=float, default=0.09); ap.add_argument('--bottom', type=float, default=0.03)
    a = ap.parse_args()
    if a.mode == 'measure':
        p = measure_picture(a.figure, a.stored); p['god'] = a.god
        print(json.dumps(p, ensure_ascii=False)); sys.exit(0)
    fig = figure(a.figure)
    if a.mode == 'tight':
        cw = fig.width / (1 - 2 * a.side); ch = fig.height / (1 - a.top - a.bottom)
        k = a.stored / fig.height                                   # sheet px per figure px
        p = dict(god=a.god, mode='tight', stored_figure_px=a.stored, picture_in_sheet_px=[round(cw * k), round(ch * k)],
                 room_left_pct=round(100 * a.side * cw / fig.height, 1), room_right_pct=round(100 * a.side * cw / fig.height, 1),
                 headroom_in_video_pct=round(100 * a.top * ch / fig.height, 1),
                 headroom_storable_pct=round(min(100 * a.top * ch / fig.height, 100 * max(0.0, CEIL_H - a.stored) / a.stored), 1),
                 width_vs_frame_ceiling_pct=round(100 * cw * k / CEIL_W),
                 figure_px_when_whole_picture_fits=int(min(CEIL_H / ch, CEIL_W / cw) * fig.height))
        if a.out:
            W = 1080; fw = round(W * (1 - 2 * a.side)); fh = round(fig.height * fw / fig.width); H = round(fh / (1 - a.top - a.bottom)); H += H % 2
            bg = Image.new('RGB', (W, H), (127, 127, 127)); f = fig.resize((fw, fh), Image.LANCZOS)
            bg.paste(f, ((W - fw) // 2, H - round(H * a.bottom) - fh), f); bg.save(a.out); p['canvas_px'] = bg.size
        print(json.dumps(p, ensure_ascii=False)); sys.exit(0)
    p = plan(fig, a.god, json.load(open(a.live)), a.allow, a.shift); p['mode'] = 'frame (proposal)'
    if a.out: p['canvas_px'] = build(fig, p, a.out)
    print(json.dumps({k: v for k, v in p.items() if not k.startswith('_')}, ensure_ascii=False))
