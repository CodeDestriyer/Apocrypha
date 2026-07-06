import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

export default function CoursePreview({ course, onClose }) {
  const { lang, t } = useLang();
  const scrollRef = useRef(null);
  const pagesRef = useRef(null);
  const [pagesReady, setPagesReady] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let renderedCanvases = [];
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(course.preview);
      const pdf = await loadingTask.promise;
      if (cancelled) return;
      const container = pagesRef.current;
      if (!container) return;
      container.innerHTML = '';
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const containerWidth = container.clientWidth || 720;
        const cssTargetWidth = Math.min(containerWidth, 900);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (cssTargetWidth / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${cssTargetWidth}px`;
        canvas.style.height = `${(cssTargetWidth * baseViewport.height) / baseViewport.width}px`;
        canvas.className = 'preview-page';
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (cancelled) return;
        container.appendChild(canvas);
        renderedCanvases.push(canvas);
      }
      if (!cancelled) setPagesReady(true);
    };
    loadPdf().catch((err) => console.error('preview pdf load failed', err));
    return () => {
      cancelled = true;
      renderedCanvases.forEach((c) => c.remove());
    };
  }, [course.preview]);

  useEffect(() => {
    if (!pagesReady) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrolled = el.scrollTop + el.clientHeight;
      const threshold = el.scrollHeight * 0.66;
      setShowCta(scrolled >= threshold);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pagesReady]);

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-modal">
        <header className="preview-header">
          <h2 className="preview-title">{course.title}</h2>
          <button className="test-close preview-close" onClick={onClose} aria-label={t('test.close') || 'Close'}>×</button>
        </header>
        <div className="preview-scroll" ref={scrollRef}>
          <div className="preview-pages" ref={pagesRef} />
          {!pagesReady && (
            <div className="preview-loading">{t('preview.loading') || 'Loading…'}</div>
          )}
        </div>
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
