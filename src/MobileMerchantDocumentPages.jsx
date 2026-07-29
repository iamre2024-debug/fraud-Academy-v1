import { merchantIntelligenceTabs } from './data/merchantIntelligenceRecords.js';

function MobileToolGlyph({ type, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'shop') {
    return <svg {...common}><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10c1.1 2.2 3.3 2.2 4.4 0 1.1 2.2 3.3 2.2 4.4 0 1.1 2.2 3.3 2.2 4.4 0 1.1 2.2 3.3 2.2 4.4 0M8 20v-6h5v6M16 14h2" /></svg>;
  }
  if (type === 'money-document') {
    return <svg {...common}><path d="M5 2.5h9l5 5V21H5zM14 2.5V8h5M8 11h5" /><circle cx="14.5" cy="16" r="3.5" /><path d="M14.5 13.9v4.2M16 14.8c-.5-.5-1-.7-1.5-.7-.8 0-1.3.4-1.3 1 0 1.5 2.7.8 2.7 2.1 0 .6-.5 1-1.4 1-.6 0-1.2-.2-1.7-.7" /></svg>;
  }
  if (type === 'history') {
    return <svg {...common}><path d="M4.5 7.5V3.8M4.5 7.5h3.7" /><path d="M5 7a8 8 0 1 1-1 8M12 7v5l3.2 2" /></svg>;
  }
  if (type === 'shield') {
    return <svg {...common}><path d="M12 2.5 20 6v5.5c0 4.8-3 8.1-8 10-5-1.9-8-5.2-8-10V6z" /><path d="m8.7 12 2.2 2.2 4.6-4.7" /></svg>;
  }
  if (type === 'message') {
    return <svg {...common}><path d="M4 4h16v12H9l-5 4z" /><path d="M8 8h8M8 12h5" /></svg>;
  }
  if (type === 'document') {
    return <svg {...common}><path d="M6 2.5h9l4 4V21H6zM15 2.5V7h4M9 11h7M9 14h7M9 17h4" /></svg>;
  }
  if (type === 'inbox') {
    return <svg {...common}><path d="M3 5h18v14H3zM3 7l9 6 9-6" /></svg>;
  }
  if (type === 'send') {
    return <svg {...common}><path d="m3 11 18-8-7 18-3.2-7zM10.8 14 21 3" /></svg>;
  }
  if (type === 'search') {
    return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  }
  if (type === 'user') {
    return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21c.8-4.6 3.3-7.2 7.5-7.2s6.7 2.6 7.5 7.2" /></svg>;
  }
  if (type === 'clock') {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
  }
  if (type === 'pin') {
    return <svg {...common}><path d="M9 3h6l.8 5 2.2 2v2H6v-2l2.2-2zM12 12v9" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>;
}

function LunaBoundaryCharm() {
  return (
    <aside className="mobile-reference-luna" aria-label="Luna debrief is available after submission">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="#08275c" stroke="#60ddff" strokeWidth="2" />
        <path d="m16 22 5-12 10 9h3l10-9 5 13c5 7 5 18-1 25-7 8-25 8-32-1-5-7-5-18 0-25Z" fill="#f2fbff" />
        <path d="m21 12 7 9-9 4m24-13-7 9 9 4" fill="#f2a9d2" opacity=".65" />
        <ellipse cx="25" cy="32" rx="3" ry="4" fill="#163c6e" />
        <ellipse cx="39" cy="32" rx="3" ry="4" fill="#163c6e" />
        <path d="m32 37-3 2 3 2 3-2Z" fill="#d06d9e" />
        <path d="M24 43c3 4 13 4 16 0" fill="none" stroke="#31517a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span><strong>Luna ✦</strong><small>Debrief after submit</small></span>
    </aside>
  );
}

function neutralTone(status = '') {
  if (/received|accepted|available|approved/i.test(status)) return 'received';
  if (/pending|requested|not requested/i.test(status)) return 'pending';
  if (/incomplete|late|no response|expired|missing/i.test(status)) return 'attention';
  return 'neutral';
}

function valueFor(fields = [], pattern, fallback = 'Not supplied') {
  return fields.find(([label]) => pattern.test(label))?.[1] ?? fallback;
}

function MobileFactGrid({ fields = [], className = '' }) {
  return (
    <dl className={`mobile-reference-facts ${className}`.trim()}>
      {fields.map(([label, value]) => (
        <div key={`${label}-${value}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MobileMerchantDocumentRow({ document, onOpen }) {
  const available = ['Available', 'Received', 'Incomplete', 'Received Late'].includes(document.status);
  return (
    <button
      type="button"
      className={`mobile-reference-document-row merchant-document-card ${available ? '' : 'pending'}`}
      data-merchant-document={document.id}
      disabled={!available}
      onClick={() => available && onOpen(document)}
      aria-label={`${available ? 'Open' : 'Pending'} ${document.title}`}
    >
      <span className="mobile-reference-row-icon"><MobileToolGlyph type="document" size={22} /></span>
      <span><strong>{document.title}</strong><small>{document.source}</small></span>
      <em data-tone={neutralTone(document.status)}>{document.status}</em>
    </button>
  );
}

function MobileMerchantSection({
  activeSection,
  workspace,
  onOpenDocument,
  openMerchantPaperwork,
  openTool,
}) {
  if (activeSection === 'claim-details') {
    return (
      <section className="mobile-reference-section-stack" data-lifecycle-section={activeSection}>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="user" /></span><div><h3>Claim details</h3><p>Customer-provided intake facts</p></div></header>
          <MobileFactGrid fields={workspace.claimDetails} />
        </article>
        <article className="mobile-reference-card mobile-reference-statement">
          <header><span><MobileToolGlyph type="message" /></span><div><h3>Customer statement</h3><p>{workspace.customerStatementSource}</p></div></header>
          <blockquote>{workspace.customerStatement}</blockquote>
        </article>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="shield" /></span><div><h3>Authorization & billing</h3><p>Processing facts tied to the transaction</p></div></header>
          <MobileFactGrid fields={workspace.authorizationFields} />
        </article>
      </section>
    );
  }

  if (activeSection === 'network-submission') {
    return (
      <section className="mobile-reference-section-stack" data-lifecycle-section={activeSection}>
        <article className="mobile-reference-card">
          <header>
            <span><MobileToolGlyph type="send" /></span>
            <div><h3>Network submission</h3><p>Training-safe exchange record</p></div>
            <em data-tone={neutralTone(workspace.network.status)}>{workspace.network.status}</em>
          </header>
          <MobileFactGrid fields={workspace.network.fields} />
        </article>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="document" /></span><div><h3>Submitted packet</h3><p>Source records sent for merchant review</p></div></header>
          <div className="mobile-reference-document-list">
            {workspace.network.documents.map((document) => (
              <MobileMerchantDocumentRow key={document.id} document={document} onOpen={onOpenDocument} />
            ))}
          </div>
        </article>
      </section>
    );
  }

  if (activeSection === 'customer-evidence') {
    return (
      <section className="mobile-reference-section-stack" data-lifecycle-section={activeSection}>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="document" /></span><div><h3>Customer evidence</h3><p>Only received or agent-requested records</p></div></header>
          <div className="mobile-reference-document-list">
            {workspace.customerDocuments.map((document) => (
              <MobileMerchantDocumentRow key={document.id} document={document} onOpen={onOpenDocument} />
            ))}
          </div>
        </article>
        <article className="mobile-reference-card mobile-reference-requirements">
          <header><span><MobileToolGlyph type="inbox" /></span><div><h3>Evidence still needed</h3><p>No request is sent automatically</p></div></header>
          <ul>{workspace.customerRequirements.map((item) => <li key={item}>{item}</li>)}</ul>
          <button type="button" onClick={() => openTool('Document Request')}>Open manual document request</button>
        </article>
      </section>
    );
  }

  if (activeSection === 'visa-requirements') {
    return (
      <section className="mobile-reference-section-stack" data-lifecycle-section={activeSection}>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="shield" /></span><div><h3>Visa requirements</h3><p>Neutral documentation guidance</p></div><em data-tone="neutral">Guidance only</em></header>
          <MobileFactGrid fields={workspace.visa.fields} />
        </article>
        <article className="mobile-reference-card mobile-reference-requirements">
          <header><span><MobileToolGlyph type="document" /></span><div><h3>Evidence checklist</h3><p>Compare every item with a source record</p></div></header>
          <ul>{workspace.visa.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="merchant-guidance-lock">Merchant Intelligence does not select a reason code or decide the claim.</p>
        </article>
      </section>
    );
  }

  if (activeSection === 'case-status') {
    return (
      <section className="mobile-reference-section-stack" data-lifecycle-section={activeSection}>
        <article className="mobile-reference-card">
          <header><span><MobileToolGlyph type="clock" /></span><div><h3>Case status</h3><p>{workspace.caseStatus}</p></div></header>
          <ol className="merchant-status-timeline mobile-reference-timeline">
            {workspace.timeline.map((event) => (
              <li key={`${event.date}-${event.label}`} className={event.state}>
                <span />
                <div><small>{event.date}</small><strong>{event.label}</strong><p>{event.detail}</p></div>
              </li>
            ))}
          </ol>
        </article>
      </section>
    );
  }

  return (
    <section className="mobile-reference-section-stack" data-lifecycle-section="merchant-response">
      <article className="mobile-reference-card mobile-reference-response-card">
        <header>
          <span><MobileToolGlyph type="message" /></span>
          <div><h3>Merchant response</h3><p>Merchant-provided position, not an investigation conclusion</p></div>
          <em data-tone={neutralTone(workspace.response.status)}>{workspace.response.status}</em>
        </header>
        <p>{workspace.response.statement}</p>
        <small>Response received: {valueFor(workspace.response.fields, /response received/i)}</small>
      </article>
      <article className="mobile-reference-card">
        <header><span><MobileToolGlyph type="document" /></span><div><h3>Merchant evidence packet</h3><p>{workspace.response.documents.length} source documents</p></div></header>
        <div className="mobile-reference-document-list">
          {workspace.response.documents.map((document) => (
            <MobileMerchantDocumentRow key={document.id} document={document} onOpen={onOpenDocument} />
          ))}
        </div>
        <button type="button" className="mobile-reference-secondary-action" onClick={openMerchantPaperwork}>View all merchant paperwork</button>
      </article>
    </section>
  );
}

export function MobileMerchantIntelligencePage({
  activeCase,
  workspace,
  activeSection,
  setActiveSection,
  onOpenDocument,
  openMerchantPaperwork,
  openTool,
  jumpDecision,
  markReviewed,
  reviewed,
}) {
  const amount = valueFor(workspace.summaryFields, /amount/i, activeCase.amount);
  const issueDate = valueFor(workspace.summaryFields, /date/i, activeCase.reportedDate);
  const policyDocument = workspace.merchantDocuments.find((document) => /policy|terms/i.test(document.title));
  const history = workspace.quickSummary.slice(0, 3);

  return (
    <section className="mobile-reference-tool-page mobile-merchant-reference" data-mobile-merchant-reference="true">
      <section className="merchant-lifecycle-summary mobile-reference-merchant-profile" aria-label="Merchant dispute summary">
        <span className="mobile-reference-merchant-mark"><MobileToolGlyph type="shop" size={31} /></span>
        <div>
          <h2>{workspace.profile.name}</h2>
          <p>Merchant descriptor: {workspace.profile.descriptor}</p>
          <small>{workspace.profile.category} · {workspace.profile.channel}</small>
          <em>Profile record available</em>
        </div>
        <LunaBoundaryCharm />
        <span className="mobile-reference-evidence-boundary">Evidence First</span>
        <span className="sr-only">{workspace.scenario.label}</span>
      </section>

      <article className="mobile-reference-card mobile-reference-transaction">
        <header><span><MobileToolGlyph type="money-document" /></span><div><h3>Transaction under review</h3><p>{workspace.scenario.label}</p></div><em data-tone="attention">Under review</em></header>
        <strong>{amount}</strong>
        <dl>
          <div><dt>Date</dt><dd>{issueDate}</dd></div>
          <div><dt>Channel</dt><dd>{workspace.profile.channel}</dd></div>
          <div><dt>Case</dt><dd>{activeCase.id}</dd></div>
        </dl>
      </article>

      <article className="mobile-reference-card">
        <header><span><MobileToolGlyph type="history" /></span><div><h3>Prior customer history</h3><p>Recorded activity with this merchant</p></div><em data-tone="neutral">{workspace.profile.priorTransactionCount ? 'History available' : 'First recorded use'}</em></header>
        <div className="merchant-quick-summary mobile-reference-history-metrics">
          {history.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label.replace('Prior merchant ', '')}</span></article>)}
          <span className="sr-only">{workspace.quickSummary.slice(3).map(([label, value]) => `${label}: ${value}`).join(' · ')}</span>
        </div>
      </article>

      <article className="mobile-reference-card mobile-reference-policy-card">
        <header><span><MobileToolGlyph type="shield" /></span><div><h3>Policy & supporting terms</h3><p>{policyDocument?.title ?? `${workspace.scenario.label} documentation`}</p></div></header>
        <p>{policyDocument?.callout?.value ?? `Review the merchant terms, dates, customer statement, and response records supplied for ${workspace.scenario.label.toLowerCase()}.`}</p>
        {policyDocument
          ? <button type="button" onClick={() => onOpenDocument(policyDocument)}>View policy</button>
          : <button type="button" onClick={openMerchantPaperwork}>View merchant documents</button>}
      </article>

      <label className="merchant-lifecycle-mobile-tabs mobile-reference-section-picker">
        <span>Investigation view</span>
        <select value={activeSection} onChange={(event) => setActiveSection(event.target.value)} aria-label="Choose chargeback lifecycle section">
          {merchantIntelligenceTabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
        </select>
      </label>
      <nav className="merchant-lifecycle-tabs mobile-reference-compat-tabs" aria-label="Chargeback lifecycle sections">
        {merchantIntelligenceTabs.map((tab) => (
          <button key={tab.id} type="button" aria-pressed={activeSection === tab.id} onClick={() => setActiveSection(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      <div className="merchant-lifecycle-content mobile-reference-merchant-content">
        <MobileMerchantSection
          activeSection={activeSection}
          workspace={workspace}
          onOpenDocument={onOpenDocument}
          openMerchantPaperwork={openMerchantPaperwork}
          openTool={openTool}
        />
      </div>

      <nav className="merchant-lifecycle-actions mobile-reference-primary-actions" aria-label="Merchant Intelligence actions">
        <button type="button" onClick={() => openTool('Document Request')}><MobileToolGlyph type="inbox" size={18} /> Request customer documents</button>
        <button type="button" className="primary" onClick={jumpDecision}>Continue to decision</button>
      </nav>

      <footer className="investigation-tool-review-bar mobile-reference-review-bar">
        <div><strong>Merchant Intelligence review</strong><span>Review completion records process only; it does not determine the claim.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Merchant Intelligence')}>
          {reviewed ? 'Merchant Intelligence reviewed' : 'Mark Merchant Intelligence reviewed'}
        </button>
      </footer>
    </section>
  );
}

function DocumentWorkflowSteps({ activeStep }) {
  return (
    <ol className="mobile-reference-request-steps" aria-label="Document request workflow">
      {['Request', 'Receive', 'Review'].map((step, index) => (
        <li
          key={step}
          className={index < activeStep ? 'complete' : index === activeStep ? 'active' : ''}
          aria-current={index === activeStep ? 'step' : undefined}
          data-document-request-step={step.toLowerCase()}
        >
          <i />{step}
        </li>
      ))}
    </ol>
  );
}

function DocumentRequestPreview({ request }) {
  return (
    <section className="mobile-reference-document-preview" aria-label="Document preview">
      <header><span><MobileToolGlyph type="document" size={19} /></span><h3>Document Preview</h3></header>
      <div>
        <figure aria-label={`${request.documentType} training document thumbnail`}>
          <span>FRAUD ACADEMY</span>
          <strong>{request.documentType}</strong>
          <i />
          <i />
          <i />
          <small>Fictional training record</small>
        </figure>
        <article>
          <h4>{request.documentType}</h4>
          <p>{request.pagesAvailable ? 'Source document available' : 'Request conversation record'}</p>
          <dl>
            <div><dt>Source</dt><dd>{request.pagesAvailable ? request.sender : request.deliveryChannel}</dd></div>
            <div><dt>Date</dt><dd>{request.pagesAvailable ? request.receivedDate : request.requestedDate}</dd></div>
            <div><dt>Status</dt><dd>{request.status}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}

export function MobileDocumentRequestPage({
  activeCase,
  activeRequest,
  activeStep,
  composeChannel,
  composeDocumentId,
  composeDueDate,
  composeOpen,
  composeReason,
  counts,
  filteredRequests,
  firstMerchantDocument,
  markRequestRead,
  mobilePane,
  openComposer,
  openDocumentViewerRoute,
  openMerchantPaperwork,
  openRequest,
  query,
  requestConfirmation,
  requestTemplates,
  requests,
  saveRequestNote,
  setComposeChannel,
  setComposeDocumentId,
  setComposeDueDate,
  setComposeOpen,
  setComposeReason,
  setMobilePane,
  setQuery,
  setStatusFilter,
  statusFilter,
  statuses,
  submitPaperworkRequest,
  checkCustomerResponse,
  pin,
  markReviewed,
  reviewed,
  jumpDecision,
  openTool,
}) {
  const unreadCount = requests.filter((request) => request.unread).length;

  return (
    <section className="mobile-reference-tool-page mobile-document-request-reference" data-mobile-document-reference="true">
      <h2 className="sr-only">Document Request</h2>
      <section className="mobile-reference-inbox-hero">
        <span><MobileToolGlyph type="inbox" size={30} /></span>
        <div>
          <h2>Manual Request Inbox</h2>
          <p>{requests.length} saved record{requests.length === 1 ? '' : 's'} · {activeCase.id}</p>
          <small>Nothing is sent until you complete the request form.</small>
        </div>
        <em>{unreadCount ? `${unreadCount} New` : 'Up to date'}</em>
        {activeRequest?.unread && <button type="button" onClick={() => markRequestRead(activeRequest)}>Mark as Read</button>}
        <DocumentWorkflowSteps activeStep={activeStep} />
      </section>

      <section className="document-request-findbar mobile-reference-request-search" aria-label="Find document request information">
        <label>
          <span><MobileToolGlyph type="search" size={17} /> Search requests</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, status, request ID, or source..."
            aria-label="Search Document Request records"
          />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter Document Request status">
            {statuses.map((status) => {
              const count = status === 'All' ? requests.length : requests.filter((request) => request.status === status).length;
              return <option key={status} value={status}>{status} ({count})</option>;
            })}
          </select>
        </label>
        <small aria-live="polite">{filteredRequests.length} of {requests.length} records shown</small>
      </section>

      {requestConfirmation && <div className="document-request-confirmation" role="status">✓ {requestConfirmation}</div>}

      <div className="document-request-inbox mobile-reference-request-inbox" data-mobile-pane={composeOpen ? 'compose' : mobilePane}>
        {!composeOpen && (
          <section className="document-request-list mobile-reference-request-list" aria-label="Document request records">
            <header><div><h3>Requested Documents</h3><p>Customer and request records</p></div><span>{filteredRequests.length}</span></header>
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={request.id === activeRequest?.id ? 'active' : ''}
                onClick={() => openRequest(request.id)}
                data-document-request={request.id}
              >
                <span className="mobile-reference-row-icon"><MobileToolGlyph type="document" size={20} /></span>
                <span className="document-request-message-copy">
                  <strong>{request.documentType}</strong>
                  <small>{request.pagesAvailable ? `From: ${request.sender}` : `To: ${request.recipient}`}</small>
                  <em>{request.requirement} · {request.id}</em>
                </span>
                <span className="document-request-message-meta">
                  <small data-tone={neutralTone(request.status)}>{request.status}</small>
                  <time>{request.recordKind === 'customer-submission' ? request.receivedDate : request.requestedDate}</time>
                </span>
              </button>
            ))}
            {!filteredRequests.length && <div className="investigation-tool-empty" role="status">No document requests match this filter or search.</div>}
          </section>
        )}

        <main className="document-request-detail mobile-reference-request-detail" aria-label={composeOpen ? 'Compose paperwork request' : 'Expanded document request detail'}>
          {composeOpen ? (
            <form className="document-request-compose" onSubmit={submitPaperworkRequest}>
              <header>
                <button type="button" className="document-request-mobile-back" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>‹ Back</button>
                <div><p>New manual request</p><h3>Request Paperwork</h3><span>This saves a request on {activeCase.id}.</span></div>
              </header>
              <label><span>To</span><input value={activeCase.person ?? 'Customer on the active case'} readOnly aria-label="Paperwork request recipient" /></label>
              <label><span>Paperwork</span><select value={composeDocumentId || requestTemplates[0]?.id || ''} onChange={(event) => setComposeDocumentId(event.target.value)} aria-label="Paperwork to request">{requestTemplates.map((request) => <option key={request.id} value={request.id}>{request.title}</option>)}</select></label>
              <label><span>Delivery method</span><select value={composeChannel} onChange={(event) => setComposeChannel(event.target.value)} aria-label="Paperwork request delivery method"><option>Secure upload link</option><option>Email</option><option>Mail</option><option>Customer service follow-up</option></select></label>
              <label><span>Follow-up due</span><input type="date" value={composeDueDate} onChange={(event) => setComposeDueDate(event.target.value)} aria-label="Paperwork request due date" /></label>
              <label className="document-request-compose-reason"><span>Message / reason</span><textarea value={composeReason} onChange={(event) => setComposeReason(event.target.value)} aria-label="Paperwork request reason" /></label>
              <div className="document-request-compose-actions"><button type="button" onClick={() => { setComposeOpen(false); setMobilePane(activeRequest ? 'reader' : 'inbox'); }}>Cancel</button><button type="submit" className="primary" disabled={!composeDocumentId && !requestTemplates[0]?.id}>Send Request</button></div>
            </form>
          ) : activeRequest ? (
            <>
              <DocumentRequestPreview request={activeRequest} />
              <header>
                <button type="button" className="document-request-mobile-back" onClick={() => setMobilePane('inbox')}>‹ Inbox</button>
                <div><p>Paperwork conversation</p><h3>{activeRequest.documentType}</h3><span>{activeRequest.id} · {activeRequest.status}</span></div>
                <button type="button" onClick={() => pin(`${activeRequest.id} · ${activeRequest.documentType}`)}><MobileToolGlyph type="pin" size={16} /> Pin request</button>
              </header>

              {activeRequest.status === 'Not Requested' ? (
                <section className="document-request-not-sent" role="status">
                  <span>Not requested</span><h4>No paperwork request has been sent.</h4>
                  <p>Send a request only when this claim scenario needs the document.</p>
                  <button type="button" onClick={() => openComposer(activeRequest)}>Request this paperwork</button>
                </section>
              ) : activeRequest.pagesAvailable ? (
                <>
                  <section className="document-request-message-header"><dl><div><dt>From</dt><dd>{activeRequest.sender}</dd></div><div><dt>To</dt><dd>Fraud Academy Chargebacks</dd></div><div><dt>Received</dt><dd>{activeRequest.receivedDate}</dd></div><div><dt>Source</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
                  <article className="document-request-message-body inbound">{activeRequest.unread && <span className="document-request-unread">New customer submission</span>}<p>Customer-submitted paperwork received for case <strong>{activeRequest.linkedCase}</strong>.</p><p>{activeRequest.reason}</p><p>Review the actual source page before recording what it supports or leaves unresolved.</p></article>
                </>
              ) : activeRequest.status === 'No Response' ? (
                <>
                  <section className="document-request-message-header"><dl><div><dt>Request sent to</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Follow-up checked</dt><dd>{activeRequest.responseCheckedAt}</dd></div><div><dt>Result</dt><dd>No customer submission</dd></div></dl></section>
                  <article className="document-request-message-body"><p>No document was returned after this request was checked.</p><p>The request history remains visible, but there is no source page to review.</p></article>
                </>
              ) : (
                <>
                  <section className="document-request-message-header"><dl><div><dt>From</dt><dd>Fraud Academy Document Services</dd></div><div><dt>To</dt><dd>{activeRequest.recipient}</dd></div><div><dt>Sent</dt><dd>{activeRequest.requestedDate}</dd></div><div><dt>Delivery</dt><dd>{activeRequest.deliveryChannel}</dd></div></dl></section>
                  <article className="document-request-message-body"><p>Hello {activeRequest.recipient},</p><p>{activeRequest.reason}</p><p>Please submit the requested paperwork by <strong>{activeRequest.dueDate}</strong>. This request is waiting for the scenario customer; the agent did not create a response document.</p><p>Thank you,<br />Fraud Academy Document Services</p></article>
                </>
              )}

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
              <article className="document-request-notes"><span>Reviewer notes</span><p>{activeRequest.reviewerNotes}</p><small>{activeRequest.fields}</small></article>
              <div className="document-request-actions">
                <button type="button" onClick={() => saveRequestNote(`${activeRequest.id} follow-up recorded for ${activeRequest.status}.`)}>Save follow-up note</button>
                {activeRequest.recordKind === 'outbound-request' && activeRequest.status === 'Requested' && !activeRequest.responseCheckedAt && <button type="button" className="document-request-check-response" onClick={() => checkCustomerResponse(activeRequest)}>Check for Customer Response</button>}
                {['Not Requested', 'Incomplete', 'No Response'].includes(activeRequest.status) && <button type="button" onClick={() => openComposer(activeRequest)}>{activeRequest.status === 'Not Requested' ? 'Request paperwork' : 'Request again'}</button>}
                {activeRequest.pagesAvailable && <button type="button" onClick={() => openDocumentViewerRoute({ folder: activeRequest.category, documentId: activeRequest.documentViewerId, pane: 'reader' })}>Open Customer Document</button>}
                {firstMerchantDocument && <button type="button" onClick={openMerchantPaperwork}>View Merchant Paperwork</button>}
              </div>
            </>
          ) : <div className="investigation-tool-empty" role="status">No document requests are available for this case.</div>}
        </main>
      </div>

      {!composeOpen && (
        <button type="button" className="document-request-compose-button mobile-reference-request-button" onClick={() => openComposer()} disabled={!requestTemplates.length}>
          <MobileToolGlyph type="send" size={20} /> Request Document
        </button>
      )}

      <section className="document-request-summary mobile-reference-request-summary" aria-label="Document request workflow summary">
        {counts.filter(([, count]) => count > 0).map(([status, count]) => <article key={status}><span>{status}</span><strong>{count}</strong></article>)}
      </section>

      <nav className="investigation-tool-next-routes mobile-reference-request-routes" aria-label="Document request next routes">
        <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar mobile-reference-review-bar">
        <div><strong>Document Request review</strong><span>Review completion records workflow progress only. It does not determine the case outcome.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Document Request')}>
          {reviewed ? '✓ Document Request reviewed' : 'Mark Document Request reviewed'}
        </button>
      </footer>
    </section>
  );
}
