import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';

const AVATARS = ['⚔️', '🧙', '🏹', '🛡️', '🗡️', '🐺', '🦊', '🦅'];

const NAV = [
  { id: 'goals',       label: 'Цели',         icon: '✧', summary: (p) => (p.goals ?? []).filter((g) => !g.done).length },
  { id: 'skills',      label: 'Навыки',       icon: '✦', summary: (p) => (p.skills ?? []).reduce((s, v) => s + v.level, 0) },
  { id: 'asceses',     label: 'Аскезы',       icon: '☥', summary: (p) => (p.asceses ?? []).filter((a) => a.status === 'active').length },
  { id: 'moneymaxing', label: 'Moneymaxing',  icon: '❖', summary: (p) => (p.moneymaxing ?? []).length },
  { id: 'looksmaxing', label: 'Looksmaxing',  icon: '✺', summary: (p) => (p.looksmaxing ?? []).length },
];

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
  const [editingName, setEditingName] = useState(false);

  const cycleAvatar = () => update({ avatar_idx: (profile.avatar_idx + 1) % AVATARS.length });
  const setName = (name) => update({ name });

  return (
    <div className="card character-card">
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
            <span className="nav-label">{n.label}</span>
            <span className="nav-summary">{n.summary(profile)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
