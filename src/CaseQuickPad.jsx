import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  lastSavedAt,
  notes = [],
  onScratchChange,
  onRemove,
  onUse,
  onOpenSource,
  onSaveToNotes,
  canUseItem = () => false,
  canOpenItem = () => false,
  portalToBody = false,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('ids');
  const [copiedId, setCopiedId] = useState('');
  const [viewportInset, setViewportInset] = useState(0);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const scrollPositionRef = useRef({ target: null, top: 0 });

  useEffect(() => {
    setOpen(false);
    setTab('ids');
  }, [activeCase.id]);

  useEffect(() => {
    function suspendForCaseGenerator(event) {
      if (!event.detail?.open) return;
      setOpen(false);
      setViewportInset(0);
    }

    window.addEventListener('fraud-academy:case-generator-visibility', suspendForCaseGenerator);
    return () => {
      window.removeEventListener('fraud-academy:case-generator-visibility', suspendForCaseGenerator);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setViewportInset(0);
      return undefined;
    }
    const viewport = window.visualViewport;
    const updateViewport = () => {
      if (!viewport) {
        setViewportInset(0);
        return;
      }
      setViewportInset(Math.round(Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      )));
    };
    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
    };
  }, [open]);

  useEffect(() => {
    const body = document.body;
    if (!open || !panelRef.current) {
      body.style.removeProperty('--quick-pad-open-reserved-height');
      return undefined;
    }

    const panel = panelRef.current;
    const reservePanelSpace = () => {
      const panelHeight = Math.ceil(panel.getBoundingClientRect().height);
      body.style.setProperty(
        '--quick-pad-open-reserved-height',
        `${panelHeight + viewportInset + 19}px`,
      );
    };
    reservePanelSpace();
    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(reservePanelSpace)
      : null;
    observer?.observe(panel);
    window.addEventListener('resize', reservePanelSpace);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', reservePanelSpace);
      body.style.removeProperty('--quick-pad-open-reserved-height');
    };
  }, [open, viewportInset]);

  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      panelRef.current?.querySelector('button, input, textarea, select')?.focus({ preventScroll: true });
    });
    function closeOnEscape(event) {
      if (event.key === 'Escape') closePad();
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function copyItem(item) {
    await copyText(item.value);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(''), 1400);
  }

  function readScrollPosition() {
    const mobileViewport = document.querySelector(
      '.mission-mobile-root[data-mobile-mission-tab="workspace"] .mission-mobile-viewport',
    );
    if (mobileViewport && /(auto|scroll)/.test(window.getComputedStyle(mobileViewport).overflowY)) {
      return { target: mobileViewport, top: mobileViewport.scrollTop };
    }
    return { target: window, top: window.scrollY };
  }

  function restoreScrollPosition() {
    const { target, top } = scrollPositionRef.current;
    if (target === window || !target) {
      window.scrollTo({ top, left: 0, behavior: 'auto' });
      return;
    }
    if (target.isConnected) target.scrollTo({ top, left: 0, behavior: 'auto' });
  }

  function closePad() {
    setOpen(false);
    window.requestAnimationFrame(() => {
      restoreScrollPosition();
      triggerRef.current?.focus({ preventScroll: true });
    });
  }

  function togglePad() {
    if (open) {
      closePad();
      return;
    }
    scrollPositionRef.current = readScrollPosition();
    setOpen(true);
    window.requestAnimationFrame(restoreScrollPosition);
  }

  function savedConfirmation() {
    if (!lastSavedAt) return 'Auto-save ready';
    const saved = new Date(lastSavedAt);
    if (Number.isNaN(saved.getTime())) return 'Saved with this case';
    return `Last saved ${saved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  const content = (
    <aside
      className={`case-quick-pad${open ? ' is-open' : ''}`}
      aria-label="Case Quick Pad"
      style={{ '--quick-pad-keyboard-inset': `${viewportInset}px` }}
    >
      {open && (
        <section ref={panelRef} className="case-quick-pad-panel" role="dialog" aria-modal="false" aria-labelledby="case-quick-pad-title">
          <button type="button" className="case-quick-pad-handle" onClick={closePad} aria-label="Collapse Quick Pad"><span /></button>
          <header>
            <span className="case-quick-pad-charm" aria-hidden="true">✦</span>
            <div>
              <span>CASE QUICK PAD · {activeCase.id}</span>
              <h2 id="case-quick-pad-title">Keep lookup details close</h2>
              <small className="case-quick-pad-saved" role="status">✓ {savedConfirmation()}</small>
            </div>
            <button type="button" className="case-quick-pad-close" onClick={closePad} aria-label="Close Quick Pad">×</button>
          </header>
          <nav aria-label="Quick Pad sections">
            <button type="button" className={tab === 'ids' ? 'active' : ''} onClick={() => setTab('ids')}>Quick IDs <span>{items.length}</span></button>
            <button type="button" className={tab === 'note' ? 'active' : ''} onClick={() => setTab('note')}>Scratch note</button>
            <button type="button" className={tab === 'notebook' ? 'active' : ''} onClick={() => setTab('notebook')}>Notebook <span>{notes.length}</span></button>
          </nav>
          {tab === 'ids' ? (
            <section className="case-quick-pad-identifiers" aria-label="Saved Quick Pad identifiers">
              <header><span>Saved identifiers</span><small>Copied facts only · not pinned evidence</small></header>
              <div className="case-quick-pad-list">
                {items.length ? items.map((item) => {
                  const usableHere = canUseItem(item);
                  const sourceAvailable = canOpenItem(item);
                  return (
                    <article key={item.id}>
                      <div><span>{item.label}</span><strong>{item.value}</strong><small>Source · {item.sourceTool}</small></div>
                      <div className="case-quick-pad-actions">
                        <button type="button" onClick={() => copyItem(item)}>{copiedId === item.id ? 'Copied' : 'Copy'}</button>
                        {usableHere && <button type="button" onClick={() => { onUse(item); closePad(); }}>Use here</button>}
                        {sourceAvailable && <button type="button" onClick={() => { onOpenSource(item); closePad(); }}>Open source</button>}
                        <button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.label} ${item.value} from Quick Pad`}>Remove</button>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="case-quick-pad-empty">No identifiers saved for this case. Use a “Quick Pad” action beside a factual record to keep it close.</p>
                )}
              </div>
            </section>
          ) : tab === 'note' ? (
            <div className="case-quick-pad-note">
              <header><span>Case-specific scratch notes</span><small>Auto-saves to {activeCase.id}</small></header>
              <textarea
                value={scratch}
                onChange={(event) => onScratchChange(event.target.value)}
                placeholder="Temporary reminder for this case…"
                aria-label="Case Quick Pad scratch note"
                rows="4"
              />
              <div><span>✓ {savedConfirmation()}</span><button type="button" disabled={!scratch.trim()} onClick={onSaveToNotes}>Add to case notes</button></div>
            </div>
          ) : (
            <section className="case-quick-pad-notebook" aria-label="Current case notebook">
              <header><span>Case notebook</span><small>Separate from scratch notes and pinned evidence</small></header>
              <div>
                {notes.length
                  ? notes.map((note, index) => <article key={`${note}-${index}`}><span>{activeCase.id}</span><p>{note}</p></article>)
                  : <p className="case-quick-pad-empty">No formal case notes saved yet.</p>}
              </div>
            </section>
          )}
        </section>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="case-quick-pad-trigger"
        onClick={togglePad}
        aria-expanded={open}
        aria-label={`${open ? 'Close' : 'Open'} Quick Pad, ${items.length} saved ${items.length === 1 ? 'item' : 'items'}`}
      >
        <span className="case-quick-pad-trigger-icon" aria-hidden="true">📌</span>
        <span className="case-quick-pad-trigger-label">Quick Pad</span>
        <strong>{items.length}</strong>
        <i aria-hidden="true">✦</i>
      </button>
    </aside>
  );

  if (portalToBody && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
