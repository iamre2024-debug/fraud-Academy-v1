import { useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

export default function BottomInvestigationGrid({
  tray,
  pin,
  noteDraft,
  setNoteDraft,
  submitNote,
  notes,
}) {
  const [expandedNotes, setExpandedNotes] = useState({});
  const toggleNote = (noteKey) => setExpandedNotes((current) => ({ ...current, [noteKey]: !current[noteKey] }));

  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card"><div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div><div className="tray-list">{tray.map((item) => <div key={item}><span>▯</span><strong>Pinned</strong><DirectCollapsibleText as="em">{item}</DirectCollapsibleText><button type="button" onClick={() => pin(item)}>📌</button></div>)}</div></div>
      <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div><form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form><div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => { const noteKey = `${item}-${index}`; const expanded = Boolean(expandedNotes[noteKey]); return <button type="button" key={noteKey} aria-expanded={expanded} aria-label={expanded ? 'Collapse notebook note' : 'Expand notebook note'} onClick={() => toggleNote(noteKey)}><span>✎</span><DirectCollapsibleText expanded={expanded} showButton={false}>{item}</DirectCollapsibleText><em>{expanded ? 'Less' : '›'}</em></button>; })}</div></div>
    </section>
  );
}
