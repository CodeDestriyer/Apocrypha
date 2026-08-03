import { useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

// Cuerpo — the body tab. Deliberately minimal: type a weight, save it. Each
// save prepends an entry to profile.weight_log (newest first); the latest is
// shown big up top. No goals, no charts — just the number.
export default function BodySection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const log = Array.isArray(profile.weight_log) ? profile.weight_log : [];
  const [draft, setDraft] = useState('');

  const latest = log[0] ?? null;

  const setLog = (updater) =>
    update((curr) => ({ weight_log: updater(Array.isArray(curr.weight_log) ? curr.weight_log : []) }));

  const submit = () => {
    const weight = Number(String(draft).replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) return;
    const rounded = Math.round(weight * 10) / 10;
    const entry = { id: newId(), weight: rounded, date: todayISO(), created_at: new Date().toISOString() };
    setLog((l) => [entry, ...l]);
    setDraft('');
  };

  const remove = (id) => setLog((l) => l.filter((e) => e.id !== id));

  return (
    <SubPage title={t('nav.body')} onBack={rootOnBack}>
      <div className="body-section">
        <div className="body-latest">
          {latest ? (
            <>
              <span className="body-latest-value">{latest.weight}</span>
              <span className="body-latest-unit">{t('body.unit')}</span>
              <span className="body-latest-date">{fmtDate(latest.date)}</span>
            </>
          ) : (
            <span className="body-latest-empty">{t('body.empty')}</span>
          )}
        </div>

        <div className="body-input-row">
          <input
            className="body-input"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={draft}
            placeholder={t('body.placeholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          />
          <span className="body-input-unit">{t('body.unit')}</span>
          <button className="body-save-btn" onClick={submit} disabled={!draft.trim()}>
            {t('body.save')}
          </button>
        </div>

        {log.length > 0 && (
          <>
            <div className="body-history-title">{t('body.history')}</div>
            <ul className="body-history">
              {log.map((e) => (
                <li key={e.id} className="body-history-row">
                  <span className="body-history-weight">{e.weight} {t('body.unit')}</span>
                  <span className="body-history-date">{fmtDate(e.date)}</span>
                  <button
                    className="body-history-del"
                    onClick={() => remove(e.id)}
                    aria-label={t('body.delete')}
                  >×</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </SubPage>
  );
}
