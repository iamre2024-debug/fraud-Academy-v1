import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import MobileLunaPortrait, { MobileFraudShield } from './MobileLunaPortrait.jsx';

function fallbackFacts(activeCase) {
  return [
    ['Lane', activeCase.lane ?? 'Not supplied'],
    ['Subtype', activeCase.subtype ?? 'Not supplied'],
    ['Reported', activeCase.reportedDate ?? activeCase.opened],
    ['Issue start', activeCase.issueStartDate ?? 'Not supplied'],
    ['Amount / exposure', activeCase.amountExposure ?? activeCase.amount],
  ];
}

function mobileToolName(tool) {
  return tool === 'KYB Review' ? 'Business Intelligence' : tool;
}

function internalToolName(tool) {
  return tool === 'Business Intelligence' ? 'KYB Review' : tool;
}

function toolGlyph(tool) {
  if (/timeline/i.test(tool)) return '⌁';
  if (/document/i.test(tool)) return '▤';
  if (/customer|identity|employee/i.test(tool)) return '♙';
  if (/business|merchant/i.test(tool)) return '▥';
  if (/financial|payment|payroll/i.test(tool)) return '▰';
  if (/device|login|session|ip/i.test(tool)) return '◇';
  if (/link/i.test(tool)) return '⌘';
  return '✦';
}

export default function MobileMissionCaseBriefing({
  activeCase,
  jumpDecision,
  openMoreTools,
  openNotes,
  openQueue,
  openTool,
  pin,
  recordAction,
}) {
  const intake = activeCase.intake ?? {};
  const documents = activeCase.documents ?? [];
  const statement = activeCase.statement ?? {
    label: 'Customer statement',
    value: activeCase.allegation ?? activeCase.queueReason,
    source: intake.channel ?? 'Case queue',
  };
  const intakeAnswers = activeCase.intakeAnswers ?? [];
  const facts = activeCase.keyFacts?.length ? activeCase.keyFacts.slice(0, 8) : fallbackFacts(activeCase);
  const parties = activeCase.parties ?? activeCase.caseBriefing?.parties ?? [];
  const detailRows = activeCase.briefingDetails?.rows ?? activeCase.caseBriefing?.details?.rows ?? [];
  const availableTools = new Set(activeCase.availableTools ?? []);
  const firstTool = availableTools.has('Customer 360')
    ? 'Customer 360'
    : availableTools.has('Business 360')
      ? 'Business 360'
      : activeCase.requiredTools?.find((tool) => tool !== 'Case Summary' && availableTools.has(tool))
        ?? activeCase.availableTools?.find((tool) => !['Timeline', 'System Access Lane'].includes(tool));
  const quickTools = [...new Set([...(activeCase.requiredTools ?? []), ...(activeCase.availableTools ?? [])])]
    .filter((tool) => !['Case Summary', 'Customer 360', 'Business 360', 'Timeline'].includes(tool) && availableTools.has(tool))
    .map(mobileToolName)
    .filter((tool, index, tools) => tools.indexOf(tool) === index)
    .slice(0, 4);
  const allegation = activeCase.caseBriefing?.summary ?? activeCase.shortSummary ?? activeCase.queueReason ?? activeCase.allegation;

  function record(action, detail) {
    recordAction?.(action, detail, 'Case Briefing');
  }

  function openEvidenceTool(tool, stage) {
    const target = mobileToolName(tool);
    record('Opened evidence area', `${target} opened from the mobile Case Briefing.`);
    openTool(internalToolName(target), stage);
  }

  function beginInvestigation() {
    if (!firstTool) {
      openMoreTools();
      return;
    }
    const target = mobileToolName(firstTool);
    record('Began investigation', `${target} opened from the mobile Case Briefing.`);
    openTool(internalToolName(target), 'investigate');
  }

  return (
    <section className="mission-briefing-v4" data-workspace-page="briefing" data-mobile-reference-briefing="v2">
      <section className="mission-briefing-case-banner">
        <MobileFraudShield size={46} />
        <div>
          <p>Active case</p>
          <h1>{activeCase.id}</h1>
          <small>{activeCase.type}{activeCase.subtype ? ` · ${activeCase.subtype}` : ''}</small>
        </div>
        <span>{activeCase.status}</span>
        <button type="button" aria-label="Pin active case identifier" onClick={() => pin(activeCase.id)}>⌖</button>
      </section>

      <section className="mission-briefing-allegation">
        <header>
          <span aria-hidden="true">▤</span>
          <div><p>Case intake</p><h2>Allegation Summary</h2></div>
          <MobileLunaPortrait size={48} />
        </header>
        <DirectCollapsibleText as="p" mobileLines={6}>{allegation}</DirectCollapsibleText>
        <dl>
          <div><dt>Customer / business</dt><dd>{activeCase.person}</dd></div>
          <div><dt>Amount at issue</dt><dd>{activeCase.amountExposure ?? activeCase.amount}</dd></div>
          <div><dt>Reported issue</dt><dd>{activeCase.queueReason ?? activeCase.type}</dd></div>
          <div><dt>Channel</dt><dd>{intake.channel ?? 'Case queue'}</dd></div>
        </dl>
      </section>

      <section className="mission-briefing-columns">
        <article className="mission-briefing-quick-facts">
          <header><span>⌁</span><h2>Quick Facts</h2></header>
          <dl>
            <div><dt>Claim ID</dt><dd>{activeCase.claimId ?? activeCase.id}</dd></div>
            <div><dt>Account ID</dt><dd>{activeCase.accountId ?? 'Not supplied'}</dd></div>
            <div><dt>Reported</dt><dd>{activeCase.reportedDate ?? intake.contactTime ?? activeCase.opened}</dd></div>
            <div><dt>Priority</dt><dd>{activeCase.priority ?? 'Not supplied'}</dd></div>
            {facts.slice(0, 4).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </article>

        <article className="mission-briefing-source-deck">
          <header><span>✓</span><h2>Available Records</h2></header>
          {documents.length ? (
            <ul>
              {documents.slice(0, 6).map((document, index) => (
                <li key={document.id ?? `${document.title}-${index}`}>
                  <button type="button" onClick={() => openEvidenceTool('Document Viewer')}>
                    <i aria-hidden="true">{document.status === 'Received' ? '●' : '○'}</i>
                    <span><strong>{document.title ?? document.type ?? `Document ${index + 1}`}</strong><small>{document.status ?? 'Available'}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p>No customer documents have been received.</p>}
        </article>
      </section>

      <blockquote className="mission-briefing-statement">
        <span>{statement.label}</span>
        <p>{statement.value}</p>
        <cite>Source: {statement.source}</cite>
      </blockquote>

      {!!intakeAnswers.length && (
        <details className="mission-briefing-details">
          <summary><span>Customer intake</span><small>{intakeAnswers.length} recorded answer{intakeAnswers.length === 1 ? '' : 's'}</small><b>＋</b></summary>
          <ol>
            {intakeAnswers.map((item, index) => (
              <li key={`${item.prompt}-${index}`}><strong>{item.prompt}</strong><p>{item.answer}</p></li>
            ))}
          </ol>
        </details>
      )}

      {(parties.length > 0 || detailRows.length > 0) && (
        <details className="mission-briefing-details">
          <summary><span>People & relationships</span><small>Factual case connections</small><b>＋</b></summary>
          {!!parties.length && (
            <div className="mission-briefing-parties">
              {parties.slice(0, 6).map((party) => (
                <article key={party.id ?? `${party.role}-${party.name}`}>
                  <small>{party.role}</small><strong>{party.name}</strong><p>{party.relationship}</p>
                </article>
              ))}
            </div>
          )}
          {!!detailRows.length && (
            <dl className="mission-briefing-detail-rows">
              {detailRows.slice(0, 8).map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
            </dl>
          )}
        </details>
      )}

      <button type="button" className="mission-briefing-open-workspace" onClick={beginInvestigation}>
        Open workspace <span>›</span>
      </button>

      {!!quickTools.length && (
        <section className="mission-briefing-tool-row" aria-label="Suggested case tools">
          <header><h2>Investigation tools</h2><button type="button" onClick={openMoreTools}>View all</button></header>
          <div>
            {quickTools.map((tool) => (
              <button key={tool} type="button" onClick={() => openEvidenceTool(tool)}>
                <span>{toolGlyph(tool)}</span><strong>{tool}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      <nav className="mission-briefing-actions" aria-label="Case briefing actions">
        <button type="button" onClick={() => { record('Opened notes', 'Opened notes from the mobile Case Briefing.'); openNotes(); }}>▤<small>Notes</small></button>
        <button type="button" onClick={() => openEvidenceTool('Timeline', 'timeline')}>⌁<small>Timeline</small></button>
        <button type="button" onClick={() => { record('Opened tool deck', 'Opened the investigation tool deck from the mobile Case Briefing.'); openMoreTools(); }}>⊞<small>All tools</small></button>
        <button type="button" onClick={() => { record('Opened determination', 'Opened Submit Decision from the mobile Case Briefing.'); jumpDecision(); }}>✓<small>Decide</small></button>
        <button type="button" onClick={openQueue}>▣<small>Cases</small></button>
      </nav>
    </section>
  );
}
