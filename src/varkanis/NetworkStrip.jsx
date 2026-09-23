import { useEffect, useRef } from 'react';

/**
 * People as dots, ties as threads, laid out as a brain. Grab one and the neighbours follow;
 * the grab also sends a pulse of accent colour a few hops out along the ties.
 *
 * Touch: a finger that lands on a dot drags it, anywhere else the page scrolls.
 */

const HIT_R = 22;       // grab radius, px — generous for fingers
const LINKS = 3;        // nearest neighbours each dot ties to
const EDGE_K = 0.05;    // thread stiffness
const HOME_K = 0.012;   // pull back to the resting spot
const DAMP = 0.86;
const PULSE_HOPS = 3;
const PULSE_STEP = 140; // ms between hops
const PULSE_LIFE = 1100;

function rgb(css) {
  const m = css.trim().match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const p = css.match(/[\d.]+/g);
  return p ? p.slice(0, 3).map(Number) : [0, 0, 0];
}

// Side view of a brain in a 100×75 box: frontal lobe left, cerebellum and
// stem bottom right. The outline becomes a ring of dots, the folds become
// chains, and the inside is filled with loose dots tied to their neighbours.
const BRAIN_BOX = [100, 75];
const OUTLINE = 'M13 50 C4 42 4 24 15 15 C24 6 40 2 56 4 C73 5 88 12 94 26 C99 37 96 46 89 50 '
  + 'C93 57 88 66 77 66 C71 66 67 64 65 61 L63 72 C61 75 56 75 56 71 L56 61 '
  + 'C48 61 40 63 32 61 C24 59 17 57 13 50 Z';
const FOLDS = [
  'M26 47 C38 40 54 40 72 36',     // lateral sulcus
  'M52 6 C49 17 53 26 49 37',      // central sulcus
  'M89 50 C82 52 74 54 66 57',     // cerebrum / cerebellum
];

function sample(pathEl, spacing) {
  const len = pathEl.getTotalLength();
  const n = Math.max(2, Math.round(len / spacing));
  return Array.from({ length: n }, (_, i) => {
    const p = pathEl.getPointAtLength((i / n) * len);
    return [p.x, p.y];
  });
}

function build(w, h, svg) {
  const pad = 10;
  const s = Math.min((w - 2 * pad) / BRAIN_BOX[0], (h - 2 * pad) / BRAIN_BOX[1]);
  const ox = (w - BRAIN_BOX[0] * s) / 2;
  const oy = (h - BRAIN_BOX[1] * s) / 2;
  const tf = ([x, y]) => [ox + x * s, oy + y * s];
  const gap = w < 640 ? 17 : 20; // screen px between dots

  const nodes = [];
  const edges = [];
  const seen = new Set();
  const add = (x, y) => {
    nodes.push({
      x, y, vx: 0, vy: 0, hx: x, hy: y,
      phase: Math.random() * Math.PI * 2,
      pulseAt: -1, pulseHop: 0,
      adj: [],
    });
    return nodes.length - 1;
  };
  const tie = (i, j) => {
    if (i === j) return;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (seen.has(key)) return;
    seen.add(key);
    const a = nodes[i];
    const b = nodes[j];
    edges.push({ a: i, b: j, rest: Math.hypot(a.x - b.x, a.y - b.y) });
    a.adj.push(j);
    b.adj.push(i);
  };
  const chain = (d, closed) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', d);
    svg.appendChild(el);
    const pts = sample(el, gap / s).map(tf);
    svg.removeChild(el);
    const ids = pts.map(([x, y]) => add(x, y));
    for (let k = 1; k < ids.length; k++) tie(ids[k - 1], ids[k]);
    if (closed) tie(ids[ids.length - 1], ids[0]);
  };

  chain(OUTLINE, true);
  FOLDS.forEach((d) => chain(d, false));
  const fixed = nodes.length;

  // Loose dots inside, kept off the drawn lines so those stay readable.
  const shape = new Path2D(OUTLINE);
  const probe = document.createElement('canvas').getContext('2d');
  const cell = gap * 1.35;
  for (let y = oy; y < oy + BRAIN_BOX[1] * s; y += cell) {
    for (let x = ox; x < ox + BRAIN_BOX[0] * s; x += cell) {
      const px = x + (Math.random() - 0.5) * cell * 0.7;
      const py = y + (Math.random() - 0.5) * cell * 0.7;
      if (!probe.isPointInPath(shape, (px - ox) / s, (py - oy) / s)) continue;
      let clear = true;
      for (let k = 0; k < fixed && clear; k++) {
        if ((nodes[k].x - px) ** 2 + (nodes[k].y - py) ** 2 < (gap * 0.8) ** 2) clear = false;
      }
      if (clear) add(px, py);
    }
  }

  for (let i = fixed; i < nodes.length; i++) {
    const a = nodes[i];
    nodes
      .map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2])
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, LINKS)
      .forEach(([j]) => tie(i, j));
  }
  return { nodes, edges };
}

export default function NetworkStrip() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const style = getComputedStyle(wrap);
    const ink = rgb(style.getPropertyValue('--ink') || '#000');
    const accent = rgb(style.getPropertyValue('--accent') || '#6e2413');

    let w = 0;
    let h = 0;
    let net = { nodes: [], edges: [] };
    let drag = null; // { i, x, y, id }
    let raf = 0;
    let visible = true;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      if (Math.round(r.width) === w && Math.round(r.height) === h) return;
      w = Math.round(r.width);
      h = Math.round(r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      net = build(w, h, svgRef.current);
      drag = null;
    };

    const pulse = (from, now) => {
      // BFS out from the grabbed dot; each ring lights up a beat later.
      const hop = new Map([[from, 0]]);
      const queue = [from];
      while (queue.length) {
        const i = queue.shift();
        const d = hop.get(i);
        net.nodes[i].pulseAt = now + d * PULSE_STEP;
        net.nodes[i].pulseHop = d;
        if (d === PULSE_HOPS) continue;
        for (const j of net.nodes[i].adj) {
          if (!hop.has(j)) { hop.set(j, d + 1); queue.push(j); }
        }
      }
    };

    const heat = (n, now, i) => {
      if (drag && drag.i === i) return 1;
      if (n.pulseAt < 0 || now < n.pulseAt) return 0;
      const t = (now - n.pulseAt) / PULSE_LIFE;
      return t >= 1 ? 0 : (1 - t) * (1 - n.pulseHop / (PULSE_HOPS + 1));
    };

    const step = (now) => {
      const { nodes, edges } = net;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const f = (EDGE_K * (len - e.rest)) / len;
        a.vx += dx * f; a.vy += dy * f;
        b.vx -= dx * f; b.vy -= dy * f;
      }
      const t = now / 1000;
      nodes.forEach((n, i) => {
        if (drag && drag.i === i) {
          n.x = drag.x; n.y = drag.y; n.vx = 0; n.vy = 0;
          return;
        }
        const wob = still ? 0 : 2.2;
        const tx = n.hx + Math.sin(t * 0.7 + n.phase) * wob;
        const ty = n.hy + Math.cos(t * 0.9 + n.phase) * wob;
        n.vx = (n.vx + (tx - n.x) * HOME_K) * DAMP;
        n.vy = (n.vy + (ty - n.y) * HOME_K) * DAMP;
        n.x += n.vx;
        n.y += n.vy;
      });
    };

    const draw = (now) => {
      const { nodes, edges } = net;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const k = Math.max(heat(a, now, e.a), heat(b, now, e.b)) * 0.5
          + Math.min(heat(a, now, e.a), heat(b, now, e.b)) * 0.5;
        const c = k > 0.01 ? accent : ink;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.13 + k * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      nodes.forEach((n, i) => {
        const k = heat(n, now, i);
        const c = k > 0.01 ? accent : ink;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.75 + k * 0.25})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.4 + k * 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const frame = (now) => {
      step(now);
      draw(now);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const hit = (x, y) => {
      let best = -1;
      let bestD = HIT_R * HIT_R;
      net.nodes.forEach((n, i) => {
        const d = (n.x - x) ** 2 + (n.y - y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };

    const onDown = (e) => {
      const [x, y] = local(e);
      const i = hit(x, y);
      if (i < 0) return;
      drag = { i, x, y, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('is-grabbing');
      pulse(i, performance.now());
    };
    const onMove = (e) => {
      const [x, y] = local(e);
      if (drag && e.pointerId === drag.id) {
        drag.x = Math.max(0, Math.min(w, x));
        drag.y = Math.max(0, Math.min(h, y));
      } else if (e.pointerType === 'mouse') {
        canvas.classList.toggle('is-over', hit(x, y) >= 0);
      }
    };
    const onUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const n = net.nodes[drag.i];
      n.pulseAt = performance.now();
      n.pulseHop = 0;
      drag = null;
      canvas.classList.remove('is-grabbing');
    };
    // Block the scroll only when the finger actually landed on a dot.
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const [x, y] = local(t);
      if (hit(x, y) >= 0) e.preventDefault();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(wrap);
    const onVis = () => {
      visible = !document.hidden;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVis);

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  return (
    <div className="net-strip" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
      {/* Scratch space for measuring path lengths; never shown. */}
      <svg ref={svgRef} width="0" height="0" style={{ position: 'absolute' }} />
    </div>
  );
}
