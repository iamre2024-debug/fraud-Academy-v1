# Fraud Academy functional integration conflict log

## Integration boundary

- Integration branch: `agent/integrate-functional-models-87-88-90-20260727`
- Base: `main` at `03bd1ebffea09187ae595313e6b20f909771282a`
- Included: functional work from PRs #87, #88, and #90
- Deferred: PR #89, mobile Chromium, mobile screenshots, and every mobile-shell or Quick Pad visual change
- Excluded: all theme and CSS changes
- Preserved runtime path: `main.jsx → VisualApp.jsx → VisualWorkspace.jsx → InvestigationToolPanel.jsx`

The draft branches were used as implementation inputs, not merged as complete units. Contradictory branch-specific tests were replaced or updated to assert the integrated contracts.

## Collision resolutions

| Collision | Final source | Resolution and reason |
|---|---|---|
| Case taxonomy and summary generation | #88 structure, #87 wording | The three-axis Customer Type → Product → Review Workflow model and scenario-generation structure come from #88. The email and payroll summaries use #87's factual alert-trigger language. No summary asserts that an email, mailbox, employee, customer, or business was compromised. |
| Credit workflow placement | #88 | Credit Application Review is limited to new credit applications; Credit Risk Review is limited to existing credit relationships. Payroll Product exposes only Payroll Change Alert and Payroll Account Takeover. |
| Customer 360 and shared relationship accounts | #88 | #88 owns the personal-customer home and shared account relationship model. Routes preserve exact account, identity, device, login, session, and linked-business record identifiers. |
| Personal customer with a linked employer payroll record | #88 taxonomy, #90 related-record tools | Avery remains a Personal → Personal Loan → Credit Risk Review case. Customer 360 remains the personal home, while the exact linked employer opens Business 360 and its supplied Employee Profile and Payroll History. Transaction History remains available because this is not a Payroll Product or payroll-alert workflow. |
| Financial Investigation | #88, extended for #90 payroll records | #88 supplies the product-aware section model and dated comparisons. #90's normalized payroll records feed the business-payroll section without changing the taxonomy or adding automated conclusions. |
| Standalone KYB Review | #90 | Navigation, toolkits, completion state, Quick Pad sources, review packages, and KYB/REG/SOS/EIN pins migrate to Business 360. A private compatibility adapter remains only to read legacy business-source data; it is not a navigable tool. |
| Business 360 taxonomy fields | #88 taxonomy over #90 profile | #90 supplies the reusable Business 360 profile and research model. The customer/product/workflow fields remain governed by #88. Active-case identifiers, claims, alerts, documents, handoffs, and conclusions are excluded from the reusable company profile. |
| Business 360 owner records | #90 | Owners and controlling parties remain separate personal records with complete current and previous residential addresses, identity, ownership, control/guarantor, contact, verification, device, account, and contact-history data. |
| Payroll and employee records | #90 | #90 supplies the normalized immutable hierarchy, employee tax profile, event-specific paystubs, company funding Bank Code, employee Bank Code and Destination ID, split deposits, paper checks, off-cycle/bonus/correction/reversal runs, and pending/failed/returned states. |
| Historical payment destinations | #90 plus integration migration | Event-specific pay dates determine destinations. Recoverable history is repaired in place; unrecoverable history becomes `destinationUnavailable`. No plausible destination is manufactured. |
| Payment Verification handoffs | #90 | Paystubs can copy, pin, or pass Bank Code and Destination ID as search input. Ownership and verification data remain hidden until an exact search; a not-found search clears the prior result. Business 360 does not expose an active-case payment-change handoff, and employee profiles do not carry current destination identifiers. |
| Hidden finding storage and public state | Integrated migration over #87/#88/#90 | The prior regex result is derived once into `hiddenFinding` and frozen. Public case records, view data, and pre-submission payloads are guarded against the explicit field. |
| Payroll cases with retired credit workflows | #88 taxonomy plus integrated migration | Existing payroll credit cases are reassigned, never hidden. Payroll Change Alert is the default; Payroll Account Takeover requires an explicit credential- or session-compromise event. The original hidden finding is preserved and every reassignment is audited. |
| Migration ownership | Integrated implementation | The hidden-finding, payroll-workflow, historical-destination, and KYB-to-Business-360 migrations share one stored schema-version gate. Worked IDs, generated cases, notes, pins, Quick Pad state, completed tools, drafts, packages, document requests, and debriefs remain intact. |
| Verification tests | Integrated contract | Draft-specific assertions that encoded retired KYB navigation, mixed payroll/credit taxonomy, employee-level destination copying, or Business 360 claim handoffs were replaced by one combined suite and aligned focused checks. |

## Deferred draft collisions

PRs #85 and #86 are intentionally unchanged in this pass. Their disposition must be decided before PR #89 is integrated because #86 overlaps the deferred Link Analysis/mobile workspace and #85 changes the theme surface. This is a sequencing requirement for the later visual pass, not a conflict inside the present functional scope.
