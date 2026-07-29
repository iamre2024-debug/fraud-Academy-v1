import { caseDomainLabels } from './data/caseDomain.js';
import { resolveDecisionDomain } from './data/decisionChecklist.js';
import {
  getDecisionCallGroups,
  getFinalFindingChoices,
  getReviewDisplaySnapshot,
  reviewChoices,
} from './data/reviewPackage.js';

function ReviewGlyph({ type, size = 20 }) {
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

  if (type === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (type === 'notice') return <svg {...common}><path d="M12 3 2.8 20h18.4zM12 9v4M12 17h.01" /></svg>;
  if (type === 'briefcase') return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></svg>;
  if (type === 'workflow') return <svg {...common}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="m8 7.5 2.7 7.8M16 7.5l-2.7 7.8M8.5 6h7" /></svg>;
  if (type === 'person') return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-5 3.5-7 8-7s7.2 2 8 7" /></svg>;
  if (type === 'card') return <svg {...common}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 9h19M6 15h5" /></svg>;
  if (type === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>;
  if (type === 'document') return <svg {...common}><path d="M5 3h10l4 4v14H5zM15 3v5h4M8 12h8M8 16h6" /></svg>;
  if (type === 'pin') return <svg {...common}><path d="M9 3h6l.8 5 2.2 2v2H6v-2l2.2-2zM12 12v9" /></svg>;
  if (type === 'note') return <svg {...common}><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" /></svg>;
  if (type === 'shield') return <svg {...common}><path d="M12 2.5 20 6v5.5c0 4.8-3 8.1-8 10-5-1.9-8-5.2-8-10V6z" /><path d="m8.7 12 2.2 2.2 4.6-4.7" /></svg>;
  if (type === 'question') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 2-2.5 2.2-2.5 4M12 18h.01" /></svg>;
  if (type === 'arrow') return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
  if (type === 'folder') return <svg {...common}><path d="M3 6h7l2 2h9v11H3z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
}

function MobileReviewLuna() {
  return (
    <aside className="mobile-review-luna" aria-label="Luna debrief is available after submission">
      <span className="mobile-review-luna-orb" aria-hidden="true">
        <img src="/assets/luna-sky-plush-v1.webp" alt="" />
      </span>
      <span><strong>Luna ✦</strong><small>Debrief after submit</small></span>
    </aside>
  );
}

function MobileReviewHeader({ title, subtitle, icon }) {
  return (
    <header className="mobile-review-heading">
      <span className="mobile-review-heading-icon"><ReviewGlyph type={icon} size={24} /></span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <MobileReviewLuna />
      <span className="mobile-review-boundary">Evidence First</span>
    </header>
  );
}

function SectionHeading({ number, title, count, help }) {
  return (
    <header className="mobile-review-section-heading">
      <div>
        <span>{number}.</span>
        <h3>{title}</h3>
        {help && <span className="mobile-review-help" title={help}><ReviewGlyph type="question" size={15} /><span className="sr-only">{help}</span></span>}
      </div>
      {count !== undefined && <small>{count}</small>}
    </header>
  );
}

function cleanText(value, fallback = 'Not supplied') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function compactNote(note) {
  const text = cleanText(note, '');
  const sections = text.split(' · ');
  return {
    meta: sections.length > 1 ? sections.slice(0, 2).join(' · ') : 'Investigation note',
    detail: sections.length > 2 ? sections.slice(2).join(' · ') : text,
  };
}

function decisionDescription(choice) {
  const descriptions = {
    'Support Customer Claim': 'The reviewed evidence supports the customer claim.',
    'Do Not Support Customer Claim': 'The reviewed evidence does not support the customer claim.',
    'Partial Credit': 'Record a supported partial resolution.',
    'Insufficient Evidence': 'The available evidence does not support a final claim action.',
    'Maintain': 'Keep the current account or exposure state.',
    'Restrict': 'Apply the recorded account restriction.',
    'Restrict / Reduce': 'Apply the recorded restriction or exposure reduction.',
    'Hold': 'Keep the transaction, payment, or account action on hold.',
    'Release': 'Release the reviewed transaction or payment instruction.',
    'Approve': 'Approve the application under review.',
    'Deny': 'Deny the application with a factual basis.',
    'More Information Needed': 'Collect the missing records before final action.',
    'Request More Information': 'Request the missing records before final action.',
    'Escalate': 'Send the case for specialist review.',
  };
  return descriptions[choice] ?? 'Record the operational action supported by your review.';
}

function findingDescription(choice) {
  const descriptions = {
    'Fraud Confirmed': 'The investigation established fraud with cited evidence.',
    'Fraud Not Found': 'The investigation did not establish fraud.',
    'Inconclusive': 'The available evidence does not establish a final finding.',
    'Non-Fraud Dispute': 'The facts support a merchant or service dispute instead.',
    'Credit Risk Concern': 'The review established a credit-performance concern.',
    'Verification Incomplete': 'Required verification remains incomplete.',
  };
  return descriptions[choice] ?? 'Record what the investigation established.';
}

function choiceTone(choice, index) {
  if (/more information|insufficient|verification incomplete/i.test(choice)) return 'amber';
  if (/escalate|restrict|deny|confirmed/i.test(choice)) return 'pink';
  if (/support|approve|release|maintain|not found|non-fraud/i.test(choice)) return 'mint';
  return index % 2 ? 'violet' : 'blue';
}

function IndicatorRow({ answer, item, locked = false, updateDecisionIndicator }) {
  const assessment = answer?.assessment ?? (answer?.selected ? 'yes' : '');
  const selected = assessment === 'yes';

  function updateAssessment(value) {
    updateDecisionIndicator(item.id, 'assessment', value);
    updateDecisionIndicator(item.id, 'selected', value === 'yes');
  }

  return (
    <article className="mobile-indicator-row" data-assessment={assessment || 'unanswered'} data-selected={selected ? 'true' : 'false'} data-cue="learner-choice">
      <div className="mobile-indicator-question">
        <span className="mobile-indicator-mark"><ReviewGlyph type="question" size={17} /></span>
        <span className="mobile-indicator-copy">
          <strong>{item.prompt}</strong>
          <small>Choose based on the evidence you reviewed.</small>
        </span>
      </div>
      <fieldset className="mobile-indicator-assessment" disabled={locked}>
        <legend className="sr-only">Assessment for {item.prompt}</legend>
        {[
          ['yes', 'Yes'],
          ['no', 'No'],
          ['unknown', 'Not enough evidence'],
        ].map(([value, label]) => (
          <label key={value} data-selected={assessment === value ? 'true' : 'false'}>
            <input
              type="radio"
              name={`indicator-assessment-${item.id}`}
              value={value}
              checked={assessment === value}
              onChange={(event) => updateAssessment(event.target.value)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      {assessment && (
        <div className="mobile-indicator-fields">
          <label>
            <span>Record or proof</span>
            <input
              value={answer?.proof ?? ''}
              disabled={locked}
              onChange={(event) => updateDecisionIndicator(item.id, 'proof', event.target.value)}
              placeholder="Example: LOG-1005 or DOC-441"
              aria-label={`Record or proof for ${item.prompt}`}
            />
          </label>
          <label>
            <span>Your explanation</span>
            <textarea
              value={answer?.explanation ?? ''}
              disabled={locked}
              onChange={(event) => updateDecisionIndicator(item.id, 'explanation', event.target.value)}
              placeholder="Explain what this fact adds to the review."
              aria-label={`Explanation for ${item.prompt}`}
            />
          </label>
        </div>
      )}
    </article>
  );
}

export function MobileCaseIndicatorsReview({
  activeCase,
  decisionDraft,
  jumpDecision,
  locked = false,
  noteDraft,
  notes,
  openNotesPage,
  openPinnedEvidence,
  openPinnedPage,
  packageStatus,
  removePin,
  setNoteDraft,
  submitNote,
  tray,
  updateDecisionIndicator,
}) {
  const domain = resolveDecisionDomain(activeCase);
  const labels = caseDomainLabels(domain);
  const checklist = packageStatus.indicatorSummary.checklist;
  const indicatorAnswers = decisionDraft.indicators ?? {};
  const answeredCount = checklist.flags.filter((item) => {
    const answer = indicatorAnswers[item.id];
    return Boolean(answer?.assessment || answer?.selected);
  }).length;
  const latestNotes = notes.slice(0, 3).map(compactNote);

  return (
    <section
      className="mobile-case-review-page mobile-indicators-review-page"
      data-mobile-review-screen="indicators"
      data-workflow-stage="indicators"
      data-workspace-page="indicators"
    >
      <MobileReviewHeader
        title="Case Indicators Review"
        subtitle="Review facts, record your checklist choices, and cite evidence."
        icon="workflow"
      />

      {locked && (
        <p className="mobile-decision-locked-note" role="status">
          The submitted package is locked. You can review its indicators and sources, but checklist changes are disabled.
        </p>
      )}

      <section className="mobile-review-card mobile-indicator-checklist">
        <SectionHeading
          number="1"
          title="Indicator Checklist"
          count={`${answeredCount}/${checklist.flags.length} answered`}
          help="Choose Yes, No, or Not enough evidence. Fraud Academy does not answer the checklist for you."
        />
        <p className="mobile-review-section-intro">{checklist.description}</p>
        <div className="mobile-indicator-list">
          {checklist.flags.map((item) => (
            <IndicatorRow
              key={item.id}
              answer={indicatorAnswers[item.id]}
              item={item}
              locked={locked}
              updateDecisionIndicator={updateDecisionIndicator}
            />
          ))}
        </div>
        <p className="mobile-review-neutral-note">
          Your answers organize your reasoning only. They never calculate or select the determination.
        </p>
      </section>

      <section className="mobile-review-card mobile-claim-cues">
        <SectionHeading
          number="2"
          title="Claim Type Cues"
          help="These are factual routing fields from the case, not conclusions."
        />
        <div className="mobile-cue-grid">
          <article>
            <span><ReviewGlyph type="person" size={19} /></span>
            <small>Customer type</small>
            <strong>{cleanText(labels.customerTypeLabel)}</strong>
          </article>
          <article>
            <span><ReviewGlyph type="card" size={19} /></span>
            <small>Product</small>
            <strong>{cleanText(labels.productTypeLabel)}</strong>
          </article>
          <article>
            <span><ReviewGlyph type="workflow" size={19} /></span>
            <small>Review workflow</small>
            <strong>{cleanText(labels.workflowTypeLabel)}</strong>
          </article>
        </div>
      </section>

      <section className="mobile-review-card mobile-evidence-notes">
        <SectionHeading number="3" title="Evidence Notes" count={`${notes.length} saved`} />
        <form onSubmit={submitNote}>
          <label>
            <span>New case note</span>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Record a factual observation and the exact source."
              aria-label="New evidence note"
            />
          </label>
          <button type="submit" disabled={!noteDraft.trim()}>
            <ReviewGlyph type="note" size={18} />
            Save note
          </button>
        </form>

        <div className="mobile-note-list" aria-label="Recent evidence notes">
          {latestNotes.map((note, index) => (
            <article key={`${note.meta}-${index}`}>
              <span><ReviewGlyph type="note" size={17} /></span>
              <div><small>{note.meta}</small><p>{note.detail}</p></div>
            </article>
          ))}
          {!latestNotes.length && <p className="mobile-review-empty">No saved notes yet. Add only facts you can trace to the case record.</p>}
        </div>

        <div className="mobile-review-linked-evidence">
          <span><ReviewGlyph type="pin" size={18} /></span>
          <div><strong>{tray.length} pinned records</strong><small>Open a source before relying on it.</small></div>
          <button type="button" onClick={openPinnedPage} aria-label="Open pinned evidence deck">Open</button>
        </div>
        {tray.slice(0, 3).map((item) => (
          <div className="mobile-review-pin-row" key={item}>
            <button type="button" onClick={() => openPinnedEvidence(item)} aria-label={`Open pinned evidence ${item}`}>{item}</button>
            <button type="button" onClick={() => removePin(item)} aria-label={`Remove ${item} from pinned evidence`}>×</button>
          </div>
        ))}
        <button type="button" className="mobile-review-text-action" onClick={openNotesPage}>Open full investigation notebook</button>
      </section>

      <button type="button" className="mobile-review-primary-action" onClick={jumpDecision}>
        Continue to Determination
        <ReviewGlyph type="arrow" size={19} />
      </button>
    </section>
  );
}

export function MobileDeterminationPage({
  activeCase,
  decisionDraft,
  latestPackage = null,
  locked = false,
  openIndicators,
  openSubmit,
  packageStatus,
  submitRef,
  tray,
  notes,
  updateDecision,
}) {
  const domain = resolveDecisionDomain(activeCase);
  const labels = caseDomainLabels(domain);
  const groups = getDecisionCallGroups(activeCase);
  const selectionGroups = groups.length ? groups : [{ label: 'Operational decision', options: reviewChoices }];
  const findings = getFinalFindingChoices(activeCase);
  const documents = Array.isArray(activeCase.documents) ? activeCase.documents : [];
  const displaySnapshot = getReviewDisplaySnapshot({
    activeCase,
    reviewPackage: latestPackage,
    decisionDraft,
    tray,
    notes,
    packageStatus,
  });
  const displayDecision = displaySnapshot.decision;
  const isLocked = locked || displaySnapshot.locked;

  return (
    <section
      ref={submitRef}
      className="mobile-case-review-page mobile-determination-page submit-decision-panel"
      data-mobile-review-screen="determination"
      data-decision-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <MobileReviewHeader
        title="Determination"
        subtitle="Review the saved case inputs and record an evidence-first decision."
        icon="shield"
      />

      <div className="mobile-determination-form decision-v1-workspace">
        {isLocked && (
          <p className="mobile-decision-locked-note" role="status">
            This submitted decision is locked. Open the saved package to review it or continue to Luna.
          </p>
        )}
        <section className="mobile-review-card mobile-evidence-summary">
          <SectionHeading
            number="1"
            title="Evidence Summary"
            help="This summary contains case inputs only. It does not recommend an outcome."
          />
          <dl>
            <div><dt><ReviewGlyph type="card" size={18} />Case amount</dt><dd>{cleanText(activeCase.amount)}</dd></div>
            <div><dt><ReviewGlyph type="calendar" size={18} />Review opened</dt><dd>{cleanText(activeCase.opened)}</dd></div>
            <div><dt><ReviewGlyph type="briefcase" size={18} />Product</dt><dd>{cleanText(labels.productTypeLabel)}</dd></div>
            <div><dt><ReviewGlyph type="workflow" size={18} />Workflow</dt><dd>{cleanText(labels.workflowTypeLabel)}</dd></div>
            <div><dt><ReviewGlyph type="document" size={18} />Documents</dt><dd>{documents.length} files</dd></div>
            <div><dt><ReviewGlyph type="pin" size={18} />Learner inputs</dt><dd>{displaySnapshot.pinnedEvidence.length} pins · {displaySnapshot.noteSnapshot.length} notes · {displaySnapshot.indicatorCount} indicators</dd></div>
          </dl>
          <button type="button" className="mobile-review-text-action" onClick={openIndicators}>
            Review indicators and sources
            <ReviewGlyph type="arrow" size={17} />
          </button>
        </section>

        <section className="mobile-review-card mobile-decision-choices">
          <SectionHeading
            number="2"
            title="Operational Decision"
            help="Choose the operational action separately from the investigation finding."
          />
          <p className="mobile-review-section-intro">Choose the action supported by the reviewed evidence.</p>
          {selectionGroups.map((group) => (
            <fieldset key={group.label} disabled={isLocked}>
              <legend>{group.label}</legend>
              <div className="mobile-choice-grid">
                {group.options.map((item, index) => (
                  <label key={item} data-selected={displayDecision.operationalDecision === item ? 'true' : 'false'} data-tone={choiceTone(item, index)}>
                    <input
                      type="radio"
                      name={`operational-decision-${activeCase.id}`}
                      value={item}
                      checked={displayDecision.operationalDecision === item}
                      onChange={(event) => updateDecision('operationalDecision', event.target.value)}
                    />
                    <span><ReviewGlyph type={/insufficient|information/i.test(item) ? 'question' : /escalate/i.test(item) ? 'arrow' : 'shield'} size={24} /></span>
                    <strong>{item}</strong>
                    <small>{decisionDescription(item)}</small>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </section>

        <section className="mobile-review-card mobile-finding-choices">
          <SectionHeading
            number="3"
            title="Investigation Finding"
            help="Record what the investigation established; it is separate from the operational action."
          />
          <fieldset disabled={isLocked}>
            <legend>Final finding</legend>
            <div className="mobile-choice-grid">
              {findings.map((item, index) => (
                <label key={item} data-selected={displayDecision.finalFinding === item ? 'true' : 'false'} data-tone={choiceTone(item, index)}>
                  <input
                    type="radio"
                    name={`final-finding-${activeCase.id}`}
                    value={item}
                    checked={displayDecision.finalFinding === item}
                    onChange={(event) => updateDecision('finalFinding', event.target.value)}
                  />
                  <span><ReviewGlyph type={/inconclusive|incomplete/i.test(item) ? 'question' : 'document'} size={23} /></span>
                  <strong>{item}</strong>
                  <small>{findingDescription(item)}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="mobile-review-card mobile-decision-support">
          <SectionHeading number="4" title="Decision Support" />
          <label>
            <span>Confidence</span>
            <select
              value={displayDecision.confidence}
              disabled={isLocked}
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
              value={displayDecision.findingBasis}
              disabled={isLocked}
              onChange={(event) => updateDecision('findingBasis', event.target.value)}
              placeholder={`Explain what the evidence establishes for ${activeCase.id}. Cite exact records when available.`}
              aria-label="Finding basis"
              aria-describedby="mobile-finding-basis-help"
            />
            <small id="mobile-finding-basis-help">
              A confirmed-fraud finding requires at least {packageStatus.minimumRationaleWords} words tied to a record or documented indicator. Application denial requires a factual reason.
            </small>
          </label>
        </section>

        <section className="mobile-review-card mobile-next-steps">
          <SectionHeading number="5" title="Next Steps" />
          <div>
            <ReviewGlyph type="document" size={20} />
            <p>Your learner package will be saved to this fictional training case. No customer notification or real account action is sent.</p>
          </div>
          <div>
            <ReviewGlyph type="shield" size={20} />
            <p>Luna debrief unlocks only after a valid operational decision and separate final finding are saved.</p>
          </div>
        </section>

        <button
          type="button"
          className="mobile-review-primary-action"
          aria-label="Continue to Submit Decision"
          disabled={!isLocked && !packageStatus.ready}
          onClick={openSubmit}
        >
          {isLocked ? 'Open saved Submit Decision' : 'Continue to Submit Decision'}
          <ReviewGlyph type="arrow" size={19} />
        </button>
        <p className="mobile-decision-submit-help" role="status">
          {isLocked
            ? 'The submitted package remains the source for Luna and cannot be changed from this draft screen.'
            : packageStatus.ready
            ? 'Ready for the final review. Nothing is saved until you confirm on the next screen.'
            : `Before final review: ${packageStatus.blockers.join('; ')}.`}
        </p>
      </div>
    </section>
  );
}
