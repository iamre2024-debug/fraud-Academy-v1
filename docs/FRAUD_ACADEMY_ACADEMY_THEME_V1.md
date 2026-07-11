# Fraud Academy Academy Theme v1 Handoff

## Status

Implementation branch: `agent/academy-approved-theme-v1`

Authoritative base: `main` at `6be1f83e231cfd3edbbaff51dea8e3b918e1306d`

Scope: **Academy only**.

This handoff records the focused approved theme v1 replacement for the Academy learning surface. It does not redesign Profile, alter final responsive/mobile polish outside Academy, change investigation behavior, or migrate persistence.

## Approved Academy surface

The Academy screen uses the approved light lavender and white direction while preserving the existing four-item global navigation.

It provides:

- An Evidence First learning-center hero.
- Four learning paths arranged in investigation order.
- Eight core practice steps mapped to the current workspace flow.
- A Fraud Library organized by investigator topic.
- Neutral achievement guidance tied to completed case work.
- Functional routes to Workspace, Case Queue, and contextual Academy Progress.
- Desktop, tablet, phone, and compact-phone layouts without required horizontal page scrolling.

## Protected behavior

The Academy replacement must preserve:

- Dashboard, Cases, Workspace, and Academy as the only permanent global destinations.
- Academy Progress as a contextual route rather than a fifth global destination.
- The existing `fraud-academy:package-saved` refresh behavior.
- Neutral visible learning language before submission.
- Evidence First and Luna's pre-submission lock.
- The live built-in and generated case catalog.
- `src/data/generatedCaseRepository.js` as the generated-case persistence boundary.
- IndexedDB as primary storage with the existing localStorage migration and fallback.
- Unlimited generated cases and collision-safe IDs.
- The single Connections → System Access Lane.
- The parked ten-module System Access portal remaining retired.

## Implementation anchors

- `src/AcademyThemeV1Panel.jsx`
- `src/displayAcademyThemeV1.css`
- `src/VisualNavigation.jsx`
- `src/main.jsx`
- `scripts/academy-theme-v1-smoke-check.mjs`
- `tests/academy-browser.spec.mjs`

The Academy panel must stay presentation- and navigation-focused. It must not call browser storage, write generated cases, build learner packages, calculate Luna scoring, or duplicate case-state ownership.

## Verification gate

Before merge, the exact implementation head must pass:

- The full named `npm run verify` chain.
- The Academy approved-theme v1 static guard.
- Production build.
- Desktop Chromium Academy browser coverage.
- Pixel 7 Chromium Academy browser coverage.
- Evidence First and Luna lock checks.
- Viewport and horizontal-overflow checks.

## Next isolated screen

After this Academy implementation is verified, merged, and synchronized into the repository handoff, the next isolated screen is **Profile only**. Do not combine Profile with final responsive/mobile polish.
