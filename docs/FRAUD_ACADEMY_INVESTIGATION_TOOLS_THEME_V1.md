# Fraud Academy Investigation Tools Theme v1 Handoff

## Status

This handoff records the isolated approved-theme v1 redesign for the **Investigation tools only** step in the locked screen order.

- Branch: `agent/investigation-tools-approved-theme-v1`
- Base audited before work: `main` at `d2bf66a44e30f773a94b4de7c793118d77e2b7c5`
- Preceding completed screen: Customer 360
- Next isolated screen after this change passes and merges: **Timeline only**

## Authority chain

Use these sources together:

1. Fraud Academy Display Bible v1.0 - New Design Exploration
2. Approve display theme v.1
3. GitHub Issue #22
4. Approved mobile reference
5. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md`

The display sources control presentation, hierarchy, responsive behavior, and screen-specific experience. The repository Source of Truth controls architecture, Evidence First, persistence, storage, routes, notes, reports, case behavior, and protected implementation boundaries.

## Isolated scope

This step redesigns the contextual deep-tool experience while leaving Timeline, Decision and Luna, Academy, Profile, and final responsive/mobile polish untouched.

The approved contextual groups are:

1. Identity & Customer
2. Login, Device & IP
3. Transactions & Financial
4. Business & Payment Verification
5. Evidence & Documents
6. Links & Related Cases

`src/investigationToolGroups.js` owns this approved grouping. The single Connections path continues to expose `System Access Lane`; parked standalone access portals are not revived.

`src/InvestigationToolPanel.jsx` owns the approved deep-tool presentation for:

- Identity Intelligence
- Login History
- Session History
- Device Intelligence
- IP Intelligence
- Transaction History
- Financial Intelligence
- Payment Verification
- Business 360
- Business Intelligence
- Employee Profile
- Payroll History
- Evidence Center
- Document Viewer
- Link Analysis
- System Access Lane

Customer 360 keeps its completed dedicated dossier. Timeline and Case Report remain on the existing workflow renderer until their later isolated redesign steps.

## Approved interaction model

Each deep tool now presents:

- one neutral working question;
- the existing tool selector inside the active contextual group;
- the protected Record → Expand → Search → History → Link Analysis → Generate Report → Timeline → Case Report flow;
- searchable records;
- an expanded record workspace;
- pinning;
- case-scoped note saving;
- neutral report-packet saving;
- reviewed-state tracking;
- direct routes to Timeline, Case Report, and locked Submit Decision.

The redesign changes presentation and hierarchy only. It does not replace record builders, tool data, action controllers, or persistence.

## Protected behavior

The following remain unchanged:

- Evidence First and neutral pre-submission wording;
- Luna scoring and debrief locking until a learner package exists;
- all built-in and unlimited generated cases;
- `src/data/generatedCaseRepository.js` as the IndexedDB-first persistence boundary;
- migration and fallback behavior;
- every storage key;
- active-case switching;
- notes, pinned evidence, reports, report packets, review packages, and decision drafts;
- existing routes and action boundaries;
- the single Connections → System Access Lane;
- lane purity and fictional training data.

## Responsive contract

The deep-tool workspace must:

- show the six contextual groups as a clear grid on desktop;
- reduce the group grid intentionally for tablet and phone widths;
- present records beside the expanded detail panel on desktop;
- stack records and expanded detail on mobile;
- keep controls at least 44 pixels high;
- avoid fixed overlays and required horizontal page scrolling;
- keep searches, record actions, report actions, and workflow routes reachable on Pixel 7;
- preserve visible keyboard focus and no-color-only status meaning.

## Verification gate

Do not merge until all of the following pass on the final branch head:

1. complete named `npm run verify` chain;
2. production build;
3. focused Investigation tools smoke guard;
4. desktop Chromium browser coverage;
5. Pixel 7 Chromium browser coverage;
6. Evidence First wording guard;
7. built-in case switching;
8. search, record expansion, pin/note/report/review actions, and Timeline/Case Report routing;
9. Luna pre-submission lock;
10. viewport-width safety.

## Exact next starting point

After this change is verified, merged, and synchronized, re-audit the new `main` head, branches, open pull requests, recent commits, CI, and last completed handoff. Then redesign **Timeline only**. Do not combine Decision and Luna, Academy, Profile, or final responsive/mobile polish with the Timeline pull request.
