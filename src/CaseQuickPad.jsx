import { useEffect, useRef, useState } from 'react';

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Preview browsers can deny clipboard permission; use the selection fallback.
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  document.execCommand('copy');
  field.remove();
}

export default function CaseQuickPad({
  activeCase,
  items,
  scratch,
  onScratchChange,
  onRemove,
  onUse,
  onOpenSource,
  onSaveToNotes,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('ids');
  const [copiedId, setCopiedId] = useState('');
  const triggerRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setTab('ids');
  }, [activeCase.id]);

  async function copyItem(item) {
    await copyText(item.value);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(''), 1400);
  }

  function closePad() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <aside className={`case-quick-pad${open ? ' is-open' : ''}`} aria-label="Case Quick Pad">
      {open && (
        <section className="case-quick-pad-panel" role="dialog" aria-modal="false" aria-labelledby="case-quick-pad-title">
          <header>
            <div>
              <span>CASE QUICK PAD · {activeCase.id}</span>
              <h2 id="case-quick-pad-title">Keep lookup details close</h2>
            </div>
            <button type="button" className="case-quick-pad-close" onClick={closePad} aria-label="Close Quick Pad">×</button>
          </header>
          <nav aria-label="Quick Pad sections">
            <button type="button" className={tab === 'ids' ? 'active' : ''} onClick={() => setTab('ids')}>Quick IDs <span>{items.length}</span></button>
            <button type="button" className={tab === 'note' ? 'active' : ''} onClick={() => setTab('note')}>Scratch note</button>
          </nav>
          {tab === 'ids' ? (
            <div className="case-quick-pad-list">
              {items.length ? items.map((item) => (
                <article key={item.id}>
                  <div><span>{item.label}</span><strong>{item.value}</strong><small>{item.sourceTool}</small></div>
                  <div className="case-quick-pad-actions">
                    <button type="button" onClick={() => copyItem(item)}>{copiedId === item.id ? 'Copied' : 'Copy'}</button>
                    <button type="button" onClick={() => { onUse(item); closePad(); }}>Use here</button>
                    <button type="button" onClick={() => { onOpenSource(item); closePad(); }}>Source</button>
                    <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.label} ${item.value}`}>×</button>
                  </div>
                </article>
              )) : (
                <p className="case-quick-pad-empty">No lookup details saved yet. Use “Quick Pad” beside an account, bank, destination, or device ID.</p>
              )}
            </div>
          ) : (
            <div className="case-quick-pad-note">
              <textarea
                value={scratch}
                onChange={(event) => onScratchChange(event.target.value)}
                placeholder="Temporary reminder for this case…"
                aria-label="Case Quick Pad scratch note"
                rows="3"
              />
              <div><span>Saved with this case</span><button type="button" disabled={!scratch.trim()} onClick={onSaveToNotes}>Add to case notes</button></div>
            </div>
          )}
        </section>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="case-quick-pad-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`${open ? 'Close' : 'Open'} Quick Pad, ${items.length} saved ${items.length === 1 ? 'item' : 'items'}`}
      >
        <span aria-hidden="true">▤</span> Quick Pad <strong>{items.length}</strong>
      </button>
    </aside>
  );
}
