import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import { WeightGraph, latestEntry } from './weightChart.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }
  catch { return iso; }
};
const parseWeight = (raw) => {
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
};

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// "Peso" — the weight tracker (Salud › Peso). Log a weight each morning
// (multiple entries per day allowed); see the trend as a line chart. Data
// lives on profile.weight_log (newest first) + profile.weight_goal.
export default function PesoSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const log = Array.isArray(profile.weight_log) ? profile.weight_log : [];
  const goal = typeof profile.weight_goal === 'number' ? profile.weight_goal : null;
  const latest = latestEntry(log);

  // History, newest measurement first (by date, then entry time).
  const history = useMemo(
    () => [...log].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '') ||
      (b.created_at || '').localeCompare(a.created_at || '')
    ),
    [log]
  );

  const [draft, setDraft] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO()); // calendar; defaults to today
  const [adding, setAdding] = useState(false);            // "+" reveals the input
  const [histOpen, setHistOpen] = useState(false);        // history is collapsed by default
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);        // weight settings gear (header)
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const setLog = (updater) =>
    update((curr) => ({ weight_log: updater(Array.isArray(curr.weight_log) ? curr.weight_log : []) }));

  const submit = () => {
    const weight = parseWeight(draft);
    if (weight == null) return;
    const date = entryDate || todayISO();
    const entry = { id: newId(), weight, date, created_at: new Date().toISOString() };
    setLog((l) => [entry, ...l]);
    setDraft('');
    // Keep the chosen date so backfilling a run of past days stays quick.
  };
  const remove = (id) => setLog((l) => l.filter((e) => e.id !== id));

  const openGoal = () => { setGoalDraft(goal != null ? String(goal) : ''); setGoalEditing(true); };
  const saveGoal = () => { update({ weight_goal: parseWeight(goalDraft) }); setGoalEditing(false); };
  const clearGoal = () => { update({ weight_goal: null }); setGoalEditing(false); };

  const unit = t('body.unit');

  const headerRight = (
    <div className="cards-gear" ref={menuRef}>
      <button className="cards-gear-btn" onClick={() => setMenuOpen((o) => !o)} aria-label={t('body.goal')}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d={GEAR_PATH}/>
        </svg>
      </button>
      {menuOpen && (
        <div className="cards-gear-menu cards-gear-menu--right">
          <button className="cards-gear-item" onClick={() => { setMenuOpen(false); openGoal(); }}>
            {goal != null ? t('body.goal') : t('body.addGoal')}
          </button>
          {goal != null && (
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); clearGoal(); }}>
              {t('body.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <SubPage title={t('weight.title')} onBack={rootOnBack} headerRight={headerRight}>
      <div className="peso">
        <div className="peso-current">
          {latest ? (
            <>
              <span className="peso-current-value">{latest.weight}</span>
              <span className="peso-current-unit">{unit}</span>
              <span className="peso-current-date">{fmtDate(latest.date)}</span>
            </>
          ) : (
            <span className="peso-current-empty">{t('body.empty')}</span>
          )}
        </div>

        {goalEditing && (
          <div className="peso-goal-edit">
            <span className="cards-field-label">{t('body.goal')}</span>
            <input
              className="cards-field-input peso-goal-input"
              type="number" inputMode="decimal" step="0.1" min="0" autoFocus
              value={goalDraft}
              placeholder={t('body.goalPlaceholder')}
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setGoalEditing(false); }}
            />
            <button className="cards-primary-btn peso-goal-save" onClick={saveGoal}>✓</button>
            <button className="cards-secondary-btn peso-goal-clear" onClick={() => setGoalEditing(false)}>{t('cards.cancel')}</button>
          </div>
        )}

        {log.length ? (
          <WeightGraph log={log} goal={goal} />
        ) : (
          <div className="empty-hint peso-graph-empty">{t('weight.hint')}</div>
        )}

        <div className="peso-bar">
          {adding ? (
            <div className="peso-add-slide">
              <div className="peso-input-row peso-input-row--bar">
                <input
                  className="peso-date"
                  type="date"
                  value={entryDate}
                  max={todayISO()}
                  onChange={(e) => setEntryDate(e.target.value || todayISO())}
                  aria-label="fecha"
                />
                <input
                  className="cards-field-input peso-input"
                  type="number" inputMode="decimal" step="0.1" min="0" autoFocus
                  value={draft}
                  placeholder={unit}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                />
                <button className="cards-primary-btn peso-save" onClick={submit} disabled={!draft.trim()}>
                  {t('body.save')}
                </button>
                <button className="peso-add-close" onClick={() => { setAdding(false); setDraft(''); }} aria-label={t('cards.close')}>×</button>
              </div>
            </div>
          ) : (
            <>
              {log.length > 0 && (
                <button className="peso-history-toggle" onClick={() => setHistOpen((o) => !o)} aria-expanded={histOpen}>
                  <span className="peso-history-title">{t('body.history')}</span>
                  <span className="peso-history-count">{log.length}</span>
                  <span className={`peso-history-caret ${histOpen ? 'open' : ''}`} aria-hidden="true">›</span>
                </button>
              )}
              <button className="peso-anadir-btn" onClick={() => setAdding(true)} aria-label={t('weight.add')}>
                <span className="peso-anadir-plus">+</span>
              </button>
            </>
          )}
        </div>

        {!adding && histOpen && log.length > 0 && (
          <ul className="peso-history">
            {history.map((e) => (
              <li key={e.id} className="peso-entry">
                <span className="peso-entry-w">{e.weight} {unit}</span>
                <span className="peso-entry-date">{fmtDate(e.date)}</span>
                <button className="peso-entry-del" onClick={() => remove(e.id)} aria-label={t('body.delete')}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SubPage>
  );
}
