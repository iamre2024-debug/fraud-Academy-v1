import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { getIdentityIntelContextCase } from './data/identityIntelReport.js';
import { workflows } from './visualWorkspaceModel.js';

const Business360DossierWorkspace = lazy(() => import('./Business360Workspace.jsx'));
const DocumentViewerWorkspace = lazy(() => import('./DocumentViewerWorkspace.jsx'));
const FinancialInvestigationDossierWorkspace = lazy(() => import('./FinancialInvestigationWorkspace.jsx'));
const LinkAnalysisWorkspace = lazy(() => import('./LinkAnalysisWorkspace.jsx'));
const MerchantIntelligenceWorkspace = lazy(() => import('./MerchantIntelligenceWorkspace.jsx'));
const DeviceIntelligenceWorkspace = lazy(() => import('./tools/DeviceIntelligenceWorkspace.jsx'));
const DocumentRequestWorkspace = lazy(() => import('./tools/DocumentRequestWorkspace.jsx'));
const EmployeeProfileWorkspace = lazy(() => import('./tools/EmployeeProfileWorkspace.jsx'));
const IPIntelligenceWorkspace = lazy(() => import('./tools/IPIntelligenceWorkspace.jsx'));
const IdentityIntelWorkspace = lazy(() => import('./tools/IdentityIntelWorkspace.jsx'));
const LoginHistoryWorkspace = lazy(() => import('./tools/LoginHistoryWorkspace.jsx'));
const PaymentVerificationWorkspace = lazy(() => import('./tools/PaymentVerificationWorkspace.jsx'));
const PayrollHistoryWorkspace = lazy(() => import('./tools/PayrollHistoryWorkspace.jsx'));
const SessionHistoryWorkspace = lazy(() => import('./tools/SessionHistoryWorkspace.jsx'));
const TransactionHistoryWorkspace = lazy(() => import('./tools/TransactionHistoryWorkspace.jsx'));

const toolDetails = {
  'Identity Intel / People Search': {
    purpose: 'Search fictional identity records by Training ID or Name + DOB, review the match summary, then open the full profile report.',
    question: 'Does this identity history support who they claim to be?',
  },
  'Login History': {
    purpose: 'Review authentication attempts, results, methods, devices, locations, MFA, and session references without mixing in post-login activity or drawing an early conclusion.',
    question: 'Who logged in, when, and from where?',
  },
  'Session History': {
    purpose: 'Review recorded actions after authentication and connect each session to its login, profile activity, payment activity, and logout state without drawing an early conclusion.',
    question: 'After login, what did the user do?',
  },
  'Device Intelligence': {
    purpose: 'Compare fictional device identifiers, browsers, sessions, methods, locations, and network records.',
    question: 'Which devices appear in the case activity, and where do those devices repeat?',
  },
  'IP Intelligence': {
    purpose: 'Look up fictional network and location evidence, then compare it with recorded sessions and devices without drawing an early conclusion.',
    question: 'Where did the connection originate, and has it been seen elsewhere?',
  },
  'Transaction History': {
    purpose: 'Review the transaction records in scope before comparing them with other financial and customer evidence.',
    question: 'What transactions are in scope, and what details are recorded for each item?',
  },
  'Merchant Intelligence': {
    purpose: 'Review merchant identity, category, customer history, authorization, fulfillment, disputes, refunds, subscription or marketplace activity, and reason-code evidence in one claim-specific workspace.',
    question: 'Is this a customer issue, merchant issue, fraud issue, or dispute issue?',
  },
  'Financial Investigation': {
    purpose: 'Organize the account, spending, deposit, payment, loan, and payroll records that apply to this customer and product without deciding the case.',
    question: 'What financial activity is recorded for this product and review period?',
  },
  'Payment Verification': {
    purpose: 'Review neutral payment-object and verification records without treating a status as a final case decision.',
    question: 'What payment objects and verification states are recorded for this case?',
  },
  'Business 360': {
    purpose: 'Review a reusable fictional business profile across identity, ownership, operating footprint, institution relationships, and Luna source research.',
    question: 'Which business facts match, differ, or remain unavailable across the recorded sources?',
  },
  'Employee Profile': {
    purpose: 'Review employee identity, role, employer, status, timing, and related case context.',
    question: 'Which employee facts are available, and how do they connect to the case?',
  },
  'Payroll History': {
    purpose: 'Move from company payroll history to a reconciled payroll run, an employee-only paycheck history, and an immutable paystub snapshot.',
    question: 'What did the selected company pay in each run, and which event-level paycheck records support those totals?',
  },
  'Document Viewer': {
    purpose: 'Search by exact Account ID, then review the matching customer documents, complete pages, extracted fields, and source details without drawing an early conclusion.',
    question: 'Which customer account do these documents belong to, and what can be verified from each record?',
  },
  'Document Request': {
    purpose: 'Track fictional case documents that were requested, received, missing, or awaiting review without treating the request status as a case outcome.',
    question: 'What documents were requested, received, missing, or pending review for this case?',
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
  cases,
  openDocumentAccountCase,
  openRelatedCase,
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
  markReviewed,
  currentCompleted,
  jumpDecision,
  documentRequests,
  setDocumentRequestsByCase,
  recordAction,
  quickPin,
  payrollInvestigation,
  setPayrollInvestigationsByCase,
}) {
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const identityContextCase = useMemo(
    () => (
      ['Identity Intel / People Search', 'Login History', 'Session History', 'Device Intelligence'].includes(tool)
        ? getIdentityIntelContextCase(activeCase, query)
        : activeCase
    ),
    [activeCase, query, tool],
  );
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

      <Suspense fallback={<div className="investigation-tool-empty" role="status">Loading {tool}…</div>}>
      {tool === 'Identity Intel / People Search' ? (
        <IdentityIntelWorkspace
          activeCase={activeCase}
          query={query}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          recordAction={recordAction}
          quickPin={quickPin}
        />
      ) : tool === 'Transaction History' ? (
        <TransactionHistoryWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          recordAction={recordAction}
        />
      ) : tool === 'Merchant Intelligence' ? (
        <MerchantIntelligenceWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
        />
      ) : tool === 'Financial Investigation' ? (
        <FinancialInvestigationDossierWorkspace
          activeCase={activeCase}
          query={query}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Business 360' ? (
        <Business360DossierWorkspace
          activeCase={activeCase}
          query={query}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Employee Profile' ? (
        <EmployeeProfileWorkspace
          activeCase={activeCase}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Payroll History' ? (
        <PayrollHistoryWorkspace
          activeCase={activeCase}
          query={query}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          quickPin={quickPin}
          recordAction={recordAction}
          payrollInvestigation={payrollInvestigation}
          setPayrollInvestigationsByCase={setPayrollInvestigationsByCase}
        />
      ) : tool === 'Login History' ? (
        <LoginHistoryWorkspace
          activeCase={identityContextCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Session History' ? (
        <SessionHistoryWorkspace
          activeCase={identityContextCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
        />
      ) : tool === 'IP Intelligence' ? (
        <IPIntelligenceWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
        />
      ) : tool === 'Payment Verification' ? (
        <PaymentVerificationWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          recordAction={recordAction}
          quickPin={quickPin}
        />
      ) : tool === 'Document Viewer' ? (
        <DocumentViewerWorkspace
          activeCase={activeCase}
          cases={cases}
          openDocumentAccountCase={openDocumentAccountCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
        />
      ) : tool === 'Document Request' ? (
        <DocumentRequestWorkspace
          activeCase={activeCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          documentRequests={documentRequests}
          setDocumentRequestsByCase={setDocumentRequestsByCase}
        />
      ) : tool === 'Link Analysis' ? (
        <LinkAnalysisWorkspace
          activeCase={activeCase}
          cases={cases}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          jumpDecision={jumpDecision}
          openRelatedCase={openRelatedCase}
          recordAction={recordAction}
        />
      ) : tool === 'Device Intelligence' ? (
        <DeviceIntelligenceWorkspace
          activeCase={identityContextCase}
          query={query}
          setQuery={setQuery}
          pin={pin}
          saveNote={saveNote}
          markReviewed={markReviewed}
          reviewed={reviewed}
          openTool={openTool}
          jumpDecision={jumpDecision}
          quickPin={quickPin}
        />
      ) : (
        <>

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
              </div>

              <div className="investigation-tool-detail-actions">
                <button type="button" onClick={saveDisplayedNote}>Save expanded note</button>
              </div>
            </>
          ) : (
            <div className="investigation-tool-empty" role="status">Open a record to review its full details.</div>
          )}
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Investigation record next routes">
        {(tool === 'Document Viewer' || tool === 'Financial Investigation') && <button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button>}
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
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
        </>
      )}
      </Suspense>
    </section>
  );
}
