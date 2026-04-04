# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StromBench measures macOS power consumption (CPU + GPU + ANE) across web browsers during real-world browsing tasks. Measurement is a minimal bash script wrapping `powermetrics`; analysis and charting are TypeScript/Bun scripts that generate static HTML reports with Chart.js.

Results from the original version: https://medium.com/homullus/8-browsers-in-a-tiny-car-energy-efficiency-benchmark-fe3ca82f1690

## Commands

```bash
# Collect power data (requires sudo, Ctrl+C to stop)
sudo ./measure.sh <label>

# Generate comparison report across all recordings
bun run src/benchmark.ts

# Lint/format
bun run lint
bun run format
```

## Architecture

**Measurement** (`measure.sh`): Bash script that pipes `powermetrics` output through grep/sed to extract Combined Power (CPU+GPU+ANE) in milliwatts, writing one `timestamp,mw` line per second to `recordings/<label>.csv`.

**Analysis** (TypeScript/Bun):
- `src/benchmark.ts` — Reads all CSVs from `recordings/`, generates `recordings/benchmark.html` with comparison bar charts, overlaid line charts, and per-action-phase faceted charts.
- `src/scenario.ts` — Exports action phase time window definitions (placeholder 12-step test route).

**Data format**: CSV with no header, `<unix_timestamp>,<milliwatts>` per line. Label derived from filename, sequential second from line number.

## Stack

- Bun runtime, TypeScript, Biome (default settings)
- Chart.js via CDN in generated HTML
- No runtime dependencies
