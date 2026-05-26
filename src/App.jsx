import { useEffect, useRef, useState } from 'react';
import CharacterPage from './pages/CharacterPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import SubPage from './pages/SubPage.jsx';
import NameModal from './NameModal.jsx';
import LoginScreen from './LoginScreen.jsx';
import Landing from './Landing.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider, useLang, LANGS } from './i18n.jsx';
import { signOut } from './supabase.js';
import GoalsSection from './sections/GoalsSection.jsx';
import SkillsSection from './sections/SkillsSection.jsx';
import AscesesSection from './sections/AscesesSection.jsx';
import TrackerSection from './sections/TrackerSection.jsx';
import LooksmaxingSection from './sections/LooksmaxingSection.jsx';
import MoneymaxingSection from './sections/MoneymaxingSection.jsx';
import MenmaxingSection from './sections/MenmaxingSection.jsx';

const SUB_RENDER = {
  goals:       () => <GoalsSection />,
  skills:      () => <SkillsSection />,
  asceses:     () => <AscesesSection />,
  moneymaxing: () => <MoneymaxingSection />,
  looksmaxing: () => <LooksmaxingSection />,
  menmaxing:   () => <MenmaxingSection />,
};

const SUB_TITLE_KEYS = {
  goals: 'nav.goals',
  skills: 'nav.skills',
  asceses: 'nav.asceses',
  moneymaxing: 'nav.moneymaxing',
  looksmaxing: 'nav.looksmaxing',
  menmaxing: 'nav.menmaxing',
};

const SIDEBAR_MODULES = [
  { id: 'goals',       icon: '✧', labelKey: 'nav.goals' },
  { id: 'skills',      icon: '✦', labelKey: 'nav.skills' },
  { id: 'asceses',     icon: '☥', labelKey: 'nav.asceses' },
];
const SIDEBAR_MAXING = [
  { id: 'moneymaxing', icon: '❖', labelKey: 'nav.moneymaxing' },
  { id: 'looksmaxing', icon: '✺', labelKey: 'nav.looksmaxing' },
  { id: 'menmaxing',   icon: '♂', labelKey: 'nav.menmaxing' },
];

const MAXING_IDS = ['menmaxing', 'looksmaxing', 'moneymaxing'];
// menmaxing routes to the merged Character/home view.
const VIEW_FOR_MAXING = { menmaxing: 'home', looksmaxing: 'looksmaxing', moneymaxing: 'moneymaxing' };
const CORE_SUB_IDS = ['goals', 'skills', 'asceses'];
const DEFAULT_HIDDEN_MAXING = ['moneymaxing', 'looksmaxing', 'menmaxing'];

const BOTTOM_ICONS = {
  menmaxing: (
    // Spartan/Corinthian helmet — masculine, fits the site's mystical/warrior tone
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* plume on top */}
      <path d="M8 4 C 9 2 11 1.5 12 2 C 13 1.5 15 2 16 4"/>
      {/* helmet shell */}
      <path d="M5 12 C 5 7 8 5 12 5 C 16 5 19 7 19 12 V 18 C 19 19 18 20 17 20 H 15 V 22 H 9 V 20 H 7 C 6 20 5 19 5 18 Z"/>
      {/* eye slit */}
      <path d="M8.5 12 H 15.5"/>
      {/* nose guard */}
      <path d="M12 12 V 18"/>
    </svg>
  ),
  looksmaxing: (
    // Side profile of a head — communicates face/jawline analysis directly
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3 C 13 3 11 5 11 8 L 9 11.5 C 8.4 12.2 8.8 13 9.7 13 L 11 13 L 10.5 14.8 C 10.3 15.6 10.9 16.3 11.7 16.3 L 12.5 16.3 L 12.5 18 C 12.5 19.7 13.8 21 15.5 21 L 18 21 L 19 14 L 19 8 C 19 5 17.5 3 16 3 Z"/>
      <circle cx="13.2" cy="9" r="0.6" fill="currentColor"/>
    </svg>
  ),
  moneymaxing: (
    // coin with $
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 6.5v11"/>
      <path d="M15 9.2c-0.5 -1 -1.7 -1.7 -3 -1.7 -1.7 0 -3 1 -3 2.3 0 1.4 1.3 1.8 3 2.2 1.7 0.4 3 0.8 3 2.2 0 1.3 -1.3 2.3 -3 2.3 -1.3 0 -2.5 -0.7 -3 -1.7"/>
    </svg>
  ),
};

const CORE_MODULES_META = {
  goals:   { icon: '✧', labelKey: 'nav.goals',   summary: (p) => (p.goals ?? []).filter((g) => !g.done).length },
  skills:  { icon: '✦', labelKey: 'nav.skills',  summary: (p) => (p.skills ?? []).reduce((s, v) => s + (typeof v.rank === 'number' ? v.rank : (v.level ?? 0)), 0) },
  asceses: { icon: '☥', labelKey: 'nav.asceses', summary: (p) => (p.asceses ?? []).filter((a) => a.status === 'active').length },
};

const SHOW_LOGIN_KEY = 'lr.showLogin';

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
  const { status, error } = useProfile();
  const { t } = useLang();
  const [view, setView] = useState('home');
  const [showLogin, setShowLoginState] = useState(() => {
    // Persist "user pressed Sign in" intent across the OAuth redirect.
    // Also infer it from the URL when Supabase sends us back with ?code/#access_token.
    try {
      if (localStorage.getItem(SHOW_LOGIN_KEY) === '1') return true;
    } catch {}
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('code') || window.location.hash.includes('access_token')) return true;
    }
    return false;
  });
  const setShowLogin = (v) => {
    setShowLoginState(v);
    try {
      if (v) localStorage.setItem(SHOW_LOGIN_KEY, '1');
      else localStorage.removeItem(SHOW_LOGIN_KEY);
    } catch {}
  };
  const prevStatus = useRef(status);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    if (status !== 'loading') window.dispatchEvent(new Event('lr:app-ready'));
  }, [status]);

  useEffect(() => {
    // Only flip back to the landing on an explicit sign-out (ready → unauthenticated).
    // On fresh loads or while the OAuth callback is being processed, keep the user's
    // last sign-in intent (so the OAuth redirect doesn't dump them on the landing).
    if (prevStatus.current === 'ready' && status === 'unauthenticated') {
      setShowLogin(false);
    }
    prevStatus.current = status;
  }, [status]);

  if (status === 'loading') {
    return <div className="splash"><div className="ornament">⚜ ⚔ ⚜</div></div>;
  }
  if (status === 'error') {
    return <div className="splash"><div className="ornament">⚠</div><div className="error-text">{error}</div></div>;
  }
  if (status === 'unauthenticated') {
    return showLogin ? <LoginScreen /> : <Landing onEnter={() => setShowLogin(true)} />;
  }
  if (status === 'need-name') {
    return <NameModal />;
  }

  const subRender = SUB_RENDER[view];
  const subTitle = SUB_TITLE_KEYS[view] && t(SUB_TITLE_KEYS[view]);

  if (isDesktop) {
    return (
      <div className="desktop-shell">
        <DesktopSidebar view={view} setView={setView} />
        <main className="desktop-content">
          {view === 'home' && <CharacterPage onNavigate={setView} hideNav />}
          {view === 'calendar' && <CalendarPage />}
          {subRender && (
            <div className="card desktop-card">
              <h1 className="sub-title desktop-sub-title">{subTitle}</h1>
              <div className="divider" />
              {subRender()}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Mobile: top tabs (Character/Calendar) + content + bottom bar (maxings).
  // Core sub-views (goals/skills/asceses) are opened from inside Menmaxing
  // and render as SubPages whose back returns to Menmaxing.
  const isCoreSub = CORE_SUB_IDS.includes(view);

  return (
    <div className="app">
      <div className="single-page">
        {isCoreSub ? (
          <SubPage title={subTitle} onBack={() => setView('home')}>
            {subRender()}
          </SubPage>
        ) : (
          <MobileShell view={view} setView={setView} t={t} />
        )}
      </div>
    </div>
  );
}

function DesktopSidebar({ view, setView }) {
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
      <button className="desktop-brand" onClick={() => setView('home')}>
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
          className={`desktop-nav-item ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          <span className="desktop-nav-icon">📅</span>
          <span>{t('tab.calendar')}</span>
        </button>

        <div className="desktop-nav-section">{t('settings.modules')}</div>
        {SIDEBAR_MODULES.map((m) => (
          <button
            key={m.id}
            data-id={m.id}
            className={`desktop-nav-item ${view === m.id ? 'active' : ''}`}
            onClick={() => setView(m.id)}
          >
            <span className="desktop-nav-icon">{m.icon}</span>
            <span>{t(m.labelKey)}</span>
          </button>
        ))}

        <div className="desktop-nav-section">maxing</div>
        {SIDEBAR_MAXING.map((m) => (
          <button
            key={m.id}
            data-id={m.id}
            className={`desktop-nav-item ${view === m.id ? 'active' : ''}`}
            onClick={() => setView(m.id)}
          >
            <span>{t(m.labelKey)}</span>
          </button>
        ))}
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

function MobileShell({ view, setView, t }) {
  const { profile } = useProfile();
  const startX = useRef(null);
  const startY = useRef(null);
  // Top tabs + Character/Calendar swipe live on the merged Character/Menmaxing hub.
  const showTopTabs = view === 'home' || view === 'calendar';
  const isSwipable = view === 'home';
  const prevView = useRef(view);
  const direction = 'none';
  prevView.current = view;

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
    if (!isSwipable) return;
    if (dx > 0) setView('home');
    if (dx < 0) setView('calendar');
  };

  const hidden = profile?.module_prefs?.hidden ?? DEFAULT_HIDDEN_MAXING;
  const enabledMaxing = MAXING_IDS.filter((id) => !hidden.includes(id));

  return (
    <div className="main-shell with-bottom-bar" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {showTopTabs && (
        <div className="top-tabs">
          <button
            className={`top-tab ${view === 'home' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >{t('tab.character')}</button>
          <span className="top-tabs-sep">✦</span>
          <button
            className={`top-tab ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >{t('tab.calendar')}</button>
        </div>
      )}
      <div key={view} className={`page-slide page-slide-${direction}`}>
        {view === 'home' && <MenmaxingMobile setView={setView} />}
        {view === 'calendar' && <CalendarPage />}
        {view === 'looksmaxing' && <MaxingScreen titleKey="nav.looksmaxing" Section={LooksmaxingSection} />}
        {view === 'moneymaxing' && <MaxingScreen titleKey="nav.moneymaxing" Section={MoneymaxingSection} />}
      </div>

      {enabledMaxing.length > 0 && (
        <nav className="bottom-bar" role="navigation">
          {enabledMaxing.map((id) => {
            const m = SIDEBAR_MAXING.find((x) => x.id === id);
            const target = VIEW_FOR_MAXING[id] ?? id;
            return (
              <button
                key={id}
                data-id={id}
                aria-label={t(m.labelKey)}
                className={`bottom-bar-item ${view === target ? 'active' : ''}`}
                onClick={() => setView(target)}
              >
                <span className="bottom-bar-icon">{BOTTOM_ICONS[id]}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function MaxingScreen({ titleKey, Section }) {
  const { t } = useLang();
  return (
    <div className="card maxing-card">
      <h1 className="sub-title">{t(titleKey)}</h1>
      <div className="divider" />
      <Section />
    </div>
  );
}

function MenmaxingMobile({ setView }) {
  return (
    <CharacterPage
      onNavigate={setView}
      showNav={true}
      extra={
        <>
          <div className="divider" />
          <MenmaxingSection />
        </>
      }
    />
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
