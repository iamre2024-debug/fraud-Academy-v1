import { useMemo, useState } from 'react';

const caseRecord = {
  id: 'FA-ATO-24018',
  type: 'Account Takeover',
  priority: 'High',
  status: 'Reviewing',
  person: 'Maya Sterling',
  trainingId: 'TRN-8842-19',
  amount: '$742.18',
  opened: 'Jul 8, 2026',
  story:
    'Customer contacted the bank stating they did not authorize a card purchase. The customer advised they were home at the time and did not recognize the device activity tied to the transaction.',
  knownFacts: ['Customer statement received', 'Transaction posted', 'Recent login activity available', 'No final outcome shown'],
};

const families = [
  {
    key: 'summary',
    title: 'Case Summary',
    icon: '📋',
    question: 'Why am I investigating this case?',
    tools: ['Case Summary'],
  },
  {
    key: 'identity',
    title: 'Identity',
    icon: '👤',
    question: 'Who am I investigating?',
    tools: ['Customer 360', 'Identity Intelligence'],
  },
  {
    key: 'digital',
    title: 'Digital Activity',
    icon: '💻',
    question: 'Can I verify or challenge the story?',
    tools: ['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence'],
  },
  {
    key: 'financial',
    title: 'Financial',
    icon: '💳',
    question: 'Does the money movement make sense?',
    tools: ['Transaction History', 'Financial Intelligence', 'Payment Verification'],
  },
  {
    key: 'business',
    title: 'Business',
    icon: '🏢',
    question: 'Is the business relationship real?',
    tools: ['Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History'],
  },
  {
    key: 'evidence',
    title: 'Evidence',
    icon: '📂',
    question: 'What evidence do I have?',
    tools: ['Evidence Center', 'Document Viewer'],
  },
  {
    key: 'connections',
    title: 'Connections',
    icon: '🔗',
    question: 'How does everything connect?',
    tools: ['Link Analysis'],
  },
  {
    key: 'investigation',
    title: 'Investigation',
    icon: '🕵️',
    question: 'What have I completed?',
    tools: ['Timeline', 'Case Report', 'Submit Decision'],
  },
];

const eventRows = [
  { id: 'EVT-1008', time: '10:42 AM', label: 'Successful login', detail: 'Face ID / Dallas, TX / iPhone 16', chip: 'Login' },
  { id: 'EVT-1011', time: '10:47 AM', label: 'Profile viewed', detail: 'Same session / Balance + card details viewed', chip: 'Session' },
  { id: 'EVT-1014', time: '10:52 AM', label: 'Card purchase posted', detail: '$742.18 / CNP merchant / Pending then posted', chip: 'Transaction' },
];

const workflowSteps = ['Record', 'Expand', 'Search', 'History', 'Link Analysis', 'Generate Report', 'Timeline', 'Case Report'];

function App() {
  const [activeFamily, setActiveFamily] = useState('summary');
  const [activeTool, setActiveTool] = useState('Case Summary');
  const [tray, setTray] = useState(['TRN-8842-19', 'EVT-1008']);
  const [notes, setNotes] = useState([
    'Customer states they did not authorize the purchase.',
    'Need to compare login/device activity before decision.',
  ]);

  const family = useMemo(() => families.find((item) => item.key === activeFamily), [activeFamily]);

  function openFamily(item) {
    setActiveFamily(item.key);
    setActiveTool(item.tools[0]);
  }

  function pinEvidence(item) {
    setTray((current) => (current.includes(item) ? current : [...current, item]));
  }

  function addFinding(text) {
    setNotes((current) => [text, ...current]);
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="phone-frame">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Fraud Academy OS</p>
            <h1>Case Workspace</h1>
          </div>
          <button className="round-button" aria-label="Open Luna">🌙</button>
        </header>

        <section className="hero-bubble">
          <div className="hero-copy">
            <span className="case-pill">{caseRecord.type}</span>
            <h2>{caseRecord.person}</h2>
            <p>{caseRecord.id} · {caseRecord.priority} Priority</p>
          </div>
          <div className="cat-orb" aria-hidden="true">🐈‍⬛</div>
        </section>

        <nav className="family-grid" aria-label="Investigation categories">
          {families.map((item) => (
            <button
              key={item.key}
              className={`family-bubble ${activeFamily === item.key ? 'active' : ''}`}
              onClick={() => openFamily(item)}
            >
              <span>{item.icon}</span>
              <strong>{item.title}</strong>
              <small>{item.question}</small>
            </button>
          ))}
        </nav>

        <section className="workspace-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active panel</p>
              <h3>{activeTool}</h3>
            </div>
            <span className="sparkle">✦</span>
          </div>

          <div className="tool-tabs">
            {family.tools.map((tool) => (
              <button
                key={tool}
                className={tool === activeTool ? 'selected' : ''}
                onClick={() => setActiveTool(tool)}
              >
                {tool}
              </button>
            ))}
          </div>

          <EvidenceFirstBanner />
          <Panel activeTool={activeTool} pinEvidence={pinEvidence} addFinding={addFinding} />
        </section>

        <aside className="desktop-side-panel">
          <Tray tray={tray} />
          <Notebook notes={notes} />
        </aside>

        <section className="mobile-drawers">
          <details>
            <summary>🧰 Investigation Tray</summary>
            <Tray tray={tray} compact />
          </details>
          <details>
            <summary>📝 Notebook</summary>
            <Notebook notes={notes} compact />
          </details>
        </section>

        <nav className="bottom-nav" aria-label="Main navigation">
          <button className="active">🏠<span>Home</span></button>
          <button>📂<span>Cases</span></button>
          <button>🕵️<span>Work</span></button>
          <button>🎓<span>Learn</span></button>
        </nav>
      </section>
    </main>
  );
}

function EvidenceFirstBanner() {
  return (
    <div className="evidence-first-banner">
      <strong>Evidence First</strong>
      <span>No final outcome, score, red/green labels, or Luna answer until submission.</span>
    </div>
  );
}

function Panel({ activeTool, pinEvidence, addFinding }) {
  if (activeTool === 'Case Summary') {
    return (
      <div className="panel-stack">
        <div className="story-card bubble-card large-pop">
          <p className="eyebrow">Why am I here?</p>
          <h4>Customer story / system reason</h4>
          <p>{caseRecord.story}</p>
        </div>
        <div className="mini-grid">
          <InfoBubble label="Claim amount" value={caseRecord.amount} />
          <InfoBubble label="Status" value={caseRecord.status} />
          <InfoBubble label="Opened" value={caseRecord.opened} />
        </div>
        <ul className="fact-list">
          {caseRecord.knownFacts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
      </div>
    );
  }

  if (activeTool === 'Customer 360') {
    return (
      <div className="panel-stack">
        <div className="bubble-card profile-pop">
          <p className="eyebrow">Who am I investigating?</p>
          <h4>{caseRecord.person}</h4>
          <p>Training ID: {caseRecord.trainingId}</p>
          <button onClick={() => pinEvidence(caseRecord.trainingId)}>📌 Pin Training ID</button>
        </div>
        <div className="mini-grid two">
          <InfoBubble label="Customer since" value="2018" />
          <InfoBubble label="Accounts" value="Checking · Card" />
        </div>
        <div className="bubble-card">
          <p className="eyebrow">Profile change history</p>
          <h4>Recent customer record activity</h4>
          <p>Email, phone, address, device trust, and delivery preferences will live here as neutral event rows.</p>
        </div>
      </div>
    );
  }

  if (['Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History'].includes(activeTool)) {
    return <EventLog activeTool={activeTool} pinEvidence={pinEvidence} addFinding={addFinding} />;
  }

  if (activeTool === 'Evidence Center') {
    return (
      <div className="panel-stack">
        <EvidenceItem status="Received" name="Customer statement" detail="Submitted at case creation" />
        <EvidenceItem status="Requested" name="Affidavit" detail="Waiting for customer response" />
        <EvidenceItem status="Missing" name="Police report" detail="Not required yet, but can be requested" />
      </div>
    );
  }

  if (activeTool === 'Document Viewer') {
    return (
      <div className="panel-stack">
        <div className="document-shell">
          <p className="eyebrow">Document Viewer</p>
          <h4>Training document preview</h4>
          <p>Case documents will be selected from Evidence Center and reviewed here without exposing the final case outcome.</p>
        </div>
      </div>
    );
  }

  if (activeTool === 'Link Analysis') {
    return (
      <div className="panel-stack">
        <div className="connection-summary">
          <InfoBubble label="Connected objects" value="7" />
          <InfoBubble label="Shared identifiers" value="2" />
          <InfoBubble label="First seen" value="Jul 8" />
        </div>
        <div className="link-web">
          <span>Customer</span><span>Device</span><span>IP</span><span>Transaction</span>
        </div>
        <WorkflowStrip />
      </div>
    );
  }

  if (['Timeline', 'Case Report', 'Submit Decision'].includes(activeTool)) {
    return <InvestigationPanel activeTool={activeTool} addFinding={addFinding} />;
  }

  return <PlaceholderTool activeTool={activeTool} />;
}

function EventLog({ activeTool, pinEvidence, addFinding }) {
  return (
    <div className="panel-stack">
      <div className="filter-row">
        <button>All</button><button>Date</button><button>Device</button><button>IP</button><button>Location</button>
      </div>
      <div className="summary-strip">
        <span>Summary assists</span>
        <strong>3 events shown</strong>
        <span>Event log verifies</span>
      </div>
      <div className="event-list">
        {eventRows.map((event) => (
          <article key={event.id} className="event-card">
            <div>
              <span className="case-pill soft">{event.chip}</span>
              <h4>{event.label}</h4>
              <p>{event.time} · {event.detail}</p>
            </div>
            <div className="event-actions">
              <button onClick={() => pinEvidence(event.id)} aria-label={`Pin ${event.id}`}>📌</button>
              <button onClick={() => addFinding(`${activeTool}: ${event.label} reviewed.`)} aria-label="Add note">📝</button>
              <button aria-label="Open link analysis">🔗</button>
            </div>
          </article>
        ))}
      </div>
      <WorkflowStrip />
    </div>
  );
}

function PlaceholderTool({ activeTool }) {
  return (
    <div className="panel-stack">
      <div className="bubble-card">
        <p className="eyebrow">{activeTool}</p>
        <h4>Wave 1 foundation panel</h4>
        <p>This tool is wired into the Case Workspace. Wave 2 and later will add searchable records, history, link analysis, reports, timelines, and final case documentation.</p>
      </div>
      <WorkflowStrip />
    </div>
  );
}

function InvestigationPanel({ activeTool, addFinding }) {
  return (
    <div className="panel-stack">
      <div className="bubble-card large-pop">
        <p className="eyebrow">Investigation flow</p>
        <h4>{activeTool}</h4>
        <p>This area will track completed review steps, organize the learner’s evidence, and prepare the final decision package.</p>
        <button onClick={() => addFinding(`${activeTool}: workspace reviewed.`)}>📝 Add workspace note</button>
      </div>
      <div className="completion-grid">
        <InfoBubble label="Pinned items" value="Tray" />
        <InfoBubble label="Notes" value="Notebook" />
        <InfoBubble label="Decision" value="Locked" />
      </div>
    </div>
  );
}

function WorkflowStrip() {
  return (
    <div className="workflow-strip" aria-label="Searchable object workflow">
      {workflowSteps.map((step) => <span key={step}>{step}</span>)}
    </div>
  );
}

function InfoBubble({ label, value }) {
  return (
    <div className="info-bubble">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function EvidenceItem({ status, name, detail }) {
  return (
    <article className="event-card evidence-card">
      <div>
        <span className={`status ${status.toLowerCase()}`}>{status}</span>
        <h4>{name}</h4>
        <p>{detail}</p>
      </div>
      <button>View</button>
    </article>
  );
}

function Tray({ tray, compact }) {
  return (
    <div className={`side-widget ${compact ? 'compact' : ''}`}>
      <p className="eyebrow">Pinned evidence</p>
      <h3>Investigation Tray</h3>
      <div className="pin-list">
        {tray.map((item) => <span key={item}>📌 {item}</span>)}
      </div>
    </div>
  );
}

function Notebook({ notes, compact }) {
  return (
    <div className={`side-widget ${compact ? 'compact' : ''}`}>
      <p className="eyebrow">Approved findings</p>
      <h3>Notebook</h3>
      <ul className="note-list">
        {notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}
      </ul>
    </div>
  );
}

export default App;
