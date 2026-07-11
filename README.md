# Fraud Academy OS v1.0

Fraud Academy OS is a fictional fraud investigation training operating system. It teaches investigators how to think through cases, connect evidence, document findings, and make defensible decisions using training-safe fictional data.

## Source of truth

The locked product and repository compass lives in:

```text
docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md
```

The focused display migration contract lives in:

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

Use these files before making architecture, UI, navigation, responsive, tool, scenario, Evidence First, persistence, or release-readiness changes. The Display Handoff records the Bible v2.1 and Display Bible authority chain. The Source of Truth protects live architecture and safety boundaries. The approved handoffs record completed screen scope and verification. The Release Readiness audit records the internal-UAT verdict, and the Release Package records architecture, persistence, fictional-data safety, accessibility/browser status, deployment status, limitations, and backlog.

## Locked direction

- One Case. One Workspace. One Investigation.
- Every tool answers one investigator question.
- Evidence First: no fraud/non-fraud answer, fraud score, red flags, green flags, AI recommendation, or decision hint before the investigation is complete.
- Summaries assist. Event logs verify.
- Search finds evidence. Link Analysis connects evidence.
- Luna may encourage before submission, but Luna debrief and scoring happen only after a learner package is saved.
- Mobile remains touch-friendly and free of required horizontal page scrolling.
- Screen redesign happens one surface at a time without replacing working behavior or persistence architecture.

## Current status

- Dashboard uses `src/displayDashboardThemeV1.css`.
- Cases uses `src/CasesThemeV1Panel.jsx` and `src/displayCasesThemeV1.css`.
- Workspace shell uses `src/VisualShellHeader.jsx`, `src/displayWorkspaceShellThemeV1.css`, and `src/displayWorkspaceShellLayoutV1.css`.
- Case Briefing uses `src/CaseSummaryCard.jsx`, `src/displayCaseBriefingThemeV1.css`, and `src/displayCaseBriefingRoutesV1.css`.
- Customer 360 uses `src/Customer360Panel.jsx` and `src/displayCustomer360ThemeV1.css`.
- Investigation tools use `src/investigationToolGroups.js`, `src/InvestigationToolPanel.jsx`, and `src/displayInvestigationToolsThemeV1.css`.
- Timeline uses `src/TimelinePanel.jsx` and `src/displayTimelineThemeV1.css`.
- Decision and Luna use `src/SubmitDecisionPanel.jsx`, `src/LunaPostSubmissionPanel.jsx`, `src/displayDecisionLunaThemeV1.css`, and `src/displayDecisionLunaLayoutSafetyV1.css`.
- `src/VisualNavigation.jsx` renders exactly four global destinations: Dashboard, Cases, Workspace, and Academy.
- Academy Progress remains available through contextual Dashboard, Academy, and Agent-profile routes rather than a fifth global item.
- `src/ActiveCaseWorkflowRail.jsx` renders Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief.
- `src/data/generatedCaseRepository.js` remains the generated-case storage boundary. IndexedDB is primary and localStorage is migration/fallback only.
- Generated cases open immediately, remain uncapped, survive reload, and keep case-scoped notes, tray items, progress, drafts, packages, and reports.
- The single Connections → System Access Lane remains active. Parked standalone System Access modules remain retired.

## Protected Decision and Luna behavior

- Submit Decision preserves the existing checklist, learner choice, confidence, rationale, readiness rules, case-scoped drafts, and learner-package save action.
- Before submission, Luna shows only neutral process guidance and the Evidence First lock.
- Score, strengths, missed evidence, coaching focus, and decision-quality breakdown remain hidden until the active case has a saved learner package.
- Post-submission Luna resolves the active built-in or generated case and provides Back to Workspace, View Case Summary, and Finish and Return to Queue routes.

## Bible audit notes

1. Evidence First wording remains locked.
2. Case Briefing uses allegation or system-alert context only.
3. Customer 360 and Investigation tools preserve evidence actions and active-case switching.
4. Timeline preserves case-scoped ordering and source verification.
5. Generated cases use the IndexedDB-first repository and remain unlimited.
6. The single Connections → System Access Lane remains available without reviving the parked portal.
7. The approved Dashboard theme v1 replaces only Dashboard.
8. The approved Cases theme v1 replaces only Case Queue.
9. The approved Workspace shell theme v1 replaces only the application shell.
10. The approved Case Briefing theme v1 replaces only the briefing surface.
11. The approved Customer 360 theme v1 replaces only the identity dossier.
12. The approved Investigation tools theme v1 replaces only the deep-tool workspace.
13. The approved Timeline theme v1 replaces only the event-sequence workspace.
14. The approved Decision and Luna theme v1 replaces only Determination and Debrief, preserves package-gated coaching, and has focused static plus desktop/mobile browser guards.

## Remaining follow-up work

1. Redesign Academy only using approved theme v1 while preserving contextual Academy Progress, saved learner-package snapshots, neutral learning copy, active-case return actions, and same-session package refresh.
2. Continue the locked order after Academy: Profile, then final responsive/mobile polish.
3. Compare completed screens with Bible v2.1 and the Display Bible references before advancing.
4. Add a curated current desktop/mobile screenshot set.
5. Complete manual accessibility and non-Chromium browser validation.
6. Select a repository license before external commercial handoff.

## Browser-confirmed functional coverage

1. Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, and Timeline render on desktop and Pixel 7 without required page overflow.
2. The approved Decision and Luna flow renders on desktop and Pixel 7 with the locked pre-submission state, readiness interactions, learner-package save, unlocked active-case debrief, routes, refresh persistence, and viewport safety.
3. All three built-in cases load from Cases and update the active workspace.
4. Generated cases save through the repository, open immediately, remain unique, persist after reload, and return to Cases.
5. Luna remains locked before submission and follows the active built-in or generated case ID.
6. More than 50 generated cases and localStorage-to-IndexedDB migration remain covered by repository smoke checks.

## Latest handoff

The approved Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, and Decision & Luna theme v1 replacements are merged and protected by focused static guards plus desktop and Pixel 7 browser coverage. The implementations keep the four-item navigation, active case, contextual Academy Progress, neutral visible wording, Evidence First, Luna locking, IndexedDB-first generated cases, and the single Connections → System Access Lane unchanged. The next isolated screen is **Academy only**.

Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report

## Local development

```bash
npm install
npm run verify
npm run browser-smoke-check
npm run dev
```

## Build

```bash
npm run build
```

## Test status

`npm run verify` includes Evidence First, functional smoke, visual three-case smoke, generated-case repository smoke, Luna single-module smoke, review-package smoke, remaining-module depth, navigation direct-collapse, Academy Progress package-flow, summary direct-collapse, workspace case-state hook, workspace action-controller, display-handoff, Display Phases 1 through 5, Dashboard approved-theme v1, Cases approved-theme v1, Workspace shell approved-theme v1, Case Briefing approved-theme v1, Customer 360 approved-theme v1, Investigation tools approved-theme v1, Timeline approved-theme v1, Decision and Luna approved-theme v1, release-package documentation, and production build checks. GitHub Actions also runs Playwright against desktop Chromium and a Pixel 7 mobile profile for Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, built-in and generated cases, System Access Lane, Luna lock behavior, and responsive presentation.
