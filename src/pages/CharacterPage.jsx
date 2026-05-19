import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang, LANGS } from '../i18n.jsx';

const AVATARS = ['⚔️', '🧙', '🏹', '🛡️', '🗡️', '🐺', '🦊', '🦅'];

const NAV = [
  { id: 'goals',       labelKey: 'nav.goals',       icon: '✧', summary: (p) => (p.goals ?? []).filter((g) => !g.done).length },
  { id: 'skills',      labelKey: 'nav.skills',      icon: '✦', summary: (p) => (p.skills ?? []).reduce((s, v) => s + (typeof v.rank === 'number' ? v.rank : (v.level ?? 0)), 0) },
  { id: 'asceses',     labelKey: 'nav.asceses',     icon: '☥', summary: (p) => (p.asceses ?? []).filter((a) => a.status === 'active').length },
  { id: 'moneymaxing', labelKey: 'nav.moneymaxing', icon: '❖', summary: (p) => (p.moneymaxing ?? []).length },
  { id: 'looksmaxing', labelKey: 'nav.looksmaxing', icon: '✺', summary: (p) => (p.looksmaxing ?? []).length },
];
const NAV_BY_ID = Object.fromEntries(NAV.map((n) => [n.id, n]));
const DEFAULT_ORDER = NAV.map((n) => n.id);

const PREFS_KEY = 'lr.modulePrefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { order: DEFAULT_ORDER, hidden: [] };
    const p = JSON.parse(raw);
    const knownInOrder = (p.order ?? []).filter((id) => NAV_BY_ID[id]);
    const missing = DEFAULT_ORDER.filter((id) => !knownInOrder.includes(id));
    return {
      order: [...knownInOrder, ...missing],
      hidden: (p.hidden ?? []).filter((id) => NAV_BY_ID[id]),
    };
  } catch {
    return { order: DEFAULT_ORDER, hidden: [] };
  }
}
function savePrefs(p) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {}
}

function useModulePrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => { savePrefs(prefs); }, [prefs]);
  return [prefs, setPrefs];
}

function SettingsMenu({ prefs, setPrefs, editing, setEditing }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null); // null | 'lang' | 'modules'
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setSection(null); return; }
    if (section === 'modules') return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, section]);

  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const toggleHidden = (id) => {
    setPrefs((p) => {
      const isHidden = p.hidden.includes(id);
      return { ...p, hidden: isHidden ? p.hidden.filter((x) => x !== id) : [...p.hidden, id] };
    });
  };

  const openModules = () => {
    setSection('modules');
    setEditing(true);
  };
  const finishEditing = () => {
    setEditing(false);
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
              <button className="settings-row" onClick={() => setSection('lang')}>
                <span>{t('lang.title')}</span>
                <span className="settings-row-value">{currentLang.flag}</span>
              </button>
              <button className="settings-row" onClick={openModules}>
                <span>{t('settings.modules')}</span>
                <span className="settings-row-value">›</span>
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
          {section === 'modules' && (
            <>
              <button className="settings-row settings-back" onClick={() => setSection(null)}>
                <span>‹ {t('settings.modules')}</span>
              </button>
              {prefs.order.map((id) => {
                const n = NAV_BY_ID[id];
                if (!n) return null;
                const hidden = prefs.hidden.includes(id);
                return (
                  <label key={id} className="settings-check">
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() => toggleHidden(id)}
                    />
                    <span>{t(n.labelKey)}</span>
                  </label>
                );
              })}
              <button className="settings-done" onClick={finishEditing}>
                {t('settings.done')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
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

function NavGrid({ profile, onNavigate, prefs, setPrefs, editing }) {
  const { t } = useLang();
  const gridRef = useRef(null);
  const dragState = useRef(null);
  const [dragId, setDragId] = useState(null);

  const visibleIds = prefs.order.filter((id) => NAV_BY_ID[id] && !prefs.hidden.includes(id));

  const onPointerDown = (e, id) => {
    if (!editing) return;
    if (e.target.closest('.nav-hide')) return;
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

  const hide = (id) => setPrefs((p) => ({ ...p, hidden: [...new Set([...p.hidden, id])] }));

  return (
    <div className={`nav-grid ${editing ? 'editing' : ''}`} ref={gridRef}>
      {visibleIds.map((id) => {
        const n = NAV_BY_ID[id];
        return (
          <button
            key={id}
            data-id={id}
            className={`nav-card ${editing ? 'wobble' : ''} ${dragId === id ? 'dragging' : ''}`}
            onClick={() => { if (!editing) onNavigate(id); }}
            onPointerDown={(e) => onPointerDown(e, id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{t(n.labelKey)}</span>
            <span className="nav-summary">{n.summary(profile)}</span>
            {editing && (
              <span
                className="nav-hide"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); hide(id); }}
                title="✕"
              >✕</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function CharacterPage({ onNavigate }) {
  const { profile, update } = useProfile();
  const [editingName, setEditingName] = useState(false);
  const [prefs, setPrefs] = useModulePrefs();
  const [editing, setEditing] = useState(false);

  const cycleAvatar = () => update({ avatar_idx: (profile.avatar_idx + 1) % AVATARS.length });
  const setName = (name) => update({ name });

  return (
    <div className="card character-card">
      <SettingsMenu
        prefs={prefs}
        setPrefs={setPrefs}
        editing={editing}
        setEditing={setEditing}
      />
      <div className="char-layout">
        <button className="avatar avatar-big" onClick={cycleAvatar}>
          <span>{AVATARS[profile.avatar_idx] ?? '⚔️'}</span>
        </button>
        <div className="char-info">
          {editingName ? (
            <input
              autoFocus
              className="name-input"
              value={profile.name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              maxLength={24}
            />
          ) : (
            <h1 className="name" onClick={() => setEditingName(true)}>
              {profile.name || '—'}
            </h1>
          )}
          <TagRow profile={profile} />
        </div>
      </div>

      <div className="divider" />

      <NavGrid
        profile={profile}
        onNavigate={onNavigate}
        prefs={prefs}
        setPrefs={setPrefs}
        editing={editing}
      />
    </div>
  );
}
