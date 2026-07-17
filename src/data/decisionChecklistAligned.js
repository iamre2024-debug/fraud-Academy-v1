import { flagWeightPoints, getDecisionChecklist as getBaseDecisionChecklist } from './decisionChecklist.js';

const alignedFlagUpdates = {
  'ato-new-device': { type: 'red' },
  'ato-unusual-network': { type: 'red' },
  'ato-control-change': { type: 'red' },
  'ato-known-access': { type: 'green' },
  'ato-customer-mfa': {
    type: 'green',
    prompt: 'Did the customer complete the MFA, wallet enrollment, or authentication event from a trusted channel tied to the activity?',
    evidenceHint: 'Cite the MFA event, destination, timestamp, channel, and customer statement.',
  },
  'ato-no-control-change': { type: 'green' },
  'ato-carrier-change': { type: 'red' },
  'ato-established-sim': { type: 'green' },
  'ato-helpdesk-bypass': { type: 'red' },
  'ato-valid-support-contact': { type: 'green' },
  'ato-control-obtained-by-deception': { type: 'red' },

  'fcb-new-token-device': {
    type: 'red',
    prompt: 'Was a new wallet token, device, shipping profile, or payment credential used for the disputed activity?',
    evidenceHint: 'Cite the token or device ID, enrollment time, first use, shipping profile, and customer statement.',
  },
  'fcb-card-possession': {
    type: 'red',
    prompt: 'Did the customer retain the physical card while an unfamiliar card-not-present or wallet transaction occurred?',
  },
  'fcb-merchant-gap': {
    type: 'red',
    prompt: 'Is required merchant authorization, delivery, activation, or fulfillment evidence missing or inconsistent?',
  },
  'fcb-customer-authentication': {
    type: 'green',
    prompt: 'Did authentication and device evidence connect the disputed purchase to the customer or trusted device?',
  },
  'fcb-known-merchant': { type: 'green' },
  'fcb-fulfillment': { type: 'green' },
  'fcb-loss-timing': { type: 'red' },
  'fcb-chip-pin-after-loss': {
    type: 'green',
    prompt: 'Did chip, PIN, or recognized-cardholder activity conflict with the reported card-possession timeline?',
    override: false,
  },
  'fcb-no-receipt-activation-gap': { type: 'red' },
  'fcb-card-delivery-activation': { type: 'green' },
  'fcb-fallback-distant-use': { type: 'red' },
  'fcb-genuine-card-present': { type: 'green' },
  'fcb-atm-pos-anomaly': { type: 'red' },
  'fcb-atm-chip-pin': { type: 'green', override: false },
  'wallet-chip-during-fraud-window': {
    type: 'green',
    prompt: 'During the reported wallet-fraud period, did the same cardholder complete a physical chip card transaction or trusted-device wallet provisioning?',
    evidenceHint: 'Cite the transaction ID, date and time, merchant, EMV chip entry mode or wallet provisioning record, device, and card-possession evidence.',
    override: false,
  },

  'ncb-cancellation-proof': {
    type: 'red',
    prompt: 'Is there proof that cancellation, return, or refund eligibility occurred before the disputed billing?',
  },
  'ncb-billing-error': {
    type: 'red',
    prompt: 'Do the records show a duplicate charge, incorrect amount, missing credit, or other billing error?',
  },
  'ncb-required-evidence-gap': { type: 'red' },
  'ncb-merchant-fulfilled': { type: 'green' },
  'ncb-late-cancellation': { type: 'green' },
  'ncb-recurring-history': {
    type: 'green',
    prompt: 'Was the same recurring billing pattern previously disclosed or accepted without dispute?',
    evidenceHint: 'Cite prior charges, renewal notices, statements, account usage, or customer contacts.',
  },
  'ncb-receipt-posting-mismatch': { type: 'red' },
  'ncb-receipt-matches-posted': { type: 'green' },
  'ncb-same-order-duplicate': { type: 'red', override: false },
  'ncb-separate-orders': { type: 'green' },
  'ncb-refund-overdue': { type: 'red' },
  'ncb-refund-not-due': { type: 'green' },
  'ncb-material-description-gap': { type: 'red' },
  'ncb-description-matches': { type: 'green' },
  'ncb-no-service-or-credit': { type: 'red' },
  'ncb-service-performed': { type: 'green' },
};

function alignedFlag(flag) {
  return { ...flag, ...(alignedFlagUpdates[flag.id] ?? {}) };
}

function isDigitalWalletCase(activeCase = {}) {
  return /wallet|token/i.test([
    activeCase.scenarioId,
    activeCase.scenarioTitle,
    activeCase.subtype,
    activeCase.transactionInfo,
    activeCase.allegation,
  ].filter(Boolean).join(' '));
}

export function getDecisionChecklist(activeCase = {}) {
  const base = getBaseDecisionChecklist(activeCase);
  let flags = base.flags.map(alignedFlag);

  if (activeCase.claimTypeId === 'account-takeover') {
    flags = flags.filter((item) => item.id !== 'wallet-chip-during-fraud-window');

    if (isDigitalWalletCase(activeCase)) {
      flags.unshift({
        id: 'ato-wallet-added-after-control-change',
        type: 'red',
        weight: 'Critical',
        prompt: 'Was a wallet token or payment credential added after an unfamiliar login, recovery event, or profile-control change?',
        evidenceHint: 'Cite the login, recovery or profile event, wallet enrollment, device, authentication route, and first transaction after enrollment.',
        override: true,
      });
    }
  }

  return {
    ...base,
    flags: [...new Map(flags.map((item) => [item.id, item])).values()],
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
