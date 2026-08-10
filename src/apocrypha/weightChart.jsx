// Geometry for the weight line chart. Works in a 100×100 SVG box (rendered
// with preserveAspectRatio="none" + non-scaling strokes), so the same paths
// drive both the big Peso chart and the tiny Hero sparklines.
export function chartGeom(log, opts = {}) {
  const { w = 100, h = 100, padX = 2, padT = 8, padB = 6 } = opts;
  const pts = (Array.isArray(log) ? log : [])
    .map((e) => ({ weight: Number(e.weight), t: Date.parse(e.created_at || e.date || ''), date: e.date }))
    .filter((p) => Number.isFinite(p.weight) && Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  if (!pts.length) return null;

  const ws = pts.map((p) => p.weight);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const lastW = pts[pts.length - 1].weight;
  const ts = pts.map((p) => p.t);
  const minT = Math.min(...ts);
  const maxT = Math.max(...ts);

  const innerW = w - padX * 2;
  const innerH = h - padT - padB;
  let range = maxW - minW;
  if (range < 1) range = 1;
  const yMin = minW - range * 0.15;
  const yMax = maxW + range * 0.15;

  const xAt = (t) => (pts.length === 1 ? padX + innerW / 2 : padX + ((t - minT) / (maxT - minT || 1)) * innerW);
  const yAt = (val) => padT + (1 - (val - yMin) / (yMax - yMin)) * innerH;

  const coords = pts.map((p) => ({ x: xAt(p.t), y: yAt(p.weight), weight: p.weight, date: p.date }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
  const base = (h - padB).toFixed(2);
  const area = coords.length > 1
    ? `${line} L${coords[coords.length - 1].x.toFixed(2)},${base} L${coords[0].x.toFixed(2)},${base} Z`
    : '';

  return { coords, line, area, minW, maxW, lastW, yMin, yMax, yAt, count: coords.length, base: Number(base) };
}

// Small sparkline for the Hero cube / header badge.
export function WeightSpark({ log, className = '' }) {
  const g = chartGeom(log, { padT: 12, padB: 10 });
  if (!g) return null;
  return (
    <svg className={`wspark ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {g.area && <path className="wspark-area" d={g.area} />}
      <path className="wspark-line" d={g.line} />
    </svg>
  );
}
