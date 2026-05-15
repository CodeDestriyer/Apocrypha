export default function SubPage({ title, onBack, children }) {
  return (
    <div className="card sub-page">
      <header className="sub-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1 className="sub-title">{title}</h1>
        <span className="back-spacer" />
      </header>
      <div className="divider" />
      {children}
    </div>
  );
}
