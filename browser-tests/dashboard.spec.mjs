import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

  await page.locator("#refresh").click();
  await expect(page.locator("#queue")).toContainText(draftId);

  await page.locator("#search").fill(draftId);
  await expect(page.locator("#queue")).toContainText(draftId);
  await page.locator("#filter").selectOption("short");
  await expect(page.locator("#queue")).toContainText("No matching drafts");
  await page.locator("#filter").selectOption("long_form");
  await expect(page.locator("#queue")).toContainText(draftId);
  await page.locator("#search").fill("");
  await page.locator("#filter").selectOption("");

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
  const diagnostics = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const offenders = [...document.querySelectorAll("body *")].map(element => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        id: element.id,
        className: typeof element.className === "string" ? element.className : "",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        insideTableWrap: Boolean(element.closest(".tablewrap") && element !== element.closest(".tablewrap")),
        text: (element.innerText || "").slice(0, 90)
      };
    }).filter(item => (item.right > viewport + 1 || item.left < -1 || item.scrollWidth > item.clientWidth + 1) && !item.insideTableWrap)
      .sort((a, b) => Math.max(b.right - b.clientWidth, b.scrollWidth - b.clientWidth) - Math.max(a.right - a.clientWidth, a.scrollWidth - a.clientWidth)).slice(0, 20);
    return { viewport, documentWidth, offenders };
  });
  expect(diagnostics.documentWidth, JSON.stringify(diagnostics, null, 2)).toBeLessThanOrEqual(diagnostics.viewport + 1);
});


test("campaign controls fail closed on unapproved destinations and retain Safari inactive", async ({ page, request }) => {
  const headers = { "x-operator-token": operatorToken };
  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  await page.locator("#campaignid").selectOption("safari-affiliate-inactive");
  await page.locator("#campaignaction").selectOption("preview");
  await page.locator("#campaignurl").fill("https://example.org/unapproved-safari-destination");
  await page.locator("#campaigndisclosure").fill("Affiliate link; I may earn a commission.");
  await page.getByRole("button", { name: "Apply campaign action" }).click();
  await expect(page.locator("#campaignresult")).toContainText("Preview saved; campaign remains unactivated");
  let stateResponse = await request.get("/api/state", { headers });
  expect(stateResponse.status()).toBe(200);
  let state = await stateResponse.json();
  let safari = state.campaigns.find(campaign => campaign.id === "safari-affiliate-inactive");
  expect(safari.status).toBe("INACTIVE");
  expect(safari.ownerApproved).toBe(false);
  expect(safari.destinationUrl).toBe("");
  expect(safari.pendingDestinationUrl).toBe("https://example.org/unapproved-safari-destination");

  await page.locator("#campaignaction").selectOption("activate");
  await page.locator("#campaignapproval").uncheck();
  await page.getByRole("button", { name: "Apply campaign action" }).click();
  await expect(page.locator("#campaignresult")).toContainText("Explicit owner confirmation is required");
  stateResponse = await request.get("/api/state", { headers });
  state = await stateResponse.json();
  safari = state.campaigns.find(campaign => campaign.id === "safari-affiliate-inactive");
  expect(safari.status).toBe("INACTIVE");
  expect(safari.ownerApproved).toBe(false);

  await page.locator("#campaignid").selectOption("selar-wildlife-vault");
  await page.locator("#campaignaction").selectOption("preview");
  await page.locator("#campaignurl").fill("https://selar.com/unauthorized-destination");
  await page.locator("#campaigndisclosure").fill("Promotional link; terms are on the seller page.");
  await page.getByRole("button", { name: "Apply campaign action" }).click();
  await expect(page.locator("#campaignresult")).toContainText("Selar destination must exactly match the approved URL");
  stateResponse = await request.get("/api/state", { headers });
  state = await stateResponse.json();
  const selar = state.campaigns.find(campaign => campaign.id === "selar-wildlife-vault");
  expect(selar.destinationUrl).toBe("https://selar.com/0u19v8u99l");
  expect(selar.status).toBe("ACTIVE_FOR_DRAFTS_ONLY");
  expect(state.publishingEnabled).toBe(false);
});


test("dashboard state survives a real local server restart", async ({ page }) => {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "sonicvhibez-browser-restart-"));
  const port = 20_000 + Math.floor(Math.random() * 20_000);
  const base = `http://127.0.0.1:${port}`;
  let child;

  async function startServer() {
    const processHandle = spawn(process.execPath, ["scripts/dashboard-server.mjs"], {
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: "test",
        DASHBOARD_OPERATOR_TOKEN: operatorToken,
        DASHBOARD_OPERATOR_ID: "playwright-restart-test-operator",
        DASHBOARD_STATE_DIR: stateDir,
        UPLOAD_LOG_DIR: path.join(stateDir, "run-logs"),
        PORT: String(port),
        DASHBOARD_HOST: "127.0.0.1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let logs = "";
    processHandle.stdout.on("data", chunk => { logs += chunk.toString(); });
    processHandle.stderr.on("data", chunk => { logs += chunk.toString(); });
    for (let attempt = 0; attempt < 80; attempt++) {
      if (processHandle.exitCode !== null) throw new Error("Isolated dashboard exited before ready: " + logs);
      try {
        const response = await fetch(base + "/healthz");
        if (response.ok) return processHandle;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    processHandle.kill("SIGTERM");
    throw new Error("Isolated dashboard did not become ready: " + logs);
  }

  async function stopServer(processHandle) {
    if (!processHandle || processHandle.exitCode !== null) return;
    const exited = new Promise(resolve => processHandle.once("exit", resolve));
    processHandle.kill("SIGTERM");
    await exited;
  }

  try {
    child = await startServer();
    await page.goto(base + "/");
    await page.locator("#token").fill(operatorToken);
    await page.locator("#connect").click();
    await expect(page.locator("#app")).toBeVisible();

    const response = await page.request.get(base + "/api/state", {
      headers: { "x-operator-token": operatorToken }
    });
    expect(response.status()).toBe(200);
    const state = await response.json();
    const slot = state.schedule.schedule[0];
    const scheduledDate = candidateDateForSlot(state, slot);
    const draftId = "restart-e2e-" + Date.now().toString(36);

    await page.locator("#id").fill(draftId);
    await page.locator("#title").fill("Restart persistence acceptance");
    await page.locator("#topic").fill("Verify committed draft survives server restart");
    await page.locator("#day").selectOption(slot.day);
    await page.locator("#scheduledDate").fill(scheduledDate);
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.locator("#message")).toContainText("Draft saved and production job", { timeout: 10_000 });
    await expect(page.locator("#queue")).toContainText(draftId);

    await stopServer(child);
    child = await startServer();
    await page.goto(base + "/");
    await page.locator("#token").fill(operatorToken);
    await page.locator("#connect").click();
    await expect(page.locator("#app")).toBeVisible();
    await expect(page.locator("#queue")).toContainText(draftId);

    const afterRestart = await page.request.get(base + "/api/state", {
      headers: { "x-operator-token": operatorToken }
    });
    expect(afterRestart.status()).toBe(200);
    const restored = await afterRestart.json();
    expect(restored.queueItems.some(item => item.id === draftId)).toBe(true);
    expect(restored.jobs.some(job => job.kind === "CONTENT_PRODUCTION" && job.idempotencyKey === "draft:" + draftId)).toBe(true);
    expect(restored.publishingEnabled).toBe(false);
  } finally {
    await stopServer(child);
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});


test("Facebook draft idea and save controls persist a blocked draft without attempting publication", async ({ page, request }) => {
  const headers = { "x-operator-token": operatorToken };
  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  const draftId = "fb-browser-" + Date.now().toString(36);
  await page.locator("#fbdate").fill("2030-10-25");
  await page.locator("#fbsuggest").click();
  await expect(page.locator("#facebookdraftresult")).toContainText("Research-first idea:");
  await expect(page.locator("#fbtopic")).not.toHaveValue("");
  await expect(page.locator("#fbcaption")).not.toHaveValue("");

  await page.locator("#fbid").fill(draftId);
  await page.locator("#fbpageid").fill("123456789");
  await page.locator("#fbcaption").fill("Research-first wildlife education draft: explain how habitat structure affects animal behaviour. Add verified sources and licensed media before any publication.");
  await page.getByRole("button", { name: "Save Facebook draft and run checks" }).click();
  await expect(page.locator("#facebookdraftresult")).toContainText("Draft saved; external publishing was not attempted.", { timeout: 10_000 });
  await expect(page.locator("#facebookdraftlist")).toContainText(draftId);

  const stateResponse = await request.get("/api/facebook/state", { headers });
  expect(stateResponse.status()).toBe(200);
  const state = await stateResponse.json();
  const saved = state.drafts.find(draft => draft.id === draftId);
  expect(saved).toBeTruthy();
  expect(saved.destination).toBe("nature_frontiers_facebook");
  expect(saved.publishingEnabled).toBe(false);
  expect(saved.status).toBe("DRAFT");
  expect(state.publishingEnabled).toBe(false);
});

test("public YouTube publishing has no dashboard endpoint and readiness stays fail-closed", async ({ page, request }) => {
  const headers = { "x-operator-token": operatorToken };

  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.getByText("PUBLIC PUBLISHING OFF", { exact: true })).toBeVisible();

  const beforeResponse = await request.get("/api/state", { headers });
  expect(beforeResponse.status()).toBe(200);
  const before = await beforeResponse.json();
  expect(before.publishingEnabled).toBe(false);
  expect(Array.isArray(before.uploads)).toBe(true);

  const publicControls = await page.getByRole("button", {
    name: /publish now|publish publicly|make public|set visibility/i
  }).count();
  expect(publicControls).toBe(0);

  const attemptedPublicUpload = await request.post("/api/youtube/publish", {
    headers,
    data: {
      channel: "Nature Frontiers",
      visibility: "public",
      title: "Must never be published by the safety test"
    }
  });
  expect(attemptedPublicUpload.status()).toBe(404);
  expect(await attemptedPublicUpload.json()).toMatchObject({ error: "Not found" });

  const afterResponse = await request.get("/api/state", { headers });
  expect(afterResponse.status()).toBe(200);
  const after = await afterResponse.json();
  expect(after.publishingEnabled).toBe(false);
  expect(after.uploads).toHaveLength(before.uploads.length);
  expect(after.jobs).toHaveLength(before.jobs.length);

  const readinessResponse = await request.get("/readyz");
  expect(readinessResponse.status()).toBe(503);
  const readiness = await readinessResponse.json();
  expect(readiness.ready).toBe(false);
  expect(readiness.publishingEnabled).toBe(false);
  expect(readiness.blockers.length).toBeGreaterThan(0);
});


test("Facebook Page verification control retains actionable blocked feedback after refreshing status", async ({ page }) => {
  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  await page.locator("#fbverifyPage").click();
  await expect(page.locator("#facebookverifyresult")).toContainText("Page verification blocked:", { timeout: 10_000 });
  await expect(page.locator("#facebookverifyresult")).toContainText(/Page ID|META_USER_ACCESS_TOKEN|META_PAGE_ACCESS_TOKEN/);
  // The action result must not be overwritten by connect() re-rendering the
  // separate read-only publisher-health and connection-status panels.
  await expect(page.locator("#facebookautonomousstatus")).toBeVisible();
  await expect(page.locator("#facebookstatus")).toBeVisible();
});


test("production controls disable safely when real media prerequisites are missing", async ({ page, request }) => {
  const headers = { "x-operator-token": operatorToken };
  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  let response = await request.get("/api/state", { headers });
  expect(response.status()).toBe(200);
  let state = await response.json();
  const slot = state.schedule.schedule[0];
  const scheduledDate = candidateDateForSlot(state, slot);
  const draftId = "production-gates-" + Date.now().toString(36);
  await page.locator("#id").fill(draftId);
  await page.locator("#title").fill("Production gate browser test");
  await page.locator("#topic").fill("Verify real media is required before approval");
  await page.locator("#day").selectOption(slot.day);
  await page.locator("#scheduledDate").fill(scheduledDate);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("#message")).toContainText("Draft saved and production job", { timeout: 10_000 });

  response = await request.get("/api/state", { headers });
  state = await response.json();
  const queued = state.jobs.filter(job => job.kind === "CONTENT_PRODUCTION" && job.state === "QUEUED");
  expect(queued.length).toBeGreaterThan(0);

  for (const job of queued) {
    await page.locator("#producejob").selectOption(job.id);
    await page.locator("#produceform button[type=submit]").click();
    await expect.poll(async () => {
      const snapshot = await request.get("/api/state", { headers });
      const current = await snapshot.json();
      return current.jobs.find(item => item.id === job.id)?.state;
    }, { timeout: 10_000 }).toMatch(/BLOCKED|FAILED|GENERATED/);
    await expect(page.locator(`#producejob option[value="${job.id}"]`)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#produceresult")).toContainText(/Render result: (BLOCKED|FAILED|GENERATED)|Render blocked or failed:/, { timeout: 10_000 });
  }

  response = await request.get("/api/state", { headers });
  state = await response.json();
  for (const job of state.jobs.filter(item => queued.some(previous => previous.id === item.id))) {
    expect(["BLOCKED", "FAILED"]).toContain(job.state);
    expect(job.outputArtifacts ?? []).toHaveLength(0);
  }
  expect(state.publishingEnabled).toBe(false);
  expect(state.uploads).toHaveLength(0);

  await expect(page.locator("#produceform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#validationform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#validationresult")).toContainText("Action unavailable:");
  await expect(page.locator("#rightsform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#rightsresult")).toContainText("Action unavailable:");
  await expect(page.locator("#reviewform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#reviewresult")).toContainText("Action unavailable:");
  await expect(page.locator("#reconcileform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#reconcileresult")).toContainText("Action unavailable:");

  await page.locator("#task").selectOption("validate-schedule");
  await page.locator("#runTask").click();
  await expect(page.locator("#taskresult")).toContainText("SUCCEEDED", { timeout: 20_000 });
  await page.locator("#refresh").click();
  await expect(page.locator("#produceform button[type=submit]")).toBeDisabled();
  await expect(page.locator("#reviewresult")).toContainText("Action unavailable:");
});
