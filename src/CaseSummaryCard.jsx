export default function CaseSummaryCard({ activeCase, pin, openTool, jumpDecision }) {
  return (
    <section className="ornate-card case-summary-visual">
      <div className="moon-medallion">☾</div>
      <div className="summary-copy">
        <p className="visual-section-title">♥ Case Summary</p>
        <div className="case-summary-meta-grid">
          <article><small>Name</small><strong>{activeCase.person}</strong></article>
          <article><small>Claim ID</small><strong>{activeCase.claimId ?? activeCase.id}</strong></article>
          <article><small>Total claim amount</small><strong>{activeCase.amount}</strong></article>
          <article className="wide"><small>Transaction / payee info</small><strong>{activeCase.transactionInfo ?? activeCase.type}</strong></article>
          <article className="wide"><small>Short summary</small><strong>{activeCase.shortSummary ?? activeCase.queueReason}</strong></article>
        </div>
      </div>
      <div className="butterfly-accent">🦋</div>
      <div className="summary-actions">
        <button type="button" onClick={() => pin(activeCase.id)}>📌 Pin Case</button>
        <button type="button" onClick={() => openTool('Identity Intelligence')}>▣ Identity Intel ›</button>
        <button type="button" onClick={() => openTool('Case Report')}>📄 Case Report ›</button>
        <button type="button" onClick={() => openTool('Login History')}>🪄 Open First Tool ›</button>
        <button type="button" className="primary-action decision-jump-button" onClick={jumpDecision}>🪄 Submit Decision ›</button>
      </div>
    </section>
  );
}
