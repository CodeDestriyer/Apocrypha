import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

// Full weight chart — clean line with kg / date axes, goal line and a
// "today" endpoint dot. Interactive: wheel / pinch to zoom the time axis,
// drag to pan, double-click (or the ⟲ button) to reset. Y auto-scales to
// the visible window. Measures its own width so labels + dot stay crisp.
const DAY = 864e5;
export function WeightGraph({ log, goal }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [domain, setDomain] = useState(null); // [t0,t1] visible window, null = full
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const clipId = useRef('pchart-clip-' + Math.random().toString(36).slice(2)).current;

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

  const fullT0 = pts.length ? pts[0].t : 0;
  const fullT1 = pts.length ? pts[pts.length - 1].t : 1;
  const fullSpan = Math.max(DAY, fullT1 - fullT0);
  const minWin = Math.min(fullSpan, 3 * DAY);
  const plotW = Math.max(1, w - padL - padR);

  const clampDomain = ([a, b]) => {
    let span = Math.max(minWin, Math.min(fullSpan, b - a));
    if (a < fullT0) { a = fullT0; b = a + span; }
    if (b > fullT1) { b = fullT1; a = b - span; }
    if (a < fullT0) a = fullT0;
    return [a, b];
  };
  const [t0, t1] = domain ? clampDomain(domain) : [fullT0, fullT1];
  const xToTime = (clientX) => {
    const rect = ref.current?.getBoundingClientRect();
    const x = clientX - (rect ? rect.left : 0);
    return t0 + ((x - padL) / plotW) * (t1 - t0);
  };

  // Wheel zoom (native, non-passive so we can preventDefault).
  useEffect(() => {
    const el = ref.current;
    if (!el || !pts.length) return;
    const onWheel = (e) => {
      e.preventDefault();
      const tc = xToTime(e.clientX);
      const factor = Math.exp(e.deltaY * 0.0015);
      setDomain(clampDomain([tc - (tc - t0) * factor, tc + (t1 - tc) * factor]));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [w, t0, t1, pts.length]);

  const onPointerDown = (e) => {
    if (!pts.length) return;
    ref.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, e.clientX);
    if (pointers.current.size === 2) {
      const xs = [...pointers.current.values()];
      gesture.current = { mode: 'pinch', startDist: Math.abs(xs[0] - xs[1]) || 1, t0, t1 };
    } else {
      gesture.current = { mode: 'pan', startX: e.clientX, t0, t1 };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, e.clientX);
    const g = gesture.current;
    if (!g) return;
    if (g.mode === 'pinch' && pointers.current.size >= 2) {
      const xs = [...pointers.current.values()];
      const dist = Math.abs(xs[0] - xs[1]) || 1;
      const scale = g.startDist / dist;
      const rect = ref.current?.getBoundingClientRect();
      const midX = (xs[0] + xs[1]) / 2 - (rect ? rect.left : 0);
      const tc = g.t0 + ((midX - padL) / plotW) * (g.t1 - g.t0);
      setDomain(clampDomain([tc - (tc - g.t0) * scale, tc + (g.t1 - tc) * scale]));
    } else if (g.mode === 'pan') {
      const dt = ((e.clientX - g.startX) / plotW) * (g.t1 - g.t0);
      setDomain(clampDomain([g.t0 - dt, g.t1 - dt]));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      gesture.current = { mode: 'pan', startX: [...pointers.current.values()][0], t0, t1 };
    } else if (pointers.current.size === 0) {
      gesture.current = null;
    }
  };

  let svg = null;
  if (w > 0 && pts.length) {
    const vis = pts.filter((p) => p.t >= t0 && p.t <= t1);
    const src = vis.length ? vis : pts;
    const ws = src.map((p) => p.w);
    let minW = Math.min(...ws), maxW = Math.max(...ws);
    if (maxW - minW < 2) { const m = (minW + maxW) / 2; minW = m - 1; maxW = m + 1; }
    const yPad = (maxW - minW) * 0.12;
    const yLo = minW - yPad, yHi = maxW + yPad;
    const X = (t) => (pts.length === 1 ? padL + plotW / 2 : padL + ((t - t0) / (t1 - t0 || 1)) * plotW);
    const Y = (v) => padT + (1 - (v - yLo) / (yHi - yLo)) * (H - padT - padB);
    const coords = pts.map((p) => ({ x: X(p.t), y: Y(p.w), t: p.t }));
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const last = coords[coords.length - 1];
    const lastVisible = last.t >= t0 && last.t <= t1;

    const span = yHi - yLo;
    const step = span > 12 ? 4 : span > 6 ? 2 : 1;
    const yTicks = [];
    for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) yTicks.push(v);

    // Adaptive X ticks: months for wide ranges, dated ticks when zoomed in.
    const winDays = (t1 - t0) / DAY;
    const xTicks = [];
    if (winDays > 70) {
      const first = new Date(t0); first.setUTCDate(1);
      for (let m = new Date(first); m.getTime() <= t1; m.setUTCMonth(m.getUTCMonth() + 1)) {
        const tt = m.getTime();
        if (tt >= t0 - 5 * DAY) xTicks.push({ x: X(Math.max(tt, t0)), label: m.toLocaleDateString(undefined, { month: 'short' }) });
      }
    } else {
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const tt = t0 + ((t1 - t0) * i) / n;
        xTicks.push({ x: X(tt), label: new Date(tt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) });
      }
    }

    const gy = (goal != null && Number.isFinite(goal) && goal >= yLo && goal <= yHi) ? Y(goal) : null;

    svg = (
      <svg
        width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="pchart-svg" role="img"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onDoubleClick={() => setDomain(null)}
      >
        <defs><clipPath id={clipId}><rect x={padL} y={0} width={plotW} height={H} /></clipPath></defs>
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line className="pchart-grid" x1={padL} y1={Y(v)} x2={w - padR} y2={Y(v)} />
            <text className="pchart-ylabel" x={padL - 6} y={Y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {xTicks.map((tk, i) => (
          <text key={`x${i}`} className="pchart-xlabel" x={Math.min(w - padR, Math.max(padL, tk.x))} y={H - 8} textAnchor="middle">{tk.label}</text>
        ))}
        {gy != null && <line className="pchart-goal" x1={padL} y1={gy} x2={w - padR} y2={gy} />}
        <g clipPath={`url(#${clipId})`}>
          <path className="pchart-line" d={line} />
          {lastVisible && <circle className="pchart-dot" cx={last.x} cy={last.y} r="3.5" />}
        </g>
      </svg>
    );
  }

  return (
    <div className="pchart" ref={ref}>
      {svg}
      {domain && (
        <button className="pchart-reset" onClick={() => setDomain(null)} aria-label="reset">⟲</button>
      )}
    </div>
  );
}
