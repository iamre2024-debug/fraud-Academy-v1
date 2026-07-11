# Fraud Academy OS v1.0 Source of Truth

This document is the locked product compass for Fraud Academy OS v1.0.

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

The completed release-readiness audit and remaining packaging gaps live in:

```text
docs/FRAUD_ACADEMY_RELEASE_READINESS.md
```

The documentation-only external handoff bundle lives in:

```text
docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md
```

For display work, use Fraud Academy Bible v2.1 as the consolidated source hierarchy and Fraud Academy Display Bible v1.0 - New Design Exploration as the authority for layout, hierarchy, navigation, responsive behavior, accessibility, and screen presentation. This Source of Truth remains authoritative for live repository architecture, safety locks, persistence boundaries, and implementation anchors.

GitHub Issue #22 and the approved theme v1 references now lock the screen-by-screen replacement order: Dashboard, Cases, Workspace, Case Briefing, Customer 360, Investigation tools, Timeline, Decision & Luna, Academy, Profile, then final responsive/mobile polish. Each screen must be redesigned in isolation, verified on desktop and mobile, and merged before the next screen begins.

The screenshot-driven visual shell remains active for surfaces that have not yet been replaced. The Dashboard is the first approved replacement and now uses the light lavender and white, mobile-first presentation in `src/displayDashboardThemeV1.css`. Preserve working routes, case data, responsive behavior, and architecture while each later surface is replaced.

The runtime global navigation now uses Dashboard, Cases, Workspace, and Academy. Academy Progress remains fully supported through contextual Dashboard, Academy, and Agent-profile entry points rather than a fifth equal global destination.

The active case now exposes the approved seven-stage workflow rail: Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief. The existing category rail remains inside Investigate, and all pre-submission status language stays neutral.

Display Phase 3 calibrates hierarchy and glow through a focused final CSS override. Strong glow is reserved for selected and focus states, decorative saturation is reduced, and primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states are visually distinct without changing investigation behavior.

Display Phase 4 preserves semantic desktop record tables while converting dense investigation rows into labeled, touch-friendly cards at phone widths. The responsive layer uses existing row data and actions, adds no horizontal scroller, and does not touch case persistence, generated-case storage, Evidence First, Luna gating, or System Access architecture.

Display Phase 5 audits the exact merged display tree, records runtime and release-package status honestly, and adds generated-case reload coverage without changing runtime presentation or investigation behavior.

The release package centralizes the architecture, data and persistence boundaries, fictional-data safety statement, accessibility and browser status, deployment status, known limitations, and post-v1 backlog without changing runtime code.

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

Tools should not feel like static reports unless the tool is specifically a deep lookup or generated report tool. Most tools should feel like investigation panels: snapshot first, then searchable records, histories, links, and evidence actions.

## Training-safe wording

Use fictional, training-safe labels in the UI and generated evidence:

- SSN = Training ID
- Routing Number = Bank Code
- Account Number = Destination ID
- Bank Verification = Payment Verification

## Case Workspace families

### Case Summary

Investigator question: Why am I investigating this case?

Case Summary explains why the case exists using only the customer allegation or system alert. It does not reveal the answer.

### Identity

Investigator question: Who am I investigating?

Includes Customer 360 and Identity Intelligence. Customer 360 should include customer profile, contact details, account age, profile change history, relationship snapshot, and customer intake where applicable.

### Digital Activity

Investigator question: Can I verify or challenge the story using access behavior?

Includes Login History, Session History, Device Intelligence, IP Intelligence, and profile/access activity. These tools compare normal customer behavior against the session being investigated.

### Financial

Investigator question: Does the money movement make sense?

Includes Transaction History, Financial Intelligence, Payment Verification, destination records, balance behavior, merchant/payment context, and account activity patterns.

### Business

Investigator question: Is the business, employee, payroll, or merchant relationship real?

Includes Business 360, Business Intelligence, Employee Profile, Payroll History, merchant records, KYB-style review, and business relationship verification.

### Evidence

Investigator question: What evidence do I have, what is missing, and what supports the final decision?

Includes Evidence Center, Document Viewer, customer documents, platform records, uploaded items, system records, and generated case packets.

### Connections

Investigator question: How does everything connect?

Includes Link Analysis, shared identifiers, repeated Training IDs, phone/email/device/IP/address/payment relationships, system-access records, and cross-case connections. Before submission, this must show relationships neutrally without labeling them as red flags, green flags, or final risk conclusions.

### Investigation

Investigator question: What have I completed, what still needs review, and how do I document the decision?

Includes Investigation Tray, Notebook, Timeline, Case Report, submit decision flow, and post-submission Luna debrief.

## Current v1.0 implementation anchors

- The screenshot-driven visual shell is the active app entrypoint for surfaces that have not yet been replaced. Keep each untouched surface intact until its focused screen redesign passes verification and browser coverage.
- `docs/FRAUD_ACADEMY_RELEASE_READINESS.md` is the Phase 5 release audit. It may approve the runtime for internal user acceptance while still listing unresolved commercial packaging gaps; do not silently upgrade that verdict.
- `docs/FRAUD_ACADEMY_RELEASE_PACKAGE.md` is the documentation-only external handoff bundle. It must stay aligned with the live architecture, preserve the internal-UAT verdict, and list unresolved owner-selected or environment-specific release items honestly.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and visual navigation tab through React state so case switching, generated-case opening, Tool Map, Open Evidence Center, and Submit Decision routing do not depend on DOM repair scripts.
- `src/VisualShellHeader.jsx` owns the ornate app header, functional Help, Settings, and Agent-profile controls, the persisted reduced-motion preference, and the active case strip with Case Queue dropdown. Keep every visible header control functional and training-safe.
- `src/ActiveCaseWorkflowRail.jsx` owns the seven-stage active-case workflow, accessible current-step state, and neutral stage status copy. Case Briefing scrolls to the allegation/system-alert summary, Investigate returns to the category rail, Timeline and Summary open their existing tools, Indicators opens the neutral Evidence Center, Determination preserves the locked Submit Decision checklist, and Debrief routes to the locked/unlocked Luna panel.
- `src/displayPhaseOne.css` owns the four-column global navigation override, accessible header-control surfaces, contextual Academy Progress shortcut, and reduced-motion presentation behavior. It must not absorb later workflow-rail, glow-calibration, or mobile-record work.
- `src/displayPhaseTwo.css` owns only the active-case workflow rail layout, active/focus/status presentation, and compact responsive wrapping. It must not perform the Phase 3 glow calibration or Phase 4 mobile record conversion.
- `src/displayPhaseThree.css` owns hierarchy and glow calibration only. It reduces repeated decorative saturation, reserves stronger glow for selected and focus states, formalizes primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states, and must not change record layouts, mobile table behavior, persistence, or investigation logic.
- `src/displayPhaseFour.css` owns responsive investigation-record presentation only. It preserves the desktop table, hides the desktop header at 760 pixels and below, uses each cell's `data-field` label to build a card, keeps action controls thumb-friendly, and must not add horizontal scrolling, fixed overlays, persistence access, or investigation behavior.
- `src/displayDashboardThemeV1.css` owns only the approved Dashboard replacement. It may hide unreplaced workspace surfaces while the Dashboard tab is active, but it must remain scoped to `body[data-visual-tab="dashboard"]`, preserve the four-item navigation, keep the active-case resume path functional, avoid required horizontal scrolling, and never access persistence or investigation logic.
- `src/VisualNavigation.jsx` owns the approved Dashboard cards and shortcuts while continuing to render exactly four permanent global destinations: Dashboard, Cases, Workspace, and Academy. The `progress` route and `AcademyProgressPanel` remain active through Dashboard, Academy, and Agent-profile shortcuts.
- `src/visualWorkspaceModel.js` owns workspace constants, storage keys, row builders, and Case Report packet construction so `src/VisualWorkspace.jsx` can keep shrinking into focused React modules without changing the screenshot-driven shell.
- `src/useVisualWorkspaceCaseState.js` owns the six case-scoped browser-persistence slices for tray items, notes, reviewed tools, decision drafts, learner packages, and Case Report packets. Keep generated-case persistence separate behind `src/data/generatedCaseRepository.js`.
- `src/useVisualWorkspaceActions.js` owns pinning, note saving, reviewed-tool updates, neutral Case Report packet creation, decision-draft updates, checklist handling, and learner-package submission. Keep Luna package events and Evidence First wording inside this focused action boundary rather than rebuilding them inline in `src/VisualWorkspace.jsx`.
- `src/AcademyProgressPanel.jsx` owns saved-package progress summaries, neutral package snapshot counts, locked/unlocked status, and case-return actions. It may acknowledge that Luna debrief is available only after a saved package, but it must not expose Luna scoring or answer guidance.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer, including the sub-tool dropdown, search row, semantic record table, responsive `data-field` labels, neutral empty-search state, expanded record lanes, pin actions, reviewed actions, and neutral report packet action. Keep Evidence First copy and the existing record/action behavior intact.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, Open Evidence Center routing, note compose/save UI, Case Report packet feed, and notebook list. Preserve case-scoped props and ornate tray/notebook classes.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake metadata, direct compact controls for transaction/payee and short-summary copy, Pin Case, quick tool routes, and Submit Decision jump. Keep the summary based on allegation/system-alert context only and do not reveal outcome.
- `src/CategoryTileRail.jsx` owns the ornate investigation category rail, including neutral reviewed counts, progress bars, active/reviewed state classes, and Tool Map routing. It is rendered inside the Investigate workflow stage and is not the complete case workflow.
- `src/SubmitDecisionPanel.jsx` owns the locked Submit Decision visual panel. Keep its checklist, learner choice, confidence, rationale, and save action Evidence First; do not reveal Luna scoring or answer guidance before a learner package is saved.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper. Active Tool content, notebook/tray text, Case Report packet text, Submit Decision checklist messages, Luna coaching, Navigation heading, Academy learning copy, Progress package status, and Case Summary long copy use it directly. New module work must prefer this wrapper over selector discovery. Do not place direct More / Less controls inside another `<button>`; refactor the parent control first.
- `src/VisualTextCollapse.jsx` is an inert compatibility marker only. It must not contain selector lists, `querySelectorAll`, portals, event listeners, DOM mutation logic, or More / Less controls. All active compact text behavior is React-owned through `DirectCollapsibleText`.
- Notebook note entry buttons may expand or collapse their own note text. Keep note saving on the composer submit action, and do not nest direct More / Less buttons inside notebook entry buttons.
- Visual-shell Investigation Tray, case notes, reviewed tools, decision drafts, review packages, and Case Report packets persist in browser storage by case.
- Ornate category tiles and workflow stages must show neutral progress only: open, in progress, complete, reviewed counts, collected item counts, ready, available, or locked. They must not label evidence quality or case outcome.
- Submit Decision remains locked until the required tool checklist, pinned evidence, case notes, learner choice, and evidence-based rationale are present.
- Submit Decision may display a neutral package input preview showing reviewed tools, pinned objects, notes, and Case Report packets that will snapshot into the saved learner package.
- Luna scoring, strengths, follow-up coaching, and decision-quality breakdown stay hidden until a review package is saved.
- `src/LunaPostSubmissionPanel.jsx` must resolve the active case from the live built-in/generated case catalog. Generated cases must never fall back to an unrelated built-in case for package reads, lock state, or post-submission debrief.
- Insider / Vendor / API / Open Banking records belong inside the core workspace tool switcher as the Connections → System Access Lane sub-tool. Do not restore a separate portal panel for this lane.
- The `fraud-academy:package-saved` event must refresh Navigation package snapshots in the same browser session so Dashboard and Academy Progress never require a reload to reflect a newly saved learner package.
- Compact More / Less controls must be React-owned through `src/DirectCollapsibleText.jsx`; keep long copy collapsed by default. The retired selector-based compatibility scanner must not return, and the retired `src/visualTextCollapse.js` patch must not return.
- Generated cases must open immediately, join the live case catalog, remain Evidence First, and preserve case-scoped notes, tray, progress, decision drafts, packages, and reports.
- `src/data/generatedCaseRepository.js` is the generated-case persistence boundary. UI modules must use its asynchronous repository API instead of calling browser storage directly.
- IndexedDB is the primary generated-case store. Existing localStorage cases and sequence metadata migrate once into IndexedDB, while localStorage remains a safe fallback when IndexedDB is unavailable.
- Future backend persistence must implement the same repository-facing behavior so `VisualApp`, case generation, and the investigation workspace do not need backend-specific rewrites.
- The generated-case queue must not impose an arbitrary application count cap. Unique IDs must survive rapid generation, and automated verification must cover more than 50 generated cases.
- The old `src/visualInvestigationRepair.js` route patch is retired. Do not restore DOM repair logic for Device IDs, Case Summary metadata, Submit Decision routing, Tool Map, or Open Evidence Center.
- `src/data/coreToolRecords.js` is a focused display overlay for deeper Payment Verification, Business Intelligence, Evidence Center, Link Analysis, Timeline, and Case Report records. It must not replace `visualWorkspaceModel.js`, browser case state, or the generated-case repository boundary.
- The deeper Case Report view must preserve saved neutral report packet rows from the existing case-scoped packet feed.
- Do not carry forward the retired PR #2 `src/data/caseStorage.js` or direct `src/data/generatedCases.js` storage rewrites. Backend readiness must continue through `src/data/generatedCaseRepository.js`.
- The single Connections → System Access Lane stays available, but the parked ten-module System Access portal must not be revived.
- Desktop category and workflow controls must remain pointer-accessible and must not be covered by sticky right-side investigation panels or the fixed bottom navigation.
- Display changes must not introduce required horizontal page scrolling. Phone-width records use labeled cards instead of a horizontal table scroller.
- `tests/browser-smoke.spec.mjs` verifies the approved Dashboard on desktop and Pixel 7, all three built-in cases, generated-case immediate open, uniqueness, reload persistence, completed core tools, the single System Access Lane, desktop record headers, Pixel 7 record cards, no page overflow, and Luna's pre-submission lock.
- `npm run verify` must preserve the Evidence First wording check, functional smoke guard, visual three-case smoke guard, generated-case repository smoke guard, Luna single-module smoke guard, review-package behavior smoke check, remaining-module depth guard, Navigation direct-collapse guard, Academy Progress package-flow guard, Case Summary direct-collapse guard, workspace case-state hook guard, workspace-action controller guard, display-handoff guard, Display Phase 1 global-shell guard, Display Phase 2 workflow-rail guard, Display Phase 3 hierarchy-and-glow guard, Display Phase 4 responsive-record guard, Display Phase 5 release-readiness guard, Dashboard approved-theme v1 guard, release-package documentation guard, and production build.
- `.github/workflows/build.yml` must also run Playwright against desktop and mobile Chromium for the approved Dashboard, all three built-in cases, generated-case immediate open and reload persistence, the completed core modules, Connections → System Access Lane, Luna’s pre-submission lock, the active-case workflow surface, and responsive record presentation.

## Next safe item

The approved Dashboard redesign is complete and protected by focused static and browser guards. The next isolated safe item is the Cases redesign only. Preserve the case catalog, generated cases, active-case switching, IndexedDB-first persistence, Evidence First, Luna gating, the four-item global navigation, and the single Connections → System Access Lane. Do not begin Workspace, Case Briefing, or tool redesign in the same pull request.
