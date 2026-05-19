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

export default function AscesesSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const asceses = profile.asceses ?? [];

  const [title, setTitle] = useState('');
  const [targetDays, setTargetDays] = useState(30);

  const setAsceses = (next) => update({ asceses: next });

  const add = () => {
    const t = title.trim();
    const days = Math.max(1, parseInt(targetDays) || 1);
    if (!t) return;
    setAsceses([...asceses, {
      id: newId(),
      title: t,
      target_days: days,
      started_at: todayIso(),
      status: 'active',
    }]);
    setTitle('');
    setTargetDays(30);
  };

  const setStatus = (id, status) =>
    setAsceses(asceses.map((a) => (a.id === id ? { ...a, status } : a)));

  const remove = (id) => setAsceses(asceses.filter((a) => a.id !== id));

  return (
    <>
      <div className="add-asceza-inline">
        <input
          className="goal-input"
          placeholder={t('asceza.new')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          maxLength={64}
        />
        <input
          type="number"
          min="1"
          className="days-input"
          value={targetDays}
          onChange={(e) => setTargetDays(e.target.value)}
          aria-label={t('asceza.daysLabel')}
        />
        <span className="days-label">{t('asceza.daysShort')}</span>
        <button className="add-btn" onClick={add}>+</button>
      </div>

      {asceses.length === 0 && <div className="empty">—</div>}

      <ul className="goals">
        {asceses.map((a) => {
          const passed = Math.max(0, daysBetween(a.started_at, todayIso()));
          const pct = Math.min(100, Math.round((passed / a.target_days) * 100));
          const isActive = a.status === 'active';
          return (
            <li key={a.id} className={`asceza ${a.status}`}>
              <div className="goal-body">
                <div className="asceza-head">
                  <span className="goal-title">{a.title}</span>
                  <span className="asceza-days">
                    {passed}/{a.target_days} {t('asceza.daysShort')}
                  </span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="asceza-meta">
                  {t('asceza.from')} {formatDate(a.started_at)}
                  {a.status === 'done'   && ' · ' + t('asceza.done')}
                  {a.status === 'broken' && ' · ' + t('asceza.broken')}
                </div>
              </div>
              <div className="asceza-actions">
                {isActive && <button onClick={() => setStatus(a.id, 'done')} title={t('asceza.complete')}>✓</button>}
                {isActive && <button className="break" onClick={() => setStatus(a.id, 'broken')} title={t('asceza.break')}>⚠</button>}
                <button className="remove" onClick={() => remove(a.id)}>✕</button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
