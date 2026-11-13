# Tools: workspace, cutter, stand, publishing

Operating notes moved here from the old PLAYBOOK (13.11.2026). They describe HOW the tools work. The rules of the work are in
the skill `gods-anim-kling` (v2); where a sentence below sounds like a rule and disagrees with the skill, the skill wins.
Old codes in this file (L1-L9, G1.4, D14, "section 11") are names of the old rule book; their rules are void — read them as
"the tool reports this", never as "therefore re-shoot". A clip Maxim called fine is never re-shot because a tool flags it.
New tools (`pipeline/v2`, 13.11):
- `lint_prompt.py <idle|atk|sup|hyp> <prompt.txt>` (or `--json prompts.json`) — must pass before a clip is sent. Tests in
  `pipeline/v2/tests/`: the three accepted prompts pass, `_glued_r1_must_fail.txt` fails, all 66 prompts of 13.11 fail.
- `canvas.py <picture.png> <god> --mode measure` — the room for motion on the input picture that is really sent (left, right,
  headroom in the video, headroom that can be stored at `--stored` px, and the figure height at which the whole picture fits
  180×220). `--mode tight` builds / describes a tight picture from a cut-out figure; `--mode frame` builds the wide picture of
  proposal 2 of the skill (NOT in force).
- `sheet_motion.py <slot> <sheet.webp> [--ref <old sheet>]` — figure height in px and how much the body moves (feet / hips /
  chest / head / sink / silhouette). A flag is a reason to act; a pass proves nothing (it misses Zeus TI atk).

Playback time of a slot on the stand (needed for B5: seconds = cut sheet frames × time ÷ 25): read it from the stand's code
before the first sheet gate and write the three numbers here. Known so far: a basic strike plays its 25 frames in about
1.7 s (executor's report of 12.11); super and ult — not measured yet.

Where older source videos may be (needed to re-cut a protected take; never re-shoot before looking in all of them):
1. Maxim's `Kling тест\workspace`: `mp4-*.tar` (`mp4-zz-v21.tar` = 40 clips of gods 1-5 as of v21).
2. The 13.11 workspace: `b3/prev/<clip>.v20.mp4` (the 12.11 take kept by `dl1.sh` before a retake was downloaded).
3. The scratch folder of the 12.11 chat on Maxim's computer: `…\scratch\kling\<god>\v2\` (`kitsune_bt_atk_r5.mp4`,
   `kitsune_bt_hyp_r5.mp4`, `kitsune_bt_sup_bundle.mp4`, `kitsune_ti_atk_r5.mp4`, `kitsune_ti_hyp_r5.mp4`,
   `kitsune_ti_sup_r4a.mp4`, `jobs_v2.json` with the Kling generation ids). Folder access needs Maxim's word.
4. The Kling task history, by the generation ids (finished jobs can be downloaded again with `dl1.sh`).
Kling settings: `image_to_video`, model `kling-video-v4_0`, 3 s, 720p, first frame = tail frame = the input picture, no sound;
30 credits per clip; one `taskTraceId` per god. Check `who_am_i` once per session: if the model lists a negative-prompt
argument, the fixed exclusions go there.

## Workspace (how a session starts)

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

## Cutting (adapter)

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

**Protected takes (skill, section 4 and B3) — cutter change still TO DO, not written or tested yet:** a protected take that
does not fit 180×220 at the idle's body px must NOT be cropped around the body and must NOT be re-shot. It is cut whole, at
the largest scale at which the union of its 25 frames fits. In `tools/adapt_batch.py` that means a per-clip override
`"fit": true` in `impact_overrides.json` which (1) skips the "crop around the body" block for this clip — the later
`scale_mob = min(body_scale, 180 / win_w, 220 / win_h)` then picks the fit scale by itself — and (2) records the resulting
body px as information instead of the `body_small` defect. Test it on the first re-cut (compare the new sheet with the old
one frame by frame: the same 25 moments, only sharper), then put the stored figure px into the card and the report.
Until this change exists, do not "re-cut" a protected take with the current cutter: it would cut the body or the weapon.

Overrides `work/impact_overrides.json` per clip:
- `imp` video frame of the real release, `k` sheet frame it must land on, `v0`/`v1` first/last video frame used.
  Release frame k: ranged basic k=5, melee basic k=4, super/ult k=9, instant bolts (Zeus, Indra, `proj:'bolt'`) k=12.
- If the wind-up is long: start later (`v0` = release − ~10 video frames). Never compress a long wind-up into 4-5 frames.
- `skip` is not used for new clips (skill A2: no frames removed from the middle). Sheets Maxim accepted WITH skips keep their
  25 moments; a version without skips may be shown to him under the switch, he decides.
- `wf` = [x, y] fraction of the sheet frame = the exact point where the baked effect leaves (weapon tip, string, hand, shield
  centre, top edge where a beam exits). Set it by LOOKING at the release frame (mark it on the frame image).
  The automatic point often lands on the top edge of the bbox — always verify, every action clip.
- `body_min` = the god's idle body px for a NEW action clip (skill B3): if the clip does not fit at that body size, the move
  changes. A protected take is cut whole at the largest scale that fits (see "Protected takes" above).
- When a clip is re-shot, CLEAR its old overrides (imp/k/v0/v1/wf) before re-cutting — stale values are wrong for the new take.

**What to look at for the sheet gate (the gate itself is G3 of the skill; the 5×5 QA sheet is in `work/qa_sheets/`):**
- [ ] No `vanish_area` / `explode_area` / `frozen_*` flag (L9). If present: re-cut (different matting/frame range) or re-shoot.
- [ ] `raw_edge_clip`: open the frames and check G1.4; the flag alone says nothing.
- [ ] Body is whole in every frame (no missing body, ghost-transparent body, transparent legs, grey haze rectangles).
- [ ] Body px of the sheet against the god's idle body px and against the live sheet (skill B3): a new clip that is smaller →
      the move changes; a protected take that is smaller → both numbers into the report, Maxim looks at it on the stand.
- [ ] Margins ≤ 3 px (`b3/margins2.py <god>`); size ≤ L2; weight per sheet ≤ L1: `live.kbPct` (file) and `live.ramPct` (RAM)
      in the metrics; report everything above 100 % to Maxim with the numbers (skill B2).
- [ ] Release frame = k and `wf` sits exactly on the effect origin.

## Game effects on the stand (`assets/fx2-stand.js`)

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

**What to look at for the stand gate (the gate itself is G4 of the skill; every action slot, BT row + TI row):**
`python3 b3/seq.py out.jpg <god> <slot> [n] [step_ms] [speed]` — LOOK at it.
- [ ] Game effect starts at the release frame, from `wf`, continues the baked effect.
- [ ] Nothing before the gesture; no flash at hits (L7).
- [ ] Who-hits-whom is readable (leap / projectile / buff to allies).
- [ ] Left arena unchanged vs the previous version (same series on the left).
- [ ] `node -e "new Function(require('fs').readFileSync('assets/fx2-stand.js','utf8'))"` passes; no console errors (`shot3.py`).

## Notes, balance, publishing

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
