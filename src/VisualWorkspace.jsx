import { useEffect, useMemo, useState } from 'react';
import { trainingCases } from './data/cases.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { buildReviewPackage, getReviewPackageStatus, reviewChoices } from './data/reviewPackage.js';

const AGENT_ID = 'AGT-TRAIN-001';
const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tool: 'Customer 360', reviewTools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tool: 'Login History', reviewTools: ['Login History'] },
  { key: 'financial', label: 'Financial', icon: '$', tool: 'Transaction History', reviewTools: ['Transaction History'] },
  { key: 'business', label: 'Business', icon: '⌂', tool: 'Business 360', reviewTools: ['Business 360'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tool: 'Evidence Center', reviewTools: ['Evidence Center'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tool: 'Link Analysis', reviewTools: ['Link Analysis'] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tool: 'Case Report', reviewTools: ['Case Report'] },
];

const defaultNotesByCase = {
  'FA-ATO-24018': ['Case rationale · Customer states they did not authorize the purchase.', 'Investigation note · Need to compare login/device activity before decision.'],
  'FA-CB-24007': ['Investigation note · Opened billing dispute workspace. Review customer allegation and merchant records.'],
  'FA-CR-24003': ['Investigation note · Opened credit review workspace. Review system alert and payment verification records.'],
};

const defaultCompletedTools = {
  'FA-ATO-24018': ['Case Summary', 'Customer 360'],
  'FA-CB-24007': ['Case Summary'],
  'FA-CR-24003': ['Case Summary'],
};

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function defaultTrayFor(caseId) {
  const trainingCase = trainingCases.find((item) => item.id === caseId) ?? trainingCases[0];
  return [trainingCase.trainingId];
}

export default function VisualWorkspace() {
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0].id);
  const [activeCategory, setActiveCategory] = useState('digital');
  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [trayByCase, setTrayByCase] = useState(() => readStorage('fraud-academy-visual-tray-v1', {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage('fraud-academy-notes-v1', defaultNotesByCase));
  const [completedToolsByCase, setCompletedToolsByCase] = useState(() => readStorage('fraud-academy-completed-tools-v1', defaultCompletedTools));
  const [decisionDraftsByCase, setDecisionDraftsByCase] = useState(() => readStorage('fraud-academy-decision-drafts-v1', {}));
  const [reviewPackagesByCase, setReviewPackagesByCase] = useState(() => readStorage('fraud-academy-review-packages-v1', {}));

  const activeCase = useMemo(() => trainingCases.find((item) => item.id === activeCaseId) ?? trainingCases[0], [activeCaseId]);
  const activeCategoryConfig = useMemo(() => categories.find((item) => item.key === activeCategory) ?? categories[1], [activeCategory]);
  const tray = trayByCase[activeCase.id] ?? defaultTrayFor(activeCase.id);
  const notes = notesByCase[activeCase.id] ?? defaultNotesByCase[activeCase.id] ?? [`Investigation note · Opened ${activeCase.id} workspace.`];
  const currentCompleted = completedToolsByCase[activeCase.id] ?? ['Case Summary'];
  const decisionDraft = decisionDraftsByCase[activeCase.id] ?? defaultDecisionDraft;
  const reviewPackages = reviewPackagesByCase[activeCase.id] ?? [];
  const packageStatus = useMemo(() => getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft }), [currentCompleted, tray, notes, decisionDraft]);
  const records = useMemo(() => buildToolRows(activeCategory, activeCase), [activeCategory, activeCase]);
  const filteredRows = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return records.rows;
    return records.rows.filter((row) => row.values.some((value) => String(value).toLowerCase().includes(clean)) || row.detail.toLowerCase().includes(clean));
  }, [records.rows, query]);

  useEffect(() => writeStorage('fraud-academy-visual-tray-v1', trayByCase), [trayByCase]);
  useEffect(() => writeStorage('fraud-academy-notes-v1', notesByCase), [notesByCase]);
  useEffect(() => writeStorage('fraud-academy-completed-tools-v1', completedToolsByCase), [completedToolsByCase]);
  useEffect(() => writeStorage('fraud-academy-decision-drafts-v1', decisionDraftsByCase), [decisionDraftsByCase]);
  useEffect(() => writeStorage('fraud-academy-review-packages-v1', reviewPackagesByCase), [reviewPackagesByCase]);

  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveCategory('digital');
    setQuery('');
    setNoteDraft('');
    setTrayByCase((current) => current[caseId] ? current : { ...current, [caseId]: defaultTrayFor(caseId) });
    setNotesByCase((current) => current[caseId] ? current : { ...current, [caseId]: [`Investigation note · Opened ${caseId} workspace. Review the allegation before deciding next steps.`] });
    setCompletedToolsByCase((current) => current[caseId] ? current : { ...current, [caseId]: ['Case Summary'] });
  }

  function saveNote(text, type = 'Investigation note') {
    const clean = text.trim();
    if (!clean) return;
    const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const caseLine = `${timestamp} · ${type} · ${clean}`;
    setNotesByCase((current) => ({ ...current, [activeCase.id]: [caseLine, ...(current[activeCase.id] ?? [])] }));
  }

  function pinEvidence(value, label = 'Pinned object') {
    if (!value) return;
    setTrayByCase((current) => {
      const caseTray = current[activeCase.id] ?? defaultTrayFor(activeCase.id);
      return caseTray.includes(value) ? current : { ...current, [activeCase.id]: [...caseTray, value] };
    });
    saveNote(`${label} pinned: ${value}`, 'Evidence note');
  }

  function markReviewed(categoryConfig = activeCategoryConfig) {
    setCompletedToolsByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      const nextTools = [...new Set([...caseTools, ...categoryConfig.reviewTools])];
      return { ...current, [activeCase.id]: nextTools };
    });
    saveNote(`${categoryConfig.tool}: reviewed and neutral report generated.`, 'Tool review');
  }

  function updateDecisionDraft(field, value) {
    setDecisionDraftsByCase((current) => ({
      ...current,
      [activeCase.id]: { ...(current[activeCase.id] ?? defaultDecisionDraft), [field]: value },
    }));
  }

  function submitManualNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }

  function submitReviewPackage(event) {
    event.preventDefault();
    const draft = decisionDraftsByCase[activeCase.id] ?? defaultDecisionDraft;
    const status = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft });

    if (!status.ready) {
      saveNote(`Submit Decision checklist checked. ${status.messages[0]}`, 'Decision checklist');
      return;
    }

    const reviewPackage = buildReviewPackage({
      caseId: activeCase.id,
      agentId: AGENT_ID,
      draft,
      completedTools: currentCompleted,
      tray,
      notes,
      packageStatus: status,
    });

    setReviewPackagesByCase((current) => ({ ...current, [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])] }));
    setCompletedToolsByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return { ...current, [activeCase.id]: [...new Set([...caseTools, 'Submit Decision'])] };
    });
    saveNote('Submit Decision: learner review package saved. Post-submission debrief can unlock from saved package state.', 'Decision package');
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualHero />
        <CaseInfoBar activeCase={activeCase} activeCaseId={activeCaseId} openCase={openCase} />
        <CaseSummaryCard activeCase={activeCase} pinEvidence={pinEvidence} setActiveCategory={setActiveCategory} />
        <InvestigationCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} completedTools={currentCompleted} />
        <EvidencePanel
          activeCategoryConfig={activeCategoryConfig}
          records={records}
          rows={filteredRows}
          query={query}
          setQuery={setQuery}
          pinEvidence={pinEvidence}
          markReviewed={markReviewed}
        />
        <SubmitDecisionPanel
          activeCase={activeCase}
          decisionDraft={decisionDraft}
          updateDecisionDraft={updateDecisionDraft}
          packageStatus={packageStatus}
          reviewPackages={reviewPackages}
          submitReviewPackage={submitReviewPackage}
        />
        <BottomInvestigationGrid tray={tray} notes={notes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} submitManualNote={submitManualNote} pinEvidence={pinEvidence} />
        <VisualBottomNav />
      </section>
    </main>
  );
}

function VisualHero() {
  return (
    <header className="visual-hero" aria-label="Fraud Academy OS header">
      <div className="hero-cat left">🐈‍⬛</div>
      <div className="hero-bat">🦇</div>
      <div className="hero-crown">♛</div>
      <div className="hero-title-wrap">
        <div className="hero-jewel">💜</div>
        <h1>Fraud Academy OS</h1>
        <span>v1.0</span>
      </div>
      <div className="hero-cat right">🦇</div>
      <div className="hero-sparkles" aria-hidden="true">✦ ✧ ✦ ✧ ✦</div>
    </header>
  );
}

function CaseInfoBar({ activeCase, activeCaseId, openCase }) {
  return (
    <section className="case-info-bar visual-case-strip" aria-label="Case metadata">
      <div><span>▣</span><strong>Case</strong><em>{activeCase.id}</em></div>
      <div><span>♟</span><strong>Claim Type:</strong><em>{activeCase.type}</em></div>
      <div><span>◈</span><strong>Status:</strong><em>{activeCase.status}</em></div>
      <div className="case-info-bat">🦇</div>
      <label className="visual-case-switcher">
        <span>Case Queue</span>
        <select value={activeCaseId} onChange={(event) => openCase(event.target.value)}>
          {trainingCases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}
        </select>
      </label>
    </section>
  );
}

function CaseSummaryCard({ activeCase, pinEvidence, setActiveCategory }) {
  return (
    <section className="ornate-card case-summary-visual">
      <div className="moon-medallion">☾</div>
      <div className="summary-copy">
        <p className="visual-section-title">♥ Case Summary</p>
        <p>{activeCase.allegation}</p>
        <p>{activeCase.queueReason}</p>
      </div>
      <div className="butterfly-accent">🦋</div>
      <div className="summary-actions">
        <button onClick={() => pinEvidence(activeCase.id, 'Case ID')}>📌 Pin Case</button>
        <button onClick={() => setActiveCategory('investigation')}>▣ Notebook</button>
        <button className="primary-action" onClick={() => setActiveCategory('digital')}>🪄 Open First Tool ›</button>
      </div>
    </section>
  );
}

function InvestigationCategories({ activeCategory, setActiveCategory, completedTools }) {
  return (
    <section className="visual-categories" aria-label="Investigation categories">
      <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button>View All ›</button></div>
      <div className="visual-category-row">
        {categories.map((item) => {
          const reviewedCount = item.reviewTools.filter((tool) => completedTools.includes(tool)).length;
          const isReviewed = reviewedCount === item.reviewTools.length;
          return (
            <button key={item.key} className={`${activeCategory === item.key ? 'active' : ''} ${isReviewed ? 'reviewed' : ''}`} onClick={() => setActiveCategory(item.key)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <em>{reviewedCount}/{item.reviewTools.length}</em>
              {activeCategory === item.key && <i>♥</i>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EvidencePanel({ activeCategoryConfig, records, rows, query, setQuery, pinEvidence, markReviewed }) {
  return (
    <section className="ornate-card activity-panel">
      <div className="activity-heading">
        <h2>▣ {activeCategoryConfig.label}</h2>
        <button>{activeCategoryConfig.tool}⌄</button>
        <span className="panel-cat">🐈‍⬛</span>
      </div>
      <div className="workspace-search-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..." />
        <span>{rows.length} of {records.rows.length} shown</span>
      </div>
      <div className="activity-table" role="table" aria-label={`${activeCategoryConfig.label} records`}>
        <div className="activity-row table-head" role="row">
          {records.columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        {rows.map((row) => <ActivityRow key={row.id} row={row} pinEvidence={pinEvidence} />)}
      </div>
      <button className="view-full-button" onClick={() => markReviewed(activeCategoryConfig)}>✦ Generate Neutral Tool Report ›</button>
    </section>
  );
}

function ActivityRow({ row, pinEvidence }) {
  return (
    <div className="activity-row" role="row">
      {row.values.map((value, index) => (
        <span key={`${row.id}-${index}`} className={index === 0 ? 'event-id' : index === 2 ? `result ${row.tone}` : ''}>{formatLines(value)}</span>
      ))}
      <button className="row-pin-button" onClick={() => pinEvidence(row.pinValue, row.pinLabel)}>📌</button>
    </div>
  );
}

function SubmitDecisionPanel({ activeCase, decisionDraft, updateDecisionDraft, packageStatus, reviewPackages, submitReviewPackage }) {
  return (
    <section className="ornate-card submit-decision-panel">
      <div className="card-title-row">
        <div>
          <h2>🪄 Submit Decision</h2>
          <p>Locked checklist. No Luna scoring or answer reveal until a learner package is saved.</p>
        </div>
        <span>☾</span>
      </div>
      <div className="decision-status-grid">
        <div><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><span>Required tools</span></div>
        <div><strong>{reviewPackages.length}</strong><span>Saved packages</span></div>
        <div><strong>{packageStatus.ready ? 'Ready' : 'Locked'}</strong><span>Package state</span></div>
      </div>
      <div className="decision-checklist">
        {packageStatus.messages.map((message) => <p key={message}>✦ {message}</p>)}
      </div>
      <form className="decision-form" onSubmit={submitReviewPackage}>
        <label>
          Learner choice
          <select value={decisionDraft.choice} onChange={(event) => updateDecisionDraft('choice', event.target.value)}>
            <option value="">Select neutral choice...</option>
            {reviewChoices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
          </select>
        </label>
        <label>
          Confidence
          <select value={decisionDraft.confidence} onChange={(event) => updateDecisionDraft('confidence', event.target.value)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label className="decision-rationale">
          Learner rationale
          <textarea value={decisionDraft.reason} onChange={(event) => updateDecisionDraft('reason', event.target.value)} placeholder={`Write the evidence-based rationale for ${activeCase.id}.`} />
        </label>
        <button className="primary-action" type="submit">Save / Check Review Package</button>
      </form>
    </section>
  );
}

function formatLines(value) {
  return String(value).split('\n').map((line) => <small key={line}>{line}</small>);
}

function BottomInvestigationGrid({ tray, notes, noteDraft, setNoteDraft, submitManualNote, pinEvidence }) {
  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div>
        <div className="tray-list">{tray.map((value, index) => <div key={`${value}-${index}`}><span>▯</span><strong>Pinned</strong><em>{value}</em><button onClick={() => pinEvidence(value, 'Tray item')}>📌</button></div>)}</div>
        <button className="add-evidence">✦ Evidence is saved by case</button>
      </div>
      <div className="ornate-card notebook-card">
        <div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div>
        <form className="notebook-compose" onSubmit={submitManualNote}>
          <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..." />
          <button type="submit">Save Note</button>
        </form>
        <div className="notebook-list">{notes.map((item, index) => <button key={`${item}-${index}`}><span>✎</span><p>{item}</p><em>›</em></button>)}</div>
      </div>
    </section>
  );
}

function VisualBottomNav() {
  return (
    <nav className="visual-bottom-nav" aria-label="Main navigation">
      <button>⌂<span>Dashboard</span></button>
      <button>▣<span>Cases</span></button>
      <button className="active">🪄<span>Workspace</span></button>
      <button>▱<span>Academy</span></button>
      <button>▢<span>Progress</span></button>
    </nav>
  );
}

function buildToolRows(category, activeCase) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: activeCase.documents ?? [], documents: activeCase.documents ?? [] };

  if (category === 'identity') {
    return {
      columns: ['Record ID', 'Type', 'Value', 'Last Seen', 'History', 'Case Object', 'Action'],
      rows: activeCase.identityRecords.map((record) => makeRow(record.id, [record.id, record.type, record.value, record.lastSeen, record.history, activeCase.trainingId, 'Pin'], record.value, record.type)),
    };
  }

  if (category === 'financial') {
    return {
      columns: ['Record ID', 'Date / Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'],
      rows: financial.transactions.map((record) => makeRow(record.id, [record.id, `${record.posted}\n${record.time}`, record.merchant, record.amount, record.channel, record.instrument, record.status], record.id, 'Transaction')),
    };
  }

  if (category === 'business') {
    return {
      columns: ['Record ID', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'],
      rows: business.business360.map((record) => makeRow(record.id, [record.id, record.entity, record.relationship, record.status, record.observed, record.context, 'Pin'], record.entity, 'Business record')),
    };
  }

  if (category === 'evidence') {
    return {
      columns: ['Record ID', 'Status', 'Document', 'Detail', 'Case', 'Object', 'Action'],
      rows: evidence.evidence.map((record) => makeRow(record.id, [record.id, record.status, record.name, record.detail ?? record.summary ?? record.preview ?? 'Evidence detail available', activeCase.id, record.linkedObject ?? 'Evidence packet', 'Pin'], record.id, 'Evidence')),
    };
  }

  if (category === 'connections') {
    const connectionRows = [
      ...activeCase.links.map((link, index) => ({ id: `LNK-${index + 1}`, object: link, source: activeCase.id, linkedTo: activeCase.person, detail: `${link} appears in the active case relationship map.` })),
      ...activeCase.events.map((event) => ({ id: `LNK-${event.id}`, object: event.object, source: event.id, linkedTo: event.chip, detail: event.detail })),
    ];
    return {
      columns: ['Link ID', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'],
      rows: connectionRows.map((record) => makeRow(record.id, [record.id, record.object, record.source, record.linkedTo, record.detail, activeCase.id, 'Pin'], record.source, 'Connection')),
    };
  }

  if (category === 'investigation') {
    const reportRows = [
      { id: 'REP-CASE', type: 'Case reason', value: activeCase.allegation, status: 'Draft available' },
      { id: 'REP-CUSTOMER', type: 'Customer', value: `${activeCase.person} · ${activeCase.trainingId}`, status: 'Snapshot available' },
      { id: 'REP-EVIDENCE', type: 'Evidence inventory', value: `${activeCase.documents.length} document records`, status: 'Review available' },
      { id: 'REP-LOCK', type: 'Submit Decision', value: 'Luna debrief and scoring stay locked until learner package submission.', status: 'Locked' },
    ];
    return {
      columns: ['Report ID', 'Section', 'Value', 'State', 'Case', 'Question', 'Action'],
      rows: reportRows.map((record) => makeRow(record.id, [record.id, record.type, record.value, record.status, activeCase.id, 'What is documented?', 'Pin'], record.id, 'Report section')),
    };
  }

  return {
    columns: ['Event ID', 'Date / Time', 'Result', 'Device', 'IP Address', 'Location', 'Auth Method'],
    rows: activeCase.loginHistory.map((record) => makeRow(record.id, [record.id, record.time, record.result === 'Successful' ? 'Success' : record.result, record.device, record.ip, record.location, record.method], record.ip, 'IP address', record.result === 'Successful' ? 'success' : 'review')),
  };
}

function makeRow(id, values, pinValue, pinLabel, tone = 'review') {
  return {
    id,
    values,
    pinValue,
    pinLabel,
    tone,
    detail: values.join(' '),
  };
}
