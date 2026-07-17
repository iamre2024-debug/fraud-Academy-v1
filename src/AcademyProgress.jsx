import { useEffect, useMemo, useState } from 'react';
import { trainingCases } from './data/cases.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';

const REVIEW_PACKAGE_KEY = 'fraud-academy-review-packages-v1';
const REQUIRED_TOOL_GOAL = 8;

function readReviewPackages() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem(REVIEW_PACKAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function flattenPackages(packagesByCase) {
  return Object.entries(packagesByCase).flatMap(([caseId, packages]) => (
    Array.isArray(packages) ? packages.map((item) => ({ ...item, caseId: item.caseId || caseId })) : []
  ));
}

function buildProgressRows(packagesByCase) {
  return trainingCases.map((activeCase) => {
    const packages = packagesByCase[activeCase.id] ?? [];
    const latestPackage = packages[0];
    const debrief = latestPackage ? buildLunaDebrief({
      activeCase,
      reviewPackage: latestPackage,
      completedTools: latestPackage.completedTools ?? [],
      tray: latestPackage.pinnedEvidence ?? [],
      notes: latestPackage.noteSnapshot ?? [],
    }) : null;

    return {
      caseId: activeCase.id,
      caseType: activeCase.type,
      person: activeCase.person,
      status: latestPackage ? 'Submitted decision saved' : 'Investigation open',
      savedAt: latestPackage?.savedAt ?? 'Not submitted yet',
      score: debrief?.score ?? null,
      scoreLabel: debrief?.scoreLabel ?? 'Locked',
      requiredCoverage: latestPackage ? `${latestPackage.reviewedRequired ?? 0}/${latestPackage.totalRequired ?? REQUIRED_TOOL_GOAL}` : 'Locked',
      packageCount: packages.length,
      nextFocus: debrief?.followUps?.[0] ?? 'Save a Submitted Decision Record to unlock Luna progress.',
    };
  });
}

function buildSkillMeters(rows) {
  const completedRows = rows.filter((row) => typeof row.score === 'number');
  if (!completedRows.length) {
    return [
      { label: 'Evidence coverage', value: 0, note: 'Locked until a Submitted Decision Record is saved.' },
      { label: 'Documentation depth', value: 0, note: 'Rationale scoring appears after submission.' },
      { label: 'Case completion', value: 0, note: 'Complete cases to grow the academy trail.' },
    ];
  }

  const averageScore = Math.round(completedRows.reduce((sum, row) => sum + row.score, 0) / completedRows.length);
  const completionValue = Math.round((completedRows.length / rows.length) * 100);
  const averageCoverage = Math.round(completedRows.reduce((sum, row) => {
    const [done, total] = String(row.requiredCoverage).split('/').map(Number);
    return sum + (Number.isFinite(done) && Number.isFinite(total) && total ? (done / total) * 100 : 0);
  }, 0) / completedRows.length);

  return [
    { label: 'Evidence coverage', value: averageCoverage, note: 'Average required-tool coverage from submitted decision records.' },
    { label: 'Documentation depth', value: averageScore, note: 'Average Luna decision-quality score after submission.' },
    { label: 'Case completion', value: completionValue, note: `${completedRows.length}/${rows.length} cases have Submitted Decision Records.` },
  ];
}

export default function AcademyProgress() {
  const [packagesByCase, setPackagesByCase] = useState(() => readReviewPackages());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const refresh = () => setPackagesByCase(readReviewPackages());
    const interval = window.setInterval(refresh, 1200);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const rows = useMemo(() => buildProgressRows(packagesByCase), [packagesByCase]);
  const savedPackages = useMemo(() => flattenPackages(packagesByCase), [packagesByCase]);
  const skillMeters = useMemo(() => buildSkillMeters(rows), [rows]);
  const completedCount = rows.filter((row) => typeof row.score === 'number').length;
  const averageScore = completedCount
    ? Math.round(rows.filter((row) => typeof row.score === 'number').reduce((sum, row) => sum + row.score, 0) / completedCount)
    : null;

  return (
    <aside className="academy-progress-shell" aria-label="Academy progress">
      <div className="academy-progress-card">
        <div className="academy-progress-header">
          <div>
            <p className="eyebrow">Academy Progress</p>
            <h3>Skill trail</h3>
            <p>Scores stay locked until a Submitted Decision Record is saved.</p>
          </div>
          <div className="academy-progress-moon" aria-hidden="true">🌙</div>
        </div>

        <div className="academy-stat-row">
          <ProgressStat label="Completed cases" value={`${completedCount}/${rows.length}`} />
          <ProgressStat label="Submitted decision records" value={String(savedPackages.length)} />
          <ProgressStat label="Average score" value={averageScore === null ? 'Locked' : `${averageScore}/100`} />
        </div>

        <div className="skill-meter-list">
          {skillMeters.map((item) => <SkillMeter key={item.label} item={item} />)}
        </div>

        <div className="academy-case-list">
          {rows.map((row) => <ProgressCaseRow key={row.caseId} row={row} />)}
        </div>
      </div>
    </aside>
  );
}

function ProgressStat({ label, value }) {
  return <div className="academy-stat"><small>{label}</small><strong>{value}</strong></div>;
}

function SkillMeter({ item }) {
  return (
    <article className="skill-meter-card">
      <div><strong>{item.label}</strong><small>{item.note}</small></div>
      <span>{item.value}%</span>
      <div className="skill-meter-track"><i style={{ width: `${item.value}%` }} /></div>
    </article>
  );
}

function ProgressCaseRow({ row }) {
  return (
    <article className={`academy-case-row ${row.score === null ? 'locked' : 'unlocked'}`}>
      <div>
        <span className="case-pill soft">{row.caseType}</span>
        <h4>{row.person}</h4>
        <p>{row.caseId} · {row.status}</p>
        <small>{row.nextFocus}</small>
      </div>
      <div className="case-progress-score">
        <strong>{row.score === null ? 'Locked' : row.score}</strong>
        <span>{row.scoreLabel}</span>
        <small>{row.requiredCoverage} required tools</small>
      </div>
    </article>
  );
}
