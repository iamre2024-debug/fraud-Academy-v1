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
    <section className="visual-categories">
      <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button type="button" onClick={() => onNavigate('academy')}>Tool Map ›</button></div>
      <div className="visual-category-row">
        {categories.map((item) => {
          const reviewedCount = item.tools.filter((toolName) => currentCompleted.includes(toolName)).length;
          const progressPercent = Math.round((reviewedCount / item.tools.length) * 100);
          const complete = reviewedCount === item.tools.length;
          const status = complete ? 'Complete' : reviewedCount > 0 ? 'In progress' : 'Open';
          return (
            <button key={item.key} type="button" className={`${categoryKey === item.key ? 'active' : ''} ${complete ? 'reviewed' : ''}`} onClick={() => { setCategoryKey(item.key); setTool(item.tools[0]); setExpandedId(''); }}>
              <span>{item.icon}</span><strong>{item.label}</strong><em>{reviewedCount}/{item.tools.length}</em><small className="category-status-copy">{status}</small><div className="category-progress-track"><b style={{ width: `${progressPercent}%` }} /></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
