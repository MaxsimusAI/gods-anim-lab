#!/bin/bash
# dl1.sh <clip> <result url>  -> keeps the previous take as b3/prev/<clip>.v20.mp4, saves the new one to b2/mp4/<clip>.mp4 (prints nothing secret)
c=$1; u=$2; K=/home/claude/kl; mkdir -p $K/b3/prev
[ -s $K/b2/mp4/$c.mp4 ] && [ ! -e $K/b3/prev/$c.v20.mp4 ] && mv $K/b2/mp4/$c.mp4 $K/b3/prev/$c.v20.mp4
curl -sS -L -m 120 -o $K/b2/mp4/$c.mp4.part "$u" && mv $K/b2/mp4/$c.mp4.part $K/b2/mp4/$c.mp4
echo "$c $(stat -c %s $K/b2/mp4/$c.mp4 2>/dev/null) bytes $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames -of csv=p=0 $K/b2/mp4/$c.mp4 2>&1 | head -1)"
