import { workflows } from './visualWorkspaceModel.js';
import { CaseBriefingPanel, Customer360Panel } from './CoreOverviewPanels.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';

function lineBreaks(value) {
  return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>);
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
}) {
  if (tool === 'Case Briefing') return <CaseBriefingPanel activeCase={activeCase} openTool={openTool} pin={pin} />;
  if (tool === 'Customer 360') return <Customer360Panel activeCase={activeCase} openTool={openTool} pin={pin} />;

  const enhanced = buildCoreToolRecords(tool, activeCase);
  const displayData = enhanced ?? data;
  const displayRows = enhanced
    ? displayData.rows.filter((item) => !query || item.detail.toLowerCase().includes(query.toLowerCase()))
    : rows;
  const displayActiveRow = displayRows.find((item) => item.id === activeRow?.id) ?? displayRows[0];

  return (
    <section className="ornate-card activity-panel">
      <div className="activity-heading"><h2>▣ {activeCategory.label}</h2><select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)}>{activeCategory.tools.map((item) => <option key={item}>{item}</option>)}</select><button type="button" className="briefing-route-button" onClick={() => openTool('Case Briefing')}>Case Briefing</button><span className="panel-cat">🐈‍⬛</span></div>
      <div className="tool-purpose-card"><strong>{tool}</strong><p>Available case records and investigation actions.</p><div className="tool-flow-chips">{workflows.map((item) => <span key={item}>{item}</span>)}</div></div>
      <div className="workspace-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search available records..."/><span>{displayRows.length} of {displayData.rows.length} shown</span></div>
      <div className="activity-table"><div className="activity-row table-head">{displayData.columns.map((item) => <span key={item}>{item}</span>)}</div>{displayRows.map((item) => <div key={item.id} className={`activity-row ${displayActiveRow?.id === item.id ? 'expanded' : ''}`}>{item.values.map((value, index) => <span key={`${item.id}-${index}`}>{lineBreaks(value)}</span>)}<div className="row-action-group"><button type="button" className="row-expand-button" onClick={() => setExpandedId(item.id)}>Expand</button><button type="button" className="row-pin-button" onClick={() => pin(item.pin)}>📌</button></div></div>)}</div>
      {displayActiveRow && <section className="record-detail-panel"><div className="record-detail-heading"><div><span>Expanded Record</span><h3>{displayActiveRow.id}</h3></div><button type="button" onClick={() => saveNote(`Expanded ${tool} record ${displayActiveRow.id}: ${displayActiveRow.detail}`, 'Expanded record')}>Save expanded note</button></div><div className="record-review-lanes"><article><h4>History</h4><p>{displayActiveRow.detail}</p></article><article><h4>Link Analysis</h4><p>{displayActiveRow.label}: {displayActiveRow.pin}</p><p>{activeCase.id} · {activeCase.person}</p></article><article><h4>Generated Report</h4><p>Source: {tool}</p><div className="record-report-actions"><button type="button" onClick={() => saveCaseReportPacket(displayActiveRow)}>Save neutral report packet</button><button type="button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? 'Reviewed' : 'Mark reviewed'}</button></div></article></div></section>}
      <button type="button" className="view-full-button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report ›'}</button>
    </section>
  );
}
