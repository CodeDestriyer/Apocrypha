import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import PesoSection from './PesoSection.jsx';
import SubPage from './SubPage.jsx';

// "Salud" — a top-level hub grouping health tools. For now its only child
// is Peso (weight tracking). Mirrors the Idiomas hub: on mobile this shows
// a landing menu; on desktop the sidebar expands to the same children.
const _SS_KEY = 'lr.salud.sub.v1';
const _initSub = (() => {
  try { return sessionStorage.getItem(_SS_KEY) || null; } catch { return null; }
})();

export default function SaludSection({ rootOnBack }) {
  const { t } = useLang();
  const [sub, _setSub] = useState(_initSub);
  const setSub = (v) => {
    try {
      if (v) sessionStorage.setItem(_SS_KEY, v);
      else sessionStorage.removeItem(_SS_KEY);
    } catch {}
    _setSub(v);
  };

  if (sub === 'peso') return <PesoSection rootOnBack={() => setSub(null)} />;

  return (
    <SubPage title={t('nav.salud')} onBack={rootOnBack}>
      <div className="nav-grid idiomas-menu">
        <button className="nav-card" onClick={() => setSub('peso')}>
          <span className="nav-icon">⚖</span>
          <span className="nav-label">{t('weight.title')}</span>
          <span className="nav-summary">—</span>
        </button>
      </div>
    </SubPage>
  );
}
