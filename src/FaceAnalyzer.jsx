import { useEffect, useRef, useState } from 'react';
import { useLang } from './i18n.jsx';

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

  const overall = (
    symmetry * 0.35 +
    Math.max(0, 1 - Math.abs(fwhr - 1.9) / 0.6) * 0.25 +
    Math.max(0, 1 - Math.abs(jawAngle - 125) / 30) * 0.2 +
    Math.max(0, thirdsBalance) * 0.2
  );

  return {
    symmetry,
    fwhr,
    jawAngle,
    canthalTilt,
    thirds,
    thirdsBalance: Math.max(0, thirdsBalance),
    overall: Math.max(0, Math.min(1, overall)),
    midX,
  };
}

function drawMesh(ctx, lm, w, h, metrics) {
  ctx.save();
  // dots
  ctx.fillStyle = 'rgba(120, 200, 230, 0.55)';
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });

  // midline
  ctx.strokeStyle = 'rgba(255, 215, 120, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(metrics.midX * w, 0);
  ctx.lineTo(metrics.midX * w, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // thirds
  const top = p(IDX.foreheadTop), brow = p(IDX.glabella), sub = p(IDX.subnasale), chin = p(IDX.chin);
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
  ctx.lineWidth = 1;
  for (const yy of [top.y, brow.y, sub.y, chin.y]) {
    ctx.beginPath();
    ctx.moveTo(0, yy); ctx.lineTo(w, yy);
    ctx.stroke();
  }

  // jawline
  ctx.strokeStyle = 'rgba(255, 120, 120, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const r = p(IDX.rZyg), rg = p(IDX.rGonion), lg = p(IDX.lGonion), l = p(IDX.lZyg);
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(rg.x, rg.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.lineTo(lg.x, lg.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  // canthal lines
  ctx.strokeStyle = 'rgba(140, 240, 180, 0.85)';
  ctx.beginPath();
  const rI = p(IDX.rInner), rO = p(IDX.rOuter), lI = p(IDX.lInner), lO = p(IDX.lOuter);
  ctx.moveTo(rI.x, rI.y); ctx.lineTo(rO.x, rO.y);
  ctx.moveTo(lI.x, lI.y); ctx.lineTo(lO.x, lO.y);
  ctx.stroke();

  ctx.restore();
}

export default function FaceAnalyzer({ open, onClose, onSavePhoto }) {
  const { t } = useLang();
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
              {metrics && (
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
                </div>
              )}
              <div className="face-actions">
                <button className="face-action ghost" onClick={retake}>{t('face.retake')}</button>
                {onSavePhoto && imgDataUrl && (
                  <button className="face-action" onClick={savePhoto}>{t('face.saveAsPhoto')}</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
