// Chargeback lifecycle workspace with source-document review.
import { useEffect, useMemo, useState } from 'react';
import MobileLunaPortrait from './MobileLunaPortrait.jsx';
import { getMerchantIntelligence, merchantIntelligenceTabs } from './data/merchantIntelligenceRecords.js';
import { queueDocumentViewerRoute } from './documentViewerRoute.js';

function FieldGrid({ fields = [], className = '' }) {
  return (
    <dl className={`merchant-lifecycle-fields ${className}`.trim()}>
      {fields.map(([label, value]) => (
        <div key={`${label}-${value}`}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`merchant-status-pill ${tone}`}>{children}</span>;
}

function DocumentCard({ document, onOpen }) {
  const available = ['Available', 'Received', 'Incomplete', 'Received Late'].includes(document.status);
  return (
    <button
      type="button"
      className={`merchant-document-card ${available ? '' : 'pending'}`}
      onClick={() => available && onOpen(document)}
      disabled={!available}
      data-merchant-document={document.id}
      aria-label={`${available ? 'Open' : 'Pending'} ${document.title}`}
    >
      <span className="merchant-document-icon" aria-hidden="true">{document.icon ?? 'DOC'}</span>
      <span>
        <strong>{document.title}</strong>
        <small>{document.source} · {document.status}</small>
      </span>
      <em aria-hidden="true">{available ? '›' : '…'}</em>
    </button>
  );
}

function fieldValue(fields = [], label, fallback = 'Not recorded') {
  return fields.find(([fieldLabel]) => fieldLabel === label)?.[1] ?? fallback;
}

function MobileMerchantOverview({ workspace, onOpen, openMerchantPaperwork, setActiveSection }) {
  const policyDocument = workspace.response.documents.find((document) => /policy|terms/i.test(document.title));
  const availableDocuments = workspace.response.documents.filter((document) => ['Available', 'Received', 'Incomplete', 'Received Late'].includes(document.status));
  const history = Object.fromEntries(workspace.quickSummary);
  const amount = fieldValue(workspace.summaryFields, 'Disputed amount', workspace.authorization.amount);
  const transactionDate = fieldValue(workspace.claimDetails, 'Disputed transaction', workspace.authorization.authorizedAt);
  const issueDate = workspace.summaryFields.find(([label]) => /date/i.test(label))?.[1] ?? 'Not recorded';
  const policy = fieldValue(workspace.response.fields, 'Merchant policy', policyDocument?.title ?? 'Policy details available in merchant documents');

  return (
    <section
      className="merchant-mobile-overview-v2"
      style={{ display: 'none' }}
      aria-label="Merchant Intelligence mobile overview"
    >
      <section className="merchant-mobile-hero">
        <span className="merchant-mobile-hero-icon" aria-hidden="true">▥</span>
        <div>
          <small>Merchant profile</small>
          <h3>{workspace.profile.name}</h3>
          <p>{workspace.profile.category} · MCC {workspace.profile.mcc}</p>
          <span>{workspace.profile.descriptor} · {workspace.profile.channel}</span>
        </div>
        <MobileLunaPortrait size={52} />
      </section>

      <section className="merchant-mobile-transaction">
        <header>
          <div><span aria-hidden="true">◇</span><div><small>Transaction under review</small><strong>{amount}</strong></div></div>
          <StatusPill tone="neutral">Recorded transaction</StatusPill>
        </header>
        <dl>
          <div><dt>Transaction date</dt><dd>{transactionDate}</dd></div>
          <div><dt>Issue date</dt><dd>{issueDate}</dd></div>
          <div><dt>Processing channel</dt><dd>{workspace.authorization.entryMode}</dd></div>
          <div><dt>Authorization result</dt><dd>{workspace.authorization.authorizationResult}</dd></div>
        </dl>
      </section>

      <section className="merchant-mobile-history">
        <header><span aria-hidden="true">♙</span><div><small>Customer history</small><h3>Prior merchant activity</h3></div></header>
        <div>
          <article><strong>{history['Prior merchant transactions'] ?? 0}</strong><span>Prior transactions</span></article>
          <article><strong>{history['Prior merchant disputes'] ?? 0}</strong><span>Prior disputes</span></article>
          <article><strong>{history['Refunds / reversals'] ?? 0}</strong><span>Refunds / reversals</span></article>
        </div>
      </section>

      <section className="merchant-mobile-policy">
        <header><span aria-hidden="true">♢</span><div><small>Cancellation & policy</small><h3>{workspace.scenario.label}</h3></div></header>
        <p>{policy}</p>
        <dl>
          <div><dt>Customer-reported date</dt><dd>{fieldValue(workspace.claimDetails, 'Cancellation date', 'Not supplied for this claim')}</dd></div>
          <div><dt>Customer-reported method</dt><dd>{fieldValue(workspace.claimDetails, 'Cancellation method', 'Not supplied for this claim')}</dd></div>
        </dl>
        {policyDocument && <button type="button" onClick={() => onOpen(policyDocument)}>Open policy document</button>}
      </section>

      <section className="merchant-mobile-response">
        <header>
          <span aria-hidden="true">☵</span>
          <div><small>Merchant response</small><h3>{workspace.response.status}</h3></div>
          <StatusPill tone={workspace.response.status === 'Accepted' ? 'positive' : workspace.response.status === 'Pending' ? 'active' : 'attention'}>{workspace.response.status}</StatusPill>
        </header>
        <p>{workspace.response.statement}</p>
        <button type="button" onClick={() => setActiveSection('merchant-response')}>Review response details</button>
      </section>

      <section className="merchant-mobile-documents">
        <header>
          <span aria-hidden="true">▤</span>
          <div><small>Documents & evidence</small><h3>{availableDocuments.length} available merchant document{availableDocuments.length === 1 ? '' : 's'}</h3></div>
        </header>
        <div>{workspace.response.documents.slice(0, 3).map((document) => {
          const available = ['Available', 'Received', 'Incomplete', 'Received Late'].includes(document.status);
          return (
            <button
              key={`mobile-${document.id}`}
              type="button"
              className="merchant-mobile-document-card"
              disabled={!available}
              onClick={() => available && onOpen(document)}
              aria-label={`${available ? 'Preview' : 'Pending'} ${document.title}`}
            >
              <span aria-hidden="true">{document.icon ?? 'DOC'}</span>
              <span><strong>{document.title}</strong><small>{document.source} · {document.status}</small></span>
              <b aria-hidden="true">{available ? '›' : '…'}</b>
            </button>
          );
        })}</div>
        <button type="button" onClick={openMerchantPaperwork}>View all merchant paperwork</button>
      </section>

      <aside className="merchant-mobile-evidence-lock">
        <span aria-hidden="true">✦</span>
        <p><strong>Evidence First</strong> Merchant records describe the transaction, customer history, policy, and response. They do not select the claim outcome.</p>
      </aside>
    </section>
  );
}

function DocumentSheet({ document, activeCase, onClose, pin, saveNote }) {
  return (
    <section className="merchant-document-viewer" aria-label={`${document.title} document viewer`}>
      <header className="merchant-document-toolbar">
        <button type="button" onClick={onClose}>← Back to evidence packet</button>
        <div>
          <span>{document.source}</span>
          <strong>{document.title}</strong>
        </div>
        <nav>
          <button type="button" onClick={() => pin(`${document.id} | ${document.title}`)}>Pin document</button>
          <button type="button" onClick={() => saveNote(`Reviewed ${document.title} (${document.id}) without assigning an outcome.`, 'Merchant Intelligence')}>Save review note</button>
        </nav>
      </header>

      <div className="merchant-document-canvas">
        <article className={`merchant-document-sheet ${document.kind ?? 'letter'}`} data-document-id={document.id}>
          <header className="merchant-document-letterhead">
            <div className="merchant-document-brandmark" aria-hidden="true">{document.mark ?? 'M'}</div>
            <div><strong>{document.brand}</strong><span>{document.department}</span></div>
            <small>{document.classification ?? 'ACCOUNT RECORD'}</small>
          </header>

          <section className="merchant-document-titleblock">
            <div><span>Document</span><strong>{document.title}</strong></div>
            <dl>
              <div><dt>Reference</dt><dd>{document.reference}</dd></div>
              <div><dt>Date</dt><dd>{document.date}</dd></div>
              <div><dt>Case</dt><dd>{activeCase.id}</dd></div>
            </dl>
          </section>

          {document.subject && <p className="merchant-document-subject"><strong>Subject:</strong> {document.subject}</p>}
          {document.to && <p className="merchant-document-address"><strong>To:</strong> {document.to}</p>}
          {document.salutation && <p>{document.salutation}</p>}
          {(document.paragraphs ?? []).map((paragraph, index) => <p key={`${document.id}-paragraph-${index}`}>{paragraph}</p>)}

          {document.facts?.length > 0 && (
            <dl className="merchant-document-facts">
              {document.facts.map(([label, value]) => <div key={`${document.id}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          )}

          {(document.tables ?? []).map((table, index) => (
            <section className="merchant-document-table-wrap" key={`${document.id}-table-${index}`}>
              {table.title && <h3>{table.title}</h3>}
              <table>
                <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>{table.rows.map((row, rowIndex) => <tr key={`${document.id}-${index}-${rowIndex}`}>{row.map((value, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{value}</td>)}</tr>)}</tbody>
              </table>
            </section>
          ))}

          {document.callout && <aside className="merchant-document-callout"><strong>{document.callout.label}</strong><p>{document.callout.value}</p></aside>}
          {document.signature && <section className="merchant-document-signature"><span>Sincerely,</span><strong>{document.signature.name}</strong><small>{document.signature.role}</small></section>}
          <footer><span>{document.footer ?? 'Training document · Review source fields and dates'}</span><span>Page 1 of 1</span></footer>
        </article>
      </div>
    </section>
  );
}

function ClaimDetails({ workspace, onOpen }) {
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">CLM</span><div><h3>Claim details</h3><p>Information captured from the customer at intake.</p></div></header>
        <FieldGrid fields={workspace.claimDetails} />
      </section>
      <section className="merchant-lifecycle-panel merchant-statement-card">
        <header><span className="merchant-panel-icon">TXT</span><div><h3>Customer statement</h3><p>{workspace.customerStatementSource}</p></div></header>
        <blockquote>{workspace.customerStatement}</blockquote>
      </section>
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">AUTH</span><div><h3>Authorization / billing</h3><p>Card-processing facts tied to the disputed transaction.</p></div></header>
        <FieldGrid fields={workspace.authorizationFields} />
      </section>
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">DOC</span><div><h3>Claim documents</h3><p>Open the source document and review it directly.</p></div></header>
        <div className="merchant-document-grid">{workspace.customerDocuments.filter((item) => item.status === 'Available').map((document) => <DocumentCard key={document.id} document={document} onOpen={onOpen} />)}</div>
      </section>
    </div>
  );
}

function NetworkSubmission({ workspace, onOpen }) {
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">NET</span><div><h3>Network submission</h3><p>Internal training view of what was sent through the card-network process.</p></div><StatusPill tone="active">{workspace.network.status}</StatusPill></header>
        <FieldGrid fields={workspace.network.fields} />
      </section>
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">PKT</span><div><h3>Submitted packet</h3><p>Documents and claim fields transmitted for merchant review.</p></div></header>
        <div className="merchant-document-grid">{workspace.network.documents.map((document) => <DocumentCard key={document.id} document={document} onOpen={onOpen} />)}</div>
      </section>
    </div>
  );
}

function MerchantResponse({ workspace, onOpen, openMerchantPaperwork, openTool, documentRequests }) {
  const response = workspace.response;
  const customerDocumentStatus = workspace.customerDocuments.map((document) => {
    const request = documentRequests[document.id];
    return {
      ...document,
      status: document.status === 'Available'
        ? 'Available'
        : request?.status ?? 'Not requested',
    };
  });
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">RSP</span><div><h3>Merchant response</h3><p>Response returned through the card-network process.</p></div><StatusPill tone={response.status === 'Challenged' ? 'attention' : response.status === 'Accepted' ? 'positive' : 'active'}>{response.status}</StatusPill></header>
        <FieldGrid fields={response.fields} />
      </section>
      <section className="merchant-lifecycle-panel merchant-statement-card">
        <header><span className="merchant-panel-icon">MSG</span><div><h3>Merchant statement</h3><p>Merchant-provided position; not an investigation conclusion.</p></div></header>
        <blockquote>{response.statement}</blockquote>
      </section>
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">DOC</span><div><h3>Merchant evidence packet</h3><p>{response.documents.filter((item) => item.status === 'Available').length} documents available to inspect.</p></div></header>
        <div className="merchant-document-grid">{response.documents.map((document) => <DocumentCard key={document.id} document={document} onOpen={onOpen} />)}</div>
        <button type="button" className="merchant-inline-action" onClick={openMerchantPaperwork}>View all merchant paperwork</button>
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">CUS</span><div><h3>Customer document status</h3><p>Factual request and receipt status. No request is sent from this panel.</p></div></header>
        <ul>{customerDocumentStatus.map((document) => <li key={document.id}><span aria-hidden="true">○</span><strong>{document.title}</strong> · {document.status}</li>)}</ul>
        <button type="button" className="merchant-inline-action" onClick={() => openTool('Document Request')}>Open manual document request center</button>
      </section>
    </div>
  );
}

function CustomerEvidence({ workspace, onOpen, openTool, documentRequests }) {
  const customerDocuments = workspace.customerDocuments.map((document) => {
    if (document.status === 'Available') return document;
    const savedRequest = documentRequests[document.id];
    return {
      ...document,
      status: savedRequest?.status ?? 'Not Requested',
      receivedInInbox: Boolean(savedRequest?.customerSubmission?.pages?.length),
    };
  });
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">CUS</span><div><h3>Customer evidence</h3><p>Received and requested customer-side documents for this dispute.</p></div></header>
        <div className="merchant-document-grid">{customerDocuments.map((document) => <DocumentCard key={document.id} document={document} onOpen={onOpen} />)}</div>
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">REQ</span><div><h3>Manual document request center</h3><p>Review the current record first. Opening the center does not send a request.</p></div></header>
        <ul>{customerDocuments.map((document) => <li key={document.id}><span aria-hidden="true">○</span><strong>{document.title}</strong> · {document.status}</li>)}</ul>
        <button type="button" className="merchant-inline-action" onClick={() => openTool('Document Request')}>Open manual document request center</button>
      </section>
    </div>
  );
}

function VisaRequirements({ workspace }) {
  const neutralRequirements = workspace.visa.requirements.map((item) => (
    /missing customer evidence is requested/i.test(item)
      ? 'Existing customer and merchant evidence is checked for completeness'
      : item
  ));
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">V</span><div><h3>Visa requirements</h3><p>Neutral documentation guidance after reviewing the available evidence.</p></div><StatusPill tone="neutral">Guidance only</StatusPill></header>
        <FieldGrid fields={workspace.visa.fields} />
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">CHK</span><div><h3>Evidence checklist</h3><p>Confirm whether each requirement is supported in the source documents.</p></div></header>
        <ul>{neutralRequirements.map((item) => <li key={item}><span aria-hidden="true">○</span>{item}</li>)}</ul>
        <p className="merchant-guidance-lock">Merchant Intelligence does not select a reason code or decide the claim.</p>
      </section>
    </div>
  );
}

function CaseStatus({ workspace }) {
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">STS</span><div><h3>Case status</h3><p>Chargeback exchange and evidence-request timeline.</p></div><StatusPill tone="active">{workspace.caseStatus}</StatusPill></header>
        <ol className="merchant-status-timeline">{workspace.timeline.map((event) => <li key={`${event.date}-${event.label}`} className={event.state}><span></span><div><small>{event.date}</small><strong>{event.label}</strong><p>{event.detail}</p></div></li>)}</ol>
      </section>
    </div>
  );
}

export default function MerchantIntelligenceWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision, documentRequests = {} }) {
  const workspace = useMemo(() => getMerchantIntelligence(activeCase), [activeCase]);
  const [activeSection, setActiveSection] = useState('merchant-response');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    setActiveSection('merchant-response');
    setSelectedDocument(null);
  }, [activeCase.id]);

  function openMerchantPaperwork() {
    const firstDocument = workspace.response.documents.find((document) => document.status === 'Available');
    queueDocumentViewerRoute({
      caseId: activeCase.id,
      folder: 'Merchant Evidence',
      documentId: firstDocument?.id ?? '',
      pane: firstDocument ? 'reader' : 'inbox',
    });
    openTool('Document Viewer');
  }

  function openCustomerPaperwork(document) {
    if (!document.receivedInInbox) {
      setSelectedDocument(document);
      return;
    }
    queueDocumentViewerRoute({
      caseId: activeCase.id,
      folder: 'Customer Evidence',
      documentId: document.id,
      pane: 'reader',
    });
    openTool('Document Viewer');
  }

  if (selectedDocument) {
    return <DocumentSheet document={selectedDocument} activeCase={activeCase} onClose={() => setSelectedDocument(null)} pin={pin} saveNote={saveNote} />;
  }

  const sectionProps = { workspace, onOpen: setSelectedDocument, openTool, openMerchantPaperwork, documentRequests };
  const sections = {
    'claim-details': <ClaimDetails {...sectionProps} />,
    'network-submission': <NetworkSubmission {...sectionProps} />,
    'merchant-response': <MerchantResponse {...sectionProps} />,
    'customer-evidence': <CustomerEvidence {...sectionProps} onOpen={openCustomerPaperwork} />,
    'visa-requirements': <VisaRequirements {...sectionProps} />,
    'case-status': <CaseStatus {...sectionProps} />,
  };

  return (
    <section className="merchant-lifecycle" aria-label="Merchant Intelligence chargeback lifecycle">
      <header className="merchant-lifecycle-heading">
        <div><p>Merchant Intelligence</p><h2>Chargeback lifecycle view</h2><span>Review the customer claim, network exchange, merchant response, and source documents without assigning an outcome.</span></div>
        <StatusPill tone="neutral">Evidence First</StatusPill>
      </header>

      <MobileMerchantOverview
        workspace={workspace}
        onOpen={setSelectedDocument}
        openMerchantPaperwork={openMerchantPaperwork}
        setActiveSection={setActiveSection}
      />

      <section className="merchant-lifecycle-summary" aria-label="Merchant dispute summary">
        <span className="merchant-summary-mark" aria-hidden="true">{workspace.profile.mark ?? 'M'}</span>
        <div className="merchant-summary-name"><h3>{workspace.profile.name}</h3><p>{workspace.scenario.label}</p></div>
        <FieldGrid fields={workspace.summaryFields} />
        <StatusPill tone="attention">{workspace.claimLane}</StatusPill>
      </section>
      <section className="merchant-quick-summary" aria-label="Merchant history summary">
        {workspace.quickSummary.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>

      <nav className="merchant-lifecycle-tabs" aria-label="Chargeback lifecycle sections">
        {merchantIntelligenceTabs.map((tab) => <button key={tab.id} type="button" className={activeSection === tab.id ? 'active' : ''} aria-pressed={activeSection === tab.id} onClick={() => setActiveSection(tab.id)}>{tab.label}</button>)}
      </nav>
      <label className="merchant-lifecycle-mobile-tabs"><span>Lifecycle section</span><select value={activeSection} onChange={(event) => setActiveSection(event.target.value)} aria-label="Choose chargeback lifecycle section">{merchantIntelligenceTabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}</select></label>

      <div className="merchant-lifecycle-content" data-lifecycle-section={activeSection}>{sections[activeSection]}</div>

      <nav className="merchant-lifecycle-actions" aria-label="Merchant Intelligence actions">
        <button type="button" onClick={() => setActiveSection('network-submission')}>View network details</button>
        <button type="button" onClick={openMerchantPaperwork}>View merchant paperwork</button>
        <button type="button" onClick={() => openTool('Document Request')}>Open document request center</button>
        <button type="button" className="primary" onClick={jumpDecision}>Continue to decision →</button>
      </nav>

      <footer className="investigation-tool-review-bar"><div><strong>Merchant Intelligence review</strong><span>Marking this tool reviewed records process completion only. It does not determine the claim.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Merchant Intelligence')}>{reviewed ? 'Merchant Intelligence reviewed' : 'Mark Merchant Intelligence reviewed'}</button></footer>
    </section>
  );
}
