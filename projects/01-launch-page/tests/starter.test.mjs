import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { server } from '../server.mjs';

let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('serves a semantic launch page', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /<main id="main">/);
  assert.match(html, /<form[^>]+id="signup-form"/);
  assert.match(html, /<section[^>]+id="benefits"/);
  assert.match(html, /<section[^>]+id="faq"/);
});

test('serves assets and rejects unknown paths', async () => {
  const [css, script, missing] = await Promise.all([
    fetch(`${baseUrl}/styles.css`),
    fetch(`${baseUrl}/app.js`),
    fetch(`${baseUrl}/private.txt`)
  ]);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /text\/css/);
  assert.equal(script.status, 200);
  assert.equal(missing.status, 404);
});

test('keeps the intended learner tasks visible', async () => {
  const script = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.ok((script.match(/TODO:/g) || []).length >= 3);
});
