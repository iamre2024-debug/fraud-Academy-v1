export default function DecisionFlagChecklist({
  activeCase,
  tray,
  decisionDraft,
  indicatorSummary,
  updateDecisionIndicator,
}) {
  const checklist = indicatorSummary.checklist;
  const answers = decisionDraft.indicators ?? {};
  const proofOptions = [...new Set([
    ...tray,
    ...(activeCase.events ?? []).map((item) => item.id),
    ...(activeCase.loginHistory ?? []).map((item) => item.id),
    ...(activeCase.documents ?? []).map((item) => item.id),
  ].filter(Boolean))];
  const proofListId = `decision-proof-options-${activeCase.id}`;

  return (
    <section className="decision-flag-workspace" aria-labelledby="decision-flags-heading">
      <header className="decision-flag-header">
        <div>
          <p>Case-specific checklist</p>
          <h3 id="decision-flags-heading">{checklist.title}</h3>
          <span>{checklist.description}</span>
          <small>Matched to this case: {checklist.scopeLabel}</small>
        </div>
        <div className="decision-flag-progress" aria-label={`${indicatorSummary.selectedCount} flags selected`}>
          <strong>{indicatorSummary.selectedCount}</strong>
          <span>selected flags</span>
        </div>
      </header>

      <div className="decision-flag-scoreboard" aria-label="Weighted flag summary">
        <article data-summary-type="red"><span>Red flag weight</span><strong>{indicatorSummary.redPoints}</strong><small>{indicatorSummary.redCount} selected</small></article>
        <article data-summary-type="green"><span>Green flag weight</span><strong>{indicatorSummary.greenPoints}</strong><small>{indicatorSummary.greenCount} selected</small></article>
        <article data-summary-type="critical"><span>Critical red flags</span><strong>{indicatorSummary.criticalRedIndicators.length}</strong><small>Override weight</small></article>
      </div>

      {indicatorSummary.overrideIndicators.length > 0 && (
        <div className="decision-critical-notice" role="status">
          <strong>Critical red flag documented.</strong>
          <span>This evidence carries override weight and must be addressed in the determination and rationale.</span>
        </div>
      )}

      <div className="decision-flag-columns">
        {['red', 'green'].map((type) => {
          const flags = checklist.flags.filter((item) => item.type === type);
          return (
            <section key={type} className="decision-flag-column" data-flag-column={type} aria-label={`${type} flag checklist`}>
              <header>
                <div>
                  <p>{type === 'red' ? 'Red flags' : 'Green flags'}</p>
                  <h4>{type === 'red' ? 'Evidence against the claim or release' : 'Evidence supporting the claim or release'}</h4>
                </div>
                <span>{flags.length} checks</span>
              </header>

              <div className="decision-flag-list">
                {flags.map((item) => {
                  const answer = answers[item.id] ?? {};
                  const selected = Boolean(answer.selected);
                  const complete = selected && Boolean(answer.proof?.trim()) && Boolean(answer.explanation?.trim());
                  return (
                    <article key={item.id} className="decision-flag-item" data-selected={selected ? 'true' : 'false'} data-complete={complete ? 'true' : 'false'}>
                      <div className="decision-flag-item-heading">
                        <label>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => updateDecisionIndicator(item.id, 'selected', event.target.checked)}
                            aria-label={`${type === 'red' ? 'Red flag' : 'Green flag'}: ${item.prompt}`}
                          />
                          <span>{item.prompt}</span>
                        </label>
                        <strong data-flag-weight={item.weight.toLowerCase()}>{item.weight}</strong>
                      </div>
                      <p>{item.evidenceHint}</p>

                      {selected && (
                        <div className="decision-flag-proof">
                          <label>
                            <span>Proof or record reference</span>
                            <input
                              type="text"
                              list={proofListId}
                              value={answer.proof ?? ''}
                              onChange={(event) => updateDecisionIndicator(item.id, 'proof', event.target.value)}
                              placeholder="Transaction ID, timestamp, document, device, or record"
                              aria-label={`Proof for ${item.prompt}`}
                              required
                            />
                          </label>
                          <label>
                            <span>Why this evidence proves the flag</span>
                            <textarea
                              value={answer.explanation ?? ''}
                              onChange={(event) => updateDecisionIndicator(item.id, 'explanation', event.target.value)}
                              placeholder="Explain the connection between the record and this flag."
                              aria-label={`Explanation for ${item.prompt}`}
                              required
                            />
                          </label>
                          <small>{complete ? 'Proof complete' : 'Add proof and explanation to complete this selected flag.'}</small>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <datalist id={proofListId}>
        {proofOptions.map((item) => <option key={item} value={item} />)}
      </datalist>
    </section>
  );
}
