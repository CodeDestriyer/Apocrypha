import { useState } from 'react';

// Hashtags (e.g. #trabajo, #psicología), shared by Idiomas cards and
// Conocimiento notes. Stored as a deduped list of normalized strings WITHOUT
// the leading '#'; the '#' is only added for display. `parseTags` accepts free
// text — commas, spaces, newlines and stray '#' are all treated as separators —
// so the same helper powers the chip input and any pasted "trabajo, psicología"
// blob.
export const normTag = (s) =>
  String(s).replace(/^#+/, '').trim().toLowerCase().slice(0, 24);
export const parseTags = (raw) =>
  String(raw).split(/[\s,]+/).map(normTag).filter(Boolean);
export const mergeTags = (existing, incoming) => {
  const out = [...existing];
  for (const tg of incoming) if (tg && !out.includes(tg)) out.push(tg);
  return out;
};

// Chip-style hashtag editor. Typing text and hitting Enter / comma / space
// commits it as a chip; Backspace on an empty field removes the last chip.
// `suggestions` are the tags already used elsewhere — shown as one-tap chips so
// the same hashtag gets reused rather than re-typed.
export default function TagInput({ tags, onChange, suggestions = [], placeholder, t }) {
  const [text, setText] = useState('');
  const commit = (raw) => {
    const parsed = parseTags(raw);
    if (parsed.length) onChange(mergeTags(tags, parsed));
    setText('');
  };
  const removeAt = (i) => onChange(tags.filter((_, idx) => idx !== i));
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || (e.key === ' ' && text.trim())) {
      e.preventDefault();
      commit(text);
    } else if (e.key === 'Backspace' && !text && tags.length) {
      removeAt(tags.length - 1);
    }
  };
  const avail = suggestions.filter((s) => !tags.includes(s));
  return (
    <div className="cards-tags-field">
      <div className="cards-tags-box">
        {tags.map((tg, i) => (
          <span key={tg} className="cards-tag-chip">
            #{tg}
            <button
              type="button"
              className="cards-tag-chip-x"
              onClick={() => removeAt(i)}
              aria-label={t('cards.removeTag')}
            >×</button>
          </span>
        ))}
        <input
          className="cards-tags-input"
          value={text}
          placeholder={tags.length ? '' : (placeholder ?? t('cards.tagsPlaceholder'))}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => { if (text.trim()) commit(text); }}
        />
      </div>
      {avail.length > 0 && (
        <div className="cards-tags-suggest">
          {avail.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              className="cards-tag-suggest"
              onClick={() => commit(s)}
            >#{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
