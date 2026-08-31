import { useEffect, useRef, useState } from 'react';

// "Regla" — a horizontal ruler you drag to dial in a weight. The center
// needle marks the value; every 0.1-kg tick that crosses it fires a tiny
// haptic buzz (Android/Chrome only — iOS Safari has no web Vibration API,
// so it silently falls back to the visual scrub). Tap the big number to
// type a value directly, which is quicker for a large jump.

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const round1 = (v) => Math.round(v * 10) / 10;

// Short vibration on each tick. Wrapped so unsupported platforms no-op.
const buzz = (ms) => {
  try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms); }
  catch { /* ignore */ }
};

export default function WeightRuler({
  value,
  onChange,
  min = 2,
  max = 400,
  unit = 'kg',
  compact = false,
  defaultValue = 70,
}) {
  const step = 0.1;
  const trackRef = useRef(null);
  const drag = useRef(null);
  const [width, setWidth] = useState(0);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');

  const val = (typeof value === 'number' && Number.isFinite(value))
    ? clamp(round1(value), min, max)
    : defaultValue;

  // Minor-tick spacing in px (how far a 0.1-kg turn moves the ruler).
  const PPS = compact ? 8 : 11;

  // Keep `width` in sync with the track so the tick window fills it.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } else {
      window.addEventListener('resize', measure);
    }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', measure); };
  }, []);

  const commit = (next) => {
    const v = clamp(round1(next), min, max);
    if (v !== val) { buzz(compact ? 3 : 4); onChange(v); }
  };

  // ── Pointer drag: right = lighter, left = heavier (strip scrubs like film)
  const onPointerDown = (e) => {
    if (typing) return;
    try { trackRef.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = { startX: e.clientX, startVal: val, last: val };
    e.preventDefault();
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const next = clamp(round1(d.startVal - (dx / PPS) * step), min, max);
    if (next !== d.last) { d.last = next; buzz(compact ? 3 : 4); onChange(next); }
  };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    drag.current = null;
    try { trackRef.current.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  // Desktop nicety: wheel over the track nudges the value.
  const onWheel = (e) => {
    if (typing) return;
    e.preventDefault();
    commit(val + (e.deltaY > 0 ? -step : step));
  };

  // Keyboard a11y: arrows step, shift = 1 kg.
  const onKeyDown = (e) => {
    const big = e.shiftKey ? 1 : step;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); commit(val - big); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); commit(val + big); }
  };

  const openType = () => { setTyped(String(val)); setTyping(true); };
  const commitTyped = () => {
    const n = Number(String(typed).replace(',', '.'));
    if (Number.isFinite(n)) commit(n);
    setTyping(false);
  };

  // ── Build only the ticks that fall inside the visible window.
  const centerX = width / 2;
  const centerTenth = Math.round(val * 10);
  const half = Math.ceil(centerX / PPS) + 2;
  const ticks = [];
  for (let t = centerTenth - half; t <= centerTenth + half; t++) {
    const tv = t / 10;
    if (tv < min || tv > max) continue;
    const x = centerX + (t - val * 10) * PPS; // px offset of this tick from the needle
    const major = t % 10 === 0;
    const mid = t % 5 === 0;
    ticks.push(
      <div
        key={t}
        className={`peso-ruler-tick${major ? ' major' : mid ? ' mid' : ''}`}
        style={{ left: `${x}px` }}
      >
        {major && <span className="peso-ruler-tick-label">{tv}</span>}
      </div>
    );
  }

  return (
    <div className={`peso-ruler${compact ? ' peso-ruler--compact' : ''}`}>
      <div className="peso-ruler-readout">
        {typing ? (
          <input
            className="peso-ruler-input"
            type="number" inputMode="decimal" step="0.1" autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={commitTyped}
            onKeyDown={(e) => { if (e.key === 'Enter') commitTyped(); if (e.key === 'Escape') setTyping(false); }}
          />
        ) : (
          <button type="button" className="peso-ruler-value" onClick={openType} aria-label={`${val} ${unit}`}>
            {val.toFixed(1)}
          </button>
        )}
        <span className="peso-ruler-unit">{unit}</span>
      </div>

      <div
        ref={trackRef}
        className="peso-ruler-track"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={val}
        aria-valuetext={`${val} ${unit}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <div className="peso-ruler-strip">{ticks}</div>
        <div className="peso-ruler-needle" aria-hidden="true" />
      </div>
    </div>
  );
}
