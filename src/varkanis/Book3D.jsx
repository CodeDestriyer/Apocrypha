import { useEffect, useRef } from 'react';

/**
 * The book as a solid you can spin any way: six faces in CSS 3D.
 * Orientation is a quaternion; each drag step rotates it about the screen
 * axis perpendicular to the drag, so it turns the way the finger goes no
 * matter how it is already oriented. It coasts after release and stays put.
 */

const DRAG = 0.5;      // degrees per px
const FRICTION = 0.95;

// q = [w, x, y, z]
const mul = (a, b) => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
const axisAngle = (x, y, z, deg) => {
  const len = Math.hypot(x, y, z) || 1;
  const h = (deg * Math.PI) / 360;
  const s = Math.sin(h) / len;
  return [Math.cos(h), x * s, y * s, z * s];
};
const norm = (q) => {
  const l = Math.hypot(...q) || 1;
  return q.map((v) => v / l);
};
const css = (q) => {
  const w = Math.max(-1, Math.min(1, q[0]));
  const angle = (2 * Math.acos(w) * 180) / Math.PI;
  const s = Math.sqrt(1 - w * w);
  if (s < 1e-6) return 'none';
  return `rotate3d(${q[1] / s}, ${q[2] / s}, ${q[3] / s}, ${angle}deg)`;
};

// Resting pose: turned to show the page edge, tipped slightly back.
const REST = mul(axisAngle(1, 0, 0, 6), axisAngle(0, 1, 0, -28));

export default function Book3D({ src, alt, spine, className = '' }) {
  const bodyRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const body = bodyRef.current;
    const stage = stageRef.current;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let q = REST;
    let spin = { x: 0, y: 0 }; // px-per-frame of the last drag, for coasting
    let drag = null;
    let raf = 0;

    const turn = (dx, dy) => {
      const deg = Math.hypot(dx, dy) * DRAG;
      if (deg < 1e-4) return;
      // Screen y points down: dragging right turns about +y, down about -x.
      q = norm(mul(axisAngle(-dy, dx, 0, deg), q));
    };
    const apply = () => { body.style.transform = css(q); };

    const tick = () => {
      if (!drag) {
        turn(spin.x, spin.y);
        spin = { x: spin.x * FRICTION, y: spin.y * FRICTION };
      }
      apply();
      const moving = drag || Math.hypot(spin.x, spin.y) > 0.02;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onDown = (e) => {
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-grabbing');
      spin = { x: 0, y: 0 };
      kick();
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      turn(dx, dy);
      spin = { x: dx, y: dy };
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      stage.classList.remove('is-grabbing');
      kick();
    };

    apply();
    // A short coast on arrival hints that it's a solid you can grab.
    if (!still) { spin = { x: 9, y: 0 }; kick(); }

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className={`book-3d ${className}`} ref={stageRef}>
      <div className="book-3d-body" ref={bodyRef}>
        <img className="book-3d-face book-3d-front" src={src} alt={alt} draggable={false} />
        <span className="book-3d-face book-3d-crease" aria-hidden="true" />
        <span className="book-3d-face book-3d-back" aria-hidden="true">
          <span className="book-3d-back-mark">VARKANIS</span>
        </span>
        <span className="book-3d-face book-3d-spine" aria-hidden="true">
          <span className="book-3d-spine-text">{spine}</span>
        </span>
        <span className="book-3d-face book-3d-edge book-3d-edge-side" aria-hidden="true" />
        <span className="book-3d-face book-3d-edge book-3d-edge-top" aria-hidden="true" />
        <span className="book-3d-face book-3d-edge book-3d-edge-bottom" aria-hidden="true" />
      </div>
    </div>
  );
}
