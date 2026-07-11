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

The approved Investigation tools handoff lives in:

```text
docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md
```

The approved Timeline handoff lives in:

```text
docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md
```

The approved Decision & Luna handoff lives in:

```text
docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md
```

The approved Academy handoff lives in:

```text
docs/FRAUD_ACADEMY_ACADEMY_THEME_V1.md
```

The approved Profile handoff lives in:

```text
docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md
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

The screenshot-driven visual shell remains active for surfaces that have not yet been replaced. Dashboard, Cases, the Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision & Luna, Academy, and Profile are the completed approved replacements. Dashboard uses the light lavender and white, mobile-first presentation in `src/displayDashboardThemeV1.css`; Cases uses `src/CasesThemeV1Panel.jsx` and `src/displayCasesThemeV1.css`; the Workspace shell uses the compact Workspace-only header in `src/VisualShellHeader.jsx`, `src/displayWorkspaceShellThemeV1.css`, and `src/displayWorkspaceShellLayoutV1.css`; Case Briefing uses `src/CaseSummaryCard.jsx`, `src/displayCaseBriefingThemeV1.css`, and `src/displayCaseBriefingRoutesV1.css`; Customer 360 uses `src/Customer360Panel.jsx` and `src/displayCustomer360ThemeV1.css`; Investigation tools use `src/investigationToolGroups.js`, `src/InvestigationToolPanel.jsx`, and `src/displayInvestigationToolsThemeV1.css`; Timeline uses `src/TimelinePanel.jsx` and `src/displayTimelineThemeV1.css`; Decision & Luna use `src/SubmitDecisionPanel.jsx`, `src/LunaPostSubmissionPanel.jsx`, `src/displayDecisionLunaThemeV1.css`, and `src/displayDecisionLunaLayoutSafetyV1.css`; Academy uses `src/AcademyThemeV1Panel.jsx`, `src/displayAcademyThemeV1.css`, and `src/displayAcademyThemeV1Safety.css`; Profile uses `src/ProfileThemeV1Panel.jsx`, `src/displayProfileThemeV1.css`, and `src/displayProfileThemeV1Safety.css`. Preserve working routes, case data, responsive behavior, and architecture while each later surface is replaced.

The runtime global navigation now uses Dashboard, Cases, Workspace, and Academy. Academy Progress remains fully supported through contextual Dashboard, Academy, and Agent-profile entry points rather than a fifth equal global destination.

The active case now exposes the approved seven-stage workflow rail: Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief. The approved contextual tool-group rail remains inside Investigate, and all pre-submission status language stays neutral.

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

### Case Briefing

Investigator question: Why am I investigating this case?

Case Briefing explains why the case exists using only the customer allegation or system alert. It does not reveal the answer.

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
- `docs/FRAUD_ACADEMY_CASES_THEME_V1.md` is the approved Cases screen handoff. It records the isolated queue scope, protected behavior, and completed verification gate.
- `docs/FRAUD_ACADEMY_WORKSPACE_SHELL_THEME_V1.md` is the approved Workspace shell handoff. It records the compact shell scope, protected behavior, and desktop/mobile verification.
- `docs/FRAUD_ACADEMY_CASE_BRIEFING_THEME_V1.md` is the approved Case Briefing handoff. It records the card-grid scope, neutral allegation/system-alert context, preserved quick routes, and desktop/mobile verification.
- `docs/FRAUD_ACADEMY_CUSTOMER_360_THEME_V1.md` is the approved Customer 360 handoff. It records the complete identity dossier, profile-change history, claim-specific neutral context, preserved evidence actions and routes, and responsive verification.
- `docs/FRAUD_ACADEMY_INVESTIGATION_TOOLS_THEME_V1.md` is the approved Investigation tools handoff. It records the six contextual groups, neutral working questions, preserved record actions and routes, and responsive verification.
- `docs/FRAUD_ACADEMY_TIMELINE_THEME_V1.md` is the approved Timeline handoff. It records case-scoped event ordering, neutral source verification, preserved evidence actions and routes, responsive verification, and the Decision & Luna-only next step.
- `docs/FRAUD_ACADEMY_DECISION_LUNA_THEME_V1.md` is the approved Decision & Luna handoff. It records the Evidence First determination workspace, case-scoped learner package, locked and unlocked Luna states, and responsive verification.
- `docs/FRAUD_ACADEMY_ACADEMY_THEME_V1.md` is the approved Academy handoff. It records the Evidence First learning center, four learning paths, Fraud Library, neutral achievement guidance, contextual Academy Progress, responsive isolation, runtime PR #43, verified head `11ee589509368a75e049c67474d1a1e648d9911a`, merge commit `c7154d9b66c1446cdc32f34b2148b8eb83a70be7`.
- `docs/FRAUD_ACADEMY_PROFILE_THEME_V1.md` is the completed Profile handoff. It records the contextual avatar-owned profile, activity-based investigator rank, skill proficiency, badges, saved-work summary, active-case goals, runtime PR #47, verified head `000c90b87984d41cd01a093a790457fb187ec7a3`, merge commit `01e25967098594dbe67d4c523d12fe249e810564`, and the final responsive/mobile polish-only next step.
- `src/VisualApp.jsx` coordinates the active case, live case catalog, and visual navigation tab through React state so case switching, generated-case opening, Tool Map, Open Evidence Center, Submit Decision, Case Summary, and Return to Queue routing do not depend on DOM repair scripts. It mounts the Cases replacement against the same live built-in/generated catalog and existing `onOpenCase` route.
- `src/VisualShellHeader.jsx` owns the compact approved Workspace header, functional Help, Settings, and Agent-profile controls, the persisted reduced-motion preference, and the active case strip with Case Queue dropdown. Keep every visible header control functional and training-safe.
- `src/ActiveCaseWorkflowRail.jsx` owns the seven-stage active-case workflow, accessible current-step state, and neutral stage status copy. Case Briefing scrolls to the allegation/system-alert summary, Investigate returns to the contextual tool-group rail, Timeline and Summary open their existing tools, Indicators opens the neutral Evidence Center, Determination opens the approved Evidence First Decision workspace, and Debrief routes to the locked/unlocked Luna panel.
- `src/displayPhaseOne.css` owns the four-column global navigation override, accessible header-control surfaces, contextual Academy Progress shortcut, and reduced-motion presentation behavior. It must not absorb later workflow-rail, glow-calibration, or mobile-record work.
- `src/displayPhaseTwo.css` owns only the active-case workflow rail layout, active/focus/status presentation, and compact responsive wrapping. It must not perform the Phase 3 glow calibration or Phase 4 mobile record conversion.
- `src/displayPhaseThree.css` owns hierarchy and glow calibration only. It reduces repeated decorative saturation, reserves stronger glow for selected and focus states, formalizes primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states, and must not change record layouts, mobile table behavior, persistence, or investigation logic.
- `src/displayPhaseFour.css` owns responsive investigation-record presentation only. It preserves the desktop table, hides the desktop header at 760 pixels and below, uses each cell's `data-field` label to build a card, keeps action controls thumb-friendly, and must not add horizontal scrolling, fixed overlays, persistence access, or investigation behavior.
- `src/displayDashboardThemeV1.css` owns only the approved Dashboard replacement. It may hide unreplaced workspace surfaces while the Dashboard tab is active, but it must remain scoped to `body[data-visual-tab="dashboard"]`, preserve the four-item navigation, keep the active-case resume path functional, avoid required horizontal scrolling, and never access persistence or investigation logic.
- `src/CasesThemeV1Panel.jsx` owns the approved Cases queue: neutral totals, search, priority filtering, sorting, Detail and Compact views, status/origin filters, selected-case preview, and direct case opening. It may read the established learner-package snapshot only to display Completed state, but it must not generate cases, write persistence data, or duplicate the generated-case repository.
- `src/displayCasesThemeV1.css` owns only the approved Cases presentation. It must remain scoped to `body[data-visual-tab="cases"]`, preserve keyboard focus and responsive no-overflow behavior, and must not absorb Workspace, Case Briefing, Customer 360, tool, Timeline, Decision/Luna, Academy, or Profile redesign work.
- `src/displayWorkspaceShellThemeV1.css` and `src/displayWorkspaceShellLayoutV1.css` own only the approved Workspace shell presentation and width-safety corrections. They must remain scoped to `body[data-visual-tab="workspace"]`, preserve the compact header, case switcher, generated-case controls, seven-stage workflow, four-item navigation, keyboard focus, and desktop/Pixel 7 no-overflow behavior, and must not absorb Case Briefing or later screen redesigns.
- `src/CaseSummaryCard.jsx` owns the approved Case Briefing card grid: case overview, neutral allegation/system-alert summary, intake facts, at-a-glance metrics, investigator prompts, process-only Luna guidance, recent documents, direct compact text controls, Pin Case, utility routes, Identity Intelligence and Login History quick routes, and the Submit Decision jump. `src/displayCaseBriefingThemeV1.css` owns the approved responsive briefing presentation, while `src/displayCaseBriefingRoutesV1.css` preserves the established route shell and focused quick-route layout. None of these files may access generated-case persistence or expose an outcome before submission.
- `src/Customer360Panel.jsx` owns the approved Customer 360 dossier: identity, contacts, products and accounts, relationship overview, security/access summary, current case, customer contact, prior claims, profile-change events, claim-specific context, related records, preserved search/tool/pin/note/report/review actions, and Submit Decision routing. `src/displayCustomer360ThemeV1.css` owns only its light lavender and white responsive presentation. Neither file may access generated-case persistence, expand System Access, or expose an outcome before submission.
- `src/investigationToolGroups.js` owns the six approved contextual groups: Identity & Customer; Login, Device & IP; Transactions & Financial; Business & Payment Verification; Evidence & Documents; and Links & Related Cases. Timeline now uses its approved dedicated renderer, while Case Report remains in Workflow Review until its later isolated redesign.
- `src/InvestigationToolPanel.jsx` owns the approved deep-tool record workspace: one neutral working question, tool switching inside the active group, search, record cards, expanded detail, History, Link Analysis, neutral report packets, pinning, notes, reviewed state, Timeline/Case Report routes, and Submit Decision routing. It must preserve the existing row builders and `useVisualWorkspaceActions.js` boundaries.
- `src/displayInvestigationToolsThemeV1.css` owns only the approved Investigation-tools presentation. It must remain scoped to `body[data-visual-tab="workspace"]`, preserve keyboard focus, 44-pixel controls, desktop two-column review, Pixel 7 stacked review, and no required horizontal page scrolling, and must not access persistence or absorb Timeline, Decision/Luna, Academy, or Profile redesign work.
- `src/TimelinePanel.jsx` owns the approved Timeline workspace: neutral event metrics, search, source filtering, sequence cards, expanded source review, pinning, notes, neutral report packets, reviewed state, and routes to Evidence Center, Case Report, and locked Submit Decision. `src/displayTimelineThemeV1.css` owns only its responsive light-lavender and white presentation. Neither file may access generated-case persistence, expand System Access, or reveal an outcome before submission.
- `src/SubmitDecisionPanel.jsx` owns the approved Decision workspace: neutral readiness metrics, checklist messages, package inputs, lane-organized learner choices, confidence, evidence-based rationale, package saving, and submission confirmation. It must remain Evidence First and must not expose Luna scoring, answer guidance, or a case conclusion before submission.
- `src/LunaPostSubmissionPanel.jsx` owns the approved locked and post-submission Luna states. It resolves the active built-in or generated case, refreshes immediately from the case-scoped package-saved event, shows no scoring or coaching while locked, and displays the saved determination, senior review, strengths, follow-ups, and decision-quality breakdown only after a learner package exists.
- `src/displayDecisionLunaThemeV1.css` owns the approved light-lavender Decision and Luna presentation. `src/displayDecisionLunaLayoutSafetyV1.css` owns focused Determination/Luna viewport containment and phone gutters. Neither file may access persistence, expand System Access, or add fixed overlays.
- `src/AcademyThemeV1Panel.jsx` owns the approved Academy learning center: neutral Evidence First learning paths, Fraud Library topics, achievement guidance, and functional routes to Workspace, Cases, and contextual Academy Progress. `src/displayAcademyThemeV1.css` owns its light-lavender responsive presentation, while `src/displayAcademyThemeV1Safety.css` isolates Academy from unreplaced Workspace surfaces without changing their runtime behavior. These files must not access generated-case persistence, calculate Luna scoring, expand System Access.
- `src/ProfileThemeV1Panel.jsx` owns the approved contextual Agent profile: activity-based investigator rank, neutral saved-work metrics, skill proficiency, badges, activity summary, active-case goals, and routes to Workspace, Academy, and Academy Progress. `src/displayProfileThemeV1.css` owns its responsive presentation, while `src/displayProfileThemeV1Safety.css` isolates Profile from Workspace surfaces. Profile must not become a fifth global destination, access generated-case persistence, calculate Luna scoring, expand System Access, or absorb final polish work.
- `src/VisualNavigation.jsx` owns the approved Dashboard cards and shortcuts while continuing to render exactly four permanent global destinations: Dashboard, Cases, Workspace, and Academy. The `progress` route and `AcademyProgressPanel` remain active through Dashboard, Academy, and Agent-profile shortcuts.
- `src/visualWorkspaceModel.js` owns workspace constants, storage keys, row builders, and Case Report packet construction so `src/VisualWorkspace.jsx` can keep shrinking into focused React modules without changing the screenshot-driven shell.
- `src/useVisualWorkspaceCaseState.js` owns the six case-scoped browser-persistence slices for tray items, notes, reviewed tools, decision drafts, learner packages, and Case Report packets. Keep generated-case persistence separate behind `src/data/generatedCaseRepository.js`.
- `src/useVisualWorkspaceActions.js` owns pinning, note saving, reviewed-tool updates, neutral Case Report packet creation, decision-draft updates, checklist handling, and learner-package submission. Keep Luna package events and Evidence First wording inside this focused action boundary rather than rebuilding them inline in `src/VisualWorkspace.jsx`.
- `src/AcademyProgressPanel.jsx` owns saved-package progress summaries, neutral package snapshot counts, locked/unlocked status, and case-return actions. It may acknowledge that Luna debrief is available only after a saved package, but it must not expose Luna scoring or answer guidance.
- `src/ActiveToolPanel.jsx` remains the Case Report renderer until its later isolated redesign step. Keep Evidence First copy and the existing record/action behavior intact.
- `src/BottomInvestigationGrid.jsx` owns the Investigation Tray and Investigation Notebook cards, including pinned objects, Open Evidence Center routing, note compose/save UI, Case Report packet feed, and notebook list. Preserve case-scoped props and ornate tray/notebook classes.
- `src/CategoryTileRail.jsx` owns the approved contextual investigation group rail, including neutral reviewed counts, progress bars, active/reviewed state classes, each group's investigator question, and Tool Map routing. It is rendered inside the Investigate workflow stage and is not the complete case workflow.
- `src/DirectCollapsibleText.jsx` is the reusable direct React compact-text wrapper. Active Tool content, notebook/tray text, Case Report packet text, Submit Decision checklist messages, Luna coaching, Navigation heading, Academy learning copy, Progress package status, and Case Briefing long copy use it directly. New module work must prefer this wrapper over selector discovery. Do not place direct More / Less controls inside another `<button>`; refactor the parent control first.
- `src/VisualTextCollapse.jsx` is an inert compatibility marker only. It must not contain selector lists, `querySelectorAll`, portals, event listeners, DOM mutation logic, or More / Less controls. All active compact text behavior is React-owned through `DirectCollapsibleText`.
- Notebook note entry buttons may expand or collapse their own note text. Keep note saving on the composer submit action, and do not nest direct More / Less buttons inside notebook entry buttons.
- Visual-shell Investigation Tray, case notes, reviewed tools, decision drafts, review packages, and Case Report packets persist in browser storage by case.
- Ornate category tiles and workflow stages must show neutral progress only: open, in progress, complete, reviewed counts, collected item counts, ready, available, or locked. They must not label evidence quality or case outcome.
- Submit Decision remains locked until the required tool checklist, pinned evidence, case notes, learner choice, and evidence-based rationale are present.
- Submit Decision may display a neutral package input preview showing reviewed tools, pinned objects, notes, and Case Report packets that will snapshot into the saved learner package.
- Luna scoring, strengths, follow-up coaching, and decision-quality breakdown stay hidden until a review package is saved.
- Insider / Vendor / API / Open Banking records belong inside the core workspace tool switcher as the Connections → System Access Lane sub-tool. Do not restore a separate portal panel for this lane.
- The `fraud-academy:package-saved` event must refresh Navigation package snapshots and the active Luna panel in the same browser session so Dashboard, Academy Progress, and the post-submission debrief never require a reload to reflect a newly saved learner package.
- Compact More / Less controls must be React-owned through `src/DirectCollapsibleText.jsx`; keep long copy collapsed by default. The retired selector-based compatibility scanner must not return, and the retired `src/visualTextCollapse.js` patch must not return.
- Generated cases must open immediately, join the live case catalog, remain Evidence First, and preserve case-scoped notes, tray, progress, decision drafts, packages, and reports.
- `src/data/generatedCaseRepository.js` is the generated-case persistence boundary. UI modules must use its asynchronous repository API instead of calling browser storage directly.
- IndexedDB is the primary generated-case store. Existing localStorage cases and sequence metadata migrate once into IndexedDB, while localStorage remains a safe fallback when IndexedDB is unavailable.
- Future backend persistence must implement the same repository-facing behavior so `VisualApp`, case generation, and the investigation workspace do not need backend-specific rewrites.
- The generated-case queue must not impose an arbitrary application count cap. Unique IDs must survive rapid generation, and automated verification must cover more than 50 generated cases.
- The old `src/visualInvestigationRepair.js` route patch is retired. Do not restore DOM repair logic for Device IDs, Case Briefing metadata, Submit Decision routing, Tool Map, or Open Evidence Center.
- `src/data/coreToolRecords.js` is a focused display overlay for deeper Payment Verification, Business Intelligence, Evidence Center, Link Analysis, Timeline, and Case Report records. It must not replace `visualWorkspaceModel.js`, browser case state, or the generated-case repository boundary.
- The deeper Case Report view must preserve saved neutral report packet rows from the existing case-scoped packet feed.
- Do not carry forward the retired PR #2 `src/data/caseStorage.js` or direct `src/data/generatedCases.js` storage rewrites. Backend readiness must continue through `src/data/generatedCaseRepository.js`.
- The single Connections → System Access Lane stays available, but the parked ten-module System Access portal must not be revived.
- Desktop category and workflow controls must remain pointer-accessible and must not be covered by sticky right-side investigation panels or the fixed bottom navigation.
- Display changes must not introduce required horizontal page scrolling. Phone-width records use labeled cards instead of a horizontal table scroller.
- `tests/browser-smoke.spec.mjs` verifies the approved Dashboard, Cases queue, and contextual Investigation-tool workspace on desktop and Pixel 7, neutral Cases search/filter/preview behavior, all three built-in cases, generated-case immediate open, uniqueness, queue visibility, reload persistence, completed core tools, the single System Access Lane, responsive records, no page overflow, and Luna's pre-submission lock.
- `tests/workspace-shell-browser.spec.mjs` verifies the approved Workspace shell on desktop and Pixel 7, including the compact header, Help control, active-case switcher, seven workflow stages, desktop seven-column and mobile two-column layouts, width safety, and Evidence First lock.
- `tests/case-briefing-browser.spec.mjs` verifies the approved Case Briefing on desktop and Pixel 7, including the card-grid hierarchy, active-case switching, six utility routes, preserved Identity Intelligence, Login History, and Submit Decision quick routes, Customer 360 investigation entry, viewport safety, and Luna's pre-submission lock.
- `tests/customer-360-browser.spec.mjs` verifies the approved Customer 360 on desktop and Pixel 7, including its complete dossier, profile-change history, claim-specific context, search, reviewed state, built-in case switching, related-tool routes, responsive card layout, viewport safety, Evidence First, and Luna's pre-submission lock.
- `tests/investigation-tools-browser.spec.mjs` verifies the approved Investigation tools on desktop and Pixel 7, including the six contextual groups, tool routing, search, record expansion, pinning, notes, neutral report packets, reviewed state, Timeline routing, built-in case switching, responsive two-column/stacked layouts, viewport safety, Evidence First, and Luna's pre-submission lock.
- `tests/timeline-browser.spec.mjs` verifies the approved Timeline on desktop and Pixel 7, including event ordering, search, source filtering, expansion, pinning, notes, neutral report packets, reviewed state, workflow routing, built-in case switching, viewport safety, Evidence First, and Luna's pre-submission lock.
- `tests/decision-luna-browser.spec.mjs` verifies the approved Decision & Luna flow on desktop and Pixel 7, including Evidence First lock copy, package readiness, learner choice, confidence, rationale, saved-package submission, immediate and persisted Luna unlock, debrief routes, viewport containment, and Return to Queue.
- `tests/academy-browser.spec.mjs` verifies the approved Academy on desktop and Pixel 7, including the four learning paths, neutral copy, contextual Academy Progress, Cases and Workspace routes, isolation from unreplaced Workspace surfaces, and viewport safety.
- `tests/profile-browser.spec.mjs` verifies the approved contextual Profile on desktop and Pixel 7, including avatar entry from Workspace and Dashboard, neutral rank, skill, badge, activity, and goal metrics, Workspace, Academy, and Academy Progress routes, four-item navigation, isolation, and viewport safety.
- `npm run verify` must preserve the Evidence First wording check, functional smoke guard, visual three-case smoke guard, generated-case repository smoke guard, Luna single-module smoke guard, review-package behavior smoke check, remaining-module depth guard, Navigation direct-collapse guard, Academy Progress package-flow guard, Case Briefing direct-collapse guard, workspace case-state hook guard, workspace-action controller guard, display-handoff guard, Display Phase 1 global-shell guard, Display Phase 2 workflow-rail guard, Display Phase 3 hierarchy-and-glow guard, Display Phase 4 responsive-record guard, Display Phase 5 release-readiness guard, Dashboard approved-theme v1 guard, Cases approved-theme v1 guard, Workspace shell approved-theme v1 guard, Case Briefing approved-theme v1 guard, Customer 360 approved-theme v1 guard, Investigation tools approved-theme v1 guard, Timeline approved-theme v1 guard, Decision and Luna approved-theme v1 guard, Academy approved-theme v1 guard, Profile approved-theme v1 guard, release-package documentation guard, and production build.
- `.github/workflows/build.yml` must also run Playwright against desktop and mobile Chromium for the approved Dashboard, Cases queue, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision & Luna, Academy, and Profile, all three built-in cases, generated-case immediate open and reload persistence, the completed core modules, Connections → System Access Lane, Luna’s pre-submission lock, the active-case workflow surface, and responsive record presentation.

## Next safe item

The approved Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision & Luna, Academy, and Profile redesigns are complete and protected by focused static and desktop/mobile browser guards. The next isolated safe item is **final responsive/mobile polish only**. Preserve every completed screen boundary, the four-item global navigation, contextual Profile and Academy Progress routes, Evidence First, Luna's pre-submission lock, IndexedDB-first generated-case persistence, active-case and case-scoped state, and the single Connections → System Access Lane. Do not add new product modules or redesign investigation behavior in the final polish pull request.
