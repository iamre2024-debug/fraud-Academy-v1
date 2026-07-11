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

For display work, use Fraud Academy Bible v2.1 as the consolidated source hierarchy and Fraud Academy Display Bible v1.0 - New Design Exploration as the authority for layout, hierarchy, navigation, responsive behavior, accessibility, and screen presentation. This Source of Truth remains authoritative for live repository architecture, safety locks, persistence boundaries, and implementation anchors.

The current screenshot-driven visual shell remains active until a focused display phase replaces a specific surface and passes the full verify and desktop/mobile browser gates. Preserve the recognizable dark purple, pink, and cyan identity, rounded glass surfaces, and playful professional details while improving hierarchy and reducing indiscriminate glow.

The runtime global navigation now uses Dashboard, Cases, Workspace, and Academy. Academy Progress remains fully supported through contextual Dashboard, Academy, and Agent-profile entry points rather than a fifth equal global destination.

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

- The screenshot-driven visual shell is the active app entrypoint and remains transitional. Keep it intact until each focused display phase in `docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md` passes verification and browser coverage.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and visual navigation tab through React state so case switching, generated-case opening, Tool Map, Open Evidence Center, and Submit Decision routing do not depend on DOM repair scripts.
- `src/VisualShellHeader.jsx` owns the ornate app header, functional Help, Settings, and Agent-profile controls, the persisted reduced-motion preference, and the active case strip with Case Queue dropdown. Keep every visible header control functional and training-safe.
- `src/displayPhaseOne.css` owns the four-column global navigation override, accessible header-control surfaces, contextual Academy Progress shortcut, and reduced-motion presentation behavior. It must not absorb later workflow-rail, glow-calibration, or mobile-record work.
- `src/visualWorkspaceModel.js` owns workspace constants, storage keys, row builders, and Case Report packet construction so `src/VisualWorkspace.jsx` can keep shrinking into focused React modules without changing the screenshot-driven shell.
- `src/useVisualWorkspaceCaseState.js` owns the six case-scoped browser-persistence slices for tray items, notes, reviewed tools, decision drafts, learner packages, and Case Report packets. Keep generated-case persistence separate behind `src/data/generatedCaseRepository.js`.
- `src/useVisualWorkspaceActions.js` owns pinning, note saving, reviewed-tool updates, neutral Case Report packet creation, decision-draft updates, checklist handling, and learner-package submission. Keep Luna package events and Evidence First wording inside this focused action boundary rather than rebuilding them inline in `src/VisualWorkspace.jsx`.
- `src/AcademyProgressPanel.jsx` owns saved-package progress summaries, neutral package snapshot counts, locked/unlocked status, and case-return actions. It may acknowledge that Luna debrief is available only after a saved package, but it must not expose Luna scoring or answer guidance.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer, including the sub-tool dropdown, search row, record table, expanded record lanes, pin actions, reviewed actions, and neutral report packet action. Keep the existing ornate activity-panel classes and Evidence First copy intact.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, Open Evidence Center routing, note compose/save UI, Case Report packet feed, and notebook list. Preserve case-scoped props and ornate tray/notebook classes.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake metadata, direct compact controls for transaction/payee and short-summary copy, Pin Case, quick tool routes, and Submit Decision jump. Keep the summary based on allegation/system-alert context only and do not reveal outcome.
- `src/CategoryTileRail.jsx` owns the ornate investigation category rail, including neutral reviewed counts, progress bars, active/reviewed state classes, and Tool Map routing. The category rail belongs inside the future Investigate workflow stage and is not the complete case workflow.
- `src/SubmitDecisionPanel.jsx` owns the locked Submit Decision visual panel. Keep its checklist, learner choice, confidence, rationale, and save action Evidence First; do not reveal Luna scoring or answer guidance before a learner package is saved.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper. Active Tool content, notebook/tray text, Case Report packet text, Submit Decision checklist messages, Luna coaching, Navigation heading, Academy learning copy, Progress package status, and Case Summary long copy use it directly. New module work must prefer this wrapper over selector discovery. Do not place direct More / Less controls inside another `<button>`; refactor the parent control first.
- `src/VisualTextCollapse.jsx` is an inert compatibility marker only. It must not contain selector lists, `querySelectorAll`, portals, event listeners, DOM mutation logic, or More / Less controls. All active compact text behavior is React-owned through `DirectCollapsibleText`.
- Notebook note entry buttons may expand or collapse their own note text. Keep note saving on the composer submit action, and do not nest direct More / Less buttons inside notebook entry buttons.
- Visual-shell Investigation Tray, case notes, reviewed tools, decision drafts, review packages, and Case Report packets persist in browser storage by case.
- Ornate category tiles must show neutral progress only: open, in progress, complete, reviewed count, and progress track. They must not label evidence quality or case outcome.
- Submit Decision remains locked until the required tool checklist, pinned evidence, case notes, learner choice, and evidence-based rationale are present.
- Submit Decision may display a neutral package input preview showing reviewed tools, pinned objects, notes, and Case Report packets that will snapshot into the saved learner package.
- Luna scoring, strengths, follow-up coaching, and decision-quality breakdown stay hidden until a review package is saved.
- `src/LunaPostSubmissionPanel.jsx` must resolve the active case from the live built-in/generated case catalog. Generated cases must never fall back to an unrelated built-in case for package reads, lock state, or post-submission debrief.
- Insider / Vendor / API / Open Banking records belong inside the core workspace tool switcher as the Connections → System Access Lane sub-tool. Do not restore a separate portal panel for this lane.
- `src/VisualNavigation.jsx` now renders exactly four permanent global destinations: Dashboard, Cases, Workspace, and Academy. The `progress` route and `AcademyProgressPanel` remain active through Dashboard, Academy, and Agent-profile shortcuts.
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
- Desktop category controls must remain pointer-accessible and must not be covered by sticky right-side investigation panels or the fixed bottom navigation.
- Display changes must not introduce required horizontal page scrolling. Dense mobile records should become cards, drawers, or another touch-friendly presentation during the dedicated responsive phase.
- `npm run verify` must preserve the Evidence First wording check, functional smoke guard, visual three-case smoke guard, generated-case repository smoke guard, Luna single-module smoke guard, review-package behavior smoke check, remaining-module depth guard, Navigation direct-collapse guard, Academy Progress package-flow guard, Case Summary direct-collapse guard, workspace case-state hook guard, workspace-action controller guard, display-handoff guard, Display Phase 1 global-shell guard, and production build.
- `.github/workflows/build.yml` must also run Playwright against desktop and mobile Chromium for all three built-in cases, generated-case immediate open and persistence, the completed core modules, Connections → System Access Lane, and Luna’s pre-submission lock.

## Next safe display item

After Display Phase 1 passes its full verify and browser gates, begin only Phase 2 from `docs/FRAUD_ACADEMY_DISPLAY_HANDOFF.md`: add the active-case workflow rail while keeping the existing investigation category rail inside Investigate. Do not combine broad glow calibration or mobile record conversion into that pull request.
