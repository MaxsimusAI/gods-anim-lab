#!/bin/bash
# dl2.sh <clip> <result url> : download a finished Kling job over b2/mp4/<clip>.mp4 (the previous take must already be in b3/prev/)
c=$1; u=$2; K=/home/claude/kl
curl -sS -L -m 120 -o $K/b2/mp4/$c.mp4.part "$u" && mv $K/b2/mp4/$c.mp4.part $K/b2/mp4/$c.mp4
echo "$c $(stat -c %s $K/b2/mp4/$c.mp4) bytes"
