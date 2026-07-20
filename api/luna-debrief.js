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
    score: Number(deterministic.score || 0),
    strengths: cleanList(deterministic.strengths),
    followUps: cleanList(deterministic.followUps),
    completedTools: cleanList(body.packageFacts?.completedTools),
    pinnedEvidence: cleanList(body.packageFacts?.pinnedEvidence),
    noteSnapshot: cleanList(body.packageFacts?.noteSnapshot),
  };

  const instructions = [
    'You are Luna, a senior fraud-investigation coach inside a training app.',
    'The deterministic result supplied by the application is authoritative.',
    'Never reverse, reinterpret, or override determinationMatched, expectedDetermination, acceptedDeterminations, classification, or score.',
    'In particular, Do Not Support means the evidence does not support the customer fraud claim. Never describe that choice as fraud confirmed.',
    'Do not reveal hidden truth before submission. This endpoint is called only after submission.',
    'Coach the learner using only the supplied package facts. Do not invent evidence.',
    'Return concise JSON only with coachIntro, strengths, and followUps.',
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
            name: 'luna_debrief',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                coachIntro: { type: 'string' },
                strengths: { type: 'array', items: { type: 'string' }, maxItems: 6 },
                followUps: { type: 'array', items: { type: 'string' }, maxItems: 6 },
              },
              required: ['coachIntro', 'strengths', 'followUps'],
            },
          },
        },
      }),
    });

    if (!apiResponse.ok) {
      const details = await apiResponse.text();
      console.error('OpenAI Luna request failed', apiResponse.status, details.slice(0, 1000));
      return send(res, 502, { error: 'Luna coaching service failed' });
    }

    const result = await apiResponse.json();
    const outputText = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    const coaching = JSON.parse(outputText || '{}');
    return send(res, 200, {
      coachIntro: String(coaching.coachIntro || ''),
      strengths: cleanList(coaching.strengths, guardedFacts.strengths),
      followUps: cleanList(coaching.followUps, guardedFacts.followUps),
      source: 'api',
    });
  } catch (error) {
    console.error('Luna debrief error', error);
    return send(res, 500, { error: 'Unable to generate Luna coaching' });
  }
}
