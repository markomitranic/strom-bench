#!/bin/bash
set -euo pipefail

label="${1:?Usage: sudo ./measure.sh <label>}"

mkdir -p recordings

powermetrics -i 1000 --samplers cpu_power,gpu_power \
  -a --hide-cpu-duty-cycle \
  --show-usage-summary \
  --show-extra-power-info \
| grep --line-buffered -E "Combined Power \(CPU \+ GPU \+ ANE\): [0-9]+" \
| sed -u -n 's/Combined Power (CPU + GPU + ANE): \([0-9]*\) mW/\1/p' \
| while read -r mw; do printf "%s,%s\n" "$(date +%s)" "$mw"; done \
> "recordings/${label}.csv"
