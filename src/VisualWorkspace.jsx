import { useEffect, useMemo, useRef, useState } from 'react';
import AcademyProgress from './AcademyProgress.jsx';
import { trainingCases as baseTrainingCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import { buildReviewPackage, getReviewPackageStatus, reviewChoices } from './data/reviewPackage.js';

const trainingCases = enrichTrainingCases(baseTrainingCases);
const AGENT_ID = 'AGT-TRAIN-001';
const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };
const workflowSteps = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];
const storageKeys = {
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  agentNotepad: 'fraud-academy-agent-notepad-v1',
  completed: 'fraud-academy-completed-tools-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
  reportPackets: 'fraud-academy-case-report-packets-v1',
};

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
  'Device Intelligence': 'Which devices and Device IDs appear in the access history?',
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
const defaultCompletedTools = { 'FA-ATO-24018': ['Case Summary', 'Customer 360'], 'FA-CB-24007': ['Case Summary'], 'FA-CR-24003': ['Case Summary'] };
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
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value));
}
function defaultTrayFor(caseId) {
  return [(trainingCases.find((item) => item.id === caseId) ?? trainingCases[0]).trainingId];
}
function getCategoryByKey(key) {
  return categories.find((item) => item.key === key) ?? categories[1];
}
function getCategoryByTool(toolName) {
  return categories.find((item) => item.tools.includes(toolName)) ?? categories[1];
}

export default function VisualWorkspace() {
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0].id);
  const [activeCategory, setActiveCategory] = useState('digital');
  const [activeTool, setActiveTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const submitRef = useRef(null);

  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, defaultNotesByCase));
  const [agentNotepadById, setAgentNotepadById] = useState(() => readStorage(storageKeys.agentNotepad, defaultAgentNotepad));
  const [completedToolsByCase, setCompletedToolsByCase] = useState(() => readStorage(storageKeys.completed, defaultCompletedTools));
  const [decisionDraftsByCase, setDecisionDraftsByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [reviewPackagesByCase, setReviewPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [caseReportPacketsByCase, setCaseReportPacketsByCase] = useState(() => readStorage(storageKeys.reportPackets, {}));

  const activeCase = useMemo(() => trainingCases.find((item) => item.id === activeCaseId) ?? trainingCases[0], [activeCaseId]);
  const activeCategoryConfig = useMemo(() => getCategoryByKey(activeCategory), [activeCategory]);
  const tray = trayByCase[activeCase.id] ?? defaultTrayFor(activeCase.id);
  const notes = notesByCase[activeCase.id] ?? defaultNotesByCase[activeCase.id] ?? [`Investigation note · Opened ${activeCase.id} workspace.`];
  const agentNotes = agentNotepadById[AGENT_ID] ?? [];
  const currentCompleted = completedToolsByCase[activeCase.id] ?? ['Case Summary'];
  const decisionDraft = decisionDraftsByCase[activeCase.id] ?? defaultDecisionDraft;
  const reviewPackages = reviewPackagesByCase[activeCase.id] ?? [];
  const caseReportPackets = caseReportPacketsByCase[activeCase.id] ?? [];
  const latestReviewPackage = reviewPackages[0] ?? null;
  const packageStatus = useMemo(() => getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets: caseReportPackets }), [currentCompleted, tray, notes, decisionDraft, caseReportPackets]);
  const lunaDebrief = useMemo(() => buildLunaDebrief({ activeCase, reviewPackage: latestReviewPackage, completedTools: currentCompleted, tray, notes, reportPackets: caseReportPackets }), [activeCase, latestReviewPackage, currentCompleted, tray, notes, caseReportPackets]);
  const records = useMemo(() => buildToolRows(activeTool, activeCase, caseReportPackets), [activeTool, activeCase, caseReportPackets]);
  const filteredRows = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return records.rows;
    return records.rows.filter((row) => row.values.some((value) => String(value).toLowerCase().includes(clean)) || row.detail.toLowerCase().includes(clean));
  }, [records.rows, query]);
  const expandedRow = useMemo(() => filteredRows.find((row) => row.id === expandedRowId) ?? filteredRows[0] ?? null, [filteredRows, expandedRowId]);

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.agentNotepad, agentNotepadById), [agentNotepadById]);
  useEffect(() => writeStorage(storageKeys.completed, completedToolsByCase), [completedToolsByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionDraftsByCase), [decisionDraftsByCase]);
  useEffect(() => writeStorage(storageKeys.packages, reviewPackagesByCase), [reviewPackagesByCase]);
  useEffect(() => writeStorage(storageKeys.reportPackets, caseReportPacketsByCase), [caseReportPacketsByCase]);
  useEffect(() => setExpandedRowId(''), [activeCaseId, activeTool]);

  function activateWorkspace() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab: 'workspace' } }));
      document.body.dataset.visualTab = 'workspace';
    }
  }
  function selectCategory(categoryKey) {
    const nextCategory = getCategoryByKey(categoryKey);
    activateWorkspace();
    setActiveCategory(nextCategory.key);
    setActiveTool(nextCategory.tools[0]);
    setQuery('');
  }
  function selectTool(toolName) {
    const category = getCategoryByTool(toolName);
    activateWorkspace();
    setActiveCategory(category.key);
    setActiveTool(toolName);
    setQuery('');
  }
  function openCase(caseId) {
    setActiveCaseId(caseId);
    setActiveCategory('digital');
    setActiveTool('Login History');
    setQuery('');
    setNoteDraft('');
    setTrayByCase((current) => (current[caseId] ? current : { ...current, [caseId]: defaultTrayFor(caseId) }));
    setNotesByCase((current) => (current[caseId] ? current : { ...current, [caseId]: [`Investigation note · Opened ${caseId} workspace. Review the allegation before deciding next steps.`] }));
    setCompletedToolsByCase((current) => (current[caseId] ? current : { ...current, [caseId]: ['Case Summary'] }));
    setCaseReportPacketsByCase((current) => (current[caseId] ? current : { ...current, [caseId]: [] }));
  }
  function openSubmitDecision() {
    activateWorkspace();
    window.setTimeout(() => {
      submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      submitRef.current?.classList.add('submit-decision-focus-flash');
      window.setTimeout(() => submitRef.current?.classList.remove('submit-decision-focus-flash'), 1600);
    }, 80);
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
  function saveCaseReportPacket(row, toolName = activeTool) {
    if (!row) return;
    const packet = buildCaseReportPacket({ row, toolName, activeCase });
    setCaseReportPacketsByCase((current) => {
      const casePackets = current[activeCase.id] ?? [];
      const deduped = casePackets.filter((item) => item.key !== packet.key);
      return { ...current, [activeCase.id]: [packet, ...deduped].slice(0, 30) };
    });
    saveNote(`Case Report packet saved from ${toolName}: ${row.id}.`, 'Case report packet');
  }
  function updateDecisionDraft(field, value) {
    setDecisionDraftsByCase((current) => ({ ...current, [activeCase.id]: { ...(current[activeCase.id] ?? defaultDecisionDraft), [field]: value } }));
  }
  function submitManualNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }
  function submitReviewPackage(event) {
    event.preventDefault();
    const draft = decisionDraftsByCase[activeCase.id] ?? defaultDecisionDraft;
    const status = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft, reportPackets: caseReportPackets });
    if (!status.ready) {
      saveNote(`Submit Decision checklist checked. ${status.messages[0]}`, 'Decision checklist');
      return;
    }
    const reviewPackage = buildReviewPackage({ caseId: activeCase.id, agentId: AGENT_ID, draft, completedTools: currentCompleted, tray, notes, reportPackets: caseReportPackets, packageStatus: status });
    setReviewPackagesByCase((current) => ({ ...current, [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])] }));
    setCompletedToolsByCase((current) => ({ ...current, [activeCase.id]: [...new Set([...(current[activeCase.id] ?? ['Case Summary']), 'Submit Decision'])] }));
    saveNote('Submit Decision: learner review package saved. Post-submission Luna debrief and Academy Progress can now read the saved package state.', 'Decision package');
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualHero />
        <CaseInfoBar activeCase={activeCase} activeCaseId={activeCaseId} openCase={openCase} />
        <CaseSummaryCard activeCase={activeCase} pinEvidence={pinEvidence} selectCategory={selectCategory} selectTool={selectTool} openSubmitDecision={openSubmitDecision} packetCount={caseReportPackets.length} />
        <InvestigationCategories activeCategory={activeCategory} selectCategory={selectCategory} completedTools={currentCompleted} />
        <EvidencePanel activeCase={activeCase} activeCategoryConfig={activeCategoryConfig} activeTool={activeTool} selectTool={selectTool} records={records} rows={filteredRows} query={query} setQuery={setQuery} expandedRow={expandedRow} expandedRowId={expandedRowId} setExpandedRowId={setExpandedRowId} pinEvidence={pinEvidence} saveNote={saveNote} saveCaseReportPacket={saveCaseReportPacket} markReviewed={markReviewed} isReviewed={currentCompleted.includes(activeTool)} openSubmitDecision={openSubmitDecision} />
        <SubmitDecisionPanel refProp={submitRef} activeCase={activeCase} decisionDraft={decisionDraft} updateDecisionDraft={updateDecisionDraft} packageStatus={packageStatus} reviewPackages={reviewPackages} submitReviewPackage={submitReviewPackage} />
        <PostSubmissionInsightPanel lunaDebrief={lunaDebrief} latestReviewPackage={latestReviewPackage} />
        <AcademyProgress />
        <BottomInvestigationGrid tray={tray} notes={notes} agentNotes={agentNotes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} submitManualNote={submitManualNote} pinEvidence={pinEvidence} reportPackets={caseReportPackets} selectTool={selectTool} />
        <VisualBottomNav />
      </section>
    </main>
  );
}

function VisualHero() {
  return <header className="visual-hero" aria-label="Fraud Academy OS header"><div className="hero-cat left">🐈‍⬛</div><div className="hero-bat">🦇</div><div className="hero-crown">♛</div><div className="hero-title-wrap"><div className="hero-jewel">💜</div><h1>Fraud Academy OS</h1><span>v1.0</span></div><div className="hero-cat right">🦇</div><div className="hero-sparkles" aria-hidden="true">✦ ✧ ✦ ✧ ✦</div></header>;
}
function CaseInfoBar({ activeCase, activeCaseId, openCase }) {
  return <section className="case-info-bar visual-case-strip" aria-label="Case metadata"><div><span>▣</span><strong>Case</strong><em>{activeCase.id}</em></div><div><span>♟</span><strong>Claim Type:</strong><em>{activeCase.type}</em></div><div><span>◈</span><strong>Status:</strong><em>{activeCase.status}</em></div><div className="case-info-bat">🦇</div><label className="visual-case-switcher"><span>Case Queue</span><select value={activeCaseId} onChange={(event) => openCase(event.target.value)}>{trainingCases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}</select></label></section>;
}
function CaseSummaryCard({ activeCase, pinEvidence, selectCategory, selectTool, openSubmitDecision, packetCount }) {
  return <section className="ornate-card case-summary-visual"><div className="moon-medallion">☾</div><div className="summary-copy"><p className="visual-section-title">♥ Case Summary</p><div className="case-summary-meta-grid"><article><small>Name</small><strong>{activeCase.person}</strong></article><article><small>Claim ID</small><strong>{activeCase.claimId ?? activeCase.id}</strong></article><article><small>Total claim amount</small><strong>{activeCase.amount}</strong></article><article className="wide"><small>Transaction / payee info</small><strong>{activeCase.transactionInfo ?? 'Transaction/payee details available in tool records.'}</strong></article><article className="wide"><small>Short summary</small><strong>{activeCase.shortSummary ?? activeCase.queueReason}</strong></article></div><small className="case-report-packet-count">{packetCount} structured Case Report packet{packetCount === 1 ? '' : 's'} saved</small></div><div className="butterfly-accent">🦋</div><div className="summary-actions"><button type="button" onClick={() => pinEvidence(activeCase.id, 'Case ID')}>📌 Pin Case</button><button type="button" onClick={() => selectTool('Identity Intelligence')}>▣ Identity Intel ›</button><button type="button" onClick={() => selectTool('Case Report')}>📄 Case Report ›</button><button type="button" onClick={() => selectCategory('digital')}>🪄 Open First Tool ›</button><button type="button" className="primary-action decision-jump-button" onClick={openSubmitDecision}>🪄 Submit Decision ›</button></div></section>;
}
function InvestigationCategories({ activeCategory, selectCategory, completedTools }) {
  return <section className="visual-categories" aria-label="Investigation categories"><div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab: 'academy' } }))}>Tool Map ›</button></div><div className="visual-category-row">{categories.map((item) => { const reviewedCount = item.tools.filter((tool) => completedTools.includes(tool)).length; const progressPercent = Math.round((reviewedCount / item.tools.length) * 100); const isReviewed = reviewedCount === item.tools.length; return <button key={item.key} type="button" className={`${activeCategory === item.key ? 'active' : ''} ${isReviewed ? 'reviewed' : ''}`} onClick={() => selectCategory(item.key)}><span>{item.icon}</span><strong>{item.label}</strong><em>{reviewedCount}/{item.tools.length}</em><small className="category-status-copy">{isReviewed ? 'Complete' : reviewedCount ? 'In progress' : 'Open'}</small><div className="category-progress-track" aria-hidden="true"><b style={{ width: `${progressPercent}%` }} /></div>{activeCategory === item.key && <i>♥</i>}</button>; })}</div></section>;
}
function EvidencePanel({ activeCase, activeCategoryConfig, activeTool, selectTool, records, rows, query, setQuery, expandedRow, expandedRowId, setExpandedRowId, pinEvidence, saveNote, saveCaseReportPacket, markReviewed, isReviewed, openSubmitDecision }) {
  return <section className="ornate-card activity-panel"><div className="activity-heading"><h2>▣ {activeCategoryConfig.label}</h2><select className="tool-select" value={activeTool} onChange={(event) => selectTool(event.target.value)}>{activeCategoryConfig.tools.map((tool) => <option key={tool} value={tool}>{tool}</option>)}</select><span className="panel-cat">🐈‍⬛</span></div><div className="tool-purpose-card"><strong>{activeTool}</strong><p>{toolQuestions[activeTool] ?? 'Review available case records while keeping the final decision locked.'}</p><div className="tool-flow-chips">{workflowSteps.map((step) => <span key={step}>{step}</span>)}</div><button type="button" className="decision-route-mini" onClick={openSubmitDecision}>Need to decide? Open Submit Decision</button></div><div className="workspace-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..." /><span>{rows.length} of {records.rows.length} shown</span></div><div className="activity-table" role="table"><div className="activity-row table-head" role="row">{records.columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.map((row) => <ActivityRow key={row.id} row={row} isExpanded={(expandedRowId ? expandedRowId === row.id : expandedRow?.id === row.id)} setExpandedRowId={setExpandedRowId} pinEvidence={pinEvidence} />)}</div><RecordDetailPanel row={expandedRow} activeTool={activeTool} activeCase={activeCase} saveNote={saveNote} saveCaseReportPacket={saveCaseReportPacket} markReviewed={markReviewed} isReviewed={isReviewed} /><button type="button" className="view-full-button" onClick={() => markReviewed(activeTool)}>{isReviewed ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report ›'}</button></section>;
}
function ActivityRow({ row, isExpanded, setExpandedRowId, pinEvidence }) {
  return <div className={`activity-row ${isExpanded ? 'expanded' : ''}`} role="row">{row.values.map((value, index) => <span key={`${row.id}-${index}`} className={index === 0 ? 'event-id' : index === 2 ? `result ${row.tone}` : ''}>{formatLines(value)}</span>)}<div className="row-action-group"><button type="button" className="row-expand-button" onClick={() => setExpandedRowId(row.id)}>{isExpanded ? 'Open' : 'Expand'}</button><button type="button" className="row-pin-button" onClick={() => pinEvidence(row.pinValue, row.pinLabel)}>📌</button></div></div>;
}
function RecordDetailPanel({ row, activeTool, activeCase, saveNote, saveCaseReportPacket, markReviewed, isReviewed }) {
  if (!row) return <section className="record-detail-panel empty"><strong>No matching records</strong><p>Adjust the search to reopen the record, history, link, report, timeline, and case report flow.</p></section>;
  const detail = buildRecordDetail(row, activeTool, activeCase);
  return <section className="record-detail-panel"><div className="record-detail-heading"><div><span>Expanded Record</span><h3>{row.id}</h3></div><button type="button" onClick={() => saveNote(`Expanded ${activeTool} record ${row.id}: ${row.detail}`, 'Expanded record')}>Save expanded note</button></div><div className="record-detail-grid">{detail.fields.map((item) => <article key={item.label}><small>{item.label}</small><strong>{formatLines(item.value)}</strong></article>)}</div><div className="record-review-lanes"><article><h4>History</h4>{detail.history.map((item) => <p key={item}>☾ {item}</p>)}</article><article><h4>Link Analysis</h4>{detail.links.map((item) => <p key={item}>⌘ {item}</p>)}</article><article><h4>Generated Report</h4>{detail.report.map((item) => <p key={item}>✦ {item}</p>)}<div className="record-report-actions"><button type="button" onClick={() => saveNote(detail.reportNote, 'Generated report')}>Save report note</button><button type="button" className="packet-save-button" onClick={() => saveCaseReportPacket(row, activeTool)}>Save neutral report packet</button><button type="button" onClick={() => markReviewed(activeTool)}>{isReviewed ? 'Reviewed' : 'Mark reviewed'}</button></div></article></div></section>;
}
function SubmitDecisionPanel({ refProp, activeCase, decisionDraft, updateDecisionDraft, packageStatus, reviewPackages, submitReviewPackage }) {
  return <section ref={refProp} className="ornate-card submit-decision-panel"><div className="card-title-row"><div><h2>🪄 Submit Decision</h2><p>Locked checklist. No Luna scoring or answer reveal until a learner package is saved.</p></div><span>☾</span></div><div className="decision-status-grid"><div><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><span>Required tools</span></div><div><strong>{packageStatus.reportPacketCount ?? 0}</strong><span>Case Report packets</span></div><div><strong>{reviewPackages.length}</strong><span>Saved packages</span></div><div><strong>{packageStatus.ready ? 'Ready' : 'Locked'}</strong><span>Package state</span></div></div><div className="decision-checklist">{packageStatus.messages.map((message) => <p key={message}>✦ {message}</p>)}</div><form className="decision-form" onSubmit={submitReviewPackage}><label>Learner choice<select value={decisionDraft.choice} onChange={(event) => updateDecisionDraft('choice', event.target.value)}><option value="">Select neutral choice...</option>{reviewChoices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label><label>Confidence<select value={decisionDraft.confidence} onChange={(event) => updateDecisionDraft('confidence', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="decision-rationale">Learner rationale<textarea value={decisionDraft.reason} onChange={(event) => updateDecisionDraft('reason', event.target.value)} placeholder={`Write the evidence-based rationale for ${activeCase.id}.`} /></label><button className="primary-action" type="submit">Save / Check Review Package</button></form></section>;
}
function PostSubmissionInsightPanel({ lunaDebrief, latestReviewPackage }) {
  const locked = !latestReviewPackage || !lunaDebrief;
  return <section className={`ornate-card luna-visual-panel ${locked ? 'locked' : 'unlocked'}`}><div className="card-title-row"><div><h2>🌙 Luna Debrief</h2><p>{locked ? 'Post-submission coaching stays locked until the learner package is saved.' : lunaDebrief.coachIntro}</p></div><span>{locked ? '🔒' : '✨'}</span></div>{locked ? <div className="luna-locked-state"><strong>Evidence First lock is active.</strong><p>Submit Decision must save a review package before Luna shows scoring, strengths, or next coaching focus.</p></div> : <div className="luna-debrief-grid"><div className="luna-score-card"><small>{lunaDebrief.theme}</small><strong>{lunaDebrief.score}/100</strong><span>{lunaDebrief.scoreLabel}</span></div><div className="luna-list-card"><h3>Package strengths</h3>{lunaDebrief.strengths.map((item) => <p key={item}>✦ {item}</p>)}</div><div className="luna-list-card"><h3>Next coaching focus</h3>{lunaDebrief.followUps.map((item) => <p key={item}>☾ {item}</p>)}</div></div>}</section>;
}
function BottomInvestigationGrid({ tray, notes, agentNotes, noteDraft, setNoteDraft, submitManualNote, pinEvidence, reportPackets, selectTool }) {
  return <section className="bottom-investigation-grid"><div className="ornate-card tray-card"><div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div><div className="tray-list">{tray.map((value, index) => <div key={`${value}-${index}`}><span>▯</span><strong>Pinned</strong><em>{value}</em><button type="button" onClick={() => pinEvidence(value, 'Tray item')}>📌</button></div>)}</div><button type="button" className="add-evidence" onClick={() => selectTool('Evidence Center')}>✦ Open Evidence Center ›</button></div><div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case and the agent archive</p></div><span>🐈‍⬛</span></div><form className="notebook-compose" onSubmit={submitManualNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..." /><button type="submit">Save Note</button></form><details className="case-report-packet-panel" open={reportPackets.length > 0}><summary>Case Report packets · {reportPackets.length} saved</summary><div>{reportPackets.slice(0, 8).map((item) => <p key={item.id}><strong>{item.section}</strong> · {item.recordId} · {item.title}</p>)}{!reportPackets.length && <p>No structured packets saved yet. Use an expanded record to save one.</p>}</div></details><div className="notebook-list">{notes.map((item, index) => <button type="button" key={`${item}-${index}`}><span>✎</span><p>{item}</p><em>›</em></button>)}</div><details className="agent-archive-panel"><summary>Agent Notepad Archive · {AGENT_ID} · {agentNotes.length} saved</summary><div>{agentNotes.slice(0, 8).map((item) => <p key={item.id}><strong>{item.caseId}</strong> · {item.noteType} · {item.noteText}</p>)}{!agentNotes.length && <p>No agent archive notes yet.</p>}</div></details></div></section>;
}
function VisualBottomNav() { return <nav className="visual-bottom-nav" aria-hidden="true" />; }

function buildToolRows(toolName, activeCase, reportPackets = []) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: activeCase.documents ?? [], documents: activeCase.documents ?? [] };
  if (toolName === 'Customer 360') return buildCustomer360Rows(activeCase);
  if (toolName === 'Identity Intelligence') return { columns: ['Record ID', 'Type', 'Value', 'Last Seen', 'History', 'Case Object', 'Action'], rows: activeCase.identityRecords.map((r) => makeRow(r.id, [r.id, r.type, r.value, r.lastSeen, r.history, activeCase.trainingId, 'Pin'], r.value, r.type)) };
  if (toolName === 'Session History') return { columns: ['Session / Event', 'Time', 'Activity', 'Object', 'Group', 'Case', 'Detail'], rows: [...activeCase.loginHistory.map((r) => makeRow(r.session, [r.session, r.time, r.result, r.device, r.ip, r.location, r.method], r.session, 'Session')), ...activeCase.events.map((e) => makeRow(e.id, [e.id, e.time, e.label, e.object, e.chip, activeCase.id, e.detail], e.id, 'Session event'))] };
  if (toolName === 'Device Intelligence') return { columns: ['Device ID', 'Device / Browser', 'Session', 'Method', 'Location', 'IP Address', 'Context'], rows: activeCase.loginHistory.map((r) => makeRow(r.deviceId ?? `DEV-${r.id}`, [r.deviceId ?? `DEV-${r.id}`, r.device, r.session, r.method, r.location, r.ip, `Observed in ${activeCase.id} access history`], r.deviceId ?? r.device, 'Device')) };
  if (toolName === 'IP Intelligence') return { columns: ['Record ID', 'IP Address', 'Location', 'Session', 'Method', 'Time', 'Context'], rows: activeCase.loginHistory.map((r) => makeRow(`IP-${r.id}`, [`IP-${r.id}`, r.ip, r.location, r.session, r.method, r.time, `IP record tied to ${r.device}`], r.ip, 'IP address')) };
  if (toolName === 'Transaction History') return { columns: ['Record ID', 'Date / Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'], rows: financial.transactions.map((r) => makeRow(r.id, [r.id, `${r.posted}\n${r.time}`, r.merchant, r.amount, r.channel, r.instrument, r.status], r.id, 'Transaction')) };
  if (toolName === 'Financial Intelligence') return { columns: ['Record ID', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'], rows: financial.financialIntel.map((r) => makeRow(r.id, [r.id, r.type, r.value, r.observed, r.context, activeCase.id, 'Pin'], r.id, 'Financial intelligence')) };
  if (toolName === 'Payment Verification') return { columns: ['Record ID', 'Type', 'Object', 'Status', 'Last Seen', 'Context', 'Action'], rows: financial.paymentVerification.map((r) => makeRow(r.id, [r.id, r.type, r.object, r.status, r.lastSeen, r.context, 'Pin'], r.object, 'Payment verification')) };
  if (toolName === 'Business 360') return { columns: ['Record ID', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'], rows: business.business360.map((r) => makeRow(r.id, [r.id, r.entity, r.relationship, r.status, r.observed, r.context, 'Pin'], r.entity, 'Business record')) };
  if (toolName === 'Business Intelligence') return { columns: ['Record ID', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'], rows: business.businessIntel.map((r) => makeRow(r.id, [r.id, r.type, r.value, r.observed, r.context, activeCase.id, 'Pin'], r.id, 'Business intelligence')) };
  if (toolName === 'Employee Profile') return { columns: ['Record ID', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'], rows: business.employeeProfile.map((r) => makeRow(r.id, [r.id, r.name, r.role, r.employer, r.status, r.lastSeen, r.context], r.name, 'Employee profile')) };
  if (toolName === 'Payroll History') return { columns: ['Record ID', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'], rows: business.payrollHistory.map((r) => makeRow(r.id, [r.id, r.period, r.employer, r.amount, r.channel, r.status, r.context], r.id, 'Payroll record')) };
  if (toolName === 'Evidence Center') return { columns: ['Record ID', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'], rows: evidence.evidence.map((r) => makeRow(r.id, [r.id, r.status, r.name, r.source, r.received, r.linkedObject, r.summary], r.id, 'Evidence')) };
  if (toolName === 'Document Viewer') return { columns: ['Document ID', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'], rows: evidence.documents.map((r) => makeRow(r.id, [r.id, r.status, r.title, r.category, r.updated, r.fields, r.preview], r.id, 'Document')) };
  if (toolName === 'Link Analysis') return buildLinkRows(activeCase, financial, business, evidence);
  if (toolName === 'Timeline') return buildTimelineRows(activeCase, financial, evidence);
  if (toolName === 'Case Report') return buildCaseReportRows(activeCase, financial, business, evidence, reportPackets);
  return { columns: ['Event ID', 'Date / Time', 'Result', 'Device', 'IP Address', 'Location', 'Auth Method'], rows: activeCase.loginHistory.map((r) => makeRow(r.id, [r.id, r.time, r.result === 'Successful' ? 'Success' : r.result, r.device, r.ip, r.location, r.method], r.ip, 'IP address', r.result === 'Successful' ? 'success' : 'review')) };
}
function buildCustomer360Rows(activeCase) {
  const contact = activeCase.customer?.contact ?? {};
  const relationship = activeCase.customer?.relationship ?? [];
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  return { columns: ['Record ID', 'Type', 'Value', 'Observed', 'History', 'Case Object', 'Action'], rows: [makeRow('C360-REL', ['C360-REL', 'Relationship since', activeCase.customer?.relationshipSince, activeCase.opened, 'Customer relationship snapshot', activeCase.trainingId, 'Pin'], activeCase.trainingId, 'Customer profile'), makeRow('C360-SEG', ['C360-SEG', 'Segment', activeCase.customer?.segment, activeCase.opened, 'Product relationship context', activeCase.id, 'Pin'], activeCase.customer?.segment, 'Customer segment'), makeRow('C360-PHONE', ['C360-PHONE', 'Phone', contact.phone, activeCase.opened, 'Current profile contact record', activeCase.trainingId, 'Pin'], contact.phone, 'Phone'), makeRow('C360-EMAIL', ['C360-EMAIL', 'Email', contact.email, activeCase.opened, 'Current profile contact record', activeCase.trainingId, 'Pin'], contact.email, 'Email'), makeRow('C360-ADDRESS', ['C360-ADDRESS', 'Address', contact.address, activeCase.opened, 'Current profile address record', activeCase.trainingId, 'Pin'], contact.address, 'Address'), ...relationship.map((item, index) => makeRow(`C360-REL-${index + 1}`, [`C360-REL-${index + 1}`, item.label, item.value, activeCase.opened, 'Relationship detail', activeCase.id, 'Pin'], item.value, item.label)), ...profileChanges.map((item) => makeRow(item.id, [item.id, item.item, item.detail, item.date, item.source, activeCase.id, 'Pin'], item.id, 'Profile change'))] };
}
function buildLinkRows(activeCase, financial, business, evidence) {
  const rows = [...activeCase.identityRecords.map((r) => ({ id: `LNK-${r.id}`, object: r.value, source: r.id, linkedTo: activeCase.person, detail: `${r.type} appears in the active identity record set.` })), ...activeCase.loginHistory.map((r) => ({ id: `LNK-${r.id}`, object: r.ip, source: r.session, linkedTo: r.deviceId ?? r.device, detail: `${r.location} access record connected to login history.` })), ...financial.transactions.map((r) => ({ id: `LNK-${r.id}`, object: r.merchant, source: r.id, linkedTo: r.instrument, detail: r.context })), ...business.business360.map((r) => ({ id: `LNK-${r.id}`, object: r.entity, source: r.id, linkedTo: r.relationship, detail: r.context })), ...evidence.evidence.map((r) => ({ id: `LNK-${r.id}`, object: r.name, source: r.id, linkedTo: r.linkedObject, detail: r.summary }))];
  return { columns: ['Link ID', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'], rows: rows.map((r) => makeRow(r.id, [r.id, r.object, r.source, r.linkedTo, r.detail, activeCase.id, 'Pin'], r.source, 'Connection')) };
}
function buildTimelineRows(activeCase, financial, evidence) {
  const rows = [makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Timeline event'), ...(activeCase.customer?.profileChanges ?? []).map((i) => makeRow(`TML-${i.id}`, [`TML-${i.id}`, i.date, i.item, i.detail, activeCase.id, i.source, 'Pin'], i.id, 'Profile timeline')), ...activeCase.loginHistory.map((i) => makeRow(`TML-${i.id}`, [`TML-${i.id}`, i.time, i.result, `${i.deviceId ?? i.device} · ${i.ip}`, activeCase.id, 'Login History', 'Pin'], i.session, 'Login timeline')), ...activeCase.events.map((i) => makeRow(`TML-${i.id}`, [`TML-${i.id}`, i.time, i.label, i.detail, activeCase.id, i.chip, 'Pin'], i.id, 'Case event')), ...financial.transactions.map((i) => makeRow(`TML-${i.id}`, [`TML-${i.id}`, `${i.posted} ${i.time}`, i.merchant, `${i.amount} · ${i.channel}`, activeCase.id, 'Transaction History', 'Pin'], i.id, 'Transaction timeline')), ...evidence.evidence.map((i) => makeRow(`TML-${i.id}`, [`TML-${i.id}`, i.received, i.name, i.summary, activeCase.id, 'Evidence Center', 'Pin'], i.id, 'Evidence timeline'))];
  return { columns: ['Timeline ID', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'], rows };
}
function buildCaseReportRows(activeCase, financial, business, evidence, reportPackets = []) {
  const rows = [{ id: 'REP-CASE', section: 'Case reason', value: activeCase.allegation, state: 'Draft available', source: 'Case Summary' }, { id: 'REP-CUSTOMER', section: 'Customer', value: `${activeCase.person} · ${activeCase.trainingId}`, state: 'Snapshot available', source: 'Customer 360' }, { id: 'REP-CLAIM', section: 'Claim intake', value: `${activeCase.claimId ?? activeCase.id} · ${activeCase.amount} · ${activeCase.transactionInfo ?? activeCase.type}`, state: 'Draft available', source: 'Case Summary' }, { id: 'REP-IDENTITY', section: 'Identity records', value: `${activeCase.identityRecords.length} identity objects available`, state: 'Review available', source: 'Identity Intelligence' }, { id: 'REP-DIGITAL', section: 'Digital activity', value: `${activeCase.loginHistory.length} login records and ${activeCase.events.length} case events`, state: 'Review available', source: 'Digital Activity' }, { id: 'REP-FINANCIAL', section: 'Financial records', value: `${financial.transactions.length} transaction records and ${financial.paymentVerification.length} payment records`, state: 'Review available', source: 'Financial' }, { id: 'REP-BUSINESS', section: 'Business context', value: `${business.business360.length} relationship records available`, state: 'Review available', source: 'Business' }, { id: 'REP-EVIDENCE', section: 'Evidence inventory', value: `${evidence.evidence.length} evidence records and ${evidence.documents.length} documents`, state: 'Review available', source: 'Evidence Center' }, ...reportPackets.map((p) => ({ id: p.id, section: p.section, value: `${p.title} · ${p.summary}`, state: p.state, source: p.sourceTool })), { id: 'REP-LOCK', section: 'Submit Decision', value: 'Luna debrief and scoring stay locked until learner package submission.', state: 'Locked', source: 'Submit Decision' }];
  return { columns: ['Report ID', 'Section', 'Value', 'State', 'Case', 'Source', 'Action'], rows: rows.map((r) => makeRow(r.id, [r.id, r.section, r.value, r.state, activeCase.id, r.source, 'Pin'], r.id, 'Report section')) };
}
function buildCaseReportPacket({ row, toolName, activeCase }) { return { id: `PKT-${Date.now()}`, key: `${toolName}:${row.id}`, caseId: activeCase.id, recordId: row.id, sourceTool: toolName, section: `${toolName} packet`, title: String(row.values[2] ?? row.values[1] ?? row.id).replace(/\n/g, ' · '), summary: String(row.detail).replace(/\s+/g, ' ').trim(), state: 'Saved to Case Report draft', savedAt: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }; }
function makeRow(id, values, pinValue, pinLabel, tone = 'review') { const normalizedValues = values.map((value) => value ?? 'Not recorded'); return { id, values: normalizedValues, pinValue: pinValue ?? id, pinLabel, tone, detail: normalizedValues.join(' ') }; }
function buildRecordDetail(row, activeTool, activeCase) { const fields = row.values.slice(0, 6).map((value, index) => ({ label: `Field ${index + 1}`, value })); const searchTerms = row.values.slice(0, 4).filter(Boolean).map((value) => String(value).replace(/\n/g, ' · ')); return { fields, history: [`${row.id} is open inside ${activeTool} for ${activeCase.id}.`, `Search terms staged: ${searchTerms.join(' · ') || row.id}.`, 'Record history can be compared with pinned evidence, timeline entries, and the case report draft.'], links: [`${row.pinLabel} object: ${row.pinValue}.`, `Case object: ${activeCase.id} · ${activeCase.person}.`, 'Relationship view stays neutral and does not assign a final outcome before submission.'], report: [`Source tool: ${activeTool}.`, `Case scope: ${activeCase.type} · ${activeCase.id}.`, `Record summary: ${row.detail}.`, 'Decision state: Submit Decision remains locked until the learner package passes the checklist.'], reportNote: `Neutral ${activeTool} report saved for ${row.id}. Record summary: ${row.detail}. Decision state remains locked until Submit Decision.` }; }
function formatLines(value) { return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>); }
