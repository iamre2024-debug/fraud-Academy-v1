# Fraud Academy OS v1.0 Functional QA Checklist

This checklist is the working audit for the screenshot-driven visual shell. The purpose is to make sure every visible UI element has a real investigator function and nothing exists only to look pretty.

## QA doctrine

- Keep Evidence First locked before learner submission.
- No fraud/non-fraud answer, correct answer, fraud score, red flags, green flags, AI recommendations, or decision hints before Submit Decision saves a learner review package.
- Every tool must answer one investigator question.
- Every visible control must either perform an action, open a relevant view, save data, filter data, or clearly display real state.
- Decorative visual accents are allowed only when they do not look clickable.

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
| Category tiles | Identity / Digital / Financial / Business / Evidence / Connections / Investigation | Switch category and default sub-tool | Working | Keep |
| Category tiles | Reviewed counters | Show completed sub-tool progress | Working | Keep |
| Category tiles | Progress bars | Show progress toward category completion | Working | Keep |
| Category heading | View All | Currently unclear | Needs repair | Make it open a full tool map or remove button styling |
| Tool panel | Sub-tool dropdown | Switch live sub-tools within category | Working | Keep |
| Tool panel | Search bar | Filter visible records | Working | Keep |
| Tool rows | Expand | Open/activate expanded record review | Working | Keep |
| Tool rows | Pin | Add record object to tray and notebook | Working | Keep |
| Record detail | Save expanded note | Save note into case notebook and agent archive | Working | Keep |
| Record detail | Save report note | Save generated report note | Working | Keep |
| Record detail | Save Case Report packet | Save structured packet by case | Working | Keep |
| Record detail | Mark reviewed | Add selected tool to completed tools | Working | Keep |
| Submit Decision | Checklist | Show neutral blockers only | Working | Keep Evidence First lock |
| Submit Decision | Choice / confidence / rationale | Save learner draft inputs | Working | Keep |
| Submit Decision | Save / Check Review Package | Save package only when checklist passes | Working | Keep |
| Luna Debrief | Locked state | Stay locked until package exists | Working | Keep |
| Luna Debrief | Score / strengths / focus | Show only after package exists | Working | Retest after saving package |
| Academy Progress | Progress cards | Read saved packages from localStorage | Working | Retest after saving package |
| Investigation Tray | Pinned objects | Show current case pinned evidence | Working | Keep |
| Investigation Tray | Evidence is saved by case button | Currently informational but button-shaped | Needs repair | Convert to non-clickable status or make it open Evidence Center |
| Notebook | Textarea + Save Note | Save note to case and agent archive | Working | Keep |
| Notebook | Case Report packets panel | Show saved packet feed | Working | Keep |
| Notebook | Agent archive panel | Show agent notes by Agent ID | Working | Keep |
| Bottom nav | Dashboard | Open dashboard panel | Working after nav patch | Retest |
| Bottom nav | Cases | Open case cards and switch case | Working after nav patch | Retest |
| Bottom nav | Workspace | Return to main workspace | Working after nav patch | Retest |
| Bottom nav | Academy | Open learning path panel | Working after nav patch | Retest |
| Bottom nav | Progress | Open progress panel | Working after nav patch | Retest |

## Immediate repair list

1. Replace the category heading `View All` button with a real tool-map action or make it non-clickable.
2. Replace the tray `Evidence is saved by case` button with either a status pill or a real Evidence Center route.
3. Move bottom navigation behavior into React state instead of the current DOM patch once the major UI settles.
4. Add a smoke-test script or manual QA checklist for:
   - case switching
   - category switching
   - sub-tool switching
   - search filtering
   - expand/pin/save note/save packet
   - review package lock and unlock
   - dashboard/cases/workspace/academy/progress navigation
5. Confirm no clickable-looking decorative element exists without an action.

## Manual smoke test path

Use this path after every major UI update:

1. Open the app.
2. Click Dashboard, Cases, Workspace, Academy, and Progress.
3. Switch to each case from the case dropdown and from the Cases tab.
4. For each category, open every sub-tool from the dropdown.
5. Search one record term, expand a row, pin it, save an expanded note, save a report note, and save a Case Report packet.
6. Confirm the tray, notebook, packet panel, and agent archive update.
7. Generate neutral reports until required tools are reviewed.
8. Try Submit Decision while locked and confirm it only gives neutral checklist blockers.
9. Fill choice, confidence, and rationale, then save a package.
10. Confirm Luna Debrief and Academy Progress unlock only after package save.

## Latest QA status

Functional QA pass started after the bottom navigation repair. The app now needs cleanup of remaining button-shaped informational controls and a stronger React-native navigation implementation.
