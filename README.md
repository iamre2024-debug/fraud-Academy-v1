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

The completed Phase 5 release-readiness audit lives in:

```text
docs/FRAUD_ACADEMY_RELEASE_READINESS.md
```

Use these files before making architecture, UI, navigation, responsive, tool, scenario, Evidence First, or release-readiness changes. The Display Handoff records the approved Bible v2.1 and Display Bible authority chain, the Source of Truth protects the live code architecture and safety boundaries, and the Release Readiness audit records the exact runtime verdict plus remaining commercial packaging gaps.

## Locked direction

- One Case. One Workspace. One Investigation.
- Every tool answers one investigator question.
- Evidence First: no fraud/non-fraud answer, fraud score, red flags, green flags, AI recommendation, or decision hint before the investigation is complete.
- Summaries assist. Event logs verify.
- Search finds evidence. Link Analysis connects evidence.
- Luna can encourage before submission, but Luna debrief and scoring only happen after submission.
- Mobile remains touch-friendly, functional, and free of required horizontal page scrolling.
- Desktop remains a polished fraud command center.
- Display migration happens in focused phases without replacing working behavior or persistence architecture.

## Current status

- The screenshot-driven visual workspace remains the active transitional runtime while focused display phases replace one surface at a time.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and active navigation tab through React state.
- `src/VisualWorkspace.jsx` coordinates the core investigation workspace while `src/useVisualWorkspaceCaseState.js` owns case-scoped persistence and `src/useVisualWorkspaceActions.js` owns investigation actions and learner-package submission.
- `src/VisualShellHeader.jsx` owns the ornate app header, active case strip, Case Queue dropdown, and functional Help, Settings, and Agent-profile controls.
- The Help control routes to Academy and Cases, Settings persists a reduced-motion preference, and Agent profile exposes the current assignment plus Progress and Workspace routes.
- `src/VisualNavigation.jsx` renders exactly four global destinations: Dashboard, Cases, Workspace, and Academy.
- Academy Progress remains active through contextual Dashboard, Academy, and Agent-profile actions rather than a fifth equal navigation item.
- `src/ActiveCaseWorkflowRail.jsx` renders Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief with neutral status text and accessible current-step state.
- The existing `src/CategoryTileRail.jsx` category rail is rendered inside Investigate and remains the entry point to the evidence tool families.
- Timeline and Summary open the existing Timeline and Case Report tools; Indicators opens the neutral Evidence Center; Determination keeps the existing package-gated submit flow; Debrief remains locked until a learner package exists.
- `src/displayPhaseOne.css` owns the four-column global navigation override, header-control presentation, contextual Progress shortcut, and reduced-motion behavior.
- `src/displayPhaseTwo.css` owns the focused workflow-rail presentation and compact wrapping without performing later hierarchy or mobile-record phases.
- Display Phase 3 calibrates hierarchy and glow through `src/displayPhaseThree.css`, reducing repeated decorative bloom while formalizing primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states.
- `src/displayPhaseFour.css` preserves desktop record tables and converts dense rows into labeled, touch-friendly cards at phone widths without horizontal scrolling.
- Display Phase 5 records the exact runtime and release-package verdict in `docs/FRAUD_ACADEMY_RELEASE_READINESS.md`, adds generated-case reload persistence coverage, and introduces no runtime redesign.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper; Active Tool purpose, expanded-record text, tray identifiers, Case Report packet text, notebook note entries, Submit Decision checklist messages, Luna coaching lists, Navigation heading and Academy learning copy, Academy Progress package status, and Case Summary transaction/payee and short-summary copy use it directly.
- `src/visualWorkspaceModel.js` owns workspace constants, storage helpers, live tool row builders, System Access Lane row construction, and Case Report packet construction.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer: sub-tool dropdown, search, semantic desktop table, responsive `data-field` labels, mobile record cards, expanded record lanes, pin/review actions, and neutral report packet saves.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, notes, packet feed, and Open Evidence Center routing.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake facts, direct compact controls for longer neutral summary fields, Pin Case, quick tool routes, and Submit Decision jump.
- `src/SubmitDecisionPanel.jsx` owns the locked Submit Decision visual panel while the review package model keeps Evidence First behavior enforced.
- `src/AcademyProgressPanel.jsx` owns neutral locked/unlocked case status, saved-package counts, reviewed-tool/pinned-object/note/report-packet snapshots, and case-return actions without exposing Luna scoring.
- `src/VisualTextCollapse.jsx` is an inert compatibility marker only. It contains no selector discovery, portal controls, event listeners, or DOM scanning; compact More / Less behavior is React-owned through `DirectCollapsibleText`.
- Insider / Vendor / API / Open Banking remains the single Connections → System Access Lane sub-tool inside the workspace, powered by `src/data/systemAccessRecords.js`.
- `src/LunaPostSubmissionPanel.jsx` restores post-submission Luna scoring/debrief as a separate React module that stays locked before a learner package exists and resolves the active case from the live built-in/generated catalog.
- `src/data/generatedCaseRepository.js` is the generated-case storage boundary. IndexedDB is primary, localStorage remains a fallback, and existing localStorage-generated cases migrate once into IndexedDB.
- Generated cases are added to the live React case catalog, opened without page refresh, preserved after reload, and kept behind a backend-ready repository contract.
- The generated queue has no arbitrary application count cap. A monotonic sequence prevents rapid-generation ID collisions, and `scripts/generated-case-smoke-check.mjs` verifies more than 50 cases remain unique and available.
- The old `src/visualInvestigationRepair.js` DOM route patch is retired and not loaded by the app entrypoint.
- Case Summary metadata, Device ID rows, Tool Map, Open Evidence Center, and Submit Decision routing are rendered through React instead of repair scripts.
- Submit Decision uses the locked review package model and remains Evidence First.
- Category tiles and workflow stages use neutral progress and availability language only.
- Broad DOM repair scripts remain out of the app entrypoint to avoid browser unresponsive loops.

## Bible audit notes

The latest source-of-truth audit confirmed these requirements are active or restored:

1. Evidence First wording remains the rule: no final outcome, fraud score, red flags, green flags, AI recommendations, or answer hints before submission.
2. Case Summary explains why the case exists using allegation or system alert plus neutral intake metadata.
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
13. Playwright validates all three built-in cases, generated-case immediate open and reload persistence, the remaining core modules, System Access Lane, Luna’s pre-submission lock, desktop record headers, Pixel 7 record cards, and no page overflow.
14. Visible first-tool coaching and investigator-question headings are rejected by the Evidence First wording guard.
15. Progress package-status text is rendered by direct React controls and cannot drift back into the legacy selector scanner.
16. Navigation heading and Academy learning copy are rendered by direct React controls and cannot drift back into legacy selector discovery.
17. Case Summary transaction/payee and short-summary copy are rendered by direct React controls, and the old selector scanner is inert.
18. Workspace case persistence and action orchestration are split into focused hooks with dedicated verification guards.
19. Academy Progress reads the stable saved learner-package snapshots, refreshes in the same session, and remains neutral until submission.
20. The Display Handoff locks the approved design authority, phased migration order, four-item global target, active-case workflow target, responsive review ranges, no-horizontal-overflow rule, and architecture boundaries.
21. Display Phase 1 implements the four-item global navigation, contextual Progress entry points, functional Help, Settings, and Agent-profile controls, and a dedicated global-shell regression guard.
22. Display Phase 2 implements the seven-stage active-case workflow, keeps categories inside Investigate, preserves neutral package and Debrief lock language, and adds a dedicated workflow-rail regression guard.
23. Display Phase 3 reduces indiscriminate glow, clarifies hierarchy and interaction states, preserves visible keyboard focus, and adds a dedicated hierarchy-and-glow regression guard without changing records or persistence.
24. Display Phase 4 converts phone-width records to labeled cards, preserves desktop tables and actions, prevents required page overflow, and adds dedicated source and browser regression coverage.
25. Display Phase 5 audits the exact merged display tree, confirms the runtime candidate for internal user acceptance, records unresolved commercial release-package gaps, adds generated-case reload persistence coverage, and protects the verdict with a dedicated guard.

## Remaining follow-up work

1. Create the documentation-only release package listed in `docs/FRAUD_ACADEMY_RELEASE_READINESS.md`.
2. Add architecture, data-model, fictional-data safety, accessibility and supported-browser, known-limitations, deployment-status, and backlog documentation.
3. Add a current desktop/mobile screenshot set and demo link when available.
4. Select a repository license before external commercial handoff.
5. Keep these packaging changes separate from redesign, persistence migration, investigation behavior, and System Access expansion.

## Browser-confirmed functional coverage

1. All three built-in cases load from the Cases tab and update the active case workspace.
2. Payment Verification, Business Intelligence, Evidence Center, Link Analysis, System Access Lane, Timeline, and Case Report open with records.
3. Generated cases save through the repository, open immediately, remain unique during rapid generation, persist after reload, and return to the live Case Queue.
4. Luna remains locked before submission and follows the active built-in or generated case ID.
5. Desktop and mobile Chromium render the tested flows without visible Evidence First answer leaks.
6. The desktop category rail and active-case workflow controls remain clickable without being blocked by sticky right-side panels or the fixed navigation.
7. Desktop investigation headers remain visible while Pixel 7 records become labeled cards and the document stays free of required horizontal page overflow.
8. More than 50 generated cases and localStorage-to-IndexedDB migration remain covered by repository-level smoke checks.

## Latest handoff

The latest focused work completes Display Phase 5 without altering runtime presentation, investigation behavior, or persistence. The release audit approves the verified runtime candidate for internal user acceptance while honestly recording that the commercial/public release package is not complete. `scripts/display-phase-five-smoke-check.mjs` protects the audit wording, architecture anchors, CI wiring, and generated-case reload coverage while Evidence First, Luna gating, IndexedDB-first generated-case persistence, training-safe labels, and the single Connections → System Access Lane remain unchanged.

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

`npm run verify` includes Evidence First, functional smoke, visual three-case smoke, generated-case repository smoke, Luna single-module smoke, review-package smoke, remaining-module depth, navigation direct-collapse, Academy Progress package-flow, summary direct-collapse, workspace case-state hook, workspace action-controller, display-handoff, Display Phase 1 global-shell, Display Phase 2 workflow-rail, Display Phase 3 hierarchy-and-glow, Display Phase 4 responsive-record, Display Phase 5 release-readiness, and production build checks. GitHub Actions also runs Playwright against desktop Chromium and a Pixel 7 mobile profile for all three built-in cases, generated-case immediate open and reload persistence, core modules, System Access Lane, Luna lock behavior, the active-case workflow surface, and responsive record presentation.
