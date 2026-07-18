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

The approved Cases screen handoff lives in:

```text
docs/FRAUD_ACADEMY_CASES_THEME_V1.md
```

The approved Workspace shell handoff lives in:

```text
docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md
```

The approved Case Briefing handoff lives in:

```text
docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md
```

The approved Customer 360 handoff lives in:

```text
docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md
```

The approved Investigation tools handoff lives in:

```text
docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md
```

The approved Timeline handoff lives in:

```text
docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md
```

The approved Decision and Luna handoff lives in:

```text
docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md
```

The approved Academy handoff lives in:

```text
docs/FRAUD_ACADEMY_ACADEMY_THEME_V1.md
```

The approved Profile handoff lives in:

```text
docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md
```

The completed Phase 5 release-readiness audit lives in:

```text
docs/FRAUD_ACADEMY_RELEASE_READINESS.md
```

The documentation-only external handoff bundle lives in:

```text
docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md
```

Use these files before making architecture, UI, navigation, responsive, tool, scenario, Evidence First, persistence, or release-readiness changes. The Display Handoff records the approved Bible v2.1 and Display Bible authority chain, the Source of Truth protects the live code architecture and safety boundaries, the Cases handoff records the completed queue scope, the Workspace shell handoff records the completed shell scope, the Case Briefing handoff records the completed allegation/system-alert card-grid scope, the Customer 360 handoff records the completed identity dossier, the Investigation tools handoff records the completed contextual record-review workspace, the Timeline handoff records the completed event-sequence workspace, the Decision and Luna handoff records the completed determination, protected pre-submission lock, and post-submission coaching, the Academy handoff records the completed learning center, the Profile handoff records the completed contextual profile and final-polish-only next step, the Release Readiness audit records the runtime verdict, and the Release Package collects architecture, data model, fictional-data safety, accessibility/browser status, deployment status, limitations, and backlog in one handoff document.

## Locked direction

- One Case. One Workspace. One Investigation.
- Every tool answers one investigator question.
- Evidence First: no fraud/non-fraud answer, fraud score, red flags, green flags, AI recommendation, or decision hint before the investigation is complete.
- Summaries assist. Event logs verify.
- Search finds evidence. Link Analysis connects evidence.
- Luna can encourage before submission, but Luna debrief and scoring only happen after submission.
- Mobile remains touch-friendly, functional, and free of required horizontal page scrolling.
- Desktop remains a polished fraud command center.
- Screen redesign happens one surface at a time without replacing working behavior or persistence architecture.

## Current status

- The screenshot-driven visual workspace remains active for surfaces that have not yet been replaced.
- The Dashboard approved theme v1 replacement uses `src/displayDashboardThemeV1.css` for a light lavender and white, mobile-first presentation while keeping the active case, Case Queue, Evidence Workspace, Timeline, Reports & Progress, neutral Luna guidance, and four-item navigation available.
- The Cases approved theme v1 replacement uses `src/CasesThemeV1Panel.jsx` and `src/displayCasesThemeV1.css` for neutral queue totals, search, priority filtering, sorting, Detail and Compact views, status/origin filters, selected-case preview, and direct opening of built-in or generated cases.
- The Workspace shell approved theme v1 replacement uses the compact Workspace-only header in `src/VisualShellHeader.jsx`, `src/displayWorkspaceShellThemeV1.css`, and `src/displayWorkspaceShellLayoutV1.css` for the light shell background, active-case strip, generated-case controls, seven-stage workflow rail, responsive layout safety, and active Workspace navigation.
- The Case Briefing approved theme v1 replacement uses `src/CaseSummaryCard.jsx`, `src/displayCaseBriefingThemeV1.css`, and `src/displayCaseBriefingRoutesV1.css` for the neutral case overview, allegation/system-alert briefing, metrics, investigator prompts, process-only Luna guidance, recent documents, utilities, preserved quick routes, and responsive card-grid presentation.
- The Customer 360 approved theme v1 replacement uses `src/Customer360Panel.jsx` and `src/displayCustomer360ThemeV1.css` for the complete customer/account dossier, profile-change history, claim-specific neutral context, related records, preserved evidence actions and routes, and responsive light lavender and white card presentation.
- The Investigation tools approved theme v1 replacement uses `src/investigationToolGroups.js`, `src/InvestigationToolPanel.jsx`, and `src/displayInvestigationToolsThemeV1.css` for six contextual tool groups, one neutral working question per tool, searchable records, expanded detail, History, Link Analysis, neutral report packets, notes, pinning, reviewed state, workflow routes, and responsive desktop/Pixel 7 presentation.
- The Timeline approved theme v1 replacement uses `src/TimelinePanel.jsx` and `src/displayTimelineThemeV1.css` for neutral event metrics, search, source filtering, sequence cards, expanded source review, pinning, timeline notes, neutral report packets, reviewed state, workflow routes, and responsive desktop/Pixel 7 presentation.
- The Decision and Luna approved theme v1 replacement uses `src/SubmitDecisionPanel.jsx`, `src/LunaPostSubmissionPanel.jsx`, `src/displayDecisionLunaThemeV1.css`, and `src/displayDecisionLunaLayoutSafetyV1.css` for the Evidence First determination workspace, package readiness, lane-organized learner choices, responsive package saving, the protected pre-submission Luna lock, and the case-scoped post-submission debrief.
- The Academy approved theme v1 replacement uses `src/AcademyThemeV1Panel.jsx`, `src/displayAcademyThemeV1.css`, and `src/displayAcademyThemeV1Safety.css` for four Evidence First learning paths, Fraud Library topics, neutral achievement guidance, contextual Academy Progress, functional Cases and Workspace routes, and responsive isolation from unreplaced Workspace surfaces.
- The Profile approved theme v1 replacement uses `src/ProfileThemeV1Panel.jsx`, `src/displayProfileThemeV1.css`, and `src/displayProfileThemeV1Safety.css` for the contextual avatar-owned profile, activity-based rank, neutral saved-work metrics, skill proficiency, badges, active-case goals, Workspace, Academy, and Academy Progress routes, and responsive isolation.
- `docs/FRAUD_ACADEMY_CASES_THEME_V1.md` records the isolated Cases scope and completed verification.
- `docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md` records the isolated Workspace shell scope, protected behavior, and desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md` records the isolated Case Briefing scope, protected route behavior, and desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md` records the isolated Customer 360 scope, protected dossier actions and routes, and desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md` records the isolated Investigation tools scope, protected record actions and routes, and desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md` records the isolated Timeline scope, protected event actions and routes, and desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md` records the isolated Decision and Luna scope, protected package and debrief behavior, and completed desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_ACADEMY_THEME_V1.md` records the isolated Academy scope, protected learning and Progress routes, completed desktop/mobile verification gate.
- `docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md` records the isolated completed Profile scope, avatar entry, protected neutral metrics and routes, completed desktop/mobile verification gate, and final responsive/mobile polish-only next step.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, active navigation tab, and the Decision/Luna return routes through React state, and mounts the Cases replacement against the same catalog and existing `onOpenCase` route.
- `src/VisualWorkspace.jsx` coordinates the core investigation workspace while `src/useVisualWorkspaceCaseState.js` owns case-scoped persistence and `src/useVisualWorkspaceActions.js` owns investigation actions and learner-package submission.
- `src/VisualShellHeader.jsx` owns the compact approved Workspace header, active case strip, Case Queue dropdown, and functional Help, Settings, and Agent-profile controls while unreplaced surfaces retain their existing presentation.
- The Help control routes to Academy and Cases, Settings persists a reduced-motion preference, and Agent profile exposes the current assignment plus Progress and Workspace routes.
- `src/VisualNavigation.jsx` renders exactly four global destinations: Dashboard, Cases, Workspace, and Academy.
- Academy Progress remains active through contextual Dashboard, Academy, and Agent-profile actions rather than a fifth equal navigation item.
- `src/ActiveCaseWorkflowRail.jsx` renders Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief with neutral status text and accessible current-step state.
- `src/CategoryTileRail.jsx` renders the six approved contextual tool groups inside Investigate; Timeline and Case Report remain on the workflow rail.
- Timeline opens the approved dedicated Timeline workspace and Summary keeps the existing Case Report tool; Indicators opens the neutral Document Viewer; Determination opens the approved package-gated Decision workspace; Debrief remains locked until a learner package exists and then opens the approved case-scoped Luna review.
- `src/displayPhaseOne.css` owns the four-column global navigation override, header-control presentation, contextual Progress shortcut, and reduced-motion behavior.
- `src/displayPhaseTwo.css` owns the focused workflow-rail presentation and compact wrapping without performing later hierarchy or mobile-record phases.
- Display Phase 3 calibrates hierarchy and glow through `src/displayPhaseThree.css`, reducing repeated decorative bloom while formalizing primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states.
- `src/displayPhaseFour.css` preserves desktop record tables and converts dense rows into labeled, touch-friendly cards at phone widths without horizontal scrolling.
- Display Phase 5 records the exact runtime and release-package verdict in `docs/FRAUD_ACADEMY_RELEASE_READINESS.md`, adds generated-case reload persistence coverage, and introduces no runtime redesign.
- `docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md` centralizes the runtime architecture, data and persistence boundaries, fictional-data statement, accessibility/browser status, deployment status, limitations, and post-v1 backlog without changing runtime behavior.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper; Active Tool purpose, expanded-record text, tray identifiers, Case Report packet text, notebook note entries, Submit Decision checklist messages, Luna coaching lists, Navigation heading and Academy learning copy, Academy Progress package status, and Case Briefing transaction/payee and short-summary copy use it directly.
- `src/visualWorkspaceModel.js` owns workspace constants, storage helpers, live tool row builders, System Access Lane row construction, and Case Report packet construction.
- `src/ActiveToolPanel.jsx` remains the existing Case Report renderer until its later isolated redesign step.
- `src/TimelinePanel.jsx` owns the approved Timeline workspace and preserves case-scoped event ordering, source verification, pinning, notes, neutral report packets, reviewed state, and workflow routes on the existing workspace action boundaries.
- `src/Customer360Panel.jsx` owns the approved Customer 360 dossier and keeps search, related-tool routing, pinning, notes, neutral report packets, reviewed state, active-case switching, and Submit Decision routing on the existing workspace action boundaries.
- `src/InvestigationToolPanel.jsx` owns the approved deep-tool record workspace and keeps search, expansion, pinning, notes, neutral report packets, reviewed state, Timeline/Case Report routes, case switching, and Submit Decision routing on the existing action boundaries.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, notes, packet feed, and Open Document Viewer routing.
- `src/CaseSummaryCard.jsx` owns the approved Case Briefing card grid, direct compact controls, Pin Case, Workspace/Timeline/Notes/Reports/More Tools utilities, Identity Intelligence and Login History quick routes, and the Submit Decision jump.
- `src/SubmitDecisionPanel.jsx` owns the approved Evidence First determination and learner-package workspace while the review package model keeps readiness and submission rules enforced.
- `src/LunaPostSubmissionPanel.jsx` owns the approved protected lock and post-submission debrief, follows the active built-in or generated case, and reads the saved learner package through the existing state boundaries.
- `src/AcademyProgressPanel.jsx` owns neutral locked/unlocked case status, saved-package counts, reviewed-tool/pinned-object/note/report-packet snapshots, and case-return actions without exposing Luna scoring.
- `src/VisualTextCollapse.jsx` is an inert compatibility marker only. It contains no selector discovery, portal controls, event listeners, or DOM scanning; compact More / Less behavior is React-owned through `DirectCollapsibleText`.
- Insider / Vendor / API / Open Banking remains the single Connections → System Access Lane sub-tool inside the workspace, powered by `src/data/systemAccessRecords.js`.
- `src/data/generatedCaseRepository.js` is the generated-case storage boundary. IndexedDB is primary, localStorage remains a fallback, and existing localStorage-generated cases migrate once into IndexedDB.
- Generated cases are added to the live React case catalog, opened without page refresh, preserved after reload, and kept behind a backend-ready repository contract.
- The generated queue has no arbitrary application count cap. A monotonic sequence prevents rapid-generation ID collisions, and `scripts/generated-case-smoke-check.mjs` verifies more than 50 cases remain unique and available.
- The old `src/visualInvestigationRepair.js` DOM route patch is retired and not loaded by the app entrypoint.
- Case Briefing metadata, Device ID rows, Tool Map, Open Document Viewer, and Submit Decision routing are rendered through React instead of repair scripts.
- Submit Decision uses the locked review package model and remains Evidence First.
- Category tiles and workflow stages use neutral progress and availability language only.
- Broad DOM repair scripts remain out of the app entrypoint to avoid browser unresponsive loops.

## Bible audit notes

The latest source-of-truth audit confirmed these requirements are active or restored:

1. Evidence First wording remains the rule: no final outcome, fraud score, red flags, green flags, AI recommendations, or answer hints before submission.
2. Case Briefing explains why the case exists using allegation or system alert plus neutral intake metadata.
3. Customer 360 and Identity Intelligence include profile, relationship, contact, account age, and identity object records.
4. Digital Activity includes Login History, Session History, Device Intelligence, and stable fictional Device IDs.
5. Financial, Business, Evidence, Connections, Timeline, Case Report, Investigation Tray, Notebook, and Submit Decision remain present in the shell.
6. Submit Decision remains locked until required tool review, pinned evidence, notes, learner choice, and rationale are complete.
7. Expanded decision calls are validated by `scripts/review-package-smoke-check.mjs`.
8. Three-case visual coverage is validated by `scripts/visual-three-case-smoke-check.mjs`.
9. Insider / Vendor / API / Open Banking records exist as a first-class Connections workspace sub-tool.
10. Luna post-submission scoring is handled by one separate locked/unlocked module and remains scoped to generated active cases.
11. Generated cases open immediately and persist through the IndexedDB-first repository adapter.
12. Generated-case behavior above 50 cases is guarded by `scripts/generated-case-smoke-check.mjs`.
13. Playwright validates the approved Dashboard, Cases queue, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, Academy, and Profile, all three built-in cases, generated-case immediate open and reload persistence, the remaining core modules, System Access Lane, Luna’s pre-submission lock, desktop record layouts, Pixel 7 stacked records, and no page overflow.
14. Visible first-tool coaching and investigator-question headings are rejected by the Evidence First wording guard.
15. Progress package-status text is rendered by direct React controls and cannot drift back into the legacy selector scanner.
16. Navigation heading and Academy learning copy are rendered by direct React controls and cannot drift back into legacy selector discovery.
17. Case Briefing transaction/payee and short-summary copy are rendered by direct React controls, and the old selector scanner is inert.
18. Workspace case persistence and action orchestration are split into focused hooks with dedicated verification guards.
19. Academy Progress reads the stable saved learner-package snapshots, refreshes in the same session, and remains neutral until submission.
20. The Display Handoff locks the approved design authority, phased migration order, four-item global target, active-case workflow target, responsive review ranges, no-horizontal-overflow rule, and architecture boundaries.
21. Display Phase 1 implements the four-item global navigation, contextual Progress entry points, functional Help, Settings, and Agent-profile controls, and a dedicated global-shell regression guard.
22. Display Phase 2 implements the seven-stage active-case workflow, keeps categories inside Investigate, preserves neutral package and Debrief lock language, and adds a dedicated workflow-rail regression guard.
23. Display Phase 3 reduces indiscriminate glow, clarifies hierarchy and interaction states, preserves visible keyboard focus, and adds a dedicated hierarchy-and-glow regression guard without changing records or persistence.
24. Display Phase 4 converts phone-width records to labeled cards, preserves desktop tables and actions, prevents required page overflow, and adds dedicated source and browser regression coverage.
25. Display Phase 5 audits the exact merged display tree, confirms the runtime candidate for internal user acceptance, records unresolved commercial release-package gaps, adds generated-case reload persistence coverage, and protects the verdict with a dedicated guard.
26. The release package centralizes architecture, persistence, fictional-data safety, accessibility/browser status, deployment status, limitations, and backlog while preserving the honest internal-UAT verdict.
27. The approved Dashboard theme v1 replaces only the Dashboard surface, preserves all case and persistence behavior, and has focused static and desktop/mobile browser guards.
28. The approved Cases theme v1 replaces only the Case Queue, preserves built-in and generated case routing, adds neutral search/filter/sort/preview behavior, and has focused static and desktop/mobile browser guards.
29. The approved Workspace shell theme v1 replaces only the application shell around the investigation, preserves active-case switching and the seven-stage workflow, fixes desktop and Pixel 7 width safety, and has focused static and desktop/mobile browser guards.
30. The approved Case Briefing theme v1 replaces only the briefing surface, preserves allegation/system-alert-only context and all established routes, and has focused static plus desktop/mobile browser guards.
31. The approved Customer 360 theme v1 replaces only the identity dossier, preserves case switching and evidence actions, keeps claim-specific context neutral, and has focused static plus desktop/mobile browser guards.
32. The approved Investigation tools theme v1 replaces only the deep-tool record workspace, preserves tool data and action boundaries, adds six contextual groups and focused record review, and has focused static plus desktop/mobile browser guards.
33. The approved Timeline theme v1 replaces only the event-sequence workspace, preserves case-scoped records and action boundaries, keeps all visible conclusions neutral, and has focused static plus desktop/mobile browser guards.
34. The approved Decision and Luna theme v1 replaces only Determination and Debrief, preserves the package and persistence boundaries, keeps Luna locked before submission, adds the active-case post-submission review, and has focused static plus desktop/mobile browser guards.
35. The approved Academy theme v1 replaces only the learning center, preserves contextual Academy Progress and case routes, keeps learning copy neutral, isolates unreplaced Workspace surfaces, and has focused static plus desktop/mobile browser guards.
36. The approved Profile theme v1 replaces only the contextual Agent profile, preserves four-item navigation and Workspace controls, keeps activity metrics neutral, isolates Workspace surfaces, and has focused static plus desktop/mobile browser guards.

## Remaining follow-up work

1. Complete final responsive/mobile polish only across the verified screen set without changing screen ownership, investigation behavior, persistence, Evidence First, Luna gating, or System Access.
2. Re-run the complete desktop and Pixel 7 suite after each focused polish change.
3. Compare each completed desktop/mobile screen with the original Bible v2.1 and Display Bible references before advancing.
4. Add a curated current desktop/mobile screenshot set.
5. Complete manual accessibility and non-Chromium browser validation.
6. Select a repository license before external commercial handoff.

## Browser-confirmed functional coverage

1. The approved Dashboard renders on desktop and Pixel 7, shows the active case and contextual shortcuts, returns to the active workspace, and remains free of required page overflow.
2. The approved Cases queue renders on desktop and Pixel 7 with neutral search, priority filtering, sorting, Detail/Compact views, selected preview, sticky desktop and stacked mobile layouts, and no required page overflow.
3. The approved Workspace shell renders on desktop and Pixel 7 with the compact header, Help control, active-case switcher, seven workflow stages, light generated-case controls, desktop seven-column and mobile two-column workflow layouts, and no required page overflow.
4. The approved Case Briefing renders on desktop and Pixel 7 with the card-grid hierarchy, active-case switching, six utility routes, preserved Identity Intelligence, Login History, and Submit Decision routes, functional Customer 360 investigation entry, and no required page overflow.
5. The approved Customer 360 renders on desktop and Pixel 7 with the full dossier, profile-change log, claim-specific neutral context, search, reviewed state, case switching, related-tool routes, stacked mobile cards, and no required page overflow.
6. The approved Investigation tools render on desktop and Pixel 7 with six contextual groups, tool switching, search, record expansion, pinning, notes, neutral report packets, reviewed state, Timeline/Case Report routing, two-column desktop review, stacked mobile review, and no required page overflow.
7. The approved Timeline renders on desktop and Pixel 7 with event ordering, search, source filtering, expansion, pinning, notes, neutral report packets, reviewed state, workflow routing, stacked mobile review, and no required page overflow.
8. The approved Decision and Luna flow renders on desktop and Pixel 7 with the readiness checklist, package submission, locked pre-submission Luna state, case-scoped post-submission debrief, refresh persistence, functional Workspace/Case Summary/Queue routes, and no required page overflow.
9. The approved Academy renders on desktop and Pixel 7 with four Evidence First learning paths, Fraud Library topics, neutral achievement guidance, contextual Progress, functional Cases and Workspace routes, isolation from unreplaced Workspace surfaces, and no required page overflow.
10. The approved Profile renders on desktop and Pixel 7 with contextual avatar entry, neutral rank, skills, badges, activity, and goals, Workspace, Academy, and Progress routes, four-item navigation, isolation, and no required page overflow.
11. All three built-in cases load from the Cases queue and update the active case workspace.
12. Payment Verification opens in a locked search-first state and returns case-specific name-match and account-status results only after a Bank Code, Destination ID, and owner-name lookup; KYB Review, Document Viewer, Link Analysis, System Access Lane, Timeline, and Case Report open with their expected records.
13. Generated cases save through the repository, open immediately, remain unique during rapid generation, persist after reload, and return to the approved Case Queue.
14. Luna remains locked before submission and follows the active built-in or generated case ID.
15. Desktop and mobile Chromium render the tested flows without visible Evidence First answer leaks.
16. The contextual tool groups and active-case workflow controls remain clickable without being blocked by sticky panels or navigation.
17. Desktop Investigation-tool records and expanded detail stay aligned while Pixel 7 stacks the review surfaces and keeps the document free of required horizontal page overflow.
18. More than 50 generated cases and localStorage-to-IndexedDB migration remain covered by repository-level smoke checks.



## Latest handoff

The approved Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, Academy, and Profile theme v1 replacements are merged and protected by focused static guards plus desktop and Pixel 7 browser coverage. The implementations keep the four-item navigation, active case, contextual Profile and Academy Progress, neutral visible wording, Evidence First, Luna locking, IndexedDB-first generated cases, and the single Connections → System Access Lane unchanged. The next isolated step is **final responsive/mobile polish only**.

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

`npm run verify` includes Evidence First, functional smoke, visual three-case smoke, generated-case repository smoke, Luna single-module smoke, review-package smoke, remaining-module depth, navigation direct-collapse, Academy Progress package-flow, summary direct-collapse, workspace case-state hook, workspace action-controller, display-handoff, Display Phase 1 global-shell, Display Phase 2 workflow-rail, Display Phase 3 hierarchy-and-glow, Display Phase 4 responsive-record, Display Phase 5 release-readiness, Dashboard approved-theme v1, Cases approved-theme v1, Workspace shell approved-theme v1, Case Briefing approved-theme v1, Customer 360 approved-theme v1, Investigation tools approved-theme v1, Timeline approved-theme v1, Decision and Luna approved-theme v1, Academy approved-theme v1, Profile approved-theme v1, release-package documentation, and production build checks. GitHub Actions also runs Playwright against desktop Chromium and a Pixel 7 mobile profile for the approved Dashboard, Cases queue, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, Academy, and Profile, all three built-in cases, generated-case immediate open and reload persistence, core modules, System Access Lane, Luna lock behavior, the active-case workflow surface, and responsive record presentation.
