import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const PERIODS_KEY = 'lr.periods';

const TEMPLATES = [
  { id: 'dopamine', emoji: '🧠', name: 'Дофаминовый детокс', days: 14, color: '#7fb8c7' },
  { id: 'cold',     emoji: '❄️', name: 'Холодный душ',       days: 30, color: '#9bd1e5' },
  { id: 'social',   emoji: '📵', name: 'Без соцсетей',        days: 30, color: '#c79b7f' },
  { id: 'nofap',    emoji: '🚫', name: 'No-fap',              days: 90, color: '#a37fc7' },
  { id: 'early',    emoji: '🌅', name: 'Ранний подъём 5:00',  days: 21, color: '#c7b87f' },
];

const WD_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WD_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const WD_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const WD = { ru: WD_RU, en: WD_EN, es: WD_ES };

function loadPeriods() {
  try { return JSON.parse(localStorage.getItem(PERIODS_KEY)) ?? []; } catch { return []; }
}
function savePeriods(v) {
  try { localStorage.setItem(PERIODS_KEY, JSON.stringify(v)); } catch {}
}

function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);
}

export default function CalendarPage() {
  const { profile } = useProfile();
  const { t, lang } = useLang();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [periods, setPeriods] = useState(loadPeriods);
  const [adding, setAdding] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = ymd(new Date());

  const goals = (profile.goals ?? []).filter((g) => g.deadline);
  const goalsByDay = {};
  for (const g of goals) {
    const k = String(g.deadline).slice(0, 10);
    (goalsByDay[k] ||= []).push(g);
  }

  const updatePeriods = (next) => { setPeriods(next); savePeriods(next); };

  const startTemplate = (tpl) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    updatePeriods([
      ...periods,
      { id: newId(), name: tpl.name, emoji: tpl.emoji, color: tpl.color, start: ymd(today), days: tpl.days },
    ]);
    setAdding(false);
  };
  const endPeriod = (id) => updatePeriods(periods.filter((p) => p.id !== id));

  const periodOnDay = (period, day) => {
    const start = new Date(period.start);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, period.days - 1);
    return day >= start && day <= end;
  };

  const wd = WD[lang] ?? WD_RU;
  const monthFmt = new Intl.DateTimeFormat(lang, { month: 'short' });

  return (
    <div className="card calendar-card">
      <div className="cal-week-nav">
        <button className="cal-nav-btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹</button>
        <span className="cal-week-label">
          {days[0].getDate()} – {days[6].getDate()} {monthFmt.format(days[6])}
        </span>
        <button className="cal-nav-btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>›</button>
      </div>

      <div className="cal-week">
        {days.map((d, i) => {
          const k = ymd(d);
          const dayGoals = goalsByDay[k] ?? [];
          const isToday = k === todayKey;
          const activeOnDay = periods.filter((p) => periodOnDay(p, d));
          return (
            <div key={k} className={`cal-day ${isToday ? 'today' : ''}`}>
              <div className="cal-day-head">
                <span className="cal-wd">{wd[i]}</span>
                <span className="cal-num">{d.getDate()}</span>
              </div>
              {activeOnDay.length > 0 && (
                <div className="cal-strips">
                  {activeOnDay.map((p) => (
                    <span key={p.id} className="cal-strip" style={{ background: p.color }} title={p.name} />
                  ))}
                </div>
              )}
              {dayGoals.map((g) => (
                <div key={g.id} className="cal-goal">✦ {g.title || '—'}</div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="divider" />

      <div className="periods-section">
        <h3 className="periods-title">{t('cal.activePeriods')}</h3>
        {periods.length === 0 && !adding && <div className="periods-empty">{t('cal.empty')}</div>}
        {periods.map((p) => {
          const start = new Date(p.start);
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const dayNum = Math.floor((today - start) / 86400000) + 1;
          return (
            <div key={p.id} className="period-row">
              <span className="period-emoji">{p.emoji}</span>
              <span className="period-name">{p.name}</span>
              <span className="period-progress">{Math.max(1, Math.min(dayNum, p.days))}/{p.days}</span>
              <button className="period-end" onClick={() => endPeriod(p.id)}>✕</button>
            </div>
          );
        })}
        {!adding ? (
          <button className="add-row" onClick={() => setAdding(true)}>{t('cal.newPeriod')}</button>
        ) : (
          <div className="period-templates">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.id} className="period-template" onClick={() => startTemplate(tpl)}>
                <span className="period-tpl-emoji">{tpl.emoji}</span>
                <span className="period-tpl-name">{tpl.name}</span>
                <span className="period-tpl-days">{tpl.days} {t('cal.daysShort')}</span>
              </button>
            ))}
            <button className="add-row" onClick={() => setAdding(false)}>{t('cal.cancel')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
