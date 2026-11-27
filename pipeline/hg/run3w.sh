#!/bin/bash
# wait for a runner to finish, then run another list: run3w.sh wait_tag tag god...
cd /home/claude/hgk; w=$1; shift
until grep -q DONE run3_$w.progress 2>/dev/null; do sleep 20; done
exec ./run3.sh "$@"
