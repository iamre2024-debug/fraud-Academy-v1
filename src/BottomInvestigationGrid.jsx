import { useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

export default function BottomInvestigationGrid({
  tray,
  pin,
  openTool,
  noteDraft,
  setNoteDraft,
  submitNote,
  reportPackets,
  notes,
}) {
  const [expandedNotes, setExpandedNotes] = useState({});
  const toggleNote = (noteKey) => setExpandedNotes((current) => ({ ...current, [noteKey]: !current[noteKey] }));

  return (
    <section className="bottom-investigation-grid" aria-label="Evidence and investigation notes">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><span className="tool-context-label">Evidence Center</span><h2>Investigation Tray</h2><p>Pinned evidence and key identifiers for the active case.</p></div><span>✦</span></div>
        <div className="tray-summary-row"><strong>{tray.length}</strong><span>Pinned object{tray.length === 1 ? '' : 's'}</span></div>
        <div className="tray-list">{tray.map((item) => <div key={item}><span>▯</span><strong>Pinned</strong><DirectCollapsibleText as="em">{item}</DirectCollapsibleText><button type="button" aria-label={`Unpin ${item}`} onClick={() => pin(item)}>📌</button></div>)}</div>
        {!tray.length && <p className="tray-empty-state">Pin records from investigation tools to build the review package.</p>}
        <button type="button" className="add-evidence" onClick={() => openTool('Evidence Center')}>Open Evidence Center ›</button>
      </div>
      <div className="ornate-card notebook-card">
        <div className="card-title-row"><div><span className="tool-context-label">Case documentation</span><h2>Investigation Notebook</h2><p>Notes and report packets remain scoped to this case.</p></div><span>☾</span></div>
        <form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form>
        <details className="case-report-packet-panel" open={reportPackets.length > 0}><summary>Case Report packets · {reportPackets.length} saved</summary><div>{reportPackets.slice(0, 8).map((item) => <DirectCollapsibleText key={item.id}><strong>{item.section}</strong> · {item.recordId} · {item.title}</DirectCollapsibleText>)}{!reportPackets.length && <DirectCollapsibleText>No structured packets saved yet. Use an expanded record to save one.</DirectCollapsibleText>}</div></details>
        <div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => { const noteKey = `${item}-${index}`; const expanded = Boolean(expandedNotes[noteKey]); return <button type="button" key={noteKey} aria-expanded={expanded} aria-label={expanded ? 'Collapse notebook note' : 'Expand notebook note'} onClick={() => toggleNote(noteKey)}><span>✎</span><DirectCollapsibleText expanded={expanded} showButton={false}>{item}</DirectCollapsibleText><em>{expanded ? 'Less' : '›'}</em></button>; })}</div>
      </div>
    </section>
  );
}
