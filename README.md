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
- Case Queue with Account Takeover, Chargeback Claim, and Credit Risk Review cases
- Case switching inside one workspace
- Case-specific allegations, intake details, facts, events, documents, and neutral link objects
- Case Briefing with neutral investigation questions
- Customer 360 with contact records, relationship snapshot, and profile-change history
- Identity Intelligence with searchable identity records
- Login History with searchable access records
- Search panels with record, object, and note actions
- Investigation progress tracking by reviewed tool
- Reviewed counts on investigation family cards
- Mark-reviewed actions for workspace tools
- Pinned evidence and notebook reset per opened case
- Evidence First search sweep completed for answer-leaking wording

## Latest handoff

The next step is to continue Wave 2 by upgrading Session History, Device Intelligence, and IP Intelligence into dedicated searchable tools. Keep the same pattern used for Identity Intelligence and Login History:

Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report

Keep all wording neutral before submission.

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
