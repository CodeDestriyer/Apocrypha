import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import TrackerSection from './TrackerSection.jsx';

export default function MoneymaxingSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();

  return (
    <>
      <div className="field-block">
        <label className="field-label">{t('money.activity')}</label>
        <input
          className="field-input"
          value={profile.money_activity ?? ''}
          onChange={(e) => update({ money_activity: e.target.value })}
          placeholder={t('money.placeholder')}
          maxLength={48}
        />
      </div>

      <div className="divider" />

      <TrackerSection field="moneymaxing" placeholder={t('money.tracker')} />
    </>
  );
}
