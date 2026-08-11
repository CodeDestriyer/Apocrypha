import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import { signOut } from '../supabase.js';
import { WeightGraph, latestEntry } from './weightChart.jsx';
import { typeOf, TaskShape } from './taskTypes.jsx';

const NAV = [
  { id: 'tareas', labelKey: 'nav.tareas', icon: '✓', summary: (p) => {
    const tasks = Array.isArray(p.tasks) ? p.tasks : [];
    return tasks.length ? `${tasks.filter((x) => x.done).length}/${tasks.length}` : '—';
  } },
  { id: 'idiomas', labelKey: 'nav.idiomas', icon: '✦', summary: (p) => (p.decks ?? []).reduce((s, d) => s + (d.cards ?? []).length, 0) },
  { id: 'salud', labelKey: 'nav.salud', icon: '✚', summary: () => '—' },
  // Cuerpo (Body) tab is built (see App.jsx / BodySection.jsx) but hidden for
  // now — no nav entry points to it. Re-add this to bring it back:
  // { id: 'body', labelKey: 'nav.body', icon: '⚖', summary: (p) => {
  //   const log = Array.isArray(p.weight_log) ? p.weight_log : [];
  //   return log.length ? `${log[0].weight} kg` : '—';
  // } },
];
const NAV_BY_ID = Object.fromEntries(NAV.map((n) => [n.id, n]));
const DEFAULT_ORDER = NAV.map((n) => n.id);
const DEFAULT_HIDDEN = [];
const MAXING_IDS = [];

const PREFS_KEY = 'lr.modulePrefs';

function reconcilePrefs(stored) {
  const knownInOrder = (stored?.order ?? []).filter((id) => NAV_BY_ID[id]);
  const missing = DEFAULT_ORDER.filter((id) => !knownInOrder.includes(id));
  const baseHidden = stored?.hidden
    ? stored.hidden.filter((id) => NAV_BY_ID[id])
    : [...DEFAULT_HIDDEN];
  // Newly-introduced modules that ship hidden-by-default get hidden
  // for existing users too, so they have to opt-in explicitly.
  const newlyHidden = missing.filter((id) => DEFAULT_HIDDEN.includes(id) && !baseHidden.includes(id));
  return {
    order: [...knownInOrder, ...missing],
    hidden: [...baseHidden, ...newlyHidden],
  };
}

function readLegacyPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function useModulePrefs() {
  const { profile, update } = useProfile();
  const stored = profile?.module_prefs ?? null;

  useEffect(() => {
    if (stored) return;
    const legacy = readLegacyPrefs();
    if (legacy && (legacy.order?.length || legacy.hidden?.length)) {
      update({ module_prefs: reconcilePrefs(legacy) });
      try { localStorage.removeItem(PREFS_KEY); } catch {}
    }
  }, [stored]);

  const prefs = reconcilePrefs(stored);
  const setPrefs = (next) => {
    const value = typeof next === 'function' ? next(prefs) : next;
    update({ module_prefs: reconcilePrefs(value) });
  };
  return [prefs, setPrefs];
}

function SettingsMenu({ setEditing, setEditingInfo }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const openModules = () => {
    setEditing(true);
    setOpen(false);
  };
  const openInfo = () => {
    setEditingInfo(true);
    setOpen(false);
  };

  return (
    <div className="settings-menu" ref={ref}>
      <button
        className="settings-btn"
        onClick={() => setOpen((o) => !o)}
        title={t('settings.title')}
        aria-label={t('settings.title')}
      >
        ⚙
      </button>
      {open && (
        <div className="settings-dropdown">
          <button className="settings-row" onClick={openInfo}>
            <span>{t('settings.info')}</span>
            <span className="settings-row-value">›</span>
          </button>
          <button className="settings-row" onClick={openModules}>
            <span>{t('settings.modules')}</span>
            <span className="settings-row-value">›</span>
          </button>
          <div className="settings-sep" />
          <button className="settings-row settings-logout" onClick={() => signOut()}>
            <span>{t('settings.logout')}</span>
            <span className="settings-row-value">⎋</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Total XP earned — accumulates, no levels.
function XpBadge({ xp }) {
  return <span className="xp-badge" title={`${xp} XP`}>{xp} <span className="xp-badge-suffix">xp</span></span>;
}

function NavGrid({ profile, onNavigate, prefs, setPrefs, editing, setEditing }) {
  const { t } = useLang();
  const gridRef = useRef(null);
  const dragState = useRef(null);
  const [dragId, setDragId] = useState(null);

  // When editing — flat list (so user can reorder/hide each maxing module).
  // When browsing — core modules only; maxing collapses into one "maxing" card.
  const renderedIds = editing
    ? prefs.order.filter((id) => NAV_BY_ID[id])
    : prefs.order.filter((id) => NAV_BY_ID[id] && !prefs.hidden.includes(id) && !MAXING_IDS.includes(id));
  const enabledMaxing = MAXING_IDS.filter((id) => !prefs.hidden.includes(id));

  const toggleHidden = (id) =>
    setPrefs((p) => {
      const isHidden = p.hidden.includes(id);
      return { ...p, hidden: isHidden ? p.hidden.filter((x) => x !== id) : [...p.hidden, id] };
    });

  const onPointerDown = (e, id) => {
    if (!editing) return;
    if (e.target.closest('.nav-check')) return;
    e.preventDefault();
    const card = e.currentTarget;
    card.setPointerCapture?.(e.pointerId);
    dragState.current = { id, pointerId: e.pointerId, card };
    setDragId(id);
  };

  const onPointerMove = (e) => {
    const st = dragState.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll('.nav-card'));
    const target = cards.find((c) => {
      if (c === st.card) return false;
      const r = c.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (target) {
      const targetId = target.dataset.id;
      setPrefs((p) => {
        const order = [...p.order];
        const from = order.indexOf(st.id);
        const to = order.indexOf(targetId);
        if (from === -1 || to === -1 || from === to) return p;
        order.splice(from, 1);
        order.splice(to, 0, st.id);
        return { ...p, order };
      });
    }
  };

  const onPointerUp = (e) => {
    const st = dragState.current;
    if (!st || st.pointerId !== e.pointerId) return;
    st.card.releasePointerCapture?.(e.pointerId);
    dragState.current = null;
    setDragId(null);
  };

  return (
    <>
      <div className={`nav-grid ${editing ? 'editing' : ''}`} ref={gridRef}>
        {renderedIds.map((id) => {
          const n = NAV_BY_ID[id];
          const isHidden = prefs.hidden.includes(id);
          return (
            <button
              key={id}
              data-id={id}
              className={`nav-card ${editing ? 'wobble' : ''} ${dragId === id ? 'dragging' : ''} ${editing && isHidden ? 'hidden-module' : ''}`}
              onClick={() => { if (!editing) onNavigate(id); }}
              onPointerDown={(e) => onPointerDown(e, id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {editing && (
                <span
                  className={`nav-check ${isHidden ? 'off' : 'on'}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); toggleHidden(id); }}
                  role="checkbox"
                  aria-checked={!isHidden}
                >{!isHidden && <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</span>
              )}
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{t(n.labelKey)}</span>
              <span className="nav-summary">{n.summary(profile)}</span>
            </button>
          );
        })}
      </div>

      {editing && (
        <button className="settings-done nav-done" onClick={() => setEditing(false)}>
          {t('settings.done')}
        </button>
      )}
    </>
  );
}

// Hero stat cubes: a big "PESO" square with the live weight chart + weight,
// plus a "TAREAS" square holding the day's to-do list, on the left of the Hero
// card. Tapping Peso opens Peso; tapping Tareas opens the task list.
function HeroCubes({ t, onNavigate, log, tasks, onToggleTask }) {
  const latest = latestEntry(log);
  const unit = t('body.unit');
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const done = list.filter((x) => x.done).length;
  // Preview: open tasks first, then completed — a few of each fit the cube.
  const preview = [...list.filter((x) => !x.done), ...list.filter((x) => x.done)].slice(0, 5);
  const extra = total - preview.length;
  const openTareas = () => onNavigate && onNavigate('tareas');
  return (
    <div className="hero-cubes">
      <button
        type="button"
        className="hero-cube hero-cube--peso weight-card weight-card--link"
        aria-label={t('weight.title')}
        onClick={() => onNavigate && onNavigate('peso')}
      >
        <div className="weight-card-head">
          <span className="weight-card-title">{t('weight.title')}</span>
          {latest
            ? <span className="weight-card-current">{latest.weight} {unit}</span>
            : <span className="weight-card-tag">{t('weight.soon')}</span>}
        </div>
        <div className="weight-card-plot">
          {latest ? (
            <WeightGraph log={log} interactive={false} compact />
          ) : (
            <svg className="weight-card-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line className="weight-card-grid" x1="0" y1="25" x2="100" y2="25" />
              <line className="weight-card-grid" x1="0" y1="50" x2="100" y2="50" />
              <line className="weight-card-grid" x1="0" y1="75" x2="100" y2="75" />
              <polyline className="weight-card-line" points="3,70 21,58 39,63 57,42 75,49 97,28" />
            </svg>
          )}
        </div>
      </button>
      {/* A plain div, not a button, so the per-task shapes can be real toggle
          buttons inside it. Clicking anywhere else on the cube opens Tareas. */}
      <div
        className="hero-cube hero-cube--tareas weight-card--link"
        role="button"
        tabIndex={0}
        aria-label={t('tareas.title')}
        onClick={openTareas}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTareas(); } }}
      >
        <div className="weight-card-head">
          <span className="weight-card-title">{t('tareas.title')}</span>
          {total > 0 && <span className="tareas-cube-count">{done}/{total}</span>}
        </div>
        <div className="tareas-cube-body">
          {total > 0 ? (
            <ul className="tareas-cube-list">
              {preview.map((task) => (
                <li key={task.id} className={`tareas-cube-item ${task.done ? 'done' : ''}`}>
                  <button
                    type="button"
                    className="tareas-cube-shape"
                    onClick={(e) => { e.stopPropagation(); onToggleTask && onToggleTask(task.id); }}
                    aria-label={task.title}
                    aria-pressed={task.done}
                  >
                    <TaskShape type={typeOf(task)} done={task.done} size={17} />
                  </button>
                  <span className="tareas-cube-text">{task.title}</span>
                </li>
              ))}
              {extra > 0 && <li className="tareas-cube-more">+{extra}</li>}
            </ul>
          ) : (
            <span className="tareas-cube-empty">{t('tareas.cubeEmpty')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CharacterPage({ onNavigate, hideNav = false, showNav = true, extra = null }) {
  const { profile, update, googleAvatar } = useProfile();
  const { t } = useLang();
  const [prefs, setPrefs] = useModulePrefs();
  const [editing, setEditing] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  const setName = (name) => update({ name });

  const weightLog = Array.isArray(profile.weight_log) ? profile.weight_log : [];
  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];
  const toggleTask = (id) =>
    update((curr) => {
      const list = Array.isArray(curr.tasks) ? curr.tasks : [];
      return { tasks: list.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) };
    });

  return (
    <div className="card character-card">
      <SettingsMenu setEditing={setEditing} setEditingInfo={setEditingInfo} />
      <div className="char-layout">
        <div className="avatar avatar-big">
          {googleAvatar ? (
            <img className="avatar-img" src={googleAvatar} alt="Avatar de usuario — Varkanis" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar-fallback">{(profile.name || '?').trim().charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="char-info">
          {editingInfo ? (
            <input
              autoFocus
              className="name-input name-input-blink"
              value={profile.name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
            />
          ) : (
            <h1 className="name">
              <span className="name-text">{profile.name || '—'}</span>
            </h1>
          )}
        </div>
      </div>
      {editingInfo && (
        <button className="settings-done nav-done" onClick={() => setEditingInfo(false)}>
          {t('settings.done')}
        </button>
      )}

      <HeroCubes t={t} onNavigate={onNavigate} log={weightLog} tasks={tasks} onToggleTask={toggleTask} />

      {!hideNav && (showNav || editing) && <div className="divider" />}

      {!hideNav && (showNav || editing) && (
        <NavGrid
          profile={profile}
          onNavigate={onNavigate}
          prefs={prefs}
          setPrefs={setPrefs}
          editing={editing}
          setEditing={setEditing}
        />
      )}

      {extra}
    </div>
  );
}
