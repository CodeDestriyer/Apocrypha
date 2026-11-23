import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStrings } from '../strings.jsx';
import { useProfile } from '../ProfileContext.jsx';
import { loadCourse } from './purchase.js';

// Content shape (course_content.content):
// { chapters: [{ title, cards: [
//   { type: 'text',  title?, body },          body: paragraphs split by a blank line, **bold**
//   { type: 'media', src, caption? },          src: file name in /public/courses/<id>/, or a full URL
//   { type: 'quote', text, by? },
//   { type: 'list',  title?, items: [] },
// ] }] }

function inline(text) {
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

function Card({ card, courseId, t, onClose }) {
  switch (card.type) {
    case 'chapter':
      return (
        <div className="cv-chapter">
          <span className="cv-kicker">{t('course.chapter')} {card.n}</span>
          <h2 className="cv-chapter-title">{card.title}</h2>
        </div>
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
        <div className="cv-text">
          {card.title && <h3 className="cv-title">{card.title}</h3>}
          <ul className="cv-list">{card.items.map((it, i) => <li key={i}>{inline(it)}</li>)}</ul>
        </div>
      );
    case 'end':
      return (
        <div className="cv-chapter">
          <h2 className="cv-chapter-title">{t('course.end')}</h2>
          <button className="promo-cta-btn" type="button" onClick={onClose}>{t('test.close')}</button>
        </div>
      );
    default:
      return (
        <div className="cv-text">
          {card.title && <h3 className="cv-title">{card.title}</h3>}
          {paragraphs(card.body)}
        </div>
      );
  }
}

export default function CourseViewer({ course, onClose }) {
  const { t } = useStrings();
  const { profile, update } = useProfile();
  const [content, setContent] = useState(null);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef(null);
  const resumeRef = useRef(profile?.course_progress?.[course.id] ?? 0);

  useEffect(() => {
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
    if (!cards.length || profile?.course_progress?.[course.id] === index) return;
    update((curr) => ({ course_progress: { ...(curr?.course_progress ?? {}), [course.id]: index } }));
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      const step = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (!step || !scrollerRef.current) return;
      e.preventDefault();
      const next = Math.max(0, Math.min(cards.length - 1, index + step));
      scrollerRef.current.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length, index, onClose]);

  const pct = cards.length > 1 ? Math.round((index / (cards.length - 1)) * 100) : 0;

  // Into the landing root, like the PDF reader: escapes the per-section
  // stacking contexts but keeps the CSS variables.
  return createPortal(
    <div className="cv-overlay" role="dialog" aria-modal="true" aria-label={course.title}>
      <div className="cv-bar">
        <div className="cv-progress"><div style={{ width: `${pct}%` }} /></div>
        <button className="cv-close" type="button" onClick={onClose} aria-label={t('test.close')}>×</button>
      </div>
      {error && <p className="cv-status">{t('course.error')}</p>}
      {!error && !content && <p className="cv-status">{t('preview.loading')}</p>}
      <div className="cv-scroller" ref={scrollerRef}>
        {cards.map((card, i) => (
          <section key={i} data-i={i} className={`cv-card cv-card--${card.type ?? 'text'}`}>
            <Card card={card} courseId={course.id} t={t} onClose={onClose} />
          </section>
        ))}
      </div>
    </div>,
    document.querySelector('.landing') ?? document.body,
  );
}
