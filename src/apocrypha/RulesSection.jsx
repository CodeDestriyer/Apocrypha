import { useMemo, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

// Rules ("Reglas") — a minimal store of Spanish grammar rules, shown as a
// Notion/Keep-style grid of square note tiles (max 3 per row). Each rule is
// { id, title, body, created_at } and lives on profile.rules (Supabase-backed,
// same as decks). Tapping a note opens the editor; the add tile opens a blank
// one. `editing` is null (closed), 'new', or a rule id.
export default function RulesSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));

  const addRule = (title, body) =>
    setRules((r) => [
      { id: newId(), title, body, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeRule = (id) => setRules((r) => r.filter((x) => x.id !== id));
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [query, setQuery] = useState('');

  const openNew = () => { setTitle(''); setBody(''); setEditing('new'); };
  const openEdit = (rule) => {
    setTitle(rule.title ?? ''); setBody(rule.body ?? ''); setEditing(rule.id);
  };
  const close = () => { setEditing(null); setTitle(''); setBody(''); };
  const save = () => {
    const ti = title.trim(); const bo = body.trim();
    if (!ti && !bo) { close(); return; }
    if (editing === 'new') addRule(ti, bo);
    else updateRule(editing, { title: ti, body: bo });
    close();
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
    <SubPage title={t('reglas.title')} onBack={rootOnBack}>

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

      {editing !== null && (
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
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); }}
            rows={5}
          />
          <div className="cards-panel-actions">
            <button className="cards-secondary-btn" onClick={close}>{t('cards.cancel')}</button>
            <button className="cards-primary-btn" onClick={save} disabled={!title.trim() && !body.trim()}>
              {t('cards.save')}
            </button>
          </div>
        </div>
      )}

      {rules.length === 0 && editing === null && (
        <div className="empty-hint">{t('reglas.empty')}</div>
      )}

      {visible.length === 0 && query ? (
        <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
      ) : (
        <div className="rules-grid">
          {!query && (
            <button className="rule-note rule-note--add" onClick={openNew}>
              <span className="rule-note-add-plus">+</span>
              <span className="rule-note-add-label">{t('reglas.new')}</span>
            </button>
          )}
          {visible.map((r) => (
            <div
              key={r.id}
              className={`rule-note ${editing === r.id ? 'rule-note--active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => openEdit(r)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(r); } }}
            >
              <button
                className="rule-note-del"
                onClick={(e) => { e.stopPropagation(); removeRule(r.id); if (editing === r.id) close(); }}
                aria-label={t('cards.deleteCard')}
              >×</button>
              {r.title && <div className="rule-note-title">{r.title}</div>}
              {r.body && <div className="rule-note-body">{r.body}</div>}
            </div>
          ))}
        </div>
      )}
    </SubPage>
  );
}
