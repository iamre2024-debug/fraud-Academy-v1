# Fraud Academy OS v1.0 Functional QA Checklist

This checklist is the working audit for the screenshot-driven visual shell. The purpose is to make sure every visible UI element has a real investigator function and nothing exists only to look pretty.

## QA doctrine

- Keep Evidence First locked before learner submission.
- No fraud/non-fraud answer, correct answer, fraud score, red flags, green flags, AI recommendations, or decision hints before Submit Decision saves a learner review package.
- Every tool must answer one investigator question.
- Every visible control must either perform an action, open a relevant view, save data, filter data, or clearly display real state.
- Decorative visual accents are allowed only when they do not look clickable.
- Avoid broad MutationObserver/page-scanning scripts because they can make the app unresponsive.

## Current functional map

| Area | Visible element | Expected function | Current status | QA action |
|---|---|---|---|---|
| Header | Fraud Academy OS banner | Identity / app title only | Decorative, acceptable | Keep decorative only |
| Header | Cats, bats, moon, butterfly accents | Visual theme only | Decorative, acceptable | Keep non-clickable |
| App shell | VisualApp coordinator | Own active case and active tab in React | Working | Keep direct state wiring |
| Case strip | Case ID / claim type / status | Display active case metadata | Working | Keep |
| Case strip | Case Queue dropdown | Switch active case | React callback | Retest after every case switch |
| Case Summary | Pin Case | Add case ID to tray | Working | Keep |
| Case Summary | Name / Claim ID / amount / transaction-payee / short summary | Show neutral case intake facts | React-rendered | Keep |
| Case Summary | Identity Intel / Case Report / Submit Decision quick routes | Open the matching tool or panel | React callbacks | Retest |
| Category tiles | Identity / Digital / Financial / Business / Evidence / Connections / Investigation | Switch category and default sub-tool | Working | Keep |
| Category tiles | Reviewed counters | Show completed sub-tool progress | Working | Keep |
| Category tiles | Progress bars | Show progress toward category completion | Working | Keep |
| Category heading | Tool Map | Opens Academy tool-map view | React callback | Retest |
| Tool panel | Sub-tool dropdown | Switch live sub-tools within category | Working | Keep |
| Tool panel | Search bar | Filter visible records | Working | Keep |
| Tool panel | Decision route | Scroll to Submit Decision | React callback | Retest |
| Device Intelligence | Device ID column | Stable fictional ID per repeated device/customer | Row builder | Retest each case |
| Tool rows | Expand | Open/activate expanded record review | Working | Keep |
| Tool rows | Pin | Add record object to tray | Working | Keep |
| Record detail | Save expanded note | Save note into case notebook | Working | Keep |
| Record detail | Save Case Report packet | Save structured packet by case | Working | Keep |
| Record detail | Mark reviewed | Add selected tool to completed tools | Working | Keep |
| Submit Decision | Checklist | Show neutral blockers only | Working | Keep Evidence First lock |
| Submit Decision | Choice / confidence / rationale | Save learner draft inputs | Working | Keep |
| Submit Decision | Save / Check Review Package | Save package only when checklist passes | Working | Keep |
| Submit Decision | Package input preview | Show reviewed tools, pinned objects, notes, and Case Report packet feed neutrally | Working | Keep |
| Luna Debrief | Locked state | Stay locked until package exists | Working | Keep |
| Investigation Tray | Pinned objects | Show current case pinned evidence | Working | Keep |
| Investigation Tray | Open Evidence Center | Route user to Evidence Center workspace | React callback | Retest |
| Notebook | Textarea + Save Note | Save note to active case | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Bottom nav | Dashboard | Open dashboard panel | React-managed | Retest |
| Bottom nav | Cases | Open case cards and switch case | React-managed direct callback | Retest case switch |
| Bottom nav | Workspace | Return to main workspace | React-managed | Retest |
| Bottom nav | Academy | Open learning path panel | React-managed | Retest |
| Bottom nav | Progress | Open progress panel | React-managed | Retest saved-package state |
| Verify scripts | `npm run functional-smoke-check` | Confirm source-of-truth, visual-shell, direct React routes, persistence, category-progress, compact text, and Submit Decision anchors exist | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run review-package-smoke-check` | Confirm Submit Decision locks for missing tools and short rationale, preserves optional packet feed, and snapshots saved packages | Automated guard active | Keep inside `npm run verify` |

## Immediate repair list

1. Run GitHub Actions verify and the manual browser smoke path after the direct React routing migration.
2. Continue splitting `VisualWorkspace.jsx` into smaller React modules so compact text can move away from selector-discovery compatibility.
3. Keep retired DOM patch scripts out of startup: `visualNavPatch.js`, `visualTextCollapse.js`, and `visualInvestigationRepair.js`.
4. Keep the automated smoke guards current when changing case switching, category switching, sub-tool switching, search filtering, expand/pin/save note/save packet, Device IDs, case summary intake metadata, review package lock/unlock, and dashboard/cases/workspace/academy/progress navigation.
5. Confirm no clickable-looking decorative element exists without an action.
6. Run the full browser smoke path after each significant visual-shell change.

## Manual smoke test path

Use this path after every major UI update:

1. Open the app.
2. Confirm the page does not become unresponsive after 30 seconds.
3. Click Dashboard, Cases, Workspace, Academy, and Progress.
4. Switch to each case from the case dropdown and from the Cases tab.
5. Use Tool Map and confirm it opens the Academy panel.
6. Use Open Evidence Center and confirm it switches to Evidence → Evidence Center.
7. Confirm Case Summary shows name, claim ID, total amount, transaction/payee info, and short neutral summary.
8. Open Identity Intel, Case Report, and Submit Decision from the Case Summary quick actions.
9. Open Device Intelligence and confirm repeated devices show the same Device ID.
10. For each category, open every sub-tool from the dropdown.
11. Search one record term, expand a row, pin it, save an expanded note, and save a Case Report packet.
12. Confirm the tray, notebook, and packet panel update by case.
13. Generate neutral reports until required tools are reviewed.
14. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
15. Fill choice, confidence, and rationale, then save a package.
16. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

The lightweight investigation repair script has been retired. Device IDs, case-summary metadata, Submit Decision routing, Tool Map routing, Open Evidence Center routing, and case switching now run through React state/callbacks from `VisualApp.jsx`, `VisualWorkspace.jsx`, and `VisualNavigation.jsx` while keeping the screenshot-driven visual design intact.
