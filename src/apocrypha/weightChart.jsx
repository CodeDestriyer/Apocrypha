// Geometry for the weight line chart. Works in a 100×100 SVG box (rendered
// with preserveAspectRatio="none" + non-scaling strokes), so the same paths
// drive both the big Peso chart and the tiny Hero sparklines.
export function chartGeom(log, opts = {}) {
  const { w = 100, h = 100, padX = 2, padT = 8, padB = 6 } = opts;
  // X is the measurement DATE (so backfilled history lands on its real day),
  // with created_at only as a tie-break for several entries on the same date.
  const pts = (Array.isArray(log) ? log : [])
    .map((e) => ({ weight: Number(e.weight), t: Date.parse(e.date || e.created_at || ''), ct: Date.parse(e.created_at || '') || 0, date: e.date }))
    .filter((p) => Number.isFinite(p.weight) && Number.isFinite(p.t))
    .sort((a, b) => (a.t - b.t) || (a.ct - b.ct));
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

// The most recent measurement BY DATE (not by insertion order), so the
// "current weight" is right even when older dates are backfilled last.
export function latestEntry(log) {
  const arr = (Array.isArray(log) ? log : []).filter((e) => Number.isFinite(Number(e.weight)));
  if (!arr.length) return null;
  return arr.reduce((best, e) => {
    const bd = best.date || '', ed = e.date || '';
    if (ed > bd) return e;
    if (ed < bd) return best;
    return (e.created_at || '') >= (best.created_at || '') ? e : best;
  });
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
