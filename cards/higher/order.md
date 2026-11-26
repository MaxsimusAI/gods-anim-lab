# Order (Порядок) — higher goddess, BT

Art: `work/tasks/229-higher-goddess-art-2/out/order-bt-a-v2.png` (game repo), accepted in round 2. Skill «Закон защиты»: attacks two
enemies, a shield on every ally for 8 s. Live game: the old armoured design, sheets `art/mob/hg/order-*.webp`.

clip: order_bt_idle — status: shot 26.11 (take 1), waits for his look
idea: weight from leg to leg, braid and cape sway; the blue scales pulse, light runs up the spear blade.
prompt: pipeline/hg/prompts/order_bt_idle.txt

clip: order_bt_app — status: shot 26.11 (take 1), waits for his look
idea: blue/golden lines draw her outline from the feet up, fill with light, the spear forms from a golden line, the shield last.
watch: the forming spear is a golden line through the whole frame height for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_app.txt

clip: order_bt_atk — status: shot 26.11 (take 1), waits for his look
type: ranged + buff
idea: sinks low, the scales blaze, rises and slams the spear butt on the ground; light runs up the shaft and flares on the blade.
release: sheet frame 10 (the slam); wf = spear blade [0.295, 0.21]; wf2 = shield centre [0.735, 0.62]
game_fx: two lances of light from the blade to two enemies (golden scales flash on each), a blue shield flies from her shield to every
ally and stays on him as a dome (FX.order).
watch: at the slam the blue cape opens as a dome across the whole frame width; the spear light leaves the top edge for ~1 s; the
shield flare is a bright star for ~0.3 s.
prompt: pipeline/hg/prompts/order_bt_atk.txt
