# StromBench

Measures macOS power consumption across web browsers during real-world browsing tasks.

Uses `powermetrics` to capture Combined Power (CPU + GPU + ANE) in milliwatts at 1-second intervals, then generates static HTML reports with Chart.js.

Original benchmark results: https://medium.com/homullus/8-browsers-in-a-tiny-car-energy-efficiency-benchmark-fe3ca82f1690

## Usage

### 1. Collect power data

```bash
sudo ./measure.sh chrome
```

Runs until you press Ctrl+C. Writes `recordings/chrome.csv`.

### 3. Compare all recordings

```bash
bun install
bun run src/benchmark.ts
```

Reads all CSVs in `recordings/` and generates `recordings/benchmark.html` — bar charts, overlaid time series, and per-action-phase breakdowns.

## Test methodology

Each browser is tested one at a time with strict isolation:

- Full system restart between runs
- 100% battery, plugged in
- No other apps running
- CPU stabilization wait before starting
- Same scripted sequence of real-world browsing tasks (~17 minutes)

The test route covers: Notion, Speedtest, Speedometer, YouTube 2K HDR, PiP video, article reading, apartment search, Google Maps, Pinterest, food delivery, electronics browsing, and translated news reading.

## Data format

CSV with no header:

```
1681226924,28
1681226925,48
```

Column 1: unix timestamp. Column 2: milliwatts (CPU+GPU+ANE).
