import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('routes stay thin, domains expose public capabilities and runtime graphs preserve server boundaries', () => {
  const script = fileURLToPath(new URL('../scripts/check-architecture.mjs', import.meta.url));
  assert.match(execFileSync(process.execPath, [script], { encoding: 'utf8' }), /Architecture PASS/);
});
