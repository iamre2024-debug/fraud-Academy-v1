import { formatMoney } from './data/relationshipAccounts.js';
import { businessIntelSearchModes } from './data/businessIntelSearch.js';

function IntelGlyph({ type, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (type === 'identity') return <svg {...common}><circle cx="12" cy="7.5" r="4" /><path d="M4.5 21c.8-5.2 3.3-7.7 7.5-7.7s6.7 2.5 7.5 7.7" /><path d="m18 4 2 1v2.6c0 1.7-.7 2.9-2 3.7-1.3-.8-2-2-2-3.7V5z" /></svg>;
  if (type === 'business') return <svg {...common}><rect x="4" y="3" width="11" height="18" rx="1.5" /><path d="M8 7h3M8 11h3M8 15h3M15 9h5v12h-5M17.5 13h.01M17.5 17h.01M8 21v-3h3v3" /></svg>;
  if (type === 'search') return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  if (type === 'profile') return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2.5" /><path d="M5.5 17c.5-2.5 1.6-3.7 3.5-3.7s3 1.2 3.5 3.7M15 9h3M15 13h3M15 17h2" /></svg>;
  if (type === 'link') return <svg {...common}><path d="M10 13a4.5 4.5 0 0 0 6.4.1l2-2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1M14 11a4.5 4.5 0 0 0-6.4-.1l-2 2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" /></svg>;
  if (type === 'report') return <svg {...common}><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h8" /></svg>;
  if (type === 'license') return <svg {...common}><path d="M5 3h14v18H5zM8 7h8M8 11h5M8 15h4" /><circle cx="16" cy="16" r="2" /></svg>;
  if (type === 'payroll') return <svg {...common}><path d="M4 7h16v13H4zM7 7V4h10v3M4 11h16" /><path d="M8 15h3M14 15h2" /></svg>;
  if (type === 'people') return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.3" /><path d="M3.5 20c.5-4.4 2.3-6.6 5.5-6.6s5 2.2 5.5 6.6M14 14.5c3.6-.6 5.6 1.2 6.1 5.5" /></svg>;
  if (type === 'pin') return <svg {...common}><path d="M9 3h6l.8 5 2.2 2v2H6v-2l2.2-2zM12 12v9" /></svg>;
  if (type === 'note') return <svg {...common}><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  if (type === 'download') return <svg {...common}><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" /></svg>;
  if (type === 'chevron') return <svg {...common}><path d="m9 5 7 7-7 7" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>;
}

function IntelLunaLock() {
  return (
    <aside className="mobile-intel-luna" aria-label="Luna debrief is available after submission">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="#08275c" stroke="#60ddff" strokeWidth="2" />
        <path d="m16 22 5-12 10 9h3l10-9 5 13c5 7 5 18-1 25-7 8-25 8-32-1-5-7-5-18 0-25Z" fill="#f2fbff" />
        <path d="m21 12 7 9-9 4m24-13-7 9 9 4" fill="#f2a9d2" opacity=".68" />
        <ellipse cx="25" cy="32" rx="3" ry="4" fill="#163c6e" />
        <ellipse cx="39" cy="32" rx="3" ry="4" fill="#163c6e" />
        <circle cx="24" cy="31" r="1" fill="#d6f6ff" />
        <circle cx="38" cy="31" r="1" fill="#d6f6ff" />
        <path d="m32 37-3 2 3 2 3-2Z" fill="#d06d9e" />
        <path d="M24 43c3 4 13 4 16 0" fill="none" stroke="#31517a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span><strong>Luna ✦</strong><small>After submit</small></span>
    </aside>
  );
}

function IntelHeader({
  icon,
  onBack,
  backLabel = 'Back to Tool Map',
  routeLabel,
  subtitle,
  title,
}) {
  return (
    <header className="mobile-intel-header">
      {onBack ? (
        <button
          type="button"
          className="mobile-intel-back"
          onClick={onBack}
          aria-label={backLabel}
        >
          ‹
        </button>
      ) : (
        <span className="mobile-intel-header-icon"><IntelGlyph type={icon} size={26} /></span>
      )}
      <div>
        <h2 aria-label={routeLabel}>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <IntelLunaLock />
      <span className="mobile-intel-evidence-boundary">Evidence First · fictional records</span>
    </header>
  );
}

function IntelGate({ icon = 'search', title, text, tone = 'locked' }) {
  return (
    <section className="mobile-intel-gate identity-intel-gate" data-tone={tone} aria-live="polite">
      <span><IntelGlyph type={icon} size={25} /></span>
      <div><strong>{title}</strong><p>{text}</p></div>
    </section>
  );
}

function IntelCardHeader({ icon, eyebrow, title, action }) {
  return (
    <header>
      <span><IntelGlyph type={icon} size={21} /></span>
      <div><p>{eyebrow}</p><h3>{title}</h3></div>
      {action}
    </header>
  );
}

function FieldGrid({ fields, className = '' }) {
  return (
    <dl className={className}>
      {fields.map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value ?? 'Not available in the current training record'}</dd></div>
      ))}
    </dl>
  );
}

function reportField(section, label) {
  return section?.fields.find((field) => field.label === label)?.value
    ?? 'Not available in the current training record';
}

export function MobileIdentityIntelligencePage({
  activeSection,
  activeSectionId,
  backToToolMap,
  clearSearch,
  dobDraft,
  exportIdentityReport,
  idDraft,
  jumpDecision,
  markReviewed,
  nameDraft,
  openTool,
  pin,
  report,
  reportOpen,
  reviewed,
  runSearch,
  saveIdentityNote,
  searchHistory,
  searchMatched,
  searchMode,
  searchReady,
  setActiveSectionId,
  setDobDraft,
  setIdDraft,
  setNameDraft,
  setReportOpen,
  setSearchMode,
  submittedSearch,
}) {
  const profileSection = report.sections.find((section) => section.id === 'identity-summary') ?? report.sections[0];
  const searchLabel = searchMode === 'id'
    ? `Training ID: ${idDraft || 'not entered'}`
    : `${nameDraft || 'Name not entered'} · ${dobDraft || 'DOB not entered'}`;

  return (
    <section
      className="mobile-intel-reference-page mobile-identity-intel-reference"
      data-mobile-identity-intel-reference="true"
      data-identity-intelligence-screen="reference-v1"
    >
      <IntelHeader
        onBack={backToToolMap}
        icon="identity"
        routeLabel="Identity Intel / People Search"
        title="Identity Intelligence"
        subtitle="Search first, then inspect the matched training profile."
      />

      <form className="mobile-intel-search-card" aria-label="Identity Intel search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
        <IntelCardHeader icon="search" eyebrow="Step 1 · Record lookup" title="Run People Search" action={<em>{submittedSearch ? 'Search run' : 'Intel locked'}</em>} />
        <div className="mobile-intel-search-fields">
          <label>
            <span>Search method</span>
            <select value={searchMode} onChange={(event) => setSearchMode(event.target.value)} aria-label="Choose People Search method">
              <option value="id">Training ID</option>
              <option value="name-dob">Name + DOB</option>
            </select>
          </label>
          {searchMode === 'id' ? (
            <label>
              <span>Fictional Training ID</span>
              <input value={idDraft} onChange={(event) => setIdDraft(event.target.value)} placeholder="TRN-8842-19" aria-label="Search Identity Intel by Training ID" />
            </label>
          ) : (
            <>
              <label>
                <span>Full name</span>
                <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Maya Sterling" aria-label="Search Identity Intel by name" />
              </label>
              <label>
                <span>Date of birth</span>
                <input value={dobDraft} onChange={(event) => setDobDraft(event.target.value)} placeholder="Feb 14, 1988" aria-label="Search Identity Intel by date of birth" />
              </label>
            </>
          )}
        </div>
        <p>Use the fictional identity values collected from Customer 360 or the active case packet. No profile appears before the lookup runs.</p>
        <div className="mobile-intel-search-actions">
          <button type="submit" className="primary" disabled={!searchReady}>Run People Search</button>
          <button type="button" onClick={clearSearch}>Clear</button>
        </div>
      </form>

      {!submittedSearch && (
        <IntelGate
          title="Identity report hidden until a search is run."
          text="Enter a fictional Training ID, or pair the exact customer name with the training DOB."
        />
      )}

      {submittedSearch && !searchMatched && (
        <IntelGate
          tone="no-match"
          title="No fictional identity match returned for this search."
          text={`No profile matched ${searchLabel}. Check the source values and run a new exact search.`}
        />
      )}

      {searchMatched && (
        <>
          <section className="mobile-intel-subject-hero identity-intel-summary" aria-label="Identity Match Summary">
            <header>
              <div>
                <span className="mobile-intel-avatar"><IntelGlyph type="identity" size={30} /></span>
                <div>
                  <p>Identity Match Summary</p>
                  <h3>{report.subject.name}</h3>
                  <small>{report.profile.profileId} · fictional training profile</small>
                </div>
              </div>
              <span className="mobile-intel-result-chip">Record returned</span>
            </header>
            <div className="mobile-intel-record-chips">
              <span>Training ID: {report.subject.trainingId}</span>
              <span>Profile: {report.profile.profileId}</span>
            </div>
            <dl>
              {report.summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <div className="identity-intel-summary-actions mobile-intel-inline-actions">
              <button type="button" onClick={() => pin(`${report.profile.profileId} · ${report.subject.name}`)}><IntelGlyph type="pin" size={18} />Pin profile</button>
              <button type="button" onClick={() => saveIdentityNote(`Identity Match Summary ${report.profile.profileId} reviewed for ${report.subject.name}.`)}><IntelGlyph type="note" size={18} />Save summary note</button>
              <button type="button" className="primary investigation-tool-primary" onClick={() => setReportOpen(true)}><IntelGlyph type="report" size={18} />{reportOpen ? 'Full Profile Report Open' : 'View Full Profile Report'}</button>
            </div>
          </section>

          <section className="mobile-intel-card mobile-intel-source-match" aria-label="Identity source fields returned">
            <IntelCardHeader icon="report" eyebrow="Step 2 · Returned source facts" title="Identity source coverage" action={<em>{report.summary.length} facts</em>} />
            <div className="mobile-intel-source-orbit" aria-label={`${report.summary.length} source facts returned`}>
              <strong>{report.summary.length}</strong><span>source facts</span>
            </div>
            <div className="mobile-intel-source-lines">
              {report.summary.slice(0, 5).map(([label, value]) => <span key={label}><strong>{label}</strong><small>{value}</small></span>)}
            </div>
          </section>

          <div className="mobile-intel-two-column">
            <section className="mobile-intel-card">
              <IntelCardHeader icon="profile" eyebrow="Matched identity record" title="Personal Profile" />
              <FieldGrid fields={[
                ['Full name', reportField(profileSection, 'Full name')],
                ['Date of birth', reportField(profileSection, 'DOB')],
                ['Training ID', reportField(profileSection, 'Training ID')],
                ['Primary address', reportField(profileSection, 'Primary address')],
                ['Verification status', reportField(profileSection, 'Verification status')],
              ]} />
            </section>
            <section className="mobile-intel-card">
              <IntelCardHeader icon="link" eyebrow="Identifiers in the source packet" title="Linked Identifiers" action={<em>{report.sourceRecords.length}</em>} />
              <div className="mobile-intel-identifier-list">
                {report.sourceRecords.map((record) => (
                  <article key={record.id}>
                    <span><IntelGlyph type="link" size={17} /></span>
                    <div><small>{record.type}</small><strong>{record.value}</strong><em>{record.id} · {record.lastSeen}</em></div>
                    <button type="button" onClick={() => pin(`${record.id} · ${record.value}`)} aria-label={`Pin ${record.id}`}><IntelGlyph type="pin" size={17} /></button>
                  </article>
                ))}
                {!report.sourceRecords.length && <p>No separate linked identifier record was supplied.</p>}
              </div>
            </section>
          </div>

          <section className="mobile-intel-card mobile-intel-background identity-intel-counts" aria-label="Identity report counts">
            <IntelCardHeader icon="report" eyebrow="Detailed source index" title="Background Report Summary" action={<em>{report.sections.length} sections</em>} />
            <div>
              {report.counts.map(([label, count]) => <article key={label}><strong>{count}</strong><span>{label}</span></article>)}
            </div>
          </section>

          {!reportOpen && (
            <IntelGate
              icon="report"
              title="Identity Match Summary returned."
              text="Review the returned facts, then open the full fictional profile report for source-by-source detail."
            />
          )}

          {reportOpen && (
            <div className="identity-intel-workspace mobile-intel-report-workspace">
              <section className="identity-intel-sections identity-intel-source-panel mobile-intel-card" aria-label="People Search history and source records">
                <IntelCardHeader icon="search" eyebrow="Search & Sources" title="Criteria and matched objects" />
                <div className="identity-intel-search-history">
                  {searchHistory.map((item, index) => <span key={`${item}-${index}`}><strong>{index ? 'Previous search' : 'Current search'}</strong>{item}</span>)}
                </div>
                <div className="identity-intel-source-records">
                  {report.sourceRecords.map((item) => <article key={item.id}><span>{item.type}</span><strong>{item.value}</strong><small>{item.id} · {item.lastSeen}</small><button type="button" onClick={() => pin(`${item.id} · ${item.value}`)}>Pin</button></article>)}
                </div>
              </section>

              <section className="identity-intel-report mobile-intel-card" aria-label="Expanded identity report">
                <IntelCardHeader
                  icon="report"
                  eyebrow="Fictional report section"
                  title={activeSection.title}
                  action={<button type="button" onClick={() => saveIdentityNote(`${activeSection.title} reviewed for ${report.profile.profileId}.`)}>Save section note</button>}
                />
                <dl>{activeSection.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
              </section>

              <aside className="identity-intel-evidence mobile-intel-card" aria-label="Evidence Explorer">
                <IntelCardHeader icon="link" eyebrow="Evidence Explorer" title="Open a full report section" />
                <div className="identity-intel-section-buttons">
                  {report.sections.map((section) => (
                    <button key={section.id} type="button" aria-label={section.title} className={section.id === activeSectionId ? 'active' : ''} onClick={() => setActiveSectionId(section.id)}>
                      <span><strong>{section.title}</strong><small>{section.fields.length} fields</small></span><IntelGlyph type="chevron" size={18} />
                    </button>
                  ))}
                </div>
                <button type="button" onClick={exportIdentityReport}><IntelGlyph type="download" size={18} />Generate Identity Search Report</button>
              </aside>
            </div>
          )}
        </>
      )}

      <nav className="investigation-tool-next-routes mobile-intel-related-routes" aria-label="Identity Intel next routes">
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar mobile-intel-review-bar">
        <div><strong>Identity Intel / People Search review</strong><span>Search and open the detailed profile before marking this evidence source reviewed.</span></div>
        <button type="button" className={reviewed ? '' : 'primary investigation-tool-primary'} disabled={!searchMatched || !reportOpen} onClick={() => markReviewed('Identity Intel / People Search')}>
          {reviewed ? '✓ Identity Intel / People Search reviewed' : 'Mark Identity Intel / People Search reviewed'}
        </button>
      </footer>
    </section>
  );
}

function BusinessProfileFields({ dossier }) {
  const { profile } = dossier;
  return (
    <FieldGrid fields={[
      ['Legal business name', profile.legalName],
      ['DBA', profile.dba],
      ['Entity type', profile.entityType],
      ['Formation date', profile.formationDate],
      ['Formation state', profile.formationState],
      ['Business standing', profile.standing],
      ['Industry', profile.industry],
      ['NAICS', profile.naics],
      ['Physical operating address', profile.operatingAddress],
      ['Mailing address', profile.mailingAddress],
      ['Registered-agent name', profile.registeredAgent?.name],
      ['Registered-agent address', profile.registeredAgent?.address],
      ['Business phone', profile.phone],
      ['Business email', profile.email],
      ['Website', profile.website],
      ['Business age', profile.businessAge],
      ['Customer since', profile.customerSince],
      ['Relationship length', profile.relationshipLength],
      ['Known operating locations', profile.operatingLocations?.join(' · ') || 'No operating-location record is available.'],
      ['Estimated employee count', profile.estimatedEmployeeCount],
    ]} />
  );
}

function MobileBusinessOwnerDetail({ available, onClose, openTool, owner }) {
  const openOwnerTool = (toolName) => openTool(toolName, 'investigate', { query: owner.trainingId });
  return (
    <section className="business-360-owner-profile mobile-intel-card" aria-label={`Owner profile for ${owner.fullLegalName}`}>
      <IntelCardHeader icon="profile" eyebrow="Personal relationship profile" title={owner.fullLegalName} action={<button type="button" onClick={onClose}>Close</button>} />
      <FieldGrid fields={[
        ['Full legal name', owner.fullLegalName],
        ['Date of birth', owner.dateOfBirth],
        ['Training ID', owner.trainingId],
        ['Ownership', owner.ownershipPercentage],
        ['Business title', owner.businessTitle],
        ['Officer status', owner.officerStatus],
        ['Controlling-party status', owner.controllingPartyStatus],
        ['Guarantor status', owner.guarantorStatus],
        ['Current residential address', owner.currentResidentialAddress],
        ['Previous residential address', owner.previousResidentialAddress],
        ['Personal phone', owner.personalPhone],
        ['Personal email', owner.personalEmail],
        ['Identity verification', owner.identityVerificationStatus],
        ['Address verification', owner.addressVerificationStatus],
        ['Owner since', owner.ownerSince],
        ['Address comparison', owner.addressComparison],
      ]} />
      <div className="mobile-business-owner-support">
        <article><h4>Personal accounts</h4>{owner.accounts.map((account) => <div key={account.accountId}><strong>{account.productLabel} · {account.maskedAccountId}</strong><span>{account.status} · {formatMoney(account.currentBalance)}</span><small>{account.paymentStatus}</small></div>)}{!owner.accounts.length && <p>No personal account record is available for this owner.</p>}</article>
        <article><h4>Trusted security</h4>{owner.trustedDevices.map((device) => <div key={device.deviceId}><strong>{device.deviceName}</strong><span>{device.deviceId} · {device.browserOrOperatingSystem}</span><small>{device.trustStatus} · {device.mfaMethod}</small></div>)}{!owner.trustedDevices.length && <p>No trusted-device summary is available for this owner.</p>}</article>
        <article><h4>Contact history</h4>{owner.contactHistory.map((contact) => <div key={contact.id}><strong>{contact.contactDateTime} · {contact.channel}</strong><span>{contact.reasonForContact}</span><small>{contact.assistanceProvided}</small></div>)}{!owner.contactHistory.length && <p>No owner contact-history record is available.</p>}</article>
      </div>
      <nav className="mobile-intel-related-routes" aria-label="Owner related tools">
        {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openOwnerTool('Identity Intel / People Search')}>Open Identity Information</button>}
        {available.has('Device Intelligence') && <button type="button" onClick={() => openOwnerTool('Device Intelligence')}>Open Device History</button>}
        {available.has('Login History') && <button type="button" onClick={() => openOwnerTool('Login History')}>Open Login History</button>}
        {available.has('Session History') && <button type="button" onClick={() => openOwnerTool('Session History')}>Open Session History</button>}
      </nav>
    </section>
  );
}

function MobileBusinessAccountDetail({ account, onClose }) {
  return (
    <section className="business-360-account-detail mobile-intel-card" aria-label={`Account detail for ${account.maskedAccountId}`}>
      <IntelCardHeader icon="report" eyebrow="Account relationship" title={account.productLabel} action={<button type="button" onClick={onClose}>Close</button>} />
      <FieldGrid fields={[
        ['Account ID', account.maskedAccountId],
        ['Product type', account.productLabel],
        ['Open date', account.openDate],
        ['Status', account.status],
        ['Current balance', formatMoney(account.currentBalance)],
        ['Available balance', formatMoney(account.availableBalance)],
        ['Available credit', formatMoney(account.availableCredit)],
        ['Credit limit', formatMoney(account.creditLimit)],
        ['Original loan amount', formatMoney(account.originalLoanAmount)],
        ['Scheduled / minimum payment', formatMoney(account.scheduledPayment)],
        ['Next payment due', account.nextPaymentDueDate ?? 'Not applicable'],
        ['Payment status', account.paymentStatus],
        ['Past-due amount', formatMoney(account.pastDueAmount)],
        ['Restrictions', account.restrictions],
        ['Holds', account.holds],
      ]} />
    </section>
  );
}

function BusinessDetailSection({
  accountId,
  activeTab,
  available,
  dossier,
  exportReport,
  generateReport,
  openTool,
  ownerId,
  report,
  reportGenerated,
  setAccountId,
  setOwnerId,
}) {
  const selectedOwner = dossier.owners.find((owner) => owner.id === ownerId);
  const selectedAccount = dossier.accounts.find((account) => account.accountId === accountId);

  if (activeTab === 'overview') {
    return <section className="business-360-section mobile-intel-card" aria-labelledby="business-information-heading"><IntelCardHeader icon="business" eyebrow="Persistent company record" title="Business Information" /><div id="business-information-heading"><BusinessProfileFields dossier={dossier} /></div></section>;
  }
  if (activeTab === 'owners') {
    return (
      <section className="business-360-section mobile-intel-card" aria-labelledby="business-owners-heading">
        <IntelCardHeader icon="people" eyebrow="People remain separate from the entity" title="Owners and Controlling Parties" />
        <div id="business-owners-heading" className="business-360-owner-list mobile-business-card-list">
          {dossier.owners.map((owner) => <article key={owner.id} data-business-owner={owner.id}><span>{owner.trainingId}</span><h4>{owner.fullLegalName}</h4><p>{owner.businessTitle} · {owner.ownershipPercentage}</p><small>{owner.currentResidentialAddress}</small><strong>{owner.addressComparison}</strong><button type="button" onClick={() => setOwnerId(owner.id)}>Open Owner Profile</button></article>)}
        </div>
        {!dossier.owners.length && <p>No owner or controlling-party record is available in this business profile.</p>}
        {selectedOwner && <MobileBusinessOwnerDetail owner={selectedOwner} onClose={() => setOwnerId('')} openTool={openTool} available={available} />}
      </section>
    );
  }
  if (activeTab === 'accounts') {
    return (
      <section className="business-360-section mobile-intel-card" aria-labelledby="business-accounts-heading">
        <IntelCardHeader icon="report" eyebrow="Institution relationship" title="Business Accounts and Products" />
        <div id="business-accounts-heading" className="business-360-account-list mobile-business-card-list">
          {dossier.accounts.map((account) => <article key={account.accountId} data-business-account={account.accountId}><span>{account.productLabel}</span><h4>{account.maskedAccountId}</h4><p>{account.status}</p><small>{formatMoney(account.currentBalance)} current · {formatMoney(account.availableBalance ?? account.availableCredit)} available</small><button type="button" onClick={() => setAccountId(account.accountId)}>Open Account</button></article>)}
        </div>
        {!dossier.accounts.length && <p>No institution account snapshot is available in this business profile.</p>}
        {selectedAccount && <MobileBusinessAccountDetail account={selectedAccount} onClose={() => setAccountId('')} />}
      </section>
    );
  }
  if (activeTab === 'updates') {
    return <section className="business-360-section mobile-intel-card" aria-labelledby="business-updates-heading"><IntelCardHeader icon="report" eyebrow="Recorded maintenance history" title="Business Profile Updates" /><div id="business-updates-heading" className="business-360-update-list mobile-business-record-list">{dossier.profileUpdates.map((update) => <article key={update.id}><span>{update.dateTime}</span><h4>{update.updateType}</h4><FieldGrid fields={[['Previous value', update.previousValue], ['New value', update.newValue], ['Channel', update.channel], ['Source', update.source], ['User', update.user], ['Session', update.linkedSession], ['Device', update.linkedDevice]]} /></article>)}{!dossier.profileUpdates.length && <p className="investigation-tool-empty" role="status">No business profile-update record is available.</p>}</div></section>;
  }
  if (activeTab === 'access') {
    return (
      <section className="business-360-section mobile-intel-card" aria-labelledby="business-access-heading">
        <IntelCardHeader icon="identity" eyebrow="Authorized access summary" title="Trusted Business Access and Security" />
        <div id="business-access-heading" className="business-360-access-grid mobile-business-support-grid">
          <article><h4>Authorized business users</h4>{dossier.access.authorizedUsers.map((user) => <div key={user.id}><strong>{user.name}</strong><span>{user.role}</span><small>{user.permissions} · {user.mfaMethod} · Last login {user.lastSuccessfulLogin}</small></div>)}{!dossier.access.authorizedUsers.length && <p className="investigation-tool-empty" role="status">No authorized-business-user record is available.</p>}</article>
          <article><h4>Trusted devices</h4>{dossier.access.trustedDevices.map((device) => <div key={device.deviceId}><strong>{device.deviceName}</strong><span>{device.deviceId} · {device.browserOrOperatingSystem}</span><small>{device.trustStatus} · {device.mfaMethod}</small></div>)}{!dossier.access.trustedDevices.length && <p className="investigation-tool-empty" role="status">No trusted-device record is available.</p>}</article>
          <article><h4>Password, access, and administrator updates</h4>{dossier.access.passwordOrAccessResets.length ? dossier.access.passwordOrAccessResets.map((update) => <div key={update.id}><strong>{update.updateType}</strong><span>{update.dateTime}</span><small>{update.previousValue} → {update.newValue}</small></div>) : <p>No password, access-reset, or administrator-change record is supplied.</p>}</article>
        </div>
        <nav className="mobile-intel-related-routes" aria-label="Business access history routes">{available.has('Login History') && <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>}{available.has('Session History') && <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>}{available.has('Device Intelligence') && <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device History</button>}</nav>
      </section>
    );
  }
  if (activeTab === 'contact') {
    return <section className="business-360-section mobile-intel-card" aria-labelledby="business-contact-heading"><IntelCardHeader icon="note" eyebrow="Service and relationship records" title="Business Contact and Service Notes" /><div id="business-contact-heading" className="business-360-contact-list mobile-business-record-list">{dossier.contactNotes.map((contact) => <article key={contact.id}><span>{contact.contactDate} · {contact.contactChannel}</span><h4>{contact.personContacted} · {contact.businessRole}</h4><FieldGrid fields={[['Reason for contact', contact.reasonForContact], ['Information supplied', contact.informationSupplied], ['Assistance provided', contact.assistanceProvided], ['Documents requested', contact.documentsRequested], ['Follow-up status', contact.followUpStatus], ['Agent / department', contact.agentOrDepartment]]} /></article>)}{!dossier.contactNotes.length && <p className="investigation-tool-empty" role="status">No business contact-history record is available.</p>}</div></section>;
  }
  if (activeTab === 'payroll' && dossier.payrollRelationship) {
    return (
      <section className="business-360-section mobile-intel-card" aria-labelledby="business-payroll-heading">
        <IntelCardHeader icon="payroll" eyebrow="Product relationship summary" title="Payroll Relationship" />
        <div id="business-payroll-heading"><FieldGrid fields={[
          ['Payroll account status', dossier.payrollRelationship.payrollAccountStatus],
          ['Payroll customer since', dossier.payrollRelationship.payrollCustomerSince],
          ['Pay schedule', dossier.payrollRelationship.paySchedule],
          ['Next scheduled payroll', dossier.payrollRelationship.nextScheduledPayroll],
          ['Active employee count', dossier.payrollRelationship.activeEmployeeCount],
          ['Last completed payroll date', dossier.payrollRelationship.lastCompletedPayrollDate],
          ['Last payroll amount', dossier.payrollRelationship.lastPayrollAmount],
          ['Average monthly payroll', dossier.payrollRelationship.averageMonthlyPayroll],
          ['Payroll funding status', dossier.payrollRelationship.payrollFundingStatus],
          ['Payroll administrator', dossier.payrollRelationship.payrollAdministrator],
          ['Authorized payroll users', dossier.payrollRelationship.authorizedPayrollUsers.join(' · ') || 'No authorized user supplied'],
          ['Employer tax-profile status', dossier.payrollRelationship.employerTaxProfileStatus],
        ]} /></div>
        <nav className="mobile-intel-related-routes" aria-label="Payroll relationship routes">{available.has('Payroll History') && <button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button>}{available.has('Employee Profile') && <button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Roster</button>}</nav>
      </section>
    );
  }
  return (
    <section className="business-360-section mobile-intel-card" aria-labelledby="luna-business-research-heading">
      <IntelCardHeader icon="search" eyebrow="Factual source comparison · separate from Luna Debrief" title="Luna Business Research" />
      <p id="luna-business-research-heading" className="business-360-research-note">A missing or conflicting record is a source result, not proof that the business does not exist and not a conclusion about the active review.</p>
      <div className="business-360-research-list mobile-business-research-list">{dossier.researchChecks.map((check) => <article key={check.id} data-research-status={check.status}><span>{check.status}</span><h4>{check.subject}</h4><p>{check.detail}</p><small>{check.sourceChecked} · Checked {check.dateChecked}</small></article>)}</div>
      <div className="business-360-report-actions mobile-intel-inline-actions">
        <button type="button" onClick={generateReport}>{reportGenerated ? 'Regenerate Business 360 report' : 'Generate Business 360 report'}</button>
        {report && <button type="button" onClick={exportReport}><IntelGlyph type="download" size={18} />Export report</button>}
      </div>
    </section>
  );
}

export function MobileBusinessIntelligencePage({
  accountId,
  activeTab,
  available,
  backToToolMap,
  businessNameDraft,
  business360Content,
  clearSearch,
  dossier,
  exportReport,
  generateReport,
  jumpDecision,
  markReviewed,
  openTool,
  ownerId,
  pin,
  report,
  reportGenerated,
  reportOpen,
  reviewed,
  runSearch,
  saveNote,
  searchHistory,
  searchMatched,
  searchMode,
  searchReady,
  secondaryDraft,
  setAccountId,
  setActiveTab,
  setBusinessNameDraft,
  setOwnerId,
  setReportOpen,
  setSearchMode,
  setSecondaryDraft,
  submittedSearch,
}) {
  const { profile } = dossier;
  const mode = businessIntelSearchModes[searchMode];
  const tabs = [
    ['overview', 'Business Information'],
    ['owners', 'Owners & Control'],
    ['accounts', 'Accounts & Products'],
    ['updates', 'Profile Updates'],
    ['access', 'Access & Security'],
    ['contact', 'Contact History'],
    ...(dossier.payrollRelationship ? [['payroll', 'Payroll Relationship']] : []),
    ['research', 'Luna Business Research'],
  ];
  const statusCounts = dossier.researchChecks.reduce((counts, check) => {
    counts[check.status] = (counts[check.status] ?? 0) + 1;
    return counts;
  }, {});
  const coverageTotal = dossier.researchChecks.length;

  if (reportOpen && business360Content) {
    return (
      <section
        className="business-360-dossier mobile-intel-reference-page mobile-business-intel-reference mobile-business-360-stage"
        data-business-360-profile={profile.registrationFileNumber}
        data-business-intelligence-screen="reference-v1"
        data-business-intelligence-stage="business-360"
        data-mobile-business-intel-reference="true"
      >
        <IntelHeader
          backLabel="Back to Business Intelligence"
          icon="business"
          onBack={() => setReportOpen(false)}
          routeLabel="Business 360"
          title="Business 360"
          subtitle="Matched company relationship, products, owners, payroll, and factual source records."
        />
        {business360Content}
        <nav className="investigation-tool-next-routes mobile-intel-related-routes" aria-label="Business 360 workflow actions">
          {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openTool('Identity Intel / People Search')}>Open Identity Information</button>}
          {available.has('Login History') && <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>}
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </nav>
        <footer className="investigation-tool-review-bar mobile-intel-review-bar">
          <div><strong>Business Intelligence review</strong><span>Record source coverage only after searching and inspecting this matched company record.</span></div>
          <button type="button" className={reviewed ? '' : 'primary'} onClick={() => { saveNote(`Business 360 relationship reviewed for ${profile.legalName}.`, 'Business 360'); markReviewed('Business 360'); }}>
            {reviewed ? '✓ Business Intelligence reviewed' : 'Mark Business Intelligence reviewed'}
          </button>
        </footer>
      </section>
    );
  }

  return (
    <section
      className="business-360-dossier mobile-intel-reference-page mobile-business-intel-reference"
      data-business-360-profile={searchMatched ? profile.registrationFileNumber : undefined}
      data-business-intelligence-screen="reference-v1"
      data-business-intelligence-stage="search"
      data-mobile-business-intel-reference="true"
    >
      <IntelHeader
        onBack={backToToolMap}
        icon="business"
        routeLabel="Business 360"
        title="Business Intelligence"
        subtitle="Search the company record before opening business Intel."
      />

      <form className="mobile-intel-search-card" aria-label="Business Intelligence search" onSubmit={runSearch}>
        <IntelCardHeader icon="search" eyebrow="Step 1 · Business lookup" title="Run Business Search" action={<em>{submittedSearch ? 'Search run' : 'Intel locked'}</em>} />
        <div className="mobile-intel-search-fields">
          <label>
            <span>Search method</span>
            <select value={searchMode} onChange={(event) => { setSearchMode(event.target.value); setSecondaryDraft(''); }} aria-label="Choose Business Intelligence search method">
              {Object.entries(businessIntelSearchModes).map(([value, item]) => <option key={value} value={value}>Business name + {item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Legal business name</span>
            <input value={businessNameDraft} onChange={(event) => setBusinessNameDraft(event.target.value)} placeholder="Enter the exact legal business name" aria-label="Search Business Intelligence by legal business name" />
          </label>
          <label>
            <span>{mode.label}</span>
            <input value={secondaryDraft} onChange={(event) => setSecondaryDraft(event.target.value)} placeholder={mode.placeholder} aria-label={`Search Business Intelligence by ${mode.label}`} />
          </label>
        </div>
        <p>Use values from the case packet, Payment Verification, or the company relationship record. Both fields must match the same fictional business.</p>
        <div className="mobile-intel-search-actions">
          <button type="submit" className="primary" disabled={!searchReady}>Run Business Search</button>
          <button type="button" onClick={clearSearch}>Clear</button>
        </div>
      </form>

      {!submittedSearch && <IntelGate title="Business Intel hidden until a search is run." text="Enter the legal name plus one exact business identifier before opening the company record." />}
      {submittedSearch && !searchMatched && <IntelGate tone="no-match" title="No matching fictional business returned." text="The legal name and secondary value did not resolve to the same company record. Check the source values and search again." />}

      {searchMatched && (
        <>
          <section className="mobile-intel-subject-hero mobile-business-profile-summary" aria-label="Business Match Summary">
            <header>
              <div><span className="mobile-intel-avatar"><IntelGlyph type="business" size={30} /></span><div><p>Business Match Summary</p><h3>{profile.legalName}</h3><small>{profile.entityType} · {profile.standing}</small></div></div>
              <span className="mobile-intel-result-chip">Record returned</span>
            </header>
            <div className="mobile-intel-record-chips"><span>Training Business ID: {profile.registrationFileNumber}</span><span>{profile.formationState} · {profile.formationDate}</span></div>
            <FieldGrid fields={[
              ['Legal business name', profile.legalName],
              ['Training Business ID', profile.registrationFileNumber],
              ['Entity / industry', `${profile.entityType} · ${profile.industry}`],
              ['Operating address', profile.operatingAddress],
              ['Business contact', `${profile.phone} · ${profile.email}`],
              ['Website', profile.website],
            ]} />
            <div className="mobile-intel-inline-actions">
              <button type="button" onClick={() => pin(`${profile.registrationFileNumber} | ${profile.legalName}`)}><IntelGlyph type="pin" size={18} />Pin business</button>
              <button type="button" onClick={() => saveNote(`Business Match Summary reviewed for ${profile.legalName}.`, 'Business 360')}><IntelGlyph type="note" size={18} />Save summary note</button>
              <button type="button" className="primary" onClick={() => setReportOpen(true)}><IntelGlyph type="report" size={18} />Open Business 360</button>
            </div>
          </section>

          <div className="mobile-intel-two-column">
            <section className="mobile-intel-card">
              <IntelCardHeader icon="business" eyebrow="Company relationship record" title="Business Profile" action={<em>{dossier.owners.length} owners</em>} />
              <FieldGrid fields={[
                ['Business name', profile.legalName],
                ['Legal entity type', profile.entityType],
                ['Owners / principals', `${dossier.owners.length} recorded`],
                ['Website', profile.website],
                ['Address', profile.operatingAddress],
                ['Business phone', profile.phone],
              ]} />
            </section>
            <section className="mobile-intel-card">
              <IntelCardHeader icon="license" eyebrow="Registration identifiers" title="License & EIN" />
              <FieldGrid fields={[
                ['Masked EIN', profile.maskedEin],
                ['State registration', profile.registrationFileNumber],
                ['Formation state', profile.formationState],
                ['Industry', profile.industry],
                ['NAICS', profile.naics],
                ['Standing', profile.standing],
              ]} />
            </section>
          </div>

          <section className="mobile-intel-card mobile-business-payroll-summary">
            <IntelCardHeader icon="payroll" eyebrow="Recorded product relationship" title="Payroll / Direct Deposit History" action={<em>{dossier.payrollRelationship ? 'Record available' : 'No payroll record'}</em>} />
            {dossier.payrollRelationship ? <FieldGrid fields={[
              ['Payroll account status', dossier.payrollRelationship.payrollAccountStatus],
              ['Average monthly payroll', dossier.payrollRelationship.averageMonthlyPayroll],
              ['Active employee count', dossier.payrollRelationship.activeEmployeeCount],
              ['Last completed payroll', dossier.payrollRelationship.lastCompletedPayrollDate],
              ['Last payroll amount', dossier.payrollRelationship.lastPayrollAmount],
              ['Funding status', dossier.payrollRelationship.payrollFundingStatus],
            ]} /> : <p>No payroll relationship is supplied for this company record. This is a source-coverage result, not a case conclusion.</p>}
          </section>

          <div className="mobile-intel-two-column">
            <section className="mobile-intel-card">
              <IntelCardHeader icon="people" eyebrow="Current company relationship" title="Employee Roster Snapshot" />
              <FieldGrid fields={[
                ['Estimated employees', profile.estimatedEmployeeCount],
                ['Authorized business users', dossier.access.authorizedUsers.length],
                ['Owners / controlling parties', dossier.owners.length],
                ['Trusted business devices', dossier.access.trustedDevices.length],
                ['Recorded contact notes', dossier.contactNotes.length],
              ]} />
            </section>
            <section className="mobile-intel-card">
              <IntelCardHeader icon="report" eyebrow="Neutral source findings" title="Verification Notes" action={<em>{coverageTotal} checks</em>} />
              <div className="mobile-business-verification-list">
                {dossier.researchChecks.slice(0, 5).map((check) => <span key={check.id}><strong>{check.subject}</strong><small>{check.status}</small></span>)}
                {!dossier.researchChecks.length && <p>No separate research check was supplied.</p>}
              </div>
            </section>
          </div>

          <section className="mobile-intel-card mobile-business-source-coverage" aria-label="Business source coverage">
            <IntelCardHeader icon="report" eyebrow="Factual lookup coverage" title="Business Source Coverage" action={<em>{coverageTotal} checks</em>} />
            <div>
              {Object.entries(statusCounts).map(([status, count]) => <article key={status}><strong>{count}</strong><span>{status}</span></article>)}
              {!coverageTotal && <p>No separate source check was supplied in the current training record.</p>}
            </div>
            <p>These are source-return statuses only. They do not score the business or recommend a decision.</p>
          </section>

          {!reportOpen && <IntelGate icon="report" title="Business Match Summary returned." text="Review the company facts, then open Detailed Business Intel for owners, accounts, access, payroll, research, and report actions." />}

          {reportOpen && (
            <>
              <section className="mobile-intel-card mobile-business-search-history" aria-label="Business Search history">
                <IntelCardHeader icon="search" eyebrow="Search history" title="Criteria used for this company" />
                <div>{searchHistory.map((item, index) => <span key={`${item}-${index}`}><strong>{index ? 'Previous search' : 'Current search'}</strong><small>{item}</small></span>)}</div>
              </section>
              {business360Content ?? (
                <>
                  <nav className="business-360-tabs mobile-business-intel-tabs" aria-label="Business 360 sections" role="tablist">
                    {tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'active' : ''} onClick={() => { setActiveTab(id); setOwnerId(''); setAccountId(''); }}>{label}</button>)}
                  </nav>
                  <BusinessDetailSection
                    accountId={accountId}
                    activeTab={activeTab}
                    available={available}
                    dossier={dossier}
                    exportReport={exportReport}
                    generateReport={generateReport}
                    openTool={openTool}
                    ownerId={ownerId}
                    report={report}
                    reportGenerated={reportGenerated}
                    setAccountId={setAccountId}
                    setOwnerId={setOwnerId}
                  />
                </>
              )}
            </>
          )}
        </>
      )}

      <nav className="investigation-tool-next-routes mobile-intel-related-routes" aria-label="Business 360 related tools">
        {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openTool('Identity Intel / People Search')}>Open Identity Information</button>}
        {available.has('Login History') && <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>
      <footer className="investigation-tool-review-bar mobile-intel-review-bar">
        <div><strong>Business Intelligence review</strong><span>Search and inspect the detailed company record before recording source coverage.</span></div>
        <button type="button" className={reviewed ? '' : 'primary'} disabled={!searchMatched || !reportOpen} onClick={() => { saveNote(`Business 360 relationship reviewed for ${profile.legalName}.`, 'Business 360'); markReviewed('Business 360'); }}>
          {reviewed ? '✓ Business Intelligence reviewed' : 'Mark Business Intelligence reviewed'}
        </button>
      </footer>
    </section>
  );
}
