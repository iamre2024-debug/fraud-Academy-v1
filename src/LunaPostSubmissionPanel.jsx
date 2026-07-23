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

function explainDecisionMeaning(choice) {
  const normalized = String(choice || '').toLowerCase();
  if (normalized.includes('do not support')) {
    return 'Your decision means the evidence available at the time did not support the customer’s fraud claim. It does not mean fraud was confirmed.';
  }
  if (normalized.includes('support')) {
    return 'Your decision means the evidence available at the time supported the customer’s fraud claim.';
  }
  if (normalized.includes('insufficient')) {
    return 'Your decision means the evidence was not strong enough to support or reject the claim with confidence.';
  }
  if (normalized.includes('escalate')) {
    return 'Your decision means the case required additional authority, evidence, or specialist review before a final outcome.';
  }
  return `Your submitted determination was ${choice || 'not selected'}.`;
}

function getReviewStatus(debrief) {
  if (debrief?.determinationMatched === true) return 'matched';
  if (debrief?.determinationMatched === false) return 'mismatched';
  return 'ungraded';
}

function buildManagerFallback(debrief, reviewPackage) {
  const status = getReviewStatus(debrief);
  const truth = debrief?.truthReveal;

  if (status === 'ungraded') {
    return {
      managerVerdict: 'This case does not include a hidden outcome, so your determination cannot be marked right or wrong. Luna can still review the quality of your investigation and documentation.',
      decisionMeaning: explainDecisionMeaning(reviewPackage?.choice),
      actualCaseOutcome: 'No hidden downstream outcome is attached to this case. The case remains an investigation-quality exercise rather than a graded truth-match scenario.',
      managerExplanation: 'Your decision is not being corrected. Review whether your notes, pinned evidence, and rationale clearly support the determination you selected.',
      strengths: debrief?.strengths || [],
      coachingActions: debrief?.followUps || [],
    };
  }

  const matched = status === 'matched';
  return {
    managerVerdict: matched
      ? 'Your determination was correct based on the case evidence.'
      : `Your determination did not match the expected case outcome${truth?.correctDetermination ? ` of ${truth.correctDetermination}` : ''}.`,
    decisionMeaning: explainDecisionMeaning(reviewPackage?.choice),
    actualCaseOutcome: truth
      ? `${truth.classification}${truth.rationale ? ` ${truth.rationale}` : ''}`
      : 'No downstream outcome was supplied.',
    managerExplanation: matched
      ? 'You reached the right decision. The next question is whether your notes and pinned evidence clearly show how you got there.'
      : 'The result needs correction. Compare your reasoning with the hidden case outcome and identify which evidence changed the decision.',
    strengths: debrief?.strengths || [],
    coachingActions: debrief?.followUps || [],
  };
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
    const frame = document.querySelector('.mission-workspace-v3') ?? document.querySelector('.visual-os-frame');
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
    let timer = null;
    const refresh = () => setVersion((current) => current + 1);
    const saved = (event) => {
      if (event.detail?.caseId === activeCase.id && event.detail?.reviewPackage) {
        setSubmittedPackage(event.detail.reviewPackage);
      }
      refresh();
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 24);
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('fraud-academy:package-saved', saved);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', saved);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [activeCase.id]);

  const state = useMemo(() => {
    const packagesByCase = readJson(storageKeys.packages, {});
    const completedByCase = readJson(storageKeys.completed, {});
    const trayByCase = readJson(storageKeys.tray, {});
    const notesByCase = readJson(storageKeys.notes, {});
    const storedPackage = (packagesByCase[activeCase.id] ?? [])[0] ?? null;
    const reviewPackage = submittedPackage?.caseId === activeCase.id ? submittedPackage : storedPackage;
    const debrief = buildLunaDebrief({
      activeCase,
      reviewPackage,
      completedTools: completedByCase[activeCase.id] ?? [],
      tray: trayByCase[activeCase.id] ?? [],
      notes: notesByCase[activeCase.id] ?? [],
    });
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
        console.warn('Luna manager API unavailable; using guarded fallback.', error);
        setApiCoaching(null);
        setApiStatus('fallback');
      });
    return () => controller.abort();
  }, [activeCase, state.reviewPackage, state.debrief, visible]);

  const locked = !state.reviewPackage || !state.debrief;
  const reviewStatus = locked ? 'locked' : getReviewStatus(state.debrief);
  const fallbackReview = !locked ? buildManagerFallback(state.debrief, state.reviewPackage) : null;
  const managerReview = !locked
    ? {
        ...fallbackReview,
        ...(apiCoaching || {}),
        managerVerdict: fallbackReview.managerVerdict,
        decisionMeaning: fallbackReview.decisionMeaning,
        actualCaseOutcome: reviewStatus === 'ungraded' ? fallbackReview.actualCaseOutcome : (apiCoaching?.actualCaseOutcome || fallbackReview.actualCaseOutcome),
        managerExplanation: reviewStatus === 'ungraded' ? fallbackReview.managerExplanation : (apiCoaching?.managerExplanation || fallbackReview.managerExplanation),
      }
    : null;
  const verdictLabel = reviewStatus === 'matched'
    ? 'Right call'
    : reviewStatus === 'mismatched'
      ? 'Needs correction'
      : 'Not graded';
  const statusLabel = reviewStatus === 'matched'
    ? 'Correct'
    : reviewStatus === 'mismatched'
      ? 'Review'
      : reviewStatus === 'ungraded'
        ? 'Coaching only'
        : 'Locked';
  const resultLabel = reviewStatus === 'matched'
    ? 'Matched'
    : reviewStatus === 'mismatched'
      ? 'Did not match'
      : 'Not graded';

  const panel = (
    <section
      className={`ornate-card luna-visual-panel luna-theme-v1 ${locked ? 'locked' : 'unlocked'}`}
      aria-label="Luna post submission debrief"
      data-luna-screen="approved-theme-v1"
      data-case-id={activeCase.id}
      data-luna-state={locked ? 'locked' : 'unlocked'}
      data-luna-review-status={reviewStatus}
      data-luna-coaching-source={apiCoaching ? 'api' : 'deterministic'}
      data-luna-api-status={apiStatus}
      data-workspace-screen-visible={visible ? 'true' : 'false'}
      aria-hidden={visible ? undefined : 'true'}
    >
      <header className="luna-v1-header">
        <div>
          <p className="luna-v1-eyebrow">Post-decision review · Fraud manager</p>
          <h2>Luna Manager Debrief</h2>
          <p>{locked ? 'Post-submission coaching stays locked until Submit Decision saves a learner package.' : managerReview.managerVerdict}</p>
        </div>
        <div className="luna-v1-header-status">
          <span>{activeCase.id}</span>
          <strong>{statusLabel}</strong>
        </div>
      </header>

      {locked ? (
        <div className="luna-locked-state luna-v1-locked">
          <section>
            <div aria-hidden="true">⌁</div>
            <div>
              <p>Evidence First lock is active.</p>
              <h3>Submit your current decision package when you are ready.</h3>
              <span>No outcome, manager feedback, or scenario truth appears before submission.</span>
            </div>
          </section>
          <div className="luna-v1-unlock-grid" aria-label="Luna submission steps">
            <article><span>1</span><div><strong>Review the case</strong><p>Open the records you need.</p></div></article>
            <article><span>2</span><div><strong>Document evidence</strong><p>Pin proof and add useful notes.</p></div></article>
            <article><span>3</span><div><strong>Make your call</strong><p>Select the determination that fits the evidence.</p></div></article>
            <article><span>4</span><div><strong>Submit</strong><p>Luna reviews the decision after it is saved.</p></div></article>
          </div>
        </div>
      ) : (
        <>
          <section className="luna-v1-score-banner" aria-label="Luna manager verdict">
            <div>
              <span>Manager verdict</span>
              <strong>{verdictLabel}</strong>
              <p>{managerReview.managerVerdict}</p>
            </div>
            <div>
              <p>Investigation package quality</p>
              <strong>{state.debrief.score}/100</strong>
              <span>{state.debrief.scoreLabel} · Notes {state.debrief.notesQuality.label}</span>
            </div>
          </section>

          <div className="luna-debrief-grid luna-v1-debrief-grid" aria-label="Decision-quality breakdown">
            <section className="luna-v1-card luna-v1-user-reasoning">
              <header><span className="luna-v1-step-index" aria-hidden="true">01</span><div><p>Your decision</p><h3>What you submitted</h3></div></header>
              <dl>
                <div><dt>Decision</dt><dd>{state.reviewPackage.choice || 'No determination selected'}</dd></div>
                <div><dt>Confidence</dt><dd>{state.reviewPackage.confidence}</dd></div>
              </dl>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{state.reviewPackage.reason || 'No rationale was submitted.'}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-senior-review">
              <header><span className="luna-v1-step-index" aria-hidden="true">02</span><div><p>Decision meaning</p><h3>What your answer actually says</h3></div></header>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{managerReview.decisionMeaning}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-truth-review">
              <header><span className="luna-v1-step-index" aria-hidden="true">03</span><div><p>Case outcome</p><h3>{reviewStatus === 'ungraded' ? 'Outcome availability' : 'What was actually happening'}</h3></div></header>
              <dl>
                <div><dt>Expected determination</dt><dd>{state.debrief.truthReveal?.correctDetermination || 'Not available'}</dd></div>
                <div><dt>Your result</dt><dd>{resultLabel}</dd></div>
              </dl>
              <DirectCollapsibleText as="p" lines={6} mobileLines={7}>{managerReview.actualCaseOutcome}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-senior-review">
              <header><span className="luna-v1-step-index" aria-hidden="true">04</span><div><p>Manager review</p><h3>{reviewStatus === 'ungraded' ? 'How well your decision was supported' : 'Why the decision was right or wrong'}</h3></div></header>
              <DirectCollapsibleText as="p" lines={6} mobileLines={7}>{managerReview.managerExplanation}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-strengths" data-debrief-step="05">
              <header><span className="luna-v1-step-index" aria-hidden="true">05</span><div><p>Strong investigation choices</p><h3>What you handled well</h3></div></header>
              <div className="luna-v1-list">
                {managerReview.strengths.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>✓ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-followups" data-debrief-step="06">
              <header><span className="luna-v1-step-index" aria-hidden="true">06</span><div><p>Manager coaching</p><h3>What to improve next time</h3></div></header>
              <div className="luna-v1-list">
                {managerReview.coachingActions.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>⌁ {item}</DirectCollapsibleText>
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
