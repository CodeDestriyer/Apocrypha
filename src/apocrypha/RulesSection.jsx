import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import RuleEditor from './RuleEditor.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

// The rule list is a TREE stored in profile.rule_layout. Each node is either a
// rule leaf { t:'r', id } or a group folder { t:'g', id, children:[…nodes] }.
// Groups nest inside groups to any depth ("папки в папках"); rules are leaves
// that live at the top level or inside any group. The rules / rule_groups arrays
// hold only CONTENT (title/body, name) keyed by id — the tree alone defines the
// order and the nesting.
const nodeKey = (n) => n.t + ':' + n.id;

// Old flat layout → tree (one-time migration). The old format listed only
// top-level entries and kept each rule's container in rule.groupId, with grouped
// rules absent from the layout. Detect it by a group entry with no children
// array, and rebuild each group's children from groupId.
function toTree(layout, rules, groups) {
  const list = layout || [];
  const isOld = list.some((e) => e && e.t === 'g' && !Array.isArray(e.children));
  if (!isOld) return list;
  return list.map((e) =>
    e.t === 'g'
      ? { t: 'g', id: e.id, children: rules.filter((r) => (r.groupId ?? null) === e.id).map((r) => ({ t: 'r', id: r.id })) }
      : { t: 'r', id: e.id }
  );
}

// Reconcile a stored tree against the live rules/groups: drop nodes whose id no
// longer exists, dedupe, recurse into groups; then prepend brand-new rules and
// append brand-new groups at the top level so nothing created elsewhere is lost.
function reconcileTree(tree, rules, groups) {
  const ruleIds = new Set(rules.map((r) => r.id));
  const groupIds = new Set(groups.map((g) => g.id));
  const seen = new Set();
  const walk = (nodes) => {
    const out = [];
    for (const n of (nodes || [])) {
      if (!n || !n.id) continue;
      const key = nodeKey(n);
      if (seen.has(key)) continue;
      if (n.t === 'g' && groupIds.has(n.id)) { seen.add(key); out.push({ t: 'g', id: n.id, children: walk(n.children) }); }
      else if (n.t === 'r' && ruleIds.has(n.id)) { seen.add(key); out.push({ t: 'r', id: n.id }); }
    }
    return out;
  };
  const pruned = walk(tree);
  const missingRules = rules.filter((r) => !seen.has('r:' + r.id)).map((r) => ({ t: 'r', id: r.id }));
  const missingGroups = groups.filter((g) => !seen.has('g:' + g.id)).map((g) => ({ t: 'g', id: g.id, children: [] }));
  return [...missingRules, ...pruned, ...missingGroups];
}

function sameTree(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((n, i) => b[i] && n.t === b[i].t && n.id === b[i].id &&
    (n.t !== 'g' || sameTree(n.children || [], b[i].children || [])));
}

// ── Pure tree edits (return new arrays) ──────────────────────────────────────
// `key` is a node key like 'g:123'; `containerId` is a group id, or null for the
// top level.
function findNode(nodes, key) {
  for (const n of (nodes || [])) {
    if (nodeKey(n) === key) return n;
    if (n.t === 'g') { const f = findNode(n.children, key); if (f) return f; }
  }
  return null;
}
// True if `key` is `node` itself or anywhere in its subtree — the guard that
// stops a group being dropped into itself or one of its own descendants.
function nodeContains(node, key) {
  if (nodeKey(node) === key) return true;
  return node.t === 'g' && (node.children || []).some((c) => nodeContains(c, key));
}
function removeNode(nodes, key) {
  const out = [];
  for (const n of (nodes || [])) {
    if (nodeKey(n) === key) continue;
    out.push(n.t === 'g' ? { ...n, children: removeNode(n.children, key) } : n);
  }
  return out;
}
function insertNode(nodes, containerId, index, node) {
  if (containerId == null) {
    const out = (nodes || []).slice();
    out.splice(Math.max(0, Math.min(index, out.length)), 0, node);
    return out;
  }
  return (nodes || []).map((n) => {
    if (n.t !== 'g') return n;
    if (n.id === containerId) {
      const kids = (n.children || []).slice();
      kids.splice(Math.max(0, Math.min(index, kids.length)), 0, node);
      return { ...n, children: kids };
    }
    return { ...n, children: insertNode(n.children, containerId, index, node) };
  });
}
// Delete a group but keep its contents: splice its children into its own place
// one level up (so deleting a folder never loses the rules inside it).
function dissolveGroup(nodes, gid) {
  const out = [];
  for (const n of (nodes || [])) {
    if (n.t === 'g' && n.id === gid) { out.push(...(n.children || [])); continue; }
    out.push(n.t === 'g' ? { ...n, children: dissolveGroup(n.children, gid) } : n);
  }
  return out;
}
// Every rule id anywhere in a subtree (for the group's rule count).
function collectRuleIds(nodes, acc = []) {
  for (const n of (nodes || [])) {
    if (n.t === 'r') acc.push(n.id);
    else if (n.t === 'g') collectRuleIds(n.children, acc);
  }
  return acc;
}

// Insertion index among a zone's DIRECT child nodes, from pointer Y (skips the
// dragged node so the index matches the container without it). Only direct
// children carry `data-node-key`, so nested groups' cards are ignored here.
function childDropIndex(zoneEl, y, selfKey) {
  if (!zoneEl) return 0;
  let index = 0;
  for (const c of zoneEl.querySelectorAll(':scope > [data-node-key]')) {
    if (c.getAttribute('data-node-key') === selfKey) continue;
    const rect = c.getBoundingClientRect();
    if (y > rect.top + rect.height / 2) index++; else break;
  }
  return index;
}


const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// A run whose only characters are marker delimiters or whitespace carries no
// real content — used to drop EMPTY boxes / marks / fences so a stray frame (an
// outline around nothing, a mark that just tints a line start) never renders,
// even if one is still sitting in older stored data.
const STRUCTURAL = /\[\[\[cols|\[\[\[|\]\]\]|\|\|\||\[\[|\]\]|\*\*|__|==|##|[\s\u200B]/g;
const isEmptyContent = (s) => String(s ?? '').replace(STRUCTURAL, '') === '';

// Rule bodies store inline formatting as markers: **bold**, __italic__,
// [[boxed]], ==highlight== and ##heading## (a big bold heading). Render each as
// its own span (newlines are kept by the container's white-space: pre-wrap).
// Markers nest — a marked span can also be bold-and-italic (`==***x***==`, i.e.
// `==**__x__**==`) — so each match's inner content is rendered recursively.
// `##heading##` is the last alternative so the earlier capture-group numbers
// stay put.
function renderRich(text, kp = 'r') {
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

// ── Block-fence helpers (shared shape with RuleEditor's parser) ──────────────
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

// Block-level rendering of a rule body: nested box/columns fences, pipe tables,
// `---` dividers, and paragraphs of inline-formatted text (breaks preserved).
function renderRuleBody(text) {
  return renderBlocks(String(text ?? '').split('\n'), 'b');
}

function renderBlocks(lines, kp) {
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
    blocks.push(<RuleTable key={`${kp}t${key++}`} rows={buf} />);
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

// A rule block: tap the title to open its isolated page; drag the grip to move
// it around the list — reorder among its siblings, or into any group folder.
// `data-node-key` marks it as a direct child of its container so the drop index
// can measure it (nested cards deeper down are skipped by the :scope selector).
function RuleCard({ rule, dragging, onGrip, onOpen, t }) {
  return (
    <div
      className={`rule-card${dragging ? ' dragging' : ''}`}
      data-rule-id={rule.id}
      data-node-key={'r:' + rule.id}
    >
      <button className="rule-card-open" onClick={() => onOpen(rule.id)}>
        <span className="rule-card-title">{rule.title || t('reglas.noBody')}</span>
      </button>
      {onGrip && (
        <button
          className="rule-card-grip"
          aria-label={t('reglas.reorder')}
          onPointerDown={(e) => onGrip(e, rule)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/>
            <circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/>
            <circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// A group "visor" (козырёк): a collapsible header that holds rules. Clicking the
// header folds/unfolds it (like the nav menu); its own gear renames/deletes it.
// The whole visor is a drop zone — dragging a rule onto it assigns the group.
function GroupVisor({ group, count, empty, collapsed, isDrop, dragging, renaming, nameDraft, menuOpen,
  onGrip, onToggle, onMenu, onStartRename, onRenameChange, onCommitRename, onDelete, children, t }) {
  return (
    <section className={`rule-koz${isDrop ? ' drop' : ''}${dragging ? ' dragging' : ''}`} data-group-id={group.id} data-node-key={'g:' + group.id}>
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
          <span className="rule-koz-count">{count}</span>
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
        {onGrip && (
          <button
            className="rule-koz-grip"
            aria-label={t('reglas.reorder')}
            onPointerDown={(e) => onGrip(e, group)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/>
              <circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/>
              <circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>
            </svg>
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="rule-koz-body">
          {empty ? <div className="rule-koz-empty">{t('reglas.groupEmpty')}</div> : children}
        </div>
      )}
    </section>
  );
}

// Rules ("Reglas") — a store of Spanish grammar rules laid out as a tree of
// folders. Group folders nest inside group folders to any depth; rules are
// leaves that live at the top level or inside any folder. Drag a grip to reorder
// a node among its siblings, or drop it onto a folder's header to file it inside
// that folder. Tap a rule to open its isolated page.
// Rule:   { id, title, body, created_at }                         on profile.rules
// Group:  { id, name }                                            on profile.rule_groups
// Layout: [ { t:'r', id } | { t:'g', id, children:[…] } ]  (tree) on profile.rule_layout
export default function RulesSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];
  const groups = profile.rule_groups ?? [];
  const layout = profile.rule_layout ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));
  const setGroups = (updater) =>
    update((curr) => ({ rule_groups: updater(curr.rule_groups ?? []) }));
  const setLayout = (updater) =>
    update((curr) => ({ rule_layout: updater(curr.rule_layout ?? []) }));

  const addRule = (title, body) =>
    setRules((r) => [
      { id: newId(), title, body, groupId: null, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeRule = (id) => {
    setRules((r) => r.filter((x) => x.id !== id));
    setLayout((l) => removeNode(l, 'r:' + id));
  };
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const renameRule = (id, name) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, title: name } : x)));

  const renameGroup = (id, name) =>
    setGroups((g) => g.map((x) => (x.id === id ? { ...x, name } : x)));
  const removeGroup = (id) => {
    // Delete the folder but keep everything inside it: its children move up into
    // its own slot one level higher (see dissolveGroup).
    setGroups((g) => g.filter((x) => x.id !== id));
    setLayout((l) => dissolveGroup(toTree(l, rules, groups), id));
  };

  // Reconciled tree actually rendered; persisted back if it drifted (a new
  // rule/group appeared, one was removed elsewhere, or an old flat layout was
  // migrated to the nested tree).
  const renderLayout = useMemo(() => reconcileTree(toTree(layout, rules, groups), rules, groups), [layout, rules, groups]);
  useEffect(() => {
    if (!sameTree(renderLayout, layout)) setLayout(() => renderLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderLayout]);

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

  // ── Unified drag (window listeners so events survive DOM reshuffles) ──
  // Grab a grip → drag a rule ('r') or a group ('g'). Two drop intents:
  //  • NEST  — the pointer is over a folder's header (.rule-koz-head): the node
  //            is appended inside that folder.
  //  • REORDER — otherwise: the node lands among the DIRECT children of whatever
  //            container the pointer is in (a folder's body, or the top level),
  //            at the gap the pointer sits in.
  // The dragged node's whole subtree gets `pointer-events:none` (the .dragging
  // class) so it's invisible to hit-testing — you can't hover, and therefore
  // can't drop, a folder into itself or its own descendants. commitDrop keeps a
  // nodeContains guard as a belt-and-braces check. Nothing relies on capture.
  const dragRef = useRef({ kind: null, id: null, started: false });
  const dropRef = useRef(null);              // { mode:'nest', groupId } | { mode:'reorder', containerId, index }
  const [dragKey, setDragKey] = useState(null); // 'r:<id>' | 'g:<id>' being dragged
  const [ghost, setGhost] = useState(null);     // { x, y, title }
  const [dropGroup, setDropGroup] = useState(null); // highlighted folder being nested into

  const resetDrag = () => {
    dragRef.current = { kind: null, id: null, started: false };
    dropRef.current = null;
    setDragKey(null); setGhost(null); setDropGroup(null);
  };

  const startDrag = (e, kind, id, title) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { kind, id, started: false };
    const selfKey = (kind === 'group' ? 'g:' : 'r:') + id;

    const onMove = (ev) => {
      const d = dragRef.current;
      if (!d.kind) return;
      if (!d.started) { d.started = true; setDragKey(selfKey); }
      setGhost({ x: ev.clientX, y: ev.clientY, title });
      let info = null;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      // Over a folder header → nest inside it.
      const head = el && el.closest ? el.closest('.rule-koz-head') : null;
      if (head) {
        const koz = head.closest('.rule-koz[data-group-id]');
        const gid = koz && koz.getAttribute('data-group-id');
        if (gid) info = { mode: 'nest', groupId: gid };
      }
      // Otherwise reorder within the container the pointer is inside.
      if (!info) {
        const bodyEl = el && el.closest ? el.closest('.rule-koz-body') : null;
        const koz = bodyEl ? bodyEl.closest('.rule-koz[data-group-id]') : null;
        const containerId = koz ? koz.getAttribute('data-group-id') : null;
        const zone = bodyEl || document.querySelector('.rules-list');
        info = { mode: 'reorder', containerId, index: childDropIndex(zone, ev.clientY, selfKey) };
      }
      dropRef.current = info;
      setDropGroup(info.mode === 'nest' ? info.groupId : null);
    };
    const onUp = () => {
      const d = dragRef.current;
      const info = dropRef.current;
      if (d.started && info) commitDrop(kind, id, info);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      resetDrag();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const commitDrop = (kind, id, info) => {
    const selfKey = (kind === 'group' ? 'g:' : 'r:') + id;
    const dragged = findNode(renderLayout, selfKey);
    if (!dragged) return;
    const containerId = info.mode === 'nest' ? info.groupId : info.containerId;
    // Never drop a folder into itself or one of its own descendants.
    if (kind === 'group' && containerId != null && nodeContains(dragged, 'g:' + containerId)) return;
    const without = removeNode(renderLayout, selfKey);
    // Nest → append to the end of the folder; reorder → the measured gap.
    const index = info.mode === 'nest' ? Infinity : info.index;
    setLayout(() => insertNode(without, containerId ?? null, index, dragged));
  };
  const anyDrag = dragKey != null;

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

  // Search filter. While searching we show a flat list of every matching rule
  // (across all folders) and turn off drag/nesting — the tree only makes sense
  // in the unfiltered view.
  const q = query.trim().toLowerCase();
  const matches = (r) =>
    !q || (r.title ?? '').toLowerCase().includes(q) || (r.body ?? '').toLowerCase().includes(q);

  // ── Header (title / back / gear) ─────────────────────────────
  let pageTitle, onBack, headerRight = null;
  if (open === 'new') {
    pageTitle = t('reglas.new');
    onBack = backToList;
  } else if (currentRule) {
    pageTitle = <span className="sub-title-deck rule-title-plain">{currentRule.title || t('reglas.title')}</span>;
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
      <span className="sub-title-deck rule-title-plain">{readingRule.title || t('reglas.title')}</span>
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
    const ruleById = new Map(rules.map((r) => [r.id, r]));
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const gripRule = q ? null : (e, r) => startDrag(e, 'rule', r.id, r.title || t('reglas.noBody'));
    const gripGroup = q ? null : (e, g) => startDrag(e, 'group', g.id, g.name);

    // Recursively render a list of tree nodes: rule leaves as cards, group nodes
    // as folders whose children are rendered the same way (any depth).
    const renderNodes = (nodes) => nodes.map((n) => {
      if (n.t === 'r') {
        const r = ruleById.get(n.id);
        if (!r) return null;
        return <RuleCard key={'r:' + n.id} rule={r} dragging={dragKey === 'r:' + n.id} onGrip={gripRule} onOpen={openFull} t={t} />;
      }
      const g = groupById.get(n.id);
      if (!g) return null;
      return (
        <GroupVisor
          key={'g:' + g.id}
          group={g}
          count={collectRuleIds(n.children).length}
          empty={(n.children || []).length === 0}
          collapsed={collapsed.has(g.id)}
          isDrop={dropGroup === g.id}
          dragging={dragKey === 'g:' + g.id}
          renaming={groupRenaming === g.id}
          nameDraft={groupNameDraft}
          menuOpen={groupMenu === g.id}
          onGrip={gripGroup}
          onToggle={toggleCollapse}
          onMenu={setGroupMenu}
          onStartRename={(grp) => { setGroupMenu(null); setGroupNameDraft(grp.name); setGroupRenaming(grp.id); }}
          onRenameChange={setGroupNameDraft}
          onCommitRename={commitGroupRename}
          onDelete={(id) => { setGroupMenu(null); removeGroup(id); }}
          t={t}
        >
          {renderNodes(n.children || [])}
        </GroupVisor>
      );
    });

    // Flat list of matching rules while searching (hierarchy hidden).
    const searchHits = q ? rules.filter(matches) : [];
    const nothing = q ? searchHits.length === 0 : renderLayout.length === 0;

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
        ) : nothing && q ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : q ? (
          <div className="rules-list">
            {searchHits.map((r) => (
              <RuleCard key={'r:' + r.id} rule={r} dragging={false} onGrip={null} onOpen={openFull} t={t} />
            ))}
          </div>
        ) : (
          <div className={`rules-list${anyDrag ? ' dragging' : ''}`}>
            {renderNodes(renderLayout)}
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
