import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const PLANS_KEY = 'lr.plans';
const LEGACY_KEY = 'lr.periods';

const TEMPLATES = [
  { id: 'dopamine', emoji: '🧠', name: 'Дофаминовый детокс', color: '#7fb8c7' },
  { id: 'cold',     emoji: '❄️', name: 'Холодный душ',       color: '#9bd1e5' },
  { id: 'social',   emoji: '📵', name: 'Без соцсетей',        color: '#c79b7f' },
  { id: 'nofap',    emoji: '🚫', name: 'No-fap',              color: '#a37fc7' },
  { id: 'early',    emoji: '🌅', name: 'Ранний подъём 5:00',  color: '#c7b87f' },
];

const WD_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WD_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WD_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const WD = { ru: WD_RU, en: WD_EN, es: WD_ES };

function loadPlans() {
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
  return [];
}
function savePlans(v) { try { localStorage.setItem(PLANS_KEY, JSON.stringify(v)); } catch {} }

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
  const { profile } = useProfile();
  const { t, lang } = useLang();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });
  const [plans, setPlans] = useState(loadPlans);
  const [selStart, setSelStart] = useState(null); // ymd string
  const [selEnd, setSelEnd] = useState(null);
  const [picking, setPicking] = useState(false);

  const days = buildMonthGrid(viewDate);
  const todayKey = ymd(new Date());
  const viewMonth = viewDate.getMonth();

  const goals = (profile.goals ?? []).filter((g) => g.deadline);
  const goalsByDay = {};
  for (const g of goals) {
    const k = String(g.deadline).slice(0, 10);
    (goalsByDay[k] ||= []).push(g);
  }

  const updatePlans = (next) => { setPlans(next); savePlans(next); };

  const planOnDay = (plan, day) => {
    const s = parseYmd(plan.start);
    const e = parseYmd(plan.end);
    return day >= s && day <= e;
  };

  const onDayClick = (d) => {
    const k = ymd(d);
    if (!selStart) { setSelStart(k); setSelEnd(null); return; }
    if (selStart && selEnd) { setSelStart(k); setSelEnd(null); return; }
    if (k === selStart) { setSelStart(null); return; }
    // Order: start <= end
    if (parseYmd(k) < parseYmd(selStart)) { setSelEnd(selStart); setSelStart(k); }
    else { setSelEnd(k); }
  };

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
  };
  const endPlan = (id) => updatePlans(plans.filter((p) => p.id !== id));

  const wd = WD[lang] ?? WD_RU;
  const monthFmt = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
  const shortFmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });

  return (
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
        {days.map((d) => {
          const k = ymd(d);
          const inMonth = d.getMonth() === viewMonth;
          const isToday = k === todayKey;
          const dayGoals = goalsByDay[k] ?? [];
          const activeOnDay = plans.filter((p) => planOnDay(p, d));
          const sel = isSelected(k);
          const range = isInRange(d);
          return (
            <button
              key={k}
              className={`cal-cell ${inMonth ? '' : 'out'} ${isToday ? 'today' : ''} ${sel ? 'sel' : ''} ${range ? 'in-range' : ''}`}
              onClick={() => onDayClick(d)}
            >
              <span className="cal-cell-num">{d.getDate()}</span>
              {(activeOnDay.length > 0 || dayGoals.length > 0) && (
                <span className="cal-cell-dots">
                  {activeOnDay.slice(0, 3).map((p) => (
                    <span key={p.id} className="cal-dot" style={{ background: p.color }} />
                  ))}
                  {dayGoals.length > 0 && <span className="cal-dot cal-dot-goal">✦</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selStart && !selEnd && (
        <div className="cal-hint">{t('cal.selectRange')}</div>
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
          <button className="add-row" onClick={() => { setPicking(false); setSelStart(null); setSelEnd(null); }}>
            {t('cal.cancel')}
          </button>
        </div>
      )}

      <div className="divider" />

      <div className="periods-section">
        <h3 className="periods-title">{t('cal.activePeriods')}</h3>
        {plans.length === 0 && <div className="periods-empty">{t('cal.empty')}</div>}
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
    </div>
  );
}
