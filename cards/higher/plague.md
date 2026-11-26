# Plague (Чума) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/plague-bt-a-v1.png` (game repo), accepted in round 2. Skill «Печать чумы»: attacks every
enemy, each enemy takes more damage over 4 s. Live game: no Plague sheets in the game folder (`art/mob/hg` has 12 other goddesses).

clip: plague_bt_idle — status: shot 26.11 (take 1), waits for his look
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
watch: the bloom covers her chest and mask for ~0.2 s; gray smoke removed by the cut (`KL_DESMOKE=1`).
game_fx: poison comets from the censer to every enemy; a seal with the three slits of her mask burns on each enemy for 4 s, four ticks
(FX.plague).
prompts: pipeline/hg/prompts/plague_bt_atk.txt, plague_bt_atk_r1.txt (retakes 1 and 2: the release line changed, see LOG)
