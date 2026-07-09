# Fraud Academy OS v1.0 Functional QA Checklist

This checklist is the working audit for the screenshot-driven visual shell. The purpose is to make sure every visible UI element has a real investigator function and nothing exists only to look pretty.

## QA doctrine

- Keep Evidence First locked before learner submission.
- No fraud/non-fraud answer, correct answer, fraud score, red flags, green flags, AI recommendations, or decision hints before Submit Decision saves a learner review package.
- Every tool must answer one investigator question.
- Every visible control must either perform an action, open a relevant view, save data, filter data, or clearly display real state.
- Decorative visual accents are allowed only when they do not look clickable.
- Cards should stay compact by default. Long details should use More / Less or the expanded record flow.

## Current functional map

| Area | Visible element | Expected function | Current status | QA action |
|---|---|---|---|---|
| Header | Fraud Academy OS banner | Identity / app title only | Decorative, acceptable | Keep decorative only |
| Header | Cats, bats, moon, butterfly accents | Visual theme only | Decorative, acceptable | Keep non-clickable |
| Case strip | Case ID / claim type / status | Display active case metadata | Working | Keep |
| Case strip | Case Queue dropdown | Switch active case | Working | Retest after every case switch |
| Case Summary | Name / claim ID / amount / transaction-payee / short summary | Display the minimum case intake facts without revealing outcome | Working through investigation repair layer | Move into React data model later |
| Case Summary | Pin Case | Add case ID to tray and notebook | Working | Keep |
| Case Summary | Notebook | Open investigation/notebook-related workspace | Partially working | Should scroll or route more clearly |
| Case Summary | Open First Tool | Return to Digital Activity / Login History | Working | Keep |
| Case Summary | Identity Intel / Case Report / Submit Decision quick actions | Direct routes to key investigation actions | Working through investigation repair layer | Move into React callbacks later |
| Case Summary | Long allegation / reason copy | Compact display with More / Less expansion | React-managed | Retest on mobile |
| Category tiles | Identity / Digital / Financial / Business / Evidence / Connections / Investigation | Switch category and default sub-tool | Working | Keep |
| Category tiles | Reviewed counters | Show completed sub-tool progress | Working | Keep |
| Category tiles | Progress bars | Show progress toward category completion | Working | Keep |
| Category heading | Tool Map | Opens Academy tool-map view | Working through React navigation event | Keep |
| Tool panel | Sub-tool dropdown | Switch live sub-tools within category | Working | Keep |
| Tool panel | Search bar | Filter visible records | Working | Keep |
| Tool panel | Device Intelligence Device ID display | Show stable fictional Device IDs so repeated devices are recognizable | Working through investigation repair layer | Move to real row model later |
| Tool panel | Submit Decision mini route | Provide visible decision path from active tool panel | Working through investigation repair layer | Keep until React refactor |
| Tool panel | Long purpose copy | Compact display with More / Less expansion | React-managed | Keep |
| Tool rows | Expand | Open/activate expanded record review | Working | Keep |
| Tool rows | Pin | Add record object to tray and notebook | Working | Keep |
| Record detail | Save expanded note | Save note into case notebook and agent archive | Working | Keep |
| Record detail | Save report note | Save generated report note | Working | Keep |
| Record detail | Save Case Report packet | Save structured packet by case | Working | Keep |
| Record detail | Mark reviewed | Add selected tool to completed tools | Working | Keep |
| Record detail | Long history/link/report copy | Compact display with More / Less expansion | React-managed | Keep |
| Submit Decision | Checklist | Show neutral blockers only | Working | Keep Evidence First lock |
| Submit Decision | Choice / confidence / rationale | Save learner draft inputs | Working | Keep |
| Submit Decision | Save / Check Review Package | Save package only when checklist passes | Working | Keep |
| Submit Decision | Package input preview | Show reviewed tools, pinned objects, notes, and Case Report packet feed neutrally | Working | Keep |
| Submit Decision | Long checklist copy | Compact display with More / Less expansion | React-managed | Keep |
| Luna Debrief | Locked state | Stay locked until package exists | Working | Keep |
| Luna Debrief | Score / strengths / focus | Show only after package exists | Working | Retest after saving package |
| Luna Debrief | Long debrief copy | Compact display with More / Less expansion | React-managed | Keep |
| Academy Progress | Progress cards | Read saved packages from localStorage | Working | Retest after saving package |
| Academy Progress | Long progress copy | Compact display with More / Less expansion | React-managed | Keep |
| Investigation Tray | Pinned objects | Show current case pinned evidence | Working | Keep |
| Investigation Tray | Open Evidence Center | Route user to Evidence Center workspace | Working through React navigation event | Keep |
| Notebook | Textarea + Save Note | Save note to case and agent archive | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Notebook | Agent archive panel | Show agent notes by Agent ID | Working | Keep |
| Notebook | Long note text | Compact display with More / Less expansion | React-managed | Keep |
| Bottom nav | Dashboard | Open dashboard panel | React-managed | Retest |
| Bottom nav | Cases | Open case cards and switch case | React-managed | Retest case switch |
| Bottom nav | Workspace | Return to main workspace | React-managed | Retest |
| Bottom nav | Academy | Open learning path panel | React-managed | Retest |
| Bottom nav | Progress | Open progress panel | React-managed | Retest saved-package state |
| Verify scripts | `npm run functional-smoke-check` | Confirm source-of-truth, visual-shell, React navigation, React text controls, persistence, category-progress, and Submit Decision anchors exist | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run review-package-smoke-check` | Confirm Submit Decision locks for missing tools and short rationale, preserves optional packet feed, and snapshots saved packages | Automated guard active | Keep inside `npm run verify` |

## Immediate repair list

1. Move the investigation repair layer into the actual React row builders so Device IDs and case summary metadata are not DOM-enhanced after render.
2. Replace selector discovery inside `VisualTextCollapse.jsx` with direct reusable text wrappers when the visual workspace and navigation panels are split into smaller React modules.
3. Move the remaining Tool Map and Open Evidence Center QA bridge actions into direct React callbacks when the visual workspace component is split into smaller modules.
4. Keep the automated smoke guards current when changing:
   - case switching
   - category switching
   - sub-tool switching
   - search filtering
   - expand/pin/save note/save packet
   - More / Less text expansion
   - Device Intelligence ID history
   - case summary intake metadata
   - review package lock and unlock
   - review package rationale minimums and Case Report packet feed
   - dashboard/cases/workspace/academy/progress navigation
5. Confirm no clickable-looking decorative element exists without an action.
6. Run the full browser smoke path after each significant visual-shell change.

## Manual smoke test path

Use this path after every major UI update:

1. Open the app.
2. Confirm Case Summary shows name, claim ID, amount, transaction/payee, and short summary.
3. Click Dashboard, Cases, Workspace, Academy, and Progress.
4. Switch to each case from the case dropdown and from the Cases tab.
5. Use Tool Map and Open Evidence Center.
6. Use Case Summary quick routes for Identity Intel, Case Report, and Submit Decision.
7. Open Device Intelligence and confirm repeated device names keep the same Device ID.
8. For each category, open every sub-tool from the dropdown.
9. Search one record term, expand a row, pin it, save an expanded note, save a report note, and save a Case Report packet.
10. Confirm More / Less appears on long text and does not appear on short labels.
11. Confirm the tray, notebook, packet panel, and agent archive update.
12. Generate neutral reports until required tools are reviewed.
13. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
14. Fill choice, confidence, and rationale, then save a package.
15. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

The latest pass responds to user QA feedback: case summary now has intake facts, Device Intelligence shows stable fictional Device IDs, and direct routes were added for Identity Intelligence, Case Report, and Submit Decision. Next cleanup is to move these enhancements from DOM repair layers into the React data/render model.
