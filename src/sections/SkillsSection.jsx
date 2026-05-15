import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';

export default function SkillsSection() {
  const { profile, update } = useProfile();
  const [newSkill, setNewSkill] = useState('');

  const setSkills = (skills) => update({ skills });

  const addXp = (i, amount) => {
    setSkills(
      profile.skills.map((s, idx) => {
        if (idx !== i) return s;
        let xp = s.xp + amount;
        let level = s.level;
        while (xp >= 100) { xp -= 100; level += 1; }
        while (xp < 0 && level > 0) { xp += 100; level -= 1; }
        if (xp < 0) xp = 0;
        return { ...s, xp, level };
      })
    );
  };

  const addSkill = () => {
    const n = newSkill.trim();
    if (!n) return;
    setSkills([...profile.skills, { name: n, level: 0, xp: 0 }]);
    setNewSkill('');
  };
  const removeSkill = (i) => setSkills(profile.skills.filter((_, idx) => idx !== i));

  return (
    <>
      <ul className="skills">
        {profile.skills.map((s, i) => (
          <li key={s.name + i} className="skill">
            <div className="skill-head">
              <span className="skill-name">{s.name}</span>
              <span className="skill-level">Ур. {s.level}</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${s.xp}%` }} />
            </div>
            <div className="skill-actions">
              <button onClick={() => addXp(i, -10)}>−10</button>
              <span className="xp-text">{s.xp}/100</span>
              <button onClick={() => addXp(i, +10)}>+10</button>
              <button className="remove" onClick={() => removeSkill(i)}>✕</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-skill">
        <input
          placeholder="Новый навык"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          maxLength={32}
        />
        <button onClick={addSkill}>+</button>
      </div>
    </>
  );
}
