import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

// "Tareas" — a simple daily to-do list. Jot down what you want to get done
// today, tick items off, drop them when finished. Each task is
// { id, title, done, created_at } on profile.tasks (newest first).
export default function TareasSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];

  const setTasks = (updater) =>
    update((curr) => ({ tasks: updater(Array.isArray(curr.tasks) ? curr.tasks : []) }));

  const [draft, setDraft] = useState('');

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((l) => [{ id: newId(), title, done: false, created_at: new Date().toISOString() }, ...l]);
    setDraft('');
  };
  const toggle = (id) =>
    setTasks((l) => l.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id) => setTasks((l) => l.filter((x) => x.id !== id));
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
              {ordered.map((task) => (
                <li key={task.id} className={`tareas-item ${task.done ? 'done' : ''}`}>
                  <button
                    className={`tareas-check ${task.done ? 'on' : ''}`}
                    onClick={() => toggle(task.id)}
                    role="checkbox"
                    aria-checked={task.done}
                    aria-label={task.title}
                  >
                    {task.done && (
                      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                        <path d="M3 8.5l3.2 3.2L13 4.9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="tareas-text" onClick={() => toggle(task.id)}>{task.title}</span>
                  <button className="tareas-del" onClick={() => remove(task.id)} aria-label={t('body.delete')}>×</button>
                </li>
              ))}
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
