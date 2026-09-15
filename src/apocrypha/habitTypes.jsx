// Marks for Hábitos — a small, optional category on each quit-counter. Unlike
// Tareas types these carry no done/missed state (habits just count days); the
// mark only groups and colours the list. Shapes are deliberately different from
// the Tareas set (square/triangle/circle/star) and chosen to fit their meaning:
// a diamond for Nutrición, an hourglass (rest/time) for Descanso.
export const HABIT_TYPES = {
  nutricion: { shape: 'diamond',   color: '#3aa06a', labelKey: 'habits.mark.nutricion' },
  descanso:  { shape: 'hourglass', color: '#7b5cc4', labelKey: 'habits.mark.descanso' },
};

export const HABIT_TYPE_ORDER = ['nutricion', 'descanso'];

// A habit's mark is optional: an unknown/absent type reads as "no mark".
export const habitTypeOf = (habit) => (HABIT_TYPES[habit?.type] ? habit.type : null);

// The mark's shape, in its colour. Solid-filled when `filled` (the assigned
// mark on a card, or a selected chip), outlined otherwise.
export function HabitShape({ type, filled = true, size = 22 }) {
  const def = HABIT_TYPES[type];
  if (!def) return null;
  const { shape, color } = def;
  const props = { fill: filled ? color : 'none', stroke: color, strokeWidth: 2, strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {shape === 'diamond' && <polygon points="12,2.5 21.5,12 12,21.5 2.5,12" {...props} />}
      {shape === 'hourglass' && <polygon points="5,4 19,4 13,12 19,20 5,20 11,12" {...props} />}
    </svg>
  );
}
