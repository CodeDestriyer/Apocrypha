import { useEffect, useRef, useState } from 'react';
import { useLang, LANGS } from './i18n.jsx';

function LangPicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  return (
    <div className="landing-lang" ref={ref}>
      <button className="landing-lang-btn" onClick={() => setOpen((o) => !o)} aria-label="Language">
        <span>{current.flag}</span>
        <span className="landing-lang-code">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div className="landing-lang-menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={`landing-lang-option ${l.code === lang ? 'active' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false); }}
            >
              <span>{l.flag}</span><span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Landing({ onEnter }) {
  const { t } = useLang();
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Varkanis</span>
        <LangPicker />
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
