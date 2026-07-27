import { useEffect, useMemo, useState } from 'react';
import { getIdentityIntelReport, matchesIdentityIntelSearch } from '../data/identityIntelReport.js';

export default function IdentityIntelWorkspace({
  activeCase,
  query,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const report = useMemo(
    () => getIdentityIntelReport(activeCase, { trainingId: query }),
    [activeCase, query],
  );
  const [searchMode, setSearchMode] = useState('id');
  const [idDraft, setIdDraft] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [dobDraft, setDobDraft] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('identity-summary');
  const searchMatched = submittedSearch && matchesIdentityIntelSearch(report, submittedSearch);
  const searchReady = searchMode === 'id' ? Boolean(idDraft.trim()) : Boolean(nameDraft.trim() && dobDraft.trim());
  const activeSection = report.sections.find((section) => section.id === activeSectionId) ?? report.sections[0];

  useEffect(() => {
    const routedTrainingId = String(query ?? '').trim();
    setSearchMode('id');
    setIdDraft(routedTrainingId);
    setNameDraft('');
    setDobDraft('');
    setSubmittedSearch(routedTrainingId ? { mode: 'id', id: routedTrainingId } : null);
    setSearchHistory(routedTrainingId ? [`Training ID: ${routedTrainingId}`] : []);
    setReportOpen(false);
    setActiveSectionId('identity-summary');
  }, [activeCase.id, query, report.subject.trainingId]);

  function runSearch() {
    if (!searchReady) return;
    const criteria = searchMode === 'id'
      ? { mode: 'id', id: idDraft.trim() }
      : { mode: 'name-dob', name: nameDraft.trim(), dob: dobDraft.trim() };
    const label = criteria.mode === 'id' ? `Training ID: ${criteria.id}` : `${criteria.name} · ${criteria.dob}`;
    setSubmittedSearch(criteria);
    setSearchHistory((current) => [label, ...current.filter((item) => item !== label)].slice(0, 4));
    setReportOpen(false);
    setActiveSectionId('identity-summary');
  }

  function saveIdentityNote(message) {
    saveNote(`Identity Intel: ${message}`, 'Identity Intel');
  }

  function exportIdentityReport() {
    const lines = [
      'Fraud Academy - Identity Search Report',
      `Case: ${report.subject.sourceCaseId}`,
      `Profile: ${report.profile.profileId}`,
      `Subject: ${report.subject.name}`,
      'Fictional training data only',
      '',
      ...report.summary.map(([label, value]) => `${label}: ${value}`),
      '',
      ...report.sections.flatMap((section) => [section.title, ...section.fields.map((field) => `${field.label}: ${field.value}`), '']),
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.subject.sourceCaseId}-identity-search-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <section className="identity-intel-search" aria-label="Identity Intel search">
        <div>
          <p>People Search</p>
          <h3>Search by fictional Training ID or by Name + DOB.</h3>
          <span>Fictional training data only. Identity information is evidence, not a case conclusion.</span>
        </div>
        <div className="identity-intel-search-fields">
          <label><span>Search method</span><select value={searchMode} onChange={(event) => setSearchMode(event.target.value)} aria-label="Choose People Search method"><option value="id">Training ID</option><option value="name-dob">Name + DOB</option></select></label>
          {searchMode === 'id' ? <label><span>Fictional Training ID</span><input value={idDraft} onChange={(event) => setIdDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="TRN-8842-19" aria-label="Search Identity Intel by Training ID" /></label> : <>
            <label><span>Full name</span><input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="Maya Sterling" aria-label="Search Identity Intel by name" /></label>
            <label><span>Date of birth</span><input value={dobDraft} onChange={(event) => setDobDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runSearch(); }} placeholder="Feb 14, 1988" aria-label="Search Identity Intel by date of birth" /></label>
          </>}
        </div>
        <button type="button" onClick={runSearch} disabled={!searchReady}>Run People Search</button>
      </section>

      {!submittedSearch && <section className="identity-intel-gate" aria-label="Identity report locked">
        <strong>Identity report hidden until a search is run.</strong>
        <span>Use a fictional profile value from the active case to reveal the report.</span>
      </section>}

      {submittedSearch && !searchMatched && <section className="identity-intel-gate" aria-label="No identity match">
        <strong>No fictional identity match returned for this search.</strong>
        <span>Use the fictional Training ID, or pair the customer name with the exact training DOB from Customer 360.</span>
      </section>}

      {searchMatched && <>
        <section className="identity-intel-summary" aria-label="Identity Match Summary">
          <header>
            <div>
              <p>Identity Match Summary</p>
              <h3>{report.subject.name}</h3>
              <span>{report.profile.profileId} · Fictional training profile</span>
            </div>
            <div className="identity-intel-summary-actions"><button type="button" onClick={() => pin(`${report.profile.profileId} · ${report.subject.name}`)}>Pin profile</button><button type="button" onClick={() => saveIdentityNote(`Identity Match Summary ${report.profile.profileId} reviewed for ${report.subject.name}.`)}>Save summary note</button><button type="button" className="investigation-tool-primary" onClick={() => setReportOpen(true)}>{reportOpen ? 'Full Profile Report Open' : 'View Full Profile Report'}</button></div>
          </header>
          <dl>
            {report.summary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>

        <section className="identity-intel-counts" aria-label="Identity report counts">
          {report.counts.map(([label, count]) => <article key={label}><strong>{count}</strong><span>{label}</span></article>)}
        </section>

        {!reportOpen && <section className="identity-intel-gate" aria-label="Full identity report closed"><strong>Identity Match Summary returned.</strong><span>Review the match and count bubbles, then open the full fictional profile report.</span></section>}

        {reportOpen && <div className="identity-intel-workspace">
          <section className="identity-intel-sections identity-intel-source-panel" aria-label="People Search history and source records">
            <header><p>Search & Sources</p><h3>Criteria and matched objects</h3></header>
            <div className="identity-intel-search-history">{searchHistory.map((item, index) => <span key={`${item}-${index}`}><strong>{index ? 'Previous search' : 'Current search'}</strong>{item}</span>)}</div>
            <div className="identity-intel-source-records">{report.sourceRecords.map((item) => <article key={item.id}><span>{item.type}</span><strong>{item.value}</strong><small>{item.id} · {item.lastSeen}</small><button type="button" onClick={() => pin(`${item.id} · ${item.value}`)}>Pin</button></article>)}</div>
          </section>

          <section className="identity-intel-report" aria-label="Expanded identity report">
            <header>
              <div><p>Fictional report section</p><h3>{activeSection.title}</h3></div>
              <button type="button" onClick={() => saveIdentityNote(`${activeSection.title} reviewed for ${report.profile.profileId}.`)}>Save section note</button>
            </header>
            <dl>{activeSection.fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl>
          </section>

          <aside className="identity-intel-evidence" aria-label="Evidence Explorer">
            <header><p>Evidence Explorer</p><h3>Open a full report section</h3></header>
            <div className="identity-intel-section-buttons">{report.sections.map((section) => <button key={section.id} type="button" aria-label={section.title} className={section.id === activeSection.id ? 'active' : ''} onClick={() => setActiveSectionId(section.id)}><strong>{section.title}</strong><span>{section.fields.length} fields</span></button>)}</div>
            <button type="button" onClick={exportIdentityReport}>Generate Identity Search Report</button>
          </aside>
        </div>}
      </>}

      <nav className="investigation-tool-next-routes" aria-label="Identity Intel next routes">
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Identity Intel / People Search review</strong>
          <span>Run a search, review the fictional report, and compare it with case evidence before marking this tool reviewed.</span>
        </div>
        <button type="button" className={reviewed ? '' : 'investigation-tool-primary'} disabled={!searchMatched || !reportOpen} onClick={() => markReviewed('Identity Intel / People Search')}>
          {reviewed ? '✓ Identity Intel / People Search reviewed' : 'Mark Identity Intel / People Search reviewed'}
        </button>
      </footer>
    </>
  );
}

