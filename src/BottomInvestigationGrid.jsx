import { useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

export default function BottomInvestigationGrid({
  tray,
  removePin,
  onOpenPinned,
  noteDraft,
  setNoteDraft,
  submitNote,
  notes,
  mobileView = 'evidence',
  onMobileViewChange,
}) {
  const [expandedNotes, setExpandedNotes] = useState({});
  const toggleNote = (noteKey) => setExpandedNotes((current) => ({ ...current, [noteKey]: !current[noteKey] }));

  return (
    <section className="bottom-investigation-grid">
      <nav className="mobile-indicator-page-tabs" aria-label="Evidence and notes pages">
        <button type="button" className={mobileView === 'evidence' ? 'active' : ''} aria-current={mobileView === 'evidence' ? 'page' : undefined} onClick={() => onMobileViewChange?.('evidence')}>Pinned Evidence</button>
        <button type="button" className={mobileView === 'notes' ? 'active' : ''} aria-current={mobileView === 'notes' ? 'page' : undefined} onClick={() => onMobileViewChange?.('notes')}>Notes</button>
      </nav>
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span className="indicator-card-badge" aria-hidden="true">PIN</span></div>
        <div className="tray-list">
          {tray.map((item) => (
            <div key={item} className="tray-record-row">
              <span className="tray-record-badge" aria-hidden="true">ID</span>
              <button type="button" className="tray-open-record" onClick={() => onOpenPinned?.(item)} aria-label={`Open pinned evidence ${item}`}>
                <strong>{item}</strong>
                <small>Open source record</small>
              </button>
              <button type="button" className="tray-remove-record" onClick={() => removePin?.(item)} aria-label={`Remove ${item} from pinned evidence`}>Remove</button>
            </div>
          ))}
          {!tray.length && <p className="tray-empty-state">No evidence is pinned for this case.</p>}
        </div>
      </div>
      <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span className="indicator-card-badge" aria-hidden="true">NOTE</span></div><form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form><div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => { const noteKey = `${item}-${index}`; const expanded = Boolean(expandedNotes[noteKey]); return <button type="button" key={noteKey} aria-expanded={expanded} aria-label={expanded ? 'Collapse notebook note' : 'Expand notebook note'} onClick={() => toggleNote(noteKey)}><span>✎</span><DirectCollapsibleText expanded={expanded} showButton={false}>{item}</DirectCollapsibleText><em>{expanded ? 'Less' : '›'}</em></button>; })}</div></div>
    </section>
  );
}
