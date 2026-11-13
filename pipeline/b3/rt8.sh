#!/bin/bash
# stdin: "clip token" lines -> keep old take, download new take
cd /home/claude/kl; T=$(mktemp)
while read n t; do [ -z "$n" ] && continue
  [ -e b3/prev/$n.done ] && mv b3/prev/$n.done b3/prev/$n.done.take2
  echo "$n $t" >> b3/tok_rt8.txt; echo "$n $t" >> $T; done
bash b3/get2.sh $T; rm -f $T
