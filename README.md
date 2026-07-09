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

## Wave 1 build

Wave 1 established the app shell and Case Workspace foundation:

- React + Vite app
- PWA manifest
- Mobile-first bubbly purple/pink neon UI
- Desktop command-center layout
- Case Workspace frame
- Investigation family cards
- Active panel switching
- Evidence First banner
- Investigation Tray
- Investigation Notebook
- Neutral Link Analysis foundation
- Timeline, Case Report, Submit Decision foundation panels
- Placeholder tool panels for the locked architecture

## Wave 2 progress

Wave 2 has started and currently adds core Case Workspace behavior:

- Fictional training case data model in `src/data/cases.js`
- Financial tool records in `src/data/financialRecords.js`
- Business tool records in `src/data/businessRecords.js`
- Evidence tool records in `src/data/evidenceRecords.js`
- Neutral review package model in `src/data/reviewPackage.js`
- Post-submission Luna debrief scoring model in `src/data/lunaDebrief.js`
- Academy Progress layer in `src/AcademyProgress.jsx`
- Scenario Engine foundation in `src/data/scenarioEngine.js`
- Scenario Engine template panel in `src/ScenarioEnginePanel.jsx`
- Desktop command-center styling pass in `src/desktopCommand.css`
- Screenshot-driven visual workspace shell in `src/VisualWorkspace.jsx`
- Screenshot-driven gothic neon styling in `src/visualWorkspace.css`
- Mobile viewport fix in `src/mobileViewportFix.css`
- Visual tool reconnection styling in `src/visualFunctional.css`
- Desktop visual command-center layout styling in `src/visualDesktopCommand.css`
- Case Queue with Account Takeover, Chargeback Claim, and Credit Risk Review cases
- Case switching inside one workspace
- Case Briefing with neutral investigation questions
- Customer 360 with contact records, relationship snapshot, and profile-change history
- Identity Intelligence with searchable identity records
- Login History with searchable access records
- Session History with searchable session records
- Device Intelligence with searchable device records
- IP Intelligence with searchable IP records
- Transaction History with searchable records
- Financial Intelligence with searchable context records
- Payment Verification with searchable training-safe records
- Business 360 with searchable relationship records
- Business Intelligence with searchable business context records
- Employee Profile with searchable role and employer records
- Payroll History with searchable payroll records
- Evidence Center with searchable evidence inventory
- Document Viewer with searchable document previews
- Search panels with record, object, and note actions
- Search empty state for no-match results
- Investigation progress tracking by reviewed tool
- Reviewed counts on investigation family cards
- Mark-reviewed actions for workspace tools
- Pinned evidence resets per opened case
- Notebook notes are saved by active case ID
- Notebook has a Submit note composer
- Notebook supports note types including Case rationale, Investigation note, Evidence note, and Follow-up needed
- Notebook notes persist in localStorage
- Each submitted or tool-generated note saves in two places: the active case notebook and an agent notepad keyed by Agent ID
- Agent notepad entries preserve case ID, note type, note text, and timestamp so the agent can find notes even after leaving the case
- Tool action notes also save into the active case notebook and agent notepad
- Link Analysis upgraded into a searchable neutral connection panel across case objects, identity records, logins, sessions, and events
- Timeline upgraded into a searchable event/story panel covering case opening, intake, profile history, access history, case events, and evidence items
- Case Report upgraded into a neutral draft package using case reason, customer snapshot, evidence inventory, pinned records, notebook notes, and tool progress
- Submit Decision upgraded into a locked pre-submission checklist that checks documentation state without revealing the answer
- Submit Decision now uses the neutral `reviewPackage` model for required tool coverage, pinned evidence, notebook notes, learner choice, confidence, and rationale
- Learner review package drafts persist by case in localStorage
- Saved review packages persist by case in localStorage, snapshot reviewed tools/pinned evidence/notes, and unlock Luna debrief only after submission
- Luna debrief displays post-submission decision-quality scoring, breakdown, package strengths, and next coaching focus without exposing any pre-submission hinting
- Academy Progress rolls saved post-submission Luna scores into completed case count, saved package count, average score, skill meters, and case completion rows
- Academy Progress stays locked for cases without saved learner packages and does not show scoring or coaching before submission
- Scenario Engine defines neutral templates, generator inputs, fictional evidence packet structures, and safety rules without answer labels or pre-submission scoring
- Scenario Engine preview panel shows packet structure and generator inputs while keeping outcomes and Luna decision coaching locked
- Desktop command-center pass places Scenario Engine, Case Workspace, and Academy Progress into a three-column neon workstation instead of stuck floating cards
- Visual rebuild pass now makes the app entry open into an ornate gothic neon dashboard matching the uploaded reference direction before reconnecting deeper tool behavior
- Visual workspace now reconnects live case data, case switching, category switching, searchable tool rows, pin-to-tray actions, and evidence-based notebook updates inside the screenshot-driven shell
- Visual workspace now persists the investigation tray by case, reuses persisted notes/completed tools/decision drafts/review packages, shows reviewed progress counters on ornate category tiles, and contains the locked Submit Decision review package flow
- Visual workspace now writes note activity to both the active case notebook and the Agent ID notepad archive, then surfaces a compact archive inside the ornate notebook card
- Visual workspace now renders post-submission Luna debrief inside the ornate shell and keeps it locked until a review package exists
- Academy Progress is now rendered inside the screenshot-driven shell with locked states until saved packages unlock case-level scores
- Visual workspace now reconnects the ornate tool dropdown into real sub-tools for Customer 360, Identity Intelligence, Login History, Session History, Device Intelligence, IP Intelligence, Transaction History, Financial Intelligence, Payment Verification, Business 360, Business Intelligence, Employee Profile, Payroll History, Evidence Center, Document Viewer, Link Analysis, Timeline, and Case Report
- Tool panels now display the investigator question for the selected sub-tool plus the neutral Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report workflow chips
- Category progress counters now count all real sub-tools in the ornate category tiles instead of only one placeholder tool per family
- Desktop visual shell now uses a denser command-center arrangement on wide screens: active tool panel on the left, Investigation Tray/Notebook and Submit Decision on the right, then Luna Debrief and Academy Progress below while keeping the ornate mobile stack intact
- Tool records now support an expanded neutral review panel that shows selected record fields, staged search terms, history context, neutral link context, and a saveable generated report note without revealing any final outcome
- Desktop command layout now reserves space for the expanded record panel under the active tool table
- New styling for timeline/report records, the agent notepad archive, Luna debrief cards, Academy Progress, Scenario Engine, desktop command center, visual workspace shell, visual tool controls, category progress counters, notebook composer, Submit Decision panel, visual sub-tool controls, desktop visual command-center layout, and expandable record review states
- Evidence First search sweep completed for answer-leaking wording

## Latest handoff

The screenshot-driven visual shell now has persisted notes/tray state, reviewed progress indicators, the locked Submit Decision package flow, Agent ID note archiving, post-submission Luna debrief, Academy Progress, live category sub-tool switching, desktop command-center density, and richer Expand/History/Generated Report states connected without changing the visual direction. Next step: run a local build and browser QA, then add deeper per-tool evidence packet details for documents, payment objects, and profile history while keeping Evidence First locked.

Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Next waves

1. App Shell + Case Workspace foundation
2. Case Workspace core behavior
3. Main consumer investigation tools
4. Business, payroll, payment, and credit tools
5. Scenario Engine
6. Luna debrief, scoring, and academy progress

## Test status

The repo has been updated through the GitHub connector. Local build testing still needs to be run in a connected development environment because this execution runtime could not resolve github.com for cloning.
