export default function SubPage({ title, onBack, headerRight, className, children }) {
  return (
    <div className={`card sub-page${className ? ` ${className}` : ''}`}>
      <header className="sub-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h1 className="sub-title">{title}</h1>
        {headerRight ?? <span className="back-spacer" />}
      </header>
      {children}
    </div>
  );
}
