import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const evidence = new URL('../test-results/browser/', import.meta.url);
await mkdir(evidence, { recursive: true });
const launchOptions = {
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
};
let child,
  browser,
  logs = '',
  completed = false;
const results = [];
async function isolatedContext(options) {
  const context = await browser.newContext(options);
  const allowed = new Set([origin, 'http://127.0.0.1:14480']);
  await context.route('**/*', (route) => {
    const target = new URL(route.request().url());
    return allowed.has(target.origin) ||
      ['data:', 'blob:'].includes(target.protocol)
      ? route.continue()
      : route.abort('blockedbyclient');
  });
  return context;
}

async function ready(url) {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error('Frontend exited: ' + logs);
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Frontend did not start: ' + logs);
}
async function verifyPage(page, label, { overflow = true } = {}) {
  await page.evaluate(() => document.fonts.ready);
  assert.equal(
    await page
      .locator('body')
      .innerText()
      .then((t) => t.trim().length > 0),
    true,
    label + ' has content',
  );
  if (overflow)
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      label + ' has no horizontal overflow',
    );
  await page.screenshot({
    path: new URL(label + '.png', evidence).pathname,
    fullPage: true,
    animations: 'disabled',
  });
}
import { api, state, requests } from '../tests/browser/fixture-api.mjs';
const origin = 'http://127.0.0.1:14482';
try {
  await new Promise((resolve, reject) => {
    api.once('error', reject);
    api.listen(14480, '127.0.0.1', resolve);
  });
  child = spawn(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'start',
      '--port',
      '14482',
      '--hostname',
      '127.0.0.1',
    ],
    {
      env: {
        ...process.env,
        API_INTERNAL_URL: 'http://127.0.0.1:14480',
        WEB_URL: origin,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (d) => (logs += d));
  child.stderr.on('data', (d) => (logs += d));
  await ready(origin + '/login');
  browser = await chromium.launch(launchOptions);
  const templates = [
    'classic',
    'list',
    'gallery',
    'menu',
    'floating',
    'centered',
    'compact',
    'editorial',
    'ember',
    'bloom',
    'brew',
  ];
  const scenarios = [
    ...templates.map((t) => ({
      path: '/q/pilot?lang=en&template=' + t,
      width: 390,
    })),
    ...['verde', 'sherbiny', 'makkboz', 'meat'].map((c) => ({
      path: '/q/' + c + '?lang=en',
      width: 390,
    })),
    { path: '/q/pilot?lang=ar', width: 390, rtl: true },
    { path: '/q/pilot?lang=en', width: 1440 },
    { path: '/q/missing?lang=en', width: 390 },
    { path: '/q/unavailable?lang=ar', width: 390 },
    ...['/login', '/forgot-password', '/reset-password', '/staff'].map(
      (path) => ({ path, width: 390 }),
    ),
  ];
  for (const [i, s] of scenarios.entries()) {
    const context = await isolatedContext({
      viewport: { width: s.width, height: 900 },
      reducedMotion: 'reduce',
    });
    await context.addCookies([
      { name: 'staff_ui_locale', value: 'en', url: origin },
    ]);
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin + s.path, { waitUntil: 'networkidle' });
    await verifyPage(page, 'route-' + i);
    if (s.rtl)
      assert.equal((await page.locator('[dir="rtl"]').count()) > 0, true);
    assert.deepEqual(errors, []);
    results.push({ scenario: s.path, status: 'PASS' });
    await context.close();
  }
  // A failed order preserves the cart, and retry reuses its idempotency identity.
  const context = await isolatedContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin + '/q/table?lang=en', { waitUntil: 'networkidle' });
  await page
    .getByRole('button', { name: 'Add Pizza Margherita', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: /View order,/ }).click();
  state.orderMode = 'network';
  requests.length = 0;
  const send = page.getByRole('button', { name: /^Send order/ });
  await send.evaluate((button) => {
    button.click();
    button.click();
  });
  await page.waitForFunction(
    () =>
      document.body.innerText.includes('try again') ||
      document.body.innerText.includes('Try again'),
  );
  assert.equal(requests.length, 1, 'rapid repeated clicks produce one request');
  assert.match(await page.locator('body').innerText(), /Pizza Margherita/);
  state.orderMode = 'success';
  await send.click();
  await page.waitForFunction(() =>
    /received|sent|pending|placed/i.test(document.body.innerText),
  );
  assert.equal(requests.length, 2);
  assert.deepEqual(
    requests[1].body,
    requests[0].body,
    'retry preserves payload and request identity',
  );
  await verifyPage(page, 'order-retry');
  assert.deepEqual(errors, []);
  results.push({
    scenario:
      'duplicate submit, failure, cart preservation, retry identity, acknowledgement',
    status: 'PASS',
  });
  await context.close();
  // A changed price is shown for review; it never silently submits a new total.
  const priceContext = await isolatedContext({
      viewport: { width: 390, height: 900 },
      reducedMotion: 'reduce',
    }),
    pricePage = await priceContext.newPage();
  await pricePage.goto(origin + '/q/table?lang=en', {
    waitUntil: 'networkidle',
  });
  await pricePage
    .getByRole('button', { name: 'Add Pizza Margherita', exact: true })
    .first()
    .click();
  await pricePage.getByRole('button', { name: /View order,/ }).click();
  state.orderMode = 'price';
  requests.length = 0;
  await pricePage.getByRole('button', { name: /^Send order/ }).click();
  await pricePage.getByText(/Prices changed while you were ordering/).waitFor();
  await pricePage.waitForFunction(() =>
    document.body.innerText.includes('110'),
  );
  assert.equal(requests.length, 1);
  state.orderMode = 'success';
  state.price = '100.00';
  results.push({
    scenario:
      'price-change refusal preserves cart and refreshes prices for review',
    status: 'PASS',
  });
  await priceContext.close();
  // Generic QR: invalid fields are focused; an API failure retains typed checkout values.
  const pickup = await isolatedContext({
      viewport: { width: 390, height: 900 },
      reducedMotion: 'reduce',
    }),
    p = await pickup.newPage();
  await p.goto(origin + '/q/pilot?lang=en', { waitUntil: 'networkidle' });
  await p
    .getByRole('button', { name: 'Add Pizza Margherita', exact: true })
    .first()
    .click();
  await p.getByRole('button', { name: /View order,/ }).click();
  requests.length = 0;
  await p.getByRole('button', { name: /^Send order/ }).click();
  assert.equal(requests.length, 0);
  await p.waitForFunction(
    () => document.activeElement?.id === 'checkout-customerName',
  );
  await p.locator('#checkout-customerName').fill('Test Guest');
  await p.locator('#checkout-customerPhone').fill('01012345678');
  state.orderMode = 'network';
  await p.getByRole('button', { name: /^Send order/ }).click();
  await p.waitForFunction(
    () =>
      document.body.innerText.includes('try again') ||
      document.body.innerText.includes('Try again'),
  );
  assert.equal(
    await p.locator('#checkout-customerName').inputValue(),
    'Test Guest',
  );
  assert.equal(
    await p.locator('#checkout-customerPhone').inputValue(),
    '01012345678',
  );
  results.push({
    scenario: 'checkout validation, focus, failed-request input preservation',
    status: 'PASS',
  });
  await pickup.close();
  completed = true;
} finally {
  await browser?.close();
  child?.kill('SIGTERM');
  api.closeAllConnections();
  await new Promise((resolve) => api.close(resolve));
  await writeFile(new URL('server.log', evidence), logs);
  await writeFile(
    new URL('results.json', evidence),
    JSON.stringify(
      { status: completed ? 'PASS' : 'FAIL', scenarios: results },
      null,
      2,
    ),
  );
}
console.log('PASS', results.length, 'frontend browser scenarios');
