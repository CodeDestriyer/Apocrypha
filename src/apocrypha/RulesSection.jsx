import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// Rule bodies store inline formatting as markers: **bold**, [[boxed]] and
// ==highlight==. Render each as its own span (newlines are kept by the
// container's white-space: pre-wrap).
function renderRich(text) {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==/g;
  const out = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push(str.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<span key={key++} className="rule-box">{m[2]}</span>);
    else out.push(<mark key={key++} className="rule-mark">{m[3]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

// A pipe table: first row is the header. Cells keep inline markers.
function RuleTable({ rows }) {
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

// Block-level rendering of a rule body: pipe tables, `---` dividers, and
// paragraphs of inline-formatted text (line breaks preserved).
function renderRuleBody(text) {
  const lines = String(text ?? '').split('\n');
  const blocks = [];
  let para = [], table = [], key = 0;
  const flushPara = () => {
    if (!para.length) return;
    const buf = para; para = [];
    blocks.push(
      <div key={`p${key++}`} className="rule-para">
        {buf.map((ln, i) => <span key={i}>{i > 0 && <br />}{renderRich(ln)}</span>)}
      </div>
    );
  };
  const flushTable = () => {
    if (!table.length) return;
    const buf = table; table = [];
    blocks.push(<RuleTable key={`t${key++}`} rows={buf} />);
  };
  for (const line of lines) {
    if (/^\s*-{3,}\s*$/.test(line)) { flushPara(); flushTable(); blocks.push(<hr key={`h${key++}`} className="rule-hr" />); }
    else if (line.includes('|')) { flushPara(); table.push(line); }
    else { flushTable(); para.push(line); }
  }
  flushPara(); flushTable();
  return blocks;
}

// Rules ("Reglas") — a store of Spanish grammar rules, shown as a
// Notion/Keep-style grid of square note tiles. Opening a tile drops into a
// focused page (the grid is hidden): existing rules open in read mode, with
// edit/delete tucked behind the header gear; the add tile opens a blank
// editor. Each rule is { id, title, body, created_at } on profile.rules.
export default function RulesSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));
  const addRule = (title, body) =>
    setRules((r) => [
      { id: newId(), title, body, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeRule = (id) => setRules((r) => r.filter((x) => x.id !== id));
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const [open, setOpen] = useState(null);       // null (grid) | 'new' | ruleId
  const [editMode, setEditMode] = useState(false); // focused existing rule: read vs edit
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  // Right-click a selection in the editor to open a small formatting menu
  // (one option for now: Negrita). Nothing selected → native browser menu.
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, start, end }
  const ctxRef = useRef(null);
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const onDown = (e) => { if (ctxRef.current && !ctxRef.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [ctxMenu]);

  const openFormatMenu = (e) => {
    const ta = e.currentTarget;
    const s = ta.selectionStart ?? body.length, en = ta.selectionEnd ?? body.length;
    e.preventDefault();
    // With a selection → format it (bold/box/mark). On empty space → insert
    // a block (table / divider) at the caret.
    setCtxMenu({ x: e.clientX, y: e.clientY, start: s, end: en, hasSel: s !== en });
  };
  const wrapSelection = (openTok, closeTok) => {
    if (!ctxMenu) return;
    const { start: s, end: en } = ctxMenu;
    const sel = body.slice(s, en);
    const before = body.slice(0, s), after = body.slice(en);
    const wrapped = sel.startsWith(openTok) && sel.endsWith(closeTok) && sel.length >= openTok.length + closeTok.length;
    const next = wrapped
      ? before + sel.slice(openTok.length, sel.length - closeTok.length) + after
      : `${before}${openTok}${sel}${closeTok}${after}`;
    setBody(next);
    setCtxMenu(null);
  };
  const applyBold = () => wrapSelection('**', '**');
  const applyBox = () => wrapSelection('[[', ']]');
  const applyMark = () => wrapSelection('==', '==');

  // Insert a block (table / divider) at the caret where the menu was opened.
  const insertAt = (text) => {
    if (!ctxMenu) return;
    const pos = ctxMenu.start;
    let before = body.slice(0, pos), after = body.slice(pos);
    if (before && !before.endsWith('\n')) before += '\n';
    if (after && !after.startsWith('\n')) after = '\n' + after;
    setBody(before + text + after);
    setCtxMenu(null);
  };
  const insertTable = () => insertAt('Columna 1 | Columna 2\ndato | dato');
  const insertDivider = () => insertAt('---');

  const currentRule = (open && open !== 'new') ? (rules.find((r) => r.id === open) ?? null) : null;

  const openNew = () => { setTitle(''); setBody(''); setEditMode(true); setMenuOpen(false); setOpen('new'); };
  const openRule = (r) => { setEditMode(false); setMenuOpen(false); setOpen(r.id); };
  const backToGrid = () => { setOpen(null); setEditMode(false); setMenuOpen(false); };
  const startEdit = () => { setTitle(currentRule?.title ?? ''); setBody(currentRule?.body ?? ''); setMenuOpen(false); setEditMode(true); };

  const saveNew = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) { backToGrid(); return; }
    addRule(ti, bo);
    backToGrid();
  };
  const saveEdit = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) return;
    updateRule(currentRule.id, { title: ti, body: bo });
    setEditMode(false);
  };
  const deleteCurrent = () => { removeRule(currentRule.id); backToGrid(); };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) =>
      (r.title ?? '').toLowerCase().includes(q) ||
      (r.body ?? '').toLowerCase().includes(q)
    );
  }, [query, rules]);

  const isEditing = open === 'new' || (currentRule && editMode);

  // ── Header (title / back / gear) ─────────────────────────────
  let pageTitle, onBack, headerRight = null;
  if (open === 'new') {
    pageTitle = t('reglas.new');
    onBack = backToGrid;
  } else if (currentRule) {
    pageTitle = <span className="sub-title-deck">{currentRule.title || t('reglas.title')}</span>;
    onBack = backToGrid;
    if (!editMode) {
      headerRight = (
        <div className="cards-gear" ref={menuRef}>
          <button className="cards-gear-btn" onClick={() => setMenuOpen((o) => !o)} aria-label={t('cards.cardSettings')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d={GEAR_PATH}/>
            </svg>
          </button>
          {menuOpen && (
            <div className="cards-gear-menu cards-gear-menu--right">
              <button className="cards-gear-item" onClick={startEdit}>{t('cards.editCard')}</button>
              <button className="cards-gear-item cards-gear-item--danger" onClick={deleteCurrent}>{t('cards.deleteCard')}</button>
            </div>
          )}
        </div>
      );
    }
  } else {
    pageTitle = t('reglas.title');
    onBack = rootOnBack;
  }

  // ── Body ─────────────────────────────────────────────────────
  let content;
  if (isEditing) {
    const submit = open === 'new' ? saveNew : saveEdit;
    const cancel = open === 'new' ? backToGrid : () => setEditMode(false);
    content = (
      <div className="cards-panel">
        <label className="cards-field-label">{t('reglas.titleLabel')}</label>
        <input
          className="cards-field-input"
          value={title}
          autoFocus
          placeholder={t('reglas.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
        <label className="cards-field-label">{t('reglas.bodyLabel')}</label>
        <textarea
          className="cards-field-textarea"
          value={body}
          placeholder={t('reglas.bodyPlaceholder')}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          onContextMenu={openFormatMenu}
          rows={9}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={cancel}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
            {t('cards.save')}
          </button>
        </div>
      </div>
    );
  } else if (currentRule) {
    content = (
      <div className="rule-read">
        {currentRule.body
          ? <div className="rule-read-body">{renderRuleBody(currentRule.body)}</div>
          : <div className="empty-hint">{t('reglas.noBody')}</div>}
      </div>
    );
  } else {
    content = (
      <>
        <div className="search-add-row">
          {rules.length > 0 && (
            <div className="cards-search open">
              <svg className="cards-search-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                className="cards-search-input"
                placeholder={t('reglas.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
              />
              {query && (
                <button className="cards-search-close" onClick={() => setQuery('')} aria-label={t('cards.close')}>×</button>
              )}
            </div>
          )}
          <button className="search-add-btn" onClick={openNew} aria-label={t('reglas.new')}>+</button>
        </div>

        {visible.length === 0 && query ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : (
          <div className="rules-grid">
            {visible.map((r) => (
              <button key={r.id} className="rule-note" onClick={() => openRule(r)}>
                {r.title && <div className="rule-note-title">{r.title}</div>}
                {r.body && <div className="rule-note-body">{renderRuleBody(r.body)}</div>}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <SubPage title={pageTitle} onBack={onBack} headerRight={headerRight}>
      {content}
      {ctxMenu && (
        <div className="rule-ctx-menu" ref={ctxRef} style={{ top: ctxMenu.y, left: ctxMenu.x }}>
          {ctxMenu.hasSel ? (
            <>
              <button className="rule-ctx-item" onClick={applyBold}>
                <span className="rule-ctx-b">B</span>
                <span>{t('reglas.bold')}</span>
              </button>
              <button className="rule-ctx-item" onClick={applyBox}>
                <span className="rule-ctx-box" aria-hidden="true" />
                <span>{t('reglas.box')}</span>
              </button>
              <button className="rule-ctx-item" onClick={applyMark}>
                <span className="rule-ctx-mark" aria-hidden="true" />
                <span>{t('reglas.mark')}</span>
              </button>
            </>
          ) : (
            <>
              <button className="rule-ctx-item" onClick={insertTable}>
                <span className="rule-ctx-glyph" aria-hidden="true">▦</span>
                <span>{t('reglas.table')}</span>
              </button>
              <button className="rule-ctx-item" onClick={insertDivider}>
                <span className="rule-ctx-glyph" aria-hidden="true">—</span>
                <span>{t('reglas.divider')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </SubPage>
  );
}
