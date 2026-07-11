# Fraud Academy Display Handoff

This file is the repository-facing display migration contract for Fraud Academy OS v1.0.

## Authority chain

Use the newest approved product and display sources in this order:

1. Fraud Academy Bible v2.1 for the consolidated product, build, commercialization, and source hierarchy.
2. Fraud Academy Display Bible v1.0 - New Design Exploration for layout, hierarchy, navigation, responsive behavior, accessibility, and screen presentation.
3. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md` for the live repository architecture, Evidence First rules, safety locks, persistence boundaries, and current implementation anchors.
4. Latest merged `main` and its passing verification suite for the actual code handoff.

Historical PR #2, stale branches, archived design notes, and retired DOM patches are reference-only. They never override newer merged work.

## Runtime transition rule

The current screenshot-driven visual shell remains the active runtime until a focused display phase replaces a specific surface and passes the full verification and browser gates. Do not perform a broad theme rewrite, replace working investigation behavior, or mix several display phases into one pull request.

Display Phase 1 replaced only the global navigation and header-control surface. Display Phase 2 added only the active-case workflow rail. Display Phase 3 calibrated hierarchy, glow, and interaction states without changing component behavior or persistence. Display Phase 4 converts dense investigation records into labeled, touch-friendly mobile cards while preserving the desktop table, record data, investigation actions, and storage boundaries.

## Approved global structure target

The permanent global navigation is:

- Dashboard
- Cases
- Workspace
- Academy

Academy Progress remains a supported product feature through contextual Dashboard, Academy, and Agent-profile entry points rather than as a fifth equal global destination.

The application header includes accessible, functional controls for:

- Help
- Settings
- Agent profile or avatar

Visible controls must not be decorative placeholders. Help routes to active training guidance, Settings changes a persisted reduced-motion preference, and Agent profile exposes the current assignment plus contextual Progress and Workspace routes.

## Active-case workflow target

An open case exposes the approved staged workflow:

1. Case Briefing
2. Investigate
3. Timeline
4. Summary
5. Indicators
6. Determination
7. Debrief

The existing investigation category rail belongs inside the Investigate stage. It is not the complete case workflow.

Before submission, stage labels, status text, counts, and progress signals remain neutral. They may describe reviewed tools, collected objects, open requirements, readiness, availability, or lock state, but they must not label evidence as red, green, fraudulent, legitimate, suspicious, safe, correct, or incorrect.

The current runtime behavior is:

- Case Briefing scrolls to the allegation or system-alert summary.
- Investigate returns to the category rail.
- Timeline and Summary open their existing Timeline and Case Report tools.
- Indicators opens the neutral Evidence Center while collected object counts remain descriptive only.
- Determination scrolls to the existing package-gated Submit Decision panel.
- Debrief scrolls to Luna, which stays locked until a learner package exists.

## Visual hierarchy target

Preserve the recognizable dark purple, pink, and cyan Fraud Academy identity while improving hierarchy:

- Reserve strong glow for active controls, focus, selected navigation, and a small number of priority accents.
- Reduce repeated glow on every container so information hierarchy remains readable.
- Keep rounded glass surfaces, playful professional details, and the existing product personality.
- Use clear primary, secondary, quiet, informational, destructive, disabled, hover, focus, and selected states.
- Maintain readable contrast and visible keyboard focus.
- Avoid giant decorative treatment that pushes active investigation content below the fold without purpose.

The Phase 3 runtime uses `src/displayPhaseThree.css` as a final presentation-only override. It lowers ambient and container glow, shortens the decorative hero, keeps selected and keyboard-focus states distinct, and formalizes informational, warning, destructive, and disabled treatments without changing component props or investigation behavior.

## Responsive target

Each display phase must be reviewed across six practical ranges:

1. Compact phone
2. Standard phone
3. Large phone or small tablet
4. Tablet
5. Desktop
6. Wide desktop

The implementation may choose exact breakpoint values during the focused responsive phase, but every range must be represented in tests or recorded manual QA.

Mobile rules:

- No required horizontal page scrolling.
- Dense desktop tables must become stacked records, cards, drawers, or another touch-friendly presentation.
- Visible controls must be thumb-friendly and functional.
- Fixed navigation must not cover active controls or content.
- Compact text remains React-owned through `DirectCollapsibleText`.

The Phase 2 rail wraps from seven columns to four and then two columns, avoiding required horizontal page scrolling while keeping every stage directly reachable.

The Phase 4 runtime keeps semantic desktop tables above 760 pixels and converts each record into a labeled card at phone widths. Column labels are supplied through `data-field`, the desktop header is hidden only on mobile, action buttons remain at least 44 pixels tall, and compact-phone labels stack at 420 pixels without adding a horizontal scroller.

## Architecture and safety boundaries

Every display phase must preserve all of the following:

- Evidence First and neutral visible wording before submission.
- Luna scoring, answer guidance, strengths, missed evidence, and decision-quality feedback locked until a learner package exists.
- `src/data/generatedCaseRepository.js` as the generated-case persistence boundary.
- IndexedDB as the primary generated-case store with the existing localStorage migration and fallback behavior.
- Unlimited generated-case queue behavior and collision-safe IDs.
- The single Connections to System Access Lane inside the core workspace.
- Parked ten-module System Access portal modules remain retired.
- Training-safe labels: Training ID, Bank Code, Destination ID, and Payment Verification.
- Case-scoped tray, notes, reviewed tools, decision drafts, learner packages, and Case Report packets.
- Existing working case routes and all three built-in cases plus generated-case behavior.

## Focused migration sequence

### Phase 0 - Repository handoff lock

Completed:

- Added this display contract.
- Linked it from the README and Source of Truth.
- Added a verification guard so the authority chain and safety boundaries cannot silently disappear.
- Left runtime presentation unchanged during the lock phase.

### Phase 1 - Global navigation and header

Completed in the focused global-shell change:

- Permanent global navigation now contains Dashboard, Cases, Workspace, and Academy only.
- Academy Progress remains active through contextual Dashboard, Academy, and Agent-profile actions.
- Help, Settings, and Agent-profile controls perform real, training-safe actions.
- The Settings control persists a reduced-motion preference without changing investigation data.
- Existing navigation routes, case switching, generated-case opening, Progress data, Evidence First locks, and Luna gating remain intact.
- `scripts/display-phase-one-smoke-check.mjs` guards the four-item structure, contextual Progress routes, functional controls, and style wiring.

### Phase 2 - Active-case workflow rail

Completed in the focused workflow-rail change:

- Added Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief in the approved order.
- Kept the existing category rail inside Investigate.
- Added accessible current-step state and direct stage actions without hiding existing workspace content.
- Derived neutral status text from reviewed tools, collected objects, open package requirements, saved packages, and Luna availability.
- Preserved the Submit Decision checklist and Luna pre-submission lock.
- Added compact wrapping styles without broad glow calibration or mobile record conversion.
- `scripts/display-phase-two-smoke-check.mjs` guards the stage order, neutral language, category placement, package gating, Debrief lock, responsive style wiring, and architecture boundaries.

### Phase 3 - Hierarchy and glow calibration

Completed in the focused hierarchy-and-glow change:

- Added `src/displayPhaseThree.css` as a final presentation-only override rather than rewriting the verified base shell.
- Reduced ambient background bloom, repeated container glow, heading glow, decorative icon bloom, and oversized hero treatment while preserving the purple, pink, cyan, rounded-glass identity.
- Reserved stronger glow for active navigation, selected category/workflow controls, and keyboard focus.
- Formalized primary, secondary, quiet, informational, warning, destructive, disabled, hover, focus, and selected states using shared visual tokens and existing classes.
- Preserved all component props, routes, investigation actions, Evidence First wording, Luna gating, generated-case persistence, and System Access architecture.
- Left dense mobile record presentation untouched for Phase 4.
- `scripts/display-phase-three-smoke-check.mjs` guards style tokens, state selectors, entrypoint wiring, CI coverage, and the no-record-layout/no-persistence scope boundary.

### Phase 4 - Responsive record presentation

Completed in the focused responsive-record change:

- Added semantic table, row, column-header, and cell roles to the existing investigation record surface.
- Added stable `data-field` labels and record IDs without changing the row data or investigation actions.
- Added `src/displayPhaseFour.css` after the verified Phase 1 through Phase 3 layers.
- Kept the desktop table presentation intact while converting records into labeled cards at 760 pixels and below.
- Stacked labels and values on compact phones, preserved 44-pixel action targets, and avoided required horizontal scrolling.
- Added a neutral empty-search state without changing search behavior.
- Extended Playwright coverage across Desktop Chrome and Pixel 7 for desktop headers, mobile labels, card layout, no page overflow, and the Evidence First lock.
- `scripts/display-phase-four-smoke-check.mjs` guards semantic anchors, style wiring, browser coverage, no-horizontal-scroller rules, and persistence/behavior boundaries.

### Phase 5 - Final Bible and release-readiness audit

Next isolated item:

- Compare the exact merged display tree against Fraud Academy Bible v2.1, Fraud Academy Display Bible v1.0, this handoff, and the live Source of Truth.
- Run the full named verification suite and desktop/mobile browser jobs on the exact merge candidate.
- Confirm all three built-in cases plus a generated case preserve routes, storage, Evidence First, Luna gating, and System Access boundaries.
- Record any remaining display gaps without introducing a new redesign or unrelated feature work.

## Required verification for every display pull request

At minimum, run:

- `npm run verify`
- `npm run browser-smoke-check` when Chromium is available
- Desktop Chromium and Pixel 7 mobile Chromium in GitHub Actions

A display pull request is not complete until it confirms:

- no Evidence First leaks
- no Luna pre-submission reveal
- no generated-case repository rewrite
- no revived parked System Access modules
- no broken built-in or generated case routes
- no fixed-navigation overlap on tested viewports
- no new required horizontal page overflow

## Next safe item

After Phase 4 merges and its exact tree passes the full verify and browser jobs, begin only Phase 5: the final Bible and release-readiness audit. Do not combine the audit with a new theme rewrite, persistence migration, investigation behavior change, or System Access expansion.
