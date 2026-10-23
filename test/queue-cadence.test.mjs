import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const queue = JSON.parse(fs.readFileSync("content/queue.json", "utf8"));

test("SonicVhibez weekly target remains two long-form videos and one Short", () => {
  assert.equal(queue.publishingEnabled, false, "public publishing must remain disabled");
  assert.equal(queue.cadence.postsPerWeek, 3);
  assert.deepEqual(queue.cadence.days, ["Tuesday", "Thursday", "Saturday"]);
  assert.equal(queue.cadence.timezone, "Africa/Johannesburg");
  assert.equal(queue.cadence.breakdown.longForm, 2);
  assert.equal(queue.cadence.breakdown.short, 1);

  const longForm = queue.items.filter((item) => item.contentType === "long_form");
  const shorts = queue.items.filter((item) => item.contentType === "short");
  assert.ok(longForm.length >= 2, "queue needs at least two long-form drafts");
  assert.ok(shorts.length >= 1, "queue needs at least one Short draft");
  assert.ok(longForm.some((item) => item.scheduledDay === "Tuesday"));
  assert.ok(longForm.some((item) => item.scheduledDay === "Saturday"));
  assert.ok(shorts.some((item) => item.scheduledDay === "Thursday"), "at least one Short draft must be assigned to Thursday");
  assert.ok(shorts.some((item) => item.scheduledDay === "Thursday" && item.targetSeconds === 55), "Thursday Short should target 55 seconds");
});

test("all queued items use only the approved Selar product URL", () => {
  for (const item of queue.items) {
    assert.equal(item.productUrl, "https://selar.com/0u19v8u99l", item.id);
  }
});
