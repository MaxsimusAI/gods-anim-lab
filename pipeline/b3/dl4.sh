#!/bin/bash
# dl4.sh <clip> <result url> -> r4/mp4/<clip>.mp4 (round 4, 13.11 evening); prints nothing secret
c=$1; u=$2; D=/home/claude/kl/r4/mp4; mkdir -p $D
curl -sS -L -m 120 -o $D/$c.mp4.part "$u" && mv $D/$c.mp4.part $D/$c.mp4
echo "$c $(stat -c %s $D/$c.mp4 2>/dev/null) bytes $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames -of csv=p=0 $D/$c.mp4 2>&1 | head -1)"
