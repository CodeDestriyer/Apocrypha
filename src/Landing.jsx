import { useEffect, useRef, useState } from 'react';
import { useLang, LANGS } from './i18n.jsx';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';

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

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

function TestsTab({ onStart }) {
  const { lang, t } = useLang();
  return (
    <div className="landing-tests">
      <p className="landing-tests-intro">{t('landing.testsIntro')}</p>
      <ul className="landing-test-list">
        {TESTS.map((test) => (
          <li key={test.id} className="landing-test-card">
            <div className="landing-test-meta">
              <h3 className="landing-test-title">{tx(test.title, lang)}</h3>
              <p className="landing-test-short">{tx(test.short, lang)}</p>
              <span className="landing-test-count">
                {test.items.length} {t('landing.questions')}
              </span>
            </div>
            <button className="landing-test-go" onClick={() => onStart(test)}>
              {t('landing.takeTest')}
            </button>
          </li>
        ))}
      </ul>
      <p className="landing-tests-disclaimer">{t('test.disclaimer')}</p>
    </div>
  );
}

function AboutTab() {
  const { t } = useLang();
  return (
    <>
      <span className="landing-eyebrow">{t('landing.beta')}</span>
      <h1 className="landing-title">Varkanis</h1>
      <p className="landing-tagline">{t('landing.tagline')}</p>

      <ul className="landing-features">
        <li><span className="landing-bullet">✦</span><span>{t('landing.f1')}</span></li>
        <li><span className="landing-bullet">✧</span><span>{t('landing.f2')}</span></li>
        <li><span className="landing-bullet">☥</span><span>{t('landing.f3')}</span></li>
      </ul>
    </>
  );
}

export default function Landing() {
  const { t } = useLang();
  const [tab, setTab] = useState('about');
  const [activeTest, setActiveTest] = useState(null);

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Varkanis</span>
        <LangPicker />
      </header>

      <nav className="landing-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'about'}
          className={`landing-tab ${tab === 'about' ? 'active' : ''}`}
          onClick={() => setTab('about')}
        >
          {t('landing.tab.about')}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'tests'}
          className={`landing-tab ${tab === 'tests' ? 'active' : ''}`}
          onClick={() => setTab('tests')}
        >
          {t('landing.tab.tests')}
        </button>
      </nav>

      <main className="landing-main">
        {tab === 'about' ? <AboutTab /> : <TestsTab onStart={setActiveTest} />}
      </main>

      <footer className="landing-foot">
        <span>© Varkanis</span>
      </footer>

      {activeTest && <TestRunner test={activeTest} onClose={() => setActiveTest(null)} />}
    </div>
  );
}
