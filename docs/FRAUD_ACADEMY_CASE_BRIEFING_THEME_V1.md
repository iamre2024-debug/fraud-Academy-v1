# Fraud Academy Case Briefing Theme v1 Handoff

## Status

Case Briefing is the fourth isolated screen in the locked approved-theme replacement order.

The initial audit found `main` at `5b4df2d30bf99db30e5e73f0ec4dcb5efad5c073`, after Dashboard, Cases, and the Workspace shell were merged. While this isolated change was being prepared, the documentation/guard-only Workspace handoff advanced `main`. The branch was then safely reconciled onto current `main` commit `0694b642b303b7c8102d75c7d6e1369fbd4f045f` without overwriting those updates. No competing Case Briefing implementation or open current-screen redesign pull request was found.

## Branch

```text
agent/case-briefing-approved-theme-v1
```

## Display authority

The implementation follows:

- Fraud Academy Display Bible v1.0, approved Layout 2 card-grid Case Briefing.
- Approve display theme v.1 and the approved mobile reference.
- GitHub Issue #22.
- The repository Source of Truth and existing Workspace shell handoff.

## Isolated scope completed

- Replace the old ornate Case Summary presentation with a calm light-lavender and white Case Briefing card grid.
- Preserve the active allegation or system-alert context as the reason the case exists.
- Show case overview, briefing summary, at-a-glance metrics, key focus areas, neutral Luna process support, and recent documents.
- Add functional utilities for Workspace, Timeline, Notes, More Tools, and Begin Investigation.
- Route Begin Investigation into the existing Customer 360 tool without changing the tool implementation.
- Preserve the existing direct React compact-text controls for transaction/payee information and the short summary.
- Preserve desktop and mobile no-overflow behavior.

## Safety preserved

- Evidence First remains active.
- No fraud/non-fraud conclusion, score, red or green flag, correct answer, automated verdict, or decision recommendation appears in the briefing.
- Luna remains process-only before submission, and post-submission scoring/debrief remains package-gated.
- Unlimited generated cases and the IndexedDB-first generated-case repository remain unchanged.
- All storage keys, routes, case switching, notes, reports, review packages, and existing investigation actions remain unchanged.
- Customer 360, investigation tools, Timeline, Decision and Luna, Academy, Profile, System Access Lane, and final responsive polish are not redesigned here.

## Verification gate

Before merge, run:

```text
npm run verify
npm run browser-smoke-check:ci
```

The focused guard and Playwright coverage must confirm:

- approved Case Briefing anchors and card-grid hierarchy;
- all required utilities remain functional;
- built-in case switching remains functional;
- the existing tool route is used for Begin Investigation;
- desktop and Pixel 7 layouts remain within the viewport;
- Evidence First and Luna locking remain intact;
- no persistence or System Access coupling enters the display layer.

## Locked order status

Completed before this change:

1. Dashboard
2. Cases
3. Workspace shell

Completed by this change after verification:

4. Case Briefing

Remaining:

5. Customer 360
6. Investigation tools
7. Timeline
8. Decision and Luna
9. Academy
10. Profile
11. Final responsive and mobile polish

## Exact next starting point

After this branch passes the full static, production-build, desktop Chromium, and Pixel 7 Chromium gates and is merged, re-audit the new `main` head. Redesign **Customer 360 only**. Do not combine investigation tools, Timeline, Decision and Luna, Academy, Profile, or final responsive polish with that change.
