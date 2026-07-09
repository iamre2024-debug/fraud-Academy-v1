import { useMemo, useState } from 'react';
import { trainingCases } from './data/cases.js';
import { financialRecordsByCase } from './data/financialRecords.js';
import { businessRecordsByCase } from './data/businessRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣', tool: 'Customer 360' },
  { key: 'digital', label: 'Digital Activity', icon: '⌁', tool: 'Login History' },
  { key: 'financial', label: 'Financial', icon: '$', tool: 'Transaction History' },
  { key: 'business', label: 'Business', icon: '⌂', tool: 'Business 360' },
  { key: 'evidence', label: 'Evidence', icon: '▰', tool: 'Evidence Center' },
  { key: 'connections', label: 'Connections', icon: '⌘', tool: 'Link Analysis' },
  { key: 'investigation', label: 'Investigation', icon: '⌕', tool: 'Case Report' },
];

const defaultNotes = [
  { icon: '▯', text: 'Open the relevant records, compare the story against evidence, and document what is still missing.' },
  { icon: '◎', text: 'Pin identifiers that matter: Training ID, device, IP, transaction, document, or payment object.' },
  { icon: '⚿', text: 'Keep the final decision locked until the learner submits a review package.' },
];

export default function VisualWorkspace() {
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0].id);
  const [activeCategory, setActiveCategory] = useState('digital');
  const [query, setQuery] = useState('');
  const [tray, setTray] = useState([trainingCases[0].trainingId]);
  const [notes, setNotes] = useState(defaultNotes);

  const activeCase = useMemo(() => trainingCases.find((item) => item.id === activeCaseId) ?? trainingCases[0], [activeCaseId]);
  const activeCategoryConfig = useMemo(() => categories.find((item) => item.key === activeCategory) ?? categories[1], [activeCategory]);
  const records = useMemo(() => buildToolRows(activeCategory, activeCase), [activeCategory, activeCase]);
  const filteredRows = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return records.rows;
    return records.rows.filter((row) => row.values.some((value) => String(value).toLowerCase().includes(clean)) || row.detail.toLowerCase().includes(clean));
  }, [records.rows, query]);

  function openCase(caseId) {
    const nextCase = trainingCases.find((item) => item.id === caseId) ?? trainingCases[0];
    setActiveCaseId(nextCase.id);
    setActiveCategory('digital');
    setQuery('');
    setTray([nextCase.trainingId]);
    setNotes(defaultNotes);
  }

  function pinEvidence(value, label = 'Pinned object') {
    if (!value) return;
    setTray((current) => current.includes(value) ? current : [...current, value]);
    setNotes((current) => [{ icon: '📌', text: `${label} pinned: ${value}` }, ...current]);
  }

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualHero />
        <CaseInfoBar activeCase={activeCase} activeCaseId={activeCaseId} openCase={openCase} />
        <CaseSummaryCard activeCase={activeCase} pinEvidence={pinEvidence} setActiveCategory={setActiveCategory} />
        <InvestigationCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <EvidencePanel
          activeCategoryConfig={activeCategoryConfig}
          records={records}
          rows={filteredRows}
          query={query}
          setQuery={setQuery}
          pinEvidence={pinEvidence}
        />
        <BottomInvestigationGrid tray={tray} notes={notes} pinEvidence={pinEvidence} />
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

function InvestigationCategories({ activeCategory, setActiveCategory }) {
  return (
    <section className="visual-categories" aria-label="Investigation categories">
      <div className="visual-section-heading"><h2>✦ Investigation Categories</h2><button>View All ›</button></div>
      <div className="visual-category-row">
        {categories.map((item) => (
          <button key={item.key} className={activeCategory === item.key ? 'active' : ''} onClick={() => setActiveCategory(item.key)}>
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
            {activeCategory === item.key && <i>♥</i>}
          </button>
        ))}
      </div>
    </section>
  );
}

function EvidencePanel({ activeCategoryConfig, records, rows, query, setQuery, pinEvidence }) {
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
      <button className="view-full-button">✦ Generate Neutral Tool Report ›</button>
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

function formatLines(value) {
  return String(value).split('\n').map((line) => <small key={line}>{line}</small>);
}

function BottomInvestigationGrid({ tray, notes, pinEvidence }) {
  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div>
        <div className="tray-list">{tray.map((value, index) => <div key={`${value}-${index}`}><span>▯</span><strong>Pinned</strong><em>{value}</em><button onClick={() => pinEvidence(value, 'Tray item')}>📌</button></div>)}</div>
        <button className="add-evidence">✦ + Add Evidence</button>
      </div>
      <div className="ornate-card notebook-card">
        <div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Suggested Findings, Evidence Based</p></div><span>🐈‍⬛</span></div>
        <div className="notebook-list">{notes.map((item, index) => <button key={`${item.text}-${index}`}><span>{item.icon}</span><p>{item.text}</p><em>›</em></button>)}</div>
        <button className="add-evidence">Open Notebook ›</button>
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
      rows: evidence.evidence.map((record) => makeRow(record.id, [record.id, record.status, record.name, record.detail, activeCase.id, 'Evidence packet', 'Pin'], record.id, 'Evidence')),
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
