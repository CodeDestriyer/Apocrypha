import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';

const PERIODS = [
  { id: 'daily',   label: 'Ежедневно'  },
  { id: 'weekly',  label: 'Еженедельно' },
  { id: 'monthly', label: 'Ежемесячно' },
  { id: 'once',    label: 'Разово'     },
];

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
};

const isOverdue = (g) => {
  if (!g.deadline || g.done) return false;
  return g.deadline < new Date().toISOString().slice(0, 10);
};

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

export default function GoalsSection() {
  const { profile, update } = useProfile();
  const goals = profile.goals ?? [];

  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('daily');
  const [deadline, setDeadline] = useState('');

  const setGoals = (next) => update({ goals: next });

  const addGoal = () => {
    const t = title.trim();
    if (!t) return;
    setGoals([...goals, { id: newId(), title: t, period, done: false, deadline: deadline || null }]);
    setTitle('');
    setDeadline('');
  };
  const toggle = (id) => setGoals(goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  const remove = (id) => setGoals(goals.filter((g) => g.id !== id));

  const grouped = PERIODS
    .map((p) => ({ period: p, items: goals.filter((g) => g.period === p.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div className="add-goal">
        <input
          className="goal-input"
          placeholder="Новая цель"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGoal()}
          maxLength={64}
        />
        <div className="add-goal-row">
          <select className="period-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input type="date" className="date-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button className="add-btn" onClick={addGoal}>+</button>
        </div>
      </div>

      {grouped.length === 0 && <div className="empty">—</div>}

      {grouped.map(({ period: p, items }) => (
        <div key={p.id} className="goal-group">
          <div className="goal-group-title">{p.label}</div>
          <ul className="goals">
            {items.map((g) => (
              <li key={g.id} className={`goal ${g.done ? 'done' : ''}`}>
                <button className={`checkbox ${g.done ? 'checked' : ''}`} onClick={() => toggle(g.id)}>
                  {g.done ? '✓' : ''}
                </button>
                <div className="goal-body">
                  <span className="goal-title">{g.title}</span>
                  {g.deadline && (
                    <span className={`goal-deadline ${isOverdue(g) ? 'overdue' : ''}`}>
                      до {formatDate(g.deadline)}
                    </span>
                  )}
                </div>
                <button className="remove" onClick={() => remove(g.id)}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
