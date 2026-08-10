import { useEffect, useMemo, useRef, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const GEAR_PATH = "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

// Rules ("Reglas") — a minimal store of Spanish grammar rules. Each rule is
// { id, title, body, created_at } and lives on profile.rules (Supabase-backed,
// same as decks). The whole surface reuses the cards-* styles for consistency.
export default function RulesSection({ rootOnBack, langTab }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));

  const addRule = (title, body) => {
    const ti = title.trim();
    const bo = body.trim();
    if (!ti && !bo) return;
    setRules((r) => [
      { id: newId(), title: ti, body: bo, created_at: new Date().toISOString() },
      ...r,
    ]);
  };
  const removeRule = (id) => setRules((r) => r.filter((x) => x.id !== id));
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');

  const closeAdd = () => { setAdding(false); setTitle(''); setBody(''); };
  const submit = () => {
    if (!title.trim() && !body.trim()) return;
    addRule(title, body);
    closeAdd();
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) =>
      (r.title ?? '').toLowerCase().includes(q) ||
      (r.body ?? '').toLowerCase().includes(q)
    );
  }, [query, rules]);

  return (
    <SubPage title={t('nav.idiomas')} onBack={rootOnBack}>
      {langTab}

      {rules.length > 0 && (
        <div className="cards-search open">
          <svg className="cards-search-glyph" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            className="cards-search-input"
            placeholder={t('reglas.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
          />
          {query && (
            <button className="cards-search-close" onClick={() => setQuery('')} aria-label={t('cards.close')}>×</button>
          )}
        </div>
      )}

      {adding ? (
        <div className="cards-panel">
          <label className="cards-field-label">{t('reglas.titleLabel')}</label>
          <input
            className="cards-field-input"
            value={title}
            autoFocus
            placeholder={t('reglas.titlePlaceholder')}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <label className="cards-field-label">{t('reglas.bodyLabel')}</label>
          <textarea
            className="cards-field-textarea"
            value={body}
            placeholder={t('reglas.bodyPlaceholder')}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
            rows={4}
          />
          <div className="cards-panel-actions">
            <button className="cards-secondary-btn" onClick={closeAdd}>{t('cards.cancel')}</button>
            <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
              {t('cards.save')}
            </button>
          </div>
        </div>
      ) : (
        <button className="cards-big-add cards-big-add--card" onClick={() => setAdding(true)}>
          <span className="cards-big-add-plus">+</span>
          <span>{t('reglas.new')}</span>
        </button>
      )}

      {rules.length === 0 && !adding && (
        <div className="empty-hint">{t('reglas.empty')}</div>
      )}

      <ul className="cards-list">
        {visible.length === 0 && query && (
          <li className="cards-search-empty">{t('cards.searchEmpty')}</li>
        )}
        {visible.map((r) => (
          <RuleRow
            key={r.id}
            rule={r}
            onRemove={() => removeRule(r.id)}
            onUpdate={(patch) => updateRule(r.id, patch)}
            t={t}
          />
        ))}
      </ul>
    </SubPage>
  );
}

function RuleRow({ rule, onRemove, onUpdate, t }) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [title, setTitle] = useState(rule.title ?? '');
  const [body, setBody] = useState(rule.body ?? '');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const startEdit = () => {
    setTitle(rule.title ?? ''); setBody(rule.body ?? '');
    setEditing(true);
  };
  const save = () => {
    if (!title.trim() && !body.trim()) return;
    onUpdate({ title: title.trim(), body: body.trim() });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="card-row card-row-editing">
        <input
          className="cards-field-input"
          value={title}
          autoFocus
          placeholder={t('reglas.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
        />
        <textarea
          className="cards-field-textarea"
          value={body}
          placeholder={t('reglas.bodyPlaceholder')}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={() => setEditing(false)}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={save} disabled={!title.trim() && !body.trim()}>{t('cards.save')}</button>
        </div>
      </li>
    );
  }

  return (
    <li className="card-row rule-row">
      {rule.title && <div className="card-row-front">{rule.title}</div>}
      {rule.body && <div className="card-row-back rule-row-body">{rule.body}</div>}
      <div className="cards-gear card-row-gear" ref={menuRef}>
        <button
          className="cards-gear-btn cards-gear-btn--sm"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t('cards.cardSettings')}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d={GEAR_PATH}/>
          </svg>
        </button>
        {menuOpen && (
          <div className="cards-gear-menu cards-gear-menu--right">
            <button className="cards-gear-item" onClick={() => { setMenuOpen(false); startEdit(); }}>
              {t('cards.editCard')}
            </button>
            <button className="cards-gear-item cards-gear-item--danger" onClick={() => { setMenuOpen(false); onRemove(); }}>
              {t('cards.deleteCard')}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
