import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { reviewChoices } from './data/reviewPackage.js';

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
  const readyToSubmit = packageStatus.reviewedRequired === packageStatus.totalRequired && tray.length > 0 && notes.length > 0;

  return (
    <section ref={submitRef} className="ornate-card submit-decision-panel" aria-labelledby="submit-decision-title">
      <div className="card-title-row decision-heading-row">
        <div>
          <span className="tool-context-label">Review and decision</span>
          <h2 id="submit-decision-title">Submit Decision</h2>
          <p>Complete the evidence package before Luna coaching or any outcome feedback becomes available.</p>
        </div>
        <span className={`decision-readiness-chip ${readyToSubmit ? 'ready' : 'waiting'}`}>{readyToSubmit ? 'Ready to review' : 'Checklist open'}</span>
      </div>
      <div className="decision-status-grid" aria-label="Review package status">
        <div><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><span>Required tools</span></div>
        <div><strong>{tray.length}</strong><span>Pinned objects</span></div>
        <div><strong>{notes.length}</strong><span>Notes</span></div>
        <div><strong>{reviewPackages.length}</strong><span>Saved packages</span></div>
      </div>
      <div className="decision-checklist" aria-label="Submission checklist">
        {packageStatus.messages.map((message) => (
          <DirectCollapsibleText key={message} minLength={88}>
            ✦ {message}
          </DirectCollapsibleText>
        ))}
      </div>
      <form className="decision-form" onSubmit={submitDecision}>
        <label>Learner choice<select value={decisionDraft.choice} onChange={(event) => updateDecision('choice', event.target.value)}><option value="">Select neutral choice...</option>{reviewChoices.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Confidence<select value={decisionDraft.confidence} onChange={(event) => updateDecision('confidence', event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label className="decision-rationale">Learner rationale<textarea value={decisionDraft.reason} onChange={(event) => updateDecision('reason', event.target.value)} placeholder={`Write the evidence-based rationale for ${activeCase.id}.`} /></label>
        <button className="primary-action decision-submit-button" type="submit">Save / Check Review Package</button>
      </form>
    </section>
  );
}
