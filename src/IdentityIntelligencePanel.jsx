import { useEffect, useMemo, useState } from 'react';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function ReportList({ items = [] }) {
  return (
    <div className="identity-report-list">
      {items.map((item, index) => (
        <article key={`${item.value}-${index}`}>
          <strong>{item.value}</strong>
          <span>{item.detail}</span>
        </article>
      ))}
      {!items.length && <p>No separate record was supplied by the fictional training source.</p>}
    </div>
  );
}

function reportSections(activeCase) {
  const profile = activeCase.identityProfile ?? {};
  const contact = activeCase.customer?.contact ?? {};
  const logins = activeCase.loginHistory ?? [];
  const documents = activeCase.documents ?? [];
  const identityRecords = activeCase.identityRecords ?? [];

  return [
    { id: 'identity', title: 'Identity and name history', subtitle: 'Current and historical fictional identity records', items: profile.nameHistory ?? [] },
    { id: 'addresses', title: 'Address history', subtitle: 'Current and prior training-only address sources', items: profile.addresses ?? [] },
    { id: 'contacts', title: 'Phone and email history', subtitle: 'Contact points connected to the identity profile', items: [...(profile.phones ?? []), ...(profile.emails ?? [])] },
    { id: 'associates', title: 'Associates and household links', subtitle: 'Neutral relationship records without a case conclusion', items: profile.associates ?? [] },
    { id: 'profiles', title: 'Linked customer profiles', subtitle: 'Customer and product relationships tied to the Training ID', items: profile.linkedProfiles ?? [] },
    { id: 'businesses', title: 'Business and employer associations', subtitle: 'Training-only business or employer source records', items: profile.businesses ?? [] },
    { id: 'licenses', title: 'Licenses and credentials', subtitle: 'Fictional credential source records', items: profile.licenses ?? [] },
    { id: 'vehicles', title: 'Vehicle records', subtitle: 'Training-only vehicle source records', items: profile.vehicles ?? [] },
    { id: 'properties', title: 'Property and address-linked records', subtitle: 'Training-only property or lease sources', items: profile.properties ?? [] },
    { id: 'public', title: 'Public-record source summary', subtitle: 'Neutral source availability, not an outcome signal', items: profile.publicRecords ?? [] },
    { id: 'financial', title: 'Financial relationship summary', subtitle: 'Products and case-linked relationship context', items: profile.financialSummary ?? [] },
    { id: 'prior', title: 'Prior case and service history', subtitle: 'Historical records that do not determine the active case', items: profile.priorCases ?? [] },
    { id: 'digital', title: 'Digital presence and access summary', subtitle: 'Profile, device, session, and network source availability', items: profile.digitalPresence ?? [] },
    { id: 'sources', title: 'Additional data sources', subtitle: 'Documents and linked investigation tools available for review', items: profile.additionalSources ?? [] },
    {
      id: 'linked-records',
      title: 'Linked identity and access records',
      subtitle: 'Record-level context from the active fictional case',
      items: [
        ...identityRecords.map((item) => ({ value: `${item.id} · ${item.type}`, detail: `${item.value} · ${item.history}` })),
        ...logins.map((item) => ({ value: `${item.session} · ${item.deviceId ?? item.device}`, detail: `${item.time} · ${item.result} · ${item.location} · ${item.ip} · ${item.method}` })),
        ...documents.map((item) => ({ value: `${item.id} · ${item.name ?? item.title}`, detail: `${item.status} · ${item.detail ?? 'Open Document Viewer for packet fields'}` })),
      ],
    },
    {
      id: 'contact-summary',
      title: 'Current contact summary',
      subtitle: 'Current values from Customer 360',
      items: [
        { value: contact.phone ?? 'No phone recorded', detail: 'Current mobile or primary contact' },
        { value: contact.email ?? 'No email recorded', detail: 'Current profile email' },
        { value: contact.address ?? 'No address recorded', detail: 'Current mailing or residential address' },
      ],
    },
  ];
}

export default function IdentityIntelligencePanel({
  activeCase,
  openTool,
  pin,
  saveNote,
  saveCaseReportPacket,
  markReviewed,
  currentCompleted,
  jumpDecision,
}) {
  const [searchMode, setSearchMode] = useState('name');
  const [trainingId, setTrainingId] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [searched, setSearched] = useState(false);
  const [matched, setMatched] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [message, setMessage] = useState('');
  const profile = activeCase.identityProfile ?? {};
  const sections = useMemo(() => reportSections(activeCase), [activeCase]);
  const reviewed = currentCompleted.includes('Identity Intelligence');

  useEffect(() => {
    setTrainingId('');
    setName('');
    setDob('');
    setSearched(false);
    setMatched(false);
    setShowReport(false);
    setMessage('');
  }, [activeCase.id]);

  function runSearch(event) {
    event.preventDefault();
    const idMatches = normalize(trainingId) === normalize(activeCase.trainingId);
    const secondaryMatches = searchMode === 'name'
      ? normalize(name) === normalize(activeCase.person)
      : normalize(dob) === normalize(profile.dob);

    setSearched(true);
    setShowReport(false);
    setMatched(idMatches && secondaryMatches);
    setMessage(idMatches && secondaryMatches
      ? 'One fictional identity profile matched both search fields.'
      : 'No fictional identity profile matched both search fields. Check the Training ID and secondary field.');
  }

  function clearSearch() {
    setTrainingId('');
    setName('');
    setDob('');
    setSearched(false);
    setMatched(false);
    setShowReport(false);
    setMessage('');
  }

  function saveReport() {
    const row = {
      id: `${activeCase.id}-IDENTITY-REPORT`,
      label: 'Identity Intelligence full profile report',
      pin: activeCase.trainingId,
      values: [
        `${activeCase.id}-IDENTITY-REPORT`,
        'Full profile report',
        `${activeCase.person} · ${activeCase.trainingId}`,
        profile.dob,
        `${sections.length} report sections`,
        activeCase.id,
        'Save',
      ],
      detail: `Identity Intelligence full profile report for ${activeCase.person}. Training ID ${activeCase.trainingId}. ${sections.length} neutral source sections reviewed.`,
    };
    saveCaseReportPacket(row);
  }

  return (
    <section
      className="ornate-card activity-panel identity-intelligence-panel"
      data-identity-intelligence-screen="lookup-report-v1"
      data-tool-name="Identity Intelligence"
    >
      <header className="identity-intelligence-header">
        <div>
          <p>Identity Intelligence · Evidence First</p>
          <h2>Background Profile Search</h2>
          <span>Search the fictional identity source first. The detailed profile report stays closed until the lookup fields match.</span>
        </div>
        <div>
          <strong>{activeCase.id}</strong>
          <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
        </div>
      </header>

      <form className="identity-search-card" onSubmit={runSearch}>
        <fieldset>
          <legend>Choose search method</legend>
          <label>
            <input type="radio" name="identity-search-mode" checked={searchMode === 'name'} onChange={() => setSearchMode('name')} />
            Training ID + Name
          </label>
          <label>
            <input type="radio" name="identity-search-mode" checked={searchMode === 'dob'} onChange={() => setSearchMode('dob')} />
            Training ID + DOB
          </label>
        </fieldset>

        <div className="identity-search-fields">
          <label>
            <span>Training ID</span>
            <input value={trainingId} onChange={(event) => setTrainingId(event.target.value)} placeholder="Enter Training ID" autoComplete="off" />
          </label>
          {searchMode === 'name' ? (
            <label>
              <span>Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter full name" autoComplete="off" />
            </label>
          ) : (
            <label>
              <span>Date of birth</span>
              <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
            </label>
          )}
        </div>

        <p className="identity-search-helper">Use the identity values gathered from Customer 360 or the active case packet. Search results contain fictional training data only.</p>
        <div className="identity-search-actions">
          <button type="submit">Run Search</button>
          <button type="button" onClick={clearSearch}>Clear Search</button>
        </div>
      </form>

      {searched && (
        <section className={`identity-search-result ${matched ? 'matched' : 'not-matched'}`} aria-live="polite">
          <header>
            <div>
              <p>Search result</p>
              <h3>{matched ? 'Identity Match Summary' : 'No matching profile found'}</h3>
            </div>
            <span>{matched ? '1 profile' : '0 profiles'}</span>
          </header>
          <p>{message}</p>
          {matched && (
            <>
              <dl>
                <div><dt>Name</dt><dd>{activeCase.person}</dd></div>
                <div><dt>Training ID</dt><dd>{activeCase.trainingId}</dd></div>
                <div><dt>DOB / age</dt><dd>{profile.dob} · {profile.age}</dd></div>
                <div><dt>Current phone</dt><dd>{activeCase.customer?.contact?.phone}</dd></div>
                <div><dt>Current email</dt><dd>{activeCase.customer?.contact?.email}</dd></div>
                <div><dt>Current address</dt><dd>{activeCase.customer?.contact?.address}</dd></div>
              </dl>
              <button type="button" className="identity-view-report" onClick={() => setShowReport(true)}>View Full Profile Report</button>
            </>
          )}
        </section>
      )}

      {matched && showReport && (
        <section className="identity-full-report" data-identity-full-report>
          <header>
            <div>
              <p>Identity Intelligence</p>
              <h3>Full Profile Report</h3>
              <span>{activeCase.person} · {activeCase.trainingId} · Generated from fictional training sources</span>
            </div>
            <button type="button" onClick={() => pin(`${activeCase.trainingId} · ${activeCase.person}`)}>Pin identity</button>
          </header>

          <section className="identity-report-summary">
            <article><span>Report sections</span><strong>{sections.length}</strong></article>
            <article><span>Identity records</span><strong>{activeCase.identityRecords?.length ?? 0}</strong></article>
            <article><span>Access records</span><strong>{activeCase.loginHistory?.length ?? 0}</strong></article>
            <article><span>Documents</span><strong>{activeCase.documents?.length ?? 0}</strong></article>
          </section>

          <div className="identity-report-sections">
            {sections.map((section) => (
              <section key={section.id} data-identity-report-section={section.id}>
                <header><p>{section.subtitle}</p><h4>{section.title}</h4></header>
                <ReportList items={section.items} />
              </section>
            ))}
          </div>

          <nav className="identity-related-tools" aria-label="Identity report related tools">
            <button type="button" onClick={() => openTool('Login History')}>Open Login History</button>
            <button type="button" onClick={() => openTool('Session History')}>Open Session History</button>
            <button type="button" onClick={() => openTool('IP Intelligence')}>Open IP Intelligence</button>
            <button type="button" onClick={() => openTool('Document Viewer')}>Open Documents</button>
          </nav>

          <div className="identity-report-actions">
            <button type="button" onClick={() => saveNote(`Identity Intelligence report reviewed for ${activeCase.person} · ${activeCase.trainingId}.`, 'Identity report')}>Save report note</button>
            <button type="button" onClick={saveReport}>Save report to evidence packet</button>
            <button type="button" onClick={() => markReviewed('Identity Intelligence')}>{reviewed ? '✓ Identity Intelligence reviewed' : 'Mark Identity Intelligence reviewed'}</button>
          </div>
        </section>
      )}
    </section>
  );
}
