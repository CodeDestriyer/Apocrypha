import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import { TASK_TYPES, TYPE_ORDER, DEFAULT_TYPE, typeOf, TaskShape } from './taskTypes.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// "Tareas" — a simple daily to-do list. Jot down what you want to get done
// today, tick items off, drop them when finished. Each task carries a type
// (Español / Varkanis / Cuerpo / Estudio) shown as a coloured shape that fills
// in when done. Each task is { id, title, done, type, created_at } on
// profile.tasks (newest first).
export default function TareasSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];

  const setTasks = (updater) =>
    update((curr) => ({ tasks: updater(Array.isArray(curr.tasks) ? curr.tasks : []) }));

  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState(DEFAULT_TYPE);
  const [menuId, setMenuId] = useState(null); // id of the task whose gear menu is open
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuId == null) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((l) => [{ id: newId(), title, done: false, type: draftType, created_at: new Date().toISOString() }, ...l]);
    setDraft('');
  };
  const toggle = (id) =>
    setTasks((l) => l.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const setType = (id, type) => {
    setTasks((l) => l.map((x) => (x.id === id ? { ...x, type } : x)));
    setMenuId(null);
  };
  const remove = (id) => { setTasks((l) => l.filter((x) => x.id !== id)); setMenuId(null); };
  const clearDone = () => setTasks((l) => l.filter((x) => !x.done));

  const doneCount = tasks.filter((x) => x.done).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  // Open tasks first, completed sink to the bottom — each group newest first.
  const ordered = [
    ...tasks.filter((x) => !x.done),
    ...tasks.filter((x) => x.done),
  ];

  return (
    <SubPage title={t('tareas.title')} onBack={rootOnBack}>
      <div className="tareas">
        <div className="tareas-type-picker">
          {TYPE_ORDER.map((tp) => (
            <button
              key={tp}
              className={`tareas-type-chip ${draftType === tp ? 'active' : ''}`}
              style={{ '--type-color': TASK_TYPES[tp].color }}
              onClick={() => setDraftType(tp)}
              aria-pressed={draftType === tp}
              title={t(TASK_TYPES[tp].labelKey)}
            >
              <TaskShape type={tp} done={draftType === tp} size={20} />
              <span className="tareas-type-chip-label">{t(TASK_TYPES[tp].labelKey)}</span>
            </button>
          ))}
        </div>

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

        {tasks.length === 0 ? (
          <div className="empty-hint">{t('tareas.empty')}</div>
        ) : (
          <>
            {allDone && <div className="tareas-done-banner">{t('tareas.allDone')}</div>}
            <ul className="tareas-list">
              {ordered.map((task) => {
                const ty = typeOf(task);
                return (
                  <li key={task.id} className={`tareas-item ${task.done ? 'done' : ''}`}>
                    <button
                      className="tareas-check"
                      onClick={() => toggle(task.id)}
                      role="checkbox"
                      aria-checked={task.done}
                      aria-label={task.title}
                    >
                      <TaskShape type={ty} done={task.done} size={26} />
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
                          <div className="tareas-gear-heading">{t('tareas.typeLabel')}</div>
                          <div className="tareas-gear-types">
                            {TYPE_ORDER.map((tp) => (
                              <button
                                key={tp}
                                className={`tareas-gear-type ${ty === tp ? 'active' : ''}`}
                                onClick={() => setType(task.id, tp)}
                              >
                                <TaskShape type={tp} done size={18} />
                                <span>{t(TASK_TYPES[tp].labelKey)}</span>
                              </button>
                            ))}
                          </div>
                          <button className="tareas-gear-del" onClick={() => remove(task.id)}>{t('body.delete')}</button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {doneCount > 0 && (
              <button className="tareas-clear" onClick={clearDone}>{t('tareas.clearDone')}</button>
            )}
          </>
        )}
      </div>
    </SubPage>
  );
}
