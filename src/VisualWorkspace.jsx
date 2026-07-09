import { useEffect, useMemo, useState } from 'react';
import AcademyProgress from './AcademyProgress.jsx';
import { trainingCases } from './data/cases.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import { buildReviewPackage, getReviewPackageStatus, reviewChoices } from './data/reviewPackage.js';

const AGENT_ID = 'AGT-TRAIN-001';
const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };
const workflowSteps = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', label: 'Financial', icon: '$', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', label: 'Business', icon: '⌂', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tools: ['Link Analysis'] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tools: ['Timeline', 'Case Report'] },
];

const toolQuestions = {
  'Customer 360': 'Who is the customer and what does the relationship snapshot show?',
  'Identity Intelligence': 'Which identity objects belong to this profile and case workspace?',
  'Login History': 'Which access records need to be compared with the case story?',
  'Session History': 'What happened inside the sessions connected to the case?',
  'Device Intelligence': 'Which devices appear in the access history and how are they connected?',
  'IP Intelligence': 'Which IP records and locations are tied to the case activity?',
  'Transaction History': 'What money movement or billing records are available for review?',
  'Financial Intelligence': 'What account, balance, merchant, or usage context supports documentation?',
  'Payment Verification': 'Which training-safe payment objects need review?',
  'Business 360': 'Which merchant, employer, or business relationship is in scope?',
  'Business Intelligence': 'What business context is available for the selected case?',
  'Employee Profile': 'Which employee or employer profile records are relevant to the case scope?',
  'Payroll History': 'What payroll records are available for relationship review?',
  'Evidence Center': 'What evidence exists, what was requested, and what can be pinned?',
  'Document Viewer': 'Which documents or packets can be previewed for final documentation?',
  'Link Analysis': 'How do the case objects connect without assigning an outcome?',
  Timeline: 'What sequence of case events has been documented?',
  'Case Report': 'What has been documented before the final learner decision?',
};

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

const defaultAgentNotepad = { [AGENT_ID]: [] };

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

function getCategoryByKey(key) {
  return categories.find((item) => item.key === key) ?? categories[1];
}

export default function VisualWorkspace() {
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0].id);
  const [activeCategory, setActiveCategory] = useState('digital');
  const [activeTool, setActiveTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [trayByCase, setTrayByCase] = useState(() => readStorage('fraud-academy-visual-tray-v1', {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage('fraud-academy-notes-v1', defaultNotesByCase));
  const [agentNotepadById, setAgentNotepadById] = useState(() => readStorage('fraud-academy-agent-notepad-v1', defaultAgentNotepad));
  const [completedToolsByCase, setCompletedToolsByCase] = useState(() => readStorage('fraud-academy-completed-tools-v1', defaultCompletedTools));
  const [decisionDraftsByCase, setDecisionDraftsByCase] = useState(() => readStorage('fraud-academy-decision-drafts-v1', {}));
  const [reviewPackagesByCase, setReviewPackagesByCase] = useState(() => readStorage('fraud-academy-review-packages-v1', {}));

  const activeCase = useMemo(() => trainingCases.find((item) => item.id === activeCaseId) ?? trainingCases[0], [activeCaseId]);
  const activeCategoryConfig = useMemo(() => getCategoryByKey(activeCategory), [activeCategory]);
  const tray = trayByCase[activeCase.id] ?? defaultTrayFor(activeCase.id);
  const notes = notesByCase[activeCase.id] ?? defaultNotesByCase[activeCase.id] ?? [`Investigation note · Opened ${activeCase.id} workspace.`];
  const agentNotes = agentNotepadById[AGENT_ID] ?? [];
  const currentCompleted = completedToolsByCase[activeCase.id] ?? ['Case Summary'];
  const decisionDraft = decisionDraftsByCase[activeCase.id] ?? defaultDecisionDraft;
  const reviewPackages = reviewPackagesByCase[activeCase.id] ?? [];
  const latestReviewPackage = reviewPackages[0] ?? null;
  const packageStatus = useMemo(() => getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft }), [currentCompleted, tray, notes, decisionDraft]);
  const lunaDebrief = useMemo(() => buildLunaDebrief({ activeCase, reviewPackage: latestReviewPackage, completedTools: currentCompleted, tray, notes }), [activeCase, latestReviewPackage, currentCompleted, tray, notes]);
  const records = useMemo(() => buildToolRows(activeTool, activeCase), [activeTool, activeCase]);
  const filteredRows = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return records.rows;
    return records.rows.filter((row) => row.values.some((value) => String(value).toLowerCase().includes(clean)) || row.detail.toLowerCase().includes(clean));
  }, [records.rows, query]);

  useEffect(() => writeStorage('fraud-academy-visual-tray-v1', trayByCase), [trayByCase]);
  useEffect(() => writeStorage('fraud-academy-notes-v1', notesByCase), [notesByCase]);
  useEffect(() => writeStorage('fraud-academy-agent-notepad-v1', agentNotepadById), [agentNotepadById]);
  useEffect(() => writeStorage('fraud-academy-completed-tools-v1', completedToolsByCase), [completedToolsByCase]);
  useEffect(() => writeStorage('fraud-academy-decision-drafts-v1', decisionDraftsByCase), [decisionDraftsByCase]);
  useEffect(() => writeStorage('fraud-academy-review-packages-v1', reviewPackagesByCase), [reviewPackagesByCase]);

  function selectCategory(categoryKey) {
    const nextCategory = getCategoryByKey(categoryKey);
    setActiveCategory(nextCategory.key);
    setActiveTool(nextCategory.tools[0]);
    setQuery('');
  }

  function selectTool(toolName) {
    setActiveTool(toolName);
    setQuery('');
  }

  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveCategory('digital');
    setActiveTool('Login History');
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
    const agentEntry = { id: `${activeCase.id}-${Date.now()}`, agentId: AGENT_ID, caseId: activeCase.id, noteType: type, noteText: clean, timestamp };
    setNotesByCase((current) => ({ ...current, [activeCase.id]: [caseLine, ...(current[activeCase.id] ?? [])] }));
    setAgentNotepadById((current) => ({ ...current, [AGENT_ID]: [agentEntry, ...(current[AGENT_ID] ?? [])] }));
  }

  function pinEvidence(value, label = 'Pinned object') {
    if (!value) return;
    setTrayByCase((current) => {
      const caseTray = current[activeCase.id] ?? defaultTrayFor(activeCase.id);
      return caseTray.includes(value) ? current : { ...current, [activeCase.id]: [...caseTray, value] };
    });
    saveNote(`${label} pinned: ${value}`, 'Evidence note');
  }

  function markReviewed(toolName = activeTool) {
    setCompletedToolsByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return { ...current, [activeCase.id]: [...new Set([...caseTools, toolName])] };
    });
    saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');
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
    saveNote('Submit Decision: learner review package saved. Post-submission Luna debrief and Academy Progress can now read the saved package state.', 'Decision package');
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualHero />
        <CaseInfoBar activeCase={activeCase} activeCaseId={activeCaseId} openCase={openCase} />
        <CaseSummaryCard activeCase={activeCase} pinEvidence={pinEvidence} selectCategory={selectCategory} />
        <InvestigationCategories activeCategory={activeCategory} selectCategory={selectCategory} completedTools={currentCompleted} />
        <EvidencePanel
          activeCategoryConfig={activeCategoryConfig}
          activeTool={activeTool}
          selectTool={selectTool}
          records={records}
          rows={filteredRows}
          query={query}
          setQuery={setQuery}
          pinEvidence={pinEvidence}
          markReviewed={markReviewed}
          isReviewed={currentCompleted.includes(activeTool)}
        />
        <SubmitDecisionPanel
          activeCase={activeCase}
          decisionDraft={decisionDraft}
          updateDecisionDraft={updateDecisionDraft}
          packageStatus={packageStatus}
          reviewPackages={reviewPackages}
          submitReviewPackage={submitReviewPackage}
        />
        <PostSubmissionInsightPanel lunaDebrief={lunaDebrief} latestReviewPackage={latestReviewPackage} />
        <AcademyProgress />
        <BottomInvestigationGrid tray={tray} notes={notes} agentNotes={agentNotes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} submitManualNote={submitManualNote} pinEvidence={pinEvidence} />
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

function CaseSummaryCard({ activeCase, pinEvidence, selectCategory }) {
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
        <button onClick={() => selectCategory('investigation')}>▣ Notebook</button>
        <button className="primary-action" onClick={() => selectCategory('digital')}>🪄 Open First Tool ›</button>
      </div>
    </section>
  );
}

function InvestigationCategories({ activeCategory, selectCategory, completedTools }) {
  return (
    <section className="visual-categories" aria-label="Investigation categories">
      <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button>View All ›</button></div>
      <div className="visual-category-row">
        {categories.map((item) => {
          const reviewedCount = item.tools.filter((tool) => completedTools.includes(tool)).length;
          const isReviewed = reviewedCount === item.tools.length;
          return (
            <button key={item.key} className={`${activeCategory === item.key ? 'active' : ''} ${isReviewed ? 'reviewed' : ''}`} onClick={() => selectCategory(item.key)}>
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <em>{reviewedCount}/{item.tools.length}</em>
              {activeCategory === item.key && <i>♥</i>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EvidencePanel({ activeCategoryConfig, activeTool, selectTool, records, rows, query, setQuery, pinEvidence, markReviewed, isReviewed }) {
  return (
    <section className="ornate-card activity-panel">
      <div className="activity-heading">
        <h2>▣ {activeCategoryConfig.label}</h2>
        <select className="tool-select" value={activeTool} onChange={(event) => selectTool(event.target.value)} aria-label="Select investigation tool">
          {activeCategoryConfig.tools.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
        </select>
        <span className="panel-cat">🐈‍⬛</span>
      </div>
      <div className="tool-purpose-card">
        <strong>{activeTool}</strong>
        <p>{toolQuestions[activeTool] ?? 'Review available case records while keeping the final decision locked.'}</p>
        <div className="tool-flow-chips" aria-label="Evidence workflow steps">
          {workflowSteps.map((step) => <span key={step}>{step}</span>)}
        </div>
      </div>
      <div className="workspace-search-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..." />
        <span>{rows.length} of {records.rows.length} shown</span>
      </div>
      <div className="activity-table" role="table" aria-label={`${activeTool} records`}>
        <div className="activity-row table-head" role="row">
          {records.columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        {rows.map((row) => <ActivityRow key={row.id} row={row} pinEvidence={pinEvidence} />)}
      </div>
      <button className="view-full-button" onClick={() => markReviewed(activeTool)}>{isReviewed ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report ›'}</button>
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

function PostSubmissionInsightPanel({ lunaDebrief, latestReviewPackage }) {
  const locked = !latestReviewPackage || !lunaDebrief;

  return (
    <section className={`ornate-card luna-visual-panel ${locked ? 'locked' : 'unlocked'}`}>
      <div className="card-title-row">
        <div>
          <h2>🌙 Luna Debrief</h2>
          <p>{locked ? 'Post-submission coaching stays locked until the learner package is saved.' : lunaDebrief.coachIntro}</p>
        </div>
        <span>{locked ? '🔒' : '✨'}</span>
      </div>
      {locked ? (
        <div className="luna-locked-state">
          <strong>Evidence First lock is active.</strong>
          <p>Submit Decision must save a review package before Luna shows scoring, strengths, or next coaching focus.</p>
        </div>
      ) : (
        <div className="luna-debrief-grid">
          <div className="luna-score-card">
            <small>{lunaDebrief.theme}</small>
            <strong>{lunaDebrief.score}/100</strong>
            <span>{lunaDebrief.scoreLabel}</span>
          </div>
          <div className="luna-list-card">
            <h3>Package strengths</h3>
            {lunaDebrief.strengths.map((item) => <p key={item}>✦ {item}</p>)}
          </div>
          <div className="luna-list-card">
            <h3>Next coaching focus</h3>
            {lunaDebrief.followUps.map((item) => <p key={item}>☾ {item}</p>)}
          </div>
          <div className="luna-breakdown-card">
            <h3>Decision-quality breakdown</h3>
            {lunaDebrief.breakdown.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.points} pts</em>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function formatLines(value) {
  return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>);
}

function BottomInvestigationGrid({ tray, notes, agentNotes, noteDraft, setNoteDraft, submitManualNote, pinEvidence }) {
  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div>
        <div className="tray-list">{tray.map((value, index) => <div key={`${value}-${index}`}><span>▯</span><strong>Pinned</strong><em>{value}</em><button onClick={() => pinEvidence(value, 'Tray item')}>📌</button></div>)}</div>
        <button className="add-evidence">✦ Evidence is saved by case</button>
      </div>
      <div className="ornate-card notebook-card">
        <div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case and the agent archive</p></div><span>🐈‍⬛</span></div>
        <form className="notebook-compose" onSubmit={submitManualNote}>
          <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..." />
          <button type="submit">Save Note</button>
        </form>
        <div className="notebook-list">{notes.map((item, index) => <button key={`${item}-${index}`}><span>✎</span><p>{item}</p><em>›</em></button>)}</div>
        <details className="agent-archive-panel">
          <summary>Agent Notepad Archive · {AGENT_ID} · {agentNotes.length} saved</summary>
          <div>
            {agentNotes.slice(0, 8).map((item) => <p key={item.id}><strong>{item.caseId}</strong> · {item.noteType} · {item.noteText}</p>)}
            {!agentNotes.length && <p>No agent archive notes yet.</p>}
          </div>
        </details>
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

function buildToolRows(toolName, activeCase) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: activeCase.documents ?? [], documents: activeCase.documents ?? [] };

  if (toolName === 'Customer 360') return buildCustomer360Rows(activeCase);

  if (toolName === 'Identity Intelligence') {
    return {
      columns: ['Record ID', 'Type', 'Value', 'Last Seen', 'History', 'Case Object', 'Action'],
      rows: activeCase.identityRecords.map((record) => makeRow(record.id, [record.id, record.type, record.value, record.lastSeen, record.history, activeCase.trainingId, 'Pin'], record.value, record.type)),
    };
  }

  if (toolName === 'Session History') {
    const sessionRows = [
      ...activeCase.loginHistory.map((record) => makeRow(record.session, [record.session, record.time, record.result, record.device, record.ip, record.location, record.method], record.session, 'Session')),
      ...activeCase.events.map((event) => makeRow(event.id, [event.id, event.time, event.label, event.object, event.chip, activeCase.id, event.detail], event.id, 'Session event')),
    ];
    return {
      columns: ['Session / Event', 'Time', 'Activity', 'Object', 'Group', 'Case', 'Detail'],
      rows: sessionRows,
    };
  }

  if (toolName === 'Device Intelligence') {
    return {
      columns: ['Record ID', 'Device', 'Session', 'Method', 'Location', 'IP Address', 'Context'],
      rows: activeCase.loginHistory.map((record) => makeRow(`DEV-${record.id}`, [`DEV-${record.id}`, record.device, record.session, record.method, record.location, record.ip, `Observed in ${activeCase.id} access history`], record.device, 'Device')),
    };
  }

  if (toolName === 'IP Intelligence') {
    return {
      columns: ['Record ID', 'IP Address', 'Location', 'Session', 'Method', 'Time', 'Context'],
      rows: activeCase.loginHistory.map((record) => makeRow(`IP-${record.id}`, [`IP-${record.id}`, record.ip, record.location, record.session, record.method, record.time, `IP record tied to ${record.device}`], record.ip, 'IP address')),
    };
  }

  if (toolName === 'Transaction History') {
    return {
      columns: ['Record ID', 'Date / Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'],
      rows: financial.transactions.map((record) => makeRow(record.id, [record.id, `${record.posted}\n${record.time}`, record.merchant, record.amount, record.channel, record.instrument, record.status], record.id, 'Transaction')),
    };
  }

  if (toolName === 'Financial Intelligence') {
    return {
      columns: ['Record ID', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: financial.financialIntel.map((record) => makeRow(record.id, [record.id, record.type, record.value, record.observed, record.context, activeCase.id, 'Pin'], record.id, 'Financial intelligence')),
    };
  }

  if (toolName === 'Payment Verification') {
    return {
      columns: ['Record ID', 'Type', 'Object', 'Status', 'Last Seen', 'Context', 'Action'],
      rows: financial.paymentVerification.map((record) => makeRow(record.id, [record.id, record.type, record.object, record.status, record.lastSeen, record.context, 'Pin'], record.object, 'Payment verification')),
    };
  }

  if (toolName === 'Business 360') {
    return {
      columns: ['Record ID', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'],
      rows: business.business360.map((record) => makeRow(record.id, [record.id, record.entity, record.relationship, record.status, record.observed, record.context, 'Pin'], record.entity, 'Business record')),
    };
  }

  if (toolName === 'Business Intelligence') {
    return {
      columns: ['Record ID', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: business.businessIntel.map((record) => makeRow(record.id, [record.id, record.type, record.value, record.observed, record.context, activeCase.id, 'Pin'], record.id, 'Business intelligence')),
    };
  }

  if (toolName === 'Employee Profile') {
    return {
      columns: ['Record ID', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'],
      rows: business.employeeProfile.map((record) => makeRow(record.id, [record.id, record.name, record.role, record.employer, record.status, record.lastSeen, record.context], record.name, 'Employee profile')),
    };
  }

  if (toolName === 'Payroll History') {
    return {
      columns: ['Record ID', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'],
      rows: business.payrollHistory.map((record) => makeRow(record.id, [record.id, record.period, record.employer, record.amount, record.channel, record.status, record.context], record.id, 'Payroll record')),
    };
  }

  if (toolName === 'Evidence Center') {
    return {
      columns: ['Record ID', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'],
      rows: evidence.evidence.map((record) => makeRow(record.id, [record.id, record.status, record.name, record.source, record.received, record.linkedObject, record.summary], record.id, 'Evidence')),
    };
  }

  if (toolName === 'Document Viewer') {
    return {
      columns: ['Document ID', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'],
      rows: evidence.documents.map((record) => makeRow(record.id, [record.id, record.status, record.title, record.category, record.updated, record.fields, record.preview], record.id, 'Document')),
    };
  }

  if (toolName === 'Link Analysis') return buildLinkRows(activeCase, financial, business, evidence);
  if (toolName === 'Timeline') return buildTimelineRows(activeCase, financial, evidence);
  if (toolName === 'Case Report') return buildCaseReportRows(activeCase, financial, business, evidence);

  return {
    columns: ['Event ID', 'Date / Time', 'Result', 'Device', 'IP Address', 'Location', 'Auth Method'],
    rows: activeCase.loginHistory.map((record) => makeRow(record.id, [record.id, record.time, record.result === 'Successful' ? 'Success' : record.result, record.device, record.ip, record.location, record.method], record.ip, 'IP address', record.result === 'Successful' ? 'success' : 'review')),
  };
}

function buildCustomer360Rows(activeCase) {
  const contact = activeCase.customer?.contact ?? {};
  const relationship = activeCase.customer?.relationship ?? [];
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  const rows = [
    makeRow('C360-REL', ['C360-REL', 'Relationship since', activeCase.customer?.relationshipSince, activeCase.opened, 'Customer relationship snapshot', activeCase.trainingId, 'Pin'], activeCase.trainingId, 'Customer profile'),
    makeRow('C360-SEG', ['C360-SEG', 'Segment', activeCase.customer?.segment, activeCase.opened, 'Product relationship context', activeCase.id, 'Pin'], activeCase.customer?.segment, 'Customer segment'),
    makeRow('C360-PHONE', ['C360-PHONE', 'Phone', contact.phone, activeCase.opened, 'Current profile contact record', activeCase.trainingId, 'Pin'], contact.phone, 'Phone'),
    makeRow('C360-EMAIL', ['C360-EMAIL', 'Email', contact.email, activeCase.opened, 'Current profile contact record', activeCase.trainingId, 'Pin'], contact.email, 'Email'),
    makeRow('C360-ADDRESS', ['C360-ADDRESS', 'Address', contact.address, activeCase.opened, 'Current profile address record', activeCase.trainingId, 'Pin'], contact.address, 'Address'),
    ...relationship.map((item, index) => makeRow(`C360-REL-${index + 1}`, [`C360-REL-${index + 1}`, item.label, item.value, activeCase.opened, 'Relationship detail', activeCase.id, 'Pin'], item.value, item.label)),
    ...profileChanges.map((item) => makeRow(item.id, [item.id, item.item, item.detail, item.date, item.source, activeCase.id, 'Pin'], item.id, 'Profile change')),
  ];

  return {
    columns: ['Record ID', 'Type', 'Value', 'Observed', 'History', 'Case Object', 'Action'],
    rows,
  };
}

function buildLinkRows(activeCase, financial, business, evidence) {
  const identityLinks = activeCase.identityRecords.map((record) => ({ id: `LNK-${record.id}`, object: record.value, source: record.id, linkedTo: activeCase.person, detail: `${record.type} appears in the active identity record set.` }));
  const loginLinks = activeCase.loginHistory.map((record) => ({ id: `LNK-${record.id}`, object: record.ip, source: record.session, linkedTo: record.device, detail: `${record.location} access record connected to login history.` }));
  const transactionLinks = financial.transactions.map((record) => ({ id: `LNK-${record.id}`, object: record.merchant, source: record.id, linkedTo: record.instrument, detail: record.context }));
  const businessLinks = business.business360.map((record) => ({ id: `LNK-${record.id}`, object: record.entity, source: record.id, linkedTo: record.relationship, detail: record.context }));
  const evidenceLinks = evidence.evidence.map((record) => ({ id: `LNK-${record.id}`, object: record.name, source: record.id, linkedTo: record.linkedObject, detail: record.summary }));
  const rows = [...identityLinks, ...loginLinks, ...transactionLinks, ...businessLinks, ...evidenceLinks];

  return {
    columns: ['Link ID', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'],
    rows: rows.map((record) => makeRow(record.id, [record.id, record.object, record.source, record.linkedTo, record.detail, activeCase.id, 'Pin'], record.source, 'Connection')),
  };
}

function buildTimelineRows(activeCase, financial, evidence) {
  const timelineRows = [
    makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Timeline event'),
    ...(activeCase.customer?.profileChanges ?? []).map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.date, item.item, item.detail, activeCase.id, item.source, 'Pin'], item.id, 'Profile timeline')),
    ...activeCase.loginHistory.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, `${item.device} · ${item.ip}`, activeCase.id, 'Login History', 'Pin'], item.session, 'Login timeline')),
    ...activeCase.events.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.detail, activeCase.id, item.chip, 'Pin'], item.id, 'Case event')),
    ...financial.transactions.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, `${item.posted} ${item.time}`, item.merchant, `${item.amount} · ${item.channel}`, activeCase.id, 'Transaction History', 'Pin'], item.id, 'Transaction timeline')),
    ...evidence.evidence.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.received, item.name, item.summary, activeCase.id, 'Evidence Center', 'Pin'], item.id, 'Evidence timeline')),
  ];

  return {
    columns: ['Timeline ID', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'],
    rows: timelineRows,
  };
}

function buildCaseReportRows(activeCase, financial, business, evidence) {
  const reportRows = [
    { id: 'REP-CASE', section: 'Case reason', value: activeCase.allegation, state: 'Draft available', source: 'Case Summary' },
    { id: 'REP-CUSTOMER', section: 'Customer', value: `${activeCase.person} · ${activeCase.trainingId}`, state: 'Snapshot available', source: 'Customer 360' },
    { id: 'REP-IDENTITY', section: 'Identity records', value: `${activeCase.identityRecords.length} identity objects available`, state: 'Review available', source: 'Identity Intelligence' },
    { id: 'REP-DIGITAL', section: 'Digital activity', value: `${activeCase.loginHistory.length} login records and ${activeCase.events.length} case events`, state: 'Review available', source: 'Digital Activity' },
    { id: 'REP-FINANCIAL', section: 'Financial records', value: `${financial.transactions.length} transaction records and ${financial.paymentVerification.length} payment records`, state: 'Review available', source: 'Financial' },
    { id: 'REP-BUSINESS', section: 'Business context', value: `${business.business360.length} relationship records available`, state: 'Review available', source: 'Business' },
    { id: 'REP-EVIDENCE', section: 'Evidence inventory', value: `${evidence.evidence.length} evidence records and ${evidence.documents.length} documents`, state: 'Review available', source: 'Evidence Center' },
    { id: 'REP-LOCK', section: 'Submit Decision', value: 'Luna debrief and scoring stay locked until learner package submission.', state: 'Locked', source: 'Submit Decision' },
  ];

  return {
    columns: ['Report ID', 'Section', 'Value', 'State', 'Case', 'Source', 'Action'],
    rows: reportRows.map((record) => makeRow(record.id, [record.id, record.section, record.value, record.state, activeCase.id, record.source, 'Pin'], record.id, 'Report section')),
  };
}

function makeRow(id, values, pinValue, pinLabel, tone = 'review') {
  const normalizedValues = values.map((value) => value ?? 'Not recorded');
  return {
    id,
    values: normalizedValues,
    pinValue: pinValue ?? id,
    pinLabel,
    tone,
    detail: normalizedValues.join(' '),
  };
}
