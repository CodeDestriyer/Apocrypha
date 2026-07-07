import { useEffect } from 'react';
import Landing from './Landing.jsx';
import { ProfileProvider, useProfile } from './ProfileContext.jsx';
import { LangProvider } from './i18n.jsx';

function Shell() {
  const { status } = useProfile();

  useEffect(() => {
    if (status !== 'loading') window.dispatchEvent(new Event('lr:app-ready'));
  }, [status]);

  if (status === 'loading') {
    return <div className="splash"><div className="ornament">⚜ ⚔ ⚜</div></div>;
  }

  // The public site (tests + courses) is the only surface. Authenticated users
  // stay here too — registering just marks them as logged in so results can be
  // saved; it no longer routes into the gamification app.
  return <Landing />;
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
