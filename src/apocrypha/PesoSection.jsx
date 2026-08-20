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

// Local YYYY-MM-DD (avoids the UTC shift that toISOString would cause).
const isoLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
// Sunday-start week containing `d`.
const startOfWeek = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dt.getDay()); // getDay(): 0 = Sunday
  return dt;
};
// Signed 0.1-kg delta, or null.
const fmtDelta = (n) => {
  if (n == null) return null;
  const r = Math.round(n * 10) / 10;
  if (r === 0) return '0';
  return (r > 0 ? '+' : '−') + Math.abs(r);
};
const WEEK_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // Dom..Sáb

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

  // Current week (Sun→Sat): one representative weight per day (the last
  // measurement that day), each day's delta vs. the previous logged
  // measurement, and the week total (first − last logged this week).
  const week = useMemo(() => {
    // Last measurement of each date, and dates in ascending order.
    const asc = [...log].sort((a, b) =>
      (a.date || '').localeCompare(b.date || '') ||
      (a.created_at || '').localeCompare(b.created_at || '')
    );
    const byDay = new Map();
    for (const e of asc) byDay.set(e.date, e.weight);
    const dates = [...byDay.keys()].sort();
    const prevWeight = (iso) => {
      let res = null;
      for (const d of dates) { if (d < iso) res = byDay.get(d); else break; }
      return res;
    };

    const start = startOfWeek(new Date());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = isoLocal(d);
      const weight = byDay.has(iso) ? byDay.get(iso) : null;
      const prev = weight != null ? prevWeight(iso) : null;
      days.push({
        iso,
        letter: WEEK_LETTERS[i],
        weight,
        delta: weight != null && prev != null ? weight - prev : null,
        isToday: iso === todayISO(),
      });
    }
    const logged = days.filter((d) => d.weight != null);
    // Total per request: first − last logged this week (positive = lost).
    const total = logged.length >= 2
      ? logged[0].weight - logged[logged.length - 1].weight
      : null;
    return { days, total, count: logged.length };
  }, [log]);

  const [draft, setDraft] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO()); // calendar; defaults to today
  const [adding, setAdding] = useState(false);            // "+" reveals the input
  const [histOpen, setHistOpen] = useState(false);        // history is collapsed by default
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

  const toggleMenu = () => { if (!menuOpen) setGoalDraft(goal != null ? String(goal) : ''); setMenuOpen((o) => !o); };
  const saveGoal = () => { update({ weight_goal: parseWeight(goalDraft) }); setMenuOpen(false); };
  const clearGoal = () => { update({ weight_goal: null }); setMenuOpen(false); };

  const unit = t('body.unit');

  const headerRight = (
    <div className="cards-gear" ref={menuRef}>
      <button className="cards-gear-btn" onClick={toggleMenu} aria-label={t('body.goal')}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d={GEAR_PATH}/>
        </svg>
      </button>
      {menuOpen && (
        <div className="cards-gear-menu cards-gear-menu--right peso-gear-menu">
          <label className="cards-field-label">{t('body.goal')}</label>
          <div className="peso-gear-row">
            <input
              className="cards-field-input peso-gear-input"
              type="number" inputMode="decimal" step="0.1" min="0" autoFocus
              value={goalDraft}
              placeholder={t('body.goalPlaceholder')}
              onChange={(e) => setGoalDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setMenuOpen(false); }}
            />
            <span className="peso-input-unit">{unit}</span>
          </div>
          <div className="peso-gear-actions">
            {goal != null && (
              <button className="cards-secondary-btn peso-gear-clear" onClick={clearGoal}>{t('body.delete')}</button>
            )}
            <button className="cards-primary-btn peso-gear-save" onClick={saveGoal}>{t('body.save')}</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <SubPage title={t('weight.title')} onBack={rootOnBack} headerRight={headerRight}>
      <div className="peso">
        {latest && (
          <div className="peso-current">
            <span className="peso-current-value">{latest.weight}</span>
            <span className="peso-current-unit">{unit}</span>
            <span className="peso-current-date">{fmtDate(latest.date)}</span>
          </div>
        )}

        {log.length > 0 && (
          <WeightGraph log={log} goal={goal} />
        )}

        <div className="peso-bar">
          {adding ? (
            <div className="peso-add-slide">
              <div className="peso-input-row peso-input-row--bar">
                <label
                  className="peso-datechip"
                  onClick={(e) => { const inp = e.currentTarget.querySelector('input'); try { inp?.showPicker?.(); } catch {} }}
                >
                  <svg className="peso-datechip-ico" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4.5" width="18" height="16.5" rx="2"/>
                    <path d="M3 9h18M8 2.5v4M16 2.5v4"/>
                  </svg>
                  <span className="peso-datechip-text">{entryDate === todayISO() ? t('weight.today') : fmtDate(entryDate)}</span>
                  <input
                    className="peso-datechip-input"
                    type="date"
                    value={entryDate}
                    max={todayISO()}
                    onChange={(e) => setEntryDate(e.target.value || todayISO())}
                    aria-label="fecha"
                  />
                </label>
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

        {log.length > 0 && (() => {
          const total = week.total != null ? Math.round(week.total * 10) / 10 : null;
          const dir = total == null || total === 0 ? 'flat' : total > 0 ? 'down' : 'up';
          return (
            <div className="peso-week">
              <div className="peso-week-head">
                <span className="peso-week-title">{t('weight.week')}</span>
                {total == null ? (
                  <span className="peso-week-total peso-week-total--flat">—</span>
                ) : (
                  <span className={`peso-week-total peso-week-total--${dir}`}>
                    {dir !== 'flat' && (
                      <span className="peso-week-arrow" aria-hidden="true">{dir === 'down' ? '▼' : '▲'}</span>
                    )}
                    {dir === 'flat' ? t('weight.noChange') : `${Math.abs(total)} ${unit}`}
                  </span>
                )}
              </div>
              <div className="peso-week-days">
                {week.days.map((d) => {
                  const dd = fmtDelta(d.delta);
                  const cls = d.delta == null || d.delta === 0 ? 'flat' : d.delta < 0 ? 'down' : 'up';
                  return (
                    <div
                      key={d.iso}
                      className={`peso-week-day${d.weight != null ? ' has' : ''}${d.isToday ? ' today' : ''}`}
                    >
                      <span className="peso-week-dow">{d.letter}</span>
                      {d.weight != null && dd != null ? (
                        <span className={`peso-week-delta peso-week-delta--${cls}`}>{dd}</span>
                      ) : d.weight != null ? (
                        <span className="peso-week-dot" aria-hidden="true" />
                      ) : (
                        <span className="peso-week-delta peso-week-delta--empty" aria-hidden="true">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </SubPage>
  );
}
