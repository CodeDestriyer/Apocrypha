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

const MAXING_IDS = ['moneymaxing', 'looksmaxing', 'menmaxing'];
const CORE_SUB_IDS = ['goals', 'skills', 'asceses'];
const DEFAULT_HIDDEN_MAXING = ['moneymaxing', 'looksmaxing', 'menmaxing'];

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
          <SubPage title={subTitle} onBack={() => setView('menmaxing')}>
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
  const isTopTab = view === 'home' || view === 'calendar';
  const prevView = useRef(isTopTab ? view : 'home');
  const direction = isTopTab && view !== prevView.current
    ? (prevView.current === 'home' ? 'left' : 'right')
    : 'none';
  if (isTopTab) prevView.current = view;

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
    if (!isTopTab) return;
    if (dx < 0 && view === 'home') setView('calendar');
    if (dx > 0 && view === 'calendar') setView('home');
  };

  const hidden = profile?.module_prefs?.hidden ?? DEFAULT_HIDDEN_MAXING;
  const enabledMaxing = MAXING_IDS.filter((id) => !hidden.includes(id));

  return (
    <div className="main-shell with-bottom-bar" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
      <div key={view} className={`page-slide page-slide-${direction}`}>
        {view === 'home' && <CharacterPage onNavigate={setView} showNav={false} />}
        {view === 'calendar' && <CalendarPage />}
        {view === 'looksmaxing' && <MaxingScreen titleKey="nav.looksmaxing" Section={LooksmaxingSection} />}
        {view === 'moneymaxing' && <MaxingScreen titleKey="nav.moneymaxing" Section={MoneymaxingSection} />}
        {view === 'menmaxing' && <MenmaxingMobile setView={setView} />}
      </div>

      {enabledMaxing.length > 0 && (
        <nav className="bottom-bar" role="navigation">
          {enabledMaxing.map((id) => {
            const m = SIDEBAR_MAXING.find((x) => x.id === id);
            return (
              <button
                key={id}
                data-id={id}
                className={`bottom-bar-item ${view === id ? 'active' : ''}`}
                onClick={() => setView(id)}
              >
                <span>{t(m.labelKey)}</span>
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
  const { profile } = useProfile();
  const { t } = useLang();
  return (
    <div className="card maxing-card">
      <h1 className="sub-title">{t('nav.menmaxing')}</h1>
      <div className="divider" />
      <div className="nav-grid">
        {CORE_SUB_IDS.map((id) => {
          const meta = CORE_MODULES_META[id];
          return (
            <button
              key={id}
              data-id={id}
              className="nav-card"
              onClick={() => setView(id)}
            >
              <span className="nav-icon">{meta.icon}</span>
              <span className="nav-label">{t(meta.labelKey)}</span>
              <span className="nav-summary">{meta.summary(profile)}</span>
            </button>
          );
        })}
      </div>
      <div className="divider" />
      <MenmaxingSection />
    </div>
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
