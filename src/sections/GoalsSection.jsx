import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const DIFFICULTIES = [
  { id: 'easy',   labelKey: 'goal.easy' },
  { id: 'medium', labelKey: 'goal.medium' },
  { id: 'hard',   labelKey: 'goal.hard' },
];

export default function GoalsSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const goals = profile.goals ?? [];
  const newIdRef = useRef(null);
  const [difficulty, setDifficulty] = useState('easy');

  const patchGoal = (id, p) =>
    update((curr) => ({
      goals: (curr.goals ?? []).map((g) => (g.id === id ? { ...g, ...p } : g)),
    }));

  const remove = (id) =>
    update((curr) => ({ goals: (curr.goals ?? []).filter((g) => g.id !== id) }));

  const add = () => {
    const id = newId();
    newIdRef.current = id;
    update((curr) => ({
      goals: [
        ...(curr.goals ?? []),
        { id, title: '', deadline: null, done: false, difficulty, created_at: new Date().toISOString() },
      ],
    }));
  };

  const visible = goals.filter((g) => (g.difficulty ?? 'easy') === difficulty);

  return (
    <>
      <div className="goal-diff-toggle">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            className={`goal-diff-btn ${d.id} ${difficulty === d.id ? 'active' : ''}`}
            onClick={() => setDifficulty(d.id)}
          >{t(d.labelKey)}</button>
        ))}
      </div>
      <ul className="goal-list">
        {visible.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            autoFocus={newIdRef.current === g.id}
            onPatch={(p) => patchGoal(g.id, p)}
            onRemove={() => remove(g.id)}
          />
        ))}
      </ul>
      <button className="add-row" onClick={add}>{t('goal.add')}</button>
    </>
  );
}

function GoalRow({ goal, autoFocus, onPatch, onRemove }) {
  const { t } = useLang();
  const inputRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const openDate = () => {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };

  const progress = computeProgress(goal);
  const MIN_VISIBLE = 4;
  const displayPct = progress
    ? Math.max(MIN_VISIBLE, Math.min(100, progress.ratio * 100))
    : 0;

  return (
    <li className={`goal-row ${goal.done ? 'done' : ''}`}>
      <div className="goal-row-main">
        <button
          className={`checkbox ${goal.done ? 'checked' : ''}`}
          onClick={() => onPatch({ done: !goal.done })}
        >
          {goal.done ? '✓' : ''}
        </button>
        <input
          ref={inputRef}
          className="goal-title-input"
          value={goal.title}
          placeholder={t('goal.placeholder')}
          onChange={(e) => onPatch({ title: e.target.value })}
          maxLength={64}
        />
        <button className="icon-btn" onClick={openDate} title={t('goal.deadline')}>
          {goal.deadline ? formatDate(goal.deadline) : '📅'}
        </button>
        <input
          ref={dateRef}
          type="date"
          className="hidden-date"
          value={goal.deadline ?? ''}
          onChange={(e) => onPatch({ deadline: e.target.value || null })}
        />
        <button className="icon-btn remove" onClick={onRemove} title={t('goal.remove')}>✕</button>
      </div>
      {progress && (
        <div
          className={`goal-progress ${progress.overdue ? 'overdue' : ''}`}
          title={t('goal.elapsed', { n: Math.round(progress.ratio * 100) })}
        >
          <div
            className="goal-progress-fill"
            style={{ width: `${displayPct}%` }}
          />
        </div>
      )}
    </li>
  );
}

function computeProgress(goal) {
  if (!goal.deadline || !goal.created_at) return null;
  const start = new Date(goal.created_at).getTime();
  const end = new Date(goal.deadline + 'T23:59:59').getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const now = Date.now();
  const ratio = (now - start) / (end - start);
  return { ratio: Math.max(0, ratio), overdue: now > end };
}

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
};
