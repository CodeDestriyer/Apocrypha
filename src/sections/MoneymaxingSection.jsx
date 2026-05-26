import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

export default function MoneymaxingSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();

  return (
    <>
      <div className="money-capital-block">
        <label className="field-label money-capital-label">{t('money.capital')}</label>
        <input
          className="money-capital-input"
          value={profile.money_capital ?? ''}
          onChange={(e) => update({ money_capital: e.target.value })}
          placeholder="0"
          maxLength={24}
          inputMode="text"
        />
      </div>

      <div className="divider" />

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
    </>
  );
}
