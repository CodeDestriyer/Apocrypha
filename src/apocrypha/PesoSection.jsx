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
  const [metaArmed, setMetaArmed] = useState(false);      // Meta needs a 2nd tap to edit
  const armTimer = useRef(null);
  useEffect(() => () => clearTimeout(armTimer.current), []);

  const onMetaClick = () => {
    if (metaArmed) { clearTimeout(armTimer.current); setMetaArmed(false); openGoal(); }
    else { setMetaArmed(true); clearTimeout(armTimer.current); armTimer.current = setTimeout(() => setMetaArmed(false), 2600); }
  };

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

  const remaining = goal != null && latest ? Math.round((latest.weight - goal) * 10) / 10 : null;
  const unit = t('body.unit');

  return (
    <SubPage title={t('weight.title')} onBack={rootOnBack}>
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

        {goalEditing ? (
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
            {goal != null && (
              <button className="cards-secondary-btn peso-goal-clear" onClick={clearGoal}>{t('body.delete')}</button>
            )}
          </div>
        ) : goal != null ? (
          <button className={`peso-goal-row ${metaArmed ? 'armed' : ''}`} onClick={onMetaClick}>
            <span className="peso-goal-label">{t('body.goal')}</span>
            <span className="peso-goal-value">{goal} {unit}</span>
            {metaArmed ? (
              <span className="peso-goal-hint">{t('weight.tapEdit')}</span>
            ) : remaining != null && (
              <span className="peso-goal-remaining">
                {remaining === 0 ? t('body.reached') : t('body.toGo', { n: Math.abs(remaining) })}
              </span>
            )}
          </button>
        ) : (
          <button className="peso-goal-add" onClick={openGoal}>+ {t('body.addGoal')}</button>
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
