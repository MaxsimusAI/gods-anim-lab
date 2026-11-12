# Kling animation rules for the gods (BT + Titan Idols)

Owner: Maxim (game designer, not a programmer). Chat with him in Russian, short, no code or file names.
Read this file before making every god. Add a rule here every time Maxim corrects something.

## Goal
Every god gets 4 sheets (idle, atk, sup, hyp) x 2 styles (BT dark fantasy, TI anime), 25 frames 5x5.
The live BT game is the reference; the new version must be better: livelier, juicier, lighter.
Work in batches of 5 gods (from 12.11); publish on the stand, Maxim reviews, then next batch.
Nothing goes into the game repos or servers until Maxim says so. Balance changes only after his approval.

## Before generating (no wasted credits)
- Analyse first: skills, live sheets and their weight, the game's FX colour for this god, how the game plays the sheet.
- One take per clip. A retake only for a concrete defect. Never 2 variants "just in case".
- Kling 4.0, image-to-video, 3 s, 720p, first frame = last frame, 30 credits. Sound is not used.
- Input picture: tight canvas (tools/tight.py): figure ~74% of width, top 7%, bottom 3%, flat gray 127.
  Empty space around the figure makes Kling fill it with wide swings. BT source: art-new/std/<god>.png (1024x1536).
  TI source: the game art (600 px) - no hi-res found.
- Look at the art itself. If a picture is bad or inconvenient (weapon much taller than the head, etc.) tell Maxim -
  he can have ChatGPT redraw it.

## Motion
- Living character: weight shifts, bending knees, supple spine. Not only an arm moving, but not everyone must jump/spin.
- Never "figurine on a turntable". Do not use the words turn around / spin / pirouette / twirl.
- No object similes in prompts ("lantern-like" produced a real lantern).
- The figure keeps the same size: feet planted, no step or lunge toward the camera (otherwise she is a giant when she
  leaps to the enemy row: enemies are drawn smaller by perspective). Say it explicitly in every prompt.
- Timing the game needs: the game plays the sheet so that the release frame lands on the hit moment.
  Ranged basic: release = sheet frame 5 (wind-up plays ~0.39 s). Melee basic: frame 4 (~0.28 s). Super/ult: frame 9 (~0.6 s).
  So the wind-up in the video must be SHORT (basic: first third of a second; super/ult: first second), then a long,
  relaxed recovery. A long wind-up squeezed into 4-5 frames looks jerky ("too abrupt").
- If Kling still made a long wind-up: start the sheet later (v0 = release - ~10 video frames) instead of squeezing.
- Removing frames from the middle (skip) makes a visible jerk - use only for 2-6 frames (a full-frame flash), not to hide
  a weapon that left the frame; re-shoot instead.

## Frame and weight
- Total of the 4 new sheets <= the live god's sheets (KB and decoded RAM), better less. 180x220 is only the ceiling.
- Prefer ideas that make the silhouette narrower (tails gathered into one bundle, thrust toward the viewer, kneel
  behind a shield) so the picture can be stored larger.
- Leaving the frame: a tip of a sleeve / 30% of a fan for ~0.3 s is fine if it is fast there-and-back.
  Slow or long exits are bad (half a sword for half a second, a fan slowly sweeping out).

## Effects
- Smart tricks: blank shots (only smoke / a glint at the weapon), the projectile is drawn by the game.
- Baked effect colour = the god's FX colour in the game.
- NO blinding flashes, baked or programmatic: no lens flare, starburst, white-out, full-screen flash. Soft glows only
  (players watch on a phone; every god flashing at the screen is unbearable).
- A baked effect may reach the frame edge: there it must dissolve softly (adapter does it) and the game continues it.
- The programmatic effect must be born exactly where the baked effect is (centre of the shield, raised hand, top
  edge where the beam leaves) and at the moment the motion gets there. Check the origin point on the stand for every
  clip (wf = point in the sheet frame) - "slightly below and to the right of the shield" is a defect.
- No tiny unreadable wisps/lanterns around the god. Decoys = translucent doubles as in the live game.
- Programmatic effects must not look cheap: plain radial rays, pebbles under the feet, 5 little balls - bad.
  Each skill should read clearly: what flew where and what it did.

## Skills / balance (proposals only)
- Many skills are samey or out of balance. Prefer long weak effects to short huge ones, more own damage for supports.
- Always give numbers for minimum and maximum progression (e.g. -10% for 10 s -> -25% for 20 s).
- Check with the SIM after approval.

## Stand
- https://maxsimusai.github.io/gods-anim-lab/ : left arena = live game, then new BT, new TI. Everything on one screen.
- Ally health bars under the feet. Per-slot note "what to check".

## Added 12.11 after the review of batch 2 (Zeus, Demeter, Hel, Amaterasu)
- Do not over-correct "no blinding flashes" into "almost no effect". Maxim wants a WOW picture: every action clip needs a
  rich, clearly visible baked effect on the weapon / hands / body (energy gathering, runes, swirling leaves, aura, arcs)
  in the god's colour, medium brightness. Forbidden is only: white-out, lens flare, full-screen flash, brightened background.
  A tiny glow + a tiny programmatic dot = rejected ("Demeter BT attack", "Hel attack", "Amaterasu BT attack").
- Enemies are at the TOP of the screen. Do not aim the weapon at the viewer: the tip ends up over the belly and the
  effect "flies from the belt". Raise the weapon tip up / up-forward so it is clearly visible; the effect leaves upward
  and the game continues it from there (the Kitsune beam is the model).
- Every baked effect that leaves through a frame edge must have a visible programmatic continuation that connects it
  to what happens on the enemies (Zeus ult: bolt goes into the edge, then unrelated bolts fall from the sky = rejected).
- Idle must be alive for the WHOLE loop: no pause, weight shifts and leg/hip movement, cloth and hair, a small gesture;
  not just a heaving chest (Zeus TI) and not "twitch - freeze for a second - twitch" (Demeter TI) or a barely moving
  statue (Hel, Amaterasu BT).
- Super and ult must differ clearly from the basic attack and must not be "the same pose, slower" (Amaterasu BT).
- Check timing of every clip on the stand: not too fast (Amaterasu TI super) and effect in sync with the motion.
- The stand's weapon point is NewFX.prototype.wp (not the base wp) - the wf origin is implemented there since 12.11.
- All balance proposals and all of Maxim's remarks per god are stored in kling_done.json ("balance", "todo") and shown
  on the stand under each skill. Nothing may live only in the chat. Backlog gods are re-done after the roster pass
  or when Maxim says.

## Added 12.11 after making batch 3 (Apollo, Brynhild, Van Helsing, Indra, Inti)

- **Idle is measured, not eyeballed.** `b3/motion.py <clip>` prints the mean frame-to-frame motion for six parts of
  the loop. Rejected idles of batch 2 had 0.3–1.2 everywhere; a good idle has 2+ in the middle parts and no part
  below ~1 except the very start/end. Below that -> retake with an explicit list of continuous actions (weight
  shift, step in place, weapon handling, head turn, cloth) and "never freezing".
- **Wings and other wide effects need a looser input canvas.** On the tight canvas Kling opens wings past the frame
  and they stay cut for 1–1.5 s (forbidden: slow/long clipping). For such a clip use the figure at ~56% of the
  width with ~14% extra head-room (`tight/<god>_<style>_loose.png`) and say in the prompt that the wings are compact
  and never reach the frame edges. The adapter normalises the body height, so the looser canvas is safe.
- **A straight cut at the frame edge is softened.** Where the sheet frame edge is the edge of the Kling video, the
  adapter now fades everything (body too) over the last ~3.5%; `b3/softcut.py` does the same on already built sheets.
  It hides a short cut of a cloak or a spark; it does not excuse long clipping — that is still a retake.
- **White frame at the release.** If the release frame is a white ball / lens flare, do not retake: remove those
  1–3 frames with `skip` and put `imp` on the next frame (the ring/burst after the flash). Works because a flash is
  not a movement.
- **Melee gods** (stand style `melee: true`, e.g. Brynhild) release at sheet frame k=4, ranged basics at k=5,
  super/ult at k=9. Check the style before setting `k`.
- **Old per-god signatures** place sparks with `sheetPt(u, kind, fx, fy)` (fractions of the OLD sheet). On the new
  sheets `sheetPt` now returns the measured origin `wf`, the same point as `F.wp`. So `wf` must be set for every
  action clip — it drives both.
- A projectile drawn by Kling in the wrong direction (e.g. a bolt flying down) is removed with `skip`; the game
  draws the real one from `wf`.
- Retakes are overwritten under the same clip name; the first take is kept in `b3/take1/`.

## Added 12.11 (night) after Maxim's review of batch 3 — binding

- **Body quality is never traded for effects.** A wide effect (wings, rings) must not make the frame wider so that
  the body is stored smaller. If a clip's body comes out smaller than in the god's other action sheets, the clip
  is a reject: retake it compact (e.g. wings tall and narrow, not spread). Check with `b3/margins.py` + the body
  table (bodyPx action / bodyPx idle). Do not invent quality trade-offs — ask Maxim.
- **Idle = slow and smooth only.** No sharp or fast arm moves (they read as an attack), the weapon is never raised
  or aimed, no effects overkill. The feet must step. The body must not rotate like a figurine on a stand.
- **Weapon never at full arm's length** to the side or above the head: it leaves the frame and stays cut for a
  second. Bent arm, lean back; a staff rises at most a little above the head, or the god kneels with the staff in
  hand. Tall-weapon gods get the roomier canvas `tight/<god>_<style>_mid.png` (figure 80%, +10% head-room).
- **Never aim sideways** — allies stand left and right, it looks like shooting an ally. Aim up; muzzle/tip well
  inside the frame, the flash must not be cut.
- **No bursts in all directions** that reach every frame edge (the whole frame border becomes visible). Effects stay
  compact around the weapon/hand.
- **Sync.** The game effect must not start before the baked burst, damage must not fly before the shot, and the
  origin is the weapon (not the head, not the feet). Check every action on the stand frame by frame.
- **The game projectile must look like the thing**: an arrow like an arrow, a thrown bottle like a bottle. A small
  "droplet" is not acceptable for heals either.
- **No unused space.** Sheet frames are cropped to what is really used over the 25 frames (`b3/margins.py` shows
  the unused %); keep the margin at 2 px. What Maxim sees with margins is the Kling source video, not the sheet.
- Skills of one god must not shrink the figure on screen (Van Helsing TI super looked shorter because a glow on
  the ground was measured as "feet"): no ground glow under the feet unless it is the skill itself.

## Added 13.11 — Maxim, binding: do not move the agreed limits

- **Only the tight input canvas** (`tight/<god>_<style>_tight.png`). The roomier `_mid` / `_loose` / `_tall` canvases
  used in the rework pass of 13.11 were MY deviation and Maxim rejected it ("we chose the size; if it does not fit,
  you must make the animation fit, not move the borders"). Do not use them again. If a weapon or effect does not
  fit: change the motion (bent arm, lean back, kneel, lower the weapon) and retake — never enlarge the canvas,
  never store the body smaller, never store a bigger frame.
- The sheet limits are fixed: <= 180x220 (mob), 4 sheets <= the live god's weight, body size = the god's usual size
  (adapter override `body_min`, written by the pass from `b3/body_min.json`). The adapter crops an oversized effect
  softly instead of shrinking the body (`crop` in the metrics) — that is a safety net, not a licence for wide effects.
- When anything "does not work", do not quietly change an agreed rule to make it work — tell Maxim and ask.
