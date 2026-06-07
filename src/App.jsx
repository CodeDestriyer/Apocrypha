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
    // Caesar bust (Delapouite / game-icons.net, CC BY 3.0)
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
      <path d="M264.234 33.64a94.945 94.945 0 0 0-10.957.608C190.895 41.376 131.82 93.06 100.975 152.756c.118-.095.234-.193.353-.287l7.463-5.899 5.477 7.778c1.554 2.208 2.872 4.663 4.033 7.34 7.928-17.487 21.63-34.571 40.363-46.084l7.61-4.676 4.734 7.572c2.502 4.003 4.31 8.702 5.713 14.016 9.889-16.645 25.602-32.252 45.758-41.608l8.101-3.76 3.822 8.073c.153.323.298.652.442.982 9.782-13.132 23.275-24.935 39.728-32.572l8.102-3.762 3.822 8.072c1.356 2.864 2.351 6.017 3.104 9.416 8.43-10.724 19.573-20.548 32.812-27.744-18.601-9.895-38.4-15.936-58.178-15.972zm140.498 19.813c-21.58 4.89-40.88 18.458-50.029 31.264-5.337 7.47-6.704 14.015-5.808 17.388.895 3.374 3.457 6.667 14.306 8.53 3.785.65 8.053-.756 13.291-5.094 5.239-4.338 10.728-11.384 15.358-19.36 4.629-7.974 8.462-16.865 10.949-24.75.915-2.9 1.414-5.45 1.933-7.978zm-71.066 10.74c-19.686 10.104-35.007 28.047-40.684 42.725-1.002 2.592-1.669 5.007-2.07 7.205-.134 1.34-.288 2.68-.46 4.022-.123 3.113.378 5.538 1.23 7.058 1.706 3.045 5.005 5.597 15.976 4.703 3.827-.312 7.612-2.734 11.608-8.238 3.995-5.505 7.56-13.695 10.06-22.57 2.5-8.876 4-18.44 4.45-26.696.164-3.037.016-5.63-.11-8.209zm-61.148 21.221c-15.32 10.048-27.077 25.116-32.995 38.63.178 8.541-.428 17.78-1.966 26.833-.003.02-.008.039-.012.059 2.075 2.643 5.784 4.535 16.084 2.58 3.772-.716 7.28-3.525 10.668-9.422 3.388-5.898 6.065-14.421 7.61-23.512 1.544-9.09 2.021-18.762 1.591-27.018-.158-3.037-.581-5.6-.98-8.15zm-52.096 27.28c-18.503 12.135-31.833 31.6-35.92 46.798-2.384 8.867-1.373 15.474.646 18.32 2.02 2.847 5.57 5.036 16.385 2.983 3.773-.716 7.28-3.527 10.668-9.424 3.389-5.897 6.065-14.419 7.61-23.51 1.544-9.09 2.021-18.761 1.591-27.017-.158-3.038-.581-5.6-.98-8.15zm172.715 1.915a64.957 64.957 0 0 1-5.164 4.795c-7.692 6.37-17.404 10.759-27.819 8.971a53.37 53.37 0 0 1-5.308-1.19 23.867 23.867 0 0 0-.545 1.585c9.883 3.882 19.338 8.95 27.293 14.312.488.329.951.657 1.427.986 14.312-1.453 31.422-7.418 45.325-17.963-2.27-1.23-4.543-2.485-7.352-3.652-7.635-3.17-16.909-5.96-25.992-7.549-.624-.109-1.244-.198-1.865-.295zm-233.983 22.87c-16.968 14.203-27.946 35.087-30.238 50.658-1.337 9.083.435 15.528 2.772 18.12 2.336 2.593 6.118 4.353 16.62 1.057 3.664-1.15 6.82-4.348 9.5-10.6 2.68-6.25 4.35-15.025 4.827-24.234.477-9.208-.174-18.869-1.56-27.02-.511-2.998-1.228-5.495-1.92-7.981zm167.551 2.595c-4.894 4.226-10.774 7.219-17.586 7.774-.776.063-1.542.098-2.305.129-4.164 5.764-3.952 9.104-2.789 11.761 1.4 3.198 6.544 7.467 15.371 9.99 15.132 4.326 38.685 2.928 58.618-6.681-1.981-1.656-3.96-3.338-6.483-5.04-6.855-4.62-15.39-9.193-23.978-12.552-7.288-2.85-14.632-4.777-20.848-5.38zm86.656 15.182a106.836 106.836 0 0 1-13.511 4.318c.112.164.23.326.34.49l4.949 7.434-7.397 5.006c-20.412 13.818-44.598 18.985-65.494 17.557 1.179 1.786 2.212 3.592 3.055 5.435l3.713 8.123-8.094 3.776c-18.069 8.427-37.682 10.878-55.32 9.015 3.324 5.162 5.82 10.156 7.115 15.174l2.232 8.648-8.63 2.3c-16.504 4.394-33.356 4.273-48.56 1.052 2.399 4.105 4.226 8.128 5.268 12.166l2.233 8.648-8.631 2.3c-17.359 4.621-35.103 4.246-50.908.525 3.2 5.494 5.503 10.687 6.41 16.017l1.59 9.344-9.414 1.103c-29.326 3.442-58.181-6.708-75.637-21.18-4.087-3.387-7.717-7.113-10.414-11.218 17.989 59.19 62.717 123.576 62.717 123.576l-35.479 68.797c49.496 25.554 105.19 38.708 170.56 32.514-1.767-32.096 16.473-55.814 33.022-74.514-14.59-.975-29.987-2.226-44.846-5.064-16.51-3.155-32.54-8.341-46.003-18.032-13.464-9.69-24.033-24.105-28.956-43.7l17.458-4.387c3.99 15.88 11.622 26 22.011 33.478 10.39 7.478 23.863 12.094 38.87 14.961 25.516 4.875 54.75 4.428 79.554 7.643 26.748-2.02 57.07 2.601 63.441-8.596 15.568-27.36 5.054-63.93-3.44-92.492 18.463-.61 28.178-1.69 38.735-4.967-8.607-34.5-21.86-54.883-43.703-73.5 1.629-20.453 4.194-42.05 1.164-61.75zm-143.705 10.031c-3.632 2.872-7.843 4.998-12.672 5.914-5.147.977-10.06 1.154-14.574.598-2.391 3.278-2.569 5.739-2.08 7.879a119.26 119.26 0 0 1 9.176 7.135 140.092 140.092 0 0 1 7.195 6.628c14.405 5.749 36.32 7.451 56.233 1.496-1.694-1.947-3.382-3.92-5.604-5.998-6.039-5.646-13.746-11.51-21.695-16.183-5.387-3.167-10.897-5.746-15.979-7.469zm-165.892 9.828C91.6 189.035 84.35 207.673 83.58 221.33c-.47 8.343 1.653 14.076 3.498 15.916 1.846 1.84 4.091 3.065 12.469-.613 2.48-1.089 4.922-4.003 6.73-9.848 1.808-5.845 2.59-13.96 2.32-22.369-.268-8.409-1.532-17.143-3.308-24.436-.448-1.84-1.006-3.23-1.525-4.865zm117.484 14.098c-4.367 4.56-9.797 8.02-16.357 9.266-4.519.857-8.861 1.105-12.909.779.005.14.01.28.02.418.17 2.194 1.611 5.283 4.533 8.59 1.106.886 2.201 1.789 3.281 2.713a137.466 137.466 0 0 1 3.963 3.544c12.956 8.865 35.325 15.08 57.012 12.59-1.326-2.214-2.642-4.454-4.465-6.888-4.955-6.618-11.512-13.74-18.52-19.735-5.473-4.682-11.249-8.637-16.558-11.277zm-51.684 23.215c-3.888 5.477-9.097 9.938-15.865 12.062-3.643 1.144-7.216 1.857-10.646 2.15 1.39 3.355 4.753 7.65 10.494 11.69 12.87 9.058 35.571 15.474 57.555 12.95-1.327-2.215-2.642-4.455-4.465-6.89-4.956-6.617-11.515-13.74-18.522-19.734-6.165-5.274-12.72-9.645-18.55-12.228zm-48.607 26.136c-2.982 6.2-7.496 11.62-14.174 14.551-.504.222-1.01.415-1.515.615a34.936 34.936 0 0 0 4.89 4.92c10.574 8.766 29.946 16.537 49.654 17.452-.717-1.297-1.208-2.436-2.085-3.8-3.937-6.115-9.315-12.875-15.207-18.734-5.892-5.858-12.349-10.798-18.014-13.533a32.419 32.419 0 0 0-3.549-1.47zm-48.676 9.061-33.43 21.395 9.704 15.162 38.591-24.698a30.468 30.468 0 0 1-1.767-3.634c-4.235-.94-8.022-2.876-11.012-5.858a26.53 26.53 0 0 1-2.086-2.367z"/>
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
    return showLogin ? <LoginScreen /> : <Landing />;
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
