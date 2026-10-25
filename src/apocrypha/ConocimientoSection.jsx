import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import RichEditor from './RichEditor.jsx';
import TagInput from './tags.jsx';
import { renderBody } from './richText.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

const noteTags = (n) => (Array.isArray(n.tags) ? n.tags : []);

function NotaCard({ nota, onOpen, t }) {
  const tags = noteTags(nota);
  return (
    <div className="rule-card" data-note-id={nota.id}>
      <button className="rule-card-open" onClick={() => onOpen(nota.id)}>
        <span className="rule-card-title">{nota.title || t('conocimiento.noBody')}</span>
        {tags.length > 0 && (
          <span className="nota-card-tags">{tags.map((tg) => '#' + tg).join(' ')}</span>
        )}
      </button>
    </div>
  );
}

// Conocimiento (Héroe › Conocimiento) — a tagged Zettelkasten: flat, atomic
// notes with hashtags, no folders. The feed is newest-first; tag chips filter
// it, several active tags meaning AND.
//
// Nota: { id, title, body, tags: [string], created_at }   on profile.notes
//
// Folder-era columns (note_groups, note_layout) and the `groupId` on older
// notes are no longer read. They stay in the database untouched.
export default function ConocimientoSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const notes = profile.notes ?? [];

  const setNotes = (updater) =>
    update((curr) => ({ notes: updater(curr.notes ?? []) }));

  const addNote = (patch) =>
    setNotes((r) => [{ id: newId(), ...patch, created_at: new Date().toISOString() }, ...r]);
  const removeNote = (id) => setNotes((r) => r.filter((x) => x.id !== id));
  const updateNote = (id, patch) =>
    setNotes((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const [open, setOpen] = useState(null);          // null (list) | 'new' | noteId (editing)
  const [reading, setReading] = useState(null);    // null | noteId (isolated full-page read)
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  // Every tag in use, most used first.
  const tagCounts = useMemo(() => {
    const m = new Map();
    for (const n of notes) for (const tg of noteTags(n)) m.set(tg, (m.get(tg) ?? 0) + 1);
    return m;
  }, [notes]);
  const allTags = useMemo(
    () => [...tagCounts.keys()].sort((a, b) => tagCounts.get(b) - tagCounts.get(a) || a.localeCompare(b)),
    [tagCounts],
  );

  // A tag can vanish (last note carrying it deleted or retagged) — drop it from
  // the filter so the feed never sticks on an empty result.
  useEffect(() => {
    if (activeTags.some((tg) => !tagCounts.has(tg))) {
      setActiveTags((a) => a.filter((tg) => tagCounts.has(tg)));
    }
  }, [tagCounts, activeTags]);

  const toggleTag = (tg) =>
    setActiveTags((a) => (a.includes(tg) ? a.filter((x) => x !== tg) : [...a, tg]));
  // The filter only applies while its panel is open, so no hidden filter can
  // linger behind a collapsed button.
  const toggleFilter = () => {
    if (filterOpen) setActiveTags([]);
    setFilterOpen((o) => !o);
  };

  const currentNote = (open && open !== 'new') ? (notes.find((r) => r.id === open) ?? null) : null;
  const readingNote = reading ? (notes.find((r) => r.id === reading) ?? null) : null;
  const isEditing = open === 'new' || !!currentNote;

  const openNew = () => {
    setReading(null); setMenuOpen(false);
    setTitle(''); setBody('');
    // A new note starts inside the current filter: written while looking at
    // #dinero, it is about #dinero.
    setTags(activeTags);
    setOpen('new');
  };
  const openFull = (id) => { setMenuOpen(false); setEditingName(false); setReading(id); };
  const editNote = (r) => {
    setMenuOpen(false); setEditingName(false); setReading(null);
    setTitle(r.title ?? ''); setBody(r.body ?? ''); setTags(noteTags(r));
    setOpen(r.id);
  };
  const backToList = () => { setOpen(null); setReading(null); setMenuOpen(false); setEditingName(false); };
  const showTag = (tg) => { setQuery(''); setActiveTags([tg]); setFilterOpen(true); backToList(); };

  const commitRename = () => {
    if (!readingNote) return;
    updateNote(readingNote.id, { title: nameDraft.trim() || readingNote.title });
    setEditingName(false);
  };

  const saveNew = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) { backToList(); return; }
    addNote({ title: ti, body: bo, tags });
    backToList();
  };
  const saveEdit = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) return;
    updateNote(currentNote.id, { title: ti, body: bo, tags });
    backToList();
  };

  // ── Header (title / back / gear) ─────────────────────────────
  let pageTitle, onBack, headerRight = null;
  if (open === 'new') {
    pageTitle = t('conocimiento.new');
    onBack = backToList;
  } else if (currentNote) {
    pageTitle = <span className="sub-title-deck rule-title-plain">{currentNote.title || t('conocimiento.title')}</span>;
    onBack = backToList;
  } else if (readingNote) {
    onBack = backToList;
    pageTitle = editingName ? (
      <input
        className="sub-title-input"
        value={nameDraft}
        autoFocus
        placeholder={t('conocimiento.titlePlaceholder')}
        maxLength={80}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') setEditingName(false);
        }}
      />
    ) : (
      <span className="sub-title-deck rule-title-plain">{readingNote.title || t('conocimiento.title')}</span>
    );
    headerRight = (
      <div className="cards-gear" ref={menuRef}>
        <button className="cards-gear-btn" onClick={() => setMenuOpen((o) => !o)} aria-label={t('cards.cardSettings')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d={GEAR_PATH}/>
          </svg>
        </button>
        {menuOpen && (
          <div className="cards-gear-menu cards-gear-menu--right">
            <button className="cards-gear-item" onClick={() => editNote(readingNote)}>{t('cards.editCard')}</button>
            <button className="cards-gear-item" onClick={() => { setMenuOpen(false); setNameDraft(readingNote.title ?? ''); setEditingName(true); }}>{t('cards.renameDeck')}</button>
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); removeNote(readingNote.id); backToList(); }}>{t('cards.deleteCard')}</button>
          </div>
        )}
      </div>
    );
  } else {
    pageTitle = t('conocimiento.title');
    onBack = rootOnBack;
  }

  // ── Body ─────────────────────────────────────────────────────
  let content;
  if (isEditing) {
    const submit = open === 'new' ? saveNew : saveEdit;
    content = (
      <div className="cards-panel">
        <label className="cards-field-label">{t('conocimiento.titleLabel')}</label>
        <input
          className="cards-field-input"
          value={title}
          autoFocus
          placeholder={t('conocimiento.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
        <label className="cards-field-label">{t('conocimiento.tagsLabel')}</label>
        <TagInput
          tags={tags}
          onChange={setTags}
          suggestions={allTags}
          placeholder={t('conocimiento.tagsPlaceholder')}
          t={t}
        />
        <label className="cards-field-label">{t('conocimiento.bodyLabel')}</label>
        <RichEditor
          editKey={open === 'new' ? 'new' : currentNote.id}
          initialValue={body}
          onChange={setBody}
          onSubmit={submit}
          placeholder={t('conocimiento.bodyPlaceholder')}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={backToList}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
            {t('cards.save')}
          </button>
        </div>
      </div>
    );
  } else if (readingNote) {
    const rTags = noteTags(readingNote);
    content = (
      <div className="rule-read">
        {rTags.length > 0 && (
          <div className="nota-read-tags">
            {rTags.map((tg) => (
              <button key={tg} className="nota-tag" onClick={() => showTag(tg)}>#{tg}</button>
            ))}
          </div>
        )}
        {readingNote.body
          ? <div className="rule-read-body">{renderBody(readingNote.body)}</div>
          : <div className="empty-hint">{t('conocimiento.noBody')}</div>}
      </div>
    );
  } else {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const feed = notes
      .filter((n) => {
        const nt = noteTags(n);
        if (!activeTags.every((tg) => nt.includes(tg))) return false;
        return !q
          || (n.title ?? '').toLowerCase().includes(q)
          || (n.body ?? '').toLowerCase().includes(q)
          || nt.some((tg) => tg.includes(q));
      })
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
    const filtering = !!q || activeTags.length > 0;

    content = (
      <>
        <div className="search-add-row">
          {notes.length > 0 && (
            <div className="cards-search open">
              <svg className="cards-search-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                className="cards-search-input"
                placeholder={t('conocimiento.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
              />
              {query && (
                <button className="cards-search-close" onClick={() => setQuery('')} aria-label={t('cards.close')}>×</button>
              )}
            </div>
          )}
          {allTags.length > 0 && (
            <button
              className={`search-filter-btn ${filterOpen ? 'active' : ''}`}
              onClick={toggleFilter}
              aria-label={t('cards.filterTags')}
              title={t('cards.filterTags')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
              </svg>
            </button>
          )}
          <button className="search-add-btn" onClick={openNew} aria-label={t('conocimiento.new')}>+</button>
        </div>

        {filterOpen && allTags.length > 0 && (
          <div className="cards-tag-study cards-tag-filter">
            <div className="cards-tag-study-chips">
              {allTags.map((tg) => (
                <button
                  key={tg}
                  className={`cards-tag-study-chip ${activeTags.includes(tg) ? 'active' : ''}`}
                  onClick={() => toggleTag(tg)}
                >
                  #{tg}<span className="cards-tag-study-count">{tagCounts.get(tg)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {feed.length === 0 && filtering ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : feed.length > 0 && (
          <div className="rules-list">
            {feed.map((n) => <NotaCard key={n.id} nota={n} onOpen={openFull} t={t} />)}
          </div>
        )}
      </>
    );
  }

  return (
    <SubPage title={pageTitle} onBack={onBack} headerRight={headerRight}>
      <div className="conocimiento">{content}</div>
    </SubPage>
  );
}
