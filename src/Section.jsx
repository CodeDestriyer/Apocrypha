import { useState } from 'react';

export default function Section({ title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <button className="dash-toggle" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        {summary !== undefined && <span className="dash-summary">{summary}</span>}
        <span className={`chevron ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}
