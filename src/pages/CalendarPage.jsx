import { useEffect, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const PLANS_KEY = 'lr.plans';
const LEGACY_KEY = 'lr.periods';

const TEMPLATES = [
  { id: 'dopamine', emoji: '🧠', name: 'Дофаминовый детокс', color: '#7fb8c7' },
];

const QUICK_DAYS = [7, 10, 21];
const COLORS = ['#7fb8c7', '#9bd1e5', '#c79b7f', '#a37fc7', '#c7b87f', '#7fc79b', '#c77f9b'];
const EMOJI_DEFAULT = '✦';

const WD_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WD_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WD_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const WD = { ru: WD_RU, en: WD_EN, es: WD_ES };

function readLegacyPlans() {
  try {
    const v = JSON.parse(localStorage.getItem(PLANS_KEY));
    if (Array.isArray(v)) return v;
  } catch {}
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (Array.isArray(legacy)) {
      return legacy.map((p) => ({
        id: p.id, name: p.name, emoji: p.emoji, color: p.color,
        start: p.start,
        end: ymd(addDays(new Date(p.start), (p.days ?? 1) - 1)),
      }));
    }
  } catch {}
  return null;
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  const x = new Date(y, m - 1, d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);
}

function buildMonthGrid(viewDate) {
  // 6 rows × 7 cols starting from Mon of the week containing day 1
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // Mon=0
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export default function CalendarPage() {
  const { profile, update } = useProfile();
  const { t, lang } = useLang();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const plans = Array.isArray(profile?.plans) ? profile.plans : [];
  const [selStart, setSelStart] = useState(null); // ymd string
  const [selEnd, setSelEnd] = useState(null);
  const [picking, setPicking] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(COLORS[0]);
  const [focusDay, setFocusDay] = useState(() => ymd(new Date()));
  const [quickGoal, setQuickGoal] = useState('');

  useEffect(() => {
    if (profile?.plans !== null && profile?.plans !== undefined) return;
    const legacy = readLegacyPlans();
    if (legacy && legacy.length) {
      update({ plans: legacy });
      try { localStorage.removeItem(PLANS_KEY); localStorage.removeItem(LEGACY_KEY); } catch {}
    }
  }, [profile?.plans]);

  const days = buildMonthGrid(viewDate);
  const todayKey = ymd(new Date());
  const viewMonth = viewDate.getMonth();

  const goals = (profile.goals ?? []).filter((g) => g.deadline);
  const goalsByDay = {};
  for (const g of goals) {
    const k = String(g.deadline).slice(0, 10);
    (goalsByDay[k] ||= []).push(g);
  }

  const updatePlans = (next) => update({ plans: next });

  const planOnDay = (plan, day) => {
    const s = parseYmd(plan.start);
    const e = parseYmd(plan.end);
    return day >= s && day <= e;
  };

  const onDayClick = (d) => {
    const k = ymd(d);
    setFocusDay(k);
    if (!selStart) { setSelStart(k); setSelEnd(null); return; }
    if (selStart && selEnd) { setSelStart(k); setSelEnd(null); return; }
    if (k === selStart) { setSelStart(null); return; }
    // Order: start <= end
    if (parseYmd(k) < parseYmd(selStart)) { setSelEnd(selStart); setSelStart(k); }
    else { setSelEnd(k); }
  };

  const shiftFocus = (delta) => setFocusDay((k) => ymd(addDays(parseYmd(k), delta)));
  const focusDate = parseYmd(focusDay);
  const focusPlans = plans.filter((p) => focusDate >= parseYmd(p.start) && focusDate <= parseYmd(p.end));
  const focusGoals = (profile.goals ?? []).filter((g) => String(g.deadline ?? '').slice(0, 10) === focusDay);
  const addQuickGoal = () => {
    const title = quickGoal.trim();
    if (!title) return;
    update((curr) => ({
      goals: [
        ...(curr.goals ?? []),
        { id: newId(), title, deadline: focusDay, done: false, created_at: new Date().toISOString() },
      ],
    }));
    setQuickGoal('');
  };
  const toggleGoal = (id) =>
    update((curr) => ({
      goals: (curr.goals ?? []).map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));

  const selRange = selStart && selEnd ? { start: selStart, end: selEnd } : null;
  const isSelected = (k) => k === selStart || k === selEnd;
  const isInRange = (d) => {
    if (!selRange) return false;
    const day = parseYmd(ymd(d));
    return day >= parseYmd(selRange.start) && day <= parseYmd(selRange.end);
  };

  const startPlanFrom = (tpl) => {
    if (!selRange) return;
    updatePlans([
      ...plans,
      { id: newId(), name: tpl.name, emoji: tpl.emoji, color: tpl.color, start: selRange.start, end: selRange.end },
    ]);
    setSelStart(null); setSelEnd(null); setPicking(false);
    setCustomOpen(false); setCustomName(''); setCustomColor(COLORS[0]);
  };
  const saveCustomPlan = () => {
    const n = customName.trim();
    if (!n || !selRange) return;
    startPlanFrom({ name: n, emoji: EMOJI_DEFAULT, color: customColor });
  };
  const endPlan = (id) => updatePlans(plans.filter((p) => p.id !== id));

  const wd = WD[lang] ?? WD_RU;
  const monthFmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
  const shortFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });

  return (
    <div className="cal-shell">
      <div className="card calendar-card">
        <div className="cal-week-nav">
          <button className="cal-nav-btn" onClick={() => {
            const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d);
          }}>‹</button>
          <span className="cal-week-label">{monthFmt.format(viewDate)}</span>
          <button className="cal-nav-btn" onClick={() => {
            const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d);
          }}>›</button>
        </div>

        <div className="cal-month-wd">
          {wd.map((w) => <span key={w}>{w}</span>)}
        </div>

        <div className="cal-month">
            {days.map((d, i) => {
          const k = ymd(d);
          const inMonth = d.getMonth() === viewMonth;
          const isToday = k === todayKey;
          const dayGoals = goalsByDay[k] ?? [];
          const activeOnDay = plans
            .map((p, idx) => ({ p, idx }))
            .filter(({ p }) => planOnDay(p, d));
          const sel = isSelected(k);
          const range = isInRange(d);
          const col = i % 7;
          return (
            <button
              key={k}
              className={`cal-cell ${inMonth ? '' : 'out'} ${isToday ? 'today' : ''} ${sel ? 'sel' : ''} ${range ? 'in-range' : ''}`}
              onClick={() => onDayClick(d)}
            >
              <span className="cal-cell-num">{d.getDate()}</span>
              {(activeOnDay.length > 0 || dayGoals.length > 0) && (
                <span className="cal-cell-dots">
                  {activeOnDay.slice(0, 3).map(({ p }) => (
                    <span key={p.id} className="cal-dot" style={{ background: p.color }} />
                  ))}
                  {activeOnDay.length > 3 && (
                    <span className="cal-dot-more">+{activeOnDay.length - 3}</span>
                  )}
                  {dayGoals.length > 0 && <span className="cal-dot cal-dot-goal" />}
                </span>
              )}
            </button>
          );
        })}
        </div>
      </div>

      <div className="card day-focus-card">
        <div className="day-focus-head">
            <div className="day-focus-date">
              <div className="day-focus-day">{focusDate.getDate()}</div>
              <div className="day-focus-meta">
                <div className="day-focus-weekday">
                  {new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(focusDate)}
                </div>
              <div className="day-focus-month">
                {new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(focusDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="day-focus-list">
          {focusPlans.length === 0 && focusGoals.length === 0 && (
            <div className="day-focus-empty">{t('cal.dayEmpty')}</div>
          )}
          {focusPlans.map((p) => {
            const dayNum = Math.floor((focusDate - parseYmd(p.start)) / 86400000) + 1;
            const total = Math.round((parseYmd(p.end) - parseYmd(p.start)) / 86400000) + 1;
            return (
              <div key={p.id} className="day-focus-row" style={{ borderLeftColor: p.color }}>
                <span className="day-focus-row-name">
                  <span className="period-emoji">{p.emoji}</span>
                  {p.name}
                </span>
                <span className="day-focus-row-meta">{dayNum}/{total}</span>
              </div>
            );
          })}
          {focusGoals.map((g) => (
            <div key={g.id} className={`day-focus-row goal ${g.done ? 'done' : ''}`}>
              <button
                className={`checkbox ${g.done ? 'checked' : ''}`}
                onClick={() => toggleGoal(g.id)}
                aria-label="toggle"
              >{g.done ? '✓' : ''}</button>
              <span className="day-focus-row-name">{g.title || t('goal.untitled')}</span>
            </div>
          ))}
        </div>

        <div className="day-focus-add">
          <input
            className="field-input"
            placeholder={t('cal.addGoalPlaceholder')}
            value={quickGoal}
            onChange={(e) => setQuickGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuickGoal()}
            maxLength={80}
          />
          <button className="cal-nav-btn add" onClick={addQuickGoal} disabled={!quickGoal.trim()} aria-label="add">+</button>
        </div>
      </div>

      {selStart && !selEnd && (
        <>
          <div className="cal-hint">{t('cal.selectRange')}</div>
          <div className="cal-quick-days">
            {QUICK_DAYS.map((n) => (
              <button
                key={n}
                className="cal-quick-day"
                onClick={() => setSelEnd(ymd(addDays(parseYmd(selStart), n - 1)))}
              >
                {n} {t('cal.daysShort')}
              </button>
            ))}
          </div>
        </>
      )}

      {selRange && !picking && (
        <button className="cal-create-btn" onClick={() => setPicking(true)}>
          {t('cal.createPlan')}: {shortFmt.format(parseYmd(selRange.start))} — {shortFmt.format(parseYmd(selRange.end))}
        </button>
      )}

      {picking && selRange && (
        <div className="period-templates">
          <div className="periods-title">{t('cal.choosePlan')}</div>
          {TEMPLATES.map((tpl) => (
            <button key={tpl.id} className="period-template" onClick={() => startPlanFrom(tpl)}>
              <span className="period-tpl-emoji">{tpl.emoji}</span>
              <span className="period-tpl-name">{tpl.name}</span>
              <span className="cal-dot" style={{ background: tpl.color }} />
            </button>
          ))}

          {!customOpen ? (
            <button className="period-template" onClick={() => setCustomOpen(true)}>
              <span className="period-tpl-emoji">{EMOJI_DEFAULT}</span>
              <span className="period-tpl-name">{t('cal.custom')}</span>
              <span className="period-tpl-days">›</span>
            </button>
          ) : (
            <div className="custom-plan">
              <input
                autoFocus
                className="field-input custom-plan-name"
                placeholder={t('cal.customPlaceholder')}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCustomPlan()}
                maxLength={48}
              />
              <div className="custom-plan-colors">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${customColor === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setCustomColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              <button
                className="period-template custom-plan-save"
                disabled={!customName.trim()}
                onClick={saveCustomPlan}
              >
                <span className="period-tpl-name">{t('cal.saveCustom')}</span>
                <span className="cal-dot" style={{ background: customColor }} />
              </button>
            </div>
          )}

          <button className="add-row" onClick={() => { setPicking(false); setSelStart(null); setSelEnd(null); setCustomOpen(false); setCustomName(''); }}>
            {t('cal.cancel')}
          </button>
        </div>
      )}

      {plans.length > 0 && <div className="divider" />}

      {plans.length > 0 && (
      <div className="periods-section">
        <h3 className="periods-title">{t('cal.activePeriods')}</h3>
        {plans.map((p) => {
          const s = parseYmd(p.start);
          const e = parseYmd(p.end);
          const total = Math.round((e - s) / 86400000) + 1;
          const today = new Date(); today.setHours(0,0,0,0);
          const dayNum = Math.floor((today - s) / 86400000) + 1;
          const prog = Math.max(1, Math.min(dayNum, total));
          return (
            <div key={p.id} className="period-row">
              <span className="period-emoji">{p.emoji}</span>
              <span className="period-name">{p.name}</span>
              <span className="period-progress">{prog}/{total}</span>
              <button className="period-end" onClick={() => endPlan(p.id)}>✕</button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
