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

function movingAvg(vals: number[], w: number): number[] {
	const h = Math.floor(w / 2);
	return vals.map((_, i) => {
		const s = Math.max(0, i - h);
		const e = Math.min(vals.length - 1, i + h);
		let sum = 0;
		for (let j = s; j <= e; j++) sum += vals[j];
		return Math.round(sum / (e - s + 1));
	});
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

const scenarioData = ACTION_PHASES.map((p, i) => ({
	name: p.name,
	short: p.name.replace(/^\d+\.\s*/, ""),
	start: i === 0 ? 0 : ACTION_PHASES[i - 1].endSecond,
	end: p.endSecond,
}));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>StromBench — Benchmark</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.1.0"></script>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwindcss.config = {
  theme: {
    extend: {
      colors: {
        dd: {
          bg: '#131019',
          surface: '#1a1625',
          border: '#2c2541',
          text: '#c5bfd6',
          muted: '#7a7394',
          accent: '#8b5cf6',
        }
      }
    }
  }
}
</script>
<style>
  .toggle-label:has(input:not(:checked)) { opacity: 0.35; }
  .toggle-label input[type="checkbox"] { accent-color: var(--color); }
  #smoothToggle button { padding: 3px 12px; font-size: 11px; border: 1px solid #2c2541; color: #7a7394; background: transparent; cursor: pointer; }
  #smoothToggle button:hover { color: #c5bfd6; }
  #smoothToggle button[data-active] { background: #8b5cf6; color: #fff; }
</style>
</head>
<body class="bg-dd-bg text-dd-text font-mono text-xs leading-tight min-h-screen">

<div class="fixed top-0 left-0 right-0 z-50 bg-dd-bg/95 backdrop-blur border-b border-dd-border px-4 py-2 flex items-center gap-3 flex-wrap">
  <span class="text-sm font-bold text-white tracking-tight mr-2">StromBench</span>
  <span class="w-px h-4 bg-dd-border"></span>
${loaded.map((r) => `  <label class="toggle-label flex items-center gap-1.5 cursor-pointer px-1.5 py-0.5 transition-opacity" style="--color:${r.color}"><input type="checkbox" checked data-browser="${r.label}" class="w-3 h-3"><span>${r.label}</span></label>`).join("\n")}
</div>

<div class="pt-12 p-4 max-w-[1600px] mx-auto space-y-3">

  <div class="grid grid-cols-2 gap-3">
    <div class="bg-dd-surface border border-dd-border p-3">
      <h2 class="text-[11px] uppercase tracking-widest text-dd-muted mb-2">Total Energy (mW·s)</h2>
      <canvas id="barTotal"></canvas>
    </div>
    <div class="bg-dd-surface border border-dd-border p-3">
      <h2 class="text-[11px] uppercase tracking-widest text-dd-muted mb-2">Average Power (mW)</h2>
      <canvas id="barAvg"></canvas>
    </div>
  </div>

  <div class="bg-dd-surface border border-dd-border p-3">
    <h2 class="text-[11px] uppercase tracking-widest text-dd-muted mb-2">Energy by Scenario Phase (mW·s)</h2>
    <canvas id="barStacked"></canvas>
  </div>

  <div class="bg-dd-surface border border-dd-border p-3">
    <div class="flex items-center gap-3 mb-2">
      <h2 class="text-[11px] uppercase tracking-widest text-dd-muted">Power Over Time (mW)</h2>
      <div class="flex gap-1" id="smoothToggle">
        <button data-smooth="samples">Raw</button>
        <button data-smooth="smooth10">10s avg</button>
        <button data-smooth="smooth30" data-active>30s avg</button>
      </div>
      <span class="text-dd-muted/60 text-[10px] ml-auto">drag to zoom · double-click to reset</span>
    </div>
    <canvas id="lineAll"></canvas>
  </div>

  <div>
    <h2 class="text-[11px] uppercase tracking-widest text-dd-muted mb-2">Per Action Phase</h2>
    <div class="grid grid-cols-3 gap-3">
${phaseData.map((p, i) => `      <div class="bg-dd-surface border border-dd-border p-3"><h3 class="text-[10px] uppercase tracking-wider text-dd-muted mb-1.5">${p.name}</h3><canvas id="facet${i}"></canvas></div>`).join("\n")}
    </div>
  </div>

</div>

<script>
const ALL_DATA = ${JSON.stringify(
	loaded.map((r) => {
		const mws = r.samples.map((s) => s.mw);
		const sm10 = movingAvg(mws, 10);
		const sm30 = movingAvg(mws, 30);
		return {
			label: r.label,
			color: r.color,
			total: r.total,
			avg: Math.round(r.total / r.samples.length),
			samples: r.samples.map((s) => ({ x: s.s, y: s.mw })),
			smooth10: r.samples.map((s, i) => ({ x: s.s, y: sm10[i] })),
			smooth30: r.samples.map((s, i) => ({ x: s.s, y: sm30[i] })),
		};
	}),
)};
const ALL_PHASES = ${JSON.stringify(phaseData)};
const PHASE_COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e'];
const SCENARIO = ${JSON.stringify(scenarioData)};

Chart.defaults.borderColor = '#2c2541';
Chart.defaults.color = '#7a7394';
Chart.defaults.font.family = 'ui-monospace, monospace';
Chart.defaults.font.size = 10;

const charts = {};
const enabled = new Set(ALL_DATA.map(d => d.label));
var smoothKey = 'smooth30';

function filtered() { return ALL_DATA.filter(d => enabled.has(d.label)); }
function phaseAt(s) { for (var i = 0; i < SCENARIO.length; i++) { if (s >= SCENARIO[i].start && s <= SCENARIO[i].end) return SCENARIO[i].name; } return ''; }
var phaseAnnotations = {};
SCENARIO.forEach(function(p, i) {
  phaseAnnotations['p'+i] = { type: 'box', xMin: p.start, xMax: p.end, backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] + '18', borderWidth: 1, borderColor: '#2c2541', label: { display: true, content: p.short, position: { x: 'start', y: 'start' }, color: '#7a739460', font: { size: 7 }, padding: 2 } };
});

function rebuildLine() {
  if (charts.lineAll) charts.lineAll.destroy();
  var vis = filtered();
  var isSmoothed = smoothKey !== 'samples';
  charts.lineAll = new Chart(document.getElementById('lineAll'), {
    type: 'line',
    data: { datasets: vis.map(d => ({ label: d.label, data: d[smoothKey], borderColor: d.color, pointRadius: 0, pointHitRadius: 8, borderWidth: isSmoothed ? 1.5 : 1.2, tension: isSmoothed ? 0.3 : 0.2, fill: false })) },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Seconds', color: '#7a7394' }, ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } },
        y: { title: { display: true, text: 'mW', color: '#7a7394' }, ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } }
      },
      plugins: {
        legend: { labels: { color: '#c5bfd6', boxWidth: 10, padding: 8, font: { size: 10 } } },
        tooltip: {
          backgroundColor: '#1a1625', borderColor: '#2c2541', borderWidth: 1, titleColor: '#c5bfd6', bodyColor: '#c5bfd6', padding: 8,
          callbacks: { title: function(items) { var s = items[0].parsed.x; var p = phaseAt(s); return 'Second ' + s + (p ? ' \\u2014 ' + p : ''); }, label: function(ctx) { return ctx.dataset.label + ': ' + ctx.parsed.y + ' mW'; } }
        },
        zoom: {
          zoom: { drag: { enabled: true, backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)', borderWidth: 1 }, mode: 'x' },
          limits: { x: { minRange: 10 } }
        },
        annotation: { annotations: phaseAnnotations }
      }
    }
  });
}

function barOpts(title) {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } },
      y: { title: { display: true, text: title, color: '#7a7394' }, ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } }
    }
  };
}

function rebuild() {
  const vis = filtered();
  Object.values(charts).forEach(c => c.destroy());

  charts.barTotal = new Chart(document.getElementById('barTotal'), {
    type: 'bar',
    data: { labels: vis.map(d => d.label), datasets: [{ data: vis.map(d => d.total), backgroundColor: vis.map(d => d.color), borderRadius: 0 }] },
    options: barOpts('mW\\u00b7s')
  });

  charts.barAvg = new Chart(document.getElementById('barAvg'), {
    type: 'bar',
    data: { labels: vis.map(d => d.label), datasets: [{ data: vis.map(d => d.avg), backgroundColor: vis.map(d => d.color), borderRadius: 0 }] },
    options: barOpts('mW')
  });

  const stackedDatasets = ALL_PHASES.map((phase, pi) => ({
    label: phase.name,
    data: vis.map(d => { const b = phase.browsers.find(b => b.label === d.label); return b ? b.total : 0; }),
    backgroundColor: PHASE_COLORS[pi % PHASE_COLORS.length]
  }));
  charts.barStacked = new Chart(document.getElementById('barStacked'), {
    type: 'bar',
    data: { labels: vis.map(d => d.label), datasets: stackedDatasets },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true, ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } },
        y: { stacked: true, title: { display: true, text: 'mW\\u00b7s', color: '#7a7394' }, ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#c5bfd6', boxWidth: 10, padding: 6, font: { size: 9 } } },
        tooltip: { backgroundColor: '#1a1625', borderColor: '#2c2541', borderWidth: 1, titleColor: '#c5bfd6', bodyColor: '#c5bfd6' }
      }
    }
  });

  rebuildLine();

  ALL_PHASES.forEach((phase, i) => {
    const pb = phase.browsers.filter(b => enabled.has(b.label));
    charts['facet'+i] = new Chart(document.getElementById('facet'+i), {
      type: 'bar',
      data: { labels: pb.map(b => b.label), datasets: [{ data: pb.map(b => b.total), backgroundColor: pb.map(b => b.color), borderRadius: 0 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#7a7394', font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: '#7a7394' }, grid: { color: '#2c2541' } }
        }
      }
    });
  });
}

document.querySelector('.fixed').addEventListener('change', (e) => {
  const label = e.target.dataset.browser;
  if (e.target.checked) enabled.add(label); else enabled.delete(label);
  rebuild();
});

document.getElementById('smoothToggle').addEventListener('click', function(e) {
  var btn = e.target.closest('button');
  if (!btn || !btn.dataset.smooth) return;
  smoothKey = btn.dataset.smooth;
  this.querySelectorAll('button').forEach(function(b) { delete b.dataset.active; });
  btn.dataset.active = '';
  rebuildLine();
});

rebuild();
document.getElementById('lineAll').addEventListener('dblclick', function() { if (charts.lineAll) charts.lineAll.resetZoom(); });
</script>
</body>
</html>`;

const outPath = join(dir, "report.html");
await Bun.write(outPath, html);
console.log(`Report written to ${outPath}`);

Bun.spawn(["open", outPath]);
