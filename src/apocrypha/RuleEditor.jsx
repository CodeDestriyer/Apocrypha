import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';

// WYSIWYG body editor for a rule. The stored value is the same marker format
// the read view uses so search, Supabase and renderRuleBody stay untouched —
// but here formatting is shown live: click "bold" on a selection and the text
// is bold immediately, no asterisks.
//
// Inline markers: **bold**, __italic__, [[box]] (a small frame around a word),
// ==mark==. They nest, so a run can be several at once (`**__x__**`).
// Block marker: a fenced [[[ … ]]] on their own lines is a big frame drawn
// around whole lines (a "main rule" callout), produced by the box button when
// the selection spans several lines.
//
// The contentEditable is UNCONTROLLED: its HTML is seeded once on mount and
// never re-set from React, so the caret is never blown away. On every input we
// serialize the DOM back to markers and hand them up via onChange.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A run whose only characters are marker delimiters or whitespace carries no
// real content. Used everywhere to drop EMPTY boxes / marks / fences so a stray
// frame (an outline around nothing, a mark that just tints a line start) can
// never be created, rendered, or round-tripped.
const STRUCTURAL = /\[\[\[cols|\[\[\[|\]\]\]|\|\|\||\[\[|\]\]|\*\*|__|==|##|[\s\u200B]/g;
const isEmptyContent = (s) => String(s ?? '').replace(STRUCTURAL, '') === '';

// One logical line's markers → inline HTML. Mirrors renderRich(), including its
// recursion so nested markers (e.g. bold inside a mark, `==**x**==`) seed as
// nested elements rather than literal ** text. `##heading##` (a big bold
// heading) is the last alternative so the existing capture-group numbers stay put.
function inlineToHtml(text) {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==|__([\s\S]+?)__|##([\s\S]+?)##/g;
  let out = '', last = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out += esc(str.slice(last, m.index));
    if (m[1] !== undefined) out += `<strong>${inlineToHtml(m[1])}</strong>`;
    else if (m[2] !== undefined) out += isEmptyContent(m[2]) ? esc(m[2]) : `<span class="rule-box">${inlineToHtml(m[2])}</span>`;
    else if (m[3] !== undefined) out += isEmptyContent(m[3]) ? esc(m[3]) : `<mark class="rule-mark">${inlineToHtml(m[3])}</mark>`;
    else if (m[4] !== undefined) out += `<em>${inlineToHtml(m[4])}</em>`;
    else out += `<span class="rule-heading">${inlineToHtml(m[5])}</span>`;
    last = m.index + m[0].length;
  }
  if (last < str.length) out += esc(str.slice(last));
  return out;
}

// ── Block-fence helpers (mirror RulesSection's parser) ──────────────────────
// `[[[` … `]]]` (box) and `[[[cols` … `]]]` (columns, cells split by `|||`)
// nest, so scanning balances openers against closers by depth.
const isFenceOpen = (l) => l === '[[[' || l === '[[[cols';
function matchFenceClose(lines, open) {
  let depth = 0;
  for (let k = open; k < lines.length; k++) {
    if (isFenceOpen(lines[k])) depth++;
    else if (lines[k] === ']]]' && --depth === 0) return k;
  }
  return lines.length;
}
function splitColumns(inner) {
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
const isPlusOnly = (cellLines) => cellLines.join('\n').trim() === '+';

// ── Pipe tables ─────────────────────────────────────────────────────────────
// A maximal run of consecutive lines that each contain a `|` is a table (same
// rule as the read view). In the EDITOR the run becomes a real, editable
// <table> so it looks and behaves like a spreadsheet (Tab/Enter navigation,
// add/remove rows & columns) instead of showing raw `a | b` text. The first row
// is the header (styled via CSS `tr:first-child`, so no <th>/<td> swapping is
// needed when rows are added or deleted). domToMarkers turns each <tr> back into
// one `cell | cell` line, so the stored format never changes.
const isTableLine = (l) => l.includes('|') && l !== '|||';
// A `---` line is a horizontal divider (same rule as the read view). In the
// editor it becomes a real <hr> so it shows as the finished line straight away,
// not raw `---` text.
const isDividerLine = (l) => /^\s*-{3,}\s*$/.test(l);
// Split one stored table line into trimmed cells, dropping a leading/trailing
// empty cell so `| a | b |` and `a | b` parse the same (mirrors RuleTable).
function parseTableCells(line) {
  let cells = line.split('|').map((c) => c.trim());
  if (cells.length && cells[0] === '') cells = cells.slice(1);
  if (cells.length && cells[cells.length - 1] === '') cells = cells.slice(0, -1);
  return cells;
}
// A run of table lines → an editable <table>. Every row is padded to the widest
// row so the grid is rectangular; an empty cell gets a <br> so the caret can
// land in it (the <br> serializes back to nothing).
function tableToHtml(rows) {
  const grid = rows.map(parseTableCells);
  const width = Math.max(1, ...grid.map((r) => r.length));
  let html = '<table class="rule-table rule-table--edit"><tbody>';
  for (const row of grid) {
    html += '<tr>';
    for (let c = 0; c < width; c++) {
      const cell = row[c] ?? '';
      html += `<td>${cell === '' ? '<br>' : inlineToHtml(cell)}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

// Full marker string → editor HTML. Normal lines are joined by <br>; a
// [[[ … ]]] fence becomes a <div class="rule-block-box">, a [[[cols … ]]]
// fence (columns split by ||| lines) a <div class="rule-cols"> of columns, and a
// run of pipe lines an editable <table>. Fences nest (e.g. a box as a column
// cell), so cells/box bodies are parsed recursively. Blocks carry no surrounding
// <br> so the round-trip through domToMarkers is stable.
export function markersToHtml(text) {
  return blocksToHtml(String(text ?? '').split('\n'));
}
function blocksToHtml(lines) {
  let html = '', i = 0;
  const run = [], tbl = [];
  const flushRun = () => {
    if (!run.length) return;
    // Joining lines with <br> makes an all-blank run (the paragraph gap between
    // two blocks) collapse to '' — no node, so the caret has no line to sit on
    // and domToMarkers can't recover the blank. Emit one <br> per blank line so
    // the gap shows in the editor and round-trips back to the same blank lines.
    html += run.every((l) => l === '')
      ? '<br>'.repeat(run.length)
      : run.map(inlineToHtml).join('<br>');
    run.length = 0;
  };
  const flushTable = () => {
    if (!tbl.length) return;
    html += tableToHtml(tbl);
    tbl.length = 0;
  };
  while (i < lines.length) {
    if (lines[i] === '[[[cols') {
      const j = matchFenceClose(lines, i);
      const inner = lines.slice(i + 1, j);
      if (!isEmptyContent(inner.join('\n'))) {
        flushRun(); flushTable();
        const cols = splitColumns(inner);
        html += `<div class="rule-cols">${cols.map((c) =>
          `<div class="rule-col${isPlusOnly(c) ? ' rule-col--plus' : ''}">${blocksToHtml(c)}</div>`).join('')}</div>`;
      }
      i = j + 1;
    } else if (lines[i] === '[[[') {
      const j = matchFenceClose(lines, i);
      const inner = lines.slice(i + 1, j);
      if (!isEmptyContent(inner.join('\n'))) {
        flushRun(); flushTable();
        html += `<div class="rule-block-box">${blocksToHtml(inner)}</div>`;
      }
      i = j + 1;
    } else if (isDividerLine(lines[i])) { flushRun(); flushTable(); html += '<hr class="rule-hr">'; i++; }
    else if (isTableLine(lines[i])) { flushRun(); tbl.push(lines[i]); i++; }
    else { flushTable(); run.push(lines[i]); i++; }
  }
  flushRun(); flushTable();
  return html;
}

// Wrap an inline run in delimiters WITHOUT ever crossing a newline: a bold /
// box / mark that spans several lines is emitted as the marker reopened on each
// line (`==a==\n==b==`), because the reader parses inline markers per line — a
// marker left open across a `\n` would render as literal `==`/`**` text.
function wrapInline(inner, open, close) {
  return inner
    .split('\n')
    .map((seg) => (seg ? open + seg + close : ''))
    .join('\n');
}

// Serialize the inline content of a node (text, <br>, inline formatting spans)
// back to markers, with <br> as newline. Used for a line-run and for a box's
// inner content alike.
function inlineSerialize(node) {
  let s = '';
  node.childNodes.forEach((c) => {
    // Strip zero-width spaces: they are only caret scaffolding (see the line
    // break helper), never real content.
    if (c.nodeType === Node.TEXT_NODE) { s += c.textContent.replace(/\u200B/g, ''); return; }
    if (c.nodeType !== Node.ELEMENT_NODE) return;
    const tag = c.tagName;
    if (tag === 'BR') { s += '\n'; return; }
    const inner = inlineSerialize(c);
    if (tag === 'STRONG' || tag === 'B') s += wrapInline(inner, '**', '**');
    else if (tag === 'EM' || tag === 'I') s += wrapInline(inner, '__', '__');
    else if (c.classList.contains('rule-heading')) s += wrapInline(inner, '##', '##');
    else if (c.classList.contains('rule-box')) s += isEmptyContent(inner) ? inner : wrapInline(inner, '[[', ']]');
    else if (tag === 'MARK' || c.classList.contains('rule-mark')) s += isEmptyContent(inner) ? inner : wrapInline(inner, '==', '==');
    else s += inner;
  });
  return s;
}

const isBox = (c) =>
  c.nodeType === Node.ELEMENT_NODE && c.tagName === 'DIV' && c.classList.contains('rule-block-box');
const isCols = (c) =>
  c.nodeType === Node.ELEMENT_NODE && c.tagName === 'DIV' && c.classList.contains('rule-cols');
const isCol = (c) =>
  c.nodeType === Node.ELEMENT_NODE && c.tagName === 'DIV' && c.classList.contains('rule-col');
// A whole-line block: a columns layout or a block box. Boxes and columns nest,
// so these are the nodes the wrappers may find sitting on a line and must treat
// as one atomic unit (never split, never half-swallow into a neighbouring line).
const isBlockNode = (c) => !!c && (isCols(c) || isBox(c));

// The direct child of `flow` that `container` lives under (or null if container
// isn't inside flow). `flow` is the editor, or a column / box the caret sits in
// — see lineFlow — so this is "which line-level node of the current flow".
function topChild(flow, container) {
  let n = container;
  while (n && n.parentNode !== flow) n = n.parentNode;
  return n && n.parentNode === flow ? n : null;
}
// Does the selection sit on a whole-line block (columns / box) of its flow? True
// when either end lands on such a node — the case where a box button should frame
// the WHOLE block (e.g. draw a box around an existing columns layout) rather than
// treat it as an inline word. A word inside a column has its flow narrowed to
// that column, so its ends are plain text there and this stays false.
function coversBlock(flow, range) {
  return isBlockNode(topChild(flow, range.startContainer)) ||
         isBlockNode(topChild(flow, range.endContainer));
}

const isTable = (c) => c.nodeType === Node.ELEMENT_NODE && c.tagName === 'TABLE';
const isHr = (c) => c.nodeType === Node.ELEMENT_NODE && c.tagName === 'HR';
// Whole-line nodes the box/columns wrappers must never split or half-swallow
// into a neighbouring line: columns, a box, a table, or a divider. (Framing a
// WHOLE block — coversBlock — stays columns/box only; a table/divider is its
// own atom the extension just stops at.)
const isAtomicLine = (c) => isBlockNode(c) || isTable(c) || isHr(c);
// A cell is single-line, so strip any stray break/zero-width scaffolding out of
// its serialized text before it joins a `cell | cell` line.
const cellMarkers = (cell) => inlineSerialize(cell).replace(/[\n\u200B]/g, '').trim();

// Editor DOM → marker string. Block boxes become [[[ … ]]] fences and column
// layouts [[[cols … ]]] fences (columns separated by |||) on their own lines;
// everything else is inline content split into lines by <br>.
function domToMarkers(root) {
  const out = [];
  let cur = '';
  // A <br> right before a block (box / columns / table) marks a blank line the
  // user put there for spacing. The block branches only flush a NON-empty
  // pending line, so without this that blank line was dropped — and because the
  // seed step (blocksToHtml) re-emits it as a single trailing <br>, every
  // save→reload cycle ate one blank line until the gap vanished (the "space
  // before a box isn't applied" bug). Flushing the empty line when the previous
  // node was a <br> keeps such blanks stable across the round-trip.
  let lastWasBr = false;
  const flush = () => { out.push(cur); cur = ''; };
  root.childNodes.forEach((c) => {
    if (isCols(c)) {
      // Serialize cells first so a columns block with nothing real in any cell
      // is dropped instead of round-tripping as an empty frame.
      const cells = Array.from(c.children).filter(isCol).map((col) => domToMarkers(col));
      if (cells.some((s) => !isEmptyContent(s))) {
        if (cur !== '' || lastWasBr) flush();
        out.push('[[[cols');
        cells.forEach((s, ci) => {
          if (ci > 0) out.push('|||');
          s.split('\n').forEach((l) => out.push(l));
        });
        out.push(']]]');
      }
    } else if (isBox(c)) {
      const body = domToMarkers(c);
      if (!isEmptyContent(body)) {
        if (cur !== '' || lastWasBr) flush();
        out.push('[[[');
        body.split('\n').forEach((l) => out.push(l));
        out.push(']]]');
      }
    } else if (isTable(c)) {
      // Each <tr> becomes one `cell | cell` line. A table always carries at
      // least one `|`, so it round-trips through blocksToHtml as a table even
      // when every cell is empty.
      if (cur !== '' || lastWasBr) flush();
      c.querySelectorAll('tr').forEach((tr) => {
        const cells = Array.from(tr.children).filter((x) => x.tagName === 'TD' || x.tagName === 'TH');
        if (cells.length) out.push(cells.map(cellMarkers).join(' | '));
      });
    } else if (isHr(c)) {
      // A divider is its own `---` line.
      if (cur !== '') flush();
      out.push('---');
    } else if (c.nodeType === Node.ELEMENT_NODE && c.tagName === 'BR') {
      flush();
      lastWasBr = true;
      return;
    } else if (c.nodeType === Node.ELEMENT_NODE && (c.tagName === 'DIV' || c.tagName === 'P')) {
      // A top-level div/p is a plain line (the escape landing line, or pasted
      // block); drop its trailing placeholder <br>.
      if (cur !== '') flush();
      inlineSerialize(c).replace(/\n$/, '').split('\n').forEach((l) => out.push(l));
    } else {
      const tmp = document.createElement('span');
      tmp.appendChild(c.cloneNode(true));
      cur += inlineSerialize(tmp);
    }
    lastWasBr = false; // only the <br> branch (which returns early) sets it true
  });
  if (cur !== '' || out.length === 0) out.push(cur);
  return out.join('\n');
}

// ── inline formatting (bold / box / mark) within a single line ──────────────
const KIND_TAG = { bold: 'STRONG', italic: 'EM', box: 'SPAN', mark: 'MARK', heading: 'SPAN' };
const KIND_CLASS = { box: 'rule-box', mark: 'rule-mark', heading: 'rule-heading' };

function enclosingFormat(node, kind, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor) {
    if (el.tagName === KIND_TAG[kind] &&
        (!KIND_CLASS[kind] || el.classList.contains(KIND_CLASS[kind]))) return el;
    el = el.parentNode;
  }
  return null;
}
function unwrap(el) {
  const parent = el.parentNode;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}
function stripNested(el, kind) {
  const sel = KIND_CLASS[kind]
    ? `${KIND_TAG[kind].toLowerCase()}.${KIND_CLASS[kind]}`
    : KIND_TAG[kind].toLowerCase();
  el.querySelectorAll(sel).forEach(unwrap);
}
function inlineToggle(editor, range, kind) {
  const existing = enclosingFormat(range.commonAncestorContainer, kind, editor);
  if (existing) { unwrap(existing); return; }
  const node = document.createElement(KIND_TAG[kind]);
  if (KIND_CLASS[kind]) node.className = KIND_CLASS[kind];
  try {
    node.appendChild(range.extractContents());
    stripNested(node, kind);
    range.insertNode(node);
  } catch { /* range crosses awkward boundaries — leave it */ }
}

// ── block box (big frame around whole lines) ────────────────────────────────
function topIndex(flow, container) {
  return Array.from(flow.childNodes).indexOf(topChild(flow, container));
}
function enclosingBox(node, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor) { if (isBox(el)) return el; el = el.parentNode; }
  return null;
}
function unwrapBox(editor, box) {
  const p = box.parentNode;
  const before = box.previousSibling, after = box.nextSibling;
  if (before && before.nodeName !== 'BR') p.insertBefore(document.createElement('br'), box);
  while (box.firstChild) p.insertBefore(box.firstChild, box);
  if (after && after.nodeName !== 'BR') p.insertBefore(document.createElement('br'), box);
  p.removeChild(box);
}
// The selection spans more than one visual line at `flow`'s top level (the flow
// is the editor, or a column / box the selection sits inside — so this measures
// lines within the current block, letting columns be made inside a box).
function isMultiLine(flow, range) {
  const kids = Array.from(flow.childNodes);
  const lineOf = (container) => {
    const idx = topIndex(flow, container);
    let ln = 0;
    for (let k = 0; k < idx; k++) if (kids[k].nodeName === 'BR') ln++;
    return ln;
  };
  return lineOf(range.startContainer) !== lineOf(range.endContainer);
}
// Wrap every whole line the selection touches into one block box, inside `flow`
// (the editor or the column/box the selection lives in). A whole-line block
// (columns / another box) counts as one line: the extension neither splits it
// nor reaches past it into a neighbouring line, so framing a columns layout
// boxes exactly that layout — this is how columns get wrapped in a box. Returns
// the new box.
function wrapLinesInBox(flow, range) {
  const kids = Array.from(flow.childNodes);
  let i = topIndex(flow, range.startContainer), j = topIndex(flow, range.endContainer);
  if (i < 0 || j < 0) return null;
  if (i > j) { const t = i; i = j; j = t; }
  while (i > 0 && !isAtomicLine(kids[i]) && !isAtomicLine(kids[i - 1]) && kids[i - 1].nodeName !== 'BR') i--;
  while (j < kids.length - 1 && !isAtomicLine(kids[j]) && !isAtomicLine(kids[j + 1]) && kids[j + 1].nodeName !== 'BR') j++;
  const box = document.createElement('div');
  box.className = 'rule-block-box';
  const ref = kids[j + 1] || null;
  const frag = document.createDocumentFragment();
  for (let k = i; k <= j; k++) frag.appendChild(kids[k]);
  box.appendChild(frag);
  flow.insertBefore(box, ref);
  // The block div supplies its own line break; drop a redundant BR after it.
  if (box.nextSibling && box.nextSibling.nodeName === 'BR') box.parentNode.removeChild(box.nextSibling);
  return box;
}

// ── columns (whole-line blocks laid out side by side) ───────────────────────
const makeBr = () => document.createElement('br');
function enclosingCols(node, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor) { if (isCols(el)) return el; el = el.parentNode; }
  return null;
}
// Wrap the whole lines the selection touches into a columns block, splitting
// into columns on blank lines. A blank line is two <br> with nothing rendered
// between them — but a freshly typed one carries caret scaffolding (a zero-width
// text node, an empty style-holder inline) between the <br>s, so the second <br>
// is found by skipping blank nodes, not by requiring the two to be adjacent.
// Returns the new columns block. Works inside `flow` (the editor or a box the
// selection sits in — so a multi-line selection inside a box becomes columns
// within that box) and treats a nested whole-line block as one line.
function wrapLinesInCols(flow, range) {
  const kids = Array.from(flow.childNodes);
  let i = topIndex(flow, range.startContainer), j = topIndex(flow, range.endContainer);
  if (i < 0 || j < 0) return null;
  if (i > j) { const t = i; i = j; j = t; }
  while (i > 0 && !isAtomicLine(kids[i]) && !isAtomicLine(kids[i - 1]) && kids[i - 1].nodeName !== 'BR') i--;
  while (j < kids.length - 1 && !isAtomicLine(kids[j]) && !isAtomicLine(kids[j + 1]) && kids[j + 1].nodeName !== 'BR') j++;
  const nodes = [];
  for (let k = i; k <= j; k++) nodes.push(kids[k]);
  const ref = kids[j + 1] || null;
  const cols = document.createElement('div');
  cols.className = 'rule-cols';
  let col = document.createElement('div');
  col.className = 'rule-col';
  const pushCol = () => {
    if (col.childNodes.length) cols.appendChild(col);
    col = document.createElement('div');
    col.className = 'rule-col';
  };
  // A node that renders nothing and isn't itself a line break — caret
  // scaffolding the browser leaves between the two <br>s of a blank line.
  const isFiller = (node) => node && node.nodeName !== 'BR' && isBlank(node);
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    if (node.nodeName === 'BR') {
      // A second <br>, possibly with only filler between it and this one, marks
      // a blank line = column break. Look past the filler to find it.
      let p = n + 1;
      while (isFiller(nodes[p])) p++;
      if (nodes[p] && nodes[p].nodeName === 'BR') {
        pushCol();
        for (let q = n; q <= p; q++) nodes[q].remove(); // both <br>s + the filler
        n = p;
        // Consume any further blank lines (extra <br>/filler runs) between cols.
        while (nodes[n + 1] && (nodes[n + 1].nodeName === 'BR' || isFiller(nodes[n + 1]))) {
          n++; nodes[n].remove();
        }
        continue;
      }
    }
    col.appendChild(node);
  }
  pushCol();
  if (!cols.children.length) return null; // nothing to lay out
  flow.insertBefore(cols, ref);
  // The block supplies its own break; drop any blank line left right after it.
  while (cols.nextSibling && cols.nextSibling.nodeName === 'BR') cols.parentNode.removeChild(cols.nextSibling);
  return cols;
}
function unwrapCols(editor, cols) {
  const p = cols.parentNode;
  if (cols.previousSibling && cols.previousSibling.nodeName !== 'BR') p.insertBefore(makeBr(), cols);
  Array.from(cols.children).filter(isCol).forEach((col, ci) => {
    if (ci > 0) { p.insertBefore(makeBr(), cols); p.insertBefore(makeBr(), cols); } // blank line between
    while (col.firstChild) p.insertBefore(col.firstChild, cols);
  });
  if (cols.nextSibling && cols.nextSibling.nodeName !== 'BR') p.insertBefore(makeBr(), cols);
  p.removeChild(cols);
}

// Enter-to-escape a block. A block (columns / box) can trap the caret: pressing
// Enter inside a column just grows the column. Instead, a double Enter breaks
// out — the first Enter drops an empty line, the second (on that empty line)
// exits the block to a normal line below it (or above, at the top edge). This
// is how you write text before/after a block, and how a whole-rule columns
// block stops being a trap.
function blockFlowAt(editor, node) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  let flow = null, block = null;
  while (el && el !== editor) {
    if (isCol(el)) flow = el;
    if (isCols(el) || isBox(el)) { block = el; break; }
    el = el.parentNode;
  }
  if (!block) return null;
  return { block, flow: flow || block };
}
// A node renders nothing if it's a <br>, an empty/zero-width text node, or an
// empty inline element (the browser leaves an empty <strong> "style holder"
// after a break next to bold text).
function isBlank(n) {
  if (!n) return true;
  if (n.nodeName === 'BR') return true;
  // A divider / table renders no text but is real content, never blank scaffolding.
  if (n.nodeName === 'HR' || n.nodeName === 'TABLE') return false;
  if (n.nodeType === Node.TEXT_NODE) return n.textContent.replace(/\u200B/g, '') === '';
  if (n.nodeType === Node.ELEMENT_NODE) return n.textContent.replace(/\u200B/g, '') === '' && !n.querySelector('br, img');
  return false;
}
// Does the flow end / start with a <br> once trailing / leading blank (non-br)
// nodes are skipped? That is the empty-line state a second Enter escapes from.
function endsWithBreak(flow) {
  let n = flow.lastChild;
  while (n && n.nodeName !== 'BR' && isBlank(n)) n = n.previousSibling;
  return !!n && n.nodeName === 'BR';
}
function startsWithBreak(flow) {
  let n = flow.firstChild;
  while (n && n.nodeName !== 'BR' && isBlank(n)) n = n.nextSibling;
  return !!n && n.nodeName === 'BR';
}
function atEmptyLastLine(flow, range) {
  const r = document.createRange();
  r.selectNodeContents(flow);
  try { r.setStart(range.endContainer, range.endOffset); } catch { return false; }
  return r.toString().replace(/\u200B/g, '') === '' && endsWithBreak(flow);
}
function atEmptyFirstLine(flow, range) {
  const r = document.createRange();
  r.selectNodeContents(flow);
  try { r.setEnd(range.startContainer, range.startOffset); } catch { return false; }
  return r.toString().replace(/\u200B/g, '') === '' && startsWithBreak(flow);
}
function tryEscapeBlock(editor) {
  const sel = window.getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const bf = blockFlowAt(editor, range.startContainer);
  if (!bf) return false;
  const { block, flow } = bf;
  // Land the caret in a dedicated block-level line OUTSIDE the block's flex, so
  // typing there can never reflow the columns.
  const landIn = (holder) => {
    const r = document.createRange();
    r.setStart(holder, 0); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  };
  if (atEmptyLastLine(flow, range)) {
    while (isBlank(flow.lastChild) && flow.lastChild) flow.lastChild.remove();
    while (block.nextSibling && isBlank(block.nextSibling)) block.nextSibling.remove();
    const next = block.nextSibling;
    if (next && next.nodeName !== 'BR') landIn(next); // real line already there
    else {
      const holder = document.createElement('div');
      holder.appendChild(makeBr());
      editor.insertBefore(holder, block.nextSibling);
      landIn(holder);
    }
    return true;
  }
  if (atEmptyFirstLine(flow, range)) {
    while (isBlank(flow.firstChild) && flow.firstChild) flow.firstChild.remove();
    while (block.previousSibling && isBlank(block.previousSibling)) block.previousSibling.remove();
    const holder = document.createElement('div');
    holder.appendChild(makeBr());
    editor.insertBefore(holder, block);
    landIn(holder);
    return true;
  }
  return false;
}

// The line's flow container: the editor, or a column / box the caret sits in.
function lineFlow(editor, node) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor && !isCol(el) && !isBox(el)) el = el.parentNode;
  return el || editor;
}
// Insert a line break that breaks OUT of any inline formatting (bold / box /
// mark), so the new line isn't bold and the markers close on the line we left
// (the two-** bleed the user spotted). The caret lands in a fresh plain text
// node so typing doesn't inherit the bold style of the line above.
function insertBreakOutOfInline(editor) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const flow = lineFlow(editor, range.startContainer);
  const br = makeBr();
  range.insertNode(br);
  // Bubble the br up to the flow level, splitting each inline wrapper so the
  // content before it stays wrapped and the content after moves to a clone.
  const hasReal = (n) => n.textContent.replace(/\u200B/g, '').trim() !== '';
  while (br.parentNode && br.parentNode !== flow) {
    const parent = br.parentNode;
    const after = document.createElement(parent.tagName);
    if (parent.className) after.className = parent.className;
    let sib = br.nextSibling;
    while (sib) { const nx = sib.nextSibling; after.appendChild(sib); sib = nx; }
    parent.parentNode.insertBefore(br, parent.nextSibling);
    // Re-wrap the trailing content only when it actually holds text. An empty
    // clone (the caret sat at the wrapper's end, so the "after" is just a
    // zero-width space or a browser style-holder) would render as a stray
    // formatted island on the new line — the yellow ==mark== sliver bug.
    if (hasReal(after)) parent.parentNode.insertBefore(after, br.nextSibling);
    if (!hasReal(parent) && !parent.querySelector('br, img')) parent.remove();
  }
  const zwsp = document.createTextNode('\u200B');
  br.parentNode.insertBefore(zwsp, br.nextSibling);
  const r = document.createRange();
  r.setStart(zwsp, 1); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
  stripEmptyInlineFormats(editor);
}

// Safety net: remove any empty bold / italic / box / mark wrapper left in the
// editor (an outline or a yellow ==mark== sliver around nothing). The caret
// lives in a plain zero-width text node at flow level, never inside one of
// these, so clearing them never strands the caret.
function stripEmptyInlineFormats(editor) {
  editor.querySelectorAll('mark.rule-mark, span.rule-box, strong, b, em, i').forEach((el) => {
    if (el.textContent.replace(/\u200B/g, '').trim() === '' && !el.querySelector('br, img')) el.remove();
  });
}

// Typing "- " at the START of a line turns it into a bullet item on the spot:
// the dash becomes "• " so the line reads as a list item live (the read view
// then hangs the wrapped text under the first letter). It fires only when the
// dash is the first thing on its line — so a mid-line "hacer - hecho" separator
// is left alone — and works inside columns/boxes too, since it only rewrites the
// caret's own text node. Returns true when it converted (the space is swallowed).
function tryBulletConvert(editor) {
  const sel = window.getSelection();
  if (!sel.rangeCount || !sel.isCollapsed) return false;
  const tn = sel.getRangeAt(0).startContainer;
  const off = sel.getRangeAt(0).startOffset;
  if (!editor.contains(tn) || tn.nodeType !== Node.TEXT_NODE) return false;
  if (off < 1 || tn.textContent[off - 1] !== '-') return false;
  // Only blank caret scaffolding may precede the dash on this line.
  if (tn.textContent.slice(0, off - 1).replace(/\u200B/g, '').trim() !== '') return false;
  let p = tn.previousSibling;
  while (p && p.nodeName !== 'BR' && isBlank(p)) p = p.previousSibling;
  if (p && p.nodeName !== 'BR') return false; // real content earlier on the line
  tn.textContent = '• ' + tn.textContent.slice(off); // drop dash + leading blanks
  const r = document.createRange();
  r.setStart(tn, 2); r.collapse(true); // caret after "• "
  sel.removeAllRanges(); sel.addRange(r);
  return true;
}

// ── Editable-table mechanics (spreadsheet-like) ─────────────────────────────
// The <table> lives at the editor's top level. Every cell is a <td> (the header
// look comes from CSS on the first row), so adding or deleting rows never has to
// re-tag cells. Navigation and row/column edits below all operate on the live
// DOM; the caller serializes + snapshots afterwards.
function enclosingCell(node, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor) {
    if (el.tagName === 'TD' || el.tagName === 'TH') return el;
    el = el.parentNode;
  }
  return null;
}
const tableRows = (table) => Array.from(table.querySelectorAll('tr'));
const cellCount = (tr) => Array.from(tr.children).filter((x) => x.tagName === 'TD' || x.tagName === 'TH').length;
function cellPos(cell) {
  const tr = cell.parentNode;
  const table = tr.closest('table');
  const rows = tableRows(table);
  return { table, rows, tr, r: rows.indexOf(tr), c: Array.from(tr.children).indexOf(cell) };
}
// A fresh empty cell carries a <br> so the caret can enter it; the <br>
// serializes back to nothing (see cellMarkers).
function makeCell() {
  const td = document.createElement('td');
  td.appendChild(document.createElement('br'));
  return td;
}
function caretToEnd(node) {
  if (!node) return;
  const r = document.createRange();
  r.selectNodeContents(node); r.collapse(false);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
}
function caretToStart(node) {
  if (!node) return;
  const r = document.createRange();
  r.selectNodeContents(node); r.collapse(true);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
}
// Is the collapsed caret at the very start of its cell? (Used so Backspace at a
// cell's edge hops to the previous cell instead of letting the browser merge
// cells and wreck the table.)
function caretAtCellStart(cell, range) {
  const r = document.createRange();
  r.selectNodeContents(cell);
  try { r.setEnd(range.startContainer, range.startOffset); } catch { return false; }
  return r.toString().replace(/\u200B/g, '') === '';
}
// Insert an empty row after `tr`, matching the table's column count; returns it.
function insertRowAfter(table, tr) {
  const cols = cellCount(tableRows(table)[0] || tr);
  const nr = document.createElement('tr');
  for (let c = 0; c < cols; c++) nr.appendChild(makeCell());
  tr.parentNode.insertBefore(nr, tr.nextSibling);
  return nr;
}
// Insert an empty cell after column `c` in every row.
function insertColAfter(table, c) {
  tableRows(table).forEach((tr) => {
    const ref = tr.children[c];
    tr.insertBefore(makeCell(), ref ? ref.nextSibling : null);
  });
}

export default function RuleEditor({ editKey, initialValue, onChange, onSubmit, placeholder }) {
  const { t } = useLang();
  const ref = useRef(null);
  const [bar, setBar] = useState(null);   // { x, y } floating format toolbar
  const [block, setBlock] = useState(null); // { x, y } block-insert menu
  const [tableUi, setTableUi] = useState(null); // { x, y } table controls (caret in a cell)

  // ── Undo / redo ──────────────────────────────────────────────────────────
  // The native browser undo is unusable here: we mutate the DOM directly (block
  // wrapping, line breaks, bullet conversion) instead of via execCommand, which
  // corrupts its history. So we keep our own: a stack of innerHTML snapshots.
  // Rapid typing coalesces into ~one checkpoint per COALESCE_MS so a single
  // Ctrl+Z steps back a word-ish chunk, while each block op is its own step.
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const lastHtml = useRef('');       // last committed innerHTML (the redo/undo pivot)
  const lastPushTs = useRef(0);
  const MAX_HISTORY = 200;
  const COALESCE_MS = 400;
  // Force the NEXT emit to start a fresh undo step (used before block ops so they
  // never fold into a preceding typing burst).
  const checkpoint = () => { lastPushTs.current = 0; };

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      el.innerHTML = markersToHtml(initialValue);
      lastHtml.current = el.innerHTML;
      undoStack.current = [];
      redoStack.current = [];
      lastPushTs.current = 0;
    }
  }, [editKey]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html !== lastHtml.current) {
      const now = Date.now();
      if (now - lastPushTs.current > COALESCE_MS) {
        undoStack.current.push(lastHtml.current);
        if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
        lastPushTs.current = now;
      }
      redoStack.current = []; // any fresh edit invalidates the redo branch
      lastHtml.current = html;
    }
    onChange(domToMarkers(el));
  };

  const placeCaretEnd = (el) => {
    try {
      const r = document.createRange();
      r.selectNodeContents(el); r.collapse(false);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch { /* selection may be unavailable — ignore */ }
  };
  const restore = (html) => {
    const el = ref.current;
    if (el == null) return;
    el.innerHTML = html;
    lastHtml.current = html;
    lastPushTs.current = 0;
    el.focus();
    placeCaretEnd(el);
    onChange(domToMarkers(el));
    setBar(null);
  };
  const undo = () => {
    if (!undoStack.current.length) return;
    redoStack.current.push(lastHtml.current);
    restore(undoStack.current.pop());
  };
  const redo = () => {
    if (!redoStack.current.length) return;
    undoStack.current.push(lastHtml.current);
    restore(redoStack.current.pop());
  };

  const liveSelection = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const el = ref.current;
    if (!el || !el.contains(sel.anchorNode) || !el.contains(sel.focusNode)) return null;
    return sel;
  };

  const syncToolbar = () => {
    const sel = liveSelection();
    if (!sel) { setBar(null); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { setBar(null); return; }
    setBar({ x: rect.left + rect.width / 2, y: rect.top });
  };

  // Table controls: shown whenever the caret sits inside a table cell (collapsed
  // or not), anchored to the table's top-left. Kept separate from the format bar
  // so it also appears with just a caret, not only on a selection.
  const syncTableUi = () => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)) { setTableUi(null); return; }
    const cell = enclosingCell(sel.anchorNode, el);
    if (!cell) { setTableUi(null); return; }
    const rect = cell.closest('table').getBoundingClientRect();
    setTableUi({ x: rect.left, y: rect.top });
  };
  const syncBars = () => { syncToolbar(); syncTableUi(); };

  useEffect(() => {
    const onSel = () => syncBars();
    document.addEventListener('selectionchange', onSel);
    const hide = () => { setBar(null); setTableUi(null); };
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    // Undo / redo (native history is broken here — see the undo stack above).
    // Match by physical key (e.code) so it fires on any layout — on a Cyrillic
    // layout Ctrl+Z reports e.key='я', not 'z'.
    const isZ = e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z';
    const isY = e.code === 'KeyY' || e.key === 'y' || e.key === 'Y';
    if (mod && isZ) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (mod && !e.shiftKey && isY) { e.preventDefault(); redo(); return; }
    if (e.key === 'Enter' && mod) { e.preventDefault(); onSubmit?.(); return; }

    // ── Spreadsheet keys, only when the caret is inside a table cell ──────────
    const cell = enclosingCell(window.getSelection().anchorNode, ref.current);
    if (cell) {
      const { table, rows, r, c } = cellPos(cell);
      if (e.key === 'Tab') {
        e.preventDefault(); checkpoint();
        if (!e.shiftKey) {
          // Next cell → next row's first cell → a brand-new row at the end.
          if (c < cellCount(cell.parentNode) - 1) caretToEnd(cell.parentNode.children[c + 1]);
          else if (r < rows.length - 1) caretToEnd(rows[r + 1].children[0]);
          else caretToEnd(insertRowAfter(table, cell.parentNode).children[0]);
        } else {
          if (c > 0) caretToEnd(cell.parentNode.children[c - 1]);
          else if (r > 0) caretToEnd(rows[r - 1].children[rows[r - 1].children.length - 1]);
        }
        emit(); syncBars();
        return;
      }
      if (e.key === 'Enter') {
        // Enter moves down a row (Excel-style); on the last row it grows the
        // table. Cells stay single-line, so no in-cell line breaks.
        e.preventDefault(); checkpoint();
        const below = r < rows.length - 1 ? rows[r + 1] : insertRowAfter(table, cell.parentNode);
        caretToEnd(below.children[c] || below.children[0]);
        emit(); syncBars();
        return;
      }
      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        // At a cell's start, hop to the previous cell instead of letting the
        // browser merge cells and corrupt the table structure.
        if (sel.isCollapsed && caretAtCellStart(cell, sel.getRangeAt(0))) {
          e.preventDefault();
          if (c > 0) caretToEnd(cell.parentNode.children[c - 1]);
          else if (r > 0) caretToEnd(rows[r - 1].children[rows[r - 1].children.length - 1]);
          syncBars();
          return;
        }
      }
    }

    if (e.key === ' ' && tryBulletConvert(ref.current)) { e.preventDefault(); checkpoint(); emit(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Double Enter on an empty line inside a block breaks out of it; otherwise
      // a line break that steps out of any bold/box/mark so the new line is plain.
      checkpoint(); // a line break / block escape is its own undo step
      if (!tryEscapeBlock(ref.current)) insertBreakOutOfInline(ref.current);
      emit();
      return;
    }
    if (e.key === 'Backspace') {
      // On an empty edge line inside a block, Backspace breaks out too (a quick
      // alternative to the second Enter, from any column). Elsewhere it deletes.
      const sel = window.getSelection();
      if (sel.isCollapsed && tryEscapeBlock(ref.current)) { e.preventDefault(); checkpoint(); emit(); }
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    checkpoint(); // a paste is its own undo step
    document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '');
    emit();
  };

  const onContextMenu = (e) => {
    if (liveSelection()) return; // selection → floating bar covers formatting
    e.preventDefault();
    ref.current?.focus();
    setBlock({ x: e.clientX, y: e.clientY });
  };
  // A right-click in empty space doesn't place the caret, so execCommand-based
  // inserts had nothing to insert into and silently no-op'd. Guarantee a caret
  // inside the editor (falling back to its end) before any insert.
  const ensureCaret = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) placeCaretEnd(el);
  };
  // The top-level child of the editor that currently holds the caret, so a block
  // can be dropped on its own line right after it (never nested inside inline
  // formatting). Null when the editor is empty / the caret is loose.
  const caretTopNode = () => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) return null;
    let n = sel.getRangeAt(0).startContainer;
    while (n && n.parentNode !== el) n = n.parentNode;
    return n && n.parentNode === el ? n : null;
  };
  // Drop a real <hr> divider on its own line at the caret, so it shows as the
  // finished line at once (like the table), then land the caret on a plain line
  // right after it to keep typing.
  const insertDivider = () => {
    const el = ref.current;
    ensureCaret();
    checkpoint(); // inserting a divider is its own undo step
    const hr = document.createElement('hr');
    hr.className = 'rule-hr';
    const top = caretTopNode();
    if (top) el.insertBefore(hr, top.nextSibling);
    else el.appendChild(hr);
    // A plain line after the divider to click/type into.
    if (!hr.nextSibling || hr.nextSibling.nodeName !== 'DIV') {
      const holder = document.createElement('div');
      holder.appendChild(document.createElement('br'));
      el.insertBefore(holder, hr.nextSibling);
    }
    const after = hr.nextSibling;
    const r = document.createRange();
    r.setStart(after, 0); r.collapse(true);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    setBlock(null);
    emit();
    syncBars();
  };
  // Drop a fresh editable table (2×2, header + one row) at the caret's line and
  // land the caret in its first cell.
  const insertTable = () => {
    const el = ref.current;
    ensureCaret();
    checkpoint();
    // Seed the header row with placeholder text and leave one empty data row.
    // A fully-empty table can't round-trip (` | ` lines collapse on reload), and
    // a header row is the spreadsheet-standard starting point anyway.
    const table = document.createElement('table');
    table.className = 'rule-table rule-table--edit';
    const tbody = document.createElement('tbody');
    const headTexts = [t('reglas.tableColHead', { n: 1 }), t('reglas.tableColHead', { n: 2 })];
    const head = document.createElement('tr');
    headTexts.forEach((txt) => { const td = document.createElement('td'); td.textContent = txt; head.appendChild(td); });
    tbody.appendChild(head);
    const body = document.createElement('tr');
    body.appendChild(makeCell());
    body.appendChild(makeCell());
    tbody.appendChild(body);
    table.appendChild(tbody);
    const top = caretTopNode();
    if (top) el.insertBefore(table, top.nextSibling);
    else el.appendChild(table);
    // Ensure there's a plain line after the table to click/type into.
    if (!table.nextSibling || table.nextSibling.nodeName !== 'DIV') {
      const holder = document.createElement('div');
      holder.appendChild(document.createElement('br'));
      el.insertBefore(holder, table.nextSibling);
    }
    // Select the first header cell so typing replaces the placeholder at once.
    const first = table.querySelector('td');
    const sr = document.createRange();
    sr.selectNodeContents(first);
    const ssel = window.getSelection(); ssel.removeAllRanges(); ssel.addRange(sr);
    setBlock(null);
    emit();
    syncBars();
  };
  useEffect(() => {
    if (!block) return;
    // A mousedown INSIDE the menu must not close it: closing on that same
    // mousedown unmounts the button before its click fires, so "Tabla" / the
    // divider never ran (the "nothing happens" bug). Only an outside click closes.
    const close = (e) => { if (e?.target?.closest?.('.rule-ctx-menu')) return; setBlock(null); };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [block]);

  // Toggle a format on the current selection, live. The box button is smart:
  // a selection inside a box removes it; a multi-line selection makes a big
  // block box; otherwise it frames the word inline.
  const runFormat = (kind) => {
    const el = ref.current;
    const sel = liveSelection();
    if (!el || !sel) return;
    const range = sel.getRangeAt(0);
    const cac = range.commonAncestorContainer;
    // Nothing but whitespace selected → there is nothing to frame or mark, so
    // don't create an empty box/mark/block (the stray-outline bug). Unwrapping
    // an existing box still works: those always hold real text.
    if (isEmptyContent(sel.toString()) && !enclosingBox(cac, el)
        && !enclosingCols(cac, el)) return;
    checkpoint(); // a box/mark/cols toggle is its own undo step
    // The flow the selection lives in: the editor, or the column / box it sits
    // inside. Boxing and columns act within that flow, so a box can be drawn
    // around columns, and columns can be made inside a box — the two combine.
    const flow = lineFlow(el, cac);
    let selectAfter = null;
    if (kind === 'box') {
      const box = enclosingBox(cac, el);
      if (box) unwrapBox(el, box);
      // Multi-line selection, or a selection landing on a whole-line block
      // (e.g. an existing columns layout): frame it as a block box.
      else if (isMultiLine(flow, range) || coversBlock(flow, range)) selectAfter = wrapLinesInBox(flow, range);
      else inlineToggle(el, range, 'box');
    } else if (kind === 'cols') {
      const cols = enclosingCols(cac, el);
      if (cols) unwrapCols(el, cols);
      else if (isMultiLine(flow, range)) selectAfter = wrapLinesInCols(flow, range);
      // single-line selection: columns need several lines — do nothing
    } else {
      inlineToggle(el, range, kind);
    }
    el.normalize();
    if (selectAfter) {
      sel.removeAllRanges();
      const nr = document.createRange();
      nr.selectNodeContents(selectAfter);
      sel.addRange(nr);
    }
    emit();
    syncToolbar();
  };

  const btn = (kind, label, glyph) => (
    <button
      type="button"
      className="rule-fmt-btn"
      onMouseDown={(e) => e.preventDefault()} // keep the selection on press
      onClick={() => runFormat(kind)}
      aria-label={label}
      title={label}
    >
      {glyph}
    </button>
  );

  // Run a table edit on the cell the caret is in, then serialize + snapshot.
  // onMouseDown-preventDefault on the buttons keeps the caret in that cell.
  const withCell = (fn) => {
    const el = ref.current;
    const cell = el && enclosingCell(window.getSelection().anchorNode, el);
    if (!cell) return;
    el.focus();
    checkpoint(); // each row/column edit is its own undo step
    fn(cell);
    emit();
    syncBars();
  };
  const addRow = () => withCell((cell) => {
    const { table, tr, c } = cellPos(cell);
    const nr = insertRowAfter(table, tr);
    caretToEnd(nr.children[c] || nr.children[0]);
  });
  const addCol = () => withCell((cell) => {
    const { table, c } = cellPos(cell);
    insertColAfter(table, c);
    caretToEnd(cell.nextSibling); // the new cell sits right after this one
  });
  const delRow = () => withCell((cell) => {
    const { table, rows, tr, r, c } = cellPos(cell);
    if (rows.length <= 1) { removeTable(table); return; }
    tr.remove();
    const target = rows[r + 1] || rows[r - 1];
    caretToEnd(target.children[Math.min(c, target.children.length - 1)]);
  });
  const delCol = () => withCell((cell) => {
    const { table, tr, c } = cellPos(cell);
    // A table needs ≥2 columns to survive as pipe text (one `|`); below that,
    // drop the whole table rather than leave an unrepresentable single column.
    if (cellCount(tableRows(table)[0]) <= 2) { removeTable(table); return; }
    tableRows(table).forEach((row) => { if (row.children[c]) row.children[c].remove(); });
    caretToEnd(tr.children[Math.min(c, tr.children.length - 1)]);
  });
  // Replace the table with an empty line and drop the toolbar.
  const removeTable = (table) => {
    const holder = document.createElement('div');
    holder.appendChild(document.createElement('br'));
    table.parentNode.insertBefore(holder, table);
    table.remove();
    caretToStart(holder);
    setTableUi(null);
  };

  const tblBtn = (label, onClick, glyph) => (
    <button
      type="button"
      className="rule-fmt-btn"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {glyph}
    </button>
  );

  return (
    <>
      <div
        ref={ref}
        className="rule-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => { emit(); syncTableUi(); }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onKeyUp={syncBars}
        onMouseUp={syncBars}
        onContextMenu={onContextMenu}
        onBlur={() => { setBar(null); setTableUi(null); }}
      />
      {bar && (
        <div
          className="rule-fmt-bar"
          style={{ top: bar.y, left: bar.x }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {btn('heading', t('reglas.heading'), <span className="rule-fmt-h">H</span>)}
          {btn('bold', t('reglas.bold'), <span className="rule-fmt-b">B</span>)}
          {btn('italic', t('reglas.italic'), <span className="rule-fmt-i">I</span>)}
          {btn('box', t('reglas.box'), <span className="rule-fmt-box" aria-hidden="true" />)}
          {btn('mark', t('reglas.mark'), <span className="rule-fmt-mark" aria-hidden="true" />)}
          {btn('cols', t('reglas.cols'), <span className="rule-fmt-cols" aria-hidden="true"><i /><i /></span>)}
        </div>
      )}
      {tableUi && (
        <div
          className="rule-fmt-bar rule-table-bar"
          style={{ top: tableUi.y, left: tableUi.x }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {tblBtn(t('reglas.rowAdd'), addRow, <span className="rule-tbi rule-tbi-rows"><i /><b>+</b></span>)}
          {tblBtn(t('reglas.rowDel'), delRow, <span className="rule-tbi rule-tbi-rows"><i /><b>−</b></span>)}
          {tblBtn(t('reglas.colAdd'), addCol, <span className="rule-tbi rule-tbi-cols"><i /><b>+</b></span>)}
          {tblBtn(t('reglas.colDel'), delCol, <span className="rule-tbi rule-tbi-cols"><i /><b>−</b></span>)}
        </div>
      )}
      {block && (
        <div className="rule-ctx-menu" style={{ position: 'fixed', top: block.y, left: block.x }}>
          <button className="rule-ctx-item" onMouseDown={(e) => e.preventDefault()}
            onClick={insertTable}>
            <span className="rule-ctx-glyph" aria-hidden="true">▦</span>
            <span>{t('reglas.table')}</span>
          </button>
          <button className="rule-ctx-item" onMouseDown={(e) => e.preventDefault()}
            onClick={insertDivider}>
            <span className="rule-ctx-glyph" aria-hidden="true">—</span>
            <span>{t('reglas.divider')}</span>
          </button>
        </div>
      )}
    </>
  );
}
