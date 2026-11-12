import { legacySourceUrl } from '../../../../tests/contracts/source-files.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from '../../../../tests/contracts/source-files.mjs';

const root = new URL('../../', legacySourceUrl("src/lib/public-menu/restaurant-routing.contract.test.mjs"));
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Next Proxy routes tenant root through established QR Guest page and isolates Staff', () => {
  const proxy = read('proxy.ts');
  assert.ok(proxy.includes("restaurantSlugFromHost(request.headers.get('host'), baseDomain)"));
  assert.ok(proxy.includes('rewritten.pathname = `/q/${slug}`'));
  assert.ok(proxy.includes('return NextResponse.rewrite(rewritten)'));
  assert.ok(proxy.includes('return NextResponse.redirect(apex)'));
  assert.ok(proxy.includes("pathname.startsWith('/api/v1/')"));
});

test('Browser Guest API is same-origin only for trusted tenant subdomains', () => {
  const api = read('lib/api/client.ts');
  assert.ok(api.includes('restaurantSlugFromHost(window.location.host, process.env.NEXT_PUBLIC_RESTAURANT_BASE_DOMAIN)'));
  assert.ok(api.includes('return `${window.location.origin}${API_BASE_PATH}`'));
  assert.ok(api.includes('return API_BASE_URL;'));
});

