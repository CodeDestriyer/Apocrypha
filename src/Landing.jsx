import { useLang } from './i18n.jsx';

export default function Landing({ onEnter }) {
  const { t } = useLang();
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Varkanis</span>
        <span className="landing-domain">varkanis.com</span>
      </header>

      <main className="landing-main">
        <span className="landing-eyebrow">⚜ Varkanis</span>
        <h1 className="landing-title">Varkanis</h1>
        <p className="landing-tagline">{t('landing.tagline')}</p>

        <button className="landing-cta" onClick={onEnter}>
          {t('landing.cta')}
        </button>

        <ul className="landing-features">
          <li><span className="landing-bullet">✦</span><span>{t('landing.f1')}</span></li>
          <li><span className="landing-bullet">✧</span><span>{t('landing.f2')}</span></li>
          <li><span className="landing-bullet">☥</span><span>{t('landing.f3')}</span></li>
        </ul>
      </main>

      <footer className="landing-foot">
        <span>© Varkanis</span>
      </footer>
    </div>
  );
}
