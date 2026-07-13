export default function CategoryTileRail({
  categories,
  categoryKey,
  currentCompleted,
  onNavigate,
  onInvestigate,
  setCategoryKey,
  setTool,
  setExpandedId,
}) {
  return (
    <section className="visual-categories">
      <div className="investigation-tool-groups-theme-v1" data-investigation-tool-groups="approved-theme-v1">
        <header className="visual-section-heading investigation-tool-groups-heading">
          <div>
            <p>Investigation tools</p>
            <h2>Choose a tool group</h2>
            <small>Open one group at a time. Each tool opens on its own page on mobile.</small>
          </div>
          <button type="button" onClick={() => onNavigate('academy')}>Tool Guide</button>
        </header>
        <div className="visual-category-row">
          {categories.map((item) => {
            const reviewedCount = item.tools.filter((toolName) => currentCompleted.includes(toolName)).length;
            const progressPercent = Math.round((reviewedCount / item.tools.length) * 100);
            const complete = reviewedCount === item.tools.length;
            const status = complete ? 'Complete' : reviewedCount > 0 ? 'In progress' : 'Open';
            const active = categoryKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`${active ? 'active' : ''} ${complete ? 'reviewed' : ''}`}
                aria-pressed={active}
                onClick={() => {
                  onInvestigate?.();
                  setCategoryKey(item.key);
                  setTool(item.tools[0]);
                  setExpandedId('');
                }}
              >
                <span>{item.icon}</span>
                <span className="investigation-category-copy">
                  <strong>{item.label}</strong>
                  <small>{item.tools.length} tools</small>
                </span>
                <em>{reviewedCount}/{item.tools.length}</em>
                <small className="category-status-copy">{status}</small>
                <div className="category-progress-track"><b style={{ width: `${progressPercent}%` }} /></div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
