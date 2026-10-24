import { test, expect } from "@playwright/test";

const operatorToken = "e2e-only-token-" + "x".repeat(40);

function dateAtUtcOffset(dateString) {
  return Date.parse(dateString + "T15:00:00.000Z");
}

function candidateDateForSlot(state, slot) {
  const occupied = new Set();
  for (const item of state.queueItems ?? []) {
    if (item.scheduledDate) occupied.add(item.scheduledDate);
  }
  for (const job of state.jobs ?? []) {
    if (job.scheduledSlot?.date) occupied.add(job.scheduledSlot.date);
  }
  const reserved = [];
  for (const item of state.queueItems ?? []) {
    const value = item.scheduledAt ?? (item.scheduledDate ? item.scheduledDate + "T15:00:00.000Z" : "");
    const stamp = Date.parse(value);
    if (Number.isFinite(stamp)) reserved.push(stamp);
  }
  for (const job of state.jobs ?? []) {
    const date = job.scheduledSlot?.date;
    if (date) {
      const stamp = Date.parse(date + "T15:00:00.000Z");
      if (Number.isFinite(stamp)) reserved.push(stamp);
    }
  }
  const start = new Date(Date.UTC(new Date().getUTCFullYear() + 2, 0, 1));
  for (let offset = 0; offset < 1200; offset++) {
    const candidate = new Date(start.getTime() + offset * 86_400_000);
    const date = candidate.toISOString().slice(0, 10);
    const weekday = candidate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    if (weekday !== slot.day || occupied.has(date)) continue;
    const stamp = dateAtUtcOffset(date);
    if (reserved.some(previous => Math.abs(stamp - previous) < 72 * 3_600_000)) continue;
    return date;
  }
  throw new Error("Could not find an unreserved future slot for browser acceptance");
}

test("operator dashboard loads the authoritative schedule and persists a draft through the UI", async ({ page, request }) => {
  const unauthorized = await request.get("/api/state");
  expect(unauthorized.status()).toBe(401);

  const stateResponse = await request.get("/api/state", { headers: { "x-operator-token": operatorToken } });
  expect(stateResponse.status()).toBe(200);
  const state = await stateResponse.json();
  expect(state.publishingEnabled).toBe(false);

  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  const slots = state.schedule.schedule;
  expect(slots.map(slot => [slot.day, slot.format])).toEqual([
    ["Tuesday", "long_form"],
    ["Saturday", "short"]
  ]);
  await expect(page.locator("#schedule")).toContainText("Draft-preparation slots: Tuesday long-form, Saturday Short");
  await expect(page.locator("#schedule")).toContainText("long-form → long-form → Short");
  await expect(page.locator("#schedule")).toContainText("minimum 72 elapsed hours");
  await expect(page.locator("#day option")).toHaveCount(slots.length);
  await expect(page.locator("#day")).not.toContainText("Thursday");

  const slot = slots[0];
  const scheduledDate = candidateDateForSlot(state, slot);
  const draftId = "browser-e2e-" + Date.now().toString(36);
  await page.locator("#id").fill(draftId);
  await page.locator("#title").fill("Browser acceptance draft");
  await page.locator("#topic").fill("Ethical wildlife documentary planning");
  await page.locator("#day").selectOption(slot.day);
  await page.locator("#scheduledDate").fill(scheduledDate);
  await expect(page.locator("#type")).toHaveValue(slot.format);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("#message")).toContainText("Draft saved and production job", { timeout: 10_000 });
  await expect(page.locator("#queue")).toContainText(draftId);

  const persistedResponse = await request.get("/api/state", { headers: { "x-operator-token": operatorToken } });
  expect(persistedResponse.status()).toBe(200);
  const persisted = await persistedResponse.json();
  expect(persisted.queueItems.some(item => item.id === draftId)).toBe(true);
  expect(persisted.jobs.some(job => job.kind === "CONTENT_PRODUCTION" && job.idempotencyKey === "draft:" + draftId)).toBe(true);

  await page.locator("#id").fill(draftId);
  await page.locator("#title").fill("Duplicate draft must be rejected");
  await page.locator("#topic").fill("Duplicate submission safety test");
  await page.locator("#day").selectOption(slot.day);
  await page.locator("#scheduledDate").fill(scheduledDate);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("#message")).toContainText("That queue ID already exists", { timeout: 10_000 });

  const readiness = await request.get("/readyz");
  expect(readiness.status()).toBe(503);
  const readinessBody = await readiness.json();
  expect(readinessBody.ready).toBe(false);
  expect(readinessBody.publishingEnabled).toBe(false);

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator("#app")).toBeVisible();
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
});
