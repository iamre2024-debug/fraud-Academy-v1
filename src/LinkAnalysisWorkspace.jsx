import { useEffect, useMemo, useState } from 'react';
import { searchLinkedAccounts, suggestedLinkSearches } from './data/linkAnalysis.js';

export default function LinkAnalysisWorkspace({
  activeCase,
  cases,
  query,
  setQuery,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  jumpDecision,
  openRelatedCase,
  recordAction,
}) {
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [expandedAccountId, setExpandedAccountId] = useState('');
  const [openedAccountId, setOpenedAccountId] = useState('');
  const suggestions = useMemo(() => suggestedLinkSearches(activeCase), [activeCase]);
  const result = useMemo(
    () => searchLinkedAccounts({ query: submittedQuery, cases, activeCase }),
    [activeCase, cases, submittedQuery],
  );
  const openedAccount = result.matches.find((match) => match.accountId === openedAccountId) ?? null;
  const openedAccountRelatedCaseAvailable = Boolean(
    openedAccount?.relatedCaseId
    && openedAccount.relatedCaseId !== activeCase.id
    && cases.some((item) => item.id === openedAccount.relatedCaseId),
  );

  useEffect(() => {
    setSubmittedQuery('');
    setExpandedAccountId('');
    setOpenedAccountId('');
    setQuery('');
  }, [activeCase.id, setQuery]);

  function runSearch(value = query) {
    const next = String(value ?? '').trim();
    setQuery(next);
    setSubmittedQuery(next);
    setExpandedAccountId('');
    setOpenedAccountId('');
    if (next) recordAction?.('Searched Link Analysis', `Searched cross-account records for ${next}.`, 'Link Analysis');
  }

  function openAccount(match) {
    setExpandedAccountId(match.accountId);
    setOpenedAccountId(match.accountId);
    recordAction?.('Opened linked account', `${match.accountId} opened from the ${match.identifierType} match.`, 'Link Analysis');
  }

  function saveLinkNote(match) {
    saveNote(
      `Link Analysis: ${match.exactSharedIdentifier} appears on ${match.accountId} (${match.status}). This link is evidence only and does not determine the current case finding.`,
      'Link Analysis',
    );
  }

  return (
    <>
      <section className="link-analysis-search" aria-label="Cross-account Link Analysis search">
        <div>
          <p>Search-first cross-account review</p>
          <h3>Search one exact fictional identifier</h3>
          <span>Training ID, Business ID, fictional EIN, owner Training ID, phone, email, address, Bank Code, Destination ID, Device ID, or IP address.</span>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <label>
            <span>Identifier</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try TRN-8842-19, DST-7740, or a Device ID"
              aria-label="Search Link Analysis identifier"
            />
          </label>
          <button type="submit" disabled={!query.trim()}>Search accounts</button>
        </form>
        {!!suggestions.length && (
          <div className="link-analysis-suggestions" aria-label="Identifiers available in the current case">
            <span>Current-case identifiers</span>
            {suggestions.map((item) => (
              <button key={`${item.type}-${item.value}`} type="button" onClick={() => runSearch(item.value)}>
                <small>{item.type}</small>{item.value}
              </button>
            ))}
          </div>
        )}
      </section>

      {!submittedQuery ? (
        <section className="link-analysis-empty" role="status">
          <strong>Search before viewing account links.</strong>
          <span>The current case does not preload a conclusion or a list of its own objects.</span>
        </section>
      ) : (
        <>
          <section className="link-analysis-result-summary" aria-live="polite">
            <div><span>Searched identifier</span><strong>{result.searchedIdentifier}</strong><small>{result.identifierType}</small></div>
            <div><span>Cross-account result</span><strong>{result.matches.length} matched account{result.matches.length === 1 ? '' : 's'}</strong><small>Each relationship requires investigation.</small></div>
          </section>

          {result.matches.length ? (
            <div className="link-analysis-results" aria-label="Matched accounts">
              {result.matches.map((match) => {
                const expanded = expandedAccountId === match.accountId;
                return (
                  <article key={`${match.accountId}-${match.identifierType}`} data-link-account={match.accountId} data-link-expanded={expanded ? 'true' : 'false'}>
                    <button type="button" className="link-analysis-account-heading" onClick={() => setExpandedAccountId(expanded ? '' : match.accountId)} aria-expanded={expanded}>
                      <span><small>{match.customerType} · {match.productType}</small><strong>{match.customerName}</strong><em>{match.accountId}</em></span>
                      <span><small>{match.relationshipToCurrentCase}</small><strong>{match.status}</strong><em>{expanded ? 'Collapse' : 'Expand'}</em></span>
                    </button>
                    {expanded && (
                      <div className="link-analysis-account-detail">
                        <dl>
                          <div><dt>Customer or business</dt><dd>{match.customerName}</dd></div>
                          <div><dt>Account ID</dt><dd>{match.accountId}</dd></div>
                          <div><dt>Customer type</dt><dd>{match.customerType}</dd></div>
                          <div><dt>Product</dt><dd>{match.productType}</dd></div>
                          <div><dt>Relationship to current case</dt><dd>{match.relationshipToCurrentCase}</dd></div>
                          <div><dt>Exact shared identifier</dt><dd>{match.identifierType}: {match.exactSharedIdentifier}</dd></div>
                          <div><dt>First use</dt><dd>{match.firstUse}</dd></div>
                          <div><dt>Last use</dt><dd>{match.lastUse}</dd></div>
                          <div><dt>Link source and confidence</dt><dd>{match.linkSource} · {match.confidence}</dd></div>
                          <div><dt>Account status or restriction</dt><dd>{match.status}</dd></div>
                        </dl>
                        <p>{match.statusExplanation}</p>
                        <p className="link-analysis-evidence-warning">{match.investigativeNote}</p>
                        <nav aria-label={`Actions for ${match.accountId}`}>
                          <button type="button" onClick={() => openAccount(match)}>Open Account</button>
                          {match.relatedCaseId && match.relatedCaseId !== activeCase.id && cases.some((item) => item.id === match.relatedCaseId) && (
                            <button type="button" onClick={() => openRelatedCase?.(match.relatedCaseId)}>Open Related Case</button>
                          )}
                          <button type="button" onClick={() => pin(`${match.identifierType}: ${match.exactSharedIdentifier} · ${match.accountId}`)}>Pin link</button>
                          <button type="button" onClick={() => saveLinkNote(match)}>Save evidence note</button>
                        </nav>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="link-analysis-empty" role="status">
              <strong>0 matched accounts</strong>
              <span>No account in the fictional training index contains that exact identifier.</span>
            </section>
          )}
        </>
      )}

      {openedAccount && (
        <section
          className="link-analysis-account-dossier"
          role="region"
          aria-label={`Linked account dossier ${openedAccount.accountId}`}
          data-link-account-dossier={openedAccount.accountId}
        >
          <header>
            <div>
              <p>Linked account dossier</p>
              <h3>{openedAccount.customerName}</h3>
              <span>{openedAccount.accountId} · {openedAccount.customerType} · {openedAccount.productType}</span>
            </div>
            <button type="button" onClick={() => setOpenedAccountId('')}>Close dossier</button>
          </header>
          <div className="link-analysis-dossier-grid">
            <article>
              <span>Account context</span>
              <strong>{openedAccount.status}</strong>
              <p>First use {openedAccount.firstUse}; last use {openedAccount.lastUse}.</p>
            </article>
            <article>
              <span>Relationship evidence</span>
              <strong>{openedAccount.identifierType}: {openedAccount.exactSharedIdentifier}</strong>
              <p>{openedAccount.relationshipToCurrentCase}</p>
            </article>
            <article>
              <span>Link provenance</span>
              <strong>{openedAccount.linkSource}</strong>
              <p>{openedAccount.confidence} confidence · exact identifier match</p>
            </article>
            <article>
              <span>Related case</span>
              <strong>{openedAccountRelatedCaseAvailable ? openedAccount.relatedCaseId : 'No related case available'}</strong>
              <p>{openedAccountRelatedCaseAvailable ? 'Open the related case to review its evidence separately.' : 'The account match remains available for current-case investigation.'}</p>
            </article>
          </div>
          <section className="link-analysis-dossier-status" aria-label="Linked account status meaning">
            <span>Status meaning</span>
            <p>{openedAccount.statusExplanation}</p>
          </section>
          <section className="link-analysis-dossier-boundary" aria-label="Current case evidence boundary">
            <span>Current-case boundary</span>
            <p>{openedAccount.investigativeNote}</p>
          </section>
          <nav aria-label={`Dossier actions for ${openedAccount.accountId}`}>
            {openedAccountRelatedCaseAvailable && (
              <button type="button" onClick={() => openRelatedCase?.(openedAccount.relatedCaseId)}>Open Related Case</button>
            )}
            <button type="button" onClick={() => pin(`${openedAccount.identifierType}: ${openedAccount.exactSharedIdentifier} · ${openedAccount.accountId}`)}>Pin account link</button>
            <button type="button" onClick={() => saveLinkNote(openedAccount)}>Save dossier note</button>
          </nav>
        </section>
      )}

      <nav className="investigation-tool-next-routes" aria-label="Link Analysis next routes">
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>
      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Link Analysis review</strong>
          <span>A link is evidence, not an automatic conclusion. NSF, missing paperwork, restrictions, and prior confirmed fraud each require present-case relationship analysis.</span>
        </div>
        <button type="button" disabled={!submittedQuery} className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Link Analysis')}>
          {reviewed ? '✓ Link Analysis reviewed' : 'Mark Link Analysis reviewed'}
        </button>
      </footer>
    </>
  );
}
