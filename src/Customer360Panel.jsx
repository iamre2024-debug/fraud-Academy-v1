import { useEffect, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
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

function claimSpecificContext(activeCase) {
  const type = String(activeCase.type ?? '').toLowerCase();
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  const logins = activeCase.loginHistory ?? [];
  const documents = activeCase.documents ?? [];

  if (type.includes('account takeover')) {
    return {
      title: 'Access and profile context',
      subtitle: 'Neutral account-access facts tied to this case',
      fields: [
        ['Recent profile events', `${profileChanges.length} available`],
        ['Observed devices', `${uniqueValues(logins.map((item) => item.device)).length} in the packet`],
        ['Observed login areas', uniqueValues(logins.map((item) => item.location)).join(' · ') || unavailable],
        ['Available alerts / documents', `${documents.length} document records`],
      ],
    };
  }

  if (type.includes('chargeback')) {
    return {
      title: 'Card and merchant context',
      subtitle: 'Relationship facts available before merchant evidence review',
      fields: [
        ['Card / account products', relationshipValue(activeCase, 'Open products')],
        ['Last statement', relationshipValue(activeCase, 'Last statement')],
        ['Payment profile', relationshipValue(activeCase, 'Payment profile')],
        ['Prior dispute context', activeCase.facts?.find((item) => /prior|merchant|billing/i.test(item)) ?? 'Review the related merchant and billing records'],
      ],
    };
  }

  if (type.includes('credit risk')) {
    return {
      title: 'Relationship and exposure context',
      subtitle: 'Early account and payment facts for credit review',
      fields: [
        ['Relationship age', relationshipValue(activeCase, 'Relationship age', relationshipLength(activeCase.customer?.relationshipSince))],
        ['Open products', relationshipValue(activeCase, 'Open products')],
        ['Payment profile', relationshipValue(activeCase, 'Payment profile')],
        ['History depth', activeCase.facts?.find((item) => /history/i.test(item)) ?? 'Review available account and payment records'],
      ],
    };
  }

  return {
    title: 'Claim-specific relationship context',
    subtitle: 'Facts supplied by the active fictional case packet',
    fields: [
      ['Claim lane', activeCase.type ?? unavailable],
      ['Products', relationshipValue(activeCase, 'Open products')],
      ['Normal access area', relationshipValue(activeCase, 'Normal login area')],
      ['Available evidence', `${(activeCase.documents ?? []).length} document records`],
    ],
  };
}

function buildDossierSections(activeCase) {
  const contact = activeCase.customer?.contact ?? {};
  const loginHistory = activeCase.loginHistory ?? [];
  const documents = activeCase.documents ?? [];
  const receivedDocuments = documents.filter((item) => ['Received', 'Available'].includes(item.status));
  const knownDevices = uniqueValues(loginHistory.map((item) => item.device));
  const knownLocations = uniqueValues(loginHistory.map((item) => item.location));
  const authenticationMethods = uniqueValues(loginHistory.map((item) => item.method));
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
        ['Masked member ID', maskedTrainingId(activeCase.trainingId)],
        ['DOB / age', unavailable],
        ['Customer since', customerSince],
        ['Relationship length', relationshipLength(customerSince)],
        ['Primary state', activeCase.intake?.customerLocation ?? contact.address ?? unavailable],
        ['Customer segment', activeCase.customer?.segment ?? unavailable],
        ['Verification status', 'Training profile on file'],
        ['Account standing', activeCase.status ?? unavailable],
      ],
    },
    {
      id: 'contact',
      icon: '☎',
      title: 'Contact Information',
      subtitle: 'Contact points and recent verification context',
      fields: [
        ['Mobile phone', contact.phone ?? unavailable],
        ['Home phone', unavailable],
        ['Email', contact.email ?? unavailable],
        ['Mailing address', contact.address ?? unavailable],
        ['Physical address', contact.address ?? unavailable],
        ['Preferred contact', contact.preferredChannel ?? activeCase.intake?.channel ?? unavailable],
        ['Language', 'English'],
        ['Last verified date', activeCase.customer?.profileChanges?.[0]?.date ?? unavailable],
        ['Contact verification', 'Review the profile-change log and callback records'],
        ['Recent contact changes', `${(activeCase.customer?.profileChanges ?? []).length} profile events available`],
        ['MFA / alert contact use', authenticationMethods.join(' · ') || unavailable],
      ],
    },
    {
      id: 'products',
      icon: '▤',
      title: 'Products & Accounts',
      subtitle: 'Products, balances, limits, and standing supplied by the case',
      fields: [
        ['Open products', relationshipValue(activeCase, 'Open products')],
        ['Checking / savings', relationshipValue(activeCase, 'Open products')],
        ['Debit / credit products', activeCase.customer?.segment ?? unavailable],
        ['Loan / payroll products', activeCase.type?.includes('Credit') ? 'Credit relationship under review' : unavailable],
        ['Digital banking profile', relationshipValue(activeCase, 'Payment profile')],
        ['Account open date', customerSince],
        ['Product age', relationshipLength(customerSince)],
        ['Current exposure', activeCase.amount ?? unavailable],
        ['Credit limit', activeCase.type?.includes('Credit') ? activeCase.amount ?? unavailable : unavailable],
        ['NSF / overdraft / payment standing', 'Review in the dedicated Financial Investigation workspace'],
      ],
    },
    {
      id: 'relationship',
      icon: '∞',
      title: 'Relationship Overview',
      subtitle: 'Normal customer patterns available for comparison',
      fields: [
        ['Number of listed products', relationshipValue(activeCase, 'Open products').split('·').length],
        ['Normal deposit behavior', 'Review in the dedicated Financial Investigation workspace'],
        ['Normal spending behavior', activeCase.transactionInfo ?? unavailable],
        ['Normal login location', relationshipValue(activeCase, 'Normal login area')],
        ['Trusted / observed devices', knownDevices.join(' · ') || unavailable],
        ['Household / authorized users', unavailable],
        ['Business relationships', activeCase.type?.includes('Business') ? 'Business relationship packet available' : 'No business relationship listed'],
        ['Payment profile', relationshipValue(activeCase, 'Payment profile')],
      ],
    },
    {
      id: 'security',
      icon: '◇',
      title: 'Security & Access Summary',
      subtitle: 'Neutral security facts, not a fraud conclusion',
      fields: [
        ['MFA / login methods', authenticationMethods.join(' · ') || unavailable],
        ['Password last changed', 'Open Password Reset History when available'],
        ['Successful login records', `${loginHistory.filter((item) => item.result === 'Successful').length} in the packet`],
        ['Failed login records', `${loginHistory.filter((item) => item.result !== 'Successful').length} in the packet`],
        ['Observed devices', knownDevices.join(' · ') || unavailable],
        ['New devices', knownDevices.length > 1 ? `${knownDevices.length - 1} additional observed device${knownDevices.length === 2 ? '' : 's'}` : 'No additional device listed'],
        ['Observed locations', knownLocations.join(' · ') || unavailable],
        ['Alerts / lockouts', loginHistory.some((item) => item.result !== 'Successful') ? 'Review unsuccessful login records' : 'No unsuccessful login record listed'],
        ['Wallet enrollment', relationshipValue(activeCase, 'Wallet enrollment')],
        ['Recovery phone / email', contact.phone || contact.email ? 'Review listed contact methods and profile history' : unavailable],
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
        ['Priority', activeCase.priority ?? unavailable],
        ['Status', activeCase.status ?? unavailable],
        ['Opened', activeCase.opened ?? unavailable],
        ['Amount / exposure', activeCase.amount ?? unavailable],
        ['Queue reason', activeCase.queueReason ?? unavailable],
      ],
    },
    {
      id: 'contact-log',
      icon: 'LOG',
      title: 'Recent Customer Contact',
      subtitle: 'Intake, secure messages, callbacks, and document contact',
      fields: [
        ['Intake channel', activeCase.intake?.channel ?? unavailable],
        ['Contact time', activeCase.intake?.contactTime ?? unavailable],
        ['Customer-reported location', activeCase.intake?.customerLocation ?? unavailable],
        ['Stated device', activeCase.intake?.statedDevice ?? unavailable],
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
        ['Prior claim records', activeCase.facts?.find((item) => /prior claim|prior dispute/i.test(item)) ?? 'No separate prior-claim row supplied'],
        ['Prior merchant / account history', activeCase.facts?.find((item) => /merchant|account/i.test(item)) ?? 'Review related tool records'],
        ['Prior investigations', 'No separate prior-investigation packet supplied'],
        ['Supporting documents', `${documents.length} current document records`],
        ['Similar-claim context', 'Do not infer a pattern without opening supporting records'],
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

function profileEventMetadata(event, activeCase) {
  const linkedLogin = (activeCase.loginHistory ?? []).find((item) => String(item.time ?? item.date ?? '').includes(String(event.date ?? '')));
  return [
    ['Old value', event.oldValue ?? 'Not supplied in the current packet'],
    ['New value', event.newValue ?? event.detail ?? 'Not supplied in the current packet'],
    ['Channel', event.channel ?? 'Profile service'],
    ['Source', event.source ?? 'Not supplied'],
    ['User / device / session', linkedLogin ? `${linkedLogin.device ?? 'Device not listed'} · ${linkedLogin.session ?? 'Session not listed'}` : 'Open related access records'],
    ['IP / MFA method', linkedLogin ? `${linkedLogin.ip ?? 'IP not listed'} · ${linkedLogin.method ?? 'Method not listed'}` : 'Open related login records'],
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
  const sections = buildDossierSections(activeCase);
  const claimContext = claimSpecificContext(activeCase);
  const profileChanges = (activeCase.customer?.profileChanges ?? []).filter((item) => matchesQuery(`${item.id} ${item.date} ${item.item} ${item.detail} ${item.source}`, normalizedQuery));
  const visibleSections = sections.filter((section) => !normalizedQuery || matchesQuery(`${section.title} ${section.subtitle} ${section.fields.flat().join(' ')}`, normalizedQuery));
  const visibleRows = rows.filter((row) => matchesQuery(`${row.id} ${row.label} ${row.detail}`, normalizedQuery));
  const selectedTab = dossierTabs.find((item) => item.id === activeTab) ?? dossierTabs[0];
  const tabSections = sections.filter((section) => (
    normalizedQuery || selectedTab.sections.includes(section.id)
  ) && (!normalizedQuery || matchesQuery(`${section.title} ${section.subtitle} ${section.fields.flat().join(' ')}`, normalizedQuery)));

  useEffect(() => {
    setActiveTab('overview');
  }, [activeCase.id]);

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
          <article><span>Relationship</span><strong>{relationshipLength(activeCase.customer?.relationshipSince)}</strong></article>
          <article><span>Products</span><strong>{relationshipValue(activeCase, 'Open products')}</strong></article>
          <article><span>Case exposure</span><strong>{activeCase.amount}</strong></article>
          <article><span>Profile events</span><strong>{activeCase.customer?.profileChanges?.length ?? 0}</strong></article>
        </div>
      </section>

      <nav className="customer-360-actions" aria-label="Customer 360 related tools">
        <button type="button" onClick={() => openTool('Identity Intel / People Search')}>Identity Intel</button>
        <button type="button" onClick={() => openTool('Login History')}>Login History</button>
        <button type="button" onClick={() => openTool('Device Intelligence')}>Device Intelligence</button>
        <button type="button" onClick={() => openTool('Evidence Center')}>Evidence Center</button>
        <button type="button" onClick={() => openTool('Document Request')}>Document Request</button>
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

      <section className="customer-360-dossier-grid" aria-label="Customer 360 dossier sections">
        {tabSections.map((section) => <DossierCard key={section.id} section={section} normalizedQuery={normalizedQuery} />)}
        {normalizedQuery && visibleSections.length === 0 && (
          <div className="customer-360-empty" role="status">No dossier fields match this search. Clear or revise the search to continue.</div>
        )}
      </section>

      {(activeTab === 'history' || normalizedQuery) && <section className="customer-360-profile-log" aria-labelledby="customer-360-profile-log-heading">
        <header className="customer-360-section-heading">
          <div>
            <p>Permanent dossier history</p>
            <h3 id="customer-360-profile-log-heading">Profile Change Event Log</h3>
          </div>
          <span>{profileChanges.length} shown</span>
        </header>
        <div className="customer-360-event-list">
          {profileChanges.map((event) => (
            <article key={event.id} className="customer-360-event-card" data-profile-event={event.id}>
              <div className="customer-360-event-time"><strong>{event.date}</strong><span>{event.source}</span></div>
              <div className="customer-360-event-copy">
                <h4>{event.item}</h4>
                <DirectCollapsibleText lines={2} mobileLines={3}>{event.detail}</DirectCollapsibleText>
                <dl>{profileEventMetadata(event, activeCase).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
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
