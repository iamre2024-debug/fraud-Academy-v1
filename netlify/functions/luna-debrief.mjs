const model = process.env.LUNA_OPENAI_MODEL || 'gpt-5.6-sol';

const responseHeaders = {
  'Content-Type': 'application/json',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(503, { error: 'Luna AI is not configured.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid Luna payload.' });
  }

  const deterministicDebrief = payload?.deterministicDebrief;
  const allowedOutcome = deterministicDebrief?.outcome;
  const supportedDetermination = deterministicDebrief?.truthReveal?.correctDetermination ?? '';
  if (!allowedOutcome || !payload?.case?.id || !payload?.learnerSubmission) {
    return json(400, { error: 'Incomplete Luna payload.' });
  }

  const allowedEvidenceIds = new Set((payload.allowedEvidenceIds ?? []).filter(Boolean));
  const coachingPayload = prunePayload(payload);

  const systemPrompt = [
    'You are Luna, a fraud-investigation training manager.',
    'Coach the learner after they submitted a decision. Do not perform the grading yourself.',
    `The app already determined the grading outcome: ${allowedOutcome}. You must return that exact outcome.`,
    supportedDetermination ? `The supported determination is: ${supportedDetermination}. You must return that exact supportedDetermination.` : 'This case has no calibrated supported determination.',
    'Write like a calm manager building on what the learner did: say whether they were right or not, what evidence they used well, and what they should look at next time.',
    'Do not say fraud occurred unless the supported determination and evidence indicate fraud. If the supported determination is "Do Not Support Customer Claim", explain that the evidence does not support the claim.',
    'Use only the record IDs supplied in evidenceRecords or learnerSubmission. Do not invent record IDs, tools, people, merchants, documents, or facts.',
  ].join('\n');

  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(coachingPayload) }] },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'luna_manager_debrief',
          strict: true,
          schema: lunaDebriefSchema(),
        },
      },
    }),
  });

  const data = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    return json(502, { error: 'Luna AI coaching failed.' });
  }

  let debrief;
  try {
    debrief = parseStructuredOutput(data);
  } catch {
    return json(502, { error: 'Luna AI coaching could not be parsed.' });
  }

  const validatedDebrief = validateDebrief({
    debrief,
    allowedOutcome,
    supportedDetermination,
    allowedEvidenceIds,
  });

  if (!validatedDebrief) {
    return json(502, { error: 'Luna AI coaching could not be validated.' });
  }

  return json(200, { debrief: validatedDebrief });
}

function validateDebrief({ debrief, allowedOutcome, supportedDetermination, allowedEvidenceIds }) {
  if (!debrief || debrief.outcome !== allowedOutcome) return null;
  if (supportedDetermination && debrief.supportedDetermination !== supportedDetermination) return null;

  return {
    ...debrief,
    outcomeLabel: String(debrief.outcomeLabel || '').trim(),
    managerHeading: String(debrief.managerHeading || '').trim(),
    managerMessage: String(debrief.managerMessage || '').trim(),
    managerTip: String(debrief.managerTip || '').trim(),
    strengths: cleanList(debrief.strengths).slice(0, 3),
    improvements: cleanList(debrief.improvements).slice(0, 3),
    citedEvidenceIds: cleanList(debrief.citedEvidenceIds).filter((id) => allowedEvidenceIds.has(id)).slice(0, 8),
    supportedDetermination,
  };
}

function parseStructuredOutput(data) {
  if (data.output_text) return JSON.parse(data.output_text);
  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    ?.find((item) => item.type === 'output_text')?.text;
  return text ? JSON.parse(text) : null;
}

function prunePayload(payload) {
  return {
    case: payload.case,
    learnerSubmission: payload.learnerSubmission,
    deterministicDebrief: payload.deterministicDebrief,
    evidenceRecords: (payload.evidenceRecords ?? []).slice(0, 80),
  };
}

function cleanList(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function lunaDebriefSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'outcome',
      'outcomeLabel',
      'supportedDetermination',
      'managerHeading',
      'managerMessage',
      'managerTip',
      'strengths',
      'improvements',
      'citedEvidenceIds',
    ],
    properties: {
      outcome: { type: 'string', enum: ['correct', 'incorrect', 'review'] },
      outcomeLabel: { type: 'string' },
      supportedDetermination: { type: 'string' },
      managerHeading: { type: 'string' },
      managerMessage: { type: 'string' },
      managerTip: { type: 'string' },
      strengths: {
        type: 'array',
        items: { type: 'string' },
      },
      improvements: {
        type: 'array',
        items: { type: 'string' },
      },
      citedEvidenceIds: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: responseHeaders,
    body: JSON.stringify(body),
  };
}
