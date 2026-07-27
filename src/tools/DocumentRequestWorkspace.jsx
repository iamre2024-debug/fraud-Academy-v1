import { useEffect, useState } from 'react';
import { getCaseDocuments } from '../data/documentRecords.js';
import {
  applyCustomerResponse,
  buildPaperworkInboxRecords,
  createPaperworkAttempt,
  getPaperworkRequestTemplates,
} from '../data/documentRequestWorkflow.js';
import { queueDocumentViewerRoute } from '../documentViewerRoute.js';

const documentRequestStatuses = ['All', 'Not Requested', 'Requested', 'Received', 'Incomplete', 'Received Late', 'No Response', 'Pending Review', 'Approved', 'Rejected', 'Expired', 'Missing', 'Exception Approved'];

function documentRequestSearchText(request) {
  return Object.values(request).filter(Boolean).join(' ').toLowerCase();
}

export default function DocumentRequestWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  documentRequests,
  setDocumentRequestsByCase,
  recordAction,
}) {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDocumentId, setComposeDocumentId] = useState('');
  const [composeReason, setComposeReason] = useState('Please provide this paperwork so the disputed claim can be reviewed.');
  const [composeChannel, setComposeChannel] = useState('Secure upload link');
  const [composeDueDate, setComposeDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return due.toISOString().slice(0, 10);
  });
  const [mobilePane, setMobilePane] = useState('inbox');
  const [requestConfirmation, setRequestConfirmation] = useState('');
  const requestTemplates = getPaperworkRequestTemplates(activeCase);
  const requests = buildPaperworkInboxRecords(activeCase, documentRequests);
  const merchantDocuments = getCaseDocuments(activeCase).filter((document) => document.folder === 'Merchant Evidence' && document.pages?.length);
  const firstMerchantDocument = merchantDocuments[0];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRequests = requests.filter((request) => (
    (statusFilter === 'All' || request.status === statusFilter)
    && (!normalizedQuery || documentRequestSearchText(request).includes(normalizedQuery))
  ));
  const activeRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0];
  const counts = documentRequestStatuses.slice(1).map((status) => [status, requests.filter((request) => request.status === status).length]);

  useEffect(() => {
    setSelectedRequestId('');
    setStatusFilter('All');
    setComposeOpen(false);
    setComposeDocumentId('');
    setMobilePane('inbox');
    setRequestConfirmation('');
  }, [activeCase.id]);

  function saveRequestNote(message) {
    saveNote(`Document Request: ${message}`, 'Document request');
  }

  function openComposer(request) {
    const requestedSourceId = request?.sourceDocumentId;
    const sourceDocumentId = requestTemplates.some((item) => item.id === requestedSourceId)
      ? requestedSourceId
      : requestTemplates[0]?.id ?? '';
    const requestedTitle = request?.requestedDocumentType ?? request?.documentType ?? requestTemplates[0]?.title ?? 'this paperwork';
    setComposeDocumentId(sourceDocumentId);
    setComposeReason(['Incomplete', 'No Response'].includes(request?.status)
      ? `Please provide a complete copy of ${requestedTitle}, including every page and visible reference.`
      : 'Please provide this paperwork so the disputed claim can be reviewed.');
    setComposeChannel(request?.requestDeliveryChannel === 'Not sent' ? 'Secure upload link' : request?.requestDeliveryChannel ?? 'Secure upload link');
    setComposeOpen(true);
    setMobilePane('compose');
    setRequestConfirmation('');
  }

  function submitPaperworkRequest(event) {
    event.preventDefault();
    const document = requestTemplates.find((request) => request.id === composeDocumentId);
    if (!document || !composeReason.trim()) return;
    const requestedDate = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const dueDate = composeDueDate
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${composeDueDate}T12:00:00`))
      : 'Follow-up date not supplied';
    const attempt = createPaperworkAttempt({
      activeCase,
      document,
      reason: composeReason.trim(),
      dueDate,
      requestedDate,
      deliveryChannel: composeChannel,
    });
    setDocumentRequestsByCase((current) => ({
      ...current,
      [activeCase.id]: {
        ...(current[activeCase.id] ?? {}),
        [document.id]: {
          schemaVersion: 2,
          sourceDocumentId: document.id,
          attempts: [...(current[activeCase.id]?.[document.id]?.attempts ?? []), attempt],
        },
      },
    }));
    setSelectedRequestId(attempt.requestId);
    setStatusFilter('All');
    setComposeOpen(false);
    setMobilePane('reader');
    setRequestConfirmation(`${document.title} request sent to ${activeCase.person ?? 'the customer'} through ${composeChannel}.`);
    saveRequestNote(`${document.title} requested from ${activeCase.person ?? 'the customer'} through ${composeChannel}; follow-up due ${dueDate}.`);
  }

  function checkCustomerResponse(request = activeRequest) {
    if (!request || request.recordKind !== 'outbound-request' || request.status !== 'Requested' || request.responseCheckedAt) return;
    const sourceDocument = requestTemplates.find((item) => item.id === request.sourceDocumentId);
    if (!sourceDocument) return;
    const checkedAt = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const currentAttempt = documentRequests[request.sourceDocumentId]?.attempts?.find((attempt) => attempt.attemptId === request.attemptId);
    if (!currentAttempt) return;
    const updatedAttempt = applyCustomerResponse({ activeCase, document: sourceDocument, attempt: currentAttempt, checkedAt });
    setDocumentRequestsByCase((current) => ({
      ...current,
      [activeCase.id]: (() => {
        const caseRequests = current[activeCase.id] ?? {};
        const documentState = caseRequests[request.sourceDocumentId] ?? { schemaVersion: 2, sourceDocumentId: request.sourceDocumentId, attempts: [] };
        const attempts = documentState.attempts.map((attempt) => attempt.attemptId === request.attemptId ? updatedAttempt : attempt);
        return { ...caseRequests, [request.sourceDocumentId]: { ...documentState, attempts } };
      })(),
    }));
    setSelectedRequestId(updatedAttempt.responseId || updatedAttempt.requestId);
    setStatusFilter('All');
    setMobilePane('reader');
    const confirmation = updatedAttempt.responseStatus === 'No Response'
      ? `${sourceDocument.title}: no customer response was received for this scenario.`
      : updatedAttempt.responseStatus === 'Incomplete'
        ? `${sourceDocument.title} received from the customer, but the submission is incomplete.`
        : updatedAttempt.responseStatus === 'Received Late'
          ? `${sourceDocument.title} received from the customer after the follow-up date.`
          : `${sourceDocument.title} received from the customer and added as a separate Document Viewer record.`;
    setRequestConfirmation(confirmation);
    saveRequestNote(`${sourceDocument.title} response check recorded: ${updatedAttempt.responseStatus}.`);
  }

  function openRequest(requestId) {
    setSelectedRequestId(requestId);
    setComposeOpen(false);
    setMobilePane('reader');
    setRequestConfirmation('');
  }

  function openDocumentViewerRoute({ folder = 'All Documents', documentId = '', pane = 'inbox' } = {}) {
    queueDocumentViewerRoute({ caseId: activeCase.id, folder, documentId, pane });
    openTool('Document Viewer');
  }

  function openMerchantPaperwork() {
    openDocumentViewerRoute({
      folder: 'Merchant Evidence',
      documentId: firstMerchantDocument?.id ?? '',
      pane: firstMerchantDocument ? 'reader' : 'inbox',
    });
  }

  return (
    <>
      <section className="document-request-findbar" aria-label="Find document request information">
        <div>
          <p>Paperwork inbox</p>
          <h3>Send, track, and review case paperwork without leaving the active claim.</h3>
        </div>
        <label>
          <span>Search Document Request</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: affidavit, cancellation, required, missing, Document Viewer..."
            aria-label="Search Document Request records"
          />
        </label>
        <span aria-live="polite">{filteredRequests.length} of {requests.length} requests shown</span>
      </section>

      {requestConfirmation && <div className="document-request-confirmation" role="status">✓ {requestConfirmation}</div>}

      <div className="document-request-inbox" data-mobile-pane={composeOpen ? 'compose' : mobilePane}>
        <aside className="document-request-statuses" aria-label="Document request statuses">
          <button type="button" className="document-request-compose-button" onClick={() => openComposer()} disabled={!requestTemplates.length}>＋ Request Paperwork</button>
          <p>Mailboxes</p>
          {documentRequestStatuses.map((status) => {
            const count = status === 'All' ? requests.length : requests.filter((request) => request.status === status).length;
            if (status !== 'All' && count === 0) return null;
            return <button key={status} type="button" className={statusFilter === status ? 'active' : ''} onClick={() => { setStatusFilter(status); setMobilePane('inbox'); }}>{status === 'All' ? 'All paperwork' : status}<strong>{count}</strong></button>;
          })}
          {firstMerchantDocument && <button type="button" className="document-request-viewer-route merchant-paperwork-route" onClick={openMerchantPaperwork}>View Merchant Paperwork <strong>{merchantDocuments.length}</strong></button>}
          <button type="button" className="document-request-viewer-route" onClick={() => openDocumentViewerRoute()}>Open All Documents</button>
        </aside>

        <section className="document-request-list" aria-label="Document request records">
            <header>
              <p>{statusFilter === 'All' ? 'All paperwork' : statusFilter}</p>
              <h3>{filteredRequests.length} conversation{filteredRequests.length === 1 ? '' : 's'}</h3>
            </header>
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={request.id === activeRequest.id ? 'active' : ''}
                onClick={() => openRequest(request.id)}
                data-document-request={request.id}
              >
                <span className={`document-request-status-dot status-${request.status.toLowerCase().replace(/\s+/g, '-')}`} aria-hidden="true"></span>
                <span className="document-request-message-copy"><strong>{request.documentType}</strong><small>{request.status === 'Not Requested' ? 'Not sent' : request.pagesAvailable ? `From: ${request.sender}` : `To: ${request.recipient}`} · {request.requirement}</small><em>{request.reason}</em></span>
                <span className="document-request-message-meta"><small>{request.status}</small><time>{request.recordKind === 'customer-submission' ? request.receivedDate : request.requestedDate}</time></span>
              </button>
            ))}
            {!filteredRequests.length && <div className="investigation-tool-empty" role="status">No document requests match this filter or search.</div>}
          </section>

        <section className="document-request-detail" aria-label={composeOpen ? 'Compose paperwork request' : 'Expanded document request detail'}>
          {composeOpen ? (
            <form className="document-request-compose" onSubmit={submitPaperworkRequest}>
              <header>
                <button type="button" className="document-request-mobile-back" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>‹ Back</button>
                <div><p>New request</p><h3>Request Paperwork</h3><span>This creates a saved request on {activeCase.id}.</span></div>
              </header>
              <label><span>To</span><input value={activeCase.person ?? 'Customer on the active case'} readOnly aria-label="Paperwork request recipient" /></label>
              <label><span>Paperwork</span><select value={composeDocumentId || requestTemplates[0]?.id || ''} onChange={(event) => setComposeDocumentId(event.target.value)} aria-label="Paperwork to request">{requestTemplates.map((request) => <option key={request.id} value={request.id}>{request.title}</option>)}</select></label>
              <label><span>Delivery method</span><select value={composeChannel} onChange={(event) => setComposeChannel(event.target.value)} aria-label="Paperwork request delivery method"><option>Secure upload link</option><option>Email</option><option>Mail</option><option>Customer service follow-up</option></select></label>
              <label><span>Follow-up due</span><input type="date" value={composeDueDate} onChange={(event) => setComposeDueDate(event.target.value)} aria-label="Paperwork request due date" /></label>
              <label className="document-request-compose-reason"><span>Message / reason</span><textarea value={composeReason} onChange={(event) => setComposeReason(event.target.value)} aria-label="Paperwork request reason" /></label>
              <div className="document-request-compose-actions"><button type="button" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>Cancel</button><button type="submit" className="primary" disabled={!composeDocumentId && !requestTemplates[0]?.id}>Send Request</button></div>
            </form>
          ) : activeRequest ? (<>
            <header>
              <button type="button" className="document-request-mobile-back" onClick={() => setMobilePane('inbox')}>‹ Inbox</button>
              <div>
                <p>Paperwork conversation</p>
                <h3>{activeRequest.documentType}</h3>
                <span>{activeRequest.id} · {activeRequest.status}</span>
              </div>
              <button type="button" onClick={() => pin(`${activeRequest.id} · ${activeRequest.documentType}`)}>Pin request</button>
            </header>
            {activeRequest.status === 'Not Requested' ? (
              <section className="document-request-not-sent" role="status">
                <span>Not requested</span>
                <h4>No paperwork request has been sent.</h4>
                <p>The customer has not been contacted for this item. Send a request only when the claim scenario requires this evidence.</p>
                <button type="button" onClick={() => openComposer(activeRequest)}>Request this paperwork</button>
              </section>
            ) : activeRequest.pagesAvailable ? (<>
              <section className="document-request-message-header"><dl><div><dt>From</dt><dd>{activeRequest.sender}</dd></div><div><dt>To</dt><dd>Fraud Academy Chargebacks</dd></div><div><dt>Received</dt><dd>{activeRequest.receivedDate}</dd></div><div><dt>Source</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
              <article className="document-request-message-body inbound">{activeRequest.unread && <span className="document-request-unread">New customer submission</span>}<p>Customer-submitted paperwork received for case <strong>{activeRequest.linkedCase}</strong>.</p><p>{activeRequest.reason}</p><p>Open the source document below and review the actual page before recording what it supports or leaves unresolved.</p></article>
            </>) : activeRequest.status === 'No Response' ? (<>
              <section className="document-request-message-header"><dl><div><dt>Request sent to</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Follow-up checked</dt><dd>{activeRequest.responseCheckedAt}</dd></div><div><dt>Result</dt><dd>No customer submission</dd></div></dl></section>
              <article className="document-request-message-body"><p>No document was returned after this request was checked.</p><p>The request history stays visible, but there is no source page to review for this scenario.</p></article>
            </>) : (<>
              <section className="document-request-message-header"><dl><div><dt>From</dt><dd>Fraud Academy Document Services</dd></div><div><dt>To</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Delivery</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
              <article className="document-request-message-body"><p>Hello {activeRequest.recipient},</p><p>{activeRequest.reason}</p><p>Please submit the requested paperwork by <strong>{activeRequest.dueDate}</strong>. The request is now waiting for the scenario customer to respond; no document is created by the agent.</p><p>Thank you,<br />Fraud Academy Document Services</p></article>
            </>)}
            <dl>
              {[
                ['Document type', activeRequest.documentType],
                ['Required / optional', activeRequest.requirement],
                ['Due date', activeRequest.dueDate],
                ['Status', activeRequest.status],
                ['Authenticity flag', activeRequest.authenticity],
                ['Linked case', activeRequest.linkedCase],
                ['Linked tool', activeRequest.linkedTool],
                ['Received date', activeRequest.receivedDate],
                ...(activeRequest.responseCheckedAt ? [['Response checked', activeRequest.responseCheckedAt]] : []),
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <article className="document-request-notes">
              <span>Reviewer notes</span>
              <p>{activeRequest.reviewerNotes}</p>
              <small>{activeRequest.fields}</small>
            </article>
            <div className="document-request-actions">
              <button type="button" onClick={() => saveRequestNote(`${activeRequest.id} follow-up recorded for ${activeRequest.status}.`)}>Save follow-up note</button>
              {activeRequest.recordKind === 'outbound-request' && activeRequest.status === 'Requested' && !activeRequest.responseCheckedAt && <button type="button" className="document-request-check-response" onClick={() => checkCustomerResponse(activeRequest)}>Check for Customer Response</button>}
              {['Not Requested', 'Incomplete', 'No Response'].includes(activeRequest.status) && <button type="button" onClick={() => openComposer(activeRequest)}>{activeRequest.status === 'Not Requested' ? 'Request paperwork' : 'Request again'}</button>}
              {activeRequest.pagesAvailable && <button type="button" onClick={() => openDocumentViewerRoute({ folder: activeRequest.category, documentId: activeRequest.documentViewerId, pane: 'reader' })}>Open Customer Document</button>}
              {firstMerchantDocument && <button type="button" onClick={openMerchantPaperwork}>View Merchant Paperwork</button>}
            </div>
          </>) : <div className="investigation-tool-empty" role="status">No document requests are available for this case.</div>}
        </section>
      </div>

      <section className="document-request-summary" aria-label="Document request workflow summary">
        {counts.filter(([, count]) => count > 0).map(([status, count]) => <article key={status}><span>{status}</span><strong>{count}</strong></article>)}
      </section>

      <nav className="investigation-tool-next-routes" aria-label="Document request next routes">
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Document Request review</strong>
          <span>Review completion records workflow progress only. It does not determine the case outcome.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Document Request')}>
          {reviewed ? '✓ Document Request reviewed' : 'Mark Document Request reviewed'}
        </button>
      </footer>
    </>
  );
}
