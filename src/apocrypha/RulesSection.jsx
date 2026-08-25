import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import RuleEditor from './RuleEditor.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const UNGROUPED = '__ungrouped__';

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
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === '[[[cols') {
      // Whole-line blocks laid out side by side (columns split by |||).
      flushPara(); flushTable();
      i++;
      const cols = []; let col = [];
      while (i < lines.length && lines[i] !== ']]]') {
        if (lines[i] === '|||') { cols.push(col); col = []; } else col.push(lines[i]);
        i++;
      }
      cols.push(col);
      i++; // skip ]]]
      blocks.push(
        <div key={`c${key++}`} className="rule-cols">
          {cols.map((c, ci) => (
            <div key={ci} className="rule-col">
              {c.map((ln, ii) => <span key={ii}>{ii > 0 && <br />}{renderRich(ln)}</span>)}
            </div>
          ))}
        </div>
      );
      continue;
    }
    if (line === '[[[') {
      // A big frame around whole lines (a "main rule" callout).
      flushPara(); flushTable();
      i++;
      const inner = [];
      while (i < lines.length && lines[i] !== ']]]') { inner.push(lines[i]); i++; }
      i++; // skip ]]]
      blocks.push(
        <div key={`b${key++}`} className="rule-block-box">
          {inner.map((ln, ii) => <span key={ii}>{ii > 0 && <br />}{renderRich(ln)}</span>)}
        </div>
      );
      continue;
    }
    if (/^\s*-{3,}\s*$/.test(line)) { flushPara(); flushTable(); blocks.push(<hr key={`h${key++}`} className="rule-hr" />); }
    else if (line.includes('|')) { flushPara(); table.push(line); }
    else { flushTable(); para.push(line); }
    i++;
  }
  flushPara(); flushTable();
  return blocks;
}

// A rule block: tap the title to open its isolated page; drag the grip to move
// it between the ungrouped top area and group visors (like reordering tareas).
function RuleCard({ rule, dragging, dnd, onOpen, t }) {
  return (
    <div className={`rule-card${dragging ? ' dragging' : ''}`}>
      <button className="rule-card-open" onClick={() => onOpen(rule.id)}>
        <span className="rule-card-title">{rule.title || t('reglas.noBody')}</span>
      </button>
      <button
        className="rule-card-grip"
        aria-label={t('reglas.reorder')}
        onPointerDown={(e) => dnd.down(e, rule)}
        onPointerMove={dnd.move}
        onPointerUp={dnd.up}
        onPointerCancel={dnd.cancel}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/>
          <circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/>
          <circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>
        </svg>
      </button>
    </div>
  );
}

// A group "visor" (козырёк): a collapsible header that holds rules. Clicking the
// header folds/unfolds it (like the nav menu); its own gear renames/deletes it.
// The whole visor is a drop zone — dragging a rule onto it assigns the group.
function GroupVisor({ group, rules, collapsed, isDrop, renaming, nameDraft, menuOpen,
  onToggle, onMenu, onStartRename, onRenameChange, onCommitRename, onDelete, children, t }) {
  return (
    <section className={`rule-koz${isDrop ? ' drop' : ''}`} data-dropzone={group.id}>
      <div className="rule-koz-head">
        <button className="rule-koz-toggle" onClick={() => onToggle(group.id)} aria-expanded={!collapsed}>
          <svg className={`rule-koz-chevron${collapsed ? '' : ' open'}`} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
          {renaming ? (
            <input
              className="rule-koz-rename"
              value={nameDraft}
              autoFocus
              placeholder={t('reglas.newGroup')}
              maxLength={40}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitRename();
                if (e.key === 'Escape') onCommitRename();
              }}
            />
          ) : (
            <span className="rule-koz-name">{group.name}</span>
          )}
          <span className="rule-koz-count">{rules.length}</span>
        </button>
        <div className="cards-gear rule-koz-gear">
          <button className="cards-gear-btn cards-gear-btn--sm" onClick={() => onMenu(menuOpen ? null : group.id)} aria-label={t('cards.deckSettings')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d={GEAR_PATH}/>
            </svg>
          </button>
          {menuOpen && (
            <div className="cards-gear-menu cards-gear-menu--right">
              <button className="cards-gear-item" onClick={() => onStartRename(group)}>{t('cards.renameDeck')}</button>
              <button className="cards-gear-item cards-gear-item--danger" onClick={() => onDelete(group.id)}>{t('reglas.deleteGroup')}</button>
            </div>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="rule-koz-body">
          {rules.length ? children : <div className="rule-koz-empty">{t('reglas.groupEmpty')}</div>}
        </div>
      )}
    </section>
  );
}

// Rules ("Reglas") — a store of Spanish grammar rules. The list shows rule
// blocks (tap to open an isolated full-page view) that can be organised into
// collapsible group visors; drag a rule's grip to move it between the ungrouped
// top area and the visors. Groups are empty-capable and managed via gears.
// Rule:  { id, title, body, groupId?, created_at } on profile.rules
// Group: { id, name }                              on profile.rule_groups
export default function RulesSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];
  const groups = profile.rule_groups ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));
  const setGroups = (updater) =>
    update((curr) => ({ rule_groups: updater(curr.rule_groups ?? []) }));

  const addRule = (title, body) =>
    setRules((r) => [
      { id: newId(), title, body, groupId: null, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeRule = (id) => setRules((r) => r.filter((x) => x.id !== id));
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const renameRule = (id, name) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, title: name } : x)));
  const setRuleGroup = (id, groupId) => updateRule(id, { groupId });

  const renameGroup = (id, name) =>
    setGroups((g) => g.map((x) => (x.id === id ? { ...x, name } : x)));
  const removeGroup = (id) => {
    setGroups((g) => g.filter((x) => x.id !== id));
    setRules((r) => r.map((x) => (x.groupId === id ? { ...x, groupId: null } : x)));
  };

  const [open, setOpen] = useState(null);          // null (list) | 'new' | ruleId (editing)
  const [reading, setReading] = useState(null);    // null | ruleId (isolated full-page read)
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); // rule-page / list-header gear
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const menuRef = useRef(null);

  // Group gear menu + inline rename (keyed by group id)
  const [groupMenu, setGroupMenu] = useState(null);
  const [groupRenaming, setGroupRenaming] = useState(null);
  const [groupNameDraft, setGroupNameDraft] = useState('');

  // Collapsed visors, persisted per-device
  const [collapsed, setCollapsed] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lr:ruleGroupsCollapsed') || '[]')); }
    catch { return new Set(); }
  });
  const toggleCollapse = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem('lr:ruleGroupsCollapsed', JSON.stringify([...next])); } catch { /* ignore */ }
    return next;
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);
  useEffect(() => {
    if (!groupMenu) return;
    const onDoc = (e) => { if (!e.target.closest || !e.target.closest('.rule-koz-gear')) setGroupMenu(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [groupMenu]);

  // ── Drag a rule between the ungrouped area and group visors ──
  const dragRef = useRef({ id: null, pid: null, title: '' });
  const dropRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [ghost, setGhost] = useState(null);        // { x, y, title }
  const [dropTarget, setDropTarget] = useState(null); // group id | UNGROUPED | null

  const resetDrag = () => {
    dragRef.current = { id: null, pid: null, title: '', started: false };
    dropRef.current = null;
    setDragId(null); setGhost(null); setDropTarget(null);
  };
  const dnd = {
    down: (e, rule) => {
      if (e.button != null && e.button !== 0) return;
      dragRef.current = { id: rule.id, pid: e.pointerId, title: rule.title || t('reglas.noBody'), started: false };
      dropRef.current = null;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    move: (e) => {
      const d = dragRef.current;
      if (!d.id || e.pointerId !== d.pid) return;
      if (!d.started) { d.started = true; setDragId(d.id); }
      setGhost({ x: e.clientX, y: e.clientY, title: d.title });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = el && el.closest ? el.closest('[data-dropzone]') : null;
      const tgt = zone ? zone.getAttribute('data-dropzone') : null;
      dropRef.current = tgt;
      setDropTarget(tgt);
    },
    up: (e) => {
      const d = dragRef.current;
      if (!d.id || e.pointerId !== d.pid) return;
      if (d.started) {
        const tgt = dropRef.current;
        if (tgt != null) {
          const gid = tgt === UNGROUPED ? null : tgt;
          const cur = rules.find((r) => r.id === d.id);
          if (cur && (cur.groupId ?? null) !== gid) setRuleGroup(d.id, gid);
        }
      }
      resetDrag();
    },
    cancel: resetDrag,
  };

  const currentRule = (open && open !== 'new') ? (rules.find((r) => r.id === open) ?? null) : null;
  const readingRule = reading ? (rules.find((r) => r.id === reading) ?? null) : null;
  const isEditing = open === 'new' || !!currentRule;

  const openNew = () => { setReading(null); setMenuOpen(false); setTitle(''); setBody(''); setOpen('new'); };
  const openFull = (id) => { setMenuOpen(false); setEditingName(false); setReading(id); };
  const editRule = (r) => { setMenuOpen(false); setEditingName(false); setReading(null); setTitle(r.title ?? ''); setBody(r.body ?? ''); setOpen(r.id); };
  const backToList = () => { setOpen(null); setReading(null); setMenuOpen(false); setEditingName(false); };

  const addGroup = () => {
    const id = newId();
    setGroups((g) => [...g, { id, name: t('reglas.newGroup') }]);
    setMenuOpen(false);
    setGroupNameDraft(t('reglas.newGroup'));
    setGroupRenaming(id);
  };
  const commitGroupRename = () => {
    if (!groupRenaming) return;
    const nm = groupNameDraft.trim();
    if (nm) renameGroup(groupRenaming, nm);
    setGroupRenaming(null);
  };

  const commitRename = () => {
    if (!readingRule) return;
    renameRule(readingRule.id, nameDraft.trim() || readingRule.title);
    setEditingName(false);
  };

  const saveNew = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) { backToList(); return; }
    addRule(ti, bo);
    backToList();
  };
  const saveEdit = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) return;
    updateRule(currentRule.id, { title: ti, body: bo });
    backToList();
  };

  // Search filter (drag/visors only in the unfiltered view).
  const q = query.trim().toLowerCase();
  const matches = (r) =>
    !q || (r.title ?? '').toLowerCase().includes(q) || (r.body ?? '').toLowerCase().includes(q);
  const ungrouped = rules.filter((r) => r.groupId == null && matches(r));
  const groupRules = (gid) => rules.filter((r) => r.groupId === gid && matches(r));

  // ── Header (title / back / gear) ─────────────────────────────
  let pageTitle, onBack, headerRight = null;
  if (open === 'new') {
    pageTitle = t('reglas.new');
    onBack = backToList;
  } else if (currentRule) {
    pageTitle = <span className="sub-title-deck">{currentRule.title || t('reglas.title')}</span>;
    onBack = backToList;
  } else if (readingRule) {
    onBack = backToList;
    pageTitle = editingName ? (
      <input
        className="sub-title-input"
        value={nameDraft}
        autoFocus
        placeholder={t('reglas.titlePlaceholder')}
        maxLength={80}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') setEditingName(false);
        }}
      />
    ) : (
      <span className="sub-title-deck">{readingRule.title || t('reglas.title')}</span>
    );
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
            <button className="cards-gear-item" onClick={() => editRule(readingRule)}>{t('cards.editCard')}</button>
            <button className="cards-gear-item" onClick={() => { setMenuOpen(false); setNameDraft(readingRule.title ?? ''); setEditingName(true); }}>{t('cards.renameDeck')}</button>
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); removeRule(readingRule.id); backToList(); }}>{t('cards.deleteCard')}</button>
          </div>
        )}
      </div>
    );
  } else {
    pageTitle = t('reglas.title');
    onBack = rootOnBack;
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
            <button className="cards-gear-item" onClick={addGroup}>{t('reglas.addGroup')}</button>
          </div>
        )}
      </div>
    );
  }

  // ── Body ─────────────────────────────────────────────────────
  let content;
  if (isEditing) {
    const submit = open === 'new' ? saveNew : saveEdit;
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
        <RuleEditor
          editKey={open === 'new' ? 'new' : currentRule.id}
          initialValue={body}
          onChange={setBody}
          onSubmit={submit}
          placeholder={t('reglas.bodyPlaceholder')}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={backToList}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
            {t('cards.save')}
          </button>
        </div>
      </div>
    );
  } else if (readingRule) {
    content = (
      <div className="rule-read">
        {readingRule.body
          ? <div className="rule-read-body">{renderRuleBody(readingRule.body)}</div>
          : <div className="empty-hint">{t('reglas.noBody')}</div>}
      </div>
    );
  } else {
    const renderCard = (r) => (
      <RuleCard key={r.id} rule={r} dragging={dragId === r.id} dnd={dnd} onOpen={openFull} t={t} />
    );
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

        {rules.length === 0 && groups.length === 0 ? (
          <div className="empty-hint">{t('reglas.empty')}</div>
        ) : q && ungrouped.length === 0 && groups.every((g) => groupRules(g.id).length === 0) ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : (
          <div className={`rules-list${dragId ? ' dragging' : ''}`}>
            {/* Ungrouped rules — bare blocks at the top; also a drop zone */}
            <div
              className={`rule-ungrouped${dropTarget === UNGROUPED ? ' drop' : ''}`}
              data-dropzone={UNGROUPED}
            >
              {ungrouped.map(renderCard)}
              {dragId && ungrouped.length === 0 && (
                <div className="rule-koz-empty">{t('reglas.groupEmpty')}</div>
              )}
            </div>

            {/* Group visors */}
            {groups.map((g) => {
              const gr = groupRules(g.id);
              if (q && gr.length === 0) return null;
              return (
                <GroupVisor
                  key={g.id}
                  group={g}
                  rules={gr}
                  collapsed={!q && collapsed.has(g.id)}
                  isDrop={dropTarget === g.id}
                  renaming={groupRenaming === g.id}
                  nameDraft={groupNameDraft}
                  menuOpen={groupMenu === g.id}
                  onToggle={toggleCollapse}
                  onMenu={setGroupMenu}
                  onStartRename={(grp) => { setGroupMenu(null); setGroupNameDraft(grp.name); setGroupRenaming(grp.id); }}
                  onRenameChange={setGroupNameDraft}
                  onCommitRename={commitGroupRename}
                  onDelete={(id) => { setGroupMenu(null); removeGroup(id); }}
                  t={t}
                >
                  {gr.map(renderCard)}
                </GroupVisor>
              );
            })}
          </div>
        )}

        {ghost && (
          <div className="rule-drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
            {ghost.title}
          </div>
        )}
      </>
    );
  }

  return (
    <SubPage title={pageTitle} onBack={onBack} headerRight={headerRight}>
      {content}
    </SubPage>
  );
}
