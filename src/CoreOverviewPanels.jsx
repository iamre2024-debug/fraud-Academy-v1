import { financialRecordsByCase } from './data/financialRecords.js';
import { evidenceRecordsByCase } from './data/evidenceRecords.js';

export function CaseBriefingPanel({ activeCase, openTool, pin }) {
  const financial = financialRecordsByCase[activeCase.id] ?? { transactions: [] };
  const claimedIds = new Set(activeCase.claimedTransactionIds ?? []);
  const claimed = claimedIds.size
    ? financial.transactions.filter((item) => claimedIds.has(item.id))
    : financial.transactions.filter((item) => /disputed|system review|case allegation/i.test(item.context ?? '')).slice(0, 3);
  const documents = evidenceRecordsByCase[activeCase.id]?.documents ?? activeCase.documents ?? [];

  return <section className="ornate-card core-overview-panel" aria-label="Case Briefing">
    <div className="card-title-row"><div><p className="eyebrow">Case intake</p><h2>📋 Case Briefing</h2><p>Information received with the case.</p></div><button type="button" onClick={() => pin(activeCase.id)}>📌 Pin Case</button></div>
    <div className="core-summary-grid">
      <Field label="Case ID" value={activeCase.id} /><Field label="Claim ID" value={activeCase.claimId ?? activeCase.id} /><Field label="Claim type" value={activeCase.type} /><Field label="Priority" value={activeCase.priority} /><Field label="Status" value={activeCase.status} /><Field label="Opened" value={activeCase.opened} />
    </div>
    <div className="core-story-grid"><article><small>Customer allegation / system alert</small><p>{activeCase.allegation}</p></article><article><small>Case reason</small><p>{activeCase.queueReason}</p></article></div>
    <Header title="Claimed Transactions" action="Open Transaction History" onClick={() => openTool('Transaction History')} />
    <div className="core-record-list">{claimed.map((item) => <article key={item.id}><div><strong>{item.merchant}</strong><small>{item.id} · {item.posted} · {item.time}</small></div><div><b>{item.amount}</b><small>{item.channel} · {item.instrument}</small></div><span>{item.status}</span><button type="button" onClick={() => pin(item.id)}>📌</button></article>)}{!claimed.length && <p>No claim-linked transaction recorded.</p>}</div>
    <Header title="Case Intake Documents" action="Open Evidence Center" onClick={() => openTool('Evidence Center')} />
    <div className="core-record-list">{documents.map((item) => <article key={item.id}><div><strong>{item.title ?? item.name}</strong><small>{item.id} · {item.category ?? item.detail}</small></div><span>{item.status}</span><button type="button" onClick={() => pin(item.id)}>📌</button></article>)}</div>
    <div className="core-quick-nav">{['Customer 360','Identity Intelligence','Login History','Device Intelligence','IP Intelligence','Timeline','Case Report'].map((name) => <button type="button" key={name} onClick={() => openTool(name)}>{name}</button>)}</div>
  </section>;
}

export function Customer360Panel({ activeCase, openTool, pin }) {
  const customer = activeCase.customer ?? {};
  const contact = customer.contact ?? {};
  return <section className="ornate-card core-overview-panel" aria-label="Customer 360">
    <div className="card-title-row"><div><p className="eyebrow">Customer record</p><h2>👤 Customer 360</h2><p>{activeCase.person} · {activeCase.trainingId}</p></div><button type="button" onClick={() => pin(activeCase.trainingId)}>📌 Pin Training ID</button></div>
    <div className="core-summary-grid"><Field label="Customer since" value={customer.relationshipSince} /><Field label="Segment" value={customer.segment} /><Field label="Phone" value={contact.phone} /><Field label="Email" value={contact.email} /><Field label="Address" value={contact.address} /><Field label="Preferred channel" value={contact.preferredChannel} /></div>
    <Header title="Relationship and Behavior" />
    <div className="core-summary-grid">{(customer.relationship ?? []).map((item) => <Field key={item.label} label={item.label} value={item.value} />)}</div>
    <Header title="Customer Timeline" />
    <div className="customer-timeline-list">{(customer.profileChanges ?? []).map((item) => <article key={item.id}><span>{item.date}</span><div><strong>{item.item}</strong><p>{item.detail}</p><small>{item.source}</small></div><button type="button" onClick={() => pin(item.id)}>📌</button></article>)}</div>
    <div className="core-quick-nav">{['Case Report','Identity Intelligence','Login History','Device Intelligence','IP Intelligence','Transaction History'].map((name) => <button type="button" key={name} onClick={() => openTool(name)}>{name}</button>)}</div>
  </section>;
}

function Field({ label, value }) { return <article><small>{label}</small><strong>{value ?? 'Not recorded'}</strong></article>; }
function Header({ title, action, onClick }) { return <div className="core-section-heading"><h3>{title}</h3>{action && <button type="button" onClick={onClick}>{action} ›</button>}</div>; }
