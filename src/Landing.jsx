import { useLang } from './i18n.jsx';

export default function Landing({ onEnter }) {
  const { t } = useLang();
  return (
    <div className="landing">
      <div className="landing-inner">
        <div className="ornament">⚜ ⚔ ⚜</div>
        <h1 className="landing-title">Varkanis</h1>
        <p className="landing-tagline">{t('landing.tagline')}</p>

        <ul className="landing-features">
          <li><span className="landing-bullet">✦</span><span>{t('landing.f1')}</span></li>
          <li><span className="landing-bullet">✧</span><span>{t('landing.f2')}</span></li>
          <li><span className="landing-bullet">☥</span><span>{t('landing.f3')}</span></li>
        </ul>

        <button className="landing-cta" onClick={onEnter}>
          {t('landing.cta')}
        </button>

        <div className="landing-footer">
          <span className="landing-mark">⚜</span>
          <span>varkanis.com</span>
          <span className="landing-mark">⚜</span>
        </div>
      </div>
    </div>
  );
}
