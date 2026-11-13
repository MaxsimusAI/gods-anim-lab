# State of the gods animation work

Site: https://maxsimusai.github.io/gods-anim-lab/ (v29, 13.11.2026). Rules: skill `gods-anim-kling` v2. History: `LOG.md`.
Statuses (skill, section 4): `new | shot | published | protected | re-cut needed | re-shoot (Maxim named it) | re-shoot (a gate fails) | waits for his look`.
Clip and game effect are tracked separately. "12.11 take" = the sheet under `assets/sheets/v20/` («вчера» on the stand).

## Done 13.11 evening (site v27-v28, no credits)

The 12.11 source videos of gods 1-5 were found (Maxim's computer: `…\scratch\kling\kitsune\v2\`, `…\scratch\kling\athena\`,
`Kling тест\workspace\mp4-s-z.tar`) and matched to the v20 sheets frame by frame. Nine takes were re-cut whole with
`{"fit": true}` (same 25 moments; a fresh-eyes reviewer compared all frames; figure 196-215 px instead of 130-160):
- now «сейчас» (protected, he preferred them): Kitsune BT atk (208 px), Kitsune TI hyp (196), Athena sup BT (215) and TI (199),
  Zeus sup BT (205) and TI (197). The 13.11 takes of these slots left the site; «вчера» shows the soft 12.11 sheet.
- under «вчера» (13.11 take stays «сейчас», he picks by looking): Kitsune TI atk (206), BT sup (197, fire hue shifted to
  sky blue as on 12.11), BT hyp (210).
- Memory above live: Kitsune BT atk 110 %, BT sup 105 %, BT hyp 103 %, Athena sup BT 114 %, TI 111 %, Zeus TI sup 121 %
  (file size 75-96 % of live). Game effects unchanged; origins `wf` set by eye.

## Done 13.11 late evening (site v29, no credits) — Maxim's remarks of 20:48

- Kitsune super, game effect: the line above the frame is gone, the fox-fires start at the tips of the tails.
- Kitsune ult, game effect: the fires are born at the fan / hand point.
- No translucent copy of any god on the new arenas (decoy doubles, after-images, the grey copy at home during a leap,
  Raijin's "brother", Hades's and Wukong's doubles, the rising spectral copy).
  The live arena is unchanged; the decoy mechanic is unchanged (only the picture).
- Symbols the game draws that the clip could carry (PATTERNS check 35): Kitsune's mask (ult), Athena's Medusa (ult — on the
  shield, nothing shoots from the eyes), Artemis's moon, Demeter's ears of wheat (ult). Each is put into the idea of the clip
  when that clip is shot; the game symbol is removed only once the clip carries it. Protected takes are not re-shot for it
  without his word.

## 13.11 night — first five gods, round 4 (sharp cut everywhere; site v33-v36)

- Accepted takes re-cut sharp: Kitsune BT atk/sup/hyp, TI hyp; Athena sup BT/TI, BT hyp; Zeus sup BT/TI, BT atk; the
  published BT idles of Kitsune, Athena, Artemis, Zeus (sources found in the Kling history through the old chat).
- 30 new clips shot (Kling 4.0, 3 s, 720p, first = last frame; 30 credits each); task ids: `pipeline/r4/kling_tasks_1311.json`.
  Fresh-eyes verdicts: `kl/r4/rev/verdicts.md` (not in the repo). Published v36 (pass or WATCH): Kitsune TI idle/atk,
  Athena TI idle/hyp, Artemis TI idle, BT/TI atk (retake 1), BT sup, Zeus TI idle, TI atk (retake 1), BT hyp, Demeter TI
  idle, BT sup. Retakes running: Athena BT/TI atk, Zeus TI hyp, Artemis BT/TI hyp, Demeter BT idle, Demeter TI sup (new
  idea: low row of shoots). The 4 BT idle re-shoots of Kitsune/Athena/Artemis/Zeus are alternatives (`kl/r4/alt/`), not used.
- Retake round (13.11 night): Demeter BT idle retake published v37 (WATCH). Failed again (fresh eyes): Athena BT/TI atk
  (spear out of the right edge / beam across the frame), Zeus TI hyp (lightning column from the sky), Artemis BT hyp (arrow
  light into the edge, moon cut), Demeter TI sup new idea (shoots became a field to her chest). Artemis TI hyp retake: flash
  at the bow, moon cut at the top — not cut yet. Limit of 12 clips reached for Artemis and Demeter.
- Waiting for Maxim: Demeter BT/TI atk and BT/TI hyp (limit of 12 clips per god reached), Kitsune TI sup (3rd take wider than
  the frame), Artemis TI sup (translucent bow copies).
- Lessons for prompts (section 7 table candidates): 'flares' on a weapon → a slash streak across the whole frame; 'lightning
  runs along the staff' → a column out of the top; 'the light leaves the bow' → a flat arrow into the side edge, 'the arrow of
  light vanishes in a flash right at the bow; nothing flies away' fixed it; 'grow to the waist' → thorns above the head.

## 14.11 night — god 6 Hel (site v40-v43)

- Sources of all 8 published takes found (Maxim's mp4-d-h.tar; three 13.11 tight takes in the Kling history), all 8 re-cut
  sharp (v40; fresh eyes: same moments, sharper). New source videos saved to `Kling тест\workspace\mp4-zz-v43-hel.tar`.
- New takes (12 clips, 360 credits; ids `pipeline/r6/kling_tasks_1411.json`, prompts `pipeline/r6/`): super BT/TI published
  (v41, WATCH); TI strike retake 2 published (v43, WATCH); BT strike — 3 takes failed → «Версия 2/3», old take stays;
  TI ult — 2 takes failed (fire ring wider than the frame) → «Версия 2/3», old take stays (matting slab removed).
- Matting haze ("lilac slab", gray haze) = pipeline artifact around green fire, removed by `b3/haze_fix.py` (BT/TI ult).
- Waiting for Maxim: Hel BT strike (keep old / v2 / v3 / new idea), Hel TI ult (old / v2 / v3); his look at everything.
- Game effect of the super re-timed to the new take (fist, real release) — stand check running.

## 14.11 night — next 10 gods (Maxim 01:45 «Делай следующие 10 богов»)

Amaterasu, Apollo, Brynhild, Van Helsing, Indra, Inti, Ra, Heimdall, Hou Yi, Erlang Shen. Sources: Maxim's tars (all 80 found,
`kl/g7/src`). All 80 re-cut sharp (two queues, `/tmp/sb1b.log`, `/tmp/sb2.log`); 'skip' overrides were removed (forbidden), the
list is in `kl/g7/skips_removed.json`. Per god: fresh-eyes review → publish re-cuts that pass / protected (pub1) → re-shoot
fails (prompts `pipeline/r7/`, ids `pipeline/r6/kling_tasks_1411.json`) → near-misses as «Версия N».
Done so far: Inti (5 re-cuts; sup BT/TI to re-cut with fit, TI ult with de-smoke), Ra (5 re-cuts, new super BT/TI, TI strike
retake 2 cutting), Heimdall (7 re-cuts; BT ult keeps its old cut — the re-cut adds frames he never saw), Amaterasu (5 re-cuts,
BT super take 3 published, TI super take 3 = «Версия 2», BT strike retake 1 re-cut with de-smoke — publish if clean).
Open: G4 stand check of the new effects of all re-shot clips; Apollo review running; Brynhild, Van Helsing, Indra, Hou Yi,
Erlang to do.

## Next step

1. Maxim looks at Kitsune, Athena, Zeus on the stand: are the re-cuts sharp enough; which take to keep in the three
   «вчера / сейчас» pairs; proposal 1 of the skill only after that.
2. **New clips, ONE god at a time** — only the clips marked `re-shoot (…)` below: Kitsune, Athena, then Artemis, Zeus,
   Demeter. Idea lines to Maxim first (skill, section 5 step 4). No credits on the next god before he has answered on the
   previous one (skill, section 1). Pilot rule promised to Maxim (report of 13.11): if he accepts fewer than two thirds of
   the new clips of Kitsune and Athena at first showing — stop and correct section 7 of the skill with his «да»; no new bans.
3. Then the other gods, those with open remarks first. For every clip in the list "Other gods" check that the sheet on the
   site is still the take Maxim saw on that date before calling it protected; soft strikes are re-cut the same way.

## Gods 1-5 — per slot

"fits at N" in a cell = the largest figure height in px at which the 12.11 take fits 180×220 (measured on the v20 sheet with
`sheet_motion.py`; conservative — the real cut usually gains 3-5 %). "Figure" = the god with his weapon in the first frame
(the old notes at the bottom use "body px" = the body without ears and ornaments, which is smaller: live Kitsune idle 243
body px = 272 figure px). 12.11 the figure was stored at 130-174 px; the live game
stores the strikes of these gods at 184-202 px; the 13.11 idles are 200-215 px.
"same take" = the 13.11 sheet is the 12.11 take, already re-cut large (frame-by-frame match ≥ 0.85).

| clip | BT | TI | Maxim's words (date) / what to do |
|---|---|---|---|
| kitsune idle | published v24 — waits for his look (WATCH ~0.5 s almost still at the seam) | published — waits for his look | TI retake failed twice (glued feet) |
| kitsune atk | 12.11 take **protected**, re-cut (208 px), «сейчас» — 13.11 20:48 «Титан-версия обычный удар окей» | 13.11 take «сейчас»: «аниме-версия плохо» (20:48, «это я новые еще смотрю»); 12.11 take re-cut (206) under «вчера» — waits for his look; if rejected too → re-shoot (Maxim named it) | 13.11 about BT: «Во вчерашней версии она сильно двигалась… маску вперёд выставляла. И это окей, это нормально было» |
| kitsune sup | 12.11 take (his own idea): re-cut (197), under «вчера» next to the 13.11 take — waits for his look | re-shoot (a gate fails: the tails opened wider than the frame twice) — a new idea first | 12.11 idea «офигенно». Game effect: 13.11 20:48 «тонкая линия здесь не нужна», balls straight from the tail tips → done v29 |
| kitsune hyp | 13.11 take «сейчас», 12.11 take re-cut (210) under «вчера»; 20:48 «Лисья свадьба в целом окей» — ask which of the pair | 12.11 take **protected**, re-cut (196), «сейчас»; 20:48 «в целом окей» | Game fires from the fan (v29). Mask: he would rather have it in the clip — re-shoot of a protected take only on his word |
| athena idle | published v22 — waits for his look | re-shoot (a gate fails: glued feet, spear above the top — the reviewer of 13.11); Kling refused one retake | he has not spoken about it: name it to him before the re-shoot |
| athena atk | re-shoot (Maxim named it) | re-shoot (Maxim named it); the site shows the 12.11 take | 12.11: lunge too abrupt, she grows and looks like a giant at the enemy; TI jerks. 13.11 BT: «прыгает рядом к врагу, всё статичное, только правая рука чуть-чуть вверх дёргается… и копьё загорается. Это не похоже вообще на удар» |
| athena sup | 12.11 take **protected**, re-cut needed (fits at 211; was 159) | 12.11 take **protected**, re-cut needed (fits at 194; was 148) | 12.11: «Супер, прикольно, мне нравится, щит подсвечивается, кайфово выглядит» (his words name the super, not the style → both styles go under the switch). 13.11 re-shot → «какой-то луч непонятный… раньше из середины разбрасывала щиты на союзников, и это логично было». Game effect must start at the shield centre |
| athena hyp | **protected** (accepted 13.11; same take as 12.11, stored at 211) | re-shoot (Maxim named it) | 13.11: BT «щит сдвигает как бы к центру, из него выходят лучи. Окей, это круто»; TI «нереальное дёргание». Game rays cheap, stones under the feet — game effect open |
| artemis idle | published v24 — waits for his look | re-shoot (a gate fails: freezes at the seam — the reviewer of 13.11) | he has not spoken about it: name it to him before the re-shoot |
| artemis atk/sup/hyp | re-shoot (Maxim named it) | re-shoot (Maxim named it) | 13.11: «нет задачи, чтобы именно вверх стреляло… у тебя каждый раз рука полностью выставляется. Она может держать близко к телу». Six retakes of 13.11 were rejected before publishing (arm stretched, flat aim, bow cut 0.5-1.8 s). Her tight picture is 141 px wide where the frame allows 180 — a wider picture is proposal 2 of the skill (section 10): one strike on both pictures, only after his «да». 12.11 takes fit at 197-207. Choice of 13.11 ~17:40 (question window, result not seen by him): «стреляет без натяжения», «полёт рисует игра» — Artemis only; it collides with C1 of the skill, so both variants are shown to him (P7) |
| zeus idle | published v26 — waits for his look (WATCH hand at the mouth ~1 s) | re-shoot (Maxim named it) | TI (12.11): chest heaves, legs static |
| zeus atk | **protected** (12.11 «обычный удар окей»; the same take, re-cut 13.11 at 206 without the frames that were skipped on 12.11 — show both under the switch) | re-shoot (Maxim named it); the site shows the 12.11 take | 13.11 TI: «только правая рука в локте сгибается… Весь остальной персонаж полностью статичный». BT game lightning came from the belt — game effect |
| zeus sup | 12.11 take **protected**, re-cut needed (fits at 202; was 157) — the site shows a 13.11 take | 12.11 take **protected**, re-cut needed (fits at 196; was 130) — the site shows a 13.11 take | 12.11: «супер удар в целом окей» (his words name the super, not the style → both 12.11 takes return under the switch) |
| zeus hyp | re-shoot (Maxim named it) | re-shoot (Maxim named it) | 12.11: lightning goes into the edge with no link to the strikes on the enemies; 13.11: raised hand cut by the top for ~0.5 s. Choice of 13.11 ~17:40 (question window, result not seen by him): «полёт рисует игра» — the power gathers on the weapon; Zeus and Artemis only, shown to him as two variants (P7) |
| demeter idle | published (same take as 12.11) — waits for his look (WATCH: frozen by measurement; the reviewer decides when Demeter's turn comes) | re-shoot (Maxim named it; same take as 12.11) | 12.11: TI idle «подёргалась, остановилась на секунду» |
| demeter atk | re-shoot (Maxim named it 12.11); a 13.11 retake was rejected before publishing (the sickle vanishes) | published (same take as 12.11) — waits for his look | 12.11: BT no effects on her or the sickle, a tiny game dot flies |
| demeter sup | re-shoot (Maxim named it 12.11) | re-shoot (Maxim named it 12.11) | 12.11: no link, small spikes, unclear yellow bits, crooked game stalks |
| demeter hyp | published (same take as 12.11) — waits for his look; a 13.11 retake was rejected before publishing (the sickle vanishes) | published (same take as 12.11) — waits for his look; a 13.11 retake was rejected (the staff tilts) | not judged by Maxim yet |

## Other gods — clips Maxim called fine (verify take, then protected); game effects stay open where noted

- Heimdall: idle, atk, sup, hyp (13.11 04:00 «окей»). Game effects of sup/hyp «не вау».
- Indra: idle, atk, sup, hyp (13.11 04:00 «окей… даже на удивление»). Strikes are stored at 141-159 px with an idle of 202 —
  re-cut needed (soft), not a re-shoot.
- Inti: idle, atk, sup, hyp (13.11 04:00). Game ball of atk «не очень»; hyp may be too bright — look in a fight.
  TI sup is flagged "body still" by the meter — he accepted it, it stays.
- Ra: idle; BT atk; hyp. sup «простоватая» → re-shoot (Maxim named it): needs magic. TI atk jerks → re-shoot. Game boat of hyp poor.
- Erlang: idle; sup; hyp. atk: spear cut on the return → re-shoot. Game effect of sup starts at the neck/shoulder → fix.
- Agni: BT atk; TI sup («из руки 3 огня» — flagged "body still" by the meter, he accepted it, it stays); hyp clip «кайфово».
  BT sup ring flies off and is cut → re-shoot; TI atk flickers → re-shoot; idle: BT «вообще не двигается», TI «слишком
  танцует»; game fire of hyp jerks.
- Brynhild: idle; sup (12.11 «прикольно»); hyp. atk sluggish, leap not on the hit; TI sup things fly before the hand is raised.
- Hou Yi: idle. atk/sup/hyp: bow not used, effect from emptiness, jerks → re-shoot (he may also do something other than shooting).
- Van Helsing: BT hyp «более-менее» → waits for his look (lukewarm words are not acceptance). TI idle turns like a figurine (4th time) → re-shoot; shot effect; sup needs magic; unclear symbol.
- Apollo: sup (12.11 «в целом неплохо»). Idle arm jerk, atk bow far to the side, hyp jerks and bursts to every edge → re-shoot.
- Amaterasu: hyp («выход из грота окей»). Idle boring (only the head), atk/sup boring, no effects → re-shoot.
- Hel: idle almost no movement; shot not from the staff; too little effect → re-shoot.
- Lilith BT, Loki TI: art to be redrawn (Maxim). Lu Bu TI: try the current art, halberd pointed down, add magic.
- By measurement (`sheet_motion.py`, 13.11, 299 published action sheets of 51 gods): 26 are flagged "body still" — two of
  them are clips Maxim accepted (Agni TI sup, Inti TI sup). The flags are looked at per god when his turn comes; a number
  alone is never a reason to re-shoot.
- Sharpness of the other gods: in 165 of the 299 sheets the figure is stored below 184 px (median 179 px, 0.87 of the god's
  own idle), i.e. smaller than the live game stores strikes (184-205 px on the nine gods checked). These need a re-cut from
  their source videos (no credits), not a re-shoot — do it when the god's turn comes.

## History: the executor's own state list of 13.11 (v20-v26) — NOT a to-do list

The text below is kept as HISTORY. Before acting on any item:
- A clip Maxim called fine (list "Other gods" above) is protected (skill, section 4): it is not re-shot and its 25 moments
  do not change, whatever the item says. This overrides D3 for Heimdall BT hyp, Indra TI hyp, Erlang sup/hyp and Brynhild TI
  hyp, D5 for Amaterasu hyp, and D13 for every accepted clip: they are only re-cut sharper from the same video with the same
  frames. A version without skips may be shown to Maxim under the switch; he decides.
- Old rules, void: the "vertical-only rule" (D5), "never keep smaller" (D13), "~0.5 s exits are now rejects (G1.4)",
  L1/L2/L4. The skill's B3, B5 and C4 apply.
- "Maxim: almost no steps" and "Maxim: … the game draws the flight; Artemis without drawing" (v24-v25) are choices from
  question windows of 13.11, not his words. He rejected "almost no steps" the same evening. The other two concern Zeus and
  Artemis only and are shown to him as two variants on the stand before any credits (skill P7).
- Every other item is checked again by the gates of the skill when the god's turn comes.

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
