import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';

const unavailable = 'Not available in the current training packet';

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

function buildDossierSections(activeCase) {
  const contact = activeCase.customer?.contact ?? {};
  const loginHistory = activeCase.loginHistory ?? [];
  const documents = activeCase.documents ?? [];
  const knownDevices = uniqueValues(loginHistory.map((item) => item.device));
  const knownLocations = uniqueValues(loginHistory.map((item) => item.location));
  const methods = uniqueValues(loginHistory.map((item) => item.method));
  const customerSince = activeCase.customer?.relationshipSince ?? unavailable;

  return [
    {
      id: 'identity',
      icon: 'ID',
      title: 'Identity Snapshot',
      subtitle: 'Who the customer is',
      fields: [
        ['Name', activeCase.person ?? unavailable],
        ['Customer ID', activeCase.trainingId ?? unavailable],
        ['Masked member ID', maskedTrainingId(activeCase.trainingId)],
        ['Customer since', customerSince],
        ['Relationship length', relationshipLength(customerSince)],
        ['Primary location', activeCase.intake?.customerLocation ?? contact.address ?? unavailable],
        ['Customer segment', activeCase.customer?.segment ?? unavailable],
        ['Account standing', activeCase.status ?? unavailable],
      ],
    },
    {
      id: 'contact',
      icon: '☎',
      title: 'Contact Information',
      subtitle: 'Phone, email, address, and preferences',
      fields: [
        ['Mobile phone', contact.phone ?? unavailable],
        ['Email', contact.email ?? unavailable],
        ['Mailing address', contact.address ?? unavailable],
        ['Preferred contact', contact.preferredChannel ?? activeCase.intake?.channel ?? unavailable],
        ['Recent contact changes', `${activeCase.customer?.profileChanges?.length ?? 0} profile events available`],
        ['MFA / alert contact use', methods.join(' · ') || unavailable],
      ],
    },
    {
      id: 'products',
      icon: '▤',
      title: 'Products & Accounts',
      subtitle: 'Products, exposure, and standing',
      fields: [
        ['Open products', relationshipValue(activeCase, 'Open products')],
        ['Digital banking profile', relationshipValue(activeCase, 'Payment profile')],
        ['Current exposure', activeCase.amount ?? unavailable],
        ['Customer segment', activeCase.customer?.segment ?? unavailable],
        ['Case type', activeCase.type ?? unavailable],
      ],
    },
    {
      id: 'relationship',
      icon: '∞',
      title: 'Relationship Overview',
      subtitle: 'Normal patterns available for comparison',
      fields: [
        ['Normal spending behavior', activeCase.transactionInfo ?? unavailable],
        ['Normal login location', relationshipValue(activeCase, 'Normal login area')],
        ['Trusted / observed devices', knownDevices.join(' · ') || unavailable],
        ['Payment profile', relationshipValue(activeCase, 'Payment profile')],
      ],
    },
    {
      id: 'security',
      icon: '◇',
      title: 'Security & Access',
      subtitle: 'Neutral access facts',
      fields: [
        ['MFA / login methods', methods.join(' · ') || unavailable],
        ['Successful login records', `${loginHistory.filter((item) => item.result === 'Successful').length}`],
        ['Failed login records', `${loginHistory.filter((item) => item.result !== 'Successful').length}`],
        ['Observed devices', knownDevices.join(' · ') || unavailable],
        ['Observed locations', knownLocations.join(' · ') || unavailable],
      ],
    },
    {
      id: 'case',
      icon: 'CASE',
      title: 'Current Case',
      subtitle: 'Why this case is open',
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
      title: 'Recent Contact',
      subtitle: 'Intake, callback, and document contact',
      fields: [
        ['Intake channel', activeCase.intake?.channel ?? unavailable],
        ['Contact time', activeCase.intake?.contactTime ?? unavailable],
        ['Customer-reported location', activeCase.intake?.customerLocation ?? unavailable],
        ['Stated device', activeCase.intake?.statedDevice ?? unavailable],
        ['Documents listed', `${documents.length}`],
      ],
    },
    {
      id: 'prior-claims',
      icon: 'HIST',
      title: 'Prior Claims / Disputes',
      subtitle: 'Historical context in the case packet',
      fields: [
        ['Prior claim records', activeCase.facts?.find((item) => /prior claim|prior dispute/i.test(item)) ?? 'No separate prior-claim row supplied'],
        ['Prior merchant / account history', activeCase.facts?.find((item) => /merchant|account/i.test(item)) ?? 'Review related tool records'],
        ['Supporting documents', `${documents.length} current document records`],
      ],
    },
  ];
}

function FieldList({ fields }) {
  return (
    <dl className="customer-360-page-fields">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd><DirectCollapsibleText lines={4} mobileLines={8}>{String(value)}</DirectCollapsibleText></dd>
        </div>
      ))}
    </dl>
  );
}

function PageHeader({ title, subtitle, onBack }) {
  return (
    <header className="customer-360-page-header">
      <button type="button" className="customer-360-back" onClick={onBack} aria-label="Back to Customer 360">←</button>
      <div>
        <p>{subtitle}</p>
        <h2>{title}</h2>
      </div>
    </header>
  );
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
}) {
  const [mobilePage, setMobilePage] = useState('overview');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const sections = useMemo(() => buildDossierSections(activeCase), [activeCase]);
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  const selectedSection = sections.find((section) => section.id === mobilePage);
  const filteredRows = rows.filter((row) => !normalizedQuery || `${row.id} ${row.label} ${row.detail}`.toLowerCase().includes(normalizedQuery));
  const selectedRecord = filteredRows.find((row) => row.id === selectedRecordId) ?? activeRow ?? filteredRows[0];

  useEffect(() => {
    setMobilePage('overview');
    setSelectedRecordId('');
  }, [activeCase.id]);

  function openAttachedPage(page) {
    setMobilePage(page);
    window.setTimeout(() => document.querySelector('.customer-360-theme-v1')?.scrollIntoView({ block: 'start' }), 20);
  }

  function backToOverview() {
    setMobilePage('overview');
    setSelectedRecordId('');
  }

  if (mobilePage !== 'overview') {
    return (
      <section className="ornate-card activity-panel customer-360-theme-v1 customer-360-attached-page" data-customer-360-page={mobilePage}>
        {selectedSection && (
          <>
            <PageHeader title={selectedSection.title} subtitle={selectedSection.subtitle} onBack={backToOverview} />
            <FieldList fields={selectedSection.fields} />
          </>
        )}

        {mobilePage === 'profile-changes' && (
          <>
            <PageHeader title="Profile Changes" subtitle="Customer profile event history" onBack={backToOverview} />
            <div className="customer-360-page-event-list">
              {profileChanges.map((event) => (
                <article key={event.id} className="customer-360-page-event">
                  <header><strong>{event.item}</strong><span>{event.date}</span></header>
                  <p>{event.detail}</p>
                  <dl>
                    <div><dt>Source</dt><dd>{event.source}</dd></div>
                    <div><dt>Event ID</dt><dd>{event.id}</dd></div>
                  </dl>
                  <div>
                    <button type="button" onClick={() => pin(`${event.id} · ${event.item}`)}>Pin</button>
                    <button type="button" onClick={() => saveNote(`Customer profile event ${event.id}: ${event.item}. ${event.detail}`, 'Customer profile event')}>Save note</button>
                  </div>
                </article>
              ))}
              {!profileChanges.length && <p className="customer-360-page-empty">No profile changes are listed in this case.</p>}
            </div>
          </>
        )}

        {mobilePage === 'related-records' && (
          <>
            <PageHeader title="Related Customer Records" subtitle="Searchable customer-linked records" onBack={backToOverview} />
            <label className="customer-360-page-search">
              <span>Search records</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer records" />
            </label>
            <div className="customer-360-page-record-list">
              {filteredRows.map((row) => {
                const open = selectedRecord?.id === row.id;
                return (
                  <article key={row.id} className={open ? 'open' : ''}>
                    <button type="button" className="customer-360-record-open" onClick={() => { setSelectedRecordId(row.id); setExpandedId(row.id); }}>
                      <span>{row.id}</span>
                      <strong>{row.label}</strong>
                      <em>{open ? 'Close' : 'Open'}</em>
                    </button>
                    {open && (
                      <div className="customer-360-record-detail">
                        <DirectCollapsibleText lines={8} mobileLines={12}>{row.detail}</DirectCollapsibleText>
                        <div>
                          <button type="button" onClick={() => pin(row.pin)}>Pin record</button>
                          <button type="button" onClick={() => saveNote(`Customer record ${row.id}: ${row.detail}`, 'Customer record')}>Save note</button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="ornate-card activity-panel customer-360-theme-v1 customer-360-overview" data-customer-360-screen="approved-theme-v1">
      <header className="customer-360-header">
        <div>
          <p className="customer-360-eyebrow">Identity workspace · Evidence First</p>
          <h2>Customer 360</h2>
          <p>Open one customer record area at a time.</p>
        </div>
        <div className="customer-360-header-actions">
          <span className="customer-360-status">{activeCase.status}</span>
          <button type="button" onClick={() => pin(`${activeCase.id} · ${activeCase.person}`)}>Pin customer</button>
        </div>
      </header>

      <section className="customer-360-identity-band" aria-label="Customer summary">
        <div className="customer-360-avatar" aria-hidden="true">{String(activeCase.person ?? 'FA').split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
        <div className="customer-360-identity-copy">
          <span>{activeCase.customer?.segment ?? 'Customer profile'}</span>
          <h3>{activeCase.person}</h3>
          <p>{activeCase.trainingId} · Customer since {activeCase.customer?.relationshipSince ?? 'not listed'}</p>
        </div>
        <div className="customer-360-identity-metrics">
          <article><span>Relationship</span><strong>{relationshipLength(activeCase.customer?.relationshipSince)}</strong></article>
          <article><span>Exposure</span><strong>{activeCase.amount}</strong></article>
          <article><span>Profile changes</span><strong>{profileChanges.length}</strong></article>
        </div>
      </section>

      <nav className="customer-360-actions" aria-label="Customer 360 tools">
        <button type="button" onClick={() => openTool('Identity Intelligence')}>Identity Intel</button>
        <button type="button" onClick={() => openTool('Login History')}>Login History</button>
        <button type="button" onClick={() => openTool('Device Intelligence')}>Device Intelligence</button>
        <button type="button" onClick={jumpDecision}>Submit Decision</button>
      </nav>

      <section className="customer-360-page-menu" aria-label="Customer 360 record areas">
        {sections.map((section) => (
          <button type="button" key={section.id} onClick={() => openAttachedPage(section.id)}>
            <span aria-hidden="true">{section.icon}</span>
            <div><strong>{section.title}</strong><small>{section.subtitle}</small></div>
            <em>›</em>
          </button>
        ))}
        <button type="button" onClick={() => openAttachedPage('profile-changes')}>
          <span aria-hidden="true">↻</span>
          <div><strong>Profile Changes</strong><small>{profileChanges.length} events available</small></div>
          <em>›</em>
        </button>
        <button type="button" onClick={() => openAttachedPage('related-records')}>
          <span aria-hidden="true">⌘</span>
          <div><strong>Related Customer Records</strong><small>{rows.length} linked records</small></div>
          <em>›</em>
        </button>
      </section>

      <footer className="customer-360-review-bar">
        <div><strong>Customer 360 review</strong><span>Review completion records process progress only.</span></div>
        <button type="button" className="customer-360-primary" onClick={() => markReviewed('Customer 360')}>
          {currentCompleted.includes('Customer 360') ? '✓ Customer 360 reviewed' : 'Mark Customer 360 reviewed'}
        </button>
      </footer>
    </section>
  );
}
