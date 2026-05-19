import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

const MAX_RANK = 4;
const RANKS = [0, 1, 2, 3, 4];

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

  const setRank = (i, rank) => {
    setSkills(profile.skills.map((s, idx) => (idx === i ? { ...s, rank: clamp(rank) } : s)));
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
                <RankPicker rank={r} onChange={(nr) => setRank(i, nr)} t={t} />
              </div>
              <div className="rank-pips">
                {RANKS.map((idx) => (
                  <span key={idx} className={`rank-pip ${idx <= r ? 'on' : ''}`} />
                ))}
              </div>
              <div className="skill-actions">
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

function RankPicker({ rank, onChange, t }) {
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
    <div className="rank-picker" ref={ref}>
      <button className="rank-trigger" onClick={() => setOpen((o) => !o)}>
        {t(`rank.${rank}`)}
      </button>
      {open && (
        <div className="rank-dropdown">
          {RANKS.map((idx) => (
            <button
              key={idx}
              className={`rank-option ${idx === rank ? 'active' : ''}`}
              onClick={() => { onChange(idx); setOpen(false); }}
            >
              {t(`rank.${idx}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
