import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import CardsSection from './CardsSection.jsx';
import RulesSection from './RulesSection.jsx';

// "Idiomas" groups the language-learning tools. It owns a two-way tab switch
// (Tarjetas / Reglas) and renders the active section, handing each one a
// rendered <TabBar> so the switch shows at the section's top level. Each
// section keeps its own SubPage / navigation underneath.
const _SS_KEY = 'lr.idiomas.tab.v1';
const _initTab = (() => {
  try { return sessionStorage.getItem(_SS_KEY) || 'cards'; } catch { return 'cards'; }
})();

export default function IdiomasSection({ rootOnBack }) {
  const { t } = useLang();
  const [tab, _setTab] = useState(_initTab);
  const setTab = (v) => {
    try { sessionStorage.setItem(_SS_KEY, v); } catch {}
    _setTab(v);
  };

  const tabBar = (
    <div className="idiomas-tabs" role="tablist">
      <button
        className={`idiomas-tab ${tab === 'cards' ? 'active' : ''}`}
        role="tab"
        aria-selected={tab === 'cards'}
        onClick={() => setTab('cards')}
      >
        {t('nav.cards')}
      </button>
      <button
        className={`idiomas-tab ${tab === 'reglas' ? 'active' : ''}`}
        role="tab"
        aria-selected={tab === 'reglas'}
        onClick={() => setTab('reglas')}
      >
        {t('reglas.title')}
      </button>
    </div>
  );

  return tab === 'reglas'
    ? <RulesSection rootOnBack={rootOnBack} langTab={tabBar} />
    : <CardsSection rootOnBack={rootOnBack} langTab={tabBar} />;
}
