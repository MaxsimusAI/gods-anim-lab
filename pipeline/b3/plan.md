# Batch 3 (12.11): apollo, brynhild, vanhelsing, indra, inti. taskTraceId 019a7fd1-6e32-7f74-8d50-7c3e1a9f6b24
New prompt principles (see KLING_RULES.md "Added 12.11"): rich visible baked effect, weapon tip UP (enemies are at the top),
idle alive the whole loop, blank shots (projectile drawn by the game from the wf point), no white-out.
Upload ids are in tight/up_<god>_<bt|ti>.json. Job ids -> jobs_batch3.json (written as jobs are submitted).
After render: b2/get.sh tokfile, b2/sheet.py review, set work/impact_overrides.json (imp,k,v0,v1,skip), adapt, b2/mosaic.py -> wf,
b2/patch_wf.py, notes (kling_done.json: notes/todo/balance), build manifest, bump ?v, shot3.py, commit+push, save sources.
Colours: apollo gold-orange sunlight; brynhild pale gold; vanhelsing silver-white holy light; indra golden lightning; inti warm sun gold.

STATE (12.11 ~22:30): all 40 jobs submitted (ids in jobs_batch3.json). Next: poll each with query_tasks, take the
"urlWithoutWatermark" token (uuid-token before -output.mp4), write b3/tokN.txt lines "<clip> <token>", run b2/get.sh
(downloads to b2/mp4), b2/sheet.py for review, then overrides -> adapt -> mosaic/wf -> notes -> publish (ver 14).

STATE (12.11 ~23:20): all 40 downloaded to b2/mp4, reviewed (b3/s_*.jpg). Retakes submitted (ids in jobs_batch3.json, keys r_*):
brynhild_bt_hyp + brynhild_ti_hyp (wings cut by the frame for ~1.5 s -> looser canvas tight/brynhild_*_loose.png, compact wings),
idles inti_bt, inti_ti, indra_ti, brynhild_ti (static with pauses, measured by b3/motion.py). Save retake mp4 over the same clip names.

STATE (12.11 ~23:55): batch 3 DONE and published: stand v14, commit 6bf2b01 (40 sheets, wf for all action clips, notes + balance
in kling_done.json ver 14, softcut applied, sheetPt->wf fix, rules appended). Sources saved to the device scratch kling/batch3/*.zip.
Credits left 54,236. Next: wait for Maxim's review of batch 3; then batch 4 (gods 13+: Ra, Heimdall, Hou Yi, Erlang Shen, ...).
Backlog (todo on the stand): Zeus, Demeter, Hel, Amaterasu, Kitsune TI sup, Athena ult shafts; generic edge->enemy link not done.

## REWORK PASS (ordered by Maxim 12.11 23:38: "полная пачка переделок — все старые косяки плюс новые")
New rules from his review of batch 3 (must go to KLING_RULES.md + todo on the stand, ver 15):
- idle: only slow smooth motion, no jerks (looks like an attack), weapon never raised, NO rotating "figurine on a stand" — feet must step;
- weapon never held at full arm's length to the side / overhead (it gets cut for a second) — bent arm, lean back, staff at most a bit above the head;
- never aim sideways (allies stand left/right) — aim up; muzzle/tip well inside the frame;
- no explosion/rings in all directions that reach every frame edge; effects compact;
- sync: the game effect must not start before the baked burst; damage after the shot; origin = weapon;
- game projectile must look like the thing (arrow, bottle), not a "droplet";
- sheets are already cropped to the used area (b3/margins.py: 4.7% unused in total) -> reduce pad to 2 px and show the % on the stand;
- wide frame = smaller stored body (Brynhild ult body 133/113 px vs 183 idle) — told Maxim, waiting for his choice.
Retake list (32): idles apollo_bt, apollo_ti, brynhild_ti, vanhelsing_ti, indra_bt, zeus_ti, demeter_ti, hel_bt, hel_ti, amaterasu_bt (tight canvases);
actions on roomier canvases tight/<god>_<style>_mid.png (urls in tight/urls.json): apollo_bt_atk, apollo_bt_hyp, apollo_ti_hyp, brynhild_bt_atk,
vanhelsing_ti_atk, vanhelsing_bt_sup, vanhelsing_ti_sup, vanhelsing_ti_hyp, inti_bt_atk, inti_bt_hyp, inti_ti_hyp, zeus_bt_atk, zeus_ti_atk,
zeus_bt_hyp, zeus_ti_hyp, demeter_bt_atk, hel_bt_atk, hel_ti_atk, hel_bt_hyp, hel_ti_hyp, amaterasu_bt_atk, amaterasu_bt_sup.
No retake, fix timing/FX: indra_bt_atk (release when vajra is up, origin at vajra), indra sup/hyp sync, vanhelsing_bt_hyp sync, amaterasu_ti_sup slower,
apollo sup projectile = arrow, inti heal projectile not a droplet, zeus ult link edge->enemies, demeter sup FX, athena ult shafts, kitsune (ask Maxim).
Job ids -> jobs_rework.json (keys = clip names). taskTraceId 019a8001-2b40-7c11-9a55-3e0d5f7a1c02. First takes are moved to b3/take1/ before download.
STATE (13.11 ~00:25): all 34 rework clips downloaded to b2/mp4 (previous takes in b3/prev/<clip>.<n>.mp4). Stand code already patched
(not yet pushed): sheetPt->wf, softcut in adapter, pad 2 px, old-signature sync (.5 s) — see KLING_RULES.md. kling_done.json has todo for batch 3.
Next: review sheets (b2/sheet.py), motion check of idles (b3/motion.py), overrides, frames (b3/frames.sh), adapt, wf (mosaic), body check, notes,
manifest, ?v=15, shot3, softcut, commit+push, zips to device (kling/rework1/), credits, report.
STATE (13.11 ~00:50): adapter running in background on b3/clips_rw.txt (31 clips, log b3/adapt_rw.log; overrides + body_min set).
Adapter now has: pad 2 px, edge soft cut, BODY GUARD (override body_min = 0.97 x median action body of the god-style, b3/body_min.json):
window is cropped around the body instead of shrinking the body; metrics get "crop": "LRT".
Round-3 retakes submitted (jobs_rework.json keys r3_*): indra_bt_idle, amaterasu_bt_idle (still static), brynhild_ti_hyp (wings still wide),
vanhelsing_ti_atk (muzzle at the top edge -> canvas tight/vanhelsing_ti_tall.png), brynhild_bt_atk (spear into the corner -> slash arc).
After they finish: b3/get2.sh needs the .done marker removed for these 5 (rm b3/prev/<clip>.done is blocked by the safety check -> use
`mv b3/prev/<clip>.done b3/prev/<clip>.done.old`), download, frames, overrides, adapt (never two adapters at once).
Then: wf via b2/mosaic.py for all re-adapted action clips, notes (ver 15), manifest, ?v=15, shot3, commit+push, zips, credits, report.

STATE (13.11 ~01:45): v15 pushed (interim). Maxim REJECTED the roomier canvases: "everything must be re-shot at once" on the TIGHT canvas
(fight for every pixel; never move the agreed limits). To re-shoot on tight/<god>_<style>_tight.png (urls in tight/urls.json, keys <god>_<style>):
apollo_bt_atk, apollo_bt_hyp, apollo_ti_hyp, brynhild_bt_atk, brynhild_bt_hyp, brynhild_ti_hyp, vanhelsing_ti_atk, vanhelsing_bt_sup,
vanhelsing_ti_sup, vanhelsing_ti_hyp, inti_bt_atk, inti_bt_hyp, inti_ti_hyp, zeus_bt_atk, zeus_ti_atk, zeus_bt_hyp, zeus_ti_hyp,
demeter_bt_atk, hel_bt_atk, hel_ti_atk, hel_bt_hyp, hel_ti_hyp, amaterasu_bt_atk, amaterasu_bt_sup (24).
Prompt pattern for the tight canvas: weapon stays where it is / low, effect forms in the free palm at chest height or on the weapon near the body,
nothing above the head, nothing at arm's length, compact. Job ids -> jobs_rework.json keys t_<clip>.
STATE (13.11 ~02:05): 24 tight-canvas jobs submitted (jobs_rework.json keys t_<clip>); .done markers of these clips renamed to .done.wide so b3/get2.sh re-downloads (wide takes go to b3/prev/<clip>.<n>.mp4). Next: poll, download, review, overrides (keep body_min), frames, adapt, wf, notes, v16.
STATE (13.11 ~02:30): all 24 tight-canvas clips downloaded to b2/mp4. Next: review (sheet.py), overrides (keep body_min), frames, adapt, wf, notes5, v16.
STATE (13.11 ~02:45): tight takes reviewed. 4 more tight retakes submitted (jobs_rework.json keys t2_*): apollo_bt_atk (bow stretched to the edge again -> pluck the string), brynhild_bt_hyp (wide wings -> halo + feathers, no wings), vanhelsing_ti_atk (shot down into the corner -> rifle across the body), zeus_ti_hyp (column to the top -> body only). The other 20 tight clips accepted; adapt them.
STATE (13.11 ~02:55): adapter running on b3/clips_tw.txt (20 tight clips, log b3/adapt_tw.log). After it: download the 4 t2_ retakes (rename their .done first: mv b3/prev/<clip>.done b3/prev/<clip>.done.t1), review, adapt them; then wf (b2/mosaic.py) for all 24, notes5 (ver 16, texts mention tight canvas), manifest, copy sheets, ?v=16, shot3 (9 gods), commit+push, zips to device kling/rework/, credits, report.
STATE (13.11 ~03:20): 4 t2 retakes downloaded+reviewed OK (frames extracted), overrides for them saved in b3/ovr_t2.json (merge into work/impact_overrides.json AFTER adapt_tw finishes, then adapt the 4). KLING_RULES.md: looser-canvas bullets struck out (not committed yet).
STATE (13.11 ~03:45): adapt_tw done (20 clips). Overrides merged for 4 t2 clips + brynhild_ti_hyp skip [[52,61]] (radial feather burst). Adapter started on b3/clips_t2.txt (log b3/adapt_t2.log). notes5.py drafted (not run).
STATE (13.11 ~04:05): all 24 tight clips adapted, wf re-measured (b2/wf.json, patched), notes5 run (ver 16), manifest built, sheets copied, ?v=16. Adapter got override body_max (apollo_bt_atk 162). Next: shot3 for 9 gods, comp2 composites, commit+push, verify live, zips to device kling/rework/, credits, report.
STATE (13.11 ~04:20): v16 committed+pushed. Left: verify live, zips of tight sources to device kling/rework/, credits, report.
STATE (13.11 ~04:30): v16 LIVE (verified ?v=16). Sources saved to device scratch kling/rework/rework_tight_1..6.zip + KLING_RULES.md. Credits 52,226. Reported to Maxim. Open: his review of v16; question about equal body size idle vs actions; KB slightly over live for indra_ti (549 vs 540, RAM under). Backlog FX items unchanged. Next after review: batch 4 (gods 13+), tight canvas only.

=== 13.11 ~05:00 Maxim's review of v16 (binding, see KLING_RULES "Added 13.11 (2)") ===
His points: (1) crop empty areas (measured: b3/margins2.py -> sheets ARE cropped, 3-5 px haze margins on older sheets);
(2) melee swing in place = player cannot tell who is hit -> leap to the enemy (stand: BR.LEAP_NEW, Brynhild leaps to the enemy of her aux shot);
(3) "not sideways" != "only up": toward the viewer + smoke puff is fine (Blackbeard); (4) VH BT atk recoil too strong; VH sup must TOSS a bottle that the game continues;
(5) Indra/Zeus atk: game bolt appears .67 s when the hand is already down -> bolt gods get release frame k=12 (stand BR.boltSync; playAnim clamps total dur to 1.7 s so k=5 can never land at .67);
(6) BT must be as rich in effects as TI (Inti BT atk poor). "Fix the bad ones and start new batches."
NEW TOOL: b3/seq.py out.jpg god slot [n] [step] = time series of the action on the stand (bt row, ti row). USE IT for every action before saying "fixed".
Retakes submitted (jobs_rework.json r4_*): vanhelsing_bt_atk, vanhelsing_bt_sup, vanhelsing_ti_sup, inti_bt_atk. Overrides re-timed k=12: indra bt/ti atk, zeus bt/ti atk (adapter b3/adapt_r4.log).
Stand patched (not committed): boltSync, LEAP_NEW, intiHead x2. app.js has a TEMP debug line (restore from /tmp/app.js.bak or remove the DBGEV line) before commit!
STATE (13.11 ~05:50): r4 retakes downloaded (b2/mp4), overrides set; adapter running on 4 clips (b3/adapt_r5.log). Bolt sheets k=12 done+verified by seq. Then: mosaic->wf for vanhelsing_bt_atk/bt_sup/ti_sup, inti_bt_atk (+ indra/zeus atk wf kept), manifest, copy sheets, seq check (vanhelsing sup/atk, inti atk), notes6, ?v=17, remove DBG line in app.js, commit+push.
STATE (13.11 ~06:25): r4 clips adapted + verified by seq (vanhelsing atk/sup, inti atk, indra/zeus atk k=12, brynhild leap). 2 more retakes submitted: r4_vanhelsing_bt_hyp, r4_vanhelsing_ti_hyp (stake goes UP out of the top; stand REL_NEW vanhelsing:hyp .32, k should be 7-8). NOTE: inside the Brynhild/VanHelsing block of fx2-stand.js 'BR' is a local palette -> use BRG. BATCH 4 = ra, heimdall, houyi, erlang, agni; tight canvases made (tight/<god>_<bt|ti>_tight.png), not uploaded yet.
STATE (13.11 ~06:45): BATCH 4 submission started (jobs_batch4.json, helper b3/j4.py; inputs uploaded, urls in tight/urls.json keys <god>_<bt|ti>). Concepts: ra=priest heal mote from ankh/palm (k5), sup aura from sun disc, hyp pharaoh pose + hieroglyph ring; heimdall=melee LEAP (k4) sword cut, sup horn blown upward (TI: swords clash -> sound rings), hyp war cry aura; houyi=ranged arrow up (k5), sup 4 quick plucks, hyp kneel + giant sun arrow; erlang=melee LEAP (k4) spear chop, sup third-eye beam up, hyp hand seal + shifting light shapes inside silhouette; agni=fire tongue from torch (k5), sup 3 flames from palm go up, hyp body wreathed in fire. Add heimdall, erlang to BR.LEAP_NEW only if their sim event is not 'lunge' (warrior/rogue already lunge).
STATE (13.11 ~07:20): v17 committed+pushed (Brynhild leap, bolt k=12, VH atk/sup/hyp retakes, Inti BT atk). Batch 4: 16/40 jobs submitted (ra bt/ti, heimdall bt/ti) -> jobs_batch4.json; remaining: houyi, erlang, agni (bt+ti x4).
STATE (13.11 ~07:50): BATCH 4: ALL 40 jobs submitted (jobs_batch4.json, keys <god>_<bt|ti>_<slot>). Next: poll (query_tasks), tokens -> b3/b4tok.txt lines '<clip> <uuid-token>', b3/get2.sh, b3/frames.sh, review (b2/sheet.py, b3/motion.py for idles), overrides (k: ra/houyi/agni atk 5, heimdall/erlang atk 4 melee, sup/hyp 9; body_min after first adapt = 0.97*median action body), adapt, mosaic->wf, seq.py check of EVERY action, notes+balance (kling_done.json), ?v=18, commit. Download within 24 h (Kling URLs expire).
STATE (13.11 ~08:05): interim report sent to Maxim (v17). Batch 4: ra (8 clips) downloaded to b2/mp4; 32 left to poll+download (heimdall, houyi, erlang, agni).
STATE: batch 4 heimdall (8) downloaded; left to poll: houyi, erlang, agni (24).
STATE: batch 4 houyi (8) downloaded; left to poll: erlang, agni (16).
STATE: batch 4 erlang (8) downloaded; left to poll: agni (8).
STATE (13.11 ~08:30): batch 4: 38/40 downloaded to b2/mp4 (agni_ti_atk, agni_ti_sup still RUNNING at Kling - poll again). Next: frames, review.
STATE (13.11 ~08:50) batch 4 REVIEW (sheets b3/v4_<god>.jpg):
 ACCEPT: ra_bt_atk(imp42, origin = sun disc on head) ra_ti_atk(imp42) ra_bt_sup(imp36, soft light column from top) ra_ti_sup(imp36) ra_ti_hyp(imp47);
  heimdall_bt_atk(imp30,k4,v0 13) heimdall_ti_atk(imp21,k4,v0 8) heimdall_bt_sup(imp34, effect faint) heimdall_bt_hyp(imp~32, skip flash frame ~30) heimdall_ti_hyp(ground ring - check bodyPx);
  houyi_bt_atk(imp42) houyi_bt_sup(imp34); erlang_bt_atk(imp23,k4,v0 8) erlang_ti_atk(imp21,k4,v0 8).
 RETAKE: ra_bt_hyp (arms spread + staff swung out), heimdall_ti_sup (starburst + white frame), houyi_ti_atk + houyi_ti_sup + houyi_ti_hyp (aims sideways/down), houyi_bt_hyp (arrow tip out of frame 0.7 s, ground fire),
  erlang_bt_sup + erlang_ti_sup (threads fill the whole frame, star flare), erlang_bt_hyp + erlang_ti_hyp (wide wings).
 IDLE RETAKE (static by b3/motion.py): ra_bt, heimdall_bt, agni_ti; weak: ra_ti, heimdall_ti, erlang_ti. OK: houyi bt/ti, erlang_bt, agni_bt.
STATE (13.11 ~09:05): batch 4: 6 idle retakes submitted (jobs_batch4.json keys r_*). Adapter started on b3/clips_b4a.txt (21 accepted clips, log b3/adapt_b4a.log). Still to submit: action retakes ra_bt_hyp, heimdall_ti_sup, houyi_ti_atk/ti_sup/bt_hyp/ti_hyp, erlang bt/ti sup, erlang bt/ti hyp, agni_bt_atk (staff swung horizontally); poll agni_ti_atk, agni_ti_sup.
STATE (13.11 ~09:25): ALL 17 batch-4 retakes submitted (jobs_batch4.json keys r_<clip>): 6 idles + ra_bt_hyp, heimdall_ti_sup, houyi_ti_atk/ti_sup/bt_hyp/ti_hyp, erlang bt/ti sup, erlang bt/ti hyp, agni_bt_atk. agni_ti_atk/sup downloaded (40/40 first takes on disk). Adapter b4a running.
STATE: batch-4 retakes: .done markers of all 18 retake clips renamed (.done.take1). Downloaded retakes: ra_bt_idle heimdall_bt_idle heimdall_ti_idle erlang_ti_idle agni_ti_idle. Kling rate-limits at >4-5 polls at once.
STATE: retakes downloaded so far: 6 idles + ra_bt_hyp heimdall_ti_sup houyi_ti_atk. Left to poll: r_houyi_ti_sup r_houyi_bt_hyp r_houyi_ti_hyp r_erlang_bt_sup r_erlang_ti_sup r_erlang_bt_hyp r_erlang_ti_hyp r_agni_bt_atk r_agni_ti_atk.
STATE: retakes also downloaded: houyi_ti_sup houyi_bt_hyp houyi_ti_hyp erlang_bt_sup. Left to poll: r_erlang_ti_sup r_erlang_bt_hyp r_erlang_ti_hyp r_agni_bt_atk r_agni_ti_atk.
STATE (13.11 ~10:00): ALL 18 batch-4 retakes downloaded + frames extracted. Next: review retakes (sheets), overrides, adapt (after b4a adapter ends), body_min, wf, seq, notes+balance, v18.
STATE (13.11 ~10:20): retakes reviewed (b3/v4_r1.jpg, v4_r2.jpg). Overrides set for retakes + agni_ti_sup; list b3/clips_b4b.txt (18 clips) to adapt AFTER adapt_b4a finishes (never two adapters). Tricks: houyi_ti_atk skip [[13,43]] (horizontal arrow cut out), erlang_ti_hyp skip [[37,52]] (0.5 s flash), agni_ti_atk skip [[35,49]] (fire column), erlang sup skips for white frames.
 Still pending: r2_houyi_ti_hyp (second retake, palm-sun into the bow) - poll, download (mv b3/prev/houyi_ti_hyp.done first), review, adapt.
 Idle retakes are lively (motion 3-9) - heimdall_bt may be too lively; flag to Maxim.
STATE (13.11 ~10:45): adapt_b4a DONE (21 clips). adapt_b4b RUNNING (19 clips incl. houyi_ti_hyp take 3; log b3/adapt_b4b.log). notes7.py drafted (ver 18, notes+balance for 5 gods). After b4b: body table (erlang atk sheets are 150-165 px wide -> check bodyPx; set body_min per god-style and re-adapt outliers), mosaic->wf for 30 action clips, manifest, copy sheets (ra heimdall houyi erlang agni), seq.py for every action (leap for heimdall/erlang must work: sim role warrior/rogue -> lunge), shot3 errors, ?v=18, commit+push, zips to device, credits, final report.
STATE (13.11 ~11:00): wf for the 17 b4a action clips saved in b2/wf.json (NOT yet patched - run b2/patch_wf.py after adapter b4b ends). Heimdall KB over live (actions 150-188 KB vs budget 113) -> after b4b compute totals per god-style; if KB > live use override body_max on action clips (keep body >= ~145) and re-adapt.
STATE (13.11 ~11:35): adapt_b4b DONE: all 40 batch-4 sheets exist. Budget: heimdall KB 635/662 vs live 516 (RAM ok) - NOT shrunk, to be reported to Maxim for his choice; agni_ti 534 vs 528. wf patched for 17; measuring wf for the other 13 (b3/m8*.jpg).
STATE (13.11 ~11:50): wf patched for all 30 batch-4 actions, notes7 run (ver 18), manifest built, sheets copied to the repo. Next: seq.py checks (15 series), shot3 errors, ?v=18, commit+push, zips, credits, report.
STATE (13.11 ~12:05): seq checks: ra OK, heimdall OK (leaps to enemy; sup leaps to centre). Checking houyi, erlang, agni (b3/z_<god>.jpg).
STATE (13.11 ~12:25): v18 committed+pushed (batch 4 published: 40 sheets, wf, notes, balance; seq-checked all 15 actions; shot3 errors []). Left: verify live, zips of batch-4 sources to device kling/batch4/, credits, final report. Open for Maxim: heimdall KB over live (choose), houyi_ti_atk cut wind-up, erlang_ti_hyp cut flash, idles maybe too lively (heimdall_bt).
STATE (after v18): interim msg about batch 4 sent to Maxim. Next: (A) re-adapt old sheets with margins >3 px to pad 2 + re-measure wf; (B) Apollo sup game projectile -> real arrow; (C) Indra hyp sync check; (D) batch 5 = ares sting loki lubu sekhmet.
STATE: status message sent to Maxim (03:24 his question). Trim pass: b3/clips_trim.txt (11 old sheets) -> adapter log b3/adapt_trim.log.
STATE: Maxim asked (03:28) what to review -> answered: v17 fixes (Brynhild atk, VH atk BT + sup/hyp both, Indra+Zeus atk, Inti BT atk) + batch 4 gods 13-17. Apollo arrow (K1.sunArrow on proposed arenas) patched, not committed; trim adapter running. seq.py now has speed+start args: seq.py out god slot n step 0.25 start_game_ms.
STATE: stand patched (not committed): Apollo K1.sunArrow (atk .8, sup 1.05), Indra hyp bolt vajra->cloud above target, Zeus sup/hyp bolt staff->clouds (proposed arenas only). All verified with slow-mo seq. notes8.py drafted (ver 19) - run AFTER trim adapter. Then manifest, copy trimmed sheets (amaterasu apollo artemis demeter hel inti), wf re-measure for 8 trimmed action sheets, ?v=19, commit.
STATE: v19 committed+pushed (Apollo arrow, Indra/Zeus sky links, 11 sheets trimmed). Next: batch 5 (ares sting loki lubu sekhmet) - tight canvases made; ASK Maxim about Lu Bu TI art (horizontal halberd -> small stored body).
STATE: batch 5 inputs uploaded (9: all but lubu_ti - waiting for Maxim re redraw). URLs in tight/urls.json and b3/urls_b5.txt. Jobs -> jobs_batch5.json (helper: python3 b3/j4.py writes jobs_batch4 - use b3/j5.py).
STATE: batch 5 submission started (jobs_batch5.json via b3/j5.py). ares_bt done (4).
STATE: sting_bt submitted (4). Total 12 jobs in jobs_batch5.json. Next: sting_ti, loki_bt, loki_ti, lubu_bt, sekhmet_bt, sekhmet_ti.
STATE: sting_ti submitted (4). 16 jobs. Next: loki_bt, loki_ti, lubu_bt, sekhmet_bt, sekhmet_ti.
STATE: loki_bt submitted (4). 20 jobs. Loki sup = 4 crossing slashes (game: hop + flame clones cut each enemy), hyp = green flame guise + flame ball absorbed into the fist (game: stolen-power orb flies into him). Next: loki_ti, lubu_bt, sekhmet_bt, sekhmet_ti.
STATE: loki_ti submitted (4). 24 jobs. Next: lubu_bt, sekhmet_bt, sekhmet_ti (lubu_ti waits for Maxim).
STATE: lubu_bt submitted (4). 28 jobs. Halberd kept upright except a steep downward drive in atk. Next: sekhmet_bt, sekhmet_ti; then poll all 28 (ares first).
STATE: sekhmet_bt submitted (4). 32 jobs. Sekhmet atk = blank shot at the scepter (game flies the flame sun). Next: sekhmet_ti; then poll.
STATE: ALL 36 batch-5 jobs submitted (lubu_ti waits for Maxim). Next: poll 4-5 at a time (b3/get2.sh to download), frames, review.
STATE: ares bt+ti 8 clips downloaded (b2/mp4). Sting/Loki/Lubu/Sekhmet still to poll.
STATE (04:00 Maxim review of v17-19) -> FIX LIST (rules section 13.11 (4)):
 agni: BT idle static -> reshoot; TI idle dances -> reshoot calmer; TI atk flicker (skip 35-49) -> reshoot no skip; BT sup ring cut at edge -> reshoot (fire leaves hand like TI); hyp game fire jerky -> smooth stand code.
 erlang: atk spear return clipped (esp BT) -> check crop/reshoot; sup game effect from neck(TI)/shoulder(BT) -> start at hand.
 houyi: atk/sup/hyp all bad (bow unused, effect from emptiness, jerks) -> reshoot all 3 both styles with real draw+release, game arrow from bow.
 heimdall: sup/hyp game fx weak -> richer.  ra: TI atk jerk -> reshoot/no skip; sup simple; hyp boat game fx weak.
 inti: atk game ball dull -> real sun-arrow/flame.  vanhelsing: TI idle turntable -> reshoot; atk game fx bad; sup too simple (no magic) -> reshoot; hyp crossbow sigil unclear -> drop.
 brynhild: atk sluggish leap -> faster leap synced to swing; TI sup items fly before hand raised -> delay to hand.
 Indra OK, Inti sup/hyp OK, Heimdall clips OK, Erlang hyp OK, Ares batch5: TI atk/sup/hyp effects cover edges (to judge).
STATE: rework2 (Maxim 04:00): houyi 6 retakes submitted (shots toward viewer, bow upright, real draw) -> jobs_rework2.json via b3/jr.py. Next: agni idles bt/ti, agni_ti_atk, agni_bt_sup, vh_ti_idle, vh sup bt/ti.
STATE: rework2: 13 retakes submitted (houyi 6, agni 4, vh 3). Next: batch 6 = ALL remaining gods at once (Maxim 04:03: submit everything at once, then cut and update site).
STATE: batch 6 = 30 remaining gods (b3/b6_gods.txt); tight canvases made + ALL 60 uploaded (tight/urls.json). Next: prompts b3/p6.py -> b3/p6.json, submit 240 jobs -> jobs_batch6.json.
STATE: batch6 submission running (jobs_batch6.json via b3/j6.py, prompts b3/p6.json); 8 at once works. Done: surt.
STATE: batch6 submitted: surt shango shiva aoguang atlas (40).
STATE: batch6 submitted +aphrodite llorona dutchman (64).
STATE: batch6 submitted +poseidon raijin (80).
STATE: batch6 submitted +susanoo blackbeard (96). Remaining 18 gods: heracles jekyll quetzalcoatl silent persephone wukong thor anansi veles horseman hecate dracula kali nightmare koschei lilith lucifer mictlan.
STATE: batch6 submitted +heracles jekyll (112).
STATE: batch6 submitted +quetzalcoatl silent (128). Remaining 14: persephone wukong thor anansi veles horseman hecate dracula kali nightmare koschei lilith lucifer mictlan.
STATE: batch6 submitted +persephone wukong (144).
STATE: batch6 submitted +thor (152; Mjolnir name refused by copyright filter -> neutral names). Remaining 12: anansi veles horseman hecate dracula kali nightmare koschei lilith lucifer mictlan + (lubu_ti later).
STATE: batch6 submitted +anansi veles (168). Remaining 10: horseman hecate dracula kali nightmare koschei lilith lucifer mictlan (+ lubu_ti).
STATE: batch6 submitted +horseman hecate (184). Remaining 8: dracula kali nightmare koschei lilith lucifer mictlan (+lubu_ti).
STATE: batch6 submitted +dracula kali (200). Remaining 5: nightmare koschei lilith lucifer mictlan.
STATE: batch6 submitted +nightmare koschei (216). Remaining: lilith lucifer mictlan.
STATE: batch6 submitted +lilith lucifer (232). Remaining: mictlan.
STATE: batch6 ALL 240 jobs submitted (jobs_batch6.json). Next: poll+download batch5 (36), rework2 (13), batch6 (240) via a poll helper; review; adapt; publish v20.
- b5: loki_ti_atk/sup/hyp REFUSED copyright (not charged) -> rephrase+resubmit
- b5 + rework2 downloaded (except loki_ti atk/sup/hyp refused)
- b6: lilith_bt_idle REFUSED copyright -> rephrase+resubmit
- b6: lilith_bt_sup/hyp REFUSED copyright
- b6 all downloaded except lilith_bt idle/sup/hyp (refused)
- fix1 submitted (6 copyright retakes): jobs_fix1.json
rt7: submitted 0-5 (jobs_rt7.json)
rt7: thor_bt_sup/hyp, thor_ti_sup/hyp refused (copyright, Mjolnir) -> resubmit neutral wording
rt7: all 69 submitted (jobs_rt7.json). Next: poll fix1 + rt7
fix1: loki_ti_atk, loki_ti_sup, lilith_bt_idle refused again (copyright, result-side); loki_ti_hyp OK downloaded
fix1: lilith_bt_sup/hyp refused 2nd time too -> ask Maxim (art triggers copyright)
rt7: all 69 downloaded (b3/tok_rt7.txt); old takes in b3/prev/*.1.mp4
rt8: review8.md, p8.json (41: vertical-only weapon rule). submitting; ids in jobs_rt8.json
rt8: all 41 submitted (jobs_rt8.json). next: poll rt8, download via b3/rt8.sh (keeps take2 in prev)
heracles_bt_idle: rt8 take static (12.5) -> restored rt7 take (.2, 16.6); rt8 kept as prev .3
rt9: 10 submitted (p9.json, jobs_rt9.json); heracles_bt_sup rt8 still running
rt9: all 10 + heracles_bt_sup(rt8) downloaded
rt9 reviewed (review8.md). jekyll_ti_hyp = original take1. Next: frames for 11, adapter on b3/clips_v20.txt (279) in background, log b3/adapt_v20.log
STATE: frames now extracted at 420 px high (b3/frames_h.sh) -> adapter ~25 s/clip. adapter running on b3/clips_v20.txt (279), log b3/adapt_v20.log. Stand patched (not committed): Erlang sup from hand (wp s), VH ult sigil removed, Inti atk sun ray, Brynhild sup waits relT, Agni ult fire smoother, Hou Yi atk/hyp at relT + old hyp masks removed. NOTE: amaterasu_ti_sup_take1_rejected sheet must not be committed.
STATE: container restarted at 54/279 -> adapter restarted on b3/clips_v20r.txt (log b3/adapt_v20r.log). notes9 run (ver 20, 52 gods).
STATE: adapter v20 DONE (279). Next: b3/pub20.sh, shot3, commit v20, push
v20 review: cleared stale overrides (except body_min/max) for 10 re-taken clips (backup work/impact_overrides.before_v20.json), re-adapting b3/clips_v20o.txt
STATE: JS review fixes applied (left arena kept via F.newSheet/BR.isProposed; Inti beam; Hou Yi relDt + oldCut masks; Erlang/Brynhild from F.wp). adapter KeyError fixed (overrides w/o imp/k). dracula 6 metrics lost by concurrent runs -> re-adapted. manual wf for 7 clips (houyi*, agni_bt_sup, vh_bt_sup) re-adapting /tmp/a4.log. review round 2 agent running.
STATE: v20 committed 1fd0ef7, pushed, live OK. Review round 2 fixes applied (Hou Yi sup no .5 snap, Agni flames atRaw, Inti aux sun ray, Erlang no neck eye, Brynhild ult from hand, left arena HEAD formulas). Open: Heimdall sup/ult richer, Ra boat, Brynhild atk leap, Lilith/Loki copyright decision, Lu Bu TI.

## REDO PASS R1 (13.11 afternoon, new chat, PLAYBOOK v1): gods 1-5 kitsune athena artemis zeus demeter
Adapter v21: per-animation budget (live_ref), action body = idle body (idle_body_px), frame-limit crop + solid_cut flag, skip forbidden, idles first.
Retakes (26, prompts b3/p10.json via b3/p10.py, ids jobs_r1.json,): kitsune x8 (sources lost), athena bt_idle ti_idle bt_sup ti_sup (lost) + bt_atk (spear aimed sideways 1 s),
artemis 6 actions (aim sideways + skips), zeus bt_sup ti_sup (turn side) bt_hyp ti_hyp (ghost body/legs), demeter bt_idle (static 16%) bt_atk (arc ring) bt_sup (small thorns).
Kept + re-cut: artemis idles, zeus idles + bt_atk + ti_atk (skips removed), demeter ti x4 + bt_hyp, athena bt_hyp ti_atk ti_hyp.
STATE: kitsune 8 submitted.
STATE: +athena 5, artemis_bt 3 submitted (16). Left: artemis_ti 3, zeus 4, demeter_bt 3.
STATE (13.11 ~14:40): ALL 26 R1 retakes submitted (jobs_r1.json). Next: poll query_tasks (3-4 at a time), download to b2/mp4 (old takes -> b3/prev/<clip>.v20.mp4), frames_h, strip review, overrides, adapt (idles first), wf, seq, notes, v21.
STATE: 25/26 R1 takes downloaded (artemis_ti_atk still RUNNING at Kling). Review: see b3/review_r1.md
STATE (~15:05): round 2 (prompts b3/p11.json): 7 submitted (kitsune_ti idle/atk, athena_bt idle/atk, demeter_bt_idle, zeus bt/ti hyp). Artemis: 'bird overhead' wording tested on 2 clips first (bt_atk, ti_hyp), other 4 after the check. dl1.sh keeps only the v20 take in prev -> round-1 takes of retaken clips are moved by hand to b3/prev/<clip>.r1.mp4 before download.
STATE (~15:20): round 2: 9 downloaded+reviewed (review_r1.md); artemis bt_sup/bt_hyp/ti_atk/ti_sup r2 submitted. adapt_r1b running (10 clips).
STATE (~15:50): ALL R1 clips on disk (26 + 17 round-2). Adapted v21: kitsune 8, athena 8, zeus 8, demeter 8, artemis idles. Left: artemis 6 actions (overrides set except bt_sup), wf for all actions (b3/wfview.py + b3/setwf.py), margins, stand, notes10, v21.
R2 (15:45): 27 retakes p12.json, ids jobs_r2.json. 9 submitted.
R2: 18/27 submitted.
R2: ALL 27 submitted (jobs_r2.json); v21 takes saved as b3/prev/<clip>.v21.mp4; download with b3/dl2.sh
r2b kitsune_ti_idle: AQ.. (2nd take, glued feet 0.6%)
