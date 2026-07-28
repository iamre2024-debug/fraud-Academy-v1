import { useEffect, useMemo, useRef, useState } from 'react';
import { getFinancialRecords } from './data/caseToolData.js';
import {
  paymentLookupPrefillFromQuery,
  resolvePaymentLookup,
} from './data/paymentVerification.js';
import './paymentVerificationWorkspace.css';

const noop = () => {};

function resultTone(value = '') {
  const normalized = String(value).toLowerCase();
  if (/^match$|^open$|no nsf/.test(normalized)) return 'good';
  if (/partial|unable/.test(normalized)) return 'warn';
  if (/no match|closed|frozen|nsf found|not found/.test(normalized)) return 'alert';
  return 'neutral';
}

function nameRelationship(result) {
  const partyType = result.matchedPartyType ?? 'Person';
  const labels = {
    Match: `Matches ${partyType.toLowerCase()} name`,
    'Partial Match': `Partially matches ${partyType.toLowerCase()} name`,
    'No Match': `Does not match ${partyType.toLowerCase()} name`,
    'Unable to Verify': `${partyType} name could not be verified`,
  };
  return labels[result.nameMatchResult] ?? result.nameMatchResult;
}

export default function PaymentVerificationWorkspace({
  activeCase,
  query = '',
  setQuery = noop,
  pin = noop,
  saveNote = noop,
  markReviewed = noop,
  reviewed = false,
  openTool = noop,
  jumpDecision = noop,
  recordAction = noop,
  quickPin = noop,
}) {
  const records = useMemo(
    () => getFinancialRecords(activeCase).paymentVerification ?? [],
    [activeCase],
  );
  const [lookup, setLookup] = useState({ bankCode: '', destinationId: '', ownerName: '' });
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupHistory, setLookupHistory] = useState([]);
  const resultRef = useRef(null);
  const activeRecord = lookupResult?.state === 'found' ? lookupResult.record : null;

  useEffect(() => {
    setLookup({ bankCode: '', destinationId: '', ownerName: '' });
    setLookupResult(null);
    setLookupError('');
    setLookupHistory([]);
  }, [activeCase.id]);

  useEffect(() => {
    const prefill = paymentLookupPrefillFromQuery(query, records);
    if (!prefill) return;
    const { replace, ...lookupPatch } = prefill;
    setLookup((current) => (
      replace
        ? { bankCode: '', destinationId: '', ownerName: '', ...lookupPatch }
        : { ...current, ...lookupPatch }
    ));
    setLookupResult(null);
    setLookupError('');
  }, [query, records]);

  useEffect(() => {
    if (!lookupResult) return;
    resultRef.current?.focus();
  }, [lookupResult]);

  function updateLookup(field, value) {
    if (query) setQuery('');
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

  function runLookup(event) {
    event.preventDefault();
    const submitted = {
      bankCode: lookup.bankCode.trim(),
      destinationId: lookup.destinationId.trim(),
      ownerName: lookup.ownerName.trim(),
    };
    if (!submitted.bankCode || !submitted.destinationId || !submitted.ownerName) {
      setLookupError('Bank Code, Destination ID, and person, owner, or business name are required.');
      setLookupResult(null);
      return;
    }

    const result = resolvePaymentLookup(records, submitted, activeCase);
    setLookupError('');
    setLookupResult(result);
    const historyItem = {
      id: `${Date.now()}-${submitted.bankCode}-${submitted.destinationId}`,
      ...submitted,
      outcome: result.nameMatchResult,
      partyType: result.matchedPartyType ?? 'Name',
      accountState: result.accountState ?? 'Not found',
      recordId: result.recordId ?? null,
    };
    setLookupHistory((current) => [historyItem, ...current].slice(0, 6));
    recordAction(
      'Payment Verification lookup completed',
      `${submitted.bankCode} / ${submitted.destinationId}: ${result.nameMatchResult}.`,
      'Payment Verification',
    );
  }

  function saveResultNote() {
    if (!activeRecord) return;
    const message = [
      `${lookupResult.nameMatchResult} for the supplied ${lookupResult.matchedPartyType?.toLowerCase() ?? 'name'}`,
      `account ${lookupResult.accountState}`,
      lookupResult.nsfStatus,
      lookupResult.accountAgeLabel,
      `status as of ${lookupResult.statusAsOf}`,
    ].join(' · ');
    saveNote(`Payment Verification: ${activeRecord.id} — ${message}.`, 'Payment verification');
  }

  const relatedRoutes = [
    'Customer 360',
    'Financial Investigation',
    'Employee Profile',
    'Payroll History',
    'Business 360',
    'Timeline',
  ].filter((item) => activeCase.availableTools?.includes(item) || item === 'Timeline');

  return (
    <div className="payment-mission-deck" data-payment-verification-layout="mission-v2">
      <section className="payment-mission-search" aria-label="Payment Verification search">
        <header>
          <div>
            <p>Search before reveal</p>
            <h3>Verify a specific payment destination</h3>
            <span>Run an exact Bank Code and Destination ID search. The result returns only the supplied name relationship, account state, NSF result, and supported account age.</span>
          </div>
          {lookupResult && <button type="button" onClick={resetLookup}>Clear result</button>}
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
            <span>Person, owner, or business name</span>
            <input
              value={lookup.ownerName}
              onChange={(event) => updateLookup('ownerName', event.target.value)}
              placeholder="Name to compare"
              aria-label="Owner or business name"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="payment-mission-primary">Run verification</button>
        </form>
        {lookupError && <div className="payment-mission-form-error" role="alert">{lookupError}</div>}
      </section>

      {!lookupResult && (
        <section className="payment-mission-locked" aria-label="Payment Verification result hidden">
          <span aria-hidden="true">⌕</span>
          <div>
            <strong>Verification result is hidden</strong>
            <p>Enter all three search values and run the lookup. No name, account status, NSF information, or account age appears before the search.</p>
          </div>
        </section>
      )}

      {lookupResult?.state === 'not-found' && (
        <section
          ref={resultRef}
          className="payment-mission-not-found"
          role="status"
          tabIndex="-1"
          aria-label="Payment destination not found"
        >
          <span className="payment-mission-chip alert">Destination Not Found</span>
          <h3>No exact Bank Code and Destination ID pair was located.</h3>
          <p>Check both identifiers against the source record. A missing destination does not determine the case outcome.</p>
          <button type="button" onClick={resetLookup}>Edit search</button>
        </section>
      )}

      {activeRecord && (
        <section
          ref={resultRef}
          className="payment-mission-result"
          role="status"
          tabIndex="-1"
          aria-label="Payment verification result"
        >
          <header className="payment-mission-result-header">
            <div className="payment-mission-account-mark" aria-hidden="true">⌕</div>
            <div>
              <p>Account verification details</p>
              <h3>{activeRecord.type}</h3>
              <span>{lookupResult.bankCode} · {lookupResult.destinationId}</span>
            </div>
            <span className={`payment-mission-chip ${resultTone(lookupResult.nameMatchResult)}`}>
              {lookupResult.nameMatchResult}
            </span>
          </header>

          <section className="payment-mission-facts" aria-label="Account snapshot">
            <article>
              <span>Name relationship</span>
              <strong>{nameRelationship(lookupResult)}</strong>
              <small>{lookupResult.matchedPartyType} name supplied for comparison</small>
            </article>
            <article>
              <span>Account status</span>
              <strong className={resultTone(lookupResult.accountState)}>{lookupResult.accountState}</strong>
              <small>Status as of {lookupResult.statusAsOf}</small>
            </article>
            <article>
              <span>NSF result</span>
              <strong className={resultTone(lookupResult.nsfStatus)}>{lookupResult.nsfStatus}</strong>
              <small>Kept separate from open, closed, or frozen status</small>
            </article>
            <article>
              <span>Time open / on record</span>
              <strong>{lookupResult.accountAgeLabel}</strong>
              <small>
                {lookupResult.accountOpenedDate
                  ? `Opened ${lookupResult.accountOpenedDate}`
                  : `First seen ${activeRecord.firstSeen}; no opening date supplied`}
              </small>
            </article>
          </section>

          <dl className="payment-mission-search-confirmation" aria-label="Searched payment identifiers">
            <div><dt>Bank Code searched</dt><dd>{lookupResult.bankCode}</dd></div>
            <div><dt>Destination ID searched</dt><dd>{lookupResult.destinationId}</dd></div>
            <div><dt>Source record</dt><dd>{lookupResult.recordId}</dd></div>
            <div><dt>Status date</dt><dd>{lookupResult.statusAsOf}</dd></div>
          </dl>

          <div className="payment-mission-actions" aria-label="Payment Verification evidence actions">
            <button type="button" onClick={() => pin(lookupResult.recordId)}>Pin result</button>
            <button type="button" onClick={() => quickPin({
              label: 'Bank Code',
              value: lookupResult.bankCode,
              sourceTool: 'Payment Verification',
              sourceRecordId: lookupResult.recordId,
            })}>Quick Pad Bank Code</button>
            <button type="button" onClick={() => quickPin({
              label: 'Destination ID',
              value: lookupResult.destinationId,
              sourceTool: 'Payment Verification',
              sourceRecordId: lookupResult.recordId,
            })}>Quick Pad Destination ID</button>
            <button type="button" onClick={saveResultNote}>Save evidence note</button>
            <button type="button" onClick={resetLookup}>Edit search</button>
          </div>
        </section>
      )}

      {lookupHistory.length > 0 && (
        <section className="payment-mission-history" aria-label="Payment Verification lookup history">
          <header><p>Lookup history</p><h3>Recent searches in this session</h3></header>
          <div>
            {lookupHistory.map((item) => (
              <article key={item.id}>
                <span>{item.bankCode} · {item.destinationId}</span>
                <strong>{item.partyType}: {item.outcome}</strong>
                <small>{item.accountState}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      <nav className="payment-mission-routes" aria-label="Payment verification next routes">
        {relatedRoutes.map((route) => <button key={route} type="button" onClick={() => openTool(route)}>{`Open ${route}`}</button>)}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>

      <footer className="payment-mission-review">
        <div>
          <strong>Payment Verification review</strong>
          <span>Run an exact lookup and review the name relationship, account state, NSF result, and supported account age before marking this tool reviewed.</span>
        </div>
        <button
          type="button"
          disabled={!activeRecord}
          className={reviewed ? '' : 'payment-mission-primary'}
          onClick={() => markReviewed('Payment Verification')}
        >
          {reviewed ? '✓ Payment Verification reviewed' : 'Mark Payment Verification reviewed'}
        </button>
      </footer>
    </div>
  );
}
