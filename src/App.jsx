import { useEffect, useMemo, useRef, useState } from 'react';
import CharacterPage from './apocrypha/CharacterPage.jsx';
import Landing from './varkanis/Landing.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider, useLang, LANGS } from './i18n.jsx';
import { signOut } from './supabase.js';
import CardsSection from './apocrypha/CardsSection.jsx';
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

function Shell() {
  const { status } = useProfile();
  const [view, setView] = useState('home');
  const [showApp, setShowApp] = useState(false);
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

  if (gated) {
    return <BrowserGate onBypass={() => setBypassGate(true)} />;
  }

  if (status === 'loading') {
    return <div className="splash"><div className="ornament">⚜ ⚔ ⚜</div></div>;
  }

  // Hidden entry: a registered user who taps the avatar 10× drops into the
  // gamification app. It's not part of the normal flow — refreshing returns
  // to the public landing.
  if (showApp && status === 'ready') {
    if (isDesktop) {
      return (
        <div className="desktop-shell">
          <DesktopSidebar view={view} setView={setView} onExit={() => setShowApp(false)} />
          <main className="desktop-content">
            {view === 'home' && <CharacterPage onNavigate={setView} hideNav />}
            {view === 'cards' && <CardsSection rootOnBack={() => setView('home')} />}
            {view === 'body' && <BodySection rootOnBack={() => setView('home')} />}
          </main>
        </div>
      );
    }
    return (
      <div className="app">
        <div className="single-page">
          {view === 'cards'
            ? <CardsSection rootOnBack={() => setView('home')} />
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

function DesktopSidebar({ view, setView, onExit }) {
  const { t, lang, setLang } = useLang();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [settingsOpen]);

  return (
    <aside className="desktop-sidebar">
      <button className="desktop-brand" onClick={onExit}>
        <span className="desktop-brand-text">varkanis</span>
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
          className={`desktop-nav-item ${view === 'cards' ? 'active' : ''}`}
          onClick={() => setView('cards')}
        >
          <span className="desktop-nav-icon">⌘</span>
          <span>{t('nav.cards')}</span>
        </button>
        {/* Cuerpo (Body) tab hidden for now — re-add this button to bring it back. */}
      </nav>

      <div className="desktop-sidebar-footer">
        <div className="desktop-settings" ref={settingsRef}>
          <button className="desktop-nav-item" onClick={() => setSettingsOpen((o) => !o)}>
            <span className="desktop-nav-icon">⚙</span>
            <span>{t('settings.title')}</span>
          </button>
          {settingsOpen && (
            <div className="desktop-settings-pop">
              <div className="settings-section-title">{t('lang.title')}</div>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`settings-option ${lang === l.code ? 'active' : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
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
