# Gods animation playbook (Kling → sprite sheets → stand) — the ONLY rule set

Project: «Битва титанов. Сумерки богов» (BT) + its anime clone Titan Idols (TI). Owner: Maxim, game designer, not a programmer.
This file replaces every older rule list (old KLING_RULES versions are cancelled). Version 3.1, 13.11.2026 16:10 (whole body moves,
free aim direction, clip-by-clip flow with old/new switch on the stand; no camera shake; body/weapon out of the frame only for a split second).

**Where a rule here contradicts another one, the NEWER entry of section 12 wins — and the contradiction must be removed from the
section where it sits the same day.** (13.11: "feet planted on the same spot" stood in the prompt template and in 3 rules, made
out of "same size, no growing toward the camera"; result: glued feet in almost every clip. "Never aim sideways" had become
"aim only up". Both are removed below.)

**Read this whole file at the start of every session and again before EVERY batch, every cut and every publish.**
The main failure so far: rules were remembered for 3 gods and forgotten on the 4th, the same mistakes went round in circles.
Therefore every step below has a checklist. A step is done only when every box of its checklist is checked for EVERY clip.
Never rely on memory of an earlier god — re-check against this file.

---

## 0. Talking to Maxim

- Reply in Russian, short, concrete. No code, no file names, no technical symbols.
- Before a package of work: list the items in 3-8 short lines, then do them all. Never drop any of his remarks.
- Keep him informed: what is done, what is running, how long is left.
- Report "fixed" only for what you have SEEN fixed on the stand (time series), never "should be fixed".
- Never quietly change an agreed rule to make something work. If a rule cannot be kept — stop and ask him.
- Do not invent new rules. New rules come only from his remarks; add them here (section 12) and show him the list.
- His numbers in examples are examples, not exact values.

## 1. Goal and scope

- Every god: 4 slots (idle, atk = basic attack, sup = super, hyp = ult) × 2 styles (BT dark fantasy, TI anime) = 8 clips.
- Per god deliverable on the stand: 8 sheets + game (programmatic) effects for atk/sup/hyp in the proposed arenas +
  notes per slot + a balance proposal + an art assessment.
- The live BT game is the reference; the new version must be better: livelier, richer, not heavier.
- **Principle (Maxim): the game effect is built to the animation, never the animation bent to the code.**
- The game repos (`Twilight of the Gods`, `Titan Idols Anime RPG`, `IdolRPG`) are READ-ONLY for this task.
  Nothing goes into the games or servers until Maxim explicitly orders it. Titan Idols game is frozen.
- Balance and battle changes: proposals only; applied only after his approval.

## 2. Hard limits (never broken, never "temporarily")

| # | Limit | How it is checked |
|---|-------|-------------------|
| L1 | Weight is compared PER ANIMATION, not as a total (many live gods have only 2-3 animations; 4 new ones are naturally heavier in total). Each new sheet ≈ the matching live sheet (live idle for idle; the live sheet the slot used — often the shared attack — for atk/sup/hyp) in file KB and RAM: ideally not more; slightly more is OK (soft target, not a hard wall). Never shrink the body to hit it (L4) | per-sheet table new vs live; larger excess → tell Maxim with numbers |
| L2 | Sheet frame ≤ 180×220 (mob) and ≤ 126×154 (lite). It is a ceiling, not a target: the smaller the better. Always crop every side where neither the body nor any effect ever reaches in any frame (e.g. idle has lots of empty space left/right/top) | adapter refuses more; L5 |
| L2a | The game has ONE art set since 24.10: the phone set ("mob"), used on phones AND on PC (PC differs only by interface). The lite set and the PC full-size set are archived (lite may return only for Yandex). Compare weight/RAM/sharpness against the live mob set only; lite sheets are secondary | stand toggle "обычная" |
| L3 | Kling input = the TIGHT canvas only (`tight/<god>_<bt|ti>_tight.png`). Never mid/loose/tall, never widen | prompt list check |
| L4 | (The only intended size change: the stand draws a god slightly smaller while he leaps to the enemies — perspective, enemies stand farther and are enlarged. That is display scaling; the stored body stays the same.) **One body scale for all slots: atk/sup/hyp are stored at the SAME body size as the god's idle. The god is never shrunk to fit a weapon, a pose or an effect.** If it does not fit the frame/weight, change the motion (prompt: weapon closer, effect narrower, folded wings, kneel) — never the body, never the frame limits | body px of every action sheet = idle body px (±3 %); any smaller = defect, re-shoot with a compact motion |
| L5 | Empty margin of a sheet (union of 25 frames) ≤ 3 px | `b3/margins2.py` |
| L6 | No visible cuts: frames are never removed from the middle of a clip (no `skip`) | overrides have no `skip` |
| L7 | No blinding light: no white-out, lens flare, starburst, star/cross glint, full-frame flash, brightened background — baked or programmatic | look at release frames; look at hits on the stand |
| L8 | Left arena of the stand (live game) never changes | diff of the left-arena time series vs previous version |
| L9 | Prevent, not only filter: every prompt forbids the body vanishing/turning transparent, haze/smoke rectangles and full-frame explosions (template sentence in section 5). A sheet with adapter flags `vanish_area`, `explode_area`, `frozen_*` is never published | prompt check + gate G3 |
| L10 | Secrets: never print Kling tokens, upload tickets, signed/download URLs, API keys, the user's email; never commit them (`tok*.txt`, `urls*.json`) | `git diff --stat` before commit |
| L11 | Kling: no silent auto-resubmit; each job costs 30 credits | section 5 |

## 3. Workspace (how a new chat starts)

1. Clone `MaxsimusAI/gods-anim-lab` to `/home/claude/gods-anim-lab` (push access needed for publishing).
2. Run `bash pipeline/setup.sh` — recreates `/home/claude/kl` exactly as the scripts expect:
   `kl/tools` (adapter, manifest builder, tight canvas), `kl/b3` (QA scripts, prompt sets, review verdicts),
   `kl/work/*.json` (metrics, overrides, notes = `kling_done.json`, live metrics), `kl/shot3.py`,
   and downloads the release assets: current Kling source videos → `kl/b2/mp4/<clip>.mp4`,
   tight input canvases → `kl/tight/`.
   **After every batch save the new source videos back**: `tar` the batch's current `b2/mp4/<clip>.mp4` into
   `mp4-zz-v<site version>.tar` (extracted last, so it overrides older takes), add its line to SHA256SUMS.txt and write both
   into Maxim's `Kling тест\workspace` (SendUserFile → device_commit_files with the fileUuid). v21: `mp4-zz-v21.tar` = 40 clips
   of gods 1-5. Without this the next session loses the clips (that is how Kitsune and Athena sources were lost).
   Needs: `pip install --break-system-packages rembg onnxruntime scipy pillow numpy playwright && python3 -m playwright install chromium`, ffmpeg.
3. Stand locally: `cd /home/claude/gods-anim-lab && python3 -m http.server 8765` (stop it when done; no hanging processes).
4. Clip name = `<god>_<bt|ti>_<idle|atk|sup|hyp>`; sheet file = `<god>-<bt|ti>-<slot>-<mob|lite>.webp`.
5. Working tools added 13.11 (v21), all in `pipeline/b3`: `strip2.py out n clips` (n frames per clip with frame numbers),
   `fr.py out clip i0 i1 [step]` (a frame range), `wfview.py out clips` (release frame + 3 with a 10 % grid: READ wf there),
   `setwf.py clip=x,y …` (writes wf to overrides AND metrics without re-cutting), `seqz.py` (= seq.py, full scale, central column:
   use it for G4), `hcmp.py out gods` (stand heights live vs new, gate D14), `dl1.sh clip url` (download a finished Kling job,
   keeps the v20 take as `b3/prev/<clip>.v20.mp4`; copy a later take to `<clip>.r1.mp4` by hand BEFORE downloading a retake).
6. Kling input images: upload `tight/<god>_<style>_tight.png` with the Kling `file_upload` tool (ticket) via `b3/up.sh`;
   the resulting URLs go to `tight/urls.json` (never print them, never commit them).

## 4. Step A — analyse before spending credits

Per god, before writing any prompt:
- [ ] Read the god's skills (sim-core / gods-data), live sheets (size, KB, RAM), the game FX colour, how the stand plays each slot
      (ranged / melee / buff / bolt), and ALL of Maxim's open remarks for this god (section 11 + notes `todo` on the stand).
- [ ] Decide per action slot which of three reads it is and write it into the notes:
      **melee** (the god leaps to the enemy, strikes, returns), **ranged** (a clearly visible projectile from the weapon to the target),
      **buff/heal** (something visibly flies from the god to the allies).
- [ ] Decide where the baked effect leaves the body. **The same sheet is also shown when this god stands at the TOP of the screen
      among the enemies** (Maxim 13.11 15:34): the baked effect must read in both positions, so it is short and close to the
      weapon/hand; its direction is not important (the game draws the flight to the real target from `wf`). Never build a clip
      around "shoot straight up". Write what the game draws next from exactly that point.
- [ ] Look at the art. If it is bad/inconvenient (weapon far taller than the head, cut parts, copyright-like look) — tell Maxim,
      he orders a redraw from ChatGPT. Do not burn credits on bad art.

## 5. Step B/C — prompts and Kling

**Settings:** `image_to_video`, model `kling-video-v4_0`, duration 3 s, 720p, first frame = tail frame = the tight image,
no sound. One `taskTraceId` per batch. 30 credits per clip.

**Flow (Maxim 13.11 15:36, replaces "batch → wait for approval → next batch"):** nothing waits for a whole batch.
Clips are still sent to Kling in packs of 5 gods (all clips of the pack at once; poll `query_tasks` at most 3-4 in parallel), but
EACH clip goes on alone as soon as it is ready: video gate G1 → cut → G3 → fresh-eyes reviewer agent on THIS clip only (section 10)
→ no objections → published to the stand at once (section 9). The next pack of 5 is sent when the previous pack has been sent out
to Kling; Maxim looks at the stand whenever he wants and his remarks are fixed in the same flow (they never stop the line).
He checks on the SITE only — never send him archives or files to look at.

**Takes:** one take per clip. A retake only for a concrete, named defect. Never "a second variant just in case".
If the same defect survives 2 retakes — stop retaking, show Maxim and ask (the art or the idea is the problem).
Copyright refusal of the prompt (trademarked names like "Mjolnir") is not charged: reword with neutral names.
`SENSITIVE_RESULT` refusals caused by the art itself (Lilith BT, Loki TI) are not fixed by rewording — ask Maxim.

**Prompt template (keep every sentence; fill <…>):**
```
Fixed camera, the flat gray background stays exactly the same color and brightness the whole time, no camera movement, no camera shake, no zoom.
<Short visual description of the god> keeps the same size (never steps toward or away from the camera) and faces the viewer most of the time;
the whole body moves: <2-3 body moves: small side steps / hip and torso turns / crouch / kneel>. Everything stays inside the frame all
the time: no jumps, no floating, no spinning around, steps only to the side and never toward the camera; the feet, the head, the hands
and the weapon never leave the frame; a raised hand goes no higher than <the head>. <Skill name / "Basic attack" / "Idle">.
<Weapon rule for this god>. <Timeline: what happens in the first third of a second / first second, the release, the recovery>.
Then <effect> fades and <he/she> returns to the starting pose.
No arc-shaped or crescent light trails, no sweeping slashes, no circles or rings anywhere, nothing glows on the ground.
Rich, clearly visible <god FX colour> effects, medium brightness, in both the effect and the glow on the body.
All moves are smooth and continuous, no sudden jumps, no flicker. The body stays solid and fully visible in every moment: never fades, never turns transparent or ghostly, no smoke or haze
rectangle, no explosion filling the frame. No white-out, no lens flare, no starburst, no star-shaped
or cross-shaped glint, no burst of rays, no full-frame flash, no smoke filling the frame; nothing flies in from the edges;
effects stay close to the body and never touch the left and right
edges of the frame. Nothing is aimed flat horizontally into the left or right edge. The end pose equals the start pose.
```

**Motion rules for prompts:** (projectiles: see section 12, 13.11 ~17:40 — the power gathers on the weapon, the GAME draws the flight)
- **The WHOLE body moves in every clip** (Maxim 13.11 15:34: "only the arm bends, the rest is a static picture — bad"):
  legs step and the feet move, hips and torso turn, knees bend, crouch, kneel — wanted. Name 2-3 body moves in every action
  prompt, not only the arm/weapon. Feet glued to one spot for the whole clip = defect (G1.10). [13.11 ~16:50, tight canvas kept:
  in ACTION clips NO hops, NO floating, NO spinning around — they took tails, bows, capes and heads out of the frame for 0.5-2 s.
  Maxim allows them in principle; on the tight canvas they do not fit.]
- Never a figurine on a turntable (the body rotates while the feet stay glued). Turns of hips/torso with stepping feet; a full spin
  only in an idle and only if nothing leaves the frame. Back to the viewer only for a moment.
- Same size all the time: no step or lunge toward/away from the camera (the god must not become a giant when leaping to the
  enemies). Steps to the side, turns, crouches are fine — they do not change the size.
- **Timing:** wind-up SHORT — basic: first third of a second; super/ult: first second; then a long relaxed recovery.
- **Melee (tight canvas): the weapon moves only vertically** — "raises the <weapon> straight up above the head, then chops straight
  down in front of the centre of the body like chopping wood" or "thrusts straight up". Never "slash/swing/cross slash/sweep".
  The BODY still moves with the blow: a step to the side, the hips turn, the knees bend into the chop.
- **Weapon never at full arm's length** to the side or above the head; a staff at most a little above the head; or kneel.
  Staffs/torches: "the staff stays upright the whole time, never tilts, swings or lies horizontally".
- **Aim direction is free** (Maxim 13.11 15:34, replaces "never aim sideways / aim up"): the god also stands at the top of the
  screen, so "up" means nothing. A bow may point slightly up to the side, even toward the ally side; only not flat horizontal
  into the frame edge. What matters: the weapon stays CLOSE TO THE BODY — bent arm, never the arm fully stretched out
  (a fully stretched arm in every take was the real defect). The game draws the arrow to the target from `wf`.
- **Never shoot a real projectile at the viewer** (an arrow with effects fills the frame and the cut shows). Firearms only
  (Blackbeard pistols, Van Helsing TI rifle): a BLANK shot toward the viewer — smoke puff, nothing flies; the game draws the shot.
  Recoil proportional to the weapon (small shoulder kick, not a full-body lunge).
- A god with a bow does not have to shoot in all 3 skills: other actions are fine (e.g. a raised bow gathering power, a ritual).
- **Weapons are used:** an archer really draws the string and releases it, bow close to the body; the arrow leaves the bow along
  its flight (any direction slightly up; short, the game continues it).
  Nothing appears "from emptiness / from the top of the bow". No string jerked back and forth. A crouch is fine when it is smooth
  (no instant drop-and-pop-up within a few frames).
- **Idle:** slow and smooth only, alive for the WHOLE loop, no pause, no "twitch — freeze — twitch", not only breathing.
  Name continuous actions: torso/hip sway, slow step to the side and back, knees bend, head left then right, shoulders roll,
  re-grip, cloth. The weapon is never raised or aimed in idle. No dancing.
- **Super/ult differ clearly from the basic** and have real magic (not "the same pose slower", not a plain pose).
- Wide effects (wings, rings, fans, tails) must fit the tight canvas by changing the idea: tall and narrow, gathered into a bundle,
  halo instead of open wings, effect close to the body.

**Words that break Kling (never use / always add):**
- "burst" → starburst. Write "curls around it and rises straight up".
- object similes ("lantern-like") → a real lantern appears.
- smoke/vapor → darker background: "the vapor stays thin and close to the body".
- water/fire "around the body" hides the body: "behind the back and beside him, face and chest stay visible".
- magic gathering: add "no threads or lines of light in the air, nothing flies in from the edges".
- transformations: add "no wings, no feathers" unless wanted.
- Heracles: "the lion head on his shoulders never moves and never covers his face".
- trademarked names → neutral ("Hammer Strike", "northern storm god").

## 6. Step D — video gate (before cutting; look at it, do not assume)

For every downloaded clip run `b3/strip.py` (7 frames) and, for doubtful ones, look at more frames. Reject = named retake.
- [ ] G1.1 Same size (no step toward/away from the camera), mostly faces the viewer, back only for a moment.
- [ ] G1.10 The whole body moves: not only one arm. Feet/legs, hips, torso visibly move during the action. `b3/legs.py <clip>`:
      feet_max < ~2.5 % AND hips_max < ~5 % of the figure height = glued = retake (a kneel/crouch counts as moving); then LOOK —
      the meter cannot see a body that only bends at the elbow. Weapon arm never fully stretched out.
- [ ] G1.2 No forbidden light (L7), background never brightens/darkens.
- [ ] G1.3 Nothing aimed flat horizontally into a side edge (slightly up to the side is fine); weapon moves as prompted (melee vertical).
- [ ] G1.4 Edges (Maxim 13.11 16:04): the body, a hand, the head or the weapon may leave the frame ONLY for a split second during a
      sharp move (≤ ~0.2 s = ≤ 5 video frames at 24 fps). Half a second (a raised hand cut by the top edge, a hop with the head
      out, half a sword, a fan slowly leaving, a weapon held outside) = reject, even if everything else is good. Check it on a dense
      grid (every 3rd frame; `b3/edges2.py` counts edge frames incl. effects — LOOK which part is outside). An effect that flies
      off and is cut without a game continuation = reject.
- [ ] G1.11 Camera (Maxim 13.11 16:04): no camera shake, jolt, zoom or jump in size — the feet line and the figure size stay steady
      from frame to frame (a landing or a strike must not shake the picture). Any shake = reject.
- [ ] G1.5 No arcs/crescents/rings across the frame, no burst in all directions to every edge.
- [ ] G1.6 Idle: `b3/mmask.py <clip>` silhouette motion ≥ ~22 % (14-17 % reads frozen) AND visually alive the whole loop
      (`b3/motion.py`: no part of the loop below ~1 except start/end). Not dancing.
- [ ] G1.7 Action: short wind-up, clear release moment, smooth recovery, no flicker.
- [ ] G1.8 BT and TI of the same slot are equally rich (BT not poorer than TI).
- [ ] G1.9 Write a one-line verdict per clip in `b3/review<N>.md` (OK / WATCH: why / RETAKE: defect).

## 7. Step E — cutting (adapter)

`b3/frames_h.sh <clips>` (frames at 420 px) then
`KL_HERE=/home/claude/kl/work python3 tools/adapt_batch.py <clips…>` (2 workers, ~1 clip/min at 420 px frames).
Adapter v21 (13.11): budget PER ANIMATION against the matching live sheet (`live_ref`: own slot or the slot the game repeats);
idles are cut first, every action of the same god-style takes the idle's stored body px (`idle_body_px`, L4); if the content
does not fit 180×220 at that scale the window is cropped AROUND THE BODY (flag `crop`), and cutting solid body/weapon pixels
gives the defect `solid_cut(x%)` (≤1 % = a fast tip, look at it; more = re-shoot compact); `body_small` if the body ends < 97 % of
idle; `skip` raises an error (L6). Matting keeps dark saturated effects (dark-green vines no longer turn into dotted lines).
Metrics carry `live: {key, kb, ramMb, kbPct, ramPct}` and `v: 21`.
**Never run two adapter processes at once** — each rewrites `adapted_all_metrics.json` and the last one deletes the other's entries.
After a run: number of metric entries must grow by exactly the number of new clips.

Overrides `work/impact_overrides.json` per clip:
- `imp` video frame of the real release, `k` sheet frame it must land on, `v0`/`v1` first/last video frame used.
  Release frame k: ranged basic k=5, melee basic k=4, super/ult k=9, instant bolts (Zeus, Indra, `proj:'bolt'`) k=12.
- If the wind-up is long: start later (`v0` = release − ~10 video frames). Never compress a long wind-up into 4-5 frames.
- `skip` is FORBIDDEN (L6). Existing skips are to be removed (section 11).
- `wf` = [x, y] fraction of the sheet frame = the exact point where the baked effect leaves (weapon tip, string, hand, shield
  centre, top edge where a beam exits). Set it by LOOKING at the release frame (mark it on the frame image).
  The automatic point often lands on the top edge of the bbox — always verify, every action clip.
- `body_min` = the god's idle body px for EVERY action clip (L4). The adapter must never pick a smaller body to fit the frame or the weight;
  if the clip does not fit at that body size, the clip is rejected and re-shot with a compact motion.
- When a clip is re-shot, CLEAR its old overrides (imp/k/v0/v1/wf) before re-cutting — stale values are wrong for the new take.

**Sheet gate G3 (every sheet, look at the 5×5 QA sheet in `work/qa_sheets/`):**
- [ ] No `vanish_area` / `explode_area` / `frozen_*` flag (L9). If present: re-cut (different matting/frame range) or re-shoot.
- [ ] `raw_edge_clip`: open the frames and check G1.4; the flag alone says nothing.
- [ ] Body is whole in every frame (no missing body, ghost-transparent body, transparent legs, grey haze rectangles).
- [ ] Body px of the sheet = the god's idle body px (L4). Smaller = reject (re-shoot with a compact motion), never accept.
- [ ] Margins ≤ 3 px (`b3/margins2.py <god>`); size ≤ L2; weight per sheet ≤ L1: `live.kbPct` (file) and `live.ramPct` (RAM)
      in the metrics; report RAM/KB above ~110 % to Maxim with the numbers.
- [ ] Release frame = k and `wf` sits exactly on the effect origin.

## 8. Step F — game effects on the stand (`assets/fx2-stand.js`)

- Left arena (`BR.isProposed === false`) = live game: its code path must stay byte-for-byte equivalent to the previous version.
  Every new behaviour is wrapped in `F.newSheet(kind, u)` (true only in the proposed arenas on a new sheet).
- Time: start effects at the REAL release of the sheet: `F.relDt(kind, def)` (relative to now) / `F.relT(kind)` (absolute);
  `F.at(dt)` is relative. Gods in `OLD_SIG` get the release pulled to 0.5 s and their `anticip` timers squeezed into
  [.28, .485) — use `F.atRaw` where the squeeze is wrong. Target: no god keeps code-fixed timing (section 11, T1).
- Origin: `F.wp(kind, u)` (= sheet `wf`). Never the neck, chest, belt, feet, shoulder or "emptiness".
- Order: nothing flies before the hand/weapon that throws it is raised; damage never before the shot; leaps fast and on the hit.
- Every baked effect that leaves through an edge gets a visible game continuation from that point to the targets
  (sky strikes: first a bolt from the weapon to the cloud above the targets, then the strike).
- The projectile matches the gesture and the weapon: a drawn bow shoots a fast arrow (never a slow ball); a staff may release an orb;
  a thrown bottle is a bottle. No cheap stuff: plain radial rays (Kitsune, Athena and similar — replace), droplets,
  "5 little balls", pebbles under feet, unclear symbols, tiny wisps around the god.
- Rich and smooth: wow but soft (L7); no jerky flicker; one clear read per skill — what flew where and what it did.
- Melee basics leap to the enemy and back (stand `BR.LEAP_NEW`); check that the leap is enabled for every melee god with a new sheet.
- A game effect changed during a redo must not change "вчера": gate it with `F.today(kind, u)` (a new sheet that is not
  yesterday's frozen copy, `!A.isPrevSheet`), not with `F.newSheet` — `F.newSheet` is also true on yesterday's sheets.

**Stand gate G4 (every action slot of every god, BT row + TI row):**
`python3 b3/seq.py out.jpg <god> <slot> [n] [step_ms] [speed]` — LOOK at it.
- [ ] Game effect starts at the release frame, from `wf`, continues the baked effect.
- [ ] Nothing before the gesture; no flash at hits (L7).
- [ ] Who-hits-whom is readable (leap / projectile / buff to allies).
- [ ] Left arena unchanged vs the previous version (same series on the left).
- [ ] `node -e "new Function(require('fs').readFileSync('assets/fx2-stand.js','utf8'))"` passes; no console errors (`shot3.py`).

## 9. Step G — notes, balance, publish

- Notes live in `work/kling_done.json` per god: `notes` (per slot, Russian, what was done and what to look at), `todo`
  (per slot: EVERY open remark of Maxim, verbatim meaning), `balance` (proposal with numbers from minimum to maximum
  progression: e.g. −10 %/10 s → −25 %/20 s). No generic template text — every note is about this god's real clip;
  never claim what the clip does not do ("weapon never leaves the frame" when it does).
- Balance direction (Maxim): fewer samey skills; a long weak effect beats a short huge one; supports deal more own damage.
- Every remark Maxim makes goes the same day into: this file (if it is a general rule) AND the god's `todo` on the stand.
  Nothing may live only in the chat.
- **Old/new switch (Maxim 13.11 15:36):** in the two proposed arenas (middle = BT, right = TI) every slot has two versions:
  "вчера" = the sheet that was published before the current redo (v20, files `assets/sheets/v20/`), "сейчас" = the new one.
  The left arena (live game) always has one version (L8). A clip goes live on the stand as "сейчас" as soon as it passed its
  review — the other slots of the god keep their previous sheet. Until a slot is redone, "сейчас" = "вчера".
- Only gods listed in `kling_done.json` show new sheets.
- Publish one or a few reviewed clips: `bash b3/pub1.sh "<msg>" <clip…>` — it locks, bumps the kling_done version, freezes
  yesterday's sheets and metrics (from commit 66ef083 = site v20) into `assets/sheets/v20/` and `work/metrics_v20.json` if
  missing, copies the sheets, rebuilds the manifest, bumps `?v=`, syncs `pipeline/`, commits and pushes.   The manifest is built from `work/metrics_pub.json` = metrics of PUBLISHED cuts only (pub1 copies in the listed clips);
  `adapted_all_metrics.json` also holds fresh unreviewed cuts and must never feed the site (13.11 v22 bug: Kitsune/Artemis/
  Zeus/Demeter sheets were declared with the new sizes while the old files were served — fixed in v23). `b3/sizecheck.py`
  (every `src` in gods-data.js exists and its size = sheetW×sheetH, incl. v20 packs and static refs) runs before every commit.
  pub1 refuses before writing anything when a clip id is not god_style_slot, has no v21 metrics, no sheet, is a take/rejected,
  its god is not in kling_done, or the repo has uncommitted changes other than PLAYBOOK.md (code goes in its own reviewed commit);
  on a later failure or signal it restores kling_done / metrics_pub / metrics_v20 and resets the repo files to HEAD. It commits
  only assets, index.html, pipeline, PLAYBOOK.md; scans staged file names and content (patterns in `b3/secret_patterns.txt`,
  scanned from a file, not a pipe); waits until the live site serves the new `?v=` (exit 3 = pushed but not live yet — do NOT
  re-run). Run it with a tool timeout of ≥ 600 000 ms.
  By hand (only if pub1 cannot be used; take the lock `/tmp/gods-pub.lock` first), the steps are: freeze "вчера" BEFORE
  overwriting (copy the 66ef083 sheet into `assets/sheets/v20/`, its metrics into `metrics_v20.json`); raise `kling_done.ver`
  to max(ver, current `?v=`)+1 (it is the sheets' `?k=` cache key); copy sheets (no `*take*`, `*rejected*`, no extra underscores); copy the
  clip's metrics from `adapted_all_metrics.json` into `metrics_pub.json`; rebuild the manifest
  (`KL_HERE=… KL_REPO=/home/claude/gods-anim-lab python3 tools/build_full_manifest.py`); run `b3/sizecheck.py` (every manifest
  `src` exists and its size = sheetW×sheetH, incl. v20 packs and static refs); bump `?v=` in index.html; commit (not the root
  `gods-data.js`, no tokens/urls); push; verify the live site serves the new `?v=` and loads without errors.
- "вчера" for a clip published for the first time after v20 shows the old reference/static sheet (builder `FIRST` set).

## 10. Step H — fresh-eyes check and report

- Per clip (flow): a separate reviewer agent (has not seen the chat) checks THIS clip — its strip/QA sheet, the stand series and
  the rules of sections 2, 5, 6, 7 — before it is published. "No objections" → publish at once; objections → fix or retake.
- After code changes and before telling Maxim "ready": a separate reviewer agent checks the diff against this file;
  fix CRITICAL/IMPORTANT, max 2 rounds. Before the report, also re-read section 11 and tick every item touched.
- Report to Maxim (Russian, short): what is published; per god what changed; WATCH list (clips you are not sure about, why);
  exceeded limits with numbers; what needs his decision; what is NOT done yet. Never hide an unfinished item.

## 11. Current state (13.11.2026, site v25) — open work

**v24-v25:** Artemis BT idle and Kitsune BT idle (WATCH: ~0.5 s still seam) published; Athena TI hyp R3 (compact, WATCH: glow
~1.5 s). pub1 hardened after the 2nd review (secret scan from a file, real rollback after `git add`, clean-tree precheck,
max(ver, ?v=)+1, signal traps, clip-id check). Open R3/R4: Kitsune actions (Maxim: almost no steps), Zeus and Artemis (Maxim:
power gathers on the weapon, the game draws the flight; Artemis without drawing), Demeter BT atk/hyp (sickle vanishes →
retake), Demeter TI hyp (staff tilts), idles: Athena TI, Kitsune TI, Artemis TI (seam freeze), Demeter BT (glued); Zeus BT
idle WATCH (hand over the mouth ~1 s).

**v22-v23 (13.11 afternoon):** Athena BT idle R2 published (+ BT actions re-cut to its height). v22 built the site from fresh
UNPUBLISHED cuts (Kitsune/Artemis/Zeus/Demeter declared new sizes on old files) → v23 builds from `work/metrics_pub.json` only,
`b3/sizecheck.py` gate, pub1 hardened (pipefail, prechecks, restore, live-version wait). Old defect found: Agni TI atk and Indra
BT hyp/sup, TI idle/sup — metrics never matched the served files (since v20); w/h corrected in metrics_pub and metrics_v20, but
fig/wf/rel/kb of these 5 are still from another cut → re-cut and publish them together when these gods are redone (D15).
R2 actions 16/16 + Zeus retakes 3/3 rejected (edges, aim, glow); Maxim kept the tight canvas → R3 compact prompts sent (21 jobs).

**Done in v21 (gods 1-5: Kitsune, Athena, Artemis, Zeus, Demeter — all 40 sheets re-cut with adapter v21):** D14 height bug found
in the manifest (the body ratio was applied twice → new gods ~1/ratio taller): fixed, `hcmp.py` shows equal heights. Bodies of
action sheets = idle (193-199 px, Demeter TI 178). Per-animation weight 63-100 % KB of live; RAM up to 117 % on some action sheets
(live sheets of these slots are narrow). No skips. wf set by eye for all 30 action sheets. 39 Kling jobs, 1 170 credits (26 + 13 named retakes).
Stand weight line now shows each animation vs its live sheet (%). Demeter BT/TI atk: new glowing grain projectile (new sheets only);
Demeter hyp game effect now starts at wf (sheaf / staff gem, new sheets only); Demeter BT sup wf moved from the feet to the hands
(Maxim 12.11: "effect from the feet"). Fresh-eyes review round 1 fixed: adapter takes the action body ONLY from the v21 idle
(error if that idle is not cut yet; a body_min override can only raise it; all old body_min/body_max overrides deleted), `skip`
is refused before the run starts, crop "B" and a negative `pad` get the soft edge, the root `gods-data.js` is no longer written.
Edge exits left for Maxim (2nd attempt each): Kitsune TI sup tail tips out of the top ~0.5 s; Artemis bow upper limb at the top
edge ~0.4-0.5 s (bt_hyp, ti_atk) and an "X" of string + trail in ti_atk. [13.11 16:04: ~0.5 s exits are now rejects (G1.4).]
Open from this batch: Artemis aims 50-60° up, not vertical (Kling ignores "vertical" after 2 tries) — Maxim decides (accept /
redraw art with the bow raised / other actions); Kitsune BT sup "5 little balls" game part; Athena ult rays; Demeter sup game part
(yellow bits, crooked stalks); Athena BT atk golden pillar visible during the return leap; T1 timing conversion for these gods
(they are still in OLD_SIG, but sup/hyp release on the stand matched the sheets in the seqz check).

**Defects to fix first (published with errors):**
- D1 Ares: only 1 of 8 clips cut (`ares_ti_atk`); 7 slots still show the old static Gemini pictures; notes claim done. Cut all, check, fix notes.
- D2 Body lost/ghosted in published sheets: Veles BT sup (fr 19-21 body gone), Koschei TI hyp (fr 7 only the egg), Kali TI hyp
  (fr 7 ghost), Poseidon BT sup (fr 11 transparent legs), Silent TI sup (fr 13-17 grey haze). Re-cut or re-shoot.
- (artemis + zeus done in v21) D3 `skip` still used in 19 sheets: apollo bt_hyp, ti_atk, ti_hyp; artemis bt_atk, bt_sup, bt_hyp, ti_atk, ti_sup, ti_hyp (10-17 frames cut);
  brynhild bt_atk, ti_hyp; erlang bt_sup, ti_sup, ti_hyp; heimdall bt_hyp; indra ti_hyp; zeus bt_atk, ti_atk, ti_hyp —
  remove skips, re-cut; where the clip is unusable without a skip, re-shoot.
- D4 Jumps: Ra TI atk (frame 5→6), Surt BT atk (frame 12 is a blurred arc instead of the body).
- D5 Long edge exits: Erlang BT atk (spear outside frames 0-14, arcs across the frame — violates the vertical-only rule, re-shoot),
  Surt BT atk (fire trail outside 7-11), Amaterasu BT hyp and Artemis TI atk (8 frames at the edge).
- D6 Flashes at hits: Hou Yi hyp, Erlang sup (white star at hit), Silent TI sup (at the feet).
- D7 Hou Yi: draws the string but aims flat horizontally right with the arm fully stretched in atk and hyp — re-shoot: bow close to
  the body, slightly up (any side), the body moves; or another action; never at the viewer.
- D8 Notes: Maxim's 04:00 remarks are missing in `todo` for ~30 gods (incl. Agni, Erlang, Hou Yi, Heimdall, Ra); 35 gods have a
  generic template in notes and balance ("visual only", "strikes in front of him", "weapon never leaves the frame" — false for some).
- D9 Weight: the v20 numbers compared totals (4 new vs 2-3 live) — re-measure per animation (L1) and report only real per-sheet excess.
- (done v21) D10 Kitsune: no `wf` on any of its 6 action sheets.
- D11 Idle too static by measurement: Llorona BT, Lilith TI, Demeter BT, Amaterasu BT, Hel BT (the last two had exactly this remark).
- (gods 1-5 fixed in v21; other gods still open) D13 L4 broken in v20: action sheets store the body 15-28 % smaller than idle (Hou Yi 142 vs 198 px). Measure every action sheet;
  re-cut at idle body size where it still fits L1/L2, otherwise re-shoot with a compact motion. Never "keep smaller".
- (cause of the +12 % height fixed for ALL gods in v21: manifest; sharpness fixed only for gods 1-5) D14 Sharpness/height vs live (Kitsune example): live idle stores the body at ~243 px (frame 214×290), the new idle at ~149 px
  (frame 145×195) → upscaled ~1.6× on screen = blurry. Cause: the old budget split the TOTAL live weight over 4 sheets. Re-cut every
  sheet with the per-animation budget (L1) so the stored body ≈ live body px. The new goddess also shows ~12 % taller than live (crown point measured
  differently in `fig.top`). Gate: on the stand the new god's height = live height ±3 %, and stored body px is reported vs live.
- D12 Van Helsing TI idle: body turns ~45° — verify the turn comes from the feet stepping, else re-shoot.

**Technical:**
- T1 Only 6 gods (Hou Yi, Inti, Erlang, Brynhild, Agni, Van Helsing) take the real sheet release; ~45 gods still bend the sheet to a
  fixed code time (OLD_SIG 0.5 s snap, anticip squeeze). Convert every god to `F.newSheet` + `F.relDt` + `F.wp`.
- T2 Melee leap with new sheets is enabled only for Brynhild; check Surt, Susanoo, Thor, Lu Bu, Ares and every melee god.
- T4 Adapter budget: today it splits the god's TOTAL live weight over 4 sheets (shares 31/23/23/23 %) → sheets too small, blurry.
  Change to a per-animation budget: each sheet ≈ its matching live sheet (soft), body at idle size (L4).
- T3 Repo: 198 unused `ref-*` files (1.7 MB); stray `*_take1_rejected` entries in metrics; root `gods-data.js` is junk.

**Maxim's open remarks (not done):**
- Heimdall: super and ult game effects "not wow" — make them rich.
- Ra: TI attack jerks; super too simple; ult game effect (boat) bad.
- Brynhild: attack leap sluggish and not on the hit.
- Inti: ult maybe too bright (check).
- Van Helsing: super too simple, no magic (TI: only a blue glow at the hand); shot effect; bottle must look like a bottle.
- Kitsune: anime super; "5 little balls" in BT; tails/fan exits. Athena: ult rays cheap, stones under feet.
- Demeter, Hel supers: remarks of 12.11 (no link, yellow bits, effect from the feet) — verify fixed.
- WATCH (best take kept, Maxim to look): Wukong TI atk (ring lines), Susanoo TI atk, Dracula TI atk (cape), Sting TI hyp (fire left),
  Kali sup (BT+TI), Susanoo sup, Heracles BT hyp (lion hood over the face), Hecate BT idle, Lucifer BT hyp (rings), Loki TI hyp (ground ring).

**Waiting for Maxim's decision:**
- Lilith BT and Loki TI: Maxim gets the art redrawn; then shoot again.
- Lu Bu TI: try the current art first: in atk he drives the halberd DOWN (as in the old version) + add magic effects; in sup/hyp the
  halberd does nothing (stays still, low). Only if it fails → put him on the redraw list.
- Redraw list: keep one list of gods whose art fails (copyright refusal, weapon does not fit, body too small) and give it to Maxim
  in one go; he orders the redraws.
- Balance: per god, write on the stand what to change in the skills; may be done by a separate parallel agent (balance only).

## 12. Log of Maxim's rules (append new ones here, newest last, with date)

- 12.11 Kling for both games; one screen stand with the live game on the left; all gods from the start.
- 12.11 Weight/RAM ≤ live; 180×220 only a ceiling; tight input; music not needed; bad art → tell him.
- 12.11 No blinding flashes; effects not cheap; rich WOW baked effects (do not over-correct into "no effect").
- 12.11 Same height for all; no growing toward the camera; giant-at-the-enemy problem.
- 12.11 Edge exits: fast = ok, slow/long = bad; cut effect continues in the game from the same point.
- 12.11 Idle alive the whole loop, feet move, no figurine; enemies are at the top — aim up, not at the belly.
  [superseded 13.11 15:34: aim direction is free, the god also stands at the top]
- 14.10 (gods standard) One frame for all, same body scale in idle and strikes; if it does not fit — change the drawing/motion,
  never shrink the god or change the frame.
- 12.11 night: body quality never traded for effects; weapon never at full arm; never aim sideways [superseded 13.11 15:34:
  only not flat into the edge]; no bursts to all edges;
  sync (nothing before the gesture); projectile looks like the thing; crop unused space.
- 13.11 Do not move agreed limits; tight canvas only; never change a rule quietly — ask.
- 13.11 Who hits whom: melee leaps, ranged projectile, buff flies to allies; game effect and baked gesture are one gesture;
  "not sideways" ≠ "only up" (viewer + blank shot ok); recoil proportional; BT as rich as TI; "fixed" = seen.
- 13.11 04:00 Effect follows the animation, never the reverse; no skips/cuts; turning only through the feet [= the feet step
  with the turn; it never meant "feet glued"]; weapons are used;
  origin = the gesturing hand/weapon; supers need magic; nothing before the hand is raised; comments repeat — re-read all.
- 13.11 (13:49) Batches of 5 gods with his approval between batches, until he says "send everything" [superseded 13.11 15:36:
  clip-by-clip flow, see section 5]. Weight per animation, soft.
  Crop all unused space. Prompts must prevent vanishing body/haze/explosions. Projectile matches the weapon. No real shot at the viewer;
  blank shot only for firearms. Archers need not shoot in every skill. Balance notes on the stand (separate agent possible).
- 13.11 Fresh-eyes check of all work; this playbook is the single rule set for new chats.
- 13.11 Lu Bu TI: try the current art (halberd down in atk). Failing gods → one redraw list for Maxim.
- 13.11 (14:21) Maxim allowed: Claude reads the uploaded input-image links and passes them to Kling (needed to start jobs).
  They stay private: never printed in the chat, never committed.
- 13.11 v21 lessons (technical, not new rules): "aim straight up / vertically" is ignored by Kling for archers (50-60° at best,
  2 tries); an idle needs "shifts the whole weight from one leg to the other, sway large enough to be seen from far away" to pass
  the 22 % gate; "lightning only on the fist and the staff, skin and robes keep their colours" stopped the ghost-white body.
- 13.11 (15:34) Maxim on v21: (1) no task to shoot "up": the same god later stands at the top among the enemies; aim may go slightly
  up to the side, even toward an ally; the bow close to the body, the arm NOT fully stretched (it was stretched in every take).
  (2) Characters must MOVE: in Zeus anime only the forearm rises, the rest is static — bad; almost all characters have glued feet.
  Allowed and wanted: step, turn, spin, crouch, hop / float a little. Rules updated: sections 4, 5 (template, motion), 6 (G1.1, G1.10).
- 13.11 (15:36) Maxim: he checks on the SITE, not in archives. Clip-by-clip flow: Kling video → fresh-eyes agent checks the ready
  clip (not the whole pack) → no objections → straight onto the site; nothing waits for a pack. Packs of 5 for sending are fine.
  Stand: in the middle and right arenas two buttons per slot — "as yesterday" and "as now"; the left arena keeps one version.
  If rules contradict each other — re-read all rules, add everything discussed, change the rules that caused the error.
- 13.11 (16:04) Maxim: (1) no camera shake — written as G1.11 and "no camera shake" in the template. (2) A part of the body or the
  weapon out of the frame is allowed only for a split second in a sharp move; Zeus's raised hand cut by the top edge for about half
  a second is NOT allowed — G1.4 tightened from ~0.3 s to ≤ ~0.2 s, template line "raised hand no higher than the top of the
  weapon / head, a hop is small". Cause: the tight canvas has little headroom and the R2 prompts asked for hops / raised arms
  without a height limit.
- 13.11 (~17:40) Maxim, after 3 failed takes each: (1) KITSUNE actions — almost no steps: crouch and torso/hip turns, feet stay
  in place (her wide tails leave the tight frame at any step). (2) ZEUS, ARTEMIS and in general every projectile: in the clip the
  power only GATHERS on the hand/weapon (lightning ball in the fist, glowing arrow on the bow); the flight (bolt, arrow, flame) is
  drawn by the GAME from wf toward the targets — nothing flies out of the clip. (3) ARTEMIS shoots without drawing: the bow is held
  at the chest, a glowing arrow appears above/on the bow and is released by the game; never an aimed pose with a stretched arm.
- 13.11 (~16:50) After 16/16 R2 actions and 3/3 Zeus retakes were rejected (edge exits of tails/bow/fan/flame/cape for 0.5-2 s,
  Artemis arm stretched and aiming ~flat right, rings/crescents/lens flares/body glow, background tint) Maxim chose: KEEP the
  tight canvas (L3), make the moves compact. Rule for ACTION clips (idles keep their own rules): steps only to the side and small,
  crouch / kneel, torso and hip turns; NO jumps, NO floating, NO spinning around; never a step toward the camera; tails, cape,
  sleeves stay folded close to the body; the weapon stays close (bow tilted ~45° up in front of the chest, elbows tucked,
  half draw; staff exactly vertical); baked effects are SMALL and leave or fade at once near the weapon (no columns, beams or
  bolts lingering at an edge) — the game effect continues from wf; light only on the effect, never on the face/body/background.
  Template sentence: "Everything stays inside the frame all the time: no jumps, no floating, no spinning around, steps only to
  the side and never toward the camera; the feet, the head, the hands and the weapon never leave the frame."
