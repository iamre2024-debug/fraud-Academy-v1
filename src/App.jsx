import { useMemo, useState } from 'react';
import { trainingCases } from './data/cases.js';

const families = [
  { key: 'summary', title: 'Case Summary', icon: '📋', question: 'Why am I investigating this case?', tools: ['Case Summary'] },
  { key: 'identity', title: 'Identity', icon: '👤', question: 'Who am I investigating?', tools: ['Customer 360', 'Identity Intelligence'] },
  { key: 'digital', title: 'Digital Activity', icon: '💻', question: 'Can I verify or challenge the story?', tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'] },
  { key: 'financial', title: 'Financial', icon: '💳', question: 'Does the money movement make sense?', tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'] },
  { key: 'business', title: 'Business', icon: '🏢', question: 'Is the business relationship real?', tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'] },
  { key: 'evidence', title: 'Evidence', icon: '📂', question: 'What evidence do I have?', tools: ['Evidence Center', 'Document Viewer'] },
  { key: 'connections', title: 'Connections', icon: '🔗', question: 'How does everything connect?', tools: ['Link Analysis'] },
  { key: 'investigation', title: 'Investigation', icon: '🕵️', question: 'What have I completed?', tools: ['Timeline', 'Case Report', 'Submit Decision'] },
];

const workflowSteps = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];
const allTools = families.flatMap((item) => item.tools);

function App() {
  const [activeCaseId, setActiveCaseId] = useState(trainingCases[0].id);
  const [activeFamily, setActiveFamily] = useState('summary');
  const [activeTool, setActiveTool] = useState('Case Summary');
  const [tray, setTray] = useState(['TRN-8842-19', 'EVT-1008']);
  const [notes, setNotes] = useState(['Customer states they did not authorize the purchase.', 'Need to compare login/device activity before decision.']);
  const [completedTools, setCompletedTools] = useState({ 'FA-ATO-24018': ['Case Summary', 'Customer 360'], 'FA-CB-24007': ['Case Summary'], 'FA-CR-24003': ['Case Summary'] });
  const activeCase = useMemo(() => trainingCases.find((item) => item.id === activeCaseId) ?? trainingCases[0], [activeCaseId]);
  const family = useMemo(() => families.find((item) => item.key === activeFamily), [activeFamily]);
  const currentCompleted = completedTools[activeCase.id] ?? [];
  const progressPercent = Math.round((currentCompleted.length / allTools.length) * 100);

  function openFamily(item) { setActiveFamily(item.key); setActiveTool(item.tools[0]); }
  function openCase(caseId) {
    const nextCase = trainingCases.find((item) => item.id === caseId) ?? trainingCases[0];
    setActiveCaseId(caseId); setActiveFamily('summary'); setActiveTool('Case Summary'); setTray([nextCase.trainingId]);
    setNotes([`Opened ${caseId} workspace. Review the allegation before deciding next steps.`]);
  }
  function pinEvidence(item) { setTray((current) => (current.includes(item) ? current : [...current, item])); }
  function addFinding(text) { setNotes((current) => [text, ...current]); }
  function markReviewed(tool = activeTool) {
    setCompletedTools((current) => {
      const caseTools = current[activeCase.id] ?? [];
      if (caseTools.includes(tool)) return current;
      return { ...current, [activeCase.id]: [...caseTools, tool] };
    });
    addFinding(`${tool}: reviewed and documented.`);
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="phone-frame">
        <header className="top-bar"><div><p className="eyebrow">Fraud Academy OS</p><h1>Case Workspace</h1></div><button className="round-button" aria-label="Open Luna">🌙</button></header>
        <section className="case-queue" aria-label="Active case queue"><div className="section-heading compact-heading"><div><p className="eyebrow">Case Queue</p><h3>Choose an investigation</h3></div><span>{trainingCases.length} active</span></div><div className="queue-list">{trainingCases.map((item) => <button key={item.id} className={`queue-card ${item.id === activeCase.id ? 'active' : ''}`} onClick={() => openCase(item.id)}><span className="case-pill soft">{item.type}</span><strong>{item.person}</strong><small>{item.id} · {item.priority}</small></button>)}</div></section>
        <section className="hero-bubble"><div className="hero-copy"><span className="case-pill">{activeCase.type}</span><h2>{activeCase.person}</h2><p>{activeCase.id} · {activeCase.priority} Priority · {activeCase.status}</p></div><div className="cat-orb" aria-hidden="true">🐈‍⬛</div></section>
        <nav className="family-grid" aria-label="Investigation categories">{families.map((item) => { const familyCompleted = item.tools.filter((tool) => currentCompleted.includes(tool)).length; return <button key={item.key} className={`family-bubble ${activeFamily === item.key ? 'active' : ''}`} onClick={() => openFamily(item)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.question}</small><em>{familyCompleted}/{item.tools.length} reviewed</em></button>; })}</nav>
        <section className="workspace-card"><div className="section-heading"><div><p className="eyebrow">Active panel</p><h3>{activeTool}</h3></div><span className="sparkle">✦</span></div><ProgressRail percent={progressPercent} completed={currentCompleted.length} /><div className="tool-tabs">{family.tools.map((tool) => <button key={tool} className={tool === activeTool ? 'selected' : ''} onClick={() => setActiveTool(tool)}>{currentCompleted.includes(tool) ? '✓ ' : ''}{tool}</button>)}</div><EvidenceFirstBanner /><Panel activeCase={activeCase} activeTool={activeTool} pinEvidence={pinEvidence} addFinding={addFinding} markReviewed={markReviewed} completed={currentCompleted.includes(activeTool)} /></section>
        <aside className="desktop-side-panel"><Tray tray={tray} /><Notebook notes={notes} /></aside>
        <section className="mobile-drawers"><details><summary>🧰 Investigation Tray</summary><Tray tray={tray} compact /></details><details><summary>📝 Notebook</summary><Notebook notes={notes} compact /></details></section>
        <nav className="bottom-nav" aria-label="Main navigation"><button className="active">🏠<span>Home</span></button><button>📂<span>Cases</span></button><button>🕵️<span>Work</span></button><button>🎓<span>Learn</span></button></nav>
      </section>
    </main>
  );
}

function ProgressRail({ percent, completed }) { return <div className="progress-rail" aria-label="Investigation progress"><div><strong>{percent}% reviewed</strong><span>{completed} workspace tools documented</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div></div>; }
function EvidenceFirstBanner() { return <div className="evidence-first-banner"><strong>Evidence First</strong><span>No final outcome, score, red/green labels, or Luna answer until submission.</span></div>; }

function Panel({ activeCase, activeTool, pinEvidence, addFinding, markReviewed, completed }) {
  if (activeTool === 'Case Summary') return <div className="panel-stack"><CaseBriefing activeCase={activeCase} pinEvidence={pinEvidence} addFinding={addFinding} /><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>;
  if (activeTool === 'Customer 360') return <div className="panel-stack"><CustomerProfile activeCase={activeCase} pinEvidence={pinEvidence} addFinding={addFinding} /><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>;
  if (activeTool === 'Identity Intelligence') return <IdentityIntelligence activeCase={activeCase} pinEvidence={pinEvidence} addFinding={addFinding} markReviewed={markReviewed} completed={completed} />;
  if (activeTool === 'Login History') return <LoginHistory activeCase={activeCase} pinEvidence={pinEvidence} addFinding={addFinding} markReviewed={markReviewed} completed={completed} />;
  if (['Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History'].includes(activeTool)) return <EventLog activeCase={activeCase} activeTool={activeTool} pinEvidence={pinEvidence} addFinding={addFinding} markReviewed={markReviewed} completed={completed} />;
  if (activeTool === 'Evidence Center') return <div className="panel-stack">{activeCase.documents.map((document) => <EvidenceItem key={document.id} {...document} pinEvidence={pinEvidence} />)}<ReviewAction completed={completed} onClick={() => markReviewed()} /></div>;
  if (activeTool === 'Document Viewer') return <div className="panel-stack"><div className="document-shell"><p className="eyebrow">Document Viewer</p><h4>Training document preview</h4><p>Case documents will be selected from Evidence Center and reviewed here without exposing the final case outcome.</p></div><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>;
  if (activeTool === 'Link Analysis') return <div className="panel-stack"><div className="connection-summary"><InfoBubble label="Connected objects" value={String(activeCase.links.length)} /><InfoBubble label="Shared identifiers" value="2" /><InfoBubble label="First seen" value={activeCase.opened.replace('2026', '').trim()} /></div><div className="link-web">{activeCase.links.map((link) => <span key={link}>{link}</span>)}</div><WorkflowStrip /><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>;
  if (['Timeline', 'Case Report', 'Submit Decision'].includes(activeTool)) return <InvestigationPanel activeCase={activeCase} activeTool={activeTool} markReviewed={markReviewed} completed={completed} />;
  return <PlaceholderTool activeTool={activeTool} completed={completed} markReviewed={markReviewed} />;
}

function CaseBriefing({ activeCase, pinEvidence, addFinding }) {
  return <><div className="story-card bubble-card large-pop"><p className="eyebrow">Why am I here?</p><h4>Customer story / system reason</h4><p>{activeCase.allegation}</p><button onClick={() => pinEvidence(activeCase.id)}>📌 Pin case ID</button></div><div className="mini-grid"><InfoBubble label="Claim amount" value={activeCase.amount} /><InfoBubble label="Status" value={activeCase.status} /><InfoBubble label="Opened" value={activeCase.opened} /></div><div className="briefing-card"><p className="eyebrow">Briefing questions</p><h4>What should I answer before deciding?</h4><ul className="question-list">{activeCase.briefingQuestions.map((question) => <li key={question}><span>?</span><p>{question}</p><button onClick={() => addFinding(`Briefing question noted: ${question}`)}>Add note</button></li>)}</ul></div><IntakeCard intake={activeCase.intake} /><ul className="fact-list">{activeCase.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul></>;
}

function CustomerProfile({ activeCase, pinEvidence, addFinding }) {
  const { customer } = activeCase;
  return <><div className="bubble-card profile-pop"><p className="eyebrow">Who am I investigating?</p><h4>{activeCase.person}</h4><p>Training ID: {activeCase.trainingId}</p><button onClick={() => pinEvidence(activeCase.trainingId)}>📌 Pin Training ID</button></div><div className="mini-grid two"><InfoBubble label="Customer since" value={customer.relationshipSince} /><InfoBubble label="Segment" value={customer.segment} /></div><ContactCard contact={customer.contact} pinEvidence={pinEvidence} /><div className="relationship-grid">{customer.relationship.map((item) => <InfoBubble key={item.label} label={item.label} value={item.value} />)}</div><div className="timeline-card"><p className="eyebrow">Profile change history</p><h4>Neutral customer record activity</h4><div className="profile-change-list">{customer.profileChanges.map((change) => <article key={change.id} className="profile-change-card"><span>{change.date}</span><div><strong>{change.item}</strong><p>{change.detail}</p><small>{change.source}</small></div><button onClick={() => addFinding(`Customer 360: ${change.item} reviewed.`)}>📝</button></article>)}</div></div></>;
}

function IdentityIntelligence({ activeCase, pinEvidence, addFinding, markReviewed, completed }) {
  return <SearchableRecords title="Identity Intelligence" subtitle="Search training identifiers, contact points, and identity objects." records={activeCase.identityRecords} fields={["type", "value", "lastSeen", "history"]} renderRecord={(record) => <article key={record.id} className="record-card"><div><span className="case-pill soft">{record.type}</span><h4>{record.value}</h4><p>Last seen: {record.lastSeen}</p><small>{record.history}</small></div><RecordActions id={record.id} value={record.value} pinEvidence={pinEvidence} addFinding={addFinding} context="Identity Intelligence" /></article>} footer={<ReviewAction completed={completed} onClick={() => markReviewed()} />} />;
}

function LoginHistory({ activeCase, pinEvidence, addFinding, markReviewed, completed }) {
  return <SearchableRecords title="Login History" subtitle="Search access records by device, IP, location, method, or session." records={activeCase.loginHistory} fields={["time", "method", "device", "location", "ip", "session", "result"]} renderRecord={(record) => <article key={record.id} className="record-card"><div><span className="case-pill soft">{record.result}</span><h4>{record.time} · {record.method}</h4><p>{record.device} · {record.location}</p><small>IP {record.ip} · Session {record.session}</small></div><RecordActions id={record.id} value={record.ip} pinEvidence={pinEvidence} addFinding={addFinding} context="Login History" /></article>} footer={<ReviewAction completed={completed} onClick={() => markReviewed()} />} />;
}

function SearchableRecords({ title, subtitle, records, fields, renderRecord, footer }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? records.filter((record) => fields.some((field) => String(record[field] ?? '').toLowerCase().includes(normalized))) : records;
  return <div className="panel-stack"><div className="search-panel"><p className="eyebrow">Searchable records</p><h4>{title}</h4><p>{subtitle}</p><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records, history, IP, device, phone, email..." /><div className="summary-strip"><span>Record</span><strong>{filtered.length} of {records.length} shown</strong><span>History available</span></div></div><div className="record-list">{filtered.map(renderRecord)}</div><WorkflowStrip />{footer}</div>;
}

function RecordActions({ id, value, pinEvidence, addFinding, context }) { return <div className="record-actions"><button onClick={() => pinEvidence(id)}>📌 Record</button><button onClick={() => pinEvidence(value)}>🔗 Object</button><button onClick={() => addFinding(`${context}: ${id} reviewed.`)}>📝 Note</button></div>; }
function ContactCard({ contact, pinEvidence }) { return <div className="contact-card"><p className="eyebrow">Contact record</p><div className="contact-grid"><InfoBubble label="Phone" value={contact.phone} /><InfoBubble label="Email" value={contact.email} /><InfoBubble label="Address" value={contact.address} /><InfoBubble label="Preferred" value={contact.preferredChannel} /></div><div className="contact-actions"><button onClick={() => pinEvidence(contact.phone)}>Pin phone</button><button onClick={() => pinEvidence(contact.email)}>Pin email</button><button onClick={() => pinEvidence(contact.address)}>Pin address</button></div></div>; }
function IntakeCard({ intake }) { return <div className="intake-card"><p className="eyebrow">Customer intake</p><div className="intake-grid"><InfoBubble label="Channel" value={intake.channel} /><InfoBubble label="Contact time" value={intake.contactTime} /><InfoBubble label="Location" value={intake.customerLocation} /><InfoBubble label="Stated device" value={intake.statedDevice} /></div></div>; }
function EventLog({ activeCase, activeTool, pinEvidence, addFinding, markReviewed, completed }) { return <div className="panel-stack"><div className="filter-row"><button>All</button><button>Date</button><button>Device</button><button>IP</button><button>Location</button></div><div className="summary-strip"><span>Summary assists</span><strong>{activeCase.events.length} events shown</strong><span>Event log verifies</span></div><div className="event-list">{activeCase.events.map((event) => <article key={event.id} className="event-card"><div><span className="case-pill soft">{event.chip}</span><h4>{event.label}</h4><p>{event.time} · {event.detail}</p></div><div className="event-actions"><button onClick={() => pinEvidence(event.id)} aria-label={`Pin ${event.id}`}>📌</button><button onClick={() => addFinding(`${activeTool}: ${event.label} reviewed.`)} aria-label="Add note">📝</button><button onClick={() => pinEvidence(event.object)} aria-label="Pin connected object">🔗</button></div></article>)}</div><WorkflowStrip /><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>; }
function PlaceholderTool({ activeTool, completed, markReviewed }) { return <div className="panel-stack"><div className="bubble-card"><p className="eyebrow">{activeTool}</p><h4>Wave 2 foundation panel</h4><p>This tool is wired into the Case Workspace. Upcoming waves will add searchable records, detailed history, link analysis, generated reports, timelines, and final case documentation.</p></div><WorkflowStrip /><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>; }
function InvestigationPanel({ activeCase, activeTool, markReviewed, completed }) { return <div className="panel-stack"><div className="bubble-card large-pop"><p className="eyebrow">Investigation flow</p><h4>{activeTool}</h4><p>This area will track completed review steps, organize the learner’s evidence, and prepare the final decision package for {activeCase.id}.</p></div><div className="completion-grid"><InfoBubble label="Pinned items" value="Tray" /><InfoBubble label="Notes" value="Notebook" /><InfoBubble label="Decision" value="Locked" /></div><ReviewAction completed={completed} onClick={() => markReviewed()} /></div>; }
function ReviewAction({ completed, onClick }) { return <button className={`review-action ${completed ? 'done' : ''}`} onClick={onClick}>{completed ? '✓ Reviewed in this workspace' : 'Mark this tool reviewed'}</button>; }
function WorkflowStrip() { return <div className="workflow-strip" aria-label="Searchable object workflow">{workflowSteps.map((step) => <span key={step}>{step}</span>)}</div>; }
function InfoBubble({ label, value }) { return <div className="info-bubble"><small>{label}</small><strong>{value}</strong></div>; }
function EvidenceItem({ status, name, detail, id, pinEvidence }) { return <article className="event-card evidence-card"><div><span className={`status ${status.toLowerCase()}`}>{status}</span><h4>{name}</h4><p>{detail}</p></div><button onClick={() => pinEvidence(id)}>Pin</button></article>; }
function Tray({ tray, compact }) { return <div className={`side-widget ${compact ? 'compact' : ''}`}><p className="eyebrow">Pinned evidence</p><h3>Investigation Tray</h3><div className="pin-list">{tray.map((item) => <span key={item}>📌 {item}</span>)}</div></div>; }
function Notebook({ notes, compact }) { return <div className={`side-widget ${compact ? 'compact' : ''}`}><p className="eyebrow">Approved findings</p><h3>Notebook</h3><ul className="note-list">{notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul></div>; }

export default App;
