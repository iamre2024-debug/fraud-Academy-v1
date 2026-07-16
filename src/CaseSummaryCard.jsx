import DirectCollapsibleText from './DirectCollapsibleText.jsx';

function documentStatusClass(status = '') {
  return String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'neutral';
}

function displayFacts(activeCase) {
  const facts = activeCase.keyFacts?.length ? activeCase.keyFacts : [
    ['Lane', activeCase.lane ?? 'Not supplied'],
    ['Subtype', activeCase.subtype ?? 'Not supplied'],
    ['Reported date', activeCase.reportedDate ?? activeCase.opened],
    ['Issue start date', activeCase.issueStartDate ?? 'Not supplied'],
    ['Amount / exposure', activeCase.amountExposure ?? activeCase.amount],
  ];
  return facts.slice(0, 8);
}

export default function CaseSummaryCard({
  activeCase,
  pin,
  openTool,
  jumpDecision,
  openNotes,
  openMoreTools,
  openQueue,
  recordAction,
}) {
  const intake = activeCase.intake ?? {};
  const documents = activeCase.documents ?? [];
  const intakeAnswers = activeCase.intakeAnswers ?? [];
  const statement = activeCase.statement ?? { label: 'Customer statement', value: activeCase.allegation ?? activeCase.queueReason, source: intake.channel ?? 'Case queue' };
  const evidenceAreas = activeCase.caseBriefing?.evidenceAreas ?? activeCase.evidenceAreas ?? [];
  const chargebackDetails = activeCase.chargebackDecision;
  const facts = displayFacts(activeCase);
  const assignedInvestigator = activeCase.assignedInvestigator ?? activeCase.caseBriefing?.assignedInvestigator ?? 'Training queue · unassigned';
  const assignedDate = activeCase.assignedDate ?? activeCase.caseBriefing?.assignedDate ?? activeCase.reportedDate ?? activeCase.opened;
  const assignmentTeam = activeCase.assignmentTeam ?? activeCase.caseBriefing?.assignmentTeam ?? 'Fraud investigation';
  const dueDate = activeCase.dueDate ?? activeCase.caseBriefing?.dueDate ?? 'Review deadline not supplied';
  const parties = activeCase.parties ?? activeCase.caseBriefing?.parties ?? [];
  const briefingDetails = activeCase.briefingDetails ?? activeCase.caseBriefing?.details ?? { eyebrow: 'Structured case details', title: 'Account details', rows: [] };
  const availableToolNames = new Set(activeCase.availableTools ?? []);
  const firstInvestigationTool = availableToolNames.has('Customer 360')
    ? 'Customer 360'
    : activeCase.requiredTools?.find((item) => item !== 'Case Summary' && availableToolNames.has(item))
      ?? activeCase.availableTools?.find((item) => !['Timeline', 'System Access Lane'].includes(item));
  const quickRoutes = [...new Set([...(activeCase.requiredTools ?? []), ...(activeCase.availableTools ?? [])])]
    .filter((item) => item !== 'Case Summary' && item !== 'Customer 360' && availableToolNames.has(item))
    .slice(0, 3);

  function recordBriefingAction(action, detail) {
    recordAction?.(action, detail, 'Case Briefing');
  }

  function beginInvestigation() {
    if (!firstInvestigationTool) return;
    recordBriefingAction('Began investigation', `Opened ${firstInvestigationTool} from Case Briefing.`);
    openTool(firstInvestigationTool, 'investigate');
  }

  function openNotebook() {
    recordBriefingAction('Opened notes', 'Opened the case notebook from Case Briefing.');
    if (openNotes) openNotes();
  }

  function showMoreTools() {
    recordBriefingAction('Opened tool workspace', 'Opened the full investigation tool workspace from Case Briefing.');
    if (openMoreTools) openMoreTools();
    else openTool('Customer 360', 'investigate');
  }

  function openRoute(toolName, stage) {
    recordBriefingAction('Opened evidence area', `${toolName} opened from Case Briefing.`);
    openTool(toolName, stage);
  }

  return (
    <section className="ornate-card case-summary-visual" data-case-briefing-container="approved-theme-v1">
      <div className="case-briefing-theme-v1" aria-labelledby="case-briefing-title" data-case-briefing-screen="approved-theme-v1">
        <header className="case-briefing-header">
          <div>
            <p className="case-briefing-eyebrow">Active Case · Evidence First</p>
            <h2 id="case-briefing-title">Case Briefing</h2>
            <p>Understand the intake, statement, facts, and available records before opening the investigation workspace.</p>
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
              <article><small>Account ID</small><strong>{activeCase.accountId}</strong></article>
              <article><small>Total claim amount</small><strong>{activeCase.amount}</strong></article>
              <article><small>Case type</small><strong>{activeCase.claimType ?? activeCase.type}</strong></article>
              <article><small>Lane</small><strong>{activeCase.lane ?? 'Not supplied'}</strong></article>
              <article><small>Subtype</small><strong>{activeCase.subtype ?? 'Not supplied'}</strong></article>
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
            <p className="case-briefing-allegation">{activeCase.caseBriefing?.summary ?? activeCase.allegation ?? activeCase.queueReason}</p>
            <dl className="case-briefing-intake-grid">
              <div><dt>Intake channel</dt><dd>{intake.channel ?? 'Case queue'}</dd></div>
              <div><dt>Reported / opened</dt><dd>{activeCase.reportedDate ?? intake.contactTime ?? activeCase.opened}</dd></div>
              <div><dt>Assigned</dt><dd>{assignedDate}</dd></div>
              <div><dt>Review due</dt><dd>{dueDate}</dd></div>
              <div><dt>Customer location</dt><dd>{intake.customerLocation ?? 'Not provided'}</dd></div>
              <div><dt>Stated device</dt><dd>{intake.statedDevice ?? 'Not provided'}</dd></div>
            </dl>
          </article>

          <section className="case-briefing-metrics" aria-label="Case at a glance">
            <article><span>Claim amount</span><strong>{activeCase.amount}</strong></article>
            <article><span>Queue status</span><strong>{activeCase.status ?? 'Open'}</strong></article>
            <article><span>Priority</span><strong>{activeCase.priority ?? 'Standard'}</strong></article>
            <article data-briefing-owner="true"><span>Assigned investigator</span><strong>{assignedInvestigator}</strong><small>{assignmentTeam}</small></article>
            <article data-briefing-due-date="true"><span>Due date</span><strong>{dueDate}</strong></article>
            <article><span>Documents</span><strong>{documents.length}</strong></article>
          </section>

          <article className="case-briefing-card case-briefing-intake-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">03</span>
              <div>
                <p>Structured intake</p>
                <h3>Claim Intake Form</h3>
              </div>
            </div>
            <div className="case-briefing-intake-answer-list">
              {intakeAnswers.map((item) => (
                <article key={item.id}>
                  <strong>{item.prompt}</strong>
                  <DirectCollapsibleText as="p" lines={2} mobileLines={3}>{item.answer}</DirectCollapsibleText>
                </article>
              ))}
              {!intakeAnswers.length && <p className="case-briefing-empty">No structured intake answers are included in this case packet yet.</p>}
            </div>
          </article>

          <article className="case-briefing-card case-briefing-statement-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">04</span>
              <div>
                <p>Claimant words</p>
                <h3>{statement.label}</h3>
              </div>
            </div>
            <DirectCollapsibleText as="p" lines={4} mobileLines={5}>{statement.value}</DirectCollapsibleText>
            <small>Source: {statement.source}</small>
          </article>

          <article className="case-briefing-card case-briefing-facts-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">05</span>
              <div>
                <p>Case data</p>
                <h3>Key Case Facts</h3>
              </div>
            </div>
            <dl className="case-briefing-facts-grid">
              {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </article>

          <article className="case-briefing-card case-briefing-parties-card" data-case-briefing-parties="true">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">06</span>
              <div>
                <p>People and organizations</p>
                <h3>Case parties</h3>
              </div>
            </div>
            <div className="case-briefing-party-list">
              {parties.map((party) => (
                <article key={party.id ?? `${party.role}-${party.name}`}>
                  <span>{party.role}</span>
                  <strong>{party.name}</strong>
                  <p>{party.relationship}</p>
                  <small>Source: {party.source}</small>
                </article>
              ))}
              {!parties.length && <p className="case-briefing-empty">No separate party records are included in this case packet yet.</p>}
            </div>
          </article>

          <article className="case-briefing-card case-briefing-detail-card" data-case-briefing-details="true">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">07</span>
              <div>
                <p>{briefingDetails.eyebrow}</p>
                <h3>{briefingDetails.title}</h3>
              </div>
            </div>
            <dl className="case-briefing-facts-grid case-briefing-detail-grid">
              {(briefingDetails.rows ?? []).slice(0, 8).map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
            </dl>
          </article>

          <article className="case-briefing-card case-briefing-evidence-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">08</span>
              <div>
                <p>Available evidence areas</p>
                <h3>Records in this packet</h3>
              </div>
            </div>
            <div className="case-briefing-evidence-chips">
              {evidenceAreas.slice(0, 6).map((area) => <span key={area}>{area}</span>)}
            </div>
            <small>These are neutral areas to review. The case packet does not prescribe an outcome.</small>
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
              <li>Start with the intake and statement.</li>
              <li>Compare records before pinning evidence.</li>
              <li>Document what is known, missing, and still unverified.</li>
            </ul>
          </article>

          <article className="case-briefing-card case-briefing-documents-card">
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">09</span>
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
            <div className="case-briefing-document-actions">
              <button type="button" className="case-briefing-secondary-action" onClick={() => openRoute('Document Request', 'investigate')}>Open Document Request</button>
            </div>
          </article>

          {chargebackDetails && (
            <article className="case-briefing-card case-briefing-chargeback-card">
              <div className="case-briefing-card-heading">
                <span aria-hidden="true">10</span>
                <div>
                  <p>Chargeback review rail</p>
                  <h3>Reason code and packet details</h3>
                </div>
              </div>
              <dl className="case-briefing-facts-grid">
                <div><dt>Reason code guide</dt><dd>{chargebackDetails.reasonCode}</dd></div>
                <div><dt>Response deadline</dt><dd>{chargebackDetails.responseDeadline}</dd></div>
                <div><dt>Merchant packet</dt><dd>{chargebackDetails.merchantEvidence}</dd></div>
                <div><dt>Authorization review</dt><dd>{chargebackDetails.authorizationReview}</dd></div>
                <div><dt>Service / delivery review</dt><dd>{chargebackDetails.fulfillmentReview}</dd></div>
                <div><dt>Customer contact</dt><dd>{chargebackDetails.customerContact}</dd></div>
              </dl>
            </article>
          )}

          {activeCase.creditDecision && (
            <article className="case-briefing-card case-briefing-credit-card">
              <div className="case-briefing-card-heading">
                <span aria-hidden="true">11</span>
                <div>
                  <p>Credit review rail</p>
                  <h3>Credit case details</h3>
                </div>
              </div>
              <dl className="case-briefing-facts-grid">
                <div><dt>Family</dt><dd>{activeCase.creditDecision.family}</dd></div>
                <div><dt>Deadline</dt><dd>{activeCase.creditDecision.deadline}</dd></div>
                <div><dt>Reason code</dt><dd>{activeCase.creditDecision.reasonCode}</dd></div>
                <div><dt>Documentation</dt><dd>{documents.filter((document) => /requested|pending/i.test(document.status)).length} requested</dd></div>
                <div><dt>Adverse-action training</dt><dd>{activeCase.creditDecision.adverseActionStatus}</dd></div>
                <div><dt>Escalation</dt><dd>{activeCase.creditDecision.escalationPath}</dd></div>
              </dl>
            </article>
          )}

        </div>

        <nav className="case-briefing-utilities" aria-label="Case briefing utilities">
          <button type="button" onClick={beginInvestigation}><span aria-hidden="true">⌂</span>Workspace</button>
          <button type="button" onClick={() => openRoute('Timeline', 'timeline')}><span aria-hidden="true">◷</span>Timeline</button>
          <button type="button" onClick={openNotebook}><span aria-hidden="true">✎</span>Notes</button>
          <button type="button" onClick={showMoreTools}><span aria-hidden="true">＋</span>More Tools</button>
          <button type="button" onClick={openQueue}><span aria-hidden="true">▣</span>Case Queue</button>
          <button type="button" className="case-briefing-primary-action" onClick={beginInvestigation}>Begin Investigation <span aria-hidden="true">→</span></button>
        </nav>

        <nav className="case-briefing-utilities case-briefing-quick-routes" aria-label="Case briefing quick routes">
          {quickRoutes.map((toolName) => (
            <button key={toolName} type="button" onClick={() => openRoute(toolName)}>
              {toolName === 'Identity Intel / People Search' ? 'Identity Intel' : toolName}
            </button>
          ))}
          <button type="button" className="decision-jump-button" onClick={() => { recordBriefingAction('Opened determination', 'Opened Submit Decision from Case Briefing.'); jumpDecision(); }}>Submit Decision</button>
        </nav>
      </div>
    </section>
  );
}
