import { useState } from 'react';
import { signInWithGoogle } from './supabase.js';

export default function LoginScreen() {
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
        <h1 className="name">Apocrypha</h1>
        <div className="divider" />
        <button className="primary-btn google-btn" onClick={onGoogle} disabled={busy}>
          <span className="g-icon">G</span>
          <span>{busy ? '…' : 'Войти через Google'}</span>
        </button>
        {err && <div className="error-text">{err}</div>}
      </div>
    </div>
  );
}
