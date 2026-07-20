import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import { trainingCases as baseCases } from './data/cases.js';
import { enrichTrainingCases } from './data/caseEnrichment.js';
import { buildLunaDebrief } from './data/lunaDebrief.js';
import {
  buildLunaAiDebriefPayload,
  buildLunaAiSignature,
  lunaAiStorageKey,
  mergeLunaAiDebrief,
  requestLunaAiDebrief,
} from './data/lunaAiDebrief.js';

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

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Luna coaching cache is optional; the deterministic briefing remains available.
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
  const [aiDebriefState, setAiDebriefState] = useState({ signature: '', status: 'idle', debrief: null });
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
    setAiDebriefState({ signature: '', status: 'idle', debrief: null });
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
    const signature = buildLunaAiSignature(activeCase, reviewPackage, debrief);
    return { reviewPackage, debrief, signature };
  }, [activeCase, submittedPackage, version]);

  const locked = !state.reviewPackage || !state.debrief;
  const displayedDebrief = aiDebriefState.signature === state.signature && aiDebriefState.debrief
    ? mergeLunaAiDebrief(state.debrief, aiDebriefState.debrief)
    : state.debrief;
  const deterministicManagerMessage = state.debrief ? state.debrief.managerMessage : '';
  const managerMessage = displayedDebrief?.managerMessage ?? deterministicManagerMessage;
  const aiStatusLabel = displayedDebrief?.aiEnhanced
    ? 'AI coaching enhanced'
    : aiDebriefState.status === 'loading'
      ? 'Luna is drafting coaching'
      : 'Built-in coaching active';

  useEffect(() => {
    if (locked || !visible || !state.signature) return undefined;

    const cachedDebriefs = readJson(lunaAiStorageKey, {});
    if (cachedDebriefs[state.signature]) {
      setAiDebriefState({ signature: state.signature, status: 'ready', debrief: cachedDebriefs[state.signature] });
      return undefined;
    }

    const controller = new AbortController();
    const payload = buildLunaAiDebriefPayload({
      activeCase,
      reviewPackage: state.reviewPackage,
      deterministicDebrief: state.debrief,
    });

    setAiDebriefState({ signature: state.signature, status: 'loading', debrief: null });
    requestLunaAiDebrief(payload, { signal: controller.signal })
      .then((aiDebrief) => {
        const latestCache = readJson(lunaAiStorageKey, {});
        writeJson(lunaAiStorageKey, { ...latestCache, [state.signature]: aiDebrief });
        setAiDebriefState({ signature: state.signature, status: 'ready', debrief: aiDebrief });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAiDebriefState({ signature: state.signature, status: 'fallback', debrief: null });
        }
      });

    return () => controller.abort();
  }, [activeCase, locked, state.debrief, state.reviewPackage, state.signature, visible]);

  const panel = (
    <section
      className={`ornate-card luna-visual-panel luna-theme-v1 ${locked ? 'locked' : 'unlocked'}`}
      aria-label="Luna Briefing"
      data-luna-screen="approved-theme-v1"
      data-case-id={activeCase.id}
      data-luna-state={locked ? 'locked' : 'unlocked'}
      data-workspace-screen-visible={visible ? 'true' : 'false'}
      aria-hidden={visible ? undefined : 'true'}
    >
      <header className="luna-v1-header">
        <div>
          <p className="luna-v1-eyebrow">Manager coaching · After submission</p>
          <h2>Luna Briefing</h2>
          <p>{locked ? 'Luna Briefing stays locked until Submit Decision saves a Submitted Decision Record.' : 'Luna reviewed your submitted decision and is ready to help you build on this case.'}</p>
        </div>
        <div className="luna-v1-header-status">
          <span>{activeCase.id}</span>
          <strong data-luna-outcome={locked ? 'locked' : displayedDebrief.outcome}>{locked ? 'Locked' : displayedDebrief.outcomeLabel}</strong>
          {!locked && <em className="luna-v1-ai-status">{aiStatusLabel}</em>}
        </div>
      </header>

      {locked ? (
        <div className="luna-locked-state luna-v1-locked">
          <section>
            <div aria-hidden="true">⌁</div>
            <div>
              <p>Evidence First lock is active.</p>
              <h3>Submit your decision when you are ready.</h3>
              <span>Luna will not reveal the case outcome or manager feedback before submission.</span>
            </div>
          </section>

          <div className="luna-v1-unlock-grid" aria-label="Luna submission steps">
            <article><span>1</span><div><strong>Review what matters</strong><p>Open only the case records you need.</p></div></article>
            <article><span>2</span><div><strong>Add useful flags</strong><p>Flag proof can be saved when it applies.</p></div></article>
            <article><span>3</span><div><strong>Add optional rationale</strong><p>Document any reasoning you want Luna to coach.</p></div></article>
            <article><span>4</span><div><strong>Save Submitted Decision Record</strong><p>Submission unlocks your case-specific Luna Briefing.</p></div></article>
          </div>
        </div>
      ) : (
        <>
          <section className={`luna-v1-manager-banner ${displayedDebrief.outcome}`} aria-label="Luna manager feedback">
            <span className="luna-v1-outcome-badge">{displayedDebrief.outcomeLabel}</span>
            <h3>{displayedDebrief.managerHeading}</h3>
            <DirectCollapsibleText as="p" lines={5} mobileLines={7}>{managerMessage}</DirectCollapsibleText>
          </section>

          <div className="luna-debrief-grid luna-v1-debrief-grid">
            <section className="luna-v1-card luna-v1-user-reasoning">
              <header><span className="luna-v1-step-index" aria-hidden="true">01</span><div><p>Your submission</p><h3>Your decision</h3></div></header>
              <dl>
                <div><dt>Decision</dt><dd>{state.reviewPackage.choice || 'No determination selected'}</dd></div>
                <div><dt>Confidence</dt><dd>{state.reviewPackage.confidence}</dd></div>
                {displayedDebrief.truthReveal && <div><dt>Supported outcome</dt><dd>{displayedDebrief.truthReveal.correctDetermination}</dd></div>}
              </dl>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{state.reviewPackage.reason || 'No rationale was submitted.'}</DirectCollapsibleText>
            </section>

            <section className="luna-v1-card luna-v1-strengths" data-debrief-step="02">
              <header><span className="luna-v1-step-index" aria-hidden="true">02</span><div><p>Manager feedback</p><h3>What you did well</h3></div></header>
              <div className="luna-v1-list">
                {displayedDebrief.strengths.map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>✓ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-followups" data-debrief-step="03">
              <header><span className="luna-v1-step-index" aria-hidden="true">03</span><div><p>Build on this</p><h3>What to improve</h3></div></header>
              <div className="luna-v1-list">
                {displayedDebrief.improvements.slice(0, 3).map((item) => (
                  <DirectCollapsibleText key={item} as="p" lines={3} mobileLines={4}>⌁ {item}</DirectCollapsibleText>
                ))}
              </div>
            </section>

            <section className="luna-v1-card luna-v1-manager-tip" data-debrief-step="04">
              <header><span className="luna-v1-step-index" aria-hidden="true">04</span><div><p>For your next case</p><h3>Luna’s manager tip</h3></div></header>
              <DirectCollapsibleText as="p" lines={5} mobileLines={6}>{displayedDebrief.managerTip}</DirectCollapsibleText>
            </section>
          </div>

          <footer className="luna-v1-routes" aria-label="Luna Briefing next routes">
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
