import { useEffect, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

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
    if (!window.confirm(t('habits.resetConfirm'))) return;
    setHabits((h) => h.map((x) => (x.id === id ? { ...x, since: new Date().toISOString() } : x)));
  };
  const remove = (id) => setHabits((h) => h.filter((x) => x.id !== id));

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
              <li key={hb.id} className="habito-card">
                <div className="habito-main">
                  <span className="habito-name">{hb.name}</span>
                  <span className="habito-since">{t('habits.since')} {fmtSince(hb.since)}</span>
                </div>
                <div className="habito-count">
                  <div className="habito-timer">
                    <span className="habito-days">{days}</span>
                    <span className="habito-days-label">{days === 1 ? t('habits.day') : t('habits.days')}</span>
                  </div>
                  <div className="habito-clock">{pad(h)}:{pad(m)}:{pad(sec)}</div>
                </div>
                <div className="habito-actions">
                  <button className="habito-reset" onClick={() => reset(hb.id)} title={t('habits.resetHint')} aria-label={t('habits.reset')}>↺</button>
                  <button className="habito-del" onClick={() => remove(hb.id)} aria-label={t('habits.delete')}>×</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SubPage>
  );
}
