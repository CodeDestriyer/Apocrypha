import { useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { uploadLooksPhoto } from '../supabase.js';
import TrackerSection from './TrackerSection.jsx';

const RATINGS = [
  'Truecel',
  'Sub-five',
  'Normie',
  'High-tier Normie',
  'Chadlite',
  'Sub-chad',
  'Chad',
  'Gigachad',
];

export default function LooksmaxingSection() {
  const { profile, update } = useProfile();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

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

  const setRating = (r) => update({ looks_rating: r });

  return (
    <>
      <div className="looks-top">
        <button className="looks-photo" onClick={onPick}>
          {profile.looks_photo_url ? (
            <img src={profile.looks_photo_url} alt="" />
          ) : (
            <span className="looks-photo-empty">{uploading ? '…' : '+ фото'}</span>
          )}
        </button>

        <div className="looks-rating">
          <label className="looks-rating-label">Твоя оценка</label>
          <select
            className="period-select looks-rating-select"
            value={profile.looks_rating ?? ''}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="">— не выбрано —</option>
            {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {profile.looks_photo_url && (
            <button className="link-btn" onClick={onPick} disabled={uploading}>
              {uploading ? 'Загружаем…' : 'Заменить фото'}
            </button>
          )}
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

      <TrackerSection field="looksmaxing" placeholder="Что прокачиваешь во внешности" />
    </>
  );
}
