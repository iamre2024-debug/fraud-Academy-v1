# Fraud Academy OS v1.0 Release Package

This document collects the external handoff information that was previously distributed across the repository. It describes the verified runtime architecture, data and persistence boundaries, fictional-data rules, accessibility and browser status, deployment status, known limitations, and post-v1 backlog.

## Release position

- Audited runtime base: `573ea1db64c309719a23df1031be1e4ba6fa4ca6`
- Version label: `v1.0.0`
- Verification date: July 25, 2026
- Runtime candidate: approved for internal user acceptance testing
- Commercial/public package: not yet complete
- Authority order: Fraud Academy Bible v2.1, Fraud Academy Display Bible v1.0 - New Design Exploration, `docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md`, `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`, then the latest verified `main`
- Historical PR #2, stale branches, retired DOM patches, and parked System Access portal modules are reference-only

The remaining external handoff items are a user-selected license, a committed desktop screenshot, original-Bible visual sign-off, and broader manual accessibility and browser validation.

## Product boundary

Fraud Academy is a fictional fraud investigation training operating system. It teaches evidence review, evidence connection, documentation, and defensible decision-making. It is not a production fraud decision engine, a real bank platform, a customer-data system, or an automated fraud outcome service.

The locked investigation doctrine is:

```text
Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report
```

Evidence First remains mandatory. Before learner submission, the interface must not reveal a final fraud/non-fraud result, correct answer, fraud score, red or green flags, AI recommendation, or answer-leading decision hint.

## Runtime architecture

```text
React entrypoint
  └─ VisualApp
      ├─ live built-in and generated case catalog
      ├─ active case and global navigation state
      ├─ VisualWorkspace
      │   ├─ VisualShellHeader
      │   ├─ CaseSummaryCard
      │   ├─ ActiveCaseWorkflowRail
      │   ├─ CategoryTileRail
      │   ├─ ActiveToolPanel
      │   ├─ BottomInvestigationGrid
      │   └─ SubmitDecisionPanel
      ├─ GeneratedCaseControls
      ├─ LunaPostSubmissionPanel
      └─ VisualNavigation
```

### Main runtime boundaries

| Boundary | Responsibility |
| --- | --- |
| `src/VisualApp.jsx` | Loads the built-in and generated case catalog, owns active case and navigation state, and coordinates top-level React surfaces. |
| `src/VisualWorkspace.jsx` | Coordinates the active investigation workspace without owning generated-case storage. |
| `src/visualWorkspaceModel.js` | Owns categories, tool workflow constants, case-scoped storage keys, row builders, and neutral report-packet construction. |
| `src/useVisualWorkspaceCaseState.js` | Owns case-scoped tray, notes, reviewed tools, decision drafts, learner packages, and Case Report packets. |
| `src/useVisualWorkspaceActions.js` | Owns pinning, notes, reviewed-tool updates, neutral report creation, checklist behavior, and learner-package submission. |
| `src/ActiveToolPanel.jsx` | Renders searchable records, expanded details, pin/review actions, desktop tables, and mobile record cards. |
| `src/LunaPostSubmissionPanel.jsx` | Keeps scoring, strengths, missed evidence, answer guidance, and decision-quality feedback locked until a saved learner package exists. |
| `src/data/generatedCaseRepository.js` | Is the only generated-case persistence boundary and provides the backend-ready async repository contract. |

### Protected architecture decisions

- Built-in and generated cases share the live React case catalog.
- UI components do not call generated-case browser storage directly.
- The retired `visualInvestigationRepair.js` DOM routing patch stays retired.
- The retired selector-based text-collapse scanner stays inert.
- Connections contains one System Access Lane. The parked ten-module System Access portal is not part of the active runtime.
- Display phases preserve the verified dark purple, pink, cyan, rounded-glass shell while improving navigation, hierarchy, workflow, and responsive records.

## Data model and persistence

### Case catalog

The active case catalog combines:

1. Built-in fictional training cases from repository data modules.
2. Generated fictional cases returned by `listGeneratedCases()`.
3. Enrichment overlays that provide the records needed by investigation tools.

Every case uses a stable fictional case ID and Training ID. Generated cases also include a `generatedAt` sequence value used for ordering and collision avoidance.

### Investigation record shape

Tool records are normalized for the renderer as:

```text
{
  id,
  values,
  pin,
  label,
  detail
}
```

Each active tool returns a column list plus normalized rows. Mobile presentation uses the same values and column labels as the desktop semantic table, so responsive changes do not create a second data model.

### Generated-case repository

| Store | Purpose | Current behavior |
| --- | --- | --- |
| IndexedDB database `fraud-academy-os-v1` | Primary generated-case persistence | Stores generated cases in `generatedCases` and repository metadata in `metadata`. |
| localStorage generated-case keys | Migration source and fallback | Existing cases and sequence metadata migrate once into IndexedDB; localStorage remains the fallback when IndexedDB is unavailable. |
| Repository sequence | Unique generated IDs | Uses a monotonic sequence and collision loop so rapid generation and queues above 50 cases remain unique. |
| Encrypted Supabase snapshot | Cross-device recovery | Stores only the browser-encrypted recovery envelope behind a server-side HMAC lookup and compare-and-set revision. IndexedDB and localStorage remain the immediate offline recovery sources. |

The public repository-facing operations are asynchronous: list generated cases, generate and save a case, and combine generated cases with the built-in catalog. A future backend must preserve that behavior instead of forcing UI rewrites.

### Case-scoped browser state

The following localStorage records are keyed by case ID:

| State | Key |
| --- | --- |
| Investigation tray | `fraud-academy-visual-tray-v1` |
| Investigator notes | `fraud-academy-notes-v1` |
| Reviewed tools | `fraud-academy-completed-tools-v1` |
| Decision drafts | `fraud-academy-decision-drafts-v1` |
| Saved learner packages | `fraud-academy-review-packages-v1` |
| Case Report packets | `fraud-academy-case-report-packets-v1` |
| Completed Luna debriefs | `fraud-academy-completed-debriefs-v1` |

The last active case, navigation tab, workspace page/tool, and Luna debrief location are stored as one validated record under `fraud-academy-resume-session-v1`. It is cloud-backed with last-writer-wins semantics. The explicit responsive-layout choice remains device-local under `fraud-academy-layout-mode-v1`.

This fictional training state is immediately recoverable from browser storage and can be synchronized between devices through the encrypted recovery-code flow. It is not multi-user case management or an authenticated employee record system.

## Fictional-data and training-safety statement

- Repository cases, people, businesses, identifiers, events, devices, payments, and evidence are fictional training data.
- Real customer, cardholder, employee, bank, merchant, account, or production investigation data must not be entered into this runtime.
- Training-safe labels remain required: SSN becomes Training ID, Routing Number becomes Bank Code, Account Number becomes Destination ID, and Bank Verification becomes Payment Verification.
- Generated cases are fictional and are stored only in the learner's browser through the generated-case repository.
- The runtime does not transmit investigation data to a backend in the current repository version.
- Evidence First wording applies to built-in cases, generated cases, visible tool records, workflow status, Academy Progress, and Luna.

## Accessibility and browser support

### Implemented and automatically guarded

- Semantic desktop record tables remain available above the phone breakpoint.
- Phone-width records become labeled cards without required horizontal page scrolling.
- Selected navigation and workflow stages expose current-state semantics.
- Expandable controls expose expansion state where implemented.
- Keyboard focus remains visibly distinct through the focused hierarchy layer.
- Reduced motion can be selected through Settings and is persisted locally.
- Mobile record actions retain touch-friendly targets.
- Desktop category and workflow controls are guarded against overlay interception.
- CI captures traces, screenshots, and video on Playwright failure.

### Verified browser profiles

| Profile | Status |
| --- | --- |
| Playwright Desktop Chrome | Required CI pass |
| Playwright Pixel 7 Chromium | Required CI pass |
| Current Chromium-family desktop browsers | Expected to follow the verified Desktop Chrome behavior |
| Firefox desktop/mobile | Not yet formally validated |
| Safari desktop/iOS | Not yet formally validated |

No WCAG conformance level is claimed. A manual keyboard, screen-reader, zoom, contrast, and reduced-motion audit is still required before a public accessibility statement can claim formal compliance.

## Build, test, and quality gates

Required local commands:

```bash
npm install
npm run verify
npm run browser-smoke-check
npm run dev
```

`npm run verify` protects Evidence First wording, functional routing, all three built-in cases, generated-case repository behavior, Luna's pre-submission lock, learner-package behavior, module depth, compact text controls, workspace state/action boundaries, display handoff, Display Phases 1 through 5, this release package, and the production build.

GitHub Actions uses Node.js 24 and runs the named verification chain before desktop and Pixel 7 Chromium browser smoke tests.

## Deployment status

- Repository status: `main` verified at `573ea1db64c309719a23df1031be1e4ba6fa4ca6`
- Vercel deployment status: successful for the audited `main` commit
- Production URL: `https://fraud-academy-v1.vercel.app/`
- Verified public release-candidate demo: `https://deploy-preview-80--glittery-custard-26e360.netlify.app/`
- Vercel deployment record: `https://vercel.com/iamre2024-debugs-projects/fraud-academy-v1/DpMwF6VPN2aKQKVT9UPhPdQtizpp`
- Build command: `npm run build`
- Output directory: `dist`
- Release screenshot: `docs/screenshots/fraud-academy-v1-mobile.jpg`
- Authentication: not implemented
- Backend API: same-origin encrypted cloud-recovery endpoint implemented
- Hosted database: private Supabase recovery-envelope table implemented
- Environment secrets: required only by the server-side Vercel function; no credential is embedded in the browser bundle

Rollback is performed by redeploying the last known-good GitHub commit through the configured hosting project.

## Known limitations

1. Recovery-code synchronization connects devices but does not provide named user accounts, instructors, or shared multi-user cases.
2. Clearing browser storage requires the private recovery code to restore cloud-backed work; losing both local data and the recovery code prevents recovery.
3. There is no authentication, role-based access, learner roster, instructor console, or server audit trail.
4. Cloud storage is an encrypted recovery envelope, not a queryable case-management backend or server audit log.
5. Generated-case logic is training-oriented and is not a production fraud-modeling service.
6. Firefox and Safari are not yet part of the automated browser matrix.
7. A formal manual accessibility audit has not been recorded.
8. The current Android screenshot is versioned; a matching committed desktop screenshot is still pending.
9. The original Bible v2.1 and Display Bible source files are not versioned in this repository.
10. No repository license has been selected, so external reuse terms are not yet defined.

## Post-v1 backlog

Backlog items must preserve Evidence First, neutral pre-submission wording, Luna gating, training-safe labels, and the generated-case repository contract.

- Backend implementation behind the existing generated-case repository behavior
- Account and role model for learners, reviewers, and administrators
- Server-synchronized notes, tray items, progress, packages, and reports
- Instructor review and learner progress reporting
- Exportable learner-package and Case Report formats
- Expanded automated Firefox and WebKit coverage
- Formal accessibility audit and remediation record
- Deployment runbook, monitoring, backup, and rollback documentation
- Complete the curated desktop/mobile release screenshot pair
- Owner-selected repository license

The parked ten-module System Access portal is not a backlog commitment. Any future System Access expansion requires a new approved scope and must not be inferred from historical PR #1 or stale branches.

## External handoff checklist

- [x] Architecture overview
- [x] Data model and persistence boundaries
- [x] Fictional-data safety statement
- [x] Accessibility and supported-browser notes
- [x] Known limitations and post-v1 backlog
- [x] Deployment status recorded honestly
- [x] Verified release-candidate demo URL
- [x] Current Android release screenshot
- [ ] Original Bible visual sign-off against current screenshots
- [ ] Matching committed desktop screenshot
- [x] Permanent production URL
- [ ] Manual accessibility and non-Chromium browser validation
- [ ] Repository license selected by the owner

Until the unchecked items are completed or explicitly accepted, describe Fraud Academy as a verified internal user-acceptance candidate rather than a complete commercial/public release package.
