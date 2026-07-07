import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { useProfile } from './ProfileContext.jsx';
import { signInWithGoogle, signOut } from './supabase.js';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';

function PersonIcon({ size = 21 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6S19.4 16 19.4 20" />
    </svg>
  );
}

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

function AccountButton({ authed, avatarUrl, name, onRegister, onOpenProfile, onEnterApp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const taps = useRef(0);
  const tapTimer = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!authed) {
    return (
      <button className="landing-account" onClick={onRegister} aria-label="Cuenta">
        <PersonIcon />
      </button>
    );
  }

  const onAvatarClick = () => {
    setOpen((o) => !o);
    // Hidden shortcut: 10 quick taps on the avatar open the gamification app.
    if (!onEnterApp) return;
    taps.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { taps.current = 0; }, 2000);
    if (taps.current >= 10) {
      taps.current = 0;
      clearTimeout(tapTimer.current);
      setOpen(false);
      onEnterApp();
    }
  };

  return (
    <div className="landing-account-wrap" ref={ref}>
      <button
        className="landing-account landing-account-authed"
        onClick={onAvatarClick}
        aria-label="Cuenta"
      >
        {avatarUrl
          ? <img className="landing-account-img" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          : <PersonIcon />}
      </button>
      {open && (
        <div className="landing-account-menu">
          <div className="landing-account-head">
            <span className="landing-account-name">{name || 'Tu cuenta'}</span>
            <span className="landing-plan-badge">Gratis</span>
          </div>
          <button
            className="landing-account-menu-item"
            onClick={() => { setOpen(false); onOpenProfile(); }}
          >
            Mi perfil
          </button>
          <button
            className="landing-account-menu-item landing-account-logout"
            onClick={() => { setOpen(false); signOut(); }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function formatResultDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function ProfileModal({ onClose }) {
  const { profile, googleAvatar } = useProfile();
  const name = profile?.name || 'Tu cuenta';
  const history = Array.isArray(profile?.test_results) ? profile.test_results : [];

  return (
    <div className="reg-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="prof-modal" onClick={(e) => e.stopPropagation()}>
        <button className="reg-close" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="prof-head">
          <span className="prof-avatar" aria-hidden="true">
            {googleAvatar
              ? <img className="landing-account-img" src={googleAvatar} alt="" referrerPolicy="no-referrer" />
              : <PersonIcon size={24} />}
          </span>
          <div className="prof-id">
            <span className="prof-name">{name}</span>
            <span className="landing-plan-badge">Gratis</span>
          </div>
        </div>

        <h3 className="prof-hist-title">Historial de tests</h3>
        {history.length === 0 ? (
          <p className="prof-empty">Aún no has guardado ningún test. Completa uno para verlo aquí.</p>
        ) : (
          <ul className="prof-hist">
            {history.map((r) => (
              <li key={r.id} className="prof-hist-row">
                <div className="prof-hist-main">
                  <span className="prof-hist-test">{r.title}</span>
                  <span className="prof-hist-date">{formatResultDate(r.date)}</span>
                </div>
                {(r.score || r.label) && (
                  <span className="prof-hist-score">
                    {r.score}{r.score && r.label ? ' · ' : ''}{r.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RegisterModal({ onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const onGoogle = async () => {
    setBusy(true);
    setErr(null);
    try { await signInWithGoogle(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="reg-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
        <button className="reg-close" onClick={onClose} aria-label="Cerrar">×</button>
        <span className="reg-icon" aria-hidden="true"><PersonIcon size={26} /></span>
        <h2 className="reg-title">Crea tu cuenta</h2>
        <p className="reg-sub">Regístrate para guardar tus resultados y seguir tu evolución.</p>
        <button className="reg-google" onClick={onGoogle} disabled={busy}>
          <span className="reg-google-g">G</span>
          <span>{busy ? '…' : 'Continuar con Google'}</span>
        </button>
        {err && <p className="reg-err">{err}</p>}
        <p className="reg-fine">Al continuar, tu progreso se guardará en tu cuenta.</p>
      </div>
    </div>
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

export default function Landing({ onEnterApp }) {
  const { t, setLang } = useLang();
  const { status, googleAvatar, profile, update } = useProfile();
  const authed = status === 'ready';
  const [view, setView] = useState('home');
  const [activeTest, setActiveTest] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Public site is Spanish-only.
  useEffect(() => { setLang('es'); }, [setLang]);

  const saveResult = (record) => {
    update((curr) => ({
      test_results: [record, ...(Array.isArray(curr?.test_results) ? curr.test_results : [])].slice(0, 100),
    }));
  };

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
        <AccountButton
          authed={authed}
          avatarUrl={googleAvatar}
          name={profile?.name}
          onRegister={() => setShowRegister(true)}
          onOpenProfile={() => setShowProfile(true)}
          onEnterApp={onEnterApp}
        />
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
          onRegister={authed ? null : () => setShowRegister(true)}
          onSaveResult={authed ? saveResult : null}
        />
      )}

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
