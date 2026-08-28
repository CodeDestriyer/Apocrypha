import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';

// WYSIWYG body editor for a rule. The stored value is the same marker format
// the read view uses so search, Supabase and renderRuleBody stay untouched —
// but here formatting is shown live: click "bold" on a selection and the text
// is bold immediately, no asterisks.
//
// Inline markers: **bold**, [[box]] (a small frame around a word), ==mark==.
// Block marker: a fenced [[[ … ]]] on their own lines is a big frame drawn
// around whole lines (a "main rule" callout), produced by the box button when
// the selection spans several lines.
//
// The contentEditable is UNCONTROLLED: its HTML is seeded once on mount and
// never re-set from React, so the caret is never blown away. On every input we
// serialize the DOM back to markers and hand them up via onChange.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// One logical line's markers → inline HTML. Mirrors renderRich(), including its
// recursion so nested markers (e.g. bold inside a mark, `==**x**==`) seed as
// nested elements rather than literal ** text.
function inlineToHtml(text) {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==/g;
  let out = '', last = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out += esc(str.slice(last, m.index));
    if (m[1] !== undefined) out += `<strong>${inlineToHtml(m[1])}</strong>`;
    else if (m[2] !== undefined) out += `<span class="rule-box">${inlineToHtml(m[2])}</span>`;
    else out += `<mark class="rule-mark">${inlineToHtml(m[3])}</mark>`;
    last = m.index + m[0].length;
  }
  if (last < str.length) out += esc(str.slice(last));
  return out;
}

// Full marker string → editor HTML. Normal lines are joined by <br>; a
// [[[ … ]]] fence becomes a <div class="rule-block-box"> and a [[[cols … ]]]
// fence (columns split by ||| lines) a <div class="rule-cols"> of columns.
// Blocks carry no surrounding <br> so the round-trip through domToMarkers is
// stable.
export function markersToHtml(text) {
  const lines = String(text ?? '').split('\n');
  let html = '', i = 0;
  const run = [];
  const flushRun = () => { if (run.length) { html += run.map(inlineToHtml).join('<br>'); run.length = 0; } };
  while (i < lines.length) {
    if (lines[i] === '[[[cols') {
      flushRun();
      i++;
      const cols = []; let col = [];
      while (i < lines.length && lines[i] !== ']]]') {
        if (lines[i] === '|||') { cols.push(col); col = []; } else col.push(lines[i]);
        i++;
      }
      cols.push(col);
      i++; // skip ]]]
      html += `<div class="rule-cols">${cols.map((c) =>
        `<div class="rule-col">${c.map(inlineToHtml).join('<br>')}</div>`).join('')}</div>`;
    } else if (lines[i] === '[[[') {
      flushRun();
      i++;
      const inner = [];
      while (i < lines.length && lines[i] !== ']]]') { inner.push(lines[i]); i++; }
      i++; // skip ]]]
      html += `<div class="rule-block-box">${inner.map(inlineToHtml).join('<br>')}</div>`;
    } else { run.push(lines[i]); i++; }
  }
  flushRun();
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
    if (c.nodeType === Node.TEXT_NODE) { s += c.textContent.replace(/​/g, ''); return; }
    if (c.nodeType !== Node.ELEMENT_NODE) return;
    const tag = c.tagName;
    if (tag === 'BR') { s += '\n'; return; }
    const inner = inlineSerialize(c);
    if (tag === 'STRONG' || tag === 'B') s += wrapInline(inner, '**', '**');
    else if (c.classList.contains('rule-box')) s += wrapInline(inner, '[[', ']]');
    else if (tag === 'MARK' || c.classList.contains('rule-mark')) s += wrapInline(inner, '==', '==');
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

// Editor DOM → marker string. Block boxes become [[[ … ]]] fences and column
// layouts [[[cols … ]]] fences (columns separated by |||) on their own lines;
// everything else is inline content split into lines by <br>.
function domToMarkers(root) {
  const out = [];
  let cur = '';
  const flush = () => { out.push(cur); cur = ''; };
  root.childNodes.forEach((c) => {
    if (isCols(c)) {
      if (cur !== '') flush();
      out.push('[[[cols');
      Array.from(c.children).filter(isCol).forEach((col, ci) => {
        if (ci > 0) out.push('|||');
        inlineSerialize(col).split('\n').forEach((l) => out.push(l));
      });
      out.push(']]]');
    } else if (isBox(c)) {
      if (cur !== '') flush();
      out.push('[[[');
      inlineSerialize(c).split('\n').forEach((l) => out.push(l));
      out.push(']]]');
    } else if (c.nodeType === Node.ELEMENT_NODE && c.tagName === 'BR') {
      flush();
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
  });
  if (cur !== '' || out.length === 0) out.push(cur);
  return out.join('\n');
}

// ── inline formatting (bold / box / mark) within a single line ──────────────
const KIND_TAG = { bold: 'STRONG', box: 'SPAN', mark: 'MARK' };
const KIND_CLASS = { box: 'rule-box', mark: 'rule-mark' };

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
function topIndex(editor, container) {
  let n = container;
  while (n && n.parentNode !== editor) n = n.parentNode;
  return Array.from(editor.childNodes).indexOf(n);
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
// The selection spans more than one visual line at the editor's top level.
function isMultiLine(editor, range) {
  const kids = Array.from(editor.childNodes);
  const lineOf = (container) => {
    const idx = topIndex(editor, container);
    let ln = 0;
    for (let k = 0; k < idx; k++) if (kids[k].nodeName === 'BR') ln++;
    return ln;
  };
  return lineOf(range.startContainer) !== lineOf(range.endContainer);
}
// Wrap every whole line the selection touches into one block box. Returns it.
function wrapLinesInBox(editor, range) {
  const kids = Array.from(editor.childNodes);
  let i = topIndex(editor, range.startContainer), j = topIndex(editor, range.endContainer);
  if (i < 0 || j < 0) return null;
  if (i > j) { const t = i; i = j; j = t; }
  while (i > 0 && kids[i - 1].nodeName !== 'BR') i--;
  while (j < kids.length - 1 && kids[j + 1].nodeName !== 'BR') j++;
  const box = document.createElement('div');
  box.className = 'rule-block-box';
  const ref = kids[j + 1] || null;
  const frag = document.createDocumentFragment();
  for (let k = i; k <= j; k++) frag.appendChild(kids[k]);
  box.appendChild(frag);
  editor.insertBefore(box, ref);
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
// into columns on blank lines (a blank line = two consecutive <br>). Returns it.
function wrapLinesInCols(editor, range) {
  const kids = Array.from(editor.childNodes);
  let i = topIndex(editor, range.startContainer), j = topIndex(editor, range.endContainer);
  if (i < 0 || j < 0) return null;
  if (i > j) { const t = i; i = j; j = t; }
  while (i > 0 && kids[i - 1].nodeName !== 'BR') i--;
  while (j < kids.length - 1 && kids[j + 1].nodeName !== 'BR') j++;
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
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    if (node.nodeName === 'BR' && nodes[n + 1] && nodes[n + 1].nodeName === 'BR') {
      // blank line = column break: drop this and the following separator BRs
      pushCol();
      node.remove(); n++; nodes[n].remove();
      while (nodes[n + 1] && nodes[n + 1].nodeName === 'BR') { n++; nodes[n].remove(); }
      continue;
    }
    col.appendChild(node);
  }
  pushCol();
  if (!cols.children.length) return null; // nothing to lay out
  editor.insertBefore(cols, ref);
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
  if (n.nodeType === Node.TEXT_NODE) return n.textContent.replace(/​/g, '') === '';
  if (n.nodeType === Node.ELEMENT_NODE) return n.textContent.replace(/​/g, '') === '' && !n.querySelector('br, img');
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
  return r.toString().replace(/​/g, '') === '' && endsWithBreak(flow);
}
function atEmptyFirstLine(flow, range) {
  const r = document.createRange();
  r.selectNodeContents(flow);
  try { r.setEnd(range.startContainer, range.startOffset); } catch { return false; }
  return r.toString().replace(/​/g, '') === '' && startsWithBreak(flow);
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
  while (br.parentNode && br.parentNode !== flow) {
    const parent = br.parentNode;
    const after = document.createElement(parent.tagName);
    if (parent.className) after.className = parent.className;
    let sib = br.nextSibling;
    while (sib) { const nx = sib.nextSibling; after.appendChild(sib); sib = nx; }
    parent.parentNode.insertBefore(br, parent.nextSibling);
    if (after.childNodes.length) parent.parentNode.insertBefore(after, br.nextSibling);
    if (!parent.childNodes.length) parent.remove();
  }
  const zwsp = document.createTextNode('​');
  br.parentNode.insertBefore(zwsp, br.nextSibling);
  const r = document.createRange();
  r.setStart(zwsp, 1); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
}

export default function RuleEditor({ editKey, initialValue, onChange, onSubmit, placeholder }) {
  const { t } = useLang();
  const ref = useRef(null);
  const [bar, setBar] = useState(null);   // { x, y } floating format toolbar
  const [block, setBlock] = useState(null); // { x, y } block-insert menu

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.innerHTML = markersToHtml(initialValue);
  }, [editKey]);

  const emit = () => { if (ref.current) onChange(domToMarkers(ref.current)); };

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

  useEffect(() => {
    const onSel = () => syncToolbar();
    document.addEventListener('selectionchange', onSel);
    const hide = () => setBar(null);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSubmit?.(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      // Double Enter on an empty line inside a block breaks out of it; otherwise
      // a line break that steps out of any bold/box/mark so the new line is plain.
      if (!tryEscapeBlock(ref.current)) insertBreakOutOfInline(ref.current);
      emit();
      return;
    }
    if (e.key === 'Backspace') {
      // On an empty edge line inside a block, Backspace breaks out too (a quick
      // alternative to the second Enter, from any column). Elsewhere it deletes.
      const sel = window.getSelection();
      if (sel.isCollapsed && tryEscapeBlock(ref.current)) { e.preventDefault(); emit(); }
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData?.getData('text/plain') ?? '');
    emit();
  };

  const onContextMenu = (e) => {
    if (liveSelection()) return; // selection → floating bar covers formatting
    e.preventDefault();
    ref.current?.focus();
    setBlock({ x: e.clientX, y: e.clientY });
  };
  const insertBlock = (text) => {
    ref.current?.focus();
    document.execCommand('insertText', false, `\n${text}\n`);
    setBlock(null);
    emit();
  };
  useEffect(() => {
    if (!block) return;
    const close = () => setBlock(null);
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
    let selectAfter = null;
    if (kind === 'box') {
      const box = enclosingBox(range.commonAncestorContainer, el);
      if (box) unwrapBox(el, box);
      else if (isMultiLine(el, range)) selectAfter = wrapLinesInBox(el, range);
      else inlineToggle(el, range, 'box');
    } else if (kind === 'cols') {
      const cols = enclosingCols(range.commonAncestorContainer, el);
      if (cols) unwrapCols(el, cols);
      else if (isMultiLine(el, range)) selectAfter = wrapLinesInCols(el, range);
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
        onInput={emit}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onKeyUp={syncToolbar}
        onMouseUp={syncToolbar}
        onContextMenu={onContextMenu}
        onBlur={() => setBar(null)}
      />
      {bar && (
        <div
          className="rule-fmt-bar"
          style={{ top: bar.y, left: bar.x }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {btn('bold', t('reglas.bold'), <span className="rule-fmt-b">B</span>)}
          {btn('box', t('reglas.box'), <span className="rule-fmt-box" aria-hidden="true" />)}
          {btn('mark', t('reglas.mark'), <span className="rule-fmt-mark" aria-hidden="true" />)}
          {btn('cols', t('reglas.cols'), <span className="rule-fmt-cols" aria-hidden="true"><i /><i /></span>)}
        </div>
      )}
      {block && (
        <div className="rule-ctx-menu" style={{ position: 'fixed', top: block.y, left: block.x }}>
          <button className="rule-ctx-item" onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertBlock('Columna 1 | Columna 2\ndato | dato')}>
            <span className="rule-ctx-glyph" aria-hidden="true">▦</span>
            <span>{t('reglas.table')}</span>
          </button>
          <button className="rule-ctx-item" onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertBlock('---')}>
            <span className="rule-ctx-glyph" aria-hidden="true">—</span>
            <span>{t('reglas.divider')}</span>
          </button>
        </div>
      )}
    </>
  );
}
