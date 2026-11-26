import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStrings } from '../strings.jsx';
import { useProfile } from '../ProfileContext.jsx';
import { loadCourse } from './purchase.js';
import { isVideo } from './gifLink.js';

// Content shape (course_content.content):
// { chapters: [{ title, cards: [card] }] }
// One idea per card, ~30 words max. Every card has a stable `id` (likes and
// saves point at it) and takes optional:
//   tone:  a BACKGROUNDS key; unset = auto, rotating by position
//   image: background photo/GIF/mp4 URL, text goes on top
//   { type: 'big',    text }                         one line in sticker plates
//   { type: 'text',   kicker?, title?, body }        body: paragraphs split by a blank line
//   { type: 'stat',   items: [{ value, label }] }    1-3 big numbers
//   { type: 'poll',   q, options: [], reply }        tap an option -> reply
//   { type: 'reveal', q, a }                         tap to reveal the answer
//   { type: 'task',   text, done? }                  exercise, button advances
//   { type: 'quote',  text, by? }
//   { type: 'list',   title?, items: [] }
//   { type: 'media',  src, caption? }                full-bleed image, caption on top
// Inline: **text** = highlighted plate.

// [background, text color, plate text color]
export const BACKGROUNDS = {
  dark:   ['#0f0f0f', '#fff', '#0f0f0f'],
  white:  ['#ffffff', '#111', '#fff'],
  wine:   ['#6e2413', '#fff', '#6e2413'],
  blue:   ['#2350ff', '#fff', '#2350ff'],
  yellow: ['#ffd400', '#111', '#ffd400'],
  pink:   ['#ff3d7f', '#fff', '#e0245e'],
  green:  ['#0f8a5f', '#fff', '#0f8a5f'],
  purple: ['#5b2be0', '#fff', '#5b2be0'],
  orange: ['#ff5a1f', '#fff', '#e8480f'],
  sunset: ['linear-gradient(160deg, #ff7a18, #e0245e)', '#fff', '#d8304f'],
  ocean:  ['linear-gradient(160deg, #1f3cff, #00b4ff)', '#fff', '#1f5cff'],
  night:  ['linear-gradient(160deg, #120c2c, #4a1f7a)', '#fff', '#2a1450'],
};
const LEGACY = { paper: 'white', accent: 'wine' };
const AUTO = ['dark', 'blue', 'wine', 'sunset', 'purple', 'yellow', 'green', 'night', 'pink', 'ocean', 'orange'];

export function toneOf(card, autoIndex = 0) {
  if (card?.type === 'chapter' || card?.type === 'end') return 'dark';
  const t = LEGACY[card?.tone] ?? card?.tone;
  return BACKGROUNDS[t] ? t : AUTO[autoIndex % AUTO.length];
}

function slideStyle(card, autoIndex) {
  const [bg, fg, plateFg] = BACKGROUNDS[toneOf(card, autoIndex)];
  return { '--bg': bg, '--fg': fg, '--plate-fg': plateFg };
}

function inline(text = '') {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
    part.startsWith('**') && part.endsWith('**')
      ? <mark key={i} className="cv-hl">{part.slice(2, -2)}</mark>
      : <Fragment key={i}>{part}</Fragment>
  ));
}

function paragraphs(text = '') {
  return text.split(/\n\s*\n/).map((p, i) => (
    <p key={i} className="cv-p">
      {p.split('\n').map((line, j) => <Fragment key={j}>{j > 0 && <br />}{inline(line)}</Fragment>)}
    </p>
  ));
}

const plain = (text = '') => text.replace(/\*\*/g, '');

function mediaSrc(courseId, src) {
  return /^(https?:)?\//.test(src) ? src : `/courses/${courseId}/${src}`;
}

function Poll({ card }) {
  const [picked, setPicked] = useState(null);
  return (
    <>
      <div className="cv-sticker">
        <p className="cv-sticker-q">{plain(card.q)}</p>
        {card.options.filter(Boolean).map((o, i) => (
          <button
            key={i}
            type="button"
            className={`cv-sticker-opt${picked === i ? ' is-picked' : ''}`}
            disabled={picked !== null}
            onClick={() => setPicked(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && card.reply && <div className="cv-reply">{paragraphs(card.reply)}</div>}
    </>
  );
}

function Reveal({ card, t }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className="cv-lead">{inline(card.q)}</p>
      {open
        ? <div className="cv-reply">{paragraphs(card.a)}</div>
        : <button type="button" className="cv-pill" onClick={() => setOpen(true)}>{t('course.reveal')}</button>}
    </>
  );
}

export function Card({ card, courseId, t, onClose, onNext }) {
  switch (card.type) {
    case 'chapter':
      return (
        <>
          <span className="cv-tag">{t('course.chapter')} {card.n}</span>
          <h2 className="cv-big">{card.title}</h2>
        </>
      );
    case 'big':
      return <p className="cv-big"><span className="cv-plate">{plain(card.text)}</span></p>;
    case 'stat':
      return (
        <div className="cv-stats">
          {card.items.map((s, i) => (
            <div key={i} className="cv-stat">
              <span className="cv-stat-value">{s.value}</span>
              <span className="cv-stat-label">{inline(s.label)}</span>
            </div>
          ))}
        </div>
      );
    case 'poll':
      return <Poll card={card} />;
    case 'reveal':
      return <Reveal card={card} t={t} />;
    case 'task':
      return (
        <>
          <span className="cv-tag">{t('course.task')}</span>
          <p className="cv-lead">{inline(card.text)}</p>
          <button className="cv-pill" type="button" onClick={onNext}>{card.done ?? t('course.done')}</button>
        </>
      );
    case 'media':
      return card.caption ? <div className="cv-caption">{paragraphs(card.caption)}</div> : null;
    case 'quote':
      return (
        <blockquote className="cv-quote">
          <p>«{plain(card.text)}»</p>
          {card.by && <cite>— {card.by}</cite>}
        </blockquote>
      );
    case 'list':
      return (
        <>
          {card.title && <p className="cv-lead">{inline(card.title)}</p>}
          <ul className="cv-list">{card.items.filter(Boolean).map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>
        </>
      );
    case 'end':
      return (
        <>
          <h2 className="cv-big">{t('course.end')}</h2>
          <button className="cv-pill" type="button" onClick={onClose}>{t('test.close')}</button>
        </>
      );
    default:
      return (
        <>
          {card.kicker && <span className="cv-tag">{card.kicker}</span>}
          {card.title && <p className="cv-lead">{inline(card.title)}</p>}
          {paragraphs(card.body)}
        </>
      );
  }
}

// One full-screen card: background (colour or image) + centered content.
// Shared with the panel preview.
export function Slide({ card, autoIndex, courseId, t, onClose, onNext, active = true, className = '', children, ...rest }) {
  const bgImage = card.image ?? (card.type === 'media' ? card.src : null);
  // Only the card on screen plays; thirty looping videos at once would choke a phone.
  const videoRef = useRef(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {}); else v.pause();
  }, [active, bgImage]);
  return (
    <section
      className={`cv-card cv-card--${card.type ?? 'text'}${bgImage ? ' has-image' : ''} ${className}`}
      style={slideStyle(card, autoIndex)}
      {...rest}
    >
      {bgImage && (isVideo(bgImage)
        ? <video ref={videoRef} className="cv-bg" src={mediaSrc(courseId, bgImage)} muted loop playsInline preload="metadata" />
        : <img className="cv-bg" src={mediaSrc(courseId, bgImage)} alt="" loading="lazy" />)}
      <div className="cv-inner">
        <Card card={card} courseId={courseId} t={t} onClose={onClose} onNext={onNext} />
      </div>
      {children}
    </section>
  );
}

const Heart = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.6 4.5c2.2 0 3.7 1.2 4.4 2.5.7-1.3 2.2-2.5 4.4-2.5 3.7 0 5.7 3.9 4.2 7.3C19.5 16.4 12 21 12 21z" /></svg>
);
const Bookmark = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z" /></svg>
);
const Share = (p) => (
  <svg viewBox="0 0 24 24" {...p}><path d="M13 4.5V9C6.5 9.5 3.5 13.5 3 20c2-3.3 5-5 10-5v4.5l8-7.5-8-7.5z" /></svg>
);

// `preview`: render this content instead of loading it, and keep no progress.
export default function CourseViewer({ course, onClose, preview }) {
  const { t } = useStrings();
  const { profile, update } = useProfile();
  const [content, setContent] = useState(preview ?? null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [toast, setToast] = useState('');
  const scrollerRef = useRef(null);
  const lastTap = useRef(0);
  const resumeRef = useRef(preview ? 0 : (profile?.course_progress?.[course.id] ?? 0));

  useEffect(() => {
    if (preview) return undefined;
    let cancelled = false;
    loadCourse(course.id)
      .then((c) => { if (!cancelled) (c ? setContent(c) : setError(true)); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [course.id]);

  const cards = useMemo(() => {
    if (!content) return [];
    const out = [];
    let auto = 0;
    (content.chapters ?? []).forEach((ch, ci) => {
      out.push({ card: { type: 'chapter', n: ci + 1, title: ch.title }, chapter: ch.title, auto: 0 });
      (ch.cards ?? []).forEach((card, i) => {
        out.push({ card, key: card.id ?? `${ci}.${i}`, chapter: ch.title, auto: auto++ });
      });
    });
    out.push({ card: { type: 'end' }, auto: 0 });
    return out;
  }, [content]);

  const go = (i, smooth = true) => {
    const el = scrollerRef.current;
    const next = Math.max(0, Math.min(cards.length - 1, i));
    el?.children[next]?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  };

  // Resume where the reader left off, then track the card in view.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !cards.length) return undefined;
    const start = Math.min(resumeRef.current, cards.length - 1);
    el.children[start]?.scrollIntoView({ block: 'start' });
    setIndex(start);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setIndex(Number(e.target.dataset.i));
      }
    }, { root: el, threshold: 0.6 });
    [...el.children].forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [cards]);

  useEffect(() => {
    if (preview || !cards.length || profile?.course_progress?.[course.id] === index) return;
    update((curr) => ({ course_progress: { ...(curr?.course_progress ?? {}), [course.id]: index } }));
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { if (showSaved) setShowSaved(false); else onClose(); return; }
      const step = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ' ': 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.key];
      if (!step || showSaved) return;
      e.preventDefault();
      go(index + step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Likes and saves live on the profile; the preview keeps them in memory.
  const [localMarks, setLocalMarks] = useState({});
  const marks = preview ? localMarks : (profile?.course_marks?.[course.id] ?? {});
  const has = (kind, key) => (marks[kind] ?? []).includes(key);
  const setMark = (kind, key, on) => {
    const apply = (m) => {
      const list = (m[kind] ?? []).filter((k) => k !== key);
      return { ...m, [kind]: on ? [...list, key] : list };
    };
    if (preview) { setLocalMarks(apply); return; }
    update((curr) => {
      const all = curr?.course_marks ?? {};
      return { course_marks: { ...all, [course.id]: apply(all[course.id] ?? {}) } };
    });
  };

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1600); };

  const share = async () => {
    const url = `${window.location.origin}/#${course.view ?? ''}`;
    try {
      if (navigator.share) await navigator.share({ title: course.title, url });
      else { await navigator.clipboard.writeText(url); flash(t('course.copied')); }
    } catch { /* share sheet dismissed */ }
  };

  // Double tap = like, with a heart where the finger was.
  const onTap = (e) => {
    if (e.target.closest('button, a, input')) return;
    const now = Date.now();
    if (now - lastTap.current > 300) { lastTap.current = now; return; }
    lastTap.current = 0;
    const key = cards[index]?.key;
    if (!key) return;
    setMark('liked', key, true);
    const id = now;
    setHearts((h) => [...h, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 800);
  };

  const current = cards[index];
  const light = current && !current.card.image && current.card.type !== 'media'
    && BACKGROUNDS[toneOf(current.card, current.auto)][1] !== '#fff';
  const pct = cards.length > 1 ? (index / (cards.length - 1)) * 100 : 0;
  const saved = cards.filter((c) => c.key && has('saved', c.key));

  // Into the landing root, like the PDF reader: escapes the per-section
  // stacking contexts but keeps the CSS variables.
  return createPortal(
    <div className={`cv-overlay${light ? ' is-light' : ''}`} role="dialog" aria-modal="true" aria-label={course.title}>
      <div className="cv-top">
        <button className="cv-icon" type="button" onClick={onClose} aria-label={t('test.close')}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button className="cv-icon" type="button" onClick={() => setShowSaved(true)} aria-label={t('course.saved')}>
          <Bookmark className="cv-stroke" />
        </button>
      </div>

      {error && <p className="cv-status">{t('course.error')}</p>}
      {!error && !content && <p className="cv-status">{t('preview.loading')}</p>}

      <div className="cv-scroller" ref={scrollerRef} onClick={onTap}>
        {cards.map((c, i) => (
          <Slide
            key={c.key ?? `x${i}`}
            data-i={i}
            card={c.card}
            autoIndex={c.auto}
            courseId={course.id}
            t={t}
            onClose={onClose}
            onNext={() => go(i + 1)}
            active={i === index}
            className={i === index ? 'is-active' : ''}
          />
        ))}
      </div>

      {current?.key && (
        <div className="cv-rail">
          <button
            type="button"
            className={`cv-rail-btn${has('liked', current.key) ? ' is-liked' : ''}`}
            onClick={() => setMark('liked', current.key, !has('liked', current.key))}
            aria-label={t('course.like')}
          >
            <Heart />
          </button>
          <button
            type="button"
            className={`cv-rail-btn${has('saved', current.key) ? ' is-saved' : ''}`}
            onClick={() => {
              const on = !has('saved', current.key);
              setMark('saved', current.key, on);
              if (on) flash(t('course.savedOne'));
            }}
            aria-label={t('course.save')}
          >
            <Bookmark />
          </button>
          <button type="button" className="cv-rail-btn" onClick={share} aria-label={t('course.share')}>
            <Share />
          </button>
        </div>
      )}

      {current?.chapter && (
        <div className="cv-foot">
          <strong>@varkanis</strong>
          <span>{current.chapter}</span>
        </div>
      )}
      <div className="cv-progress" style={{ width: `${pct}%` }} />

      {hearts.map((h) => (
        <Heart key={h.id} className="cv-burst" style={{ left: h.x, top: h.y }} />
      ))}
      {toast && <div className="cv-toast">{toast}</div>}

      {showSaved && (
        <div className="cv-sheet-wrap" onClick={() => setShowSaved(false)}>
          <div className="cv-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="cv-sheet-title">{t('course.saved')}</p>
            {saved.map((c) => (
              <button
                key={c.key}
                type="button"
                className="cv-sheet-row"
                onClick={() => { setShowSaved(false); go(cards.indexOf(c), false); }}
              >
                <span className="cv-sheet-dot" style={slideStyle(c.card, c.auto)} />
                <span>{plain(c.card.text || c.card.body || c.card.q || c.card.title || c.card.caption || '')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.querySelector('.landing') ?? document.body,
  );
}
