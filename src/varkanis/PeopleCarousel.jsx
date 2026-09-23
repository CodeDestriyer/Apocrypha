import { useEffect, useMemo, useRef } from 'react';

/**
 * Автокарусель лиц. Две ленты на главной едут навстречу друг другу.
 * Свайп руками работает — на время касания автоскролл на паузе.
 *
 * Фото: /public/people/*.jpg — реальные люди, перенесены из imarsen.
 * Перед публичным запуском убедись, что есть право на использование.
 */
const PHOTO_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
const PHOTOS = PHOTO_IDS.map((n) => `/people/${n}.jpg`);
const REPEAT = 14; // 10 фото × 20px × 14 ≈ 2800px

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PeopleCarousel({ dir = 'ltr', speed = 1.1 }) {
  const trackRef = useRef(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Обратное направление стартует с середины — иначе scrollLeft упрётся в 0.
    const step = dir === 'rtl' ? -speed : speed;
    if (step < 0) el.scrollLeft = el.scrollWidth / 2;

    let raf = 0;
    const tick = () => {
      if (!paused.current) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += step;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        else if (el.scrollLeft <= 0) el.scrollLeft += half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const hold = () => { paused.current = true; };
    const release = () => { paused.current = false; };
    el.addEventListener('pointerdown', hold);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('touchstart', hold, { passive: true });
    el.addEventListener('touchend', release);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', hold);
      el.removeEventListener('pointerup', release);
      el.removeEventListener('pointercancel', release);
      el.removeEventListener('pointerleave', release);
      el.removeEventListener('touchstart', hold);
      el.removeEventListener('touchend', release);
    };
  }, [dir, speed]);

  // случайный порядок на загрузку; половина петли должна быть шире экрана,
  // иначе крошечные карточки не закроют ленту — отсюда REPEAT
  const shuffled = useMemo(() => shuffle(PHOTOS), []);
  const half = Array.from({ length: REPEAT }, () => shuffled).flat();
  const loop = [...half, ...half];

  return (
    <div className="people-track" ref={trackRef} aria-hidden="true">
      {loop.map((src, i) => (
        <div className="people-card" key={i}>
          <img src={src} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </div>
  );
}
