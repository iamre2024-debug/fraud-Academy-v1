import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { getCustomer360Dossier } from './data/customer360Dossier.js';
import { formatMoney } from './data/relationshipAccounts.js';

const unavailable = 'Not available in the current training record';

const dossierTabs = [
  { id: 'overview', label: 'Overview', sections: ['identity', 'contact', 'relationship'] },
  { id: 'accounts', label: 'Accounts', sections: ['products', 'relationship'] },
  { id: 'devices', label: 'Devices & Access', sections: ['security'] },
  { id: 'contact', label: 'Contact History', sections: ['contact', 'contact-log'] },
  { id: 'history', label: 'Profile History', sections: ['profile-updates'] },
  { id: 'notes', label: 'Notes', sections: [] },
];

function matchesQuery(text, query) {
  return !query || String(text).toLowerCase().includes(query);
}

function titleCase(value = '') {
  return String(value)
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function buildDossierSections(dossier) {
  const { identity, contact, accounts, relationship, security, serviceContacts, profileUpdates } = dossier;
  const businessLinkFields = relationship.businessRelationships.length
    ? [['Ownership-linked businesses', `${relationship.businessRelationships.length} relationship record${relationship.businessRelationships.length === 1 ? '' : 's'}`]]
    : [];

  return [
    {
      id: 'identity',
      icon: 'ID',
      title: 'Customer Identity Profile',
      subtitle: 'Personal identity and relationship information',
      fields: [
        ['Full legal name', identity.legalName],
        ['Preferred name', identity.preferredName],
        ['Date of birth', `${identity.dob} · age ${identity.age}`],
        ['Current residential address', identity.currentAddress],
        ['Previous residential address', identity.previousAddress],
        ['Mobile phone', identity.mobilePhone],
        ['Home phone', identity.homePhone],
        ['Email', identity.email],
        ['Training ID', identity.trainingId],
        ['Customer since', identity.customerSince],
        ['Relationship length', identity.relationshipLength],
        ['Customer segment', identity.segment],
        ['Preferred contact', identity.preferredContact],
        ['Language', identity.language],
        ['Identity verification', identity.verificationStatus],
        ['Verification method', identity.verificationMethod],
        ['Last verified', identity.lastVerified],
      ],
    },
    {
      id: 'contact',
      icon: '☎',
      title: 'Contact Information',
      subtitle: 'Stored customer contact points and preferences',
      fields: [
        ['Mobile phone', contact.mobilePhone],
        ['Home phone', contact.homePhone],
        ['Email', contact.email],
        ['Mailing address', contact.mailingAddress],
        ['Physical address', contact.physicalAddress],
        ['Previous address', contact.previousAddress],
        ['Preferred contact', contact.preferredContact],
        ['Contact verification', contact.verificationStatus],
      ],
    },
    {
      id: 'products',
      icon: '▤',
      title: 'Products & Accounts',
      subtitle: 'Relationship-level account records',
      fields: [
        ['Listed products', accounts.length],
        ['Products', accounts.map((account) => account.productLabel).join(' · ')],
        ['Masked accounts', accounts.map((account) => account.maskedAccountId).join(' · ')],
        ['Account statuses', accounts.map((account) => `${account.productLabel}: ${account.status}`).join(' · ')],
        ['Primary product opened', accounts.find((account) => account.isPrimary)?.openDate ?? accounts[0]?.openDate ?? unavailable],
      ],
    },
    {
      id: 'relationship',
      icon: '∞',
      title: 'Relationship Overview',
      subtitle: 'Established customer relationship facts',
      fields: [
        ['Account standing', identity.accountStanding],
        ['Normal deposit behavior', relationship.normalDeposits],
        ['Normal spending behavior', relationship.normalSpending],
        ['Authorized users', relationship.authorizedUsers],
        ['Digital banking', relationship.digitalBanking],
        ...businessLinkFields,
      ],
    },
    {
      id: 'security',
      icon: '◇',
      title: 'Security & Access Summary',
      subtitle: 'Trusted profile security settings and enrolled devices',
      fields: [
        ['MFA status', security.mfaStatus],
        ['Password last changed', security.passwordChanged],
        ['Trusted devices', security.trustedDevices.length],
        ['Lockouts', security.lockouts],
        ['Security alert routing', security.alerts],
        ['Recovery phone / email', security.recoveryContact],
      ],
    },
    {
      id: 'contact-log',
      icon: 'LOG',
      title: 'Service Contact Notes',
      subtitle: 'Factual relationship-servicing history',
      fields: [
        ['Service contacts', serviceContacts.length],
        ['Latest service contact', serviceContacts[0]?.dateTime ?? unavailable],
        ['Latest contact type', serviceContacts[0]?.type ?? unavailable],
        ['Latest outcome', serviceContacts[0]?.outcome ?? unavailable],
      ],
    },
    {
      id: 'profile-updates',
      icon: 'HIST',
      title: 'Profile Updates',
      subtitle: 'Neutral profile-maintenance history',
      fields: [
        ['Profile updates', profileUpdates.length],
        ['Latest update', profileUpdates[0]?.dateTime ?? unavailable],
        ['Update types', [...new Set(profileUpdates.map((event) => event.updateType))].join(' · ') || unavailable],
      ],
    },
  ];
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

function accountFields(account) {
  const fields = [
    ['Account ID', account.maskedAccountId],
    ['Product type', account.productTypeLabel],
    ['Account type', titleCase(account.productKind)],
    ['Opened', account.openDate],
    ['Status', account.status],
  ];

  if (account.productKind !== 'debit-card') {
    fields.push(['Current balance', formatMoney(account.currentBalance)]);
  }

  if (['checking', 'savings', 'business-checking', 'payroll-account'].includes(account.productKind)) {
    fields.push(['Available balance', formatMoney(account.availableBalance)]);
  }

  if (['credit-card', 'business-credit-card', 'revolving-credit-line'].includes(account.productKind)) {
    fields.push(
      ['Credit limit', formatMoney(account.creditLimit)],
      ['Available credit', formatMoney(account.availableCredit)],
    );
  }

  if (['installment-loan', 'business-installment-loan'].includes(account.productKind)) {
    fields.push(['Original loan amount', formatMoney(account.originalLoanAmount)]);
  }

  if (!['checking', 'savings', 'business-checking'].includes(account.productKind)) {
    fields.push(
      ['Scheduled payment', formatMoney(account.scheduledPayment)],
      ['Next payment due', account.nextPaymentDueDate ?? 'Not applicable'],
    );
  }

  fields.push(
    ['Payment status', account.paymentStatus],
    ['Past-due amount', formatMoney(account.pastDueAmount)],
    ['Restrictions', account.restrictions],
    ['Holds', account.holds],
  );

  return fields;
}

function routeForAccount(account, availableToolNames) {
  const preferred = /loan|credit/.test(account.productKind)
    ? ['Financial Investigation', 'Transaction History']
    : ['Transaction History', 'Financial Investigation'];
  return preferred.find((toolName) => availableToolNames.has(toolName)) ?? null;
}

function profileUpdateFields(event) {
  return [
    ['Update type', event.updateType],
    ['Previous value', event.previousValue],
    ['New value', event.newValue],
    ['Channel', event.channel],
    ['Source', event.source],
    ['User / actor', event.actor],
    ['Device', event.deviceId],
    ['Session', event.sessionId],
    ['Authentication', event.authentication],
  ];
}

function searchRecord(record, query) {
  return matchesQuery(JSON.stringify(record), query);
}

export default function Customer360Panel({
  activeCase,
  openTool,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  currentCompleted = [],
  notes = [],
  quickPin,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const normalizedQuery = query.trim().toLowerCase();
  const dossier = useMemo(() => getCustomer360Dossier(activeCase), [activeCase]);
  const sections = useMemo(() => buildDossierSections(dossier), [dossier]);
  const selectedTab = dossierTabs.find((item) => item.id === activeTab) ?? dossierTabs[0];
  const availableToolNames = new Set(activeCase.availableTools ?? []);
  const profileRoutes = [
    'Identity Intel / People Search',
    'Device Intelligence',
    'Login History',
    'Session History',
  ].filter((toolName) => availableToolNames.has(toolName));
  const securityRoutes = ['Device Intelligence', 'Login History', 'Session History']
    .filter((toolName) => availableToolNames.has(toolName));
  const businessRelationships = dossier.relationship.businessRelationships;
  const visibleSections = sections.filter((section) => (
    !normalizedQuery || matchesQuery(`${section.title} ${section.subtitle} ${section.fields.flat().join(' ')}`, normalizedQuery)
  ));
  const tabSections = visibleSections.filter((section) => (
    normalizedQuery || selectedTab.sections.includes(section.id)
  ));
  const visibleAccounts = dossier.accounts.filter((record) => searchRecord(record, normalizedQuery));
  const visibleDevices = dossier.security.trustedDevices.filter((record) => searchRecord(record, normalizedQuery));
  const visibleServiceContacts = dossier.serviceContacts.filter((record) => searchRecord(record, normalizedQuery));
  const visibleProfileUpdates = dossier.profileUpdates.filter((record) => searchRecord(record, normalizedQuery));
  const visibleBusinessRelationships = businessRelationships.filter((record) => searchRecord(record, normalizedQuery));
  const matchingRecordCount = visibleAccounts.length
    + visibleDevices.length
    + visibleServiceContacts.length
    + visibleProfileUpdates.length
    + visibleBusinessRelationships.length;

  useEffect(() => {
    setActiveTab('overview');
  }, [activeCase.id]);

  function exportProfileChangeReport() {
    const lines = [
      'Fraud Academy — Customer Profile Update Report',
      `Customer: ${dossier.identity.legalName}`,
      `Training ID: ${dossier.identity.trainingId}`,
      'Fictional training data only',
      '',
      ...dossier.profileUpdates.flatMap((event) => [
        `${event.dateTime} | ${event.updateType} | ${event.item}`,
        ...profileUpdateFields(event).slice(1).map(([label, value]) => `${label}: ${value}`),
        '',
      ]),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dossier.identity.trainingId}-profile-update-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="ornate-card activity-panel customer-360-theme-v1"
      data-customer-360-screen="approved-theme-v1"
      data-case-id={activeCase.id}
      data-customer-id={dossier.identity.trainingId}
    >
      <header className="customer-360-header">
        <div>
          <p className="customer-360-eyebrow">Personal relationship profile · Evidence First</p>
          <h2>Customer 360</h2>
          <p>Review the customer’s stored identity, products, security profile, and service history.</p>
        </div>
        <div className="customer-360-header-actions">
          <span className="customer-360-status">{dossier.identity.verificationStatus}</span>
          <button type="button" onClick={() => pin(`${dossier.identity.trainingId} · ${dossier.identity.legalName}`)}>Pin customer</button>
          <button
            type="button"
            onClick={() => quickPin?.({ label: 'Training ID', value: dossier.identity.trainingId, sourceTool: 'Customer 360' })}
          >
            Quick Pad ID
          </button>
        </div>
      </header>

      <section className="customer-360-identity-band" aria-label="Customer 360 identity summary">
        <div className="customer-360-avatar" aria-hidden="true">
          {String(dossier.identity.preferredName ?? dossier.identity.legalName ?? 'FA').split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </div>
        <div className="customer-360-identity-copy">
          <span>{dossier.identity.segment}</span>
          <h3>{dossier.identity.preferredName}</h3>
          <p>
            {dossier.identity.legalName} · {dossier.identity.trainingId} · Customer since {dossier.identity.customerSince}
          </p>
        </div>
        <div className="customer-360-identity-metrics">
          {dossier.atAGlance.map(([label, value]) => (
            <article key={label}><span>{label}</span><strong>{value}</strong></article>
          ))}
        </div>
      </section>

      {profileRoutes.length > 0 && (
        <nav className="customer-360-actions" aria-label="Customer 360 related tools">
          {profileRoutes.map((toolName) => (
            <button key={toolName} type="button" onClick={() => openTool(toolName)}>
              {toolName === 'Identity Intel / People Search' ? 'Identity Intel' : toolName}
            </button>
          ))}
        </nav>
      )}

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

      <div className="customer-360-search-row">
        <label>
          <span>Search this profile</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search identity, accounts, devices, contacts, and profile updates..."
            aria-label="Search Customer 360 dossier"
          />
        </label>
        <span aria-live="polite">
          {visibleSections.length} matching profile sections · {matchingRecordCount} matching records
        </span>
      </div>

      <section className="customer-360-dossier-grid" aria-label="Customer 360 dossier sections">
        {tabSections.map((section) => (
          <DossierCard key={section.id} section={section} normalizedQuery={normalizedQuery} />
        ))}
        {normalizedQuery && visibleSections.length === 0 && matchingRecordCount === 0 && (
          <div className="customer-360-empty" role="status">
            No customer-profile fields match this search. Clear or revise the search to continue.
          </div>
        )}
      </section>

      {(activeTab === 'accounts' || normalizedQuery) && visibleAccounts.length > 0 && (
        <section className="customer-360-record-section" aria-labelledby="customer-360-product-records-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Relationship-level records</p>
              <h3 id="customer-360-product-records-heading">Accounts & Products</h3>
            </div>
            <span>{visibleAccounts.length} shown</span>
          </header>
          <div className="customer-360-structured-records customer-360-account-records">
            {visibleAccounts.map((account) => {
              const route = routeForAccount(account, availableToolNames);
              return (
                <article key={account.accountId} data-customer-account={account.accountId}>
                  <header>
                    <span>{account.maskedAccountId} · {account.status}</span>
                    <strong>{account.productLabel}</strong>
                  </header>
                  <dl>
                    {accountFields(account).map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                  <div className="customer-360-record-actions">
                    <button
                      type="button"
                      disabled={!route}
                      onClick={() => route && openTool(route, 'investigate', { query: account.accountId })}
                      aria-label={`Open account ${account.accountId}`}
                    >
                      Open Account
                    </button>
                    <button
                      type="button"
                      onClick={() => quickPin?.({
                        label: 'Account ID',
                        value: account.accountId,
                        sourceTool: 'Customer 360',
                        sourceRecordId: account.accountId,
                      })}
                      aria-label={`Add ${account.accountId} to Quick Pad`}
                    >
                      Quick Pad account ID
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {(activeTab === 'devices' || normalizedQuery) && visibleDevices.length > 0 && (
        <section className="customer-360-record-section" aria-labelledby="customer-360-trusted-devices-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Profile trust records</p>
              <h3 id="customer-360-trusted-devices-heading">Trusted Devices</h3>
            </div>
            <span>{visibleDevices.length} shown</span>
          </header>
          {securityRoutes.length > 0 && (
            <nav className="customer-360-security-routes" aria-label="Customer security history routes">
              {securityRoutes.map((toolName) => (
                <button key={toolName} type="button" onClick={() => openTool(toolName)}>
                  Open {toolName}
                </button>
              ))}
            </nav>
          )}
          <div className="customer-360-structured-records customer-360-device-records">
            {visibleDevices.map((device) => (
              <article key={device.id} data-trusted-device={device.id}>
                <header><span>{device.id} · {device.trustStatus}</span><strong>{device.name}</strong></header>
                <dl>
                  <div><dt>Device type</dt><dd>{device.type}</dd></div>
                  <div><dt>Browser / operating system</dt><dd>{device.browserOrOperatingSystem}</dd></div>
                  <div><dt>First seen</dt><dd>{device.firstSeen}</dd></div>
                  <div><dt>Last seen</dt><dd>{device.lastSeen}</dd></div>
                  <div><dt>Most recent successful login</dt><dd>{device.mostRecentSuccessfulLogin}</dd></div>
                  <div><dt>Trust status</dt><dd>{device.trustStatus}</dd></div>
                  <div><dt>MFA method</dt><dd>{device.mfaMethod}</dd></div>
                  <div><dt>Trusted phone</dt><dd>{dossier.security.trustedPhone}</dd></div>
                  <div><dt>Trusted email</dt><dd>{dossier.security.trustedEmail}</dd></div>
                  <div><dt>Recent password reset</dt><dd>{dossier.security.recentPasswordReset}</dd></div>
                  <div><dt>Security alerts sent</dt><dd>{dossier.security.securityAlertsSent}</dd></div>
                </dl>
                <div className="customer-360-record-actions">
                  {availableToolNames.has('Device Intelligence') && (
                    <button
                      type="button"
                      onClick={() => openTool('Device Intelligence', 'investigate', { query: device.id })}
                    >
                      Open Device History
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => quickPin?.({
                      label: 'Device ID',
                      value: device.id,
                      sourceTool: 'Customer 360',
                      sourceRecordId: device.id,
                    })}
                  >
                    Quick Pad device ID
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(activeTab === 'contact' || normalizedQuery) && visibleServiceContacts.length > 0 && (
        <section className="customer-360-record-section" aria-labelledby="customer-360-contact-records-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Factual servicing history</p>
              <h3 id="customer-360-contact-records-heading">Service Contact Notes</h3>
            </div>
            <span>{visibleServiceContacts.length} shown</span>
          </header>
          <div className="customer-360-structured-records customer-360-service-records">
            {visibleServiceContacts.map((contactRecord) => (
              <article key={contactRecord.id}>
                <header><span>{contactRecord.dateTime}</span><strong>{contactRecord.type}</strong></header>
                <dl>
                  <div><dt>Channel</dt><dd>{contactRecord.channel}</dd></div>
                  <div><dt>Reason for contact</dt><dd>{contactRecord.reasonForContact}</dd></div>
                  <div><dt>What the customer reported</dt><dd>{contactRecord.reportedInformation}</dd></div>
                  <div><dt>Assistance provided</dt><dd>{contactRecord.assistanceProvided}</dd></div>
                  <div><dt>Documents requested</dt><dd>{contactRecord.documentsRequested}</dd></div>
                  <div><dt>Follow-up status</dt><dd>{contactRecord.followUpStatus}</dd></div>
                  <div><dt>Agent / department</dt><dd>{contactRecord.agentOrDepartment}</dd></div>
                  <div><dt>Related account</dt><dd>{contactRecord.relatedAccountId}</dd></div>
                  <div className="customer-360-wide-field"><dt>Service note</dt><dd>{contactRecord.notes}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {(activeTab === 'history' || normalizedQuery) && visibleProfileUpdates.length > 0 && (
        <section className="customer-360-profile-log" aria-labelledby="customer-360-profile-log-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Permanent relationship history</p>
              <h3 id="customer-360-profile-log-heading">Profile Update Log</h3>
            </div>
            <div className="customer-360-section-actions">
              <span>{visibleProfileUpdates.length} shown</span>
              <button type="button" onClick={exportProfileChangeReport}>Export Profile Update Report</button>
            </div>
          </header>
          <div className="customer-360-event-list">
            {visibleProfileUpdates.map((event) => (
              <article key={event.id} className="customer-360-event-card" data-profile-event={event.id}>
                <div className="customer-360-event-time">
                  <strong>{event.dateTime}</strong>
                  <span>{event.source}</span>
                </div>
                <div className="customer-360-event-copy">
                  <h4>{event.item}</h4>
                  <dl>
                    {profileUpdateFields(event).map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                </div>
                <div className="customer-360-event-actions">
                  <button type="button" onClick={() => pin(`${event.id} · ${event.item}`)}>Pin</button>
                  <button
                    type="button"
                    onClick={() => saveNote(
                      `Customer profile update ${event.id}: ${event.item}. ${event.previousValue} → ${event.newValue}.`,
                      'Customer profile update',
                    )}
                  >
                    Save learner note
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(activeTab === 'overview' || activeTab === 'accounts' || normalizedQuery) && visibleBusinessRelationships.length > 0 && (
        <section className="customer-360-record-section customer-360-business-links" aria-labelledby="customer-360-business-links-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Verified ownership relationship</p>
              <h3 id="customer-360-business-links-heading">Linked Business Relationships</h3>
            </div>
            <span>{visibleBusinessRelationships.length} shown</span>
          </header>
          <div className="customer-360-structured-records">
            {visibleBusinessRelationships.map((business) => (
              <article key={business.id} data-linked-business={business.businessId}>
                <header><span>{business.businessId} · {business.status}</span><strong>{business.businessName}</strong></header>
                <dl>
                  <div><dt>Relationship</dt><dd>{business.relationship}</dd></div>
                  <div><dt>Ownership</dt><dd>{business.ownershipPercentage}</dd></div>
                  <div><dt>Relationship since</dt><dd>{business.relationshipSince}</dd></div>
                  <div><dt>Business ID</dt><dd>{business.businessId}</dd></div>
                </dl>
                <div className="customer-360-record-actions">
                  <button
                    type="button"
                    disabled={!availableToolNames.has('Business 360')}
                    onClick={() => openTool('Business 360', 'investigate', { query: business.businessId })}
                  >
                    {availableToolNames.has('Business 360') ? 'Open Business 360' : 'Business 360 route unavailable'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'notes' && !normalizedQuery && (
        <section className="customer-360-related-records customer-360-notes" aria-labelledby="customer-360-notes-heading">
          <header className="customer-360-section-heading">
            <div>
              <p>Learner-authored, case-scoped documentation</p>
              <h3 id="customer-360-notes-heading">Customer 360 Learner Notes</h3>
            </div>
            <span>{notes.length} saved</span>
          </header>
          <div className="customer-360-note-list">
            {notes.length
              ? notes.map((note, index) => <article key={`${note}-${index}`}>{note}</article>)
              : <div className="customer-360-empty" role="status">No learner notes have been saved for this case yet.</div>}
          </div>
          <button
            type="button"
            className="customer-360-primary"
            onClick={() => saveNote(`Customer 360 profile reviewed for ${dossier.identity.legalName}.`, 'Customer 360 profile')}
          >
            Save profile review note
          </button>
        </section>
      )}

      <footer className="customer-360-review-bar">
        <div>
          <strong>Customer 360 review</strong>
          <span>Marking this profile reviewed records investigation coverage only. It does not determine a case outcome.</span>
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
