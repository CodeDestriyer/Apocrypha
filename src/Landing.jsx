import { useEffect, useRef, useState } from 'react';
import { useLang, LANGS } from './i18n.jsx';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';

const COURSE_URL = '#';

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

function TestsModal({ onStart, onClose }) {
  const { lang, t } = useLang();
  return (
    <div className="landing-modal-backdrop" onClick={onClose}>
      <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="landing-modal-close" onClick={onClose} aria-label={t('test.close')}>×</button>
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
    </div>
  );
}

export default function Landing({ onLogin }) {
  const { t } = useLang();
  const [showTests, setShowTests] = useState(false);
  const [activeTest, setActiveTest] = useState(null);

  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">Varkanis</span>
        <LangPicker />
      </header>

      <main className="landing-main landing-tree">
        <h1 className="landing-title">Varkanis</h1>

        <div className="landing-links">
          <button className="landing-link" onClick={() => setShowTests(true)}>
            {t('landing.btn.test')}
          </button>
          <a className="landing-link" href={COURSE_URL} target="_blank" rel="noopener noreferrer">
            {t('landing.btn.course')}
          </a>
          <button className="landing-link" onClick={onLogin}>
            {t('landing.btn.app')}
          </button>
        </div>
      </main>

      <footer className="landing-foot">
        <span>© Varkanis</span>
      </footer>

      {showTests && !activeTest && (
        <TestsModal onStart={setActiveTest} onClose={() => setShowTests(false)} />
      )}
      {activeTest && (
        <TestRunner
          test={activeTest}
          onClose={() => { setActiveTest(null); setShowTests(false); }}
        />
      )}
    </div>
  );
}
