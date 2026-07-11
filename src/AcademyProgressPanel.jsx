import DirectCollapsibleText from './DirectCollapsibleText.jsx';

function countSavedPackages(packagesByCase) {
  return Object.values(packagesByCase).reduce((sum, packages) => sum + (Array.isArray(packages) ? packages.length : 0), 0);
}

function getPackageMetrics(reviewPackage) {
  if (!reviewPackage) {
    return {
      reviewedRequired: 0,
      totalRequired: 0,
      pinnedEvidence: 0,
      notes: 0,
      reportPackets: 0,
    };
  }

  return {
    reviewedRequired: reviewPackage.reviewedRequired ?? reviewPackage.completedTools?.length ?? 0,
    totalRequired: reviewPackage.totalRequired ?? reviewPackage.completedTools?.length ?? 0,
    pinnedEvidence: reviewPackage.pinnedEvidence?.length ?? 0,
    notes: reviewPackage.noteSnapshot?.length ?? 0,
    reportPackets: reviewPackage.reportPacketCount ?? reviewPackage.caseReportPackets?.length ?? 0,
  };
}

export default function AcademyProgressPanel({ cases, packagesByCase, onOpenCase }) {
  const unlockedCases = cases.filter((item) => (packagesByCase[item.id] ?? []).length > 0).length;
  const savedPackages = countSavedPackages(packagesByCase);

  return (
    <>
      <div className="nav-progress-summary" aria-label="Academy progress summary">
        <article><strong>{cases.length}</strong><span>Training cases</span></article>
        <article><strong>{unlockedCases}</strong><span>Luna unlocked</span></article>
        <article><strong>{savedPackages}</strong><span>Saved packages</span></article>
      </div>
      <div className="nav-progress-list">
        {cases.map((item) => {
          const packages = packagesByCase[item.id] ?? [];
          const latest = packages[0];
          const metrics = getPackageMetrics(latest);
          const savedAt = latest?.savedAt || 'recently';

          return (
            <article key={item.id} className={latest ? 'unlocked' : 'locked'}>
              <div className="nav-progress-copy">
                <span>{item.type}</span>
                <strong>{item.person}</strong>
                <DirectCollapsibleText as="p" lines={2} mobileLines={2}>
                  {latest
                    ? `Latest learner package saved ${savedAt}. Luna debrief is available for this case.`
                    : 'Submit a review package to unlock Luna progress.'}
                </DirectCollapsibleText>
                {latest && (
                  <div className="nav-progress-metrics" aria-label={`${item.id} saved package snapshot`}>
                    <small><b>{metrics.reviewedRequired}/{metrics.totalRequired}</b> required tools</small>
                    <small><b>{metrics.pinnedEvidence}</b> pinned objects</small>
                    <small><b>{metrics.notes}</b> saved notes</small>
                    <small><b>{metrics.reportPackets}</b> report packets</small>
                    <small><b>{packages.length}</b> package{packages.length === 1 ? '' : 's'}</small>
                  </div>
                )}
              </div>
              <div className="nav-progress-actions">
                <em>{latest ? 'Unlocked' : 'Locked'}</em>
                <button type="button" onClick={() => onOpenCase(item.id)}>
                  {latest ? 'Open case review' : 'Continue case'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
