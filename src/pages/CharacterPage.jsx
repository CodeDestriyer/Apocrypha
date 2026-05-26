import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang, LANGS } from '../i18n.jsx';
import { signOut } from '../supabase.js';
import CharacterModel from '../CharacterModel.jsx';

const AVATARS = [
  '/avatars/hitler.png',
  '/avatars/ganslanda.jpg',
  '/avatars/loganpaul.jpg',
];

const NAV = [
  { id: 'goals',       labelKey: 'nav.goals',       icon: '✧', summary: (p) => (p.goals ?? []).filter((g) => !g.done).length },
  { id: 'skills',      labelKey: 'nav.skills',      icon: '✦', summary: (p) => (p.skills ?? []).reduce((s, v) => s + (typeof v.rank === 'number' ? v.rank : (v.level ?? 0)), 0) },
  { id: 'asceses',     labelKey: 'nav.asceses',     icon: '☥', summary: (p) => (p.asceses ?? []).filter((a) => a.status === 'active').length },
  { id: 'moneymaxing', labelKey: 'nav.moneymaxing', icon: '❖', summary: (p) => (p.moneymaxing ?? []).length },
  { id: 'looksmaxing', labelKey: 'nav.looksmaxing', icon: '✺', summary: (p) => (p.looksmaxing ?? []).length },
  { id: 'menmaxing',   labelKey: 'nav.menmaxing',   icon: '♂', summary: (p) => (p.menmaxing ?? []).length },
];
const NAV_BY_ID = Object.fromEntries(NAV.map((n) => [n.id, n]));
const DEFAULT_ORDER = NAV.map((n) => n.id);
const DEFAULT_HIDDEN = ['moneymaxing', 'looksmaxing', 'menmaxing'];
const MAXING_IDS = ['moneymaxing', 'looksmaxing', 'menmaxing'];

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
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null); // null | 'lang' | 'modules'
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setSection(null); return; }
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

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
          {section === null && (
            <>
              <button className="settings-row" onClick={openInfo}>
                <span>{t('settings.info')}</span>
                <span className="settings-row-value">›</span>
              </button>
              <button className="settings-row" onClick={() => setSection('lang')}>
                <span>{t('lang.title')}</span>
                <span className="settings-row-value">{currentLang.flag}</span>
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
            </>
          )}
          {section === 'lang' && (
            <>
              <button className="settings-row settings-back" onClick={() => setSection(null)}>
                <span>‹ {t('lang.title')}</span>
              </button>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`settings-option ${lang === l.code ? 'active' : ''}`}
                  onClick={() => { setLang(l.code); setSection(null); }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Total XP earned — accumulates, no levels.
function XpBadge({ xp }) {
  return <span className="xp-badge" title={`${xp} XP`}>{xp} <span className="xp-badge-suffix">xp</span></span>;
}

function TagRow({ profile }) {
  const tags = [];
  if (profile.looks_rating)  tags.push({ key: 'looks', label: profile.looks_rating });
  if (profile.money_activity) tags.push({ key: 'money', label: profile.money_activity });
  if (tags.length === 0) return null;
  return (
    <div className="tag-row">
      {tags.map((t) => (
        <span key={t.key} className="tag">{t.label}</span>
      ))}
    </div>
  );
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

export default function CharacterPage({ onNavigate, hideNav = false, showNav = true, extra = null }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const [prefs, setPrefs] = useModulePrefs();
  const [editing, setEditing] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);

  const cycleAvatar = () => {
    if (!editingInfo) return;
    const idx = ((profile.avatar_idx ?? 0) % AVATARS.length + AVATARS.length) % AVATARS.length;
    update({ avatar_idx: (idx + 1) % AVATARS.length });
  };
  const setName = (name) => update({ name });

  return (
    <div className="card character-card">
      <SettingsMenu setEditing={setEditing} setEditingInfo={setEditingInfo} />
      <div className="char-layout">
        <button
          className={`avatar avatar-big ${editingInfo ? 'editable' : ''}`}
          onClick={cycleAvatar}
        >
          <img
            className="avatar-img"
            src={AVATARS[((profile.avatar_idx ?? 0) % AVATARS.length + AVATARS.length) % AVATARS.length]}
            alt=""
          />
        </button>
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
              <span className="name-sep" aria-hidden="true">✦</span>
              <XpBadge xp={profile.xp ?? 0} />
            </h1>
          )}
          <TagRow profile={profile} />
        </div>
      </div>
      {editingInfo && (
        <button className="settings-done nav-done" onClick={() => setEditingInfo(false)}>
          {t('settings.done')}
        </button>
      )}

      {hideNav && (
        <div className="character-model-stage">
          <CharacterModel src="/man.glb" />
        </div>
      )}

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
