// Chargeback lifecycle workspace with source-document review.
import { useEffect, useMemo, useState } from 'react';
import { getMerchantIntelligence, merchantIntelligenceTabs } from './data/merchantIntelligenceRecords.js';

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
  const available = document.status === 'Available';
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

function MerchantResponse({ workspace, onOpen }) {
  const response = workspace.response;
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
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">REQ</span><div><h3>Next required from customer</h3><p>Evidence still needed if the merchant challenges the claim.</p></div></header>
        <ul>{workspace.customerRequirements.map((item) => <li key={item}><span aria-hidden="true">○</span>{item}</li>)}</ul>
      </section>
    </div>
  );
}

function CustomerEvidence({ workspace, onOpen, openTool }) {
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">CUS</span><div><h3>Customer evidence</h3><p>Received and requested customer-side documents for this dispute.</p></div></header>
        <div className="merchant-document-grid">{workspace.customerDocuments.map((document) => <DocumentCard key={document.id} document={document} onOpen={onOpen} />)}</div>
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">REQ</span><div><h3>Open document requests</h3><p>Only requested items that fit this claim scenario are shown.</p></div></header>
        <ul>{workspace.customerRequirements.map((item) => <li key={item}><span aria-hidden="true">○</span>{item}</li>)}</ul>
        <button type="button" className="merchant-inline-action" onClick={() => openTool('Document Request')}>Open document request center</button>
      </section>
    </div>
  );
}

function VisaRequirements({ workspace }) {
  return (
    <div className="merchant-lifecycle-stack">
      <section className="merchant-lifecycle-panel">
        <header><span className="merchant-panel-icon">V</span><div><h3>Visa requirements</h3><p>Neutral documentation guidance after reviewing the available evidence.</p></div><StatusPill tone="neutral">Guidance only</StatusPill></header>
        <FieldGrid fields={workspace.visa.fields} />
      </section>
      <section className="merchant-lifecycle-panel merchant-needed-panel">
        <header><span className="merchant-panel-icon">CHK</span><div><h3>Evidence checklist</h3><p>Confirm whether each requirement is supported in the source documents.</p></div></header>
        <ul>{workspace.visa.requirements.map((item) => <li key={item}><span aria-hidden="true">○</span>{item}</li>)}</ul>
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

export default function MerchantIntelligenceWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const workspace = useMemo(() => getMerchantIntelligence(activeCase), [activeCase]);
  const [activeSection, setActiveSection] = useState('merchant-response');
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    setActiveSection('merchant-response');
    setSelectedDocument(null);
  }, [activeCase.id]);

  if (selectedDocument) {
    return <DocumentSheet document={selectedDocument} activeCase={activeCase} onClose={() => setSelectedDocument(null)} pin={pin} saveNote={saveNote} />;
  }

  const sectionProps = { workspace, onOpen: setSelectedDocument, openTool };
  const sections = {
    'claim-details': <ClaimDetails {...sectionProps} />,
    'network-submission': <NetworkSubmission {...sectionProps} />,
    'merchant-response': <MerchantResponse {...sectionProps} />,
    'customer-evidence': <CustomerEvidence {...sectionProps} />,
    'visa-requirements': <VisaRequirements {...sectionProps} />,
    'case-status': <CaseStatus {...sectionProps} />,
  };

  return (
    <section className="merchant-lifecycle" aria-label="Merchant Intelligence chargeback lifecycle">
      <header className="merchant-lifecycle-heading">
        <div><p>Merchant Intelligence</p><h2>Chargeback lifecycle view</h2><span>Review the customer claim, network exchange, merchant response, and source documents without assigning an outcome.</span></div>
        <StatusPill tone="neutral">Evidence First</StatusPill>
      </header>

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
        <button type="button" onClick={() => openTool('Document Request')}>Request customer documents</button>
        <button type="button" className="primary" onClick={jumpDecision}>Continue to decision →</button>
      </nav>

      <footer className="investigation-tool-review-bar"><div><strong>Merchant Intelligence review</strong><span>Marking this tool reviewed records process completion only. It does not determine the claim.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Merchant Intelligence')}>{reviewed ? 'Merchant Intelligence reviewed' : 'Mark Merchant Intelligence reviewed'}</button></footer>
    </section>
  );
}
