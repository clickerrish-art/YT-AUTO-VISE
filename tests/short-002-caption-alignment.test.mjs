import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Short 002 narration master remains aligned with timed caption beats", () => {
  const script = fs.readFileSync("content/narration-master-short-001-and-002.md", "utf8").toLowerCase();
  const srt = fs.readFileSync("content/short-002-plan-wildlife-documentary.srt", "utf8").toLowerCase();
  const requiredBeats = [
    ["opening hook", "planning a wildlife documentary short"],
    ["three-step promise", "three simple steps"],
    ["one subject and question", "one subject"],
    ["behavior examples", "finds food"],
    ["story structure", "open with a hook"],
    ["faithful editing", "separate clips"],
    ["rights check", "check every asset"],
    ["supported claims", "every claim supported"],
    ["approved product call to action", "wildlife creator"]
  ];
  for (const [label, phrase] of requiredBeats) {
    assert.ok(script.includes(phrase), `narration master missing ${label}: ${phrase}`);
    assert.ok(srt.includes(phrase), `timed captions missing ${label}: ${phrase}`);
  }
});

test("Short 002 timed captions end at 55 seconds", () => {
  const srt = fs.readFileSync("content/short-002-plan-wildlife-documentary.srt", "utf8");
  const timestamps = [...srt.matchAll(/(\\d{2}):(\\d{2}):(\\d{2}),(\\d{3}) --> (\\d{2}):(\\d{2}):(\\d{2}),(\\d{3})/g)];
  assert.ok(timestamps.length > 0, "expected timed caption entries");
  const last = timestamps[timestamps.length - 1];
  const endSeconds = Number(last[5]) * 3600 + Number(last[6]) * 60 + Number(last[7]) + Number(last[8]) / 1000;
  assert.equal(endSeconds, 55);
});
