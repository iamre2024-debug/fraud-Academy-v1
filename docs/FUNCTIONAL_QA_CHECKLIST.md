# Fraud Academy OS v1.0 Functional QA Checklist

This checklist is the working audit for the screenshot-driven visual shell. The purpose is to make sure every visible UI element has a real investigator function and nothing exists only to look pretty.

## QA doctrine

- Keep Evidence First locked before learner submission.
- No fraud/non-fraud answer, correct answer, fraud score, red flags, green flags, AI recommendations, or decision hints before Submit Decision saves a learner review package.
- Every tool must answer one investigator question.
- Every visible control must either perform an action, open a relevant view, save data, filter data, expand/collapse data, or clearly display real state.
- Decorative visual accents are allowed only when they do not look clickable.
- Long explanatory text should stay compact by default and expand only with a More / Less control.
- Automated smoke checks should protect the current visual-shell anchors and the Submit Decision package model, but they do not replace manual browser QA.

## Current functional map

| Area | Visible element | Expected function | Current status | QA action |
|---|---|---|---|---|
| Header | Fraud Academy OS banner | Identity / app title only | Decorative, acceptable | Keep decorative only |
| Header | Cats, bats, moon, butterfly accents | Visual theme only | Decorative, acceptable | Keep non-clickable |
| Case strip | Case ID / claim type / status | Display active case metadata | Working | Keep |
| Case strip | Case Queue dropdown | Switch active case | Working | Retest after every case switch |
| Case Summary | Pin Case | Add case ID to tray and notebook | Working | Keep |
| Case Summary | Notebook | Open investigation/notebook-related workspace | Partially working | Should scroll or route more clearly |
| Case Summary | Open First Tool | Return to Digital Activity / Login History | Working | Keep |
| Case Summary | Long allegation / reason copy | Compact display with More / Less expansion | Working after compact text pass | Retest on mobile |
| Category tiles | Identity / Digital / Financial / Business / Evidence / Connections / Investigation | Switch category and default sub-tool | Working | Keep |
| Category tiles | Reviewed counters | Show completed sub-tool progress | Working | Keep |
| Category tiles | Progress bars | Show progress toward category completion | Working | Keep |
| Category heading | Tool Map | Opens Academy tool-map view | Working through React navigation event | Keep |
| Tool panel | Sub-tool dropdown | Switch live sub-tools within category | Working | Keep |
| Tool panel | Search bar | Filter visible records | Working | Keep |
| Tool panel | Long purpose copy | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Tool rows | Expand | Open/activate expanded record review | Working | Keep |
| Tool rows | Pin | Add record object to tray and notebook | Working | Keep |
| Record detail | Save expanded note | Save note into case notebook and agent archive | Working | Keep |
| Record detail | Save report note | Save generated report note | Working | Keep |
| Record detail | Save Case Report packet | Save structured packet by case | Working | Keep |
| Record detail | Mark reviewed | Add selected tool to completed tools | Working | Keep |
| Record detail | Long history/link/report copy | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Submit Decision | Checklist | Show neutral blockers only | Working | Keep Evidence First lock |
| Submit Decision | Choice / confidence / rationale | Save learner draft inputs | Working | Keep |
| Submit Decision | Save / Check Review Package | Save package only when checklist passes | Working | Keep |
| Submit Decision | Package input preview | Show reviewed tools, pinned objects, notes, and Case Report packet feed neutrally | Working | Keep |
| Submit Decision | Long checklist copy | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Luna Debrief | Locked state | Stay locked until package exists | Working | Keep |
| Luna Debrief | Score / strengths / focus | Show only after package exists | Working | Retest after saving package |
| Luna Debrief | Long debrief copy | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Academy Progress | Progress cards | Read saved packages from localStorage | Working | Retest after saving package |
| Academy Progress | Long progress copy | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Investigation Tray | Pinned objects | Show current case pinned evidence | Working | Keep |
| Investigation Tray | Open Evidence Center | Route user to Evidence Center workspace | Working through React navigation event | Keep |
| Notebook | Textarea + Save Note | Save note to case and agent archive | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Notebook | Agent archive panel | Show agent notes by Agent ID | Working | Keep |
| Notebook | Long note text | Compact display with More / Less expansion | Working after compact text pass | Keep |
| Bottom nav | Dashboard | Open dashboard panel | React-managed | Retest |
| Bottom nav | Cases | Open case cards and switch case | React-managed | Retest case switch |
| Bottom nav | Workspace | Return to main workspace | React-managed | Retest |
| Bottom nav | Academy | Open learning path panel | React-managed | Retest |
| Bottom nav | Progress | Open progress panel | React-managed | Retest saved-package state |
| Verify scripts | `npm run functional-smoke-check` | Confirm source-of-truth, visual-shell, React navigation, persistence, category-progress, and Submit Decision anchors exist | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run review-package-smoke-check` | Confirm Submit Decision locks for missing tools and short rationale, preserves optional packet feed, and snapshots saved packages | Automated guard active | Keep inside `npm run verify` |

## Immediate repair list

1. Move More / Less text expansion into React components instead of the current DOM patch once the content structure stabilizes.
2. Move the remaining Tool Map and Open Evidence Center QA bridge actions into direct React callbacks when the visual workspace component is split into smaller modules.
3. Keep the automated smoke guards current when changing:
   - case switching
   - category switching
   - sub-tool switching
   - search filtering
   - expand/pin/save note/save packet
   - More / Less text expansion
   - review package lock and unlock
   - review package rationale minimums and Case Report packet feed
   - dashboard/cases/workspace/academy/progress navigation
4. Confirm no clickable-looking decorative element exists without an action.
5. Run the full browser smoke path after each significant visual-shell change.

## Manual smoke test path

Use this path after every major UI update:

1. Open the app.
2. Click Dashboard, Cases, Workspace, Academy, and Progress.
3. Switch to each case from the case dropdown and from the Cases tab.
4. Use Tool Map and Open Evidence Center.
5. For each category, open every sub-tool from the dropdown.
6. Search one record term, expand a row, pin it, save an expanded note, save a report note, and save a Case Report packet.
7. Confirm More / Less appears on long text and does not appear on short labels.
8. Confirm the tray, notebook, packet panel, and agent archive update.
9. Generate neutral reports until required tools are reviewed.
10. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
11. Try a short rationale and confirm Submit Decision remains locked.
12. Fill choice, confidence, and a complete rationale, then save a package.
13. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

Bottom navigation and its Dashboard, Cases, Academy, and Progress panels now use React state in `src/VisualNavigation.jsx`. The retired `src/visualNavPatch.js` DOM navigation script is no longer imported and has been removed. The functional smoke guard now checks the React navigation entrypoint and rejects reintroduction of the retired script. The remaining DOM bridge work is limited to compact More / Less controls and two QA routing helpers.
