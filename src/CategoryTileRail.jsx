export default function CategoryTileRail({
  categories,
  categoryKey,
  currentCompleted,
  onNavigate,
  setCategoryKey,
  setTool,
  setExpandedId,
}) {
  return (
    <section className="visual-categories" aria-labelledby="investigation-categories-title">
      <div className="visual-section-heading">
        <div>
          <span className="tool-context-label">Investigation map</span>
          <h2 id="investigation-categories-title">Investigation Categories</h2>
        </div>
        <button type="button" onClick={() => onNavigate('academy')}>Open Tool Map</button>
      </div>
      <div className="visual-category-row" role="list">
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
              role="listitem"
              className={`${active ? 'active' : ''} ${complete ? 'reviewed' : ''}`}
              aria-pressed={active}
              aria-label={`${item.label}, ${reviewedCount} of ${item.tools.length} tools reviewed, ${status}`}
              onClick={() => {
                setCategoryKey(item.key);
                setTool(item.tools[0]);
                setExpandedId('');
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.label}</strong>
              <em>{reviewedCount}/{item.tools.length}</em>
              <small className="category-status-copy">{status}</small>
              <div className="category-progress-track" aria-hidden="true"><b style={{ width: `${progressPercent}%` }} /></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
