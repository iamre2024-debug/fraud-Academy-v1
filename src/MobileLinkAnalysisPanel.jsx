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

const identifierIcons = {
  phone: '☎',
  email: '✉',
  training: '✦',
  device: '▣',
  ip: '◎',
  bank: '⌂',
  destination: '▤',
};

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

function SpiderMap({ type, typeLabel, value, accounts, selectedIds }) {
  const selected = accounts.filter((account) => selectedIds.includes(account.id)).slice(0, 5);
  const centerX = 160;
  const centerY = 135;
  const radius = selected.length < 3 ? 92 : 101;

  return (
    <section className="mobile-link-map" aria-label="Selected verified relationship map">
      <header>
        <div>
          <span>Verified relationship map</span>
          <strong>{typeLabel} connections</strong>
        </div>
        <small>{selected.length} of {accounts.length} on map</small>
      </header>
      <svg viewBox="0 0 320 270" role="img" aria-label={`${value} connected to ${selected.length} selected accounts`}>
        <defs>
          <filter id="link-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="link-soft-glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="link-node" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#087fe9" /><stop offset=".55" stopColor="#2868e7" /><stop offset="1" stopColor="#814ce5" /></linearGradient>
          <radialGradient id="link-center" cx=".35" cy=".25"><stop stopColor="#6ceaff" /><stop offset=".4" stopColor="#167fe3" /><stop offset="1" stopColor="#4935bb" /></radialGradient>
        </defs>
        {selected.map((account, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <g key={`line-${account.id}`}>
              <line x1={centerX} y1={centerY} x2={x} y2={y} className="mobile-link-line mobile-link-line-halo" />
              <line x1={centerX} y1={centerY} x2={x} y2={y} className="mobile-link-line" />
              <circle cx={(centerX + x) / 2} cy={(centerY + y) / 2} r="3.5" className="mobile-link-pulse" filter="url(#link-soft-glow)" />
            </g>
          );
        })}
        <circle cx={centerX} cy={centerY} r="50" className="mobile-link-center-orbit" />
        <circle cx={centerX} cy={centerY} r="40" fill="url(#link-center)" className="mobile-link-center" filter="url(#link-glow)" />
        <text x={centerX} y={centerY - 10} textAnchor="middle" className="mobile-link-center-icon">{identifierIcons[type] ?? '⌕'}</text>
        <text x={centerX} y={centerY + 8} textAnchor="middle" className="mobile-link-center-label">{typeLabel.toUpperCase()}</text>
        <text x={centerX} y={centerY + 23} textAnchor="middle" className="mobile-link-center-value">{String(value).slice(0, 18)}</text>
        {selected.map((account, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <g key={account.id} transform={`translate(${x} ${y})`}>
              <circle r="34" className="mobile-link-node-orbit" />
              <circle r="28" fill="url(#link-node)" className="mobile-link-node" filter="url(#link-soft-glow)" />
              <text y="-8" textAnchor="middle" className="mobile-link-node-icon">♙</text>
              <text y="7" textAnchor="middle" className="mobile-link-node-name">{account.name.slice(0, 11)}</text>
              <text y="19" textAnchor="middle" className="mobile-link-node-id">{account.accountId.slice(-10)}</text>
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
  const [searchExpanded, setSearchExpanded] = useState(true);

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
    setSearchExpanded(true);
  }, [activeCase.id]);

  function runSearch(event) {
    event?.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setSubmitted(clean);
    setSearchExpanded(false);
    setQuery(clean);
    const nextAccounts = linkedAccounts(cases, type, clean, activeCase.id);
    setSelectedIds(nextAccounts.slice(0, 4).map((item) => item.id));
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
    <section className="mobile-reference-tool mobile-link-analysis mobile-core-tool-v2" data-mobile-reference-tool="Link Analysis" data-link-search-state={submitted ? 'searched' : 'locked'}>
      <details className="mobile-link-search-shell" open={searchExpanded} onToggle={(event) => setSearchExpanded(event.currentTarget.open)}>
        <summary>
          <span aria-hidden="true">{submitted ? '⌕' : '🕸'}</span>
          <div>
            <strong>{submitted ? 'Change link search' : 'Search before relationships appear'}</strong>
            <small>{submitted ? `${typeLabel} · ${submitted}` : 'Phone, email, Training ID, device, IP, Bank Code, or Destination ID'}</small>
          </div>
          <b aria-hidden="true">⌄</b>
        </summary>
        <section className="mobile-link-search">
          <div className="mobile-link-search-heading"><span aria-hidden="true">⌕</span><div><p>Search before relationships appear</p><h2>Find a shared identifier</h2><small>Use one factual identifier from the current case record.</small></div></div>
          <form onSubmit={runSearch}>
            <label><span>Identifier type</span><select value={type} onChange={(event) => { setType(event.target.value); setSubmitted(''); }}>{identifierTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label><span>{typeLabel}</span><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Enter ${typeLabel.toLowerCase()}`} aria-label="Search Link Analysis identifier" /></label>
            <button type="submit" disabled={!draft.trim()}>Search links</button>
          </form>
          <div className="mobile-link-suggestions" aria-label="Current-case identifiers available to search">
            {suggestions.slice(0, 8).map((item) => <button key={`${item.type}-${item.value}`} type="button" onClick={() => { setType(item.type); setDraft(item.value); setSubmitted(''); }}><span aria-hidden="true">{identifierIcons[item.type] ?? '⌕'}</span><strong>{item.label}</strong><small>{item.value}</small></button>)}
          </div>
        </section>
      </details>

      {!submitted ? (
        <section className="mobile-link-locked" aria-label="Link results hidden until search">
          <span aria-hidden="true">✦</span><strong>Matched accounts stay hidden until you search.</strong><p>The map shows only relationships returned by the training link index. It does not decide whether a ring exists.</p>
        </section>
      ) : (
        <>
          <section className="mobile-link-result-summary">
            <span className="mobile-link-result-icon" aria-hidden="true">{identifierIcons[type] ?? '⌕'}</span>
            <div><span>Searched {typeLabel}</span><h3>{submitted}</h3><p><strong>{accounts.length}</strong> matched account{accounts.length === 1 ? '' : 's'}</p></div>
            <div>
              <button type="button" onClick={() => quickPin({ label: typeLabel, value: submitted, sourceTool: 'Link Analysis' })}>📌 Quick Pad</button>
              <button type="button" onClick={() => pin(`${typeLabel}: ${submitted}`)}>⭐ Pin evidence</button>
            </div>
            <small className="mobile-link-evidence-note">Quick Pad copies a factual identifier. Pin evidence is a separate investigator action.</small>
          </section>

          <SpiderMap type={type} typeLabel={typeLabel} value={submitted} accounts={accounts} selectedIds={selectedIds} />

          <section className="mobile-linked-account-list" aria-label="Matching linked accounts">
            <header><span>Matched accounts</span><strong>Expand a factual account relationship</strong><small>{accounts.length} exact match{accounts.length === 1 ? '' : 'es'}</small></header>
            {accounts.map((account) => (
              <details key={account.id} open={account.primary}>
                <summary>
                  <button
                    type="button"
                    className={selectedIds.includes(account.id) ? 'selected' : ''}
                    onClick={(event) => { event.preventDefault(); toggleSelected(account.id); }}
                    aria-pressed={selectedIds.includes(account.id)}
                    aria-label={`${selectedIds.includes(account.id) ? 'Remove' : 'Add'} ${account.accountId} ${selectedIds.includes(account.id) ? 'from' : 'to'} relationship map`}
                  >{selectedIds.includes(account.id) ? '●' : '○'}</button>
                  <span><small>{account.accountId} · {account.product}</small><strong>{account.name}</strong><em>{account.relationship}</em></span>
                  <b data-tone={statusTone(account.status, account.standing)}>{account.status}</b>
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
                  <button type="button" onClick={() => quickPin({ label: 'Account ID', value: account.accountId, sourceTool: 'Link Analysis', sourceRecordId: account.accountId })}>📌 Quick Pad account</button>
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
