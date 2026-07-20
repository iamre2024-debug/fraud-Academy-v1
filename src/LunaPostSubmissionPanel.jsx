import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import { requestLunaApiCoaching } from './data/lunaApi.js';

const cases = enrichTrainingCases(baseCases);
const storageKeys = {
  packages: 'fraud-academy-review-packages-v1',
  completed: 'fraud-academy-completed-tools-v1',
  tray: 'fraud-academy-visual-tray-v1',
  notes: 'fraud-academy-notes-v1',
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
  visible = false,
}) {
  const [host, setHost] = useState(null);
  const [version, setVersion] = useState(0);
  const [submittedPackage, setSubmittedPackage] = useState(null);
  const [apiCoaching, setApiCoaching] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle');
  const activeCase = suppliedActiveCase ?? cases.find((item) => item.id === activeCaseId) ?? cases[0];

  useEffect(() => {
    const frame = document.querySelector('.visual-os-frame');
    const anchor = document.querySelector('.decision-luna-portal-anchor');
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
    setSubmittedPackage(null);
    setApiCoaching(null);
    setApiStatus('idle');
  }, [activeCase.id]);

  useEffect(() => {
    let packageRefreshTimer = null;
    const refresh = () => setVersion((current) => current + 1);
    const refreshAfterPackageSaved = (event) => {
      if (event.detail?.caseId === activeCase.id && event.detail?.reviewPackage) {
        setSubmittedPackage(event.detail.reviewPackage);
      }
      refresh();
      if (packageRefreshTimer !== null) window.clearTimeout(packageRefreshTimer);
      packageRefreshTimer = window.setTimeout(refresh, 24);
    };

    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', refreshAfterPackageSaved);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', refreshAfterPackageSaved);
      if (packageRefreshTimer !== null) window.clearTimeout(packageRefreshTimer);
    };
  }, [activeCase.id]);

  const state = useMemo(() => {
    const packagesByCase = readJson(storageKeys.packages, {});
    const completedByCase = readJson(storageKeys.completed, {});
    const trayByCase = readJson(storageKeys.tray, {});
    const notesByCase = readJson(storageKeys.notes, {});
    const storedPackage = (packagesByCase[activeCase.id] ?? [])[0] ?? null;
    const reviewPackage = submittedPackage?.caseId === activeCase.id ? submittedPackage : storedPackage;
    const completedTools = completedByCase[activeCase.id] ?? [];
    const tray = trayByCase[activeCase.id] ?? [];
    const notes = notesByCase[activeCase.id] ?? [];
    const debrief = buildLunaDebrief({ activeCase, reviewPackage, completedTools, tray, notes });
    return { reviewPackage, debrief };
  }, [activeCase, submittedPackage, version]);

  useEffect(() => {
    if (!visible || !state.reviewPackage || !state.debrief) return undefined;
    const controller = new AbortController();
    setApiStatus('loading');
    requestLunaApiCoaching({
      activeCase,
      reviewPackage: state.reviewPackage,
      deterministicDebrief: state.debrief,
      signal: controller.signal,
    })
      .then((coaching) => {
        if (!coaching) return;
        setApiCoaching(coaching);
        setApiStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.warn('Luna API coaching unavailable; using deterministic coaching.', error);
        setApiCoaching(null);
        setApiStatus('fallback');
      });
    return () => controller.abort();
  }, [activeCase, state.reviewPackage, state.debrief, visible]);

  const locked = !state.reviewPackage || !state.debrief;
  const displayedDebrief = state.debrief ? {
    ...state.debrief,
    coachIntro: apiCoaching?.coachIntro || state.debrief.coachIntro,
    strengths: apiCoaching?.strengths?.length ? apiCoaching.strengths : state.debrief.strengths,
    followUps: apiCoaching?.followUps?.length ? apiCoaching.followUps : state.debrief.followUps,
  } : null;
  const stepNumbers = displayedDebrief?.truthReveal
    ? { strengths: '04', followUps: '05', breakdown: '06' }
    : { strengths: '03', followUps: '04', breakdown: '05' };
  const panel = (
    <section
      className={`ornate-card luna-visual-panel luna-theme-v1 ${locked ? 'locked' : 'unlocked'}`}
      aria-label="Luna post submission debrief"
      data-luna-screen="approved-theme-v1"
      data-case-id={activeCase.id}
      data-luna-state={locked ? 'locked' : 'unlocked'}
      data-luna-coaching-source={apiCoaching ? 'api' : 'deterministic'}
      data-luna-api-status={apiStatus}
      data-workspace-screen-visible={visible ? 'true' : 'false'}
      aria-hidden={visible ? undefined : 'true'}
    >
      <header className="luna-v1-header">
        <div>
          <p className="luna-v1-eyebrow">Debrief · Senior investigator coaching</p>
          <h2>Luna Post-Submission Debrief</h2>
          <p>{locked ? 'Post-submission coaching stays locked until Submit Decision saves a learner package.' : displayedDebrief.coachIntro}</p>
        </div>
        <div className="luna-v1-header-status">
          <span>{activeCase.id}</span>
          <strong>{locked ? 'Locked' : `${displayedDebrief.score}/100`}</strong>
        </div>
      </header>

      {locked ? (
        <div className="luna-locked-state luna-v1-locked">
          <section>
            <div aria-hidden="true">⌁</div>
            <div>
              <p>Evidence First lock is active.</p>
              <h3>Submit your current decision package when you are ready.</h3>
              <span>No score, strengths, evidence coaching, or decision-quality feedback appears before submission.</span>
            </div>
          </section>

          <div className="luna-v1-unlock-grid" aria-label="Luna submission steps">
            <article><span>1</span><div><strong>Review what matters</strong><p>Open only the case records you need.</p></div></article>
            <article><span>2</span><div><strong>Add useful flags</strong><p>Flag proof can be saved when it applies.</p></div></article>
            <article><span>3</span><div><strong>Add optional rationale</strong><p>Document any reasoning you want Luna to coach.</p></div></article>
            <article><span>4</span><div><strong>Submit decision package</strong><p>Submission alone unlocks the case-scoped debrief.</p></div></article>
          </div>
        </div>
      ) : (
        <>
          <section className="luna-v1-score-banner" aria-label="Luna debrief score">
            <div>
              <span>{displayedDebrief.theme}</span>
              <strong>{displayedDebrief.score}/100</strong>
              <p>{displayedDebrief.scoreLabel}</p>
            </div>
            <div>
              <p>Saved package</p>
              <strong>{state.reviewPackage.savedAt}</strong>
              <span>{state.reviewPackage.reviewedRequired}/{state.reviewPackage.totalRequired} suggested tools reviewed</span>
            </div>
          </section>

          <div className="luna-debrief-grid luna-v1-debrief-grid">
            <section className="luna-v1-card luna-v1-user-reasoning">
              <header><span className="luna-v1-step-index" aria-hidden="true">01</span><div><p>Learner reasoning</p><h3>Your submitted determination</h3></div></header>
              <dl>
                <div><dt>Decision</dt><dd>{state.reviewPackage.choice || 'No determination selected'}</dd></div>
                <div><dt>Confidence</dt><dd>{state.reviewPackage.confidence}</dd></div>
              </dl>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{state.reviewPackage.reason || 'No rationale was submitted.'}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-senior-review">
              <header><span className="luna-v1-step-index" aria-hidden="true">02</span><div><p>Senior review</p><h3>How Luna read the package</h3></div></header>
              <DirectCollapsibleText as="p" lines={4} mobileLines={5}>{displayedDebrief.coachIntro}</DirectCollapsibleText>
              <div className="luna-v1-package-facts">
                <span>{state.reviewPackage.pinnedEvidence.length} pinned</span>
                <span>{state.reviewPackage.noteSnapshot.length} notes - {displayedDebrief.notesQuality.label}</span>
                <span>{state.reviewPackage.indicatorSummary?.redPoints ?? 0} red weight</span>
                <span>{state.reviewPackage.indicatorSummary?.greenPoints ?? 0} green weight</span>
              </div>
            </section>

            {displayedDebrief.truthReveal && (
              <section className="luna-v1-card luna-v1-truth-review">
                <header><span className="luna-v1-step-index" aria-hidden="true">03</span><div><p>Scenario reveal</p><h3>Truth and expected determination</h3></div></header>
                <dl>
                  <div><dt>Expected determination</dt><dd>{displayedDebrief.truthReveal.correctDetermination}</dd></div>
                  <div><dt>Learner match</dt><dd>{displayedDebrief.determinationMatched ? 'Matched' : 'Did not match'}</dd></div>
                </dl>
                <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{displayedDebrief.truthReveal.classification}</DirectCollapsibleText>
              </section>
            )}

            <section className="luna-v1-card luna-v1-strengths" data-debrief-step={stepNumbers.strengths}>
              <header><span className="luna-v1-step-index" aria-hidden="true">{stepNumbers.strengths}</span><div><p>Strong investigation choices</p><h3>What your package did well</h3></div></header>
              <div className="luna-v1-list">
                {displayedDebrief.strengths.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>✓ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-followups" data-debrief-step={stepNumbers.followUps}>
              <header><span className="luna-v1-step-index" aria-hidden="true">{stepNumbers.followUps}</span><div><p>Evidence to revisit</p><h3>Next coaching focus</h3></div></header>
              <div className="luna-v1-list">
                {displayedDebrief.followUps.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>⌁ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-breakdown" data-debrief-step={stepNumbers.breakdown}>
              <header><span className="luna-v1-step-index" aria-hidden="true">{stepNumbers.breakdown}</span><div><p>Learning outcome</p><h3>Decision-quality breakdown</h3></div></header>
              <div className="luna-breakdown-card">
                {displayedDebrief.breakdown.map((item) => (
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
