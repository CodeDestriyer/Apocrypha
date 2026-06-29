import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { ADHD, FREQ5, scoreAdhd } from './data.js';

const SCALE_LABELS = { freq5: FREQ5 };

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

function AdhdResult({ test, answers, onClose, onRestart }) {
  const { lang, t } = useLang();
  const { total, max, band, subscales } = useMemo(() => scoreAdhd(test, answers), [test, answers]);
  const pct = Math.round((total / max) * 100);
  const order = ['I', 'H', 'P'];
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>
      <div className="rosenberg-score">
        <div className="rosenberg-score-num">{total}<span>/{max}</span></div>
        <div className="rosenberg-score-band">{tx(test.bands[band], lang)}</div>
      </div>
      <div className="big5-bar-track" style={{ marginTop: 12 }}>
        <div className="big5-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="big5-bar-desc" style={{ marginTop: 14 }}>{tx(test.bandDesc[band], lang)}</p>
      <div className="big5-bars" style={{ marginTop: 18 }}>
        {order.map((k) => {
          const s = subscales[k];
          return (
            <div key={k} className="big5-bar">
              <div className="big5-bar-head">
                <span className="big5-bar-name">{tx(test.subscales[k], lang)}</span>
                <span className="big5-bar-pct">{s.sum}/{s.max}</span>
              </div>
              <div className="big5-bar-track">
                <div className="big5-bar-fill" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="test-actions">
        <button className="test-secondary" onClick={onRestart}>
          {t('test.restart') || 'Restart'}
        </button>
        <button className="test-submit" onClick={onClose}>
          {t('test.done') || 'Done'}
        </button>
      </div>
      <p className="test-disclaimer">
        {t('test.disclaimer') || 'Educational self-assessment, not a medical diagnosis.'}
      </p>
    </div>
  );
}

export default function TestRunner({ test, onClose }) {
  const { lang, t } = useLang();
  const scaleSet = SCALE_LABELS[test.scale] ?? FREQ5;
  const labels = scaleSet[lang] ?? scaleSet.en;

  const total = test.items.length;
  const [answers, setAnswers] = useState(() => new Array(total).fill(null));
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [transition, setTransition] = useState(null); // 'out-left' | 'in-right' | null
  const advanceTimer = useRef(null);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const progressPct = Math.round(((submitted ? total : index) / total) * 100);
  const complete = answers.every((a) => a != null);

  const goTo = (next, dir = 'forward') => {
    if (next < 0 || next > total) return;
    clearTimeout(advanceTimer.current);
    setTransition(dir === 'forward' ? 'out-left' : 'out-right');
    advanceTimer.current = setTimeout(() => {
      if (next === total) {
        setSubmitted(true);
        setTransition(null);
      } else {
        setIndex(next);
        setTransition(dir === 'forward' ? 'in-right' : 'in-left');
        requestAnimationFrame(() => requestAnimationFrame(() => setTransition(null)));
      }
    }, 180);
  };

  const pick = (val) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[index] = val;
      return next;
    });
    goTo(index + 1, 'forward');
  };

  const restart = () => {
    clearTimeout(advanceTimer.current);
    setAnswers(new Array(total).fill(null));
    setIndex(0);
    setSubmitted(false);
    setTransition(null);
  };

  const item = test.items[index];

  return (
    <div className="test-overlay" role="dialog" aria-modal="true">
      <div className="test-modal test-modal-card">
        <header className="test-header">
          <h2 className="test-title">{tx(test.title, lang)}</h2>
          <button className="test-close" onClick={onClose} aria-label={t('test.close') || 'Close'}>×</button>
        </header>

        {!submitted ? (
          <>
            <div className="test-progress">
              <div className="test-progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
              <span>{index + 1} / {total}</span>
            </div>

            <div className="card-stage">
              <div className={`card ${transition ? `card-${transition}` : ''}`}>
                <div className="card-num">{index + 1}</div>
                <p className="card-question">{tx(item, lang)}</p>
                <div className="card-options">
                  {labels.map((label, i) => {
                    const val = i + 1;
                    const active = answers[index] === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`card-option opt-${i} ${active ? 'active' : ''}`}
                        onClick={() => pick(val)}
                      >
                        <span className="card-option-dot" />
                        <span className="card-option-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card-nav">
              <button
                className="card-nav-btn"
                onClick={() => goTo(index - 1, 'back')}
                disabled={index === 0}
              >
                {t('test.back') || '← Back'}
              </button>
              {complete && (
                <button
                  className="test-submit card-nav-result"
                  onClick={() => setSubmitted(true)}
                >
                  {t('test.result') || 'Show result'}
                </button>
              )}
            </div>
          </>
        ) : (
          test.id === ADHD.id && (
            <AdhdResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
          )
        )}
      </div>
    </div>
  );
}
