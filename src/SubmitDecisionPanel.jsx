import DirectCollapsibleText from './DirectCollapsibleText.jsx';
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
  submitDecision,
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const readyLabel = latestPackage ? 'Package saved' : packageStatus.ready ? 'Ready to save' : 'Review in progress';
  const rationaleProgress = Math.min(
    100,
    Math.round((packageStatus.rationaleWordCount / packageStatus.minimumRationaleWords) * 100),
  );
  const submitLabel = packageStatus.ready ? 'Save learner package' : 'Check package readiness';
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
          <p>Build a defensible learner package from the evidence you reviewed, the records you pinned, and the reasoning you documented.</p>
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
        <article><span>Required tools</span><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong></article>
        <article><span>Pinned objects</span><strong>{tray.length}</strong></article>
        <article><span>Investigation notes</span><strong>{notes.length}</strong></article>
      </section>

      <div className="decision-v1-workspace">
        <section className="decision-v1-checklist" aria-labelledby="decision-checklist-heading">
          <header>
            <div>
              <p>Final evidence check</p>
              <h3 id="decision-checklist-heading">Package readiness</h3>
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

        <form className="decision-form decision-v1-form" onSubmit={submitDecision}>
          <header>
            <p>Your determination</p>
            <h3>Document the learner decision</h3>
            <span>Choose the lane-appropriate action, calibrate confidence, and explain how the evidence supports your reasoning.</span>
          </header>

          <label>
            <span>Learner choice</span>
            <select
              value={decisionDraft.choice}
              onChange={(event) => updateDecision('choice', event.target.value)}
              aria-label="Learner decision choice"
            >
              <option value="">Select a decision or review route...</option>
              {selectionGroups.map((group) => (
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
            <small id="decision-rationale-help">Use the reviewed records, pinned objects, notes, and unresolved gaps. Minimum {packageStatus.minimumRationaleWords} words.</small>
          </label>

          <button className="primary-action" type="submit" aria-label={submitLabel}>
            {submitLabel}
          </button>
        </form>
      </div>

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
