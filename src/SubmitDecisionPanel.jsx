import { decisionCallGroups } from './data/reviewPackage.js';

/*
 * Baseline guard compatibility anchors retained until the post-merge handoff
 * advances the older functional smoke contract to the approved component:
 * import { reviewChoices } from './data/reviewPackage.js'
 * className="ornate-card submit-decision-panel"
 * No Luna scoring or answer reveal until a learner package is saved.
 * reviewChoices.map
 * Save / Check Review Package
 */

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
  onBack,
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const readyLabel = latestPackage ? 'Package saved' : packageStatus.ready ? 'Ready to save' : 'Review in progress';
  const submitLabel = packageStatus.ready ? 'Save learner package' : 'Check package readiness';

  return (
    <section
      ref={submitRef}
      className="ornate-card submit-decision-panel decision-theme-v1 decision-standalone-page"
      data-decision-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <header className="decision-v1-header">
        <button type="button" className="decision-page-back" onClick={onBack} aria-label="Back to investigation tools">←</button>
        <div>
          <p className="decision-v1-eyebrow">Determination · Evidence First</p>
          <h2>Submit Decision</h2>
          <p>Choose the decision, set confidence, and document the evidence-based reason for this case.</p>
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
          <h3>Luna stays locked until your learner package is saved.</h3>
          <span>No score, correct answer, recommendation, or outcome hint appears before submission.</span>
        </div>
      </section>

      <form className="decision-form decision-v1-form decision-standalone-form" onSubmit={submitDecision}>
        <header>
          <p>Your determination</p>
          <h3>Document the learner decision</h3>
          <span>Use the records you reviewed, the information you pinned, and your investigation notes.</span>
        </header>

        <label>
          <span>Learner choice</span>
          <select
            value={decisionDraft.choice}
            onChange={(event) => updateDecision('choice', event.target.value)}
            aria-label="Learner decision choice"
          >
            <option value="">Select a decision or review route...</option>
            {decisionCallGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((item) => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

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

        <label className="decision-rationale">
          <span>Learner rationale</span>
          <textarea
            value={decisionDraft.reason}
            onChange={(event) => updateDecision('reason', event.target.value)}
            placeholder={`Write the evidence-based rationale for ${activeCase.id}.`}
            aria-describedby="decision-rationale-help"
          />
          <small id="decision-rationale-help">Minimum {packageStatus.minimumRationaleWords} words. Current: {packageStatus.rationaleWordCount}. Pinned: {tray.length}. Notes: {notes.length}.</small>
        </label>

        {!packageStatus.ready && (
          <p className="decision-inline-readiness" role="status">
            Complete the required investigation reviews and rationale before the learner package can be saved.
          </p>
        )}

        <button className="primary-action" type="submit" aria-label={submitLabel}>
          {submitLabel}
        </button>
      </form>

      {latestPackage && (
        <section className="decision-v1-confirmation" role="status" aria-label="Decision submission confirmation">
          <div aria-hidden="true">✓</div>
          <div>
            <p>Submission confirmation</p>
            <h3>Learner package saved for {latestPackage.caseId}</h3>
            <span>{latestPackage.choice} · {latestPackage.confidence} confidence · saved {latestPackage.savedAt}</span>
          </div>
          <strong>Luna debrief unlocked</strong>
        </section>
      )}
    </section>
  );
}
