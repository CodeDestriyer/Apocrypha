import { useEffect, useMemo, useState } from 'react';
import CharacterPage from './apocrypha/CharacterPage.jsx';
import Landing from './varkanis/Landing.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider, useLang } from './i18n.jsx';
import { signOut } from './supabase.js';
import IdiomasSection from './apocrypha/IdiomasSection.jsx';
import CardsSection from './apocrypha/CardsSection.jsx';
import RulesSection from './apocrypha/RulesSection.jsx';
import SaludSection from './apocrypha/SaludSection.jsx';
import PesoSection from './apocrypha/PesoSection.jsx';
import HabitosSection from './apocrypha/HabitosSection.jsx';
import TareasSection from './apocrypha/TareasSection.jsx';
import BodySection from './apocrypha/BodySection.jsx';
import { isInAppBrowser } from './inAppBrowser.js';

function BrowserGate({ onBypass }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const copy = async () => {
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
    <div className="gate">
      <div className="gate-card">
        <div className="gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.2" />
            <path d="M2.8 12h18.4M12 2.8c2.6 2.5 4 5.8 4 9.2s-1.4 6.7-4 9.2c-2.6-2.5-4-5.8-4-9.2s1.4-6.7 4-9.2z" />
          </svg>
        </div>
        <h1 className="gate-title">Abre en tu navegador</h1>
        <p className="gate-text">
          Estás en el navegador interno de la app. Para registrarte y entrar,
          abre esta página en <strong>Chrome</strong> o <strong>Safari</strong>.
        </p>
        <ol className="gate-steps">
          <li>Toca el menú <strong>⋯</strong> arriba en la esquina.</li>
          <li>Elige <strong>«Abrir en el navegador»</strong>.</li>
        </ol>
        <button className="gate-copy" onClick={copy}>
          {copied ? '✓ Enlace copiado' : 'Copiar enlace'}
        </button>
        <button className="gate-bypass" onClick={onBypass}>Continuar de todos modos</button>
      </div>
    </div>
  );
}

function useMediaQuery(query) {
  const [match, setMatch] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatch(e.matches);
    mql.addEventListener?.('change', onChange);
    mql.addListener?.(onChange);
    return () => {
      mql.removeEventListener?.('change', onChange);
      mql.removeListener?.(onChange);
    };
  }, [query]);
  return match;
}

// Direct entry to the gamification app is driven purely by the URL hash:
// #apocrypha (or #app) opens the app, a bare varkanis.com always lands on the
// landing. Entry is intentionally NOT remembered across visits — the app is a
// distinct page you reach via its hash, not a sticky mode.
function readEnterIntent() {
  try {
    if (typeof window === 'undefined') return false;
    const hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    return hash === 'apocrypha' || hash === 'app';
  } catch { return false; }
}

function Shell() {
  const { status } = useProfile();
  const [view, setView] = useState('home');
  const [showApp, setShowApp] = useState(readEnterIntent);
  const [bypassGate, setBypassGate] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // Temporarily disabled — flip back to true to re-enable the in-app gate.
  const GATE_ENABLED = false;
  const inApp = useMemo(() => isInAppBrowser(), []);
  const gated = GATE_ENABLED && inApp && !bypassGate;

  useEffect(() => {
    // Clear the splash stuck-recovery timer once we render real content —
    // including the browser gate, which is a valid terminal screen.
    if (gated || status !== 'loading') window.dispatchEvent(new Event('lr:app-ready'));
  }, [gated, status]);

  // Keep the URL hash in sync with whether we're in the app, so the link is
  // shareable/bookmarkable (and a refresh on #apocrypha stays inside). We do
  // NOT persist entry anywhere: a bare varkanis.com must always show the
  // landing, so leaving the app strips the hash and nothing is remembered.
  useEffect(() => {
    try {
      const bareUrl = window.location.pathname + window.location.search;
      if (showApp) {
        if ((window.location.hash || '').replace(/^#/, '').toLowerCase() !== 'apocrypha') {
          window.history.replaceState(null, '', `${bareUrl}#apocrypha`);
        }
      } else if (window.location.hash) {
        window.history.replaceState(null, '', bareUrl);
      }
    } catch {}
  }, [showApp]);

  // Navigating to #apocrypha in the same tab (e.g. pasting the link) opens it.
  useEffect(() => {
    const onHash = () => { if (readEnterIntent()) setShowApp(true); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (gated) {
    return <BrowserGate onBypass={() => setBypassGate(true)} />;
  }

  if (status === 'loading') {
    return <div className="splash"><div className="ornament">⚜ ⚔ ⚜</div></div>;
  }

  // Entry to the gamification app: the #apocrypha link or the hidden 10-tap
  // gesture on the avatar. It sticks across reloads while the #apocrypha hash is
  // in the URL (see the sync effect above); exiting strips the hash and returns
  // to the landing, and a bare varkanis.com always lands there.
  if (showApp && status === 'ready') {
    if (isDesktop) {
      return (
        <div className="desktop-shell">
          <DesktopSidebar view={view} setView={setView} />
          <main className="desktop-content">
            {view === 'home' && <CharacterPage onNavigate={setView} hideNav />}
            {view === 'cards' && <CardsSection rootOnBack={() => setView('home')} />}
            {view === 'reglas' && <RulesSection rootOnBack={() => setView('home')} />}
            {view === 'peso' && <PesoSection rootOnBack={() => setView('home')} />}
            {view === 'habitos' && <HabitosSection rootOnBack={() => setView('home')} />}
            {view === 'tareas' && <TareasSection rootOnBack={() => setView('home')} />}
            {view === 'salud' && <SaludSection rootOnBack={() => setView('home')} />}
            {view === 'idiomas' && <IdiomasSection rootOnBack={() => setView('home')} />}
            {view === 'body' && <BodySection rootOnBack={() => setView('home')} />}
          </main>
        </div>
      );
    }
    return (
      <div className="app">
        <div className="single-page">
          {view === 'idiomas'
            ? <IdiomasSection rootOnBack={() => setView('home')} />
            : view === 'cards'
            ? <CardsSection rootOnBack={() => setView('home')} />
            : view === 'reglas'
            ? <RulesSection rootOnBack={() => setView('home')} />
            : view === 'salud'
            ? <SaludSection rootOnBack={() => setView('home')} />
            : view === 'peso'
            ? <PesoSection rootOnBack={() => setView('home')} />
            : view === 'habitos'
            ? <HabitosSection rootOnBack={() => setView('home')} />
            : view === 'tareas'
            ? <TareasSection rootOnBack={() => setView('home')} />
            : view === 'body'
            ? <BodySection rootOnBack={() => setView('home')} />
            : <CharacterPage onNavigate={setView} showNav={true} onExit={() => setShowApp(false)} />
          }
        </div>
      </div>
    );
  }

  return <Landing onEnterApp={status === 'ready' ? () => setShowApp(true) : null} />;
}

function DesktopSidebar({ view, setView }) {
  const { t } = useLang();
  // Accordion: only one parent group expanded at a time.
  const [openGroup, setOpenGroup] = useState(
    view === 'cards' || view === 'reglas' ? 'idiomas' : (view === 'peso' || view === 'habitos') ? 'salud' : null
  );
  const idiomasOpen = openGroup === 'idiomas';
  const saludOpen = openGroup === 'salud';
  const toggleGroup = (g) => setOpenGroup((cur) => (cur === g ? null : g));

  return (
    <aside className="desktop-sidebar">
      <button className="desktop-brand" onClick={() => setView('home')}>
        <span className="desktop-brand-text">Apocrypha</span>
      </button>

      <nav className="desktop-nav">
        <button
          className={`desktop-nav-item ${view === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >
          <span className="desktop-nav-icon">⚔</span>
          <span>{t('tab.character')}</span>
        </button>
        <button
          className={`desktop-nav-item ${view === 'tareas' ? 'active' : ''}`}
          onClick={() => setView('tareas')}
        >
          <span className="desktop-nav-icon">✓</span>
          <span>{t('nav.tareas')}</span>
        </button>
        {/* Idiomas is a pure expander: clicking it only reveals its two
            children (Tarjetas / Reglas) — it navigates nowhere itself. */}
        <div className={`desktop-nav-group ${idiomasOpen ? 'open' : ''}`}>
          <button
            className={`desktop-nav-item desktop-nav-parent ${(view === 'cards' || view === 'reglas') ? 'active-parent' : ''}`}
            onClick={() => toggleGroup('idiomas')}
            aria-expanded={idiomasOpen}
          >
            <span className="desktop-nav-icon">✦</span>
            <span>{t('nav.idiomas')}</span>
            <span className={`desktop-nav-caret ${idiomasOpen ? 'open' : ''}`} aria-hidden="true">›</span>
          </button>
          {idiomasOpen && (
            <div className="desktop-subnav">
              <button
                className={`desktop-nav-item desktop-subnav-item ${view === 'cards' ? 'active' : ''}`}
                onClick={() => setView('cards')}
              >
                <span className="desktop-nav-icon">⌘</span>
                <span>{t('nav.cards')}</span>
              </button>
              <button
                className={`desktop-nav-item desktop-subnav-item ${view === 'reglas' ? 'active' : ''}`}
                onClick={() => setView('reglas')}
              >
                <span className="desktop-nav-icon">§</span>
                <span>{t('reglas.title')}</span>
              </button>
            </div>
          )}
        </div>
        {/* Salud is an expander too, with Peso (weight) as its child. */}
        <div className={`desktop-nav-group ${saludOpen ? 'open' : ''}`}>
          <button
            className={`desktop-nav-item desktop-nav-parent ${(view === 'peso' || view === 'habitos') ? 'active-parent' : ''}`}
            onClick={() => toggleGroup('salud')}
            aria-expanded={saludOpen}
          >
            <span className="desktop-nav-icon">✚</span>
            <span>{t('nav.salud')}</span>
            <span className={`desktop-nav-caret ${saludOpen ? 'open' : ''}`} aria-hidden="true">›</span>
          </button>
          {saludOpen && (
            <div className="desktop-subnav">
              <button
                className={`desktop-nav-item desktop-subnav-item ${view === 'peso' ? 'active' : ''}`}
                onClick={() => setView('peso')}
              >
                <span className="desktop-nav-icon">⚖</span>
                <span>{t('weight.title')}</span>
              </button>
              <button
                className={`desktop-nav-item desktop-subnav-item ${view === 'habitos' ? 'active' : ''}`}
                onClick={() => setView('habitos')}
              >
                <span className="desktop-nav-icon">⏳</span>
                <span>{t('habits.title')}</span>
              </button>
            </div>
          )}
        </div>
        {/* Cuerpo (Body) tab hidden for now — re-add this button to bring it back. */}
      </nav>

      <div className="desktop-sidebar-footer">
        <button className="desktop-nav-item desktop-logout" onClick={() => signOut()}>
          <span className="desktop-nav-icon">⎋</span>
          <span>{t('settings.logout')}</span>
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <LangProvider>
      <ProfileProvider>
        <Shell />
      </ProfileProvider>
    </LangProvider>
  );
}
