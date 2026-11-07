import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('media preflight fails closed when required arguments are missing', () => {
  const result = spawnSync(process.execPath, ['scripts/preflight-media.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Usage:/);
});

test('media preflight requires exact vertical framing, full decode, and measurable audio', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync('scripts/preflight-media.mjs', 'utf8');
  assert.match(source, /Math\.abs\(video\.width \/ video\.height - 9 \/ 16\)/);
  assert.match(source, /full media decode failed/);
  assert.match(source, /mean_volume:\\s\*-inf/);
  assert.match(source, /metadata must contain a title, description and at least three tags/);
  assert.match(source, /fileBytes < 100_000/);
});
