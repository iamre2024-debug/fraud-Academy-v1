import { workflows } from './visualWorkspaceModel.js';

function lineBreaks(value) {
  return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>);
}

function purposeFor(tool) {
  if (tool === 'Device Intelligence') {
    return 'Device IDs help separate repeated known devices from new devices. Repeated device names keep the same fictional Device ID for this customer.';
  }

  if (tool === 'System Access Lane') {
    return 'Review neutral internal, vendor, API, and permissioned third-party access records tied to the case objects.';
  }

  return 'Review available case records while keeping the final decision locked.';
}

export default function ActiveToolPanel({
  activeCategory,
  activeCase,
  tool,
  openTool,
  query,
  setQuery,
  data,
  rows,
  activeRow,
  setExpandedId,
  pin,
  saveNote,
  saveCaseReportPacket,
  markReviewed,
  currentCompleted,
  jumpDecision,
}) {
  return (
    <section className="ornate-card activity-panel">
      <div className="activity-heading"><h2>▣ {activeCategory.label}</h2><select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)}>{activeCategory.tools.map((item) => <option key={item}>{item}</option>)}</select><span className="panel-cat">🐈‍⬛</span></div>
      <div className="tool-purpose-card"><strong>{tool}</strong><p>{purposeFor(tool)}</p><div className="tool-flow-chips">{workflows.map((item) => <span key={item}>{item}</span>)}</div><button type="button" className="decision-route-mini" onClick={jumpDecision}>Need to decide? Open Submit Decision</button></div>
      <div className="workspace-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..."/><span>{rows.length} of {data.rows.length} shown</span></div>
      <div className="activity-table"><div className="activity-row table-head">{data.columns.map((item) => <span key={item}>{item}</span>)}</div>{rows.map((row) => <div key={row.id} className={`activity-row ${activeRow?.id === row.id ? 'expanded' : ''}`}>{row.values.map((value, index) => <span key={`${row.id}-${index}`}>{lineBreaks(value)}</span>)}<div className="row-action-group"><button type="button" className="row-expand-button" onClick={() => setExpandedId(row.id)}>Expand</button><button type="button" className="row-pin-button" onClick={() => pin(row.pin)}>📌</button></div></div>)}</div>
      {activeRow && <section className="record-detail-panel"><div className="record-detail-heading"><div><span>Expanded Record</span><h3>{activeRow.id}</h3></div><button type="button" onClick={() => saveNote(`Expanded ${tool} record ${activeRow.id}: ${activeRow.detail}`, 'Expanded record')}>Save expanded note</button></div><div className="record-review-lanes"><article><h4>History</h4><p>☾ {activeRow.id} is open inside {tool} for {activeCase.id}.</p><p>☾ Record history can be compared with pinned evidence, timeline entries, and the case report draft.</p></article><article><h4>Link Analysis</h4><p>⌘ {activeRow.label}: {activeRow.pin}</p><p>⌘ Case object: {activeCase.id} · {activeCase.person}</p></article><article><h4>Generated Report</h4><p>✦ Source tool: {tool}.</p><p>✦ Record summary: {activeRow.detail}.</p><div className="record-report-actions"><button type="button" onClick={() => saveCaseReportPacket(activeRow)}>Save neutral report packet</button><button type="button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? 'Reviewed' : 'Mark reviewed'}</button></div></article></div></section>}
      <button type="button" className="view-full-button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report ›'}</button>
    </section>
  );
}
