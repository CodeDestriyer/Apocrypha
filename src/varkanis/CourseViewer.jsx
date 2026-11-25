import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStrings } from '../strings.jsx';
import { useProfile } from '../ProfileContext.jsx';
import { loadCourse } from './purchase.js';

// Content shape (course_content.content):
// { chapters: [{ title, cards: [card] }] }
// One idea per card, ~30 words max. Every card takes an optional
// tone: 'dark' | 'accent' (default: paper).
//   { type: 'big',    text }                         one punchy line, huge type
//   { type: 'text',   kicker?, title?, body }        body: paragraphs split by a blank line
//   { type: 'stat',   items: [{ value, label }] }    1-3 big numbers
//   { type: 'poll',   q, options: [], reply }        tap an option -> reply
//   { type: 'reveal', q, a }                         tap to reveal the answer
//   { type: 'task',   text, done? }                  exercise, button advances
//   { type: 'quote',  text, by? }
//   { type: 'list',   title?, items: [] }
//   { type: 'media',  src, caption? }                src: file in /public/courses/<id>/, or a URL
// Inline: **bold**.

function inline(text = '') {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
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

function mediaSrc(courseId, src) {
  return /^(https?:)?\//.test(src) ? src : `/courses/${courseId}/${src}`;
}

function Poll({ card }) {
  const [picked, setPicked] = useState(null);
  return (
    <>
      <h3 className="cv-q">{inline(card.q)}</h3>
      <div className="cv-options">
        {card.options.filter(Boolean).map((o, i) => (
          <button
            key={i}
            type="button"
            className={`cv-option${picked === i ? ' is-picked' : ''}`}
            disabled={picked !== null}
            onClick={() => setPicked(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && card.reply && <p className="cv-reply">{inline(card.reply)}</p>}
    </>
  );
}

function Reveal({ card, t }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <h3 className="cv-q">{inline(card.q)}</h3>
      {open
        ? <div className="cv-reply">{paragraphs(card.a)}</div>
        : <button type="button" className="cv-option cv-option--reveal" onClick={() => setOpen(true)}>{t('course.reveal')}</button>}
    </>
  );
}

export function Card({ card, courseId, t, onClose, onNext }) {
  switch (card.type) {
    case 'chapter':
      return (
        <>
          <span className="cv-kicker">{t('course.chapter')} {card.n}</span>
          <h2 className="cv-chapter-title">{card.title}</h2>
        </>
      );
    case 'big':
      return <p className="cv-big">{inline(card.text)}</p>;
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
          <span className="cv-kicker">{t('course.task')}</span>
          <p className="cv-task">{inline(card.text)}</p>
          <button className="cv-option cv-option--done" type="button" onClick={onNext}>{card.done ?? t('course.done')}</button>
        </>
      );
    case 'media':
      return (
        <figure className="cv-media">
          <img src={mediaSrc(courseId, card.src)} alt={card.caption ?? ''} loading="lazy" />
          {card.caption && <figcaption className="cv-caption">{inline(card.caption)}</figcaption>}
        </figure>
      );
    case 'quote':
      return (
        <blockquote className="cv-quote">
          <p>{inline(card.text)}</p>
          {card.by && <cite>{card.by}</cite>}
        </blockquote>
      );
    case 'list':
      return (
        <>
          {card.title && <h3 className="cv-title">{inline(card.title)}</h3>}
          <ul className="cv-list">{card.items.filter(Boolean).map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>
        </>
      );
    case 'end':
      return (
        <>
          <h2 className="cv-chapter-title">{t('course.end')}</h2>
          <button className="cv-option cv-option--done" type="button" onClick={onClose}>{t('test.close')}</button>
        </>
      );
    default:
      return (
        <>
          {card.kicker && <span className="cv-kicker">{card.kicker}</span>}
          {card.title && <h3 className="cv-title">{inline(card.title)}</h3>}
          {paragraphs(card.body)}
        </>
      );
  }
}

const DEFAULT_TONE = { chapter: 'dark', end: 'dark' };
export const toneOf = (c) => c?.tone ?? DEFAULT_TONE[c?.type] ?? 'paper';

// `preview`: render this content instead of loading it, and keep no progress.
export default function CourseViewer({ course, onClose, preview }) {
  const { t } = useStrings();
  const { profile, update } = useProfile();
  const [content, setContent] = useState(preview ?? null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef(null);
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
    (content.chapters ?? []).forEach((ch, i) => {
      out.push({ type: 'chapter', n: i + 1, title: ch.title });
      out.push(...(ch.cards ?? []));
    });
    out.push({ type: 'end' });
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
      if (e.key === 'Escape') { onClose(); return; }
      const step = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, ' ': 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      go(index + step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap anywhere on a card = next, like stories. Controls handle their own taps.
  const onTap = (e) => {
    if (e.target.closest('button, a, input') || window.getSelection()?.toString()) return;
    go(index + 1);
  };

  const pct = cards.length > 1 ? Math.round((index / (cards.length - 1)) * 100) : 0;

  // Into the landing root, like the PDF reader: escapes the per-section
  // stacking contexts but keeps the CSS variables.
  return createPortal(
    <div className="cv-overlay" data-tone={toneOf(cards[index])} role="dialog" aria-modal="true" aria-label={course.title}>
      <div className="cv-bar">
        <div className="cv-progress"><div style={{ width: `${pct}%` }} /></div>
        {cards.length > 0 && <span className="cv-count">{index + 1}/{cards.length}</span>}
        <button className="cv-close" type="button" onClick={onClose} aria-label={t('test.close')}>×</button>
      </div>
      {error && <p className="cv-status">{t('course.error')}</p>}
      {!error && !content && <p className="cv-status">{t('preview.loading')}</p>}
      <div className="cv-scroller" ref={scrollerRef} onClick={onTap}>
        {cards.map((card, i) => (
          <section
            key={i}
            data-i={i}
            data-tone={toneOf(card)}
            className={`cv-card cv-card--${card.type ?? 'text'}${i === index ? ' is-active' : ''}`}
          >
            <div className="cv-inner">
              <Card card={card} courseId={course.id} t={t} onClose={onClose} onNext={() => go(i + 1)} />
            </div>
            {i === 0 && <span className="cv-swipe" aria-hidden="true" />}
          </section>
        ))}
      </div>
    </div>,
    document.querySelector('.landing') ?? document.body,
  );
}
