# Fraud Academy OS v1.0 Source of Truth

This document is the locked product compass for Fraud Academy OS v1.0.

## Product identity

Fraud Academy is a fictional Fraud Investigation Operating System. It is not just a simulator, quiz, generic dashboard, or case generator.

The purpose is to teach investigators how to investigate, think critically, connect evidence, document findings, and make defensible decisions using fictional training data.

## Core promise

One Case. One Workspace. One Investigation.

The Case Workspace is the heart of the app. The learner should feel like they are working a realistic bank, fintech, payroll, payment, or credit investigation from inside a polished fraud command center.

## Locked design direction

### Mobile

- Dark purple and pink neon theme.
- Bubbly/cloud cards with rounded, soft shapes.
- Cute gothic professional details such as moons, stars, hearts, cats, butterflies, sparkles, and soft glow accents.
- Bottom navigation.
- Feels like a magical investigator notebook that still belongs in a serious fraud training product.

### Desktop

- Fraud command center layout.
- Side/category rail for investigation families.
- Active center panel for the selected tool.
- Right-side Investigation Tray and Notebook.
- Feels wider, denser, and more operational than mobile.

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

- The screenshot-driven visual shell is the active app entrypoint. Keep the ornate desktop command-center layout and mobile bottom-navigation polish intact while reconnecting behavior.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and visual navigation tab through React state so case switching, generated-case opening, Tool Map, Open Evidence Center, and Submit Decision routing do not depend on DOM repair scripts.
- `src/VisualShellHeader.jsx` owns the ornate app header and active case strip, including the Case Queue dropdown. Keep the screenshot-driven header and case-switch classes intact.
- `src/visualWorkspaceModel.js` owns workspace constants, storage keys, row builders, and Case Report packet construction so `src/VisualWorkspace.jsx` can keep shrinking into focused React modules without changing the screenshot-driven shell.
- `src/ActiveToolPanel.jsx` owns the active category/tool renderer, including the sub-tool dropdown, search row, record table, expanded record lanes, pin actions, reviewed actions, and neutral report packet action. Keep the existing ornate activity-panel classes and Evidence First copy intact.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, Open Evidence Center routing, note compose/save UI, Case Report packet feed, and notebook list. Preserve case-scoped props and ornate tray/notebook classes.
- `src/CaseSummaryCard.jsx` owns the ornate Case Summary card, including neutral intake metadata, direct compact controls for transaction/payee and short-summary copy, Pin Case, quick tool routes, and Submit Decision jump. Keep the summary based on allegation/system-alert context only and do not reveal outcome.
- `src/CategoryTileRail.jsx` owns the ornate investigation category rail, including neutral reviewed counts, progress bars, active/reviewed state classes, and Tool Map routing. Keep category status neutral and never label evidence quality or case outcome.
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
- Bottom navigation plus Dashboard, Cases, Academy, and Progress panels are managed by React state in `src/VisualNavigation.jsx`; Navigation heading, Academy learning copy, and Progress package-status compact text are also owned directly by that module. Do not restore the retired DOM navigation patch or selector-based Navigation text discovery.
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
- `npm run verify` must preserve the Evidence First wording check, functional smoke guard, visual three-case smoke guard, generated-case repository smoke guard, Luna single-module smoke guard, review-package behavior smoke check, remaining-module depth guard, Navigation direct-collapse guard, Case Summary direct-collapse guard, and production build.
- `.github/workflows/build.yml` must also run Playwright against desktop and mobile Chromium for all three built-in cases, generated-case immediate open and persistence, the completed core modules, Connections → System Access Lane, and Luna’s pre-submission lock.
