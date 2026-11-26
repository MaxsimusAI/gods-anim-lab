# Order (Порядок) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/order-bt-a-v2.png` (game repo), accepted in round 2. Skill «Закон защиты»: attacks two
enemies, a shield on every ally for 8 s. Live game: the old armoured design, sheets `art/mob/hg/order-*.webp`.

clip: order_bt_idle — status: take 2 (retake 1) shot 26.11, waits for his look
takes: 1 FAIL (fresh eyes: legs dead, feet 0.4 px over the loop) · 2 used (prompt order_bt_idle_r1.txt: the leg action named)
idea: weight from leg to leg, braid and cape sway; the blue scales pulse, light runs up the spear blade.
prompt: pipeline/hg/prompts/order_bt_idle.txt

clip: order_bt_app — status: shot 26.11 (take 1), waits for his look
idea: blue/golden lines draw her outline from the feet up, fill with light, the spear forms from a golden line, the shield last.
watch: the forming spear is a golden line through the whole frame height for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_app.txt

clip: order_bt_atk — status: take 2 (retake 1) shot 26.11, waits for his look
takes: 1 FAIL (starburst on the shield and on the ground, A3) · 2 used (prompt order_bt_atk_r1.txt: the light described as a glow)
type: ranged + buff
idea: sinks low, the scales blaze, rises and slams the spear butt on the ground; light runs up the shaft and flares on the blade.
release: sheet frame 10 (the slam); wf = spear blade [0.295, 0.21]; wf2 = shield centre [0.735, 0.62]
game_fx: the spear light leaves the top of the clip; from that point two lances of light go to two enemies and break into crystal shards;
her own shield (cut from her portrait) flies from her shield to every ally and melts into a film of light (FX.order). No scales.
watch: at the slam the blue cape opens as a dome across the whole frame width; the spear light leaves the top edge for ~1 s; the
shield flare is a bright star for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_atk.txt
