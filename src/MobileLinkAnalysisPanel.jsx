import { useEffect, useMemo, useState } from 'react';
import MobileLunaPortrait from './MobileLunaPortrait.jsx';
import { getFinancialRecords } from './data/caseToolData.js';
import { getCustomer360Dossier } from './data/customer360Dossier.js';

const identifierTypes = [
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['training', 'Training ID'],
  ['device', 'Device'],
  ['ip', 'IP'],
  ['bank', 'Bank Code'],
  ['destination', 'Destination ID'],
];

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function unique(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${normalize(item.value)}`;
    if (!item.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function identifiersForCase(activeCase) {
  const payment = getFinancialRecords(activeCase).paymentVerification ?? [];
  return unique([
    { type: 'phone', label: 'Phone Number', value: activeCase.customer?.contact?.phone, source: 'Customer 360', first: activeCase.customer?.relationshipSince, last: activeCase.reportedDate ?? activeCase.opened },
    { type: 'email', label: 'Email', value: activeCase.customer?.contact?.email, source: 'Customer 360', first: activeCase.customer?.relationshipSince, last: activeCase.reportedDate ?? activeCase.opened },
    { type: 'training', label: 'Training ID', value: activeCase.trainingId, source: 'Identity Intelligence', first: activeCase.customer?.relationshipSince, last: activeCase.reportedDate ?? activeCase.opened },
    ...(activeCase.loginHistory ?? []).flatMap((item) => [
      { type: 'device', label: 'Device ID', value: item.deviceId ?? item.device, source: 'Device Intelligence', first: item.time, last: item.time, sourceRecordId: item.id },
      { type: 'ip', label: 'IP Address', value: item.ip, source: 'IP Intelligence', first: item.time, last: item.time, sourceRecordId: item.id },
    ]),
    ...payment.flatMap((item) => [
      { type: 'bank', label: 'Bank Code', value: item.bankCode, source: 'Payment Verification', first: item.firstSeen ?? item.lastSeen, last: item.lastSeen ?? item.firstSeen, sourceRecordId: item.id },
      { type: 'destination', label: 'Destination ID', value: item.destinationId, source: 'Payment Verification', first: item.firstSeen ?? item.lastSeen, last: item.lastSeen ?? item.firstSeen, sourceRecordId: item.id },
    ]),
  ]);
}

function linkedAccounts(cases, type, value, currentCaseId) {
  const needle = normalize(value);
  if (!needle) return [];
  return cases.flatMap((caseItem) => {
    const match = identifiersForCase(caseItem).find((item) => item.type === type && normalize(item.value) === needle);
    if (!match) return [];
    const dossier = getCustomer360Dossier(caseItem);
    return dossier.products.map((product, index) => ({
      id: `${caseItem.id}:${product.id}`,
      caseId: caseItem.id,
      name: caseItem.profile?.business ?? caseItem.person,
      accountId: product.id,
      product: product.product,
      standing: product.standing,
      status: product.status,
      relationship: caseItem.id === currentCaseId
        ? 'Current case account'
        : `Shared ${match.label.toLowerCase()} recorded in the training link index`,
      firstUse: match.first ?? product.opened ?? 'Not supplied',
      lastUse: match.last ?? caseItem.reportedDate ?? caseItem.opened ?? 'Not supplied',
      source: match.source,
      sourceRecordId: match.sourceRecordId ?? '',
      primary: index === 0,
    }));
  });
}

function statusTone(status = '', standing = '') {
  const text = `${status} ${standing}`.toLowerCase();
  if (/closed/.test(text)) return 'closed';
  if (/restricted|hold|pending/.test(text)) return 'restricted';
  if (/nsf|return|overdraft/.test(text)) return 'nsf';
  return 'open';
}

function SpiderMap({ value, accounts, selectedIds }) {
  const selected = accounts.filter((account) => selectedIds.includes(account.id)).slice(0, 6);
  const centerX = 160;
  const centerY = 135;
  const radius = 94;

  return (
    <section className="mobile-link-map" aria-label="Selected verified relationship map">
      <header><span>Verified relationship map</span><strong>{selected.length} selected account{selected.length === 1 ? '' : 's'}</strong></header>
      <svg viewBox="0 0 320 270" role="img" aria-label={`${value} connected to ${selected.length} selected accounts`}>
        <defs>
          <filter id="link-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="link-node" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0b7de4" /><stop offset="1" stopColor="#6e45da" /></linearGradient>
        </defs>
        {selected.map((account, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return <line key={`line-${account.id}`} x1={centerX} y1={centerY} x2={x} y2={y} className="mobile-link-line" />;
        })}
        <circle cx={centerX} cy={centerY} r="43" className="mobile-link-center" filter="url(#link-glow)" />
        <text x={centerX} y={centerY - 5} textAnchor="middle" className="mobile-link-center-label">SEARCHED</text>
        <text x={centerX} y={centerY + 12} textAnchor="middle" className="mobile-link-center-value">{String(value).slice(0, 18)}</text>
        {selected.map((account, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <g key={account.id} transform={`translate(${x} ${y})`}>
              <circle r="31" fill="url(#link-node)" className="mobile-link-node" />
              <text y="-3" textAnchor="middle" className="mobile-link-node-name">{account.name.slice(0, 12)}</text>
              <text y="12" textAnchor="middle" className="mobile-link-node-id">{account.accountId.slice(-12)}</text>
            </g>
          );
        })}
      </svg>
      {!selected.length && <p>Select a verified account below to place it on the relationship map.</p>}
    </section>
  );
}

export default function MobileLinkAnalysisPanel({
  activeCase,
  cases,
  query,
  setQuery,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  recordAction,
  openRelatedCase,
  openRelatedAccount,
  jumpDecision,
}) {
  const suggestions = useMemo(() => identifiersForCase(activeCase), [activeCase]);
  const suggestedType = suggestions.find((item) => normalize(item.value) === normalize(query))?.type ?? 'phone';
  const [type, setType] = useState(suggestedType);
  const [draft, setDraft] = useState(query ?? '');
  const [submitted, setSubmitted] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const accounts = useMemo(
    () => linkedAccounts(cases, type, submitted, activeCase.id),
    [activeCase.id, cases, submitted, type],
  );
  const typeLabel = identifierTypes.find(([key]) => key === type)?.[1] ?? 'Identifier';

  useEffect(() => {
    setDraft(query ?? '');
    if (query) {
      const matchingSuggestion = suggestions.find((item) => normalize(item.value) === normalize(query));
      if (matchingSuggestion) setType(matchingSuggestion.type);
    }
  }, [query, suggestions]);

  useEffect(() => {
    setSubmitted('');
    setSelectedIds([]);
  }, [activeCase.id]);

  function runSearch(event) {
    event?.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setSubmitted(clean);
    setQuery(clean);
    const nextAccounts = linkedAccounts(cases, type, clean, activeCase.id);
    setSelectedIds(nextAccounts.slice(0, 1).map((item) => item.id));
    recordAction?.(
      'Link search completed',
      `${typeLabel} ${clean} returned ${nextAccounts.length} matched account${nextAccounts.length === 1 ? '' : 's'}.`,
      'Link Analysis',
    );
  }

  function toggleSelected(accountId) {
    setSelectedIds((current) => current.includes(accountId)
      ? current.filter((item) => item !== accountId)
      : [...current, accountId]);
  }

  return (
    <section className="mobile-reference-tool mobile-link-analysis" data-mobile-reference-tool="Link Analysis" data-link-search-state={submitted ? 'searched' : 'locked'}>
      <section className="mobile-link-search">
        <div className="mobile-link-search-heading"><span aria-hidden="true">🕸</span><div><p>Search before relationships appear</p><h2>Link Analysis</h2><small>Use one factual identifier from the case record.</small></div></div>
        <form onSubmit={runSearch}>
          <label><span>Identifier type</span><select value={type} onChange={(event) => { setType(event.target.value); setSubmitted(''); }}>{identifierTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label><span>{typeLabel}</span><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Enter ${typeLabel.toLowerCase()}`} aria-label="Search Link Analysis identifier" /></label>
          <button type="submit" disabled={!draft.trim()}>Search links</button>
        </form>
        <div className="mobile-link-suggestions" aria-label="Current-case identifiers available to search">
          {suggestions.slice(0, 8).map((item) => <button key={`${item.type}-${item.value}`} type="button" onClick={() => { setType(item.type); setDraft(item.value); setSubmitted(''); }}>{item.label}<small>{item.value}</small></button>)}
        </div>
      </section>

      {!submitted ? (
        <section className="mobile-link-locked" aria-label="Link results hidden until search">
          <span aria-hidden="true">✦</span><strong>Matched accounts stay hidden until you search.</strong><p>The map shows only relationships returned by the training link index. It does not decide whether a ring exists.</p>
        </section>
      ) : (
        <>
          <section className="mobile-link-result-summary">
            <div><span>{typeLabel}</span><h3>{submitted}</h3><p>{accounts.length} matched account{accounts.length === 1 ? '' : 's'}</p></div>
            <div>
              <button type="button" onClick={() => quickPin({ label: typeLabel, value: submitted, sourceTool: 'Link Analysis' })}>📌 Quick Pad</button>
              <button type="button" onClick={() => pin(`${typeLabel}: ${submitted}`)}>⭐ Pin evidence</button>
            </div>
          </section>

          <SpiderMap value={submitted} accounts={accounts} selectedIds={selectedIds} />

          <section className="mobile-linked-account-list" aria-label="Matching linked accounts">
            <header><span>Matching accounts</span><strong>Expand a record to review the verified relationship.</strong></header>
            {accounts.map((account) => (
              <details key={account.id} open={account.primary}>
                <summary>
                  <button
                    type="button"
                    className={selectedIds.includes(account.id) ? 'selected' : ''}
                    onClick={(event) => { event.preventDefault(); toggleSelected(account.id); }}
                    aria-pressed={selectedIds.includes(account.id)}
                    aria-label={`${selectedIds.includes(account.id) ? 'Remove' : 'Add'} ${account.accountId} ${selectedIds.includes(account.id) ? 'from' : 'to'} relationship map`}
                  >🕸</button>
                  <span><small>{account.caseId} · {account.product}</small><strong>{account.name}</strong><em data-tone={statusTone(account.status, account.standing)}>{account.status}</em></span>
                </summary>
                <dl>
                  <div><dt>Account ID</dt><dd>{account.accountId}</dd></div>
                  <div><dt>Product / account type</dt><dd>{account.product}</dd></div>
                  <div><dt>Account standing</dt><dd>{account.standing}</dd></div>
                  <div><dt>Relationship to current case</dt><dd>{account.relationship}</dd></div>
                  <div><dt>First use</dt><dd>{account.firstUse}</dd></div>
                  <div><dt>Last use</dt><dd>{account.lastUse}</dd></div>
                  <div><dt>Verified source</dt><dd>{account.source}</dd></div>
                </dl>
                <nav>
                  <button type="button" onClick={() => openRelatedAccount?.(account.caseId, account.accountId)}>Open related account</button>
                  <button type="button" onClick={() => openRelatedCase?.(account.caseId)}>Open related case</button>
                  <button type="button" onClick={() => quickPin({ label: 'Account ID', value: account.accountId, sourceTool: 'Link Analysis', sourceRecordId: account.accountId })}>Quick Pad account</button>
                </nav>
              </details>
            ))}
            {!accounts.length && <p className="mobile-reference-empty">No account in the current training catalog matches this exact identifier.</p>}
          </section>

          <aside className="mobile-link-luna-summary">
            <MobileLunaPortrait size={52} />
            <div><span>Luna · verified-link summary</span><strong>{accounts.length} matched account{accounts.length === 1 ? '' : 's'} returned.</strong><p>{accounts.length ? `Recorded statuses: ${[...new Set(accounts.map((item) => item.status))].join(' · ')}.` : 'No account status is available because the exact search returned no match.'} This summary does not assign a ring or a case outcome.</p></div>
          </aside>

          <div className="mobile-reference-inline-actions">
            <button type="button" onClick={() => saveNote(`Link Analysis: ${typeLabel} ${submitted} returned ${accounts.length} matched account(s).`, 'Link Analysis')}>Add factual link note</button>
            <button type="button" onClick={() => markReviewed('Link Analysis')}>{reviewed ? '✓ Link Analysis reviewed' : 'Mark Link Analysis reviewed'}</button>
            <button type="button" onClick={jumpDecision}>Submit Decision</button>
          </div>
        </>
      )}
    </section>
  );
}
