import { useState } from 'react';
import CharacterPage from './pages/CharacterPage.jsx';
import SubPage from './pages/SubPage.jsx';
import NameModal from './NameModal.jsx';
import LoginScreen from './LoginScreen.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import GoalsSection from './sections/GoalsSection.jsx';
import SkillsSection from './sections/SkillsSection.jsx';
import AscesesSection from './sections/AscesesSection.jsx';
import TrackerSection from './sections/TrackerSection.jsx';
import LooksmaxingSection from './sections/LooksmaxingSection.jsx';

const SUB_PAGES = {
  goals:       { title: 'Цели',        render: () => <GoalsSection /> },
  skills:      { title: 'Навыки',      render: () => <SkillsSection /> },
  asceses:     { title: 'Аскезы',      render: () => <AscesesSection /> },
  moneymaxing: { title: 'Moneymaxing', render: () => <TrackerSection field="moneymaxing" placeholder="Источник дохода / финансовая цель" /> },
  looksmaxing: { title: 'Looksmaxing', render: () => <LooksmaxingSection /> },
};

function Shell() {
  const { status, error } = useProfile();
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

  const sub = SUB_PAGES[view];

  return (
    <div className="app">
      <div className="single-page">
        {sub ? (
          <SubPage title={sub.title} onBack={() => setView('home')}>
            {sub.render()}
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
    <ProfileProvider>
      <Shell />
    </ProfileProvider>
  );
}
