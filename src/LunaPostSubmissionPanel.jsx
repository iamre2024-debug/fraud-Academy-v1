import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';

const cases = enrichTrainingCases(baseCases);
const storageKeys = {
  packages: 'fraud-academy-review-packages-v1',
  completed: 'fraud-academy-completed-tools-v1',
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
  packets: 'fraud-academy-case-report-packets-v1',
};

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function LunaPostSubmissionPanel({
  activeCase: suppliedActiveCase,
  activeCaseId,
  onBackToWorkspace,
  onViewCaseSummary,
  onReturnToQueue,
}) {
  const [host, setHost] = useState(null);
  const [version, setVersion] = useState(0);
  const activeCase = suppliedActiveCase ?? cases.find((item) => item.id === activeCaseId) ?? cases[0];

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.submit-decision-panel');
    if (!frame || !anchor) return undefined;

    let lunaHost = frame.querySelector('.luna-post-submission-host');
    const created = !lunaHost;
    if (!lunaHost) {
      lunaHost = document.createElement('div');
      lunaHost.className = 'luna-post-submission-host';
      anchor.insertAdjacentElement('afterend', lunaHost);
    }

    setHost(lunaHost);
    return () => {
      if (created) lunaHost.remove();
    };
  }, []);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refresh);
    };
  }, []);

  const state = useMemo(() => {
    const packagesByCase = readJson(storageKeys.packages, {});
    const completedByCase = readJson(storageKeys.completed, {});
    const trayByCase = readJson(storageKeys.tray, {});
    const notesByCase = readJson(storageKeys.notes, {});
    const packetsByCase = readJson(storageKeys.packets, {});
    const reviewPackage = (packagesByCase[activeCase.id] ?? [])[0] ?? null;
    const completedTools = completedByCase[activeCase.id] ?? [];
    const tray = trayByCase[activeCase.id] ?? [];
    const notes = notesByCase[activeCase.id] ?? [];
    const reportPackets = packetsByCase[activeCase.id] ?? [];
    const debrief = buildLunaDebrief({ activeCase, reviewPackage, completedTools, tray, notes, reportPackets });
    return { reviewPackage, debrief };
  }, [activeCase, version]);

  const locked = !state.reviewPackage || !state.debrief;
  const panel = (
    <section
      className={`ornate-card luna-visual-panel luna-theme-v1 ${locked ? 'locked' : 'unlocked'}`}
      aria-label="Luna post submission debrief"
      data-luna-screen="approved-theme-v1"
      data-case-id={activeCase.id}
      data-luna-state={locked ? 'locked' : 'unlocked'}
    >
      <header className="luna-v1-header">
        <div>
          <p className="luna-v1-eyebrow">Debrief · Senior investigator coaching</p>
          <h2>Luna Case Debrief</h2>
          <p>{locked ? 'Post-submission coaching stays protected until Submit Decision saves a learner package.' : state.debrief.coachIntro}</p>
        </div>
        <div className="luna-v1-header-status">
          <span>{activeCase.id}</span>
          <strong>{locked ? 'Locked' : `${state.debrief.score}/100`}</strong>
        </div>
      </header>

      {locked ? (
        <div className="luna-locked-state luna-v1-locked">
          <section>
            <div aria-hidden="true">⌁</div>
            <div>
              <p>Evidence First lock is active</p>
              <h3>Finish and save your own reasoning before Luna reviews the case.</h3>
              <span>No score, strengths, evidence coaching, or decision-quality feedback appears before submission.</span>
            </div>
          </section>

          <div className="luna-v1-unlock-grid" aria-label="Luna unlock requirements">
            <article><span>1</span><div><strong>Review required tools</strong><p>Complete the protected investigation checklist.</p></div></article>
            <article><span>2</span><div><strong>Build evidence support</strong><p>Pin records and preserve investigation notes.</p></div></article>
            <article><span>3</span><div><strong>Write your rationale</strong><p>Choose a decision route and explain the evidence.</p></div></article>
            <article><span>4</span><div><strong>Save learner package</strong><p>Submission unlocks the case-scoped debrief.</p></div></article>
          </div>
        </div>
      ) : (
        <>
          <section className="luna-v1-score-banner" aria-label="Luna debrief score">
            <div>
              <span>{state.debrief.theme}</span>
              <strong>{state.debrief.score}/100</strong>
              <p>{state.debrief.scoreLabel}</p>
            </div>
            <div>
              <p>Saved package</p>
              <strong>{state.reviewPackage.savedAt}</strong>
              <span>{state.reviewPackage.reviewedRequired}/{state.reviewPackage.totalRequired} required tools reviewed</span>
            </div>
          </section>

          <div className="luna-debrief-grid luna-v1-debrief-grid">
            <section className="luna-v1-card luna-v1-user-reasoning">
              <header><span aria-hidden="true">01</span><div><p>Learner reasoning</p><h3>Your submitted determination</h3></div></header>
              <dl>
                <div><dt>Decision</dt><dd>{state.reviewPackage.choice}</dd></div>
                <div><dt>Confidence</dt><dd>{state.reviewPackage.confidence}</dd></div>
              </dl>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{state.reviewPackage.reason}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-senior-review">
              <header><span aria-hidden="true">02</span><div><p>Senior review</p><h3>How Luna read the package</h3></div></header>
              <DirectCollapsibleText as="p" lines={4} mobileLines={5}>{state.debrief.coachIntro}</DirectCollapsibleText>
              <div className="luna-v1-package-facts">
                <span>{state.reviewPackage.pinnedEvidence.length} pinned</span>
                <span>{state.reviewPackage.noteSnapshot.length} notes</span>
                <span>{state.reviewPackage.reportPacketCount} packets</span>
              </div>
            </section>

            <section className="luna-v1-card luna-v1-strengths">
              <header><span aria-hidden="true">03</span><div><p>Strong investigation choices</p><h3>What your package did well</h3></div></header>
              <div className="luna-v1-list">
                {state.debrief.strengths.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>✓ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-followups">
              <header><span aria-hidden="true">04</span><div><p>Evidence to revisit</p><h3>Next coaching focus</h3></div></header>
              <div className="luna-v1-list">
                {state.debrief.followUps.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>⌁ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-breakdown">
              <header><span aria-hidden="true">05</span><div><p>Learning outcome</p><h3>Decision-quality breakdown</h3></div></header>
              <div className="luna-breakdown-card">
                {state.debrief.breakdown.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <em>{item.points} pts</em>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="luna-v1-routes" aria-label="Debrief next routes">
            <button type="button" onClick={onBackToWorkspace}>Back to Workspace</button>
            <button type="button" onClick={onViewCaseSummary}>View Case Summary</button>
            <button className="primary-action" type="button" onClick={onReturnToQueue}>Finish and Return to Queue</button>
          </footer>
        </>
      )}
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
