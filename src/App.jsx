import { useState } from 'react';
import CharacterPage from './pages/CharacterPage.jsx';
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
          <CharacterPage onNavigate={setView} />
        )}
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
