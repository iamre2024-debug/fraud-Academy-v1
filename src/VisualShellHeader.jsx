export default function VisualShellHeader({ activeCase, cases, changeCase }) {
  return (
    <>
      <header className="visual-hero">
        <div className="hero-cat left">🐈‍⬛</div>
        <div className="hero-bat">🦇</div>
        <div className="hero-title-wrap"><div className="hero-jewel">💜</div><h1>Fraud Academy OS</h1><span>v1.0</span></div>
        <div className="hero-cat right">🦇</div>
      </header>

      <section className="case-info-bar visual-case-strip">
        <div><span>▣</span><strong>Case</strong><em>{activeCase.id}</em></div>
        <div><span>♟</span><strong>Claim Type:</strong><em>{activeCase.type}</em></div>
        <div><span>◈</span><strong>Status:</strong><em>{activeCase.status}</em></div>
        <label className="visual-case-switcher"><span>Case Queue</span><select value={activeCase.id} onChange={(event) => changeCase(event.target.value)}>{cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.person}</option>)}</select></label>
      </section>
    </>
  );
}
