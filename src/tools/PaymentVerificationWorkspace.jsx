import { useEffect, useMemo, useState } from 'react';
import { getFinancialRecords } from '../data/caseToolData.js';
import { parsePaymentLookupHint, resolvePaymentLookup } from '../data/paymentVerification.js';
import { statusTone } from './shared.jsx';

export default function PaymentVerificationWorkspace({
  activeCase,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  recordAction,
  quickPin,
}) {
  const financial = useMemo(() => getFinancialRecords(activeCase), [activeCase]);
  const records = financial.paymentVerification ?? [];
  const [lookup, setLookup] = useState({ bankCode: '', destinationId: '', ownerName: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupHistory, setLookupHistory] = useState([]);
  const activeRecord = lookupResult?.record ?? null;

  useEffect(() => {
    setLookup({ bankCode: '', destinationId: '', ownerName: '' });
    setLookupResult(null);
    setLookupError('');
    setLoading(false);
    setLookupHistory([]);
  }, [activeCase.id]);

  useEffect(() => {
    const hint = parsePaymentLookupHint(query);
    if (!hint) return;
    setLookup(hint);
    setLookupResult(null);
    setLookupError('');
  }, [query]);

  function updateLookup(field, value) {
    if (parsePaymentLookupHint(query)) setQuery('');
    setLookup((current) => ({ ...current, [field]: value }));
    setLookupResult(null);
    setLookupError('');
  }

  function resetLookup() {
    setLookup({ bankCode: '', destinationId: '', ownerName: '' });
    setLookupResult(null);
    setLookupError('');
    setQuery('');
  }

  async function runLookup(event) {
    event.preventDefault();
    if (!lookup.bankCode.trim() || !lookup.destinationId.trim() || !lookup.ownerName.trim()) {
      setLookupError('Bank Code, Destination ID, and owner or business name are required.');
      setLookupResult(null);
      return;
    }

    setLookupError('');
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const result = resolvePaymentLookup(records, lookup);
    setLookupResult(result);
    setLoading(false);

    const historyItem = {
      id: `${Date.now()}-${lookup.bankCode}-${lookup.destinationId}`,
      bankCode: lookup.bankCode.trim(),
      destinationId: lookup.destinationId.trim(),
      ownerName: lookup.ownerName.trim(),
      outcome: result.nameMatchResult,
      recordId: result.record?.id ?? null,
    };
    const nextHistory = [historyItem, ...lookupHistory].slice(0, 8);
    setLookupHistory(nextHistory);
    recordAction?.(
      'Payment Verification lookup completed',
      `${historyItem.bankCode} / ${historyItem.destinationId}: ${historyItem.outcome}.`,
      'Payment Verification',
    );
  }

  function savePaymentNote(message) {
    saveNote(`Payment Verification: ${message}`, 'Payment verification');
  }

  function logAction(action) {
    const message = `${action} recorded for ${activeRecord.id}.`;
    savePaymentNote(message);
    recordAction?.('Payment Verification action recorded', message, 'Payment Verification');
  }

  const relatedRoutes = [
    'Customer 360',
    'Financial Investigation',
    'Employee Profile',
    'Payroll History',
    'Business 360',
    'Timeline',
  ].filter((item) => activeCase.availableTools?.includes(item) || item === 'Timeline');
  const showCallback = activeRecord && !/^No callback requirement/i.test(activeRecord.callbackStatus);

  return (
    <>
      <section className="payment-verification-gate" aria-label="Payment Verification search">
        <header>
          <div>
            <p>Search before reveal</p>
            <h3>Verify a specific payment destination</h3>
            <span>Enter the identifiers from Customer 360, Financial Investigation, Business 360, Employee Profile, or Payroll History. No account result is exposed until the lookup runs.</span>
          </div>
          {lookupResult && <button type="button" onClick={resetLookup}>Reset lookup</button>}
        </header>

        <form onSubmit={runLookup} noValidate>
          <label>
            <span>Bank Code</span>
            <input
              value={lookup.bankCode}
              onChange={(event) => updateLookup('bankCode', event.target.value)}
              placeholder="Example: BC-204"
              aria-label="Bank Code"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Destination ID</span>
            <input
              value={lookup.destinationId}
              onChange={(event) => updateLookup('destinationId', event.target.value)}
              placeholder="Example: DST-7740"
              aria-label="Destination ID"
              autoComplete="off"
            />
          </label>
          <label>
            <span>Owner or business name</span>
            <input
              value={lookup.ownerName}
              onChange={(event) => updateLookup('ownerName', event.target.value)}
              placeholder="Name to compare"
              aria-label="Owner or business name"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="investigation-tool-primary" disabled={loading}>
            {loading ? 'Checking destination…' : 'Run verification'}
          </button>
        </form>
        {lookupError && <div className="payment-verification-form-error" role="alert">{lookupError}</div>}
        {loading && <div className="payment-verification-loading" role="status">Retrieving the matching training record…</div>}
      </section>

      {!loading && lookupResult?.state === 'not-found' && (
        <section className="payment-verification-not-found" role="status" aria-label="Payment destination not found">
          <span className="payment-status-chip alert">Destination Not Found</span>
          <h3>No exact Bank Code and Destination ID pair was located.</h3>
          <p>Check both identifiers against the source record. A missing destination does not determine the case outcome.</p>
        </section>
      )}

      {!loading && activeRecord ? (
        <>
          <section className="payment-verification-snapshot" aria-label="Account snapshot">
            <article className="payment-verification-hero">
              <p>Account Snapshot</p>
              <h3>{activeRecord.object}</h3>
              <div className="payment-chip-row">
                <span className={`payment-status-chip ${statusTone(lookupResult.nameMatchResult)}`}>{lookupResult.nameMatchResult}</span>
                <span className={`payment-status-chip ${statusTone(activeRecord.operationalStatus)}`}>{activeRecord.operationalStatus}</span>
                <span className={`payment-status-chip ${statusTone(activeRecord.standingStatus)}`}>{activeRecord.standingStatus}</span>
              </div>
            </article>
            {[
              ['Name match result', lookupResult.nameMatchResult],
              ['Ownership status', activeRecord.ownershipStatus],
              ['Operational account status', activeRecord.operationalStatus],
              ['Prior use', activeRecord.priorUseHistory],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </section>

          <div className="payment-verification-workspace payment-verification-workspace-revealed">
            <section className="payment-detail-panel" aria-label="Expanded payment verification detail">
              <header>
                <div>
                  <p>Expanded verification</p>
                  <h3>{activeRecord.id} · {activeRecord.type}</h3>
                  <span>{activeRecord.bankName}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.object)}>Pin object</button>
              </header>

              <dl className="payment-detail-grid">
                {[
                  ['Name match result', lookupResult.nameMatchResult],
                  ['Account holder', activeRecord.accountHolder],
                  ['Ownership status', activeRecord.ownershipStatus],
                  ['Bank name', activeRecord.bankName],
                  ['Operational account status', activeRecord.operationalStatus],
                  ['Standing', activeRecord.standingStatus],
                  ['Payment type', activeRecord.paymentType],
                  ['Payment status', activeRecord.paymentStatus],
                  ['Bank Code', activeRecord.bankCode],
                  ['Destination ID', activeRecord.destinationId],
                  ['Variant', activeRecord.laneVariant],
                  ['First seen', activeRecord.firstSeen],
                  ['Verification method', activeRecord.verificationMethod],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <section className="payment-comparison-panel" aria-label="Old versus new account comparison">
                <article>
                  <span>Old / prior account</span>
                  <strong>{activeRecord.oldDestination}</strong>
                </article>
                <article>
                  <span>New destination</span>
                  <strong>{activeRecord.newDestination}</strong>
                </article>
                <article>
                  <span>Payroll / vendor change comparison</span>
                  <strong>{activeRecord.changeComparison}</strong>
                </article>
              </section>

              <section className="payment-history-grid" aria-label="Ownership and prior-use history">
                <article><span>Ownership history</span><strong>{activeRecord.ownershipHistory}</strong></article>
                <article><span>Prior-use history</span><strong>{activeRecord.priorUseHistory}</strong></article>
                <article><span>Return / NSF history</span><strong>{activeRecord.returnHistory}</strong></article>
                <article><span>Trusted contact source</span><strong>{activeRecord.trustedContactSource}</strong></article>
              </section>
            </section>

            <aside className="payment-verification-case-rail" aria-label="Payment Verification evidence summary">
              <header>
                <p>Evidence-first summary</p>
                <h3>{activeRecord.id}</h3>
              </header>
              <p>{activeRecord.evidenceSummary}</p>
              <dl>
                <div><dt>Customer / entity link</dt><dd>{activeRecord.customerLink}</dd></div>
                <div><dt>Review context</dt><dd>{activeRecord.reviewContext}</dd></div>
                <div><dt>Recoverability context</dt><dd>{activeRecord.recoverability}</dd></div>
              </dl>
              <button type="button" onClick={() => pin(`${activeRecord.id} · ${activeRecord.object}`)}>Pin verified record</button>
            </aside>
          </div>

          <section className="payment-verification-lower-grid" aria-label="Verification attempts and evidence actions">
            <article className="payment-attempt-panel">
              <header>
                <p>Verification attempts</p>
                <h3>{activeRecord.verificationAttempts.length} recorded attempt{activeRecord.verificationAttempts.length === 1 ? '' : 's'}</h3>
              </header>
              <div className="payment-log-list">
                {activeRecord.verificationAttempts.map((entry) => (
                  <div key={entry.id}>
                    <span>{entry.time}</span>
                    <strong>{entry.method} · {entry.result}</strong>
                    <p>{entry.note}</p>
                  </div>
                ))}
              </div>
            </article>

            {showCallback && <article className="payment-call-drawer">
              <header>
                <p>Verification Call Drawer</p>
                <h3>Callback evidence</h3>
              </header>
              <p>{activeRecord.callbackStatus}</p>
              <dl>
                <div><dt>Trusted source</dt><dd>{activeRecord.trustedContactSource}</dd></div>
                <div><dt>Recorded outcome</dt><dd>{activeRecord.verificationOutcome}</dd></div>
              </dl>
            </article>}

            <article className="payment-action-panel">
              <header><p>Evidence actions</p><h3>Document, compare, or route</h3></header>
              <div>
                <button type="button" onClick={() => quickPin?.({
                  label: 'Bank Code',
                  value: activeRecord.bankCode,
                  sourceTool: 'Payment Verification',
                  sourceRecordId: activeRecord.id,
                })}>Quick Pad Bank Code</button>
                <button type="button" onClick={() => quickPin?.({
                  label: 'Destination ID',
                  value: activeRecord.destinationId,
                  sourceTool: 'Payment Verification',
                  sourceRecordId: activeRecord.id,
                })}>Quick Pad Destination ID</button>
                {(activeRecord.actions ?? []).map((action) => <button key={action} type="button" onClick={() => logAction(action)}>{action}</button>)}
                <button type="button" onClick={() => savePaymentNote(`${activeRecord.id} reviewed: ${activeRecord.notes}`)}>Save evidence note</button>
              </div>
            </article>

            <article className="payment-related-records" aria-label="Related records">
              <p>Related Records</p>
              <div>{(activeRecord.relatedRecords ?? []).map((item) => <button key={item} type="button" onClick={() => pin(item)}>{item}</button>)}</div>
            </article>
          </section>
        </>
      ) : null}

      {lookupHistory.length > 0 && (
        <section className="payment-lookup-history" aria-label="Payment Verification lookup history">
          <header><p>Lookup history</p><h3>Recent searches for this case</h3></header>
          <div>
            {lookupHistory.map((item) => (
              <article key={item.id}>
                <span>{item.bankCode} · {item.destinationId}</span>
                <strong>{item.ownerName}</strong>
                <small>{item.outcome}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Payment verification next routes">
        {relatedRoutes.map((route) => <button key={route} type="button" onClick={() => openTool(route)}>{`Open ${route}`}</button>)}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Payment Verification review</strong>
          <span>Run a lookup before marking reviewed. Then check the name result, ownership, operational status, standing, prior use, attempts, and evidence source.</span>
        </div>
        <button type="button" disabled={!lookupResult} className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Payment Verification')}>
          {reviewed ? '✓ Payment Verification reviewed' : 'Mark Payment Verification reviewed'}
        </button>
      </footer>
    </>
  );
}

