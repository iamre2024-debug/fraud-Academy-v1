# Fraud Academy Decision and Luna Theme v1 Handoff

## Status

This handoff records the current isolated reference-board implementation for **Submit Decision and Luna Debrief only**.

- Current implementation branch: `agent/submit-decision-luna-reference`
- Historical approved-theme pull request: #37
- Base audited before work: `main` at `8e834ce3bc438a1cbd973ae192fb232d9f551873`
- Verified runtime head: `e1731cd91f7c26992605cfe311672354aa5e4643`
- Runtime merge on `main`: `92d7848e608f62d2800849f5111eb5115f505569`
- Verification: GitHub Actions run #382 passed the complete named smoke chain, production build, desktop Chromium, and Pixel 7 Chromium
- Preceding completed screen group: Timeline
- Next isolated screen: **Academy only**

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

This step rebuilds Submit Decision and Luna Debrief only. It does not redesign the evidence tools, Academy, Profile, or persistence architecture.

`src/SubmitDecisionPanel.jsx` owns the final-review hierarchy and learner-package interactions. `src/LunaPostSubmissionPanel.jsx` owns the protected lock and post-submission debrief. `src/DecisionReviewVisuals.jsx` owns the coded Luna, lighthouse, and review-glyph SVG artwork. `src/displayDecisionLunaThemeV1.css` owns the scoped midnight-blue, cyan, and pink reference presentation, while `src/displayDecisionLunaLayoutSafetyV1.css` provides only narrow containment guardrails.

The established action and state boundaries remain unchanged:

- `src/useVisualWorkspaceActions.js` still checks readiness, builds the learner package, saves it, and dispatches the package-saved event;
- `src/useVisualWorkspaceCaseState.js` still owns case-scoped drafts, notes, completed tools, packages, tray objects, and report packets;
- `src/data/reviewPackage.js` still owns valid decision calls, optional tool-coverage tracking, minimum rationale depth, decision-field blockers, and the package builder;
- `src/data/decisionChecklist.js` owns claim and subtype/scenario-specific flag applicability so unrelated checks never appear;
- `src/data/lunaDebrief.js` still builds the case-scoped coaching result only after a saved learner package exists.

## Approved Decision interaction model

Decision now presents:

- a focused Final Review header on phone layouts;
- an active-case card with personal/business taxonomy and coded lighthouse medallion;
- a selected-decision card showing the operational action and separate final finding;
- a compact editor using the existing workflow-valid action and finding choices;
- confidence and evidence-based finding-basis inputs;
- exact package blockers without selecting an answer for the learner;
- a three-object pinned-evidence strip with a working route to all evidence;
- the latest substantive case note with a working Notes route;
- a real Confirm & Submit action that uses the established package controller;
- an Open Luna Debrief action after the package is saved.

The detailed weighted flag checklist remains in the domain model and existing evidence workflow for compatibility and coaching. It is not rendered as a long form inside this reference screen.

The Decision screen never predicts the outcome or displays Luna scoring before the package is saved.

## Approved Luna interaction model

Before submission, Luna presents only the Evidence First lock and a neutral explanation of why coaching is protected.

Before submission, no score, strengths, case-focus coaching, decision-quality feedback, or outcome guidance is rendered.

After submission, Luna presents the reference-board hierarchy:

- coded Luna mascot and case-result speech card;
- What You Did Well;
- Evidence You Might Have Missed, with working Review actions;
- a workflow-specific Risk Tip from Luna;
- customer-type-aware motivation;
- Back to Workspace;
- native share with clipboard fallback.

The debrief uses only the saved learner package and existing `buildLunaDebrief()` result. It compares the operational decision and final finding independently, does not invent a pre-submission verdict, and does not render the former six-card score report.

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

Decision and Luna:

- use centered, bounded review surfaces on desktop;
- become edge-to-edge component stacks within the mobile mission shell;
- keep the evidence strip in three compact columns like the supplied board;
- preserve long workflow choice labels without clipping;
- keep rationale entry and confirmation reachable on phone;
- show two coaching columns where space allows and one column on phone;
- preserve 44-pixel minimum controls, safe areas, visible focus, and reduced motion;
- avoid fixed review overlays and required horizontal page scrolling.

## Verification contract

The reference rebuild is guarded by:

1. the complete named `npm run verify` chain and production build;
2. a focused static/behavior smoke guard that creates both personal and business cases;
3. review-package separation and confirmed-fraud rationale rules;
4. generated-case pre-submission truth protection;
5. locked Luna state before submission;
6. action, finding, confidence, rationale, evidence, and notes interactions;
7. learner-package saving through the existing action boundary;
8. immediate and persisted Luna unlock;
9. case-scoped strengths, missed evidence, risk guidance, and motivation;
10. working Review, Back to Workspace, and Share/clipboard actions;
11. desktop Chromium and Pixel 7 Chromium scenarios in GitHub Actions;
12. horizontal-overflow and responsive-card checks.

## Maintenance starting point

Start with `src/SubmitDecisionPanel.jsx`, `src/LunaPostSubmissionPanel.jsx`, and `src/DecisionReviewVisuals.jsx`. Preserve the existing review-package controller, Evidence First lock, personal/business taxonomy, and case-scoped persistence. Do not restore the retired long checklist or six-card manager report inside these focused screens.
