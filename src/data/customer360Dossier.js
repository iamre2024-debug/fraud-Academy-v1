const unavailable = 'Not available in the current training packet';

const builtInDossiers = {
  'FA-ATO-24018': {
    identity: {
      dob: 'Feb 14, 1988',
      age: '38',
      maskedMemberId: 'MEM-••••-1842',
      language: 'English',
      verificationStatus: 'CIP identity verified · Jul 16, 2018',
      accountStanding: 'Open · no servicing restriction recorded',
      lastVerified: 'Jun 29, 2026',
    },
    contact: {
      homePhone: '(214) 555-0112',
      mailingAddress: '1842 Cedar Avenue, Dallas, TX 75201 (training)',
      physicalAddress: '1842 Cedar Avenue, Dallas, TX 75201 (training)',
      verificationStatus: 'Phone, email, and address confirmed in profile maintenance',
      alertUse: 'Mobile phone receives OTP; email receives security alerts',
    },
    products: [
      { id: 'ACCT-4410', product: 'Everyday Checking', maskedNumber: '••••4410', opened: 'Jul 16, 2018', status: 'Open', balance: '$5,842.63', limit: 'Not applicable', standing: 'No NSF or overdraft in the supplied 90-day baseline' },
      { id: 'ACCT-1182', product: 'Savings', maskedNumber: '••••1182', opened: 'Aug 2, 2018', status: 'Open', balance: '$12,406.11', limit: 'Not applicable', standing: 'Open and available' },
      { id: 'CARD-4410', product: 'Debit Card', maskedNumber: '••••4410', opened: 'Jul 16, 2018', status: 'Active', balance: 'Linked to checking', limit: '$2,500 daily purchase limit', standing: 'Replacement issued Jan 18, 2026' },
    ],
    relationship: {
      normalDeposits: 'Payroll deposits between $3,700 and $3,950 twice monthly',
      normalSpending: 'Groceries, fuel, utilities, and card purchases averaging $2,860 monthly',
      authorizedUsers: 'No additional checking signer recorded',
      businessRelationships: 'No business relationship linked to this consumer profile',
    },
    security: {
      mfaStatus: 'Face ID and password; mobile OTP available',
      passwordChanged: 'Mar 4, 2026 · customer self-service',
      trustedDevices: 'DEV-MAYA-IP16-001',
      lockouts: 'No account lockout in the supplied 90-day history',
      alerts: 'Security alerts routed to mobile and primary email',
      walletEnrollment: 'One wallet token record available for comparison',
      recoveryContact: '(214) 555-0184 · maya.training@example.test',
    },
    recentContacts: [
      { id: 'CON-1001', dateTime: 'Jul 8, 2026 · 10:58 AM', type: 'Claim intake call', channel: 'Phone follow-up', outcome: 'Customer statement captured', agent: 'Training intake desk', notes: 'Customer denied the purchase and identified the personal iPhone as the usual device.' },
      { id: 'CON-1002', dateTime: 'Jul 8, 2026 · 10:54 AM', type: 'Secure message', channel: 'Digital banking', outcome: 'Message received', agent: 'Automated case intake', notes: 'Secure message initiated the dispute packet.' },
      { id: 'CON-1003', dateTime: 'Jun 29, 2026 · 3:14 PM', type: 'Contact verification', channel: 'Mobile app', outcome: 'Phone and email confirmed', agent: 'Customer self-service', notes: 'No contact value was changed.' },
    ],
    priorClaims: [
      { id: 'CLM-HIST-1001', date: 'Oct 12, 2023', type: 'Merchant billing inquiry', amount: '$64.20', item: 'Retail card purchase', outcome: 'Closed after merchant credit', notes: 'Different merchant and issue type from the active case.', documents: 'Merchant credit notice', similar: 'No' },
    ],
  },
  'FA-CB-24007': {
    identity: {
      dob: 'Nov 3, 1991',
      age: '34',
      maskedMemberId: 'MEM-••••-5510',
      language: 'English',
      verificationStatus: 'CIP identity verified · Sep 9, 2021',
      accountStanding: 'Open · current payment standing',
      lastVerified: 'Jun 21, 2026',
    },
    contact: {
      homePhone: 'No separate home phone recorded',
      mailingAddress: '5510 Magnolia Way, Fort Worth, TX 76102 (training)',
      physicalAddress: '5510 Magnolia Way, Fort Worth, TX 76102 (training)',
      verificationStatus: 'Mobile, email, and address confirmed',
      alertUse: 'Email receives statement alerts; mobile receives OTP',
    },
    products: [
      { id: 'CARD-8841', product: 'Rewards Credit Card', maskedNumber: '••••8841', opened: 'Sep 9, 2021', status: 'Open', balance: '$1,048.32', limit: '$8,500.00', standing: 'Autopay active · no late payment in supplied history' },
    ],
    relationship: {
      normalDeposits: 'Not applicable to the card-only relationship',
      normalSpending: 'Recurring services and household purchases averaging $1,120 monthly',
      authorizedUsers: 'No authorized user recorded',
      businessRelationships: 'No business relationship linked to this card profile',
    },
    security: {
      mfaStatus: 'Password and biometric sign-in; mobile OTP available',
      passwordChanged: 'Feb 17, 2026 · customer self-service',
      trustedDevices: 'DEV-JORDAN-AND-001 · DEV-JORDAN-DSK-002',
      lockouts: 'No account lockout in the supplied 90-day history',
      alerts: 'Billing and security alerts routed to primary email',
      walletEnrollment: 'No wallet enrollment record in the current packet',
      recoveryContact: '(817) 555-0149 · jordan.training@example.test',
    },
    recentContacts: [
      { id: 'CON-2201', dateTime: 'Jul 8, 2026 · 9:21 AM', type: 'Dispute intake', channel: 'Mobile app', outcome: 'Recurring billing issue submitted', agent: 'Automated case intake', notes: 'Cancellation confirmation was not attached at intake.' },
      { id: 'CON-2202', dateTime: 'Jul 8, 2026 · 9:28 AM', type: 'Document request notice', channel: 'Secure message', outcome: 'Delivered', agent: 'Training claims queue', notes: 'Cancellation confirmation requested.' },
      { id: 'CON-2203', dateTime: 'Jun 21, 2026 · 11:14 AM', type: 'Contact verification', channel: 'Online profile', outcome: 'Contact points confirmed', agent: 'Customer self-service', notes: 'No value changed.' },
    ],
    priorClaims: [
      { id: 'CLM-HIST-2201', date: 'Mar 6, 2024', type: 'Card purchase inquiry', amount: '$42.18', item: 'Restaurant purchase', outcome: 'Customer recognized transaction', notes: 'No chargeback was filed.', documents: 'Customer contact note', similar: 'No' },
    ],
  },
  'FA-CR-24003': {
    identity: {
      dob: 'Jun 22, 1995',
      age: '31',
      maskedMemberId: 'MEM-••••-2044',
      language: 'English',
      verificationStatus: 'New-account identity review completed · Jul 7, 2026',
      accountStanding: 'Open · new relationship with limited history',
      lastVerified: 'Jul 7, 2026',
    },
    contact: {
      homePhone: 'No separate home phone recorded',
      mailingAddress: '2044 Meadow Lane, Arlington, TX 76010 (training)',
      physicalAddress: '2044 Meadow Lane, Arlington, TX 76010 (training)',
      verificationStatus: 'Email and mobile verified during profile creation',
      alertUse: 'Email receives security alerts; mobile receives OTP',
    },
    products: [
      { id: 'LINE-3011', product: 'Consumer Credit Line', maskedNumber: '••••3011', opened: 'Jul 7, 2026', status: 'Open · restricted pending review', balance: '$0.00 posted', limit: '$2,400.00', standing: 'No payment history yet' },
    ],
    relationship: {
      normalDeposits: 'No established deposit baseline',
      normalSpending: 'No established spending baseline',
      authorizedUsers: 'No authorized user recorded',
      businessRelationships: 'Avery Training Ventures appears in the fictional identity report',
    },
    security: {
      mfaStatus: 'Email code enrolled during profile creation',
      passwordChanged: 'Jul 7, 2026 · initial password setup',
      trustedDevices: 'DEV-AVERY-SAF-001 · early-history device only',
      lockouts: 'No lockout recorded',
      alerts: 'New-profile and payment-method alerts routed to email',
      walletEnrollment: 'No wallet enrollment record',
      recoveryContact: '(682) 555-0167 · avery.training@example.test',
    },
    recentContacts: [
      { id: 'CON-3301', dateTime: 'Jul 8, 2026 · 7:45 AM', type: 'System review notice', channel: 'Email', outcome: 'Notice delivered', agent: 'Account monitoring', notes: 'Identity and payment records were queued for review.' },
      { id: 'CON-3302', dateTime: 'Jul 7, 2026 · 5:18 PM', type: 'New-account confirmation', channel: 'Email', outcome: 'Email code verified', agent: 'Digital onboarding', notes: 'Profile and recovery contact were established.' },
    ],
    priorClaims: [],
  },
};

function stableNumber(value = '') {
  return [...String(value)].reduce((total, character) => total + character.charCodeAt(0), 0);
}

function generatedIdentity(activeCase) {
  const seed = stableNumber(activeCase.id);
  const year = 1978 + (seed % 23);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][seed % 12];
  const day = 1 + (seed % 27);
  return {
    dob: `${month} ${day}, ${year}`,
    age: String(2026 - year),
    maskedMemberId: `MEM-••••-${String(seed).slice(-4).padStart(4, '0')}`,
    language: seed % 4 === 0 ? 'English · Spanish preference recorded' : 'English',
    verificationStatus: `Fictional identity verification completed · ${activeCase.issueStartDate ?? activeCase.reportedDate ?? 'case opening'}`,
    accountStanding: activeCase.taxonomyTags?.lifecycleStage === 'new' ? 'Open · new relationship with limited history' : 'Open · servicing status available',
    lastVerified: activeCase.issueStartDate ?? activeCase.reportedDate ?? activeCase.opened,
  };
}

function generatedProducts(activeCase) {
  const rail = activeCase.taxonomyTags?.productRail ?? activeCase.productsAccounts?.[0]?.value ?? 'account';
  const suffix = String(stableNumber(activeCase.id)).slice(-4).padStart(4, '0');
  const productNames = {
    card: 'Training Card Account',
    payroll: 'Payroll Services Profile',
    wire: 'Business Payment Account',
    credit: 'Training Credit Line',
    loan: 'Training Business Line',
    application: 'Application Profile',
  };
  return [{
    id: `PROD-${suffix}`,
    product: productNames[rail] ?? 'Training Deposit Account',
    maskedNumber: `••••${suffix}`,
    opened: activeCase.customer?.relationshipSince ?? activeCase.issueStartDate ?? activeCase.opened,
    status: 'Open training record',
    balance: /credit|loan/.test(rail) ? activeCase.amount ?? '$0.00' : 'Balance available in Financial Investigation',
    limit: /credit|loan/.test(rail) ? activeCase.amount ?? unavailable : 'Not applicable',
    standing: activeCase.taxonomyTags?.lifecycleStage === 'new' ? 'Limited relationship history' : 'Standing available for case comparison',
  }];
}

function generatedContactHistory(activeCase) {
  const channel = activeCase.intake?.channel ?? 'Case intake';
  return [
    { id: `${activeCase.id}-CON-1`, dateTime: activeCase.intake?.contactTime ?? activeCase.reportedDate ?? activeCase.opened, type: 'Intake or alert', channel, outcome: 'Case packet opened', agent: 'Training intake queue', notes: activeCase.statement?.value ?? activeCase.allegation },
    { id: `${activeCase.id}-CON-2`, dateTime: activeCase.reportedDate ?? activeCase.opened, type: 'Case notification', channel: activeCase.customer?.contact?.preferredChannel ?? channel, outcome: 'Fictional notice recorded', agent: 'Automated training workflow', notes: 'Notification status is available for cross-reference.' },
  ];
}

function generatedPriorClaims(activeCase) {
  if (activeCase.taxonomyTags?.lifecycleStage === 'new') return [];
  return [{
    id: `${activeCase.id}-HIST-1`,
    date: 'Historical training period',
    type: 'Prior service inquiry',
    amount: '$0.00',
    item: 'Relationship service record',
    outcome: 'Closed',
    notes: 'Different issue type; provided only as relationship context.',
    documents: 'Contact note',
    similar: 'No',
  }];
}

function claimHighlights(activeCase) {
  const claim = `${activeCase.claimTypeId ?? ''} ${activeCase.type ?? ''} ${activeCase.lane ?? ''}`.toLowerCase();
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  if (claim.includes('account-takeover') || claim.includes('account takeover')) return {
    title: 'Access and profile context',
    subtitle: 'Compare control changes with authentication and money movement',
    fields: [
      ['Password / recovery changes', profileChanges.filter((item) => /password|recovery|email|phone/i.test(`${item.eventType} ${item.item}`)).length],
      ['MFA changes', profileChanges.filter((item) => /mfa|otp/i.test(`${item.eventType} ${item.item}`)).length],
      ['New device records', new Set((activeCase.loginHistory ?? []).map((item) => item.deviceId ?? item.device)).size],
      ['Alert delivery', 'Review Security & Access and Recent Contact'],
      ['External account / payee', profileChanges.find((item) => /payee|external|wallet/i.test(`${item.eventType} ${item.item}`))?.newValue ?? 'No change listed in profile history'],
      ['Sequence window', `${activeCase.issueStartDate ?? activeCase.opened} through ${activeCase.reportedDate ?? activeCase.opened}`],
    ],
  };
  if (claim.includes('chargeback') || claim.includes('card')) return {
    title: 'Card and merchant context',
    subtitle: 'Compare card standing, billing history, possession, and intake records',
    fields: [
      ['Card status', 'Open related product record'],
      ['Last valid activity', activeCase.transactionInfo ?? unavailable],
      ['Merchant history', 'Available in Transaction History'],
      ['Wallet / token status', 'Open Payment Verification when available'],
      ['Travel notes', activeCase.intake?.customerLocation ? `Customer reported ${activeCase.intake.customerLocation}` : unavailable],
      ['Card possession / intake', activeCase.statement?.value ?? activeCase.allegation ?? unavailable],
    ],
  };
  if (claim.includes('payroll') || claim.includes('bec') || claim.includes('vendor') || claim.includes('wire')) return {
    title: 'Business contact and payment-change context',
    subtitle: 'Compare administrators, callbacks, and destination maintenance',
    fields: [
      ['Business contact', activeCase.profile?.business ?? activeCase.person],
      ['Owner / admin / payroll role', activeCase.profile?.entityRole ?? activeCase.scenarioFamily ?? unavailable],
      ['Employee / vendor relationship', activeCase.scenarioTitle ?? activeCase.subtype ?? unavailable],
      ['Recent admin changes', `${profileChanges.length} profile-maintenance events`],
      ['Bank profile changes', profileChanges.find((item) => /bank|destination|payroll|beneficiary/i.test(`${item.eventType} ${item.item}`))?.newValue ?? 'No destination change listed'],
      ['Callback status', 'Review Payment Verification and Recent Contact'],
    ],
  };
  if (claim.includes('credit') || claim.includes('bust') || claim.includes('application')) return {
    title: 'Relationship and exposure context',
    subtitle: 'Compare account age, payment standing, stated income, and public records',
    fields: [
      ['Relationship length', activeCase.customer?.relationshipSince ?? unavailable],
      ['Payment history', 'Open Financial Investigation'],
      ['Credit line / exposure', activeCase.amount ?? unavailable],
      ['Revenue / income', activeCase.profile?.employer ?? 'Review income and business records'],
      ['NSF / late payments', 'Open product and Financial Investigation records'],
      ['Public records', 'Open Identity Intel / People Search'],
    ],
  };
  return {
    title: 'Claim-specific relationship context',
    subtitle: 'Facts supplied by the active fictional case packet',
    fields: [['Claim lane', activeCase.lane ?? activeCase.type], ['Scenario', activeCase.scenarioTitle ?? activeCase.subtype], ['Available profile events', profileChanges.length], ['Exposure', activeCase.amount ?? unavailable]],
  };
}

function nextStep(activeCase) {
  const required = activeCase.requiredTools ?? [];
  const preferred = required.find((tool) => !['Case Summary', 'Customer 360'].includes(tool));
  return preferred ?? (activeCase.type?.includes('Chargeback') ? 'Transaction History' : 'Identity Intel / People Search');
}

export function getCustomerIdentityFacts(activeCase) {
  return (builtInDossiers[activeCase.id]?.identity ?? generatedIdentity(activeCase));
}

export function getCustomer360Dossier(activeCase) {
  const preset = builtInDossiers[activeCase.id] ?? {};
  const identity = preset.identity ?? generatedIdentity(activeCase);
  const contact = preset.contact ?? {
    homePhone: 'No separate home phone recorded',
    mailingAddress: activeCase.customer?.contact?.address ?? activeCase.intake?.customerLocation ?? unavailable,
    physicalAddress: activeCase.customer?.contact?.address ?? activeCase.intake?.customerLocation ?? unavailable,
    verificationStatus: 'Fictional contact points available for comparison',
    alertUse: 'Review Login History and profile-maintenance records',
  };
  const products = preset.products ?? generatedProducts(activeCase);
  const relationship = preset.relationship ?? {
    normalDeposits: 'Review the case-scoped Financial Investigation baseline',
    normalSpending: activeCase.transactionInfo ?? 'Review Transaction History',
    authorizedUsers: 'No additional authorized user in the supplied packet',
    businessRelationships: activeCase.profile?.business ?? 'No separate business relationship supplied',
  };
  const knownDevices = [...new Set((activeCase.loginHistory ?? []).map((item) => item.deviceId ?? item.device).filter(Boolean))];
  const security = preset.security ?? {
    mfaStatus: [...new Set((activeCase.loginHistory ?? []).map((item) => item.method).filter(Boolean))].join(' · ') || unavailable,
    passwordChanged: 'Review Password Reset History when available',
    trustedDevices: knownDevices.join(' · ') || unavailable,
    lockouts: (activeCase.loginHistory ?? []).some((item) => item.result !== 'Successful') ? 'Unsuccessful access records available' : 'No lockout recorded in the supplied packet',
    alerts: `Alerts routed through ${activeCase.customer?.contact?.preferredChannel ?? activeCase.intake?.channel ?? 'the recorded contact channel'}`,
    walletEnrollment: (activeCase.customer?.profileChanges ?? []).find((item) => /wallet/i.test(`${item.eventType} ${item.item}`))?.newValue ?? 'No wallet event in the supplied profile history',
    recoveryContact: `${activeCase.customer?.contact?.phone ?? unavailable} · ${activeCase.customer?.contact?.email ?? unavailable}`,
  };
  const recentContacts = preset.recentContacts ?? generatedContactHistory(activeCase);
  const priorClaims = preset.priorClaims ?? generatedPriorClaims(activeCase);
  const suggestedTool = nextStep(activeCase);

  return {
    identity,
    contact,
    products,
    relationship,
    security,
    recentContacts,
    priorClaims,
    claimContext: claimHighlights(activeCase),
    suggestedTool,
    atAGlance: [
      ['Relationship', activeCase.customer?.relationshipSince ?? unavailable],
      ['Products', products.length],
      ['Profile changes', activeCase.customer?.profileChanges?.length ?? 0],
      ['Prior claims', priorClaims.length],
    ],
    lunaInsight: `Start with the customer baseline, then compare profile maintenance with ${suggestedTool}. This is process guidance, not a case conclusion.`,
  };
}
