#!/bin/bash
# get2.sh tokfile : keep the previous take in b3/prev/<clip>.<n>.mp4, then download the new one to b2/mp4/<clip>.mp4
F=$(realpath "$1"); mkdir -p /home/claude/kl/b3/prev
while read n t; do
  [ -z "$n" ] && continue
  if [ -s /home/claude/kl/b2/mp4/$n.mp4 ] && [ ! -e /home/claude/kl/b3/prev/$n.done ]; then
    i=1; while [ -e /home/claude/kl/b3/prev/$n.$i.mp4 ]; do i=$((i+1)); done
    mv /home/claude/kl/b2/mp4/$n.mp4 /home/claude/kl/b3/prev/$n.$i.mp4
  fi
  [ -e /home/claude/kl/b3/prev/$n.done ] || { /home/claude/kl/dl.sh /home/claude/kl/b2/mp4 $n "$t" | tr '\n' ' '; [ -s /home/claude/kl/b2/mp4/$n.mp4 ] && touch /home/claude/kl/b3/prev/$n.done; }
done < "$F"; echo
