import { useEffect, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { workflows } from './visualWorkspaceModel.js';

function lineBreaks(value) {
  return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>);
}

function purposeFor(tool) {
  if (tool === 'Customer 360') {
    return 'Review the customer profile, account relationship, contact points, and case-linked identity context before interpreting activity.';
  }

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
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const displayData = buildCoreToolRecords(tool, activeCase, data) ?? data;
  const normalizedQuery = query.trim().toLowerCase();
  const displayRows = displayData === data
    ? rows
    : displayData.rows.filter((row) => !normalizedQuery || row.detail.toLowerCase().includes(normalizedQuery));
  const selectedId = selectedRecordId || activeRow?.id;
  const displayActiveRow = displayRows.find((row) => row.id === selectedId) ?? displayRows[0];
  const isCustomer360 = tool === 'Customer 360';
  const reviewed = currentCompleted.includes(tool);

  useEffect(() => {
    setSelectedRecordId('');
  }, [activeCase.id, tool]);

  function expandRecord(rowId) {
    setSelectedRecordId(rowId);
    setExpandedId(rowId);
  }

  function saveDisplayedReportPacket() {
    saveCaseReportPacket(displayActiveRow ?? activeRow);
  }

  return (
    <section className={`ornate-card activity-panel${isCustomer360 ? ' customer-360-panel' : ''}`} data-tool={tool} aria-labelledby="active-tool-title">
      <div className="activity-heading">
        <div>
          <span className="tool-context-label">{activeCategory.label}</span>
          <h2 id="active-tool-title">{isCustomer360 ? 'Customer 360' : tool}</h2>
        </div>
        <select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)} aria-label="Choose investigation tool">
          {activeCategory.tools.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="tool-purpose-card">
        <div className="tool-purpose-copy">
          <span className={`tool-status-chip ${reviewed ? 'reviewed' : 'open'}`}>{reviewed ? 'Reviewed' : 'Open'}</span>
          <strong>{tool}</strong>
          <DirectCollapsibleText lines={2}>{purposeFor(tool)}</DirectCollapsibleText>
        </div>
        <ol className="tool-flow-chips" aria-label="Investigation workflow">
          {workflows.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}
        </ol>
        <button type="button" className="decision-route-mini" onClick={jumpDecision}>Open Submit Decision</button>
      </div>

      <div className="workspace-search-row">
        <label>
          <span>Search {tool}</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..." />
        </label>
        <span aria-live="polite">{displayRows.length} of {displayData.rows.length} shown</span>
      </div>

      {displayRows.length > 0 ? (
        <div className="activity-table" role="table" aria-label={`${tool} records`}>
          <div className="activity-row table-head" role="row">
            {displayData.columns.map((item) => <span key={item} role="columnheader">{item}</span>)}
          </div>
          {displayRows.map((row) => (
            <div key={row.id} role="row" className={`activity-row ${displayActiveRow?.id === row.id ? 'expanded' : ''}`}>
              {row.values.map((value, index) => <span key={`${row.id}-${index}`} role="cell">{lineBreaks(value)}</span>)}
              <div className="row-action-group" role="cell">
                <button type="button" className="row-expand-button" onClick={() => expandRecord(row.id)} aria-pressed={displayActiveRow?.id === row.id}>Expand</button>
                <button type="button" className="row-pin-button" onClick={() => pin(row.pin)} aria-label={`Pin ${row.id}`}>📌</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tool-empty-state" role="status">
          <strong>No matching records</strong>
          <p>Clear or adjust the search to return available case records.</p>
        </div>
      )}

      {displayActiveRow && (
        <section className="record-detail-panel" aria-labelledby="expanded-record-title">
          <div className="record-detail-heading">
            <div><span>Expanded Record</span><h3 id="expanded-record-title">{displayActiveRow.id}</h3></div>
            <button type="button" onClick={() => saveNote(`Expanded ${tool} record ${displayActiveRow.id}: ${displayActiveRow.detail}`, 'Expanded record')}>Save expanded note</button>
          </div>
          <div className="record-review-lanes">
            <article>
              <span className="record-lane-step">04</span><h4>History</h4>
              <DirectCollapsibleText>☾ {displayActiveRow.id} is open inside {tool} for {activeCase.id}.</DirectCollapsibleText>
              <DirectCollapsibleText>☾ Compare this history with pinned evidence, timeline entries, and the case report draft.</DirectCollapsibleText>
            </article>
            <article>
              <span className="record-lane-step">05</span><h4>Link Analysis</h4>
              <DirectCollapsibleText>⌘ {displayActiveRow.label}: {displayActiveRow.pin}</DirectCollapsibleText>
              <DirectCollapsibleText>⌘ Case object: {activeCase.id} · {activeCase.person}</DirectCollapsibleText>
            </article>
            <article>
              <span className="record-lane-step">06</span><h4>Generate Report</h4>
              <DirectCollapsibleText>✦ Source tool: {tool}.</DirectCollapsibleText>
              <DirectCollapsibleText>✦ Record summary: {displayActiveRow.detail}.</DirectCollapsibleText>
              <div className="record-report-actions">
                <button type="button" onClick={saveDisplayedReportPacket}>Save neutral report packet</button>
                <button type="button" onClick={() => markReviewed(tool)}>{reviewed ? 'Reviewed' : 'Mark reviewed'}</button>
              </div>
            </article>
          </div>
        </section>
      )}

      <button type="button" className="view-full-button" onClick={() => markReviewed(tool)}>
        {reviewed ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report'}
      </button>
    </section>
  );
}
