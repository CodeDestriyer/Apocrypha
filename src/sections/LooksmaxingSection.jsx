import { useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import { uploadLooksPhoto } from '../supabase.js';
import TrackerSection from './TrackerSection.jsx';
import FaceAnalyzer from '../FaceAnalyzer.jsx';

export default function LooksmaxingSection() {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [faceOpen, setFaceOpen] = useState(false);

  const onPick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadLooksPhoto(file);
      update({ looks_photo_url: url });
    } catch (x) {
      console.error(x);
      setErr(x.message || String(x));
    } finally {
      setUploading(false);
    }
  };

  const onCapturedFile = async (file) => {
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadLooksPhoto(file);
      update({ looks_photo_url: url });
      setFaceOpen(false);
    } catch (x) {
      console.error(x);
      setErr(x.message || String(x));
    } finally {
      setUploading(false);
    }
  };

  const scans = Array.isArray(profile.face_scans) ? profile.face_scans : [];
  const lastScan = scans.length
    ? [...scans].sort((a, b) => new Date(b.ts) - new Date(a.ts))[0]
    : null;
  const autoRating = lastScan ? t(lastScan.tier) : null;

  return (
    <>
      <div className="looks-top">
        <div className="looks-photo-col">
          <button className="looks-photo" onClick={onPick}>
            {profile.looks_photo_url ? (
              <img src={profile.looks_photo_url} alt="" />
            ) : (
              <span className="looks-photo-empty">{uploading ? '…' : t('looks.photoEmpty')}</span>
            )}
          </button>
          {profile.looks_photo_url && (
            <button className="link-btn" onClick={onPick} disabled={uploading}>
              {uploading ? t('looks.uploading') : t('looks.replace')}
            </button>
          )}
        </div>

        <div className="looks-rating">
          <label className="looks-rating-label">{t('looks.yourRating')}</label>
          <div className="looks-rating-display">
            {autoRating ?? <span className="looks-rating-empty">{t('looks.noScans')}</span>}
          </div>
          <button className="face-open-btn" onClick={() => setFaceOpen(true)}>
            {t('face.open')}
          </button>
          {err && <div className="error-text">{err}</div>}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={onFile}
        />
      </div>

      <div className="divider" />

      <TrackerSection field="looksmaxing" placeholder={t('looks.tracker')} />

      <FaceAnalyzer
        open={faceOpen}
        onClose={() => setFaceOpen(false)}
        onSavePhoto={onCapturedFile}
      />
    </>
  );
}
