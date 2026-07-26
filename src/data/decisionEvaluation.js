export const documentAssessmentOptions = {
  received: ['Received', 'Not received'],
  readability: ['Readable', 'Unreadable'],
  completeness: ['Complete', 'Incomplete'],
  identityMatch: ['Matches', 'Does not match', 'Unclear'],
  claimEffect: ['Supports claim', 'Does not support claim', 'Contradicts claim', 'Does not address claim'],
  additionalEvidenceNeeded: ['No', 'Yes'],
};

export const emptyDocumentAssessment = Object.freeze({
  received: '',
  readability: '',
  completeness: '',
  identityMatch: '',
  claimEffect: '',
  additionalEvidenceNeeded: '',
  reasoning: '',
});

const minimumAssessmentReasoningWords = 8;

function cleanOption(field, value) {
  return documentAssessmentOptions[field]?.includes(value) ? value : '';
}

function wordCount(text = '') {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeDocumentAssessment(input = {}) {
  return {
    received: cleanOption('received', input?.received),
    readability: cleanOption('readability', input?.readability),
    completeness: cleanOption('completeness', input?.completeness),
    identityMatch: cleanOption('identityMatch', input?.identityMatch),
    claimEffect: cleanOption('claimEffect', input?.claimEffect),
    additionalEvidenceNeeded: cleanOption('additionalEvidenceNeeded', input?.additionalEvidenceNeeded),
    reasoning: String(input?.reasoning ?? '').trim(),
  };
}

export function summarizeDocumentAssessment(input = {}) {
  const assessment = normalizeDocumentAssessment(input);
  const started = Object.values(assessment).some(Boolean);
  const missingFields = [];
  const conflicts = [];
  const reasoningWordCount = wordCount(assessment.reasoning);

  if (started) {
    if (!assessment.received) missingFields.push('document receipt');
    if (!assessment.additionalEvidenceNeeded) missingFields.push('whether additional evidence is needed');
    if (!assessment.reasoning) missingFields.push('document assessment reasoning');

    if (assessment.received === 'Received') {
      if (!assessment.readability) missingFields.push('document readability');
      if (assessment.readability === 'Readable' && !assessment.completeness) missingFields.push('document completeness');
      if (assessment.readability === 'Readable'
        && assessment.completeness === 'Complete'
        && !assessment.claimEffect) {
        missingFields.push('what the documents show');
      }
    }

    if (assessment.received === 'Not received'
      && (assessment.readability || assessment.completeness || assessment.claimEffect)) {
      conflicts.push('documents marked not received cannot also be assessed for quality or claim effect');
    }
    if (assessment.readability === 'Unreadable' && assessment.claimEffect) {
      conflicts.push('unreadable documents cannot establish a claim effect');
    }

    const independentEvidenceExplained = /\b(?:independent|non-document|other (?:evidence|records?)|separate (?:evidence|records?))\b/i
      .test(assessment.reasoning);
    const unresolvedDocumentState = assessment.received === 'Not received'
      || assessment.readability === 'Unreadable'
      || assessment.completeness === 'Incomplete'
      || assessment.claimEffect === 'Does not address claim'
      || assessment.identityMatch === 'Unclear';
    if (unresolvedDocumentState
      && assessment.additionalEvidenceNeeded === 'No'
      && !independentEvidenceExplained) {
      conflicts.push('an unresolved document gap needs more evidence or an explanation of the independent evidence that resolves it');
    }
    if (assessment.reasoning && reasoningWordCount < minimumAssessmentReasoningWords) {
      conflicts.push(`document assessment reasoning is shorter than ${minimumAssessmentReasoningWords} words`);
    }
  }

  const completeReadable = assessment.received === 'Received'
    && assessment.readability === 'Readable'
    && assessment.completeness === 'Complete';
  const supportive = completeReadable && assessment.claimEffect === 'Supports claim';
  const nonSupportive = completeReadable
    && ['Does not support claim', 'Contradicts claim'].includes(assessment.claimEffect);
  const unresolved = assessment.received === 'Not received'
    || assessment.readability === 'Unreadable'
    || assessment.completeness === 'Incomplete'
    || assessment.claimEffect === 'Does not address claim'
    || assessment.identityMatch === 'Unclear';
  const coherent = started && missingFields.length === 0 && conflicts.length === 0;
  const decisive = coherent
    && completeReadable
    && assessment.additionalEvidenceNeeded === 'No'
    && (supportive || nonSupportive);
  const needsMoreEvidence = coherent
    && unresolved
    && assessment.additionalEvidenceNeeded === 'Yes';

  let label = 'Not assessed';
  if (started && !coherent) label = 'Assessment needs clarification';
  else if (decisive && supportive) label = 'Complete documents support the claim';
  else if (decisive && nonSupportive) label = 'Complete documents do not support the claim';
  else if (needsMoreEvidence) label = 'Document gap requires more evidence';
  else if (coherent) label = 'Document context recorded';

  return {
    assessment,
    started,
    coherent,
    decisive,
    completeReadable,
    supportive,
    nonSupportive,
    unresolved,
    needsMoreEvidence,
    missingFields,
    conflicts,
    reasoningWordCount,
    minimumReasoningWords: minimumAssessmentReasoningWords,
    label,
  };
}

export function classifyDecision(choice = '') {
  const value = String(choice).trim().toLowerCase();
  if (!value) return 'unknown';
  if (value === 'hold') return 'hold';
  if (value === 'release') return 'release';
  if (/\bpartial\b|approve with restrictions/.test(value)) return 'partial';
  if (/close as duplicate|close as customer withdrew|already worked claim|no response/.test(value)) return 'administrative';
  if (/do not support|deny|reduce exposure/.test(value)) return 'adverse';
  if (/support|approve|complete application verification|maintain account/.test(value)) return 'favorable';
  if (/request|more information|insufficient evidence|unable to verify|hold pending|no action yet|continue investigation/.test(value)) return 'provisional';
  if (/escalate|route for|refer to/.test(value)) return 'escalation';
  return 'unknown';
}

function semanticDecisionMatch(submittedChoice, acceptedChoice) {
  const submitted = String(submittedChoice).trim().toLowerCase();
  const accepted = String(acceptedChoice).trim().toLowerCase();
  if (submitted === accepted) return true;

  const submittedClass = classifyDecision(submittedChoice);
  const acceptedClass = classifyDecision(acceptedChoice);
  if (submittedClass !== acceptedClass) return false;

  if (submittedClass === 'favorable') {
    return (/support customer claim|approve claim/.test(submitted) && /support customer claim|approve claim/.test(accepted))
      || (/support credit request/.test(submitted) && /support credit request/.test(accepted));
  }
  if (submittedClass === 'adverse') {
    return (/do not support customer claim|deny claim/.test(submitted) && /do not support customer claim|deny claim/.test(accepted))
      || (/do not support credit request/.test(submitted) && /do not support credit request/.test(accepted));
  }
  return submittedClass === 'partial'
    && /partial/.test(submitted)
    && /partial/.test(accepted);
}

function isOperationalHoldReleaseCase(activeCase = {}) {
  if (['email-bec', 'payroll-direct-deposit'].includes(activeCase.claimTypeId)) return true;
  const context = [activeCase.lane, activeCase.subtype, activeCase.scenarioTitle, activeCase.type]
    .filter(Boolean)
    .join(' ');
  return activeCase.claimTypeId === 'account-takeover'
    && /business.*payroll|payroll.*business/i.test(context);
}

function documentSupportedDecisionClass(activeCase, documentSummary) {
  if (documentSummary.supportive) {
    return isOperationalHoldReleaseCase(activeCase) ? 'hold' : 'favorable';
  }
  if (documentSummary.nonSupportive) {
    return isOperationalHoldReleaseCase(activeCase) ? 'release' : 'adverse';
  }
  return null;
}

function documentContextRecommendation(activeCase, documentSummary) {
  if (documentSummary.needsMoreEvidence) return 'A provisional more-information outcome supported by the named document gap';
  if (isOperationalHoldReleaseCase(activeCase)) return documentSummary.supportive ? 'Hold' : 'Release';
  if (activeCase.claimTypeId === 'credit-risk') {
    return documentSummary.supportive ? 'Support Credit Request' : 'Do Not Support Credit Request';
  }
  if (activeCase.claimTypeId === 'business-loan-bust-out') {
    return documentSummary.supportive ? 'Approve Application' : 'Deny Application';
  }
  if (activeCase.claimTypeId === 'application-verification') {
    return documentSummary.supportive
      ? 'Complete application verification review'
      : 'A final verification outcome supported by the complete document findings';
  }
  return documentSummary.supportive ? 'Support Customer Claim' : 'Do Not Support Customer Claim';
}

export function evaluateDecisionDefensibility({ activeCase = {}, reviewPackage = {} }) {
  const caseTruth = activeCase.caseTruth ?? null;
  const primaryDetermination = caseTruth?.correctDetermination ?? null;
  const truthDeterminations = unique(caseTruth?.acceptedDeterminations?.length
    ? caseTruth.acceptedDeterminations
    : primaryDetermination ? [primaryDetermination] : []);
  const submittedChoice = reviewPackage.choice ?? '';
  const documentSummary = summarizeDocumentAssessment(reviewPackage.documentAssessment);

  if (!caseTruth) {
    return {
      determinationMatched: null,
      basis: 'ungraded',
      primaryDetermination,
      acceptedDeterminations: truthDeterminations,
      displayExpectedDetermination: primaryDetermination,
      documentSummary,
      explanation: 'This case has no hidden outcome, so Luna is coaching the documented reasoning without marking the determination right or wrong.',
    };
  }

  if (!truthDeterminations.length) {
    return {
      determinationMatched: null,
      basis: 'ungraded',
      primaryDetermination,
      acceptedDeterminations: truthDeterminations,
      displayExpectedDetermination: primaryDetermination,
      documentSummary,
      explanation: 'This case has scenario context but no calibrated determination, so Luna is coaching the reasoning without marking the choice right or wrong.',
    };
  }

  const exactMatch = truthDeterminations.some((choice) => String(choice).trim().toLowerCase() === String(submittedChoice).trim().toLowerCase());
  const semanticMatch = truthDeterminations.some((choice) => semanticDecisionMatch(submittedChoice, choice));
  const submittedClass = classifyDecision(submittedChoice);
  const truthClasses = unique(truthDeterminations.map(classifyDecision));
  const documentDecisionClass = documentSupportedDecisionClass(activeCase, documentSummary);
  const documentExpectedClass = documentSummary.needsMoreEvidence ? 'provisional' : documentDecisionClass;
  const hasUsableDocumentConclusion = Boolean(documentExpectedClass)
    && (documentSummary.decisive || documentSummary.needsMoreEvidence);
  const selectedFitsDocuments = hasUsableDocumentConclusion
    && submittedClass === documentExpectedClass;
  const decisiveAlternative = documentSummary.decisive
    && selectedFitsDocuments
    && truthClasses.includes('provisional');
  const evidenceGapAlternative = documentSummary.needsMoreEvidence
    && selectedFitsDocuments
    && truthClasses.some((item) => ['favorable', 'adverse', 'partial', 'hold', 'release'].includes(item));

  if (hasUsableDocumentConclusion && (exactMatch || semanticMatch) && !selectedFitsDocuments) {
    return {
      determinationMatched: false,
      basis: 'context-conflict',
      primaryDetermination,
      acceptedDeterminations: truthDeterminations,
      displayExpectedDetermination: documentContextRecommendation(activeCase, documentSummary),
      documentSummary,
      explanation: `${documentSummary.label}. Although the selected button matches the original calibration, the saved document assessment supports ${documentContextRecommendation(activeCase, documentSummary)}. Reconcile that reasoning before finalizing the decision.`,
    };
  }

  if (decisiveAlternative || evidenceGapAlternative) {
    const contextExplanation = decisiveAlternative
      ? `${documentSummary.label}. The saved reasoning supports a final ${submittedClass} outcome instead of treating unfavorable documents as automatically incomplete.`
      : `${documentSummary.label}. The saved reasoning identifies a specific unresolved evidence gap, so a provisional decision is defensible at submission time.`;
    return {
      determinationMatched: true,
      basis: 'document-context',
      primaryDetermination,
      acceptedDeterminations: unique([...truthDeterminations, submittedChoice]),
      displayExpectedDetermination: `${submittedChoice} — defensible from the saved document assessment`,
      documentSummary,
      explanation: contextExplanation,
    };
  }

  if (exactMatch) {
    return {
      determinationMatched: true,
      basis: 'exact',
      primaryDetermination,
      acceptedDeterminations: truthDeterminations,
      displayExpectedDetermination: primaryDetermination,
      documentSummary,
      explanation: 'The submitted determination matches the calibrated scenario outcome.',
    };
  }

  if (semanticMatch) {
    return {
      determinationMatched: true,
      basis: 'semantic',
      primaryDetermination,
      acceptedDeterminations: unique([...truthDeterminations, submittedChoice]),
      displayExpectedDetermination: `${submittedChoice} — equivalent lane outcome`,
      documentSummary,
      explanation: 'The wording differs from the answer key, but the submitted determination represents the same lane outcome.',
    };
  }

  let explanation = `The saved reasoning does not yet support departing from the calibrated outcome of ${primaryDetermination}.`;
  if (documentSummary.started && !documentSummary.coherent) {
    explanation = `Clarify the document assessment before using it to support a different determination: ${[
      ...documentSummary.missingFields,
      ...documentSummary.conflicts,
    ].join('; ')}.`;
  } else if (documentSummary.completeReadable && documentSummary.nonSupportive && submittedClass === 'provisional') {
    explanation = 'The documents were recorded as complete, readable, and non-supportive. Identify a specific remaining gap before choosing more information instead of a final adverse outcome.';
  } else if (documentSummary.needsMoreEvidence && ['favorable', 'adverse', 'partial', 'hold', 'release'].includes(submittedClass)) {
    explanation = 'The assessment records a missing, unreadable, incomplete, or non-responsive document and says more evidence is needed. A final outcome is premature until that gap is resolved.';
  }

  return {
    determinationMatched: false,
    basis: 'unsupported',
    primaryDetermination,
    acceptedDeterminations: truthDeterminations,
    displayExpectedDetermination: primaryDetermination,
    documentSummary,
    explanation,
  };
}
