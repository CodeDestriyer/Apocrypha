import { useEffect, useRef, useState } from 'react';
import { useStrings } from '../strings.jsx';
import { getSession, signInWithGoogle } from '../supabase.js';
import { CARD_COURSES } from './products.js';
import CourseViewer, { Slide, BACKGROUNDS, toneOf } from './CourseViewer.jsx';
import { isAdmin, loadCourseAdmin, saveDraft, publishCourse, uploadMedia } from './admin.js';
import { resolveMediaLink } from './gifLink.js';
import { EDITABLE_TESTS, originalTexts, currentOverrides, saveTestTexts } from './tests/texts.js';
import './panel.css';

const TYPES = ['big', 'text', 'stat', 'poll', 'reveal', 'task', 'quote', 'list', 'media'];
const newId = () => Math.random().toString(36).slice(2, 10);

const BLANK = {
  big: { text: '' },
  text: { body: '' },
  stat: { items: [{ value: '', label: '' }] },
  poll: { q: '', options: ['', ''], reply: '' },
  reveal: { q: '', a: '' },
  task: { text: '' },
  quote: { text: '' },
  list: { items: [''] },
  media: { src: '' },
};

const snippet = (c) => (c.text || c.body || c.q || c.title || c.caption || c.src
  || c.items?.map((x) => x.value ?? x).join(' · ') || '').replace(/\*\*/g, '');

export default function Panel() {
  const { t } = useStrings();
  const [admin, setAdmin] = useState(null);
  const [signedIn, setSignedIn] = useState(true);
  const [tab, setTab] = useState('courses');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    isAdmin().then(setAdmin);
    getSession().then((s) => setSignedIn(!!s && !s.user?.is_anonymous));
  }, []);

  if (admin === false && !signedIn) {
    return (
      <main className="landing-main pn">
        <button className="promo-cta-btn pn-signin" type="button" onClick={signInWithGoogle}>{t('panel.signin')}</button>
      </main>
    );
  }
  if (!admin) return <main className="landing-main pn" />;

  if (open?.kind === 'course') return <CourseEditor course={open.item} onBack={() => setOpen(null)} />;
  if (open?.kind === 'test') return <TestEditor test={open.item} onBack={() => setOpen(null)} />;

  return (
    <main className="landing-main pn">
      <h1 className="pn-h1">{t('panel.title')}</h1>
      <div className="pn-tabs">
        {['courses', 'tests'].map((k) => (
          <button key={k} type="button" className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{t(`panel.${k}`)}</button>
        ))}
      </div>
      <div className="pn-grid">
        {(tab === 'courses' ? CARD_COURSES : EDITABLE_TESTS).map((item) => (
          <button
            key={item.id}
            type="button"
            className="pn-tile"
            onClick={() => setOpen({ kind: tab === 'courses' ? 'course' : 'test', item })}
          >
            <img src={item.cover ?? item.logo} alt="" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

/* ── Courses ─────────────────────────────────────────────── */

function CourseEditor({ course, onBack }) {
  const { t } = useStrings();
  const [content, setContent] = useState(null);
  const [published, setPublished] = useState(null);
  const [sel, setSel] = useState(null); // { ch, i } — i null = the chapter itself
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadCourseAdmin(course.id)
      .then(({ draft, published: p }) => { setContent(draft); setPublished(p); })
      .catch(() => setStatus('error'));
  }, [course.id]);

  // Autosave the draft; buyers only see it after Publicar.
  useEffect(() => {
    if (!content) return undefined;
    if (!loaded.current) { loaded.current = true; return undefined; }
    setStatus('saving');
    const id = setTimeout(() => {
      saveDraft(course.id, content).then(() => setStatus('saved')).catch(() => setStatus('error'));
    }, 700);
    return () => clearTimeout(id);
  }, [content, course.id]);

  if (!content) return <main className="landing-main pn">{status === 'error' && <p className="pn-err">{t('panel.error')}</p>}</main>;

  const chapters = content.chapters ?? [];
  const dirty = JSON.stringify(content) !== JSON.stringify(published);
  const edit = (fn) => setContent((c) => { const next = structuredClone(c); fn(next.chapters); return next; });

  const publish = async () => {
    setStatus('publishing');
    try {
      await publishCourse(course.id, content);
      setPublished(structuredClone(content));
      setStatus('published');
    } catch { setStatus('error'); }
  };

  const addCard = (ch) => {
    const i = chapters[ch].cards.length;
    edit((cs) => { cs[ch].cards.push({ id: newId(), type: 'text', body: '' }); });
    setSel({ ch, i });
  };
  const addChapter = () => {
    edit((cs) => { cs.push({ title: '', cards: [] }); });
    setSel({ ch: chapters.length, i: null });
  };

  const card = sel && sel.i != null ? chapters[sel.ch]?.cards[sel.i] : null;
  // Same running position the viewer uses for auto backgrounds.
  const autoOf = (ch, i) => chapters.slice(0, ch).reduce((n, c) => n + c.cards.length, 0) + i;
  const chapter = sel ? chapters[sel.ch] : null;

  return (
    <main className={`pn pn-editor${sel ? ' has-sel' : ''}`}>
      <div className="pn-head">
        <button className="pn-link" type="button" onClick={onBack}>← {t('panel.title')}</button>
        <h1 className="pn-h2">{course.title}</h1>
        <span className={`pn-status pn-status--${status}`}>{status && t(`panel.status.${status}`)}</span>
        <button className="pn-btn" type="button" onClick={() => setPreview(true)}>{t('panel.preview')}</button>
        <button className="pn-btn pn-btn--main" type="button" disabled={!dirty || status === 'publishing'} onClick={publish}>
          {dirty ? t('panel.publish') : t('panel.published')}
        </button>
      </div>

      <div className="pn-cols">
        <aside className="pn-list">
          {chapters.map((ch, ci) => (
            <div key={ci} className="pn-chapter">
              <button
                type="button"
                className={`pn-row pn-row--chapter${sel?.ch === ci && sel.i == null ? ' is-sel' : ''}`}
                onClick={() => setSel({ ch: ci, i: null })}
              >
                <span className="pn-n">{ci + 1}</span>
                <span className="pn-snip">{ch.title || '—'}</span>
              </button>
              {ch.cards.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pn-row${sel?.ch === ci && sel.i === i ? ' is-sel' : ''}`}
                  onClick={() => setSel({ ch: ci, i })}
                >
                  <span className="pn-swatch" style={{ background: BACKGROUNDS[toneOf(c, autoOf(ci, i))][0] }} />
                  <span className="pn-type">{c.type}</span>
                  <span className="pn-snip">{snippet(c) || '—'}</span>
                </button>
              ))}
              <button type="button" className="pn-add" onClick={() => addCard(ci)}>+ {t('panel.card')}</button>
            </div>
          ))}
          <button type="button" className="pn-add pn-add--chapter" onClick={addChapter}>+ {t('panel.chapter')}</button>
        </aside>

        <section className="pn-form">
          {sel && <button className="pn-link pn-back" type="button" onClick={() => setSel(null)}>← {t('panel.cards')}</button>}
          {card && (
            <CardForm
              key={`${sel.ch}-${sel.i}`}
              card={card}
              autoIndex={autoOf(sel.ch, sel.i)}
              courseId={course.id}
              onChange={(next) => edit((cs) => { cs[sel.ch].cards[sel.i] = next; })}
              onMove={(d) => {
                const j = sel.i + d;
                if (j < 0 || j >= chapter.cards.length) return;
                edit((cs) => { const a = cs[sel.ch].cards; [a[sel.i], a[j]] = [a[j], a[sel.i]]; });
                setSel({ ch: sel.ch, i: j });
              }}
              onDuplicate={() => {
                edit((cs) => { cs[sel.ch].cards.splice(sel.i + 1, 0, { ...structuredClone(card), id: newId() }); });
                setSel({ ch: sel.ch, i: sel.i + 1 });
              }}
              onDelete={() => {
                if (!window.confirm(t('panel.confirmDelete'))) return;
                edit((cs) => { cs[sel.ch].cards.splice(sel.i, 1); });
                setSel(null);
              }}
            />
          )}
          {chapter && sel.i == null && (
            <ChapterForm
              chapter={chapter}
              n={sel.ch + 1}
              onTitle={(title) => edit((cs) => { cs[sel.ch].title = title; })}
              onMove={(d) => {
                const j = sel.ch + d;
                if (j < 0 || j >= chapters.length) return;
                edit((cs) => { [cs[sel.ch], cs[j]] = [cs[j], cs[sel.ch]]; });
                setSel({ ch: j, i: null });
              }}
              onDelete={() => {
                if (!window.confirm(t('panel.confirmDeleteChapter'))) return;
                edit((cs) => { cs.splice(sel.ch, 1); });
                setSel(null);
              }}
            />
          )}
        </section>
      </div>

      {preview && (
        <CourseViewer
          course={course}
          preview={content}
          onClose={() => setPreview(false)}
        />
      )}
    </main>
  );
}

function ChapterForm({ chapter, n, onTitle, onMove, onDelete }) {
  const { t } = useStrings();
  return (
    <div className="pn-edit">
      <div className="pn-fields">
        <Field label={t('panel.f.title')}>
          <input value={chapter.title} onChange={(e) => onTitle(e.target.value)} />
        </Field>
        <Actions onMove={onMove} onDelete={onDelete} />
      </div>
      <Phone card={{ type: 'chapter', n, title: chapter.title }} />
    </div>
  );
}

function CardForm({ card, autoIndex, courseId, onChange, onMove, onDuplicate, onDelete }) {
  const { t } = useStrings();
  const set = (k, v) => onChange({ ...card, [k]: v });
  const setType = (type) => {
    const { id, tone, image } = card;
    // Carry over whichever text the old card had into the new type's main field.
    const carry = snippet(card);
    const next = { id: id ?? newId(), type, ...structuredClone(BLANK[type]), ...(tone ? { tone } : {}), ...(image ? { image } : {}) };
    const main = { big: 'text', text: 'body', poll: 'q', reveal: 'q', task: 'text', quote: 'text' }[type];
    if (main && carry) next[main] = carry;
    onChange(next);
  };

  const text = (k, label, rows = 3) => (
    <Field label={label}>
      <textarea rows={rows} value={card[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  const line = (k, label) => (
    <Field label={label}>
      <input value={card[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  const lines = (k, label) => (
    <Field label={label} hint={t('panel.f.perLine')}>
      <textarea rows={4} value={(card[k] ?? []).join('\n')} onChange={(e) => set(k, e.target.value.split('\n'))} />
    </Field>
  );

  return (
    <div className="pn-edit">
      <div className="pn-fields">
        <div className="pn-pills">
          {TYPES.map((ty) => (
            <button key={ty} type="button" className={card.type === ty ? 'is-on' : ''} onClick={() => card.type !== ty && setType(ty)}>{ty}</button>
          ))}
        </div>
        <div className="pn-pills pn-tones">
          <button
            type="button"
            className={`pn-auto${card.tone ? '' : ' is-on'}`}
            onClick={() => { const { tone, ...rest } = card; onChange(rest); }}
          >
            auto
          </button>
          {Object.entries(BACKGROUNDS).map(([key, [bg]]) => (
            <button
              key={key}
              type="button"
              style={{ background: bg }}
              className={card.tone === key ? 'is-on' : ''}
              onClick={() => onChange({ ...card, tone: key })}
              aria-label={key}
            />
          ))}
        </div>

        {card.type === 'big' && text('text', t('panel.f.text'), 3)}
        {card.type === 'text' && <>{line('kicker', t('panel.f.kicker'))}{line('title', t('panel.f.title'))}{text('body', t('panel.f.body'), 6)}</>}
        {card.type === 'stat' && (
          <Field label={t('panel.f.stats')}>
            {(card.items ?? []).map((s, i) => (
              <div key={i} className="pn-stat">
                <input placeholder="0:47" value={s.value} onChange={(e) => set('items', card.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <input value={s.label} onChange={(e) => set('items', card.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <button type="button" className="pn-x" onClick={() => set('items', card.items.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="pn-add" onClick={() => set('items', [...(card.items ?? []), { value: '', label: '' }])}>+</button>
          </Field>
        )}
        {card.type === 'poll' && <>{text('q', t('panel.f.question'), 2)}{lines('options', t('panel.f.options'))}{text('reply', t('panel.f.reply'), 3)}</>}
        {card.type === 'reveal' && <>{text('q', t('panel.f.question'), 2)}{text('a', t('panel.f.answer'), 4)}</>}
        {card.type === 'task' && <>{text('text', t('panel.f.text'), 3)}{line('done', t('panel.f.button'))}</>}
        {card.type === 'quote' && <>{text('text', t('panel.f.text'), 3)}{line('by', t('panel.f.by'))}</>}
        {card.type === 'list' && <>{line('title', t('panel.f.title'))}{lines('items', t('panel.f.items'))}</>}
        {card.type === 'media' && <>
          <MediaField courseId={courseId} value={card.src} onChange={(v) => set('src', v)} />
          {text('caption', t('panel.f.caption'), 2)}
        </>}
        {card.type !== 'media' && (
          <MediaField label={t('panel.f.image')} courseId={courseId} value={card.image} onChange={(v) => {
            const { image, ...rest } = card;
            onChange(v ? { ...rest, image: v } : rest);
          }} />
        )}
        <p className="pn-hint">{t('panel.f.bold')}</p>
        <Actions onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>
      <Phone card={card} autoIndex={autoIndex} courseId={courseId} />
    </div>
  );
}

function MediaField({ label, courseId, value, onChange }) {
  const { t } = useStrings();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);

  const run = async (fn) => {
    setBusy(true); setErr(false);
    try { onChange(await fn()); } catch { setErr(true); }
    setBusy(false);
  };
  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) run(() => uploadMedia(courseId, file));
  };
  // A Giphy/Tenor/Imgur page link becomes the file behind it.
  const commit = (raw) => {
    if ((raw ?? '') === (value ?? '')) return;
    if (!raw.trim()) { onChange(''); return; }
    run(() => resolveMediaLink(raw));
  };

  return (
    <Field label={label ?? t('panel.f.media')}>
      <div className="pn-media-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => { const v = e.clipboardData.getData('text'); if (v) { e.preventDefault(); setDraft(v); commit(v); } }}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(draft); } }}
          placeholder="giphy.com / tenor.com / …"
          disabled={busy}
        />
        <label className="pn-btn pn-upload">
          {busy ? '…' : t('panel.upload')}
          <input type="file" accept="image/*,video/mp4" onChange={onFile} disabled={busy} hidden />
        </label>
        {value && <button type="button" className="pn-x" onClick={() => onChange('')} aria-label={t('panel.delete')}>×</button>}
      </div>
      {err && <span className="pn-err">{t('panel.linkError')}</span>}
    </Field>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="pn-field">
      <span className="pn-label">{label}{hint && <em> · {hint}</em>}</span>
      {children}
    </label>
  );
}

function Actions({ onMove, onDuplicate, onDelete }) {
  const { t } = useStrings();
  return (
    <div className="pn-actions">
      <button type="button" className="pn-btn" onClick={() => onMove(-1)} aria-label={t('panel.up')}>↑</button>
      <button type="button" className="pn-btn" onClick={() => onMove(1)} aria-label={t('panel.down')}>↓</button>
      {onDuplicate && <button type="button" className="pn-btn" onClick={onDuplicate}>{t('panel.duplicate')}</button>}
      <button type="button" className="pn-btn pn-btn--danger" onClick={onDelete}>{t('panel.delete')}</button>
    </div>
  );
}

// The card exactly as the viewer draws it, at phone size.
function Phone({ card, autoIndex = 0, courseId }) {
  const { t } = useStrings();
  return (
    <div className="pn-phone">
      <Slide card={card} autoIndex={autoIndex} courseId={courseId} t={t} onClose={() => {}} onNext={() => {}} className="is-active" />
    </div>
  );
}

/* ── Tests ───────────────────────────────────────────────── */

function labelFor(path, t) {
  const m = path.match(/^items\.(\d+)\.text$/);
  if (m) return `${t('panel.t.q')} ${+m[1] + 1}`;
  const o = path.match(/^items\.(\d+)\.options\.(\d+)\.text$/);
  if (o) return `${t('panel.t.q')} ${+o[1] + 1} · ${t('panel.t.opt')} ${+o[2] + 1}`;
  if (path === 'title') return t('panel.f.title');
  if (path === 'short') return t('panel.t.short');
  return path.split('.').join(' · ');
}

function TestEditor({ test, onBack }) {
  const { t } = useStrings();
  const orig = originalTexts(test.id);
  const [values, setValues] = useState(() => ({ ...orig, ...currentOverrides(test.id) }));
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const overrides = Object.fromEntries(Object.entries(values).filter(([p, v]) => v !== orig[p]));
  const saved = currentOverrides(test.id);
  const dirty = JSON.stringify(overrides) !== JSON.stringify(saved);

  const save = async () => {
    setStatus('saving');
    try { await saveTestTexts(test.id, overrides); setStatus('published'); } catch { setStatus('error'); }
  };

  const q = query.trim().toLowerCase();
  const paths = Object.keys(orig).filter((p) => !q || values[p].toLowerCase().includes(q) || labelFor(p, t).toLowerCase().includes(q));

  return (
    <main className="landing-main pn">
      <div className="pn-head">
        <button className="pn-link" type="button" onClick={onBack}>← {t('panel.title')}</button>
        <h1 className="pn-h2">{test.title}</h1>
        <span className={`pn-status pn-status--${status}`}>{status && t(`panel.status.${status}`)}</span>
        <button className="pn-btn pn-btn--main" type="button" disabled={!dirty || status === 'saving'} onClick={save}>
          {dirty ? t('panel.publish') : t('panel.published')}
        </button>
      </div>
      <input className="pn-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('panel.search')} />
      <div className="pn-texts">
        {paths.map((p) => (
          <label key={p} className={`pn-field${values[p] !== orig[p] ? ' is-changed' : ''}`}>
            <span className="pn-label">
              {labelFor(p, t)}
              {values[p] !== orig[p] && (
                <button type="button" className="pn-reset" onClick={(e) => { e.preventDefault(); setValues((v) => ({ ...v, [p]: orig[p] })); }}>
                  {t('panel.reset')}
                </button>
              )}
            </span>
            <textarea
              rows={Math.min(6, Math.max(1, Math.ceil(values[p].length / 70)))}
              value={values[p]}
              onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
            />
          </label>
        ))}
      </div>
    </main>
  );
}
