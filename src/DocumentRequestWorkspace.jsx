import { useEffect, useMemo, useState } from 'react';
import { getCaseDocumentRequests } from './data/documentRecords.js';
import { queueDocumentViewerRoute } from './documentViewerRoute.js';

const REQUEST_STATUS_FILTERS = ['All', 'Not Requested', 'Awaiting', 'Overdue', 'Received', 'Incomplete', 'Received Late', 'No Response'];
const RECEIVED_STATUSES = new Set(['Received', 'Incomplete', 'Received Late', 'Approved', 'Pending Review']);
const REMINDER_STATUSES = new Set(['Awaiting', 'Overdue', 'No Response']);

function uniqueId(prefix) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${randomPart}`;
}

function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function futureDateInput(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateInput(date);
}

function displayDate(value, fallback = '—') {
  if (!value || value === 'Not received' || value === 'Not applicable') return fallback;
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function displayDateTime(value, fallback = '—') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function dueDateHasPassed(value) {
  if (!value) return false;
  const due = new Date(String(value).length === 10 ? `${value}T23:59:59` : value);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}

function attemptsForDocument(savedRequests = {}, documentId = '') {
  const direct = savedRequests?.[documentId];
  if (Array.isArray(direct)) return direct;
  if (Array.isArray(direct?.attempts)) return direct.attempts;
  if (direct?.attemptId || direct?.requestId) return [direct];

  return Object.values(savedRequests ?? {}).flatMap((entry) => {
    if (Array.isArray(entry)) {
      return entry.filter((attempt) => attempt?.sourceDocumentId === documentId);
    }
    if (Array.isArray(entry?.attempts)) {
      return entry.attempts.filter((attempt) => (
        attempt?.sourceDocumentId === documentId
        || entry?.sourceDocumentId === documentId
      ));
    }
    if ((entry?.attemptId || entry?.requestId) && entry?.sourceDocumentId === documentId) return [entry];
    return [];
  });
}

function latestAttempt(attempts = []) {
  return attempts.at(-1) ?? null;
}

function attemptReceivedPages(attempt = {}) {
  return attempt?.customerSubmission?.pages?.length ?? 0;
}

function attemptFileCount(attempt = {}) {
  const manuallyRecorded = Number(attempt.manualReceipt?.fileCount ?? attempt.fileCount);
  if (Number.isFinite(manuallyRecorded) && manuallyRecorded >= 0) return manuallyRecorded;
  return attemptReceivedPages(attempt);
}

function latestReminder(attempt = {}) {
  const reminders = Array.isArray(attempt?.reminders) ? attempt.reminders : [];
  return reminders.at(-1)?.sentAt ?? attempt?.lastReminderAt ?? '';
}

function sourceDocumentStatus(document = {}) {
  const status = document.requestStatus ?? document.status ?? '';
  if (document.pages?.length) {
    if (status === 'Incomplete') return 'Incomplete';
    if (status === 'Received Late') return 'Received Late';
    return 'Received';
  }
  return 'Not Requested';
}

function requestRow(document, savedRequests) {
  const attempts = attemptsForDocument(savedRequests, document.id);
  const attempt = latestAttempt(attempts);
  const responseStatus = attempt?.manualReceipt?.status ?? attempt?.responseStatus ?? '';
  let status = sourceDocumentStatus(document);

  if (attempt) {
    if (responseStatus === 'No Response') status = 'No Response';
    else if (RECEIVED_STATUSES.has(responseStatus)) status = responseStatus;
    else status = dueDateHasPassed(attempt.dueDateIso ?? attempt.dueDate) ? 'Overdue' : 'Awaiting';
  }

  const sourcePages = document.pages?.length ?? 0;
  const receivedFiles = attempt && RECEIVED_STATUSES.has(responseStatus)
    ? attemptFileCount(attempt)
    : sourcePages;
  const receivedDate = attempt && RECEIVED_STATUSES.has(responseStatus)
    ? attempt.manualReceipt?.receivedDate ?? attempt.receivedDate
    : sourcePages
      ? document.received
      : '';
  const viewerDocumentId = attemptReceivedPages(attempt)
    ? attempt.responseId
    : sourcePages
      ? document.id
      : '';

  return {
    id: document.id,
    document,
    attempts,
    attempt,
    title: document.title,
    type: document.type,
    category: document.folder,
    status,
    requestDate: attempt?.requestedAt ?? attempt?.requestedDate ?? '',
    dueDate: attempt?.dueDateIso ?? attempt?.dueDate ?? '',
    receivedDate,
    fileCount: receivedFiles,
    lastReminderAt: latestReminder(attempt),
    viewerDocumentId,
    hasViewerPages: Boolean(viewerDocumentId),
    manualReceiptOnly: Boolean(attempt?.manualReceipt) && !attemptReceivedPages(attempt),
    searchable: [
      document.id,
      document.title,
      document.type,
      document.folder,
      document.summary,
      status,
      attempt?.reason,
      attempt?.requestDeliveryChannel,
      attempt?.manualReceipt?.note,
    ].filter(Boolean).join(' ').toLowerCase(),
  };
}

function statusClass(status) {
  return `status-${String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function requestStateForDocument(caseRequests, documentId) {
  const existing = caseRequests?.[documentId];
  if (Array.isArray(existing)) {
    return {
      schemaVersion: 3,
      sourceDocumentId: documentId,
      attempts: existing,
    };
  }
  if (Array.isArray(existing?.attempts)) {
    return {
      ...existing,
      schemaVersion: Math.max(3, Number(existing.schemaVersion) || 0),
      sourceDocumentId: existing.sourceDocumentId ?? documentId,
      attempts: existing.attempts,
    };
  }
  if (existing?.attemptId || existing?.requestId) {
    return {
      schemaVersion: 3,
      sourceDocumentId: documentId,
      attempts: [existing],
    };
  }
  const migratedAttempts = attemptsForDocument(caseRequests, documentId);
  return {
    schemaVersion: 3,
    sourceDocumentId: documentId,
    attempts: migratedAttempts,
  };
}

function SummaryCard({ icon, label, count, tone }) {
  return (
    <article className={`document-request-v2-summary-card tone-${tone}`}>
      <span aria-hidden="true">{icon}</span>
      <div><strong>{count}</strong><small>{label}</small></div>
    </article>
  );
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
  documentRequests = {},
  setDocumentRequestsByCase,
  recordAction,
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [requestDialog, setRequestDialog] = useState(null);
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const sourceDocuments = useMemo(() => getCaseDocumentRequests(activeCase), [activeCase]);
  const rows = useMemo(
    () => sourceDocuments.map((document) => requestRow(document, documentRequests)),
    [documentRequests, sourceDocuments],
  );
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  const filteredRows = rows.filter((row) => (
    (statusFilter === 'All' || row.status === statusFilter)
    && (!normalizedQuery || row.searchable.includes(normalizedQuery))
  ));
  const counts = {
    requested: rows.filter((row) => row.status !== 'Not Requested').length,
    received: rows.filter((row) => RECEIVED_STATUSES.has(row.status)).length,
    awaiting: rows.filter((row) => row.status === 'Awaiting').length,
    overdue: rows.filter((row) => row.status === 'Overdue').length,
  };

  useEffect(() => {
    setStatusFilter('All');
    setRequestDialog(null);
    setReceiptDialog(null);
    setNotice('');
  }, [activeCase.id]);

  function updateAttempt(documentId, attemptId, updater) {
    setDocumentRequestsByCase((current) => {
      const caseRequests = current[activeCase.id] ?? {};
      const documentState = requestStateForDocument(caseRequests, documentId);
      const attempts = documentState.attempts.map((attempt) => (
        attempt.attemptId === attemptId ? updater(attempt) : attempt
      ));
      return {
        ...current,
        [activeCase.id]: {
          ...caseRequests,
          [documentId]: { ...documentState, attempts },
        },
      };
    });
  }

  function appendAttempt(documentId, attempt) {
    setDocumentRequestsByCase((current) => {
      const caseRequests = current[activeCase.id] ?? {};
      const documentState = requestStateForDocument(caseRequests, documentId);
      return {
        ...current,
        [activeCase.id]: {
          ...caseRequests,
          [documentId]: {
            ...documentState,
            attempts: [...documentState.attempts, attempt],
          },
        },
      };
    });
  }

  function openRequestDialog(row = rows.find((item) => item.status === 'Not Requested') ?? rows[0]) {
    if (!row) return;
    setReceiptDialog(null);
    setRequestDialog({
      documentId: row.id,
      deliveryChannel: 'Secure upload link',
      dueDate: futureDateInput(3),
      reason: `Please provide a complete copy of ${row.title}, including every page and visible reference.`,
    });
    setNotice('');
  }

  function submitRequest(event) {
    event.preventDefault();
    const document = sourceDocuments.find((item) => item.id === requestDialog?.documentId);
    const reason = requestDialog?.reason?.trim();
    if (!document || !reason) return;
    const now = new Date();
    const attemptId = uniqueId('ATT');
    const attempt = {
      schemaVersion: 3,
      attemptId,
      requestId: `${document.id}-REQ-${attemptId.replace(/^ATT-/, '')}`,
      responseId: '',
      sourceDocumentId: document.id,
      documentTitle: document.title,
      category: document.folder,
      reason,
      dueDate: displayDate(requestDialog.dueDate),
      dueDateIso: requestDialog.dueDate,
      requestedDate: displayDateTime(now.toISOString()),
      requestedAt: now.toISOString(),
      recipient: activeCase.person ?? 'Customer on the active case',
      requestDeliveryChannel: requestDialog.deliveryChannel,
      responseOutcome: '',
      responseStatus: '',
      responseCheckedAt: '',
      responseChannel: '',
      receivedDate: 'Not received',
      fileCount: 0,
      customerSubmission: null,
      manualReceipt: null,
      reminders: [],
      unread: false,
      reviewerNotes: 'Manual paperwork request recorded. No customer response or document was created by this action.',
    };
    appendAttempt(document.id, attempt);
    const message = `${document.title} requested through ${requestDialog.deliveryChannel}; due ${displayDate(requestDialog.dueDate)}.`;
    setRequestDialog(null);
    setNotice(message);
    saveNote?.(`Document Request: ${message}`, 'Document request');
    recordAction?.('Sent document request', message, 'Document Request');
  }

  function sendReminder(row, { quiet = false } = {}) {
    if (!row?.attempt || !REMINDER_STATUSES.has(row.status)) return false;
    const sentAt = new Date().toISOString();
    const reminder = {
      id: uniqueId('REM'),
      sentAt,
      channel: row.attempt.requestDeliveryChannel ?? 'Secure upload link',
      message: `Reminder sent for ${row.title}.`,
    };
    updateAttempt(row.id, row.attempt.attemptId, (attempt) => ({
      ...attempt,
      reminders: [...(attempt.reminders ?? []), reminder],
      lastReminderAt: sentAt,
    }));
    if (!quiet) {
      const message = `${row.title} reminder sent through ${reminder.channel}.`;
      setNotice(message);
      saveNote?.(`Document Request: ${message}`, 'Document request');
      recordAction?.('Sent document reminder', message, 'Document Request');
    }
    return true;
  }

  function sendAllReminders() {
    const eligibleRows = rows.filter((row) => row.attempt && REMINDER_STATUSES.has(row.status));
    if (!eligibleRows.length) {
      setNotice('No awaiting or overdue requests currently need a reminder.');
      return;
    }
    const sentAt = new Date().toISOString();
    setDocumentRequestsByCase((current) => {
      const caseRequests = current[activeCase.id] ?? {};
      const nextCaseRequests = { ...caseRequests };
      eligibleRows.forEach((row) => {
        const documentState = requestStateForDocument(nextCaseRequests, row.id);
        nextCaseRequests[row.id] = {
          ...documentState,
          attempts: documentState.attempts.map((attempt) => (
            attempt.attemptId === row.attempt.attemptId
              ? {
                  ...attempt,
                  lastReminderAt: sentAt,
                  reminders: [
                    ...(attempt.reminders ?? []),
                    {
                      id: uniqueId('REM'),
                      sentAt,
                      channel: attempt.requestDeliveryChannel ?? 'Secure upload link',
                      message: `Reminder sent for ${row.title}.`,
                    },
                  ],
                }
              : attempt
          )),
        };
      });
      return { ...current, [activeCase.id]: nextCaseRequests };
    });
    const message = `${eligibleRows.length} document reminder${eligibleRows.length === 1 ? '' : 's'} sent.`;
    setNotice(message);
    saveNote?.(`Document Request: ${message}`, 'Document request');
    recordAction?.('Sent document reminders', message, 'Document Request');
  }

  function openReceiptDialog(row) {
    if (!row?.attempt) return;
    setRequestDialog(null);
    setReceiptDialog({
      documentId: row.id,
      attemptId: row.attempt.attemptId,
      status: 'Received',
      receivedDate: localDateInput(),
      fileCount: Math.max(1, Number(row.fileCount) || 1),
      note: '',
    });
    setNotice('');
  }

  function recordReceipt(event) {
    event.preventDefault();
    const row = rows.find((item) => item.id === receiptDialog?.documentId);
    if (!row?.attempt) return;
    const recordedAt = new Date().toISOString();
    const fileCount = Math.max(0, Number.parseInt(receiptDialog.fileCount, 10) || 0);
    updateAttempt(row.id, receiptDialog.attemptId, (attempt) => ({
      ...attempt,
      responseId: '',
      responseOutcome: 'manually-recorded',
      responseStatus: receiptDialog.status,
      responseCheckedAt: recordedAt,
      responseChannel: 'Manually recorded receipt',
      receivedDate: receiptDialog.receivedDate,
      fileCount,
      customerSubmission: null,
      unread: false,
      manualReceipt: {
        status: receiptDialog.status,
        receivedDate: receiptDialog.receivedDate,
        fileCount,
        note: receiptDialog.note.trim(),
        recordedAt,
      },
      reviewerNotes: receiptDialog.note.trim()
        || 'Receipt metadata recorded manually. No source document page was generated by the application.',
    }));
    const message = `${row.title} marked ${receiptDialog.status.toLowerCase()} with ${fileCount} file${fileCount === 1 ? '' : 's'} recorded.`;
    setReceiptDialog(null);
    setNotice(`${message} No training document was generated automatically.`);
    saveNote?.(`Document Request: ${message}`, 'Document request');
    recordAction?.('Recorded document receipt', message, 'Document Request');
  }

  function openViewer(row) {
    if (!row.hasViewerPages) return;
    const folder = attemptReceivedPages(row.attempt) ? 'Customer Evidence' : row.category;
    queueDocumentViewerRoute({
      caseId: activeCase.id,
      folder,
      documentId: row.viewerDocumentId,
      pane: 'reader',
    });
    openTool?.('Document Viewer');
  }

  return (
    <section
      className="document-request-workspace-v2"
      data-document-request-screen="reference-dashboard-v2"
      data-case-id={activeCase.id}
    >
      <header className="document-request-v2-header">
        <div className="document-request-v2-title">
          <span aria-hidden="true">▣</span>
          <div>
            <p>Evidence workflow</p>
            <h2>Document Request <i aria-hidden="true">◆◆</i></h2>
            <small>Case ID: {activeCase.id} · Customer: {activeCase.person ?? 'Training customer'}</small>
          </div>
        </div>

        <section className="document-request-v2-summary" aria-label="Document request summary">
          <SummaryCard icon="▥" label="Requested" count={counts.requested} tone="requested" />
          <SummaryCard icon="✓" label="Received" count={counts.received} tone="received" />
          <SummaryCard icon="◷" label="Awaiting" count={counts.awaiting} tone="awaiting" />
          <SummaryCard icon="△" label="Overdue" count={counts.overdue} tone="overdue" />
        </section>

        <div className="document-request-v2-header-actions">
          <button type="button" className="primary" onClick={() => openRequestDialog()}>＋ Request Document</button>
          <button type="button" onClick={sendAllReminders}>⌁ Send Reminder All</button>
        </div>
      </header>

      <section className="document-request-v2-controls" aria-label="Filter document requests">
        <label>
          <span>Search requests</span>
          <input
            value={query ?? ''}
            onChange={(event) => setQuery?.(event.target.value)}
            placeholder="Search document type, status, folder, or request reason..."
            aria-label="Search Document Request records"
          />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter document request status">
            {REQUEST_STATUS_FILTERS.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <span>{filteredRows.length} of {rows.length} documents shown</span>
      </section>

      {notice && <div className="document-request-v2-notice" role="status">✓ {notice}</div>}

      <div className="document-request-v2-table-wrap">
        <table className="document-request-v2-table">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Requested</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Received</th>
              <th>Files</th>
              <th>Last Reminder</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} data-document-request-row={row.id} data-status={row.status}>
                <td data-label="Document Type">
                  <button type="button" className="document-request-v2-doc-icon" onClick={() => pin?.(`${row.id} · ${row.title}`)} aria-label={`Pin ${row.title}`}>▤</button>
                  <span><strong>{row.title}</strong><small>{row.type} · {row.category}</small></span>
                </td>
                <td data-label="Requested">
                  <span>{displayDate(row.requestDate)}</span>
                  {!row.attempt && row.hasViewerPages && <small>Intake upload</small>}
                </td>
                <td data-label="Due Date">{displayDate(row.dueDate)}</td>
                <td data-label="Status"><span className={`document-request-v2-status ${statusClass(row.status)}`}>{row.status}</span></td>
                <td data-label="Received">
                  <span>{displayDate(row.receivedDate)}</span>
                  {row.manualReceiptOnly && <small>Metadata only</small>}
                </td>
                <td data-label="Files">{row.fileCount}</td>
                <td data-label="Last Reminder">{displayDateTime(row.lastReminderAt)}</td>
                <td data-label="Actions">
                  <div className="document-request-v2-row-actions">
                    {row.hasViewerPages && <button type="button" onClick={() => openViewer(row)}>◉ View Documents</button>}
                    {row.status === 'Not Requested' && <button type="button" className="primary" onClick={() => openRequestDialog(row)}>＋ Request</button>}
                    {REMINDER_STATUSES.has(row.status) && <button type="button" className="reminder" onClick={() => sendReminder(row)}>⌁ Send Reminder</button>}
                    {REMINDER_STATUSES.has(row.status) && <button type="button" onClick={() => openReceiptDialog(row)}>✓ Record Received</button>}
                    {RECEIVED_STATUSES.has(row.status) && !row.hasViewerPages && <button type="button" onClick={() => openRequestDialog(row)}>↻ Request Replacement</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredRows.length && <div className="document-request-v2-empty" role="status">No document requests match this search and status filter.</div>}
      </div>

      <footer className="document-request-v2-footer">
        <div>
          <strong>Document Request review</strong>
          <span>Request and receipt statuses document workflow only. They do not decide whether the claim is supported.</span>
        </div>
        <nav aria-label="Document request next routes">
          <button type="button" onClick={() => openTool?.('Document Viewer')}>Open Document Viewer</button>
          <button type="button" onClick={() => openTool?.('Timeline')}>Open Timeline</button>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </nav>
        <button type="button" className={reviewed ? 'reviewed' : 'primary'} onClick={() => markReviewed?.('Document Request')}>
          {reviewed ? '✓ Document Request reviewed' : 'Mark Document Request reviewed'}
        </button>
      </footer>

      {requestDialog && (
        <div className="document-request-v2-dialog-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRequestDialog(null);
        }}>
          <form className="document-request-v2-dialog" role="dialog" aria-modal="true" aria-labelledby="request-document-dialog-title" onSubmit={submitRequest}>
            <header>
              <div><p>Manual request</p><h3 id="request-document-dialog-title">Request Document</h3></div>
              <button type="button" onClick={() => setRequestDialog(null)} aria-label="Close request document dialog">×</button>
            </header>
            <p className="document-request-v2-dialog-note">Sending this request records an outbound request only. It does not create a customer response or document.</p>
            <label><span>Document</span><select value={requestDialog.documentId} onChange={(event) => setRequestDialog((current) => ({ ...current, documentId: event.target.value }))}>{rows.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
            <label><span>Delivery method</span><select value={requestDialog.deliveryChannel} onChange={(event) => setRequestDialog((current) => ({ ...current, deliveryChannel: event.target.value }))}><option>Secure upload link</option><option>Email</option><option>Mail</option><option>Customer service follow-up</option></select></label>
            <label><span>Due date</span><input type="date" value={requestDialog.dueDate} onChange={(event) => setRequestDialog((current) => ({ ...current, dueDate: event.target.value }))} required /></label>
            <label className="wide"><span>Message / reason</span><textarea value={requestDialog.reason} onChange={(event) => setRequestDialog((current) => ({ ...current, reason: event.target.value }))} required /></label>
            <div className="document-request-v2-dialog-actions"><button type="button" onClick={() => setRequestDialog(null)}>Cancel</button><button type="submit" className="primary">Send Request</button></div>
          </form>
        </div>
      )}

      {receiptDialog && (
        <div className="document-request-v2-dialog-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setReceiptDialog(null);
        }}>
          <form className="document-request-v2-dialog" role="dialog" aria-modal="true" aria-labelledby="record-received-dialog-title" onSubmit={recordReceipt}>
            <header>
              <div><p>Manual receipt</p><h3 id="record-received-dialog-title">Record Received Document</h3></div>
              <button type="button" onClick={() => setReceiptDialog(null)} aria-label="Close record received dialog">×</button>
            </header>
            <p className="document-request-v2-dialog-note">Record only what was actually received. This action saves receipt metadata and never generates a document image or customer submission.</p>
            <label><span>Receipt status</span><select value={receiptDialog.status} onChange={(event) => setReceiptDialog((current) => ({ ...current, status: event.target.value }))}><option>Received</option><option>Incomplete</option><option>Received Late</option></select></label>
            <label><span>Received date</span><input type="date" value={receiptDialog.receivedDate} onChange={(event) => setReceiptDialog((current) => ({ ...current, receivedDate: event.target.value }))} required /></label>
            <label><span>Files received</span><input type="number" min="0" max="25" value={receiptDialog.fileCount} onChange={(event) => setReceiptDialog((current) => ({ ...current, fileCount: event.target.value }))} required /></label>
            <label className="wide"><span>Receipt note</span><textarea value={receiptDialog.note} onChange={(event) => setReceiptDialog((current) => ({ ...current, note: event.target.value }))} placeholder="Record missing pages, image quality, date range, or other observable details..." /></label>
            <div className="document-request-v2-dialog-actions"><button type="button" onClick={() => setReceiptDialog(null)}>Cancel</button><button type="submit" className="primary">Record Receipt</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
