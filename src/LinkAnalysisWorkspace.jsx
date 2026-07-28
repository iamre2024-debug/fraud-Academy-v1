import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatLinkAnalysisPin,
  getLinkIdentifiersForCase,
  getLinkMapContext,
  inferLinkIdentifierType,
  linkIdentifierTypes,
  normalizeLinkIdentifier,
  searchLinkRelationships,
} from './data/linkAnalysisRecords.js';

function LinkGlyph({ type, size = 22 }) {
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

  if (type === 'phone') {
    return <svg {...common}><rect x="7" y="2.5" width="10" height="19" rx="2.2" /><path d="M10 5h4M11 18.5h2" /></svg>;
  }
  if (type === 'email') {
    return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="2.3" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>;
  }
  if (type === 'device') {
    return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="1.8" /><path d="M8 20h8M10 16v4M14 16v4" /></svg>;
  }
  if (type === 'bank-code') {
    return <svg {...common}><path d="m3 9 9-5 9 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18M2 9h20" /></svg>;
  }
  if (type === 'destination-id') {
    return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2.2" /><path d="M3 9h18M7 14h4" /></svg>;
  }
  if (type === 'accounts') {
    return <svg {...common}><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.7-3.2 2.5-5 5.5-5s4.8 1.8 5.5 5M16 6.5a2.6 2.6 0 0 1 0 5M16.5 14c2.3.3 3.6 1.9 4 4.5" /></svg>;
  }
  if (type === 'subject') {
    return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.8-4.5 3.3-7 7.5-7s6.7 2.5 7.5 7" /></svg>;
  }
  if (type === 'transaction') {
    return <svg {...common}><path d="M6 2.5h9l3 3V21H6z" /><path d="M15 2.5V6h3M9 10h6M9 13h3" /><circle cx="15.5" cy="16.5" r="3.5" /><path d="M15.5 14.7v3.6M16.7 15.4c-.4-.4-.8-.6-1.2-.6-.7 0-1.1.4-1.1.9 0 1.3 2.3.7 2.3 1.8 0 .5-.5.9-1.2.9-.5 0-1-.2-1.4-.6" /></svg>;
  }
  if (type === 'search') {
    return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  }
  if (type === 'pin') {
    return <svg {...common}><path d="m9 3 6 0 .7 5 2.3 2v2H6v-2l2.3-2zM12 12v9" /></svg>;
  }
  if (type === 'shield') {
    return <svg {...common}><path d="M12 2.5 20 6v5.5c0 4.8-3 8.1-8 10-5-1.9-8-5.2-8-10V6z" /><path d="m9 12 2 2 4-4" /></svg>;
  }
  return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M8 12h8M12 8v8" /></svg>;
}

function shortValue(value, max = 25) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function GraphLine({ x1 = 350, y1 = 220, x2, y2, tone = 'blue' }) {
  const pointOne = {
    x: x1 + ((x2 - x1) * 0.33),
    y: y1 + ((y2 - y1) * 0.33),
  };
  const pointTwo = {
    x: x1 + ((x2 - x1) * 0.67),
    y: y1 + ((y2 - y1) * 0.67),
  };
  return (
    <g data-tone={tone}>
      <line className="link-analysis-map-line-halo" x1={x1} y1={y1} x2={x2} y2={y2} />
      <line className="link-analysis-map-line" x1={x1} y1={y1} x2={x2} y2={y2} />
      <circle className="link-analysis-map-dot" cx={pointOne.x} cy={pointOne.y} r="4" />
      <circle className="link-analysis-map-dot" cx={pointTwo.x} cy={pointTwo.y} r="4" />
    </g>
  );
}

function RelationshipMap({
  activeType,
  context,
  result,
  onIdentifierSearch,
  onOpenMatches,
}) {
  const positions = {
    subject: [350, 60],
    phone: [105, 118],
    email: [595, 118],
    device: [88, 265],
    bank: [612, 265],
    destination: [165, 382],
    accounts: [535, 382],
  };

  return (
    <section className="link-analysis-map" data-link-analysis-map aria-label="Interactive relationship map">
      <header>
        <div>
          <span>Verified relationship map</span>
          <strong>{context.subject.name}</strong>
        </div>
        <small>{result.message}</small>
      </header>

      <div className="link-analysis-map-canvas">
        <svg viewBox="0 0 700 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <filter id="link-analysis-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <GraphLine x2={positions.subject[0]} y2={positions.subject[1]} />
          <GraphLine x2={positions.phone[0]} y2={positions.phone[1]} />
          <GraphLine x2={positions.email[0]} y2={positions.email[1]} />
          <GraphLine x2={positions.device[0]} y2={positions.device[1]} />
          <GraphLine x2={positions.bank[0]} y2={positions.bank[1]} tone="violet" />
          <GraphLine x2={positions.destination[0]} y2={positions.destination[1]} tone="violet" />
          <GraphLine x2={positions.accounts[0]} y2={positions.accounts[1]} tone="pink" />
        </svg>

        <article className="link-analysis-subject-node">
          <span><LinkGlyph type="subject" size={25} /></span>
          <div>
            <small>{context.subject.label}</small>
            <strong>{context.subject.name}</strong>
            <em>{context.subject.id}</em>
          </div>
        </article>

        <article className="link-analysis-focus-node">
          <span><LinkGlyph type="transaction" size={30} /></span>
          <div>
            <small>Focus transaction</small>
            <strong>{context.transaction.amount}</strong>
            <em>{context.transaction.date} · {context.transaction.time}</em>
          </div>
        </article>

        {context.nodes.map((node) => {
          const value = node.identifier?.value;
          return (
            <button
              key={node.slot}
              type="button"
              className={`link-analysis-orbit-node link-analysis-node-${node.slot}`}
              data-active={activeType === node.type ? 'true' : 'false'}
              disabled={!value}
              onClick={() => value && onIdentifierSearch(value, node.type)}
              aria-label={value ? `Search ${node.label} ${value}` : `${node.label} not available`}
            >
              <span><LinkGlyph type={node.type} size={23} /></span>
              <strong>{node.label}</strong>
              <small>{value ? shortValue(value, 23) : 'Not recorded'}</small>
              <em>{shortValue(node.detail, 24)}</em>
            </button>
          );
        })}

        <button
          type="button"
          className="link-analysis-orbit-node link-analysis-node-accounts"
          data-active={result.matches.length ? 'true' : 'false'}
          onClick={onOpenMatches}
          aria-label={`Open ${result.matches.length} matched accounts`}
        >
          <span><LinkGlyph type="accounts" size={25} /></span>
          <strong>Linked Accounts</strong>
          <small>{result.matches.length} account{result.matches.length === 1 ? '' : 's'}</small>
          <em>{result.summary.restricted} restricted or closed</em>
        </button>
      </div>
      <p className="link-analysis-map-boundary">Lines show exact training-record connections only. They do not label the current case as a fraud ring.</p>
    </section>
  );
}

function StatusPill({ status, tone }) {
  return <span className="link-analysis-status-pill" data-tone={tone}>{status}</span>;
}

function AccountCard({
  activeCase,
  cases,
  expanded,
  match,
  onExpand,
  onOpenAccount,
  onOpenRelatedCase,
  onPin,
  onSaveNote,
}) {
  const relatedCaseAvailable = Boolean(
    match.relatedCaseId
    && match.relatedCaseId !== activeCase.id
    && cases.some((item) => item.id === match.relatedCaseId),
  );

  return (
    <article
      className="link-analysis-account-card"
      data-link-account={match.accountId}
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="link-analysis-account-heading"
        onClick={onExpand}
        aria-expanded={expanded}
      >
        <span className="link-analysis-account-avatar"><LinkGlyph type="subject" size={22} /></span>
        <span className="link-analysis-account-copy">
          <small>{match.accountId} · {match.productType}</small>
          <strong>{match.customerName}</strong>
          <em>{match.relationshipToCurrentCase}</em>
        </span>
        <StatusPill status={match.status} tone={match.tone} />
        <span className="link-analysis-account-chevron" aria-hidden="true">{expanded ? '⌃' : '›'}</span>
      </button>

      {expanded && (
        <div className="link-analysis-account-detail">
          <dl>
            <div><dt>Customer or business</dt><dd>{match.customerName}</dd></div>
            <div><dt>Account ID</dt><dd>{match.accountId}</dd></div>
            <div><dt>Customer type</dt><dd>{match.customerType}</dd></div>
            <div><dt>Product</dt><dd>{match.productType}</dd></div>
            <div><dt>Relationship to current case</dt><dd>{match.relationshipToCurrentCase}</dd></div>
            <div><dt>Exact shared identifier</dt><dd>{match.identifierTypeLabel}: {match.exactSharedIdentifier}</dd></div>
            <div><dt>First use</dt><dd>{match.identifier.firstUse ?? match.firstUse}</dd></div>
            <div><dt>Last use</dt><dd>{match.identifier.lastUse ?? match.lastUse}</dd></div>
            <div><dt>Link source and confidence</dt><dd>{match.identifier.source} · {match.identifier.confidence}</dd></div>
            <div><dt>Account status or restriction</dt><dd>{match.status} · {match.statusSource}</dd></div>
          </dl>
          <p>{match.statusExplanation}</p>
          <aside className="link-analysis-evidence-warning">
            {match.investigativeNote} This exact relationship does not determine the current case finding.
          </aside>
          <nav aria-label={`Actions for ${match.accountId}`}>
            <button type="button" onClick={onOpenAccount}>Open Account</button>
            {relatedCaseAvailable && <button type="button" onClick={onOpenRelatedCase}>Open Related Case</button>}
            <button type="button" onClick={onPin}><LinkGlyph type="pin" size={17} /> Pin Link</button>
            <button type="button" onClick={onSaveNote}>Save Note</button>
          </nav>
        </div>
      )}
    </article>
  );
}

function AccountDossier({ match, onClose, onPin, onSaveNote, onOpenRelatedCase, relatedCaseAvailable }) {
  return (
    <section
      className="link-analysis-account-dossier"
      role="region"
      aria-label={`Open account ${match.accountId}`}
      data-link-account-dossier={match.accountId}
    >
      <header>
        <div>
          <p>Linked account dossier</p>
          <h3>{match.customerName}</h3>
          <span>{match.accountId} · {match.customerType} · {match.productType}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close dossier">×</button>
      </header>
      <div>
        <article><span>Account context</span><strong>{match.accountId}</strong><p>{match.customerType} · {match.productType}</p></article>
        <article><span>Relationship evidence</span><strong>{match.identifierTypeLabel}</strong><p>{match.exactSharedIdentifier} · {match.relationshipToCurrentCase}</p></article>
        <article><span>Link provenance</span><strong>{match.identifier.source}</strong><p>{match.identifier.confidence} · first use {match.identifier.firstUse ?? match.firstUse} · last use {match.identifier.lastUse ?? match.lastUse}</p></article>
        <article><span>Status meaning</span><strong>{match.status}</strong><p>{match.statusExplanation} · {match.statusSource}</p></article>
      </div>
      <aside role="region" aria-label="Current case evidence boundary">
        <strong>Current-case boundary</strong>
        <p>{match.investigativeNote} This exact relationship does not determine the current case finding.</p>
      </aside>
      <nav>
        {relatedCaseAvailable && <button type="button" onClick={onOpenRelatedCase}>Open Related Case</button>}
        <button type="button" onClick={onPin}>Pin Account Link</button>
        <button type="button" onClick={onSaveNote}>Save Dossier Note</button>
      </nav>
    </section>
  );
}

export default function LinkAnalysisWorkspace({
  activeCase,
  cases = [],
  query,
  setQuery,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  jumpDecision,
  recordAction,
  openRelatedCase,
  requestedAccountId = '',
  openedPinnedEvidence,
  revealSearch = false,
}) {
  const suggestions = useMemo(() => getLinkIdentifiersForCase(activeCase), [activeCase]);
  const defaultSuggestion = suggestions.find((item) => item.type === 'phone')
    ?? suggestions.find((item) => item.type === 'training-id')
    ?? suggestions[0];
  const routedIdentifierType = openedPinnedEvidence?.tool === 'Link Analysis'
    && String(query ?? '').trim() === String(openedPinnedEvidence.query ?? '').trim()
    ? openedPinnedEvidence.identifierType ?? ''
    : '';
  const requestedSuggestion = suggestions.find((item) => (
    (!routedIdentifierType || item.type === routedIdentifierType)
    && normalizeLinkIdentifier(item.value, item.type) === normalizeLinkIdentifier(query, item.type)
  ));
  const explicitInitialQuery = String(query ?? '').trim();
  const initialDraft = explicitInitialQuery || defaultSuggestion?.value || '';
  const initialType = routedIdentifierType
    || requestedSuggestion?.type
    || inferLinkIdentifierType('', initialDraft)
    || defaultSuggestion?.type
    || 'phone';
  const [identifierType, setIdentifierType] = useState(initialType);
  const [draft, setDraft] = useState(initialDraft);
  const [submittedQuery, setSubmittedQuery] = useState(explicitInitialQuery);
  const [expandedAccountId, setExpandedAccountId] = useState('');
  const [openedAccountId, setOpenedAccountId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [searchOpen, setSearchOpen] = useState(() => !explicitInitialQuery || revealSearch);
  const accountListRef = useRef(null);
  const dossierRef = useRef(null);
  const activeCaseIdRef = useRef(activeCase.id);
  const context = useMemo(() => getLinkMapContext(activeCase), [activeCase]);
  const result = useMemo(() => searchLinkRelationships({
    query: submittedQuery,
    identifierType,
    cases,
    activeCase,
  }), [activeCase, cases, identifierType, submittedQuery]);
  const visibleMatches = showAll ? result.matches : result.matches.slice(0, 3);
  const openedAccount = result.matches.find((item) => item.accountId === openedAccountId) ?? null;
  const relatedCaseAvailable = Boolean(
    openedAccount?.relatedCaseId
    && openedAccount.relatedCaseId !== activeCase.id
    && cases.some((item) => item.id === openedAccount.relatedCaseId),
  );

  useEffect(() => {
    if (!requestedAccountId) return;
    const requestedAccount = result.matches.find((item) => item.accountId === requestedAccountId);
    setExpandedAccountId(requestedAccount?.accountId ?? '');
    if (requestedAccount) setShowAll(true);
  }, [requestedAccountId, result.matches]);

  useEffect(() => {
    if (activeCaseIdRef.current === activeCase.id) return;
    activeCaseIdRef.current = activeCase.id;
    const nextSuggestions = getLinkIdentifiersForCase(activeCase);
    const next = nextSuggestions.find((item) => item.type === 'phone')
      ?? nextSuggestions.find((item) => item.type === 'training-id')
      ?? nextSuggestions[0];
    const nextValue = next?.value ?? '';
    setIdentifierType(next?.type ?? 'phone');
    setDraft(nextValue);
    setSubmittedQuery('');
    setExpandedAccountId('');
    setOpenedAccountId('');
    setShowAll(false);
    setSearchOpen(true);
    setQuery('');
  }, [activeCase.id, activeCase, setQuery]);

  useEffect(() => {
    const nextQuery = String(query ?? '').trim();
    if (!nextQuery) {
      if (!submittedQuery) return;
      setIdentifierType(defaultSuggestion?.type ?? 'phone');
      setDraft(defaultSuggestion?.value ?? '');
      setSubmittedQuery('');
      setExpandedAccountId('');
      setOpenedAccountId('');
      setShowAll(false);
      setSearchOpen(true);
      return;
    }
    const suggestion = suggestions.find((item) => (
      (!routedIdentifierType || item.type === routedIdentifierType)
      && normalizeLinkIdentifier(item.value, item.type) === normalizeLinkIdentifier(nextQuery, item.type)
    ));
    const nextType = routedIdentifierType
      || suggestion?.type
      || inferLinkIdentifierType('', nextQuery)
      || identifierType;
    if (
      nextType === identifierType
      && normalizeLinkIdentifier(nextQuery, nextType) === normalizeLinkIdentifier(submittedQuery, nextType)
    ) return;
    setIdentifierType(nextType);
    setDraft(nextQuery);
    setSubmittedQuery(nextQuery);
    setExpandedAccountId('');
    setOpenedAccountId('');
  }, [defaultSuggestion, identifierType, query, routedIdentifierType, submittedQuery, suggestions]);

  useEffect(() => {
    if (revealSearch && query) setSearchOpen(true);
  }, [query, revealSearch]);

  function runSearch(value = draft, type = identifierType, shouldOpenSearch = false) {
    const cleanValue = String(value ?? '').trim();
    if (!cleanValue) return;
    setIdentifierType(type);
    setDraft(cleanValue);
    setSubmittedQuery(cleanValue);
    setQuery(cleanValue);
    setExpandedAccountId('');
    setOpenedAccountId('');
    setShowAll(false);
    setSearchOpen(shouldOpenSearch);
    const nextResult = searchLinkRelationships({
      query: cleanValue,
      identifierType: type,
      cases,
      activeCase,
    });
    recordAction?.(
      'Link search completed',
      `${nextResult.identifierTypeLabel} ${cleanValue} returned ${nextResult.matches.length} exact matched account${nextResult.matches.length === 1 ? '' : 's'}.`,
      'Link Analysis',
    );
  }

  function scrollToMatches() {
    setShowAll(true);
    accountListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function linkPinValue(match) {
    return formatLinkAnalysisPin({
      identifierType: match.identifierType,
      value: match.exactSharedIdentifier,
      accountId: match.accountId,
    });
  }

  function pinLink(match) {
    pin(linkPinValue(match));
  }

  function saveLinkNote(match) {
    saveNote(
      `Link Analysis: exact ${match.identifierTypeLabel} ${match.exactSharedIdentifier} appears on ${match.accountId}. Verified account status: ${match.status}. This relationship is evidence only and does not determine the active case.`,
      'Link Analysis',
    );
  }

  function openAccount(match) {
    setOpenedAccountId(match.accountId);
    recordAction?.('Opened linked account', `${match.accountId} opened from Link Analysis.`, 'Link Analysis');
    window.setTimeout(() => dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  function saveSummaryNote() {
    saveNote(
      `Link Analysis: ${result.identifierTypeLabel} ${result.searchedIdentifier} returned ${result.summary.total} exact account match(es), including ${result.summary.restricted} restricted or closed linked account(s). No current-case conclusion was assigned.`,
      'Link Analysis',
    );
  }

  function copyToQuickPad() {
    quickPin?.({
      label: result.identifierTypeLabel,
      value: result.searchedIdentifier,
      sourceTool: 'Link Analysis',
      sourceRecordId: result.matches[0]?.identifier.sourceRecordId ?? '',
    });
  }

  return (
    <div
      className="link-analysis-workspace"
      data-link-analysis-workspace
      data-link-analysis-state={submittedQuery ? 'searched' : 'empty'}
    >
      <header className="link-analysis-page-header">
        <div className="link-analysis-title-icon"><LinkGlyph type="shield" size={28} /></div>
        <div>
          <p>Connections · Evidence First</p>
          <h2>Link Analysis</h2>
          <span>Search exact identifiers, inspect linked accounts, and document only verified relationships.</span>
        </div>
        <div className="link-analysis-page-actions">
          <span>{activeCase.id}</span>
          <button type="button" onClick={jumpDecision}>Submit Decision</button>
        </div>
      </header>

      <details
        className="link-analysis-search-shell"
        role="region"
        aria-label="Cross-account Link Analysis search"
        open={searchOpen}
        onToggle={(event) => setSearchOpen(event.currentTarget.open)}
      >
        <summary>
          <span><LinkGlyph type="search" size={21} /></span>
          <div>
            <strong>{submittedQuery ? `${result.identifierTypeLabel} · ${submittedQuery}` : 'Search a shared identifier'}</strong>
            <small>{submittedQuery ? result.message : 'Phone, email, Training ID, device, IP, Bank Code, or Destination ID'}</small>
          </div>
          <b aria-hidden="true">{searchOpen ? '⌃' : '⌄'}</b>
        </summary>
        <form onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <label>
            <span>Identifier type</span>
            <select
              value={identifierType}
              onChange={(event) => {
                const nextType = event.target.value;
                const matchingSuggestion = suggestions.find((item) => item.type === nextType);
                setIdentifierType(nextType);
                setDraft(matchingSuggestion?.value ?? '');
              }}
              aria-label="Choose Link Analysis identifier type"
            >
              {linkIdentifierTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>Exact fictional value</span>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Enter an exact identifier"
              aria-label="Search Link Analysis identifier"
            />
          </label>
          <button type="submit" disabled={!draft.trim()}>Search accounts</button>
        </form>
        <div className="link-analysis-suggestions" aria-label="Current case identifiers">
          {suggestions.slice(0, 10).map((item) => (
            <button
              key={`${item.type}-${item.value}`}
              type="button"
              data-selected={
                item.type === identifierType
                && normalizeLinkIdentifier(item.value, item.type) === normalizeLinkIdentifier(submittedQuery, item.type)
                  ? 'true'
                  : 'false'
              }
              onClick={() => runSearch(item.value, item.type)}
            >
              <LinkGlyph type={item.type} size={17} />
              <span><small>{item.shortLabel}</small><strong>{shortValue(item.value, 28)}</strong></span>
            </button>
          ))}
        </div>
      </details>

      {submittedQuery ? (
        <>
          <div className="link-analysis-main-grid">
            <RelationshipMap
              activeType={identifierType}
              context={context}
              result={result}
              onIdentifierSearch={(value, type) => runSearch(value, type)}
              onOpenMatches={scrollToMatches}
            />

            <div className="link-analysis-results-column">
              <section className="link-analysis-result-banner link-analysis-result-summary" aria-live="polite">
                <span><LinkGlyph type={identifierType} size={23} /></span>
                <div>
                  <small>Searched identifier · {result.identifierTypeLabel}</small>
                  <strong>{result.searchedIdentifier}</strong>
                  <p><b>{result.summary.total}</b> matched account{result.summary.total === 1 ? '' : 's'}</p>
                </div>
                <div>
                  <button type="button" onClick={copyToQuickPad} disabled={!quickPin}><LinkGlyph type="pin" size={16} /> Quick Pad</button>
                  <button
                    type="button"
                    onClick={() => pin(formatLinkAnalysisPin({
                      identifierType: result.identifierType,
                      value: result.searchedIdentifier,
                    }))}
                  >
                    Pin Search
                  </button>
                </div>
              </section>

              <section className="link-analysis-account-list" ref={accountListRef} aria-label="Matched Accounts">
                <header>
                  <div>
                    <p>Matched Accounts</p>
                    <h3>Exact cross-account matches</h3>
                  </div>
                  {result.matches.length > 3 && (
                    <button type="button" onClick={() => setShowAll((current) => !current)}>
                      {showAll ? 'Show 3' : `View all ${result.matches.length}`}
                    </button>
                  )}
                </header>
                <div>
                  {visibleMatches.map((match) => (
                    <AccountCard
                      key={`${match.accountId}-${match.identifierType}`}
                      activeCase={activeCase}
                      cases={cases}
                      match={match}
                      expanded={expandedAccountId === match.accountId}
                      onExpand={() => setExpandedAccountId((current) => current === match.accountId ? '' : match.accountId)}
                      onOpenAccount={() => openAccount(match)}
                      onOpenRelatedCase={() => openRelatedCase?.(match.relatedCaseId)}
                      onPin={() => pinLink(match)}
                      onSaveNote={() => saveLinkNote(match)}
                    />
                  ))}
                  {!result.matches.length && (
                    <div className="link-analysis-empty" role="status">
                      <LinkGlyph type="search" size={25} />
                      <strong>0 matched accounts</strong>
                      <p>No account in the fictional training index contains that exact identifier.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="link-analysis-summary" data-link-analysis-summary aria-label="Verified Links Summary">
                <header>
                  <LinkGlyph type="shield" size={20} />
                  <div><p>Verified Links Summary</p><span>Exact records only</span></div>
                </header>
                <div className="link-analysis-summary-metrics">
                  <article><strong>{result.summary.total}</strong><span>Total Links</span></article>
                  <article><strong>{result.summary.exact}</strong><span>Exact Matches</span></article>
                  <article><strong>{result.summary.restricted}</strong><span>Restricted / Closed</span></article>
                  <article><strong>{result.summary.relatedCases}</strong><span>Related Cases</span></article>
                </div>
                <aside>
                  <span aria-hidden="true">🐱</span>
                  <div>
                    <strong>Luna · factual link summary</strong>
                    <p>{result.summary.total
                      ? `${result.summary.total} exact account match${result.summary.total === 1 ? '' : 'es'} returned. ${result.summary.restricted} linked account${result.summary.restricted === 1 ? ' has' : 's have'} a recorded restriction or closure.`
                      : 'No exact linked-account record returned for this value.'} This does not decide the active case.</p>
                  </div>
                </aside>
              </section>
            </div>
          </div>

          {openedAccount && (
            <div ref={dossierRef}>
              <AccountDossier
                match={openedAccount}
                relatedCaseAvailable={relatedCaseAvailable}
                onClose={() => setOpenedAccountId('')}
                onOpenRelatedCase={() => openRelatedCase?.(openedAccount.relatedCaseId)}
                onPin={() => pinLink(openedAccount)}
                onSaveNote={() => saveLinkNote(openedAccount)}
              />
            </div>
          )}
        </>
      ) : (
        <section className="link-analysis-empty" role="status">
          <LinkGlyph type="search" size={29} />
          <strong>Search before viewing account links.</strong>
          <p>The relationship map will show exact training-record connections without assigning an outcome.</p>
        </section>
      )}

      <footer className="link-analysis-review-bar investigation-tool-review-bar">
        <div>
          <strong>Link Analysis review</strong>
          <span>A link is evidence, not an automatic conclusion about the current case.</span>
        </div>
        <nav>
          <button type="button" onClick={saveSummaryNote} disabled={!submittedQuery}>Save Factual Summary</button>
          <button type="button" onClick={() => markReviewed('Link Analysis')} disabled={!submittedQuery}>
            {reviewed ? '✓ Link Analysis Reviewed' : 'Mark Reviewed'}
          </button>
          <button type="button" className="primary" onClick={jumpDecision}>Submit Decision</button>
        </nav>
      </footer>
    </div>
  );
}
