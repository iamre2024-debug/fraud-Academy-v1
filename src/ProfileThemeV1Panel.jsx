const skillDefinitions = [
  {
    key: 'identity',
    label: 'Identity and customer review',
    detail: 'Practice profile, relationship, contact, and identity-record verification.',
    icon: 'ID',
  },
  {
    key: 'digital',
    label: 'Digital and financial review',
    detail: 'Practice login, device, IP, transaction, and payment-verification analysis.',
    icon: 'DF',
  },
  {
    key: 'evidence',
    label: 'Evidence documentation',
    detail: 'Build notes, pinned-object context, and neutral report packets.',
    icon: 'EV',
  },
  {
    key: 'decision',
    label: 'Case quality and determination',
    detail: 'Complete readiness checks and save a defensible learner package.',
    icon: 'CQ',
  },
];

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSkillProgress(snapshot) {
  return {
    identity: clampPercent(snapshot.reviewed * 6 + snapshot.notes * 4),
    digital: clampPercent(snapshot.reviewed * 5 + snapshot.packets * 12),
    evidence: clampPercent(snapshot.notes * 16 + snapshot.packets * 28 + snapshot.reviewed * 2),
    decision: clampPercent(snapshot.packages * 45 + snapshot.packets * 18 + snapshot.notes * 7),
  };
}

function getRank(snapshot) {
  if (snapshot.packages >= 3) return 'Senior Investigator';
  if (snapshot.packages >= 1) return 'Investigator I';
  if (snapshot.reviewed >= 8 || snapshot.notes >= 3) return 'Developing Investigator';
  return 'Trainee Investigator';
}

function getUnlockedBadges(snapshot) {
  return {
    evidenceFirst: true,
    recordReviewer: snapshot.reviewed >= 4,
    caseDocumenter: snapshot.notes >= 1 || snapshot.packets >= 1,
    packageBuilder: snapshot.packages >= 1,
  };
}

export default function ProfileThemeV1Panel({ activeCaseId, cases, snapshot, onNavigate, onOpenCase }) {
  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const rank = getRank(snapshot);
  const skills = buildSkillProgress(snapshot);
  const badges = getUnlockedBadges(snapshot);
  const completedCases = Object.values(snapshot.packagesByCase ?? {}).filter((items) => Array.isArray(items) && items.length > 0).length;
  const activeReviewed = snapshot.completedByCase?.[activeCase?.id]?.length ?? 0;
  const activeNotes = snapshot.notesByCase?.[activeCase?.id]?.length ?? 0;
  const activePackets = snapshot.packetsByCase?.[activeCase?.id]?.length ?? 0;
  const activePackages = snapshot.packagesByCase?.[activeCase?.id]?.length ?? 0;
  const goals = [
    { label: 'Review required tools', current: Math.min(activeReviewed, 8), target: 8, action: 'Open Workspace', route: 'workspace' },
    { label: 'Document investigation notes', current: Math.min(activeNotes, 3), target: 3, action: 'Open Workspace', route: 'workspace' },
    { label: 'Generate a neutral report packet', current: Math.min(activePackets, 1), target: 1, action: 'Open Workspace', route: 'workspace' },
    { label: 'Save the learner package', current: Math.min(activePackages, 1), target: 1, action: 'View Progress', route: 'progress' },
  ];

  return (
    <div className="profile-theme-v1" data-profile-screen="approved-theme-v1" data-case-id={activeCase?.id ?? ''}>
      <header className="profile-hero">
        <div className="profile-avatar" aria-hidden="true">LA</div>
        <div className="profile-hero-copy">
          <span className="profile-kicker">Agent profile</span>
          <h3>Learner Agent</h3>
          <p className="profile-rank">{rank}</p>
          <p>Activity-based development tracks investigation habits only. Case outcomes and Luna coaching remain protected until a learner package is saved.</p>
          <div className="profile-hero-actions">
            <button type="button" className="profile-primary-action" onClick={() => activeCase && onOpenCase(activeCase.id)}>
              Continue active case <span aria-hidden="true">→</span>
            </button>
            <button type="button" className="profile-secondary-action" onClick={() => onNavigate('progress')}>Open Academy Progress</button>
          </div>
        </div>
        <aside className="profile-active-assignment" aria-label="Current assignment">
          <span className="profile-kicker">Current assignment</span>
          <strong>{activeCase?.id ?? 'No active case'}</strong>
          <p>{activeCase ? `${activeCase.type} · ${activeCase.person}` : 'Choose a training case to begin.'}</p>
          <small>{activeCase ? `${activeCase.priority} priority · ${activeCase.status}` : 'Case Queue available'}</small>
        </aside>
      </header>

      <section className="profile-stat-grid" aria-label="Agent activity summary">
        <article><strong>{cases.length}</strong><span>Training cases available</span></article>
        <article><strong>{snapshot.reviewed}</strong><span>Tools reviewed</span></article>
        <article><strong>{snapshot.notes}</strong><span>Notes saved</span></article>
        <article><strong>{completedCases}</strong><span>Cases with saved packages</span></article>
      </section>

      <div className="profile-main-grid">
        <section className="profile-skills-card" aria-labelledby="profile-skills-title">
          <div className="profile-section-heading">
            <div>
              <span className="profile-kicker">Skill proficiency</span>
              <h4 id="profile-skills-title">Practice across the investigation workflow</h4>
            </div>
            <p>These percentages reflect completed learning activity, not hidden case correctness or a pre-submission risk score.</p>
          </div>
          <div className="profile-skill-list">
            {skillDefinitions.map((skill) => (
              <article key={skill.key}>
                <span className="profile-skill-icon" aria-hidden="true">{skill.icon}</span>
                <div className="profile-skill-copy">
                  <div><strong>{skill.label}</strong><b>{skills[skill.key]}%</b></div>
                  <p>{skill.detail}</p>
                  <div className="profile-progress-track" role="progressbar" aria-label={`${skill.label} practice proficiency`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={skills[skill.key]}>
                    <span style={{ width: `${skills[skill.key]}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="profile-side-column">
          <section className="profile-badges-card" aria-labelledby="profile-badges-title">
            <span className="profile-kicker">Badges</span>
            <h4 id="profile-badges-title">Investigation milestones</h4>
            <div className="profile-badge-grid">
              <article className={badges.evidenceFirst ? 'unlocked' : 'locked'}><span>EF</span><strong>Evidence First</strong><small>Core standard</small></article>
              <article className={badges.recordReviewer ? 'unlocked' : 'locked'}><span>RR</span><strong>Record Reviewer</strong><small>{badges.recordReviewer ? 'Unlocked' : 'Review 4 tools'}</small></article>
              <article className={badges.caseDocumenter ? 'unlocked' : 'locked'}><span>CD</span><strong>Case Documenter</strong><small>{badges.caseDocumenter ? 'Unlocked' : 'Save a note or packet'}</small></article>
              <article className={badges.packageBuilder ? 'unlocked' : 'locked'}><span>PB</span><strong>Package Builder</strong><small>{badges.packageBuilder ? 'Unlocked' : 'Save a learner package'}</small></article>
            </div>
          </section>

          <section className="profile-activity-card" aria-labelledby="profile-activity-title">
            <span className="profile-kicker">Activity summary</span>
            <h4 id="profile-activity-title">Your saved work</h4>
            <dl>
              <div><dt>Neutral report packets</dt><dd>{snapshot.packets}</dd></div>
              <div><dt>Submitted packages</dt><dd>{snapshot.packages}</dd></div>
              <div><dt>Active-case tools</dt><dd>{activeReviewed}</dd></div>
              <div><dt>Active-case notes</dt><dd>{activeNotes}</dd></div>
            </dl>
            <button type="button" onClick={() => onNavigate('academy')}>Return to Academy</button>
          </section>
        </aside>
      </div>

      <section className="profile-goals-card" aria-labelledby="profile-goals-title">
        <div className="profile-section-heading">
          <div>
            <span className="profile-kicker">Goals</span>
            <h4 id="profile-goals-title">Complete the active case package</h4>
          </div>
          <p>Goals follow the current case and use the existing case-scoped notes, reviewed tools, packets, and learner-package snapshot.</p>
        </div>
        <div className="profile-goal-grid">
          {goals.map((goal) => {
            const progress = clampPercent((goal.current / goal.target) * 100);
            return (
              <article key={goal.label} className={progress === 100 ? 'complete' : ''}>
                <div><strong>{goal.label}</strong><span>{goal.current}/{goal.target}</span></div>
                <div className="profile-progress-track" role="progressbar" aria-label={goal.label} aria-valuemin="0" aria-valuemax={goal.target} aria-valuenow={goal.current}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <button type="button" onClick={() => onNavigate(goal.route)}>{progress === 100 ? 'Review' : goal.action}</button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
