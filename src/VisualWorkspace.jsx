import { useEffect, useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';
import { SYSTEM_ACCESS_TOOL_NAMES, getSystemAccessRecordsByTool } from './data/systemAccessRecords.js';
import { buildReviewPackage, getReviewPackageStatus, reviewChoices } from './data/reviewPackage.js';

const AGENT_ID = 'AGT-TRAIN-001';

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', label: 'Financial', icon: '$', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', label: 'Business', icon: '⌂', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tools: ['Link Analysis', 'System Access Lane', ...SYSTEM_ACCESS_TOOL_NAMES] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tools: ['Timeline', 'Case Report'] },
];

const workflows = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];

const storageKeys = {
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  completed: 'fraud-academy-completed-tools-v1',
  decisions: 'fraud-academy-decision-drafts-v1',
  packages: 'fraud-academy-review-packages-v1',
  reportPackets: 'fraud-academy-case-report-packets-v1',
};

const defaultDecisionDraft = { choice: '', confidence: 'Medium', reason: '' };

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

function makeRow(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

function rowsFor(tool, activeCase, reportPackets = []) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: [], documents: [] };

  if (tool === 'Customer 360') {
    const relationship = activeCase.customer?.relationship ?? [];
    const profileChanges = activeCase.customer?.profileChanges ?? [];
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'History', 'Object', 'Action'],
      rows: [
        makeRow('C360-REL', ['C360-REL', 'Relationship since', activeCase.customer?.relationshipSince, activeCase.opened, 'Customer relationship snapshot', activeCase.trainingId, 'Pin'], activeCase.trainingId, 'Customer profile'),
        makeRow('C360-SEG', ['C360-SEG', 'Segment', activeCase.customer?.segment, activeCase.opened, 'Product relationship context', activeCase.id, 'Pin'], activeCase.customer?.segment, 'Customer segment'),
        ...relationship.map((item, index) => makeRow(`C360-REL-${index + 1}`, [`C360-REL-${index + 1}`, item.label, item.value, activeCase.opened, 'Relationship detail', activeCase.id, 'Pin'], item.value, item.label)),
        ...profileChanges.map((item) => makeRow(item.id, [item.id, item.item, item.detail, item.date, item.source, activeCase.id, 'Pin'], item.id, 'Profile change')),
      ],
    };
  }

  if (tool === 'Identity Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Last Seen', 'History', 'Object', 'Action'],
      rows: activeCase.identityRecords.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.lastSeen, item.history, activeCase.trainingId, 'Pin'], item.value, item.type)),
    };
  }

  if (tool === 'Device Intelligence') {
    return {
      columns: ['Device ID', 'Device / Browser', 'Session', 'Method', 'Location', 'IP Address', 'Context'],
      rows: activeCase.loginHistory.map((item) => makeRow(item.deviceId ?? `DEV-${item.id}`, [item.deviceId ?? `DEV-${item.id}`, item.device, item.session, item.method, item.location, item.ip, `Observed in ${activeCase.id} access history`], item.deviceId ?? item.device, 'Device')),
    };
  }

  if (tool === 'Session History') {
    return {
      columns: ['Session/Event', 'Time', 'Activity', 'Object', 'Group', 'Case', 'Detail'],
      rows: [
        ...activeCase.loginHistory.map((item) => makeRow(item.session, [item.session, item.time, item.result, item.device, item.ip, activeCase.id, item.method], item.session, 'Session')),
        ...activeCase.events.map((item) => makeRow(item.id, [item.id, item.time, item.label, item.object, item.chip, activeCase.id, item.detail], item.id, 'Session event')),
      ],
    };
  }

  if (tool === 'IP Intelligence') {
    return {
      columns: ['Record', 'IP', 'Location', 'Session', 'Method', 'Time', 'Context'],
      rows: activeCase.loginHistory.map((item) => makeRow(`IP-${item.id}`, [`IP-${item.id}`, item.ip, item.location, item.session, item.method, item.time, `Tied to ${item.deviceId ?? item.device}`], item.ip, 'IP')),
    };
  }

  if (tool === 'Transaction History') {
    return {
      columns: ['Record', 'Date/Time', 'Merchant', 'Amount', 'Channel', 'Instrument', 'Status'],
      rows: financial.transactions.map((item) => makeRow(item.id, [item.id, `${item.posted}\n${item.time}`, item.merchant, item.amount, item.channel, item.instrument, item.status], item.id, 'Transaction')),
    };
  }

  if (tool === 'Financial Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: financial.financialIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Financial intelligence')),
    };
  }

  if (tool === 'Payment Verification') {
    return {
      columns: ['Record', 'Type', 'Object', 'Status', 'Last Seen', 'Context', 'Action'],
      rows: financial.paymentVerification.map((item) => makeRow(item.id, [item.id, item.type, item.object, item.status, item.lastSeen, item.context, 'Pin'], item.object, 'Payment')),
    };
  }

  if (tool === 'Business 360') {
    return {
      columns: ['Record', 'Entity', 'Relationship', 'Status', 'Observed', 'Context', 'Action'],
      rows: business.business360.map((item) => makeRow(item.id, [item.id, item.entity, item.relationship, item.status, item.observed, item.context, 'Pin'], item.entity, 'Business')),
    };
  }

  if (tool === 'Business Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: business.businessIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'], item.id, 'Business intelligence')),
    };
  }

  if (tool === 'Employee Profile') {
    return {
      columns: ['Record', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'],
      rows: business.employeeProfile.map((item) => makeRow(item.id, [item.id, item.name, item.role, item.employer, item.status, item.lastSeen, item.context], item.name, 'Employee profile')),
    };
  }

  if (tool === 'Payroll History') {
    return {
      columns: ['Record', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'],
      rows: business.payrollHistory.map((item) => makeRow(item.id, [item.id, item.period, item.employer, item.amount, item.channel, item.status, item.context], item.id, 'Payroll record')),
    };
  }

  if (tool === 'Evidence Center') {
    return {
      columns: ['Record', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'],
      rows: evidence.evidence.map((item) => makeRow(item.id, [item.id, item.status, item.name, item.source, item.received, item.linkedObject, item.summary], item.id, 'Evidence')),
    };
  }

  if (tool === 'Document Viewer') {
    return {
      columns: ['Document', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'],
      rows: evidence.documents.map((item) => makeRow(item.id, [item.id, item.status, item.title, item.category, item.updated, item.fields, item.preview], item.id, 'Document')),
    };
  }

  if (tool === 'Link Analysis') {
    return {
      columns: ['Link', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'],
      rows: [
        ...activeCase.identityRecords.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.id, activeCase.person, item.history, activeCase.id, 'Pin'], item.value, 'Connection')),
        ...activeCase.loginHistory.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.ip, item.session, item.deviceId ?? item.device, item.location, activeCase.id, 'Pin'], item.ip, 'Connection')),
      ],
    };
  }

  if (tool === 'System Access Lane' || SYSTEM_ACCESS_TOOL_NAMES.includes(tool)) {
    const records = getSystemAccessRecordsByTool(activeCase.id, tool);
    return {
      columns: ['Record', 'Tool', 'Lane', 'Actor', 'Object', 'Observed', 'Status / Context'],
      rows: records.map((item) => makeRow(
        item.id,
        [item.id, item.tool, item.lane, item.actor, item.object, item.observed, `${item.status} · ${item.event} · ${item.context}`],
        item.id,
        item.tool ?? 'System access',
      )),
    };
  }

  if (tool === 'Timeline') {
    return {
      columns: ['Timeline', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Timeline event'),
        ...activeCase.events.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.detail, activeCase.id, item.chip, 'Pin'], item.id, 'Timeline event')),
        ...activeCase.loginHistory.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, `${item.deviceId ?? item.device} · ${item.ip}`, activeCase.id, 'Login History', 'Pin'], item.session, 'Login timeline')),
      ],
    };
  }

  if (tool === 'Case Report') {
    return {
      columns: ['Report', 'Section', 'Value', 'State', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('REP-CASE', ['REP-CASE', 'Case reason', activeCase.allegation, 'Draft available', activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Report section'),
        makeRow('REP-CLAIM', ['REP-CLAIM', 'Claim intake', `${activeCase.claimId ?? activeCase.id} · ${activeCase.amount} · ${activeCase.transactionInfo ?? activeCase.type}`, 'Draft available', activeCase.id, 'Case Summary', 'Pin'], activeCase.id, 'Report section'),
        makeRow('REP-CUSTOMER', ['REP-CUSTOMER', 'Customer', `${activeCase.person} · ${activeCase.trainingId}`, 'Snapshot available', activeCase.id, 'Customer 360', 'Pin'], activeCase.trainingId, 'Report section'),
        makeRow('REP-DIGITAL', ['REP-DIGITAL', 'Digital activity', `${activeCase.loginHistory.length} login records and ${activeCase.events.length} events`, 'Review available', activeCase.id, 'Digital Activity', 'Pin'], activeCase.id, 'Report section'),
        ...reportPackets.map((packet) => makeRow(packet.id, [packet.id, packet.section, `${packet.title} · ${packet.summary}`, packet.state, activeCase.id, packet.sourceTool, 'Pin'], packet.id, 'Report packet')),
        makeRow('REP-LOCK', ['REP-LOCK', 'Submit Decision', 'Luna debrief and scoring stay locked until learner package submission.', 'Locked', activeCase.id, 'Submit Decision', 'Pin'], activeCase.id, 'Report section'),
      ],
    };
  }

  return {
    columns: ['Event', 'Time', 'Result', 'Device', 'IP', 'Location', 'Method'],
    rows: activeCase.loginHistory.map((item) => makeRow(item.id, [item.id, item.time, item.result, item.device, item.ip, item.location, item.method], item.ip, 'IP')),
  };
}

function lineBreaks(value) {
  return String(value).split('\n').map((line, index) => <small key={`${line}-${index}`}>{line}</small>);
}

function buildPacket(row, tool, activeCase) {
  const savedAt = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return {
    id: `PKT-${Date.now()}`,
    key: `${tool}:${row.id}`,
    caseId: activeCase.id,
    recordId: row.id,
    sourceTool: tool,
    section: `${tool} packet`,
    title: String(row.values[2] ?? row.values[1] ?? row.id).replace(/\n/g, ' · '),
    summary: row.detail,
    state: 'Saved to Case Report draft',
    savedAt,
  };
}

export default function VisualWorkspace({ activeCaseId, cases = enrichTrainingCases(baseCases), onCaseChange, onNavigate }) {
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [trayByCase, setTrayByCase] = useState(() => readStorage(storageKeys.tray, {}));
  const [notesByCase, setNotesByCase] = useState(() => readStorage(storageKeys.notes, {}));
  const [completedByCase, setCompletedByCase] = useState(() => readStorage(storageKeys.completed, {}));
  const [decisionByCase, setDecisionByCase] = useState(() => readStorage(storageKeys.decisions, {}));
  const [packagesByCase, setPackagesByCase] = useState(() => readStorage(storageKeys.packages, {}));
  const [packetsByCase, setPacketsByCase] = useState(() => readStorage(storageKeys.reportPackets, {}));
  const submitRef = useRef(null);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const activeCategory = categories.find((item) => item.key === categoryKey) ?? categories[1];
  const tray = trayByCase[activeCase.id] ?? [activeCase.trainingId];
  const notes = notesByCase[activeCase.id] ?? [];
  const currentCompleted = completedByCase[activeCase.id] ?? ['Case Summary'];
  const decisionDraft = decisionByCase[activeCase.id] ?? defaultDecisionDraft;
  const reviewPackages = packagesByCase[activeCase.id] ?? [];
  const reportPackets = packetsByCase[activeCase.id] ?? [];
  const data = rowsFor(tool, activeCase, reportPackets);
  const rows = useMemo(() => data.rows.filter((row) => !query || row.detail.toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const activeRow = rows.find((row) => row.id === expandedId) ?? rows[0];
  const packageStatus = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets });

  useEffect(() => writeStorage(storageKeys.tray, trayByCase), [trayByCase]);
  useEffect(() => writeStorage(storageKeys.notes, notesByCase), [notesByCase]);
  useEffect(() => writeStorage(storageKeys.completed, completedByCase), [completedByCase]);
  useEffect(() => writeStorage(storageKeys.decisions, decisionByCase), [decisionByCase]);
  useEffect(() => writeStorage(storageKeys.packages, packagesByCase), [packagesByCase]);
  useEffect(() => writeStorage(storageKeys.reportPackets, packetsByCase), [packetsByCase]);

  function openTool(nextTool) {
    const nextCategory = categories.find((item) => item.tools.includes(nextTool)) ?? categories[1];
    onNavigate('workspace');
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
    setExpandedId('');
    window.setTimeout(() => document.querySelector('.activity-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function changeCase(nextCaseId) {
    onCaseChange(nextCaseId);
    setCategoryKey('digital');
    setTool('Login History');
    setQuery('');
    setExpandedId('');
  }

  function jumpDecision() {
    onNavigate('workspace');
    window.setTimeout(() => submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function pin(value) {
    if (!value) return;
    setTrayByCase((current) => {
      const caseTray = current[activeCase.id] ?? [activeCase.trainingId];
      return { ...current, [activeCase.id]: [...new Set([...caseTray, value])] };
    });
  }

  function saveNote(text, type = 'Investigation note') {
    const clean = text.trim();
    if (!clean) return;
    const timestamp = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const noteLine = `${timestamp} · ${type} · ${clean}`;
    setNotesByCase((current) => ({ ...current, [activeCase.id]: [noteLine, ...(current[activeCase.id] ?? [])] }));
  }

  function markReviewed(toolName = tool) {
    setCompletedByCase((current) => {
      const caseTools = current[activeCase.id] ?? ['Case Summary'];
      return { ...current, [activeCase.id]: [...new Set([...caseTools, toolName])] };
    });
    saveNote(`${toolName}: reviewed and neutral report generated.`, 'Tool review');
  }

  function saveCaseReportPacket(row = activeRow) {
    if (!row) return;
    const packet = buildPacket(row, tool, activeCase);
    setPacketsByCase((current) => {
      const casePackets = current[activeCase.id] ?? [];
      const deduped = casePackets.filter((item) => item.key !== packet.key);
      return { ...current, [activeCase.id]: [packet, ...deduped].slice(0, 30) };
    });
    saveNote(`Case Report packet saved from ${tool}: ${row.id}.`, 'Case report packet');
  }

  function updateDecision(field, value) {
    setDecisionByCase((current) => ({
      ...current,
      [activeCase.id]: { ...(current[activeCase.id] ?? defaultDecisionDraft), [field]: value },
    }));
  }

  function submitNote(event) {
    event.preventDefault();
    saveNote(noteDraft, 'Investigation note');
    setNoteDraft('');
  }

  function submitDecision(event) {
    event.preventDefault();
    const status = getReviewPackageStatus({ completedTools: currentCompleted, tray, notes, draft: decisionDraft, reportPackets });
    if (!status.ready) {
      saveNote(`Submit Decision checklist checked. ${status.messages[0]}`, 'Decision checklist');
      return;
    }

    const reviewPackage = buildReviewPackage({
      caseId: activeCase.id,
      agentId: AGENT_ID,
      draft: decisionDraft,
      completedTools: currentCompleted,
      tray,
      notes,
      reportPackets,
      packageStatus: status,
    });

    setPackagesByCase((current) => ({ ...current, [activeCase.id]: [reviewPackage, ...(current[activeCase.id] ?? [])] }));
    window.dispatchEvent(new CustomEvent('fraud-academy:package-saved', { detail: { caseId: activeCase.id, packageId: reviewPackage.id } }));
    markReviewed('Submit Decision');
    saveNote('Submit Decision: learner review package saved. Post-submission Luna debrief can now read the saved package state.', 'Decision package');
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <header className="visual-hero">
          <div className="hero-cat left">🐈‍⬛</div>
          <div className="hero-bat">🦇</div>
          <div className="hero-title-wrap"><div className="hero-jewel">💜</div><h1>Fraud Academy OS</h1><span>v1.0</span></div>
          <div className="hero-cat right">🦇</div>
        </header>

        <section className="case-info-bar visual-case-strip">
          <div><span>▣</span><strong>Case</strong><em>{activeCase.id}</em></div>
          <div><span>♟</span><strong>Claim Type:</strong><em>{activeCase.type}</em></div>
          <div><span>◈</span><strong>Status:</strong><em>{activeCase.status}</em></div>
          <label className="visual-case-switcher"><span>Case Queue</span><select value={activeCase.id} onChange={(event) => changeCase(event.target.value)}>{cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}</select></label>
        </section>

        <section className="ornate-card case-summary-visual">
          <div className="moon-medallion">☾</div>
          <div className="summary-copy">
            <p className="visual-section-title">♥ Case Summary</p>
            <div className="case-summary-meta-grid">
              <article><small>Name</small><strong>{activeCase.person}</strong></article>
              <article><small>Claim ID</small><strong>{activeCase.claimId ?? activeCase.id}</strong></article>
              <article><small>Total claim amount</small><strong>{activeCase.amount}</strong></article>
              <article className="wide"><small>Transaction / payee info</small><strong>{activeCase.transactionInfo ?? activeCase.type}</strong></article>
              <article className="wide"><small>Short summary</small><strong>{activeCase.shortSummary ?? activeCase.queueReason}</strong></article>
            </div>
          </div>
          <div className="butterfly-accent">🦋</div>
          <div className="summary-actions">
            <button type="button" onClick={() => pin(activeCase.id)}>📌 Pin Case</button>
            <button type="button" onClick={() => openTool('Identity Intelligence')}>▣ Identity Intel ›</button>
            <button type="button" onClick={() => openTool('Case Report')}>📄 Case Report ›</button>
            <button type="button" onClick={() => openTool('Login History')}>🪄 Open First Tool ›</button>
            <button type="button" className="primary-action decision-jump-button" onClick={jumpDecision}>🪄 Submit Decision ›</button>
          </div>
        </section>

        <section className="visual-categories">
          <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button type="button" onClick={() => onNavigate('academy')}>Tool Map ›</button></div>
          <div className="visual-category-row">
            {categories.map((item) => {
              const reviewedCount = item.tools.filter((toolName) => currentCompleted.includes(toolName)).length;
              const progressPercent = Math.round((reviewedCount / item.tools.length) * 100);
              const complete = reviewedCount === item.tools.length;
              const status = complete ? 'Complete' : reviewedCount > 0 ? 'In progress' : 'Open';
              return (
                <button key={item.key} type="button" className={`${categoryKey === item.key ? 'active' : ''} ${complete ? 'reviewed' : ''}`} onClick={() => { setCategoryKey(item.key); setTool(item.tools[0]); setExpandedId(''); }}>
                  <span>{item.icon}</span><strong>{item.label}</strong><em>{reviewedCount}/{item.tools.length}</em><small className="category-status-copy">{status}</small><div className="category-progress-track"><b style={{ width: `${progressPercent}%` }} /></div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ornate-card activity-panel">
          <div className="activity-heading"><h2>▣ {activeCategory.label}</h2><select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)}>{activeCategory.tools.map((item) => <option key={item}>{item}</option>)}</select><span className="panel-cat">🐈‍⬛</span></div>
          <div className="tool-purpose-card"><strong>{tool}</strong><p>{tool === 'Device Intelligence' ? 'Device IDs help separate repeated known devices from new devices. Repeated device names keep the same fictional Device ID for this customer.' : tool === 'System Access Lane' || SYSTEM_ACCESS_TOOL_NAMES.includes(tool) ? 'Review neutral insider, vendor, admin, shared-access, API, token, consent, aggregator, webhook, and open-banking records tied to the case objects.' : 'Review available case records while keeping the final decision locked.'}</p><div className="tool-flow-chips">{workflows.map((item) => <span key={item}>{item}</span>)}</div><button type="button" className="decision-route-mini" onClick={jumpDecision}>Need to decide? Open Submit Decision</button></div>
          <div className="workspace-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..."/><span>{rows.length} of {data.rows.length} shown</span></div>
          <div className="activity-table"><div className="activity-row table-head">{data.columns.map((item) => <span key={item}>{item}</span>)}</div>{rows.map((row) => <div key={row.id} className={`activity-row ${activeRow?.id === row.id ? 'expanded' : ''}`}>{row.values.map((value, index) => <span key={`${row.id}-${index}`}>{lineBreaks(value)}</span>)}<div className="row-action-group"><button type="button" className="row-expand-button" onClick={() => setExpandedId(row.id)}>Expand</button><button type="button" className="row-pin-button" onClick={() => pin(row.pin)}>📌</button></div></div>)}</div>
          {activeRow && <section className="record-detail-panel"><div className="record-detail-heading"><div><span>Expanded Record</span><h3>{activeRow.id}</h3></div><button type="button" onClick={() => saveNote(`Expanded ${tool} record ${activeRow.id}: ${activeRow.detail}`, 'Expanded record')}>Save expanded note</button></div><div className="record-review-lanes"><article><h4>History</h4><p>☾ {activeRow.id} is open inside {tool} for {activeCase.id}.</p><p>☾ Record history can be compared with pinned evidence, timeline entries, and the case report draft.</p></article><article><h4>Link Analysis</h4><p>⌘ {activeRow.label}: {activeRow.pin}</p><p>⌘ Case object: {activeCase.id} · {activeCase.person}</p></article><article><h4>Generated Report</h4><p>✦ Source tool: {tool}.</p><p>✦ Record summary: {activeRow.detail}.</p><div className="record-report-actions"><button type="button" onClick={() => saveCaseReportPacket(activeRow)}>Save neutral report packet</button><button type="button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? 'Reviewed' : 'Mark reviewed'}</button></div></article></div></section>}
          <button type="button" className="view-full-button" onClick={() => markReviewed(tool)}>{currentCompleted.includes(tool) ? '✓ Reviewed · Generate Another Neutral Tool Report' : '✦ Generate Neutral Tool Report ›'}</button>
        </section>

        <section ref={submitRef} className="ornate-card submit-decision-panel">
          <div className="card-title-row"><div><h2>🪄 Submit Decision</h2><p>Locked checklist. No Luna scoring or answer reveal until a learner package is saved.</p></div><span>☾</span></div>
          <div className="decision-status-grid"><div><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><span>Required tools</span></div><div><strong>{tray.length}</strong><span>Pinned objects</span></div><div><strong>{notes.length}</strong><span>Notes</span></div><div><strong>{reviewPackages.length}</strong><span>Saved packages</span></div></div>
          <div className="decision-checklist">{packageStatus.messages.map((message) => <p key={message}>✦ {message}</p>)}</div>
          <form className="decision-form" onSubmit={submitDecision}>
            <label>Learner choice<select value={decisionDraft.choice} onChange={(event) => updateDecision('choice', event.target.value)}><option value="">Select neutral choice...</option>{reviewChoices.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Confidence<select value={decisionDraft.confidence} onChange={(event) => updateDecision('confidence', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label className="decision-rationale">Learner rationale<textarea value={decisionDraft.reason} onChange={(event) => updateDecision('reason', event.target.value)} placeholder={`Write the evidence-based rationale for ${activeCase.id}.`} /></label>
            <button className="primary-action" type="submit">Save / Check Review Package</button>
          </form>
        </section>

        <section className="bottom-investigation-grid">
          <div className="ornate-card tray-card"><div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div><div className="tray-list">{tray.map((item) => <div key={item}><span>▯</span><strong>Pinned</strong><em>{item}</em><button type="button" onClick={() => pin(item)}>📌</button></div>)}</div><button type="button" className="add-evidence" onClick={() => openTool('Evidence Center')}>✦ Open Evidence Center ›</button></div>
          <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div><form className="notebook-compose" onSubmit={submitNote}><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Type an investigation note..."/><button type="submit">Save Note</button></form><details className="case-report-packet-panel" open={reportPackets.length > 0}><summary>Case Report packets · {reportPackets.length} saved</summary><div>{reportPackets.slice(0, 8).map((item) => <p key={item.id}><strong>{item.section}</strong> · {item.recordId} · {item.title}</p>)}{!reportPackets.length && <p>No structured packets saved yet. Use an expanded record to save one.</p>}</div></details><div className="notebook-list">{(notes.length ? notes : ['No manual note saved yet.']).map((item, index) => <button type="button" key={`${item}-${index}`}><span>✎</span><p>{item}</p><em>›</em></button>)}</div></div>
        </section>
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
