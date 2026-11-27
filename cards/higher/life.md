# Life (Жизнь) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/life-bt-a-v1.png` (game repo), accepted in round 2. Skill «Дар жизни»: attacks every
enemy, heals every ally, cleanses curses, poisons and control except petrification. Not in the live game (no sheets in art/mob/hg).
Picked for the test (26.11 22:59) by the executor: a heal-everyone skill, unlike Order/Plague.

clip: life_bt_idle — status: shot 26.11 (2 variants), published b, waits for his look
takes: two requests refused by Kling moderation (wording «breathes deeply», «sway of her hips», «bare feet» on this art) → reworded.
idea: calm sway from leg to leg; the bud of the spear glows; green-gold vine patterns on arms; crown glows; a rim of light.
watch: the body motion is small in both variants (D5) — b has more light on the body (blossoms along the spear, glowing arms).
prompt: pipeline/hg/prompts/life_bt_idle.txt

clip: life_bt_app — status: shot 26.11 (2 variants), published b, waits for his look
idea: a sprout grows from the ground, vines with pink buds rise and bloom into her figure, the spear grows last.
a not used: the hair forms as an empty head shape for ~0.5 s.
prompt: pipeline/hg/prompts/life_bt_app.txt

clip: life_bt_atk — status: shot 26.11 (2 variants), published a, waits for his look
type: all enemies + heal all allies
idea: crouch with vines and blossoms round her, rises, the spear bud opens into a big golden flower, golden petals pour out,
a green ring of light on the ground.
watch: the spear is held high with the flower at the top edge for ~1 s (C4); petals fly far, up to the edges (C3); a bright
glow at the opening (~0.15 s). b not used: a starburst of rays at the opening (A3).
game_fx: from the opened flower a stream of her golden petals (cut from the clip) goes to every enemy; from her palm flower a
white blossom (cut from her art) drifts to every ally and opens into green healing light (FX.life).
prompt: pipeline/hg/prompts/life_bt_atk.txt

## v5 (27.11 ~01:00, after Maxim 00:14: entrances static and alike, idle "just a glow", skills kept clear of her, nothing up)
- prompts: pipeline/hg/prompts/life_bt_{idle,app,atk}_v5.txt, 2 variants each; picks and faults in the notes on the stand.
- picks: idle v5b (a spiral of pink petals rises over her), entrance v5a (a giant bud opens, she rises from it; the bud is there
  from frame 1), skill v5b (ring of light and vines, a big golden flower opens at her chest, green healing light pours over her).
  Release 12 petals from the flower wf [0.44,0.25]; 13 blossoms from the palm wf2 [0.80,0.44].

- 27.11 01:29 ACCEPTED by Maxim («все круто получилось»): the v5 idle, entrance and skill are protected takes.

## 27.11 — after Maxim 04:08

This section is current; where the text above differs (takes, release points, game_fx), it describes the work before
his remarks of 04:08.

All three sheets re-cut with matte v3 (`pipeline/hg/matte3.py`, `hgcut3.py`; anything that runs out of a side of the
video dissolves over 6 % of the width). Protected take (accepted 01:29): re-cut only, the same 25 moments.

- idle: take `life_bt_idle_v5b`; sheet 242×276, 621 KB, 6.37 MB
- entrance: take `life_bt_app_v5a`; sheet 254×292, 547 KB, 7.07 MB
- skill: take `life_bt_atk_v5b`; sheet 253×305, 717 KB, 7.36 MB
- release: frame 12 wf [0.53, 0.33]; frame 13 wf2 [0.8, 0.44]

Notes on the stand now (Russian):
- Ожидание — новый дубль: вокруг неё поднимается спираль из розовых лепестков и проходит прямо по фигуре; по копью распускаются цветы.
- Появление — новое: огромный розовый бутон раскрывается, она поднимается из него и разводит руки, лепестки разлетаются и становятся её платьем, копьё и цветок на ладони появляются последними.
- Умение: проводит копьём круг света с лозами и цветами вокруг себя, у её груди раскрывается большой золотой цветок, на неё льётся зелёный свет лечения, по платью распускаются цветы.
- Что не так: бутон в появлении возникает сразу целиком; копьё в появлении и в конце умения на полсекунды поднимается к верхнему краю.
- Вторые варианты не показываю: в умении от цветка лучи во все стороны и зелёный столб уходит вверх; в появлении из-под бутона торчат ноги; в ожидании бабочки улетают за верх кадра.
- Эффект игры: из большого цветка у её груди к каждому врагу летит поток её золотых лепестков; с цветка на ладони к каждому союзнику плывёт её белый цветок и раскрывается зелёным светом лечения.
- Уход — появление задом наперёд.
