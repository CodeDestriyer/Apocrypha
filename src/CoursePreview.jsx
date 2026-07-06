import { useEffect, useState } from 'react';
import { useLang } from './i18n.jsx';

const CTA_DELAY_MS = 8000;

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

export default function CoursePreview({ course, onClose }) {
  const { lang, t } = useLang();
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    if (!course.hotmartUrl) return;
    const timer = setTimeout(() => setShowCta(true), CTA_DELAY_MS);
    return () => clearTimeout(timer);
  }, [course.hotmartUrl]);

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-modal">
        <header className="preview-header">
          <h2 className="preview-title">{course.title}</h2>
          <button className="preview-close" onClick={onClose} aria-label={t('test.close') || 'Close'}>×</button>
        </header>
        <iframe
          className="preview-frame"
          src={course.preview}
          title={course.title}
        />
        {course.hotmartUrl && (
          <div className={`preview-cta ${showCta ? 'visible' : ''}`}>
            <a
              className="preview-cta-btn"
              href={course.hotmartUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tx(
                {
                  ru: 'Продолжить в Hotmart →',
                  en: 'Continue on Hotmart →',
                  es: 'Continuar en Hotmart →',
                },
                lang
              )}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
