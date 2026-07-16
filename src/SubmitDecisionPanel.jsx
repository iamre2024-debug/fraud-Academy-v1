import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import DecisionFlagChecklist from './DecisionFlagChecklist.jsx';
import { getDecisionCallGroups, reviewChoices } from './data/reviewPackage.js';

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
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const readyLabel = latestPackage ? 'Package saved' : packageStatus.ready ? 'Ready to save' : 'Review in progress';
  const rationaleProgress = Math.min(
    100,
    Math.round((packageStatus.rationaleWordCount / packageStatus.minimumRationaleWords) * 100),
  );
  const submitLabel = packageStatus.ready ? 'Submit Decision' : 'Check decision readiness';
  const decisionGroups = getDecisionCallGroups(activeCase);
  const selectionGroups = decisionGroups.length ? decisionGroups : [{ label: 'Learner choices', options: reviewChoices }];

  return (
    <section
      ref={submitRef}
      className="ornate-card submit-decision-panel decision-theme-v1"
      data-decision-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <header className="decision-v1-header">
        <div>
          <p className="decision-v1-eyebrow">Determination · Evidence First</p>
          <h2>Submit Decision</h2>
          <p>Use the checklist matched to this case, prove every selected flag, and record the determination supported by the evidence.</p>
        </div>
        <div className="decision-v1-header-status">
          <span>{activeCase.id}</span>
          <strong data-decision-readiness={packageStatus.ready ? 'ready' : 'locked'}>{readyLabel}</strong>
        </div>
      </header>

      <section className="decision-v1-lock" aria-label="Evidence First decision lock">
        <div aria-hidden="true">⌁</div>
        <div>
          <p>Evidence First protection</p>
          <h3>Luna debrief stays locked until this case has a saved learner package.</h3>
          <span>Locked checklist guidance may show completion needs, but no score or post-submission coaching appears before saving.</span>
        </div>
      </section>

      <section className="decision-status-grid" aria-label="Decision package summary">
        <article><span>Tools reviewed</span><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><small>Optional</small></article>
        <article><span>Pinned objects</span><strong>{tray.length}</strong><small>Optional</small></article>
        <article><span>Investigation notes</span><strong>{notes.length}</strong><small>Optional</small></article>
        <article><span>Proven flags</span><strong>{packageStatus.indicatorSummary.selectedCount}</strong></article>
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
        <form className="decision-form decision-v1-form" onSubmit={submitDecision}>
          <header>
            <p>Determination</p>
            <h3>Make the case decision</h3>
            <span>Choose the lane-appropriate action below, then explain how the proven flags and supporting evidence justify it.</span>
          </header>

          <fieldset className="decision-choice-fieldset">
            <legend>Determination choice</legend>
            <div className="decision-choice-groups">
              {selectionGroups.map((group) => (
                <section key={group.label} className="decision-choice-group" aria-label={group.label}>
                  <h4>{group.label}</h4>
                  <div>
                    {group.options.map((item) => (
                      <label key={item} data-choice-selected={decisionDraft.choice === item ? 'true' : 'false'}>
                        <input
                          type="radio"
                          name={`decision-choice-${activeCase.id}`}
                          value={item}
                          checked={decisionDraft.choice === item}
                          onChange={(event) => updateDecision('choice', event.target.value)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
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
            <span>Learner rationale</span>
            <textarea
              value={decisionDraft.reason}
              onChange={(event) => updateDecision('reason', event.target.value)}
              placeholder={`Write the evidence-based rationale for ${activeCase.id}.`}
              aria-describedby="decision-rationale-help"
            />
            <small id="decision-rationale-help">Use the reviewed records, pinned objects, notes, and unresolved gaps. Minimum {packageStatus.minimumRationaleWords} words.</small>
          </label>

          <button className="primary-action" type="submit" aria-label={submitLabel}>
            {submitLabel}
          </button>
        </form>

        <section className="decision-v1-checklist" aria-labelledby="decision-checklist-heading">
          <header>
            <div>
              <p>Final evidence check</p>
              <h3 id="decision-checklist-heading">Decision readiness</h3>
            </div>
            <span>{packageStatus.blockers.length ? `${packageStatus.blockers.length} open` : 'Complete'}</span>
          </header>

          <div className="decision-checklist" aria-live="polite">
            {packageStatus.messages.map((message, index) => (
              <article key={message} data-checklist-message={index === 0 ? 'primary' : 'supporting'}>
                <span aria-hidden="true">{index === 0 && packageStatus.ready ? '✓' : '•'}</span>
                <DirectCollapsibleText minLength={88}>{message}</DirectCollapsibleText>
              </article>
            ))}
          </div>

          <div className="decision-v1-support-summary">
            <div>
              <span>Rationale progress</span>
              <strong>{packageStatus.rationaleWordCount}/{packageStatus.minimumRationaleWords} words</strong>
            </div>
            <div className="decision-v1-progress" aria-hidden="true"><b style={{ width: `${rationaleProgress}%` }} /></div>
            <p>{packageStatus.packageInputSummary}</p>
          </div>
        </section>
      </div>

      {latestPackage && (
        <section className="decision-v1-confirmation" role="status" aria-label="Decision submission confirmation">
          <div aria-hidden="true">✓</div>
          <div>
            <p>Submission confirmation</p>
            <h3>Decision submitted for {latestPackage.caseId}</h3>
            <span>{latestPackage.choice} · {latestPackage.confidence} confidence · saved {latestPackage.savedAt}</span>
          </div>
          <strong>Luna debrief unlocked</strong>
        </section>
      )}
    </section>
  );
}
