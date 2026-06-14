export default function SubPage({ title, onBack, headerRight, children }) {
  return (
    <div className="card sub-page">
      <header className="sub-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1 className="sub-title">{title}</h1>
        {headerRight ?? <span className="back-spacer" />}
      </header>
      <div className="divider" />
      {children}
    </div>
  );
}
