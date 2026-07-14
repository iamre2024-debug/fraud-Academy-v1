import DirectCollapsibleText from './DirectCollapsibleText.jsx';

function documentStatusClass(status = '') {
  return String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'neutral';
}

export default function CaseSummaryCard({ activeCase, pin, openTool, jumpDecision, openNotes, openMoreTools }) {
  const intake = activeCase.intake ?? {};
  const documents = activeCase.documents ?? [];
  const focusAreas = activeCase.briefingQuestions?.length
    ? activeCase.briefingQuestions
    : [
      'What opened this case?',
      'Which records should be compared first?',
      'What evidence should be documented before a determination?',
    ];

  const beginInvestigation = () => openTool('Customer 360', 'investigate');
  const openNotebook = () => (openNotes ? openNotes() : openTool('Evidence Center', 'indicators'));
  const showMoreTools = () => (openMoreTools ? openMoreTools() : openTool('Customer 360', 'investigate'));

  return (
    <section className="ornate-card case-summary-visual" data-case-briefing-container="approved-theme-v1">
      <div className="case-briefing-theme-v1" aria-labelledby="case-briefing-title" data-case-briefing-screen="approved-theme-v1">
        <header className="case-briefing-header">
          <div>
            <p className="case-briefing-eyebrow">Active Case · Evidence First</p>
            <h2 id="case-briefing-title">Case Briefing</h2>
            <p>Understand why this case exists, then open the records needed to verify the story.</p>
          </div>
          <div className="case-briefing-header-actions">
            <span className={`case-briefing-priority priority-${String(activeCase.priority ?? 'standard').toLowerCase()}`}>{activeCase.priority ?? 'Standard'} priority</span>
            <button type="button" className="case-briefing-pin" onClick={() => pin(activeCase.id)}>Pin Case</button>
          </div>
        </header>

        <div className="case-briefing-card-grid">
          <article className="case-briefing-card case-briefing-overview-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">01</span>
              <div>
                <p>Case overview</p>
                <h3>{activeCase.person}</h3>
              </div>
            </div>
            <div className="case-summary-meta-grid">
              <article><small>Name</small><strong>{activeCase.person}</strong></article>
              <article><small>Claim ID</small><strong>{activeCase.claimId ?? activeCase.id}</strong></article>
              <article><small>Total claim amount</small><strong>{activeCase.amount}</strong></article>
              <article><small>Case type</small><strong>{activeCase.type}</strong></article>
              <article className="wide">
                <small>Transaction / payee info</small>
                <DirectCollapsibleText as="strong" lines={2} mobileLines={3}>
                  {activeCase.transactionInfo ?? activeCase.type}
                </DirectCollapsibleText>
              </article>
              <article className="wide">
                <small>Short summary</small>
                <DirectCollapsibleText as="strong" lines={2} mobileLines={3}>
                  {activeCase.shortSummary ?? activeCase.queueReason}
                </DirectCollapsibleText>
              </article>
            </div>
          </article>

          <article className="case-briefing-card case-briefing-summary-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">02</span>
              <div>
                <p>Why the case exists</p>
                <h3>Briefing summary</h3>
              </div>
            </div>
            <p className="case-briefing-allegation">{activeCase.allegation ?? activeCase.queueReason}</p>
            <dl className="case-briefing-intake-grid">
              <div><dt>Intake channel</dt><dd>{intake.channel ?? 'Case queue'}</dd></div>
              <div><dt>Reported / opened</dt><dd>{intake.contactTime ?? activeCase.opened}</dd></div>
              <div><dt>Customer location</dt><dd>{intake.customerLocation ?? 'Not provided'}</dd></div>
              <div><dt>Stated device</dt><dd>{intake.statedDevice ?? 'Not provided'}</dd></div>
            </dl>
          </article>

          <section className="case-briefing-metrics" aria-label="Case at a glance">
            <article><span>Claim amount</span><strong>{activeCase.amount}</strong></article>
            <article><span>Queue status</span><strong>{activeCase.status ?? 'Open'}</strong></article>
            <article><span>Opened</span><strong>{activeCase.opened}</strong></article>
            <article><span>Documents</span><strong>{documents.length}</strong></article>
          </section>

          <article className="case-briefing-card case-briefing-focus-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">03</span>
              <div>
                <p>Investigator prompts</p>
                <h3>Key focus areas</h3>
              </div>
            </div>
            <ol>
              {focusAreas.slice(0, 4).map((question, index) => (
                <li key={`${activeCase.id}-focus-${index}`}><span>{index + 1}</span><p>{question}</p></li>
              ))}
            </ol>
          </article>

          <article className="case-briefing-card case-briefing-luna-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">L</span>
              <div>
                <p>Process support only</p>
                <h3>Luna Briefing Assistant</h3>
              </div>
            </div>
            <p>I can help you organize the investigation without revealing an outcome or steering your determination.</p>
            <ul>
              <li>Start with the allegation or system alert.</li>
              <li>Compare records before pinning evidence.</li>
              <li>Document what is known, missing, and still unverified.</li>
            </ul>
          </article>

          <article className="case-briefing-card case-briefing-documents-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">04</span>
              <div>
                <p>Case packet</p>
                <h3>Recent documents</h3>
              </div>
            </div>
            <div className="case-briefing-document-list">
              {documents.slice(0, 3).map((document) => (
                <div key={document.id}>
                  <span className={`document-status status-${documentStatusClass(document.status)}`}>{document.status}</span>
                  <div><strong>{document.name ?? document.title}</strong><small>{document.detail ?? 'Available in the case packet'}</small></div>
                </div>
              ))}
              {!documents.length && <p className="case-briefing-empty">No documents are listed in this case packet yet.</p>}
            </div>
            <button type="button" className="case-briefing-secondary-action" onClick={() => openTool('Document Request', 'investigate')}>Open Document Request</button>
          </article>
        </div>

        <nav className="case-briefing-utilities" aria-label="Case briefing utilities">
          <button type="button" onClick={beginInvestigation}><span aria-hidden="true">⌂</span>Workspace</button>
          <button type="button" onClick={() => openTool('Timeline', 'timeline')}><span aria-hidden="true">◷</span>Timeline</button>
          <button type="button" onClick={openNotebook}><span aria-hidden="true">✎</span>Notes</button>
          <button type="button" onClick={showMoreTools}><span aria-hidden="true">＋</span>More Tools</button>
          <button type="button" className="case-briefing-primary-action" onClick={beginInvestigation}>Begin Investigation <span aria-hidden="true">→</span></button>
        </nav>

        <nav className="case-briefing-utilities case-briefing-quick-routes" aria-label="Case briefing quick routes">
          <button type="button" onClick={() => openTool('Transaction History')}>Transaction History</button>
          <button type="button" onClick={() => openTool('Identity Intel / People Search')}>Identity Intel</button>
          <button type="button" onClick={() => openTool('Login History')}>Login History</button>
          <button type="button" className="decision-jump-button" onClick={jumpDecision}>Submit Decision</button>
        </nav>
      </div>
    </section>
  );
}
