import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

// "Peso" — the weight tracker (a "Libre"-style chart), child of Salud.
// Placeholder for now: a framed chart mock, no data yet.
export default function PesoSection({ rootOnBack }) {
  const { t } = useLang();
  return (
    <SubPage title={t('weight.title')} onBack={rootOnBack}>
      <div className="peso-plot">
        <div className="peso-plot-head">
          <span className="weight-card-title">{t('weight.title')}</span>
          <span className="weight-card-tag">{t('weight.soon')}</span>
        </div>
        <div className="weight-card-plot">
          <svg className="weight-card-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line className="weight-card-grid" x1="0" y1="25" x2="100" y2="25" />
            <line className="weight-card-grid" x1="0" y1="50" x2="100" y2="50" />
            <line className="weight-card-grid" x1="0" y1="75" x2="100" y2="75" />
            <polyline className="weight-card-line" points="3,72 20,60 38,64 56,44 74,50 97,30" />
          </svg>
        </div>
      </div>
      <div className="empty-hint">{t('salud.empty')}</div>
    </SubPage>
  );
}
