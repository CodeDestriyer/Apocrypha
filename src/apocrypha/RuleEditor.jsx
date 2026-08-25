import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';

// WYSIWYG body editor for a rule. The stored value is the same marker format
// the read view uses (**bold**, [[box]], ==mark==) so search, Supabase and
// renderRuleBody stay untouched — but here formatting is shown live: click
// "bold" on a selection and the text is bold immediately, no asterisks.
//
// The contentEditable is UNCONTROLLED: its HTML is seeded once on mount and
// never re-set from React, so the caret is never blown away. On every input we
// serialize the DOM back to markers and hand them up via onChange.

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Marker string → HTML for the editable surface. Mirrors renderRich(), but as
// an HTML string with newlines as <br> (the editor is white-space: pre-wrap).
export function markersToHtml(text) {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==/g;
  let out = '', last = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out += esc(str.slice(last, m.index));
    if (m[1] !== undefined) out += `<strong>${esc(m[1])}</strong>`;
    else if (m[2] !== undefined) out += `<span class="rule-box">${esc(m[2])}</span>`;
    else out += `<mark class="rule-mark">${esc(m[3])}</mark>`;
    last = m.index + m[0].length;
  }
  if (last < str.length) out += esc(str.slice(last));
  return out.replace(/\n/g, '<br>');
}

// DOM → marker string. Walks the tree: <strong>/<b> → **…**, .rule-box →
// [[…]], <mark>/.rule-mark → ==…==, <br> → newline. <div>/<p> (only from a
// paste that slipped through) act as line separators. Empty wrappers vanish.
function domToMarkers(root) {
  const walk = (node) => {
    let s = '';
    node.childNodes.forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) { s += c.textContent; return; }
      if (c.nodeType !== Node.ELEMENT_NODE) return;
      const tag = c.tagName;
      if (tag === 'BR') { s += '\n'; return; }
      const inner = walk(c);
      if (tag === 'STRONG' || tag === 'B') s += inner ? `**${inner}**` : '';
      else if (c.classList.contains('rule-box')) s += inner ? `[[${inner}]]` : '';
      else if (tag === 'MARK' || c.classList.contains('rule-mark')) s += inner ? `==${inner}==` : '';
      else if (tag === 'DIV' || tag === 'P') { if (s && !s.endsWith('\n')) s += '\n'; s += inner; }
      else s += inner;
    });
    return s;
  };
  return walk(root);
}

const KIND_TAG = { bold: 'STRONG', box: 'SPAN', mark: 'MARK' };
const KIND_CLASS = { box: 'rule-box', mark: 'rule-mark' };

// Does node sit inside a formatting element of `kind`, still within the editor?
function enclosingFormat(node, kind, editor) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (el && el !== editor) {
    if (el.tagName === KIND_TAG[kind] &&
        (!KIND_CLASS[kind] || el.classList.contains(KIND_CLASS[kind]))) return el;
    el = el.parentNode;
  }
  return null;
}

// Replace an element with its own children (remove the formatting wrapper).
function unwrap(el) {
  const parent = el.parentNode;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

// Strip nested wrappers of the same kind so we never produce **a**b** soup.
function stripNested(el, kind) {
  const sel = KIND_CLASS[kind]
    ? `${KIND_TAG[kind].toLowerCase()}.${KIND_CLASS[kind]}`
    : KIND_TAG[kind].toLowerCase();
  el.querySelectorAll(sel).forEach(unwrap);
}

export default function RuleEditor({ editKey, initialValue, onChange, onSubmit, placeholder }) {
  const { t } = useLang();
  const ref = useRef(null);
  const [bar, setBar] = useState(null); // { x, y } of the floating toolbar, or null
  const [block, setBlock] = useState(null); // { x, y } block-insert menu, or null

  // Seed the editable surface once per edited target (keyed by editKey).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = markersToHtml(initialValue);
  }, [editKey]);

  const emit = () => { if (ref.current) onChange(domToMarkers(ref.current)); };

  // A selection lives inside the editor and actually spans something.
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

  // Keep line breaks as <br> only — no <div>/<p> soup to serialize around.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
      emit();
    }
  };

  // Foreign HTML on paste is flattened to plain text.
  const onPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
    emit();
  };

  // Right-click with nothing selected → block-insert menu (table / divider).
  // With a selection the floating format bar already covers formatting, so we
  // let the native menu (copy/paste) through.
  const onContextMenu = (e) => {
    if (liveSelection()) return;
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

  // Toggle a format on the current selection, live.
  const applyFormat = (kind) => {
    const el = ref.current;
    const sel = liveSelection();
    if (!el || !sel) return;
    const range = sel.getRangeAt(0);
    const existing = enclosingFormat(range.commonAncestorContainer, kind, el);
    if (existing) {
      unwrap(existing);
    } else {
      const tag = KIND_TAG[kind];
      const node = document.createElement(tag);
      if (KIND_CLASS[kind]) node.className = KIND_CLASS[kind];
      try {
        node.appendChild(range.extractContents());
        stripNested(node, kind);
        range.insertNode(node);
        sel.removeAllRanges();
        const nr = document.createRange();
        nr.selectNodeContents(node);
        sel.addRange(nr);
      } catch { return; }
    }
    el.normalize();
    emit();
    syncToolbar();
  };

  const btn = (kind, label, glyph) => (
    <button
      type="button"
      className="rule-fmt-btn"
      // Keep the selection: prevent the toolbar from stealing focus on press.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => applyFormat(kind)}
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
