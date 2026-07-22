import { useEffect, useMemo, useState } from 'react';
import { documentSearchText, getCaseDocuments } from './data/documentRecords.js';

function fieldValue(document, label) {
  return document?.fields?.find(([field]) => field === label)?.[1] ?? 'Not recorded';
}

function DocumentPage({ document, page, pageNumber, zoom }) {
  return (
    <article
      className={`document-page document-page-${page.kind ?? 'standard'}`}
      style={{ '--document-zoom': zoom / 100 }}
      aria-label={`${document.title} page ${pageNumber}`}
    >
      <header className="document-page-header">
        <div>
          <span>Fraud Academy Training Records</span>
          <h3>{page.title}</h3>
          <p>{page.subtitle}</p>
        </div>
        <small>{document.reference}</small>
      </header>

      {page.initials && (
        <section className="document-identity-banner" aria-label="Identity document portrait and summary">
          <div aria-hidden="true">{page.initials}</div>
          <p>Fictional training portrait</p>
        </section>
      )}

      <div className="document-page-body">
        {page.sections.map((item) => (
          <section key={item.title} className="document-page-section">
            <h4>{item.title}</h4>
            {item.rows?.length > 0 && (
              <dl>
                {item.rows.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            )}
            {item.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {item.table && (
              <div className="document-page-table-wrap">
                <table>
                  <thead><tr>{item.table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>
                    {item.table.rows.map((row) => (
                      <tr key={row.join('-')}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="document-page-footer">
        <span>Fictional training document - not valid for real-world use</span>
        <strong>Page {pageNumber} of {document.pages.length}</strong>
      </footer>
    </article>
  );
}

function documentExportText(document) {
  const fields = document.fields.map(([label, value]) => `${label}: ${value}`).join('\n');
  return [
    document.title,
    `Reference: ${document.reference}`,
    `Case: ${document.caseId}`,
    `Account ID: ${document.accountId}`,
    `Customer: ${document.customer}`,
    `Claim type: ${document.claimType}`,
    `Status: ${document.status}`,
    `Review status: ${document.reviewStatus}`,
    `Source: ${document.source}`,
    `Received: ${document.received}`,
    '',
    document.summary,
    '',
    fields,
    '',
    `Investigator note: ${document.investigatorNote}`,
    `Training tip: ${document.trainingTip}`,
  ].join('\n');
}

export default function DocumentViewerWorkspace({
  activeCase,
  cases,
  openDocumentAccountCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  documentRequests = {},
}) {
  const [accountLookup, setAccountLookup] = useState('');
  const [matchedAccountId, setMatchedAccountId] = useState('');
  const [lookupError, setLookupError] = useState('');
  const normalizeAccountId = (value = '') => String(value).trim().toUpperCase();
  const accessGranted = Boolean(matchedAccountId)
    && normalizeAccountId(activeCase.accountId) === matchedAccountId;
  const documents = useMemo(() => accessGranted ? getCaseDocuments(activeCase).map((document) => {
    const request = documentRequests[document.id];
    if (!request) return document;
    return {
      ...document,
      status: document.pages.length ? document.status : request.status,
      requestStatus: request.status,
      reviewStatus: request.status === 'Requested' ? 'Awaiting paperwork' : document.reviewStatus,
      received: request.receivedDate ?? document.received,
      requestDueDate: request.dueDate,
      requestDeliveryChannel: request.deliveryChannel,
    };
  }) : [], [accessGranted, activeCase, documentRequests]);
  const folders = useMemo(() => ['All Documents', ...new Set(documents.map((document) => document.folder))], [documents]);
  const statuses = useMemo(() => ['All statuses', ...new Set(documents.map((document) => document.status))], [documents]);
  const [folder, setFolder] = useState('All Documents');
  const [status, setStatus] = useState('All statuses');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [compareIds, setCompareIds] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [mobilePane, setMobilePane] = useState('inbox');
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) => (
    (folder === 'All Documents' || document.folder === folder)
    && (status === 'All statuses' || document.status === status)
    && (!normalizedQuery || documentSearchText(document).includes(normalizedQuery))
  ));
  const activeDocument = filteredDocuments.find((document) => document.id === selectedDocumentId)
    ?? filteredDocuments[0];
  const activePage = activeDocument?.pages?.[pageIndex] ?? activeDocument?.pages?.[0];
  const comparedDocuments = compareIds.map((id) => documents.find((document) => document.id === id)).filter(Boolean);

  useEffect(() => {
    setFolder('All Documents');
    setStatus('All statuses');
    setSelectedDocumentId('');
    setPageIndex(0);
    setZoom(100);
    setCompareIds([]);
    setNoteDraft('');
    setMobilePane('inbox');
  }, [activeCase.id]);

  useEffect(() => {
    setPageIndex(0);
  }, [activeDocument?.id]);

  function openDocument(documentId) {
    setSelectedDocumentId(documentId);
    setPageIndex(0);
    setMobilePane('reader');
  }

  function toggleCompare(documentId) {
    setCompareIds((current) => {
      if (current.includes(documentId)) return current.filter((id) => id !== documentId);
      return [...current.slice(-1), documentId];
    });
  }

  function addDocumentToSummary() {
    if (!activeDocument) return;
    saveNote(`${activeDocument.id}: ${activeDocument.summary}`, 'Document summary');
  }

  function saveDocumentNote() {
    const clean = noteDraft.trim();
    if (!clean || !activeDocument) return;
    saveNote(`${activeDocument.id}: ${clean}`, 'Document review');
    setNoteDraft('');
  }

  function exportDocument() {
    if (!activeDocument || typeof window === 'undefined') return;
    const blob = new Blob([documentExportText(activeDocument)], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${activeDocument.id}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function searchByAccountId(event) {
    event.preventDefault();
    const requestedAccountId = normalizeAccountId(accountLookup);
    const match = (cases ?? [activeCase]).find((item) => normalizeAccountId(item.accountId) === requestedAccountId);

    if (!requestedAccountId || !match) {
      setMatchedAccountId('');
      setLookupError('No case was found for that Account ID. Check the ID and search again.');
      return;
    }

    setMatchedAccountId(requestedAccountId);
    setAccountLookup(match.accountId);
    setLookupError('');
    setQuery('');
    openDocumentAccountCase?.(match.id);
  }

  return (
    <div className="document-viewer" data-document-viewer-screen="approved-theme-v1" data-case-id={activeCase.id}>
      <form className="document-account-lookup" aria-label="Find customer documents by Account ID" onSubmit={searchByAccountId}>
        <div>
          <p>Account document lookup</p>
          <h3>Search for a customer account</h3>
          <span>Enter the exact Account ID shown in Case Briefing or Customer 360. Documents remain hidden until a case match is found.</span>
        </div>
        <label>
          <span>Account ID</span>
          <input
            value={accountLookup}
            onChange={(event) => setAccountLookup(event.target.value)}
            placeholder="ACCT-00000-0000"
            aria-label="Search by Account ID"
            autoComplete="off"
          />
        </label>
        <button type="submit">Search account</button>
        <div className={`document-account-lookup-result ${accessGranted ? 'matched' : ''}`} aria-live="polite">
          {accessGranted ? <><strong>{activeCase.person}</strong><span>{activeCase.accountId} | {activeCase.id}</span></> : lookupError || 'No customer documents are open.'}
        </div>
      </form>

      {!accessGranted ? (
        <section className="document-viewer-locked" role="status">
          <span aria-hidden="true">ID</span>
          <h3>Customer documents are locked</h3>
          <p>Search with an exact Account ID to open the matching case documents.</p>
        </section>
      ) : <>
      <section className="document-viewer-findbar" aria-label="Filter matched customer documents">
        <label>
          <span>Filter documents</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, reference, account, EIN, address, phone, status, or extracted field..."
            aria-label="Search Document Viewer records"
          />
        </label>
        <label>
          <span>Document status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter documents by status">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className="document-viewer-request-button" onClick={() => openTool('Document Request')}>Request Paperwork</button>
        <span aria-live="polite">{filteredDocuments.length} of {documents.length} documents shown</span>
      </section>

      <div className="document-viewer-layout" data-mobile-pane={mobilePane}>
        <nav className="document-folder-nav" aria-label="Document folders">
          <p>Mailboxes</p>
          {folders.map((item) => {
            const count = item === 'All Documents' ? documents.length : documents.filter((document) => document.folder === item).length;
            return (
              <button key={item} type="button" className={folder === item ? 'active' : ''} onClick={() => { setFolder(item); setMobilePane('inbox'); }}>
                <span>{item}</span><strong>{count}</strong>
              </button>
            );
          })}
          <button type="button" className="document-folder-request" onClick={() => openTool('Document Request')}>＋ Request Paperwork</button>
        </nav>
        <section className="document-record-browser" aria-label="Document records">
          <header><p>Case inbox</p><h3>{filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'}</h3></header>
          <div className="document-record-list">
            {filteredDocuments.map((document) => (
              <article
                key={document.id}
                className={activeDocument?.id === document.id ? 'active' : ''}
                data-document-record={document.id}
              >
                <button type="button" className="document-record-open" onClick={() => openDocument(document.id)}>
                  <span>{document.folder}</span>
                  <strong>{document.title}</strong>
                  <small>{document.reference}</small>
                  <em>{document.status} | {document.pages.length || 'No'} page{document.pages.length === 1 ? '' : 's'}</em>
                </button>
                <button
                  type="button"
                  className="document-record-compare"
                  aria-pressed={compareIds.includes(document.id)}
                  onClick={() => toggleCompare(document.id)}
                >
                  {compareIds.includes(document.id) ? 'Remove' : 'Compare'}
                </button>
              </article>
            ))}
            {!filteredDocuments.length && <div className="document-viewer-empty" role="status">No documents match the current folder, status, and search.</div>}
          </div>
        </section>

        <main className="document-preview-workspace" aria-label="Document preview">
          {activeDocument ? (
            <>
              <header className="document-preview-toolbar">
                <button type="button" className="document-mobile-back" onClick={() => setMobilePane('inbox')}>‹ Inbox</button>
                <div>
                  <p>{activeDocument.type}</p>
                  <h3>{activeDocument.title}</h3>
                  <span>{activeDocument.id} | {activeDocument.reference}</span>
                </div>
                <div className="document-toolbar-actions">
                  <button type="button" onClick={() => pin(`${activeDocument.id} | ${activeDocument.title}`)}>Pin</button>
                  <button type="button" aria-pressed={compareIds.includes(activeDocument.id)} onClick={() => toggleCompare(activeDocument.id)}>Compare</button>
                  <button type="button" onClick={exportDocument}>Export</button>
                </div>
              </header>

              <section className="document-page-controls" aria-label="Document page controls">
                <button type="button" disabled={pageIndex <= 0} onClick={() => setPageIndex((current) => Math.max(0, current - 1))}>Previous page</button>
                <span>Page {activeDocument.pages.length ? pageIndex + 1 : 0} of {activeDocument.pages.length}</span>
                <button type="button" disabled={pageIndex >= activeDocument.pages.length - 1} onClick={() => setPageIndex((current) => Math.min(activeDocument.pages.length - 1, current + 1))}>Next page</button>
                <div>
                  <button type="button" aria-label="Zoom out document" disabled={zoom <= 80} onClick={() => setZoom((current) => Math.max(80, current - 10))}>-</button>
                  <span>{zoom}%</span>
                  <button type="button" aria-label="Zoom in document" disabled={zoom >= 120} onClick={() => setZoom((current) => Math.min(120, current + 10))}>+</button>
                </div>
              </section>

              <div className="document-page-stage">
                {activePage ? (
                  <DocumentPage document={activeDocument} page={activePage} pageNumber={pageIndex + 1} zoom={zoom} />
                ) : (
                  <div className="document-not-received" role="status">
                    <span>Document not received</span>
                    <h3>{activeDocument.title}</h3>
                    <p>This request remains visible for workflow tracking, but there is no document page to display.</p>
                    <button type="button" onClick={() => openTool('Document Request')}>Open Document Request</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="document-viewer-empty" role="status">Choose a document to open its viewer.</div>
          )}
        </main>

        {activeDocument && (
          <aside className="document-inspector" aria-label="Document details">
            <section className="document-status-block">
              <header><p>Document status</p><span>{activeDocument.reviewStatus}</span></header>
              <dl>
                <div><dt>Case</dt><dd>{activeDocument.caseId}</dd></div>
                <div><dt>Account ID</dt><dd>{activeDocument.accountId}</dd></div>
                <div><dt>Customer / entity</dt><dd>{activeDocument.customer}</dd></div>
                <div><dt>Claim type</dt><dd>{activeDocument.claimType}</dd></div>
                <div><dt>Source</dt><dd>{activeDocument.source}</dd></div>
                <div><dt>Received</dt><dd>{activeDocument.received}</dd></div>
                <div><dt>Request status</dt><dd>{activeDocument.requestStatus}</dd></div>
                {activeDocument.requestDueDate && <div><dt>Request due</dt><dd>{activeDocument.requestDueDate}</dd></div>}
                {activeDocument.requestDeliveryChannel && <div><dt>Request delivery</dt><dd>{activeDocument.requestDeliveryChannel}</dd></div>}
                <div><dt>Extraction confidence</dt><dd>{activeDocument.extractionConfidence}</dd></div>
                <div><dt>Quality review</dt><dd>{activeDocument.authenticity}</dd></div>
              </dl>
            </section>

            <section className="document-extracted-fields">
              <header><p>Extracted fields</p><span>{activeDocument.fields.length}</span></header>
              <dl>{activeDocument.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </section>

            <section className="document-review-note">
              <p>Investigator notes</p>
              <span>{activeDocument.investigatorNote}</span>
              <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Record what this document proves, contradicts, or leaves unresolved..." aria-label="Document investigator note" />
              <div><button type="button" disabled={!noteDraft.trim()} onClick={saveDocumentNote}>Save note</button><button type="button" onClick={addDocumentToSummary}>Add to summary</button></div>
            </section>

            <section className="document-training-tip">
              <p>Training tip</p>
              <span>{activeDocument.trainingTip}</span>
            </section>

            <section className="document-related-records">
              <p>Related evidence</p>
              <div>{activeDocument.relatedEvidence.map((item) => <button key={item} type="button" onClick={() => pin(item)}>{item}</button>)}</div>
              <p>Related tools</p>
              <div>{activeDocument.relatedTools.map((item) => <button key={item} type="button" onClick={() => openTool(item)}>{item}</button>)}</div>
            </section>
          </aside>
        )}
      </div>

      <section className="document-compare-workspace" aria-label="Document comparison">
        <header>
          <div><p>Compare mode</p><h3>Document field comparison</h3></div>
          <span>{comparedDocuments.length}/2 selected</span>
        </header>
        {comparedDocuments.length ? (
          <div className="document-compare-grid">
            {comparedDocuments.map((document) => (
              <article key={document.id}>
                <header><span>{document.type}</span><h4>{document.title}</h4><button type="button" onClick={() => toggleCompare(document.id)}>Remove</button></header>
                <dl>
                  <div><dt>Reference</dt><dd>{document.reference}</dd></div>
                  <div><dt>Name / entity</dt><dd>{fieldValue(document, 'Name') !== 'Not recorded' ? fieldValue(document, 'Name') : fieldValue(document, 'Customer name') !== 'Not recorded' ? fieldValue(document, 'Customer name') : fieldValue(document, 'Legal business name')}</dd></div>
                  <div><dt>Address</dt><dd>{fieldValue(document, 'Address') !== 'Not recorded' ? fieldValue(document, 'Address') : fieldValue(document, 'Service address')}</dd></div>
                  <div><dt>Status</dt><dd>{document.reviewStatus}</dd></div>
                  <div><dt>Source</dt><dd>{document.source}</dd></div>
                  <div><dt>Summary</dt><dd>{document.summary}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="document-compare-empty">Select Compare on up to two documents to review their identity, address, source, status, and summary side by side.</p>
        )}
      </section>

      <nav className="investigation-tool-next-routes" aria-label="Document Viewer next routes">
        <button type="button" onClick={() => openTool('Document Request')}>Open Document Request</button>
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Document Viewer review</strong>
          <span>Review the relevant pages, extracted fields, source, request status, and related evidence before marking the viewer complete.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Document Viewer')}>
          {reviewed ? 'Document Viewer reviewed' : 'Mark Document Viewer reviewed'}
        </button>
      </footer>
      </>}
    </div>
  );
}
