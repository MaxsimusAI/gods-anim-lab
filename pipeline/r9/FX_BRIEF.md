# Game effects on the stand — work order of 14.11 night (round r9)

You work ONLY in the git worktree `/home/claude/fxwork` (branch `fx-r9`). Never edit `/home/claude/gods-anim-lab` (the main
checkout: another worker publishes sheets from it). Never push, never run pub*.sh. Commit locally on `fx-r9` after every
finished block (author Claude <noreply@anthropic.com>). Chat language with the lead: English. Everything in the repo: English.

## What this is

`index.html` + `app.js` + `assets/sim-core.js` + `assets/fx2-stand.js` = the acceptance stand for god animations of the game
«Битва титанов». Three arenas: LEFT = the live game (must stay byte-for-byte equivalent in behaviour — never change its
code path), MIDDLE = new sheets in the BT style, RIGHT = new sheets in the TI (anime) style. `BR.isProposed` is true in the
two new arenas. The new sheets are 5×5 sprite sheets cut from Kling clips; each has metrics in `assets/gods-data.js`:
`rel` (release moment, 0..1 of the sheet), `impact` (release frame index), `wf` ([x,y] fraction of the frame = the point of
the weapon/hand where the baked effect is born), `ho` (where a baked effect leaves the frame).
Read first: `TOOLS.md` section "Game effects on the stand" (helpers `F.newSheet`, `F.today`, `F.relDt`, `F.relT`, `F.wp`,
`F.at`, `F.atRaw`, `BR.OLD_SIG`, `BR.LEAP_NEW`, `BR.REL_NEW`), `PATTERNS.md` (checks 23-35 and 41-47, ideas), and the game
owner's remarks in `pipeline/r9/notes_1411.txt` (format: clip | stamp | version | his Russian text; clip = god_style_slot,
style bt = middle arena, ti = right arena, slot atk = basic strike, sup = super, hyp = ult).
`assets/fx2-stand.js` is 38 000 lines: never print it whole; use grep / sed ranges.

## The owner's laws for game effects (he has repeated them many times)

- E2: effects are built to the clip, never the clip bent to the code. The effect starts at the REAL release frame of the
  sheet, from the point `wf` (weapon or hand — never neck, chest, belt, feet, emptiness). Nothing flies before the gesture.
  Damage / hit reaction only when the projectile or the strike arrives. A baked effect cut by a frame edge is continued by
  the game from that point at that moment.
- Readable: the player must see who does what to whom — melee = the god leaps to the enemy and the strike frame lands on
  arrival; ranged = a visible projectile from the weapon to the target; buff/heal = something visibly flies to the allies.
- The projectile fits the weapon and the gesture. Rich and smooth, in the colour of the effect baked in the clip. No cheap
  primitives (plain rays, pebbles, tiny balls, droplets, unclear symbols, jerky fire). No blinding flashes (phone screen).
  No translucent copy of a god ever. No line / beam / bloom that the clip does not have.
- No big pictures or icons drawn over the fight (skull, heads, creature, pumpkin, portraits). He wants them removed.
- Yesterday's switch: a game effect changed now must not change the «вчера» version → gate new behaviour with
  `F.today(kind, u)`; where that is impossible use `F.newSheet`.

## Block 1 — playback speed and sync (systemic, highest priority)

Today `STG.playAnim` plays a new sheet with `dur = clamp(hitAt / rel, .3, 1.7)`: the sheet is squeezed so that its release
frame lands on the sim's hit time (sim-core CONFIG: meleeImpact 0.42, rangedWindup 0.22 + rangedFlight 0.48, superWindup
0.75; for gods in `BR.OLD_SIG` super/ult release is forced to 0.5 s). A sheet whose release frame is late (rel 0.5-0.65)
then plays its 25 frames in 0.8-1.0 s. The owner: «Слишком быстро проходит анимация» (Veles super), «Слишком быстро
дергается анимация» (Ra strike, Inti strike, Lu Bu super), «Слишком резкая анимация» (Anansi super), «Слишком резко
дергается» (Kali BT ult), «Слишком дерганная анимация?» (Raijin super), «Непонятное дерганье» (Wukong BT strike), and
dozens of «плохая синхронизация программного эффекта».
Target model (new arenas, new sheets only; the left arena and «вчера» sheets keep today's behaviour):
1. A new sheet never plays faster than a floor: strike D ≥ 1.25 s, super/ult D ≥ 1.5 s (upper clamp stays 1.7 for strikes,
   make it 2.0 for super/ult). So D = clamp(max(hitAt / rel, floor), …).
2. Release time tR = D · rel. When tR is later than the time the code expects the release (hitAt, or .5 for OLD_SIG
   signatures), everything that belongs to this action is delayed by Δ = tR − expected: the god's signature effects
   (launch, projectiles, anticipation charge), the leap arrival for melee, AND the damage / hit reaction / numbers, so that
   the order "gesture → effect leaves `wf` → flies → hit → damage" holds. Find the least invasive way: e.g. a per-action
   time offset applied inside `F.at` for that action plus a matching delay of the sim's pending hit for that action in the
   proposed arenas. This is a presentation change on the stand only — keep sim logic (damage values, targets, order of
   actions between units as far as possible) intact, and list in your report every place where fight timing changed.
3. Remove the `OLD_SIG` squeeze hacks only where the new offset replaces them; do not break gods whose sync is fine now.
Verify on at least: Veles sup, Ra atk, Inti atk, Lu Bu BT sup, Anansi sup, Kali BT hyp, Wukong BT atk (were fast) and
Kitsune BT atk, Athena BT sup, Heimdall atk (were fine — must stay fine): frame sequences at game speed and at 0.25×.

## Block 2 — remove game pictures (quick)

In the new arenas (both styles; the left arena stays): Mictlan ult — remove the skull picture. Hecate ult — remove the
picture of the three heads. Horseman strike — remove the small pumpkin icon. Ao Guang ult — remove the big creature
picture. Hel ult — remove the big pictures («Слишком большие программные картинки. Лучше их полностью убрать»).
Artemis ult — remove the game moon (the clip has its own moon now). Demeter ult — remove the game wheat sprouts (the clip
has wheat now). Keep the rest of each effect (hits, damage) and make sure the skill still reads.

## Block 3 — named presentation changes

- Shiva strike, Surt strike, Llorona strike: no leap to the enemy — the god attacks from his place, a projectile flies from
  `wf` at the release (Shiva: fire from the trident prongs; Surt: a fireball from the open hand; Llorona: water from the
  hands / lantern). New clips for these are being shot now with exactly these gestures; build the effect on the release
  frame and `wf` so it works with any sheet. Dutchman strike: «Плохая связь анимации и програмного эффекта. Можно сделать
  без прыжка» — look at his sheet and choose: if the clip reads as a ranged gesture, make it ranged from `wf`.
- Sting ult (both styles): «Сначала летит цепь к противниу и когда она подтянула врага, в анимации должен происходить
  удар ногой». Sequence: the chain flies from the god to the strongest enemy at the start, pulls the enemy to the god
  during the wind-up, the kick in the clip lands at the release frame (new clips with a kick are being shot; the kick is
  the release), then the mark explodes and the enemy is thrown back to his place.
- Brynhild strike: «Она бьет в анимации раньше чем оказывается рядом с противником» — the leap must arrive exactly on the
  release frame (fast leap ~0.2-0.25 s ending on the release), no ball/line dropping on an ally.
- Veles strike: «Он прыгает вперед и наносит урон, но почемуто оновременно с этим по земле бедит разлом и потом молния на
  противнике» — remove the ground crack and the bolt; the hit is the leap + strike.
- Sekhmet super: «Огонь из рта в анимации, а программных эффект из ног» — the fire stream starts at the mouth (`wf`) at
  the release.
- Van Helsing strike (both): «Программный эффект вылетает не из кончика оружия» — from the muzzle (`wf`).
- Horseman super and ult, Shiva super, Loki ult, Lu Bu ult, Wukong all three, Silent ult, Heracles ult, Blackbeard ult:
  «Нет связи между анимацией умения и уроном» — after Block 1 look at each: the effect must visibly leave the god at the
  release from `wf` and reach the targets before the damage.

## Block 4 — effects he called poor (redesign; after blocks 1-3)

«Программный эффект … выглядит плохо» / «Плохой программный эффект» / «полностью поменять»: Lucifer super and BT ult;
Lilith TI ult; Kali super and ult (both: «опять не понятно кто кого бьет»); Heracles ult; Blackbeard ult; Raijin ult;
Poseidon super; Llorona super and ult; Atlas super and ult; Veles ult («вид не вау и другой цвет» — match the clip's
colour); Van Helsing BT ult; Erlang ult («не понятно что летит. Слишком резко и не заметно»); Agni ult («струи огня
слишком быстро дергается» — smooth stream). Before designing read his recorded likes and bans for effects if present in
the game repo copy on this machine (may be absent): docs/workflow/vfx-preferences.md. Each redesign: one clear read —
what leaves the god (from `wf`, at the release, in the clip's colour), how it travels, what it does to the targets.

## How to look at the stand

Serve the worktree: `cd /home/claude/fxwork && python3 -m http.server 8766` (background; stop it when you finish).
`/home/claude/kl/b3/seqz.py` and `seq.py` make frame series of one action (playwright, chromium is installed):
`python3 seqz.py out.jpg <god> <slot> [n] [step_ms] [speed]` — they are hard-wired to port 8765: copy them to
`/home/claude/fxwork/pipeline/r9/tools/` and change the port to 8766. LOOK at the pictures (Read tool) — rows: new BT
arena, new TI arena. `/home/claude/kl/b3/wfview.py` shows the release frame with a grid. Syntax check after every edit:
`for f in app.js assets/sim-core.js assets/fx2-stand.js; do node -e "new Function(require('fs').readFileSync('$f','utf8'))"; done`.
Also load the page once headless and make sure the browser console has no errors.
Keep image output small (pass a scale or crop) so your own context lasts.

## Records (mandatory)

Keep `pipeline/r9/fx_ledger.json` up to date as you go: `{clip: {"status": "done|partly|not done", "what": "<one line:
what changed>", "checked": "<how you verified, frame numbers / ms>"}}` for every clip of `notes_1411.txt` whose remark is
about a game effect or playback speed, plus `"_timing": "<what changed in fight timing on the stand>"`. A later worker and
a fresh-eyes reviewer will continue from this file. Never write "done" for something you did not see working in a frame
series. If you run low on context, stop cleanly: commit, update the ledger, and report what is left.

## Final report (short)

Commits made, blocks finished, clips done / partly / not done (counts + the list of not done), every fight-timing change,
anything that looks risky, how to run your checks.
