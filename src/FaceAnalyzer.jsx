import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';
import { useProfile } from './ProfileContext.jsx';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarkerPromise = null;
function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'IMAGE',
        numFaces: 1,
      });
    })();
  }
  return landmarkerPromise;
}

const IDX = {
  // eyes
  rOuter: 33,  rInner: 133,
  lOuter: 263, lInner: 362,
  // jaw / chin
  chin: 152,
  rGonion: 172, lGonion: 397,
  // cheekbones (bizygomatic)
  rZyg: 234, lZyg: 454,
  // nose / forehead / mouth
  noseTip: 1,
  subnasale: 2,
  glabella: 9,
  foreheadTop: 10,
  upperLip: 13,
  // lip vermillion + philtrum
  upperLipOuter: 0,    // top of upper lip (skin border)
  upperLipInner: 13,   // bottom of upper lip (between lips)
  lowerLipInner: 14,   // top of lower lip
  lowerLipOuter: 17,   // bottom of lower lip (skin border)
  mouthR: 61, mouthL: 291,
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const TIERS = [
  { max: 0.30, key: 'face.tier.sub3'    },
  { max: 0.45, key: 'face.tier.sub5'    },
  { max: 0.55, key: 'face.tier.ltn'     },
  { max: 0.65, key: 'face.tier.mtn'     },
  { max: 0.75, key: 'face.tier.htn'     },
  { max: 0.88, key: 'face.tier.chad'    },
  { max: 1.01, key: 'face.tier.trueAdam'},
];
const tierFor = (v) => TIERS.find((t) => v < t.max) ?? TIERS[TIERS.length - 1];

const SCORE_LABELS = {
  symmetry: 'face.symmetry',
  fwhr:     'face.metric.fwhr',
  jaw:      'face.jawAngle',
  tilt:     'face.canthalTilt',
  thirds:   'face.thirds',
  lips:     'face.lips',
  philtrum: 'face.philtrum',
  lipChin:  'face.lipChin',
};
const SCORE_TIPS = {
  symmetry: 'face.tip.symmetry',
  fwhr:     'face.tip.fwhr',
  jaw:      'face.tip.jaw',
  tilt:     'face.tip.tilt',
  thirds:   'face.tip.thirds',
  lips:     'face.tip.lips',
  philtrum: 'face.tip.philtrum',
  lipChin:  'face.tip.lipChin',
};
const weakestOf = (scores) => {
  let worst = null;
  for (const [k, v] of Object.entries(scores)) {
    if (worst === null || v < worst.v) worst = { k, v };
  }
  return worst;
};

function computeMetrics(lm) {
  const p = (i) => lm[i];

  const midX = (p(IDX.glabella).x + p(IDX.noseTip).x + p(IDX.chin).x) / 3;

  // Symmetry: mean absolute mirror offset across midline, normalized by face width
  const pairs = [
    [IDX.rOuter, IDX.lOuter],
    [IDX.rInner, IDX.lInner],
    [IDX.mouthR, IDX.mouthL],
    [IDX.rGonion, IDX.lGonion],
    [IDX.rZyg, IDX.lZyg],
  ];
  const faceWidth = Math.abs(p(IDX.lZyg).x - p(IDX.rZyg).x);
  const offsets = pairs.map(([a, b]) => {
    const da = midX - p(a).x;
    const db = p(b).x - midX;
    const dyDelta = Math.abs(p(a).y - p(b).y);
    const dxDelta = Math.abs(da - db);
    return (dxDelta + dyDelta) / faceWidth;
  });
  const meanOff = offsets.reduce((s, v) => s + v, 0) / offsets.length;
  const symmetry = Math.max(0, Math.min(1, 1 - meanOff * 4));

  // FWHR: bizygomatic width / upper face height (brow → upper lip)
  const upperFaceH = Math.abs(p(IDX.upperLip).y - p(IDX.glabella).y);
  const fwhr = faceWidth / Math.max(1e-6, upperFaceH);

  // Jawline angle at gonion (right side): angle ear-gonion-chin
  const angleAt = (a, b, c) => {
    const v1x = a.x - b.x, v1y = a.y - b.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.hypot(v1x, v1y);
    const m2 = Math.hypot(v2x, v2y);
    return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
  };
  // approximate "ear" with cheekbone above gonion: 234 (right) / 454 (left)
  const jawAngleR = angleAt(p(IDX.rZyg), p(IDX.rGonion), p(IDX.chin));
  const jawAngleL = angleAt(p(IDX.lZyg), p(IDX.lGonion), p(IDX.chin));
  const jawAngle = (jawAngleR + jawAngleL) / 2;

  // Canthal tilt: angle from inner→outer canthus relative to horizontal
  const tiltDeg = (inner, outer) => {
    const dx = p(outer).x - p(inner).x;
    const dy = p(outer).y - p(inner).y;
    // image y grows downward, so positive tilt = outer higher than inner
    return -Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;
  };
  const tiltR = tiltDeg(IDX.rInner, IDX.rOuter);
  const tiltL = tiltDeg(IDX.lInner, IDX.lOuter);
  const canthalTilt = (tiltR + tiltL) / 2;

  // Facial thirds
  const t1 = Math.abs(p(IDX.glabella).y - p(IDX.foreheadTop).y);
  const t2 = Math.abs(p(IDX.subnasale).y - p(IDX.glabella).y);
  const t3 = Math.abs(p(IDX.chin).y - p(IDX.subnasale).y);
  const totalH = t1 + t2 + t3;
  const thirds = { upper: t1 / totalH, middle: t2 / totalH, lower: t3 / totalH };
  const thirdIdeal = 1 / 3;
  const thirdsBalance = 1 - (
    Math.abs(thirds.upper - thirdIdeal) +
    Math.abs(thirds.middle - thirdIdeal) +
    Math.abs(thirds.lower - thirdIdeal)
  ) * 1.5;

  // Lips
  const upperVerm = Math.abs(p(IDX.upperLipInner).y - p(IDX.upperLipOuter).y);
  const lowerVerm = Math.abs(p(IDX.lowerLipOuter).y - p(IDX.lowerLipInner).y);
  // Ideal: lower lip ~1.6x upper (full but balanced)
  const lipRatio = lowerVerm / Math.max(1e-6, upperVerm); // upper:lower as 1:lipRatio
  const lipsScore = Math.max(0, 1 - Math.abs(lipRatio - 1.6) / 1.0);

  // Philtrum length: subnasale → upper lip outer, normalized by lower-face height (subnasale → chin)
  const philtrumLen = Math.abs(p(IDX.upperLipOuter).y - p(IDX.subnasale).y);
  const lowerFaceH = Math.abs(p(IDX.chin).y - p(IDX.subnasale).y);
  const philtrumRatio = philtrumLen / Math.max(1e-6, lowerFaceH); // ideal ~0.22
  const philtrumScore = Math.max(0, 1 - Math.abs(philtrumRatio - 0.22) / 0.12);

  // Lip-to-chin: distance lower lip outer → chin, vs subnasale → lower lip outer
  // Lower-face thirds: ideal stomion-chin = 2 * subnasale-stomion
  const stomionY = (p(IDX.upperLipInner).y + p(IDX.lowerLipInner).y) / 2;
  const subToStomion = Math.abs(stomionY - p(IDX.subnasale).y);
  const stomionToChin = Math.abs(p(IDX.chin).y - stomionY);
  const lipChinRatio = stomionToChin / Math.max(1e-6, subToStomion); // ideal ~2.0
  const lipChinScore = Math.max(0, 1 - Math.abs(lipChinRatio - 2.0) / 1.0);

  // Sub-scores (normalized 0..1)
  const fwhrScore = Math.max(0, 1 - Math.abs(fwhr - 1.9) / 0.6);
  const jawScore = Math.max(0, 1 - Math.abs(jawAngle - 125) / 30);
  const tiltScore = Math.max(0, 1 - Math.abs(canthalTilt - 4) / 8);
  const thirdsScore = Math.max(0, thirdsBalance);

  const overall = (
    symmetry * 0.22 +
    fwhrScore * 0.16 +
    jawScore * 0.16 +
    tiltScore * 0.10 +
    thirdsScore * 0.12 +
    lipsScore * 0.10 +
    philtrumScore * 0.07 +
    lipChinScore * 0.07
  );

  return {
    symmetry,
    fwhr,
    jawAngle,
    canthalTilt,
    thirds,
    thirdsBalance: Math.max(0, thirdsBalance),
    lipRatio,
    philtrumRatio,
    lipChinRatio,
    scores: {
      symmetry,
      fwhr: fwhrScore,
      jaw: jawScore,
      tilt: tiltScore,
      thirds: thirdsScore,
      lips: lipsScore,
      philtrum: philtrumScore,
      lipChin: lipChinScore,
    },
    overall: Math.max(0, Math.min(1, overall)),
    midX,
  };
}

function drawMesh(ctx, lm, w, h, metrics) {
  ctx.save();
  const scale = Math.max(w, h) / 720;
  const lw = (n) => Math.max(1, n * scale);

  // subtle shadow for legibility on any photo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4 * scale;

  // landmark dots — small, muted, no shadow on each dot
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(190, 210, 230, 0.45)';
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, Math.max(0.7, scale * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 4 * scale;

  const p = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const top = p(IDX.foreheadTop), brow = p(IDX.glabella), sub = p(IDX.subnasale), chin = p(IDX.chin);

  // === symmetry axis: warm amber ===
  ctx.strokeStyle = 'rgba(214, 168, 92, 0.95)';
  ctx.lineWidth = lw(2.2);
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  ctx.moveTo(metrics.midX * w, top.y - 20 * scale);
  ctx.lineTo(metrics.midX * w, chin.y + 30 * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  // === facial thirds: dusty teal ===
  ctx.strokeStyle = 'rgba(96, 168, 178, 0.85)';
  ctx.lineWidth = lw(2);
  for (const yy of [top.y, brow.y, sub.y, chin.y]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.05, yy);
    ctx.lineTo(w * 0.95, yy);
    ctx.stroke();
  }

  // === jawline: deep crimson ===
  ctx.strokeStyle = 'rgba(192, 72, 72, 0.95)';
  ctx.lineWidth = lw(3);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  const r = p(IDX.rZyg), rg = p(IDX.rGonion), lg = p(IDX.lGonion), l = p(IDX.lZyg);
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(rg.x, rg.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.lineTo(lg.x, lg.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  // === bizygomatic width (FWHR numerator): violet ===
  ctx.strokeStyle = 'rgba(155, 110, 196, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  // === lips: warm rose ===
  const uo = p(IDX.upperLipOuter), ui = p(IDX.upperLipInner);
  const li = p(IDX.lowerLipInner), lo = p(IDX.lowerLipOuter);
  ctx.strokeStyle = 'rgba(204, 102, 122, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  ctx.moveTo(uo.x - 18 * scale, uo.y); ctx.lineTo(uo.x + 18 * scale, uo.y);
  ctx.moveTo(ui.x - 18 * scale, ui.y); ctx.lineTo(ui.x + 18 * scale, ui.y);
  ctx.moveTo(li.x - 18 * scale, li.y); ctx.lineTo(li.x + 18 * scale, li.y);
  ctx.moveTo(lo.x - 18 * scale, lo.y); ctx.lineTo(lo.x + 18 * scale, lo.y);
  ctx.stroke();

  // === canthal tilt lines: emerald ===
  ctx.strokeStyle = 'rgba(96, 184, 120, 0.95)';
  ctx.lineWidth = lw(2.6);
  ctx.beginPath();
  const rI = p(IDX.rInner), rO = p(IDX.rOuter), lI = p(IDX.lInner), lO = p(IDX.lOuter);
  ctx.moveTo(rI.x, rI.y); ctx.lineTo(rO.x, rO.y);
  ctx.moveTo(lI.x, lI.y); ctx.lineTo(lO.x, lO.y);
  ctx.stroke();

  // === key landmark accents ===
  const accent = [
    [IDX.rZyg, 'rgba(192, 72, 72, 1)'],
    [IDX.lZyg, 'rgba(192, 72, 72, 1)'],
    [IDX.rGonion, 'rgba(192, 72, 72, 1)'],
    [IDX.lGonion, 'rgba(192, 72, 72, 1)'],
    [IDX.chin, 'rgba(192, 72, 72, 1)'],
    [IDX.rInner, 'rgba(96, 184, 120, 1)'],
    [IDX.rOuter, 'rgba(96, 184, 120, 1)'],
    [IDX.lInner, 'rgba(96, 184, 120, 1)'],
    [IDX.lOuter, 'rgba(96, 184, 120, 1)'],
    [IDX.glabella, 'rgba(96, 168, 178, 1)'],
    [IDX.subnasale, 'rgba(96, 168, 178, 1)'],
    [IDX.foreheadTop, 'rgba(96, 168, 178, 1)'],
  ];
  for (const [idx, color] of accent) {
    const pt = p(idx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, lw(3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

export default function FaceAnalyzer({ open, onClose, onSavePhoto }) {
  const { t } = useLang();
  const { profile, update } = useProfile();
  const [scanSaved, setScanSaved] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stage, setStage] = useState('camera'); // camera | analyzing | result
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [landmarks, setLandmarks] = useState(null);
  const imgElRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (stage !== 'result') return;
    const out = canvasRef.current;
    const img = imgElRef.current;
    if (!out || !img || !landmarks || !metrics) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    out.width = w; out.height = h;
    const octx = out.getContext('2d');
    octx.drawImage(img, 0, 0, w, h);
    drawMesh(octx, landmarks, w, h, metrics);
  }, [stage, landmarks, metrics]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    setStage('analyzing');
    setError(null);
    try {
      const w = video.videoWidth, h = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const cctx = canvas.getContext('2d');
      cctx.translate(w, 0); cctx.scale(-1, 1); // mirror so it matches preview
      cctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setImgDataUrl(dataUrl);

      stopCamera();

      const landmarker = await getLandmarker();
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const result = landmarker.detect(img);
      const lm = result?.faceLandmarks?.[0];
      if (!lm) {
        setError(t('face.notFound'));
        setStage('result');
        return;
      }
      const m = computeMetrics(lm);
      imgElRef.current = img;
      setLandmarks(lm);
      setMetrics(m);
      setStage('result');
    } catch (e) {
      console.error(e);
      setError(e.message || String(e));
      setStage('result');
    }
  };

  const retake = async () => {
    setMetrics(null);
    setImgDataUrl(null);
    setLandmarks(null);
    imgElRef.current = null;
    setError(null);
    setScanSaved(false);
    setStage('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const savePhoto = async () => {
    if (!imgDataUrl || !onSavePhoto) return;
    const blob = await (await fetch(imgDataUrl)).blob();
    const file = new File([blob], 'face.jpg', { type: 'image/jpeg' });
    onSavePhoto(file);
  };

  const close = () => {
    stopCamera();
    setMetrics(null);
    setImgDataUrl(null);
    setLandmarks(null);
    imgElRef.current = null;
    setError(null);
    setStage('camera');
    onClose?.();
  };

  if (!open) return null;

  const pct = (v) => Math.round(v * 100) + '%';
  const tiltLabel = metrics
    ? (metrics.canthalTilt > 2 ? t('face.tiltPositive')
      : metrics.canthalTilt < -2 ? t('face.tiltNegative')
      : t('face.tiltNeutral'))
    : '';

  return (
    <div className="face-modal-backdrop" onClick={close}>
      <div className="face-modal" onClick={(e) => e.stopPropagation()}>
        <div className="face-modal-head">
          <h3>{t('face.title')}</h3>
          <button className="face-modal-close" onClick={close} aria-label="close">✕</button>
        </div>

        <div className="face-modal-body">
          {stage === 'camera' && (
            <div className="face-stage">
              <div className="face-video-wrap">
                <video ref={videoRef} playsInline muted className="face-video" />
              </div>
              {error && <div className="error-text">{error}</div>}
              <button className="face-action" onClick={capture} disabled={!!error}>
                {t('face.capture')}
              </button>
              <p className="face-hint">{t('face.hint')}</p>
            </div>
          )}

          {stage === 'analyzing' && (
            <div className="face-stage">
              <div className="face-loading">{t('face.analyzing')}…</div>
            </div>
          )}

          {stage === 'result' && (
            <div className="face-stage">
              <div className="face-canvas-wrap">
                <canvas ref={canvasRef} className="face-canvas" />
              </div>
              {error && <div className="error-text">{error}</div>}
              {metrics && (() => {
                const weak = weakestOf(metrics.scores);
                return (
                  <div className="face-metrics">
                    <div className="face-metric face-metric-overall">
                      <span className="face-metric-label">{t('face.overall')}</span>
                      <span className="face-metric-value">{t(tierFor(metrics.overall).key)}</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.symmetry')}</span>
                      <span className="face-metric-value">{pct(metrics.symmetry)}</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">FWHR</span>
                      <span className="face-metric-value">{metrics.fwhr.toFixed(2)}</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.jawAngle')}</span>
                      <span className="face-metric-value">{Math.round(metrics.jawAngle)}°</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.canthalTilt')}</span>
                      <span className="face-metric-value">
                        {metrics.canthalTilt > 0 ? '+' : ''}{metrics.canthalTilt.toFixed(1)}° · {tiltLabel}
                      </span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.thirds')}</span>
                      <span className="face-metric-value">
                        {pct(metrics.thirds.upper)} / {pct(metrics.thirds.middle)} / {pct(metrics.thirds.lower)}
                      </span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.lips')}</span>
                      <span className="face-metric-value">1 : {metrics.lipRatio.toFixed(2)}</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.philtrum')}</span>
                      <span className="face-metric-value">{pct(metrics.philtrumRatio)}</span>
                    </div>
                    <div className="face-metric">
                      <span className="face-metric-label">{t('face.lipChin')}</span>
                      <span className="face-metric-value">1 : {metrics.lipChinRatio.toFixed(2)}</span>
                    </div>

                    {weak && (
                      <div className="face-weakpoint">
                        <div className="face-weakpoint-head">
                          {t('face.weakpoint')} · <strong>{t(SCORE_LABELS[weak.k])}</strong>
                        </div>
                        <div className="face-weakpoint-tip">{t(SCORE_TIPS[weak.k])}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="face-actions">
                <button className="face-action ghost" onClick={retake}>{t('face.retake')}</button>
                {metrics && (
                  <button
                    className="face-action"
                    onClick={() => {
                      const { scores, midX, ...rest } = metrics;
                      const scan = {
                        id: newId(),
                        ts: new Date().toISOString(),
                        tier: tierFor(metrics.overall).key,
                        ...rest,
                        scores,
                      };
                      update((curr) => ({
                        face_scans: [...(Array.isArray(curr.face_scans) ? curr.face_scans : []), scan],
                      }));
                      setScanSaved(true);
                    }}
                    disabled={scanSaved}
                  >
                    {scanSaved ? t('face.scanSaved') : t('face.saveScan')}
                  </button>
                )}
                {onSavePhoto && imgDataUrl && (
                  <button className="face-action ghost" onClick={savePhoto}>{t('face.saveAsPhoto')}</button>
                )}
              </div>

              {Array.isArray(profile?.face_scans) && profile.face_scans.length > 0 && (
                <FaceHistory scans={profile.face_scans} t={t} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FaceHistory({ scans, t }) {
  const sorted = [...scans].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  const recent = sorted.slice(-20);
  const W = 280, H = 60, PAD = 4;
  const xs = recent.map((_, i) => recent.length <= 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (recent.length - 1));
  const ys = recent.map((s) => H - PAD - s.overall * (H - PAD * 2));
  const path = recent.length
    ? xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
    : '';
  const last = sorted[sorted.length - 1];
  return (
    <div className="face-history">
      <div className="face-history-head">{t('face.history')} · {sorted.length}</div>
      {recent.length > 1 && (
        <svg className="face-history-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <path d={path} fill="none" stroke="rgba(214, 168, 92, 0.9)" strokeWidth="1.6" />
          {xs.map((x, i) => (
            <circle key={i} cx={x} cy={ys[i]} r="2.2" fill="rgba(214, 168, 92, 1)" />
          ))}
        </svg>
      )}
      {last && (
        <div className="face-history-last">
          {t('face.lastScan')}: <strong>{t(last.tier)}</strong> · {new Date(last.ts).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
