import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import {
  publicCaseFacts,
  publicCaseSummary,
  publicCaseTaxonomy,
  publicReportedAllegation,
} from './data/publicCaseView.js';

function fallbackFacts(activeCase) {
  return publicCaseFacts(activeCase);
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
  const [page, setPage] = useState(0);
  const [intakePage, setIntakePage] = useState(0);
  const intake = activeCase.intake ?? {};
  const taxonomy = publicCaseTaxonomy(activeCase);
  const documents = activeCase.documents ?? [];
  const statement = {
    label: activeCase.statement?.label ?? (intake.channel === 'System alert' ? 'Reported alert' : 'Reported allegation'),
    value: publicReportedAllegation(activeCase),
    source: activeCase.statement?.source ?? intake.channel ?? 'Case queue',
  };
  const intakeAnswers = activeCase.intakeAnswers ?? [];
  const facts = activeCase.keyFacts?.length ? activeCase.keyFacts.slice(0, 8) : fallbackFacts(activeCase);
  const parties = activeCase.parties ?? activeCase.caseBriefing?.parties ?? [];
  const detailRows = activeCase.briefingDetails?.rows ?? activeCase.caseBriefing?.details?.rows ?? [];
  const availableTools = new Set(activeCase.availableTools ?? []);
  const firstTool = availableTools.has('Customer 360')
    ? 'Customer 360'
    : activeCase.requiredTools?.find((tool) => tool !== 'Case Summary' && availableTools.has(tool))
      ?? activeCase.availableTools?.find((tool) => !['Timeline', 'System Access Lane'].includes(tool));
  const quickTools = [...new Set([...(activeCase.requiredTools ?? []), ...(activeCase.availableTools ?? [])])]
    .filter((tool) => !['Case Summary', 'Customer 360'].includes(tool) && availableTools.has(tool))
    .slice(0, 5);

  useEffect(() => {
    setPage(0);
    setIntakePage(0);
  }, [activeCase.id]);

  function record(action, detail) {
    recordAction?.(action, detail, 'Case Briefing');
  }

  function openEvidenceTool(tool, stage) {
    record('Opened evidence area', `${tool} opened from the mobile Mission Briefing.`);
    openTool(tool, stage);
  }

  function beginInvestigation() {
    if (!firstTool) return;
    record('Began investigation', `${firstTool} opened from the mobile Mission Briefing.`);
    openTool(firstTool, 'investigate');
  }

  const pages = useMemo(() => [
    {
      id: 'overview',
      icon: '🗃️',
      eyebrow: 'Mission file 01',
      title: 'Case overview',
      content: (
        <>
          <section className="mission-briefing-case-banner">
            <span aria-hidden="true">✧</span>
            <div><p>Active case</p><h2>{activeCase.id}</h2><small>{taxonomy.workflowType}</small></div>
            <em>{activeCase.status}</em>
          </section>

          <section className="mission-briefing-allegation-card">
            <header><span aria-hidden="true">▤</span><div><p>{statement.label}</p><h3>Allegation summary</h3></div></header>
            <DirectCollapsibleText as="p" mobileLines={6}>{statement.value}</DirectCollapsibleText>
            <dl>
              <div><dt>Customer</dt><dd>{activeCase.person}</dd></div>
              <div><dt>Amount / exposure</dt><dd>{activeCase.amount}</dd></div>
              <div><dt>Reported / opened</dt><dd>{activeCase.reportedDate ?? intake.contactTime ?? activeCase.opened}</dd></div>
              <div><dt>Channel</dt><dd>{intake.channel ?? 'Case queue'}</dd></div>
            </dl>
            <small>Source: {statement.source}</small>
          </section>

          <div className="mission-briefing-overview-grid">
            <section>
              <header><p>Quick facts</p><h3>Case record</h3></header>
              <dl>
                <div><dt>Account ID</dt><dd>{activeCase.accountId}</dd></div>
                <div><dt>Customer type</dt><dd>{taxonomy.customerType}</dd></div>
                <div><dt>Product</dt><dd>{taxonomy.productType}</dd></div>
                {facts.slice(0, 4).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </section>
            <section className="mission-briefing-checklist">
              <header><p>Evidence checklist</p><h3>{documents.length} supplied document{documents.length === 1 ? '' : 's'}</h3></header>
              <ul>
                {documents.slice(0, 6).map((document, index) => (
                  <li key={document.id ?? `${document.title}-${index}`} data-status={document.status}>
                    <span aria-hidden="true">{/received|available|approved/i.test(document.status ?? '') ? '✓' : '○'}</span>
                    <div><strong>{document.title ?? document.type ?? `Document ${index + 1}`}</strong><small>{document.status ?? 'Available'}</small></div>
                  </li>
                ))}
                {!documents.length && <li><span aria-hidden="true">○</span><div><strong>No document supplied</strong><small>Open Document Request if paperwork is needed.</small></div></li>}
              </ul>
            </section>
          </div>

          <section className="mission-briefing-note"><span>Why this case exists</span><DirectCollapsibleText as="p" mobileLines={5}>{publicCaseSummary(activeCase)}</DirectCollapsibleText></section>
          <button type="button" className="mission-briefing-open-workspace" onClick={() => { record('Opened tool deck', 'Opened the investigation tool deck from the mobile Mission Briefing.'); openMoreTools(); }}>Open workspace <span>→</span></button>
        </>
      ),
    },
    {
      id: 'intake',
      icon: '📨',
      eyebrow: 'Mission file 02',
      title: 'Case intake',
      content: (
        <>
          <dl className="mission-briefing-facts">
            <div><dt>Channel</dt><dd>{intake.channel ?? 'Case queue'}</dd></div>
            <div><dt>Reported / opened</dt><dd>{activeCase.reportedDate ?? intake.contactTime ?? activeCase.opened}</dd></div>
            <div><dt>Customer location</dt><dd>{intake.customerLocation ?? 'Not supplied'}</dd></div>
            <div><dt>Stated device</dt><dd>{intake.statedDevice ?? 'Not supplied'}</dd></div>
          </dl>
          {intakeAnswers.length ? (
            <section className="mission-intake-question">
              <nav><button type="button" disabled={intakePage === 0} onClick={() => setIntakePage((current) => Math.max(0, current - 1))}>‹</button><span>Question {intakePage + 1} / {intakeAnswers.length}</span><button type="button" disabled={intakePage === intakeAnswers.length - 1} onClick={() => setIntakePage((current) => Math.min(intakeAnswers.length - 1, current + 1))}>›</button></nav>
              <strong>{intakeAnswers[intakePage]?.prompt}</strong>
              <p>{intakeAnswers[intakePage]?.answer}</p>
            </section>
          ) : <p className="mission-empty-state">No structured intake answers are available.</p>}
        </>
      ),
    },
    {
      id: 'statement',
      icon: '💬',
      eyebrow: 'Mission file 03',
      title: 'Statement & facts',
      content: (
        <>
          <blockquote className="mission-customer-statement"><span>{statement.label}</span><p>{statement.value}</p><cite>Source: {statement.source}</cite></blockquote>
          <dl className="mission-briefing-facts mission-briefing-facts-single">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>
      ),
    },
    {
      id: 'parties',
      icon: '🧬',
      eyebrow: 'Mission file 04',
      title: 'People & connections',
      content: (
        <>
          <div className="mission-party-orbit">
            <span className="mission-party-center">{activeCase.person}</span>
            {parties.slice(0, 4).map((party, index) => <article key={party.id ?? `${party.role}-${party.name}`} data-party-index={index}><small>{party.role}</small><strong>{party.name}</strong><p>{party.relationship}</p></article>)}
          </div>
          {!parties.length && <p className="mission-empty-state">No separate party records are available.</p>}
          {!!detailRows.length && <dl className="mission-briefing-facts mission-briefing-facts-single">{detailRows.slice(0, 8).map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}
        </>
      ),
    },
    {
      id: 'documents',
      icon: '📁',
      eyebrow: 'Mission file 05',
      title: 'Paperwork deck',
      content: (
        <>
          <div className="mission-briefing-document-stack">
            {documents.map((document, index) => (
              <button key={document.id ?? `${document.title}-${index}`} type="button" onClick={() => openEvidenceTool('Document Viewer')}>
                <span aria-hidden="true">{index % 2 ? '📄' : '📨'}</span>
                <span><strong>{document.title ?? document.type ?? `Document ${index + 1}`}</strong><small>{document.status ?? 'Available'} · {document.source ?? 'Case record'}</small></span>
              </button>
            ))}
          </div>
          {!documents.length && <p className="mission-empty-state">No customer paperwork has been received for this case.</p>}
          <div className="mission-briefing-document-actions"><button type="button" onClick={() => openEvidenceTool('Document Viewer')}>Open viewer</button><button type="button" onClick={() => openEvidenceTool('Document Request')}>Request paperwork</button></div>
        </>
      ),
    },
    {
      id: 'launch',
      icon: '🛰️',
      eyebrow: 'Mission file 06',
      title: 'Investigation launchpad',
      content: (
        <>
          <div className="mission-launch-grid">
            {quickTools.map((tool) => <button key={tool} type="button" onClick={() => openEvidenceTool(tool)}><span>{tool === 'Timeline' ? '⏱️' : tool.includes('Document') ? '📄' : '🔹'}</span><strong>{tool}</strong><small>Open focused workspace</small></button>)}
          </div>
          <button type="button" className="mission-begin-button" onClick={beginInvestigation}>Begin investigation <span>→</span></button>
        </>
      ),
    },
  ], [activeCase, documents, facts, intake, intakeAnswers, intakePage, parties, detailRows, quickTools]);

  const current = pages[page] ?? pages[0];

  return (
    <section className="mission-briefing-v3 sky-case-briefing" data-case-briefing-theme="sky" data-mission-briefing-page={current.id} data-workspace-page="briefing">
      <span className="sky-briefing-shimmer sky-briefing-shimmer-one" aria-hidden="true">✦</span>
      <span className="sky-briefing-shimmer sky-briefing-shimmer-two" aria-hidden="true">✧</span>
      {current.id !== 'overview' && <header className="mission-briefing-header-v3">
        <div><span>{current.icon}</span><p>{current.eyebrow}</p><h1>{current.title}</h1></div>
        <button type="button" aria-label="Pin active case" onClick={() => pin(activeCase.id)}>⭐</button>
      </header>}

      {current.id !== 'overview' && <nav className="mission-briefing-tabs" aria-label="Case briefing files">
        {pages.map((item, index) => <button key={item.id} type="button" className={page === index ? 'active' : ''} aria-label={item.title} aria-current={page === index ? 'page' : undefined} onClick={() => setPage(index)}>{item.icon}<small>{index + 1}</small></button>)}
      </nav>}

      <article className="mission-briefing-file">{current.content}</article>

      {current.id === 'overview' ? (
        <details className="mission-briefing-more-files">
          <summary>More case details <span>＋</span></summary>
          <nav aria-label="Additional Case Briefing pages">
            {pages.slice(1).map((item, index) => <button key={item.id} type="button" onClick={() => setPage(index + 1)}>{item.icon}<span><strong>{item.title}</strong><small>{item.eyebrow}</small></span></button>)}
          </nav>
        </details>
      ) : <nav className="mission-briefing-pager" aria-label="Briefing page controls">
        <button type="button" disabled={page === 0} onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}>‹ Previous</button>
        <span><strong>{String(page + 1).padStart(2, '0')}</strong><small>of {String(pages.length).padStart(2, '0')}</small></span>
        <button type="button" disabled={page === pages.length - 1} onClick={() => setPage((currentPage) => Math.min(pages.length - 1, currentPage + 1))}>Next ›</button>
      </nav>}

      {current.id !== 'overview' && <footer className="mission-briefing-actions">
        <button type="button" onClick={() => { record('Opened notes', 'Opened notes from the mobile Mission Briefing.'); openNotes(); }}>📝<small>Notes</small></button>
        <button type="button" onClick={() => openEvidenceTool('Timeline', 'timeline')}>⏱️<small>Timeline</small></button>
        <button type="button" onClick={() => { record('Opened tool deck', 'Opened the investigation tool deck from the mobile Mission Briefing.'); openMoreTools(); }}>🧰<small>Tools</small></button>
        <button type="button" onClick={() => { record('Opened determination', 'Opened Submit Decision from the mobile Mission Briefing.'); jumpDecision(); }}>✅<small>Decide</small></button>
        <button type="button" onClick={openQueue}>🗂️<small>Queue</small></button>
      </footer>}
    </section>
  );
}
