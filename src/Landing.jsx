import { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';

const COURSES = [
  {
    id: 'mentes-bajo-control',
    title: 'Mentes Bajo Control: Manipulación Social',
    short: { es: 'Cómo se manipula a las masas y cómo no caer.', en: 'How crowds are manipulated and how not to fall for it.', ru: 'Как манипулируют массами и как не попадаться.' },
    logo: '/varkanis-libro-mentes-bajo-control.jpg',
    author: 'Varkanis',
    preview: '/MENTESBAJOCONTROL-PROMO_FINAL.pdf',
    hotmartUrl: 'https://hotmart.com/es/marketplace/productos/mentes-bajo-control-manipulacion-social-nivel-1/L106624559K?sck=HOTMART_SITE&search=10103c75-a40b-4598-a331-04850e1475da&hotfeature=33',
    url: null,
  },
];

function AccountButton({ onClick }) {
  return (
    <button className="landing-account" onClick={onClick} aria-label="Cuenta">
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.7" />
        <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6S19.4 16 19.4 20" />
      </svg>
    </button>
  );
}

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

function TestsPage({ onStart }) {
  const { lang, t } = useLang();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q
    ? TESTS.filter((test) => {
        const hay = `${tx(test.title, lang)} ${tx(test.short, lang)} ${test.author ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
    : TESTS;
  return (
    <main className="landing-main landing-tests-page">
      <div className="landing-test-search">
        <span className="landing-test-search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
        </span>
        <input
          type="search"
          className="landing-test-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('landing.searchPlaceholder')}
          aria-label={t('landing.searchPlaceholder')}
        />
        {query && (
          <button
            type="button"
            className="landing-test-search-clear"
            onClick={() => setQuery('')}
            aria-label={t('cards.close') || 'Close'}
          >×</button>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="landing-test-empty">{t('landing.searchEmpty')}</p>
      ) : (
        <ul className="landing-test-list">
          {filtered.map((test) => (
            <li key={test.id} className="landing-test-card">
              <div className="landing-test-body">
                {test.logo && (
                  <img
                    className="landing-test-logo"
                    src={test.logo}
                    alt={`${tx(test.title, lang)} — Varkanis, comunidad de psicología y desarrollo personal`}
                  />
                )}
                <div className="landing-test-meta">
                  <h3 className="landing-test-title">{tx(test.title, lang)}</h3>
                  <div className="landing-test-byline">
                    <span className="landing-test-count">
                      {test.items.length} {t('landing.questions')}
                    </span>
                    {test.author && (
                      <span className="landing-test-author">{test.author}</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="landing-test-go" onClick={() => onStart(test)}>
                {t('landing.takeTest')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function CoursesPage() {
  const { lang, t } = useLang();
  return (
    <main className="landing-main landing-tests-page">
      <ul className="landing-test-list">
        {COURSES.map((course) => (
          <li key={course.id} className="landing-test-card landing-course-card">
            <div className="landing-course-body">
              {course.logo && (
                <img
                  className="landing-course-logo"
                  src={course.logo}
                  alt={`${course.title} — Varkanis, academia de análisis social y leyes de la influencia`}
                />
              )}
              <div className="landing-test-meta">
                <h3 className="landing-test-title">{course.title}</h3>
                <p className="landing-test-short">{tx(course.short, lang)}</p>
                {course.author && (
                  <div className="landing-test-byline">
                    <span className="landing-test-author">{course.author}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="landing-course-actions">
              {course.preview ? (
                <a
                  className="landing-test-go"
                  href={course.preview}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('landing.preview')}
                </a>
              ) : (
                <button className="landing-test-go" disabled>
                  {t('landing.courseSoon')}
                </button>
              )}
              {course.hotmartUrl && (
                <a
                  className="landing-course-buy"
                  href={course.hotmartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tx(
                    {
                      ru: 'Продолжить в Hotmart →',
                      en: 'Continue on Hotmart →',
                      es: 'Continuar en Hotmart →',
                    },
                    lang
                  )}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function Landing({ onLogin }) {
  const { t, setLang } = useLang();
  const [view, setView] = useState('home');
  const [activeTest, setActiveTest] = useState(null);

  // Public site is Spanish-only.
  useEffect(() => { setLang('es'); }, [setLang]);

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
        <AccountButton onClick={onLogin} />
      </header>

      {isHome && (
        <main className="landing-main landing-tree">
          <h1 className="landing-title">Varkanis</h1>

          <div className="landing-links">
            <button className="landing-link" onClick={() => setView('tests')}>
              <span className="landing-link-text">{t('landing.btn.test')}</span>
              <img
                className="landing-link-icon"
                src="/varkanis-comunidad-psicologia.jpg"
                alt="Varkanis — Comunidad de psicología y tests de análisis del comportamiento"
              />
            </button>
            <button className="landing-link" onClick={() => setView('courses')}>
              <span className="landing-link-text">{t('landing.btn.course')}</span>
              <img
                className="landing-link-icon"
                src="/varkanis-academia.jpg"
                alt="Varkanis — Academia de manipulación social y leyes de la influencia"
              />
            </button>
            {false && (
            <button className="landing-link" onClick={onLogin}>
              <span className="landing-link-text">{t('landing.btn.app')}</span>
              <img
                className="landing-link-icon"
                src="/applogo.jpg"
                alt="Varkanis — Aplicación de psicología aplicada"
              />
            </button>
            )}
          </div>
        </main>
      )}
      {view === 'tests' && <TestsPage onStart={setActiveTest} />}
      {view === 'courses' && <CoursesPage />}

      <footer className="landing-foot" />

      {activeTest && (
        <TestRunner
          test={activeTest}
          onClose={() => setActiveTest(null)}
          onRegister={onLogin}
        />
      )}
    </div>
  );
}
