import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Short and long-form renderers never loop a source clip to fake the target duration", () => {
  for (const file of ["scripts/render-short.mjs", "scripts/render-long-form.mjs"]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /-stream_loop/);
    assert.match(source, /-shortest/);
    assert.match(source, /validate-(?:short|long-form)-export\.mjs/);
  }
});
