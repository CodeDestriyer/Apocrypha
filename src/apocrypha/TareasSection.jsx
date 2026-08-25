import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import {
  TASK_TYPES, TYPE_ORDER, DEFAULT_TYPE, typeOf, TaskShape,
  todayISO, shiftISO, taskDay, isRestDay,
} from './taskTypes.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  try { return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); }
  catch { return iso; }
};

// "Tareas" — a per-day to-do list. Page through days with the arrows at the
// top; each day holds its own tasks. Every task carries a type (Español /
// Varkanis / Cuerpo / Estudio), shown as a coloured shape that fills in when
// done; the list is grouped by type. A task is
// { id, title, done, type, day, created_at } on profile.tasks.
export default function TareasSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];

  const setTasks = (updater) =>
    update((curr) => ({ tasks: updater(Array.isArray(curr.tasks) ? curr.tasks : []) }));

  const [day, setDay] = useState(todayISO());
  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState(DEFAULT_TYPE);
  const [menuId, setMenuId] = useState(null);   // task with its gear menu open
  const [editId, setEditId] = useState(null);   // task being edited
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState(DEFAULT_TYPE);
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuId == null) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  const goDay = (delta) => { setDay((d) => shiftISO(d, delta)); setMenuId(null); setEditId(null); };

  // ---- Drag-to-reorder ----------------------------------------------------
  // Rows render in profile.tasks order (within each type group). Dragging a row
  // rewrites that array so the new order persists. Pointer-based so it works
  // with touch (mobile PWA); a drag stays inside one list (a type group, or the
  // flat past-day list) and never changes a task's type.
  const rowRefs = useRef(new Map());
  const setRowRef = (id) => (el) => { if (el) rowRefs.current.set(id, el); else rowRefs.current.delete(id); };
  const [drag, setDrag] = useState(null); // { listKey, order:[ids], id } while dragging
  const dragPid = useRef(null);

  // Rewrite tasks so the given list's ids take `orderIds` order, leaving every
  // other task (other days/types) exactly where it is.
  const commitOrder = (orderIds) => setTasks((l) => {
    const set = new Set(orderIds);
    const byId = new Map(l.map((x) => [x.id, x]));
    const queue = orderIds.map((id) => byId.get(id)).filter(Boolean);
    let qi = 0;
    return l.map((x) => (set.has(x.id) ? queue[qi++] : x));
  });

  const onDragStart = (e, listKey, ids, id) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    dragPid.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setMenuId(null); setEditId(null);
    setDrag({ listKey, order: [...ids], id });
  };
  const onDragMove = (e) => {
    if (!drag || e.pointerId !== dragPid.current) return;
    e.preventDefault();
    const y = e.clientY;
    const rects = drag.order
      .map((id) => { const el = rowRefs.current.get(id); return el ? { id, r: el.getBoundingClientRect() } : null; })
      .filter(Boolean);
    let target = rects.length - 1;
    for (let i = 0; i < rects.length; i++) {
      if (y < rects[i].r.top + rects[i].r.height / 2) { target = i; break; }
    }
    const cur = [...drag.order];
    const from = cur.indexOf(drag.id);
    if (from === -1) return;
    cur.splice(from, 1);
    cur.splice(target, 0, drag.id);
    if (cur.some((id, i) => id !== drag.order[i])) setDrag({ ...drag, order: cur });
  };
  const onDragEnd = (e) => {
    if (!drag) return;
    if (e && e.pointerId != null && e.pointerId !== dragPid.current) return;
    commitOrder(drag.order);
    setDrag(null);
    dragPid.current = null;
  };
  // While dragging, an active list shows its rows in the live drag order.
  const orderedItems = (items, listKey) => {
    if (!drag || drag.listKey !== listKey) return items;
    const byId = new Map(items.map((x) => [x.id, x]));
    return drag.order.map((id) => byId.get(id)).filter(Boolean);
  };

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    // New tasks land at the bottom of their type group, on the current day.
    setTasks((l) => [...l, { id: newId(), title, done: false, type: draftType, day, created_at: new Date().toISOString() }]);
    setDraft('');
  };
  const toggle = (id) =>
    setTasks((l) => l.map((x) => (x.id === id ? { ...x, done: !x.done, missed: false } : x)));
  // Right-click marks a task as NOT done for the day (struck shape); persists.
  const toggleMissed = (id) =>
    setTasks((l) => l.map((x) => (x.id === id ? { ...x, missed: !x.missed, done: false } : x)));
  const remove = (id) => { setTasks((l) => l.filter((x) => x.id !== id)); setMenuId(null); setEditId(null); };

  const startEdit = (task) => {
    setEditId(task.id); setEditText(task.title); setEditType(typeOf(task)); setMenuId(null);
  };
  const saveEdit = () => {
    const title = editText.trim();
    if (!title) { remove(editId); return; }
    setTasks((l) => l.map((x) => (x.id === editId ? { ...x, title, type: editType } : x)));
    setEditId(null);
  };
  const cancelEdit = () => setEditId(null);

  const dayTasks = tasks.filter((x) => taskDay(x) === day);
  const groups = TYPE_ORDER
    .map((tp) => ({ type: tp, items: dayTasks.filter((x) => typeOf(x) === tp) }))
    .filter((g) => g.items.length);
  // Past days show a plain flat list (no type headings); today (and future)
  // keep the type-grouped layout with labels.
  const isPast = day < todayISO();

  const showTypePicker = draft.trim().length > 0;
  // Saturdays are a rest day: no adding, no list — just the "Día libre" screen.
  // Any tasks that already live on a Saturday stay in the profile, just hidden.
  const restDay = isRestDay(day);

  const dayLabel = fmtDate(day);

  const renderTask = (task, listKey, ids) => {
    const ty = typeOf(task);
    if (editId === task.id) {
      return (
        <li key={task.id} className="tareas-item tareas-item--editing">
          <div className="tareas-edit">
            <input
              className="cards-field-input"
              value={editText}
              autoFocus
              placeholder={t('tareas.placeholder')}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              maxLength={120}
            />
            {typePicker(editType, setEditType)}
            <div className="tareas-edit-actions">
              <button className="cards-secondary-btn" onClick={cancelEdit}>{t('cards.cancel')}</button>
              <button className="cards-primary-btn" onClick={saveEdit} disabled={!editText.trim()}>{t('body.save')}</button>
            </div>
          </div>
        </li>
      );
    }
    return (
      <li
        key={task.id}
        ref={setRowRef(task.id)}
        className={`tareas-item ${task.done ? 'done' : ''} ${task.missed ? 'missed' : ''} ${drag && drag.id === task.id ? 'dragging' : ''}`}
      >
        <button
          className="tareas-check"
          onClick={() => toggle(task.id)}
          onContextMenu={(e) => { e.preventDefault(); toggleMissed(task.id); }}
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.title}
        >
          <TaskShape type={ty} done={task.done} missed={task.missed} size={26} />
        </button>
        <span className="tareas-text" onClick={() => toggle(task.id)}>{task.title}</span>
        <div className="tareas-gear" ref={menuId === task.id ? menuRef : null}>
          <button
            className="tareas-gear-btn"
            onClick={() => setMenuId((cur) => (cur === task.id ? null : task.id))}
            aria-label={t('tareas.typeLabel')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d={GEAR_PATH} />
            </svg>
          </button>
          {menuId === task.id && (
            <div className="tareas-gear-menu">
              <button className="tareas-gear-item" onClick={() => startEdit(task)}>{t('tareas.edit')}</button>
              <button className="tareas-gear-item tareas-gear-item--danger" onClick={() => remove(task.id)}>{t('body.delete')}</button>
            </div>
          )}
        </div>
        <button
          className="tareas-drag"
          aria-label={t('tareas.reorder')}
          title={t('tareas.reorder')}
          onPointerDown={(e) => onDragStart(e, listKey, ids, task.id)}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 8h16M4 12h16M4 16h16" />
          </svg>
        </button>
      </li>
    );
  };

  const typePicker = (selected, onPick) => (
    <div className="tareas-type-picker">
      {TYPE_ORDER.map((tp) => (
        <button
          key={tp}
          className={`tareas-type-chip ${selected === tp ? 'active' : ''}`}
          style={{ '--type-color': TASK_TYPES[tp].color }}
          onClick={() => onPick(tp)}
          aria-pressed={selected === tp}
          title={t(TASK_TYPES[tp].labelKey)}
        >
          <TaskShape type={tp} done={selected === tp} size={22} />
        </button>
      ))}
    </div>
  );

  return (
    <SubPage title={t('tareas.title')} onBack={rootOnBack}>
      <div className="tareas">
        <div className="tareas-daynav">
          <button className="tareas-day-arrow" onClick={() => goDay(-1)} aria-label={t('tareas.yesterday')}>‹</button>
          <span className="tareas-day-label">{dayLabel}</span>
          <button className="tareas-day-arrow" onClick={() => goDay(1)} aria-label={t('tareas.tomorrow')}>›</button>
        </div>

        {restDay ? (
          <div className="tareas-rest">{t('tareas.diaLibre')}</div>
        ) : (
          <>
            <div className="tareas-add-row">
              <input
                className="cards-field-input tareas-input"
                value={draft}
                placeholder={t('tareas.placeholder')}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                maxLength={120}
              />
              <button className="tareas-add-btn" onClick={add} disabled={!draft.trim()} aria-label={t('tareas.add')}>+</button>
            </div>

            {showTypePicker && typePicker(draftType, setDraftType)}

            <div className="tareas-groups">
              {isPast ? (() => {
                const flat = groups.flatMap((g) => g.items);
                const lk = `${day}::flat`;
                const ids = flat.map((x) => x.id);
                return (
                  <ul className="tareas-list">
                    {orderedItems(flat, lk).map((task) => renderTask(task, lk, ids))}
                  </ul>
                );
              })() : (
                groups.map((g) => {
                  const lk = `${day}::${g.type}`;
                  const ids = g.items.map((x) => x.id);
                  return (
                    <div className="tareas-group" key={g.type}>
                      <div className="tareas-group-label" style={{ color: TASK_TYPES[g.type].color }}>
                        {t(TASK_TYPES[g.type].labelKey)}
                      </div>
                      <ul className="tareas-list">
                        {orderedItems(g.items, lk).map((task) => renderTask(task, lk, ids))}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </SubPage>
  );
}
