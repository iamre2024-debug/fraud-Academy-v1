import DecisionFlagChecklist from './DecisionFlagChecklist.jsx';
import {
  getDecisionCallGroups,
  getFinalFindingChoices,
  reviewChoices,
} from './data/reviewPackage.js';

export default function SubmitDecisionPanel({
  submitRef,
  packageStatus,
  tray,
  notes,
  reviewPackages,
  decisionDraft,
  activeCase,
  updateDecision,
  updateDecisionIndicator,
  submitDecision,
  openDebrief,
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const submissionLabel = latestPackage
    ? 'Decision saved'
    : packageStatus.ready
      ? /evidence pending|response pending|submission pending/i.test(activeCase.status ?? '')
        ? 'Submission available · evidence pending'
        : 'Ready to submit'
      : 'Select a determination';
  const decisionGroups = getDecisionCallGroups(activeCase);
  const selectionGroups = decisionGroups.length ? decisionGroups : [{ label: 'Learner choices', options: reviewChoices }];
  const finalFindings = getFinalFindingChoices(activeCase);

  function submitAndOpenDebrief(event) {
    const reviewPackage = submitDecision(event);
    if (reviewPackage) openDebrief?.(reviewPackage);
  }

  return (
    <section
      ref={submitRef}
      className="ornate-card submit-decision-panel decision-theme-v1"
      data-decision-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <aside className="mission-decision-progress" aria-label="Decision workflow progress">
        <span className="complete"><i />Review</span>
        <span className={notes.length ? 'complete' : 'active'}><i />Notes</span>
        <span className={latestPackage ? 'complete' : 'active'}><i />Decide</span>
      </aside>
      <header className="decision-v1-header">
        <div>
          <p className="decision-v1-eyebrow">Determination · Evidence First</p>
          <h2>Submit Decision</h2>
          <p>Record what should happen operationally, then separately record what the investigation established.</p>
        </div>
        <div className="decision-v1-header-status">
          <span>{activeCase.id}</span>
          <strong data-decision-submission-state={latestPackage ? 'saved' : 'available'}>{submissionLabel}</strong>
        </div>
      </header>

      <section className="decision-v1-lock" aria-label="Evidence First decision lock">
        <div aria-hidden="true">⌁</div>
        <div>
          <p>Evidence First protection</p>
          <h3>Luna debrief stays locked until this case has a saved learner package.</h3>
          <span>You can submit after selecting a valid operational decision and final finding. A confirmed-fraud finding also requires an evidence-based written rationale.</span>
        </div>
      </section>

      <section className="decision-status-grid" aria-label="Decision package summary">
        <article><span>Tools reviewed</span><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><small>Optional</small></article>
        <article><span>Pinned objects</span><strong>{tray.length}</strong><small>Optional</small></article>
        <article><span>Investigation notes</span><strong>{notes.length}</strong><small>Optional</small></article>
        <article><span>Selected flags</span><strong>{packageStatus.indicatorSummary.selectedCount}</strong><small>Optional</small></article>
      </section>

      <p className="decision-direct-submit-note" role="note">
        You can submit a decision without reviewing every tool. Open only the records needed to prove your selected flags.
      </p>

      <DecisionFlagChecklist
        activeCase={activeCase}
        tray={tray}
        decisionDraft={decisionDraft}
        indicatorSummary={packageStatus.indicatorSummary}
        updateDecisionIndicator={updateDecisionIndicator}
      />

      <div className="decision-v1-workspace">
        <form className="decision-form decision-v1-form" onSubmit={submitAndOpenDebrief}>
          <header>
            <p>Determination</p>
            <h3>Record the action and finding</h3>
            <span>The operational decision controls what happens next. The final finding records what the investigation established; one does not automatically determine the other.</span>
          </header>

          <fieldset className="decision-choice-fieldset">
            <legend>Operational decision</legend>
            <div className="decision-choice-groups">
              {selectionGroups.map((group) => (
                <section key={group.label} className="decision-choice-group" aria-label={group.label}>
                  <h4>{group.label}</h4>
                  <div>
                    {group.options.map((item) => (
                      <label key={item} data-choice-selected={decisionDraft.operationalDecision === item ? 'true' : 'false'}>
                        <input
                          type="radio"
                          name={`operational-decision-${activeCase.id}`}
                          value={item}
                          checked={decisionDraft.operationalDecision === item}
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

          <fieldset className="decision-choice-fieldset">
            <legend>Final finding</legend>
            <div className="decision-choice-groups">
              <section className="decision-choice-group" aria-label="Final finding">
                <h4>Investigation finding</h4>
                <div>
                  {finalFindings.map((item) => (
                    <label key={item} data-choice-selected={decisionDraft.finalFinding === item ? 'true' : 'false'}>
                      <input
                        type="radio"
                        name={`final-finding-${activeCase.id}`}
                        value={item}
                        checked={decisionDraft.finalFinding === item}
                        onChange={(event) => updateDecision('finalFinding', event.target.value)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            <small>
              “Do Not Support Customer Claim,” “Deny,” or another operational action does not by itself mean fraud was confirmed.
            </small>
          </fieldset>

          <label className="decision-confidence">
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

          <label className="decision-rationale">
            <span>Finding basis</span>
            <textarea
              value={decisionDraft.findingBasis}
              onChange={(event) => updateDecision('findingBasis', event.target.value)}
              placeholder={`Explain what the evidence establishes for ${activeCase.id}, citing exact records when available.`}
              aria-describedby="decision-rationale-help"
            />
            <small id="decision-rationale-help">
              Required for Fraud Confirmed: at least {packageStatus.minimumRationaleWords} words tied to an exact record or a documented checklist item. An application denial also requires a factual reason; otherwise this field is optional but recommended.
            </small>
          </label>

          <button
            className="primary-action"
            type="submit"
            aria-label="Submit Decision"
            aria-describedby="decision-submit-help"
            disabled={!packageStatus.ready}
          >
            Submit Decision
          </button>
          <small id="decision-submit-help" className="decision-submit-help">
            {packageStatus.ready
              ? 'Ready to save the operational decision and final finding, then unlock Luna.'
              : packageStatus.blockers.length
                ? `Before submitting: ${packageStatus.blockers.join('; ')}.`
                : 'Select an operational decision and final finding before submitting.'}
          </small>
        </form>
      </div>

      {latestPackage && (
        <section className="decision-v1-confirmation" role="status" aria-label="Decision submission confirmation">
          <div aria-hidden="true">✓</div>
          <div>
            <p>Submission confirmation</p>
            <h3>Decision submitted for {latestPackage.caseId}</h3>
            <span>
              {latestPackage.operationalDecision || latestPackage.choice || 'No operational decision recorded'}
              {' · '}
              {latestPackage.finalFinding || 'Legacy finding not recorded'}
              {' · '}
              {latestPackage.confidence} confidence · saved {latestPackage.savedAt}
            </span>
          </div>
          <button type="button" className="decision-open-debrief" onClick={() => openDebrief?.(latestPackage)}>Open Luna Debrief</button>
        </section>
      )}
    </section>
  );
}
