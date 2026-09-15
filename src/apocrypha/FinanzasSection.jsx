import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// One currency (EUR), so the section sums every account into a total balance.
const fmtEur = (n) => {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} €`;
  }
};

const parseAmount = (s) => {
  if (typeof s === 'number') return Number.isFinite(s) ? s : 0;
  if (typeof s !== 'string') return 0;
  const cleaned = s.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const EMPTY_DRAFT = { name: '', amount: '' };

// profile.finances: { id, name, amount, created_at }. Each entry is an account
// the user names freely (Efectivo, Revolut, N26…) holding a current EUR amount.
export default function FinanzasSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const finances = Array.isArray(profile.finances) ? profile.finances : [];

  const [editing, setEditing] = useState(null); // 'new' | id | null
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [menuId, setMenuId] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    if (menuId == null) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuId]);

  const setFinances = (updater) =>
    update((curr) => ({ finances: updater(Array.isArray(curr.finances) ? curr.finances : []) }));

  const total = finances.reduce((s, f) => s + (Number(f.amount) || 0), 0);

  const startAdd = () => { setDraft(EMPTY_DRAFT); setMenuId(null); setEditing('new'); };
  const startEdit = (f) => {
    setMenuId(null);
    setDraft({ name: f.name || '', amount: f.amount != null ? String(f.amount) : '' });
    setEditing(f.id);
  };
  const cancel = () => { setEditing(null); setDraft(EMPTY_DRAFT); };

  const canSave = draft.name.trim();

  const save = () => {
    if (!canSave) return;
    const name = draft.name.trim();
    const amount = parseAmount(draft.amount);
    if (editing === 'new') {
      setFinances((list) => [{ id: newId(), name, amount, created_at: new Date().toISOString() }, ...list]);
    } else {
      setFinances((list) => list.map((x) => (x.id === editing ? { ...x, name, amount } : x)));
    }
    cancel();
  };

  const remove = (id) => { setMenuId(null); setFinances((list) => list.filter((x) => x.id !== id)); };

  const addBtn = editing == null
    ? <button className="search-add-btn" onClick={startAdd} aria-label={t('finanzas.add')}>+</button>
    : undefined;

  return (
    <SubPage title={t('nav.finanzas')} onBack={rootOnBack} headerRight={addBtn}>
      <div className="finanzas">
        <div className="finanzas-total">
          <span className="finanzas-total-label">{t('finanzas.total')}</span>
          <span className="finanzas-total-value">{fmtEur(total)}</span>
        </div>

        {editing != null && (
          <div className="cards-panel finanzas-form">
            <input
              className="cards-field-input"
              value={draft.name}
              autoFocus
              placeholder={t('finanzas.namePlaceholder')}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              maxLength={40}
            />
            <div className="finanzas-amountrow">
              <input
                className="cards-field-input finanzas-amount-input"
                value={draft.amount}
                inputMode="decimal"
                placeholder={t('finanzas.amountPlaceholder')}
                onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                maxLength={16}
              />
              <span className="finanzas-cur">€</span>
            </div>
            <div className="cards-panel-actions">
              <button className="cards-secondary-btn" onClick={cancel}>{t('cards.cancel')}</button>
              <button className="cards-primary-btn" onClick={save} disabled={!canSave}>
                {editing === 'new' ? t('finanzas.add') : t('cards.save')}
              </button>
            </div>
          </div>
        )}

        <ul className="finanzas-list">
          {finances.map((f) => (
            <li key={f.id} className={`finanza-card${menuId === f.id ? ' menu-open' : ''}`}>
              <span className="finanza-name">{f.name}</span>
              <span className="finanza-amount">{fmtEur(f.amount)}</span>
              <div className="finanza-gear" ref={menuId === f.id ? menuRef : null}>
                <button
                  className="cards-gear-btn cards-gear-btn--sm"
                  onClick={() => setMenuId((c) => (c === f.id ? null : f.id))}
                  aria-label={f.name}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3"/>
                    <path d={GEAR_PATH}/>
                  </svg>
                </button>
                {menuId === f.id && (
                  <div className="cards-gear-menu cards-gear-menu--right">
                    <button className="cards-gear-item" onClick={() => startEdit(f)}>{t('cards.editCard')}</button>
                    <button className="cards-gear-item cards-gear-item--danger" onClick={() => remove(f.id)}>{t('habits.delete')}</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SubPage>
  );
}
