import { useEffect, useRef, useState } from 'react';
import CharacterPage from './pages/CharacterPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import SubPage from './pages/SubPage.jsx';
import NameModal from './NameModal.jsx';
import LoginScreen from './LoginScreen.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider, useLang } from './i18n.jsx';
import GoalsSection from './sections/GoalsSection.jsx';
import SkillsSection from './sections/SkillsSection.jsx';
import AscesesSection from './sections/AscesesSection.jsx';
import TrackerSection from './sections/TrackerSection.jsx';
import LooksmaxingSection from './sections/LooksmaxingSection.jsx';
import MoneymaxingSection from './sections/MoneymaxingSection.jsx';

const SUB_RENDER = {
  goals:       () => <GoalsSection />,
  skills:      () => <SkillsSection />,
  asceses:     () => <AscesesSection />,
  moneymaxing: () => <MoneymaxingSection />,
  looksmaxing: () => <LooksmaxingSection />,
};

const SUB_TITLE_KEYS = {
  goals: 'nav.goals',
  skills: 'nav.skills',
  asceses: 'nav.asceses',
  moneymaxing: 'nav.moneymaxing',
  looksmaxing: 'nav.looksmaxing',
};

function Shell() {
  const { status, error } = useProfile();
  const { t } = useLang();
  const [view, setView] = useState('home');

  useEffect(() => {
    if (status !== 'loading') window.dispatchEvent(new Event('lr:app-ready'));
  }, [status]);

  if (status === 'loading') {
    return <div className="splash"><div className="ornament">⚜ ⚔ ⚜</div></div>;
  }
  if (status === 'error') {
    return <div className="splash"><div className="ornament">⚠</div><div className="error-text">{error}</div></div>;
  }
  if (status === 'unauthenticated') {
    return <LoginScreen />;
  }
  if (status === 'need-name') {
    return <NameModal />;
  }

  const subRender = SUB_RENDER[view];
  const subTitle = SUB_TITLE_KEYS[view] && t(SUB_TITLE_KEYS[view]);

  return (
    <div className="app">
      <div className="single-page">
        {subRender ? (
          <SubPage title={subTitle} onBack={() => setView('home')}>
            {subRender()}
          </SubPage>
        ) : (
          <MainView view={view} setView={setView} t={t} />
        )}
      </div>
    </div>
  );
}

function MainView({ view, setView, t }) {
  const mainView = view === 'calendar' ? 'calendar' : 'home';
  const idx = mainView === 'home' ? 0 : 1;
  const trackRef = useRef(null);
  const viewportRef = useRef(null);
  const drag = useRef(null); // { startX, startY, width, active, axisLocked }
  const [dragDx, setDragDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const widthOf = () => viewportRef.current?.clientWidth ?? window.innerWidth;

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      width: widthOf(),
      active: true,
      axisLocked: null,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e) => {
    const st = drag.current;
    if (!st?.active || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (st.axisLocked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      st.axisLocked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (st.axisLocked === 'x') {
        setDragging(true);
        viewportRef.current?.setPointerCapture?.(e.pointerId);
      }
    }
    if (st.axisLocked !== 'x') return;
    e.preventDefault?.();
    // Rubber-band at edges
    let next = dx;
    if (idx === 0 && next > 0) next = next * 0.35;
    if (idx === 1 && next < 0) next = next * 0.35;
    setDragDx(next);
  };

  const onPointerEnd = (e) => {
    const st = drag.current;
    if (!st?.active || st.pointerId !== e.pointerId) return;
    drag.current = null;
    if (st.axisLocked !== 'x') { setDragging(false); setDragDx(0); return; }
    const dx = dragDx;
    const threshold = st.width * 0.2;
    setDragging(false);
    setDragDx(0);
    if (dx < -threshold && idx === 0) setView('calendar');
    else if (dx > threshold && idx === 1) setView('home');
  };

  const translatePct = -idx * 100;
  const trackStyle = {
    transform: `translate3d(calc(${translatePct}% + ${dragDx}px), 0, 0)`,
    transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.16, 0.84, 0.3, 1)',
  };

  return (
    <div className="main-shell">
      <div className="top-tabs">
        <button
          className={`top-tab ${mainView === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >{t('tab.character')}</button>
        <span className="top-tabs-sep">✦</span>
        <button
          className={`top-tab ${mainView === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >{t('tab.calendar')}</button>
      </div>
      <div
        ref={viewportRef}
        className={`swipe-viewport ${dragging ? 'dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div ref={trackRef} className="swipe-track" style={trackStyle}>
          <div className="swipe-page">
            <CharacterPage onNavigate={setView} />
          </div>
          <div className="swipe-page">
            <CalendarPage />
          </div>
        </div>
      </div>
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
