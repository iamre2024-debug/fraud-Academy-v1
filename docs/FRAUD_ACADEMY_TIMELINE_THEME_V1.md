# Fraud Academy Timeline Theme v1 Handoff

## Status

This handoff records the isolated approved-theme v1 redesign for the **Timeline only** step in the locked screen order.

- Branch: `agent/timeline-approved-theme-v1`
- Base audited before work: `main` at `5bbc875ad460f36762b98294f95017a80c9e2a7d`
- Verified runtime merge on `main`: `25b5d19bc687003b5df72f4e95748d78b2eff590`
- Preceding completed screen group: Investigation tools
- Next isolated screen after this change passes and merges: **Decision & Luna only**

## Authority chain

Use these sources together:

1. Fraud Academy Bible v2.1
2. Fraud Academy Display Bible v1.0 - New Design Exploration
3. Approve display theme v.1
4. GitHub Issue #22
5. Approved mobile reference
6. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`

The display sources control presentation, hierarchy, responsive behavior, and screen-specific experience. The repository Source of Truth controls architecture, Evidence First, persistence, storage, routes, notes, reports, case behavior, and protected implementation boundaries.

## Isolated scope

This step redesigns Timeline only. It does not redesign Case Report, Decision and Luna, Academy, Profile, or the final responsive/mobile pass.

`src/TimelinePanel.jsx` owns the approved Timeline presentation. `src/displayTimelineThemeV1.css` owns the responsive light-lavender and white Timeline layout. `src/data/coreToolRecords.js` continues to supply the established case-scoped timeline rows and remains unchanged by this presentation step.

Case Report stays on `src/ActiveToolPanel.jsx` until its approved place in the later workflow work. The completed Customer 360 and Investigation-tool panels stay unchanged.

## Approved interaction model

Timeline now presents:

- one neutral working question;
- a case-scoped recorded event sequence;
- event counts, source counts, linked-object counts, and neutral review status;
- search by event, time, source, linked object, or detail;
- a neutral source filter;
- event cards with time, event, source, linked object, and record ID;
- expanded event detail;
- event pinning;
- case-scoped timeline notes;
- neutral report-packet saving;
- reviewed-state tracking;
- direct routes to Evidence Center, Case Report, and locked Submit Decision.

The Timeline organizes available records and never determines the case outcome. It preserves the current row order from the established record builder instead of inventing or rewriting event chronology.

## Protected behavior

The following remain unchanged:

- Evidence First and neutral pre-submission wording;
- Luna scoring and debrief locking until a learner package exists;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first persistence boundary;
- localStorage migration and fallback behavior;
- every storage key;
- active-case switching;
- case-scoped notes, pinned evidence, reviewed tools, reports, report packets, decision drafts, and review packages;
- existing `useVisualWorkspaceActions.js` and `useVisualWorkspaceCaseState.js` boundaries;
- four-item global navigation;
- the single Connections → System Access Lane;
- parked standalone System Access portals remain retired;
- fictional training-safe wording.

## Responsive contract

The Timeline must:

- present the event stream and expanded event beside one another on wide desktop;
- stack the event stream and expanded event intentionally at tablet and phone widths;
- preserve 44-pixel minimum controls;
- keep the search, source filter, event actions, report actions, and workflow routes reachable on Pixel 7;
- avoid fixed overlays and required horizontal page scrolling;
- preserve visible keyboard focus and text labels for state;
- keep compact-phone event cards readable at 350 pixels.

## Verification gate

Do not merge until all of the following pass on the final branch head:

1. complete named `npm run verify` chain;
2. production build;
3. focused Timeline smoke guard;
4. desktop Chromium browser coverage;
5. Pixel 7 Chromium browser coverage;
6. Evidence First wording guard;
7. built-in case switching;
8. search and source filtering;
9. event expansion, pin, note, neutral report packet, and reviewed-state actions;
10. Evidence Center, Case Report, and Submit Decision routing;
11. Luna pre-submission lock;
12. viewport-width safety.

## Exact next starting point

After this change is verified, merged, and synchronized, re-audit the new `main` head, active branches, open pull requests, recent commits, CI, and the last completed handoff. Then redesign **Decision & Luna only**. Do not combine Academy, Profile, or final responsive/mobile polish with that pull request.
