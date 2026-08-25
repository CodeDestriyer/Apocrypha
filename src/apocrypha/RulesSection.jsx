import { useMemo, useState } from 'react';
import { useProfile } from '../ProfileContext.jsx';
import { useLang } from '../i18n.jsx';
import SubPage from './SubPage.jsx';
import RuleEditor from './RuleEditor.jsx';

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);

const UNGROUPED = '__ungrouped__';

// Rule bodies store inline formatting as markers: **bold**, [[boxed]] and
// ==highlight==. Render each as its own span (newlines are kept by the
// container's white-space: pre-wrap).
function renderRich(text) {
  const str = String(text ?? '');
  const re = /\*\*([\s\S]+?)\*\*|\[\[([\s\S]+?)\]\]|==([\s\S]+?)==/g;
  const out = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) out.push(str.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={key++}>{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<span key={key++} className="rule-box">{m[2]}</span>);
    else out.push(<mark key={key++} className="rule-mark">{m[3]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push(str.slice(last));
  return out;
}

// A pipe table: first row is the header. Cells keep inline markers.
function RuleTable({ rows }) {
  const parse = (line) => {
    let cells = line.split('|').map((c) => c.trim());
    if (cells.length && cells[0] === '') cells = cells.slice(1);
    if (cells.length && cells[cells.length - 1] === '') cells = cells.slice(0, -1);
    return cells;
  };
  const grid = rows.map(parse);
  const [head, ...body] = grid;
  return (
    <table className="rule-table">
      <thead><tr>{head.map((c, i) => <th key={i}>{renderRich(c)}</th>)}</tr></thead>
      {body.length > 0 && (
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>{row.map((c, ci) => <td key={ci}>{renderRich(c)}</td>)}</tr>
          ))}
        </tbody>
      )}
    </table>
  );
}

// Block-level rendering of a rule body: pipe tables, `---` dividers, and
// paragraphs of inline-formatted text (line breaks preserved).
function renderRuleBody(text) {
  const lines = String(text ?? '').split('\n');
  const blocks = [];
  let para = [], table = [], key = 0;
  const flushPara = () => {
    if (!para.length) return;
    const buf = para; para = [];
    blocks.push(
      <div key={`p${key++}`} className="rule-para">
        {buf.map((ln, i) => <span key={i}>{i > 0 && <br />}{renderRich(ln)}</span>)}
      </div>
    );
  };
  const flushTable = () => {
    if (!table.length) return;
    const buf = table; table = [];
    blocks.push(<RuleTable key={`t${key++}`} rows={buf} />);
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line === '[[[cols') {
      // Whole-line blocks laid out side by side (columns split by |||).
      flushPara(); flushTable();
      i++;
      const cols = []; let col = [];
      while (i < lines.length && lines[i] !== ']]]') {
        if (lines[i] === '|||') { cols.push(col); col = []; } else col.push(lines[i]);
        i++;
      }
      cols.push(col);
      i++; // skip ]]]
      blocks.push(
        <div key={`c${key++}`} className="rule-cols">
          {cols.map((c, ci) => (
            <div key={ci} className="rule-col">
              {c.map((ln, ii) => <span key={ii}>{ii > 0 && <br />}{renderRich(ln)}</span>)}
            </div>
          ))}
        </div>
      );
      continue;
    }
    if (line === '[[[') {
      // A big frame around whole lines (a "main rule" callout).
      flushPara(); flushTable();
      i++;
      const inner = [];
      while (i < lines.length && lines[i] !== ']]]') { inner.push(lines[i]); i++; }
      i++; // skip ]]]
      blocks.push(
        <div key={`b${key++}`} className="rule-block-box">
          {inner.map((ln, ii) => <span key={ii}>{ii > 0 && <br />}{renderRich(ln)}</span>)}
        </div>
      );
      continue;
    }
    if (/^\s*-{3,}\s*$/.test(line)) { flushPara(); flushTable(); blocks.push(<hr key={`h${key++}`} className="rule-hr" />); }
    else if (line.includes('|')) { flushPara(); table.push(line); }
    else { flushTable(); para.push(line); }
    i++;
  }
  flushPara(); flushTable();
  return blocks;
}

// A clickable rule card: title + short body preview. Clicking opens the rule
// in its own isolated full-page view (no expand-in-place).
function RuleCard({ rule, onOpen, t }) {
  return (
    <button className="rule-card" onClick={() => onOpen(rule)}>
      <span className="rule-card-title">{rule.title || t('reglas.noBody')}</span>
      {rule.body && <span className="rule-card-preview">{renderRuleBody(rule.body)}</span>}
    </button>
  );
}

// Rules ("Reglas") — a store of Spanish grammar rules, shown as a full-width
// list of clickable cards. Tapping a card opens that rule in its own isolated
// full-page view (body at full width, edit/delete there); adding/editing drops
// into a focused editor page. Rules carry an optional `group` label; when any
// rule has one the list splits into labelled sections (a scaffold for fuller
// group management later).
// Each rule is { id, title, body, group?, created_at } on profile.rules.
export default function RulesSection({ rootOnBack }) {
  const { profile, update } = useProfile();
  const { t } = useLang();
  const rules = profile.rules ?? [];

  const setRules = (updater) =>
    update((curr) => ({ rules: updater(curr.rules ?? []) }));
  const addRule = (title, body, group) =>
    setRules((r) => [
      { id: newId(), title, body, group: group || null, created_at: new Date().toISOString() },
      ...r,
    ]);
  const removeRule = (id) => setRules((r) => r.filter((x) => x.id !== id));
  const updateRule = (id, patch) =>
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const [open, setOpen] = useState(null);          // null (list) | 'new' | ruleId (editing)
  const [reading, setReading] = useState(null);    // null | ruleId (isolated full-page read)
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [group, setGroup] = useState('');
  const [query, setQuery] = useState('');

  const currentRule = (open && open !== 'new') ? (rules.find((r) => r.id === open) ?? null) : null;
  const readingRule = reading ? (rules.find((r) => r.id === reading) ?? null) : null;
  const isEditing = open === 'new' || !!currentRule;

  const openNew = () => { setReading(null); setTitle(''); setBody(''); setGroup(''); setOpen('new'); };
  const openFull = (r) => setReading(r.id);
  const editRule = (r) => { setReading(null); setTitle(r.title ?? ''); setBody(r.body ?? ''); setGroup(r.group ?? ''); setOpen(r.id); };
  const backToList = () => { setOpen(null); setReading(null); };

  const saveNew = () => {
    const ti = title.trim(); const bo = body.trim(); const gr = group.trim();
    if (!ti && !bo) { backToList(); return; }
    addRule(ti, bo, gr);
    backToList();
  };
  const saveEdit = () => {
    const ti = title.trim(); const bo = body.trim(); const gr = group.trim();
    if (!ti && !bo) return;
    updateRule(currentRule.id, { title: ti, body: bo, group: gr || null });
    backToList();
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) =>
      (r.title ?? '').toLowerCase().includes(q) ||
      (r.body ?? '').toLowerCase().includes(q) ||
      (r.group ?? '').toLowerCase().includes(q)
    );
  }, [query, rules]);

  // Known group names (for the editor's datalist), in first-seen order.
  const groupNames = useMemo(() => {
    const seen = [];
    for (const r of rules) {
      const g = (r.group ?? '').trim();
      if (g && !seen.includes(g)) seen.push(g);
    }
    return seen;
  }, [rules]);

  // Split the visible rules into ordered sections; the ungrouped bucket sinks
  // to the bottom. When no rule has a group the list renders flat (no headers).
  const sections = useMemo(() => {
    const order = [];
    const map = new Map();
    for (const r of visible) {
      const key = (r.group ?? '').trim() || UNGROUPED;
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key).push(r);
    }
    order.sort((a, b) => (a === UNGROUPED ? 1 : 0) - (b === UNGROUPED ? 1 : 0));
    return order.map((key) => ({
      key,
      label: key === UNGROUPED ? t('reglas.ungrouped') : key,
      rules: map.get(key),
    }));
  }, [visible, t]);
  const hasGroups = sections.some((s) => s.key !== UNGROUPED);

  // ── Header (title / back) ────────────────────────────────────
  let pageTitle, onBack;
  if (open === 'new') {
    pageTitle = t('reglas.new');
    onBack = backToList;
  } else if (currentRule) {
    pageTitle = <span className="sub-title-deck">{currentRule.title || t('reglas.title')}</span>;
    onBack = backToList;
  } else if (readingRule) {
    pageTitle = <span className="sub-title-deck">{readingRule.title || t('reglas.title')}</span>;
    onBack = backToList;
  } else {
    pageTitle = t('reglas.title');
    onBack = rootOnBack;
  }

  // ── Body ─────────────────────────────────────────────────────
  let content;
  if (isEditing) {
    const submit = open === 'new' ? saveNew : saveEdit;
    content = (
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
        <label className="cards-field-label">{t('reglas.groupLabel')}</label>
        <input
          className="cards-field-input"
          value={group}
          list="reglas-groups"
          placeholder={t('reglas.groupPlaceholder')}
          onChange={(e) => setGroup(e.target.value)}
          maxLength={60}
        />
        <datalist id="reglas-groups">
          {groupNames.map((g) => <option key={g} value={g} />)}
        </datalist>
        <label className="cards-field-label">{t('reglas.bodyLabel')}</label>
        <RuleEditor
          editKey={open === 'new' ? 'new' : currentRule.id}
          initialValue={body}
          onChange={setBody}
          onSubmit={submit}
          placeholder={t('reglas.bodyPlaceholder')}
        />
        <div className="cards-panel-actions">
          <button className="cards-secondary-btn" onClick={backToList}>{t('cards.cancel')}</button>
          <button className="cards-primary-btn" onClick={submit} disabled={!title.trim() && !body.trim()}>
            {t('cards.save')}
          </button>
        </div>
      </div>
    );
  } else if (readingRule) {
    content = (
      <div className="rule-read">
        {readingRule.body
          ? <div className="rule-read-body">{renderRuleBody(readingRule.body)}</div>
          : <div className="empty-hint">{t('reglas.noBody')}</div>}
        <div className="rule-acc-actions">
          <button className="rule-acc-action" onClick={() => editRule(readingRule)}>{t('cards.editCard')}</button>
          <button className="rule-acc-action rule-acc-action--danger" onClick={() => { removeRule(readingRule.id); backToList(); }}>{t('cards.deleteCard')}</button>
        </div>
      </div>
    );
  } else {
    const renderRow = (r) => (
      <RuleCard key={r.id} rule={r} onOpen={openFull} t={t} />
    );
    content = (
      <>
        <div className="search-add-row">
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
          <button className="search-add-btn" onClick={openNew} aria-label={t('reglas.new')}>+</button>
        </div>

        {rules.length === 0 ? (
          <div className="empty-hint">{t('reglas.empty')}</div>
        ) : visible.length === 0 && query ? (
          <div className="cards-search-empty">{t('cards.searchEmpty')}</div>
        ) : hasGroups ? (
          <div className="rules-list">
            {sections.map((s) => (
              <section key={s.key} className="rule-group">
                <div className="rule-group-head">
                  <span className="rule-group-name">{s.label}</span>
                  <span className="rule-group-count">{s.rules.length}</span>
                </div>
                {s.rules.map(renderRow)}
              </section>
            ))}
          </div>
        ) : (
          <div className="rules-list">
            {visible.map(renderRow)}
          </div>
        )}
      </>
    );
  }

  return (
    <SubPage title={pageTitle} onBack={onBack}>
      {content}
    </SubPage>
  );
}
