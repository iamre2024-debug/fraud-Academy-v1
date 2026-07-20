const ALLOWED_ORIGIN = process.env.LUNA_ALLOWED_ORIGIN || '*';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function cleanList(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 6) : fallback;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'Luna API is not configured' });

  const body = req.body || {};
  const deterministic = body.deterministicResult || {};
  if (!body.caseId || !body.submittedDecision || typeof deterministic.determinationMatched !== 'boolean') {
    return send(res, 400, { error: 'Missing guarded debrief inputs' });
  }

  const guardedFacts = {
    caseId: String(body.caseId),
    caseType: String(body.caseType || ''),
    allegation: String(body.allegation || ''),
    submittedDecision: String(body.submittedDecision),
    confidence: String(body.confidence || ''),
    rationale: String(body.rationale || '').slice(0, 4000),
    determinationMatched: deterministic.determinationMatched,
    expectedDetermination: deterministic.expectedDetermination || null,
    acceptedDeterminations: cleanList(deterministic.acceptedDeterminations),
    classification: deterministic.classification || null,
    truthRationale: deterministic.truthRationale || null,
    score: Number(deterministic.score || 0),
    strengths: cleanList(deterministic.strengths),
    followUps: cleanList(deterministic.followUps),
    completedTools: cleanList(body.packageFacts?.completedTools),
    pinnedEvidence: cleanList(body.packageFacts?.pinnedEvidence),
    noteSnapshot: cleanList(body.packageFacts?.noteSnapshot),
  };

  const instructions = [
    'You are Luna, the fraud manager conducting a post-decision case review inside a training app.',
    'Speak like an experienced manager reviewing an investigator decision, not like a generic tutor or scorecard.',
    'The deterministic fields are authoritative. Never reverse or override determinationMatched, expectedDetermination, acceptedDeterminations, classification, truthRationale, or score.',
    'First state plainly whether the investigator decision was correct, partially supported, or incorrect based on determinationMatched.',
    'Explain what the submitted decision means. Do Not Support means the available evidence does not support the customer fraud claim; it never means fraud was confirmed.',
    'Then explain what the case actually was according to classification and truthRationale, including whether later review established fraud, non-fraud, customer involvement, or an unresolved outcome.',
    'Separate the quality of the investigator decision at the time from what became known later in the scenario.',
    'Use only supplied facts. Do not invent evidence, people, transactions, downstream events, or policy rules.',
    'Do not reveal hidden truth before submission. This endpoint is called only after submission.',
    'Return concise JSON only using the required schema.',
  ].join(' ');

  try {
    const apiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.LUNA_OPENAI_MODEL || 'gpt-5-mini',
        instructions,
        input: JSON.stringify(guardedFacts),
        text: {
          format: {
            type: 'json_schema',
            name: 'luna_manager_debrief',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                managerVerdict: { type: 'string' },
                decisionMeaning: { type: 'string' },
                actualCaseOutcome: { type: 'string' },
                managerExplanation: { type: 'string' },
                strengths: { type: 'array', items: { type: 'string' }, maxItems: 6 },
                coachingActions: { type: 'array', items: { type: 'string' }, maxItems: 6 },
              },
              required: ['managerVerdict', 'decisionMeaning', 'actualCaseOutcome', 'managerExplanation', 'strengths', 'coachingActions'],
            },
          },
        },
      }),
    });

    if (!apiResponse.ok) {
      const details = await apiResponse.text();
      console.error('OpenAI Luna request failed', apiResponse.status, details.slice(0, 1000));
      return send(res, 502, { error: 'Luna manager review failed' });
    }

    const result = await apiResponse.json();
    const outputText = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    const review = JSON.parse(outputText || '{}');
    return send(res, 200, {
      managerVerdict: String(review.managerVerdict || ''),
      decisionMeaning: String(review.decisionMeaning || ''),
      actualCaseOutcome: String(review.actualCaseOutcome || ''),
      managerExplanation: String(review.managerExplanation || ''),
      strengths: cleanList(review.strengths, guardedFacts.strengths),
      coachingActions: cleanList(review.coachingActions, guardedFacts.followUps),
      source: 'api',
    });
  } catch (error) {
    console.error('Luna manager debrief error', error);
    return send(res, 500, { error: 'Unable to generate Luna manager review' });
  }
}
