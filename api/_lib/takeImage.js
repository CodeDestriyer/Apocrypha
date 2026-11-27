// Draws one course card as a PNG (satori -> resvg) for shared takes:
// 'og' is the chat link preview (4:5), 'story' the downloadable 9:16 image.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { BACKGROUNDS, toneOf } from '../../src/varkanis/coursePalette.js';

const SIZES = { og: [1080, 1350], story: [1080, 1920] };

let fonts = null;
function loadFonts() {
  if (fonts) return fonts;
  const dir = join(process.cwd(), 'api/_fonts');
  fonts = [600, 700, 800].map((weight) => ({
    name: 'Inter Tight',
    data: readFileSync(join(dir, `inter-tight-latin-${weight}-normal.woff`)),
    weight,
    style: 'normal',
  }));
  return fonts;
}

// Satori wants display:flex on every multi-child div and treats any array as
// "many children", so default the display and unwrap single children.
const h = (type, style, ...children) => {
  const kids = children.flat().filter((c) => c != null && c !== false);
  return {
    type,
    props: { style: { display: 'flex', ...style }, children: kids.length === 1 ? kids[0] : kids },
  };
};

const plain = (s = '') => s.replace(/\*\*/g, '');
const paras = (s = '') => s.split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);

// Satori has no inline flow, so a line is a wrapping row of words; a **x**
// phrase stays one plate.
function rich(text, plate) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).flatMap((part) => (
    part.startsWith('**')
      ? [h('span', { background: plate.bg, color: plate.fg, borderRadius: 14, padding: '0 14px', margin: '4px 6px' }, part.slice(2, -2))]
      : part.split(/\s+/).filter(Boolean).map((w) => h('span', { margin: '4px 9px' }, w))
  ));
}

const MAIN = 80;
const SUB = 56;

const STILL = /\.(png|jpe?g)(\?|$)/i;

function content(card, c) {
  const plate = { bg: c.fg, fg: c.plateFg };
  const line = (text, size, extra = {}) => h('div', {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
    fontSize: size, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', ...extra,
  }, rich(text, plate));

  switch (card.type) {
    case 'big':
      return [line(card.text, 84)];
    case 'stat':
      return (card.items ?? []).map((s) => h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' },
        h('div', { fontSize: 240, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em' }, s.value),
        h('div', { fontSize: SUB, fontWeight: 600, opacity: 0.75, marginTop: 12 }, plain(s.label))));
    case 'poll':
      return [h('div', {
        display: 'flex', flexDirection: 'column', width: 820, padding: 44, borderRadius: 44, background: '#fff', color: '#111',
      },
      h('div', { fontSize: 54, fontWeight: 800, lineHeight: 1.2, textAlign: 'center', marginBottom: 20 }, plain(card.q)),
      ...(card.options ?? []).filter(Boolean).map((o) => h('div', {
        display: 'flex', justifyContent: 'center', marginTop: 18, padding: '30px 0', borderRadius: 26, background: '#f0f0f0', fontSize: 44, fontWeight: 700,
      }, o)))];
    case 'reveal':
      return [line(card.q, MAIN), h('div', {
        display: 'flex', marginTop: 50, padding: '28px 60px', borderRadius: 999, background: plate.bg, color: plate.fg, fontSize: 46, fontWeight: 700,
      }, '¿Verdad o mito?')];
    case 'task':
      return [
        h('div', { display: 'flex', padding: '12px 30px', borderRadius: 999, background: plate.bg, color: plate.fg, fontSize: 34, fontWeight: 700, marginBottom: 40 }, 'Tu turno'),
        line(card.text, MAIN),
      ];
    case 'quote':
      return [line(`«${plain(card.text)}»`, MAIN), card.by && h('div', { fontSize: SUB, fontWeight: 600, opacity: 0.75, marginTop: 34 }, `— ${card.by}`)];
    case 'list':
      return [
        card.title && line(card.title, MAIN, { marginBottom: 34 }),
        ...(card.items ?? []).filter(Boolean).map((it) => line(it, MAIN, { margin: '10px 0' })),
      ];
    case 'media':
      return card.caption ? paras(card.caption).map((p) => line(p, MAIN)) : [];
    default: {
      const ps = paras(card.body);
      return [
        card.title && line(card.title, MAIN, { marginBottom: 30 }),
        ...ps.map((p, i) => line(p, i === 0 ? MAIN : SUB, i === 0 ? {} : { fontWeight: 600, opacity: 0.75, marginTop: 34 })),
      ];
    }
  }
}

export async function renderTake({ card, auto = 0, title = '' }, format = 'og') {
  const [width, height] = SIZES[format] ?? SIZES.og;
  const [bg, fg, plateFg] = BACKGROUNDS[toneOf(card, auto)];
  const image = card.image ?? (card.type === 'media' ? card.src : null);
  const photo = image && STILL.test(image) ? image : null;
  const c = photo ? { fg: '#fff', plateFg: '#111' } : { fg, plateFg };

  const tree = h('div', {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    width, height, padding: format === 'story' ? '200px 110px' : '120px 100px',
    color: c.fg, fontFamily: 'Inter Tight',
    ...(bg.startsWith('linear') ? { backgroundImage: bg } : { backgroundColor: bg }),
  },
  photo && { type: 'img', props: { src: photo, width, height, style: { position: 'absolute', top: 0, left: 0, width, height, objectFit: 'cover' } } },
  photo && h('div', { position: 'absolute', top: 0, left: 0, width, height, backgroundColor: 'rgba(0,0,0,0.45)' }),
  h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center' }, content(card, c)),
  h('div', {
    position: 'absolute', bottom: format === 'story' ? 110 : 64, left: 0, right: 0,
    display: 'flex', justifyContent: 'center', fontSize: 34, fontWeight: 700, opacity: 0.9,
  }, title ? `varkanis.com · ${title}` : 'varkanis.com'));

  const svg = await satori(tree, { width, height, fonts: loadFonts(), loadAdditionalAsset });
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

// Emoji as Twemoji SVGs; an unreachable CDN means no glyph, not a failed
// render. Non-Latin scripts get no extra fonts: the course is Spanish.
async function loadAdditionalAsset(code, segment) {
  if (code !== 'emoji') return [];
  try {
    const cp = [...segment].map((ch) => ch.codePointAt(0).toString(16)).filter((x) => x !== 'fe0f').join('-');
    const r = await fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return '';
    return `data:image/svg+xml;base64,${Buffer.from(await r.text()).toString('base64')}`;
  } catch {
    return '';
  }
}
