import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { ADHD, DARK_TRIAD, ARCHETYPE_TEST, PSYCH_AGE, SILICON_MIND, FREQ5, AGREE5, scoreAdhd, scoreDarkTriad, scoreArchetypes, scorePsychAge, scoreSilicon } from './data.js';

const SCALE_LABELS = { freq5: FREQ5, agree5: AGREE5 };

function tx(obj, lang) {
  return obj?.[lang] ?? obj?.en ?? obj?.ru ?? '';
}

// Short one-line summary of a finished test, for the saved history.
function summarizeResult(test, answers, lang) {
  if (test.id === ADHD.id) {
    const { total, max, band } = scoreAdhd(test, answers);
    return { score: `${total}/${max}`, label: tx(test.bands[band], lang) };
  }
  if (test.id === DARK_TRIAD.id) {
    const { subscales } = scoreDarkTriad(test, answers);
    const order = ['M', 'N', 'P'];
    const top = order.reduce((a, b) => (subscales[b].pct > subscales[a].pct ? b : a), order[0]);
    return { score: `${subscales[top].sum}/${subscales[top].max}`, label: tx(test.subscales[top], lang) };
  }
  if (test.id === ARCHETYPE_TEST.id) {
    const { core } = scoreArchetypes(test, answers);
    return { score: `${core.sum}/${core.max}`, label: tx(test.archetypes[core.key], lang) };
  }
  if (test.id === PSYCH_AGE.id) {
    const { age, band } = scorePsychAge(test, answers);
    const yearsWord = { ru: 'лет', en: 'years', es: 'años' };
    return { score: `${age} ${tx(yearsWord, lang)}`, label: tx(test.bands[band], lang) };
  }
  if (test.id === SILICON_MIND.id) {
    const { pct, band } = scoreSilicon(test, answers);
    return { score: `${pct}%`, label: tx(test.bands[band], lang) };
  }
  return { score: '', label: '' };
}

function RegisterCta({ onRegister }) {
  if (!onRegister) return null;
  return (
    <div className="test-register">
      <span className="test-register-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.7" />
          <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6S19.4 16 19.4 20" />
        </svg>
      </span>
      <div className="test-register-text">
        <strong>Guarda tu resultado</strong>
        <span>Crea tu cuenta para guardar este resultado y seguir tu evolución.</span>
      </div>
      <button className="test-register-btn" onClick={onRegister}>Regístrate</button>
    </div>
  );
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

function RadarChart({ test, subscales, axisOrder }) {
  const { lang } = useLang();
  const size = 280;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const radius = 96;
  // axes evenly spaced, starting at the top
  const angles = axisOrder.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / axisOrder.length);
  const ringSteps = [0.25, 0.5, 0.75, 1];
  const pt = (angle, r) => `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  const ringPoly = (ratio) => angles.map((a) => pt(a, radius * ratio)).join(' ');
  const dataPoly = axisOrder
    .map((k, i) => pt(angles[i], radius * (subscales[k].pct / 100)))
    .join(' ');

  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size + 30}`} aria-hidden="true">
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="60%">
          <stop offset="0%"  stopColor="#e8c98a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#b8924a" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {ringSteps.map((r) => (
        <polygon key={r} className="radar-ring" points={ringPoly(r)} />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          className="radar-axis"
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(a) * radius}
          y2={cy + Math.sin(a) * radius}
        />
      ))}
      <polygon className="radar-data" points={dataPoly} fill="url(#radar-fill)" />
      {axisOrder.map((k, i) => {
        const a = angles[i];
        const labelR = radius + 22;
        const lx = cx + Math.cos(a) * labelR;
        const ly = cy + Math.sin(a) * labelR;
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <g key={k}>
            <text className="radar-label" x={lx} y={ly} textAnchor={anchor}>
              {tx(test.subscales[k], lang)}
            </text>
            <text className="radar-value" x={lx} y={ly + 14} textAnchor={anchor}>
              {subscales[k].sum}/{subscales[k].max}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DarkTriadResult({ test, answers, onClose, onRestart }) {
  const { lang, t } = useLang();
  const { subscales } = useMemo(() => scoreDarkTriad(test, answers), [test, answers]);
  const order = ['M', 'N', 'P'];
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>
      <RadarChart test={test} subscales={subscales} axisOrder={order} />
      <div className="darktriad-bands">
        {order.map((k) => {
          const s = subscales[k];
          return (
            <div key={k} className={`darktriad-band band-${s.band}`}>
              <div className="darktriad-band-head">
                <span className="darktriad-band-name">{tx(test.subscales[k], lang)}</span>
                <span className="darktriad-band-score">{s.sum}/{s.max}</span>
              </div>
              <span className="darktriad-band-tag">{tx(test.subscaleBands[k][s.band], lang)}</span>
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

function ArchetypeResult({ test, answers, onClose, onRestart }) {
  const { lang, t } = useLang();
  const { ranked, core, shadow } = useMemo(() => scoreArchetypes(test, answers), [test, answers]);
  const rest = ranked.slice(2);
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>

      <div className="archetype-duo">
        <div className="archetype-card archetype-core">
          <span className="archetype-tag">{tx(test.coreLabel, lang)}</span>
          <h4 className="archetype-name">{tx(test.archetypes[core.key], lang)}</h4>
          <p className="archetype-desc">{tx(test.descriptions[core.key], lang)}</p>
          <span className="archetype-score">{core.sum}/{core.max}</span>
        </div>
        <div className="archetype-card archetype-shadow">
          <span className="archetype-tag">{tx(test.shadowLabel, lang)}</span>
          <h4 className="archetype-name">{tx(test.archetypes[shadow.key], lang)}</h4>
          <p className="archetype-desc">{tx(test.descriptions[shadow.key], lang)}</p>
          <span className="archetype-score">{shadow.sum}/{shadow.max}</span>
        </div>
      </div>

      <ul className="archetype-list">
        {rest.map((r, i) => (
          <li key={r.key} className="archetype-row">
            <span className="archetype-row-rank">{i + 3}</span>
            <span className="archetype-row-name">{tx(test.archetypes[r.key], lang)}</span>
            <span className="archetype-row-bar"><span style={{ width: `${r.pct}%` }} /></span>
            <span className="archetype-row-score">{r.sum}/{r.max}</span>
          </li>
        ))}
      </ul>

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

function PsychAgeResult({ test, answers, onClose, onRestart }) {
  const { lang, t } = useLang();
  const { total, min, max, band, age } = useMemo(() => scorePsychAge(test, answers), [test, answers]);
  const pct = Math.round(((total - min) / (max - min)) * 100);
  const yearsWord = { ru: 'лет', en: 'years', es: 'años' };
  const caption = { ru: 'Твой психологический возраст', en: 'Your psychological age', es: 'Tu edad psicológica' };
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>
      <p className="psychage-caption">{tx(caption, lang)}</p>
      <div className="rosenberg-score">
        <div className="rosenberg-score-num psychage-num">{age}<span>{tx(yearsWord, lang)}</span></div>
        <div className="rosenberg-score-band">{tx(test.bands[band], lang)}</div>
      </div>
      <div className="big5-bar-track" style={{ marginTop: 12 }}>
        <div className="big5-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="big5-bar-desc" style={{ marginTop: 14 }}>{tx(test.bandDesc[band], lang)}</p>
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

function SiliconResult({ test, answers, onClose, onRestart }) {
  const { lang, t } = useLang();
  const { pct, band } = useMemo(() => scoreSilicon(test, answers), [test, answers]);
  const caption = { ru: 'Нейродивергентная оптимизация', en: 'Neurodivergent optimization', es: 'Optimización neurodivergente' };
  return (
    <div className="test-result">
      <h3 className="test-result-title">{tx(test.title, lang)}</h3>
      <p className="psychage-caption">{tx(caption, lang)}</p>
      <div className="rosenberg-score">
        <div className="rosenberg-score-num psychage-num">{pct}<span>%</span></div>
        <div className="rosenberg-score-band">{tx(test.bands[band], lang)}</div>
      </div>
      <div className="big5-bar-track" style={{ marginTop: 12 }}>
        <div className="big5-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="big5-bar-desc" style={{ marginTop: 14 }}>{tx(test.bandDesc[band], lang)}</p>
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

export default function TestRunner({ test, onClose, onRegister, onSaveResult }) {
  const { lang, t } = useLang();
  const isChoice = test.scale === 'choice';
  const scaleSet = SCALE_LABELS[test.scale] ?? FREQ5;
  const labels = scaleSet[lang] ?? scaleSet.en;

  const total = test.items.length;
  const [answers, setAnswers] = useState(() => new Array(total).fill(null));
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [transition, setTransition] = useState(null); // 'out-left' | 'in-right' | null
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const advanceTimer = useRef(null);
  const savedRef = useRef(false);

  // For choice-scale tests, shuffle each item's a/b/c options once per attempt so
  // the "mature" answer isn't always in the same position. Points travel with the
  // option, so scoring stays order-independent. Reshuffled on restart via seed.
  const shuffledOptions = useMemo(() => {
    if (!isChoice) return null;
    return test.items.map((it) => {
      const opts = it.options.slice();
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      return opts;
    });
  }, [test, isChoice, shuffleSeed]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Persist the finished test to the logged-in user's history (once).
  useEffect(() => {
    if (!submitted || !onSaveResult || savedRef.current) return;
    savedRef.current = true;
    const { score, label } = summarizeResult(test, answers, lang);
    onSaveResult({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      testId: test.id,
      title: tx(test.title, lang),
      date: new Date().toISOString(),
      score,
      label,
    });
  }, [submitted, onSaveResult, test, answers, lang]);

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
    savedRef.current = false;
    setAnswers(new Array(total).fill(null));
    setIndex(0);
    setSubmitted(false);
    setTransition(null);
    setShuffleSeed((s) => s + 1);
  };

  const item = test.items[index];

  return (
    <div className="test-overlay" role="dialog" aria-modal="true">
      <div className={`test-modal test-modal-card ${submitted ? 'test-modal-result' : ''}`}>
        <header className="test-header">
          {!submitted && <h2 className="test-title">{tx(test.title, lang)}</h2>}
          <button className="test-close" onClick={onClose} aria-label={t('test.close') || 'Close'}>×</button>
        </header>

        {!submitted ? (
          <>
            <div className="test-progress">
              <div className="test-progress-bar"><div style={{ width: `${progressPct}%` }} /></div>
              <span>{index + 1} / {total}</span>
            </div>

            <div className="qcard-stage">
              <div className={`qcard ${transition ? `qcard-${transition}` : ''}`}>
                <div className="qcard-num"><span>{String(index + 1).padStart(2, '0')}</span></div>
                <p className="qcard-question">{tx(item, lang)}</p>
                <div className="qcard-options">
                  {isChoice
                    ? shuffledOptions[index].map((opt, i) => {
                        const val = opt.points;
                        const active = answers[index] === val;
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`qcard-option qcard-option--choice opt-${i} ${active ? 'active' : ''}`}
                            onClick={() => pick(val)}
                          >
                            <span className="qcard-option-dot" />
                            <span className="qcard-option-label">{tx(opt, lang)}</span>
                          </button>
                        );
                      })
                    : labels.map((label, i) => {
                        const val = i + 1;
                        const active = answers[index] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`qcard-option opt-${i} ${active ? 'active' : ''}`}
                            onClick={() => pick(val)}
                          >
                            <span className="qcard-option-dot" />
                            <span className="qcard-option-label">{label}</span>
                          </button>
                        );
                      })}
                </div>
              </div>
            </div>

            <div className="qcard-nav">
              <button
                className="qcard-nav-btn"
                onClick={() => goTo(index - 1, 'back')}
                disabled={index === 0}
              >
                {t('test.back') || '← Back'}
              </button>
              {complete && (
                <button
                  className="test-submit qcard-nav-result"
                  onClick={() => setSubmitted(true)}
                >
                  {t('test.result') || 'Show result'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {test.id === ADHD.id && (
              <AdhdResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
            )}
            {test.id === DARK_TRIAD.id && (
              <DarkTriadResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
            )}
            {test.id === ARCHETYPE_TEST.id && (
              <ArchetypeResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
            )}
            {test.id === PSYCH_AGE.id && (
              <PsychAgeResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
            )}
            {test.id === SILICON_MIND.id && (
              <SiliconResult test={test} answers={answers} onClose={onClose} onRestart={restart} />
            )}
            <RegisterCta onRegister={onRegister} />
          </>
        )}
      </div>
    </div>
  );
}
