import { readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { ACTION_PHASES } from "./scenario.ts";

const dir = "recordings";
const files = readdirSync(dir).filter((f) => f.endsWith(".csv"));

if (files.length === 0) {
	console.error("No CSV files found in recordings/");
	process.exit(1);
}

const COLORS = [
	"#4cc9f0",
	"#f72585",
	"#7209b7",
	"#3a0ca3",
	"#4361ee",
	"#4895ef",
	"#560bad",
	"#480ca8",
	"#b5179e",
	"#f77f00",
];

const recordings = files.map((file, i) => {
	const label = basename(file, ".csv");
	const raw = Bun.file(join(dir, file)).text();
	return {
		label,
		file,
		color: COLORS[i % COLORS.length] ?? "#888",
		rawPromise: raw,
	};
});

const loaded = await Promise.all(
	recordings.map(async (r) => {
		const raw = await r.rawPromise;
		const samples = raw
			.trim()
			.split("\n")
			.map((line, i) => {
				const [ts, mw] = line.split(",");
				return { t: Number(ts), s: i + 1, mw: Number(mw) };
			});
		const total = samples.reduce((a, s) => a + s.mw, 0);
		return { ...r, samples, total };
	}),
);

for (const r of loaded) {
	console.log(`${r.label}: ${r.samples.length} samples, total ${r.total} mW·s`);
}

// Per-action totals for faceted charts
const phaseData = ACTION_PHASES.map((phase, i) => {
	const startSecond = i === 0 ? 1 : (ACTION_PHASES[i - 1]?.endSecond ?? 0) + 1;
	const perBrowser = loaded.map((r) => {
		const sum = r.samples
			.filter((s) => s.s >= startSecond && s.s <= phase.endSecond)
			.reduce((a, s) => a + s.mw, 0);
		return { label: r.label, total: sum, color: r.color };
	});
	return { name: phase.name, browsers: perBrowser };
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>StromBench — Benchmark</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 24px; padding-top: 72px; }
  .toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #0f0f23; border-bottom: 1px solid #2a2a4a; padding: 12px 24px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .toolbar h1 { font-size: 1.1rem; margin-right: 8px; white-space: nowrap; }
  .toolbar label { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.85rem; padding: 4px 10px; border-radius: 4px; transition: opacity 0.15s; }
  .toolbar label:has(input:not(:checked)) { opacity: 0.4; }
  .toolbar input[type="checkbox"] { accent-color: var(--color); }
  h2 { font-size: 1.1rem; margin-bottom: 12px; color: #aaa; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .full { grid-column: 1 / -1; }
  .chart-card { background: #16213e; border-radius: 8px; padding: 20px; }
  .facet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .facet-card { background: #16213e; border-radius: 8px; padding: 16px; }
  .facet-card h3 { font-size: 0.85rem; color: #888; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="toolbar">
  <h1>StromBench</h1>
${loaded.map((r) => `  <label style="--color:${r.color}"><input type="checkbox" checked data-browser="${r.label}">${r.label}</label>`).join("\n")}
</div>

<div class="grid">
  <div class="chart-card">
    <h2>Total Energy (mW·s)</h2>
    <canvas id="barTotal"></canvas>
  </div>
  <div class="chart-card">
    <h2>Average Power (mW)</h2>
    <canvas id="barAvg"></canvas>
  </div>
  <div class="chart-card full">
    <h2>Power Over Time (mW)</h2>
    <canvas id="lineAll"></canvas>
  </div>
</div>

<h2>Per Action Phase</h2>
<div class="facet-grid">
${phaseData.map((p, i) => `  <div class="facet-card"><h3>${p.name}</h3><canvas id="facet${i}"></canvas></div>`).join("\n")}
</div>

<script>
const ALL_DATA = ${JSON.stringify(
	loaded.map((r) => ({
		label: r.label,
		color: r.color,
		total: r.total,
		avg: Math.round(r.total / r.samples.length),
		samples: r.samples.map((s) => ({ x: s.s, y: s.mw })),
	})),
)};
const ALL_PHASES = ${JSON.stringify(phaseData)};

const charts = {};
const enabled = new Set(ALL_DATA.map(d => d.label));

function filtered() { return ALL_DATA.filter(d => enabled.has(d.label)); }

function barOpts(title) {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#888' }, grid: { color: '#2a2a4a' } },
      y: { title: { display: true, text: title, color: '#888' }, ticks: { color: '#888' }, grid: { color: '#2a2a4a' } }
    }
  };
}

function rebuild() {
  const vis = filtered();
  Object.values(charts).forEach(c => c.destroy());

  charts.barTotal = new Chart(document.getElementById('barTotal'), {
    type: 'bar',
    data: { labels: vis.map(d => d.label), datasets: [{ data: vis.map(d => d.total), backgroundColor: vis.map(d => d.color) }] },
    options: barOpts('mW\\u00b7s')
  });

  charts.barAvg = new Chart(document.getElementById('barAvg'), {
    type: 'bar',
    data: { labels: vis.map(d => d.label), datasets: [{ data: vis.map(d => d.avg), backgroundColor: vis.map(d => d.color) }] },
    options: barOpts('mW')
  });

  charts.lineAll = new Chart(document.getElementById('lineAll'), {
    type: 'line',
    data: { datasets: vis.map(d => ({ label: d.label, data: d.samples, borderColor: d.color, pointRadius: 0, borderWidth: 1.5, tension: 0.2, fill: false })) },
    options: {
      responsive: true,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Seconds', color: '#888' }, ticks: { color: '#888' }, grid: { color: '#2a2a4a' } },
        y: { title: { display: true, text: 'mW', color: '#888' }, ticks: { color: '#888' }, grid: { color: '#2a2a4a' } }
      },
      plugins: { legend: { labels: { color: '#e0e0e0' } } }
    }
  });

  ALL_PHASES.forEach((phase, i) => {
    const pb = phase.browsers.filter(b => enabled.has(b.label));
    charts['facet'+i] = new Chart(document.getElementById('facet'+i), {
      type: 'bar',
      data: { labels: pb.map(b => b.label), datasets: [{ data: pb.map(b => b.total), backgroundColor: pb.map(b => b.color) }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#888', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#888' }, grid: { color: '#2a2a4a' } }
        }
      }
    });
  });
}

document.querySelector('.toolbar').addEventListener('change', (e) => {
  const label = e.target.dataset.browser;
  if (e.target.checked) enabled.add(label); else enabled.delete(label);
  rebuild();
});

rebuild();
</script>
</body>
</html>`;

const outPath = join(dir, "benchmark.html");
await Bun.write(outPath, html);
console.log(`Benchmark report written to ${outPath}`);

Bun.spawn(["open", outPath]);
