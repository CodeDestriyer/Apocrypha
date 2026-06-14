import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

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

// Minimal SM-2-lite. Enough for a prototype; we can swap in full SM-2 / FSRS later.
const reviewCard = (card, grade) => {
  // grade: 'again' | 'good' | 'easy'
  const ease = Math.max(1.3, Math.min(3.0, (card.ease ?? 2.5) + (grade === 'again' ? -0.2 : grade === 'easy' ? 0.15 : 0)));
  let interval;
  if (grade === 'again') interval = 0;
  else if ((card.interval ?? 0) === 0) interval = grade === 'easy' ? 3 : 1;
  else interval = Math.max(1, Math.round((card.interval ?? 1) * ease * (grade === 'easy' ? 1.3 : 1)));
  return {
    ...card,
    ease,
    interval,
    reps: (card.reps ?? 0) + 1,
    lapses: (card.lapses ?? 0) + (grade === 'again' ? 1 : 0),
    due: addDaysISO(interval),
    last_review: new Date().toISOString(),
  };
};

const isDue = (card) => !card.due || card.due <= todayISO();

export default function CardsSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const decks = profile.decks ?? [];

  const [openDeckId, setOpenDeckId] = useState(null);
  const [studyDeckId, setStudyDeckId] = useState(null);

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

  const addCard = (deckId, front, back) => {
    const f = front.trim(); const b = back.trim();
    if (!f || !b) return;
    setDecks((d) => d.map((x) => x.id === deckId
      ? { ...x, cards: [...x.cards, { id: newId(), front: f, back: b, due: todayISO(), interval: 0, ease: 2.5, reps: 0, lapses: 0 }] }
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

  if (studyDeckId) {
    const deck = decks.find((d) => d.id === studyDeckId);
    if (!deck) { setStudyDeckId(null); return null; }
    return (
      <StudyView
        deck={deck}
        onGrade={(cardId, grade) => updateCard(deck.id, cardId, reviewCard(deck.cards.find((c) => c.id === cardId), grade))}
        onExit={() => setStudyDeckId(null)}
        t={t}
      />
    );
  }

  if (openDeckId) {
    const deck = decks.find((d) => d.id === openDeckId);
    if (!deck) { setOpenDeckId(null); return null; }
    return (
      <DeckView
        deck={deck}
        onBack={() => setOpenDeckId(null)}
        onStudy={() => setStudyDeckId(deck.id)}
        onAddCard={(f, b) => addCard(deck.id, f, b)}
        onRemoveCard={(cardId) => removeCard(deck.id, cardId)}
        onRename={(name) => renameDeck(deck.id, name)}
        onDelete={() => { removeDeck(deck.id); setOpenDeckId(null); }}
        t={t}
      />
    );
  }

  return (
    <DeckList
      decks={decks}
      onOpen={(id) => setOpenDeckId(id)}
      onAdd={addDeck}
      t={t}
    />
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
          const due = d.cards.filter(isDue).length;
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

function DeckView({ deck, onBack, onStudy, onAddCard, onRemoveCard, onRename, onDelete, t }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(deck.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const dueCount = useMemo(() => deck.cards.filter(isDue).length, [deck.cards]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const submitCard = () => {
    if (!front.trim() || !back.trim()) return;
    onAddCard(front, back);
    setFront('');
    setBack('');
    setAdding(false);
  };

  return (
    <div className="cards-deck">
      <div className="cards-deck-head">
        <button className="cards-back-btn" onClick={onBack} aria-label={t('cards.back')}>
          <span className="cards-back-chevron">‹</span>
          <span>{t('cards.back')}</span>
        </button>
        {editingName ? (
          <input
            className="cards-name-input"
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => { onRename(nameDraft.trim() || deck.name); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onRename(nameDraft.trim() || deck.name); setEditingName(false); }
              if (e.key === 'Escape') { setNameDraft(deck.name); setEditingName(false); }
            }}
          />
        ) : (
          <h2 className="cards-deck-name" onClick={() => setEditingName(true)}>{deck.name}</h2>
        )}
        <div className="cards-gear" ref={menuRef}>
          <button className="cards-gear-btn" onClick={() => setMenuOpen((o) => !o)} aria-label={t('cards.deckSettings')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="cards-gear-menu">
              <button className="cards-gear-item" onClick={() => { setMenuOpen(false); setEditingName(true); }}>
                {t('cards.renameDeck')}
              </button>
              <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
                {t('cards.deleteDeck')}
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        className="cards-study-btn"
        onClick={onStudy}
        disabled={dueCount === 0}
      >
        {t('cards.study')} · {dueCount}
      </button>

      <ul className="cards-list">
        {deck.cards.map((c) => (
          <li key={c.id} className="card-row">
            <div className="card-row-front">{c.front}</div>
            <div className="card-row-back">{c.back}</div>
            <button className="remove" onClick={() => onRemoveCard(c.id)}>✕</button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="cards-panel">
          <label className="cards-field-label">{t('cards.frontSide')}</label>
          <textarea
            className="cards-field-textarea"
            value={front}
            autoFocus
            placeholder={t('cards.frontPlaceholder')}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
          />
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
          <div className="cards-panel-actions">
            <button className="cards-secondary-btn" onClick={() => { setAdding(false); setFront(''); setBack(''); }}>
              {t('cards.cancel')}
            </button>
            <button className="cards-primary-btn" onClick={submitCard} disabled={!front.trim() || !back.trim()}>
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
    </div>
  );
}

function StudyView({ deck, onGrade, onExit, t }) {
  const queue = useMemo(() => deck.cards.filter(isDue), [deck.id]); // freeze queue at session start
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const card = queue[idx];

  if (!card) {
    return (
      <div className="cards-study">
        <div className="cards-study-done">{t('cards.allDone')}</div>
        <button className="cards-study-btn" onClick={onExit}>{t('cards.back')}</button>
      </div>
    );
  }

  const grade = (g) => {
    onGrade(card.id, g);
    setShown(false);
    setIdx((i) => i + 1);
  };

  return (
    <div className="cards-study">
      <div className="cards-progress">{idx + 1} / {queue.length}</div>

      <div className="study-card-stage">
        <div
          className={`study-card-inner ${shown ? 'flipped' : ''}`}
          onClick={() => setShown(true)}
        >
          <div className="study-card-face study-card-front">{card.front}</div>
          <div className="study-card-face study-card-back">{card.back}</div>
        </div>
      </div>

      {!shown ? (
        <button className="cards-study-btn" onClick={() => setShown(true)}>{t('cards.show')}</button>
      ) : (
        <div className="cards-grade-row">
          <button className="cards-grade again" onClick={() => grade('again')}>{t('cards.again')}</button>
          <button className="cards-grade good"  onClick={() => grade('good')}>{t('cards.good')}</button>
          <button className="cards-grade easy"  onClick={() => grade('easy')}>{t('cards.easy')}</button>
        </div>
      )}

      <button className="cards-back-btn cards-study-exit" onClick={onExit}>
        <span className="cards-back-chevron">‹</span>
        <span>{t('cards.back')}</span>
      </button>
    </div>
  );
}
