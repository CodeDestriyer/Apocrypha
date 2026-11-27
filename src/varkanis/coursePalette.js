// Shared by the viewer and the server-rendered share images (api/_lib).

// [background, text color, plate text color]
export const BACKGROUNDS = {
  dark:   ['#0f0f0f', '#fff', '#0f0f0f'],
  white:  ['#ffffff', '#111', '#fff'],
  wine:   ['#6e2413', '#fff', '#6e2413'],
  blue:   ['#2350ff', '#fff', '#2350ff'],
  yellow: ['#ffd400', '#111', '#ffd400'],
  pink:   ['#ff3d7f', '#fff', '#e0245e'],
  green:  ['#0f8a5f', '#fff', '#0f8a5f'],
  purple: ['#5b2be0', '#fff', '#5b2be0'],
  orange: ['#ff5a1f', '#fff', '#e8480f'],
  sunset: ['linear-gradient(160deg, #ff7a18, #e0245e)', '#fff', '#d8304f'],
  ocean:  ['linear-gradient(160deg, #1f3cff, #00b4ff)', '#fff', '#1f5cff'],
  night:  ['linear-gradient(160deg, #120c2c, #4a1f7a)', '#fff', '#2a1450'],
};
const LEGACY = { paper: 'white', accent: 'wine' };
// Auto background for cards without a tone. Black-only for now; add keys
// here to rotate colours again.
export const AUTO = ['dark'];

export function toneOf(card, autoIndex = 0) {
  if (card?.type === 'chapter' || card?.type === 'end') return 'dark';
  const t = LEGACY[card?.tone] ?? card?.tone;
  return BACKGROUNDS[t] ? t : AUTO[autoIndex % AUTO.length];
}
