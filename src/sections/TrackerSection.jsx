import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

export default function TrackerSection({ field, placeholder }) {
  const { profile, update } = useProfile();
  const items = profile[field] ?? [];
  const [name, setName] = useState('');

  const setItems = (next) => update({ [field]: next });

  const bump = (id, delta) => {
    setItems(
      items.map((s) => {
        if (s.id !== id) return s;
        let xp = s.xp + delta;
        let level = s.level;
        while (xp >= 100) { xp -= 100; level += 1; }
        while (xp < 0 && level > 0) { xp += 100; level -= 1; }
        if (xp < 0) xp = 0;
        return { ...s, xp, level };
      })
    );
  };

  const add = () => {
    const n = name.trim();
    if (!n) return;
    setItems([...items, { id: newId(), name: n, level: 0, xp: 0 }]);
    setName('');
  };
  const remove = (id) => setItems(items.filter((s) => s.id !== id));

  return (
    <>
      <ul className="skills">
        {items.map((s) => (
          <li key={s.id} className="skill">
            <div className="skill-head">
              <span className="skill-name">{s.name}</span>
              <span className="skill-level">Ур. {s.level}</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${s.xp}%` }} />
            </div>
            <div className="skill-actions">
              <button onClick={() => bump(s.id, -10)}>−10</button>
              <span className="xp-text">{s.xp}/100</span>
              <button onClick={() => bump(s.id, +10)}>+10</button>
              <button className="remove" onClick={() => remove(s.id)}>✕</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-skill">
        <input
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          maxLength={48}
        />
        <button onClick={add}>+</button>
      </div>
    </>
  );
}
