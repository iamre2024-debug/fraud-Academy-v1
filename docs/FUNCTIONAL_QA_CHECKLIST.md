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
| Case strip | Case ID / claim type / status | Display active case metadata | Working | Keep |
| Case strip | Case Queue dropdown | Switch active case | Working | Retest after every case switch |
| Case Summary | Pin Case | Add case ID to tray and notebook | Working | Keep |
| Case Summary | Name / Claim ID / amount / transaction-payee / short summary | Show neutral case intake facts | Lightweight repair layer active | Move into React render next |
| Case Summary | Identity Intel / Case Report / Submit Decision quick routes | Open the matching tool or panel | Lightweight repair layer active | Move into React callbacks next |
| Case Summary | Long allegation / reason copy | Compact display with More / Less expansion | Temporarily disabled for stability | Rebuild inside React |
| Category tiles | Identity / Digital / Financial / Business / Evidence / Connections / Investigation | Switch category and default sub-tool | Working | Keep |
| Category tiles | Reviewed counters | Show completed sub-tool progress | Working | Keep |
| Category tiles | Progress bars | Show progress toward category completion | Working | Keep |
| Category heading | Tool Map | Opens Academy tool-map view | React navigation bridge | Move into direct React callback |
| Tool panel | Sub-tool dropdown | Switch live sub-tools within category | Working | Keep |
| Tool panel | Search bar | Filter visible records | Working | Keep |
| Tool panel | Decision route | Scroll to Submit Decision | Lightweight repair layer active | Move into React render next |
| Tool panel | Long purpose copy | Compact display with More / Less expansion | Temporarily disabled for stability | Rebuild inside React |
| Device Intelligence | Device ID column | Stable fictional ID per repeated device/customer | Lightweight repair layer active | Move into row builder next |
| Tool rows | Expand | Open/activate expanded record review | Working | Keep |
| Tool rows | Pin | Add record object to tray and notebook | Working | Keep |
| Record detail | Save expanded note | Save note into case notebook and agent archive | Working | Keep |
| Record detail | Save report note | Save generated report note | Working | Keep |
| Record detail | Save Case Report packet | Save structured packet by case | Working | Keep |
| Record detail | Mark reviewed | Add selected tool to completed tools | Working | Keep |
| Submit Decision | Checklist | Show neutral blockers only | Working | Keep Evidence First lock |
| Submit Decision | Choice / confidence / rationale | Save learner draft inputs | Working | Keep |
| Submit Decision | Save / Check Review Package | Save package only when checklist passes | Working | Keep |
| Submit Decision | Package input preview | Show reviewed tools, pinned objects, notes, and Case Report packet feed neutrally | Working | Keep |
| Luna Debrief | Locked state | Stay locked until package exists | Working | Keep |
| Luna Debrief | Score / strengths / focus | Show only after package exists | Working | Retest after saving package |
| Academy Progress | Progress cards | Read saved packages from localStorage | Working | Retest after saving package |
| Investigation Tray | Pinned objects | Show current case pinned evidence | Working | Keep |
| Investigation Tray | Open Evidence Center | Route user to Evidence Center workspace | Temporarily disabled with QA DOM patch | Move into React callback |
| Notebook | Textarea + Save Note | Save note to case and agent archive | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Notebook | Agent archive panel | Show agent notes by Agent ID | Working | Keep |
| Bottom nav | Dashboard | Open dashboard panel | React-managed | Retest |
| Bottom nav | Cases | Open case cards and switch case | React-managed | Retest case switch |
| Bottom nav | Workspace | Return to main workspace | React-managed | Retest |
| Bottom nav | Academy | Open learning path panel | React-managed | Retest |
| Bottom nav | Progress | Open progress panel | React-managed | Retest saved-package state |
| Verify scripts | `npm run functional-smoke-check` | Confirm source-of-truth, visual-shell, React navigation, persistence, category-progress, and Submit Decision anchors exist | Automated guard active | Keep inside `npm run verify` |
| Verify scripts | `npm run review-package-smoke-check` | Confirm Submit Decision locks for missing tools and short rationale, preserves optional packet feed, and snapshots saved packages | Automated guard active | Keep inside `npm run verify` |

## Immediate repair list

1. Move Device IDs, case summary metadata, Submit Decision routing, Tool Map routing, Evidence Center routing, and More / Less text controls into actual React state/rendering.
2. Keep `VisualTextCollapse.jsx` and broad DOM QA patch scripts disabled until they are rewritten without broad MutationObservers.
3. Keep the lightweight investigation repair layer event-based only. Do not add full-page observers back.
4. Keep the automated smoke guards current when changing case switching, category switching, sub-tool switching, search filtering, expand/pin/save note/save packet, Device IDs, case summary intake metadata, review package lock/unlock, and dashboard/cases/workspace/academy/progress navigation.
5. Confirm no clickable-looking decorative element exists without an action.
6. Run the full browser smoke path after each significant visual-shell change.

## Manual smoke test path

Use this path after every major UI update:

1. Open the app.
2. Click Dashboard, Cases, Workspace, Academy, and Progress.
3. Switch to each case from the case dropdown and from the Cases tab.
4. Confirm Case Summary shows name, claim ID, total amount, transaction/payee info, and short neutral summary.
5. Open Identity Intel, Case Report, and Submit Decision from the Case Summary quick actions.
6. Open Device Intelligence and confirm repeated devices show the same Device ID.
7. For each category, open every sub-tool from the dropdown.
8. Search one record term, expand a row, pin it, save an expanded note, save a report note, and save a Case Report packet.
9. Confirm the tray, notebook, packet panel, and agent archive update.
10. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
11. Fill choice, confidence, and rationale, then save a package.
12. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

The page-unresponsive hotfix removed broad text-collapse and QA scanning from startup. A lightweight event-based investigation repair layer now restores missing case-summary metadata, stable Device IDs, and decision/report/identity routes while the final React-native implementation is queued.
