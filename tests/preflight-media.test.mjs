import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('media preflight fails closed when required arguments are missing', () => {
  const result = spawnSync(process.execPath, ['scripts/preflight-media.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
});
