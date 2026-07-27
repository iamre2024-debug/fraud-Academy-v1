import { coreClaimTypes } from './claimRegistry.js';
import {
  CASE_DOMAIN_VERSION,
  caseDomainLabels,
  isWorkflowEnabled,
} from './caseDomain.js';

export const scenarioClaimTypes = coreClaimTypes.map((claimType) => claimType.label);

function packetKey(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const scenarioTemplates = coreClaimTypes.flatMap((claimType) => claimType.scenarios.flatMap((scenario) => (
  scenario.customerTypes.flatMap((customerType) => scenario.productTypes
    .filter((productType) => isWorkflowEnabled(customerType, productType, claimType.workflowType))
    .map((productType) => {
      const domain = { customerType, productType, workflowType: claimType.workflowType };
      const labels = caseDomainLabels(domain);
      return {
        id: `${scenario.id}--${productType}`,
        scenarioId: scenario.id,
        domainSchemaVersion: CASE_DOMAIN_VERSION,
        ...domain,
        ...labels,
        claimTypeId: claimType.id,
        claimType: claimType.label,
        lane: claimType.lane,
        subtype: scenario.alertReason,
        alertReason: scenario.alertReason,
        reportedAllegation: scenario.reportedAllegation,
        title: scenario.title,
        caseReason: scenario.summary,
        investigatorQuestion: scenario.plainEnglishMeaning,
        requiredFamilies: [...claimType.requiredTools],
        evidencePacket: (scenario.expectedEvidence ?? claimType.evidenceAreas).map(packetKey),
        safeVariationInputs: ['fictional profile', 'timeline sequence', 'document status', 'record conflict', 'evidence depth', 'difficulty'],
        taxonomyTags: {
          customerType,
          productType,
          workflowType: claimType.workflowType,
        },
      };
    }))
)));

export const scenarioInputFields = [
  { id: 'customerType', label: 'Customer type', helper: 'Select Personal or Business.' },
  { id: 'productType', label: 'Product', helper: 'Products are limited to the selected customer type.' },
  { id: 'workflowType', label: 'Review workflow', helper: 'Only workflows enabled for the selected product are available.' },
  { id: 'alertReason', label: 'Alert reason or allegation', helper: 'Use the neutral reason the case opened; it is not a finding.' },
  { id: 'scenarioId', label: 'Scenario', helper: 'Select a neutral evidence packet without exposing its post-submission truth.' },
  { id: 'difficulty', label: 'Difficulty', helper: 'Focused, layered, or cross-record review changes conflicts and dependencies.' },
  { id: 'evidenceDepth', label: 'Evidence depth', helper: 'Light, standard, or deep controls supporting records and documents.' },
  { id: 'count', label: 'Case count', helper: 'Create one case or a batch while preserving unique fictional identifiers.' },
];

export const scenarioSafetyRules = [
  'Generated cases use fictional people, entities, contact points, devices, reserved training IP ranges, Training IDs, Bank Codes, and Destination IDs.',
  'Generated case summaries display only customer type, product, workflow, and a neutral allegation or observable alert.',
  'Suspected patterns, expected operational decisions, final findings, and grading truth remain outside the public case until submission.',
  'Payroll Change Alert starts with platform-observable activity and an unknown request method.',
  'Email or mailbox evidence is unavailable until a business supplies it after trusted contact.',
  'Difficulty changes evidence conflict and dependency depth without changing the selected domain or hidden truth.',
];

export function buildScenarioSeed({ templateId = scenarioTemplates[0]?.id, sequence = 1 } = {}) {
  const template = scenarioTemplates.find((item) => item.id === templateId || item.scenarioId === templateId) ?? scenarioTemplates[0];
  if (!template) throw new Error('No scenario templates are configured');
  const padded = String(sequence).padStart(3, '0');
  return {
    seedId: `SEED-${template.workflowType.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase()}-${padded}`,
    templateId: template.id,
    scenarioId: template.scenarioId,
    domainSchemaVersion: CASE_DOMAIN_VERSION,
    customerType: template.customerType,
    customerTypeLabel: template.customerTypeLabel,
    productType: template.productType,
    productTypeLabel: template.productTypeLabel,
    workflowType: template.workflowType,
    workflowTypeLabel: template.workflowTypeLabel,
    alertReason: template.alertReason,
    reportedAllegation: template.reportedAllegation,
    claimTypeId: template.claimTypeId,
    claimType: template.claimType,
    lane: template.lane,
    subtype: template.alertReason,
    title: template.title,
    caseReason: template.caseReason,
    investigatorQuestion: template.investigatorQuestion,
    suspectedPatterns: [],
    operationalDecision: null,
    finalFinding: null,
    findingBasis: '',
    generatedObjects: [
      `Training ID token ${padded}`,
      `Case object ${template.workflowType}-${padded}`,
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
      purpose: `Supports the ${template.workflowTypeLabel.toLowerCase()} evidence review.`,
    })),
  };
}

export function buildScenarioPreviewRows() {
  return scenarioTemplates.map((template, index) => buildScenarioSeed({ templateId: template.id, sequence: index + 1 }));
}
