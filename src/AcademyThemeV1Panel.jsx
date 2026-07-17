import DirectCollapsibleText from './DirectCollapsibleText.jsx';

const learningPaths = [
  {
    number: '01',
    title: 'Evidence First foundation',
    description: 'Build the habit of protecting the outcome until the investigation and learner package are complete.',
    steps: ['Evidence First', 'Open records'],
    label: 'Foundation',
  },
  {
    number: '02',
    title: 'Record review practice',
    description: 'Move from the case snapshot into source details, history, and context without treating summaries as proof.',
    steps: ['Expand details', 'Search objects'],
    label: 'Record review',
  },
  {
    number: '03',
    title: 'Evidence connections',
    description: 'Connect shared objects and preserve neutral findings before adding evidence to the case record.',
    steps: ['Link analysis', 'Generate report'],
    label: 'Investigation',
  },
  {
    number: '04',
    title: 'Case quality and submission',
    description: 'Turn reviewed evidence into a documented packet and save the learner decision only when readiness passes.',
    steps: ['Submit package'],
    label: 'Case quality',
  },
];

const libraryTopics = [
  ['Evidence First', 'Protected workflow, neutral language, and delayed coaching.'],
  ['Customer and identity', 'Profile, relationship, contact, and identity-record review.'],
  ['Digital and financial', 'Login, device, IP, transaction, and payment-verification practice.'],
  ['Evidence and decisions', 'Notes, evidence packets, readiness, submission, and debrief.'],
];

const achievementSteps = [
  ['Review required tools', 'Complete the case-specific required-tool set.'],
  ['Document the evidence', 'Save pinned objects and notes.'],
  ['Submit the package', 'Unlock the case-scoped Luna debrief and progress snapshot.'],
];

export default function AcademyThemeV1Panel({ onNavigate }) {
  return (
    <div className="academy-theme-v1" data-academy-screen="approved-theme-v1">
      <header className="academy-hero">
        <div className="academy-hero-copy">
          <span className="academy-kicker">Learning Center</span>
          <h3>Build investigator judgment</h3>
          <DirectCollapsibleText as="p" lines={3} mobileLines={3}>
            Practice the complete Evidence First rhythm, then use the active case workspace to apply each skill to realistic fictional records.
          </DirectCollapsibleText>
          <div className="academy-hero-actions" aria-label="Academy primary actions">
            <button type="button" className="academy-primary-action" onClick={() => onNavigate('workspace')}>
              Continue active case <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="academy-secondary-action" onClick={() => onNavigate('cases')}>
              Open Case Queue
            </button>
          </div>
        </div>
        <div className="academy-hero-mark" aria-hidden="true">
          <span>FA</span>
          <small>Academy</small>
        </div>
      </header>

      <section className="academy-stat-grid" aria-label="Academy overview">
        <article><strong>4</strong><span>Learning paths</span></article>
        <article><strong>8</strong><span>Core practice steps</span></article>
        <article><strong>1</strong><span>Evidence First standard</span></article>
        <article><strong>Case-based</strong><span>Progress model</span></article>
      </section>

      <div className="academy-main-grid">
        <section className="academy-learning-center" aria-labelledby="academy-paths-title">
          <div className="academy-section-heading">
            <div>
              <span className="academy-kicker">Learning paths</span>
              <h4 id="academy-paths-title">Practice in investigation order</h4>
            </div>
            <p>Each path maps to the existing workspace flow and keeps the outcome protected until submission.</p>
          </div>

          <div className="academy-path-grid">
            {learningPaths.map((path) => (
              <article className="academy-path-card" key={path.number} data-academy-path={path.number}>
                <div className="academy-path-topline">
                  <span>{path.number}</span>
                  <small>{path.label}</small>
                </div>
                <h5>{path.title}</h5>
                <DirectCollapsibleText as="p" lines={3} mobileLines={3}>
                  {path.description}
                </DirectCollapsibleText>
                <ol>
                  {path.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <aside className="academy-context-column">
          <section className="academy-library-card" aria-labelledby="academy-library-title">
            <span className="academy-kicker">Fraud Library</span>
            <h4 id="academy-library-title">Reference by investigation topic</h4>
            <div className="academy-library-list">
              {libraryTopics.map(([title, detail]) => (
                <article key={title}>
                  <span aria-hidden="true">◈</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="academy-achievement-card" aria-labelledby="academy-achievements-title">
            <span className="academy-kicker">Achievements</span>
            <h4 id="academy-achievements-title">Progress follows completed work</h4>
            <p>Academy status stays neutral until a learner package is saved for the case.</p>
            <ol>
              {achievementSteps.map(([title, detail]) => (
                <li key={title}>
                  <span aria-hidden="true">✓</span>
                  <div><strong>{title}</strong><small>{detail}</small></div>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => onNavigate('progress')}>Open Academy Progress</button>
          </section>
        </aside>
      </div>

      <footer className="academy-practice-banner">
        <div>
          <span className="academy-kicker">Practice next</span>
          <strong>Use a case to turn the learning path into evidence work.</strong>
          <p>Open records, verify source context, document findings, and submit only after readiness passes.</p>
        </div>
        <button type="button" onClick={() => onNavigate('workspace')}>Practice in Workspace</button>
      </footer>
    </div>
  );
}
