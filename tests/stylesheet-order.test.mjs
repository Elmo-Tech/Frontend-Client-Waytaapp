import assert from 'node:assert/strict';
import { readFileSync as readFixture } from 'node:fs';
import { basename } from 'node:path';
import test from 'node:test';
import { readFileSync, legacySourceUrl } from './contracts/source-files.mjs';

const order = JSON.parse(readFixture(new URL('./contracts/stylesheet-order.json', import.meta.url), 'utf8'));

test('stylesheets preserve the original cascade import order', () => {
  for (const [source, expected] of Object.entries(order)) {
    const current = readFileSync(new URL(legacySourceUrl(source)), 'utf8');
    const imports = [...current.matchAll(/import[^;\n]*?['"]([^'"]+\.css)['"];?/g)].map(match => basename(match[1]));
    assert.deepEqual(imports, expected, source);
  }
});
