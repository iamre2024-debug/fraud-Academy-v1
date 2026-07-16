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
| App shell | VisualApp coordinator | Own active case, live case catalog, and active tab in React | Working | Keep direct state wiring |
| Header module | VisualShellHeader module | Own ornate app header, active case strip, and Case Queue dropdown | Split from VisualWorkspace | Keep screenshot classes |
| Workspace model | visualWorkspaceModel module | Own category definitions, storage keys, row builders, and report packet construction | Split from VisualWorkspace | Keep module boundary |
| Active tool module | ActiveToolPanel module | Own sub-tool dropdown, search, table, expanded record lanes, pin/review/report actions | Split from VisualWorkspace | Keep screenshot classes |
| Bottom grid module | BottomInvestigationGrid module | Own Investigation Tray, Notebook, note compose, and case-scoped notes | Split from VisualWorkspace | Keep case-scoped props |
| Case summary module | CaseSummaryCard module | Own neutral intake facts, Pin Case, quick tool routes, and Submit Decision jump | Split from VisualWorkspace | Keep no-answer summary |
| Category rail module | CategoryTileRail module | Own ornate category buttons, reviewed counters, progress bars, and Tool Map route | Split from VisualWorkspace | Keep neutral progress only |
| Submit module | SubmitDecisionPanel module | Own locked Submit Decision visual markup and learner inputs | Split from VisualWorkspace | Keep Evidence First lock |
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
| Connections | System Access Lane sub-tool | Show neutral Insider / Vendor / API / Open Banking records through the standard workspace table | Workspace sub-tool | Retest |
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
| Evidence tool group | Open Document Viewer | Open the standalone viewer without preloading customer documents | React callback | Retest |
| Notebook | Textarea + Save Note | Save note to active case | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Bottom nav | Dashboard | Open dashboard panel | React-managed | Retest |
| Bottom nav | Cases | Open case cards and switch case | React-managed direct callback | Retest case switch |
| Bottom nav | Workspace | Return to main workspace | React-managed | Retest |
| Bottom nav | Academy | Open learning path panel | React-managed | Retest |
| Bottom nav | Progress | Open progress panel | React-managed | Retest saved-package state |
| Generated cases | Generate + Open Case | Save a local generated case, add it to the live catalog, and open it without page refresh | React callback | Retest generated case |
| Verify scripts | `npm run functional-smoke-check` | Confirm source-of-truth, visual-shell, direct React routes, persistence, category-progress, compact text, and Submit Decision anchors exist | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run visual-three-case-smoke-check` | Confirm all three built-in cases have enriched intake metadata, stable Device IDs, record depth, direct route anchors, and expanded Submit Decision choices | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run review-package-smoke-check` | Confirm Submit Decision locks for missing tools and short rationale, preserves optional packet feed, and snapshots saved packages | Automated guard active | Keep inside `npm run verify` |

## Immediate repair list

1. Run GitHub Actions verify and the manual browser smoke path after the direct React routing migration.
2. Continue splitting `VisualWorkspace.jsx` into smaller React modules so compact text can move away from selector-discovery compatibility. The visual shell header, workspace model, active tool panel, bottom investigation grid, case summary card, category rail, and Submit Decision panel are already split.
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
6. Open Document Viewer from the Evidence tool group, confirm no documents preload, search an exact Account ID, and verify only the matching customer packet appears.
7. Confirm Case Summary shows name, claim ID, total amount, transaction/payee info, and short neutral summary.
8. Open Identity Intel, Case Report, and Submit Decision from the Case Summary quick actions.
9. Open Device Intelligence and confirm repeated devices show the same Device ID.
10. For each category, open every sub-tool from the dropdown, including Connections → System Access Lane.
11. Use Generate + Open Case and confirm the generated case opens without a page refresh.
12. Confirm the generated case appears in the case dropdown and Cases panel.
13. Search one record term, expand a row, pin it, save an expanded note, and save a Case Report packet.
14. Confirm the tray, notebook, and packet panel update by case.
15. Generate neutral reports until required tools are reviewed.
16. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
17. Fill choice, confidence, and rationale, then save a package.
18. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

The lightweight investigation repair script has been retired. Device IDs, case-summary metadata, Submit Decision routing, Tool Map routing, generated-case opening, case switching, and the System Access Lane sub-tool now run through React state/callbacks from `VisualApp.jsx`, `VisualWorkspace.jsx`, `visualWorkspaceModel.js`, and `VisualNavigation.jsx` while keeping the screenshot-driven visual design intact. Document Viewer is opened only from the Evidence tool group and requires an exact Account ID before customer records appear. The three built-in cases now have an automated visual smoke guard in `npm run verify`; the browser smoke path is still required for real click/viewport confirmation.
