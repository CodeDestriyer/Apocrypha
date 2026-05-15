import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import Section from '../Section.jsx';
import StatsSection from '../sections/StatsSection.jsx';

const AVATARS = ['⚔️', '🧙', '🏹', '🛡️', '🗡️', '🐺', '🦊', '🦅'];

const NAV = [
  { id: 'goals',       label: 'Цели',         icon: '✧', summary: (p) => (p.goals ?? []).filter((g) => !g.done).length },
  { id: 'skills',      label: 'Навыки',       icon: '✦', summary: (p) => (p.skills ?? []).reduce((s, v) => s + v.level, 0) },
  { id: 'asceses',     label: 'Аскезы',       icon: '☥', summary: (p) => (p.asceses ?? []).filter((a) => a.status === 'active').length },
  { id: 'moneymaxing', label: 'Moneymaxing',  icon: '❖', summary: (p) => (p.moneymaxing ?? []).length },
  { id: 'looksmaxing', label: 'Looksmaxing',  icon: '✺', summary: (p) => (p.looksmaxing ?? []).length },
];

export default function CharacterPage({ onNavigate }) {
  const { profile, update } = useProfile();
  const [editingName, setEditingName] = useState(false);

  const cycleAvatar = () => update({ avatar_idx: (profile.avatar_idx + 1) % AVATARS.length });
  const setName = (name) => update({ name });
  const statsSum = profile.stats.reduce((s, v) => s + v.value, 0);

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
        </div>
      </div>

      <div className="divider" />

      <Section title="Характеристики" summary={statsSum}>
        <StatsSection />
      </Section>

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
