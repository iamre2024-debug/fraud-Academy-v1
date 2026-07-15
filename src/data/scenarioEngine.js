import { coreClaimTypes } from './claimRegistry.js';

export const scenarioClaimTypes = coreClaimTypes.map((claimType) => claimType.label);

function packetKey(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const scenarioTemplates = coreClaimTypes.flatMap((claimType) => claimType.scenarios.map((scenario) => ({
  id: scenario.id,
  claimTypeId: claimType.id,
  claimType: claimType.label,
  lane: claimType.lane,
  subtype: scenario.subtype,
  title: scenario.title,
  caseReason: scenario.summary,
  investigatorQuestion: scenario.plainEnglishMeaning,
  requiredFamilies: [...claimType.requiredTools],
  evidencePacket: (scenario.expectedEvidence ?? claimType.evidenceAreas).map(packetKey),
  safeVariationInputs: ['fictional profile', 'timeline sequence', 'document status', 'record conflict', 'evidence depth', 'difficulty'],
  taxonomyTags: scenario.taxonomyTags,
})));

export const scenarioInputFields = [
  { id: 'claimType', label: 'Claim type', helper: 'Select one of the ten Bible v2.1 investigation families.' },
  { id: 'scenarioId', label: 'Scenario and subtype', helper: 'Select the exact subtype packet without exposing its hidden post-submission truth.' },
  { id: 'difficulty', label: 'Difficulty', helper: 'Focused, layered, or cross-record review changes conflicts, dependencies, and missing evidence.' },
  { id: 'evidenceDepth', label: 'Evidence depth', helper: 'Light, standard, or deep controls the number of supporting records and documents.' },
  { id: 'count', label: 'Case count', helper: 'Create one case or a batch while preserving unique case identifiers and fictional data.' },
];

export const scenarioSafetyRules = [
  'Generated cases use fictional people, entities, contact points, devices, reserved training IP ranges, Training IDs, Bank Codes, and Destination IDs.',
  'Generated case summaries explain why the case exists using only the allegation, alert, or review request.',
  'The hidden truth, expected determination, grading result, and post-submission coaching stay locked until a learner package is saved.',
  'Generated link analysis shows shared objects neutrally without labeling the relationship as safe, confirmed, or suspicious.',
  'Difficulty changes evidence conflict and dependency depth while preserving the selected claim lane and subtype.',
];

export function buildScenarioSeed({ templateId = scenarioTemplates[0].id, sequence = 1 } = {}) {
  const template = scenarioTemplates.find((item) => item.id === templateId) ?? scenarioTemplates[0];
  const padded = String(sequence).padStart(3, '0');
  return {
    seedId: `SEED-${template.claimTypeId.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase()}-${padded}`,
    templateId: template.id,
    claimTypeId: template.claimTypeId,
    claimType: template.claimType,
    lane: template.lane,
    subtype: template.subtype,
    title: template.title,
    caseReason: template.caseReason,
    investigatorQuestion: template.investigatorQuestion,
    generatedObjects: [
      `Training ID token ${padded}`,
      `Case object ${template.claimTypeId}-${padded}`,
      `Reserved IP record 198.51.100.${10 + (sequence % 200)}`,
      `Document packet ${padded}`,
    ],
    lockedUntilSubmission: true,
    taxonomyTags: template.taxonomyTags,
    requiredFamilies: template.requiredFamilies,
    evidencePacket: template.evidencePacket.map((packet, index) => ({
      id: `${template.id}-PKT-${index + 1}`,
      packet,
      status: index % 4 === 2 ? 'Requested' : 'Available',
      purpose: `Supports the ${template.subtype} evidence review.`,
    })),
  };
}

export function buildScenarioPreviewRows() {
  return scenarioTemplates.map((template, index) => buildScenarioSeed({ templateId: template.id, sequence: index + 1 }));
}
