export const flagWeightPoints = {
  Critical: 8,
  High: 5,
  Medium: 3,
  Low: 1,
};

function flag(id, type, weight, prompt, evidenceHint, options = {}) {
  return { id, type, weight, prompt, evidenceHint, ...options };
}

const checklistByClaimType = {
  'account-takeover': {
    title: 'Account Takeover decision checklist',
    description: 'Document the access, authentication, profile-control, and transaction evidence that supports or contradicts the customer claim.',
    flags: [
      flag('ato-known-access', 'red', 'High', 'Did the disputed activity use a trusted device, familiar location, and normal customer access pattern?', 'Cite the login, device, IP, and session records that establish the normal pattern.'),
      flag('ato-customer-mfa', 'red', 'High', 'Did the customer approve the MFA, wallet enrollment, or authentication event tied to the activity?', 'Cite the MFA event, destination, timestamp, and customer statement.'),
      flag('ato-no-control-change', 'red', 'Medium', 'Was there no password, contact, MFA, payee, or profile-control change before the disputed activity?', 'Cite the profile and session records covering the reported fraud period.'),
      flag('ato-new-device', 'green', 'High', 'Did a first-seen or unrecognized device access the account during the reported fraud period?', 'Cite the device ID, first-seen date, login, and customer recognition response.'),
      flag('ato-unusual-network', 'green', 'High', 'Did the access come from an unusual IP, location, network, or impossible-travel sequence?', 'Cite the IP record, location history, timestamps, and normal-location comparison.'),
      flag('ato-control-change', 'green', 'High', 'Did a password, contact method, MFA route, payee, or wallet control change occur before the loss?', 'Cite the exact change event and the related transaction or session timeline.'),
    ],
  },
  'fraud-chargeback': {
    title: 'Fraud Chargeback decision checklist',
    description: 'Compare card possession, entry mode, wallet-token, authentication, merchant, and customer evidence.',
    flags: [
      flag('fcb-customer-authentication', 'red', 'High', 'Did authentication and device evidence connect the disputed purchase to the customer?', 'Cite the authorization, 3DS, MFA, wallet token, device, and IP records.'),
      flag('fcb-known-merchant', 'red', 'Medium', 'Was the merchant or purchase pattern established in the customer history?', 'Cite prior transactions, merchant relationship, refunds, or saved account activity.'),
      flag('fcb-fulfillment', 'red', 'High', 'Do delivery, activation, usage, or service records connect the customer to the purchase?', 'Cite the merchant record, delivery or usage record, date, and matching customer field.'),
      flag('fcb-new-token-device', 'green', 'High', 'Was a new wallet token, device, or payment credential used for the disputed activity?', 'Cite the token or device ID, enrollment time, first use, and customer statement.'),
      flag('fcb-card-possession', 'green', 'Medium', 'Did the customer retain the physical card while an unfamiliar digital transaction occurred?', 'Cite the customer statement, card status, entry mode, and transaction record.'),
      flag('fcb-merchant-gap', 'green', 'High', 'Is required merchant authorization or fulfillment evidence missing or inconsistent?', 'Cite the missing requirement, reason code, merchant response, or contradictory record.'),
    ],
  },
  'non-fraud-chargeback': {
    title: 'Non-Fraud Chargeback decision checklist',
    description: 'Apply the dispute reason to the merchant, cancellation, refund, delivery, and customer-contact evidence.',
    flags: [
      flag('ncb-merchant-fulfilled', 'red', 'High', 'Does the merchant packet show the agreed product or service was correctly provided?', 'Cite the receipt, policy, delivery, usage, service, or merchant response record.'),
      flag('ncb-late-cancellation', 'red', 'Medium', 'Was cancellation or refund requested after the charge or outside the applicable terms?', 'Cite the billing date, cancellation date, policy, and customer contact.'),
      flag('ncb-recurring-history', 'red', 'Low', 'What prior recurring billing history provides context for this dispute?', 'Cite prior charges and contacts as context only; prior payment does not prove a later cancellation was invalid.'),
      flag('ncb-cancellation-proof', 'green', 'High', 'Is there proof that cancellation or return occurred before the disputed billing?', 'Cite the confirmation, return tracking, merchant message, date, and applicable transaction.'),
      flag('ncb-billing-error', 'green', 'High', 'Do the records show a duplicate, incorrect amount, missing refund, or billing error?', 'Cite both transactions, expected amount, refund record, or merchant acknowledgment.'),
      flag('ncb-required-evidence-gap', 'green', 'Medium', 'Is the merchant missing evidence required for the selected dispute reason?', 'Cite the reason-code requirement and the missing or incomplete merchant document.'),
    ],
  },
  'first-party-fraud': {
    title: 'First-Party Fraud decision checklist',
    description: 'Compare the customer story with authorization, fulfillment, benefit, prior claims, and merchant records.',
    flags: [
      flag('fpf-benefit-delivery', 'red', 'High', 'Do delivery, activation, usage, or benefit records connect the customer to the disputed activity?', 'Cite the matching delivery, device, usage, account, or beneficiary evidence.'),
      flag('fpf-repeat-pattern', 'red', 'High', 'Is there a repeated pattern of similar recent claims, merchants, amounts, or stories?', 'Cite the prior claim IDs, dates, outcomes, and matching pattern.'),
      flag('fpf-story-conflict', 'red', 'High', 'Does the customer statement materially conflict with system, merchant, or contact records?', 'Cite the statement language and each contradictory record.'),
      flag('fpf-isolated-event', 'green', 'Medium', 'Is this an isolated event with no meaningful prior-claim pattern?', 'Cite the prior claims review and the time period searched.'),
      flag('fpf-merchant-gap', 'green', 'High', 'Is merchant authorization, fulfillment, or customer-match evidence missing?', 'Cite the merchant packet requirement and the missing or inconsistent evidence.'),
      flag('fpf-consistent-support', 'green', 'High', 'Is the customer account consistent and supported by independent records?', 'Cite the statement, transaction, contact, delivery, and timeline records that agree.'),
    ],
  },
  'payroll-direct-deposit': {
    title: 'Business Payroll ATO decision checklist',
    description: 'Use the request, employee, destination, callback, mailbox, and payroll timing evidence to decide whether to Hold or Release.',
    flags: [
      flag('payroll-new-destination', 'red', 'Critical', 'Was a new or changed payroll destination requested without trusted employee verification?', 'Cite the destination ID, change request, request time, callback result, and payroll deadline.', { override: true }),
      flag('payroll-requester-mismatch', 'red', 'High', 'Do the requester, email, device, IP, or employee details fail to match trusted records?', 'Cite the mismatched fields and the system-of-record comparison.'),
      flag('payroll-compromised-access', 'red', 'High', 'Is there evidence of mailbox, account, or administrator access compromise before the change?', 'Cite the email, login, session, device, IP, or profile-control events.'),
      flag('payroll-trusted-callback', 'green', 'High', 'Was the change confirmed with the employee or authorized payroll contact using trusted contact data?', 'Cite the callback number source, caller, approver, time, and result.'),
      flag('payroll-known-destination', 'green', 'High', 'Does the destination match established employee ownership and payroll history?', 'Cite account ownership, prior deposits, employee profile, and destination history.'),
      flag('payroll-complete-request', 'green', 'Medium', 'Is the request complete, consistent, and approved through the normal payroll process?', 'Cite the signed request, approval, timing, and required control records.'),
    ],
  },
  'email-bec': {
    title: 'Email Fraud / BEC decision checklist',
    description: 'Use sender, domain, beneficiary, callback, and payment-control evidence to decide whether to Hold or Release.',
    flags: [
      flag('bec-new-beneficiary', 'red', 'Critical', 'Was a new beneficiary or payment destination introduced without trusted callback verification?', 'Cite the beneficiary record, instruction, destination, callback status, and scheduled payment.', { override: true }),
      flag('bec-sender-mismatch', 'red', 'High', 'Do the sender, reply-to, domain, authentication, or message history fail to match the trusted vendor?', 'Cite the email header, domain record, vendor master record, and mismatch.'),
      flag('bec-urgent-control-bypass', 'red', 'High', 'Did urgency or unusual instructions cause the normal payment-change controls to be bypassed?', 'Cite the message language, approval path, callback record, and payment timeline.'),
      flag('bec-trusted-callback', 'green', 'High', 'Was the instruction confirmed through a trusted system-of-record callback?', 'Cite the callback number source, verified contact, time, and result.'),
      flag('bec-known-beneficiary', 'green', 'High', 'Does the beneficiary match an established vendor destination and prior payment history?', 'Cite prior payments, beneficiary ownership, vendor record, and matching account details.'),
      flag('bec-authenticated-message', 'green', 'Medium', 'Do email authentication, sender history, and vendor communication patterns consistently match?', 'Cite SPF/DKIM/DMARC results, domain age, sender history, and message comparison.'),
    ],
  },
  'credit-risk': {
    title: 'Credit Risk decision checklist',
    description: 'Document income, employment, debt, credit, cash-flow, identity, and payment evidence before selecting a credit determination.',
    flags: [
      flag('credit-income-mismatch', 'red', 'High', 'Is stated income unsupported or inconsistent with payroll, deposits, or employer records?', 'Cite the stated amount, verified amount, paystub, deposits, and employer record.'),
      flag('credit-high-dti', 'red', 'High', 'Is debt-to-income, utilization, repayment stress, or payment history outside the applicable standard?', 'Cite the calculation, obligations, utilization, delinquencies, or payment events.'),
      flag('credit-cashflow-risk', 'red', 'High', 'Do overdrafts, returns, volatility, or unexplained deposits weaken repayment support?', 'Cite the statement period, transaction IDs, balances, returns, and cash-flow calculation.'),
      flag('credit-stable-income', 'green', 'High', 'Are income and employment stable and independently supported?', 'Cite payroll deposits, pay frequency, tenure, employer verification, and documents.'),
      flag('credit-manageable-obligations', 'green', 'High', 'Are DTI, utilization, obligations, and payment history within the applicable standard?', 'Cite the DTI calculation, credit summary, and payment history.'),
      flag('credit-complete-documents', 'green', 'Medium', 'Are the required identity, income, bank, and credit documents complete and consistent?', 'Cite each required document and the fields that match.'),
    ],
  },
  'business-loan-bust-out': {
    title: 'Business Loan / Bust-Out decision checklist',
    description: 'Compare entity, owner, revenue, banking, credit, and line-usage evidence before determining the application or exposure action.',
    flags: [
      flag('business-owner-mismatch', 'red', 'High', 'Do business registration, beneficial owner, identity, or bank ownership records conflict?', 'Cite the entity filing, owner KYC, bank ownership, and mismatched fields.'),
      flag('business-revenue-mismatch', 'red', 'High', 'Is stated revenue unsupported by deposits, invoices, contracts, payroll, or tax records?', 'Cite the stated revenue and the records used to verify or contradict it.'),
      flag('business-rapid-exposure', 'red', 'Critical', 'Did the business rapidly increase or draw exposure without matching operating activity?', 'Cite the limit history, draw, transaction timing, revenue, and cash-flow records.', { override: true }),
      flag('business-verified-entity', 'green', 'High', 'Are the entity, owners, address, website, and bank ownership independently verified?', 'Cite registration, owner KYC, address, domain, and bank records.'),
      flag('business-supported-revenue', 'green', 'High', 'Do deposits, invoices, contracts, payroll, and statements support stated business activity?', 'Cite the matching amounts, dates, customers, payroll, and bank records.'),
      flag('business-stable-performance', 'green', 'Medium', 'Does established payment and account history support the requested exposure?', 'Cite account age, payment history, utilization, balances, and prior performance.'),
    ],
  },
  'application-verification': {
    title: 'Application Verification decision checklist',
    description: 'Compare identity, document, selfie, address, phone, email, device, and application records.',
    flags: [
      flag('application-identity-mismatch', 'red', 'Critical', 'Do core identity fields materially conflict across the application and verification records?', 'Cite the name, DOB, identity token, address, phone, email, and source records.', { override: true }),
      flag('application-document-risk', 'red', 'High', 'Is an identity document expired, altered, unreadable, or inconsistent with the application?', 'Cite the document ID, quality result, expiration, and mismatched field.'),
      flag('application-new-identity-cluster', 'red', 'High', 'Are the address, phone, email, or device newly established or linked to unrelated profiles?', 'Cite first-seen dates, ownership results, linked profiles, and application history.'),
      flag('application-full-match', 'green', 'High', 'Do identity fields consistently match across independent sources?', 'Cite the application, identity report, document, address, phone, and email matches.'),
      flag('application-liveness', 'green', 'High', 'Did selfie, document, and liveness verification pass with usable quality?', 'Cite match confidence, liveness result, capture date, and document comparison.'),
      flag('application-stable-contact', 'green', 'Medium', 'Are the address, phone, email, and device established and owned by the applicant?', 'Cite age, ownership, prior history, OTP use, and linked-profile results.'),
    ],
  },
  'ach-wire-check': {
    title: 'ACH / Wire / Check decision checklist',
    description: 'Apply the payment-rail evidence for authorization, ownership, beneficiary, callback, image, and recovery timing.',
    flags: [
      flag('payment-new-destination', 'red', 'Critical', 'Was a new beneficiary, originator, endorsement, or destination used without trusted verification?', 'Cite the payment ID, destination, ownership, callback, endorsement, and approval record.', { override: true }),
      flag('payment-authorization-gap', 'red', 'High', 'Is authorization, account ownership, callback, endorsement, or approval evidence missing or inconsistent?', 'Cite the required control and the missing or contradictory record.'),
      flag('payment-unusual-pattern', 'red', 'High', 'Is the amount, timing, return activity, channel, or payment pattern materially unusual?', 'Cite prior payment history, current transaction, return code, amount, and timing.'),
      flag('payment-trusted-verification', 'green', 'High', 'Was the payment or change verified through trusted contact and approval controls?', 'Cite the system-of-record contact, approver, callback, and release time.'),
      flag('payment-known-destination', 'green', 'High', 'Does the beneficiary, originator, payee, or account match established ownership and history?', 'Cite ownership records, prior payments, templates, and matching names.'),
      flag('payment-clean-record', 'green', 'Medium', 'Do the payment record, return history, or check images show no mismatch or alteration?', 'Cite authorization, return, front/back image, serial, endorsement, and channel records.'),
    ],
  },
};

const defaultChecklist = {
  title: 'Case decision checklist',
  description: 'Document only the evidence that directly supports or challenges the determination for this case.',
  flags: [
    flag('case-material-conflict', 'red', 'High', 'Does a material case record conflict with the statement or requested outcome?', 'Cite the statement, the conflicting record, and the exact field, amount, or timestamp.'),
    flag('case-independent-support', 'green', 'High', 'Does an independent record support the statement or requested outcome?', 'Cite the independent source and explain how it connects to the activity in scope.'),
  ],
};

const flagApplicability = {
  'ato-customer-mfa': /credential|phish|vish|remote access|help desk|session|wallet|payee|profile change/i,
  'fcb-customer-authentication': /CNP|online|wallet|ATM\/POS/i,
  'fcb-known-merchant': /CNP|online|wallet|unauthorized/i,
  'fcb-fulfillment': /CNP|online|unauthorized online/i,
  'fcb-new-token-device': /CNP|online|wallet|unauthorized/i,
  'fcb-card-possession': /lost|stolen|never received|counterfeit|CNP|wallet|ATM\/POS|online/i,
  'fcb-merchant-gap': /CNP|online|wallet|unauthorized/i,
  'ncb-merchant-fulfilled': /canceled service|item not as described|services not rendered|subscription/i,
  'ncb-late-cancellation': /canceled service|subscription/i,
  'ncb-recurring-history': /canceled service|subscription/i,
  'ncb-cancellation-proof': /canceled service|subscription/i,
  'ncb-billing-error': /incorrect amount|duplicate billing|refund not received|return credit/i,
  'fpf-benefit-delivery': /friendly|household|digital goods|delivery|non-receipt|refund|usage/i,
  'fpf-repeat-pattern': /friendly|repeated|refund|dispute after usage/i,
  'fpf-isolated-event': /friendly|repeated|refund|dispute after usage/i,
  'payroll-compromised-access': /spoofed|compromised|portal|mailbox|admin/i,
  'payroll-known-destination': /existing employee|destination changed|payroll card|spoofed|compromised/i,
  'bec-urgent-control-bypass': /urgent|CEO|invoice diversion|beneficiary change|vendor bank change/i,
  'credit-income-mismatch': /income|credit line increase|first-payment|fake application|first-party credit|loan stacking/i,
  'credit-high-dti': /credit line increase|first-payment|repayment stress|bust-out|loan stacking|first-party credit/i,
  'credit-cashflow-risk': /credit line increase|first-payment|repayment stress|bust-out|business revenue|first-party credit/i,
  'credit-stable-income': /income|credit line increase|first-payment|fake application|first-party credit/i,
  'credit-manageable-obligations': /credit line increase|first-payment|repayment stress|bust-out|loan stacking|first-party credit/i,
  'business-owner-mismatch': /owner|identity|legitimacy|tradeline/i,
  'business-revenue-mismatch': /revenue|draw|sleeper|legitimacy|stacking/i,
  'business-rapid-exposure': /draw|sleeper|stacking|limit increase/i,
  'business-verified-entity': /owner|identity|legitimacy|tradeline|application/i,
  'business-supported-revenue': /revenue|draw|sleeper|legitimacy|stacking/i,
  'business-stable-performance': /draw|sleeper|stacking|limit increase/i,
  'application-document-risk': /ID mismatch|selfie|liveness|synthetic|stolen identity/i,
  'application-new-identity-cluster': /thin identity|new email|new device|phone ownership|synthetic|stolen identity|address/i,
  'application-liveness': /selfie|liveness|stolen identity/i,
  'application-stable-contact': /thin identity|new email|new device|phone ownership|synthetic|stolen identity|address/i,
  'payment-new-destination': /ACH|wire|recovery/i,
  'payment-trusted-verification': /ACH|wire|recovery/i,
  'payment-known-destination': /ACH|wire|recovery/i,
  'payment-clean-record': /ACH|check|endorsement|alteration/i,
};

const scenarioFlagsByClaimType = {
  'account-takeover': [
    { match: /SIM swap/i, flags: [
      flag('ato-carrier-change', 'green', 'Critical', 'Did a carrier SIM or number-port change occur before account recovery or money movement?', 'Cite the carrier event, recovery event, login, and transaction timeline.', { override: false }),
      flag('ato-established-sim', 'red', 'High', 'Do carrier and device records show the established SIM remained active through the disputed activity?', 'Cite the carrier history, device ID, and authentication timestamps.'),
    ] },
    { match: /help desk reset/i, flags: [
      flag('ato-helpdesk-bypass', 'green', 'Critical', 'Did the help desk reset bypass a required identity or callback control?', 'Cite the support ticket, failed or skipped control, changed field, and later activity.'),
      flag('ato-valid-support-contact', 'red', 'High', 'Does the support record connect the customer to the recovery request through trusted verification?', 'Cite the trusted contact source, verification steps, and support recording or ticket.'),
    ] },
    { match: /OTP phishing|vishing|remote access/i, flags: [
      flag('ato-customer-directed-payment', 'red', 'Critical', 'Did the customer personally approve or release the payment while following another person\'s instructions?', 'Cite the customer statement, authentication event, payment approval, and contact timeline.', { override: true }),
      flag('ato-control-obtained-by-deception', 'green', 'High', 'Did deception give another person control of credentials, a session, or a payment destination?', 'Cite the message or call, access event, control change, and resulting activity.'),
    ] },
  ],
  'fraud-chargeback': [
    { match: /lost card|stolen card/i, flags: [
      flag('fcb-loss-timing', 'green', 'High', 'Did the disputed purchase occur after the documented loss or theft and before the card was blocked?', 'Cite the loss time, transaction time, block time, entry mode, and customer statement.'),
      flag('fcb-chip-pin-after-loss', 'red', 'Critical', 'Did chip or PIN evidence conflict with the reported card-possession timeline?', 'Cite the EMV or PIN result, transaction time, loss report, and any recognized activity.', { override: true }),
    ] },
    { match: /never received card/i, flags: [
      flag('fcb-card-delivery-activation', 'red', 'High', 'Do delivery and activation records connect the replacement card to the cardholder before use?', 'Cite carrier delivery, activation method, trusted contact, and first transaction.'),
      flag('fcb-no-receipt-activation-gap', 'green', 'High', 'Is card delivery, activation, or possession unsupported before the disputed purchase?', 'Cite the missing or mismatched delivery and activation records.'),
    ] },
    { match: /counterfeit|skimming/i, flags: [
      flag('fcb-fallback-distant-use', 'green', 'Critical', 'Did magnetic-stripe fallback activity occur away from the cardholder while the genuine card remained in possession?', 'Cite entry mode, location, time, genuine-card activity, and customer statement.'),
      flag('fcb-genuine-card-present', 'red', 'High', 'Does the authorization show the genuine chip or contactless credential was used near the cardholder?', 'Cite the cryptogram or entry mode, location, and possession evidence.'),
    ] },
    { match: /ATM\/POS/i, flags: [
      flag('fcb-atm-chip-pin', 'red', 'Critical', 'Did the ATM or point-of-sale transaction use the genuine chip and correct PIN in a familiar area?', 'Cite the EMV result, PIN result, terminal, location, time, and nearby recognized activity.', { override: true }),
      flag('fcb-atm-pos-anomaly', 'green', 'High', 'Do terminal, location, fallback, or timing records materially differ from the cardholder pattern?', 'Cite the terminal record and normal card-use comparison.'),
    ] },
  ],
  'non-fraud-chargeback': [
    { match: /incorrect amount/i, flags: [
      flag('ncb-receipt-matches-posted', 'red', 'High', 'Does the signed receipt or invoice match the posted amount?', 'Cite the receipt total, authorization amount, posted amount, and tip or adjustment record.'),
      flag('ncb-receipt-posting-mismatch', 'green', 'High', 'Does the receipt or authorization support a lower amount than the posted transaction?', 'Cite each amount and identify the unsupported difference.'),
    ] },
    { match: /duplicate billing/i, flags: [
      flag('ncb-separate-orders', 'red', 'High', 'Do the two charges map to separate orders, authorizations, or fulfillment records?', 'Cite both transaction IDs and the separate order or fulfillment references.'),
      flag('ncb-same-order-duplicate', 'green', 'Critical', 'Do both settled charges map to the same order or service with no separate fulfillment?', 'Cite both transaction IDs, order ID, amount, settlement dates, and fulfillment record.'),
    ] },
    { match: /refund not received|return credit not posted/i, flags: [
      flag('ncb-refund-not-due', 'red', 'Medium', 'Is the merchant credit still within the disclosed processing window?', 'Cite the refund date, policy window, current date, and network status.'),
      flag('ncb-refund-overdue', 'green', 'High', 'Is a confirmed merchant or return credit missing after the expected posting date?', 'Cite the credit confirmation, return receipt, expected date, and transaction history.'),
    ] },
    { match: /item not as described/i, flags: [
      flag('ncb-description-matches', 'red', 'High', 'Do the listing, receipt, and delivered item materially match?', 'Cite the advertised terms, order details, delivery evidence, and customer complaint.'),
      flag('ncb-material-description-gap', 'green', 'High', 'Is a material difference between the promised and delivered item documented?', 'Cite photos or inspection, listing language, return request, and merchant response.'),
    ] },
    { match: /services not rendered/i, flags: [
      flag('ncb-service-performed', 'red', 'High', 'Does the merchant show the contracted service was performed or made available as agreed?', 'Cite appointment, access, completion, or signed service records.'),
      flag('ncb-no-service-or-credit', 'green', 'High', 'Was the service not provided, rescheduled, or credited?', 'Cite the schedule, cancellation, customer contact, and absence of a credit.'),
    ] },
  ],
  'first-party-fraud': [
    { match: /digital goods|friendly fraud|household member|dispute after usage/i, flags: [
      flag('fpf-established-device-usage', 'red', 'High', 'Was the product or service activated and used from an established customer or household device?', 'Cite the device ID, account login, activation, usage timestamps, and customer relationship.'),
      flag('fpf-no-usage-link', 'green', 'High', 'Is there no reliable activation, usage, or household link to the disputed benefit?', 'Cite the searched records and the missing or mismatched customer fields.'),
    ] },
    { match: /delivery|non-receipt/i, flags: [
      flag('fpf-strong-delivery-proof', 'red', 'Critical', 'Do carrier GPS, photo, signature, or access records connect delivery to the customer address?', 'Cite the carrier event, delivery artifact, address match, and recipient details.', { override: true }),
      flag('fpf-delivery-proof-gap', 'green', 'High', 'Is delivery proof missing, inconsistent, or tied to a different address or recipient?', 'Cite the missing artifact or mismatch and the order record.'),
    ] },
  ],
  'payroll-direct-deposit': [
    { match: /fake new-hire|ghost employee/i, flags: [
      flag('payroll-employee-not-supported', 'red', 'Critical', 'Is the employee unsupported by HR, manager, identity, timekeeping, or hiring records?', 'Cite each system searched and the missing or conflicting employee record.', { override: true }),
      flag('payroll-employee-confirmed', 'green', 'High', 'Do HR, manager, identity, and timekeeping records independently confirm the employee?', 'Cite the employee ID, manager verification, hiring packet, and work records.'),
    ] },
  ],
  'email-bec': [
    { match: /mailbox compromise|mailbox rule forwarding/i, flags: [
      flag('bec-mailbox-access-rule', 'red', 'Critical', 'Did unfamiliar mailbox access or a forwarding rule precede the payment instruction?', 'Cite the login, IP, device, rule creation, message, and payment timeline.', { override: true }),
      flag('bec-clean-mailbox-history', 'green', 'High', 'Do mailbox access, rules, and message history remain consistent with the trusted user?', 'Cite the access history, rule audit, and known-device comparison.'),
    ] },
    { match: /look-alike domain|reply-to mismatch/i, flags: [
      flag('bec-domain-reply-mismatch', 'red', 'Critical', 'Does the sender or reply-to differ from the trusted domain or established address?', 'Cite the full header, domain registration, vendor master record, and exact mismatch.', { override: true }),
      flag('bec-trusted-domain-thread', 'green', 'High', 'Do the sender, reply-to, domain age, and prior thread consistently match the trusted vendor?', 'Cite the header, domain record, and historical messages.'),
    ] },
  ],
  'credit-risk': [
    { match: /synthetic identity|fake application|first-party credit abuse/i, flags: [
      flag('credit-identity-cluster-conflict', 'red', 'Critical', 'Do identity, contact, device, payment, or document records fail to form one consistent applicant?', 'Cite the mismatched fields, linked profiles, source records, and first-seen dates.', { override: true }),
      flag('credit-identity-independently-supported', 'green', 'High', 'Is the applicant identity consistently supported across independent sources?', 'Cite identity, address, contact, device, payment ownership, and document matches.'),
    ] },
    { match: /repayment stress|first-payment default/i, flags: [
      flag('credit-payment-stress-pattern', 'red', 'High', 'Do missed payments, rising utilization, returns, or cash-flow changes weaken repayment support?', 'Cite the payment dates, balances, utilization, returns, and income change.'),
      flag('credit-explainable-hardship', 'green', 'Medium', 'Is the payment stress supported by a documented hardship rather than inconsistent application information?', 'Cite customer contact, income change, payment history, and hardship records.'),
    ] },
    { match: /loan stacking/i, flags: [
      flag('credit-concurrent-obligations', 'red', 'High', 'Do recent inquiries or newly opened obligations materially change repayment capacity?', 'Cite inquiry dates, new balances, monthly obligations, and revised DTI.'),
      flag('credit-shopping-window', 'green', 'Medium', 'Are the inquiries consistent with rate shopping without additional funded obligations?', 'Cite the inquiry window, account-opening results, and verified obligations.'),
    ] },
  ],
  'business-loan-bust-out': [
    { match: /tradeline/i, flags: [
      flag('business-unrelated-tradelines', 'red', 'Critical', 'Do submitted trade references belong to unrelated businesses or recently added relationships?', 'Cite tradeline ownership, business identifiers, dates added, and related entities.', { override: true }),
      flag('business-owned-tradelines', 'green', 'High', 'Are trade references established and owned by the applicant business?', 'Cite vendor confirmations, account age, payment history, and matching entity details.'),
    ] },
  ],
  'application-verification': [
    { match: /address cannot be verified/i, flags: [
      flag('application-address-unsupported', 'red', 'High', 'Is the stated address unsupported across documents, records, and contact history?', 'Cite the application address and each source searched or conflicting address.'),
      flag('application-address-supported', 'green', 'High', 'Is the address independently supported by current documents and established records?', 'Cite the proof-of-address document, record date, and matching identity fields.'),
    ] },
    { match: /phone ownership mismatch/i, flags: [
      flag('application-phone-unrelated', 'red', 'High', 'Is the phone owned by an unrelated party with no supported relationship to the applicant?', 'Cite ownership, tenure, account holder, OTP history, and relationship checks.'),
      flag('application-phone-relationship', 'green', 'Medium', 'Is the different phone owner explained by a supported family or business relationship?', 'Cite the plan owner, relationship record, tenure, and successful verification.'),
    ] },
    { match: /selfie|liveness/i, flags: [
      flag('application-biometric-mismatch', 'red', 'Critical', 'Do liveness or portrait comparison results materially conflict with the identity document?', 'Cite capture quality, liveness result, portrait comparison, and document ID.', { override: true }),
      flag('application-biometric-quality-pass', 'green', 'High', 'Did a usable capture pass liveness and match the identity document portrait?', 'Cite capture date, quality, liveness, and face-match results.'),
    ] },
  ],
  'ach-wire-check': [
    { match: /ACH/i, flags: [
      flag('payment-ach-authorization', 'green', 'High', 'Is a valid ACH authorization or established originator relationship documented?', 'Cite the authorization, originator, effective date, prior debits, and revocation history.'),
      flag('payment-ach-no-authorization', 'red', 'High', 'Is ACH authorization missing, revoked, or inconsistent with the debit?', 'Cite the debit, authorization search, revocation, return code, and customer statement.'),
    ] },
    { match: /wire/i, flags: [
      flag('payment-wire-beneficiary-change', 'red', 'Critical', 'Was the wire beneficiary changed outside trusted callback and approval controls?', 'Cite the old and new beneficiary, request source, callback, approver, and release time.', { override: true }),
      flag('payment-wire-verified-beneficiary', 'green', 'High', 'Was the beneficiary independently verified through trusted contact and ownership records?', 'Cite the callback source, verified contact, ownership result, and approval.'),
    ] },
    { match: /check|endorsement|alteration/i, flags: [
      flag('payment-check-image-mismatch', 'red', 'Critical', 'Do front or back check images show a payee, amount, serial, or endorsement mismatch?', 'Cite the issued-check record, front image, back image, deposit details, and exact alteration.', { override: true }),
      flag('payment-check-image-match', 'green', 'High', 'Do issued-check details, images, endorsement, and deposit ownership consistently match?', 'Cite the check serial, amount, payee, endorsement, and deposit account ownership.'),
    ] },
    { match: /recovery|recall/i, flags: [
      flag('payment-recall-window', 'red', 'High', 'Was recall or recovery delayed after the concern became known?', 'Cite the release time, discovery time, recall request, beneficiary response, and current status.'),
      flag('payment-prompt-recall', 'green', 'High', 'Was recall initiated promptly with complete beneficiary and payment details?', 'Cite the discovery, recall, bank contact, beneficiary restriction, and response timestamps.'),
    ] },
  ],
};

function isDigitalWalletCase(activeCase = {}) {
  return /wallet|token/i.test([
    activeCase.scenarioId,
    activeCase.scenarioTitle,
    activeCase.subtype,
    activeCase.transactionInfo,
    activeCase.allegation,
  ].filter(Boolean).join(' '));
}

function decisionContext(activeCase = {}) {
  return [
    activeCase.scenarioId,
    activeCase.scenarioTitle,
    activeCase.subtype,
    activeCase.family,
    activeCase.transactionInfo,
    activeCase.allegation,
  ].filter(Boolean).join(' ');
}

export function getDecisionChecklist(activeCase = {}) {
  const base = checklistByClaimType[activeCase.claimTypeId] ?? defaultChecklist;
  const context = decisionContext(activeCase);
  const hasSpecificCaseContext = Boolean(activeCase.subtype || activeCase.scenarioId || activeCase.scenarioTitle || activeCase.transactionInfo);
  const flags = base.flags.filter((item) => !hasSpecificCaseContext || !flagApplicability[item.id] || flagApplicability[item.id].test(context));

  (scenarioFlagsByClaimType[activeCase.claimTypeId] ?? []).forEach((rule) => {
    if (rule.match.test(context)) flags.push(...rule.flags);
  });

  if (['account-takeover', 'fraud-chargeback'].includes(activeCase.claimTypeId) && isDigitalWalletCase(activeCase)) {
    flags.unshift(flag(
      'wallet-chip-during-fraud-window',
      'red',
      'Critical',
      'During the reported fraud period, were any transactions completed using the physical chip card?',
      'Cite the transaction ID, date and time, amount, merchant, EMV chip entry mode, and card-possession evidence.',
      { override: true },
    ));
  }

  return {
    ...base,
    flags: [...new Map(flags.map((item) => [item.id, item])).values()],
    scopeLabel: activeCase.subtype ?? activeCase.scenarioTitle ?? activeCase.type ?? 'Case-specific review',
  };
}

export function summarizeDecisionIndicators(activeCase = {}, indicatorAnswers = {}) {
  const checklist = getDecisionChecklist(activeCase);
  const selectedIndicators = checklist.flags
    .filter((item) => indicatorAnswers[item.id]?.selected)
    .map((item) => {
      const answer = indicatorAnswers[item.id] ?? {};
      return {
        ...item,
        points: flagWeightPoints[item.weight] ?? 0,
        proof: String(answer.proof ?? '').trim(),
        explanation: String(answer.explanation ?? '').trim(),
      };
    });
  const incompleteIndicators = selectedIndicators.filter((item) => !item.proof || !item.explanation);
  const red = selectedIndicators.filter((item) => item.type === 'red');
  const green = selectedIndicators.filter((item) => item.type === 'green');

  return {
    checklist,
    selectedIndicators,
    incompleteIndicators,
    selectedCount: selectedIndicators.length,
    redCount: red.length,
    greenCount: green.length,
    redPoints: red.reduce((sum, item) => sum + item.points, 0),
    greenPoints: green.reduce((sum, item) => sum + item.points, 0),
    criticalRedIndicators: red.filter((item) => item.weight === 'Critical'),
    overrideIndicators: red.filter((item) => item.override),
  };
}
