// Task categories for the daily Tareas list. Each type is told apart by both a
// shape and a colour; the shape is drawn as an outline while the task is open
// and filled in once it's done. Shared by the Tareas section and the Hero cube.
export const TASK_TYPES = {
  spanish:  { shape: 'square',   color: '#c0392b', labelKey: 'tareas.type.spanish' },
  varkanis: { shape: 'triangle', color: '#3f6fb0', labelKey: 'tareas.type.varkanis' },
  body:     { shape: 'circle',   color: '#4a8f5f', labelKey: 'tareas.type.body' },
  study:    { shape: 'star',     color: '#c99a2e', labelKey: 'tareas.type.study' },
};

export const TYPE_ORDER = ['spanish', 'varkanis', 'body', 'study'];
export const DEFAULT_TYPE = 'spanish';

// Fall back gracefully for tasks saved before types existed / unknown values.
export const typeOf = (task) => (TASK_TYPES[task?.type] ? task.type : DEFAULT_TYPE);

// Local (not UTC) YYYY-MM-DD for a given Date, so days match wall-clock time.
export const localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayISO = () => localISO(new Date());
export const shiftISO = (iso, delta) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localISO(dt);
};
// Saturdays are a "Día libre" (rest day): the Tareas list shows a plain rest
// screen instead of the to-do list, on any Saturday — past, present or future.
// getDay(): 0 = Sunday … 6 = Saturday.
export const isRestDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() === 6;
};

// The day a task belongs to. Tasks saved before the per-day feature have no
// `day`; anchor those to their *creation* day (local), NOT the live "today" —
// otherwise a dayless task drifts forward and re-appears on whatever day the
// app happens to be opened, dragging its done-state along with it.
export const taskDay = (task) => {
  if (task?.day) return task.day;
  if (task?.created_at) {
    const d = new Date(task.created_at);
    if (!Number.isNaN(d.getTime())) return localISO(d);
  }
  return todayISO();
};

const STAR_POINTS =
  '12,3 14.17,9.01 20.56,9.22 15.52,13.14 17.29,19.28 12,15.7 6.71,19.28 8.48,13.14 3.44,9.22 9.83,9.01';

// One shape (square / triangle / circle / star) in the type's colour. Outlined
// while open, solid-filled when `done`, and struck through when `missed`
// (marked as not done for the day).
export function TaskShape({ type, done, missed, size = 24 }) {
  const { shape, color } = TASK_TYPES[type] ?? TASK_TYPES[DEFAULT_TYPE];
  const fill = done ? color : 'none';
  const props = { fill, stroke: color, strokeWidth: 2, strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {shape === 'square' && <rect x="4" y="4" width="16" height="16" rx="2.5" {...props} />}
      {shape === 'circle' && <circle cx="12" cy="12" r="8.5" {...props} />}
      {shape === 'triangle' && <polygon points="12,3.8 20.5,19 3.5,19" {...props} />}
      {shape === 'star' && <polygon points={STAR_POINTS} {...props} />}
      {missed && <line x1="1.5" y1="12" x2="22.5" y2="12" stroke={color} strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}
