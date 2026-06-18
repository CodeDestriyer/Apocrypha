import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from '../pages/SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// SM-2 (Wozniak 1985), mapped onto two grades:
//   Hard  ≈ q=2 → reps reset, ease −0.32, due tomorrow, lapse++.
//   Easy  ≈ q=5 → ease +0.1, interval follows SM-2 ladder:
//                 rep 1 → 1 day, rep 2 → 6 days, rep N → round(prev·ease).
// Ease clamped to [1.3, 3.0]. The 1d→6d graduating ladder is the key fix
// vs. naive SM-2-lite: a brand new card you "know" still gets re-shown
// the next day, not 3 days later when memory has already decayed.
const reviewCard = (card, grade) => {
  const prevEase = card.ease ?? 2.5;
  const now = new Date().toISOString();
  if (grade === 'hard') {
    return {
      ...card,
      ease: Math.max(1.3, prevEase - 0.32),
      interval: 1,
      reps: 0,
      lapses: (card.lapses ?? 0) + 1,
      due: addDaysISO(1),
      last_review: now,
    };
  }
  const ease = Math.min(3.0, prevEase + 0.1);
  const prevReps = card.reps ?? 0;
  let interval;
  if (prevReps === 0) interval = 1;
  else if (prevReps === 1) interval = 6;
  else {
    const raw = Math.max(1, Math.round((card.interval ?? 1) * ease));
    // Fuzz ±5% (≥1 day) so a batch reviewed together doesn't all
    // come due on the exact same future day, which otherwise causes
    // spiky review loads.
    const range = Math.max(1, Math.round(raw * 0.05));
    interval = raw + Math.floor(Math.random() * (range * 2 + 1)) - range;
    if (interval < 1) interval = 1;
  }
  return {
    ...card,
    ease,
    interval,
    reps: prevReps + 1,
    lapses: card.lapses ?? 0,
    due: addDaysISO(interval),
    last_review: now,
  };
};

const isDue = (card) => !card.due || card.due <= todayISO();
const isNew = (card) => (card.reps ?? 0) === 0;

// SRS queue = all due reviews + all due-today new cards. Reviews first
// so re-encounters happen before drilling into the unknown.
const buildSrsQueue = (deck) => {
  const reviews = deck.cards.filter((c) => !isNew(c) && isDue(c));
  const news = deck.cards.filter((c) => isNew(c) && isDue(c));
  return [...reviews, ...news];
};

const dueCountFor = (deck) => buildSrsQueue(deck).length;

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// Module-level cache so the in-progress deck/study screen and the unsaved
// add-card draft survive when the user switches to another sidebar tab and
// comes back (which unmounts/remounts CardsSection). Persisted to
// sessionStorage so it also survives full page reloads (e.g. the SW
// controllerchange reload that fires on tab refocus after a deploy).
const _SS_KEY = 'lr.cards.cache.v1';
const _loadSS = () => {
  try {
    const raw = sessionStorage.getItem(_SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const _ssInit = _loadSS() ?? {};
const _nav = {
  openDeckId: _ssInit.nav?.openDeckId ?? null,
  studyDeckId: _ssInit.nav?.studyDeckId ?? null,
  studyCram: _ssInit.nav?.studyCram ?? false,
};
const _drafts = new Map(Object.entries(_ssInit.drafts ?? {}));
const _study = new Map(Object.entries(_ssInit.study ?? {}));
const _saveSS = () => {
  try {
    sessionStorage.setItem(_SS_KEY, JSON.stringify({
      nav: _nav,
      drafts: Object.fromEntries(_drafts),
      study: Object.fromEntries(_study),
    }));
  } catch {}
};

export default function CardsSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const decks = profile.decks ?? [];

  const [openDeckId, _setOpenDeckId] = useState(_nav.openDeckId);
  const [studyDeckId, _setStudyDeckId] = useState(_nav.studyDeckId);
  const [studyCram, _setStudyCram] = useState(_nav.studyCram);
  const setOpenDeckId = (v) => { _nav.openDeckId = v; _saveSS(); _setOpenDeckId(v); };
  const setStudyDeckId = (v) => { _nav.studyDeckId = v; _saveSS(); _setStudyDeckId(v); };
  const setStudyCram = (v) => { _nav.studyCram = v; _saveSS(); _setStudyCram(v); };
  const startStudy = (id, cram = false) => { setStudyCram(cram); setStudyDeckId(id); };
  const endStudy = () => { setStudyCram(false); setStudyDeckId(null); };
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [deckMenuOpen, setDeckMenuOpen] = useState(false);
  const deckMenuRef = useRef(null);

  useEffect(() => {
    if (!deckMenuOpen) return;
    const onDoc = (e) => { if (deckMenuRef.current && !deckMenuRef.current.contains(e.target)) setDeckMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [deckMenuOpen]);

  const setDecks = (updater) =>
    update((curr) => ({ decks: updater(curr.decks ?? []) }));

  const addDeck = (name) => {
    const n = name.trim();
    if (!n) return;
    setDecks((d) => [...d, { id: newId(), name: n, created_at: new Date().toISOString(), cards: [] }]);
  };
  const removeDeck = (id) => setDecks((d) => d.filter((x) => x.id !== id));
  const renameDeck = (id, name) =>
    setDecks((d) => d.map((x) => (x.id === id ? { ...x, name } : x)));
  const setDeckMode = (id, mode) => {
    _study.delete(id); _saveSS();
    setDecks((d) => d.map((x) => (x.id === id ? { ...x, mode } : x)));
  };

  const addCard = (deckId, front, back, note) => {
    const f = front.trim(); const b = back.trim();
    if (!f || !b) return;
    const card = { id: newId(), front: f, back: b, due: todayISO(), interval: 0, ease: 2.5, reps: 0, lapses: 0 };
    if (note && note.trim()) card.note = note.trim();
    setDecks((d) => d.map((x) => x.id === deckId
      ? { ...x, cards: [...x.cards, card] }
      : x));
  };
  const removeCard = (deckId, cardId) =>
    setDecks((d) => d.map((x) => x.id === deckId
      ? { ...x, cards: x.cards.filter((c) => c.id !== cardId) }
      : x));
  const updateCard = (deckId, cardId, patch) =>
    setDecks((d) => d.map((x) => x.id === deckId
      ? { ...x, cards: x.cards.map((c) => c.id === cardId ? { ...c, ...patch } : c) }
      : x));

  // Compute SubPage header dynamically
  const currentDeck = decks.find((d) => d.id === (studyDeckId || openDeckId));
  let title, onBack, headerRight;
  if (studyDeckId && currentDeck) {
    title = <span className="sub-title-deck">{currentDeck.name}</span>;
    onBack = () => { _study.delete(currentDeck.id); _saveSS(); endStudy(); };
    const isRandom = currentDeck.mode === 'random';
    headerRight = studyCram ? null : (
      <div className="cards-gear" ref={deckMenuRef}>
        <button className="cards-gear-btn" onClick={() => setDeckMenuOpen((o) => !o)} aria-label={t('cards.deckSettings')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d={GEAR_PATH}/>
          </svg>
        </button>
        {deckMenuOpen && (
          <div className="cards-gear-menu cards-gear-menu--right">
            <button
              className="cards-gear-item"
              onClick={() => { setDeckMenuOpen(false); setDeckMode(currentDeck.id, isRandom ? 'srs' : 'random'); }}
            >
              {isRandom ? t('cards.switchToSmart') : t('cards.switchToRandom')}
            </button>
          </div>
        )}
      </div>
    );
  } else if (openDeckId && currentDeck) {
    if (editingName) {
      title = (
        <input
          className="sub-title-input"
          value={nameDraft}
          autoFocus
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => { renameDeck(currentDeck.id, nameDraft.trim() || currentDeck.name); setEditingName(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { renameDeck(currentDeck.id, nameDraft.trim() || currentDeck.name); setEditingName(false); }
            if (e.key === 'Escape') { setEditingName(false); }
          }}
        />
      );
    } else {
      title = (
        <span className="sub-title-deck" onClick={() => { setNameDraft(currentDeck.name); setEditingName(true); }}>
          {currentDeck.name}
        </span>
      );
    }
    onBack = () => { setOpenDeckId(null); setEditingName(false); };
    headerRight = (
      <div className="cards-gear" ref={deckMenuRef}>
        <button className="cards-gear-btn" onClick={() => setDeckMenuOpen((o) => !o)} aria-label={t('cards.deckSettings')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d={GEAR_PATH}/>
          </svg>
        </button>
        {deckMenuOpen && (
          <div className="cards-gear-menu cards-gear-menu--right">
            <button className="cards-gear-item" onClick={() => { setDeckMenuOpen(false); setNameDraft(currentDeck.name); setEditingName(true); }}>
              {t('cards.renameDeck')}
            </button>
            <button
              className="cards-gear-item"
              onClick={() => { setDeckMenuOpen(false); startStudy(currentDeck.id, true); }}
              disabled={currentDeck.cards.length === 0}
            >
              {t('cards.studyAll')}
            </button>
            <button
              className="cards-gear-item cards-gear-item--danger"
              onClick={() => { setDeckMenuOpen(false); removeDeck(currentDeck.id); setOpenDeckId(null); }}
            >
              {t('cards.deleteDeck')}
            </button>
          </div>
        )}
      </div>
    );
  } else {
    title = t('nav.cards');
    onBack = rootOnBack;
  }

  let body;
  if (studyDeckId && currentDeck) {
    body = (
      <StudyView
        deck={currentDeck}
        cram={studyCram}
        onGrade={(cardId, grade) => updateCard(currentDeck.id, cardId, reviewCard(currentDeck.cards.find((c) => c.id === cardId), grade))}
        t={t}
      />
    );
  } else if (openDeckId && currentDeck) {
    body = (
      <DeckView
        deck={currentDeck}
        onStudy={() => startStudy(currentDeck.id, false)}
        onAddCard={(f, b, n) => addCard(currentDeck.id, f, b, n)}
        onRemoveCard={(cardId) => removeCard(currentDeck.id, cardId)}
        onEditCard={(cardId, patch) => updateCard(currentDeck.id, cardId, patch)}
        t={t}
      />
    );
  } else {
    body = (
      <DeckList
        decks={decks}
        onOpen={(id) => setOpenDeckId(id)}
        onAdd={addDeck}
        t={t}
      />
    );
  }

  return (
    <SubPage title={title} onBack={onBack} headerRight={headerRight}>
      {body}
    </SubPage>
  );
}

function DeckList({ decks, onOpen, onAdd, t }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName('');
    setAdding(false);
  };

  return (
    <>
      {decks.length === 0 && (
        <div className="empty-hint">{t('cards.empty')}</div>
      )}

      <ul className="skills">
        {decks.map((d) => {
          const due = dueCountFor(d);
          return (
            <li key={d.id} className="skill deck-row" onClick={() => onOpen(d.id)} role="button">
              <div className="skill-head">
                <span className="skill-name">{d.name}</span>
                <span className="deck-counts">
                  <span className="deck-due">{due}</span>
                  <span className="deck-total">/ {d.cards.length}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="cards-panel">
          <label className="cards-field-label">{t('cards.newDeck')}</label>
          <input
            className="cards-field-input"
            value={name}
            autoFocus
            placeholder={t('cards.deckNamePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') { setAdding(false); setName(''); }
            }}
            maxLength={48}
          />
          <div className="cards-panel-actions">
            <button className="cards-secondary-btn" onClick={() => { setAdding(false); setName(''); }}>
              {t('cards.cancel')}
            </button>
            <button className="cards-primary-btn" onClick={submit} disabled={!name.trim()}>
              {t('cards.create')}
            </button>
          </div>
        </div>
      ) : (
        <button className="cards-big-add cards-big-add--deck" onClick={() => setAdding(true)}>
          <span className="cards-big-add-plus">+</span>
          <span>{t('cards.newDeck')}</span>
        </button>
      )}
    </>
  );
}

function DeckView({ deck, onStudy, onAddCard, onRemoveCard, onEditCard, t }) {
  const draft = _drafts.get(deck.id) ?? { front: '', back: '', note: '', adding: false, noteOpen: false };
  const [front, _setFront] = useState(draft.front);
  const [back, _setBack] = useState(draft.back);
  const [note, _setNote] = useState(draft.note);
  const [noteOpen, _setNoteOpen] = useState(draft.noteOpen);
  const [adding, _setAdding] = useState(draft.adding);
  const persist = (patch) => {
    const cur = _drafts.get(deck.id) ?? { front: '', back: '', note: '', adding: false, noteOpen: false };
    _drafts.set(deck.id, { ...cur, ...patch });
    _saveSS();
  };
  const setFront = (v) => { persist({ front: v }); _setFront(v); };
  const setBack = (v) => { persist({ back: v }); _setBack(v); };
  const setNote = (v) => { persist({ note: v }); _setNote(v); };
  const setNoteOpen = (v) => { persist({ noteOpen: v }); _setNoteOpen(v); };
  const setAdding = (v) => { persist({ adding: v }); _setAdding(v); };
  const dueCount = useMemo(() => dueCountFor(deck), [deck]);

  const duplicate = useMemo(() => {
    const f = front.trim().toLowerCase();
    if (!f) return null;
    return deck.cards.find((c) => (c.front ?? '').trim().toLowerCase() === f) ?? null;
  }, [front, deck.cards]);

  const closeAdd = () => {
    setAdding(false);
    setFront(''); setBack(''); setNote(''); setNoteOpen(false);
    _drafts.delete(deck.id);
    _saveSS();
  };

  const submitCard = () => {
    if (!front.trim() || !back.trim() || duplicate) return;
    onAddCard(front, back, note.trim() || undefined);
    closeAdd();
  };

  const [query, setQuery] = useState('');

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deck.cards;
    return deck.cards.filter((c) =>
      (c.front ?? '').toLowerCase().includes(q) ||
      (c.back ?? '').toLowerCase().includes(q) ||
      (c.note ?? '').toLowerCase().includes(q)
    );
  }, [query, deck.cards]);

  return (
    <div className="cards-deck">
      <button
        className="cards-study-btn"
        onClick={onStudy}
        disabled={dueCount === 0}
      >
        {t('cards.study')} · {dueCount}
      </button>

      <div className="cards-search open">
        <svg className="cards-search-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/>
          <path d="m20 20-3.5-3.5"/>
        </svg>
        <input
          className="cards-search-input"
          placeholder={t('cards.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
        />
        {query && (
          <button
            className="cards-search-close"
            onClick={() => setQuery('')}
            aria-label={t('cards.close')}
          >×</button>
        )}
      </div>

      {adding ? (
        <div className="cards-panel">
          <label className="cards-field-label">{t('cards.frontSide')}</label>
          <textarea
            className={`cards-field-textarea ${duplicate ? 'cards-field-textarea--error' : ''}`}
            value={front}
            autoFocus
            placeholder={t('cards.frontPlaceholder')}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
          />
          {duplicate && (
            <div className="cards-dup-warn">
              <span className="cards-dup-warn-title">{t('cards.dupTitle')}</span>
              <span className="cards-dup-warn-back">{duplicate.back}</span>
            </div>
          )}
          <label className="cards-field-label">{t('cards.backSide')}</label>
          <textarea
            className="cards-field-textarea"
            value={back}
            placeholder={t('cards.backPlaceholder')}
            onChange={(e) => setBack(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitCard();
            }}
            rows={3}
          />

          {noteOpen ? (
            <>
              <div className="cards-note-head">
                <label className="cards-field-label">{t('cards.note')}</label>
                <button className="cards-note-collapse" onClick={() => setNoteOpen(false)}>{t('cards.hide')}</button>
              </div>
              <textarea
                className="cards-field-textarea cards-field-textarea--note"
                value={note}
                placeholder={t('cards.notePlaceholder')}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                autoFocus
              />
            </>
          ) : (
            <button className="cards-note-add" onClick={() => setNoteOpen(true)}>+ {t('cards.addNote')}</button>
          )}

          <div className="cards-panel-actions">
            <button className="cards-secondary-btn" onClick={closeAdd}>
              {t('cards.cancel')}
            </button>
            <button className="cards-primary-btn" onClick={submitCard} disabled={!front.trim() || !back.trim() || !!duplicate}>
              {t('cards.addCard')}
            </button>
          </div>
        </div>
      ) : (
        <button className="cards-big-add cards-big-add--card" onClick={() => setAdding(true)}>
          <span className="cards-big-add-plus">+</span>
          <span>{t('cards.newCard')}</span>
        </button>
      )}

      <ul className="cards-list">
        {visibleCards.length === 0 && query && (
          <li className="cards-search-empty">{t('cards.searchEmpty')}</li>
        )}
        {visibleCards.map((c) => (
          <CardRow
            key={c.id}
            card={c}
            onRemove={() => onRemoveCard(c.id)}
            onUpdate={(patch) => onEditCard(c.id, patch)}
            t={t}
          />
        ))}
      </ul>
    </div>
  );
}

function CardRow({ card, onRemove, onUpdate, t }) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [note, setNote] = useState(card.note ?? '');
  const [noteOpen, setNoteOpen] = useState(!!card.note);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const startEdit = () => {
    setFront(card.front); setBack(card.back);
    setNote(card.note ?? ''); setNoteOpen(!!card.note);
    setEditing(true);
  };
  const save = () => {
    if (!front.trim() || !back.trim()) return;
    onUpdate({ front: front.trim(), back: back.trim(), note: note.trim() || null });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="card-row card-row-editing">
        <textarea
          className="cards-field-textarea"
          value={front}
          autoFocus
          onChange={(e) => setFront(e.target.value)}
          rows={2}
        />
        <textarea
          className="cards-field-textarea"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={2}
        />
        {noteOpen ? (
          <>
            <div className="cards-note-head">
              <label className="cards-field-label">{t('cards.note')}</label>
              <button className="cards-note-collapse" onClick={() => { setNoteOpen(false); setNote(''); }}>{t('cards.hide')}</button>
            </div>
            <textarea
              className="cards-field-textarea cards-field-textarea--note"
              value={note}
              placeholder={t('cards.notePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </>
        ) : (
          <button className="cards-note-add" onClick={() => setNoteOpen(true)}>+ {t('cards.addNote')}</button>
        )}
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={() => setEditing(false)}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={save} disabled={!front.trim() || !back.trim()}>{t('cards.save')}</button>
        </div>
      </li>
    );
  }

  return (
    <li className="card-row">
      <div className="card-row-front">{card.front}</div>
      <div className="card-row-back">{card.back}</div>
      <div className="cards-gear card-row-gear" ref={menuRef}>
        <button
          className="cards-gear-btn cards-gear-btn--sm"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t('cards.cardSettings')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d={GEAR_PATH}/>
          </svg>
        </button>
        {menuOpen && (
          <div className="cards-gear-menu cards-gear-menu--right">
            <button className="cards-gear-item" onClick={() => { setMenuOpen(false); startEdit(); }}>
              {t('cards.editCard')}
            </button>
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); onRemove(); }}>
              {t('cards.deleteCard')}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function StudyView({ deck, onGrade, cram, t }) {
  const mode = cram ? 'cram' : (deck.mode === 'random' ? 'random' : 'srs');
  const queue = useMemo(() => {
    const saved = cram ? null : _study.get(deck.id);
    const byId = new Map(deck.cards.map((c) => [c.id, c]));
    if (saved && saved.mode === mode && Array.isArray(saved.queueIds)) {
      const restored = saved.queueIds.map((id) => byId.get(id)).filter(Boolean);
      if (restored.length > 0) return restored;
    }
    const arr = mode === 'srs' ? buildSrsQueue(deck) : [...deck.cards];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [deck.id, mode, cram]);
  const savedStudy = cram ? null : _study.get(deck.id);
  const [idx, _setIdx] = useState(() => {
    const i = savedStudy?.mode === mode ? (savedStudy.idx ?? 0) : 0;
    return Math.min(Math.max(0, i), Math.max(0, queue.length - 1));
  });
  const [shown, _setShown] = useState(savedStudy?.mode === mode ? !!savedStudy.shown : false);
  const persistStudy = (patch) => {
    if (cram) return;
    const cur = _study.get(deck.id) ?? { queueIds: queue.map((c) => c.id), idx: 0, shown: false, mode };
    _study.set(deck.id, { ...cur, queueIds: queue.map((c) => c.id), mode, ...patch });
    _saveSS();
  };
  const setIdx = (v) => { persistStudy({ idx: typeof v === 'function' ? v(idx) : v }); _setIdx(v); };
  const setShown = (v) => { persistStudy({ shown: typeof v === 'function' ? v(shown) : v }); _setShown(v); };
  useEffect(() => { persistStudy({}); }, [deck.id, queue, mode]);
  const [dragX, setDragX] = useState(0);
  const [animDir, setAnimDir] = useState(0);
  const touch = useRef({ x: 0, y: 0, active: false });
  const card = queue[idx];

  if (!card) {
    return <StudyDone deckId={deck.id} t={t} />;
  }

  const advance = () => { setShown(false); setIdx(idx + 1); };
  const grade = (g) => { onGrade(card.id, g); advance(); };

  const goNext = () => { if (idx < queue.length - 1) advance(); };
  const goPrev = () => { if (idx > 0) { setShown(false); setIdx(idx - 1); } };

  const swipeEnabled = mode !== 'srs';

  const onTouchStart = (e) => {
    if (!swipeEnabled || e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true, locked: null };
  };
  const onTouchMove = (e) => {
    if (!swipeEnabled || !touch.current.active) return;
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (touch.current.locked == null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touch.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (touch.current.locked !== 'x') return;
    setDragX(dx);
  };
  const onTouchEnd = () => {
    if (!swipeEnabled || !touch.current.active) return;
    const dx = dragX;
    touch.current.active = false;
    const T = 60;
    if (dx < -T && idx < queue.length - 1) {
      setAnimDir(-1);
      setTimeout(() => { setDragX(0); setAnimDir(0); goNext(); }, 180);
    } else if (dx > T && idx > 0) {
      setAnimDir(1);
      setTimeout(() => { setDragX(0); setAnimDir(0); goPrev(); }, 180);
    } else {
      setDragX(0);
    }
  };

  const stageStyle = animDir !== 0
    ? { transform: `translateX(${animDir > 0 ? 110 : -110}%)`, opacity: 0, transition: 'transform 0.18s ease-out, opacity 0.18s ease-out' }
    : dragX !== 0
      ? { transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`, opacity: Math.max(0.3, 1 - Math.abs(dragX) / 350) }
      : { transition: 'transform 0.25s ease-out, opacity 0.25s ease-out' };

  return (
    <div className="cards-study">
      <div className="cards-progress">{idx + 1} / {queue.length}</div>

      <div
        className="study-card-stage"
        style={stageStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          className={`study-card-inner ${shown ? 'flipped' : ''}`}
          onClick={() => { if (Math.abs(dragX) < 6) setShown((s) => !s); }}
        >
          <div className="study-card-face study-card-front">{card.front}</div>
          <div className="study-card-face study-card-back">
            <div className="study-card-back-main">{card.back}</div>
            {card.note && <div className="study-card-note">{card.note}</div>}
          </div>
        </div>
      </div>

      {mode === 'srs' ? (
        <div className="cards-grade-row cards-grade-row--two">
          <button className="cards-grade cards-grade--hard" onClick={() => grade('hard')}>
            {t('cards.hard')}
          </button>
          <button className="cards-grade cards-grade--easy" onClick={() => grade('easy')}>
            {t('cards.easy')}
          </button>
        </div>
      ) : (
        <div className="cards-nav-row">
          <button
            className="cards-nav-btn"
            onClick={goPrev}
            disabled={idx === 0}
            aria-label={t('cards.prev')}
          >‹</button>
          <div className="cards-nav-counter">{idx + 1} / {queue.length}</div>
          <button
            className="cards-nav-btn"
            onClick={goNext}
            disabled={idx >= queue.length - 1}
            aria-label={t('cards.next')}
          >›</button>
        </div>
      )}
    </div>
  );
}

function StudyDone({ deckId, t }) {
  useEffect(() => {
    _study.delete(deckId);
    _saveSS();
  }, [deckId]);
  return (
    <div className="cards-study">
      <div className="cards-study-done">{t('cards.allDone')}</div>
    </div>
  );
}
