# Stage 2 — check of CUT sheets before they go on the site (round r9)

You are a fresh-eyes reviewer. The takes below already passed stage 1 (the raw video looked fine). Now the videos were cut
out of their gray background into 5×5 sprite sheets (25 frames). You check the CUT and read two numbers by eye.
Do not edit any file except your own result file. Do not spawn sub-agents.

Per clip (clip id = god_style_slot; slot idle | atk | sup | hyp):
- cut sheet: `/home/claude/kl/work/gods-anim-lab-repo/assets/sheets/<god>-<style>-<slot>-mob.webp`
- frame strips: `python3 /home/claude/kl/r9/strip2.py <out.jpg> <frame list> <bg r,g,b> <sheet path>...` — look at ALL 25
  frames on magenta `200,0,200` (see-through body parts and leftover background haze show as pink / purple patches) and
  at a sample on dark `50,50,60` (how it looks in the game). Read the jpg with the Read tool.
- stage-1 notes on the take: `/home/claude/kl/r9/review/stage1_all.json` (key = clip) — e.g. "check the edges after the cut".

## A. Cut quality — answer for each clip
1. Holes: is any part of the BODY, clothes or weapon see-through or missing in some frames (it flickers in play)? Which
   frames, which part.
2. Haze: are there gray / coloured slabs, rectangles, blobs or floor patches around the figure that are leftover
   background (not the effect of the skill)? Which frames, where.
3. Edges: is the weapon, a hand, the head or a big part of the effect cut by the frame edge for 5 or more frames in a row
   (the sheet frame is tighter than the video)? Which frames, which part. 1-4 frames = note only.
4. Does the figure keep its size and place from frame to frame (no jump at frame 0→1 or 23→24→0)?
Verdict: `"cut": "ok"` (publish), `"cut": "minor"` (publish, with a note), or `"cut": "bad"` (do not publish — say what
exactly must be repaired: which frames, which region as fractions of the frame).

## B. For action clips (atk / sup / hyp) only — two numbers read by eye
- `release`: the index (0-24) of the frame where the strike lands or the effect is released / at its peak — the moment
  the game must start its own effect. If two frames are equally good take the earlier.
- `wf`: [x, y] as fractions of the frame (0,0 = top left; 1,1 = bottom right) of the exact point on the weapon / hand /
  foot where the baked effect sits at the release frame (tip of the blade, crystal of the staff, palm, lantern, hammer
  head, kicking foot). `python3 /home/claude/kl/b3/wfview.py <out.jpg> <clip>...` draws the frame the cutter believes is
  the release (and +3) enlarged with a 10 % grid and a red cross at its current guess — use the grid to read the point; if
  the cutter's release frame is wrong, read the point on YOUR release frame with strip2 at larger scale (one frame).

## Result
`/home/claude/kl/r9/review/<name given in your task>.json` =
`{clip: {"cut": "ok|minor|bad", "notes": "<frames + what, or empty>", "release": <int or null for idles>,
"wf": [x, y] or null, "cutter_release_ok": true|false}}`. Save after every 3-4 clips. Final message: one line per clip.
