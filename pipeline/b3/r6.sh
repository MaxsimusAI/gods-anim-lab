#!/bin/bash
# stdin: "clip token" lines -> append to b3/tok6.txt, download, print next pending
cd /home/claude/kl; T=$(mktemp); cat > $T; cat $T >> b3/tok6.txt
bash b3/get2.sh $T 2>&1 | tr -s ' ' | sed 's/ 200 [0-9]*//g'; rm -f $T
python3 b3/next6.py ${1:-4}
