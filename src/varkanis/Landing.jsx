import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import './landing.css';
import { useProfile } from '../ProfileContext.jsx';
import { signInWithGoogle, signOut } from '../supabase.js';
import { isInAppBrowser } from '../inAppBrowser.js';
import { TESTS } from './tests/data.js';
import TestRunner from './tests/TestRunner.jsx';
import PeopleCarousel from './PeopleCarousel.jsx';
import { hasPurchase, bookUrl, openCheckout, waitForPurchase } from './purchase.js';
// Worker is emitted as a separate asset (its URL only) — the pdfjs library
// itself is dynamically imported inside PdfBook so it stays out of the main bundle.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function PersonIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6S19.4 16 19.4 20" />
    </svg>
  );
}

const VIEWS = ['home', 'tests', 'courses'];

const COURSES = [
  {
    id: 'mentes-bajo-control',
    title: 'Manipulación Social Nivel 1',
    short: { es: 'Cómo se manipula a las masas y cómo no caer.', en: 'How crowds are manipulated and how not to fall for it.', ru: 'Как манипулируют массами и как не попадаться.' },
    logo: '/varkanis-libro-mentes-bajo-control.jpg',
    author: 'Varkanis',
    price: '5,30 $',
    // Shown before the buy button: what the money actually gets you.
    details: {
      es: ['45 páginas', 'PDF, se lee en tu cuenta', 'Acceso permanente'],
      en: ['45 pages', 'PDF, read inside your account', 'Permanent access'],
      ru: ['45 страниц', 'PDF, читается в аккаунте', 'Доступ навсегда'],
    },
  },
];

function BuyPanel({ course, authed, onRegister, onOwned }) {
  const { t } = useLang();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'confirming'
  const [error, setError] = useState('');

  // A purchase is tied to an account, so signing in has to come first.
  if (!authed) {
    return (
      <button className="promo-cta-btn" type="button" onClick={onRegister}>
        {t('preview.gateBtn')}
      </button>
    );
  }

  const buy = async () => {
    setError('');
    try {
      await openCheckout(course.id, async () => {
        setPhase('confirming');
        const ok = await waitForPurchase(course.id);
        setPhase('idle');
        if (ok) onOwned();
        else setError(t('preview.buySlow'));
      });
    } catch {
      setPhase('idle');
      setError(t('preview.buyError'));
    }
  };

  return (
    <>
      <button className="promo-cta-btn" type="button" onClick={buy} disabled={phase === 'confirming'}>
        {phase === 'confirming' ? t('preview.buyWait') : `${t('preview.buy')} · ${course.price}`}
      </button>
      {error && <p className="promo-gate-error">{error}</p>}
    </>
  );
}

function PdfBook({ course, onClose, owned, onOwned, authed, onRegister }) {
  const { t } = useLang();
  const pagesRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [gate, setGate] = useState(false); // buy gate shown after the preview
  const [src, setSrc] = useState(null);

  // Signed URL: the preview is open, the full file needs a purchase.
  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setStatus('loading');
    bookUrl(course.id, owned ? 'full' : 'preview')
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [course.id, owned]);

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    let pdfDoc = null;

    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

        pdfDoc = await pdfjs.getDocument(src).promise;
        if (cancelled) return;

        const container = pagesRef.current;
        if (!container) return;
        container.replaceChildren(); // the file swaps when a purchase lands
        const cw = Math.min(container.clientWidth || 780, 780);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdfDoc.numPages; n++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (cw / base.width) * dpr });

          const canvas = document.createElement('canvas');
          canvas.className = 'promo-page-img';
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';

          const wrap = document.createElement('div');
          wrap.className = 'promo-page';
          wrap.appendChild(canvas);
          container.appendChild(wrap);

          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          if (n === 1 && !cancelled) setStatus('ready');
        }

        if (cancelled) return;
        setGate(!owned);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      try { pdfDoc?.destroy?.(); } catch {}
    };
  }, [src, owned]);

  return (
    <div className="promo-overlay" role="dialog" aria-modal="true">
      <header className="promo-bar">
        <span className="promo-bar-title">{course.title}</span>
        <button className="promo-close" onClick={onClose} aria-label="Cerrar">×</button>
      </header>
      <div className="promo-scroll">
        <div className="promo-pages">
          {/* Canvases are appended imperatively here; React never manages this node's children. */}
          <div className="promo-canvas-col" ref={pagesRef} />
          {status === 'loading' && (
            <p className="promo-status">{t('preview.loading')}</p>
          )}
          {status === 'error' && (
            <p className="promo-status">{t('preview.error')}</p>
          )}
          {gate && (
            <div className="promo-gate">
              <h3 className="promo-gate-title">{t('preview.gateTitle')}</h3>
              <BuyPanel
                course={course}
                authed={authed}
                onRegister={onRegister}
                onOwned={onOwned}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountButton({ authed, avatarUrl, name, onRegister, onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
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

  const onAvatarClick = () => setOpen((o) => !o);

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
  const [histOpen, setHistOpen] = useState(false);

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

        {history.length === 0 ? (
          <>
            <h3 className="prof-hist-title">Historial de tests</h3>
            <p className="prof-empty">Aún no has guardado ningún test. Completa uno para verlo aquí.</p>
          </>
        ) : (
          <>
            <button
              type="button"
              className="prof-hist-toggle"
              onClick={() => setHistOpen((o) => !o)}
              aria-expanded={histOpen}
            >
              <span className="prof-hist-title">Historial de tests</span>
              <span className="prof-hist-count">{history.length}</span>
              <span className={`prof-hist-chevron${histOpen ? ' is-open' : ''}`} aria-hidden="true">▾</span>
            </button>
            {histOpen && (
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
          </>
        )}
      </div>
    </div>
  );
}

function RegisterModal({ onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);
  const inApp = isInAppBrowser();

  const onGoogle = async () => {
    setBusy(true);
    setErr(null);
    try { await signInWithGoogle(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="reg-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
        <button className="reg-close" onClick={onClose} aria-label="Cerrar">×</button>
        <span className="reg-icon" aria-hidden="true"><PersonIcon size={26} /></span>
        {inApp ? (
          <>
            <h2 className="reg-title">Abre en tu navegador</h2>
            <p className="reg-sub">
              Esta app no permite registrarse desde su navegador interno. Para crear
              tu cuenta, abre esta página en <strong>Chrome</strong> o <strong>Safari</strong>.
            </p>
            <ol className="gate-steps">
              <li>Toca el menú <strong>⋯</strong> arriba en la esquina.</li>
              <li>Elige <strong>«Abrir en el navegador»</strong>.</li>
            </ol>
            <button className="reg-google" onClick={copyLink}>
              <span>{copied ? '✓ Enlace copiado' : 'Copiar enlace'}</span>
            </button>
            <p className="reg-fine">Ahí podrás registrarte con Google en un toque.</p>
          </>
        ) : (
          <>
            <h2 className="reg-title">Crea tu cuenta</h2>
            <p className="reg-sub">Regístrate para guardar tus resultados y seguir tu evolución.</p>
            <button className="reg-google" onClick={onGoogle} disabled={busy}>
              <span className="reg-google-g">G</span>
              <span>{busy ? '…' : 'Continuar con Google'}</span>
            </button>
            {err && <p className="reg-err">{err}</p>}
            <p className="reg-fine">Al continuar, tu progreso se guardará en tu cuenta.</p>
          </>
        )}
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

function CoursesPage({ authed, onRegister }) {
  const { lang, t } = useLang();
  const [viewer, setViewer] = useState(null);
  const [owned, setOwned] = useState({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!authed) { setOwned({}); return undefined; }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        COURSES.map(async (course) => [course.id, await hasPurchase(course.id)]),
      );
      if (!cancelled) setOwned(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [authed]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? COURSES.filter((course) => {
        const hay = `${course.title} ${tx(course.short, lang)} ${course.author ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
    : COURSES;
  return (
    <main className="landing-main landing-tests-page">
      <div className="landing-test-search landing-course-search">
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
        {filtered.map((course) => (
          <li key={course.id} className="landing-test-card landing-course-card">
            {(course.logo || course.price) && (
              <div className="landing-course-cover">
                {course.logo && (
                  <img
                    className="landing-course-logo"
                    src={course.logo}
                    alt={`${course.title} — Varkanis, academia de análisis social y leyes de la influencia`}
                  />
                )}
                {course.price && <span className="landing-course-price">{course.price}</span>}
              </div>
            )}
            <div className="landing-course-content">
              <div className="landing-test-meta">
                <h3 className="landing-test-title">{course.title}</h3>
                <p className="landing-test-short">{tx(course.short, lang)}</p>
                {course.author && (
                  <div className="landing-test-byline">
                    <span className="landing-test-author">{course.author}</span>
                  </div>
                )}
              </div>
              <div className="landing-course-actions">
                <button
                  className="landing-test-go"
                  onClick={() => setViewer(course)}
                >
                  {owned[course.id] ? t('landing.read') : t('landing.preview')}
                </button>
              </div>
              {course.details && (
                <p className="landing-course-details">{tx(course.details, lang).join(' · ')}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      )}
      {viewer && (
        <PdfBook
          course={viewer}
          onClose={() => setViewer(null)}
          owned={!!owned[viewer.id]}
          onOwned={() => setOwned((prev) => ({ ...prev, [viewer.id]: true }))}
          authed={authed}
          onRegister={() => { setViewer(null); onRegister(); }}
        />
      )}
    </main>
  );
}

export default function Landing() {
  const { t, setLang } = useLang();
  const { status, googleAvatar, profile, update } = useProfile();
  const authed = status === 'ready';
  // The landing is a single page, but the catalogue needs a shareable URL —
  // a payments review asks for a link that shows the price, and so does anyone
  // linking to the book. Hash only: no server rewrite to get wrong.
  const [view, setView] = useState(() => (
    VIEWS.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'home'
  ));

  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash.slice(1);
      setView(VIEWS.includes(next) ? next : 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goTo = (next) => {
    setView(next);
    const hash = next === 'home' ? ' ' : `#${next}`;
    history.replaceState(null, '', next === 'home' ? window.location.pathname : hash);
  };

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
  const isPhone = window.matchMedia('(max-width: 640px)').matches;

  return (
    <div className="landing">
      <header className="landing-nav">
        {isHome ? (
          <span className="landing-brand">Varkanis</span>
        ) : (
          <button className="landing-back" onClick={() => goTo('home')}>
            {t('landing.back')}
          </button>
        )}
        <AccountButton
          authed={authed}
          avatarUrl={googleAvatar}
          name={profile?.name}
          onRegister={() => setShowRegister(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
      </header>

      {isHome && <PeopleCarousel dir="rtl" speed={isPhone ? 0.7 : 0.3} />}

      {isHome && (
        <main className="landing-main landing-tree">

          <h1 className="landing-title">Plataforma para mentes pensantes</h1>

          <div className="landing-links">
            <button className="landing-link" onClick={() => goTo('tests')}>
              <span className="landing-link-text">{t('landing.btn.test')}</span>
              <img
                className="landing-link-icon landing-link-icon-test"
                src="/hacereltestlogo.jpg"
                alt="Varkanis — Comunidad de psicología y tests de análisis del comportamiento"
              />
            </button>
            <button className="landing-link" onClick={() => goTo('courses')}>
              <span className="landing-link-text">{t('landing.btn.course')}</span>
              <img
                className="landing-link-icon"
                src="/course-logo.jpg"
                alt="Varkanis — Academia de manipulación social y leyes de la influencia"
              />
            </button>
          </div>
        </main>
      )}
      {view === 'tests' && <TestsPage onStart={setActiveTest} />}
      {view === 'courses' && <CoursesPage authed={authed} onRegister={() => setShowRegister(true)} />}

      <footer className="landing-foot">
        <a href="/tos.html">Términos</a>
        <a href="/privacy.html">Privacidad</a>
        <a href="/refunds.html">Reembolsos</a>
        <a href="mailto:oficalstepasik@gmail.com">Contacto</a>
      </footer>

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
