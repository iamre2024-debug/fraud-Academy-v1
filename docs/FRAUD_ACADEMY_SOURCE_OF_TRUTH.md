# Fraud Academy OS v1.0 Source of Truth

This document is the locked product and repository compass for Fraud Academy OS v1.0.

## Product identity

Fraud Academy is a fictional Fraud Investigation Operating System. It is not just a simulator, quiz, generic dashboard, or case generator.

The purpose is to teach investigators how to investigate, think critically, connect evidence, document findings, and make defensible decisions using fictional training data.

## Core promise

One Case. One Workspace. One Investigation.

The Case Workspace is the heart of the app. The learner should feel like they are working a realistic bank, fintech, payroll, payment, or credit investigation from inside a polished fraud command center.

## Design authority and migration contract

The current repository display contract lives in:

```text
docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md
```

Approved screen handoffs live in:

```text
docs/FRAUD_ACADEMY_CASES_THEME_V1.md
docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md
docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md
docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md
docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md
docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md
docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md
```

Release documentation lives in:

```text
docs/FRAUD_ACADEMY_RELEASE_READINESS.md
docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md
```

For display work, use Fraud Academy Bible v2.1 as the consolidated source hierarchy and Fraud Academy Display Bible v1.0 - New Design Exploration as the authority for layout, hierarchy, navigation, responsive behavior, accessibility, and screen presentation. This Source of Truth remains authoritative for live repository architecture, safety locks, persistence boundaries, and implementation anchors.

GitHub Issue #22 and the approved theme v1 references now lock the screen-by-screen replacement order: Dashboard, Cases, Workspace, Case Briefing, Customer 360, Investigation tools, Timeline, Decision & Luna, Academy, Profile, then final responsive/mobile polish. Each screen must be redesigned in isolation, verified on desktop and mobile, and merged before the next screen begins.

The screenshot-driven visual shell remains active for surfaces that have not yet been replaced. Dashboard, Cases, the Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, and Decision & Luna are the completed approved replacements. Preserve working routes, case data, responsive behavior, and architecture while each later surface is replaced.

The runtime global navigation now uses Dashboard, Cases, Workspace, and Academy. Academy Progress remains fully supported through contextual Dashboard, Academy, and Agent-profile entry points rather than a fifth equal global destination.

The active case exposes the approved seven-stage workflow rail: Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief. The approved contextual tool-group rail remains inside Investigate, and all pre-submission status language stays neutral.

## Investigation doctrine

### Evidence First

The app must never reveal the final answer before the learner finishes the investigation.

Do not reveal any of these before case submission:

- Fraud or non-fraud outcome.
- Correct answer.
- Fraud score.
- Red flags.
- Green flags.
- AI recommendations.
- Decision hints that push the learner toward an answer.

### Summaries assist. Event logs verify.

Summaries may help orient the learner, but the learner must use event logs, records, documents, searches, histories, timelines, and link analysis to verify what happened.

### Luna coaching rule

Luna may encourage, explain tool purpose, and help the learner understand investigation flow before submission.

Luna must not coach toward the answer until after case submission. Luna debrief, scoring, missed evidence, and decision quality belong after the learner submits.

## Tool architecture

Every tool must answer one investigator question.

The standard evidence workflow for searchable objects is:

Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report

Tools should feel like investigation panels: snapshot first, then searchable records, histories, links, evidence actions, neutral report packets, Timeline, and Case Report.

## Training-safe wording

Use fictional, training-safe labels in the UI and generated evidence:

- SSN = Training ID
- Routing Number = Bank Code
- Account Number = Destination ID
- Bank Verification = Payment Verification

## Current v1.0 implementation anchors

- The screenshot-driven visual shell is the active app entrypoint for surfaces that have not yet been replaced. Keep each untouched surface intact until its focused screen redesign passes verification and browser coverage.
- `docs/FRAUD_ACADEMY_RELEASE_READINESS.md` is the Phase 5 release audit. It may approve the runtime for internal user acceptance while still listing unresolved commercial packaging gaps; do not silently upgrade that verdict.
- `docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md` is the documentation-only external handoff bundle. It must stay aligned with the live architecture and preserve the internal-UAT verdict.
- `docs/FRAUD_ACADEMY_CASES_THEME_V1.md` is the approved Cases screen handoff.
- `docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md` is the approved Workspace shell handoff.
- `docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md` is the approved Case Briefing handoff.
- `docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md` is the approved Customer 360 handoff.
- `docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md` is the approved Investigation tools handoff.
- `docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md` is the approved Timeline handoff.
- `docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md` is the completed approved Decision and Luna handoff. It records runtime PR #37, verified head `e1731cd91f7c26992605cfe311672354aa5e4643`, merge commit `92d7848e608f62d2800849f5111eb5115f505569`, and the Academy-only next step.
- `src/displayDashboardThemeV1.css` owns only the approved Dashboard replacement.
- `src/CasesThemeV1Panel.jsx` and `src/displayCasesThemeV1.css` own the approved Cases queue and presentation. They must not generate cases or write persistence data.
- `src/VisualShellHeader.jsx`, `src/displayWorkspaceShellThemeV1.css`, and `src/displayWorkspaceShellLayoutV1.css` own the approved Workspace shell.
- `src/CaseSummaryCard.jsx`, `src/displayCaseBriefingThemeV1.css`, and `src/displayCaseBriefingRoutesV1.css` own the approved Case Briefing.
- `src/Customer360Panel.jsx` and `src/displayCustomer360ThemeV1.css` own the approved Customer 360 dossier.
- `src/investigationToolGroups.js`, `src/InvestigationToolPanel.jsx`, and `src/displayInvestigationToolsThemeV1.css` own the approved contextual Investigation tools.
- `src/TimelinePanel.jsx` and `src/displayTimelineThemeV1.css` own the approved Timeline workspace.
- `src/SubmitDecisionPanel.jsx` owns the approved determination and learner-package screen. `src/LunaPostSubmissionPanel.jsx` owns the approved locked and post-submission debrief. `src/displayDecisionLunaThemeV1.css` owns their responsive presentation, and `src/displayDecisionLunaLayoutSafetyV1.css` keeps Determination and Debrief inside the mobile workspace column.
- `src/VisualApp.jsx` coordinates the active case, live built-in/generated case catalog, routes, and four-item navigation through React state.
- `src/ActiveCaseWorkflowRail.jsx` owns the seven-stage workflow and neutral stage status copy.
- `src/CategoryTileRail.jsx` owns the approved contextual investigation group rail inside Investigate.
- `src/ActiveToolPanel.jsx` remains the Case Report renderer until its later isolated redesign.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook.
- `src/DirectCollapsibleText.jsx` owns active More / Less behavior. `src/VisualTextCollapse.jsx` is an inert compatibility marker only; selector discovery and DOM mutation must not return.
- `src/useVisualWorkspaceCaseState.js` owns case-scoped tray items, notes, reviewed tools, decision drafts, learner packages, and Case Report packets.
- `src/useVisualWorkspaceActions.js` owns pinning, notes, reviewed-tool updates, neutral report packets, decision drafts, checklist handling, and learner-package submission.
- `src/AcademyProgressPanel.jsx` owns neutral saved-package progress summaries and case-return actions. It must not expose Luna scoring or answer guidance.
- The `fraud-academy:package-saved` event must refresh Dashboard and Academy Progress snapshots in the same session.
- Submit Decision remains locked until required tool review, pinned evidence, notes, learner choice, confidence, and evidence-based rationale are present.
- Luna scoring, strengths, missed evidence, coaching, and decision-quality breakdown stay hidden until a learner package is saved.
- `src/LunaPostSubmissionPanel.jsx` must resolve the active built-in or generated case from the live catalog and must never fall back to an unrelated case.

## Persistence and parked-module boundaries

- `src/data/generatedCaseRepository.js` is the generated-case persistence boundary. UI modules must use its asynchronous repository API instead of calling browser storage directly.
- IndexedDB is the primary generated-case store. Existing localStorage cases and sequence metadata migrate once into IndexedDB, while localStorage remains a safe fallback when IndexedDB is unavailable.
- The generated-case queue has no arbitrary count cap. Unique IDs must survive rapid generation, and automated verification must cover more than 50 generated cases.
- Future backend persistence must preserve the same repository-facing behavior.
- Do not carry forward the retired PR #2 `src/data/caseStorage.js` or direct `src/data/generatedCases.js` storage rewrites.
- The single Connections → System Access Lane stays available, but the parked ten-module System Access portal must not be revived.
- Insider / Vendor / API / Open Banking records belong inside Connections → System Access Lane, not a separate portal.
- Display changes must not introduce required horizontal page scrolling. Phone-width records use labeled cards instead of a horizontal table scroller.

## Verification contract

- `tests/browser-smoke.spec.mjs` verifies Dashboard, Cases, contextual Investigation tools, all three built-in cases, generated-case immediate open and reload persistence, core tools, the single System Access Lane, no page overflow, and Luna's pre-submission lock.
- `tests/workspace-shell-browser.spec.mjs` verifies the Workspace shell on desktop and Pixel 7.
- `tests/case-briefing-browser.spec.mjs` verifies Case Briefing routes, responsive safety, Evidence First, and Luna locking.
- `tests/customer-360-browser.spec.mjs` verifies the Customer 360 dossier and evidence actions.
- `tests/investigation-tools-browser.spec.mjs` verifies the six contextual groups, records, notes, report packets, routes, and responsive presentation.
- `tests/timeline-browser.spec.mjs` verifies Timeline ordering, search, source filtering, evidence actions, routes, and responsive presentation.
- `tests/decision-luna-browser.spec.mjs` verifies the approved Decision and Luna flow on desktop and Pixel 7, including the locked pre-submission state, readiness interactions, learner-package save, unlocked active-case debrief, routes, refresh persistence, and viewport safety.
- `npm run verify` must preserve the Evidence First wording check, functional smoke guard, visual three-case smoke guard, generated-case repository smoke guard, Luna single-module smoke guard, review-package behavior smoke check, remaining-module depth guard, Navigation direct-collapse guard, Academy Progress package-flow guard, Case Briefing direct-collapse guard, workspace case-state hook guard, workspace-action controller guard, display-handoff guard, Display Phase 1 global-shell guard, Display Phase 2 workflow-rail guard, Display Phase 3 hierarchy-and-glow guard, Display Phase 4 responsive-record guard, Display Phase 5 release-readiness guard, Dashboard approved-theme v1 guard, Cases approved-theme v1 guard, Workspace shell approved-theme v1 guard, Case Briefing approved-theme v1 guard, Customer 360 approved-theme v1 guard, Investigation tools approved-theme v1 guard, Timeline approved-theme v1 guard, Decision and Luna approved-theme v1 guard, release-package documentation guard, and production build.
- `.github/workflows/build.yml` must run Playwright against desktop and mobile Chromium for Dashboard, Cases, Workspace, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, all three built-in cases, generated cases, System Access Lane, Luna locking, and responsive presentation.

## Next safe item

The approved Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, and Decision & Luna redesigns are complete and protected by focused static and desktop/mobile browser guards. The next isolated safe item is **Academy only**. Preserve the four-item global navigation, contextual Academy Progress entry points, saved learner-package snapshots, same-session package refresh, active-case return actions, neutral learning copy, Evidence First, Luna's pre-submission lock, IndexedDB-first generated-case persistence, and the single Connections → System Access Lane. Do not begin Profile or final responsive/mobile redesign in the same pull request.
