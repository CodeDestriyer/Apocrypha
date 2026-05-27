import { useMemo } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';

// Parse "1.2M", "$500K", "1 000 000" → number. For promo display only.
function parseCapital(raw) {
  if (!raw) return 0;
  const s = String(raw).trim().toUpperCase();
  const num = parseFloat(s.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  if (!Number.isFinite(num)) return 0;
  if (/B|МЛРД/.test(s)) return num * 1e9;
  if (/M|МЛН/.test(s)) return num * 1e6;
  if (/K|К/.test(s)) return num * 1e3;
  return num;
}

// Seeded RNG (mulberry32) so the same capital produces the same chart.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function buildSeries(target, days, seed) {
  if (target <= 0) return null;
  const rand = rng(seed);
  // Start somewhere in the 8–25% range of target — leaves room for a clear climb.
  const start = target * (0.08 + rand() * 0.17);
  const points = new Array(days);
  points[0] = start;
  points[days - 1] = target;
  // Generate noisy monotonically-biased increments.
  const totalGain = target - start;
  const stepBase = totalGain / (days - 1);
  let acc = start;
  for (let i = 1; i < days - 1; i++) {
    // Each step is base + noise. Noise can dip negative occasionally for realism.
    const noise = (rand() - 0.35) * stepBase * 1.6;
    acc += stepBase + noise;
    points[i] = acc;
  }
  // Re-normalize so the line actually lands on target at the end (smooth the last 25%).
  const tailStart = Math.floor(days * 0.75);
  const tailDrift = points[days - 2] - target * 0.94;
  for (let i = tailStart; i < days - 1; i++) {
    const k = (i - tailStart) / (days - 1 - tailStart);
    points[i] = points[i] - tailDrift * k;
  }
  // Clamp to non-negative.
  for (let i = 0; i < days; i++) points[i] = Math.max(0, points[i]);
  return points;
}

function CapitalChart({ capital, capitalRaw }) {
  const series = useMemo(() => buildSeries(capital, 30, hashStr(String(capitalRaw))), [capital, capitalRaw]);
  if (!series) return null;

  const W = 600, H = 160, PAD_X = 8, PAD_Y = 14;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const xs = series.map((_, i) => PAD_X + (i * (W - PAD_X * 2)) / (series.length - 1));
  const ys = series.map((v) => H - PAD_Y - ((v - min) / range) * (H - PAD_Y * 2));
  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xs[xs.length - 1].toFixed(1)} ${H} L ${xs[0].toFixed(1)} ${H} Z`;

  return (
    <svg className="capital-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="capArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="rgba(214, 168, 92, 0.30)" />
          <stop offset="100%" stopColor="rgba(214, 168, 92, 0)" />
        </linearGradient>
        <filter id="capGlow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="2.5" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill="url(#capArea)" />
      <path d={linePath} fill="none" stroke="rgba(240, 200, 140, 0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#capGlow)" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.2" fill="rgba(255, 235, 190, 1)" filter="url(#capGlow)" />
    </svg>
  );
}

export default function MoneymaxingSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const capitalNum = parseCapital(profile.money_capital);

  return (
    <>
      <div className="money-capital-block">
        <label className="field-label money-capital-label">{t('money.capital')}</label>
        <input
          className="money-capital-input"
          value={profile.money_capital ?? ''}
          onChange={(e) => update({ money_capital: e.target.value })}
          placeholder="0"
          maxLength={24}
          inputMode="text"
        />
        {capitalNum > 0 && <CapitalChart capital={capitalNum} capitalRaw={profile.money_capital} />}
      </div>

      <div className="divider" />

      <div className="field-block">
        <label className="field-label">{t('money.activity')}</label>
        <input
          className="field-input"
          value={profile.money_activity ?? ''}
          onChange={(e) => update({ money_activity: e.target.value })}
          placeholder={t('money.placeholder')}
          maxLength={48}
        />
      </div>
    </>
  );
}
