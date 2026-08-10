import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useProfile } from '../ProfileContext.jsx';
import CardsSection from './CardsSection.jsx';
import RulesSection from './RulesSection.jsx';
import SubPage from './SubPage.jsx';

// "Idiomas" is a small hub: a landing menu with two subsections —
// Tarjetas (flashcards) and Reglas (grammar rules). Picking one drills in;
// its back button returns here, and this page's back returns to the Hero.
// The open subsection is remembered in sessionStorage so it survives the
// remount when switching sidebar tabs / reloading.
const _SS_KEY = 'lr.idiomas.sub.v1';
const _initSub = (() => {
  try { return sessionStorage.getItem(_SS_KEY) || null; } catch { return null; }
})();

export default function IdiomasSection({ rootOnBack }) {
  const { t } = useLang();
  const { profile } = useProfile();
  const [sub, _setSub] = useState(_initSub);
  const setSub = (v) => {
    try {
      if (v) sessionStorage.setItem(_SS_KEY, v);
      else sessionStorage.removeItem(_SS_KEY);
    } catch {}
    _setSub(v);
  };

  if (sub === 'cards') return <CardsSection rootOnBack={() => setSub(null)} />;
  if (sub === 'reglas') return <RulesSection rootOnBack={() => setSub(null)} />;

  const decks = profile.decks ?? [];
  const cardCount = decks.reduce((s, d) => s + (d.cards?.length ?? 0), 0);
  const ruleCount = (profile.rules ?? []).length;

  return (
    <SubPage title={t('nav.idiomas')} onBack={rootOnBack}>
      <div className="nav-grid idiomas-menu">
        <button className="nav-card" onClick={() => setSub('cards')}>
          <span className="nav-icon">⌘</span>
          <span className="nav-label">{t('nav.cards')}</span>
          <span className="nav-summary">{cardCount}</span>
        </button>
        <button className="nav-card" onClick={() => setSub('reglas')}>
          <span className="nav-icon">§</span>
          <span className="nav-label">{t('reglas.title')}</span>
          <span className="nav-summary">{ruleCount}</span>
        </button>
      </div>
    </SubPage>
  );
}
