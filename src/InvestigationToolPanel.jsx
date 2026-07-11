import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { workflows } from './visualWorkspaceModel.js';

const toolDetails = {
  'Identity Intelligence': {
    purpose: 'Review identity records, values, history, and linked customer objects without drawing an early conclusion.',
    question: 'Which identity records belong to this customer, and how have those records changed over time?',
  },
  'Login History': {
    purpose: 'Review recorded login attempts, results, devices, locations, and authentication methods tied to the case.',
    question: 'What access attempts and results are recorded for the active case?',
  },
  'Session History': {
    purpose: 'Review recorded sessions and the events that occurred inside those sessions.',
    question: 'Which actions occurred within the observed sessions, and how are the events connected?',
  },
  'Device Intelligence': {
    purpose: 'Compare fictional device identifiers, browsers, sessions, methods, locations, and network records.',
    question: 'Which devices appear in the case activity, and where do those devices repeat?',
  },
  'IP Intelligence': {
    purpose: 'Review network locations and the sessions, devices, methods, and times connected to each address.',
    question: 'Which network locations and sessions are tied to the observed activity?',
  },
  'Transaction History': {
    purpose: 'Review the transaction records in scope before comparing them with other financial and customer evidence.',
    question: 'What transactions are in scope, and what details are recorded for each item?',
  },
  'Financial Intelligence': {
    purpose: 'Review account and financial context supplied by the fictional training packet.',
    question: 'What financial context is available for the active case?',
  },
  'Payment Verification': {
    purpose: 'Review neutral payment-object and verification records without treating a status as a final case decision.',
    question: 'What payment objects and verification states are recorded for this case?',
  },
  'Business 360': {
    purpose: 'Review the business relationship, status, observed activity, and case context in one neutral record set.',
    question: 'Which business relationships and entities are connected to the active case?',
  },
  'Business Intelligence': {
    purpose: 'Review business records, values, observation dates, and context supplied by the case packet.',
    question: 'What business-verification records are available for review?',
  },
  'Employee Profile': {
    purpose: 'Review employee identity, role, employer, status, timing, and related case context.',
    question: 'Which employee facts are available, and how do they connect to the case?',
  },
  'Payroll History': {
    purpose: 'Review payroll periods, employers, amounts, channels, statuses, and contextual details.',
    question: 'What payroll activity is recorded for the active case?',
  },
  'Evidence Center': {
    purpose: 'Review evidence records, sources, receipt status, linked objects, and neutral summaries.',
    question: 'Which evidence items are available, pending, or linked to the case?',
  },
  'Document Viewer': {
    purpose: 'Review document titles, categories, status, fields, update dates, and available previews.',
    question: 'Which documents are available, and what information does each document contain?',
  },
  'Link Analysis': {
    purpose: 'Review connections between customer, access, identity, device, network, and case objects.',
    question: 'Which identifiers and records connect across the active case?',
  },
  'System Access Lane': {
    purpose: 'Review neutral internal, vendor, API, and permissioned third-party access records tied to case objects.',
    question: 'Which approved system-access records touch the active case objects?',
  },
};

function detailFor(tool, activeCategory) {
  return toolDetails[tool] ?? {
    purpose: `Review the available ${activeCategory.label.toLowerCase()} records while the final decision remains locked.`,
    question: `What records are available inside ${tool}?`,
  };
}

function fieldPairs(columns, values) {
  return columns.map((column, index) => ({
    label: column,
    value: values[index] ?? 'Not recorded',
  }));
}

function searchableText(row) {
  return `${row.id} ${row.label} ${row.detail} ${row.values.join(' ')}`.toLowerCase();
}

export default function InvestigationToolPanel({
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
    : displayData.rows.filter((row) => !normalizedQuery || searchableText(row).includes(normalizedQuery));
  const selectedId = selectedRecordId || activeRow?.id;
  const displayActiveRow = displayRows.find((row) => row.id === selectedId) ?? displayRows[0];
  const selectedFields = useMemo(
    () => displayActiveRow ? fieldPairs(displayData.columns, displayActiveRow.values) : [],
    [displayActiveRow, displayData.columns],
  );
  const toolDetail = detailFor(tool, activeCategory);
  const reviewed = currentCompleted.includes(tool);
  const reportRow = displayActiveRow ?? activeRow;

  useEffect(() => {
    setSelectedRecordId('');
  }, [activeCase.id, tool]);

  function openRecord(rowId) {
    setSelectedRecordId(rowId);
    setExpandedId(rowId);
  }

  function saveDisplayedNote() {
    if (!reportRow) return;
    saveNote(`Expanded ${tool} record ${reportRow.id}: ${reportRow.detail}`, 'Expanded record');
  }

  function saveDisplayedReportPacket() {
    if (reportRow) saveCaseReportPacket(reportRow);
  }

  return (
    <section
      className="ornate-card activity-panel investigation-tools-theme-v1"
      data-investigation-tools-screen="approved-theme-v1"
      data-tool-name={tool}
    >
      <header className="investigation-tool-header">
        <div>
          <p className="investigation-tool-eyebrow">{activeCategory.label} · Evidence First</p>
          <h2>{tool}</h2>
          <p>{toolDetail.purpose}</p>
        </div>
        <div className="investigation-tool-header-actions">
          <span>{activeCase.id}</span>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </div>
      </header>

      <section className="investigation-tool-question" aria-labelledby="investigation-tool-question-heading">
        <div aria-hidden="true">?</div>
        <div>
          <p>Working question</p>
          <h3 id="investigation-tool-question-heading">{toolDetail.question}</h3>
          <span>Review the records, expand the useful details, and save only the evidence needed for the case package.</span>
        </div>
      </section>

      <section className="investigation-tool-controls" aria-label="Investigation tool controls">
        <label>
          <span>Current tool group</span>
          <select
            className="tool-select"
            value={tool}
            onChange={(event) => openTool(event.target.value)}
            aria-label="Choose investigation tool"
          >
            {activeCategory.tools.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="investigation-tool-flow" aria-label="Evidence workflow">
          {workflows.map((item, index) => (
            <span key={item} className={index <= 5 ? 'current-flow' : ''}>{index + 1}. {item}</span>
          ))}
        </div>
      </section>

      <section className="investigation-tool-metrics" aria-label={`${tool} review summary`}>
        <article><span>Records available</span><strong>{displayData.rows.length}</strong></article>
        <article><span>Records shown</span><strong>{displayRows.length}</strong></article>
        <article><span>Review status</span><strong>{reviewed ? 'Reviewed' : 'Open'}</strong></article>
        <article><span>Active case</span><strong>{activeCase.id}</strong></article>
      </section>

      <div className="investigation-tool-search-row">
        <label>
          <span>Search this tool</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records, values, history, devices, merchants, documents..."
            aria-label={`Search ${tool} records`}
          />
        </label>
        <span aria-live="polite">{displayRows.length} of {displayData.rows.length} shown</span>
      </div>

      <div className="investigation-tool-workspace">
        <section className="investigation-tool-records" aria-labelledby="investigation-tool-records-heading">
          <header className="investigation-tool-section-heading">
            <div>
              <p>Record review</p>
              <h3 id="investigation-tool-records-heading">Available {tool} records</h3>
            </div>
            <span>{displayRows.length} shown</span>
          </header>

          <div className="investigation-tool-record-list">
            {displayRows.map((row) => {
              const fields = fieldPairs(displayData.columns, row.values).filter((field) => !/action/i.test(field.label)).slice(0, 3);
              const selected = displayActiveRow?.id === row.id;
              return (
                <article
                  key={row.id}
                  className={`investigation-tool-record-card ${selected ? 'selected' : ''}`}
                  data-investigation-record={row.id}
                >
                  <header>
                    <div><span>{row.id}</span><h4>{row.label}</h4></div>
                    <span>{selected ? 'Open' : 'Record'}</span>
                  </header>
                  <dl>
                    {fields.map((field) => (
                      <div key={`${row.id}-${field.label}`}>
                        <dt>{field.label}</dt>
                        <dd><DirectCollapsibleText lines={2} mobileLines={3}>{String(field.value)}</DirectCollapsibleText></dd>
                      </div>
                    ))}
                  </dl>
                  <div className="investigation-tool-record-actions">
                    <button type="button" onClick={() => openRecord(row.id)}>{selected ? 'Record open' : 'Open record'}</button>
                    <button type="button" onClick={() => pin(row.pin)}>Pin</button>
                  </div>
                </article>
              );
            })}
            {!displayRows.length && (
              <div className="investigation-tool-empty" role="status">
                No records match this search. Clear or revise the search to continue reviewing this tool.
              </div>
            )}
          </div>
        </section>

        <aside className="investigation-tool-detail" aria-label="Expanded investigation record">
          {displayActiveRow ? (
            <>
              <header className="investigation-tool-detail-heading">
                <div>
                  <p>Expanded record</p>
                  <h3>{displayActiveRow.id}</h3>
                  <span>{displayActiveRow.label}</span>
                </div>
                <button type="button" onClick={() => pin(displayActiveRow.pin)}>Pin record</button>
              </header>

              <dl className="investigation-tool-field-grid">
                {selectedFields.map((field) => (
                  <div key={`${displayActiveRow.id}-${field.label}`}>
                    <dt>{field.label}</dt>
                    <dd><DirectCollapsibleText lines={3} mobileLines={4}>{String(field.value)}</DirectCollapsibleText></dd>
                  </div>
                ))}
              </dl>

              <div className="investigation-tool-review-lanes">
                <article>
                  <span>History</span>
                  <h4>Record history</h4>
                  <DirectCollapsibleText lines={3} mobileLines={4}>
                    {displayActiveRow.id} is open inside {tool} for {activeCase.id}. Compare the recorded timing and values with the active case packet.
                  </DirectCollapsibleText>
                </article>
                <article>
                  <span>Link Analysis</span>
                  <h4>Connected objects</h4>
                  <DirectCollapsibleText lines={3} mobileLines={4}>
                    {displayActiveRow.label}: {displayActiveRow.pin}. Active customer object: {activeCase.person} · {activeCase.trainingId}.
                  </DirectCollapsibleText>
                </article>
                <article>
                  <span>Generate Report</span>
                  <h4>Neutral report packet</h4>
                  <DirectCollapsibleText lines={3} mobileLines={4}>
                    Source tool: {tool}. Record summary: {displayActiveRow.detail}.
                  </DirectCollapsibleText>
                </article>
              </div>

              <div className="investigation-tool-detail-actions">
                <button type="button" onClick={saveDisplayedNote}>Save expanded note</button>
                <button type="button" onClick={saveDisplayedReportPacket}>Save neutral report packet</button>
              </div>
            </>
          ) : (
            <div className="investigation-tool-empty" role="status">Open a record to review its full details.</div>
          )}
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Investigation record next routes">
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={() => openTool('Case Report')}>Open Case Report</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>{tool} review</strong>
          <span>Review completion records process progress only. It does not determine the case outcome.</span>
        </div>
        <button type="button" className="investigation-tool-primary" onClick={() => markReviewed(tool)}>
          {reviewed ? `✓ ${tool} reviewed` : `Mark ${tool} reviewed`}
        </button>
      </footer>
    </section>
  );
}
