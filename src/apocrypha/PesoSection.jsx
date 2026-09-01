import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import WeightRuler from './WeightRuler.jsx';
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
// Plausible human body-weight range (kg). Guards against typos like a missing
// decimal point (92.9 → 929) that would otherwise blow up the chart's Y axis.
const MIN_WEIGHT = 2;
const MAX_WEIGHT = 400;
const parseWeight = (raw) => {
  const n = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < MIN_WEIGHT || n > MAX_WEIGHT) return null;
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

  // Which week is shown: 0 = current, -1 = previous, +1 = next (capped at 0,
  // so you can never scroll into the future). Swipe or the ‹ › arrows change it.
  const [weekOffset, setWeekOffset] = useState(0);
  const goPrevWeek = () => setWeekOffset((o) => o - 1);
  const goNextWeek = () => setWeekOffset((o) => Math.min(0, o + 1));

  // Shown week (Sun→Sat): one representative weight per day (the last
  // measurement that day), each day's delta vs. the previous logged
  // measurement, and the week-over-week total (last weigh-in before this
  // week vs. the last weigh-in this week).
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
    start.setDate(start.getDate() + weekOffset * 7);
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
    // Week-over-week total: the last logged weight *before* this week vs. the
    // last logged weight this week (positive = lost). This counts the
    // carry-over from the previous weigh-in, so a single logged day this week
    // is enough — unlike the old first−last-within-the-week total. Falls back
    // to null (shown as "—") when there's no earlier weigh-in to compare to.
    const prevRef = prevWeight(isoLocal(start));
    const thisFinal = logged.length ? logged[logged.length - 1].weight : null;
    const total = prevRef != null && thisFinal != null
      ? prevRef - thisFinal
      : null;
    return { days, total, count: logged.length };
  }, [log, weekOffset]);

  const [draft, setDraft] = useState(null); // numeric weight being dialed on the ruler
  const [entryDate, setEntryDate] = useState(todayISO()); // calendar; defaults to today
  const [adding, setAdding] = useState(false);            // "+" reveals the ruler
  const [showHistory, setShowHistory] = useState(false);  // full history sub-screen (from settings)
  const [goalDraft, setGoalDraft] = useState('');         // plain goal input (string)
  const [menuOpen, setMenuOpen] = useState(false);        // weight settings gear (header)
  const menuRef = useRef(null);
  // Square "+" button: sized to the weekly widget's height so it reads square.
  const weekRef = useRef(null);
  const [sqSize, setSqSize] = useState(0);
  // Horizontal swap between the weekly widget and the ruler in the bottom slot.
  const weekPanelRef = useRef(null);
  const rulerPanelRef = useRef(null);
  const [swapH, setSwapH] = useState(0);

  // Horizontal swipe on the week block → change week (right = older, left = newer).
  const weekTouch = useRef({ x: 0, y: 0, active: false, locked: null });
  const onWeekTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    weekTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true, locked: null };
  };
  const onWeekTouchMove = (e) => {
    const tc = weekTouch.current;
    if (!tc.active || tc.locked != null) return;
    const dx = e.touches[0].clientX - tc.x;
    const dy = e.touches[0].clientY - tc.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    tc.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  };
  const onWeekTouchEnd = (e) => {
    const tc = weekTouch.current;
    if (!tc.active) return;
    tc.active = false;
    if (tc.locked !== 'x') return;
    const dx = (e.changedTouches?.[0]?.clientX ?? tc.x) - tc.x;
    const T = 40;
    if (dx > T) goPrevWeek();
    else if (dx < -T) goNextWeek();
  };
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  // Track the weekly widget's height so the adjacent "+" can be a true square.
  useLayoutEffect(() => {
    const el = weekRef.current;
    if (!el) return;
    setSqSize(el.offsetHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSqSize(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [log.length, showHistory]);

  // The bottom slot's height follows whichever panel is showing (week vs
  // ruler), so the horizontal swap doesn't leave dead space or clip.
  useLayoutEffect(() => {
    const wk = weekPanelRef.current, rl = rulerPanelRef.current;
    if (!wk || !rl) return;
    const apply = () => setSwapH(adding ? rl.offsetHeight : wk.offsetHeight);
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(apply);
    ro.observe(wk); ro.observe(rl);
    return () => ro.disconnect();
  }, [adding, log.length, showHistory]);

  const setLog = (updater) =>
    update((curr) => ({ weight_log: updater(Array.isArray(curr.weight_log) ? curr.weight_log : []) }));

  const submit = () => {
    const weight = parseWeight(draft);
    if (weight == null) return;
    const date = entryDate || todayISO();
    const entry = { id: newId(), weight, date, created_at: new Date().toISOString() };
    setLog((l) => [entry, ...l]);
    // Keep draft & the chosen date so backfilling a run of past days stays quick.
  };
  const remove = (id) => setLog((l) => l.filter((e) => e.id !== id));

  const rulerStart = (latest && latest.weight) || goal || 70;
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
          <button
            className="peso-gear-history"
            onClick={() => { setMenuOpen(false); setShowHistory(true); }}
          >
            <span className="peso-history-title">{t('body.history')}</span>
            <span className="peso-history-count">{log.length}</span>
            <span className="peso-history-caret" aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </div>
  );

  // Full history lives on its own screen, opened from the settings gear.
  if (showHistory) {
    return (
      <SubPage title={t('body.history')} onBack={() => setShowHistory(false)}>
        {history.length === 0 ? (
          <p className="peso-current-empty">{t('weight.weekNoData')}</p>
        ) : (
          <ul className="peso-history peso-history--page">
            {history.map((e) => (
              <li key={e.id} className="peso-entry">
                <span className="peso-entry-w">{e.weight} {unit}</span>
                <span className="peso-entry-date">{fmtDate(e.date)}</span>
                <button className="peso-entry-del" onClick={() => remove(e.id)} aria-label={t('body.delete')}>×</button>
              </li>
            ))}
          </ul>
        )}
      </SubPage>
    );
  }

  // The add-weight ruler. Kept mounted so it can slide in/out of the bottom
  // slot (swapping horizontally with the weekly widget) when "+" is pressed.
  const addBlock = (
    <div className="peso-add-slide peso-add-slide--ruler">
      <WeightRuler value={draft} onChange={setDraft} unit={unit} defaultValue={rulerStart} />
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
        <button className="cards-primary-btn peso-save" onClick={submit} disabled={parseWeight(draft) == null}>
          {t('body.save')}
        </button>
        <button className="peso-add-close" onClick={() => { setAdding(false); setDraft(null); }} aria-label={t('cards.close')}>×</button>
      </div>
    </div>
  );

  const weekWidget = (() => {
    const total = week.total != null ? Math.round(week.total * 10) / 10 : null;
    const dir = total == null || total === 0 ? 'flat' : total > 0 ? 'down' : 'up';
    const weekLabel = weekOffset === 0
      ? t('weight.week')
      : `${fmtDate(week.days[0].iso)} – ${fmtDate(week.days[6].iso)}`;
    return (
      <div
        ref={weekRef}
        className="peso-week"
        onTouchStart={onWeekTouchStart}
        onTouchMove={onWeekTouchMove}
        onTouchEnd={onWeekTouchEnd}
        onTouchCancel={onWeekTouchEnd}
      >
        <div className="peso-week-head">
          <div className="peso-week-nav-group">
            <button className="peso-week-nav" onClick={goPrevWeek} aria-label={t('weight.prevWeek')}>‹</button>
            <span className="peso-week-title">{weekLabel}</span>
            <button className="peso-week-nav" onClick={goNextWeek} disabled={weekOffset === 0} aria-label={t('weight.nextWeek')}>›</button>
          </div>
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
  })();

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

        {log.length > 0 ? (
          // Bottom slot: the weekly widget and the ruler swap horizontally.
          // Tapping "+" slides the week out to the left and the ruler in from
          // the right; the ruler's "×" slides it back.
          <div className="peso-swap" style={swapH ? { height: swapH } : undefined}>
            <div
              ref={weekPanelRef}
              className={`peso-swap-panel peso-swap-week${adding ? ' is-hidden-left' : ''}`}
              aria-hidden={adding}
            >
              <div className="peso-bottom">
                {weekWidget}
                <button
                  className="peso-anadir-btn peso-anadir-btn--square"
                  style={sqSize ? { width: sqSize, height: sqSize, flexBasis: sqSize } : undefined}
                  onClick={() => { setDraft(rulerStart); setAdding(true); }}
                  aria-label={t('weight.add')}
                  aria-expanded={adding}
                >
                  <span className="peso-anadir-plus">+</span>
                </button>
              </div>
            </div>
            <div
              ref={rulerPanelRef}
              className={`peso-swap-panel peso-swap-ruler${adding ? ' is-shown' : ''}`}
              aria-hidden={!adding}
            >
              {addBlock}
            </div>
          </div>
        ) : adding ? (
          addBlock
        ) : (
          <button
            className="peso-anadir-btn peso-anadir-btn--wide"
            onClick={() => { setDraft(rulerStart); setAdding(true); }}
            aria-label={t('weight.add')}
          >
            <span className="peso-anadir-plus">+</span>
            <span className="peso-anadir-text">{t('weight.add')}</span>
          </button>
        )}
      </div>
    </SubPage>
  );
}
