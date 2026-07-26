import { timingSafeEqual } from 'node:crypto';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_BODY_BYTES = 50_000;
const requestWindows = new Map();

function configuredOrigins() {
  return String(process.env.LUNA_ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function requestOrigin(req) {
  const forwardedProtocol = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
  return host ? `${forwardedProtocol}://${host}` : '';
}

function allowedCorsOrigin(req) {
  const origin = String(req.headers?.origin || '');
  const allowed = configuredOrigins();
  if (!origin) return allowed[0] || requestOrigin(req);
  if (allowed.length) return allowed.includes(origin) ? origin : '';
  return origin === requestOrigin(req) ? origin : '';
}

function send(req, res, status, body) {
  const corsOrigin = allowedCorsOrigin(req);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Luna-Access-Token');
  res.end(JSON.stringify(body));
}

function requestIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function exceedsRateLimit(req, res) {
  const now = Date.now();
  const ip = requestIp(req);
  const current = requestWindows.get(ip);
  const windowState = !current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;
  windowState.count += 1;
  requestWindows.set(ip, windowState);

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - windowState.count);
  res.setHeader('RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil((windowState.startedAt + RATE_LIMIT_WINDOW_MS) / 1000)));
  return windowState.count > RATE_LIMIT_MAX_REQUESTS;
}

function cleanText(value, maximumLength) {
  return String(value || '').trim().slice(0, maximumLength);
}

function hasValidAccessToken(req) {
  const expected = String(process.env.LUNA_API_ACCESS_TOKEN || '');
  const supplied = String(req.headers?.['x-luna-access-token'] || '');
  if (expected.length < 24 || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

function cleanList(value, fallback = []) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').slice(0, 6).map((item) => item.slice(0, 500))
    : fallback;
}

function cleanDocumentAssessment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return {
    received: cleanText(value.received, 40),
    readability: cleanText(value.readability, 40),
    completeness: cleanText(value.completeness, 40),
    identityMatch: cleanText(value.identityMatch, 40),
    claimEffect: cleanText(value.claimEffect, 80),
    additionalEvidenceNeeded: cleanText(value.additionalEvidenceNeeded, 20),
    reasoning: cleanText(value.reasoning, 2000),
  };
}

export default async function handler(req, res) {
  const origin = String(req.headers?.origin || '');
  if (origin && !allowedCorsOrigin(req)) return send(req, res, 403, { error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return send(req, res, 204, {});
  if (req.method !== 'POST') return send(req, res, 405, { error: 'Method not allowed' });
  if (Number(req.headers?.['content-length'] || 0) > MAX_BODY_BYTES) {
    return send(req, res, 413, { error: 'Request body is too large' });
  }
  if (exceedsRateLimit(req, res)) {
    res.setHeader('Retry-After', '60');
    return send(req, res, 429, { error: 'Too many Luna requests. Try again in one minute.' });
  }
  if (!process.env.LUNA_API_ACCESS_TOKEN || String(process.env.LUNA_API_ACCESS_TOKEN).length < 24) {
    return send(req, res, 503, { error: 'Luna private access is not configured' });
  }
  if (!hasValidAccessToken(req)) return send(req, res, 401, { error: 'Luna private access is required' });
  if (!process.env.OPENAI_API_KEY) return send(req, res, 503, { error: 'Luna API is not configured' });

  const body = req.body || {};
  const deterministic = body.deterministicResult || {};
  const hasMatchField = Object.prototype.hasOwnProperty.call(deterministic, 'determinationMatched');
  const matchValueIsValid = deterministic.determinationMatched === true
    || deterministic.determinationMatched === false
    || deterministic.determinationMatched === null;

  if (!body.caseId || !body.submittedDecision || !hasMatchField || !matchValueIsValid) {
    return send(req, res, 400, { error: 'Missing guarded debrief inputs' });
  }

  const reviewStatus = deterministic.determinationMatched === true
    ? 'matched'
    : deterministic.determinationMatched === false
      ? 'mismatched'
      : 'ungraded';

  const guardedFacts = {
    caseId: cleanText(body.caseId, 100),
    caseType: cleanText(body.caseType, 200),
    allegation: cleanText(body.allegation, 1000),
    submittedDecision: cleanText(body.submittedDecision, 200),
    confidence: cleanText(body.confidence, 100),
    rationale: cleanText(body.rationale, 4000),
    reviewStatus,
    determinationMatched: deterministic.determinationMatched,
    evaluationBasis: cleanText(deterministic.evaluationBasis, 100) || 'ungraded',
    evaluationExplanation: cleanText(deterministic.evaluationExplanation, 1000),
    documentAssessmentLabel: cleanText(deterministic.documentAssessmentLabel, 300),
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
    documentAssessment: cleanDocumentAssessment(body.packageFacts?.documentAssessment),
  };

  const instructions = [
    'You are Luna, the fraud manager conducting a post-decision case review inside a training app.',
    'Speak like an experienced manager reviewing an investigator decision, not like a generic tutor or scorecard.',
    'The deterministic fields are authoritative. Never reverse or override reviewStatus, determinationMatched, expectedDetermination, acceptedDeterminations, classification, truthRationale, or score.',
    'When reviewStatus is matched and evaluationBasis is exact, say the investigator made the calibrated call.',
    'When evaluationBasis is semantic, explain that different wording reached the same lane outcome.',
    'When evaluationBasis is document-context, call the decision defensible from the saved document assessment; do not claim it matched the original answer key.',
    'When evaluationBasis is context-conflict, explain the conflict between the selected button and the saved document reasoning before suggesting a correction.',
    'When reviewStatus is mismatched for another reason, say the determination needs more support and explain why from the supplied facts.',
    'When reviewStatus is ungraded, never call the decision right, wrong, matched, mismatched, or in need of correction. State that the case has no hidden outcome and review only the investigation quality and reasoning.',
    'Explain what the submitted decision means. Do Not Support means the available evidence does not support the customer fraud claim; it never means fraud was confirmed.',
    'Explain what the case actually was only when classification or truthRationale is supplied. Do not invent a downstream outcome.',
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
      return send(req, res, 502, { error: 'Luna manager review failed' });
    }

    const result = await apiResponse.json();
    const outputText = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    const review = JSON.parse(outputText || '{}');
    return send(req, res, 200, {
      managerVerdict: String(review.managerVerdict || ''),
      decisionMeaning: String(review.decisionMeaning || ''),
      actualCaseOutcome: String(review.actualCaseOutcome || ''),
      managerExplanation: String(review.managerExplanation || ''),
      strengths: cleanList(review.strengths, guardedFacts.strengths),
      coachingActions: cleanList(review.coachingActions, guardedFacts.followUps),
      reviewStatus,
      source: 'api',
    });
  } catch (error) {
    console.error('Luna manager debrief error', error);
    return send(req, res, 500, { error: 'Unable to generate Luna manager review' });
  }
}
