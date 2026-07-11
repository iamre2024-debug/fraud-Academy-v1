# Fraud Academy Customer 360 Theme v1 Handoff

## Status

Customer 360 is the fifth isolated screen in the locked approved-theme replacement order.

The run-start audit found `main` at `ecff0c482e5a28c7c5cd4110f92f7ee8633527c5`, after Dashboard, Cases, Workspace shell, and Case Briefing were merged and their handoff guards synchronized. No open pull request, competing Customer 360 implementation, or active current-screen redesign branch was found before this branch was created. The last completed browser gate was Case Briefing PR #29, which passed the full named verification chain, production build, desktop Chromium, and Pixel 7 Chromium before merge.

## Branch

```text
agent/customer-360-approved-theme-v1
```

## Display authority

The implementation follows:

- Fraud Academy Display Bible v1.0 Customer 360 dossier requirements.
- Approve display theme v.1 and the approved mobile reference.
- GitHub Issue #22.
- The repository Source of Truth, approved Workspace shell, and approved Case Briefing handoff.

## Isolated scope completed

- Replace the small generic Customer 360 record table with a complete customer and account dossier.
- Add Customer Identity Snapshot, Contact Information, Products & Accounts, Relationship Overview, Security & Access Summary, Recent Customer Contact, Current Case Snapshot, and Prior Claims / Disputes.
- Add a permanent Profile Change Event Log with neutral source, event, channel, value, device/session, MFA, and notes context.
- Add claim-specific neutral highlights for Account Takeover, Chargeback, Credit Risk, and generated/fallback case packets.
- Keep Customer 360 searchable and preserve functional pin, note, report-packet, reviewed-tool, identity-tool, access-tool, and Submit Decision routes.
- Preserve the existing active case switcher and all generated-case routes.
- Use a light lavender and white, mobile-first card-grid presentation with thumb-friendly controls and no required horizontal page scrolling.

## Safety preserved

- Evidence First remains active.
- Customer 360 shows relationship and profile evidence only. It does not reveal a final answer, fraud score, red or green flag, automated verdict, or AI recommendation.
- Luna remains process-only before submission, and post-submission scoring/debrief remains package-gated.
- Unlimited generated cases and the IndexedDB-first generated-case repository remain unchanged.
- All storage keys, routes, case switching, notes, reports, review packages, and existing investigation actions remain unchanged.
- Investigation tools beyond the Customer 360 surface, Timeline, Decision and Luna, Academy, Profile, System Access Lane, and final responsive polish are not redesigned here.

## Verification gate

Before merge, run:

```text
npm run verify
npm run browser-smoke-check:ci
```

The focused guard and Playwright coverage must confirm:

- all required Customer 360 dossier sections and claim-specific highlights are present;
- profile-change records, search, tool routes, pinning, notes, report packets, and reviewed state remain functional;
- built-in case switching remains functional;
- desktop and Pixel 7 layouts remain inside the viewport with stacked mobile cards and thumb-friendly actions;
- Evidence First and Luna locking remain intact;
- no persistence or System Access coupling enters the display layer.

## Locked order status

Completed before this change:

1. Dashboard
2. Cases
3. Workspace shell
4. Case Briefing

Completed by this change after verification:

5. Customer 360

Remaining:

6. Investigation tools
7. Timeline
8. Decision and Luna
9. Academy
10. Profile
11. Final responsive and mobile polish

## Exact next starting point

After this branch passes the full static, production-build, desktop Chromium, and Pixel 7 Chromium gates and is merged, re-audit the new `main` head. Redesign **Investigation tools only**, keeping each tool evidence-first and claim-specific. Do not combine Timeline, Decision and Luna, Academy, Profile, or final responsive polish with that change.
