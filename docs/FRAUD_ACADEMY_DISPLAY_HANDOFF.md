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

The current five-item runtime navigation is transitional. It must not be treated as the permanent global information architecture.

## Approved global structure target

The permanent global navigation target is:

- Dashboard
- Cases
- Workspace
- Academy

Academy Progress remains a supported product feature, but it belongs in contextual Dashboard, Academy, profile, or learner-progress entry points rather than as a fifth equal global destination.

The application header target also includes accessible controls for:

- Help
- Settings
- Agent profile or avatar

These controls must not be decorative placeholders. A visible control must have a working, training-safe action before it ships.

## Active-case workflow target

An open case should expose a clear workflow rail or equivalent staged navigation:

1. Case Briefing
2. Investigate
3. Timeline
4. Summary
5. Indicators
6. Determination
7. Debrief

The existing investigation category rail belongs inside the Investigate stage. It should not be mistaken for the full case workflow.

Before submission, stage labels, status text, counts, and progress signals must remain neutral. They may describe completion, availability, or missing requirements, but they must not label evidence as red, green, fraudulent, legitimate, suspicious, safe, correct, or incorrect.

## Visual hierarchy target

Preserve the recognizable dark purple, pink, and cyan Fraud Academy identity while improving hierarchy:

- Reserve strong glow for active controls, focus, selected navigation, and a small number of priority accents.
- Reduce repeated glow on every container so information hierarchy remains readable.
- Keep rounded glass surfaces, playful professional details, and the existing product personality.
- Use clear primary, secondary, quiet, informational, destructive, disabled, hover, focus, and selected states.
- Maintain readable contrast and visible keyboard focus.
- Avoid giant decorative treatment that pushes active investigation content below the fold without purpose.

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

- Add this display contract.
- Link it from the README and Source of Truth.
- Add a verification guard so the authority chain and safety boundaries cannot silently disappear.
- Do not change runtime presentation in this phase.

### Phase 1 - Global navigation and header

- Move toward the four-item permanent global navigation.
- Relocate Progress to a contextual entry point without removing the feature.
- Add functional Help, Settings, and Agent profile controls.
- Preserve all current navigation routes and case-opening behavior.

### Phase 2 - Active-case workflow rail

- Add the seven-stage case workflow.
- Keep the existing category rail inside Investigate.
- Preserve neutral completion language and Submit Decision locks.

### Phase 3 - Hierarchy and glow calibration

- Reduce decorative saturation without flattening the Fraud Academy identity.
- Formalize button, card, selected, focus, warning, and disabled states.
- Keep existing component behavior and props stable where practical.

### Phase 4 - Responsive record presentation

- Replace mobile table overflow with record cards, drawers, or another no-horizontal-scroll pattern.
- Validate compact phone through wide desktop behavior.
- Extend Playwright coverage for the changed surfaces.

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

After this handoff lock merges, the next isolated display item is Phase 1: global navigation and header only. Do not combine the workflow rail, broad glow changes, or mobile table conversion into that same pull request.
