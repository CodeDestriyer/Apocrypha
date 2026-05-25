import { useLang } from '../i18n.jsx';
import TrackerSection from './TrackerSection.jsx';

export default function MenmaxingSection() {
  const { t } = useLang();
  return <TrackerSection field="menmaxing" placeholder={t('men.tracker')} />;
}
