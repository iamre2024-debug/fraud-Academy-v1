import { useEffect, useMemo, useState } from 'react';
import {
  buildLinkAnalysisWorkspace,
  filterAndSortLinkedAccounts,
  findLinkAnalysisResult,
  linkAccountFilters,
} from './data/linkAnalysisRecords.js';

const pageSize = 8;

function firstIdentifier(workspace) {
  return workspace.identifiers.find((identifier) => identifier.key === 'phone')
    ?? workspace.identifiers[0]
    ?? null;
}

function statusCount(result, filterKey) {
  if (!result) return 0;
  return {
    all: result.counts.total,
    'good-standing': result.counts.goodStanding,
    'on-hold': result.counts.onHold,
    closed: result.counts.closed,
    'fraud-history': result.counts.fraudHistory,
    restricted: result.counts.restricted,
    recent: result.counts.recent,
  }[filterKey] ?? 0;
}

function recordActionSafely(recordAction, action, detail) {
  recordAction?.(action, detail, 'Link Analysis');
}

function AccountStatus({ account }) {
  return (
    <span className="link-account-status" data-link-status={account.status}>
      {account.statusLabel}
    </span>
  );
}

function SummaryTile({ tone, icon, label, value, percent }) {
  return (
    <article className="link-summary-tile" data-link-tone={tone}>
      <span className="link-summary-icon" aria-hidden="true">{icon}</span>
      <strong>{value}</strong>
      <div><b>{label}</b><small>{percent}%</small></div>
    </article>
  );
}

function LinkedAccountCard({ account, selected, onOpenAccount, onOpenCase }) {
  return (
    <article
      className={`link-account-mobile-card ${selected ? 'selected' : ''}`}
      data-linked-account={account.accountId}
    >
      <header>
        <span className="link-account-avatar" data-link-status={account.status}>{account.initials}</span>
        <div><strong>{account.customer}</strong><small>{account.accountId}</small></div>
        <AccountStatus account={account} />
      </header>
      <dl>
        <div><dt>Account type</dt><dd>{account.accountType} · {account.accountGroup}</dd></div>
        <div><dt>Relationship</dt><dd>{account.relationship} · {account.relationshipState}</dd></div>
        <div><dt>First seen</dt><dd>{account.firstSeen}</dd></div>
        <div><dt>Last seen</dt><dd>{account.lastSeen}</dd></div>
      </dl>
      <div className="link-account-card-actions">
        <button type="button" onClick={() => onOpenAccount(account)}>Open account</button>
        <button type="button" onClick={() => onOpenCase(account)}>Open linked case</button>
      </div>
    </article>
  );
}

function AccountDetail({
  account,
  detailMode,
  onClose,
  onOpenAccount,
  onOpenCase,
  onAddNote,
  onPin,
  openTool,
}) {
  if (!account) {
    return (
      <aside className="link-detail-drawer link-detail-empty" aria-label="Linked account details">
        <span aria-hidden="true">↗</span>
        <h3>Open a linked record</h3>
        <p>Select an account or case from the result list to review its exact relationship and status context.</p>
      </aside>
    );
  }

  const linkedCase = account.linkedCase;
  return (
    <aside className="link-detail-drawer" aria-label={detailMode === 'case' ? 'Linked case details' : 'Linked account details'}>
      <header className="link-detail-heading">
        <div>
          <p>{detailMode === 'case' ? 'Linked Case Details' : 'Account Details'}</p>
          <span>{detailMode === 'case' ? linkedCase.id : account.accountId}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close linked record details">×</button>
      </header>

      <div className="link-detail-tabs" role="tablist" aria-label="Linked record detail view">
        <button
          type="button"
          role="tab"
          aria-selected={detailMode === 'account'}
          className={detailMode === 'account' ? 'active' : ''}
          onClick={() => onOpenAccount(account)}
        >
          Account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={detailMode === 'case'}
          className={detailMode === 'case' ? 'active' : ''}
          onClick={() => onOpenCase(account)}
        >
          Linked case
        </button>
      </div>

      {detailMode === 'account' ? (
        <>
          <section className="link-detail-person">
            <span className="link-account-avatar" data-link-status={account.status}>{account.initials}</span>
            <div>
              <h3>{account.customer}</h3>
              <p>{account.accountId}</p>
              <AccountStatus account={account} />
            </div>
          </section>

          <dl className="link-detail-list">
            <div><dt>Account type</dt><dd>{account.accountType}</dd></div>
            <div><dt>Account group</dt><dd>{account.accountGroup}</dd></div>
            <div><dt>Open date</dt><dd>{account.opened}</dd></div>
            <div><dt>Recorded balance</dt><dd>{account.balance}</dd></div>
          </dl>

          <section className="link-detail-section">
            <h4>Status information</h4>
            <dl className="link-detail-list">
              <div><dt>Current status</dt><dd>{account.statusLabel}</dd></div>
              <div><dt>Status reason</dt><dd>{account.statusDetail}</dd></div>
              <div><dt>Next review</dt><dd>{account.nextReview}</dd></div>
            </dl>
          </section>

          <section className="link-detail-section">
            <h4>Identifier relationship</h4>
            <dl className="link-detail-list">
              <div><dt>Relationship</dt><dd>{account.relationship}</dd></div>
              <div><dt>First seen</dt><dd>{account.firstSeen}</dd></div>
              <div><dt>Last seen</dt><dd>{account.lastSeen}</dd></div>
              <div><dt>Use count</dt><dd>{account.useCount}</dd></div>
            </dl>
          </section>

          <section className="link-detail-section">
            <h4>Recorded history</h4>
            <dl className="link-detail-list">
              <div><dt>Prior fraud cases</dt><dd>{account.priorFraudCases}</dd></div>
              <div><dt>Returned payments</dt><dd>{account.returnedPaymentHistory}</dd></div>
              <div><dt>30-day activity</dt><dd>{account.activityVelocity}</dd></div>
              <div><dt>Watchlist status</dt><dd>{account.watchlistStatus}</dd></div>
            </dl>
          </section>

          <p className="link-detail-context">{account.context}</p>
        </>
      ) : (
        <>
          <section className="link-linked-case-hero">
            <span aria-hidden="true">▤</span>
            <div>
              <h3>{linkedCase.id}</h3>
              <p>{linkedCase.type}</p>
              <strong>{linkedCase.status}</strong>
            </div>
          </section>
          <dl className="link-detail-list">
            <div><dt>Opened</dt><dd>{linkedCase.opened}</dd></div>
            <div><dt>Relationship</dt><dd>{linkedCase.relationship}</dd></div>
            <div><dt>Matched value</dt><dd>{account.identifierValue}</dd></div>
            <div><dt>Source record</dt><dd>{account.sourceRecordId}</dd></div>
          </dl>
          <section className="link-linked-case-summary">
            <h4>Case record summary</h4>
            <p>{linkedCase.summary}</p>
          </section>
          <p className="link-detail-context">
            This linked record is provided for investigation context. Verify the underlying dates and records before documenting what the relationship means.
          </p>
        </>
      )}

      <nav className="link-detail-actions" aria-label="Linked record actions">
        <button type="button" className="primary" onClick={() => onOpenAccount(account)}>Open Account</button>
        <button type="button" onClick={() => onOpenCase(account)}>Open Linked Case</button>
        {account.isCurrentAccount && (
          <button type="button" onClick={() => openTool('Customer 360')}>Open in Customer 360</button>
        )}
        <button type="button" onClick={() => onPin(account)}>Pin Linked Record</button>
        <button type="button" onClick={() => onAddNote(account)}>Add to Case Notes</button>
      </nav>

      <small className="link-detail-footnote">
        Results are based on an exact identifier match. Verify context before drawing conclusions.
      </small>
    </aside>
  );
}

export default function LinkAnalysisWorkspace({
  activeCase,
  cases,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  recordAction,
}) {
  const workspace = useMemo(
    () => buildLinkAnalysisWorkspace(activeCase, cases),
    [activeCase, cases],
  );
  const initialIdentifier = firstIdentifier(workspace);
  const [identifierType, setIdentifierType] = useState(initialIdentifier?.key ?? '');
  const [searchValue, setSearchValue] = useState(initialIdentifier?.values[0] ?? '');
  const [resultId, setResultId] = useState(() => {
    if (!initialIdentifier) return '';
    return `${initialIdentifier.key}:${String(initialIdentifier.values[0]).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  });
  const [searchMessage, setSearchMessage] = useState('');
  const [filters, setFilters] = useState(['all']);
  const [sort, setSort] = useState('most-recent');
  const [page, setPage] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [detailMode, setDetailMode] = useState('account');

  const activeIdentifier = workspace.identifiers.find((identifier) => identifier.key === identifierType)
    ?? workspace.identifiers[0]
    ?? null;
  const result = workspace.resultSets[resultId] ?? null;
  const filteredAccounts = useMemo(
    () => filterAndSortLinkedAccounts(result?.accounts ?? [], filters, sort),
    [filters, result, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageAccounts = filteredAccounts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedAccount = result?.accounts.find((account) => account.id === selectedAccountId) ?? null;

  useEffect(() => {
    const nextIdentifier = firstIdentifier(workspace);
    if (!nextIdentifier) {
      setIdentifierType('');
      setSearchValue('');
      setResultId('');
      setSelectedAccountId('');
      return;
    }
    const nextValue = nextIdentifier.values[0];
    const nextResult = findLinkAnalysisResult(workspace, nextIdentifier.key, nextValue);
    setIdentifierType(nextIdentifier.key);
    setSearchValue(nextValue);
    setResultId(nextResult?.id ?? '');
    setSelectedAccountId(nextResult?.accounts[0]?.id ?? '');
    setDetailMode('account');
    setFilters(['all']);
    setSort('most-recent');
    setPage(1);
    setSearchMessage('');
  }, [activeCase.id]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function runSearch(nextType = identifierType, nextValue = searchValue) {
    const match = findLinkAnalysisResult(workspace, nextType, nextValue);
    setPage(1);
    setFilters(['all']);
    if (!match) {
      setResultId('');
      setSelectedAccountId('');
      setSearchMessage('No exact identifier match was found. Check the recorded value and search again.');
      recordActionSafely(recordAction, 'Link search returned no exact match', `${nextType}: ${nextValue}`);
      return;
    }
    setIdentifierType(nextType);
    setSearchValue(nextValue);
    setResultId(match.id);
    setSelectedAccountId(match.accounts[0]?.id ?? '');
    setDetailMode('account');
    setSearchMessage('');
    recordActionSafely(recordAction, 'Ran exact Link Analysis search', `${match.label} ${match.value} returned ${match.counts.total} linked accounts.`);
  }

  function selectIdentifierType(nextType) {
    const identifier = workspace.identifiers.find((item) => item.key === nextType);
    setIdentifierType(nextType);
    setSearchValue(identifier?.values[0] ?? '');
    setSearchMessage('');
  }

  function openOtherIdentifier(identifier) {
    const value = identifier.values[0] ?? '';
    setIdentifierType(identifier.key);
    setSearchValue(value);
    runSearch(identifier.key, value);
  }

  function toggleFilter(filterKey) {
    setPage(1);
    setFilters((current) => {
      if (filterKey === 'all') return ['all'];
      const withoutAll = current.filter((item) => item !== 'all');
      const next = withoutAll.includes(filterKey)
        ? withoutAll.filter((item) => item !== filterKey)
        : [...withoutAll, filterKey];
      return next.length ? next : ['all'];
    });
  }

  function openAccount(account) {
    setSelectedAccountId(account.id);
    setDetailMode('account');
    recordActionSafely(recordAction, 'Opened linked account record', `${account.accountId} opened from ${result?.label ?? 'Link Analysis'}.`);
  }

  function openLinkedCase(account) {
    setSelectedAccountId(account.id);
    setDetailMode('case');
    recordActionSafely(recordAction, 'Opened linked case record', `${account.linkedCase.id} opened from ${account.accountId}.`);
  }

  function addAccountNote(account) {
    saveNote(
      `${result?.label ?? 'Identifier'} ${result?.value ?? account.identifierValue} links to ${account.accountId} (${account.customer}). Account status: ${account.statusLabel}. Relationship: ${account.relationship}. First seen: ${account.firstSeen}; last seen: ${account.lastSeen}.`,
      'Link Analysis',
    );
  }

  function pinAccount(account) {
    pin(`${account.id} | ${account.accountId} | ${result?.value ?? account.identifierValue}`);
  }

  if (!activeCase || !workspace.identifiers.length) {
    return (
      <section className="link-analysis-workspace link-analysis-empty" data-link-analysis-screen="reference-v1">
        <h2>Link Analysis</h2>
        <p>No searchable identifiers are recorded for this training case.</p>
        <button type="button" onClick={() => markReviewed('Link Analysis')}>
          {reviewed ? '✓ Link Analysis reviewed' : 'Mark Link Analysis reviewed'}
        </button>
      </section>
    );
  }

  return (
    <section className="link-analysis-workspace" data-link-analysis-screen="reference-v1">
      <aside className="link-search-rail" aria-label="Link Analysis identifier search and filters">
        <header className="link-analysis-title">
          <p><span aria-hidden="true">▣</span> Link Analysis <i aria-hidden="true">⌁ ✦</i></p>
          <small>Identify exact relationships across customers, accounts, devices, emails, phones, payments, and cases.</small>
        </header>

        <section className="link-current-case">
          <span>Current case</span>
          <strong>{activeCase.person}</strong>
          <b>{activeCase.id}</b>
        </section>

        <form
          className="link-identifier-search"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <header><strong>Identifier Search</strong><span title="Exact values only" aria-label="Exact values only">i</span></header>
          <label>
            <span>Identifier type</span>
            <select
              value={identifierType}
              onChange={(event) => selectIdentifierType(event.target.value)}
              aria-label="Choose Link Analysis identifier type"
            >
              {workspace.identifiers.map((identifier) => (
                <option key={identifier.key} value={identifier.key}>{identifier.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{activeIdentifier?.label ?? 'Identifier'} value</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              aria-label="Search Link Analysis exact identifier"
              placeholder={`Enter exact ${activeIdentifier?.label?.toLowerCase() ?? 'identifier'}`}
            />
          </label>
          <button type="submit">Search</button>
          <small>Results stay factual: a match count does not determine the current case.</small>
        </form>

        <section className="link-other-identifiers">
          <h3>Other identifiers</h3>
          <div>
            {workspace.identifiers
              .filter((identifier) => identifier.key !== identifierType)
              .map((identifier) => (
                <button key={identifier.key} type="button" onClick={() => openOtherIdentifier(identifier)}>
                  <span aria-hidden="true">{identifier.icon}</span>
                  <span><strong>{identifier.label}</strong><small>{identifier.values.length} recorded value{identifier.values.length === 1 ? '' : 's'}</small></span>
                </button>
              ))}
          </div>
        </section>

        <fieldset className="link-filter-list" disabled={!result}>
          <legend>Filter results</legend>
          <button type="button" onClick={() => setFilters(['all'])}>Clear all</button>
          {linkAccountFilters.map((filter) => (
            <label key={filter.key}>
              <input
                type="checkbox"
                checked={filters.includes(filter.key)}
                onChange={() => toggleFilter(filter.key)}
              />
              <span>{filter.label}</span>
              <strong>{statusCount(result, filter.key)}</strong>
            </label>
          ))}
        </fieldset>

        <button type="button" className="link-system-route" onClick={() => openTool('System Access Lane')}>
          Open System Access Lane
        </button>
      </aside>

      <main className="link-results-column">
        {searchMessage && <section className="link-search-message" role="status">{searchMessage}</section>}
        {!result && !searchMessage && (
          <section className="link-search-message" role="status">
            Enter an exact recorded identifier to open linked account results.
          </section>
        )}

        {result && (
          <>
            <section className="link-summary-panel" aria-label={`Link summary for ${result.value}`}>
              <header>
                <h2>Link Summary for {result.value}</h2>
                <span>{result.counts.total} matched accounts</span>
              </header>
              <div className="link-summary-tiles">
                <SummaryTile tone="good" icon="♢" label="Good Standing" value={result.counts.goodStanding} percent={result.percentages.goodStanding} />
                <SummaryTile tone="hold" icon="Ⅱ" label="On Hold" value={result.counts.onHold} percent={result.percentages.onHold} />
                <SummaryTile tone="restricted" icon="△" label="NSF / Credit" value={result.counts.restricted} percent={result.percentages.restricted} />
                <SummaryTile tone="closed" icon="×" label="Closed" value={result.counts.closed} percent={result.percentages.closed} />
                <SummaryTile tone="total" icon="◉" label="Total Linked" value={result.counts.total} percent={result.percentages.total} />
              </div>

              <section className="link-luna-summary">
                <span className="link-luna-mark" aria-hidden="true">☾</span>
                <div>
                  <h3>Luna Link Summary</h3>
                  {result.lunaSummary.map((line) => <p key={line}>{line}</p>)}
                </div>
                <span className="link-luna-orbit" aria-hidden="true">✦</span>
              </section>

              <section className="link-context-guide" aria-label="Identifier relationship context">
                <article>
                  <span aria-hidden="true">○</span>
                  <div><h3>Common shared-use context</h3>{result.normalContext.map((line) => <p key={line}>{line}</p>)}</div>
                </article>
                <article>
                  <span aria-hidden="true">◇</span>
                  <div><h3>Review-required context</h3>{result.reviewContext.map((line) => <p key={line}>{line}</p>)}</div>
                </article>
              </section>
            </section>

            <section className="link-account-results" aria-label="Linked account results">
              <header className="link-results-heading">
                <div><h2>Linked Accounts ({filteredAccounts.length})</h2><span>Exact {result.label.toLowerCase()} match</span></div>
                <label>
                  <span>Sort by</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort linked accounts">
                    <option value="most-recent">Most Recent</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Customer Name</option>
                    <option value="status">Account Status</option>
                  </select>
                </label>
              </header>

              <div className="link-account-table-wrap">
                <table className="link-account-table">
                  <thead>
                    <tr>
                      <th>Account / Customer</th>
                      <th>Account Type</th>
                      <th>Status</th>
                      <th>Relationship</th>
                      <th>First Seen</th>
                      <th>Last Seen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageAccounts.map((account) => (
                      <tr key={account.id} className={selectedAccount?.id === account.id ? 'selected' : ''} data-linked-account={account.accountId}>
                        <td><span className="link-account-avatar" data-link-status={account.status}>{account.initials}</span><span><strong>{account.customer}</strong><small>{account.accountId}</small></span></td>
                        <td><strong>{account.accountType}</strong><small>{account.accountGroup}</small></td>
                        <td><AccountStatus account={account} /><small>{account.statusDetail}</small></td>
                        <td><strong>{account.relationship}</strong><small>{account.relationshipState}</small></td>
                        <td>{account.firstSeen}</td>
                        <td>{account.lastSeen}</td>
                        <td>
                          <button type="button" onClick={() => openAccount(account)} aria-label={`Open account ${account.accountId}`}>↗</button>
                          <button type="button" onClick={() => openLinkedCase(account)} aria-label={`Open linked case ${account.linkedCase.id}`}>▤</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="link-account-mobile-list">
                {pageAccounts.map((account) => (
                  <LinkedAccountCard
                    key={account.id}
                    account={account}
                    selected={selectedAccount?.id === account.id}
                    onOpenAccount={openAccount}
                    onOpenCase={openLinkedCase}
                  />
                ))}
              </div>

              {!filteredAccounts.length && (
                <p className="link-no-filter-results">No linked accounts match the selected filters.</p>
              )}

              <footer className="link-pagination">
                <span>
                  Showing {filteredAccounts.length ? ((safePage - 1) * pageSize) + 1 : 0} to {Math.min(safePage * pageSize, filteredAccounts.length)} of {filteredAccounts.length}
                </span>
                <div>
                  <button type="button" disabled={safePage === 1} onClick={() => setPage(1)} aria-label="First linked account page">«</button>
                  <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous linked account page">‹</button>
                  {Array.from({ length: Math.min(5, pageCount) }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={safePage === pageNumber ? 'active' : ''}
                      aria-current={safePage === pageNumber ? 'page' : undefined}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} aria-label="Next linked account page">›</button>
                  <button type="button" disabled={safePage === pageCount} onClick={() => setPage(pageCount)} aria-label="Last linked account page">»</button>
                </div>
              </footer>
            </section>

            <footer className="link-review-footer">
              <div>
                <strong>Link Analysis review</strong>
                <span>Document the account-level context you relied on. Match volume alone does not decide the case.</span>
              </div>
              <nav aria-label="Link Analysis next actions">
                <button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button>
                <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
                <button type="button" className="primary" onClick={() => markReviewed('Link Analysis')}>
                  {reviewed ? '✓ Link Analysis reviewed' : 'Mark Link Analysis reviewed'}
                </button>
              </nav>
            </footer>
          </>
        )}
      </main>

      <AccountDetail
        account={selectedAccount}
        detailMode={detailMode}
        onClose={() => setSelectedAccountId('')}
        onOpenAccount={openAccount}
        onOpenCase={openLinkedCase}
        onAddNote={addAccountNote}
        onPin={pinAccount}
        openTool={openTool}
      />
    </section>
  );
}
