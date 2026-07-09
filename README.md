# Fraud Academy OS v1.0

Fraud Academy OS is a fictional fraud investigation training operating system. It teaches investigators how to think through cases, connect evidence, document findings, and make defensible decisions using training-safe fictional data.

## Source of truth

The locked product compass now lives in:

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
- `src/VisualApp.jsx` now coordinates the active case and active navigation tab through React state.
- `src/VisualWorkspace.jsx` owns the investigation workspace behavior: case-scoped tray, notes, reviewed tools, decision drafts, review packages, and Case Report packets.
- `src/VisualNavigation.jsx` receives direct React callbacks for Dashboard, Cases, Workspace, Academy, Progress, and case opening.
- `src/VisualTextCollapse.jsx` continues managing compact More / Less controls through React.
- The old `src/visualInvestigationRepair.js` DOM route patch is retired and deleted.
- Case Summary metadata, Device ID rows, Tool Map, Open Evidence Center, and Submit Decision routing are rendered through React instead of repair scripts.
- Submit Decision uses the locked review package model and remains Evidence First.
- Ornate category tiles show neutral reviewed counts and progress tracks only.
- Broad DOM repair scripts remain out of the app entrypoint to avoid browser unresponsive loops.

## Functional focus

The current working priority is stability plus three-case completeness:

1. Confirm all three built-in cases load from both the case dropdown and the Cases tab.
2. Confirm each category opens and each sub-tool opens.
3. Confirm Device Intelligence shows Device ID and repeated devices reuse the same Device ID.
4. Confirm Case Summary has full intake metadata.
5. Confirm Tool Map opens Academy and Open Evidence Center routes to Evidence Center.
6. Confirm notes, tray objects, reviewed tools, decision drafts, saved packages, and Case Report packets persist by case.
7. Confirm Submit Decision locks until required tools, pinned evidence, notes, choice, and rationale are present.
8. Confirm no visible control is only decorative or duplicated.
9. After the stable shell is confirmed, split the workspace into smaller React modules and replace selector-discovery compact text with direct reusable wrappers.

## Latest handoff

The lightweight investigation repair behavior has been moved into true React state and callbacks. `VisualApp.jsx` now coordinates active case and active tab, `VisualWorkspace.jsx` handles Tool Map, Open Evidence Center, Submit Decision routing, Device IDs, Case Summary metadata, case-scoped persistence, category progress, and locked Submit Decision behavior, and `VisualNavigation.jsx` no longer uses the old navigation event bridge or DOM select manipulation. Next step: run `npm run verify`, browser-test all three built-in cases, then split `VisualWorkspace.jsx` into smaller modules.

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

The repo has been updated through the GitHub connector. Local build and browser testing still need to run in the user's connected development environment.
