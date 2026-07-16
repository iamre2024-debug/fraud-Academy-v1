import { useEffect, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

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
  const [mobilePage, setMobilePage] = useState(1);
  const [mobileIntakePage, setMobileIntakePage] = useState(0);
  const intake = activeCase.intake ?? {};
  const documents = activeCase.documents ?? [];
  const intakeAnswers = activeCase.intakeAnswers ?? [];
  const statement = activeCase.statement ?? { label: 'Customer statement', value: activeCase.allegation ?? activeCase.queueReason, source: intake.channel ?? 'Case queue' };
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
    .filter((item) => !['Case Summary', 'Customer 360', 'Document Viewer'].includes(item) && availableToolNames.has(item))
    .slice(0, 3);
  const mobilePageCount = chargebackDetails || activeCase.creditDecision ? 7 : 6;
  const mobilePageLabels = ['Overview', 'Briefing summary', 'Claim intake', 'Statement and facts', 'Case parties', 'Case details', chargebackDetails ? 'Chargeback details' : 'Credit details'];

  useEffect(() => {
    setMobilePage(1);
    setMobileIntakePage(0);
  }, [activeCase.id]);

  function changeMobilePage(nextPage) {
    setMobilePage(Math.min(mobilePageCount, Math.max(1, nextPage)));
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

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
      <div className="case-briefing-theme-v1" aria-labelledby="case-briefing-title" data-case-briefing-screen="approved-theme-v1" data-mobile-briefing-current={mobilePage}>
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

        <nav className="mobile-case-briefing-pager" aria-label="Case Briefing pages">
          <button type="button" onClick={() => changeMobilePage(mobilePage - 1)} disabled={mobilePage === 1}>Previous</button>
          <span><small>Page {mobilePage} of {mobilePageCount}</small><strong>{mobilePageLabels[mobilePage - 1]}</strong></span>
          <button type="button" onClick={() => changeMobilePage(mobilePage + 1)} disabled={mobilePage === mobilePageCount}>Next</button>
        </nav>

        <div className="case-briefing-card-grid">
          <article className="case-briefing-card case-briefing-overview-card" data-mobile-briefing-page="1" data-mobile-briefing-active={mobilePage === 1 ? 'true' : 'false'}>
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

          <article className="case-briefing-card case-briefing-summary-card" data-mobile-briefing-page="2" data-mobile-briefing-active={mobilePage === 2 ? 'true' : 'false'}>
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

          <section className="case-briefing-metrics" aria-label="Case at a glance" data-mobile-briefing-page="2" data-mobile-briefing-active={mobilePage === 2 ? 'true' : 'false'}>
            <article><span>Claim amount</span><strong>{activeCase.amount}</strong></article>
            <article><span>Queue status</span><strong>{activeCase.status ?? 'Open'}</strong></article>
            <article><span>Priority</span><strong>{activeCase.priority ?? 'Standard'}</strong></article>
            <article data-briefing-owner="true"><span>Assigned investigator</span><strong>{assignedInvestigator}</strong><small>{assignmentTeam}</small></article>
            <article data-briefing-due-date="true"><span>Due date</span><strong>{dueDate}</strong></article>
            <article><span>Documents</span><strong>{documents.length}</strong></article>
          </section>

          <article className="case-briefing-card case-briefing-intake-card" data-mobile-briefing-page="3" data-mobile-briefing-active={mobilePage === 3 ? 'true' : 'false'}>
            <div className="case-briefing-card-heading">
              <span aria-hidden="true">03</span>
              <div>
                <p>Structured intake</p>
                <h3>Claim Intake Form</h3>
              </div>
            </div>
            {intakeAnswers.length > 1 && (
              <nav className="mobile-intake-answer-pager" aria-label="Claim Intake questions">
                <button type="button" onClick={() => setMobileIntakePage((current) => Math.max(0, current - 1))} disabled={mobileIntakePage === 0}>Previous</button>
                <span>Question {mobileIntakePage + 1} of {intakeAnswers.length}</span>
                <button type="button" onClick={() => setMobileIntakePage((current) => Math.min(intakeAnswers.length - 1, current + 1))} disabled={mobileIntakePage === intakeAnswers.length - 1}>Next</button>
              </nav>
            )}
            <div className="case-briefing-intake-answer-list">
              {intakeAnswers.map((item, index) => (
                <article key={item.id} data-mobile-intake-active={mobileIntakePage === index ? 'true' : 'false'}>
                  <strong>{item.prompt}</strong>
                  <DirectCollapsibleText as="p" lines={2} mobileLines={3}>{item.answer}</DirectCollapsibleText>
                </article>
              ))}
              {!intakeAnswers.length && <p className="case-briefing-empty">No structured intake answers are available for this case yet.</p>}
            </div>
          </article>

          <article className="case-briefing-card case-briefing-statement-card" data-mobile-briefing-page="4" data-mobile-briefing-active={mobilePage === 4 ? 'true' : 'false'}>
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

          <article className="case-briefing-card case-briefing-facts-card" data-mobile-briefing-page="4" data-mobile-briefing-active={mobilePage === 4 ? 'true' : 'false'}>
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

          <article className="case-briefing-card case-briefing-parties-card" data-case-briefing-parties="true" data-mobile-briefing-page="5" data-mobile-briefing-active={mobilePage === 5 ? 'true' : 'false'}>
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
              {!parties.length && <p className="case-briefing-empty">No separate party records are available for this case yet.</p>}
            </div>
          </article>

          <article className="case-briefing-card case-briefing-detail-card" data-case-briefing-details="true" data-mobile-briefing-page="6" data-mobile-briefing-active={mobilePage === 6 ? 'true' : 'false'}>
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

          {chargebackDetails && (
            <article className="case-briefing-card case-briefing-chargeback-card" data-mobile-briefing-page="7" data-mobile-briefing-active={mobilePage === 7 ? 'true' : 'false'}>
              <div className="case-briefing-card-heading">
                <span aria-hidden="true">08</span>
                <div>
                  <p>Chargeback review rail</p>
                  <h3>Reason code and review details</h3>
                </div>
              </div>
              <dl className="case-briefing-facts-grid">
                <div><dt>Reason code guide</dt><dd>{chargebackDetails.reasonCode}</dd></div>
                <div><dt>Response deadline</dt><dd>{chargebackDetails.responseDeadline}</dd></div>
                <div><dt>Merchant evidence</dt><dd>{chargebackDetails.merchantEvidence}</dd></div>
                <div><dt>Authorization review</dt><dd>{chargebackDetails.authorizationReview}</dd></div>
                <div><dt>Service / delivery review</dt><dd>{chargebackDetails.fulfillmentReview}</dd></div>
                <div><dt>Customer contact</dt><dd>{chargebackDetails.customerContact}</dd></div>
              </dl>
            </article>
          )}

          {activeCase.creditDecision && (
            <article className="case-briefing-card case-briefing-credit-card" data-mobile-briefing-page="7" data-mobile-briefing-active={mobilePage === 7 ? 'true' : 'false'}>
              <div className="case-briefing-card-heading">
                <span aria-hidden="true">08</span>
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
