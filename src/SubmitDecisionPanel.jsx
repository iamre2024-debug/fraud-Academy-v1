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
  return (
    <section ref={submitRef} className="ornate-card submit-decision-panel">
      <div className="card-title-row"><div><h2>🪄 Submit Decision</h2><p>Locked checklist. No Luna scoring or answer reveal until a learner package is saved.</p></div><span>☾</span></div>
      <div className="decision-status-grid"><div><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><span>Required tools</span></div><div><strong>{tray.length}</strong><span>Pinned objects</span></div><div><strong>{notes.length}</strong><span>Notes</span></div><div><strong>{reviewPackages.length}</strong><span>Saved packages</span></div></div>
      <div className="decision-checklist">
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
        <button className="primary-action" type="submit">Save / Check Review Package</button>
      </form>
    </section>
  );
}
