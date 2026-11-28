import test from "node:test";
import assert from "node:assert/strict";
import { localDateTimeToIso } from "../scripts/schedule-policy.mjs";

test("local schedule conversion does not reinterpret four-digit years 0000–0099 as 1900–1999", () => {
  assert.equal(localDateTimeToIso("0099-01-02", "17:00", "UTC"), "0099-01-02T17:00:00.000Z");
  assert.equal(localDateTimeToIso("0001-12-31", "00:15", "UTC"), "0001-12-31T00:15:00.000Z");
});

test("local schedule conversion still rejects impossible early-year calendar dates", () => {
  assert.throws(() => localDateTimeToIso("0099-02-29", "17:00", "UTC"), /real calendar date/);
});
