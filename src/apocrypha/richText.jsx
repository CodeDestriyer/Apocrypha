// The rich-text marker format used by the notes sections (Reglas, Conocimiento)
// and by RichEditor. This module owns the FORMAT — how a stored body string is
// parsed and rendered — not how any section looks or behaves. Two sections can
// share a text format while having nothing else in common.
//
// Inline:  **bold**, __italic__, [[boxed]], ==highlight==, ##heading##
// Blocks:  [[[ … ]]] (box), [[[cols … ]]] (columns, cells split by |||),
//          `|`-tables, `---` dividers, `• ` bullet lines.

// A run whose only characters are marker delimiters or whitespace carries no
// real content — used to drop EMPTY boxes / marks / fences so a stray frame (an
// outline around nothing, a mark that just tints a line start) never renders,
// even if one is still sitting in older stored data.
const STRUCTURAL = /\[\[\[cols|\[\[\[|\]\]\]|\|\|\||\[\[|\]\]|\*\*|__|==|##|[\s\u200B]/g;
const isEmptyContent = (s) => String(s ?? '').replace(STRUCTURAL, '') === '';

// Bodies store inline formatting as markers: **bold**, __italic__,
// [[boxed]], ==highlight== and ##heading## (a big bold heading). Render each as
// its own span (newlines are kept by the container's white-space: pre-wrap).
// Markers nest — a marked span can also be bold-and-italic (`==***x***==`, i.e.
// `==**__x__**==`) — so each match's inner content is rendered recursively.
// `##heading##` is the last alternative so the earlier capture-group numbers
// stay put.
export function renderRich(text, kp = 'r') {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==|__([\s\S]+?)__|##([\s\S]+?)##/g;
  const out = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push(str.slice(last, m.index));
    const k = `${kp}-${key++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{renderRich(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(isEmptyContent(m[2]) ? m[2] : <span key={k} className="rule-box">{renderRich(m[2], k)}</span>);
    else if (m[3] !== undefined) out.push(isEmptyContent(m[3]) ? m[3] : <mark key={k} className="rule-mark">{renderRich(m[3], k)}</mark>);
    else if (m[4] !== undefined) out.push(<em key={k}>{renderRich(m[4], k)}</em>);
    else out.push(<span key={k} className="rule-heading">{renderRich(m[5], k)}</span>);
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

// A pipe table: first row is the header. Cells keep inline markers.
export function RichTable({ rows }) {
  const parse = (line) => {
    let cells = line.split('|').map((c) => c.trim());
    if (cells.length && cells[0] === '') cells = cells.slice(1);
    if (cells.length && cells[cells.length - 1] === '') cells = cells.slice(0, -1);
    return cells;
  };
  const grid = rows.map(parse);
  const [head, ...body] = grid;
  return (
    <table className="rule-table">
      <thead><tr>{head.map((c, i) => <th key={i}>{renderRich(c)}</th>)}</tr></thead>
      {body.length > 0 && (
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>{row.map((c, ci) => <td key={ci}>{renderRich(c)}</td>)}</tr>
          ))}
        </tbody>
      )}
    </table>
  );
}

// ── Block-fence helpers (shared shape with RichEditor's parser) ─────────────
// Blocks are fenced on their own lines: `[[[` … `]]]` (a box) and `[[[cols` …
// `]]]` (columns, cells split by `|||`). They nest, so scanning must balance
// openers against closers by depth instead of stopping at the first `]]]`.
const isFenceOpen = (l) => l === '[[[' || l === '[[[cols';
// Index of the `]]]` that closes the fence opened at `open` (or the array end).
export function matchFenceClose(lines, open) {
  let depth = 0;
  for (let k = open; k < lines.length; k++) {
    if (isFenceOpen(lines[k])) depth++;
    else if (lines[k] === ']]]' && --depth === 0) return k;
  }
  return lines.length;
}
// Split a columns block's inner lines on the `|||` separators at THIS depth
// (a `|||` inside a nested fence belongs to that fence, not this split).
export function splitColumns(inner) {
  const cols = []; let col = [], depth = 0;
  for (const ln of inner) {
    if (isFenceOpen(ln)) { depth++; col.push(ln); }
    else if (ln === ']]]') { depth--; col.push(ln); }
    else if (ln === '|||' && depth === 0) { cols.push(col); col = []; }
    else col.push(ln);
  }
  cols.push(col);
  return cols;
}
// A column that is just a "+" gets its own class so it can render big/centered.
const isPlusOnly = (cellLines) => cellLines.join('\n').trim() === '+';

// Block-level rendering of a body: nested box/columns fences, pipe tables,
// `---` dividers, and paragraphs of inline-formatted text (breaks preserved).
export function renderBody(text) {
  return renderBlocks(String(text ?? '').split('\n'), 'b');
}

export function renderBlocks(lines, kp) {
  const blocks = [];
  let para = [], table = [], key = 0;
  const flushPara = () => {
    if (!para.length) return;
    const buf = para; para = [];
    blocks.push(
      <div key={`${kp}p${key++}`} className="rule-para">
        {/* A blank line (e.g. a paragraph gap between two boxes) must still take
            a line's height — empty content collapses to zero, so hold it open
            with a non-breaking space. */}
        {buf.map((ln, i) => <span key={i}>{i > 0 && <br />}{ln === '' ? ' ' : renderRich(ln)}</span>)}
      </div>
    );
  };
  const flushTable = () => {
    if (!table.length) return;
    const buf = table; table = [];
    blocks.push(<RichTable key={`${kp}t${key++}`} rows={buf} />);
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === '[[[cols') {
      const j = matchFenceClose(lines, i);
      const inner = lines.slice(i + 1, j);
      if (!isEmptyContent(inner.join('\n'))) {
        flushPara(); flushTable();
        const cols = splitColumns(inner);
        const k = `${kp}c${key++}`;
        blocks.push(
          <div key={k} className="rule-cols">
            {cols.map((c, ci) => (
              <div key={ci} className={`rule-col${isPlusOnly(c) ? ' rule-col--plus' : ''}`}>
                {renderBlocks(c, `${k}-${ci}`)}
              </div>
            ))}
          </div>
        );
      }
      i = j + 1;
      continue;
    }
    if (line === '[[[') {
      const j = matchFenceClose(lines, i);
      const inner = lines.slice(i + 1, j);
      if (!isEmptyContent(inner.join('\n'))) {
        flushPara(); flushTable();
        const k = `${kp}b${key++}`;
        blocks.push(
          <div key={k} className="rule-block-box">{renderBlocks(inner, k)}</div>
        );
      }
      i = j + 1;
      continue;
    }
    if (/^\s*-{3,}\s*$/.test(line)) { flushPara(); flushTable(); blocks.push(<hr key={`${kp}h${key++}`} className="rule-hr" />); }
    // A "• …" line is a bullet item: its own row so the wrapped text hangs under
    // the first letter (see .rule-li). The bullet stays part of the text.
    else if (/^•\s/.test(line)) { flushPara(); flushTable(); blocks.push(<div key={`${kp}li${key++}`} className="rule-li">{renderRich(line)}</div>); }
    else if (line.includes('|')) { flushPara(); table.push(line); }
    else { flushTable(); para.push(line); }
    i++;
  }
  flushPara(); flushTable();
  return blocks;
}
