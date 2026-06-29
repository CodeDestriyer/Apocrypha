import { useEffect, useRef, useState } from 'react';
import { useLang, LANGS } from './i18n.jsx';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';

const COURSES = [
  {
    id: 'mentes-bajo-control',
    title: 'Mentes Bajo Control: Manipulación Social',
    short: { es: 'Cómo se manipula a las masas y cómo no caer.', en: 'How crowds are manipulated and how not to fall for it.', ru: 'Как манипулируют массами и как не попадаться.' },
    url: null,
  },
];

const FLAG_SVG = {
  ru: (
    <svg viewBox="0 0 9 6" aria-hidden="true">
      <rect width="9" height="2" y="0" fill="#fff" />
      <rect width="9" height="2" y="2" fill="#0039A6" />
      <rect width="9" height="2" y="4" fill="#D52B1E" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 30" aria-hidden="true">
      <clipPath id="lf-en-c"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#lf-en-c)" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 9 6" aria-hidden="true">
      <rect width="9" height="6" fill="#AA151B" />
      <rect width="9" height="3" y="1.5" fill="#F1BF00" />
    </svg>
  ),
};

function Flag({ code }) {
  return <span className="landing-flag">{FLAG_SVG[code] ?? null}</span>;
}

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
        <Flag code={current.code} />
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
              <Flag code={l.code} /><span>{l.label}</span>
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

function TestsPage({ onStart }) {
  const { lang, t } = useLang();
  return (
    <main className="landing-main landing-tests-page">
      <p className="landing-tests-intro">{t('landing.testsIntro')}</p>
      <ul className="landing-test-list">
        {TESTS.map((test) => (
          <li key={test.id} className="landing-test-card">
            {test.logo && (
              <img className="landing-test-logo" src={test.logo} alt="" aria-hidden="true" />
            )}
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
    </main>
  );
}

function CoursesPage() {
  const { lang, t } = useLang();
  return (
    <main className="landing-main landing-tests-page">
      <p className="landing-tests-intro">{t('landing.coursesIntro')}</p>
      <ul className="landing-test-list">
        {COURSES.map((course) => (
          <li key={course.id} className="landing-test-card">
            <div className="landing-test-meta">
              <h3 className="landing-test-title">{course.title}</h3>
              <p className="landing-test-short">{tx(course.short, lang)}</p>
            </div>
            <button className="landing-test-go" disabled>
              {t('landing.courseSoon')}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Landing({ onLogin }) {
  const { t } = useLang();
  const [view, setView] = useState('home');
  const [activeTest, setActiveTest] = useState(null);

  const isHome = view === 'home';

  return (
    <div className="landing">
      <header className="landing-nav">
        {isHome ? (
          <span className="landing-brand">Varkanis</span>
        ) : (
          <button className="landing-back" onClick={() => setView('home')}>
            {t('landing.back')}
          </button>
        )}
        <LangPicker />
      </header>

      {isHome && (
        <main className="landing-main landing-tree">
          <h1 className="landing-title">Varkanis</h1>

          <div className="landing-links">
            <button className="landing-link" onClick={() => setView('tests')}>
              <span className="landing-link-text">{t('landing.btn.test')}</span>
              <img className="landing-link-icon" src="/testlogo.jpg" alt="" aria-hidden="true" />
            </button>
            <button className="landing-link" onClick={() => setView('courses')}>
              <span className="landing-link-text">{t('landing.btn.course')}</span>
              <img className="landing-link-icon" src="/courcelogo.jpg" alt="" aria-hidden="true" />
            </button>
            {false && (
            <button className="landing-link" onClick={onLogin}>
              <span className="landing-link-text">{t('landing.btn.app')}</span>
              <img className="landing-link-icon" src="/applogo.jpg" alt="" aria-hidden="true" />
            </button>
            )}
          </div>
        </main>
      )}
      {view === 'tests' && <TestsPage onStart={setActiveTest} />}
      {view === 'courses' && <CoursesPage />}

      <footer className="landing-foot">
        <span>© Varkanis</span>
      </footer>

      {activeTest && (
        <TestRunner
          test={activeTest}
          onClose={() => setActiveTest(null)}
        />
      )}
    </div>
  );
}
