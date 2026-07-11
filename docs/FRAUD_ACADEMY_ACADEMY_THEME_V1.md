# Fraud Academy Academy Theme v1 Handoff

## Status

This handoff records the completed isolated approved-theme v1 redesign for the **Academy only** step in the locked screen order.

- Runtime branch: `agent/academy-approved-theme-v1`
- Authoritative base audited before work: `main` at `6be1f83e231cfd3edbbaff51dea8e3b918e1306d`
- Final verified runtime head: `11ee589509368a75e049c67474d1a1e648d9911a`
- Runtime pull request: `#43`
- Runtime merge on `main`: `c7154d9b66c1446cdc32f34b2148b8eb83a70be7`
- Final runtime verification: GitHub Actions `Fraud Academy Verify` run `#403` passed the complete named smoke chain, production build, desktop Chromium, and Pixel 7 Chromium
- Handoff synchronization branch: `agent/academy-theme-v1-handoff-sync`
- Preceding completed screen group: Decision and Luna
- Next isolated screen: **Profile only**

## Authority chain

Use these sources together:

1. Fraud Academy Bible v2.1
2. Fraud Academy Display Bible v1.0 - New Design Exploration
3. Approve display theme v.1
4. GitHub Issue #22
5. Approved mobile reference
6. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`

The display sources control presentation, hierarchy, responsive behavior, and the screen-specific experience. The repository Source of Truth controls architecture, Evidence First, persistence, storage, routes, notes, reports, case behavior, and protected implementation boundaries.

## Isolated scope

This step redesigns Academy only. It does not redesign Profile or perform the final responsive/mobile polish pass.

`src/AcademyThemeV1Panel.jsx` owns the approved Academy learning surface. `src/displayAcademyThemeV1.css` owns the light lavender and white responsive presentation, and `src/displayAcademyThemeV1Safety.css` isolates Academy from unreplaced workspace surfaces without changing those surfaces or their runtime behavior.

## Approved Academy surface

Academy now provides:

- an Evidence First Learning Center hero;
- four learning paths arranged in investigation order;
- eight core practice steps mapped to the current workspace flow;
- a Fraud Library organized by neutral investigation topics;
- neutral achievement guidance tied to completed case work;
- direct routes to Workspace, Case Queue, and contextual Academy Progress;
- desktop, tablet, Pixel 7, and compact-phone layouts without required horizontal page scrolling;
- the existing four-item global navigation with Academy Progress remaining contextual rather than becoming a fifth global destination.

The Academy screen teaches process and investigation habits. It does not predict a case outcome, calculate a score, reveal red or green flags, or duplicate the saved learner-package model.

## Protected behavior

The following remain unchanged:

- Dashboard, Cases, Workspace, and Academy as the only permanent global destinations;
- Academy Progress as a contextual route;
- the existing `fraud-academy:package-saved` refresh behavior;
- Evidence First and neutral pre-submission wording;
- Luna remains locked until a learner package is saved;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first persistence boundary;
- localStorage migration and fallback behavior;
- every storage key;
- active-case switching;
- case-scoped notes, pinned evidence, reviewed tools, reports, report packets, decision drafts, and review packages;
- all existing routes and investigation actions;
- the single Connections → System Access Lane;
- parked standalone System Access portals remain retired;
- fictional training-safe wording.

## Implementation anchors

- `src/AcademyThemeV1Panel.jsx`
- `src/displayAcademyThemeV1.css`
- `src/displayAcademyThemeV1Safety.css`
- `src/VisualNavigation.jsx`
- `src/main.jsx`
- `scripts/academy-theme-v1-smoke-check.mjs`
- `tests/academy-browser.spec.mjs`

The Academy panel remains presentation- and navigation-focused. It does not call browser storage, write generated cases, build learner packages, calculate Luna scoring, or duplicate case-state ownership.

## Completed verification

The final runtime branch head passed all required gates before merge:

1. complete named `npm run verify` chain;
2. production build;
3. focused Academy approved-theme v1 static guard;
4. desktop Chromium Academy browser coverage;
5. Pixel 7 Chromium Academy browser coverage;
6. Evidence First wording checks;
7. Luna pre-submission lock checks;
8. Academy isolation from workspace and generated-case controls;
9. Learning Center, Fraud Library, achievement, Workspace, Case Queue, and Academy Progress routes;
10. four-item global navigation protection;
11. 44-pixel control and keyboard-focus coverage;
12. viewport-width and horizontal-overflow safety.

## Exact next starting point

Re-audit the new `main` head, active redesign branches, open pull requests, recent commits, CI, GitHub Issue #22, and this completed Academy handoff. Then redesign **Profile only** on a separate branch. Do not combine final responsive/mobile polish with the Profile pull request.
