import { useState } from 'react';

function displayValue(item) {
  return typeof item === 'string' ? item : item.label ?? item.value ?? item.id;
}

export default function PinnedReferenceTray({ tray = [], openTool, removePin }) {
  const [open, setOpen] = useState(false);
  const items = tray.map((item, index) => typeof item === 'string'
    ? { id: `legacy-${index}-${item}`, label: item, sourceTool: '' }
    : item);

  return (
    <aside className={`pinned-reference-tray ${open ? 'open' : ''}`} aria-label="Pinned quick reference">
      <button type="button" className="pinned-reference-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>📌</span>
        <strong>Pinned</strong>
        <em>{items.length}</em>
      </button>
      {open && (
        <section className="pinned-reference-panel">
          <header>
            <div><p>Quick reference</p><h2>Pinned information</h2></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close pinned information">×</button>
          </header>
          <div className="pinned-reference-list">
            {items.map((item) => (
              <article key={item.id}>
                <button type="button" className="pinned-reference-open" onClick={() => item.sourceTool && openTool(item.sourceTool)} disabled={!item.sourceTool}>
                  <span>{item.sourceTool || 'Case reference'}</span>
                  <strong>{displayValue(item)}</strong>
                  <em>{item.sourceTool ? 'Open source ›' : 'Saved reference'}</em>
                </button>
                <button type="button" className="pinned-reference-remove" onClick={() => removePin(item.id)} aria-label={`Remove ${displayValue(item)} from pinned information`}>×</button>
              </article>
            ))}
            {!items.length && <p>No information pinned yet. Use Pin inside any investigation tool.</p>}
          </div>
        </section>
      )}
    </aside>
  );
}
