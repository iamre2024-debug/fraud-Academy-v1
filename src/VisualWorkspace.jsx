import { useMemo, useRef, useState } from 'react';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';

const cases = enrichTrainingCases(baseCases);

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', label: 'Financial', icon: '$', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', label: 'Business', icon: '⌂', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', label: 'Evidence', icon: '▰', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', label: 'Connections', icon: '⌘', tools: ['Link Analysis'] },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tools: ['Timeline', 'Case Report'] },
];

const workflows = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];
const decisionChoices = [
  'Customer claim supported by documented evidence',
  'Customer claim not supported by documented evidence',
  'Route for secondary review',
  'Needs more records first',
];

function makeRow(id, values, pin = id, label = 'Record') {
  const normalized = values.map((value) => value ?? 'Not recorded');
  return { id, values: normalized, pin, label, detail: normalized.join(' ') };
}

function rowsFor(tool, activeCase) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [], financialIntel: [], paymentVerification: [] };
  const business = businessRecordsByCase[activeCase.id] ?? { business360: [], businessIntel: [], employeeProfile: [], payrollHistory: [] };
  const evidence = evidenceRecordsByCase[activeCase.id] ?? { evidence: [], documents: [] };

  if (tool === 'Customer 360') {
    const relationship = activeCase.customer?.relationship ?? [];
    const profileChanges = activeCase.customer?.profileChanges ?? [];
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'History', 'Object', 'Action'],
      rows: [
        makeRow('C360-REL', ['C360-REL', 'Relationship since', activeCase.customer?.relationshipSince, activeCase.opened, 'Customer relationship snapshot', activeCase.trainingId, 'Pin']),
        makeRow('C360-SEG', ['C360-SEG', 'Segment', activeCase.customer?.segment, activeCase.opened, 'Product relationship context', activeCase.id, 'Pin']),
        ...relationship.map((item, index) => makeRow(`C360-REL-${index + 1}`, [`C360-REL-${index + 1}`, item.label, item.value, activeCase.opened, 'Relationship detail', activeCase.id, 'Pin'])),
        ...profileChanges.map((item) => makeRow(item.id, [item.id, item.item, item.detail, item.date, item.source, activeCase.id, 'Pin'])),
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
        ...activeCase.loginHistory.map((item) => makeRow(item.session, [item.session, item.time, item.result, item.device, item.ip, activeCase.id, item.method])),
        ...activeCase.events.map((item) => makeRow(item.id, [item.id, item.time, item.label, item.object, item.chip, activeCase.id, item.detail])),
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
      rows: financial.transactions.map((item) => makeRow(item.id, [item.id, `${item.posted}\n${item.time}`, item.merchant, item.amount, item.channel, item.instrument, item.status])),
    };
  }

  if (tool === 'Financial Intelligence') {
    return {
      columns: ['Record', 'Type', 'Value', 'Observed', 'Context', 'Case', 'Action'],
      rows: financial.financialIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'])),
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
      rows: business.businessIntel.map((item) => makeRow(item.id, [item.id, item.type, item.value, item.observed, item.context, activeCase.id, 'Pin'])),
    };
  }

  if (tool === 'Employee Profile') {
    return {
      columns: ['Record', 'Name', 'Role', 'Employer', 'Status', 'Last Seen', 'Context'],
      rows: business.employeeProfile.map((item) => makeRow(item.id, [item.id, item.name, item.role, item.employer, item.status, item.lastSeen, item.context])),
    };
  }

  if (tool === 'Payroll History') {
    return {
      columns: ['Record', 'Period', 'Employer', 'Amount', 'Channel', 'Status', 'Context'],
      rows: business.payrollHistory.map((item) => makeRow(item.id, [item.id, item.period, item.employer, item.amount, item.channel, item.status, item.context])),
    };
  }

  if (tool === 'Evidence Center') {
    return {
      columns: ['Record', 'Status', 'Evidence', 'Source', 'Received', 'Linked Object', 'Summary'],
      rows: evidence.evidence.map((item) => makeRow(item.id, [item.id, item.status, item.name, item.source, item.received, item.linkedObject, item.summary])),
    };
  }

  if (tool === 'Document Viewer') {
    return {
      columns: ['Document', 'Status', 'Title', 'Category', 'Updated', 'Fields', 'Preview'],
      rows: evidence.documents.map((item) => makeRow(item.id, [item.id, item.status, item.title, item.category, item.updated, item.fields, item.preview])),
    };
  }

  if (tool === 'Link Analysis') {
    return {
      columns: ['Link', 'Object', 'Source', 'Linked To', 'Detail', 'Case', 'Action'],
      rows: [
        ...activeCase.identityRecords.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.value, item.id, activeCase.person, item.history, activeCase.id, 'Pin'])),
        ...activeCase.loginHistory.map((item) => makeRow(`LNK-${item.id}`, [`LNK-${item.id}`, item.ip, item.session, item.deviceId ?? item.device, item.location, activeCase.id, 'Pin'])),
      ],
    };
  }

  if (tool === 'Timeline') {
    return {
      columns: ['Timeline', 'Time', 'Event', 'Detail', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('TML-OPEN', ['TML-OPEN', activeCase.opened, 'Case opened', activeCase.queueReason, activeCase.id, 'Case Summary', 'Pin']),
        ...activeCase.events.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.label, item.detail, activeCase.id, item.chip, 'Pin'])),
        ...activeCase.loginHistory.map((item) => makeRow(`TML-${item.id}`, [`TML-${item.id}`, item.time, item.result, `${item.deviceId ?? item.device} · ${item.ip}`, activeCase.id, 'Login History', 'Pin'])),
      ],
    };
  }

  if (tool === 'Case Report') {
    return {
      columns: ['Report', 'Section', 'Value', 'State', 'Case', 'Source', 'Action'],
      rows: [
        makeRow('REP-CASE', ['REP-CASE', 'Case reason', activeCase.allegation, 'Draft available', activeCase.id, 'Case Summary', 'Pin']),
        makeRow('REP-CLAIM', ['REP-CLAIM', 'Claim intake', `${activeCase.claimId ?? activeCase.id} · ${activeCase.amount} · ${activeCase.transactionInfo ?? activeCase.type}`, 'Draft available', activeCase.id, 'Case Summary', 'Pin']),
        makeRow('REP-CUSTOMER', ['REP-CUSTOMER', 'Customer', `${activeCase.person} · ${activeCase.trainingId}`, 'Snapshot available', activeCase.id, 'Customer 360', 'Pin']),
        makeRow('REP-DIGITAL', ['REP-DIGITAL', 'Digital activity', `${activeCase.loginHistory.length} login records and ${activeCase.events.length} events`, 'Review available', activeCase.id, 'Digital Activity', 'Pin']),
        makeRow('REP-LOCK', ['REP-LOCK', 'Submit Decision', 'Luna debrief and scoring stay locked until learner package submission.', 'Locked', activeCase.id, 'Submit Decision', 'Pin']),
      ],
    };
  }

  return {
    columns: ['Event', 'Time', 'Result', 'Device', 'IP', 'Location', 'Method'],
    rows: activeCase.loginHistory.map((item) => makeRow(item.id, [item.id, item.time, item.result, item.device, item.ip, item.location, item.method], item.ip, 'IP')),
  };
}

function lineBreaks(value) {
  return String(value).split('\n').map((line) => <small key={line}>{line}</small>);
}

export default function VisualWorkspace() {
  const [caseId, setCaseId] = useState(cases[0].id);
  const [categoryKey, setCategoryKey] = useState('digital');
  const [tool, setTool] = useState('Login History');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [tray, setTray] = useState([]);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState({ choice: '', confidence: 'Medium', rationale: '' });
  const submitRef = useRef(null);

  const activeCase = cases.find((item) => item.id === caseId) ?? cases[0];
  const activeCategory = categories.find((item) => item.key === categoryKey) ?? categories[1];
  const data = rowsFor(tool, activeCase);
  const rows = useMemo(() => data.rows.filter((row) => !query || row.detail.toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const activeRow = rows.find((row) => row.id === expandedId) ?? rows[0];

  function openTool(nextTool) {
    const nextCategory = categories.find((item) => item.tools.includes(nextTool)) ?? categories[1];
    document.body.dataset.visualTab = 'workspace';
    window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab: 'workspace' } }));
    setCategoryKey(nextCategory.key);
    setTool(nextTool);
    setQuery('');
  }

  function jumpDecision() {
    document.body.dataset.visualTab = 'workspace';
    window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab: 'workspace' } }));
    window.setTimeout(() => submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function pin(value) {
    setTray((current) => [...new Set([...current, value])]);
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
          <label className="visual-case-switcher"><span>Case Queue</span><select value={caseId} onChange={(event) => { setCaseId(event.target.value); setCategoryKey('digital'); setTool('Login History'); }} >{cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}</select></label>
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
          <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('fraud-academy:navigate', { detail: { tab: 'academy' } }))}>Tool Map ›</button></div>
          <div className="visual-category-row">
            {categories.map((item) => <button key={item.key} type="button" className={categoryKey === item.key ? 'active' : ''} onClick={() => { setCategoryKey(item.key); setTool(item.tools[0]); }}><span>{item.icon}</span><strong>{item.label}</strong><em>0/{item.tools.length}</em><small className="category-status-copy">Open</small><div className="category-progress-track"><b style={{ width: '0%' }} /></div></button>)}
          </div>
        </section>

        <section className="ornate-card activity-panel">
          <div className="activity-heading"><h2>▣ {activeCategory.label}</h2><select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)}>{activeCategory.tools.map((item) => <option key={item}>{item}</option>)}</select><span className="panel-cat">🐈‍⬛</span></div>
          <div className="tool-purpose-card"><strong>{tool}</strong><p>{tool === 'Device Intelligence' ? 'Device IDs help separate repeated known devices from new devices.' : 'Review available case records while keeping the final decision locked.'}</p><div className="tool-flow-chips">{workflows.map((item) => <span key={item}>{item}</span>)}</div><button type="button" className="decision-route-mini" onClick={jumpDecision}>Need to decide? Open Submit Decision</button></div>
          <div className="workspace-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, device, IP, merchant, document..."/><span>{rows.length} of {data.rows.length} shown</span></div>
          <div className="activity-table"><div className="activity-row table-head">{data.columns.map((item) => <span key={item}>{item}</span>)}</div>{rows.map((row) => <div key={row.id} className={`activity-row ${activeRow?.id === row.id ? 'expanded' : ''}`}>{row.values.map((value, index) => <span key={`${row.id}-${index}`}>{lineBreaks(value)}</span>)}<div className="row-action-group"><button type="button" className="row-expand-button" onClick={() => setExpandedId(row.id)}>Expand</button><button type="button" className="row-pin-button" onClick={() => pin(row.pin)}>📌</button></div></div>)}</div>
          {activeRow && <section className="record-detail-panel"><div className="record-detail-heading"><div><span>Expanded Record</span><h3>{activeRow.id}</h3></div><button type="button" onClick={() => setNote(`Expanded ${tool} record ${activeRow.id}: ${activeRow.detail}`)}>Save expanded note</button></div><div className="record-review-lanes"><article><h4>History</h4><p>☾ {activeRow.id} is open inside {tool} for {activeCase.id}.</p><p>☾ Record history can be compared with pinned evidence, timeline entries, and the case report draft.</p></article><article><h4>Link Analysis</h4><p>⌘ {activeRow.label}: {activeRow.pin}</p><p>⌘ Case object: {activeCase.id} · {activeCase.person}</p></article><article><h4>Generated Report</h4><p>✦ Source tool: {tool}.</p><p>✦ Record summary: {activeRow.detail}.</p></article></div></section>}
        </section>

        <section ref={submitRef} className="ornate-card submit-decision-panel">
          <div className="card-title-row"><div><h2>🪄 Submit Decision</h2><p>Locked checklist. No Luna scoring or answer reveal until a learner package is saved.</p></div><span>☾</span></div>
          <div className="decision-status-grid"><div><strong>Locked</strong><span>Package state</span></div><div><strong>{tray.length}</strong><span>Pinned objects</span></div><div><strong>{note ? 1 : 0}</strong><span>Draft notes</span></div></div>
          <div className="decision-checklist"><p>✦ Review package locked until required tools, evidence, rationale, and learner choice are complete.</p></div>
          <form className="decision-form">
            <label>Learner choice<select value={decision.choice} onChange={(event) => setDecision((current) => ({ ...current, choice: event.target.value }))}><option value="">Select neutral choice...</option>{decisionChoices.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Confidence<select value={decision.confidence} onChange={(event) => setDecision((current) => ({ ...current, confidence: event.target.value }))}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label className="decision-rationale">Learner rationale<textarea value={decision.rationale} onChange={(event) => setDecision((current) => ({ ...current, rationale: event.target.value }))} placeholder={`Write the evidence-based rationale for ${activeCase.id}.`} /></label>
            <button className="primary-action" type="button">Save / Check Review Package</button>
          </form>
        </section>

        <section className="bottom-investigation-grid">
          <div className="ornate-card tray-card"><div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div><div className="tray-list">{(tray.length ? tray : [activeCase.trainingId]).map((item) => <div key={item}><span>▯</span><strong>Pinned</strong><em>{item}</em><button type="button">📌</button></div>)}</div><button type="button" className="add-evidence" onClick={() => openTool('Evidence Center')}>✦ Open Evidence Center ›</button></div>
          <div className="ornate-card notebook-card"><div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Saved notes stay with the active case</p></div><span>🐈‍⬛</span></div><form className="notebook-compose"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Type an investigation note..."/><button type="button">Save Note</button></form><div className="notebook-list"><button type="button"><span>✎</span><p>{note || 'No manual note saved yet.'}</p><em>›</em></button></div></div>
        </section>
        <nav className="visual-bottom-nav" aria-hidden="true" />
      </section>
    </main>
  );
}
