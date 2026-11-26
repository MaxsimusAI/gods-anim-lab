# Plague (Чума) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/plague-bt-a-v1.png` (game repo), accepted in round 2. Skill «Печать чумы»: attacks every
enemy, each enemy takes more damage over 4 s. Live game: no Plague sheets in the game folder (`art/mob/hg` has 12 other goddesses).

clip: plague_bt_idle — status: take 2 (retake 1) shot 26.11, waits for his look
takes: 1 FAIL (fresh eyes: legs dead) · 2 used (prompt plague_bt_idle_r1.txt: the leg action named)
idea: weight from leg to leg, the censer swings like a pendulum, the vials and the censer pulse, thin green wisps rise from the censer.
prompt: pipeline/hg/prompts/plague_bt_idle.txt

clip: plague_bt_app — status: shot 26.11 (take 1), waits for his look
idea: a swirl of green flame gathers into her shape, the flames fall away top to bottom, the censer lights last.
watch: the swirl comes down from the top edge (the prompt said "rises from the ground"); a green glow on the floor at her feet.
prompt: pipeline/hg/prompts/plague_bt_app.txt

clip: plague_bt_atk — status: take 3 (retake 2) shot 26.11, waits for his look
type: ranged (every enemy)
takes: 1 FAIL (the censer grew several times, left the frame for ~1 s, she turned sideways, gray smoke) · 2 FAIL (censer raised above
the head into the top corner for ~0.5 s) · 3 used: wide stance, swing at the hip, catches the censer at the waist, a large green flame
bloom out of the censer.
watch: the bloom covers her chest and mask for ~0.4 s (sheet frames 10-13); gray smoke removed by the cut (`KL_DESMOKE=2`).
game_fx: clots of her own green fire (cut from her entrance clip) fly from the censer to every enemy and keep burning on each for 4 s,
flaring at the four ticks (FX.plague). No seal, no bubbles.
prompts: pipeline/hg/prompts/plague_bt_atk.txt, plague_bt_atk_r1.txt, plague_bt_atk_r2.txt (used)

## v3 (26.11 ~22:30, after Maxim 21:50)
- idle: v3b (prompt plague_bt_idle_v3.txt) — steps and bends, wide censer pendulum, green streams on the chain and hands.
- skill: v3b (prompt plague_bt_atk_v3.txt) — a ring of green fire in the swing, a fountain of fire from the censer that spreads into a
  cloud at the top and rains down. Release 12, clots from the top of the fountain wf [0.5,0.07].

## v4 (26.11 ~22:50, after Maxim 22:39 «эффекты только на оружии… эффекты и на самом боге»)
- idle: v4a (prompt plague_bt_idle_v4.txt, 2 variants) — green veins glow under the skin of the arms and thighs, she sways and steps,
  the cloak swings, green fire drips from the censer to the feet, green fire at the fingers. v4b: veins too, less body motion.
  Sheet 229×263, 429 KB.
- skill: v4a (prompt plague_bt_atk_v4.txt) — a censer swing with a trail of green fire, a fountain from the censer, a cloud at the top
  and rain; the whole figure burns in green fire, the leg veins glow. Sheet 266×309, 527 KB. Release 11, clots from the fountain top
  wf [0.5,0.06]. watch: the cloud reaches the top edge ~1 s (fades); the fountain covers chest and mask ~0.6 s (frames 8–13).
  v4b not shown: a lens-flare line across the whole frame from the mask (A3).
- entrance: unchanged (same sheet bytes); exit = the entrance backwards.
