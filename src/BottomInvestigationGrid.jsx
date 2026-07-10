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
  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card"><div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div><div className="tray-list">{tray.map((item) => <div key={item}><span>▯</span><strong>Pinned</strong><em>{item}</em><button type="button" onClick={() => pin(item)}>📌</button></div>)}</div><button type="button" className="add-evidence" onClick={() => openTool('Evidence Center')}>✦ Open Evidence Center ›</button></div>
      <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div><form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form><details className="case-report-packet-panel" open={reportPackets.length > 0}><summary>Case Report packets · {reportPackets.length} saved</summary><div>{reportPackets.slice(0, 8).map((item) => <p key={item.id}><strong>{item.section}</strong> · {item.recordId} · {item.title}</p>)}{!reportPackets.length && <p>No structured packets saved yet. Use an expanded record to save one.</p>}</div></details><div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => <button type="button" key={`${item}-${index}`}><span>✎</span><p>{item}</p><em>›</em></button>)}</div></div>
    </section>
  );
}
