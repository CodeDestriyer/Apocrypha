import { useProfile } from '../ProfileContext.jsx';
import TrackerSection from './TrackerSection.jsx';

export default function MoneymaxingSection() {
  const { profile, update } = useProfile();

  return (
    <>
      <div className="field-block">
        <label className="field-label">Твоя деятельность</label>
        <input
          className="field-input"
          value={profile.money_activity ?? ''}
          onChange={(e) => update({ money_activity: e.target.value })}
          placeholder="Например: фриланс, торговля, бизнес…"
          maxLength={48}
        />
      </div>

      <div className="divider" />

      <TrackerSection field="moneymaxing" placeholder="Источник дохода / финансовая цель" />
    </>
  );
}
