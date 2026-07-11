# Fraud Academy Cases approved-theme v1 handoff

## Source hierarchy

This focused redesign follows, in order:

1. Fraud Academy Display Bible v1.0 for presentation, information hierarchy, responsive behavior, accessibility, and screen-specific display rules.
2. Approve display theme v.1 and the approved mobile reference for the light lavender, white, purple, compact, mobile-first direction.
3. GitHub Issue #22 for the focused theme-replacement problem and preservation requirements.
4. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md` for live architecture, Evidence First, Luna locking, generated-case persistence, storage boundaries, and verified runtime behavior.

## Audit starting point

The work began from `main` commit `d9f5bb0d0845ef49c095fd0affeb8fb19638661e` after confirming:

- Dashboard approved-theme v1 was merged and protected by PR #24.
- No open pull requests remained.
- The next locked isolated screen was Cases only.
- Vercel reported a successful deployment status for the audited `main` commit.
- The existing queue still used the transitional dark three-card panel.
- Built-in cases, unlimited generated cases, immediate case opening, reload persistence, Evidence First, and Luna’s submission lock were already covered by the verification chain.

## Branch and scope

Branch: `agent/cases-approved-theme-v1`

This branch changes only the Cases surface and its focused verification. It does not redesign the Workspace shell, Case Briefing, Customer 360, investigation tools, Timeline, Decision and Luna, Academy, or Profile.

## Cases screen completed

The approved Cases surface now provides:

- a compact light lavender and white Case Queue shell;
- queue totals for total, active, generated, and completed cases;
- search by case ID, customer, claim type, priority, status, or queue reason;
- priority filtering and priority, newest, oldest, or claim-type sorting;
- Detail and Compact queue views;
- All, Active, Built-in, Generated, New, Reviewing, Completed, and Paused filters;
- visible built-in/generated origin, active state, queue age, priority, amount, and neutral SLA band;
- a selected-case preview with why the case exists and the customer allegation or system alert;
- designed empty-filter state and reset action;
- keyboard focus states, reduced-motion handling, and responsive layouts for desktop, tablet, standard phone, and compact phone;
- direct case opening through the existing `onOpenCase` route without resetting saved work.

## Protected behavior preserved

- Evidence First remains active and no outcome, score, red/green flag, correct-answer, or AI recommendation copy is introduced.
- Luna remains locked until Submit Decision saves a learner package.
- `src/data/generatedCaseRepository.js` remains the only generated-case persistence boundary.
- IndexedDB remains primary with the existing localStorage migration and fallback behavior.
- Unlimited generated cases, storage keys, case routes, notes, reviewed tools, reports, learner packages, and Case Report packets are unchanged.
- The Cases component reads the existing review-package key only to display completed state and does not write persistence data.
- Existing Workspace, System Access Lane, and investigation-tool behavior remain untouched.

## Verification added

- `scripts/cases-theme-v1-smoke-check.mjs` protects the isolated Cases structure, neutral wording, responsive CSS, browser coverage, and no-persistence-coupling boundary.
- `npm run verify` includes the new focused guard.
- GitHub Actions includes a named Cases approved-theme v1 smoke step.
- Playwright covers search, priority filtering, selected preview, Compact view, desktop sticky preview, mobile stacked preview, no page overflow, all three built-in cases, generated-case queue visibility, reload persistence, and Evidence First.

## Completion gate

The Cases screen is complete only after the full named verification chain, production build, desktop Chromium, and Pixel 7 Chromium checks pass on the pull request and the branch is safely merged.

## Exact next starting point

After the Cases pull request passes and merges, begin **Workspace shell only** from the new `main` head. Audit the repository again before editing. Do not start Case Briefing, Customer 360, tools, Timeline, Decision and Luna, Academy, Profile, or final responsive polish in the same change.
