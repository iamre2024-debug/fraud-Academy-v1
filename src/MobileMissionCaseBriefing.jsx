import { MobileFraudShield } from './MobileLunaPortrait.jsx';

function mobileToolName(tool) {
  return tool === 'KYB Review' ? 'Business Intelligence' : tool;
}

function internalToolName(tool) {
  return tool === 'Business Intelligence' ? 'KYB Review' : tool;
}

function compactCaseStatus(status = '') {
  if (/closed|complete|submitted/i.test(status)) return 'Complete';
  return 'Active Case';
}

function findDetail(rows, ...patterns) {
  return rows.find((row) => patterns.some((pattern) => pattern.test(row.label ?? '')));
}

function buildQuickFacts(activeCase, detailRows) {
  const subject = findDetail(detailRows, /merchant|payee|business|employer/i)
    ?? findDetail(detailRows, /customer|applicant|employee|primary person/i);
  const activityDate = findDetail(detailRows, /activity date|posted|reported|effective date|instruction date|issue start/i);
  const record = findDetail(detailRows, /transaction record|payment record|claim id|account id|record id/i);
  const instrument = findDetail(detailRows, /payment instrument|destination|product|account context|transaction channel/i);

  return [
    {
      icon: '▥',
      label: subject?.label ?? 'Customer / business',
      value: subject?.value ?? activeCase.person,
    },
    {
      icon: '▤',
      label: activityDate?.label ?? 'Reported date',
      value: activityDate?.value ?? activeCase.reportedDate ?? activeCase.opened ?? 'Not supplied',
    },
    {
      icon: '#',
      label: record?.label ?? (activeCase.claimId ? 'Claim ID' : 'Case ID'),
      value: record?.value ?? activeCase.claimId ?? activeCase.id,
    },
    {
      icon: '▰',
      label: instrument?.label ?? 'Account',
      value: instrument?.value ?? activeCase.accountId ?? 'Not supplied',
    },
  ];
}

function buildEvidenceChecklist(activeCase, currentCompleted = []) {
  const completed = new Set(currentCompleted.map(internalToolName));
  const records = [];
  const seen = new Set();
  const add = (item) => {
    const key = String(item.label ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    records.push(item);
  };

  (activeCase.documents ?? []).forEach((document) => {
    const label = document.title ?? document.name ?? document.type ?? 'Case document';
    add({
      id: document.id ?? label,
      label,
      status: document.status ?? 'Available',
      complete: /received/i.test(document.status ?? ''),
      tool: 'Document Viewer',
    });
  });

  (activeCase.requiredTools ?? []).forEach((tool) => {
    if (['Case Summary', 'Timeline', 'System Access Lane'].includes(tool)) return;
    const displayTool = mobileToolName(tool);
    add({
      id: tool,
      label: displayTool,
      status: completed.has(tool) ? 'Reviewed' : 'Not reviewed',
      complete: completed.has(tool),
      tool: displayTool,
    });
  });

  return records.slice(0, 6);
}

export default function MobileMissionCaseBriefing({
  activeCase,
  currentCompleted,
  openMoreTools,
  openTool,
  quickPin,
  recordAction,
}) {
  const intake = activeCase.intake ?? {};
  const detailRows = activeCase.briefingDetails?.rows ?? activeCase.caseBriefing?.details?.rows ?? [];
  const availableTools = new Set(activeCase.availableTools ?? []);
  const requiredHomeBase = activeCase.requiredTools?.find((tool) => ['Customer 360', 'Business 360'].includes(tool) && availableTools.has(tool));
  const firstTool = requiredHomeBase
    ?? (availableTools.has('Customer 360')
      ? 'Customer 360'
      : availableTools.has('Business 360')
        ? 'Business 360'
      : activeCase.requiredTools?.find((tool) => tool !== 'Case Summary' && availableTools.has(tool))
        ?? activeCase.availableTools?.find((tool) => !['Timeline', 'System Access Lane'].includes(tool)));
  const allegation = activeCase.caseBriefing?.summary ?? activeCase.shortSummary ?? activeCase.queueReason ?? activeCase.allegation;
  const quickFacts = buildQuickFacts(activeCase, detailRows);
  const evidenceChecklist = buildEvidenceChecklist(activeCase, currentCompleted);
  const receivedEvidence = evidenceChecklist.filter((item) => item.complete).length;

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
        <button
          type="button"
          className="mission-briefing-case-shield"
          aria-label="Pin Case ID to Quick Pad"
          onClick={() => quickPin?.({
            label: 'Case ID',
            value: activeCase.id,
            sourceTool: 'Case Briefing',
            sourceRecordId: activeCase.id,
          })}
        >
          <MobileFraudShield size={46} />
        </button>
        <div className="mission-briefing-case-copy">
          <div>
            <h1>{activeCase.id}</h1>
            <span>{compactCaseStatus(activeCase.status)}</span>
          </div>
          <small>{activeCase.type}{activeCase.subtype ? ` · ${activeCase.subtype}` : ''}</small>
        </div>
      </section>

      <section className="mission-briefing-allegation">
        <header>
          <span aria-hidden="true">▤</span>
          <h2>Allegation Summary</h2>
        </header>
        <p>{allegation}</p>
        <dl>
          <div>
            <span aria-hidden="true">♙</span>
            <div><dt>Customer</dt><dd>{activeCase.person}</dd><small>{activeCase.trainingId ? `Training ID: ${activeCase.trainingId}` : activeCase.accountId}</small></div>
          </div>
          <div>
            <span aria-hidden="true">$</span>
            <div><dt>Amount at risk</dt><dd>{activeCase.amountExposure ?? activeCase.amount ?? 'Not supplied'}</dd><small>{activeCase.accountId ?? 'Case amount'}</small></div>
          </div>
          <div>
            <span aria-hidden="true">△</span>
            <div><dt>Reported issue</dt><dd>{activeCase.queueReason ?? activeCase.type}</dd><small>{activeCase.reportedDate ?? activeCase.opened}</small></div>
          </div>
          <div>
            <span aria-hidden="true">▯</span>
            <div><dt>Channel</dt><dd>{intake.channel ?? 'Case queue'}</dd><small>{intake.statedDevice ?? 'Case intake'}</small></div>
          </div>
        </dl>
      </section>

      <section className="mission-briefing-columns">
        <article className="mission-briefing-quick-facts">
          <header><h2>Quick Facts</h2></header>
          <ul>
            {quickFacts.map((fact) => (
              <li key={fact.label}>
                <span aria-hidden="true">{fact.icon}</span>
                <div><small>{fact.label}</small><strong>{fact.value}</strong></div>
              </li>
            ))}
          </ul>
        </article>

        <article className="mission-briefing-evidence-checklist">
          <header>
            <h2>Evidence Checklist</h2>
            <strong>{receivedEvidence} / {evidenceChecklist.length}</strong>
          </header>
          <ul>
            {evidenceChecklist.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => openEvidenceTool(item.tool)}>
                  <i className={item.complete ? 'complete' : ''} aria-hidden="true">{item.complete ? '✓' : ''}</i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <button type="button" className="mission-briefing-open-workspace" onClick={beginInvestigation}>
        Open workspace <span>›</span>
      </button>
    </section>
  );
}
