# Fraud Academy Profile Theme v1 Handoff

## Status

This handoff records the completed isolated approved-theme v1 redesign for the **Profile only** step in the locked screen order.

- Runtime branch: `agent/profile-approved-theme-v1`
- Authoritative implementation base audited before work: `main` at `c7154d9b66c1446cdc32f34b2148b8eb83a70be7`
- Academy handoff synchronization merged while Profile work was in progress: `97099ca43dbf5584ac7f2f0557eb3ee6e94440a6`
- Final verified Profile runtime head: `000c90b87984d41cd01a093a790457fb187ec7a3`
- Profile runtime pull request: `#47`
- Profile runtime merge on `main`: `01e25967098594dbe67d4c523d12fe249e810564`
- Final Profile verification: GitHub Actions `Fraud Academy Verify` run `#409` passed the complete named smoke chain, production build, desktop Chromium, and Pixel 7 Chromium
- Preceding completed screen: Academy
- Next isolated step: **final responsive/mobile polish only**

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

This step redesigned Profile only. It did not begin the final responsive/mobile polish pass.

`src/ProfileThemeV1Panel.jsx` owns the approved profile surface. `src/displayProfileThemeV1.css` owns the light lavender and white responsive presentation, and `src/displayProfileThemeV1Safety.css` isolates Profile from the workspace without changing the workspace or its runtime behavior.

The Profile remains contextual. It opens from the persistent Agent avatar and does not become a fifth permanent global navigation destination.

## Approved Profile surface

Profile now provides:

- a learner profile summary with the current activity-based investigator rank;
- the current active-case assignment and direct Workspace return;
- neutral saved-work metrics for cases, reviewed tools, notes, packets, and learner packages;
- four activity-based skill-proficiency areas;
- four badges tied to completed investigation activity;
- an activity summary;
- four active-case goals using the existing reviewed-tool, note, report-packet, and learner-package snapshots;
- direct routes to Workspace, Academy, and contextual Academy Progress;
- persistent avatar entry from Workspace and non-Workspace navigation panels;
- desktop, tablet, Pixel 7, and compact-phone layouts without required horizontal page scrolling.

The Profile does not predict outcomes, calculate a hidden correctness score, reveal red or green flags, expose Luna coaching before submission, or duplicate persistence ownership.

## Protected behavior

The following remain unchanged:

- Dashboard, Cases, Workspace, and Academy as the only permanent global destinations;
- Profile and Academy Progress as contextual routes;
- Evidence First and neutral pre-submission wording;
- Luna remains locked until a learner package is saved;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first persistence boundary;
- migration and fallback behavior;
- every storage key;
- active-case switching;
- case-scoped notes, pinned evidence, reviewed tools, reports, report packets, decision drafts, and review packages;
- all existing investigation routes and actions;
- Help and Settings remain compact header controls;
- the single Connections → System Access Lane;
- parked standalone System Access portals remain retired;
- fictional training-safe wording.

## Implementation anchors

- `src/ProfileThemeV1Panel.jsx`
- `src/displayProfileThemeV1.css`
- `src/displayProfileThemeV1Safety.css`
- `src/VisualNavigation.jsx`
- `src/VisualShellHeader.jsx`
- `src/main.jsx`
- `scripts/profile-theme-v1-smoke-check.mjs`
- `tests/profile-browser.spec.mjs`

The Profile panel receives the established navigation snapshot from `VisualNavigation`. It does not call browser storage, write generated cases, build learner packages, calculate Luna scoring, or duplicate case-state ownership.

## Completed verification

The final Profile runtime head passed all required gates before merge:

1. complete named `npm run verify` chain;
2. production build;
3. focused Profile approved-theme v1 static guard;
4. desktop Chromium Profile browser coverage;
5. Pixel 7 Chromium Profile browser coverage;
6. avatar entry from Workspace and Dashboard;
7. Workspace, Academy, and Academy Progress routes;
8. four-item permanent global navigation protection;
9. Evidence First wording and Luna pre-submission lock protection;
10. activity-based skill, badge, summary, and goal rendering;
11. keyboard-focus and 44-pixel control coverage;
12. viewport-width and horizontal-overflow safety.

## Exact next starting point

Re-audit the new `main` head, active redesign branches, open pull requests, recent commits, CI, GitHub Issue #22, and this completed Profile verification. Then begin **final responsive/mobile polish only** on a separate branch. Do not redesign or rewrite any completed screen functionality during the final polish pass.
