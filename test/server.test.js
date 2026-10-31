import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/index.js';
import { generate, validateAIInput } from '../server/ai.js';
const profile = {
  name: 'Test',
  type: 'birthday',
  location: 'Delhi',
  date: '2027-02-20',
  budget: 50000,
  guests: 25,
  currency: 'INR',
  preferences: 'No nuts',
  outdoor: false,
};
const payload = {
  action: 'advice',
  question: 'Help with costs',
  profile,
  budget: [{ name: 'Food', planned: 5000, actual: 1000 }],
};
async function serve(t, config = {}) {
  const server = createApp({ apiKey: '', ...config });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}
const post = (url, body = payload, headers = {}) =>
  fetch(`${url}/api/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
    body: JSON.stringify(body),
  });
test('health reflects configuration without leaking secrets', async (t) => {
  const url = await serve(t, { apiKey: 'secret', accessCode: 'private' });
  const r = await fetch(`${url}/api/health`);
  assert.deepEqual(await r.json(), { ok: true, aiConfigured: true, accessCodeRequired: true });
});
test('static app has security headers and backend files are inaccessible', async (t) => {
  const url = await serve(t);
  const r = await fetch(url);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  assert.match(await r.text(), /Gather/);
  for (const path of ['/.env', '/server/index.js', '/package.json', '/%2e%2e%5cserver%5cindex.js'])
    assert.equal((await fetch(url + path)).status, 404);
});
test('cross-origin requests, invalid JSON types and wrong HTTP methods are rejected', async (t) => {
  const url = await serve(t);
  assert.equal((await post(url, payload, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(url, payload, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetch(`${url}/api/assist`)).status, 405);
});
test('optional access code protects paid AI endpoint', async (t) => {
  const url = await serve(t, { accessCode: 'owner-code' });
  assert.equal((await post(url)).status, 401);
  assert.equal((await post(url, payload, { 'X-AI-Access-Code': 'owner-code' })).status, 200);
});
test('offline endpoint returns labeled useful guidance', async (t) => {
  const url = await serve(t);
  const r = await post(url);
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.equal(body.mode, 'offline');
  assert.match(body.reply, /25 guests/);
});
test('invalid event context and oversized requests are rejected', async (t) => {
  const url = await serve(t);
  assert.equal((await post(url, { ...payload, profile: { ...profile, guests: -1 } })).status, 400);
  assert.equal((await post(url, { ...payload, question: 'x'.repeat(17000) })).status, 413);
});
test('rate limiting prevents repeated calls and includes retry guidance', async (t) => {
  const url = await serve(t);
  for (let i = 0; i < 8; i++) assert.equal((await post(url)).status, 200);
  const r = await post(url);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '60');
});
test('configured deployment origin is enforced', async (t) => {
  const url = await serve(t, { origin: 'https://gather.example' });
  assert.equal((await post(url)).status, 403);
  assert.equal((await post(url, payload, { Origin: 'https://gather.example' })).status, 200);
});
test('AI input boundary strips unexpected fields and bounds user input', () => {
  const input = validateAIInput({ ...payload, vendorContacts: 'private' });
  assert.equal(input.vendorContacts, undefined);
  assert.throws(() => validateAIInput({ ...payload, question: 'a'.repeat(1501) }));
});
test('Gemini integration sends a server-only key and receives model text', async () => {
  const result = await generate(payload, {
    apiKey: 'test-key',
    fetchImpl: async (url, options) => {
      assert.match(url, /generativelanguage.googleapis.com/);
      assert.equal(options.headers['x-goog-api-key'], 'test-key');
      assert.ok(JSON.parse(options.body).systemInstruction);
      assert.ok(options.signal);
      return Response.json({
        candidates: [
          { content: { parts: [{ text: 'Compare two caterers and protect your contingency.' }] } },
        ],
      });
    },
  });
  assert.equal(result.mode, 'gemini');
  assert.match(result.reply, /caterers/);
});
test('structured idea output is validated before returning to the browser', async () => {
  const idea = {
    title: 'Memory wall',
    description: 'Invite guests to share memories.',
    category: 'Connection',
    cost: 'Estimated cap: INR 500',
  };
  const fake = (ideas) => async () =>
    Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ ideas }) }] } }] });
  const valid = await generate(
    { ...payload, action: 'ideas' },
    { apiKey: 'test', fetchImpl: fake([idea, idea, idea]) },
  );
  assert.equal(valid.ideas.length, 3);
  assert.equal(valid.ideas[0].source, 'Gemini');
  await assert.rejects(
    generate({ ...payload, action: 'ideas' }, { apiKey: 'test', fetchImpl: fake([{}]) }),
  );
});
test('provider errors and blocked replies fail honestly without exposing key or provider body', async (t) => {
  const url = await serve(t, {
    apiKey: 'never-expose-me',
    fetchImpl: async () => new Response('secret provider error', { status: 429 }),
  });
  const r = await post(url);
  assert.equal(r.status, 502);
  const text = await r.text();
  assert.doesNotMatch(text, /never-expose-me|secret provider/);
  await assert.rejects(
    generate(payload, { apiKey: 'test', fetchImpl: async () => Response.json({ candidates: [] }) }),
  );
});
