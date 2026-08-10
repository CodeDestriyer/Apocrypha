import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

// "Salud" — a top-level section, placeholder for now. Health metrics
// (weight tracking, etc.) will live here later.
export default function SaludSection({ rootOnBack }) {
  const { t } = useLang();
  return (
    <SubPage title={t('nav.salud')} onBack={rootOnBack}>
      <div className="empty-hint">{t('salud.empty')}</div>
    </SubPage>
  );
}
