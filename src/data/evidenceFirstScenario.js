function destinationEnding(value = '') {
  return String(value).match(/(?:ending|token)\s+(\d{4})/i)?.[1] ?? '0042';
}

const evidenceProfiles = {
  'payroll-direct-deposit': {
    'spoofed employee email': {
      accessPattern: 'established',
      requestRecord: 'The change request lists an employee display name, but the sender address and Reply-To do not match the employee contact stored in the employer profile. Sender authentication is not aligned.',
      relationshipRecord: 'The employee is active and has established payroll history with the employer.',
      callbackRecord: 'A callback to the employee phone stored before the request records that the employee did not confirm submitting the change.',
      paymentRecord: 'The requested destination is newly seen and the returned owner name does not exactly match the employee.',
    },
    'compromised employee email': {
      accessPattern: 'compromised',
      requestRecord: 'The change request came from the employee address and appears inside an established message thread.',
      relationshipRecord: 'The employee is active and the sender address matches the employer contact record.',
      callbackRecord: 'A callback using the employee phone stored before the request records that the employee did not confirm the destination change.',
      paymentRecord: 'The requested destination is newly seen and has no prior payroll use for this employee.',
      accessRecord: 'Mailbox and access records show a newly seen device and IP followed by a forwarding-rule event before the request was sent.',
    },
    'fake new-hire payroll setup': {
      accessPattern: 'established',
      requestRecord: 'A new payee was added for the next payroll run through the new-hire setup workflow.',
      relationshipRecord: 'The payee ID does not connect to a completed HR file, manager approval, or timekeeping record in the current packet.',
      callbackRecord: 'The manager contact stored in the employer directory could not confirm the new-hire setup.',
      paymentRecord: 'The destination is newly seen and no prior payroll payment is connected to the payee.',
    },
    'payroll admin portal compromise': {
      accessPattern: 'compromised',
      requestRecord: 'A payroll destination was changed through the administrator portal outside the employer standard processing window.',
      relationshipRecord: 'The employee and employer records are established, but no separate employee form is attached to the portal change.',
      callbackRecord: 'The payroll administrator contact stored before the event did not confirm making the change.',
      paymentRecord: 'The destination is newly seen and has no prior payroll use for the employee.',
      accessRecord: 'The administrator session used a newly seen device and IP after failed authentication attempts.',
    },
    'existing employee destination changed': {
      accessPattern: 'mixed',
      requestRecord: 'An existing employee payroll destination was replaced before the next payroll run.',
      relationshipRecord: 'The employee is active and prior payroll runs show a different established destination.',
      callbackRecord: 'The trusted callback record must be compared with the request; the change is not independently confirmed in the intake.',
      paymentRecord: 'The new destination has no prior payroll use and the ownership response is not an exact employee match.',
    },
    'payroll card diversion': {
      accessPattern: 'established',
      requestRecord: 'A new payroll-card destination was added before the current pay cycle.',
      relationshipRecord: 'The employee has established direct-deposit history and no earlier payroll-card enrollment in the supplied records.',
      callbackRecord: 'The contact route used on the enrollment differs from the employee contact stored before the request.',
      paymentRecord: 'The payroll-card destination is newly seen and has no prior use for the employee.',
    },
    'ghost employee payroll': {
      accessPattern: 'established',
      requestRecord: 'A new payee appears in the payroll roster and is scheduled across more than one pay period.',
      relationshipRecord: 'The payee does not connect to manager, HR, identity, or timekeeping support in the current packet.',
      callbackRecord: 'The department contact stored in the employer directory did not confirm the payee as an active employee.',
      paymentRecord: 'The destination is connected only to the newly added payroll entry and has no established employee history.',
    },
  },
  'email-bec': {
    'vendor bank change': {
      accessPattern: 'established',
      requestRecord: 'A payment message requests replacement destination details before a scheduled business payment. The display name resembles the established counterparty contact.',
      relationshipRecord: 'The counterparty is established, but the requested destination is not present in prior paid-invoice history.',
      callbackRecord: 'The callback result from the contact stored in the business profile does not confirm the replacement destination.',
      paymentRecord: 'The beneficiary destination is newly seen and the ownership response does not match the established counterparty name.',
    },
    'look-alike domain': {
      accessPattern: 'established',
      requestRecord: 'The sender display name matches prior messages, but the full sender domain differs by one character from the address in the counterparty master record. Sender authentication is not aligned.',
      relationshipRecord: 'The counterparty is established and prior messages use the domain stored in the master record.',
      callbackRecord: 'The trusted callback contact did not confirm the alternate sender domain or destination.',
      paymentRecord: 'The beneficiary is newly seen and has no prior paid-invoice history.',
    },
    'mailbox compromise': {
      accessPattern: 'compromised',
      requestRecord: 'The message was sent from the established counterparty mailbox inside a prior invoice thread.',
      relationshipRecord: 'The sender address and counterparty name match the business master record.',
      callbackRecord: 'The counterparty contact stored before the message did not confirm the new destination.',
      paymentRecord: 'The beneficiary is newly seen and differs from prior paid invoices.',
      accessRecord: 'Mailbox access shows a newly seen IP and device followed by a forwarding rule before the payment message.',
    },
    'CEO urgent payment': {
      accessPattern: 'established',
      requestRecord: 'A confidential payment request was submitted outside the normal approval workflow and asks for same-day release.',
      relationshipRecord: 'No comparable payment or instruction pattern appears in the supplied executive and beneficiary history.',
      callbackRecord: 'Independent approval through the executive contact stored in the company directory is not complete.',
      paymentRecord: 'The beneficiary is newly seen and has no prior relationship to the business.',
    },
    'invoice diversion': {
      accessPattern: 'established',
      requestRecord: 'The beneficiary fields on the current invoice differ from earlier invoices tied to the same purchase order.',
      relationshipRecord: 'The counterparty and invoice are established, while the replacement destination is not present in payment history.',
      callbackRecord: 'The counterparty contact stored before the invoice did not confirm the replacement beneficiary.',
      paymentRecord: 'The new beneficiary ownership does not match the counterparty legal name.',
    },
    'reply-to mismatch': {
      accessPattern: 'mixed',
      requestRecord: 'The sender display name resembles the established contact, but the Reply-To address differs from both the sender and the master record.',
      relationshipRecord: 'Prior correspondence uses the address stored in the counterparty master record.',
      callbackRecord: 'Trusted callback verification is still pending in the current packet.',
      paymentRecord: 'The destination is newly seen and ownership information is incomplete.',
    },
    'mailbox rule forwarding': {
      accessPattern: 'compromised',
      requestRecord: 'The payment conversation was copied by a newly created mailbox rule before the destination instruction was sent.',
      relationshipRecord: 'The visible message thread and counterparty relationship are established.',
      callbackRecord: 'The stored counterparty contact did not confirm the destination change.',
      paymentRecord: 'The beneficiary is newly seen and differs from prior payment history.',
      accessRecord: 'Mailbox audit records show a newly seen session and a forwarding rule that includes an unfamiliar external address.',
    },
    'beneficiary change before payment': {
      accessPattern: 'established',
      requestRecord: 'A replacement beneficiary was submitted through the established counterparty message channel before payment.',
      relationshipRecord: 'The counterparty name, sender address, invoice history, and business relationship match the master record.',
      callbackRecord: 'The callback used the phone stored in the master record and the established counterparty contact confirmed the new beneficiary.',
      paymentRecord: 'The beneficiary ownership response matches the counterparty legal name and the approval trail is complete.',
    },
  },
};

function payrollPresentation(scenario) {
  const ending = destinationEnding(scenario.transactionInfo);
  const isNewPayee = /new-hire|ghost employee/i.test(scenario.subtype);
  const isPaymentMethod = /payroll card/i.test(scenario.subtype);
  const subtype = isNewPayee ? 'New payroll payee alert' : isPaymentMethod ? 'New payroll payment method alert' : 'Payroll destination change alert';
  const trigger = isNewPayee
    ? 'a new payee was added before an upcoming payroll run'
    : isPaymentMethod
      ? 'a new payroll payment method was added before an upcoming payroll run'
      : 'an employee payroll destination changed before an upcoming payroll run';
  return {
    claimLabel: 'Payroll Change Review',
    lane: 'Payroll and employer review',
    subtype,
    title: subtype,
    statementLabel: 'System payroll alert',
    statement: `System monitoring flagged that ${trigger}. The request and destination have not yet been independently verified.`,
    channel: 'Payroll monitoring queue',
    transactionInfo: `${isNewPayee ? 'New payroll payee' : isPaymentMethod ? 'New payroll payment method' : 'Payroll destination change'} · pre-run review · training destination ending ${ending}`,
    summary: `A system alert opened this case because ${trigger}. Review the employee or payee relationship, change source, access history, trusted callback, payment destination, and supporting documents before deciding whether the activity is authorized, unsupported, or requires escalation.`,
    evidenceContext: 'payroll change or new-payee review',
  };
}

function businessPaymentPresentation(scenario) {
  const ending = destinationEnding(scenario.transactionInfo);
  const urgent = /CEO urgent payment/i.test(scenario.subtype);
  const subtype = urgent ? 'Out-of-pattern payment request alert' : 'Payment instruction change alert';
  const trigger = urgent
    ? 'an out-of-pattern business payment request entered the approval queue'
    : 'a new or changed business payment instruction was submitted before a scheduled payment';
  return {
    claimLabel: 'Business Payment Instruction Review',
    lane: 'Business payment review',
    subtype,
    title: subtype,
    statementLabel: 'System payment alert',
    statement: `System monitoring flagged that ${trigger}. The instruction, requester, approval path, and destination have not yet been independently verified.`,
    channel: 'Business payment monitoring queue',
    transactionInfo: `${urgent ? 'Business payment request' : 'Payment instruction change'} · pre-payment review · training destination ending ${ending}`,
    summary: `A system alert opened this case because ${trigger}. Review the message and sender records, business relationship, access history, trusted callback, beneficiary ownership, payment history, and supporting documents before deciding what occurred.`,
    evidenceContext: 'business payment instruction review',
  };
}

export function evidenceFirstPresentation(claimTypeId, scenario = {}) {
  if (claimTypeId === 'payroll-direct-deposit') return payrollPresentation(scenario);
  if (claimTypeId === 'email-bec') return businessPaymentPresentation(scenario);
  return {
    claimLabel: null,
    lane: null,
    subtype: scenario.subtype,
    title: scenario.title,
    statementLabel: null,
    statement: scenario.statement,
    channel: scenario.channel,
    transactionInfo: scenario.transactionInfo,
    summary: scenario.summary,
    evidenceContext: `${scenario.subtype ?? 'case'} review`,
  };
}

export function scenarioEvidenceProfile(claimTypeId, scenario = {}) {
  return evidenceProfiles[claimTypeId]?.[scenario.subtype] ?? {
    accessPattern: null,
    requestRecord: `${scenario.transactionInfo ?? 'The activity in scope'} is available for review.`,
    relationshipRecord: 'Relationship records are available for comparison.',
    callbackRecord: 'Use the trusted contact record supplied in the case packet.',
    paymentRecord: 'Use Payment Verification to compare ownership and prior use.',
  };
}
