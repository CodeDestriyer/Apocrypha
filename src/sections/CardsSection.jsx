import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from '../pages/SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);

const dueCountFor = (deck) => deck.cards.length;

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
  const setOpenDeckId = (v) => { _nav.openDeckId = v; _saveSS(); _setOpenDeckId(v); };
  const setStudyDeckId = (v) => { _nav.studyDeckId = v; _saveSS(); _setStudyDeckId(v); };
  const startStudy = (id) => { setStudyDeckId(id); };
  const endStudy = () => { setStudyDeckId(null); };
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

  const addCard = (deckId, front, back, note) => {
    const f = front.trim(); const b = back.trim();
    if (!f || !b) return;
    const card = { id: newId(), front: f, back: b, box: 1, due: todayISO(), interval: 0, ease: 2.5, reps: 0, lapses: 0 };
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
    headerRight = null;
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
        onGrade={(cardId, patch) => updateCard(currentDeck.id, cardId, patch)}
        t={t}
      />
    );
  } else if (openDeckId && currentDeck) {
    body = (
      <DeckView
        deck={currentDeck}
        onStudy={() => startStudy(currentDeck.id)}
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

const BOX_MAX = 5;
// Individual weight per card: box 1 = 16 … box 5 = 1 (halves each box up), so a
// box-1 word is 16× more likely to surface than a box-5 word. Weighting is
// per-card, so the mix self-balances no matter how cards are split across boxes.
const weightOf = (card) => 2 ** (BOX_MAX - (card.box ?? 1));
// Weighted random draw. Excludes the just-seen card so it can't repeat
// back-to-back (unless it's the only card in the deck).
const pickCard = (cards, excludeId) => {
  if (!cards.length) return null;
  let pool = cards;
  if (excludeId != null && cards.length > 1) pool = cards.filter((c) => c.id !== excludeId);
  const weights = pool.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
};

function StudyView({ deck, onGrade, t }) {
  const saved = _study.get(deck.id);
  const [currentId, _setCurrentId] = useState(() => {
    if (saved?.currentId && deck.cards.some((c) => c.id === saved.currentId)) return saved.currentId;
    const first = pickCard(deck.cards, null);
    return first ? first.id : null;
  });
  const [shown, _setShown] = useState(!!saved?.shown);
  const [reviewed, setReviewed] = useState(saved?.reviewed ?? 0);
  const [known, setKnown] = useState(saved?.known ?? 0);

  const [dragX, setDragX] = useState(0);
  const [animDir, setAnimDir] = useState(0);
  const touch = useRef({ x: 0, y: 0, active: false });

  const card = deck.cards.find((c) => c.id === currentId) ?? null;

  // Persist a partial study state, keeping the rest from the current render.
  const persist = (patch) => {
    _study.set(deck.id, { currentId, shown, reviewed, known, ...patch });
    _saveSS();
  };
  const setCurrentId = (v) => { persist({ currentId: v }); _setCurrentId(v); };
  const setShown = (v) => {
    const nv = typeof v === 'function' ? v(shown) : v;
    persist({ shown: nv }); _setShown(nv);
  };

  // If the current card vanished (deleted / edited out from the deck view) but
  // the deck still has cards, draw a fresh one.
  useEffect(() => {
    if (!currentId || card) return;
    const next = pickCard(deck.cards, null);
    if (next) setCurrentId(next.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, card, deck.cards]);

  if (!card) {
    return (
      <div className="cards-study">
        <div className="cards-study-done">{t('cards.allDone')}</div>
      </div>
    );
  }

  const grade = (knewIt) => {
    const box = card.box ?? 1;
    // Know it → up one box (capped). Don't → straight back to box 1.
    const nextBox = knewIt ? Math.min(BOX_MAX, box + 1) : 1;
    onGrade(card.id, {
      box: nextBox,
      reps: (card.reps ?? 0) + 1,
      lapses: (card.lapses ?? 0) + (knewIt ? 0 : 1),
    });
    // Draw against the updated boxes so the just-graded card's new weight
    // applies immediately (deck prop only updates on the next render).
    const updated = deck.cards.map((c) => (c.id === card.id ? { ...c, box: nextBox } : c));
    const next = pickCard(updated, card.id);
    const nextState = {
      currentId: next ? next.id : null,
      shown: false,
      reviewed: reviewed + 1,
      known: known + (knewIt ? 1 : 0),
    };
    _study.set(deck.id, nextState);
    _saveSS();
    _setCurrentId(nextState.currentId);
    _setShown(false);
    setReviewed(nextState.reviewed);
    setKnown(nextState.known);
  };

  // knewIt → swipe right (dir +1); forgot → swipe left (dir -1)
  const commit = (knewIt) => {
    setAnimDir(knewIt ? 1 : -1);
    setTimeout(() => { setDragX(0); setAnimDir(0); grade(knewIt); }, 180);
  };

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true, locked: null };
  };
  const onTouchMove = (e) => {
    if (!touch.current.active) return;
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
    if (!touch.current.active) return;
    const dx = dragX;
    touch.current.active = false;
    const T = 60;
    if (dx > T) commit(true);
    else if (dx < -T) commit(false);
    else setDragX(0);
  };

  const stageStyle = animDir !== 0
    ? { transform: `translateX(${animDir > 0 ? 110 : -110}%) rotate(${animDir * 8}deg)`, opacity: 0, transition: 'transform 0.18s ease-out, opacity 0.18s ease-out' }
    : dragX !== 0
      ? { transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`, opacity: Math.max(0.3, 1 - Math.abs(dragX) / 350) }
      : { transition: 'transform 0.25s ease-out, opacity 0.25s ease-out' };

  const knewOpacity = Math.max(0, Math.min(1, dragX / 90));
  const forgotOpacity = Math.max(0, Math.min(1, -dragX / 90));

  return (
    <div className="cards-study">
      <div className="cards-progress">{t('cards.reviewed')}: {reviewed} · {known} ✓</div>

      <div
        className="study-card-stage"
        style={stageStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="study-grade-tag study-grade-tag--knew" style={{ opacity: knewOpacity }}>
          {t('cards.knew')}
        </div>
        <div className="study-grade-tag study-grade-tag--forgot" style={{ opacity: forgotOpacity }}>
          {t('cards.forgot')}
        </div>

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

      <div className="cards-grade-row">
        <button className="cards-grade-btn cards-grade-btn--forgot" onClick={() => commit(false)}>
          {t('cards.forgot')}
        </button>
        <button className="cards-grade-btn cards-grade-btn--knew" onClick={() => commit(true)}>
          {t('cards.knew')}
        </button>
      </div>

      <div className="cards-study-hint">{t('cards.swipeHint')}</div>
    </div>
  );
}
