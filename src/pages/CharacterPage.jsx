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

function SettingsMenu() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

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
          <div className="settings-section-title">{t('lang.title')}</div>
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`settings-option ${lang === l.code ? 'active' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false); }}
            >
              {l.label}
            </button>
          ))}
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

export default function CharacterPage({ onNavigate }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const [editingName, setEditingName] = useState(false);

  const cycleAvatar = () => update({ avatar_idx: (profile.avatar_idx + 1) % AVATARS.length });
  const setName = (name) => update({ name });

  return (
    <div className="card character-card">
      <SettingsMenu />
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

      <div className="nav-grid">
        {NAV.map((n) => (
          <button key={n.id} className="nav-card" onClick={() => onNavigate(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{t(n.labelKey)}</span>
            <span className="nav-summary">{n.summary(profile)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
