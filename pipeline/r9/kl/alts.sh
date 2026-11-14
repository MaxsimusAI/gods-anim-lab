#!/bin/bash
# waits for the repairs queue, then cuts four near-miss retakes as «Версия 2» (one at a time: memory)
while pgrep -f sharp_batch3.sh >/dev/null; do sleep 20; done
cd /home/claude/kl
bash b3/sharp_alt.sh thor_bt_sup r9/mp4r2/thor_bt_sup.mp4 v2 "новый дубль 15.11: сильный удар молотом в землю, но в замахе разворот и молот над головой"
bash b3/sharp_alt.sh wukong_ti_hyp r9/mp4r2/wukong_ti_hyp.mp4 v2 "новый дубль 15.11: ставит посох с ударом о землю, золотые кольца по посоху; лицо закрыто руками во время удара"
bash b3/sharp_alt.sh nightmare_bt_hyp r9/mp4r2/nightmare_bt_hyp.mp4 v2 "новый дубль 15.11: тяжёлый взмах косой с шагом; фиолетовая полоса через кадр, шагает на зрителя"
bash b3/sharp_alt.sh lucifer_ti_hyp r9/mp4r2/lucifer_ti_hyp.mp4 v2 "новый дубль 15.11: звезда разгорается над ладонью сбоку; звезда крупная, обрезается краем"
echo ALTS DONE
