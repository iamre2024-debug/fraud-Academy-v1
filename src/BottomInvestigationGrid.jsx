import { useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

function pinLabel(item) {
  return typeof item === 'string' ? item : item.label ?? item.value ?? item.id;
}

export default function BottomInvestigationGrid({
  tray,
  removePin,
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
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div>
        <div className="tray-list">
          {tray.map((item, index) => {
            const pin = typeof item === 'string' ? { id: `legacy-${index}-${item}`, label: item, sourceTool: '' } : item;
            return (
              <div key={pin.id}>
                <span>📌</span>
                <strong>{pin.sourceTool || 'Pinned'}</strong>
                <DirectCollapsibleText as="em">{pinLabel(pin)}</DirectCollapsibleText>
                <div>
                  {pin.sourceTool && <button type="button" onClick={() => openTool(pin.sourceTool)}>Open</button>}
                  <button type="button" onClick={() => removePin(pin.id)} aria-label={`Remove ${pinLabel(pin)} from pinned information`}>×</button>
                </div>
              </div>
            );
          })}
          {!tray.length && <p>No information pinned yet.</p>}
        </div>
        <button type="button" className="add-evidence" onClick={() => openTool('Evidence Center')}>✦ Open Evidence Center ›</button>
      </div>
      <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div><form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form><details className="case-report-packet-panel" open={reportPackets.length > 0}><summary>Evidence packets · {reportPackets.length} saved</summary><div>{reportPackets.slice(0, 8).map((item) => <DirectCollapsibleText key={item.id}><strong>{item.section}</strong> · {item.recordId} · {item.title}</DirectCollapsibleText>)}{!reportPackets.length && <DirectCollapsibleText>No evidence packets saved yet. Use an expanded record to save one.</DirectCollapsibleText>}</div></details><div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => { const noteKey = `${item}-${index}`; const expanded = Boolean(expandedNotes[noteKey]); return <button type="button" key={noteKey} aria-expanded={expanded} aria-label={expanded ? 'Collapse notebook note' : 'Expand notebook note'} onClick={() => toggleNote(noteKey)}><span>✎</span><DirectCollapsibleText expanded={expanded} showButton={false}>{item}</DirectCollapsibleText><em>{expanded ? 'Less' : '›'}</em></button>; })}</div></div>
    </section>
  );
}
