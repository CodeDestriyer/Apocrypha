import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// Split an elapsed millisecond span into whole days + hh:mm:ss.
const elapsedParts = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    sec: s % 60,
  };
};
const pad = (n) => String(n).padStart(2, '0');
const fmtSince = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

// "Hábitos" (Salud › Hábitos) — a quit-counter. Add something you want to stop
// doing; each entry counts up live from the moment you started (or last relapsed).
// A relapse resets the clock to now. Data lives on profile.habits.
// A habit is { id, name, since, created_at }.
export default function HabitosSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const habits = Array.isArray(profile.habits) ? profile.habits : [];

  // Tick every second so the counters advance live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    if (menuId == null) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  const setHabits = (updater) =>
    update((curr) => ({ habits: updater(Array.isArray(curr.habits) ? curr.habits : []) }));

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const nowISO = new Date().toISOString();
    setHabits((h) => [{ id: newId(), name, since: nowISO, created_at: nowISO }, ...h]);
    setDraft('');
    setAdding(false);
  };
  const reset = (id) => {
    setMenuId(null);
    if (!window.confirm(t('habits.resetConfirm'))) return;
    setHabits((h) => h.map((x) => (x.id === id ? { ...x, since: new Date().toISOString() } : x)));
  };
  const remove = (id) => { setMenuId(null); setHabits((h) => h.filter((x) => x.id !== id)); };

  return (
    <SubPage title={t('habits.title')} onBack={rootOnBack}>
      <div className="habitos">
        {!adding && (
          <div className="habitos-topbar">
            <button className="search-add-btn" onClick={() => setAdding(true)} aria-label={t('habits.add')}>+</button>
          </div>
        )}

        {adding && (
          <div className="cards-panel habito-add">
            <input
              className="cards-field-input"
              value={draft}
              autoFocus
              placeholder={t('habits.placeholder')}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
                if (e.key === 'Escape') { setAdding(false); setDraft(''); }
              }}
              maxLength={60}
            />
            <div className="cards-panel-actions">
              <button className="cards-secondary-btn" onClick={() => { setAdding(false); setDraft(''); }}>
                {t('cards.cancel')}
              </button>
              <button className="cards-primary-btn" onClick={add} disabled={!draft.trim()}>
                {t('habits.add')}
              </button>
            </div>
          </div>
        )}

        <ul className="habitos-list">
          {habits.map((hb) => {
            const since = new Date(hb.since).getTime();
            const { days, h, m, sec } = elapsedParts(now - (Number.isNaN(since) ? now : since));
            return (
              <li key={hb.id} className={`habito-card${menuId === hb.id ? ' menu-open' : ''}`}>
                <div className="habito-main">
                  <span className="habito-name">{hb.name}</span>
                  <span className="habito-since">{t('habits.since')} {fmtSince(hb.since)}</span>
                </div>
                <div className="habito-count">
                  <span className="habito-days">{days}</span>
                  <div className="habito-countside">
                    <span className="habito-days-label">{days === 1 ? t('habits.day') : t('habits.days')}</span>
                    <span className="habito-clock">{pad(h)}:{pad(m)}:{pad(sec)}</span>
                  </div>
                </div>
                <div className="habito-gear" ref={menuId === hb.id ? menuRef : null}>
                  <button
                    className="cards-gear-btn cards-gear-btn--sm"
                    onClick={() => setMenuId((cur) => (cur === hb.id ? null : hb.id))}
                    aria-label={t('habits.title')}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/>
                      <path d={GEAR_PATH}/>
                    </svg>
                  </button>
                  {menuId === hb.id && (
                    <div className="cards-gear-menu cards-gear-menu--right">
                      <button className="cards-gear-item" onClick={() => reset(hb.id)}>{t('habits.reset')}</button>
                      <button className="cards-gear-item cards-gear-item--danger" onClick={() => remove(hb.id)}>{t('habits.delete')}</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SubPage>
  );
}
