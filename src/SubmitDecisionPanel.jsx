import { useEffect, useMemo, useState } from 'react';
import {
  getDecisionCallGroups,
  getFinalFindingChoices,
  getReviewDisplaySnapshot,
  reviewChoices,
} from './data/reviewPackage.js';
import { publicAlertReason, publicCaseTaxonomy } from './data/publicCaseView.js';
import {
  LighthouseMedallion,
  ReviewGlyph,
} from './DecisionReviewVisuals.jsx';

function cleanNote(note = '') {
  const parts = String(note).split(/\s+\u00b7\s+/);
  return {
    type: parts.length >= 3 ? parts[1].trim() : 'Investigation note',
    body: (parts.length >= 3 ? parts.slice(2).join(' ') : String(note)).trim(),
  };
}

function isUsefulNote(note = '') {
  const { type, body } = cleanNote(note);
  return body && !/^(?:tool review|decision package)$/i.test(type) && !/:\s*reviewed\.?$/i.test(body);
}

function describePin(pin = '') {
  const value = String(pin).trim();
  const normalized = value.toLowerCase();

  if (/doc-|document|affidavit|statement|invoice|email/.test(normalized)) {
    return { icon: '✉', label: 'Document', value };
  }
  if (/txn-|transaction|purchase|charge|payment record/.test(normalized)) {
    return { icon: '▰', label: 'Transaction', value };
  }
  if (/dst-|bank code|destination|payment|payroll/.test(normalized)) {
    return { icon: '▣', label: 'Payment', value };
  }
  if (/dev-|device|fingerprint|browser/.test(normalized)) {
    return { icon: '⌁', label: 'Device', value };
  }
  if (/ses-|session|login|ip-|198\.51\.100|203\.0\.113|192\.0\.2/.test(normalized)) {
    return { icon: '◎', label: 'Access record', value };
  }
  if (/biz-|business|llc|inc\.?|corp/.test(normalized)) {
    return { icon: '◇', label: 'Business', value };
  }
  if (/trn-|identity|customer|owner/.test(normalized)) {
    return { icon: '◉', label: 'Identity', value };
  }
  return { icon: '◆', label: 'Evidence', value };
}

function decisionSubject(activeCase, taxonomy) {
  if (activeCase.customerType === 'business') {
    return activeCase.profile?.business
      ?? activeCase.business
      ?? activeCase.customer?.businessName
      ?? activeCase.person
      ?? 'Business relationship';
  }
  return activeCase.person ?? activeCase.customer?.name ?? 'Personal relationship';
}

export default function SubmitDecisionPanel({
  submitRef,
  packageStatus,
  tray,
  notes,
  reviewPackages,
  decisionDraft,
  activeCase,
  updateDecision,
  submitDecision,
  openDebrief,
  openEvidence,
  openNotes,
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const displaySnapshot = getReviewDisplaySnapshot({
    activeCase,
    reviewPackage: latestPackage,
    decisionDraft,
    tray,
    notes,
    packageStatus,
  });
  const displayDecision = displaySnapshot.decision;
  const displayTray = displaySnapshot.pinnedEvidence;
  const displayNotes = displaySnapshot.noteSnapshot;
  const decisionGroups = getDecisionCallGroups(activeCase);
  const selectionGroups = decisionGroups.length
    ? decisionGroups
    : [{ label: 'Operational decision', options: reviewChoices }];
  const finalFindings = getFinalFindingChoices(activeCase);
  const taxonomy = publicCaseTaxonomy(activeCase);
  const selectedOperational = displayDecision.operationalDecision || displayDecision.choice || '';
  const selectedFinding = displayDecision.finalFinding || '';
  const hasSelections = Boolean(selectedOperational && selectedFinding);
  const [editorOpen, setEditorOpen] = useState(!hasSelections);

  useEffect(() => {
    setEditorOpen(latestPackage ? false : !hasSelections);
  }, [activeCase.id, latestPackage?.id]);

  const evidenceCards = useMemo(
    () => displayTray.slice(0, 3).map(describePin),
    [displayTray],
  );
  const latestUsefulNote = useMemo(
    () => cleanNote(displayNotes.find(isUsefulNote) ?? displayNotes[0] ?? ''),
    [displayNotes],
  );

  function toggleEditor() {
    setEditorOpen((current) => (current && !packageStatus.ready ? true : !current));
  }

  function submitAndOpenDebrief(event) {
    const reviewPackage = submitDecision(event);
    if (reviewPackage) openDebrief?.(reviewPackage);
  }

  const submissionState = latestPackage
    ? 'saved'
    : packageStatus.ready
      ? 'ready'
      : 'draft';
  const selectedDecisionLabel = selectedOperational || 'Choose an operational decision';
  const selectedFindingLabel = selectedFinding || 'Choose a separate final finding';

  return (
    <section
      ref={submitRef}
      className="submit-decision-panel decision-theme-v1 decision-final-review"
      data-decision-screen="approved-theme-v1"
      data-decision-layout="reference-final-review"
      data-case-id={activeCase.id}
      data-customer-type={activeCase.customerType}
      data-decision-state={submissionState}
    >
      <header className="decision-case-card">
        <div className="decision-case-copy">
          <div className="decision-case-id-line">
            <h2>{activeCase.id}</h2>
            <span>{latestPackage ? 'Decision saved' : 'Active case'}</span>
          </div>
          <p>{taxonomy.customerType} · {taxonomy.productType}</p>
          <strong>{taxonomy.workflowType}</strong>
          <small>{publicAlertReason(activeCase)}</small>
        </div>
        <LighthouseMedallion className="decision-case-art" />
      </header>

      <section className="decision-selected-card" aria-label="Selected decision">
        <header>
          <ReviewGlyph type="scale" />
          <h3>Selected Decision</h3>
          <button
            type="button"
            onClick={toggleEditor}
            aria-expanded={editorOpen}
            disabled={Boolean(latestPackage)}
          >
            {latestPackage ? 'Final' : editorOpen ? (packageStatus.ready ? 'Done' : 'Complete choices') : 'Change'}
          </button>
        </header>
        <div className="decision-selected-summary">
          <span className="decision-selected-emblem" aria-hidden="true">
            <ReviewGlyph type="scale" />
          </span>
          <div>
            <strong>{selectedDecisionLabel}</strong>
            <span>{selectedFindingLabel}</span>
            <small>{decisionSubject(activeCase, taxonomy)}</small>
          </div>
          <em>{displayDecision.confidence || 'Medium'} confidence</em>
        </div>
        <dl>
          <div><dt>Amount / exposure</dt><dd>{activeCase.amountExposure ?? activeCase.amount ?? 'Not supplied'}</dd></div>
          <div><dt>Reviewed tools</dt><dd>{displaySnapshot.reviewedRequired}/{displaySnapshot.totalRequired}</dd></div>
        </dl>
      </section>

      {editorOpen && !latestPackage && (
        <form className="decision-editor" onSubmit={submitAndOpenDebrief} data-decision-editor="true">
          <header>
            <div>
              <p>Evidence First</p>
              <h3>Choose the action and the finding</h3>
            </div>
            <span>Nothing is selected for you.</span>
          </header>

          <fieldset>
            <legend>Operational decision</legend>
            <p>What should happen next in this {taxonomy.workflowType.toLowerCase()} workflow?</p>
            <div className="decision-option-groups">
              {selectionGroups.map((group) => (
                <section key={group.label} aria-label={group.label}>
                  <h4>{group.label}</h4>
                  <div>
                    {group.options.map((item) => (
                      <label key={item} data-selected={selectedOperational === item ? 'true' : 'false'}>
                        <input
                          type="radio"
                          name={`operational-decision-${activeCase.id}`}
                          value={item}
                          checked={selectedOperational === item}
                          onChange={(event) => updateDecision('operationalDecision', event.target.value)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Final finding</legend>
            <p>What did the evidence establish? The operational action does not answer this automatically.</p>
            <div className="decision-finding-grid" role="group" aria-label="Final finding">
              {finalFindings.map((item) => (
                <label key={item} data-selected={selectedFinding === item ? 'true' : 'false'}>
                  <input
                    type="radio"
                    name={`final-finding-${activeCase.id}`}
                    value={item}
                    checked={selectedFinding === item}
                    onChange={(event) => updateDecision('finalFinding', event.target.value)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="decision-editor-fields">
            <label>
              <span>Confidence</span>
              <select
                value={decisionDraft.confidence}
                onChange={(event) => updateDecision('confidence', event.target.value)}
                aria-label="Learner confidence"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              <span>Finding basis</span>
              <textarea
                value={decisionDraft.findingBasis}
                onChange={(event) => updateDecision('findingBasis', event.target.value)}
                placeholder={`Explain what the evidence establishes for ${activeCase.id}.`}
                aria-describedby="decision-finding-basis-help"
              />
              <small id="decision-finding-basis-help">
                Cite exact records when available. Confirmed fraud and application denials require a factual written basis.
              </small>
            </label>
          </div>

          {!packageStatus.ready && (
            <div className="decision-editor-blockers" role="status">
              <ReviewGlyph type="alert" />
              <div>
                <strong>Finish the final review</strong>
                {packageStatus.blockers.map((blocker) => <span key={blocker}>{blocker}</span>)}
              </div>
            </div>
          )}

          <button
            className="decision-use-selection"
            type="button"
            disabled={!packageStatus.ready}
            onClick={() => setEditorOpen(false)}
          >
            Use these selections
          </button>
        </form>
      )}

      <section className="decision-evidence-card" aria-label={`Pinned evidence (${displayTray.length})`}>
        <header>
          <ReviewGlyph type="pin" />
          <h3>Pinned Evidence ({displayTray.length})</h3>
        </header>
        {evidenceCards.length ? (
          <div className="decision-evidence-strip">
            {evidenceCards.map((item, index) => (
              <article key={`${item.value}-${index}`}>
                <span aria-hidden="true">{item.icon}</span>
                <strong>{item.label}</strong>
                <small>{item.value}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="decision-empty-copy">No evidence is pinned. Pinning remains optional, but it helps Luna coach from the exact records you used.</p>
        )}
        <button type="button" onClick={openEvidence} disabled={!openEvidence}>
          View all evidence
        </button>
      </section>

      <section className="decision-notes-card" aria-label="Investigation notes">
        <header>
          <ReviewGlyph type="note" />
          <h3>Notes</h3>
          <button type="button" onClick={openNotes} disabled={!openNotes}>Open notes</button>
        </header>
        <blockquote>
          {latestUsefulNote.body || 'No substantive investigation note has been saved for this case.'}
        </blockquote>
      </section>

      <form className="decision-submit-zone" onSubmit={submitAndOpenDebrief}>
        {latestPackage ? (
          <button
            className="decision-confirm-button"
            type="button"
            onClick={() => openDebrief?.(latestPackage)}
          >
            <ReviewGlyph type="check" />
            Open Luna Debrief
          </button>
        ) : (
          <button
            className="decision-confirm-button"
            type="submit"
            aria-label="Confirm and Submit Decision"
            aria-describedby="decision-submit-help"
            disabled={!packageStatus.ready}
          >
            <ReviewGlyph type="check" />
            Confirm &amp; Submit Decision
          </button>
        )}
        <small id="decision-submit-help">
          <span aria-hidden="true">▣</span>
          {latestPackage
            ? `Saved ${latestPackage.savedAt}. Luna can now review this package.`
            : packageStatus.ready
              ? 'This action saves the package and unlocks post-submission coaching.'
              : 'Complete the required decision fields before submitting.'}
        </small>
      </form>
    </section>
  );
}
