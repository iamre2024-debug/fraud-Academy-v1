import { useEffect, useMemo, useState } from 'react';
import { buildPaymentVerificationProfile } from './data/paymentVerificationProfiles.js';
import ReportSectionNavigator from './ReportSectionNavigator.jsx';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function VerificationList({ items = [] }) {
  return (
    <div className="payment-verification-list">
      {items.map((item, index) => (
        <article key={`${item.value}-${index}`}>
          <strong>{item.value}</strong>
          <span>{item.detail}</span>
        </article>
      ))}
      {!items.length && <p>No separate record was supplied by the fictional verification source.</p>}
    </div>
  );
}

function packetSections(profile) {
  return [
    { id: 'objects', title: 'Payment Objects', subtitle: 'Bank Code, Destination ID, instrument, or merchant-payment objects', items: profile.objectSummary },
    { id: 'ownership', title: 'Ownership Comparison', subtitle: 'Customer, employee, business, and destination-owner fields', items: [{ value: profile.ownershipName, detail: profile.ownershipComparison }] },
    { id: 'type', title: 'Account and Destination Type', subtitle: 'Traditional bank, card, fintech, prepaid, merchant, or other payment context', items: [{ value: profile.accountType, detail: profile.verificationStatus }] },
    { id: 'history', title: 'Verification History', subtitle: 'Neutral verification events and prior setup records', items: profile.verificationHistory },
    { id: 'payment-records', title: 'Verification Records', subtitle: 'Record-level status, timing, and linked objects', items: profile.paymentRecords },
    { id: 'transactions', title: 'Linked Transactions and Activity', subtitle: 'Activity connected to the payment objects', items: profile.transactions },
    { id: 'payroll', title: 'Prior Payroll Use', subtitle: 'Payroll destination history when supplied by the case packet', items: profile.priorPayrollUse },
    { id: 'people', title: 'Customer, Employee, and Account Relationships', subtitle: 'Neutral people and relationship records', items: profile.peopleRelationships },
    { id: 'shared', title: 'Shared or Joint Use', subtitle: 'Joint owner, shared destination, or authorized-user context when supplied', items: profile.sharedUse },
    { id: 'documents', title: 'Supporting Documents', subtitle: 'Documents linked to payment verification', items: profile.documents },
  ];
}

function resultRows(profile) {
  const statusText = normalize(profile.verificationStatus);
  const closed = statusText.includes('closed');
  const frozen = statusText.includes('frozen');
  return [
    { icon: '▣', label: 'Account state', value: frozen ? 'Frozen' : closed ? 'Closed' : 'Open', tone: frozen || closed ? 'attention' : 'positive' },
    { icon: '◇', label: 'Account standing', value: closed ? 'Closed account' : 'Good standing', tone: closed ? 'attention' : 'positive' },
    { icon: '▤', label: 'NSF status', value: 'No NSF history listed', tone: 'neutral' },
    { icon: '□', label: 'Account closure', value: closed ? 'Closed' : 'Not closed', tone: closed ? 'attention' : 'positive' },
    { icon: '⌁', label: 'Source coverage', value: 'Verification data available', tone: 'neutral' },
  ];
}

export default function PaymentVerificationPanel({
  activeCase,
  openTool,
  pin,
  saveNote,
  saveCaseReportPacket,
  markReviewed,
  currentCompleted,
  jumpDecision,
}) {
  const profile = useMemo(() => buildPaymentVerificationProfile(activeCase), [activeCase]);
  const sections = useMemo(() => packetSections(profile), [profile]);
  const rows = useMemo(() => resultRows(profile), [profile]);
  const [destinationId, setDestinationId] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [searched, setSearched] = useState(false);
  const [matched, setMatched] = useState(false);
  const [showPacket, setShowPacket] = useState(false);
  const reviewed = currentCompleted.includes('Payment Verification');

  useEffect(() => {
    setDestinationId('');
    setBankCode('');
    setOwnerName('');
    setSearched(false);
    setMatched(false);
    setShowPacket(false);
  }, [activeCase.id]);

  function runLookup(event) {
    event.preventDefault();
    const found = normalize(destinationId) === normalize(profile.destinationId)
      && normalize(bankCode) === normalize(profile.bankCode)
      && normalize(ownerName) === normalize(profile.ownershipName);
    setSearched(true);
    setMatched(found);
    setShowPacket(false);
  }

  function clearLookup() {
    setDestinationId('');
    setBankCode('');
    setOwnerName('');
    setSearched(false);
    setMatched(false);
    setShowPacket(false);
  }

  function savePacket() {
    saveCaseReportPacket({
      id: `${activeCase.id}-PAYMENT-VERIFICATION`,
      label: 'Payment Verification packet',
      pin: profile.destinationId,
      values: [
        `${activeCase.id}-PAYMENT-VERIFICATION`,
        'Payment Verification packet',
        `${profile.destinationId} · ${profile.bankCode}`,
        profile.verificationStatus,
        profile.ownershipComparison,
        activeCase.id,
        'Save',
      ],
      detail: `Payment Verification packet for ${profile.destinationId} and ${profile.bankCode}. ${sections.length} neutral verification sections reviewed.`,
    });
  }

  return (
    <section className="ornate-card activity-panel payment-verification-panel" data-payment-verification-screen="lookup-packet-v1" data-tool-name="Payment Verification">
      <header className="payment-verification-header">
        <button type="button" className="payment-header-back" onClick={() => openTool('Financial Intelligence')} aria-label="Back to Financial Intelligence">←</button>
        <div className="payment-header-title">
          <span className="payment-header-shield" aria-hidden="true">▣</span>
          <div>
            <p>Financial Intelligence</p>
            <h2>Payment Verification</h2>
            <span>Verify Destination ID, Bank Code, and account-owner information.</span>
          </div>
        </div>
        <button type="button" className="payment-header-help" onClick={jumpDecision} aria-label="Open Submit Decision">?</button>
      </header>

      <section className="payment-intro-banner">
        <span className="payment-intro-gem" aria-hidden="true">◇</span>
        <p>Search by entering the Destination ID, Bank Code, and account-owner name. Results include name-match status, account state, standing, and source coverage.</p>
        <span className="payment-intro-moon" aria-hidden="true">☾</span>
      </section>

      <section className="payment-lookup-source" aria-label="Find Payment Verification lookup values">
        <div>
          <p>Need the lookup values?</p>
          <h3>Find the Destination ID and Bank Code first</h3>
          <span>The Destination ID appears in Financial Intelligence and payment setup records. The Bank Code appears in the linked payment or account record. Pin them, then return here.</span>
        </div>
        <div>
          <button type="button" onClick={() => openTool('Financial Intelligence')}>Open Financial Intelligence</button>
          <button type="button" onClick={() => openTool('Transaction History')}>Open Transactions</button>
          <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
        </div>
      </section>

      <form className="payment-lookup-card" onSubmit={runLookup}>
        <header><span aria-hidden="true">⌕</span><h3>Search Payment Information</h3></header>
        <div className="payment-lookup-fields">
          <label>
            <span>Destination ID <small>(training bank account number)</small></span>
            <input value={destinationId} onChange={(event) => setDestinationId(event.target.value)} placeholder="Enter Destination ID" autoComplete="off" aria-label="Destination ID" />
          </label>
          <label>
            <span>Bank Code <small>(training routing number)</small></span>
            <input value={bankCode} onChange={(event) => setBankCode(event.target.value)} placeholder="Enter Bank Code" autoComplete="off" aria-label="Bank Code" />
          </label>
          <label>
            <span>Account owner name</span>
            <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Enter customer or business owner name" autoComplete="off" aria-label="Account owner name" />
          </label>
        </div>
        <div className="payment-lookup-actions">
          <button type="submit"><span aria-hidden="true">⌕</span> Search</button>
          <button type="button" onClick={clearLookup}>Clear</button>
        </div>
        <p className="payment-training-note">▣ This tool uses fictional training records only. Do not use it for real-world transactions.</p>
      </form>

      {searched && !matched && (
        <section className="payment-no-match" aria-live="polite">
          <strong>No matching verification packet found</strong>
          <span>Check the Destination ID, Bank Code, and account-owner name from the related case tools.</span>
        </section>
      )}

      {matched && (
        <section className="payment-results-card" aria-live="polite">
          <header>
            <div><span aria-hidden="true">◇</span><h3>Verification Results</h3></div>
            <small>Search ID: PV-{activeCase.id.replace(/[^A-Z0-9]/gi, '').slice(-10)}</small>
          </header>

          <section className="payment-primary-results">
            <article>
              <span className="payment-result-icon" aria-hidden="true">◉</span>
              <div><small>Name match status</small><strong>Yes · Name match</strong><p>The submitted account-owner name matches the fictional verification record.</p></div>
              <em>Match</em>
            </article>
            <article>
              <span className="payment-result-icon" aria-hidden="true">▣</span>
              <div><small>Account status</small><strong>{rows[1].value}</strong><p>{profile.accountType}. {profile.verificationStatus}.</p></div>
              <em>Active</em>
            </article>
          </section>

          <dl className="payment-status-list">
            {rows.map((row) => (
              <div key={row.label} data-tone={row.tone}>
                <dt><span aria-hidden="true">{row.icon}</span>{row.label}</dt>
                <dd>{row.value}<i aria-hidden="true" /></dd>
              </div>
            ))}
          </dl>

          <footer>
            <span>Last updated: {activeCase.opened}</span>
            <div>
              <button type="button" onClick={() => pin(`${profile.destinationId} · ${profile.bankCode} · ${profile.ownershipName}`, { id: `${activeCase.id}-payment`, sourceTool: 'Payment Verification' })}>📌 Pin result</button>
              <button type="button" onClick={() => setShowPacket((current) => !current)}>{showPacket ? 'Hide details' : 'Open full details'}</button>
            </div>
          </footer>
        </section>
      )}

      {matched && showPacket && (
        <section className="payment-full-packet" data-payment-full-packet>
          <header><div><p>Payment Verification</p><h3>Full Verification Packet</h3><span>{profile.destinationId} · {profile.bankCode} · fictional training sources</span></div></header>
          <ReportSectionNavigator sections={sections} className="payment-packet-sections" sectionAttribute="data-payment-packet-section" renderItems={(items) => <VerificationList items={items} />} />
          <nav className="payment-related-tools" aria-label="Payment verification related tools">
            <button type="button" onClick={() => openTool('Transaction History')}>Transactions</button>
            <button type="button" onClick={() => openTool('Business Intelligence')}>Business Intelligence</button>
            <button type="button" onClick={() => openTool('Employee Profile')}>Employee Profile</button>
            <button type="button" onClick={() => openTool('Payroll History')}>Payroll History</button>
            <button type="button" onClick={() => openTool('Document Viewer')}>Documents</button>
          </nav>
          <div className="payment-packet-actions">
            <button type="button" onClick={() => saveNote(`Payment Verification packet reviewed for ${profile.destinationId} · ${profile.bankCode}.`, 'Payment verification')}>Save note</button>
            <button type="button" onClick={savePacket}>Save to evidence</button>
            <button type="button" onClick={() => markReviewed('Payment Verification')}>{reviewed ? '✓ Reviewed' : 'Mark reviewed'}</button>
          </div>
        </section>
      )}

      <section className="payment-source-note"><span aria-hidden="true">◇</span><p>Results are based on fictional third-party training sources and may not reflect real-time account activity.</p><span aria-hidden="true">☾</span></section>
    </section>
  );
}
