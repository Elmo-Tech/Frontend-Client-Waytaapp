import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExclusiveTask,
  createRequestSequence,
} from '../../src/lib/utils/async-control.ts';
import { clientErrorMetadata } from '../../src/lib/utils/client-errors.ts';
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
test('duplicate actions are blocked while validation or the request is pending', async () => {
  const gate = createExclusiveTask(),
    validation = deferred();
  let requests = 0;
  const first = gate.run(async () => {
    await validation.promise;
    requests++;
    return 'saved';
  });
  assert.equal(gate.busy, true);
  assert.equal(
    await gate.run(async () => {
      requests++;
    }),
    undefined,
  );
  validation.resolve();
  assert.equal(await first, 'saved');
  assert.equal(requests, 1);
  assert.equal(gate.busy, false);
  await gate.run(async () => {
    requests++;
  });
  assert.equal(requests, 2);
});
test('a thrown request releases the lock so a retry can run', async () => {
  const gate = createExclusiveTask();
  await assert.rejects(
    gate.run(async () => {
      throw new Error('offline');
    }),
    /offline/,
  );
  assert.equal(await gate.run(async () => 'recovered'), 'recovered');
});
test('superseded and unmounted reads cannot commit data', async () => {
  const reads = createRequestSequence(),
    slow = deferred();
  let shown = 'initial';
  const first = reads.next();
  const old = slow.promise.then(() => {
    if (first()) shown = 'old';
  });
  const latest = reads.next();
  if (latest()) shown = 'new';
  slow.resolve();
  await old;
  assert.equal(shown, 'new');
  reads.invalidate();
  assert.equal(latest(), false);
});
test('error diagnostics omit credentials, messages and arbitrary payloads', () => {
  const error = Object.assign(new Error('secret form value'), {
    digest: 'safe-digest',
    token: 'secret',
  });
  assert.deepEqual(clientErrorMetadata(error, 'boundary'), {
    source: 'boundary',
    name: 'Error',
    digest: 'safe-digest',
  });
  assert.deepEqual(clientErrorMetadata({ password: 'secret' }, 'error'), {
    source: 'error',
    name: 'UnknownError',
  });
});
