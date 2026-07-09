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
- The workspace was recovered after a connector clipping issue partially overwrote `src/VisualWorkspace.jsx`.
- `src/VisualWorkspace.jsx` is now a smaller stable recovery shell so the app can load and all three built-in cases can be audited without the file being clipped again.
- The three built-in cases are enriched through `src/data/caseEnrichment.js`.
- Case Summary now shows name, claim ID, total claim amount, transaction/payee info, and short neutral summary.
- Device Intelligence now shows Device ID as the first column and uses enriched stable fictional device IDs where available.
- Identity Intelligence, Case Report, Submit Decision, Evidence Center, Tool Map, and bottom navigation have direct visible routes in the stable shell.
- The Submit Decision route now forces the workspace tab active before scrolling to the decision panel.
- Broad MutationObserver helper scripts remain removed from the app entrypoint to avoid browser unresponsive loops.

## Functional focus

The current working priority is stability plus three-case completeness:

1. Confirm all three built-in cases load.
2. Confirm each category opens.
3. Confirm each sub-tool opens.
4. Confirm Device Intelligence shows Device ID and repeated devices reuse the same Device ID.
5. Confirm Case Summary has full intake metadata.
6. Confirm Case Report opens.
7. Confirm Submit Decision is visible and reachable.
8. Confirm no visible control is only decorative.
9. After the stable shell is confirmed, split the workspace into smaller React modules and restore richer saved notes/review package/Luna behavior cleanly.

## Latest handoff

A three-case audit recovery pass restored `VisualWorkspace.jsx` into a stable compact React shell and connected it to `caseEnrichment.js`. The app should now prioritize loading successfully, showing enriched case summaries, showing Device IDs, and making Submit Decision visible. Next step: run `npm run verify` locally, browser-test all three built-in cases, then rebuild the richer note/review-package/Luna behaviors into smaller React modules instead of one oversized file.

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

The repo has been updated through the GitHub connector. Local build testing still needs to run in the user's connected development environment.
