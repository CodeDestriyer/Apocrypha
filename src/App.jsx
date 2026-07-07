import { useEffect, useRef, useState } from 'react';
import CharacterPage from './pages/CharacterPage.jsx';
import Landing from './Landing.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider, useLang, LANGS } from './i18n.jsx';
import { signOut } from './supabase.js';
import CardsSection from './sections/CardsSection.jsx';

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
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    if (status !== 'loading') window.dispatchEvent(new Event('lr:app-ready'));
  }, [status]);

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
          </main>
        </div>
      );
    }
    return (
      <div className="app">
        <div className="single-page">
          {view === 'cards'
            ? <CardsSection rootOnBack={() => setView('home')} />
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
