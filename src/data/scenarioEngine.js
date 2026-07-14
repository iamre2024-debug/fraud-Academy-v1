export const scenarioClaimTypes = [
  'Account Takeover',
  'Chargeback Claim',
  'Credit Risk Review',
  'Email Fraud',
  'First Party Review',
  'Payroll Risk Review',
  'Merchant Review',
];

export const scenarioTemplates = [
  {
    id: 'SCN-ATO-DIGITAL-ACCESS',
    claimType: 'Account Takeover',
    title: 'Digital access dispute',
    caseReason: 'Customer allegation with recent login, device, IP, card, and profile activity available for review.',
    investigatorQuestion: 'Can access behavior verify or challenge the customer story?',
    requiredFamilies: ['Case Summary', 'Customer 360', 'Identity Intelligence', 'Login History', 'Session History', 'Device Intelligence', 'IP Intelligence', 'Transaction History', 'Payment Verification', 'Evidence Center', 'Document Viewer', 'Link Analysis', 'Timeline'],
    evidencePacket: ['customerIntake', 'profileHistory', 'identityBackground', 'loginHistory', 'sessionEvents', 'deviceRecords', 'ipRecords', 'transactionHistory', 'paymentVerification', 'documentInventory', 'linkObjects'],
    safeVariationInputs: ['customer location', 'stated device', 'merchant channel', 'login method', 'document status'],
  },
  {
    id: 'SCN-CB-RECURRING-MERCHANT',
    claimType: 'Chargeback Claim',
    title: 'Recurring billing dispute',
    caseReason: 'Customer allegation involving merchant billing, cancellation evidence, prior transactions, and document requests.',
    investigatorQuestion: 'Does the billing pattern and available evidence support a defensible dispute package?',
    requiredFamilies: ['Case Summary', 'Customer 360', 'Identity Intelligence', 'Transaction History', 'Payment Verification', 'Business 360', 'Business Intelligence', 'Evidence Center', 'Document Viewer', 'Link Analysis', 'Timeline'],
    evidencePacket: ['customerIntake', 'identityBackground', 'merchantHistory', 'transactionHistory', 'paymentVerification', 'billingCycleRecords', 'documentInventory', 'customerDocuments', 'timelineEvents', 'linkObjects'],
    safeVariationInputs: ['billing interval', 'merchant descriptor', 'cancellation document status', 'contact channel', 'prior charge count'],
  },
  {
    id: 'SCN-CR-NEW-ACCOUNT',
    claimType: 'Credit Risk Review',
    title: 'New account credit behavior review',
    caseReason: 'System alert involving new profile activity, payment verification, limit usage, identity records, and account behavior.',
    investigatorQuestion: 'Does identity, payment, and account activity support the next documented review step?',
    requiredFamilies: ['Case Summary', 'Customer 360', 'Identity Intelligence', 'Login History', 'Session History', 'IP Intelligence', 'Payment Verification', 'Financial Intelligence', 'Business Intelligence', 'Evidence Center', 'Document Viewer', 'Link Analysis', 'Timeline'],
    evidencePacket: ['systemAlert', 'identityRecords', 'identityBackground', 'profileHistory', 'paymentVerification', 'financialContext', 'loginHistory', 'sessionEvents', 'ipRecords', 'businessContext', 'documentInventory', 'timelineEvents'],
    safeVariationInputs: ['account age', 'payment object age', 'requested amount', 'login pattern', 'verification packet status'],
  },
  {
    id: 'SCN-PAYROLL-EMPLOYEE-REVIEW',
    claimType: 'Payroll Risk Review',
    title: 'Employee payroll destination review',
    caseReason: 'System alert or employer inquiry involving employee profile, payroll history, destination records, and business relationship context.',
    investigatorQuestion: 'Is the employee, employer, payroll, and destination relationship documented enough for review?',
    requiredFamilies: ['Case Summary', 'Customer 360', 'Identity Intelligence', 'Login History', 'Session History', 'IP Intelligence', 'Business 360', 'Business Intelligence', 'Employee Profile', 'Payroll History', 'Payment Verification', 'Evidence Center', 'Document Viewer', 'Link Analysis', 'Timeline'],
    evidencePacket: ['businessProfile', 'businessContext', 'employeeProfile', 'payrollHistory', 'destinationRecords', 'identityRecords', 'identityBackground', 'loginHistory', 'sessionEvents', 'ipRecords', 'documentInventory', 'timelineEvents', 'linkObjects'],
    safeVariationInputs: ['employer tenure', 'payroll cadence', 'destination update timing', 'employee contact channel', 'verification status'],
  },
];

export const scenarioInputFields = [
  { id: 'claimType', label: 'Claim type', helper: 'Select the investigation family without assigning an outcome.' },
  { id: 'channel', label: 'Intake or alert channel', helper: 'Customer statement, system alert, employer inquiry, or platform queue.' },
  { id: 'customerSegment', label: 'Customer or entity segment', helper: 'Consumer, cardholder, business, employee, merchant, or new credit profile.' },
  { id: 'primaryQuestion', label: 'Primary investigator question', helper: 'What the learner must investigate, not what the answer is.' },
  { id: 'evidenceDepth', label: 'Evidence depth', helper: 'Light, standard, or deep packet size for generated records.' },
];

export const scenarioSafetyRules = [
  'Generated cases must use fictional people, entities, contact points, devices, IP ranges, Training IDs, Bank Codes, and Destination IDs.',
  'Generated case summaries may explain why the case exists using only the allegation or system alert.',
  'Generated packets must not include fraud/non-fraud outcomes, correct answers, red/green labels, fraud score, AI recommendation, or decision hints before submission.',
  'Generated link analysis may show shared objects neutrally without labeling the relationship as risky, safe, confirmed, or suspicious.',
  'Generated Luna coaching can explain tool purpose before submission, but decision-quality coaching stays locked until a learner package is saved.',
];

export function buildScenarioSeed({ templateId = scenarioTemplates[0].id, sequence = 1 } = {}) {
  const template = scenarioTemplates.find((item) => item.id === templateId) ?? scenarioTemplates[0];
  const padded = String(sequence).padStart(3, '0');
  return {
    seedId: `SEED-${template.claimType.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()}-${padded}`,
    templateId: template.id,
    claimType: template.claimType,
    title: template.title,
    caseReason: template.caseReason,
    investigatorQuestion: template.investigatorQuestion,
    generatedObjects: [
      `Training ID token ${padded}`,
      `Device object ${padded}`,
      `IP record 198.51.100.${10 + sequence}`,
      `Document packet ${padded}`,
    ],
    lockedUntilSubmission: true,
    evidencePacket: template.evidencePacket.map((packet, index) => ({
      id: `${template.id}-PKT-${index + 1}`,
      packet,
      status: index % 3 === 0 ? 'Requested' : 'Available',
      purpose: `Supports ${template.investigatorQuestion}`,
    })),
  };
}

export function buildScenarioPreviewRows() {
  return scenarioTemplates.map((template, index) => buildScenarioSeed({ templateId: template.id, sequence: index + 1 }));
}
