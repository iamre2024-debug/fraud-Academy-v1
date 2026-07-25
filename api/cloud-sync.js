import { createHmac } from 'node:crypto';

const MAX_BODY_BYTES = 4_500_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const requestWindows = new Map();

const compareAndSetScript = `
local currentRevision = redis.call('HGET', KEYS[1], 'revision')
local normalizedRevision = currentRevision or '0'
if normalizedRevision ~= ARGV[1] then
  return {0, normalizedRevision, redis.call('HGET', KEYS[1], 'payload') or ''}
end
redis.call('HSET', KEYS[1], 'revision', ARGV[2], 'payload', ARGV[3], 'updatedAt', ARGV[4])
return {1, ARGV[2]}
`;

function configuredOrigins() {
  return String(process.env.CLOUD_SYNC_ALLOWED_ORIGIN || '')
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Fraud-Academy-Sync-Id');
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

function hasCloudConfiguration() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL
      && process.env.UPSTASH_REDIS_REST_TOKEN
      && String(process.env.CLOUD_SYNC_HMAC_SECRET || '').length >= 32,
  );
}

function cleanSyncIdentifier(req) {
  return String(req.headers?.['x-fraud-academy-sync-id'] || '').trim().toLowerCase();
}

function redisStorageKey(syncIdentifier) {
  const digest = createHmac('sha256', process.env.CLOUD_SYNC_HMAC_SECRET)
    .update(syncIdentifier)
    .digest('hex');
  return `fraud-academy:cloud:v1:${digest}`;
}

async function redisCommand(command) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error('Cloud storage request failed.');
  return body.result;
}

function hashFields(values) {
  const fields = {};
  if (!Array.isArray(values)) return fields;
  for (let index = 0; index < values.length; index += 2) {
    fields[String(values[index])] = values[index + 1];
  }
  return fields;
}

function parsePayload(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const origin = String(req.headers?.origin || '');
  if (origin && !allowedCorsOrigin(req)) return send(req, res, 403, { error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return send(req, res, 204, {});
  if (!['GET', 'PUT'].includes(req.method)) return send(req, res, 405, { error: 'Method not allowed' });
  if (exceedsRateLimit(req, res)) {
    res.setHeader('Retry-After', '60');
    return send(req, res, 429, { error: 'Too many cloud sync requests. Try again in one minute.' });
  }
  if (!hasCloudConfiguration()) {
    return send(req, res, 503, { error: 'Cloud saving is not configured' });
  }

  const syncIdentifier = cleanSyncIdentifier(req);
  if (!/^[a-f0-9]{64}$/.test(syncIdentifier)) {
    return send(req, res, 401, { error: 'A valid cloud sync identifier is required' });
  }
  const storageKey = redisStorageKey(syncIdentifier);

  try {
    if (req.method === 'GET') {
      const fields = hashFields(await redisCommand(['HGETALL', storageKey]));
      return send(req, res, 200, {
        revision: Number(fields.revision) || 0,
        payload: parsePayload(fields.payload),
        updatedAt: fields.updatedAt || null,
      });
    }

    if (Number(req.headers?.['content-length'] || 0) > MAX_BODY_BYTES) {
      return send(req, res, 413, { error: 'Cloud recovery payload is too large' });
    }
    const body = req.body || {};
    const baseRevision = Number(body.baseRevision);
    const payload = body.payload;
    if (!Number.isInteger(baseRevision) || baseRevision < 0 || !payload || typeof payload !== 'object') {
      return send(req, res, 400, { error: 'Invalid cloud recovery payload' });
    }
    if (payload.version !== 1 || payload.algorithm !== 'AES-GCM' || typeof payload.ciphertext !== 'string') {
      return send(req, res, 400, { error: 'Unsupported cloud recovery payload' });
    }

    const payloadJson = JSON.stringify(payload);
    if (Buffer.byteLength(payloadJson, 'utf8') > MAX_BODY_BYTES) {
      return send(req, res, 413, { error: 'Cloud recovery payload is too large' });
    }

    const nextRevision = baseRevision + 1;
    const updatedAt = new Date().toISOString();
    const result = await redisCommand([
      'EVAL',
      compareAndSetScript,
      '1',
      storageKey,
      String(baseRevision),
      String(nextRevision),
      payloadJson,
      updatedAt,
    ]);

    if (!Array.isArray(result) || Number(result[0]) !== 1) {
      return send(req, res, 409, {
        error: 'Cloud recovery changed on another device',
        revision: Number(result?.[1]) || 0,
        payload: parsePayload(result?.[2]),
      });
    }

    return send(req, res, 200, { revision: nextRevision, updatedAt });
  } catch {
    return send(req, res, 502, { error: 'Cloud storage is temporarily unavailable' });
  }
}
