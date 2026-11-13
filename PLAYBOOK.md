# Gods animation playbook (Kling → sprite sheets → stand) — the ONLY rule set

Project: «Битва титанов. Сумерки богов» (BT) + its anime clone Titan Idols (TI). Owner: Maxim, game designer, not a programmer.
This file replaces every older rule list (old KLING_RULES versions are cancelled). Version 1, 13.11.2026.

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
   Needs: `pip install --break-system-packages rembg onnxruntime scipy pillow numpy playwright && python3 -m playwright install chromium`, ffmpeg.
3. Stand locally: `cd /home/claude/gods-anim-lab && python3 -m http.server 8765` (stop it when done; no hanging processes).
4. Clip name = `<god>_<bt|ti>_<idle|atk|sup|hyp>`; sheet file = `<god>-<bt|ti>-<slot>-<mob|lite>.webp`.
5. Kling input images: upload `tight/<god>_<style>_tight.png` with the Kling `file_upload` tool (ticket) via `b3/up.sh`;
   the resulting URLs go to `tight/urls.json` (never print them, never commit them).

## 4. Step A — analyse before spending credits

Per god, before writing any prompt:
- [ ] Read the god's skills (sim-core / gods-data), live sheets (size, KB, RAM), the game FX colour, how the stand plays each slot
      (ranged / melee / buff / bolt), and ALL of Maxim's open remarks for this god (section 11 + notes `todo` on the stand).
- [ ] Decide per action slot which of three reads it is and write it into the notes:
      **melee** (the god leaps to the enemy, strikes, returns), **ranged** (a clearly visible projectile from the weapon to the target),
      **buff/heal** (something visibly flies from the god to the allies).
- [ ] Decide where the baked effect leaves the frame (usually the TOP edge — enemies are at the top of the screen)
      and what the game draws next from exactly that point.
- [ ] Look at the art. If it is bad/inconvenient (weapon far taller than the head, cut parts, copyright-like look) — tell Maxim,
      he orders a redraw from ChatGPT. Do not burn credits on bad art.

## 5. Step B/C — prompts and Kling

**Settings:** `image_to_video`, model `kling-video-v4_0`, duration 3 s, 720p, first frame = tail frame = the tight image,
no sound. One `taskTraceId` per batch. 30 credits per clip.

**Batching:** batches of 5 gods. Shoot 5 gods → cut → stand → Maxim checks and approves → next 5. Continue so until Maxim
explicitly says "now send everything". Inside a batch all its clips are sent at once. Poll `query_tasks` at most 3-4 in parallel.

**Takes:** one take per clip. A retake only for a concrete, named defect. Never "a second variant just in case".
If the same defect survives 2 retakes — stop retaking, show Maxim and ask (the art or the idea is the problem).
Copyright refusal of the prompt (trademarked names like "Mjolnir") is not charged: reword with neutral names.
`SENSITIVE_RESULT` refusals caused by the art itself (Lilith BT, Loki TI) are not fixed by rewording — ask Maxim.

**Prompt template (keep every sentence; fill <…>):**
```
Fixed camera, the flat gray background stays exactly the same color and brightness the whole time, no camera movement, no zoom.
<Short visual description of the god> keeps the same size, feet planted on the same spot, and faces the viewer the whole time,
chest toward the viewer; never turns the back or the side to the viewer. <Skill name / "Basic attack" / "Idle">.
<Weapon rule for this god>. <Timeline: what happens in the first third of a second / first second, the release, the recovery>.
Then <effect> fades and <he/she> returns to the starting pose.
No arc-shaped or crescent light trails, no sweeping slashes, no circles or rings anywhere, nothing glows on the ground.
Rich, clearly visible <god FX colour> effects, medium brightness, in both the effect and the glow on the body.
All moves are smooth and continuous, no sudden jumps, no flicker. The body stays solid and fully visible in every moment: never fades, never turns transparent or ghostly, no smoke or haze
rectangle, no explosion filling the frame. No white-out, no lens flare, no starburst, no star-shaped
or cross-shaped glint, no burst of rays, no full-frame flash, no smoke filling the frame; nothing flies in from the edges;
nothing is aimed or thrown to the left or to the right; effects stay close to the body and never touch the left and right
edges of the frame. The end pose equals the start pose.
```

**Motion rules for prompts:**
- Living character: weight shifts, knees bend, supple spine, cloth and hair move. Not only one arm moving; not everyone must jump or spin.
- Never a figurine on a turntable. Turning only through the feet stepping. Do not use: turn around, spin, pirouette, twirl.
- Same size all the time: feet planted, no step or lunge toward the camera (the god must not become a giant when leaping to the enemies).
- **Timing:** wind-up SHORT — basic: first third of a second; super/ult: first second; then a long relaxed recovery.
- **Melee (tight canvas): the weapon moves only vertically** — "raises the <weapon> straight up above the head, then chops straight
  down in front of the centre of the body like chopping wood" or "thrusts straight up". Never "slash/swing/cross slash/sweep".
- **Weapon never at full arm's length** to the side or above the head; a staff at most a little above the head; or kneel.
  Staffs/torches: "the staff stays upright the whole time, never tilts, swings or lies horizontally".
- **Never aim sideways** (allies stand left and right). Aim UP (crouching and aiming up is fine).
- **Never shoot a real projectile at the viewer** (an arrow with effects fills the frame and the cut shows). Firearms only
  (Blackbeard pistols, Van Helsing TI rifle): a BLANK shot toward the viewer — smoke puff, nothing flies; the game draws the shot.
  Recoil proportional to the weapon (small shoulder kick, not a full-body lunge).
- A god with a bow does not have to shoot in all 3 skills: other actions are fine (e.g. a raised bow gathering power, a ritual).
- **Weapons are used:** an archer really draws the string and releases it, aiming UP; the arrow leaves the bow along its flight.
  Nothing appears "from emptiness / from the top of the bow". No abrupt crouch-and-stand, no string jerked back and forth.
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
- [ ] G1.1 Same size, faces the viewer, never turns the back/side, feet planted.
- [ ] G1.2 No forbidden light (L7), background never brightens/darkens.
- [ ] G1.3 Nothing aimed/thrown sideways; weapon moves as prompted (melee vertical).
- [ ] G1.4 Edges: a FAST exit of a tip for ≤ ~0.3 s is fine; a slow or long exit (half a sword for half a second,
      a fan slowly leaving, a weapon held outside) = reject. An effect that flies off and is cut without a game continuation = reject.
- [ ] G1.5 No arcs/crescents/rings across the frame, no burst in all directions to every edge.
- [ ] G1.6 Idle: `b3/mmask.py <clip>` silhouette motion ≥ ~22 % (14-17 % reads frozen) AND visually alive the whole loop
      (`b3/motion.py`: no part of the loop below ~1 except start/end). Not dancing.
- [ ] G1.7 Action: short wind-up, clear release moment, smooth recovery, no flicker.
- [ ] G1.8 BT and TI of the same slot are equally rich (BT not poorer than TI).
- [ ] G1.9 Write a one-line verdict per clip in `b3/review<N>.md` (OK / WATCH: why / RETAKE: defect).

## 7. Step E — cutting (adapter)

`b3/frames_h.sh <clips>` (frames at 420 px) then
`KL_HERE=/home/claude/kl/work python3 tools/adapt_batch.py <clips…>` (2 workers, ~2 clips/min).
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
- [ ] Margins ≤ 3 px (`b3/margins2.py <god>`); size ≤ L2; god weight ≤ L1 (report any excess to Maxim with %).
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
- Only gods listed in `kling_done.json` show new sheets. A god goes there only when all 8 sheets passed G3 (no old placeholders).
- Publish: copy sheets (no `*take*`, `*rejected*`, no extra underscores), rebuild the manifest
  (`KL_HERE=… KL_REPO=/home/claude/gods-anim-lab python3 tools/build_full_manifest.py`), bump `?v=` in index.html,
  check every new sheet is referenced by the manifest and every reference exists, commit (not the root `gods-data.js`,
  no tokens/urls), push, verify the live site serves the new `?v=` and loads without errors.

## 10. Step H — fresh-eyes check and report

- After code changes and before telling Maxim "ready": a separate reviewer agent (has not seen the chat) checks the diff
  against this file; fix CRITICAL/IMPORTANT, max 2 rounds. Before the report, also re-read section 11 and tick every item touched.
- Report to Maxim (Russian, short): what is published; per god what changed; WATCH list (clips you are not sure about, why);
  exceeded limits with numbers; what needs his decision; what is NOT done yet. Never hide an unfinished item.

## 11. Current state (13.11.2026, site v20) — open work

**Defects to fix first (published with errors):**
- D1 Ares: only 1 of 8 clips cut (`ares_ti_atk`); 7 slots still show the old static Gemini pictures; notes claim done. Cut all, check, fix notes.
- D2 Body lost/ghosted in published sheets: Veles BT sup (fr 19-21 body gone), Koschei TI hyp (fr 7 only the egg), Kali TI hyp
  (fr 7 ghost), Poseidon BT sup (fr 11 transparent legs), Silent TI sup (fr 13-17 grey haze). Re-cut or re-shoot.
- D3 `skip` still used in 19 sheets: apollo bt_hyp, ti_atk, ti_hyp; artemis bt_atk, bt_sup, bt_hyp, ti_atk, ti_sup, ti_hyp (10-17 frames cut);
  brynhild bt_atk, ti_hyp; erlang bt_sup, ti_sup, ti_hyp; heimdall bt_hyp; indra ti_hyp; zeus bt_atk, ti_atk, ti_hyp —
  remove skips, re-cut; where the clip is unusable without a skip, re-shoot.
- D4 Jumps: Ra TI atk (frame 5→6), Surt BT atk (frame 12 is a blurred arc instead of the body).
- D5 Long edge exits: Erlang BT atk (spear outside frames 0-14, arcs across the frame — violates the vertical-only rule, re-shoot),
  Surt BT atk (fire trail outside 7-11), Amaterasu BT hyp and Artemis TI atk (8 frames at the edge).
- D6 Flashes at hits: Hou Yi hyp, Erlang sup (white star at hit), Silent TI sup (at the feet).
- D7 Hou Yi: draws the string now but aims horizontally right (at an ally) in atk and hyp — re-shoot: aim up / crouch and aim up,
  or another action; never at the viewer.
- D8 Notes: Maxim's 04:00 remarks are missing in `todo` for ~30 gods (incl. Agni, Erlang, Hou Yi, Heimdall, Ra); 35 gods have a
  generic template in notes and balance ("visual only", "strikes in front of him", "weapon never leaves the frame" — false for some).
- D9 Weight: the v20 numbers compared totals (4 new vs 2-3 live) — re-measure per animation (L1) and report only real per-sheet excess.
- D10 Kitsune: no `wf` on any of its 6 action sheets.
- D11 Idle too static by measurement: Llorona BT, Lilith TI, Demeter BT, Amaterasu BT, Hel BT (the last two had exactly this remark).
- D13 L4 broken in v20: action sheets store the body 15-28 % smaller than idle (Hou Yi 142 vs 198 px). Measure every action sheet;
  re-cut at idle body size where it still fits L1/L2, otherwise re-shoot with a compact motion. Never "keep smaller".
- D14 Sharpness/height vs live (Kitsune example): live idle stores the body at ~243 px (frame 214×290), the new idle at ~149 px
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
- 14.10 (gods standard) One frame for all, same body scale in idle and strikes; if it does not fit — change the drawing/motion,
  never shrink the god or change the frame.
- 12.11 night: body quality never traded for effects; weapon never at full arm; never aim sideways; no bursts to all edges;
  sync (nothing before the gesture); projectile looks like the thing; crop unused space.
- 13.11 Do not move agreed limits; tight canvas only; never change a rule quietly — ask.
- 13.11 Who hits whom: melee leaps, ranged projectile, buff flies to allies; game effect and baked gesture are one gesture;
  "not sideways" ≠ "only up" (viewer + blank shot ok); recoil proportional; BT as rich as TI; "fixed" = seen.
- 13.11 04:00 Effect follows the animation, never the reverse; no skips/cuts; turning only through the feet; weapons are used;
  origin = the gesturing hand/weapon; supers need magic; nothing before the hand is raised; comments repeat — re-read all.
- 13.11 (13:49) Batches of 5 gods with his approval between batches, until he says "send everything". Weight per animation, soft.
  Crop all unused space. Prompts must prevent vanishing body/haze/explosions. Projectile matches the weapon. No real shot at the viewer;
  blank shot only for firearms. Archers need not shoot in every skill. Balance notes on the stand (separate agent possible).
- 13.11 Fresh-eyes check of all work; this playbook is the single rule set for new chats.
- 13.11 Lu Bu TI: try the current art (halberd down in atk). Failing gods → one redraw list for Maxim.
