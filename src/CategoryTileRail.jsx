export default function CategoryTileRail({
  activeCase,
  categories,
  categoryKey,
  currentCompleted,
  onNavigate,
  onInvestigate,
  setCategoryKey,
  setTool,
  setExpandedId,
}) {
  const categoryByKey = Object.fromEntries(categories.map((item) => [item.key, item]));
  const identityCategory = categoryByKey.identity ?? categories[0];
  const digitalCategory = categoryByKey.digital ?? categories[1] ?? categories[0];
  const contextCategory = categoryByKey.merchant ?? categoryByKey.business ?? categoryByKey.financial ?? categories.at(-1);
  const centerCategory = categoryByKey.financial ?? categoryByKey.merchant ?? categoryByKey.business ?? categories[0];

  function openCategory(category, preferredTool) {
    if (!category) return;
    onInvestigate?.();
    setCategoryKey(category.key);
    setTool(category.tools.includes(preferredTool) ? preferredTool : category.tools[0]);
    setExpandedId('');
  }

  return (
    <section className="visual-categories">
      <div className="investigation-tool-groups-theme-v1" data-investigation-tool-groups="approved-theme-v1">
        <header className="visual-section-heading investigation-tool-groups-heading">
          <div>
            <p>Contextual investigation tools</p>
            <h2>Choose the next evidence question</h2>
            <small>Open one focused group at a time. Timeline stays in the active-case workflow.</small>
          </div>
          <button type="button" onClick={() => onNavigate('academy')}>Open Tool Map</button>
        </header>
        <section className="mission-evidence-map" aria-label="Mission evidence map">
          <div className="mission-map-stars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <button type="button" className="mission-map-node node-customer" onClick={() => openCategory(identityCategory, 'Customer 360')}>
            <span aria-hidden="true">👤</span><strong>Customer</strong><small>{activeCase?.person ?? 'Case party'}</small>
          </button>
          <button type="button" className="mission-map-node node-device" onClick={() => openCategory(digitalCategory, 'Device Intelligence')}>
            <span aria-hidden="true">📱</span><strong>Device</strong><small>{digitalCategory?.label ?? 'Digital activity'}</small>
          </button>
          <button type="button" className="mission-map-node node-context" onClick={() => openCategory(contextCategory, 'Merchant Intelligence')}>
            <span aria-hidden="true">🏪</span><strong>{contextCategory?.key === 'business' ? 'Business' : 'Merchant'}</strong><small>{activeCase?.merchant?.name ?? contextCategory?.label ?? 'Case context'}</small>
          </button>
          <button type="button" className="mission-map-node node-transaction" onClick={() => openCategory(centerCategory, 'Financial Investigation')}>
            <span aria-hidden="true">📄</span><strong>Case transaction</strong><small>{activeCase?.amount ?? activeCase?.id}</small>
          </button>
          <button type="button" className="mission-map-pin" onClick={() => openCategory(identityCategory, 'Customer 360')}>Pin evidence ⭐</button>
        </section>
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
                  <small>{item.question}</small>
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
