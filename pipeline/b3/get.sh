#!/bin/bash
# get.sh <clip> <url>: keep the previous take in b3/prev/<clip>.v21.mp4 (once), then download the new one
K=/home/claude/kl; c=$1
[ -f $K/b2/mp4/$c.mp4 ] && [ ! -f $K/b3/prev/$c.v21.mp4 ] && cp $K/b2/mp4/$c.mp4 $K/b3/prev/$c.v21.mp4
bash $K/b3/dl2.sh $c "$2"
