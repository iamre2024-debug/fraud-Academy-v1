# Payment Verification — Build-Ready Acceptance Checklist

Status: required fixes implemented in this branch.

This checklist reconciles the Fraud Academy Master Bible, Design Chat direction, the Payment Verification reference layout, and the Evidence First rules. The Master Bible controls behavior; the screenshot controls presentation only where it does not conflict with Evidence First.

## Locked behavior

- Payment Verification starts as a blank lookup gate.
- The investigator must enter Bank Code, Destination ID, and the owner or business name to compare.
- Account Snapshot, name result, ownership, status, history, attempts, and related evidence remain unmounted until an exact Bank Code + Destination ID lookup runs.
- Canonical name results are `Match`, `Partial Match`, `No Match`, `Unable to Verify`, and `Destination Not Found`.
- Payment Verification reports evidence. It must not approve, deny, hold, release, pause, or decide the case.
- Customer 360, Financial Investigation, Employee Profile, Payroll History, and Business 360 may provide source identifiers or prefill the form. Prefill never auto-runs the lookup.

## Contradictions resolved

| Source conflict | Resolution |
|---|---|
| Reference screenshot displays all account results immediately | Keep its snapshot/detail hierarchy, but place it behind the required lookup gate. |
| Screenshot includes `Fraud` as an account status | Do not use fraud as operational account status. Separate operational status, standing, payment status, and investigator determination. |
| Older records use `Name match`, `No info`, free-text partials | Normalize to the five canonical name results. |
| Older records mix ownership with account status | Show name-match result, ownership status, operational status, and standing as separate fields. |
| Older action copy tells the learner to hold or pause | Replace pre-decision commands with neutral documentation, comparison, and routing actions. |
| Old built-in names do not match the active customer | Correct Maya Sterling and Avery Brooks records; preserve initials only as partial-match variants. |
| Design Chat calls for a call drawer on every result | Render callback evidence only when a callback/contact attempt exists. |

## Required acceptance checklist

### Search and reveal

- [x] Blank initial gate; no result record is selected automatically.
- [x] All three inputs are required and accessible by label.
- [x] Lookup requires an exact normalized Bank Code + Destination ID pair.
- [x] A missing pair returns `Destination Not Found` without leaking nearby records.
- [x] Editing a prefilled field clears any stale result.
- [x] Reset clears inputs and the revealed result.
- [x] Case-scoped lookup history records query and outcome.

### Results and evidence

- [x] Name comparison produces the canonical result set.
- [x] Name match and ownership status are separate.
- [x] Operational account status, standing, payment type, and payment status are separate.
- [x] Ownership history and prior-use history are both present.
- [x] Return/NSF history is explicit even when no separate history is supplied.
- [x] Old-versus-new destination comparison is present.
- [x] Verification attempts show time, method, result, and note.
- [x] Callback drawer is conditional and names the trusted contact source.
- [x] Customer/entity link, related records, recoverability context, and neutral evidence summary are present.

### Variants and routing

- [x] Personal variant points to Customer 360.
- [x] Payroll variant points to Employee Profile/employer contact evidence.
- [x] Business variant points to Business 360/KYB contact evidence.
- [x] Customer 360 and linked-account records can prefill the lookup without revealing results.
- [x] Built-in, generated, and fallback cases use the same normalized contract.

### Evidence First and responsive behavior

- [x] No fraud/non-fraud conclusion or score appears before submission.
- [x] No verification action button contains approve, deny, hold, release, or pause instructions.
- [x] Review cannot be marked complete before a lookup attempt.
- [x] Result content fits the desktop workspace.
- [x] Mobile collapses to a single-column tool page with 44px controls.

## Required fixes vs. later enhancements

Required fixes are every checked item above and are included in this branch.

Later enhancements:

- Connect to a real verification provider in a controlled non-training environment.
- Add role-based permissions and audit export.
- Add configurable institution-specific response codes.
- Add richer callback scheduling and disposition states.
- Add aggregate reporting across cases.
- Add localization and expanded accessibility testing with assistive-technology users.

These enhancements are not required for the training build to satisfy the reconciled acceptance contract.
