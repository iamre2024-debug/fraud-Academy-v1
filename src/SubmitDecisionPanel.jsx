import DecisionFlagChecklist from './DecisionFlagChecklist.jsx';
import DecisionEvidenceNotepad from './DecisionEvidenceNotepad.jsx';
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
  openDebrief,
  removePin,
  toolNames,
  saveNote,
}) {
  const latestPackage = reviewPackages[0] ?? null;
  const submissionLabel = latestPackage ? 'Decision saved' : 'Ready to submit';
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
          <strong data-decision-submission-state={latestPackage ? 'saved' : 'available'}>{submissionLabel}</strong>
        </div>
      </header>

      <section className="decision-v1-lock" aria-label="Evidence First decision lock">
        <div aria-hidden="true">⌁</div>
        <div>
          <p>Evidence First protection</p>
          <h3>Luna Briefing stays locked until this case has a Submitted Decision Record.</h3>
          <span>You can submit at any time. Unfinished checklist details are saved for coaching and never prevent Luna from unlocking.</span>
        </div>
      </section>

      <section className="decision-status-grid" aria-label="Submitted decision record summary">
        <article><span>Tools reviewed</span><strong>{packageStatus.reviewedRequired}/{packageStatus.totalRequired}</strong><small>Optional</small></article>
        <article><span>Pinned objects</span><strong>{tray.length}</strong><small>Optional</small></article>
        <article><span>Investigation notes</span><strong>{notes.length}</strong><small>Optional</small></article>
        <article><span>Selected flags</span><strong>{packageStatus.indicatorSummary.selectedCount}</strong><small>Optional</small></article>
      </section>

      <p className="decision-direct-submit-note" role="note">
        You can submit a decision without reviewing every tool. Open only the records needed to prove your selected flags.
      </p>

      <DecisionEvidenceNotepad
        tray={tray}
        notes={notes}
        activeCase={activeCase}
        toolNames={toolNames}
        decisionDraft={decisionDraft}
        updateDecision={updateDecision}
        removePin={removePin}
        saveNote={saveNote}
      />

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
            <span>Choose the lane-appropriate action. Add the support you have, then submit whenever you are ready for Luna Briefing.</span>
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
            <small id="decision-rationale-help">Optional. Use reviewed records, pinned objects, notes, and unresolved gaps when they are relevant.</small>
          </label>

          <button className="primary-action" type="submit" aria-label="Submit Decision">
            Submit Decision
          </button>
        </form>
      </div>

      {latestPackage && (
        <section className="decision-v1-confirmation" role="status" aria-label="Decision submission confirmation">
          <div aria-hidden="true">✓</div>
          <div>
            <p>Submission confirmation</p>
            <h3>Decision submitted for {latestPackage.caseId}</h3>
            <span>{latestPackage.choice || 'No determination selected'} · {latestPackage.confidence} confidence · saved {latestPackage.savedAt}</span>
          </div>
          <button type="button" className="decision-open-debrief" onClick={openDebrief}>Open Luna Briefing</button>
        </section>
      )}
    </section>
  );
}
