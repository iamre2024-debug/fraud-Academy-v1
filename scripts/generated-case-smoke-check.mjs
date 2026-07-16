const storage = new Map();
const legacyCase = {
  id: 'FA-LEGACY-G0000001',
  type: 'Legacy Generated Case',
  person: 'Legacy Learner',
  trainingId: 'TRN-LEGACY-1',
  claimId: 'CLM-LEGACY-1',
  allegation: 'Legacy local case preserved for migration coverage.',
  queueReason: 'Migration smoke coverage.',
  facts: ['No final outcome shown', 'Evidence First lock active'],
  loginHistory: [{ id: 'LEGACY-LOG-1', deviceId: 'DEV-LEGACY-1' }],
  generatedAt: 1,
};

storage.set('fraud-academy-generated-cases-v1', JSON.stringify([legacyCase]));

global.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
    clear() {
      storage.clear();
    },
  },
};

const {
  combineCaseCatalog,
  generateAndSaveCases,
  generateAndSaveCase,
  getGeneratedCaseRepository,
  listGeneratedCases,
} = await import('../src/data/generatedCaseRepository.js');
const { coreClaimTypes } = await import('../src/data/claimRegistry.js');
const { createGeneratedCase } = await import('../src/data/generatedCases.js');
const { getCustomer360Dossier } = await import('../src/data/customer360Dossier.js');
const { getIdentityIntelReport } = await import('../src/data/identityIntelReport.js');
const { getLoginRecords } = await import('../src/data/loginRecords.js');
const { getSessionRecords } = await import('../src/data/sessionRecords.js');
const { getIpRecords } = await import('../src/data/ipRecords.js');
const { buildAccessHistoryReport } = await import('../src/data/accessHistoryReports.js');
const { enrichTrainingCases } = await import('../src/data/caseEnrichment.js');

const failures = [];
const repository = await getGeneratedCaseRepository();
const created = [];

if (repository.kind !== 'localStorage') failures.push(`Expected Node smoke fallback repository, found ${repository.kind}.`);

for (let index = 0; index < 124; index += 1) {
  created.push(await generateAndSaveCase());
}

const batch = await generateAndSaveCases({
  count: 5,
  claimTypeId: 'non-fraud-chargeback',
  scenarioId: 'ncb-recurring-cancellation',
  difficulty: 'deep',
  evidenceDepth: 'standard',
});

const saved = await listGeneratedCases();
const ids = new Set(saved.map((item) => item.id));
const enrichedSaved = enrichTrainingCases(saved);
const accountIds = new Set(enrichedSaved.map((item) => item.accountId));

if (saved.length !== 130) failures.push(`Expected 130 generated cases after single and batch generation, found ${saved.length}.`);
if (!ids.has(legacyCase.id)) failures.push('Legacy localStorage case was not preserved.');
if (ids.size !== saved.length) failures.push('Generated case IDs are not unique.');
if (accountIds.size !== enrichedSaved.length || enrichedSaved.some((item) => !item.accountId?.startsWith('ACCT-'))) failures.push('Every saved case must expose a unique Account ID after catalog enrichment.');
if (enrichedSaved.some((item) => item.customer?.relationship?.find((entry) => entry.label === 'Account ID')?.value !== item.accountId)) failures.push('Every saved case must expose its Account ID in Customer 360.');
if (batch[batch.length - 1]?.id !== saved[0]?.id) failures.push('Newest generated batch case was not added to the front of the queue.');
if (batch.length !== 5) failures.push('Batch generation did not return every requested fictional case.');

for (const item of saved) {
  for (const field of ['id', 'type', 'person', 'trainingId', 'claimId', 'allegation', 'queueReason']) {
    if (!item[field]) failures.push(`${item.id ?? 'Generated case'} is missing ${field}.`);
  }

  if (!item.facts?.includes('No final outcome shown')) failures.push(`${item.id} is missing the Evidence First outcome guard.`);
  if (!item.facts?.includes('Evidence First lock active')) failures.push(`${item.id} is missing the Evidence First lock marker.`);
  if (!item.loginHistory?.every((entry) => entry.deviceId)) failures.push(`${item.id} has a login without a Device ID.`);
}

for (const [index, claimType] of coreClaimTypes.entries()) {
  const generated = createGeneratedCase({
    index: 950000 + index,
    claimTypeId: claimType.id,
    scenarioId: claimType.scenarios[0]?.id,
    difficulty: 'deep',
    evidenceDepth: 'standard',
  });
  if (generated.claimTypeId !== claimType.id) failures.push(`${claimType.label} did not preserve its claim type ID.`);
  if (generated.type !== claimType.label) failures.push(`${claimType.label} did not preserve its official display name.`);
  if (generated.lane !== claimType.lane) failures.push(`${claimType.label} did not preserve its lane.`);
  if (!generated.statement?.value || !generated.intakeAnswers?.length || !generated.caseBriefing?.summary) {
    failures.push(`${claimType.label} is missing its complete Case Briefing intake packet.`);
  }
  if (generated.intakeAnswers.length !== claimType.intakePrompts.length || generated.intakeAnswers.some((item) => /review the related|available when that tool|available for comparison|intake channel:|fictional subject/i.test(item.answer))) {
    failures.push(`${claimType.label} has a generic or incomplete Claim Intake packet.`);
  }
  if (!generated.assignedInvestigator || !generated.assignedDate || !generated.dueDate) {
    failures.push(`${claimType.label} is missing universal Case Briefing ownership or deadline details.`);
  }
  if (generated.parties?.length < 2 || generated.parties.some((party) => !party.role || !party.name || !party.relationship || !party.source)) {
    failures.push(`${claimType.label} is missing complete Case Briefing party records.`);
  }
  const briefingRows = generated.briefingDetails?.rows ?? [];
  if (!generated.briefingDetails?.title || briefingRows.length < 6 || briefingRows.some((row) => !row.label || !row.value)) {
    failures.push(`${claimType.label} is missing structured lane-specific Case Briefing details.`);
  }
  if (!generated.requiredTools?.length || !generated.availableTools?.length || !generated.documents?.length || !generated.toolResults?.evidence?.length) {
    failures.push(`${claimType.label} is missing required investigation packet data.`);
  }
  if (generated.customer?.profileChanges?.length < 3 || generated.customer.profileChanges.some((event) => !event.eventType || !event.oldValue || !event.newValue || !event.session || !event.notes)) {
    failures.push(`${claimType.label} is missing complete generated profile-maintenance history.`);
  }
  const customerDossier = getCustomer360Dossier(generated);
  const identityReport = getIdentityIntelReport(generated);
  const loginRecords = getLoginRecords(generated);
  const sessionRecords = getSessionRecords(generated);
  const ipRecords = getIpRecords(generated);
  const usesAccessHistory = generated.availableTools.includes('Login History');
  if (!customerDossier.products.length || customerDossier.recentContacts.length < 2) failures.push(`${claimType.label} is missing generated Customer 360 depth.`);
  if (identityReport.sections.length < 17 || identityReport.sections.some((section) => !section.fields.length)) failures.push(`${claimType.label} is missing generated Identity Intel field depth.`);
  if (usesAccessHistory) {
    if (!loginRecords.some((record) => /successful/i.test(record.result)) || !loginRecords.some((record) => /failed|locked/i.test(record.result))) failures.push(`${claimType.label} is missing varied generated authentication outcomes.`);
    if (loginRecords.some((record) => !record.timestamp || !record.eventType || !record.operatingSystem || record.failedAttemptCount === undefined)) failures.push(`${claimType.label} is missing complete generated Login History fields.`);
    if (sessionRecords.length < 2 || sessionRecords.some((record) => /not recorded/i.test(`${record.end} ${record.duration} ${record.pagesViewed.join(' ')}`))) failures.push(`${claimType.label} is missing complete generated Session History paths.`);
    if (!ipRecords.length || ipRecords.some((record) => /lookup needed/i.test(`${record.city} ${record.isp} ${record.networkType} ${record.vpnProxyTor}`))) failures.push(`${claimType.label} is missing generated IP Intelligence lookup depth.`);
    for (const reportType of ['login', 'session', 'ip']) {
      const report = buildAccessHistoryReport(generated, reportType);
      if (!report.pages.length || !report.fields.length || report.folder !== 'System Reports') failures.push(`${claimType.label} is missing the ${reportType} access-history report.`);
    }
  } else if (loginRecords.length || sessionRecords.length || ipRecords.length) {
    failures.push(`${claimType.label} generated access-history records outside its selected scenario lane.`);
  }
  if (claimType.chargeback && !generated.chargebackDecision?.reasonCode) {
    failures.push(`${claimType.label} is missing chargeback reason-code packet details.`);
  }
  if (claimType.credit && !generated.creditDecision?.deadline) {
    failures.push(`${claimType.label} is missing credit decision rail details.`);
  }
}

const atoClaim = coreClaimTypes.find((claimType) => claimType.id === 'account-takeover');
if (!atoClaim?.requiredTools.includes('Session History') || !atoClaim?.requiredTools.includes('IP Intelligence')) failures.push('Account Takeover must require Session History and IP Intelligence review.');

const focusedCase = createGeneratedCase({
  index: 980001,
  claimTypeId: 'account-takeover',
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'light',
  evidenceDepth: 'light',
});
const complexCase = createGeneratedCase({
  index: 980002,
  claimTypeId: 'account-takeover',
  scenarioId: 'ato-phishing-wallet',
  difficulty: 'deep',
  evidenceDepth: 'light',
});
if (complexCase.toolResults.transactions.length <= focusedCase.toolResults.transactions.length) {
  failures.push('Difficulty should increase cross-record investigation complexity without changing the claim lane.');
}

const baseCases = [{ id: saved[0].id }, { id: 'BUILT-IN-CASE' }];
const combined = combineCaseCatalog(baseCases, saved);
const combinedIds = combined.map((item) => item.id);

if (combinedIds.filter((id) => id === saved[0].id).length !== 1) failures.push('combineCaseCatalog duplicated an existing case ID.');
if (!combinedIds.includes('BUILT-IN-CASE')) failures.push('combineCaseCatalog removed a built-in case.');

if (failures.length) {
  console.error('Generated case smoke check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Generated case smoke check passed. The repository adapter preserves legacy cases and keeps more than 50 unique Evidence First cases.');
