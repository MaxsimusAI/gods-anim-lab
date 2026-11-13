#!/bin/bash
# get3.sh <clip> <url>: keep the current take as b3/prev/<clip>.r2.mp4 (once), then download the R3 take
K=/home/claude/kl; c=$1
[ -f $K/b2/mp4/$c.mp4 ] && [ ! -f $K/b3/prev/$c.r2.mp4 ] && cp $K/b2/mp4/$c.mp4 $K/b3/prev/$c.r2.mp4
bash $K/b3/dl2.sh $c "$2"
