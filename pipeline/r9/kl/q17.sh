#!/bin/bash
while pgrep -f "sharp_alt.sh|alts.sh" >/dev/null; do sleep 15; done
cd /home/claude/kl && bash b3/sharp_batch4.sh lubu_bt_atk hecate_ti_sup
