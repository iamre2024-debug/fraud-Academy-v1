import { useEffect, useMemo, useState } from 'react';
import MobileLunaPortrait from './MobileLunaPortrait.jsx';
import {
  getLinkedRelationships,
  getLinkIdentifiersForCase,
  normalizeLinkIdentifier,
} from './data/linkAnalysisRelationships.js';

const identifierTypes = [
  ['phone', 'Phone Number'],
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

function statusTone(status = '', standing = '') {
  const text = `${status} ${standing}`.toLowerCase();
  if (/closed/.test(text)) return 'closed';
  if (/restricted|hold|pending/.test(text)) return 'restricted';
  if (/nsf|return|overdraft/.test(text)) return 'nsf';
  return 'open';
}

function SpiderMap({ type, typeLabel, value, relationships, selectedIds }) {
  const selected = relationships.filter((relationship) => selectedIds.includes(relationship.id)).slice(0, 5);
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
        <small>{selected.length} of {relationships.length} on map</small>
      </header>
      <svg viewBox="0 0 320 270" role="img" aria-label={`${value} connected to ${selected.length} selected relationships`}>
        <defs>
          <filter id="link-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="link-soft-glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="link-node" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#087fe9" /><stop offset=".55" stopColor="#2868e7" /><stop offset="1" stopColor="#814ce5" /></linearGradient>
          <radialGradient id="link-center" cx=".35" cy=".25"><stop stopColor="#6ceaff" /><stop offset=".4" stopColor="#167fe3" /><stop offset="1" stopColor="#4935bb" /></radialGradient>
        </defs>
        {selected.map((relationship, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <g key={`line-${relationship.id}`}>
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
        {selected.map((relationship, index) => {
          const angle = ((Math.PI * 2) / Math.max(selected.length, 1)) * index - Math.PI / 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          return (
            <g key={relationship.id} transform={`translate(${x} ${y})`}>
              <circle r="34" className="mobile-link-node-orbit" />
              <circle r="28" fill="url(#link-node)" className="mobile-link-node" filter="url(#link-soft-glow)" />
              <text y="-8" textAnchor="middle" className="mobile-link-node-icon">♙</text>
              <text y="7" textAnchor="middle" className="mobile-link-node-name">{relationship.name.slice(0, 11)}</text>
              <text y="19" textAnchor="middle" className="mobile-link-node-id">{(relationship.accountId || relationship.caseId).slice(-10)}</text>
            </g>
          );
        })}
      </svg>
      {!selected.length && <p>Select a verified relationship below to place it on the relationship map.</p>}
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
  const suggestions = useMemo(() => getLinkIdentifiersForCase(activeCase), [activeCase]);
  const suggestedType = suggestions
    .find((item) => normalizeLinkIdentifier(item.value) === normalizeLinkIdentifier(query))?.type ?? 'phone';
  const [type, setType] = useState(suggestedType);
  const [draft, setDraft] = useState(query ?? '');
  const [submitted, setSubmitted] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchExpanded, setSearchExpanded] = useState(true);

  const relationships = useMemo(
    () => getLinkedRelationships(cases, type, submitted, activeCase.id),
    [activeCase.id, cases, submitted, type],
  );
  const accountRelationships = relationships.filter((item) => item.scope === 'account');
  const profileRelationships = relationships.filter((item) => item.scope === 'profile');
  const typeLabel = identifierTypes.find(([key]) => key === type)?.[1] ?? 'Identifier';

  useEffect(() => {
    setDraft(query ?? '');
    if (query) {
      const matchingSuggestion = suggestions
        .find((item) => normalizeLinkIdentifier(item.value) === normalizeLinkIdentifier(query));
      if (matchingSuggestion) setType(matchingSuggestion.type);
    }
    if (normalizeLinkIdentifier(query) !== normalizeLinkIdentifier(submitted)) {
      setSubmitted('');
      setSelectedIds([]);
      setSearchExpanded(true);
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
    const nextRelationships = getLinkedRelationships(cases, type, clean, activeCase.id);
    const nextAccountCount = nextRelationships.filter((item) => item.scope === 'account').length;
    const nextProfileCount = nextRelationships.filter((item) => item.scope === 'profile').length;
    setSelectedIds(nextRelationships.slice(0, 4).map((item) => item.id));
    recordAction?.(
      'Link search completed',
      `${typeLabel} ${clean} returned ${nextAccountCount} matched account${nextAccountCount === 1 ? '' : 's'} and ${nextProfileCount} profile-level match${nextProfileCount === 1 ? '' : 'es'}.`,
      'Link Analysis',
    );
  }

  function toggleSelected(relationshipId) {
    setSelectedIds((current) => current.includes(relationshipId)
      ? current.filter((item) => item !== relationshipId)
      : [...current, relationshipId]);
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
          <span aria-hidden="true">✦</span><strong>Matched relationships stay hidden until you search.</strong><p>The map shows only relationships returned by the training link index. It does not decide whether a ring exists.</p>
        </section>
      ) : (
        <>
          <section className="mobile-link-result-summary">
            <span className="mobile-link-result-icon" aria-hidden="true">{identifierIcons[type] ?? '⌕'}</span>
            <div>
              <span>Searched {typeLabel}</span>
              <h3>{submitted}</h3>
              <p><strong>{accountRelationships.length}</strong> matched account{accountRelationships.length === 1 ? '' : 's'}</p>
              {profileRelationships.length > 0 && <small>{profileRelationships.length} case/profile-level match{profileRelationships.length === 1 ? '' : 'es'} shown separately</small>}
            </div>
            <div>
              <button type="button" onClick={() => quickPin({
                label: typeLabel,
                value: submitted,
                sourceTool: 'Link Analysis',
                queryHint: submitted,
                useTool: 'Link Analysis',
                openAction: 'source-query',
                openTargetTool: 'Link Analysis',
              })}>📌 Quick Pad</button>
              <button type="button" onClick={() => pin(`${typeLabel}: ${submitted}`)}>⭐ Pin evidence</button>
            </div>
            <small className="mobile-link-evidence-note">Quick Pad copies a factual identifier. Pin evidence is a separate investigator action.</small>
          </section>

          <SpiderMap type={type} typeLabel={typeLabel} value={submitted} relationships={relationships} selectedIds={selectedIds} />

          <section className="mobile-linked-account-list" aria-label="Matching linked relationships">
            <header><span>Matched relationships</span><strong>Account links and profile links stay distinct</strong><small>{relationships.length} exact identifier match{relationships.length === 1 ? '' : 'es'}</small></header>
            {relationships.map((relationship) => (
              <details key={relationship.id} open={relationship.primary}>
                <summary>
                  <button
                    type="button"
                    className={selectedIds.includes(relationship.id) ? 'selected' : ''}
                    onClick={(event) => { event.preventDefault(); toggleSelected(relationship.id); }}
                    aria-pressed={selectedIds.includes(relationship.id)}
                    aria-label={`${selectedIds.includes(relationship.id) ? 'Remove' : 'Add'} ${relationship.accountId || relationship.caseId} ${selectedIds.includes(relationship.id) ? 'from' : 'to'} relationship map`}
                  >{selectedIds.includes(relationship.id) ? '●' : '○'}</button>
                  <span><small>{relationship.accountId || relationship.caseId} · {relationship.product}</small><strong>{relationship.name}</strong><em>{relationship.relationship}</em></span>
                  <b data-tone={statusTone(relationship.status, relationship.standing)}>{relationship.status}</b>
                </summary>
                <dl>
                  <div><dt>Relationship scope</dt><dd>{relationship.scope === 'account' ? 'Specific account' : 'Case / profile only'}</dd></div>
                  <div><dt>{relationship.scope === 'account' ? 'Account ID' : 'Case ID'}</dt><dd>{relationship.accountId || relationship.caseId}</dd></div>
                  <div><dt>Product / record type</dt><dd>{relationship.product}</dd></div>
                  <div><dt>{relationship.scope === 'account' ? 'Account standing' : 'Scope note'}</dt><dd>{relationship.standing}</dd></div>
                  <div><dt>Relationship to current case</dt><dd>{relationship.relationship}</dd></div>
                  <div><dt>First use</dt><dd>{relationship.firstUse}</dd></div>
                  <div><dt>Last use</dt><dd>{relationship.lastUse}</dd></div>
                  <div><dt>Verified source</dt><dd>{relationship.source}</dd></div>
                </dl>
                <nav>
                  {relationship.scope === 'account' && <button type="button" onClick={() => openRelatedAccount?.(relationship.caseId, relationship.accountId)}>Open related account</button>}
                  <button type="button" onClick={() => openRelatedCase?.(relationship.caseId)}>Open related case</button>
                  {relationship.scope === 'account' ? (
                    <button type="button" onClick={() => quickPin({
                      label: 'Account ID',
                      value: relationship.accountId,
                      sourceTool: 'Link Analysis',
                      sourceRecordId: relationship.sourceRecordId,
                      openAction: 'related-account',
                      relatedCaseId: relationship.caseId,
                      relatedRecordId: relationship.accountId,
                    })}>📌 Quick Pad account</button>
                  ) : (
                    <button type="button" onClick={() => quickPin({
                      label: 'Case ID',
                      value: relationship.caseId,
                      sourceTool: 'Link Analysis',
                      sourceRecordId: relationship.sourceRecordId,
                      openAction: 'related-case',
                      relatedCaseId: relationship.caseId,
                    })}>📌 Quick Pad case</button>
                  )}
                </nav>
              </details>
            ))}
            {!relationships.length && <p className="mobile-reference-empty">No account or case/profile record in the current training catalog matches this exact identifier.</p>}
          </section>

          <aside className="mobile-link-luna-summary">
            <MobileLunaPortrait size={52} />
            <div><span>Luna · verified-link summary</span><strong>{accountRelationships.length} account-level and {profileRelationships.length} profile-level match{relationships.length === 1 ? '' : 'es'} returned.</strong><p>{accountRelationships.length ? `Recorded account statuses: ${[...new Set(accountRelationships.map((item) => item.status))].join(' · ')}.` : 'No account-level status is asserted for this search.'} This summary does not assign a ring or a case outcome.</p></div>
          </aside>

          <div className="mobile-reference-inline-actions">
            <button type="button" onClick={() => saveNote(`Link Analysis: ${typeLabel} ${submitted} returned ${accountRelationships.length} account-level and ${profileRelationships.length} profile-level match(es).`, 'Link Analysis')}>Add factual link note</button>
            <button type="button" onClick={() => markReviewed('Link Analysis')}>{reviewed ? '✓ Link Analysis reviewed' : 'Mark Link Analysis reviewed'}</button>
            <button type="button" onClick={jumpDecision}>Submit Decision</button>
          </div>
        </>
      )}
    </section>
  );
}
