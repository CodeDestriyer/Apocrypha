import { useEffect, useRef } from 'react';

/**
 * The book as a solid you can spin: six faces in CSS 3D, dragged by pointer.
 * Horizontal drag turns it, and it keeps coasting after release.
 * Touch keeps vertical page scroll (touch-action: pan-y).
 */

const REST_Y = -28;   // resting turn, shows the page edge
const REST_X = 6;
const DRAG = 0.55;    // degrees per px
const FRICTION = 0.94;
const SETTLE = 0.02;  // pull back to rest once it stops being pushed

export default function Book3D({ src, alt, spine, className = '' }) {
  const bodyRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const body = bodyRef.current;
    const stage = stageRef.current;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ry = REST_Y;
    let rx = REST_X;
    let vy = 0;
    let vx = 0;
    let drag = null;
    let raf = 0;

    const apply = () => {
      body.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };

    const tick = () => {
      // Resting pose nearest to where it is now: front or a full turn of it.
      const target = REST_Y + Math.round((ry - REST_Y) / 360) * 360;
      if (!drag) {
        ry += vy;
        rx += vx;
        vy *= FRICTION;
        vx *= FRICTION;
        if (Math.abs(vy) < 0.4) ry += (target - ry) * SETTLE;
        if (Math.abs(vx) < 0.4) rx += (REST_X - rx) * SETTLE * 2;
      }
      apply();
      const settled = !drag
        && Math.abs(vy) < 0.01 && Math.abs(vx) < 0.01
        && Math.abs(ry - target) < 0.05 && Math.abs(rx - REST_X) < 0.05;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onDown = (e) => {
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now() };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-grabbing');
      vy = 0; vx = 0;
      kick();
    };
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      ry += dx * DRAG;
      vy = dx * DRAG;
      if (e.pointerType === 'mouse') {
        rx = Math.max(-30, Math.min(30, rx - dy * DRAG * 0.6));
        vx = -dy * DRAG * 0.6;
      }
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      stage.classList.remove('is-grabbing');
      kick();
    };

    apply();
    // A slow half turn on arrival hints that it's a solid you can grab.
    if (!still) { vy = 7; kick(); }

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
