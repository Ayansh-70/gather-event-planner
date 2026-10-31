import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { generate, validateAIInput } from './ai.js';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'X-Frame-Options': 'DENY'
};
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
function sameSecret(a, b) { const first = Buffer.from(a), second = Buffer.from(b); return first.length === second.length && timingSafeEqual(first, second); }
async function readJSON(req) {
  let size = 0, chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 16000) { const error = new Error('Request exceeds 16 KB.'); error.status = 413; throw error; } chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new Error('Send valid JSON.'); }
}
export function createApp(config = {}) {
  const apiKey = config.apiKey ?? process.env.GEMINI_API_KEY ?? '';
  const origin = config.origin ?? process.env.APP_ORIGIN ?? '';
  const accessCode = config.accessCode ?? process.env.AI_ACCESS_CODE ?? '';
  const buckets = new Map();
  let day = '', dailyCount = 0, inFlight = 0;
  const server = http.createServer(async (req, res) => {
    Object.entries(securityHeaders).forEach(([k,v]) => res.setHeader(k,v));
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return json(200, { ok: true, aiConfigured: Boolean(apiKey), accessCodeRequired: Boolean(accessCode) });
      if (url.pathname === '/api/assist') {
        if (req.method !== 'POST') return json(405, { error: 'Use POST.' });
        const allowedOrigin = origin || `http://${req.headers.host}`;
        if (req.headers.origin !== allowedOrigin || req.headers['sec-fetch-site'] === 'cross-site') return json(403, { error: 'This request origin is not allowed.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(415, { error: 'Send application/json.' });
        if (accessCode && !sameSecret(req.headers['x-ai-access-code'] || '', accessCode)) return json(401, { error: 'Enter the AI access code configured by this app’s owner.' });
        const now = Date.now(), ip = req.socket.remoteAddress; // Never trust spoofable forwarding headers.
        for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
        const bucket = buckets.get(ip) || { count: 0, until: now + 60000 };
        if (bucket.count >= 8 || buckets.size > 10000) { res.setHeader('Retry-After', '60'); return json(429, { error: 'Too many requests. Please wait a minute.' }); }
        bucket.count++; buckets.set(ip, bucket);
        const input = validateAIInput(await readJSON(req));
        const currentDay = new Date().toISOString().slice(0,10);
        if (day !== currentDay) { day = currentDay; dailyCount = 0; }
        if (apiKey && (dailyCount >= 200 || inFlight >= 4)) return json(429, { error: 'The AI usage limit has been reached. The local planner is still available.' });
        if (apiKey) dailyCount++;
        inFlight++;
        try { return json(200, await generate(input, { apiKey, model: config.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash', fetchImpl: config.fetchImpl })); }
        catch { return json(502, { error: 'Gemini could not complete this request. Try again, or switch to the planning guide.' }); }
        finally { inFlight--; }
      }
      if (url.pathname.startsWith('/api/')) return json(404, { error: 'API route not found.' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(405, { error: 'Method not allowed.' });
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { return json(400, { error: 'Invalid path.' }); }
      const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || !types[extname(file)]) return json(404, { error: 'Not found.' });
      try {
        const content = await readFile(file);
        res.writeHead(200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-cache' });
        res.end(req.method === 'HEAD' ? undefined : content);
      } catch { return json(404, { error: 'Not found.' }); }
    } catch (error) { json(error.status || 400, { error: error.status === 413 ? error.message : 'Invalid request. Check your event details and try again.' }); }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createApp();
  server.listen(port, '0.0.0.0', () => console.log(`Gather is ready at http://localhost:${port}`));
}
