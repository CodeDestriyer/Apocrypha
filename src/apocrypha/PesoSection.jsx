import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import { chartGeom } from './weightChart.jsx';

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
  const latest = log[0] ?? null;

  const [draft, setDraft] = useState('');
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const setLog = (updater) =>
    update((curr) => ({ weight_log: updater(Array.isArray(curr.weight_log) ? curr.weight_log : []) }));

  const submit = () => {
    const weight = parseWeight(draft);
    if (weight == null) return;
    const entry = { id: newId(), weight, date: todayISO(), created_at: new Date().toISOString() };
    setLog((l) => [entry, ...l]);
    setDraft('');
  };
  const remove = (id) => setLog((l) => l.filter((e) => e.id !== id));

  const openGoal = () => { setGoalDraft(goal != null ? String(goal) : ''); setGoalEditing(true); };
  const saveGoal = () => { update({ weight_goal: parseWeight(goalDraft) }); setGoalEditing(false); };
  const clearGoal = () => { update({ weight_goal: null }); setGoalEditing(false); };

  const remaining = goal != null && latest ? Math.round((latest.weight - goal) * 10) / 10 : null;
  const unit = t('body.unit');

  const g = chartGeom(log, { padT: 10, padB: 8 });
  const goalY = g && goal != null
    ? Math.max(g.yAt(g.yMax), Math.min(g.yAt(g.yMin), g.yAt(goal)))
    : null;

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
          <button className="peso-goal-row" onClick={openGoal}>
            <span className="peso-goal-label">{t('body.goal')}</span>
            <span className="peso-goal-value">{goal} {unit}</span>
            {remaining != null && (
              <span className="peso-goal-remaining">
                {remaining === 0 ? t('body.reached') : t('body.toGo', { n: Math.abs(remaining) })}
              </span>
            )}
          </button>
        ) : (
          <button className="peso-goal-add" onClick={openGoal}>+ {t('body.addGoal')}</button>
        )}

        <div className="peso-graph">
          {g ? (
            <>
              <svg className="peso-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line className="peso-grid" x1="0" y1="25" x2="100" y2="25" />
                <line className="peso-grid" x1="0" y1="50" x2="100" y2="50" />
                <line className="peso-grid" x1="0" y1="75" x2="100" y2="75" />
                {goalY != null && <line className="peso-goal-line" x1="0" y1={goalY.toFixed(2)} x2="100" y2={goalY.toFixed(2)} />}
                {g.area && <path className="peso-area" d={g.area} />}
                <path className="peso-line" d={g.line} />
              </svg>
              <span className="peso-graph-max">{g.maxW} {unit}</span>
              <span className="peso-graph-min">{g.minW} {unit}</span>
            </>
          ) : (
            <div className="empty-hint peso-graph-empty">{t('weight.hint')}</div>
          )}
        </div>

        <div className="peso-input-row">
          <input
            className="cards-field-input peso-input"
            type="number" inputMode="decimal" step="0.1" min="0"
            value={draft}
            placeholder={t('body.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <span className="peso-input-unit">{unit}</span>
          <button className="cards-primary-btn peso-save" onClick={submit} disabled={!draft.trim()}>
            {t('body.save')}
          </button>
        </div>

        {log.length > 0 && (
          <>
            <div className="peso-history-title">{t('body.history')}</div>
            <ul className="peso-history">
              {log.map((e) => (
                <li key={e.id} className="peso-entry">
                  <span className="peso-entry-w">{e.weight} {unit}</span>
                  <span className="peso-entry-date">{fmtDate(e.date)}</span>
                  <button className="peso-entry-del" onClick={() => remove(e.id)} aria-label={t('body.delete')}>×</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </SubPage>
  );
}
