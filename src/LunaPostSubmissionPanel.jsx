import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import { requestLunaApiCoaching } from './data/lunaApi.js';
import { isValidReviewPackage, normalizeReviewPackage } from './data/reviewPackage.js';
import { publicCaseTaxonomy } from './data/publicCaseView.js';
import { readStorage, storageKeys, writeStorage } from './visualWorkspaceModel.js';
import { LunaMascot, ReviewGlyph } from './DecisionReviewVisuals.jsx';

const cases = enrichTrainingCases(baseCases);

function explainDecisionMeaning(choice) {
  const normalized = String(choice || '').toLowerCase();
  if (normalized.includes('do not support')) {
    return 'The available evidence did not support the customer’s claim. That operational decision does not automatically mean fraud was confirmed.';
  }
  if (normalized.includes('support')) {
    return 'The available evidence supported the customer’s claim.';
  }
  if (normalized.includes('insufficient') || normalized.includes('more information')) {
    return 'The available evidence was not complete enough for a stronger operational outcome.';
  }
  if (normalized.includes('escalate')) {
    return 'The case required additional authority, evidence, or specialist review.';
  }
  if (normalized === 'deny') {
    return 'The application was denied for the documented factual reason. A denial does not itself establish fraud.';
  }
  if (normalized === 'approve') {
    return 'The application may proceed under the fictional product policy.';
  }
  if (normalized.includes('restrict') || normalized === 'hold') {
    return 'The exposure or activity was restricted while the documented concern is addressed. A restriction is separate from the final finding.';
  }
  if (normalized === 'release' || normalized === 'maintain') {
    return 'The activity or relationship may proceed based on the available evidence. That action remains separate from the final finding.';
  }
  return `The submitted operational decision was ${choice || 'not recorded'}.`;
}

function explainFinalFinding(finalFinding) {
  if (!finalFinding) {
    return 'This legacy package did not record a separate final finding, so Luna will not infer one from the operational decision.';
  }
  if (finalFinding === 'Fraud Confirmed') {
    return 'The final finding says the documented evidence established fraud.';
  }
  if (finalFinding === 'Fraud Not Found') {
    return 'The final finding says the investigation did not establish fraud. Other operational or credit concerns may still exist.';
  }
  if (finalFinding === 'Verification Incomplete') {
    return 'The final finding says verification remains incomplete. Missing information is not proof of fraud.';
  }
  if (finalFinding === 'Credit Risk Concern') {
    return 'The final finding records a credit or repayment concern without labeling it as fraud.';
  }
  return `The submitted final finding was ${finalFinding}.`;
}

function getReviewStatus(debrief) {
  if (debrief?.determinationMatched === true) return 'matched';
  if (debrief?.determinationMatched === false) return 'mismatched';
  return 'ungraded';
}

function buildManagerFallback(debrief, reviewPackage) {
  const status = getReviewStatus(debrief);
  const truth = debrief?.truthReveal;
  const decisionMeaning = `${explainDecisionMeaning(reviewPackage?.operationalDecision || reviewPackage?.choice)} ${explainFinalFinding(reviewPackage?.finalFinding)}`;

  if (status === 'ungraded') {
    const legacyOutcomeUnavailable = Boolean(truth && !reviewPackage?.finalFinding);
    return {
      managerVerdict: legacyOutcomeUnavailable
        ? 'This legacy package did not record a separate final finding, so the combined result is not graded.'
        : 'This case has no hidden outcome, so Luna reviewed investigation quality without marking the decision right or wrong.',
      decisionMeaning,
      actualCaseOutcome: legacyOutcomeUnavailable
        ? `${truth.finalFinding || truth.classification || 'Outcome recorded'}.${truth.findingBasis ? ` ${truth.findingBasis}` : ''}`
        : 'No hidden downstream outcome is attached to this case.',
      managerExplanation: legacyOutcomeUnavailable
        ? 'Future submissions record the operational decision and final finding separately.'
        : 'The submission is coaching-only. The notes, pinned evidence, and finding basis should still make the decision understandable.',
      strengths: debrief?.strengths || [],
      coachingActions: debrief?.followUps || [],
    };
  }

  const matched = status === 'matched';
  return {
    managerVerdict: matched
      ? 'The operational decision and final finding matched the case evidence.'
      : 'One or both submitted fields did not match the case evidence.',
    decisionMeaning,
    actualCaseOutcome: truth
      ? `${truth.finalFinding || truth.classification || 'Outcome recorded'}.${truth.findingBasis ? ` ${truth.findingBasis}` : ''}`
      : 'No downstream outcome was supplied.',
    managerExplanation: matched
      ? 'The call was right. Strong casework also makes the notes and pinned records easy for another investigator to follow.'
      : 'Compare each submitted field with the post-submission outcome and identify which record changes the action, the finding, or both.',
    strengths: debrief?.strengths || [],
    coachingActions: debrief?.followUps || [],
  };
}

function uniqueItems(items = []) {
  return [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function readAgentName() {
  if (typeof window === 'undefined') return 'Ree';
  try {
    return window.localStorage.getItem('fraud-academy-agent-display-name-v1')?.trim() || 'Ree';
  } catch {
    return 'Ree';
  }
}

function resultCopy(reviewStatus, customerType) {
  if (reviewStatus === 'matched') {
    return customerType === 'business'
      ? 'You connected the business records and landed on the right action and finding.'
      : 'You connected the evidence and landed on the right action and finding.';
  }
  if (reviewStatus === 'mismatched') {
    return 'You completed the case. One part of the submitted decision needs another look.';
  }
  return 'Case complete. I reviewed how clearly the saved package supports your decision.';
}

export default function LunaPostSubmissionPanel({
  activeCase: suppliedActiveCase,
  activeCaseId,
  onBackToWorkspace,
  visible = false,
}) {
  const [host, setHost] = useState(null);
  const [version, setVersion] = useState(0);
  const [submittedPackage, setSubmittedPackage] = useState(null);
  const [apiCoaching, setApiCoaching] = useState(null);
  const [apiStatus, setApiStatus] = useState('idle');
  const [shareStatus, setShareStatus] = useState('');
  const activeCase = suppliedActiveCase ?? cases.find((item) => item.id === activeCaseId) ?? cases[0];
  const agentName = readAgentName();

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
    setShareStatus('');
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
    window.addEventListener('fraud-academy:cloud-hydrated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fraud-academy:package-saved', saved);
      window.removeEventListener('fraud-academy:cloud-hydrated', refresh);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [activeCase.id]);

  const state = useMemo(() => {
    const packagesByCase = readStorage(storageKeys.packages, {});
    const completedByCase = readStorage(storageKeys.completed, {});
    const trayByCase = readStorage(storageKeys.tray, {});
    const notesByCase = readStorage(storageKeys.notes, {});
    const debriefsByCase = readStorage(storageKeys.debriefs, {});
    const storedPackageRecord = (packagesByCase[activeCase.id] ?? [])
      .find((reviewPackage) => isValidReviewPackage(activeCase, reviewPackage)) ?? null;
    const storedPackage = storedPackageRecord
      ? normalizeReviewPackage(storedPackageRecord, activeCase)
      : null;
    const submittedPackageIsValid = submittedPackage?.caseId === activeCase.id
      && isValidReviewPackage(activeCase, submittedPackage);
    const reviewPackage = submittedPackageIsValid
      ? normalizeReviewPackage(submittedPackage, activeCase)
      : storedPackage;
    const savedDebrief = (debriefsByCase[activeCase.id] ?? [])
      .find((debriefRecord) => debriefRecord.packageId === reviewPackage?.id) ?? null;
    const debrief = buildLunaDebrief({
      activeCase,
      reviewPackage,
      completedTools: completedByCase[activeCase.id] ?? [],
      tray: trayByCase[activeCase.id] ?? [],
      notes: notesByCase[activeCase.id] ?? [],
    });
    return { reviewPackage, debrief, savedDebrief };
  }, [activeCase, submittedPackage, version]);

  useEffect(() => {
    if (!visible || !state.reviewPackage || !state.debrief) return undefined;
    if (state.savedDebrief) {
      setApiStatus('saved');
      return undefined;
    }
    const controller = new AbortController();
    setApiStatus('loading');
    requestLunaApiCoaching({
      activeCase,
      reviewPackage: state.reviewPackage,
      deterministicDebrief: state.debrief,
      signal: controller.signal,
    })
      .then((coaching) => {
        if (!coaching) {
          setApiCoaching(null);
          setApiStatus('fallback');
          return;
        }
        setApiCoaching(coaching);
        setApiStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setApiCoaching(null);
        setApiStatus('fallback');
      });
    return () => controller.abort();
  }, [activeCase, state.reviewPackage, state.debrief, state.savedDebrief, visible]);

  const locked = !state.reviewPackage || !state.debrief;
  const reviewStatus = locked ? 'locked' : getReviewStatus(state.debrief);
  const fallbackReview = !locked ? buildManagerFallback(state.debrief, state.reviewPackage) : null;
  const savedCoaching = state.savedDebrief?.managerReview ?? null;
  const activeCoaching = apiCoaching || savedCoaching;
  const managerReview = !locked
    ? {
        ...fallbackReview,
        ...(activeCoaching || {}),
        managerVerdict: fallbackReview.managerVerdict,
        decisionMeaning: fallbackReview.decisionMeaning,
        actualCaseOutcome: reviewStatus === 'ungraded'
          ? fallbackReview.actualCaseOutcome
          : activeCoaching?.actualCaseOutcome || fallbackReview.actualCaseOutcome,
        managerExplanation: reviewStatus === 'ungraded'
          ? fallbackReview.managerExplanation
          : activeCoaching?.managerExplanation || fallbackReview.managerExplanation,
      }
    : null;
  const coachingSource = apiCoaching
    ? 'api'
    : state.savedDebrief?.source ?? 'deterministic';

  useEffect(() => {
    if (!visible || locked || !managerReview || !state.reviewPackage?.id) return;
    const debriefsByCase = readStorage(storageKeys.debriefs, {});
    const currentDebriefs = debriefsByCase[activeCase.id] ?? [];
    const recordId = `${state.reviewPackage.id}:debrief`;
    const existing = currentDebriefs.find((item) => item.id === recordId);
    const nextRecord = {
      id: recordId,
      caseId: activeCase.id,
      packageId: state.reviewPackage.id,
      completedAt: existing?.completedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewStatus,
      source: coachingSource,
      deterministicDebrief: state.debrief,
      managerReview,
    };
    const unchanged = existing
      && existing.reviewStatus === nextRecord.reviewStatus
      && existing.source === nextRecord.source
      && JSON.stringify(existing.deterministicDebrief) === JSON.stringify(nextRecord.deterministicDebrief)
      && JSON.stringify(existing.managerReview) === JSON.stringify(nextRecord.managerReview);
    if (unchanged) return;
    writeStorage(storageKeys.debriefs, {
      ...debriefsByCase,
      [activeCase.id]: [nextRecord, ...currentDebriefs.filter((item) => item.id !== recordId)],
    });
    window.dispatchEvent(new CustomEvent('fraud-academy:debrief-completed', {
      detail: { caseId: activeCase.id, packageId: state.reviewPackage.id, debriefId: recordId },
    }));
  }, [
    activeCase.id,
    coachingSource,
    locked,
    managerReview,
    reviewStatus,
    state.debrief,
    state.reviewPackage,
    visible,
  ]);

  const taxonomy = publicCaseTaxonomy(activeCase);
  const resultLabel = reviewStatus === 'matched'
    ? 'Right call'
    : reviewStatus === 'mismatched'
      ? 'Review needed'
      : reviewStatus === 'ungraded'
        ? 'Coaching complete'
        : 'Locked';
  const wellItems = locked
    ? []
    : uniqueItems([
        state.debrief.operationalDecisionMatched === true ? 'Selected the operational action supported by the case evidence.' : '',
        state.debrief.finalFindingMatched === true ? 'Recorded the final finding supported by the case evidence.' : '',
        ...(Array.isArray(managerReview.strengths) ? managerReview.strengths : []),
      ]).slice(0, 3);
  const decisionCorrections = locked ? [] : [
    state.debrief.operationalDecisionMatched === false ? {
      title: 'Operational decision',
      detail: `Submitted ${state.reviewPackage.operationalDecision}. The case evidence supported ${state.debrief.truthReveal?.operationalDecision ?? 'a different action'}.`,
      tool: 'Submit Decision',
    } : null,
    state.debrief.finalFindingMatched === false ? {
      title: 'Final finding',
      detail: `Submitted ${state.reviewPackage.finalFinding}. The case evidence supported ${state.debrief.truthReveal?.finalFinding ?? 'a different finding'}.`,
      tool: 'Submit Decision',
    } : null,
  ].filter(Boolean);
  const missedItems = locked
    ? []
    : [...decisionCorrections, ...(state.debrief.missedEvidence ?? [])].slice(0, 3);

  async function shareDebrief() {
    if (locked) return;
    const shareText = [
      `Fraud Academy ${activeCase.id}`,
      resultLabel,
      `${state.reviewPackage.operationalDecision} · ${state.reviewPackage.finalFinding}`,
      `${taxonomy.customerType} · ${taxonomy.productType}`,
    ].join(' — ');
    try {
      if (navigator.share) {
        await navigator.share({ title: `Fraud Academy ${activeCase.id}`, text: shareText });
        setShareStatus('Shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Copied');
      } else {
        setShareStatus('Share unavailable');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus('Share unavailable');
    }
  }

  const panel = (
    <section
      className={`luna-visual-panel luna-theme-v1 luna-reference-debrief ${locked ? 'locked' : 'unlocked'}`}
      aria-label="Luna post submission debrief"
      data-luna-screen="approved-theme-v1"
      data-luna-layout="reference-debrief"
      data-case-id={activeCase.id}
      data-customer-type={activeCase.customerType}
      data-luna-state={locked ? 'locked' : 'unlocked'}
      data-luna-review-status={reviewStatus}
      data-luna-coaching-source={coachingSource}
      data-luna-api-status={apiStatus}
      data-workspace-screen-visible={visible ? 'true' : 'false'}
      aria-hidden={visible ? undefined : 'true'}
    >
      <h2 className="sr-only">Luna Debrief</h2>

      <header className="luna-welcome">
        <LunaMascot className="luna-welcome-mascot" />
        <div className="luna-speech-card">
          <span className={`luna-result-chip result-${reviewStatus}`}>{resultLabel}</span>
          <strong>{locked ? 'Luna is ready when you are.' : `Great work finishing the case, ${agentName}!`}</strong>
          <p>
            {locked
              ? 'Submit an operational decision and a separate final finding to unlock case-scoped coaching.'
              : resultCopy(reviewStatus, activeCase.customerType)}
          </p>
          {!locked && <small>{activeCase.id} · {taxonomy.customerType} · {taxonomy.productType}</small>}
        </div>
      </header>

      {locked ? (
        <section className="luna-locked-card">
          <ReviewGlyph type="shield" />
          <div>
            <h3>Evidence First lock is active</h3>
            <p>No outcome, expected decision, final finding, score, or coaching appears before a valid package is submitted.</p>
          </div>
          <button type="button" onClick={onBackToWorkspace}>Back to Submit Decision</button>
        </section>
      ) : (
        <>
          <section className="luna-feedback-card luna-did-well" aria-label="What You Did Well">
            <header>
              <ReviewGlyph type="check" />
              <h3>What You Did Well</h3>
              <span className="luna-card-art medal-art"><ReviewGlyph type="medal" /></span>
            </header>
            <div className="luna-check-list">
              {wellItems.map((item) => (
                <p key={item}><span aria-hidden="true">✓</span>{item}</p>
              ))}
            </div>
          </section>

          <section className="luna-feedback-card luna-missed" aria-label="Evidence You Might Have Missed">
            <header>
              <ReviewGlyph type="alert" />
              <h3>Evidence You Might Have Missed</h3>
              <span className="luna-count-chip">{missedItems.length}</span>
            </header>
            {missedItems.length ? (
              <div className="luna-missed-list">
                {missedItems.map((item) => (
                  <article key={`${item.title}-${item.tool}`}>
                    <span aria-hidden="true">⌕</span>
                    <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                    <button type="button" onClick={onBackToWorkspace}>Review</button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="luna-all-covered">All required evidence-focus areas were clearly connected in this submitted package.</p>
            )}
          </section>

          <section className="luna-feedback-card luna-risk-tip" aria-label="Risk Tip from Luna">
            <header>
              <ReviewGlyph type="shield" />
              <h3>Risk Tip from Luna</h3>
              <span className="luna-card-art shield-art"><ReviewGlyph type="shield" /></span>
            </header>
            <p>{state.debrief.riskTip}</p>
          </section>

          <section className="luna-feedback-card luna-motivation" aria-label="Luna's Motivation">
            <header>
              <span className="luna-quote-mark" aria-hidden="true">“</span>
              <h3>Luna&apos;s Motivation</h3>
              <span className="luna-card-art heart-art"><ReviewGlyph type="heart" /></span>
            </header>
            <blockquote>{state.debrief.motivation}</blockquote>
            <p>Keep shining, Fraud Detective! ✨</p>
          </section>

          <footer className="luna-reference-actions">
            <button className="luna-back-workspace" type="button" onClick={onBackToWorkspace}>
              Back to Workspace
            </button>
            <button className="luna-share" type="button" onClick={shareDebrief} aria-label="Share Luna debrief">
              <span aria-hidden="true">↗</span>
            </button>
            {shareStatus && <span role="status">{shareStatus}</span>}
          </footer>
        </>
      )}
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
