export default function VisualShellHeader({ activeCase, cases, changeCase }) {
  return (
    <>
      <header className="visual-hero visual-command-hero">
        <div className="visual-command-brand" aria-label="Fraud Academy OS">
          <span className="visual-command-mark" aria-hidden="true">☾</span>
          <div>
            <p>Fraud Investigation Operating System</p>
            <h1>Fraud Academy</h1>
            <span>Evidence First training workspace</span>
          </div>
        </div>

        <div className="visual-command-status" aria-label="Workspace status">
          <span>Active investigation</span>
          <strong>{activeCase.person}</strong>
          <small>{activeCase.type} · {activeCase.priority} priority</small>
        </div>
      </header>

      <section className="case-info-bar visual-case-strip" aria-label="Active case command bar">
        <div className="visual-case-identity">
          <span aria-hidden="true">▣</span>
          <p><small>Case</small><strong>{activeCase.id}</strong></p>
        </div>
        <div>
          <span aria-hidden="true">♟</span>
          <p><small>Claim type</small><strong>{activeCase.type}</strong></p>
        </div>
        <div>
          <span aria-hidden="true">◈</span>
          <p><small>Status</small><strong>{activeCase.status}</strong></p>
        </div>
        <label className="visual-case-switcher">
          <span>Case queue</span>
          <select value={activeCase.id} onChange={(event) => changeCase(event.target.value)} aria-label="Switch active case">
            {cases.map((item) => (
              <option key={item.id} value={item.id}>{item.id} · {item.person}</option>
            ))}
          </select>
        </label>
      </section>
    </>
  );
}
