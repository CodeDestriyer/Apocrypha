import { useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { BIG_FIVE, ROSENBERG, ADHD, LIKERT4, LIKERT5, FREQ5, scoreBigFive, scoreRosenberg, scoreAdhd } from './data.js';

const SCALE_LABELS = { likert4: LIKERT4, likert5: LIKERT5, freq5: FREQ5 };

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

function ScaleRow({ value, max, labels, onChange }) {
  return (
    <div className="likert-row">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`likert-dot ${value === n ? 'active' : ''}`}
          aria-label={labels[n - 1]}
          title={labels[n - 1]}
          onClick={() => onChange(n)}
        >
          <span className="likert-dot-inner" />
        </button>
      ))}
    </div>
  );
}

function ScaleLegend({ labels }) {
  return (
    <div className="likert-legend">
      <span>{labels[0]}</span>
      <span>{labels[labels.length - 1]}</span>
    </div>
  );
}

function BigFiveResult({ test, answers }) {
  const { lang } = useLang();
  const scores = useMemo(() => scoreBigFive(test, answers), [test, answers]);
  const order = ['E', 'A', 'C', 'N', 'O'];
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>
      <div className="big5-bars">
        {order.map((trait) => {
          const s = scores[trait];
          return (
            <div key={trait} className="big5-bar">
              <div className="big5-bar-head">
                <span className="big5-bar-name">{tx(test.traits[trait], lang)}</span>
                <span className="big5-bar-pct">{s.pct}%</span>
              </div>
              <div className="big5-bar-track">
                <div className="big5-bar-fill" style={{ width: `${s.pct}%` }} />
              </div>
              <p className="big5-bar-desc">{tx(test.traitDesc[trait], lang)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RosenbergResult({ test, answers }) {
  const { lang } = useLang();
  const { total, max, band } = useMemo(() => scoreRosenberg(test, answers), [test, answers]);
  const pct = Math.round((total / max) * 100);
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
    </div>
  );
}

function AdhdResult({ test, answers }) {
  const { lang } = useLang();
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
    </div>
  );
}

export default function TestRunner({ test, onClose }) {
  const { lang, t } = useLang();
  const scaleSet = SCALE_LABELS[test.scale] ?? LIKERT5;
  const labels = scaleSet[lang] ?? scaleSet.en;
  const [answers, setAnswers] = useState(() => new Array(test.items.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const answered = answers.filter((a) => a != null).length;
  const total = test.items.length;
  const progressPct = Math.round((answered / total) * 100);
  const complete = answered === total;

  const setAnswer = (idx, val) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[idx] = val;
      return next;
    });
  };

  return (
    <div className="test-overlay" role="dialog" aria-modal="true">
      <div className="test-modal">
        <header className="test-header">
          <div>
            <h2 className="test-title">{tx(test.title, lang)}</h2>
            {!submitted && <p className="test-sub">{tx(test.short, lang)}</p>}
          </div>
          <button className="test-close" onClick={onClose} aria-label={t('test.close') || 'Close'}>×</button>
        </header>

        {!submitted ? (
          <>
            <div className="test-progress">
              <div className="test-progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
              <span>{answered} / {total}</span>
            </div>

            <ScaleLegend labels={labels} />

            <ol className="test-questions">
              {test.items.map((item, idx) => (
                <li key={idx} className={`test-question ${answers[idx] != null ? 'answered' : ''}`}>
                  <div className="test-question-text">
                    <span className="test-question-num">{idx + 1}.</span>
                    <span>{tx(item, lang)}</span>
                  </div>
                  <ScaleRow
                    value={answers[idx]}
                    max={test.max}
                    labels={labels}
                    onChange={(v) => setAnswer(idx, v)}
                  />
                </li>
              ))}
            </ol>

            <div className="test-actions">
              <button
                className="test-submit"
                disabled={!complete}
                onClick={() => setSubmitted(true)}
              >
                {complete ? (t('test.result') || 'Show result') : `${t('test.answerAll') || 'Answer all'} (${total - answered})`}
              </button>
            </div>
          </>
        ) : (
          <>
            {test.id === BIG_FIVE.id && <BigFiveResult test={test} answers={answers} />}
            {test.id === ROSENBERG.id && <RosenbergResult test={test} answers={answers} />}
            {test.id === ADHD.id && <AdhdResult test={test} answers={answers} />}
            <div className="test-actions">
              <button className="test-secondary" onClick={() => setSubmitted(false)}>
                {t('test.review') || 'Review answers'}
              </button>
              <button className="test-submit" onClick={onClose}>
                {t('test.done') || 'Done'}
              </button>
            </div>
            <p className="test-disclaimer">
              {t('test.disclaimer') || 'Educational self-assessment, not a medical diagnosis.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
