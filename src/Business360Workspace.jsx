import { useEffect, useMemo, useState } from 'react';
import { MobileBusinessIntelligencePage } from './MobileIdentityBusinessIntelPages.jsx';
import { MobileBusiness360Reference } from './Mobile360ReferencePages.jsx';
import { getBusiness360Dossier } from './data/business360Dossier.js';
import {
  businessIntelSearchModes,
  businessIntelSearchLabel,
  matchesBusinessIntelSearch,
  prefillBusinessIntelSearch,
} from './data/businessIntelSearch.js';
import {
  business360ReportExportText,
  generateBusiness360Report,
  hasGeneratedBusiness360Report,
} from './data/kybReviewReport.js';
import { formatMoney } from './data/relationshipAccounts.js';
import { readStorage, writeStorage } from './visualWorkspaceModel.js';

const businessIntelWorkspaceStorageKey = 'fraud-academy-business-intel-workspace-v1';

function readBusinessIntelWorkspace(caseId) {
  const storedByCase = readStorage(businessIntelWorkspaceStorageKey, {});
  const stored = storedByCase?.[caseId];
  return {
    relationshipId: typeof stored?.relationshipId === 'string' ? stored.relationshipId : '',
    submittedSearch: stored?.submittedSearch ?? null,
    searchHistory: Array.isArray(stored?.searchHistory)
      ? stored.searchHistory.filter((item) => typeof item === 'string').slice(0, 4)
      : [],
    intelReportOpen: Boolean(stored?.intelReportOpen),
  };
}

function writeBusinessIntelWorkspace(caseId, workspace) {
  const storedByCase = readStorage(businessIntelWorkspaceStorageKey, {});
  writeStorage(businessIntelWorkspaceStorageKey, {
    ...storedByCase,
    [caseId]: workspace,
  });
}

function restoredBusinessIntelWorkspace(dossier, routedSearch, routedRelationshipId, stored) {
  const storedSearch = matchesBusinessIntelSearch(dossier, stored.submittedSearch)
    ? stored.submittedSearch
    : null;
  const submittedSearch = routedSearch ?? storedSearch;
  const searchHistory = submittedSearch
    ? [
        ...(routedSearch ? [businessIntelSearchLabel(routedSearch)] : []),
        ...(storedSearch ? stored.searchHistory : []),
        ...(!routedSearch && storedSearch && !stored.searchHistory.length
          ? [businessIntelSearchLabel(storedSearch)]
          : []),
      ].filter((item, index, all) => all.indexOf(item) === index).slice(0, 4)
    : [];
  return {
    relationshipId: routedRelationshipId || stored.relationshipId || '',
    submittedSearch,
    searchHistory,
    intelReportOpen: Boolean(stored.intelReportOpen && storedSearch),
  };
}

function downloadBusiness360Report(report) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([business360ReportExportText(report)], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${report.id}.txt`;
  link.click();
  window.URL.revokeObjectURL(url);
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

function AccountFields({ account }) {
  return (
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
  );
}

function OwnerProfile({ owner, onClose, openTool, available }) {
  const openOwnerTool = (toolName) => {
    openTool(toolName, 'investigate', { query: owner.trainingId });
  };

  return (
    <section className="business-360-owner-profile" aria-label={`Owner profile for ${owner.fullLegalName}`}>
      <header>
        <div><p>Personal relationship profile</p><h3>{owner.fullLegalName}</h3><span>{owner.businessTitle} · {owner.ownershipPercentage}</span></div>
        <button type="button" onClick={onClose}>Close Owner Profile</button>
      </header>
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

      <div className="business-360-owner-detail-grid">
        <article>
          <p>Personal accounts</p>
          {owner.accounts.map((account) => (
            <div key={account.accountId}>
              <strong>{account.productLabel} · {account.maskedAccountId}</strong>
              <span>{account.status} · {formatMoney(account.currentBalance)}</span>
              <small>{account.paymentStatus}</small>
            </div>
          ))}
          {!owner.accounts.length && <p>No personal account record is available for this owner.</p>}
        </article>
        <article>
          <p>Trusted security</p>
          {owner.trustedDevices.map((device) => (
            <div key={device.deviceId}>
              <strong>{device.deviceName}</strong>
              <span>{device.deviceId} · {device.browserOrOperatingSystem}</span>
              <small>{device.trustStatus} · {device.mfaMethod}</small>
            </div>
          ))}
          {!owner.trustedDevices.length && <p>No trusted-device summary is available for this owner.</p>}
        </article>
        <article>
          <p>Contact history</p>
          {owner.contactHistory.map((contact) => (
            <div key={contact.id}>
              <strong>{contact.contactDateTime} · {contact.channel}</strong>
              <span>{contact.reasonForContact}</span>
              <small>{contact.assistanceProvided}</small>
            </div>
          ))}
          {!owner.contactHistory.length && <p>No owner contact-history record is available.</p>}
        </article>
      </div>

      <nav aria-label="Owner related tools">
        {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openOwnerTool('Identity Intel / People Search')}>Open Identity Information</button>}
        {available.has('Device Intelligence') && <button type="button" onClick={() => openOwnerTool('Device Intelligence')}>Open Device History</button>}
        {available.has('Login History') && <button type="button" onClick={() => openOwnerTool('Login History')}>Open Login History</button>}
        {available.has('Session History') && <button type="button" onClick={() => openOwnerTool('Session History')}>Open Session History</button>}
      </nav>
    </section>
  );
}

export default function Business360Workspace({
  activeCase,
  backToToolMap,
  query = '',
  setQuery,
  pin,
  saveNote,
  markReviewed,
  notes = [],
  reviewed,
  openTool,
  jumpDecision,
  quickPin,
  mobileMode = false,
}) {
  const [intelWorkspace, setIntelWorkspace] = useState(
    () => readBusinessIntelWorkspace(activeCase.id),
  );
  const dossierRelationshipId = String(query).trim() || intelWorkspace.relationshipId;
  const dossier = useMemo(
    () => getBusiness360Dossier(activeCase, { relationshipId: dossierRelationshipId }),
    [activeCase, dossierRelationshipId],
  );
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
  const [activeTab, setActiveTab] = useState('overview');
  const [ownerId, setOwnerId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [report, setReport] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(() => hasGeneratedBusiness360Report(activeCase.id));
  const [intelSearchMode, setIntelSearchMode] = useState('businessId');
  const [businessNameDraft, setBusinessNameDraft] = useState('');
  const [secondaryDraft, setSecondaryDraft] = useState('');
  const { submittedSearch, searchHistory, intelReportOpen } = intelWorkspace;
  const selectedOwner = dossier.owners.find((owner) => owner.id === ownerId);
  const selectedAccount = dossier.accounts.find((account) => account.accountId === accountId);
  const available = new Set(activeCase.availableTools ?? []);
  const searchMatched = submittedSearch && matchesBusinessIntelSearch(dossier, submittedSearch);
  const searchReady = Boolean(businessNameDraft.trim() && secondaryDraft.trim());

  useEffect(() => {
    const prefill = prefillBusinessIntelSearch(dossier, query);
    const restoredWorkspace = restoredBusinessIntelWorkspace(
      dossier,
      prefill,
      String(query).trim(),
      readBusinessIntelWorkspace(activeCase.id),
    );
    setActiveTab('overview');
    setOwnerId('');
    setAccountId('');
    setReport(null);
    setReportGenerated(hasGeneratedBusiness360Report(activeCase.id));
    setIntelSearchMode(restoredWorkspace.submittedSearch?.mode ?? 'businessId');
    setBusinessNameDraft(restoredWorkspace.submittedSearch?.businessName ?? '');
    setSecondaryDraft(restoredWorkspace.submittedSearch?.secondary ?? '');
    setIntelWorkspace(restoredWorkspace);
    writeBusinessIntelWorkspace(activeCase.id, restoredWorkspace);
    if (String(query).trim()) setQuery?.('');
  }, [activeCase.id, dossier, query, setQuery]);

  function runIntelSearch(event) {
    event?.preventDefault();
    if (!searchReady) return;
    const criteria = {
      mode: intelSearchMode,
      businessName: businessNameDraft.trim(),
      secondary: secondaryDraft.trim(),
    };
    const label = businessIntelSearchLabel(criteria);
    const nextWorkspace = {
      relationshipId: intelWorkspace.relationshipId,
      submittedSearch: criteria,
      searchHistory: [label, ...searchHistory.filter((item) => item !== label)].slice(0, 4),
      intelReportOpen: false,
    };
    setIntelWorkspace(nextWorkspace);
    writeBusinessIntelWorkspace(activeCase.id, nextWorkspace);
    setActiveTab('overview');
    setOwnerId('');
    setAccountId('');
  }

  function clearIntelSearch() {
    setBusinessNameDraft('');
    setSecondaryDraft('');
    const nextWorkspace = {
      relationshipId: '',
      submittedSearch: null,
      searchHistory: [],
      intelReportOpen: false,
    };
    setIntelWorkspace(nextWorkspace);
    writeBusinessIntelWorkspace(activeCase.id, nextWorkspace);
    setActiveTab('overview');
    setOwnerId('');
    setAccountId('');
  }

  function setPersistedIntelReportOpen(nextValue) {
    const nextWorkspace = {
      ...intelWorkspace,
      intelReportOpen: Boolean(
        typeof nextValue === 'function'
          ? nextValue(intelReportOpen)
          : nextValue,
      ),
    };
    setIntelWorkspace(nextWorkspace);
    writeBusinessIntelWorkspace(activeCase.id, nextWorkspace);
  }

  function generateReport() {
    const nextReport = generateBusiness360Report(activeCase);
    setReport(nextReport);
    setReportGenerated(true);
    saveNote(`Business 360 Research Report generated for ${dossier.profile.legalName}.`, 'Business 360');
  }

  const intelSearchDefinition = businessIntelSearchModes[intelSearchMode];

  if (mobileMode) {
    return (
      <MobileBusinessIntelligencePage
        accountId={accountId}
        activeTab={activeTab}
        available={available}
        backToToolMap={backToToolMap}
        businessNameDraft={businessNameDraft}
        business360Content={(
          <MobileBusiness360Reference
            activeCase={activeCase}
            notes={notes}
            openTool={openTool}
            query={intelWorkspace.relationshipId || submittedSearch?.secondary || query}
            quickPin={quickPin}
            saveNote={saveNote}
          />
        )}
        clearSearch={clearIntelSearch}
        dossier={dossier}
        exportReport={() => report && downloadBusiness360Report(report)}
        generateReport={generateReport}
        jumpDecision={jumpDecision}
        markReviewed={markReviewed}
        openTool={openTool}
        ownerId={ownerId}
        pin={pin}
        report={report}
        reportGenerated={reportGenerated}
        reportOpen={intelReportOpen}
        reviewed={reviewed}
        runSearch={runIntelSearch}
        saveNote={saveNote}
        searchHistory={searchHistory}
        searchMatched={searchMatched}
        searchMode={intelSearchMode}
        searchReady={searchReady}
        secondaryDraft={secondaryDraft}
        setAccountId={setAccountId}
        setActiveTab={setActiveTab}
        setBusinessNameDraft={setBusinessNameDraft}
        setOwnerId={setOwnerId}
        setReportOpen={setPersistedIntelReportOpen}
        setSearchMode={setIntelSearchMode}
        setSecondaryDraft={setSecondaryDraft}
        submittedSearch={submittedSearch}
      />
    );
  }

  if (!intelReportOpen) {
    return (
      <section
        className="business-360-dossier business-intelligence-search-stage"
        data-business-intelligence-screen="reference-v1"
        data-business-intelligence-stage="search"
      >
        <header className="business-360-profile">
          <div>
            <p>Business lookup · Evidence First</p>
            <h3>Business Intelligence</h3>
            <span>Search the company record before opening Business 360.</span>
          </div>
        </header>

        <form className="business-360-section" aria-label="Business Intelligence search" onSubmit={runIntelSearch}>
          <header>
            <p>Step 1 · Business lookup</p>
            <h3>Run Business Search</h3>
          </header>
          <label>
            <span>Search method</span>
            <select
              value={intelSearchMode}
              onChange={(event) => {
                setIntelSearchMode(event.target.value);
                setSecondaryDraft('');
              }}
              aria-label="Choose Business Intelligence search method"
            >
              {Object.entries(businessIntelSearchModes).map(([value, item]) => (
                <option key={value} value={value}>Business name + {item.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Legal business name</span>
            <input
              value={businessNameDraft}
              onChange={(event) => setBusinessNameDraft(event.target.value)}
              placeholder="Enter the exact legal business name"
              aria-label="Search Business Intelligence by legal business name"
            />
          </label>
          <label>
            <span>{intelSearchDefinition.label}</span>
            <input
              value={secondaryDraft}
              onChange={(event) => setSecondaryDraft(event.target.value)}
              placeholder={intelSearchDefinition.placeholder}
              aria-label={`Search Business Intelligence by ${intelSearchDefinition.label}`}
            />
          </label>
          <p>Both fields must match the same fictional business. A returned record is source evidence, not a case conclusion.</p>
          <div>
            <button type="submit" disabled={!searchReady}>Run Business Search</button>
            <button type="button" onClick={clearIntelSearch}>Clear</button>
          </div>
        </form>

        {!submittedSearch && (
          <section className="business-360-section" role="status">
            <header><p>Search required</p><h3>Business Intel hidden until a search is run.</h3></header>
            <p>Enter the legal name plus one exact business identifier before opening the company record.</p>
          </section>
        )}

        {submittedSearch && !searchMatched && (
          <section className="business-360-section" role="status">
            <header><p>No exact match</p><h3>No matching fictional business returned.</h3></header>
            <p>The legal name and secondary value did not resolve to the same company record. Check the source values and search again.</p>
          </section>
        )}

        {searchMatched && (
          <section className="business-360-section" aria-label="Business Match Summary">
            <header>
              <p>Business Match Summary</p>
              <h3>{dossier.profile.legalName}</h3>
              <span>{dossier.profile.entityType} · {dossier.profile.standing}</span>
            </header>
            <FieldGrid fields={[
              ['Legal business name', dossier.profile.legalName],
              ['Training Business ID', dossier.profile.registrationFileNumber],
              ['Formation state', dossier.profile.formationState],
              ['Operating address', dossier.profile.operatingAddress],
              ['Business phone', dossier.profile.phone],
            ]} />
            <div>
              <button type="button" onClick={() => pin(`${dossier.profile.registrationFileNumber} | ${dossier.profile.legalName}`)}>Pin business</button>
              <button type="button" onClick={() => saveNote(`Business Match Summary reviewed for ${dossier.profile.legalName}.`, 'Business 360')}>Save summary note</button>
              <button type="button" onClick={() => setPersistedIntelReportOpen(true)}>Open Business 360</button>
            </div>
          </section>
        )}
      </section>
    );
  }

  return (
    <section
      className="business-360-dossier"
      data-business-360-profile={dossier.profile.registrationFileNumber}
      data-business-intelligence-screen="reference-v1"
      data-business-intelligence-stage="business-360"
    >
      <header className="business-360-profile">
        <div>
          <p>Company relationship profile · Evidence First</p>
          <h3>{dossier.profile.legalName}</h3>
          <span>{dossier.profile.dba} · {dossier.profile.entityType} · {dossier.profile.standing}</span>
        </div>
        <button type="button" onClick={() => setPersistedIntelReportOpen(false)}>Back to Business Intelligence</button>
        <button type="button" onClick={() => pin(`${dossier.profile.registrationFileNumber} | ${dossier.profile.legalName}`)}>Pin business</button>
      </header>
      {dossier.coverageNotice && <p className="business-360-coverage-notice">{dossier.coverageNotice}</p>}

      <nav className="business-360-tabs" aria-label="Business 360 sections" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="business-360-section" aria-labelledby="business-information-heading">
          <header><p>Persistent company record</p><h3 id="business-information-heading">Business Information</h3></header>
          <FieldGrid fields={[
            ['Legal business name', dossier.profile.legalName],
            ['DBA', dossier.profile.dba],
            ['Entity type', dossier.profile.entityType],
            ['Masked EIN', dossier.profile.maskedEin],
            ['Formation date', dossier.profile.formationDate],
            ['Formation state', dossier.profile.formationState],
            ['State registration / file number', dossier.profile.registrationFileNumber],
            ['Business standing', dossier.profile.standing],
            ['Industry', dossier.profile.industry],
            ['NAICS', dossier.profile.naics],
            ['Physical operating address', dossier.profile.operatingAddress],
            ['Mailing address', dossier.profile.mailingAddress],
            ['Registered-agent name', dossier.profile.registeredAgent.name],
            ['Registered-agent address', dossier.profile.registeredAgent.address],
            ['Business phone', dossier.profile.phone],
            ['Business email', dossier.profile.email],
            ['Website', dossier.profile.website],
            ['Business age', dossier.profile.businessAge],
            ['Customer since', dossier.profile.customerSince],
            ['Relationship length', dossier.profile.relationshipLength],
            ['Known operating locations', dossier.profile.operatingLocations.join(' · ') || 'No operating-location record is available.'],
            ['Estimated employee count', dossier.profile.estimatedEmployeeCount],
          ]} />
        </section>
      )}

      {activeTab === 'owners' && (
        <section className="business-360-section" aria-labelledby="business-owners-heading">
          <header><p>People remain separate from the entity</p><h3 id="business-owners-heading">Owners and Controlling Parties</h3></header>
          <div className="business-360-owner-list">
            {dossier.owners.map((owner) => (
              <article key={owner.id} data-business-owner={owner.id}>
                <span>{owner.trainingId}</span>
                <h4>{owner.fullLegalName}</h4>
                <p>{owner.businessTitle} · {owner.ownershipPercentage}</p>
                <small>{owner.currentResidentialAddress}</small>
                <strong>{owner.addressComparison}</strong>
                <button type="button" onClick={() => setOwnerId(owner.id)}>Open Owner Profile</button>
              </article>
            ))}
          </div>
          {!dossier.owners.length && <p>No owner or controlling-party record is available in this business profile.</p>}
          {selectedOwner && <OwnerProfile owner={selectedOwner} onClose={() => setOwnerId('')} openTool={openTool} available={available} />}
        </section>
      )}

      {activeTab === 'accounts' && (
        <section className="business-360-section" aria-labelledby="business-accounts-heading">
          <header><p>Institution relationship</p><h3 id="business-accounts-heading">Business Accounts and Products</h3></header>
          <div className="business-360-account-list">
            {dossier.accounts.map((account) => (
              <article key={account.accountId} data-business-account={account.accountId}>
                <span>{account.productLabel}</span>
                <h4>{account.maskedAccountId}</h4>
                <p>{account.status}</p>
                <small>{formatMoney(account.currentBalance)} current · {formatMoney(account.availableBalance ?? account.availableCredit)} available</small>
                <button type="button" onClick={() => setAccountId(account.accountId)}>Open Account</button>
              </article>
            ))}
          </div>
          {!dossier.accounts.length && <p>No institution account snapshot is available in this business profile.</p>}
          {selectedAccount && (
            <section className="business-360-account-detail" aria-label={`Account detail for ${selectedAccount.maskedAccountId}`}>
              <header><div><p>Account relationship</p><h3>{selectedAccount.productLabel}</h3></div><button type="button" onClick={() => setAccountId('')}>Close Account</button></header>
              <AccountFields account={selectedAccount} />
            </section>
          )}
        </section>
      )}

      {activeTab === 'updates' && (
        <section className="business-360-section" aria-labelledby="business-updates-heading">
          <header><p>Recorded maintenance history</p><h3 id="business-updates-heading">Business Profile Updates</h3></header>
          <div className="business-360-update-list">
            {dossier.profileUpdates.map((update) => (
              <article key={update.id}>
                <span>{update.dateTime}</span><h4>{update.updateType}</h4>
                <FieldGrid fields={[
                  ['Previous value', update.previousValue],
                  ['New value', update.newValue],
                  ['Channel', update.channel],
                  ['Source', update.source],
                  ['User', update.user],
                  ['Session', update.linkedSession],
                  ['Device', update.linkedDevice],
                ]} />
              </article>
            ))}
          </div>
          {!dossier.profileUpdates.length && <p className="investigation-tool-empty" role="status">No business profile-update record is available.</p>}
        </section>
      )}

      {activeTab === 'access' && (
        <section className="business-360-section" aria-labelledby="business-access-heading">
          <header><p>Authorized access summary</p><h3 id="business-access-heading">Trusted Business Access and Security</h3></header>
          <div className="business-360-access-grid">
            <article><h4>Authorized business users</h4>{dossier.access.authorizedUsers.map((user) => <div key={user.id}><strong>{user.name}</strong><span>{user.role}</span><small>{user.permissions} · {user.mfaMethod} · Last login {user.lastSuccessfulLogin}</small></div>)}{!dossier.access.authorizedUsers.length && <p className="investigation-tool-empty" role="status">No authorized-business-user record is available.</p>}</article>
            <article><h4>Trusted devices</h4>{dossier.access.trustedDevices.map((device) => <div key={device.deviceId}><strong>{device.deviceName}</strong><span>{device.deviceId} · {device.browserOrOperatingSystem}</span><small>{device.trustStatus} · {device.mfaMethod}</small></div>)}{!dossier.access.trustedDevices.length && <p className="investigation-tool-empty" role="status">No trusted-device record is available.</p>}</article>
            <article><h4>Password, access, and administrator updates</h4>{dossier.access.passwordOrAccessResets.length ? dossier.access.passwordOrAccessResets.map((update) => <div key={update.id}><strong>{update.updateType}</strong><span>{update.dateTime}</span><small>{update.previousValue} → {update.newValue}</small></div>) : <p>No password, access-reset, or administrator-change record is supplied.</p>}</article>
          </div>
          <nav aria-label="Business access history routes">
            {available.has('Login History') && <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>}
            {available.has('Session History') && <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>}
            {available.has('Device Intelligence') && <button type="button" onClick={() => openTool('Device Intelligence')}>Open Device History</button>}
          </nav>
        </section>
      )}

      {activeTab === 'contact' && (
        <section className="business-360-section" aria-labelledby="business-contact-heading">
          <header><p>Service and relationship records</p><h3 id="business-contact-heading">Business Contact and Service Notes</h3></header>
          <div className="business-360-contact-list">
            {dossier.contactNotes.map((contact) => (
              <article key={contact.id}>
                <span>{contact.contactDate} · {contact.contactChannel}</span>
                <h4>{contact.personContacted} · {contact.businessRole}</h4>
                <FieldGrid fields={[
                  ['Reason for contact', contact.reasonForContact],
                  ['Information supplied', contact.informationSupplied],
                  ['Assistance provided', contact.assistanceProvided],
                  ['Documents requested', contact.documentsRequested],
                  ['Follow-up status', contact.followUpStatus],
                  ['Agent / department', contact.agentOrDepartment],
                ]} />
              </article>
            ))}
          </div>
          {!dossier.contactNotes.length && <p className="investigation-tool-empty" role="status">No business contact-history record is available.</p>}
        </section>
      )}

      {activeTab === 'payroll' && dossier.payrollRelationship && (
        <section className="business-360-section" aria-labelledby="business-payroll-heading">
          <header><p>Product relationship summary</p><h3 id="business-payroll-heading">Payroll Relationship</h3></header>
          <FieldGrid fields={[
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
          ]} />
          <nav aria-label="Payroll relationship routes">
            {available.has('Payroll History') && <button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button>}
            {available.has('Employee Profile') && <button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Roster</button>}
          </nav>
        </section>
      )}

      {activeTab === 'research' && (
        <section className="business-360-section" aria-labelledby="luna-business-research-heading">
          <header><p>Factual source comparison · separate from Luna Debrief</p><h3 id="luna-business-research-heading">Luna Business Research</h3></header>
          <p className="business-360-research-note">A missing or conflicting record is a source result, not proof that the business does not exist and not a conclusion about the active review.</p>
          <div className="business-360-research-list">
            {dossier.researchChecks.map((check) => (
              <article key={check.id} data-research-status={check.status}>
                <span>{check.status}</span><h4>{check.subject}</h4><p>{check.detail}</p>
                <small>{check.sourceChecked} · Checked {check.dateChecked}</small>
              </article>
            ))}
          </div>
          <div className="business-360-report-actions">
            <button type="button" onClick={generateReport}>{reportGenerated ? 'Regenerate Business 360 report' : 'Generate Business 360 report'}</button>
            {report && <button type="button" onClick={() => downloadBusiness360Report(report)}>Export report</button>}
          </div>
        </section>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Business 360 related tools">
        {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openTool('Identity Intel / People Search')}>Open Identity Information</button>}
        {available.has('Login History') && <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>}
      </nav>
      <footer className="investigation-tool-review-bar">
        <div><strong>Business 360 review</strong><span>Marking the company relationship reviewed records coverage only and does not determine the case.</span></div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => { saveNote(`Business 360 relationship reviewed for ${dossier.profile.legalName}.`, 'Business 360'); markReviewed('Business 360'); }}>
          {reviewed ? '✓ Business 360 reviewed' : 'Mark Business 360 reviewed'}
        </button>
      </footer>
    </section>
  );
}
