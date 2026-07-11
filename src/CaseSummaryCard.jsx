import DirectCollapsibleText from './DirectCollapsibleText.jsx';

export default function CaseSummaryCard({ activeCase, pin, openTool, jumpDecision }) {
  return (
    <section className="ornate-card case-summary-visual" aria-labelledby="case-briefing-title">
      <div className="case-briefing-icon" aria-hidden="true">☾</div>
      <div className="summary-copy">
        <div className="case-briefing-heading">
          <div>
            <p className="case-briefing-eyebrow">Case Briefing</p>
            <h2 id="case-briefing-title" className="visual-section-title">Why this case exists</h2>
          </div>
          <span className="case-briefing-neutral">Evidence First</span>
        </div>
        <div className="case-summary-meta-grid">
          <article><small>Customer</small><strong>{activeCase.person}</strong></article>
          <article><small>Claim ID</small><strong>{activeCase.claimId ?? activeCase.id}</strong></article>
          <article><small>Claim amount</small><strong>{activeCase.amount}</strong></article>
          <article><small>Priority</small><strong>{activeCase.priority ?? 'Standard'}</strong></article>
          <article className="wide">
            <small>Transaction or payee information</small>
            <DirectCollapsibleText as="strong" lines={2} mobileLines={3}>
              {activeCase.transactionInfo ?? activeCase.type}
            </DirectCollapsibleText>
          </article>
          <article className="wide case-briefing-summary">
            <small>Customer allegation or system alert</small>
            <DirectCollapsibleText as="strong" lines={3} mobileLines={4}>
              {activeCase.shortSummary ?? activeCase.queueReason}
            </DirectCollapsibleText>
          </article>
        </div>
      </div>
      <div className="case-briefing-next" aria-label="Investigation starting points">
        <span>Start with identity and access context</span>
        <button type="button" onClick={() => openTool('Customer 360')}>Open Customer 360</button>
      </div>
      <div className="summary-actions">
        <button type="button" onClick={() => pin(activeCase.id)}>📌 Pin Case</button>
        <button type="button" onClick={() => openTool('Identity Intelligence')}>Identity Intelligence</button>
        <button type="button" onClick={() => openTool('Login History')}>Login History</button>
        <button type="button" onClick={() => openTool('Case Report')}>Case Report</button>
        <button type="button" className="primary-action decision-jump-button" onClick={jumpDecision}>Submit Decision</button>
      </div>
    </section>
  );
}
