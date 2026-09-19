import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import RichEditor from './RichEditor.jsx';
import { renderBody } from './richText.jsx';
import {
  nodeKey, toTree, reconcileTree, sameTree, findNode, nodeContains,
  removeNode, insertNode, dissolveGroup, collectItemIds, childDropIndex,
} from './noteTree.js';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// A nota: tap the title to open its isolated page; drag the grip to move
// it around the list — reorder among its siblings, or into any group folder.
// `data-node-key` marks it as a direct child of its container so the drop index
// can measure it (nested cards deeper down are skipped by the :scope selector).
function NotaCard({ nota, dragging, onGrip, onOpen, t }) {
  return (
    <div
      className={`rule-card${dragging ? ' dragging' : ''}`}
      data-note-id={nota.id}
      data-node-key={'r:' + nota.id}
    >
      <button className="rule-card-open" onClick={() => onOpen(nota.id)}>
        <span className="rule-card-title">{nota.title || t('conocimiento.noBody')}</span>
      </button>
      {onGrip && (
        <button
          className="rule-card-grip"
          aria-label={t('conocimiento.reorder')}
          onPointerDown={(e) => onGrip(e, nota)}
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

// A folder "visor" (козырёк): a collapsible header that holds notas. Clicking the
// header folds/unfolds it (like the nav menu); its own gear renames/deletes it.
// The whole visor is a drop zone — dragging a nota onto it files it here.
function CarpetaVisor({ group, count, empty, collapsed, isDrop, dragging, renaming, nameDraft, menuOpen,
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
              placeholder={t('conocimiento.newGroup')}
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
              <button className="cards-gear-item cards-gear-item--danger" onClick={() => onDelete(group.id)}>{t('conocimiento.deleteGroup')}</button>
            </div>
          )}
        </div>
        {onGrip && (
          <button
            className="rule-koz-grip"
            aria-label={t('conocimiento.reorder')}
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
          {empty ? <div className="rule-koz-empty">{t('conocimiento.groupEmpty')}</div> : children}
        </div>
      )}
    </section>
  );
}

// Conocimiento (Héroe › Conocimiento) — the personal knowledge base: thoughts
// and things understood, filed into nested folders.
//
// This is deliberately its OWN section, not a configured Reglas. The two hold
// different kinds of material (Spanish grammar vs. life notes) and are free to
// diverge in layout, copy and features without either having to keep in step.
// What they do share is narrow and generic: the rich-text marker format
// (richText.jsx), the folder-tree algebra (noteTree.js) and the RichEditor
// widget. If this section ever wants a different nesting model it simply stops
// importing from noteTree.js.
//
// Nota:   { id, title, body, created_at }                         on profile.notes
// Folder: { id, name }                                            on profile.note_groups
// Layout: [ { t:'r', id } | { t:'g', id, children:[…] } ] (tree)  on profile.note_layout
//
// `created_at` is bookkeeping only — nothing shows or sorts by a date.
//
// Styling currently reuses the rule-* classes, scoped under a `.conocimiento`
// root so this section can be restyled without touching Reglas.
export default function ConocimientoSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const notes = profile.notes ?? [];
  const groups = profile.note_groups ?? [];
  const layout = profile.note_layout ?? [];

  const setNotes = (updater) =>
    update((curr) => ({ notes: updater(curr.notes ?? []) }));
  const setGroups = (updater) =>
    update((curr) => ({ note_groups: updater(curr.note_groups ?? []) }));
  const setLayout = (updater) =>
    update((curr) => ({ note_layout: updater(curr.note_layout ?? []) }));

  const addNote = (title, body) =>
    setNotes((r) => [
      { id: newId(), title, body, groupId: null, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeNote = (id) => {
    setNotes((r) => r.filter((x) => x.id !== id));
    setLayout((l) => removeNode(l, 'r:' + id));
  };
  const updateNote = (id, patch) =>
    setNotes((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const renameNote = (id, name) =>
    setNotes((r) => r.map((x) => (x.id === id ? { ...x, title: name } : x)));

  const renameGroup = (id, name) =>
    setGroups((g) => g.map((x) => (x.id === id ? { ...x, name } : x)));
  const removeGroup = (id) => {
    // Delete the folder but keep everything inside it: its children move up into
    // its own slot one level higher (see dissolveGroup).
    setGroups((g) => g.filter((x) => x.id !== id));
    setLayout((l) => dissolveGroup(toTree(l, notes, groups), id));
  };

  // Reconciled tree actually rendered; persisted back if it drifted (a new
  // nota/folder appeared, one was removed elsewhere, or an old flat layout was
  // migrated to the nested tree).
  const renderLayout = useMemo(() => reconcileTree(toTree(layout, notes, groups), notes, groups), [layout, notes, groups]);
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
    try { return new Set(JSON.parse(localStorage.getItem('lr:noteGroupsCollapsed') || '[]')); }
    catch { return new Set(); }
  });
  const toggleCollapse = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem('lr:noteGroupsCollapsed', JSON.stringify([...next])); } catch { /* ignore */ }
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

  const currentNote = (open && open !== 'new') ? (notes.find((r) => r.id === open) ?? null) : null;
  const readingNote = reading ? (notes.find((r) => r.id === reading) ?? null) : null;
  const isEditing = open === 'new' || !!currentNote;

  const openNew = () => { setReading(null); setMenuOpen(false); setTitle(''); setBody(''); setOpen('new'); };
  const openFull = (id) => { setMenuOpen(false); setEditingName(false); setReading(id); };
  const editNote = (r) => { setMenuOpen(false); setEditingName(false); setReading(null); setTitle(r.title ?? ''); setBody(r.body ?? ''); setOpen(r.id); };
  const backToList = () => { setOpen(null); setReading(null); setMenuOpen(false); setEditingName(false); };

  const addGroup = () => {
    const id = newId();
    setGroups((g) => [...g, { id, name: t('conocimiento.newGroup') }]);
    setMenuOpen(false);
    setGroupNameDraft(t('conocimiento.newGroup'));
    setGroupRenaming(id);
  };
  const commitGroupRename = () => {
    if (!groupRenaming) return;
    const nm = groupNameDraft.trim();
    if (nm) renameGroup(groupRenaming, nm);
    setGroupRenaming(null);
  };

  const commitRename = () => {
    if (!readingNote) return;
    renameNote(readingNote.id, nameDraft.trim() || readingNote.title);
    setEditingName(false);
  };

  const saveNew = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) { backToList(); return; }
    addNote(ti, bo);
    backToList();
  };
  const saveEdit = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) return;
    updateNote(currentNote.id, { title: ti, body: bo });
    backToList();
  };

  // Search filter. While searching we show a flat list of every matching nota
  // (across all folders) and turn off drag/nesting — the tree only makes sense
  // in the unfiltered view.
  const q = query.trim().toLowerCase();
  const matches = (r) =>
    !q || (r.title ?? '').toLowerCase().includes(q) || (r.body ?? '').toLowerCase().includes(q);

  // ── Header (title / back / gear) ─────────────────────────────
  let pageTitle, onBack, headerRight = null;
  if (open === 'new') {
    pageTitle = t('conocimiento.new');
    onBack = backToList;
  } else if (currentNote) {
    pageTitle = <span className="sub-title-deck rule-title-plain">{currentNote.title || t('conocimiento.title')}</span>;
    onBack = backToList;
  } else if (readingNote) {
    onBack = backToList;
    pageTitle = editingName ? (
      <input
        className="sub-title-input"
        value={nameDraft}
        autoFocus
        placeholder={t('conocimiento.titlePlaceholder')}
        maxLength={80}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitRename();
          if (e.key === 'Escape') setEditingName(false);
        }}
      />
    ) : (
      <span className="sub-title-deck rule-title-plain">{readingNote.title || t('conocimiento.title')}</span>
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
            <button className="cards-gear-item" onClick={() => editNote(readingNote)}>{t('cards.editCard')}</button>
            <button className="cards-gear-item" onClick={() => { setMenuOpen(false); setNameDraft(readingNote.title ?? ''); setEditingName(true); }}>{t('cards.renameDeck')}</button>
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); removeNote(readingNote.id); backToList(); }}>{t('cards.deleteCard')}</button>
          </div>
        )}
      </div>
    );
  } else {
    pageTitle = t('conocimiento.title');
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
            <button className="cards-gear-item" onClick={addGroup}>{t('conocimiento.addGroup')}</button>
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
        <label className="cards-field-label">{t('conocimiento.titleLabel')}</label>
        <input
          className="cards-field-input"
          value={title}
          autoFocus
          placeholder={t('conocimiento.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
        <label className="cards-field-label">{t('conocimiento.bodyLabel')}</label>
        <RichEditor
          editKey={open === 'new' ? 'new' : currentNote.id}
          initialValue={body}
          onChange={setBody}
          onSubmit={submit}
          placeholder={t('conocimiento.bodyPlaceholder')}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={backToList}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
            {t('cards.save')}
          </button>
        </div>
      </div>
    );
  } else if (readingNote) {
    content = (
      <div className="rule-read">
        {readingNote.body
          ? <div className="rule-read-body">{renderBody(readingNote.body)}</div>
          : <div className="empty-hint">{t('conocimiento.noBody')}</div>}
      </div>
    );
  } else {
    const noteById = new Map(notes.map((r) => [r.id, r]));
    const groupById = new Map(groups.map((g) => [g.id, g]));
    const gripNote = q ? null : (e, r) => startDrag(e, 'note', r.id, r.title || t('conocimiento.noBody'));
    const gripGroup = q ? null : (e, g) => startDrag(e, 'group', g.id, g.name);

    // Recursively render a list of tree nodes: rule leaves as cards, group nodes
    // as folders whose children are rendered the same way (any depth).
    const renderNodes = (nodes) => nodes.map((n) => {
      if (n.t === 'r') {
        const r = noteById.get(n.id);
        if (!r) return null;
        return <NotaCard key={'r:' + n.id} nota={r} dragging={dragKey === 'r:' + n.id} onGrip={gripNote} onOpen={openFull} t={t} />;
      }
      const g = groupById.get(n.id);
      if (!g) return null;
      return (
        <CarpetaVisor
          key={'g:' + g.id}
          group={g}
          count={collectItemIds(n.children).length}
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
        </CarpetaVisor>
      );
    });

    // Flat list of matching notas while searching (hierarchy hidden).
    const searchHits = q ? notes.filter(matches) : [];
    const nothing = q ? searchHits.length === 0 : renderLayout.length === 0;

    content = (
      <>
        <div className="search-add-row">
          {notes.length > 0 && (
            <div className="cards-search open">
              <svg className="cards-search-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                className="cards-search-input"
                placeholder={t('conocimiento.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
              />
              {query && (
                <button className="cards-search-close" onClick={() => setQuery('')} aria-label={t('cards.close')}>×</button>
              )}
            </div>
          )}
          <button className="search-add-btn" onClick={openNew} aria-label={t('conocimiento.new')}>+</button>
        </div>

        {notes.length === 0 && groups.length === 0 ? null
          : nothing && q ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : q ? (
          <div className="rules-list">
            {searchHits.map((r) => (
              <NotaCard key={'r:' + r.id} nota={r} dragging={false} onGrip={null} onOpen={openFull} t={t} />
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
      <div className="conocimiento">{content}</div>
    </SubPage>
  );
}
