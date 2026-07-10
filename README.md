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
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper; Active Tool purpose, expanded-record text, tray identifiers, Case Report packet text, and notebook note entries now use it directly.
- `src/visualWorkspaceModel.js` now owns workspace constants, storage helpers, live tool row builders, System Access Lane row construction, and Case Report packet construction.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer: sub-tool dropdown, search, rows, expanded record lanes, pin/review actions, and neutral report packet saves.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, notes, packet feed, and Open Evidence Center routing.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake facts, Pin Case, quick tool routes, and Submit Decision jump.
- `src/CategoryTileRail.jsx` owns the ornate investigation category rail, including neutral reviewed counts, progress bars, active/reviewed state classes, and Tool Map routing.
- `src/SubmitDecisionPanel.jsx` owns the locked Submit Decision visual panel while the review package model keeps Evidence First behavior enforced.
- `src/VisualNavigation.jsx` receives direct React callbacks for Dashboard, Cases, Workspace, Academy, Progress, and case opening.
- `src/VisualTextCollapse.jsx` now uses limited event-triggered scans instead of a broad MutationObserver.
- Insider / Vendor / API / Open Banking is now the Connections → System Access Lane sub-tool inside `src/VisualWorkspace.jsx`, powered by `src/data/systemAccessRecords.js`.
- `src/LunaPostSubmissionPanel.jsx` restores post-submission Luna scoring/debrief as a separate React module that stays locked before a learner package exists.
- `src/GeneratedCaseControls.jsx` and `src/data/generatedCases.js` provide the local generated-case foundation. Generated cases are saved in browser storage, added to the live React case catalog, and opened without page refresh.
- The generated queue no longer has the former 50-case application cap. A monotonic local sequence prevents rapid-generation ID collisions, and `scripts/generated-case-smoke-check.mjs` verifies more than 50 cases remain unique and available.
- Browser storage still has a device quota. Moving generated cases to IndexedDB or a backend is required before describing storage as practically unlimited across large case volumes.
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
9. Insider / Vendor / API / Open Banking records now exist as a first-class Connections workspace sub-tool.
10. Luna post-submission scoring is handled by one separate locked/unlocked module.
11. Generated-case foundation exists, opens generated cases immediately, and stores an uncapped application queue within the browser's available storage quota.
12. Generated-case behavior above 50 cases is guarded by `scripts/generated-case-smoke-check.mjs`.

Still needs deeper module work after browser confirmation:

1. Continue splitting `VisualWorkspace.jsx` into focused React modules so future edits do not risk connector clipping. The visual shell header, workspace model, active tool panel, bottom investigation grid, case summary card, category rail, and Submit Decision panel are now split.
2. Continue converting compact text target discovery into direct reusable wrappers. Active Tool content, tray identifiers, Case Report packet text, and notebook note entries already use `DirectCollapsibleText`; remaining legacy targets still use the limited compatibility scanner.
3. Reconnect Academy Progress polish to the stable post-submission package flow.
4. Choose and implement durable generated-case storage before claiming unlimited large-volume retention.

## Functional focus

The current working priority is stability plus three-case completeness:

1. Confirm all three built-in cases load from both the case dropdown and the Cases tab.
2. Confirm each category opens and each sub-tool opens.
3. Confirm Device Intelligence shows Device ID and repeated devices reuse the same Device ID.
4. Confirm Case Summary has full intake metadata.
5. Confirm Tool Map opens Academy and Open Evidence Center routes to Evidence Center.
6. Confirm notes, tray objects, reviewed tools, decision drafts, saved packages, and Case Report packets persist by case.
7. Confirm Submit Decision locks until required tools, pinned evidence, notes, choice, and rationale are present.
8. Confirm expanded decision calls appear in Submit Decision.
9. Confirm Connections → System Access Lane opens with neutral Insider / Vendor / API / Open Banking records.
10. Confirm Luna stays locked before submission and shows post-submission scoring only after a package is saved.
11. Confirm Generate + Open Case saves a generated case locally, opens it immediately, and adds it to the workspace case queue without a page refresh.
12. Confirm more than 50 generated cases remain available without duplicate IDs.
13. Confirm no visible control is only decorative or duplicated.

## Latest handoff

The first uncapped generated-case phase is complete: the former 50-case application cap is removed, rapid generation uses a collision-safe local sequence, and `npm run verify` now includes a generated-case smoke check that creates 125 cases. Browser click/viewport validation still needs the user's connected development environment. The next approval point is durable storage: IndexedDB keeps cases on one device with a much larger quota, while a backend enables cross-device persistence and account-level synchronization.

Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report

## Local development

```bash
npm install
npm run verify
npm run dev
```

## Build

```bash
npm run build
```

## Test status

`npm run verify` includes Evidence First, functional smoke, visual three-case smoke, generated-case smoke, Luna single-module smoke, review-package smoke, and production build checks. Browser testing still needs to run in the user's connected development environment.
