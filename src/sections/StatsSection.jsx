import { useProfile } from '../ProfileContext.jsx';

export default function StatsSection() {
  const { profile, update } = useProfile();
  const bump = (key, delta) => {
    update({
      stats: profile.stats.map((s) =>
        s.key === key ? { ...s, value: Math.max(0, s.value + delta) } : s
      ),
    });
  };
  return (
    <ul className="stats">
      {profile.stats.map((s) => (
        <li key={s.key} className="stat">
          <span className="stat-key">{s.key}</span>
          <span className="stat-label">{s.label}</span>
          <span className="stat-controls">
            <button onClick={() => bump(s.key, -1)}>−</button>
            <span className="stat-value">{s.value}</span>
            <button onClick={() => bump(s.key, +1)}>+</button>
          </span>
        </li>
      ))}
    </ul>
  );
}
