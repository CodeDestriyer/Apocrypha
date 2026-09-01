import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';

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

// Full weight chart — clean line with kg / date axes and a "today" dot.
// Interactive (default): wheel / pinch zoom the time axis, drag to pan,
// double-click / ⟲ to reset. Data is anchored to the LEFT wall with empty
// "future" space only on the right. The goal shows as a green line; by
// default the Y axis is tight on the weight data (goal off-screen), and as
// you zoom OUT the axis stretches down until the goal comes into view.
// `compact` shrinks paddings/labels (Hero cube); `interactive={false}`
// makes it a static read-only chart.
const DAY = 864e5;
export function WeightGraph({ log, goal, interactive = true, compact = false }) {
  const { t: tr } = useLang();
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [domain, setDomain] = useState(null); // [t0,t1] visible time window, null = full
  const [yDomain, setYDomain] = useState(null); // [lo,hi] weight window, null = auto-fit
  // Line vs. candlestick, remembered per browser. Candles are one-per-day:
  // body = first→last weigh-in of the day (green when the day ended lower).
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('peso.chartMode') === 'candle' ? 'candle' : 'line'; } catch { return 'line'; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const pickMode = (m) => { setMode(m); setMenuOpen(false); try { localStorage.setItem('peso.chartMode', m); } catch {} };
  // Trend-line tool (like a trading terminal): 'pan' = normal, 'draw' = drag to
  // lay a straight line. Lines are stored in DATA coordinates ({t, v}) so they
  // stay anchored while you pan/zoom and show in both line and candle views.
  const [tool, setTool] = useState('pan');
  const [lines, setLines] = useState(() => {
    try { const a = JSON.parse(localStorage.getItem('peso.chartLines')); return Array.isArray(a) ? a : []; } catch { return []; }
  });
  const [drawLine, setDrawLine] = useState(null); // in-progress line while dragging
  const drawRef = useRef(null);
  const saveLines = (arr) => { setLines(arr); try { localStorage.setItem('peso.chartLines', JSON.stringify(arr)); } catch {} };
  const toggleDraw = () => { setTool((x) => (x === 'draw' ? 'pan' : 'draw')); setMenuOpen(false); };
  const clearLines = () => { saveLines([]); setMenuOpen(false); };
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const clipId = useRef('pchart-clip-' + Math.random().toString(36).slice(2)).current;

  // Close the chart menu on an outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(update); ro.observe(el); }
    else if (typeof window !== 'undefined') window.addEventListener('resize', update);
    return () => { if (ro) ro.disconnect(); else if (typeof window !== 'undefined') window.removeEventListener('resize', update); };
  }, []);

  const w = size.w, H = size.h;
  const padL = compact ? 24 : 38;
  const padR = compact ? 6 : 12;
  const padT = compact ? 8 : 14;
  const padB = compact ? 15 : 26;
  const pts = (Array.isArray(log) ? log : [])
    .map((e) => ({ w: Number(e.weight), t: Date.parse(e.date || e.created_at || '') }))
    .filter((p) => Number.isFinite(p.w) && Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);

  const fullT0 = pts.length ? pts[0].t : 0;
  const fullT1 = pts.length ? pts[pts.length - 1].t : 1;
  const fullSpan = Math.max(DAY, fullT1 - fullT0);
  // Left wall = first data point; empty "future" space extends to the right.
  // The wide margin is what lets you zoom the time axis further out (the line
  // shrinks toward the left as the empty future grows).
  const margin = fullSpan * 3;
  const extMin = fullT0;
  const extMax = fullT1 + margin;
  const extSpan = extMax - extMin;
  const minWin = Math.min(extSpan, 4 * DAY);
  const maxWin = extSpan;
  const plotW = Math.max(1, w - padL - padR);

  const clampDomain = ([a, b]) => {
    let span = b - a;
    if (span < minWin) { const c = (a + b) / 2; a = c - minWin / 2; b = c + minWin / 2; span = minWin; }
    if (span > maxWin) { const c = (a + b) / 2; a = c - maxWin / 2; b = c + maxWin / 2; span = maxWin; }
    if (a < extMin) { a = extMin; b = a + span; }
    if (b > extMax) { b = extMax; a = b - span; }
    if (a < extMin) a = extMin;
    return [a, b];
  };
  const [t0, t1] = domain ? clampDomain(domain) : [fullT0, fullT1];
  const xToTime = (clientX) => {
    const rect = ref.current?.getBoundingClientRect();
    const x = clientX - (rect ? rect.left : 0);
    return t0 + ((x - padL) / plotW) * (t1 - t0);
  };

  // --- Y (weight) axis ---------------------------------------------------
  // Auto-fit over the visible points by default (stretching toward the goal as
  // the time axis zooms out); becomes a manual window once you pan/zoom
  // vertically, so you can scroll up/down through the whole weight range.
  const plotH = Math.max(1, H - padT - padB);
  const visPts = pts.filter((p) => p.t >= t0 && p.t <= t1);
  const srcPts = visPts.length ? visPts : pts;
  let autoLo = 0, autoHi = 1;
  if (srcPts.length) {
    const ws = srcPts.map((p) => p.w);
    let dMin = Math.min(...ws), dMax = Math.max(...ws);
    if (dMax - dMin < 2) { const m = (dMin + dMax) / 2; dMin = m - 1; dMax = m + 1; }
    const basePad = (dMax - dMin) * 0.12 || 0.5;
    autoLo = dMin - basePad; autoHi = dMax + basePad;
    if (goal != null && Number.isFinite(goal)) {
      const zoomOut = Math.max(0, Math.min(1, (t1 - t0 - fullSpan) / (extSpan - fullSpan || 1)));
      const gLo = Math.min(dMin, goal), gHi = Math.max(dMax, goal);
      const gPad = (gHi - gLo) * 0.08 || 0.5;
      autoLo = autoLo + (gLo - gPad - autoLo) * zoomOut;
      autoHi = autoHi + (gHi + gPad - autoHi) * zoomOut;
    }
  }
  // Absolute weight range you can pan/zoom into — comfortably covers 50–150 kg
  // and widens if the data or goal sits outside it.
  const allWs = pts.map((p) => p.w);
  const dataLo = allWs.length ? Math.min(...allWs) : 70;
  const dataHi = allWs.length ? Math.max(...allWs) : 70;
  let yFloor = Math.min(20, dataLo - 5);
  let yCeil = Math.max(300, dataHi + 5);
  if (goal != null && Number.isFinite(goal)) { yFloor = Math.min(yFloor, goal - 5); yCeil = Math.max(yCeil, goal + 5); }
  const yMinWin = 3;               // most you can zoom in (kg spanned)
  const yMaxWin = yCeil - yFloor;  // most you can zoom out
  const clampY = ([a, b]) => {
    let span = b - a;
    if (span < yMinWin) { const c = (a + b) / 2; a = c - yMinWin / 2; b = c + yMinWin / 2; span = yMinWin; }
    if (span > yMaxWin) { const c = (a + b) / 2; a = c - yMaxWin / 2; b = c + yMaxWin / 2; span = yMaxWin; }
    if (a < yFloor) { a = yFloor; b = a + span; }
    if (b > yCeil) { b = yCeil; a = b - span; }
    if (a < yFloor) a = yFloor;
    return [a, b];
  };
  const [yLo, yHi] = yDomain ? clampY(yDomain) : [autoLo, autoHi];
  const yToVal = (clientY) => {
    const rect = ref.current?.getBoundingClientRect();
    const y = clientY - (rect ? rect.top : 0);
    return yLo + (1 - (y - padT) / plotH) * (yHi - yLo);
  };
  const resetView = () => { setDomain(null); setYDomain(null); };

  // Wheel zoom (native, non-passive so we can preventDefault): time by
  // default, weight when Shift is held.
  useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el || !pts.length) return;
    const onWheel = (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1; // lines/pages → px
      const factor = Math.exp(e.deltaY * unit * 0.0025);
      if (e.shiftKey) {
        const vc = yToVal(e.clientY);
        setYDomain(clampY([vc - (vc - yLo) * factor, vc + (yHi - vc) * factor]));
      } else {
        const tc = xToTime(e.clientX);
        setDomain(clampDomain([tc - (tc - t0) * factor, tc + (t1 - tc) * factor]));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [interactive, w, H, t0, t1, yLo, yHi, pts.length]);

  const onPointerDown = (e) => {
    if (!pts.length) return;
    if (tool === 'draw') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      const p = { t: xToTime(e.clientX), v: yToVal(e.clientY) };
      drawRef.current = { a: p, b: p };
      gesture.current = { mode: 'draw', moved: false };
      setDrawLine({ a: p, b: p });
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const v = [...pointers.current.values()];
      gesture.current = {
        mode: 'pinch',
        startDX: Math.abs(v[0].x - v[1].x) || 1,
        startDY: Math.abs(v[0].y - v[1].y) || 1,
        t0, t1, yLo, yHi,
      };
    } else {
      gesture.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, t0, t1, yLo, yHi };
    }
  };
  const onPointerMove = (e) => {
    if (gesture.current?.mode === 'draw') {
      if (!drawRef.current) return;
      gesture.current.moved = true;
      const b = { t: xToTime(e.clientX), v: yToVal(e.clientY) };
      drawRef.current = { a: drawRef.current.a, b };
      setDrawLine({ a: drawRef.current.a, b });
      return;
    }
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const rect = ref.current?.getBoundingClientRect();
    if (g.mode === 'pinch' && pointers.current.size >= 2) {
      const v = [...pointers.current.values()];
      // Horizontal finger spread zooms time; vertical spread zooms weight.
      const scaleX = g.startDX / (Math.abs(v[0].x - v[1].x) || 1);
      const scaleY = g.startDY / (Math.abs(v[0].y - v[1].y) || 1);
      const midX = (v[0].x + v[1].x) / 2 - (rect ? rect.left : 0);
      const midY = (v[0].y + v[1].y) / 2 - (rect ? rect.top : 0);
      const tc = g.t0 + ((midX - padL) / plotW) * (g.t1 - g.t0);
      const vc = g.yLo + (1 - (midY - padT) / plotH) * (g.yHi - g.yLo);
      setDomain(clampDomain([tc - (tc - g.t0) * scaleX, tc + (g.t1 - tc) * scaleX]));
      setYDomain(clampY([vc - (vc - g.yLo) * scaleY, vc + (g.yHi - vc) * scaleY]));
    } else if (g.mode === 'pan') {
      const dt = ((e.clientX - g.startX) / plotW) * (g.t1 - g.t0);
      const dv = ((e.clientY - g.startY) / plotH) * (g.yHi - g.yLo);
      setDomain(clampDomain([g.t0 - dt, g.t1 - dt]));
      // Drag down → reveal higher weights above (window slides up).
      setYDomain(clampY([g.yLo + dv, g.yHi + dv]));
    }
  };
  const onPointerUp = (e) => {
    if (gesture.current?.mode === 'draw') {
      const dl = drawRef.current;
      const moved = gesture.current.moved;
      gesture.current = null;
      drawRef.current = null;
      setDrawLine(null);
      // Only keep a line the user actually dragged out (ignore a stray tap).
      if (dl && moved) saveLines([...lines, dl]);
      return;
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const only = [...pointers.current.values()][0];
      gesture.current = { mode: 'pan', startX: only.x, startY: only.y, t0, t1, yLo, yHi };
    } else if (pointers.current.size === 0) {
      gesture.current = null;
    }
  };

  let svg = null;
  if (w > 0 && H > 0 && pts.length) {
    const X = (t) => (pts.length === 1 ? padL + plotW / 2 : padL + ((t - t0) / (t1 - t0 || 1)) * plotW);
    const Y = (v) => padT + (1 - (v - yLo) / (yHi - yLo)) * plotH;
    const coords = pts.map((p) => ({ x: X(p.t), y: Y(p.w), t: p.t }));
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const last = coords[coords.length - 1];
    const lastVisible = last.t >= t0 && last.t <= t1;

    const span = yHi - yLo;
    const step = span > 24 ? 8 : span > 12 ? 4 : span > 6 ? 2 : 1;
    const yTicks = [];
    for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) yTicks.push(v);

    // Adaptive X ticks: months for wide ranges, dated ticks when zoomed in.
    const winDays = (t1 - t0) / DAY;
    const nx = compact ? 3 : 4;
    const xTicks = [];
    if (winDays > 70) {
      const first = new Date(t0); first.setUTCDate(1);
      for (let m = new Date(first); m.getTime() <= t1; m.setUTCMonth(m.getUTCMonth() + 1)) {
        const tt = m.getTime();
        if (tt >= t0 - 5 * DAY) xTicks.push({ x: X(Math.max(tt, t0)), label: m.toLocaleDateString(undefined, { month: 'short' }) });
      }
    } else {
      for (let i = 0; i <= nx; i++) {
        const tt = t0 + ((t1 - t0) * i) / nx;
        xTicks.push({ x: X(tt), label: new Date(tt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) });
      }
    }

    const gy = (goal != null && Number.isFinite(goal) && goal >= yLo && goal <= yHi) ? Y(goal) : null;
    const handlers = interactive ? {
      onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
      onDoubleClick: resetView,
    } : {};

    // One candle per day, day-over-day: open = previous logged day's weight,
    // close = this day's weight (the day's last weigh-in). Green when the day
    // ended lower (weight lost), red when higher. This gives real bodies even
    // when you weigh once a day. Main chart only; Hero cube stays a line.
    const showCandles = mode === 'candle' && !compact;
    let candles = null;
    if (showCandles) {
      const dayMap = new Map();
      for (const e of (Array.isArray(log) ? log : [])) {
        const wv = Number(e.weight);
        const dstr = e.date || (e.created_at ? String(e.created_at).slice(0, 10) : '');
        const tt = Date.parse(dstr);
        if (!Number.isFinite(wv) || !Number.isFinite(tt)) continue;
        const ct = Date.parse(e.created_at || '') || 0;
        const cur = dayMap.get(dstr);
        if (!cur || ct >= cur.ct) dayMap.set(dstr, { t: tt, w: wv, ct });
      }
      const daysArr = [...dayMap.values()].sort((a, b) => a.t - b.t);
      const dayPx = plotW / Math.max(1, (t1 - t0) / DAY);
      const cw = Math.max(2.5, Math.min(16, dayPx * 0.7));
      candles = [];
      if (daysArr.length) {
        // Walk every calendar day between the first and last weigh-in. Logged
        // days get a day-over-day body; gap days (no weigh-in) get a flat doji
        // carried forward from the last known weight, so the axis stays solid.
        const wByDay = new Map(daysArr.map((d) => [d.t, d.w]));
        const firstT = daysArr[0].t, lastT = daysArr[daysArr.length - 1].t;
        let carry = null;
        for (let tt = firstT; tt <= lastT; tt += DAY) {
          const logged = wByDay.get(tt);
          let open, close, dir;
          if (logged != null) {
            open = carry != null ? carry : logged; // first candle has no prior day → flat
            close = logged;
            dir = close < open ? 'down' : close > open ? 'up' : 'flat';
            carry = close;
          } else {
            if (carry == null) continue;
            open = close = carry; // gap day: flat doji at the carried weight
            dir = 'flat';
          }
          const yO = Y(open), yC = Y(close);
          const top = Math.min(yO, yC);
          const bh = Math.max(1.4, Math.abs(yO - yC));
          candles.push({ key: tt, x: X(tt) - cw / 2, y: top, w: cw, h: bh, dir });
        }
      }
    }

    svg = (
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="pchart-svg" role="img" {...handlers}>
        <defs><clipPath id={clipId}><rect x={padL} y={0} width={plotW} height={H} /></clipPath></defs>
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line className="pchart-grid" x1={padL} y1={Y(v)} x2={w - padR} y2={Y(v)} />
            <text className="pchart-ylabel" x={padL - 5} y={Y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {xTicks.map((tk, i) => (
          <text key={`x${i}`} className="pchart-xlabel" x={Math.min(w - padR, Math.max(padL, tk.x))} y={H - (compact ? 4 : 8)} textAnchor="middle">{tk.label}</text>
        ))}
        {gy != null && <line className="pchart-goal" x1={padL} y1={gy} x2={w - padR} y2={gy} />}
        <g clipPath={`url(#${clipId})`}>
          {showCandles ? (
            candles.map((c) => (
              <rect key={c.key} className={`pchart-candle pchart-candle--${c.dir}`} x={c.x} y={c.y} width={c.w} height={c.h} rx={1} />
            ))
          ) : (
            <>
              <path className="pchart-line" d={line} />
              {lastVisible && <circle className="pchart-dot" cx={last.x} cy={last.y} r={compact ? 2.6 : 3.5} />}
            </>
          )}
          {/* User-drawn straight trend lines (data-anchored, shown in both views). */}
          {!compact && lines.map((ln, i) => (
            <line key={`ln${i}`} className="pchart-trend" x1={X(ln.a.t)} y1={Y(ln.a.v)} x2={X(ln.b.t)} y2={Y(ln.b.v)} />
          ))}
          {!compact && drawLine && (
            <line className="pchart-trend pchart-trend--draft" x1={X(drawLine.a.t)} y1={Y(drawLine.a.v)} x2={X(drawLine.b.t)} y2={Y(drawLine.b.v)} />
          )}
        </g>
      </svg>
    );
  }

  return (
    <div className={`pchart ${compact ? 'pchart--compact' : ''} ${interactive ? '' : 'pchart--static'}${tool === 'draw' ? ' is-drawing' : ''}`} ref={ref}>
      {svg}
      {interactive && (
        // Top-right toolbar: reset (only when zoomed/panned) then the gear.
        <div className="pchart-tools">
          {(domain || yDomain) && (
            <button className="pchart-reset" onClick={resetView} aria-label="reset">⟲</button>
          )}
          {!compact && (
            <div className="pchart-gear" ref={menuRef}>
              <button
                className={`pchart-gear-btn${tool === 'draw' ? ' is-active' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={tr('weight.chartView')}
                aria-expanded={menuOpen}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="pchart-menu">
                  <div className="pchart-menu-label">{tr('weight.chartView')}</div>
                  <button className={`pchart-menu-item${mode === 'line' ? ' is-active' : ''}`} onClick={() => pickMode('line')}>{tr('weight.chartLine')}</button>
                  <button className={`pchart-menu-item${mode === 'candle' ? ' is-active' : ''}`} onClick={() => pickMode('candle')}>{tr('weight.chartCandle')}</button>
                  <div className="pchart-menu-sep" />
                  <button className={`pchart-menu-item${tool === 'draw' ? ' is-active' : ''}`} onClick={toggleDraw}>{tr('weight.drawLine')}</button>
                  {lines.length > 0 && (
                    <button className="pchart-menu-item" onClick={clearLines}>{tr('weight.clearLines')}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
