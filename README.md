# Fraud Academy OS v1.0

Fraud Academy OS is a fictional fraud investigation training operating system. It teaches investigators how to think through cases, connect evidence, document findings, and make defensible decisions using training-safe fictional data.

## Source of truth

The locked product compass lives in:

```text
docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md
```

Use that file before making architecture, UI, tool, scenario, or Evidence First changes.

## Locked direction

- One Case. One Workspace. One Investigation.
- Every tool answers one investigator question.
- Evidence First: no fraud/non-fraud answer, fraud score, red flags, green flags, AI recommendation, or decision hint before the investigation is complete.
- Summaries assist. Event logs verify.
- Search finds evidence. Link Analysis connects evidence.
- Luna can encourage before submission, but Luna debrief and scoring only happen after submission.
- Mobile feels like a magical investigator notebook.
- Desktop feels like a fraud command center.

## Current status

- The screenshot-driven visual workspace is active.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and active navigation tab through React state.
- `src/VisualWorkspace.jsx` owns the core investigation workspace behavior: case-scoped tray, notes, reviewed tools, decision drafts, review packages, and Case Report packets.
- `src/VisualShellHeader.jsx` owns the ornate app header, active case strip, and Case Queue dropdown.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper; Active Tool purpose, expanded-record text, tray identifiers, Case Report packet text, notebook note entries, and Submit Decision checklist messages now use it directly.
- `src/visualWorkspaceModel.js` now owns workspace constants, storage helpers, live tool row builders, System Access Lane row construction, and Case Report packet construction.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer: sub-tool dropdown, search, rows, expanded record lanes, pin/review actions, and neutral report packet saves.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, notes, packet feed, and Open Evidence Center routing.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake facts, Pin Case, quick tool routes, and Submit Decision jump.
- `src/CategoryTileRail.jsx` owns the ornate investigation category rail, including neutral reviewed counts, progress bars, active/reviewed state classes, and Tool Map routing.
- `src/SubmitDecisionPanel.jsx` owns the locked Submit Decision visual panel while the review package model keeps Evidence First behavior enforced.
- `src/VisualNavigation.jsx` receives direct React callbacks for Dashboard, Cases, Workspace, Academy, Progress, and case opening.
- `src/VisualTextCollapse.jsx` now uses limited event-triggered scans instead of a broad MutationObserver, and no longer scans Submit Decision checklist text.
- Insider / Vendor / API / Open Banking is now the Connections → System Access Lane sub-tool inside `src/VisualWorkspace.jsx`, powered by `src/data/systemAccessRecords.js`.
- `src/LunaPostSubmissionPanel.jsx` restores post-submission Luna scoring/debrief as a separate React module that stays locked before a learner package exists and resolves the active case from the live built-in/generated catalog.
- `src/data/generatedCaseRepository.js` is the generated-case storage boundary. IndexedDB is primary, localStorage remains a fallback, and existing localStorage-generated cases migrate once into IndexedDB.
- Generated cases are added to the live React case catalog, opened without page refresh, and preserved behind a backend-ready repository contract.
- The generated queue has no arbitrary application count cap. A monotonic sequence prevents rapid-generation ID collisions, and `scripts/generated-case-smoke-check.mjs` verifies more than 50 cases remain unique and available.
- The old `src/visualInvestigationRepair.js` DOM route patch is retired and not loaded by the app entrypoint.
- Case Summary metadata, Device ID rows, Tool Map, Open Evidence Center, and Submit Decision routing are rendered through React instead of repair scripts.
- Submit Decision uses the locked review package model and remains Evidence First.
- Submit Decision decision calls now include claim outcome calls, more-information calls, review-route calls, escalation calls, and administrative closure calls.
- The decision model now includes insider / vendor / API / open banking escalation, credit risk routing, chargeback representment routing, identity verification routing, payment verification routing, and fraud-ring / link-analysis routing.
- Ornate category tiles show neutral reviewed counts and progress tracks only.
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
13. Playwright validates all three built-in cases, generated-case immediate open and reload persistence, the remaining core modules, System Access Lane, and Luna’s pre-submission lock in desktop and mobile Chromium.
14. Visible first-tool coaching and investigator-question headings are rejected by the Evidence First wording guard.

## Remaining follow-up work

1. Continue splitting `VisualWorkspace.jsx` into focused React modules so future edits do not risk connector clipping. The visual shell header, workspace model, active tool panel, bottom investigation grid, case summary card, category rail, and Submit Decision panel are now split.
2. Continue converting compact text target discovery into direct reusable wrappers. Active Tool content, tray identifiers, Case Report packet text, notebook note entries, and Submit Decision checklist messages already use `DirectCollapsibleText`; Luna, Progress, Navigation, and remaining summary copy still use the limited compatibility scanner.
3. Reconnect Academy Progress polish to the stable post-submission package flow.

## Browser-confirmed functional coverage

1. All three built-in cases load from the Cases tab and update the active case workspace.
2. Payment Verification, Business Intelligence, Evidence Center, Link Analysis, System Access Lane, Timeline, and Case Report open with records.
3. Generated cases save through the repository, open immediately, remain unique during rapid generation, and persist after reload.
4. Luna remains locked before submission and follows the active built-in or generated case ID.
5. Desktop and mobile Chromium render the tested flows without visible Evidence First answer leaks.
6. The desktop category rail remains clickable without being blocked by sticky right-side panels or the fixed navigation.
7. More than 50 generated cases and localStorage-to-IndexedDB migration remain covered by repository-level smoke checks.

## Latest handoff

The reconciled branch is based on the latest module-depth implementation on `main`. Browser automation is now part of CI through separate source verification and desktop/mobile Chromium jobs. The final Bible audit fixed generated-case Luna scoping, strengthened neutral-copy guards, and removed a desktop pointer obstruction from the category rail. Display-polish work remains intentionally separate.

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

`npm run verify` includes Evidence First, functional smoke, visual three-case smoke, generated-case repository smoke, Luna single-module smoke, review-package smoke, remaining-module depth, and production build checks. GitHub Actions also runs Playwright against desktop Chromium and a Pixel 7 mobile profile for all three built-in cases, generated cases, core modules, System Access Lane, persistence, and Luna lock behavior.
