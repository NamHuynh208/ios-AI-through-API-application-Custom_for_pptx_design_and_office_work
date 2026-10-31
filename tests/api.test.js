import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEndpoint, parseProposal, chat, listModels, redact } from '../src/api.js';
import { savePreferences, loadPreferences, saveHistory, loadHistory } from '../src/storage.js';

test('API HTTPS normalization and unsafe URLs', () => {
  assert.equal(normalizeEndpoint('https://example.com'), 'https://example.com/v1');
  assert.equal(normalizeEndpoint('https://example.com/v1/chat/completions/'), 'https://example.com/v1');
  assert.equal(normalizeEndpoint('https://example.com/custom/v1'), 'https://example.com/custom/v1');
  for (const u of ['http://example.com', 'https://key@example.com', 'https://example.com/?key=a', 'javascript:test']) assert.throws(() => normalizeEndpoint(u));
});
test('API request boundaries, no credentials in body and no redirect', async () => {
  const key = 'fake_qa_key_only', c = { endpoint: 'https://example.com/v1', key, model: 'qa' };
  let request;
  const fetcher = async (url, opts) => { request = { url, ...opts }; return new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] })); };
  assert.equal(await chat(c, [{ role: 'user', content: 'Hi' }], null, fetcher), 'OK');
  assert.equal(request.redirect, 'error'); assert.equal(request.credentials, 'omit'); assert.equal(request.cache, 'no-store');
  assert.ok(!request.body.includes(key)); assert.equal(request.headers.Authorization, `Bearer ${key}`);
});
test('HTTP errors, invalid JSON, network and abort handled', async () => {
  const c = { endpoint: 'https://example.com/v1', key: 'qa_key', model: 'qa' };
  await assert.rejects(() => chat(c, [], null, async () => new Response('{}', { status: 401 })), /Khoá API/);
  await assert.rejects(() => chat(c, [], null, async () => new Response('not json')), /JSON/);
  await assert.rejects(() => chat(c, [], null, async () => { throw new TypeError('failed'); }), /CORS/);
  const controller = new AbortController(); controller.abort(); let sent = false;
  await assert.rejects(() => chat(c, [], controller.signal, async () => { sent = true; }), { name: 'AbortError' }); assert.equal(sent, false);
});
test('Model list/proposal schema and code not executed', async () => {
  const c = { endpoint: 'https://example.com', key: 'qa' };
  assert.deepEqual(await listModels(c, null, async () => new Response('{"data":[{"id":"qa"}]}')), ['qa']);
  assert.deepEqual(parseProposal('```json\n{"summary":"x","changes":[]}\n```'), { summary: 'x', changes: [] });
  assert.throws(() => parseProposal('alert(1)')); assert.throws(() => parseProposal('{"summary":"x"}'));
  assert.equal(redact('Error secret', 'secret'), 'Error [đã che khoá]');
});
function memoryStore() { const values = new Map(); return { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k), values }; }
test('Preferences never persist API key even when supplied', () => {
  const s = memoryStore(); savePreferences({ endpoint: 'https://example.com', model: 'qa', key: 'DO_NOT_PERSIST', theme: 'dark' }, s);
  assert.ok(!JSON.stringify([...s.values]).includes('DO_NOT_PERSIST'));
  assert.equal(loadPreferences(s).key, undefined); assert.equal(loadPreferences(s).theme, 'dark');
});
test('History opt-in, schema guards and bound', () => {
  const s = memoryStore(), messages = Array.from({ length: 100 }, () => ({ role: 'user', content: 'QA' }));
  saveHistory(messages, false, s); assert.deepEqual(loadHistory(false, s), []);
  saveHistory(messages, true, s); assert.equal(loadHistory(true, s).length, 30);
  saveHistory(messages, false, s); assert.equal(s.values.size, 0);
  s.setItem('agenty-mobile-chat-v1', '{}'); assert.deepEqual(loadHistory(true, s), []);
});
