import { useState } from 'react';
import { signInWithGoogle } from './supabase.js';
import { useLang } from './i18n.jsx';

export default function LoginScreen() {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const onGoogle = async () => {
    setBusy(true);
    setErr(null);
    try { await signInWithGoogle(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="card modal-card">
        <div className="ornament">⚜ ⚔ ⚜</div>
        <h1 className="name">Varkanis</h1>
        <div className="divider" />
        <button className="primary-btn google-btn" onClick={onGoogle} disabled={busy}>
          <span className="g-icon">G</span>
          <span>{busy ? '…' : t('btn.loginGoogle')}</span>
        </button>
        {err && <div className="error-text">{err}</div>}
      </div>
    </div>
  );
}
