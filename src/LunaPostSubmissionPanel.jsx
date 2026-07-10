import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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

export default function LunaPostSubmissionPanel({ activeCase: suppliedActiveCase, activeCaseId }) {
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
    <section className={`ornate-card luna-visual-panel ${locked ? 'locked' : 'unlocked'}`} aria-label="Luna post submission debrief" data-case-id={activeCase.id}>
      <div className="card-title-row">
        <div>
          <h2>🌙 Luna Post-Submission Debrief</h2>
          <p>{locked ? 'Post-submission coaching stays locked until Submit Decision saves a learner package.' : state.debrief.coachIntro}</p>
        </div>
        <span>{locked ? '🔒' : '✨'}</span>
      </div>
      {locked ? (
        <div className="luna-locked-state">
          <strong>Evidence First lock is active.</strong>
          <p>No scoring, strengths, missed-evidence coaching, or decision-quality feedback appears before submission.</p>
        </div>
      ) : (
        <div className="luna-debrief-grid">
          <div className="luna-score-card">
            <small>{state.debrief.theme}</small>
            <strong>{state.debrief.score}/100</strong>
            <span>{state.debrief.scoreLabel}</span>
          </div>
          <div className="luna-list-card">
            <h3>Package strengths</h3>
            {state.debrief.strengths.map((item) => <p key={item}>✦ {item}</p>)}
          </div>
          <div className="luna-list-card">
            <h3>Next coaching focus</h3>
            {state.debrief.followUps.map((item) => <p key={item}>☾ {item}</p>)}
          </div>
          <div className="luna-breakdown-card">
            <h3>Decision-quality breakdown</h3>
            {state.debrief.breakdown.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <em>{item.points} pts</em>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );

  return host ? createPortal(panel, host) : null;
}
