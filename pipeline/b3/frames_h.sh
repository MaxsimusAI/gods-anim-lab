#!/bin/bash
# frames_h.sh clip... -> work/frames_all/<clip>/f_%03d.png at half size (420 px high) - 4x faster adapter, 4x less disk
for c in "$@"; do d=/home/claude/kl/work/frames_all/$c; rm -rf $d; mkdir -p $d; ffmpeg -v error -y -i /home/claude/kl/b2/mp4/$c.mp4 -vf scale=-2:420:flags=lanczos $d/f_%03d.png; done
