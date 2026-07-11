# Fraud Academy Workspace shell approved-theme v1 handoff

## Source hierarchy

This focused redesign follows, in order:

1. Fraud Academy Display Bible v1.0 for presentation, hierarchy, responsive behavior, accessibility, and screen-specific display rules.
2. Approve display theme v.1 and the approved mobile reference for the light lavender, white, purple, compact, mobile-first direction.
3. GitHub Issue #22 for the focused theme-replacement problem and preservation requirements.
4. `docs/FRAUD_ACADEMY_SOURCE_OF_TRUTH.md` for live architecture, Evidence First, Luna locking, generated-case persistence, storage boundaries, and verified runtime behavior.

## Audit starting point

The work began from `main` commit `d5dd19a7c7a00d096e4ab81d16fa352149c4ac2e` after confirming:

- Dashboard approved-theme v1 was merged and protected by PR #24.
- Cases approved-theme v1 passed the complete named verification chain, production build, desktop Chromium, and Pixel 7 Chromium in PR #25, then merged.
- No open pull request remained after the Cases merge.
- No current Workspace redesign branch existed.
- The next locked isolated screen was Workspace shell only.
- The existing Workspace still used the oversized decorative hero, dark case strip, high-glow workflow rail, and older navigation presentation even though its investigation logic and responsive records were working.

## Branch and scope

Branch: `agent/workspace-shell-approved-theme-v1`

This branch changes only the Workspace shell:

- compact application header;
- Help, Settings, and Agent controls;
- active-case strip and case switcher;
- seven-step active-case workflow rail;
- shell background, spacing, and navigation presentation;
- desktop and mobile shell verification.

It does not redesign Case Briefing, Customer 360, investigation tools, Timeline, Decision and Luna, Academy, Profile, or final responsive polish.

## Workspace shell completed

The approved Workspace shell now provides:

- a compact white header with the Fraud Academy OS identity, Investigation Workspace context, active case, and Evidence First wording;
- retained Help, Settings, Agent profile, reduced-motion preference, Academy, Case Queue, Progress, and Workspace actions;
- a light active-case strip with case ID, claim type, status, and the existing case switcher;
- the same seven workflow stages in the same order: Case Briefing, Investigate, Timeline, Summary, Indicators, Determination, and Debrief;
- neutral open, in-progress, ready, complete, and locked states without revealing an outcome;
- a light lavender and white shell surrounding the still-unreplaced investigation surfaces;
- approved light navigation presentation while the Workspace tab is active;
- compact desktop, tablet, Pixel 7, and narrow-phone layouts without required horizontal page scrolling;
- direct case switching through the existing `changeCase` and `onCaseChange` path without resetting saved work.

## Protected behavior preserved

- Evidence First remains active and no outcome, score, red/green flag, correct-answer, or AI recommendation copy is introduced.
- Luna remains locked until Submit Decision saves a learner package.
- `src/data/generatedCaseRepository.js` remains the generated-case persistence boundary.
- IndexedDB remains primary with the existing localStorage migration and fallback behavior.
- Unlimited generated cases, storage keys, routes, notes, reviewed tools, reports, learner packages, and Case Report packets are unchanged.
- The reduced-motion storage key and existing header controls remain intact.
- System Access Lane and all investigation-tool behavior remain untouched.
- Case Briefing and every later screen remain intentionally unreplaced.

## Verification added

- `scripts/workspace-shell-theme-v1-smoke-check.mjs` protects the compact header, active-case strip, workflow order, responsive CSS, Evidence First wording, and no-persistence-coupling boundary.
- `npm run verify` includes the new focused guard.
- GitHub Actions includes a named Workspace shell approved-theme v1 smoke step.
- `tests/workspace-shell-browser.spec.mjs` covers the compact header, seven workflow stages, active state, Help control, case switching, Evidence First lock, desktop seven-column workflow, Pixel 7 two-column workflow, and page-width safety.

## Completion gate

The Workspace shell is complete only after the full named verification chain, production build, desktop Chromium, and Pixel 7 Chromium checks pass on the pull request and the branch is safely merged.

## Exact next starting point

After the Workspace shell pull request passes and merges, begin **Case Briefing only** from the new `main` head. Audit the repository again before editing. Do not combine Customer 360, investigation tools, Timeline, Decision and Luna, Academy, Profile, or final responsive polish with the Case Briefing change.
