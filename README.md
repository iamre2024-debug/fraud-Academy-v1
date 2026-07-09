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
- `src/VisualApp.jsx` coordinates the active case and active navigation tab through React state.
- `src/VisualWorkspace.jsx` owns the investigation workspace behavior: case-scoped tray, notes, reviewed tools, decision drafts, review packages, and Case Report packets.
- `src/VisualNavigation.jsx` receives direct React callbacks for Dashboard, Cases, Workspace, Academy, Progress, and case opening.
- `src/VisualTextCollapse.jsx` continues managing compact More / Less controls through React.
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
4. Digital Activity includes Login History, Session History, Device Intelligence, IP Intelligence, and stable fictional Device IDs.
5. Submit Decision remains locked until required tool review, pinned evidence, notes, learner choice, and rationale are complete.
6. Expanded decision calls are validated by `scripts/review-package-smoke-check.mjs`.

Still needs deeper module work after browser confirmation:

1. Split `VisualWorkspace.jsx` into smaller React modules so future edits do not risk connector clipping.
2. Convert compact text target discovery into direct reusable wrappers instead of broad selector scanning.
3. Add unlimited generated cases after the three built-in cases are stable.
4. Add a formal Insider / Vendor / API / Open Banking lane as a real tool family or Connections sub-tool.
5. Rebuild post-submission Luna scoring and Academy Progress polish on top of the stable workspace shell.

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
9. Confirm no visible control is only decorative or duplicated.
10. After the stable shell is confirmed, split the workspace into smaller React modules and replace selector-discovery compact text with direct reusable wrappers.

## Latest handoff

The source-of-truth Bible audit expanded Submit Decision from four broad options into a realistic neutral decision-call list. The shared review package model now validates expanded decision calls and rejects unsupported stale choices. The review-package smoke check verifies expanded decision calls, insider/vendor/API/open banking escalation, credit risk routing, chargeback representment routing, locked blockers, rationale depth, optional packet feed, and saved package snapshots. Next step: run `npm run verify`, browser-test all three built-in cases, then split `VisualWorkspace.jsx` into smaller modules.

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
