import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a, b) => {
  const d1 = new Date(a + 'T00:00:00Z');
  const d2 = new Date(b + 'T00:00:00Z');
  return Math.floor((d2 - d1) / 86400000);
};

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
};

const COLOR = {
  good: '#7fc79b',
  bad:  '#c97777',
};

function HabitRing({ days, target, kind }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, days / Math.max(1, target)));
  const offset = c * (1 - pct);
  return (
    <svg className="habit-ring" viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
      <circle
        cx="28" cy="28" r={r}
        stroke={COLOR[kind]} strokeWidth="4" fill="none"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 0.4s' }}
      />
      <text x="28" y="34" textAnchor="middle" fill="currentColor" fontFamily="Cinzel, serif" fontSize="16" fontWeight="700">
        {days}
      </text>
    </svg>
  );
}

function HabitRow({ habit, onPatch, onRemove, t }) {
  const passed = Math.max(0, daysBetween(habit.started_at, todayIso()));
  const kind = habit.kind ?? 'good';
  const isActive = habit.status === 'active';
  return (
    <li className={`habit habit-${kind} ${habit.status}`}>
      <HabitRing days={passed} target={habit.target_days} kind={kind} />
      <div className="habit-body">
        <div className="habit-head">
          <span className="habit-since">{t('asceza.from')} {formatDate(habit.started_at)}</span>
          <span className="habit-target">→ {habit.target_days} {t('asceza.daysShort')}</span>
        </div>
        <span className="habit-title">{habit.title}</span>
        {(habit.status === 'done' || habit.status === 'broken') && (
          <div className="habit-meta">
            {habit.status === 'done'   && t('asceza.done')}
            {habit.status === 'broken' && t('asceza.broken')}
          </div>
        )}
      </div>
      <div className="habit-actions">
        {isActive && <button onClick={() => onPatch({ status: 'done' })} title={t('asceza.complete')}>✓</button>}
        {isActive && <button className="break" onClick={() => onPatch({ status: 'broken' })} title={t('asceza.break')}>⚠</button>}
        <button className="remove" onClick={onRemove}>✕</button>
      </div>
    </li>
  );
}

export default function AscesesSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const asceses = profile.asceses ?? [];

  const [title, setTitle] = useState('');
  const [targetDays, setTargetDays] = useState(30);
  const [kind, setKind] = useState('good');
  const [addOpen, setAddOpen] = useState(false);

  const setAsceses = (next) => update({ asceses: next });

  const add = () => {
    const titleTrim = title.trim();
    const days = Math.max(1, parseInt(targetDays) || 1);
    if (!titleTrim) return;
    setAsceses([...asceses, {
      id: newId(),
      title: titleTrim,
      target_days: days,
      started_at: todayIso(),
      status: 'active',
      kind,
    }]);
    setTitle('');
    setTargetDays(30);
    setAddOpen(false);
  };

  const patch = (id, p) =>
    setAsceses(asceses.map((a) => (a.id === id ? { ...a, ...p } : a)));

  const remove = (id) => setAsceses(asceses.filter((a) => a.id !== id));

  const goodList = asceses.filter((a) => (a.kind ?? 'good') === 'good');
  const badList  = asceses.filter((a) => a.kind === 'bad');

  return (
    <>
      <div className="add-habit">
        <div className="habit-kind-toggle">
          <button
            className={`habit-kind-btn good ${kind === 'good' ? 'active' : ''}`}
            onClick={() => { setKind('good'); setAddOpen(false); setTitle(''); }}
          >{t('habit.good')}</button>
          <button
            className={`habit-kind-btn bad ${kind === 'bad' ? 'active' : ''}`}
            onClick={() => { setKind('bad'); setAddOpen(false); setTitle(''); }}
          >{t('habit.bad')}</button>
        </div>
        <div className={`add-asceza-inline ${addOpen ? 'open' : ''}`}>
          <button
            type="button"
            className="habit-add-toggle"
            onClick={() => setAddOpen((o) => !o)}
            aria-expanded={addOpen}
            aria-label={t('asceza.new')}
          >+</button>
          <div className="habit-add-slot">
            <input
              className="goal-input"
              placeholder={t('asceza.new')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
                if (e.key === 'Escape') { setAddOpen(false); setTitle(''); }
              }}
              maxLength={64}
              ref={(el) => { if (addOpen && el && document.activeElement !== el) el.focus(); }}
              tabIndex={addOpen ? 0 : -1}
            />
            <input
              type="number"
              min="1"
              className="days-input"
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
              aria-label={t('asceza.daysLabel')}
              tabIndex={addOpen ? 0 : -1}
            />
            <span className="days-label">{t('asceza.daysShort')}</span>
            <button
              className="add-btn"
              onClick={add}
              disabled={!title.trim()}
              tabIndex={addOpen ? 0 : -1}
            >✓</button>
          </div>
        </div>
      </div>

      {asceses.length === 0 && <div className="empty">—</div>}

      {kind === 'good' && goodList.length > 0 && (
        <ul className="habits">
          {goodList.map((a) => (
            <HabitRow key={a.id} habit={a} onPatch={(p) => patch(a.id, p)} onRemove={() => remove(a.id)} t={t} />
          ))}
        </ul>
      )}

      {kind === 'bad' && badList.length > 0 && (
        <ul className="habits">
          {badList.map((a) => (
            <HabitRow key={a.id} habit={a} onPatch={(p) => patch(a.id, p)} onRemove={() => remove(a.id)} t={t} />
          ))}
        </ul>
      )}
    </>
  );
}
