import { useMemo, useState } from 'react';

const categories = [
  { key: 'identity', label: 'Identity', icon: '▣' },
  { key: 'digital', label: 'Digital Activity', icon: '⌁' },
  { key: 'financial', label: 'Financial', icon: '$' },
  { key: 'business', label: 'Business', icon: '⌂' },
  { key: 'evidence', label: 'Evidence', icon: '▰' },
  { key: 'connections', label: 'Connections', icon: '⌘' },
  { key: 'investigation', label: 'Investigation', icon: '⌕' },
];

const loginRows = [
  { eventId: 'EV-99231', date: '07/15/2025\n10:24 PM', result: 'Success', device: 'iPhone 14\niOS 17.5', ip: '73.12.45.98', location: 'Dallas, TX\nUS', auth: 'Password' },
  { eventId: 'EV-99230', date: '07/15/2025\n9:58 PM', result: 'Review', device: 'Windows 11\nDesktop', ip: '198.51.100.24', location: 'Ashburn, VA\nUS', auth: 'Password' },
  { eventId: 'EV-99229', date: '07/15/2025\n9:42 PM', result: 'Success', device: 'Android 14\nPixel 7 Pro', ip: '203.0.113.77', location: 'Seattle, WA\nUS', auth: 'Password' },
  { eventId: 'EV-99228', date: '07/15/2025\n8:47 PM', result: 'Review', device: 'iPad (9th gen)\niPadOS 16.7', ip: '192.0.2.55', location: 'Chicago, IL\nUS', auth: 'Password' },
];

const trayItems = [
  { label: 'Device ID', value: 'DEV-91A7', icon: '▯' },
  { label: 'IP Address', value: '73.12.45.98', icon: '◎' },
  { label: 'Transaction ID', value: 'TXN-778392', icon: '▭' },
];

const notebookItems = [
  { icon: '▯', text: 'New device login from Dallas, TX iPhone 14 appeared in the access history.' },
  { icon: '◎', text: 'New IP from different network block appears in the digital activity record.' },
  { icon: '⚿', text: 'Password change activity is documented near the reviewed login window.' },
];

export default function VisualWorkspace() {
  const [activeCategory, setActiveCategory] = useState('digital');
  const activeCategoryLabel = useMemo(() => categories.find((item) => item.key === activeCategory)?.label ?? 'Digital Activity', [activeCategory]);

  return (
    <main className="visual-os-shell">
      <section className="visual-os-frame">
        <VisualHero />
        <CaseInfoBar />
        <CaseSummaryCard />
        <InvestigationCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        <DigitalActivityPanel activeCategoryLabel={activeCategoryLabel} />
        <BottomInvestigationGrid />
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

function CaseInfoBar() {
  return (
    <section className="case-info-bar" aria-label="Case metadata">
      <div><span>▣</span><strong>Case</strong><em>#24198</em></div>
      <div><span>♟</span><strong>Claim Type:</strong><em>ATO</em></div>
      <div><span>◈</span><strong>Status:</strong><em>In Progress</em></div>
      <div className="case-info-bat">🦇</div>
    </section>
  );
}

function CaseSummaryCard() {
  return (
    <section className="ornate-card case-summary-visual">
      <div className="moon-medallion">☾</div>
      <div className="summary-copy">
        <p className="visual-section-title">♥ Case Summary</p>
        <p>System alert detected unusual account activity: new device login, new IP address, and password change within a short review window.</p>
        <p>Customer reported unauthorized access.</p>
      </div>
      <div className="butterfly-accent">🦋</div>
      <div className="summary-actions">
        <button>📌 Pin Case</button>
        <button>▣ Notebook</button>
        <button className="primary-action">🪄 Open First Tool ›</button>
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
            {item.key === 'digital' && <i>♥</i>}
          </button>
        ))}
      </div>
    </section>
  );
}

function DigitalActivityPanel({ activeCategoryLabel }) {
  return (
    <section className="ornate-card activity-panel">
      <div className="activity-heading">
        <h2>▣ {activeCategoryLabel}</h2>
        <button>Login History⌄</button>
        <span className="panel-cat">🐈‍⬛</span>
      </div>
      <div className="activity-table" role="table" aria-label="Neutral login history records">
        <div className="activity-row table-head" role="row">
          <span>Event ID</span><span>Date / Time</span><span>Result</span><span>Device</span><span>IP Address</span><span>Location</span><span>Auth Method</span>
        </div>
        {loginRows.map((row) => <ActivityRow key={row.eventId} row={row} />)}
      </div>
      <button className="view-full-button">✦ View Full Login History ›</button>
    </section>
  );
}

function ActivityRow({ row }) {
  return (
    <div className="activity-row" role="row">
      <span className="event-id">▣ {row.eventId}</span>
      <span>{formatLines(row.date)}</span>
      <span className={`result ${row.result.toLowerCase()}`}>{row.result === 'Success' ? '✓' : '⊗'} {row.result}</span>
      <span>{formatLines(row.device)}</span>
      <span>{row.ip}</span>
      <span>{formatLines(row.location)}</span>
      <span>▣ {row.auth}</span>
    </div>
  );
}

function formatLines(value) {
  return String(value).split('\n').map((line) => <small key={line}>{line}</small>);
}

function BottomInvestigationGrid() {
  return (
    <section className="bottom-investigation-grid">
      <div className="ornate-card tray-card">
        <div className="card-title-row"><div><h2>▰ Investigation Tray</h2><p>Pinned Evidence & Key Identifiers</p></div><span>🦋</span></div>
        <div className="tray-list">{trayItems.map((item) => <div key={item.label}><span>{item.icon}</span><strong>{item.label}</strong><em>{item.value}</em><button>📌</button></div>)}</div>
        <button className="add-evidence">✦ + Add Evidence</button>
      </div>
      <div className="ornate-card notebook-card">
        <div className="card-title-row"><div><h2>📖 Investigation Notebook</h2><p>Suggested Findings, Evidence Based</p></div><span>🐈‍⬛</span></div>
        <div className="notebook-list">{notebookItems.map((item) => <button key={item.text}><span>{item.icon}</span><p>{item.text}</p><em>›</em></button>)}</div>
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
