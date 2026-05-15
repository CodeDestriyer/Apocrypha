import { useState } from 'react';
import { signInWithGoogle, signInAnonymous } from './supabase.js';

export default function LoginScreen() {
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const onGoogle = async () => {
    setBusy('google');
    setErr(null);
    try { await signInWithGoogle(); }
    catch (e) { setErr(e.message); setBusy(null); }
  };

  const onGuest = async () => {
    setBusy('guest');
    setErr(null);
    try { await signInAnonymous(); }
    catch (e) { setErr(e.message); setBusy(null); }
  };

  return (
    <div className="modal-backdrop">
      <div className="card modal-card">
        <div className="ornament">⚜ ⚔ ⚜</div>
        <h1 className="name">Apocrypha</h1>
        <div className="divider" />

        <button className="primary-btn google-btn" onClick={onGoogle} disabled={busy !== null}>
          <span className="g-icon">G</span>
          <span>{busy === 'google' ? '…' : 'Войти через Google'}</span>
        </button>

        <button className="ghost-btn" onClick={onGuest} disabled={busy !== null}>
          {busy === 'guest' ? '…' : 'Продолжить как гость'}
        </button>

        {err && <div className="error-text">{err}</div>}
      </div>
    </div>
  );
}
