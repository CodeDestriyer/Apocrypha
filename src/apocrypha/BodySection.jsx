import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const parseWeight = (raw) => {
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
};

// Cuerpo — the body tab. Deliberately minimal: type a weight, save it. Each
// save prepends an entry to profile.weight_log (newest first); the latest is
// shown big up top. A single target weight (profile.weight_goal) can be set,
// with the remaining delta from the latest entry shown next to it.
export default function BodySection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const log = Array.isArray(profile.weight_log) ? profile.weight_log : [];
  const goal = typeof profile.weight_goal === 'number' ? profile.weight_goal : null;
  const [draft, setDraft] = useState('');
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const latest = log[0] ?? null;

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
  const saveGoal = () => {
    const v = parseWeight(goalDraft);
    update({ weight_goal: v });
    setGoalEditing(false);
  };
  const clearGoal = () => { update({ weight_goal: null }); setGoalEditing(false); };

  // Remaining delta from the latest entry to the goal (rounded to 1 decimal).
  const remaining = goal != null && latest ? Math.round((latest.weight - goal) * 10) / 10 : null;

  return (
    <SubPage title={t('nav.body')} onBack={rootOnBack}>
      <div className="body-section">
        <div className="body-latest">
          {latest ? (
            <>
              <span className="body-latest-value">{latest.weight}</span>
              <span className="body-latest-unit">{t('body.unit')}</span>
              <span className="body-latest-date">{fmtDate(latest.date)}</span>
            </>
          ) : (
            <span className="body-latest-empty">{t('body.empty')}</span>
          )}
        </div>

        {goalEditing ? (
          <div className="body-goal-edit">
            <span className="body-goal-label">{t('body.goal')}</span>
            <input
              className="body-goal-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              autoFocus
              value={goalDraft}
              placeholder={t('body.goalPlaceholder')}
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setGoalEditing(false); }}
            />
            <span className="body-input-unit">{t('body.unit')}</span>
            <button className="body-goal-save" onClick={saveGoal}>✓</button>
            {goal != null && (
              <button className="body-goal-clear" onClick={clearGoal} aria-label={t('body.delete')}>×</button>
            )}
          </div>
        ) : goal != null ? (
          <button className="body-goal-row" onClick={openGoal}>
            <span className="body-goal-label">{t('body.goal')}</span>
            <span className="body-goal-value">{goal} {t('body.unit')}</span>
            {remaining != null && (
              <span className="body-goal-remaining">
                {remaining === 0
                  ? t('body.reached')
                  : t('body.toGo', { n: Math.abs(remaining) })}
              </span>
            )}
          </button>
        ) : (
          <button className="body-goal-add" onClick={openGoal}>
            + {t('body.addGoal')}
          </button>
        )}

        <div className="body-input-row">
          <input
            className="body-input"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={draft}
            placeholder={t('body.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <span className="body-input-unit">{t('body.unit')}</span>
          <button className="body-save-btn" onClick={submit} disabled={!draft.trim()}>
            {t('body.save')}
          </button>
        </div>

        {log.length > 0 && (
          <>
            <div className="body-history-title">{t('body.history')}</div>
            <ul className="body-history">
              {log.map((e) => (
                <li key={e.id} className="body-history-row">
                  <span className="body-history-weight">{e.weight} {t('body.unit')}</span>
                  <span className="body-history-date">{fmtDate(e.date)}</span>
                  <button
                    className="body-history-del"
                    onClick={() => remove(e.id)}
                    aria-label={t('body.delete')}
                  >×</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </SubPage>
  );
}
