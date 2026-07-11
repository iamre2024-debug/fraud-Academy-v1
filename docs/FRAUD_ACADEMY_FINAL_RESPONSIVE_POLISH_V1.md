# Fraud Academy Final Responsive and Mobile Polish v1 Handoff

## Status

This handoff records the final cross-screen responsive/mobile polish candidate after every screen in the locked redesign order passed its isolated desktop and Pixel 7 verification gate.

- Branch: `agent/final-responsive-mobile-polish-v1`
- Authoritative base audited before work: `main` at `3801e53c2fd26b0628b1ab2d14bff079733ed741`
- Preceding completed screen: Profile
- Profile runtime pull request: `#47`
- Profile runtime merge on `main`: `01e25967098594dbe67d4c523d12fe249e810564`
- Profile verification: GitHub Actions `Fraud Academy Verify` run `#409` passed the complete named smoke chain, production build, desktop Chromium, and Pixel 7 Chromium
- Scope: **final responsive/mobile polish only**

## Authority chain

Use these sources together:

1. Fraud Academy Bible v2.1
2. Fraud Academy Display Bible v1.0 - New Design Exploration
3. Approve display theme v.1
4. GitHub Issue #22
5. Approved mobile reference
6. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`

The display sources control presentation, hierarchy, responsive behavior, accessibility, and the mobile experience. The repository Source of Truth controls Evidence First, architecture, persistence, routes, case behavior, notes, reports, and protected implementation boundaries.

## Isolated scope

This step does not redesign any completed screen or change investigation behavior. It provides one final cross-screen containment, touch-target, safe-area, compact-phone, and wide-desktop pass after Dashboard, Cases, Workspace shell, Case Briefing, Customer 360, Investigation tools, Timeline, Decision and Luna, Academy, and Profile were completed.

`src/displayFinalResponsivePolishV1.css` owns the final presentation-only safety layer. `tests/final-responsive-polish-browser.spec.mjs` owns the cross-screen compact-phone and wide-desktop audit.

## Final responsive contract

The completed application must:

- keep every top-level surface within the viewport at 350-pixel compact-phone width and 1440-pixel desktop width;
- preserve the four permanent global navigation destinations;
- keep contextual Profile and Academy Progress routes functional;
- retain at least 44-pixel mobile interaction targets;
- respect device safe-area insets around the persistent bottom navigation;
- allow long case IDs, labels, headings, and evidence text to wrap without widening the document;
- keep grid and flex children shrink-safe;
- avoid required horizontal page scrolling;
- preserve keyboard focus visibility;
- preserve the approved stacked phone layouts and wide desktop layouts already owned by each screen-specific stylesheet;
- preserve reduced-motion behavior;
- add no fixed overlay beyond the existing approved navigation behavior.

## Protected behavior

The following must remain unchanged:

- Evidence First and neutral pre-submission language;
- Luna remains locked until a learner package is saved;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first generated-case persistence boundary;
- localStorage migration and fallback behavior;
- every storage key;
- active-case switching;
- notes, pinned evidence, reviewed tools, reports, report packets, decision drafts, and learner packages;
- all existing routes and actions;
- Dashboard, Cases, Workspace, and Academy as the only permanent global destinations;
- contextual Profile and Academy Progress routes;
- the single Connections → System Access Lane;
- parked standalone System Access portals remain retired;
- fictional training-safe wording.

## Implementation anchors

- `src/displayFinalResponsivePolishV1.css`
- `src/main.jsx`
- `scripts/final-responsive-polish-v1-smoke-check.mjs`
- `tests/final-responsive-polish-browser.spec.mjs`
- `docs/FRAUD_ACADEMY_FINAL_RESPONSIVE_POLISH_V1.md`

The final CSS layer must remain presentation-only. It may add containment, wrapping, touch-target, safe-area, and compact-width safety, but it must not hide required functionality, access persistence, change data, create routes, or replace screen-specific ownership.

## Required verification gate

Before merge, the final branch head must pass:

1. complete named `npm run verify` chain;
2. production build;
3. focused final responsive/mobile static guard;
4. all existing desktop Chromium and Pixel 7 browser tests;
5. final compact-phone audit at 350 × 740;
6. final wide-desktop audit at 1440 × 1000;
7. Workspace, Dashboard, Cases, Academy, Profile, and Academy Progress viewport checks;
8. four-item navigation and 44-pixel touch-target checks;
9. Evidence First and Luna lock checks;
10. generated-case and case-scoped persistence checks;
11. no required horizontal page scrolling.

## Completion condition

After this branch passes every gate, merges, and the repository handoff is synchronized, the locked display redesign is complete. Do not make further display changes unless a new approved scope is opened.
