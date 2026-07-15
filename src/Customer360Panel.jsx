import { useEffect, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { getCustomer360Dossier } from './data/customer360Dossier.js';
import { getCaseDocuments } from './data/documentRecords.js';
import { workflows } from './visualWorkspaceModel.js';

const unavailable = 'Not available in the current training packet';

const dossierTabs = [
  { id: 'overview', label: 'Overview', sections: ['identity', 'case'] },
  { id: 'accounts', label: 'Accounts', sections: ['products', 'relationship'] },
  { id: 'devices', label: 'Devices & Access', sections: ['security'] },
  { id: 'contact', label: 'Contact History', sections: ['contact', 'contact-log'] },
  { id: 'history', label: 'Profile History', sections: ['prior-claims'] },
  { id: 'notes', label: 'Notes', sections: [] },
];

function relationshipValue(activeCase, label, fallback = unavailable) {
  const match = activeCase.customer?.relationship?.find((item) => item.label === label);
  return match?.value ?? fallback;
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function relationshipLength(since) {
  const start = Number.parseInt(String(since), 10);
  if (!Number.isFinite(start)) return unavailable;
  const years = Math.max(0, 2026 - start);
  return years === 0 ? 'Less than one year' : `${years} year${years === 1 ? '' : 's'}`;
}

function maskedTrainingId(value) {
  const text = String(value ?? '');
  return text ? `••••-${text.slice(-4)}` : unavailable;
}

function buildDossierSections(activeCase, dossier, currentCompleted = []) {
  const contact = activeCase.customer?.contact ?? {};
  const loginHistory = activeCase.loginHistory ?? [];
  const documents = activeCase.documents ?? [];
  const receivedDocuments = documents.filter((item) => ['Received', 'Available'].includes(item.status));
  const knownDevices = uniqueValues(loginHistory.map((item) => item.device));
  const knownLocations = uniqueValues(loginHistory.map((item) => item.location));
  const customerSince = activeCase.customer?.relationshipSince ?? unavailable;

  return [
    {
      id: 'identity',
      icon: 'ID',
      title: 'Customer Identity Snapshot',
      subtitle: 'Who the customer is in this fictional relationship',
      fields: [
        ['Name', activeCase.person ?? unavailable],
        ['Customer ID', activeCase.trainingId ?? unavailable],
        ['Masked member ID', dossier.identity.maskedMemberId ?? maskedTrainingId(activeCase.trainingId)],
        ['DOB / age', `${dossier.identity.dob} · age ${dossier.identity.age}`],
        ['Customer since', customerSince],
        ['Relationship length', relationshipLength(customerSince)],
        ['Primary state', String(activeCase.intake?.customerLocation ?? contact.address ?? unavailable).split(' training')[0]],
        ['Language', dossier.identity.language],
        ['Customer segment', activeCase.customer?.segment ?? unavailable],
        ['Verification status', dossier.identity.verificationStatus],
        ['Account standing', dossier.identity.accountStanding],
      ],
    },
    {
      id: 'contact',
      icon: '☎',
      title: 'Contact Information',
      subtitle: 'Contact points and recent verification context',
      fields: [
        ['Mobile phone', contact.phone ?? unavailable],
        ['Home phone', dossier.contact.homePhone],
        ['Email', contact.email ?? unavailable],
        ['Mailing address', dossier.contact.mailingAddress],
        ['Physical address', dossier.contact.physicalAddress],
        ['Preferred contact', contact.preferredChannel ?? activeCase.intake?.channel ?? unavailable],
        ['Last verified date', dossier.identity.lastVerified],
        ['Contact verification', dossier.contact.verificationStatus],
        ['Recent contact changes', `${(activeCase.customer?.profileChanges ?? []).length} profile events available`],
        ['MFA / alert contact use', dossier.contact.alertUse],
      ],
    },
    {
      id: 'products',
      icon: '▤',
      title: 'Products & Accounts',
      subtitle: 'Products, balances, limits, and standing supplied by the case',
      fields: [
        ['Product records', `${dossier.products.length} available below`],
        ['Open products', dossier.products.map((item) => item.product).join(' · ')],
        ['Masked accounts', dossier.products.map((item) => item.maskedNumber).join(' · ')],
        ['Product statuses', dossier.products.map((item) => `${item.product}: ${item.status}`).join(' · ')],
        ['Digital banking profile', relationshipValue(activeCase, 'Payment profile')],
        ['Oldest product opened', dossier.products[0]?.opened ?? customerSince],
        ['Balances / exposure', dossier.products.map((item) => `${item.maskedNumber}: ${item.balance}`).join(' · ')],
        ['Limits', dossier.products.map((item) => `${item.maskedNumber}: ${item.limit}`).join(' · ')],
        ['NSF / overdraft / payment standing', dossier.products.map((item) => item.standing).join(' · ')],
      ],
    },
    {
      id: 'relationship',
      icon: '∞',
      title: 'Relationship Overview',
      subtitle: 'Normal customer patterns available for comparison',
      fields: [
        ['Number of listed products', relationshipValue(activeCase, 'Open products').split('·').length],
        ['Normal deposit behavior', dossier.relationship.normalDeposits],
        ['Normal spending behavior', dossier.relationship.normalSpending],
        ['Normal login location', relationshipValue(activeCase, 'Normal login area')],
        ['Trusted / observed devices', knownDevices.join(' · ') || unavailable],
        ['Household / authorized users', dossier.relationship.authorizedUsers],
        ['Business relationships', dossier.relationship.businessRelationships],
        ['Payment profile', relationshipValue(activeCase, 'Payment profile')],
      ],
    },
    {
      id: 'security',
      icon: '◇',
      title: 'Security & Access Summary',
      subtitle: 'Neutral security facts, not a fraud conclusion',
      fields: [
        ['MFA status', dossier.security.mfaStatus],
        ['Password last changed', dossier.security.passwordChanged],
        ['Successful login records', `${loginHistory.filter((item) => item.result === 'Successful').length} in the packet`],
        ['Failed login records', `${loginHistory.filter((item) => item.result !== 'Successful').length} in the packet`],
        ['Trusted devices', dossier.security.trustedDevices],
        ['New devices', knownDevices.length > 1 ? `${knownDevices.length - 1} additional observed device${knownDevices.length === 2 ? '' : 's'}` : 'No additional device listed'],
        ['Observed locations', knownLocations.join(' · ') || unavailable],
        ['Lockouts', dossier.security.lockouts],
        ['Security alerts', dossier.security.alerts],
        ['Wallet enrollment', dossier.security.walletEnrollment],
        ['Recovery phone / email', dossier.security.recoveryContact],
      ],
    },
    {
      id: 'case',
      icon: 'CASE',
      title: 'Current Case Snapshot',
      subtitle: 'Why this case is open today',
      fields: [
        ['Case ID', activeCase.id ?? unavailable],
        ['Claim ID', activeCase.claimId ?? unavailable],
        ['Claim type', activeCase.type ?? unavailable],
        ['Lane / subtype', `${activeCase.lane ?? unavailable} · ${activeCase.subtype ?? unavailable}`],
        ['Priority', activeCase.priority ?? unavailable],
        ['Status', activeCase.status ?? unavailable],
        ['Reported / issue start', `${activeCase.reportedDate ?? activeCase.opened ?? unavailable} · ${activeCase.issueStartDate ?? unavailable}`],
        ['Amount / exposure', activeCase.amount ?? unavailable],
        ['Intake channel', activeCase.intake?.channel ?? unavailable],
        ['Assigned investigator', activeCase.assignedInvestigator ?? 'Training queue · unassigned'],
        ['Required tools', (activeCase.requiredTools ?? []).join(' · ') || unavailable],
        ['Reviewed tools', currentCompleted.join(' · ') || 'No tools reviewed in this case yet'],
        ['Intake summary', activeCase.caseBriefing?.summary ?? activeCase.allegation ?? unavailable],
        ['Suggested next workspace', dossier.suggestedTool],
      ],
    },
    {
      id: 'contact-log',
      icon: 'LOG',
      title: 'Recent Customer Contact',
      subtitle: 'Intake, secure messages, callbacks, and document contact',
      fields: [
        ['Contact records', `${dossier.recentContacts.length} available below`],
        ['Latest contact', dossier.recentContacts[0]?.dateTime ?? unavailable],
        ['Latest outcome', dossier.recentContacts[0]?.outcome ?? unavailable],
        ['Customer statement', activeCase.statement?.value ?? activeCase.allegation ?? unavailable],
        ['Intake agent notes', activeCase.intakeAnswers?.map((item) => item.answer).join(' · ') || 'Review the Case Briefing intake packet'],
        ['Documents received', receivedDocuments.map((item) => item.name).join(' · ') || 'No received document listed'],
        ['Documents pending', documents.filter((item) => !['Received', 'Available'].includes(item.status)).map((item) => item.name).join(' · ') || 'No pending document listed'],
      ],
    },
    {
      id: 'prior-claims',
      icon: 'HIST',
      title: 'Prior Claims / Disputes',
      subtitle: 'Historical context provided by the current case packet',
      fields: [
        ['Prior claim records', `${dossier.priorClaims.length} historical record${dossier.priorClaims.length === 1 ? '' : 's'}`],
        ['Prior outcomes', dossier.priorClaims.map((item) => `${item.type}: ${item.outcome}`).join(' · ') || 'No prior claim supplied'],
        ['Prior investigations', dossier.priorClaims.map((item) => item.id).join(' · ') || 'No prior investigation supplied'],
        ['Supporting documents', `${documents.length} current document records`],
        ['Similar-claim context', dossier.priorClaims.some((item) => item.similar === 'Yes') ? 'A similar historical record is available for review' : 'No similar historical claim is identified'],
      ],
    },
  ];
}

function matchesQuery(text, query) {
  return !query || String(text).toLowerCase().includes(query);
}

function DossierCard({ section, normalizedQuery }) {
  const fields = section.fields.filter(([label, value]) => matchesQuery(`${label} ${value}`, normalizedQuery));
  if (normalizedQuery && !fields.length && !matchesQuery(`${section.title} ${section.subtitle}`, normalizedQuery)) return null;

  return (
    <article className={`customer-360-card customer-360-${section.id}`} data-dossier-section={section.id}>
      <header className="customer-360-card-heading">
        <span aria-hidden="true">{section.icon}</span>
        <div>
          <p>{section.subtitle}</p>
          <h3>{section.title}</h3>
        </div>
      </header>
      <dl className="customer-360-field-grid">
        {(fields.length ? fields : section.fields).map(([label, value]) => (
          <div key={`${section.id}-${label}`}>
            <dt>{label}</dt>
            <dd><DirectCollapsibleText lines={2} mobileLines={3}>{String(value)}</DirectCollapsibleText></dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function profileEventMetadata(event) {
  return [
    ['Event type', event.eventType ?? 'Profile maintenance'],
    ['Old value', event.oldValue ?? 'Not supplied in the current packet'],
    ['New value', event.newValue ?? 'Not supplied in the current packet'],
    ['Channel', event.channel ?? 'Profile service'],
    ['Source', event.source ?? 'Not supplied'],
    ['User / actor', event.user ?? 'Not supplied'],
    ['Device / session', `${event.device ?? 'Device not listed'} · ${event.session ?? 'Session not listed'}`],
    ['IP / MFA method', `${event.ip ?? 'IP not listed'} · ${event.mfaMethod ?? 'Method not listed'}`],
    ['Event note', event.notes ?? 'No event-level note supplied'],
  ];
}

export default function Customer360Panel({
  activeCategory,
  activeCase,
  tool,
  openTool,
  query,
  setQuery,
  rows,
  activeRow,
  setExpandedId,
  pin,
  saveNote,
  markReviewed,
  currentCompleted,
  jumpDecision,
  notes = [],
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const normalizedQuery = query.trim().toLowerCase();
  const dossier = getCustomer360Dossier(activeCase);
  const documents = getCaseDocuments(activeCase);
  const sections = buildDossierSections(activeCase, dossier, currentCompleted);
  const claimContext = dossier.claimContext;
  const profileChanges = (activeCase.customer?.profileChanges ?? []).filter((item) => matchesQuery(Object.values(item).join(' '), normalizedQuery));
  const visibleSections = sections.filter((section) => !normalizedQuery || matchesQuery(`${section.title} ${section.subtitle} ${section.fields.flat().join(' ')}`, normalizedQuery));
  const visibleRows = rows.filter((row) => matchesQuery(`${row.id} ${row.label} ${row.detail}`, normalizedQuery));
  const selectedTab = dossierTabs.find((item) => item.id === activeTab) ?? dossierTabs[0];
  const tabSections = sections.filter((section) => (
    normalizedQuery || selectedTab.sections.includes(section.id)
  ) && (!normalizedQuery || matchesQuery(`${section.title} ${section.subtitle} ${section.fields.flat().join(' ')}`, normalizedQuery)));
  const availableToolNames = new Set(activeCase.availableTools ?? []);
  const relatedTools = [
    'Transaction History',
    'Merchant Intelligence',
    'Identity Intel / People Search',
    'Login History',
    'Device Intelligence',
    'Document Viewer',
    'Document Request',
    'Payment Verification',
  ].filter((item) => availableToolNames.has(item)).slice(0, 6);

  useEffect(() => {
    setActiveTab('overview');
  }, [activeCase.id]);

  function exportProfileChangeReport() {
    const lines = [
      'Fraud Academy - Profile Change Report',
      `Case: ${activeCase.id}`,
      `Customer: ${activeCase.person}`,
      'Fictional training data only',
      '',
      ...(activeCase.customer?.profileChanges ?? []).flatMap((event) => [
        `${event.date}${event.time ? ` · ${event.time}` : ''} | ${event.eventType ?? 'Profile maintenance'} | ${event.item}`,
        `Old value: ${event.oldValue ?? 'Not supplied'}`,
        `New value: ${event.newValue ?? 'Not supplied'}`,
        `Channel/source: ${event.channel ?? 'Not supplied'} | ${event.source ?? 'Not supplied'}`,
        `Actor/device/session: ${event.user ?? 'Not supplied'} | ${event.device ?? 'Not supplied'} | ${event.session ?? 'Not supplied'}`,
        `IP/MFA: ${event.ip ?? 'Not supplied'} | ${event.mfaMethod ?? 'Not supplied'}`,
        `Notes: ${event.notes ?? event.detail ?? 'No note supplied'}`,
        '',
      ]),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeCase.id}-profile-change-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="ornate-card activity-panel customer-360-theme-v1" data-customer-360-screen="approved-theme-v1">
      <header className="customer-360-header">
        <div>
          <p className="customer-360-eyebrow">Identity workspace · Evidence First</p>
          <h2>Customer 360</h2>
          <p>Review the full customer and account dossier before moving into claim-specific investigation tools.</p>
        </div>
        <div className="customer-360-header-actions">
          <span className="customer-360-status">{activeCase.status}</span>
          <button type="button" onClick={() => pin(`${activeCase.id} · ${activeCase.person}`)}>Pin customer</button>
        </div>
      </header>

      <section className="customer-360-identity-band" aria-label="Customer 360 identity summary">
        <div className="customer-360-avatar" aria-hidden="true">{String(activeCase.person ?? 'FA').split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
        <div className="customer-360-identity-copy">
          <span>{activeCase.customer?.segment ?? 'Customer profile'}</span>
          <h3>{activeCase.person}</h3>
          <p>{activeCase.trainingId} · Customer since {activeCase.customer?.relationshipSince ?? 'not listed'} · {activeCase.intake?.customerLocation ?? 'Location not listed'}</p>
        </div>
        <div className="customer-360-identity-metrics">
          {dossier.atAGlance.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
        </div>
      </section>

      <nav className="customer-360-actions" aria-label="Customer 360 related tools">
        {relatedTools.map((toolName) => (
          <button key={toolName} type="button" onClick={() => openTool(toolName)}>
            {toolName === 'Identity Intel / People Search' ? 'Identity Intel' : toolName}
          </button>
        ))}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <nav className="customer-360-tabs" aria-label="Customer 360 dossier tabs" role="tablist">
        {dossierTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="customer-360-tool-row">
        <label>
          <span>Current identity tool</span>
          <select className="tool-select" value={tool} onChange={(event) => openTool(event.target.value)} aria-label="Choose identity investigation tool">
            {activeCategory.tools.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="customer-360-flow-chips" aria-label="Evidence workflow">
          {workflows.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>

      <div className="customer-360-search-row">
        <label>
          <span>Search this dossier</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts, products, profile changes, devices..."
            aria-label="Search Customer 360 dossier"
          />
        </label>
        <span aria-live="polite">{visibleSections.length} matching dossier sections · {profileChanges.length} profile events</span>
      </div>

      {(activeTab === 'overview' || normalizedQuery) && <section className="customer-360-claim-context" aria-label="Claim-specific Customer 360 highlights">
        <header className="customer-360-card-heading">
          <span aria-hidden="true">FOCUS</span>
          <div>
            <p>{claimContext.subtitle}</p>
            <h3>{claimContext.title}</h3>
          </div>
        </header>
        <dl className="customer-360-highlight-grid">
          {claimContext.fields.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </section>}

      {(activeTab === 'overview' || normalizedQuery) && <section className="customer-360-support-grid" aria-label="Customer 360 at a glance and next steps">
        <article className="customer-360-support-card">
          <p>At a Glance</p>
          <h3>Baseline before the claim</h3>
          <dl>{dossier.atAGlance.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </article>
        <article className="customer-360-support-card customer-360-coaching-card">
          <p>Luna Insights</p>
          <h3>Process coaching</h3>
          <DirectCollapsibleText lines={4} mobileLines={5}>{dossier.lunaInsight}</DirectCollapsibleText>
        </article>
        <article className="customer-360-support-card">
          <p>Recent Documents</p>
          <h3>Latest case files</h3>
          <div className="customer-360-mini-list">{documents.slice(0, 3).map((document) => <span key={document.id}><strong>{document.title}</strong><small>{document.status} · {document.received}</small></span>)}</div>
          <button type="button" onClick={() => openTool('Document Viewer')}>Open Document Viewer</button>
        </article>
        <article className="customer-360-support-card customer-360-next-step">
          <p>Suggested Next Step</p>
          <h3>{dossier.suggestedTool}</h3>
          <span>Continue into the required case workspace after reviewing the customer baseline.</span>
          <button type="button" onClick={() => openTool(dossier.suggestedTool)}>Begin Investigation</button>
        </article>
      </section>}

      <section className="customer-360-dossier-grid" aria-label="Customer 360 dossier sections">
        {tabSections.map((section) => <DossierCard key={section.id} section={section} normalizedQuery={normalizedQuery} />)}
        {normalizedQuery && visibleSections.length === 0 && (
          <div className="customer-360-empty" role="status">No dossier fields match this search. Clear or revise the search to continue.</div>
        )}
      </section>

      {(activeTab === 'accounts' || normalizedQuery) && <section className="customer-360-record-section" aria-labelledby="customer-360-product-records-heading">
        <header className="customer-360-section-heading"><div><p>Account-level records</p><h3 id="customer-360-product-records-heading">Accounts & Products</h3></div><span>{dossier.products.length} records</span></header>
        <div className="customer-360-structured-records">
          {dossier.products.map((product) => <article key={product.id}>
            <header><span>{product.id}</span><strong>{product.product} · {product.maskedNumber}</strong></header>
            <dl>
              <div><dt>Opened</dt><dd>{product.opened}</dd></div><div><dt>Status</dt><dd>{product.status}</dd></div><div><dt>Balance</dt><dd>{product.balance}</dd></div><div><dt>Limit</dt><dd>{product.limit}</dd></div><div><dt>Standing</dt><dd>{product.standing}</dd></div>
            </dl>
          </article>)}
        </div>
      </section>}

      {(activeTab === 'contact' || normalizedQuery) && <section className="customer-360-record-section" aria-labelledby="customer-360-contact-records-heading">
        <header className="customer-360-section-heading"><div><p>Calls, messages, notices, and callbacks</p><h3 id="customer-360-contact-records-heading">Recent Customer Contact Log</h3></div><span>{dossier.recentContacts.length} records</span></header>
        <div className="customer-360-structured-records">
          {dossier.recentContacts.map((contactRecord) => <article key={contactRecord.id}>
            <header><span>{contactRecord.dateTime}</span><strong>{contactRecord.type}</strong></header>
            <dl><div><dt>Channel</dt><dd>{contactRecord.channel}</dd></div><div><dt>Outcome</dt><dd>{contactRecord.outcome}</dd></div><div><dt>Agent / source</dt><dd>{contactRecord.agent}</dd></div><div><dt>Notes</dt><dd>{contactRecord.notes}</dd></div></dl>
          </article>)}
        </div>
      </section>}

      {(activeTab === 'history' || normalizedQuery) && <section className="customer-360-record-section" aria-labelledby="customer-360-prior-claims-heading">
        <header className="customer-360-section-heading"><div><p>Historical claims and disputes</p><h3 id="customer-360-prior-claims-heading">Prior Claims & Disputes Records</h3></div><span>{dossier.priorClaims.length} records</span></header>
        {dossier.priorClaims.length ? <div className="customer-360-structured-records">
          {dossier.priorClaims.map((claim) => <article key={claim.id}>
            <header><span>{claim.date} · {claim.id}</span><strong>{claim.type} · {claim.amount}</strong></header>
            <dl><div><dt>Item</dt><dd>{claim.item}</dd></div><div><dt>Outcome</dt><dd>{claim.outcome}</dd></div><div><dt>Similar claim</dt><dd>{claim.similar}</dd></div><div><dt>Documents</dt><dd>{claim.documents}</dd></div><div><dt>Notes</dt><dd>{claim.notes}</dd></div></dl>
          </article>)}
        </div> : <div className="customer-360-empty">No prior claim or dispute record is supplied for this fictional profile.</div>}
      </section>}

      {(activeTab === 'history' || normalizedQuery) && <section className="customer-360-profile-log" aria-labelledby="customer-360-profile-log-heading">
        <header className="customer-360-section-heading">
          <div>
            <p>Permanent dossier history</p>
            <h3 id="customer-360-profile-log-heading">Profile Change Event Log</h3>
          </div>
          <div className="customer-360-section-actions"><span>{profileChanges.length} shown</span><button type="button" onClick={exportProfileChangeReport}>Export Profile Change Report</button></div>
        </header>
        <div className="customer-360-event-list">
          {profileChanges.map((event) => (
            <article key={event.id} className="customer-360-event-card" data-profile-event={event.id}>
              <div className="customer-360-event-time"><strong>{event.date}</strong><span>{event.time ?? 'Time not supplied'}</span><span>{event.source}</span></div>
              <div className="customer-360-event-copy">
                <h4>{event.item}</h4>
                <DirectCollapsibleText lines={2} mobileLines={3}>{event.detail}</DirectCollapsibleText>
                <dl>{profileEventMetadata(event).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
              </div>
              <div className="customer-360-event-actions">
                <button type="button" onClick={() => pin(`${event.id} · ${event.item}`)}>Pin</button>
                <button type="button" onClick={() => saveNote(`Customer 360 profile event ${event.id}: ${event.item}. ${event.detail}`, 'Customer profile event')}>Save note</button>
              </div>
            </article>
          ))}
          {!profileChanges.length && <div className="customer-360-empty" role="status">No profile events match this search.</div>}
        </div>
      </section>}

      {(activeTab === 'devices' || normalizedQuery) && <section className="customer-360-related-records" aria-labelledby="customer-360-related-records-heading">
        <header className="customer-360-section-heading">
          <div>
            <p>Searchable case objects</p>
            <h3 id="customer-360-related-records-heading">Related Customer Records</h3>
          </div>
          <span>{visibleRows.length} shown</span>
        </header>
        <div className="customer-360-record-grid">
          {visibleRows.map((row) => (
            <article key={row.id} className={activeRow?.id === row.id ? 'selected' : ''} data-customer-record={row.id}>
              <span>{row.id}</span>
              <h4>{row.label}</h4>
              <DirectCollapsibleText lines={2} mobileLines={3}>{row.detail}</DirectCollapsibleText>
              <div>
                <button type="button" onClick={() => setExpandedId(row.id)}>Open record</button>
                <button type="button" onClick={() => pin(row.pin)}>Pin</button>
              </div>
            </article>
          ))}
          {!visibleRows.length && <div className="customer-360-empty" role="status">No related customer records match this search.</div>}
        </div>
      </section>}

      {activeTab === 'notes' && !normalizedQuery && <section className="customer-360-related-records customer-360-notes" aria-labelledby="customer-360-notes-heading">
        <header className="customer-360-section-heading">
          <div>
            <p>Case-scoped documentation</p>
            <h3 id="customer-360-notes-heading">Customer 360 Notes</h3>
          </div>
          <span>{notes.length} saved</span>
        </header>
        <div className="customer-360-note-list">
          {notes.length ? notes.map((note, index) => <article key={`${note}-${index}`}>{note}</article>) : <div className="customer-360-empty" role="status">No notes have been saved for this case yet.</div>}
        </div>
        <button type="button" className="customer-360-primary" onClick={() => saveNote(`Customer 360 dossier reviewed for ${activeCase.person}.`, 'Customer 360 dossier')}>Save dossier note</button>
      </section>}

      <footer className="customer-360-review-bar">
        <div>
          <strong>Customer 360 review</strong>
          <span>Marking this dossier reviewed records process completion only. It does not determine the case outcome.</span>
        </div>
        <div>
          <button type="button" className="customer-360-primary" onClick={() => markReviewed('Customer 360')}>
            {currentCompleted.includes('Customer 360') ? '✓ Customer 360 reviewed' : 'Mark Customer 360 reviewed'}
          </button>
        </div>
      </footer>
    </section>
  );
}
