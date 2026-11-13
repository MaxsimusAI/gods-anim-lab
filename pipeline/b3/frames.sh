#!/bin/bash
# frames.sh clip...  -> work/frames_all/<clip>/f_%03d.png
for c in "$@"; do d=/home/claude/kl/work/frames_all/$c; rm -rf $d; mkdir -p $d; ffmpeg -v error -y -i /home/claude/kl/b2/mp4/$c.mp4 $d/f_%03d.png; echo -n "$c $(ls $d | wc -l); "; done; echo
