import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { getMerchantIntelligence, merchantIntelligenceTabs, merchantRecordSearchText } from './data/merchantIntelligenceRecords.js';

export default function MerchantIntelligenceWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const workspace = useMemo(() => getMerchantIntelligence(activeCase), [activeCase]);
  const [activeSection, setActiveSection] = useState('overview');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const section = merchantIntelligenceTabs.find((item) => item.id === activeSection) ?? merchantIntelligenceTabs[0];
  const sectionRecords = workspace.records.filter((item) => item.section === activeSection);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = sectionRecords.filter((item) => !normalizedQuery || merchantRecordSearchText(item).includes(normalizedQuery));
  const activeRecord = filteredRecords.find((item) => item.id === selectedId) ?? filteredRecords[0] ?? sectionRecords[0];
  const profile = workspace.profile;

  useEffect(() => {
    setActiveSection('overview');
    setQuery('');
    setSelectedId('');
  }, [activeCase.id]);

  useEffect(() => {
    setSelectedId('');
  }, [activeSection]);

  function saveMerchantNote(record) {
    saveNote(`Merchant Intelligence: ${record.id} - ${record.summary}`, 'Merchant intelligence');
  }

  return (
    <>
      <section className="merchant-intelligence-profile" aria-label="Merchant profile">
        <div>
          <p>Merchant in review</p>
          <h3>{profile.name}</h3>
          <span>{profile.descriptor} | MCC {profile.mcc} | {profile.channel}</span>
        </div>
        <dl>
          <div><dt>Category</dt><dd>{profile.category}</dd></div>
          <div><dt>Location</dt><dd>{profile.location}</dd></div>
          <div><dt>First used</dt><dd>{profile.firstUsed}</dd></div>
          <div><dt>Prior transactions</dt><dd>{profile.priorTransactionCount}</dd></div>
        </dl>
      </section>

      <section className="merchant-intelligence-metrics" aria-label="Merchant activity summary">
        <article><span>Prior customer transactions</span><strong>{profile.priorTransactionCount}</strong></article>
        <article><span>Prior disputes</span><strong>{profile.priorDisputeCount}</strong></article>
        <article><span>Refunds recorded</span><strong>{profile.refundCount}</strong></article>
        <article><span>Attempts / declines</span><strong>{profile.attemptedTransactions} / {profile.declinedTransactions}</strong></article>
      </section>

      <nav className="merchant-intelligence-tabs" aria-label="Merchant Intelligence sections">
        {merchantIntelligenceTabs.map((item) => (
          <button key={item.id} type="button" className={activeSection === item.id ? 'active' : ''} aria-pressed={activeSection === item.id} onClick={() => setActiveSection(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>

      <section className="merchant-intelligence-findbar" aria-label="Merchant Intelligence filters">
        <div><p>{section.label}</p><h3>{section.question}</h3></div>
        <label><span>Search merchant evidence</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Merchant, MCC, order, authorization, delivery, refund, or reason code" aria-label="Search Merchant Intelligence" /></label>
        <span>{filteredRecords.length} of {sectionRecords.length} records shown</span>
      </section>

      <div className="merchant-intelligence-workspace">
        <section className="merchant-intelligence-records" aria-label={`${section.label} records`}>
          <header><div><p>Evidence records</p><h3>{section.label}</h3></div><span>{filteredRecords.length} shown</span></header>
          {filteredRecords.map((item) => (
            <button key={item.id} type="button" className={activeRecord?.id === item.id ? 'active' : ''} onClick={() => setSelectedId(item.id)} data-merchant-intelligence-record={item.id}>
              <span>{item.status} | {item.observed}</span>
              <strong>{item.title}</strong>
              <DirectCollapsibleText as="small" lines={2} mobileLines={3}>{item.summary}</DirectCollapsibleText>
            </button>
          ))}
          {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No merchant records match this search.</div>}
        </section>

        {activeRecord ? (
          <section className="merchant-intelligence-detail" aria-label="Expanded merchant record">
            <header>
              <div><p>Expanded evidence</p><h3>{activeRecord.id}</h3><span>{activeRecord.title} | {activeRecord.observed}</span></div>
              <button type="button" onClick={() => pin(`${activeRecord.id} | ${activeRecord.title}`)}>Pin record</button>
            </header>
            <dl>{activeRecord.fields.map(([label, value]) => <div key={`${activeRecord.id}-${label}`}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <article><span>Recorded context</span><p>{activeRecord.summary}</p></article>
            <div className="merchant-intelligence-related"><span>Related records</span><div>{activeRecord.relatedRecords.length ? activeRecord.relatedRecords.map((item) => <button key={item} type="button" onClick={() => pin(item)}>{item}</button>) : <small>No related object is supplied in this section.</small>}</div></div>
            <button type="button" onClick={() => saveMerchantNote(activeRecord)}>Save evidence note</button>
          </section>
        ) : <div className="investigation-tool-empty" role="status">Choose a merchant record to open its full details.</div>}

        <aside className="merchant-intelligence-rail" aria-label="Merchant packet summary">
          <header><p>Merchant packet</p><h3>{profile.name}</h3><span>{activeCase.id}</span></header>
          <section><p>Packet index</p>{merchantIntelligenceTabs.map((item) => <button key={item.id} type="button" onClick={() => setActiveSection(item.id)}><span>{item.label}</span><strong>{workspace.records.filter((record) => record.section === item.id).length}</strong></button>)}</section>
          <section><p>Reason-code context</p><strong>{workspace.reasonCode}</strong><span>{workspace.responseDeadline}</span></section>
          <nav><button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button></nav>
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Merchant Intelligence next routes"><button type="button" onClick={() => openTool('Transaction History')}>Open Transaction History</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Merchant Intelligence review</strong><span>Review merchant identity, history, authorization, fulfillment, disputes, refunds, subscription or marketplace context, and the applicable reason-code evidence.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Merchant Intelligence')}>{reviewed ? 'Merchant Intelligence reviewed' : 'Mark Merchant Intelligence reviewed'}</button></footer>
    </>
  );
}
