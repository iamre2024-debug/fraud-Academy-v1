import handler from '../api/luna-debrief.js';

function responseRecorder() {
  return {
    headers: {},
    statusCode: 0,
    body: '',
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = String(value);
    },
    end(body = '') {
      this.body = body;
    },
  };
}

async function request({
  method = 'POST',
  origin = 'https://academy.example',
  host = 'academy.example',
  forwardedHost = host,
  ip = '192.0.2.10',
  accessToken = '',
  body = {},
  headers = {},
} = {}) {
  const req = {
    method,
    body,
    headers: {
      origin,
      host,
      'x-forwarded-host': forwardedHost,
      'x-forwarded-proto': 'https',
      'x-forwarded-for': ip,
      'x-luna-access-token': accessToken,
      ...headers,
    },
    socket: { remoteAddress: ip },
  };
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

const previousApiKey = process.env.OPENAI_API_KEY;
const previousAccessToken = process.env.LUNA_API_ACCESS_TOKEN;
const testAccessToken = 'test-private-luna-access-token-12345';
delete process.env.OPENAI_API_KEY;
process.env.LUNA_API_ACCESS_TOKEN = testAccessToken;

try {
  const blockedOrigin = await request({ origin: 'https://untrusted.example', ip: '192.0.2.20' });
  if (blockedOrigin.statusCode !== 403) throw new Error(`cross-origin request returned ${blockedOrigin.statusCode}, expected 403`);
  if (blockedOrigin.headers['access-control-allow-origin']) throw new Error('blocked origin received an allow-origin header');

  const oversized = await request({ headers: { 'content-length': '50001' }, ip: '192.0.2.21' });
  if (oversized.statusCode !== 413) throw new Error(`oversized request returned ${oversized.statusCode}, expected 413`);

  const understated = await request({
    body: { text: 'x'.repeat(50_100) },
    headers: { 'content-length': '10' },
    ip: '192.0.2.26',
  });
  if (understated.statusCode !== 413) throw new Error(`understated request returned ${understated.statusCode}, expected 413`);

  const spoofedForwardedHost = await request({
    origin: 'https://untrusted.example',
    host: 'academy.example',
    forwardedHost: 'untrusted.example',
    ip: '192.0.2.27',
  });
  if (spoofedForwardedHost.statusCode !== 403) throw new Error('x-forwarded-host bypassed the same-origin check');

  const wrongMethod = await request({ method: 'GET', ip: '192.0.2.22' });
  if (wrongMethod.statusCode !== 405) throw new Error(`GET request returned ${wrongMethod.statusCode}, expected 405`);

  const unauthenticated = await request({ ip: '192.0.2.24' });
  if (unauthenticated.statusCode !== 401) throw new Error(`unauthenticated request returned ${unauthenticated.statusCode}, expected 401`);

  const authenticated = await request({ ip: '192.0.2.25', accessToken: testAccessToken });
  if (authenticated.statusCode !== 503) throw new Error(`authenticated request without an API key returned ${authenticated.statusCode}, expected 503`);

  process.env.LUNA_API_ACCESS_TOKEN = 'é'.repeat(24);
  const unequalUtf8Token = await request({ ip: '192.0.2.28', accessToken: 'a'.repeat(24) });
  if (unequalUtf8Token.statusCode !== 401) throw new Error(`unequal UTF-8 token returned ${unequalUtf8Token.statusCode}, expected 401`);
  process.env.LUNA_API_ACCESS_TOKEN = testAccessToken;

  let limited;
  for (let index = 0; index < 11; index += 1) {
    limited = await request({ ip: `198.51.100.${index}, 192.0.2.23`, accessToken: testAccessToken });
  }
  if (limited.statusCode !== 429) throw new Error(`eleventh request returned ${limited.statusCode}, expected 429`);
  if (limited.headers['retry-after'] !== '60') throw new Error('rate-limited response is missing Retry-After');

  console.log('Luna API security smoke check passed. Same-origin policy, request-size limits, method guards, no-store responses, and rate limiting are active.');
} finally {
  if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previousApiKey;
  if (previousAccessToken === undefined) delete process.env.LUNA_API_ACCESS_TOKEN;
  else process.env.LUNA_API_ACCESS_TOKEN = previousAccessToken;
}
