# Fraud Academy Decision and Luna Theme v1 Handoff

## Status

This handoff records the isolated approved-theme v1 redesign for the **Decision and Luna only** step in the locked screen order.

- Branch: `agent/decision-luna-approved-theme-v1`
- Base audited before work: `main` at `8e834ce3bc438a1cbd973ae192fb232d9f551873`
- Runtime merge on `main`: pending final verification and merge
- Preceding completed screen group: Timeline
- Next isolated screen after this change passes, merges, and is synchronized: **Academy only**

## Authority chain

Use these sources together:

1. Fraud Academy Bible v2.1
2. Fraud Academy Display Bible v1.0 - New Design Exploration
3. Approve display theme v.1
4. GitHub Issue #22
5. Approved mobile reference
6. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`

The display sources control presentation, hierarchy, responsive behavior, and the screen-specific experience. The repository Source of Truth controls architecture, Evidence First, persistence, storage, routes, notes, reports, case behavior, and protected implementation boundaries.

## Isolated scope

This step redesigns Decision and Luna only. It does not redesign Academy, Profile, or the final responsive/mobile pass.

`src/SubmitDecisionPanel.jsx` owns the approved determination and learner-package presentation. `src/LunaPostSubmissionPanel.jsx` owns the approved locked and post-submission debrief presentation. `src/displayDecisionLunaThemeV1.css` owns their responsive light-lavender and white layout.

The established action and state boundaries remain unchanged:

- `src/useVisualWorkspaceActions.js` still checks readiness, builds the learner package, saves it, and dispatches the package-saved event;
- `src/useVisualWorkspaceCaseState.js` still owns case-scoped drafts, notes, completed tools, packages, tray objects, and report packets;
- `src/data/reviewPackage.js` still owns the valid decision calls, required tools, minimum rationale depth, blockers, and package builder;
- `src/data/lunaDebrief.js` still builds the case-scoped coaching result only after a saved learner package exists.

## Approved Decision interaction model

Decision now presents:

- one clear determination task;
- a visible Evidence First protection notice;
- case ID and neutral readiness state;
- required-tool, pinned-object, note, and report-packet metrics;
- a structured final evidence check;
- rationale word-count progress;
- lane-organized decision calls using the existing valid choices;
- confidence selection;
- evidence-based rationale entry;
- a readiness check while blockers remain;
- learner-package saving through the existing submit action;
- a submission confirmation from the saved case-scoped package.

The Decision screen never predicts the outcome or displays Luna scoring before the package is saved.

## Approved Luna interaction model

Before submission, Luna presents only:

- the Evidence First lock;
- a neutral explanation of why coaching is protected;
- the four completion steps required to unlock the debrief.

Before submission, no score, strengths, case-focus coaching, decision-quality feedback, or outcome guidance is rendered.

After submission, Luna presents distinct sections for:

- the learner's submitted decision, confidence, and rationale;
- senior-investigator package review context;
- strong investigation choices;
- evidence to revisit and next coaching focus;
- the existing decision-quality score breakdown;
- Back to Workspace;
- View Case Summary;
- Finish and Return to Queue.

The debrief uses only the saved learner package and existing `buildLunaDebrief()` result. It does not invent a hidden verdict, replace the learner's determination, or add a second scoring module.

## Protected behavior

The following remain unchanged:

- Evidence First and neutral pre-submission wording;
- Luna remains locked until Submit Decision saves a learner package;
- the existing valid decision-choice list and decision-call groups;
- the existing package readiness rules and minimum rationale depth;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first persistence boundary;
- localStorage migration and fallback behavior;
- every storage key;
- active-case switching;
- case-scoped notes, pinned evidence, reviewed tools, reports, report packets, decision drafts, and review packages;
- the package-saved browser event;
- four-item global navigation;
- the single Connections → System Access Lane;
- parked standalone System Access portals remain retired;
- fictional training-safe wording.

## Responsive contract

Decision and Luna must:

- present checklist and decision form beside one another on wide desktop;
- stack the checklist and decision form intentionally at tablet and phone widths;
- use grouped decision choices without clipping long lane-specific labels;
- keep rationale entry, readiness action, and confirmation reachable on Pixel 7;
- keep locked Luna instructions readable without revealing debrief content;
- present post-submission coaching in two columns on desktop and one column on phone;
- preserve 44-pixel minimum controls;
- avoid fixed overlays and required horizontal page scrolling;
- preserve visible keyboard focus and text labels for state;
- keep compact-phone content readable at 350 pixels.

## Verification gate

Do not merge until all of the following pass on the final branch head:

1. complete named `npm run verify` chain;
2. production build;
3. focused Decision and Luna smoke guard;
4. desktop Chromium browser coverage;
5. Pixel 7 Chromium browser coverage;
6. Evidence First wording guard;
7. built-in and generated-case state protection;
8. locked Luna state before submission;
9. decision choice, confidence, rationale, and readiness interactions;
10. learner-package saving through the existing action boundary;
11. unlocked Luna debrief after submission;
12. Back to Workspace, View Case Summary, and Return to Queue routes;
13. decision draft and package persistence after refresh;
14. viewport-width safety.

## Exact next starting point

After this change is verified, merged, and synchronized, re-audit the new `main` head, active branches, open pull requests, recent commits, CI, and the last completed handoff. Then redesign **Academy only**. Do not combine Profile or final responsive/mobile polish with that pull request.
