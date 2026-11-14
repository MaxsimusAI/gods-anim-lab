#!/bin/bash
# usage: dl_r2.sh <clip> <url>
clip="$1"; url="$2"; d=/home/claude/kl/r9/mp4r2
if grep -q "^$clip " /home/claude/kl/r9/done_r2.txt 2>/dev/null; then echo "$clip already done"; exit 0; fi
curl -sS -L -m 180 -o "$d/$clip.mp4.part" "$url" && mv "$d/$clip.mp4.part" "$d/$clip.mp4" || { echo "$clip DOWNLOAD FAILED"; exit 1; }
r=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames -of csv=p=0 "$d/$clip.mp4")
if [ -z "$r" ]; then echo "$clip FFPROBE FAILED"; exit 1; fi
w=$(echo "$r"|cut -d, -f1); h=$(echo "$r"|cut -d, -f2); n=$(echo "$r"|cut -d, -f3)
echo "$clip ${w}x${h} $n" >> /home/claude/kl/r9/done_r2.txt
echo "$clip ${w}x${h} $n OK"
