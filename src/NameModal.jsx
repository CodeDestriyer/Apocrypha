import { useState } from 'react';
import { useProfile } from './ProfileContext.jsx';

export default function NameModal() {
  const { submitName } = useProfile();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    await submitName(n);
  };

  return (
    <div className="modal-backdrop">
      <div className="card modal-card">
        <h1 className="name">Имя героя</h1>
        <input
          autoFocus
          className="name-input modal-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={24}
          placeholder="Имя"
        />
        <button className="primary-btn" onClick={submit} disabled={!name.trim() || busy}>
          {busy ? '…' : 'Войти'}
        </button>
      </div>
    </div>
  );
}
