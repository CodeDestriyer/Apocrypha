import { useLayoutEffect, useRef, useState } from 'react';

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

// Small clean-line sparkline for the Hero cube / header badge (no fill).
export function WeightSpark({ log, className = '' }) {
  const g = chartGeom(log, { padT: 14, padB: 12 });
  if (!g) return null;
  return (
    <svg className={`wspark ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path className="wspark-line" d={g.line} />
    </svg>
  );
}

// Full weight chart — clean line with kg / month axes, goal line and a
// "today" endpoint dot. Measures its own width so the axis labels and the
// endpoint dot stay perfectly round (no non-uniform SVG stretching).
export function WeightGraph({ log, goal }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(update); ro.observe(el); }
    else if (typeof window !== 'undefined') window.addEventListener('resize', update);
    return () => { if (ro) ro.disconnect(); else if (typeof window !== 'undefined') window.removeEventListener('resize', update); };
  }, []);

  const H = 212, padL = 38, padR = 12, padT = 14, padB = 26;
  const pts = (Array.isArray(log) ? log : [])
    .map((e) => ({ w: Number(e.weight), t: Date.parse(e.date || e.created_at || '') }))
    .filter((p) => Number.isFinite(p.w) && Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);

  let svg = null;
  if (w > 0 && pts.length) {
    const ws = pts.map((p) => p.w);
    let minW = Math.min(...ws), maxW = Math.max(...ws);
    if (maxW - minW < 2) { const m = (minW + maxW) / 2; minW = m - 1; maxW = m + 1; }
    const pad = (maxW - minW) * 0.12;
    const yLo = minW - pad, yHi = maxW + pad;
    const minT = pts[0].t, maxT = pts[pts.length - 1].t;
    const X = (t) => (pts.length === 1 ? padL + (w - padL - padR) / 2 : padL + ((t - minT) / (maxT - minT || 1)) * (w - padL - padR));
    const Y = (v) => padT + (1 - (v - yLo) / (yHi - yLo)) * (H - padT - padB);
    const coords = pts.map((p) => ({ x: X(p.t), y: Y(p.w) }));
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const last = coords[coords.length - 1];

    const span = yHi - yLo;
    const step = span > 12 ? 4 : span > 6 ? 2 : 1;
    const yTicks = [];
    for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) yTicks.push(v);

    const months = [];
    const first = new Date(minT); first.setUTCDate(1);
    for (let m = new Date(first); m.getTime() <= maxT; m.setUTCMonth(m.getUTCMonth() + 1)) {
      if (m.getTime() >= minT - 5 * 864e5) {
        months.push({ x: X(Math.max(m.getTime(), minT)), label: m.toLocaleDateString(undefined, { month: 'short' }) });
      }
    }

    // Only draw the goal line when it's within the visible range (otherwise
    // it would just pin to an edge and clutter the chart).
    const gy = (goal != null && Number.isFinite(goal) && goal >= yLo && goal <= yHi) ? Y(goal) : null;

    svg = (
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="pchart-svg" role="img">
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line className="pchart-grid" x1={padL} y1={Y(v)} x2={w - padR} y2={Y(v)} />
            <text className="pchart-ylabel" x={padL - 6} y={Y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {months.map((mo, i) => (
          <text key={`m${i}`} className="pchart-xlabel" x={mo.x} y={H - 8} textAnchor="middle">{mo.label}</text>
        ))}
        {gy != null && <line className="pchart-goal" x1={padL} y1={gy} x2={w - padR} y2={gy} />}
        <path className="pchart-line" d={line} />
        <circle className="pchart-dot" cx={last.x} cy={last.y} r="3.5" />
      </svg>
    );
  }

  return <div className="pchart" ref={ref}>{svg}</div>;
}
