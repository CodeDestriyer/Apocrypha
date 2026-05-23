import { useEffect, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const PLANS_KEY = 'lr.plans';
const LEGACY_KEY = 'lr.periods';

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
  const [focusDay, setFocusDay] = useState(() => ymd(new Date()));
  const [quickGoal, setQuickGoal] = useState('');
  const [goalAddOpen, setGoalAddOpen] = useState(false);

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
    setFocusDay(ymd(d));
    setGoalAddOpen(false);
    setQuickGoal('');
  };

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
    setGoalAddOpen(false);
  };
  const toggleGoal = (id) =>
    update((curr) => ({
      goals: (curr.goals ?? []).map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    }));

  const endPlan = (id) => updatePlans(plans.filter((p) => p.id !== id));

  const wd = WD[lang] ?? WD_RU;
  const monthFmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });

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
          const focused = k === focusDay;
          return (
            <button
              key={k}
              className={`cal-cell ${inMonth ? '' : 'out'} ${isToday ? 'today' : ''} ${focused ? 'sel' : ''}`}
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
          {focusPlans.map((p) => (
            <div key={p.id} className="day-focus-row" style={{ borderLeftColor: p.color }}>
              <span className="day-focus-row-name">
                <span className="period-emoji">{p.emoji}</span>
                {p.name}
              </span>
              <button className="period-end" onClick={() => endPlan(p.id)} aria-label="remove">✕</button>
            </div>
          ))}
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

        <div className={`day-focus-add ${goalAddOpen ? 'open' : ''}`}>
          <button
            className="goal-add-toggle"
            onClick={() => setGoalAddOpen((o) => !o)}
            aria-label={t('cal.addGoalPlaceholder')}
            aria-expanded={goalAddOpen}
          >+</button>
          <div className="goal-add-slot">
            <input
              className="field-input"
              placeholder={t('cal.addGoalPlaceholder')}
              value={quickGoal}
              onChange={(e) => setQuickGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addQuickGoal();
                if (e.key === 'Escape') { setGoalAddOpen(false); setQuickGoal(''); }
              }}
              maxLength={80}
              ref={(el) => { if (goalAddOpen && el && document.activeElement !== el) el.focus(); }}
              tabIndex={goalAddOpen ? 0 : -1}
            />
            <button
              className="cal-nav-btn add"
              onClick={addQuickGoal}
              disabled={!quickGoal.trim()}
              aria-label="add"
              tabIndex={goalAddOpen ? 0 : -1}
            >✓</button>
          </div>
        </div>
      </div>

    </div>
  );
}
