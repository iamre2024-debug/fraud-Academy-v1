import { getBusinessRecords, getFinancialRecords } from './caseToolData.js';

export const kybReviewTabs = [
  { id: 'overview', label: 'Overview', question: 'Which legal entity and business identifiers are recorded?' },
  { id: 'registration', label: 'Registration', question: 'What do the fictional registration and standing records show?' },
  { id: 'owners', label: 'Owners & UBO', question: 'Which owners, officers, and controlling parties are connected?' },
  { id: 'online', label: 'Online Presence', question: 'Which website, domain, address, and phone records are available?' },
  { id: 'bank', label: 'Bank Ownership', question: 'How is the business name recorded on linked payment accounts?' },
  { id: 'revenue', label: 'Revenue & Cash Flow', question: 'What stated and observed business activity can be compared?' },
  { id: 'payroll', label: 'Payroll', question: 'Which employee and payroll records connect to this entity?' },
  { id: 'documents', label: 'Documents & Links', question: 'Which documents and source records support this review?' },
];

const builtInProfiles = {
  'FA-ATO-24018': {
    legalName: 'Northstar Digital Market LLC',
    dba: 'Northstar Digital Market',
    entityType: 'Limited liability company',
    registrationId: 'TX-REG-8042917',
    jurisdiction: 'Texas',
    formationDate: 'Apr 11, 2021',
    standing: 'Active fictional registration',
    ein: '**-***7318',
    address: '2800 Commerce Training Way, Dallas, TX 75201',
    phone: '(214) 555-0126',
    website: 'northstar-market.training.example.test',
    domainAge: '4 years, 9 months',
    industry: 'Digital goods marketplace',
    naics: '459999 - All other miscellaneous retailers',
    source: 'Fictional merchant onboarding and state-registration records',
    observed: 'Jul 8, 2026',
    owners: [
      ['OWN-NS-01', 'Elena Park', 'Managing member', '62%', 'Training identity record on file', 'Apr 11, 2021'],
      ['OWN-NS-02', 'Marcus Hill', 'Member', '38%', 'Training identity record on file', 'Apr 11, 2021'],
    ],
    online: [
      ['WEB-NS-01', 'Domain record', 'northstar-market.training.example.test', 'Registered Oct 3, 2021', 'Registrant organization matches the legal business name.'],
      ['WEB-NS-02', 'Business phone', '(214) 555-0126', 'First recorded Apr 2021', 'Phone appears in the merchant onboarding record.'],
      ['WEB-NS-03', 'Operating address', '2800 Commerce Training Way, Dallas, TX 75201', 'First recorded Apr 2021', 'Address appears in registration and onboarding records.'],
    ],
    bank: [
      ['BNK-NS-01', 'Settlement account ending 3904', 'Northstar Digital Market LLC', 'Training Commerce Bank', 'Exact legal-name record', 'Opened May 2, 2021', 'MPT-7784'],
    ],
    revenue: [
      ['REV-NS-01', 'Stated annual revenue', 1820000, 'Merchant onboarding', '2026 application record'],
      ['REV-NS-02', 'Observed monthly settlement volume', 148240, 'Processor statement', 'Jun 2026'],
      ['REV-NS-03', 'Observed monthly refunds', 11084, 'Processor statement', 'Jun 2026'],
    ],
    payroll: [
      ['PY-NS-01', 'Active employee count', '14', 'Payroll summary', 'Jun 2026'],
      ['PY-NS-02', 'Monthly gross payroll', '$62,480.00', 'Payroll summary', 'Jun 2026'],
    ],
  },
  'FA-CB-24007': {
    legalName: 'StreamBox Premium Media LLC',
    dba: 'StreamBox Premium',
    entityType: 'Limited liability company',
    registrationId: 'DE-REG-6118032',
    jurisdiction: 'Delaware',
    formationDate: 'Aug 19, 2019',
    standing: 'Active fictional registration',
    ein: '**-***2207',
    address: '1600 Media Training Plaza, Wilmington, DE 19801',
    phone: '(302) 555-0144',
    website: 'streambox-premium.training.example.test',
    domainAge: '6 years, 7 months',
    industry: 'Subscription media services',
    naics: '516210 - Media streaming distribution services',
    source: 'Fictional merchant registration and recurring-billing records',
    observed: 'Jul 8, 2026',
    owners: [
      ['OWN-SB-01', 'Cameron Reed', 'Chief executive officer', '55%', 'Training identity record on file', 'Aug 19, 2019'],
      ['OWN-SB-02', 'Taylor Morgan', 'Managing member', '45%', 'Training identity record on file', 'Aug 19, 2019'],
    ],
    online: [
      ['WEB-SB-01', 'Domain record', 'streambox-premium.training.example.test', 'Registered Sep 2, 2019', 'Domain registrant uses the legal entity name.'],
      ['WEB-SB-02', 'Support phone', '(302) 555-0144', 'First recorded Sep 2019', 'Phone is listed in recurring-billing support records.'],
      ['WEB-SB-03', 'Registered address', '1600 Media Training Plaza, Wilmington, DE 19801', 'First recorded Aug 2019', 'Address appears on the fictional formation record.'],
    ],
    bank: [
      ['BNK-SB-01', 'Merchant account ending 2207', 'StreamBox Premium Media LLC', 'Training Atlantic Bank', 'Exact legal-name record', 'Opened Sep 9, 2019', 'SBT-2207'],
    ],
    revenue: [
      ['REV-SB-01', 'Stated annual revenue', 4380000, 'Merchant profile', '2026 annual review'],
      ['REV-SB-02', 'Observed monthly recurring billing', 361440, 'Processor statement', 'Jun 2026'],
      ['REV-SB-03', 'Observed monthly refunds', 24670, 'Processor statement', 'Jun 2026'],
    ],
    payroll: [
      ['PY-SB-01', 'Active employee count', '28', 'Payroll summary', 'Jun 2026'],
      ['PY-SB-02', 'Monthly gross payroll', '$154,200.00', 'Payroll summary', 'Jun 2026'],
    ],
  },
  'FA-CR-24003': {
    legalName: 'Lakeside Office Supply LLC',
    dba: 'Lakeside Office Supply',
    entityType: 'Limited liability company',
    registrationId: 'TX-REG-4821044',
    jurisdiction: 'Texas',
    formationDate: 'Mar 12, 2022',
    standing: 'Active fictional registration',
    ein: '**-***4821',
    address: '4400 Lakeside Training Drive, Arlington, TX 76010',
    phone: '(682) 555-0128',
    website: 'lakeside-office.training.example.test',
    domainAge: '4 years, 2 months',
    industry: 'Office supplies and business services',
    naics: '459410 - Office supplies and stationery retailers',
    source: 'Fictional KYB onboarding, employer, payroll, and state-registration records',
    observed: 'Jul 8, 2026',
    owners: [
      ['OWN-LS-01', 'Renee Wallace', 'Managing member', '70%', 'Training identity record on file', 'Mar 12, 2022'],
      ['OWN-LS-02', 'Devon Price', 'Operations member', '30%', 'Training identity record on file', 'Mar 12, 2022'],
    ],
    online: [
      ['WEB-LS-01', 'Domain record', 'lakeside-office.training.example.test', 'Registered May 4, 2022', 'Registrant organization matches the legal business name.'],
      ['WEB-LS-02', 'Payroll phone', '(682) 555-0128', 'First recorded May 2022', 'Phone is present in the employer and payroll contact records.'],
      ['WEB-LS-03', 'Business address', '4400 Lakeside Training Drive, Arlington, TX 76010', 'First recorded Mar 2022', 'Address appears in state registration and EIN paperwork.'],
    ],
    bank: [
      ['BNK-LS-01', 'Operating account ending 4821', 'Lakeside Office Supply LLC', 'Training Metro Bank', 'Exact legal-name record', 'Opened Mar 22, 2022', 'DST-7740'],
    ],
    revenue: [
      ['REV-LS-01', 'Stated annual revenue', 768000, 'Business credit application', 'Jul 7, 2026'],
      ['REV-LS-02', 'Observed monthly deposits', 63840, 'Business bank statement', 'Jun 2026'],
      ['REV-LS-03', 'Observed monthly operating outflow', 50120, 'Business bank statement', 'Jun 2026'],
    ],
    payroll: [
      ['PY-LS-01', 'Active employee count', '9', 'Payroll summary', 'Jun 2026'],
      ['PY-LS-02', 'Monthly gross payroll', '$31,760.00', 'Payroll summary', 'Jun 2026'],
      ['PY-LS-03', 'Employee record in active case', 'Avery Brooks', 'Employee profile', 'Jul 7, 2026'],
    ],
  },
};

function stableNumber(value = '') {
  return [...String(value)].reduce((total, character) => ((total * 33) + character.charCodeAt(0)) % 100000, 19);
}

function amountNumber(value = '') {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function money(value = 0) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generatedProfile(activeCase, businessRecords) {
  const seed = stableNumber(activeCase.id);
  const sourceEntity = activeCase.profile?.business
    ?? businessRecords.business360?.[0]?.entity
    ?? activeCase.profile?.employer
    ?? `${activeCase.person ?? 'Training'} Services`;
  const customerName = activeCase.person ?? 'Training Customer';
  const baseName = /llc|inc\.?|corp/i.test(sourceEntity) ? sourceEntity : `${sourceEntity} LLC`;
  const suffix = String(seed).padStart(5, '0').slice(-5);
  const amount = Math.max(500, amountNumber(activeCase.amount));
  const creditProfile = activeCase.toolResults?.creditProfile;
  const statedRevenue = amountNumber(creditProfile?.statedAnnualIncome) || Math.round((amount * (72 + (seed % 36))) / 100) * 100;
  const deposits = amountNumber(creditProfile?.averageMonthlyDeposits) || Math.round((statedRevenue / 12) * (0.82 + ((seed % 12) / 100)) * 100) / 100;
  const outflow = amountNumber(creditProfile?.averageMonthlyOutflow) || Math.round(deposits * (0.68 + ((seed % 8) / 100)) * 100) / 100;
  const city = activeCase.intake?.customerLocation ?? 'Training City, TX';
  const address = activeCase.customer?.contact?.address ?? `${100 + (seed % 8000)} Training Business Way, ${city}`;
  const jurisdiction = city.split(',').at(-1)?.trim() || 'Training jurisdiction';
  const domainStem = String(sourceEntity).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || `training-${suffix}`;
  return {
    legalName: baseName,
    dba: sourceEntity.replace(/\s+(LLC|Inc\.?|Corp\.?)/i, ''),
    entityType: 'Training business entity',
    registrationId: `${jurisdiction}-REG-${suffix}`,
    jurisdiction,
    formationDate: `${1 + (seed % 12)}/15/${2018 + (seed % 7)}`,
    standing: 'Fictional registration record available',
    ein: `**-***${suffix.slice(-4)}`,
    address,
    phone: activeCase.customer?.contact?.phone ?? `(555) 01${suffix.slice(-2)}-${suffix.slice(-4)}`,
    website: `${domainStem}.training.example.test`,
    domainAge: `${1 + (seed % 7)} years, ${seed % 12} months`,
    industry: activeCase.taxonomy?.claimFamily ?? activeCase.type ?? 'Training business services',
    naics: `${440000 + (seed % 9000)} - Training industry classification`,
    source: 'Generated fictional KYB, case, and relationship records',
    observed: activeCase.reportedDate ?? activeCase.opened ?? 'Training date',
    owners: [
      [`${activeCase.id}-OWN-1`, customerName, activeCase.profile?.entityRole ?? 'Controlling party', `${51 + (seed % 40)}%`, 'Training identity record connected', activeCase.opened ?? 'Training date'],
      [`${activeCase.id}-OWN-2`, `Training owner ${suffix.slice(-2)}`, 'Additional owner', `${9 + (seed % 31)}%`, 'Training identity record connected', activeCase.opened ?? 'Training date'],
    ],
    online: [
      [`${activeCase.id}-WEB-1`, 'Domain record', `${domainStem}.training.example.test`, `Recorded ${1 + (seed % 7)} years ago`, 'Registrant organization uses the generated legal name.'],
      [`${activeCase.id}-WEB-2`, 'Business phone', activeCase.customer?.contact?.phone ?? `(555) 01${suffix.slice(-2)}-${suffix.slice(-4)}`, 'Current case packet', 'Phone is connected to the generated business profile.'],
      [`${activeCase.id}-WEB-3`, 'Business address', address, 'Current case packet', 'Address is available for cross-document comparison.'],
    ],
    bank: [
      [`${activeCase.id}-BNK-1`, `Operating account ending ${suffix.slice(-4)}`, baseName, 'Training Financial Network', 'Legal-name field recorded', activeCase.opened ?? 'Training date', `${activeCase.id}-PV-1`],
    ],
    revenue: [
      [`${activeCase.id}-REV-1`, 'Stated annual revenue', statedRevenue, 'Generated business profile', 'Current review'],
      [`${activeCase.id}-REV-2`, 'Observed monthly deposits', deposits, 'Generated bank activity', 'Current comparison period'],
      [`${activeCase.id}-REV-3`, 'Observed monthly outflow', outflow, 'Generated bank activity', 'Current comparison period'],
    ],
    payroll: [
      [`${activeCase.id}-PY-1`, 'Employee records', String(Math.max(1, businessRecords.employeeProfile?.length ?? 1)), 'Employee Profile', 'Current review'],
      [`${activeCase.id}-PY-2`, 'Payroll records', String(Math.max(1, businessRecords.payrollHistory?.length ?? 1)), 'Payroll History', 'Current review'],
    ],
  };
}

function record({ id, title, category, value, observed, detail, fields = [], relatedRecords = [] }) {
  return { id, title, category, value, observed, detail, fields, relatedRecords };
}

function buildRecords(activeCase, profile, businessRecords, financialRecords) {
  const transactionIds = (financialRecords.transactions ?? []).map((item) => item.id);
  const paymentIds = (financialRecords.paymentVerification ?? []).map((item) => item.id);
  const businessIds = (businessRecords.business360 ?? []).map((item) => item.id);
  const employeeIds = (businessRecords.employeeProfile ?? []).map((item) => item.id);
  const payrollIds = (businessRecords.payrollHistory ?? []).map((item) => item.id);
  const caseDocumentIds = (activeCase.documents ?? []).map((item) => item.id ?? item.title ?? item.name).filter(Boolean);

  return {
    overview: [record({
      id: `${activeCase.id}-KYB-OVERVIEW`,
      title: profile.legalName,
      category: profile.entityType,
      value: profile.standing,
      observed: profile.observed,
      detail: 'Legal name, DBA, industry, registration, and contact fields from the fictional business profile.',
      fields: [['Legal name', profile.legalName], ['DBA', profile.dba], ['Entity type', profile.entityType], ['Industry', profile.industry], ['NAICS', profile.naics], ['Jurisdiction', profile.jurisdiction], ['Source', profile.source]],
      relatedRecords: [...businessIds, ...caseDocumentIds],
    })],
    registration: [record({
      id: profile.registrationId,
      title: `${profile.jurisdiction} registration`,
      category: 'Business registration',
      value: profile.standing,
      observed: profile.observed,
      detail: 'Fictional registration record available for entity and document comparison.',
      fields: [['Registration ID', profile.registrationId], ['Legal name', profile.legalName], ['Formation date', profile.formationDate], ['Jurisdiction', profile.jurisdiction], ['Standing', profile.standing], ['Masked EIN', profile.ein], ['Registered address', profile.address]],
      relatedRecords: caseDocumentIds,
    })],
    owners: profile.owners.map(([id, name, role, ownership, identityStatus, firstRecorded]) => record({
      id,
      title: name,
      category: role,
      value: ownership,
      observed: firstRecorded,
      detail: 'Owner or controlling-party record supplied for fictional identity comparison.',
      fields: [['Name', name], ['Role', role], ['Ownership', ownership], ['Identity record', identityStatus], ['First recorded', firstRecorded], ['Entity', profile.legalName]],
      relatedRecords: businessIds,
    })),
    online: profile.online.map(([id, type, value, observed, detail]) => record({
      id,
      title: type,
      category: 'Online and contact record',
      value,
      observed,
      detail,
      fields: [['Record type', type], ['Recorded value', value], ['Observed', observed], ['Comparison note', detail], ['Domain age', type === 'Domain record' ? profile.domainAge : 'Not applicable']],
      relatedRecords: businessIds,
    })),
    bank: profile.bank.map(([id, account, owner, bankName, nameComparison, opened, linkedObject]) => record({
      id,
      title: account,
      category: 'Business bank ownership',
      value: owner,
      observed: opened,
      detail: 'Bank-owner name and linked payment object are shown for direct comparison.',
      fields: [['Account', account], ['Bank name', bankName], ['Recorded owner', owner], ['Legal entity', profile.legalName], ['Name comparison', nameComparison], ['Opened', opened], ['Linked payment object', linkedObject]],
      relatedRecords: [...paymentIds, linkedObject],
    })),
    revenue: profile.revenue.map(([id, title, amount, source, observed]) => record({
      id,
      title,
      category: 'Revenue and cash-flow record',
      value: money(amount),
      observed,
      detail: `${source} supplies this fictional business activity value for comparison.`,
      fields: [['Activity type', title], ['Amount', money(amount)], ['Source', source], ['Observed', observed], ['Entity', profile.legalName]],
      relatedRecords: transactionIds,
    })),
    payroll: [
      ...profile.payroll.map(([id, title, value, source, observed]) => record({ id, title, category: 'Payroll record', value, observed, detail: `${source} supplies this fictional payroll value.`, fields: [['Payroll field', title], ['Recorded value', value], ['Source', source], ['Observed', observed], ['Entity', profile.legalName]], relatedRecords: [...employeeIds, ...payrollIds] })),
      ...(businessRecords.payrollHistory ?? []).map((item) => record({ id: `KYB-${item.id}`, title: `${item.employer} - ${item.period}`, category: 'Linked payroll history', value: item.amount, observed: item.period, detail: item.context, fields: [['Employer', item.employer], ['Period', item.period], ['Amount', item.amount], ['Channel', item.channel], ['Status', item.status]], relatedRecords: [item.id, ...employeeIds] })),
    ],
    documents: [
      ...caseDocumentIds.map((id) => record({ id: `KYB-${id}`, title: String(id), category: 'Case document', value: 'Available by Account ID in Document Viewer', observed: activeCase.opened ?? 'Training date', detail: 'Use the case Account ID in Document Viewer to review the complete fictional document and extracted fields.', fields: [['Document', String(id)], ['Review location', 'Document Viewer'], ['Entity', profile.legalName]], relatedRecords: [String(id)] })),
      ...businessIds.map((id) => record({ id: `KYB-LINK-${id}`, title: id, category: 'Business relationship record', value: profile.dba, observed: profile.observed, detail: 'Business relationship record linked from Business 360.', fields: [['Record ID', id], ['Entity', profile.dba], ['Source tool', 'Business 360']], relatedRecords: [id] })),
      ...paymentIds.map((id) => record({ id: `KYB-LINK-${id}`, title: id, category: 'Payment ownership record', value: profile.legalName, observed: profile.observed, detail: 'Payment object linked from Payment Verification.', fields: [['Record ID', id], ['Entity', profile.legalName], ['Source tool', 'Payment Verification']], relatedRecords: [id] })),
    ],
  };
}

export function getKybReview(activeCase = {}) {
  const businessRecords = getBusinessRecords(activeCase);
  const financialRecords = getFinancialRecords(activeCase);
  const profile = builtInProfiles[activeCase.id] ?? generatedProfile(activeCase, businessRecords);
  const recordsByTab = buildRecords(activeCase, profile, businessRecords, financialRecords);
  return {
    profile,
    recordsByTab,
    lookupValues: [profile.legalName, profile.dba, profile.ein, profile.registrationId, profile.address],
    counts: {
      owners: profile.owners.length,
      businessRecords: businessRecords.business360?.length ?? 0,
      paymentObjects: financialRecords.paymentVerification?.length ?? 0,
      documents: recordsByTab.documents.length,
    },
    reviewedFacts: [
      `${profile.legalName} is recorded as ${profile.entityType.toLowerCase()} in ${profile.jurisdiction}.`,
      `${profile.owners.length} owner or controlling-party record${profile.owners.length === 1 ? '' : 's'} connect to the entity.`,
      `${financialRecords.paymentVerification?.length ?? 0} payment ownership object${financialRecords.paymentVerification?.length === 1 ? '' : 's'} and ${recordsByTab.documents.length} document or linked-record item${recordsByTab.documents.length === 1 ? '' : 's'} are available.`,
    ],
  };
}

export function matchesKybReviewLookup(workspace, query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  return workspace.lookupValues.some((value) => String(value).trim().toLowerCase() === normalized);
}

export function kybRecordSearchText(record = {}) {
  return [record.id, record.title, record.category, record.value, record.observed, record.detail, ...(record.fields ?? []).flat(), ...(record.relatedRecords ?? [])].filter(Boolean).join(' ').toLowerCase();
}
