import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const MAX_RANK = 4;

const rankOf = (s) => {
  if (typeof s.rank === 'number') return clamp(s.rank);
  if (typeof s.level === 'number') return clamp(s.level);
  return 0;
};
const clamp = (n) => Math.max(0, Math.min(MAX_RANK, n));

export default function SkillsSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const [newSkill, setNewSkill] = useState('');

  const setSkills = (skills) => update({ skills });

  const bumpRank = (i, delta) => {
    setSkills(
      profile.skills.map((s, idx) =>
        idx === i ? { ...s, rank: clamp(rankOf(s) + delta) } : s
      )
    );
  };

  const addSkill = () => {
    const n = newSkill.trim();
    if (!n) return;
    setSkills([...profile.skills, { name: n, rank: 0 }]);
    setNewSkill('');
  };
  const removeSkill = (i) => setSkills(profile.skills.filter((_, idx) => idx !== i));

  return (
    <>
      <ul className="skills">
        {profile.skills.map((s, i) => {
          const r = rankOf(s);
          return (
            <li key={s.name + i} className="skill">
              <div className="skill-head">
                <span className="skill-name">{s.name}</span>
                <span className="skill-rank">{t(`rank.${r}`)}</span>
              </div>
              <div className="rank-pips">
                {Array.from({ length: MAX_RANK + 1 }, (_, idx) => (
                  <span
                    key={idx}
                    className={`rank-pip ${idx <= r ? 'on' : ''}`}
                  />
                ))}
              </div>
              <div className="skill-actions">
                <button onClick={() => bumpRank(i, -1)} disabled={r === 0}>−</button>
                <button onClick={() => bumpRank(i, +1)} disabled={r === MAX_RANK}>+</button>
                <button className="remove" onClick={() => removeSkill(i)}>✕</button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="add-skill">
        <input
          placeholder={t('skill.new')}
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
