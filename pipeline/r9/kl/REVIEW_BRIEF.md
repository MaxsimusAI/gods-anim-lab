# Fresh-eyes review of new god animation takes (round r9, 14-15.11)

You are a reviewer who has NOT seen how these clips were made. You judge 25-frame sprite sheets (5×5) of 2D game gods
for the mobile game «Битва титанов». Answer with frame numbers. Do not edit anything except your own verdict file.

## What you get per clip (clip id = god_style_slot; style bt = dark fantasy, ti = anime; slot idle | atk | sup | hyp)

- NEW take (candidate), stage 1 = the RAW video: `/home/claude/kl/r9/raw/<clip>-raw.png` — 25 evenly spaced frames of the
  3-second Kling video on its own gray background, not cut out yet. At this stage do NOT judge background cleanliness or
  holes (FAIL defect 2 is checked after the cut) and do not use magenta; judge the take itself. Frame edges of the raw
  video are wider than the final sheet frame: for defect 5 count only what leaves the video frame itself.
- OLD take (on the site now; the game owner Maxim marked it «переснять» = re-shoot):
  `/home/claude/gods-anim-lab/assets/sheets/<god>-<style>-<slot>-mob.webp`
- The idea of the new take: the block `clip: <clip>` in `/home/claude/gods-anim-lab/cards/<god>.md` (wind-up / release /
  recovery / fit lines, and Maxim's remark if he wrote one).
- Frame strips: `python3 /home/claude/kl/r9/strip2.py <out.jpg> <frame list e.g. 0,2,4,...,24> <bg r,g,b> <sheet path or clip id>...`
  (a clip id shows the OLD sheet; a path shows that file). Look at ALL 25 frames of the new take (two strips of 13 and 12
  frames are fine), once on gray `110,110,110` and once on magenta `200,0,200` (magenta shows holes and see-through parts
  of the body). For the old take 9 frames are enough. Read the jpg with the Read tool. Keep strips ≤ 1990 px wide.

## Calibration — read twice

Maxim accepted 93 clips that earlier reviewers had failed: reviewers were far stricter than he is. He rejects what a
PLAYER NOTICES at game speed on a phone. FAIL only for a real defect of that kind. Small things are WATCH.
A new take is published when it is clearly not worse than the old one he rejected and has no FAIL defect.

FAIL defects (any one):
1. The body or a big part of it vanishes, turns see-through, melts, doubles; another character or object appears; the face
   is hidden for most of the action; the god turns his back.
2. The background is not clean: gray / coloured haze slabs, rectangles, floor patches around the figure (owner: «Плохо
   убрана пустота в кадрах», «всё мерцает»).
3. The camera moves or the figure changes size / jumps sideways (also at the very start: frame 0 → 1 → 2).
4. Action clips: only one arm moves while legs and torso are a statue for the whole clip (unless the card says the idea
   keeps the body still); the move is not the card's idea at all; the weapon is not used; no visible effect where the card
   promises one; the clip does not read as what it is (a strike that is only a pose with a glow).
5. A weapon, hand or the head is outside the frame (cut by an edge) for 5 or more frames in a row; or held at full
   arm's length toward an edge / above the head for that long.
6. The effect fills the frame, hides the body, blinds (white-out), or bursts to all edges; loose lights around the god.
7. The loop does not close: frame 24 is visibly not the pose of frame 0.
8. Idles: the god rotates like a figurine on a turntable (torso swings while the feet slide or stay), or freezes for
   6+ frames in a row, or it reads as an attack / dance, or only the head moves.
9. Jerks: a pose jump within one frame that reads as a twitch at game speed (give the frame pair).
WATCH: anything smaller (1-4 frames at an edge, a slightly stiff leg, a short hold, an effect a bit weak).

## What to write

One JSON file for your batch: `/home/claude/kl/r9/review/<batch name>.json` =
`{clip: {"verdict": "PASS|WATCH|FAIL", "better_than_old": true|false|"same", "why": "<1-2 sentences with frame
numbers>", "release": <raw frame index 0-24 where the strike lands / the effect is at its peak — action clips only>, "legs": "<what the legs do, 5 words>", "ru": "<one Russian sentence for the owner: what the god
does in this take, plain words, no jargon>", "retake": "<only for FAIL: the ONE thing to change in the prompt>"}}`.
Save after every 3-4 clips (merge, do not lose earlier ones). Be honest: if you cannot tell, say WATCH and why.
Final message: counts of PASS / WATCH / FAIL and the list of FAIL clips with one line each.

## Addendum for RETAKE batches (r2batch*)

For these clips the first new take FAILED stage 1 and ONE thing was changed in the prompt. You judge the RETAKE:
- RETAKE (candidate): `/home/claude/kl/r9/raw2/<clip>-raw.png` (raw video frames, same rules as stage 1).
- TAKE 1 (failed): `/home/claude/kl/r9/raw/<clip>-raw.png`. OLD (on the site, the owner rejected it): the clip id.
- `/home/claude/kl/r9/review/r2_info.json` → per clip: why take 1 failed, and the retake's action story / fit lines
  (this replaces the card for the retake).
`strip2.py` accepts `.png` and `.webp` paths and clip ids, so one picture can hold RETAKE, TAKE 1 and OLD rows.
Add to each verdict: `"fixed": "yes|partly|no"` (is the reason take 1 failed gone?) and
`"best": "retake|take1|old"` (which of the three you would show a player), with the usual fields.
