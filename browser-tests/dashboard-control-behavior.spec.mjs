import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const operatorToken = "e2e-only-token-" + "x".repeat(40);
const matrix = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), "docs", "DASHBOARD_CONTROL_ACCEPTANCE_MATRIX.json"),
  "utf8"
));

const browserJourneySource = fs.readFileSync(
  path.join(process.cwd(), "browser-tests", "dashboard.spec.mjs"),
  "utf8"
);

const standaloneJourneys = {
  refresh: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  token: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  connect: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  createStateBackup: "read-only hash controls and the disabled backup action cannot be changed or invoked",
  refreshStateBackups: "Cloudflare backup controls create a checkpoint and require revision-bound restore confirmation",
  fbverifyPage: "Facebook Page verification control retains actionable blocked feedback after refreshing status",
  instagramRefresh: "Instagram status refresh is read-only and makes no provider request",
  search: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  filter: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  narrationreviewjob: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewsha: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewaudioSha: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewtranscriptSha: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewcaptionsSha: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewreportSha: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  task: "validation task control runs an allowlisted check and displays its durable result",
  runTask: "validation task control runs an allowlisted check and displays its durable result"
};

const formJourneys = {
  campaignform: "campaign form single-flights a double-click and persists the successful preview after reload",
  facebookdraftform: "Facebook draft form rejects malformed claims and media JSON without issuing a draft request",
  draft: "operator dashboard loads the authoritative schedule and persists a draft through the UI",
  authoringform: "authoring form generates and persists a source-bound script through the real dashboard",
  scriptreviewform: "authoring and approval forms reject malformed evidence without false success",
  narrationform: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  narrationreviewform: "narration form persists measured audio and word-boundary captions with a deterministic provider fixture, then reconciles without a second call",
  productionplanform: "production-plan submission and hash-bound review persist through the real dashboard",
  productionplanreviewform: "production-plan submission and hash-bound review persist through the real dashboard",
  canceljobform: "production job management cancels an unstarted job and preserves its audit history",
  retryjobform: "operator retry form authorizes reviewed failures and one dead-letter override through the real dashboard",
  produceform: "production controls disable safely when real media prerequisites are missing",
  parentrelationshipform: "Short-parent dashboard submits the explicit relationship payload and surfaces backend blockers",
  validationform: "validation task control runs an allowlisted check and displays its durable result",
  rightsform: "rights asset builder requires explicit per-asset YouTube permission and only edits local JSON",
  reviewform: "review quality scorecard control rejects malformed JSON before calling the API",
  reconcileform: "blocked production forms serialize every field and surface blockers without state mutation"
};

function candidateFor(control) {
  if (control.tag === "select") return null;
  if (control.type === "checkbox" || control.type === "radio") return null;
  if (control.type === "date") return control.min || "2027-01-05";
  if (control.type === "url") return "https://example.invalid/behavioral-acceptance";
  if (control.type === "password") return null;
  if (control.pattern?.includes("a-f0-9")) return "a".repeat(64);
  if (control.pattern?.includes("0-9")) return "12345";
  if (control.pattern?.includes("A-Za-z0-9")) return "qa-field-001";
  const minimum = Math.max(1, control.minLength || 1);
  const maximum = control.maxLength > 0 ? control.maxLength : 100;
  const seed = "QA behavioral acceptance value";
  return seed.repeat(Math.ceil(minimum / seed.length)).slice(0, Math.min(maximum, Math.max(minimum, seed.length)));
}

test("all 121 dashboard controls receive field-level interaction and mapped action evidence", async ({ page, request }) => {
  expect(matrix.controls).toHaveLength(121);
  expect(matrix.forms).toHaveLength(17);
  for (const form of matrix.forms) {
    expect(formJourneys[form.id], `form #${form.id} must map to an existing behavioral journey`).toBeTruthy();
    expect(form.controlIds.length, `form #${form.id} must map all of its owned controls`).toBeGreaterThan(0);
    expect(browserJourneySource).toContain(`test("${formJourneys[form.id]}"`);
  }
  for (const control of matrix.controls.filter(item => !item.form)) {
    expect(standaloneJourneys[control.id], `standalone control #${control.id} must map to a behavioral journey`).toBeTruthy();
    expect(browserJourneySource).toContain(`test("${standaloneJourneys[control.id]}"`);
  }
  }

  const headers = { "x-operator-token": operatorToken };
  const beforeResponse = await request.get("/api/state", { headers });
  expect(beforeResponse.status()).toBe(200);
  const beforeState = await beforeResponse.json();
  const mutationRequests = [];
  page.on("request", outgoing => {
    if (outgoing.method() !== "GET" && new URL(outgoing.url()).pathname.startsWith("/api/")) {
      mutationRequests.push(new URL(outgoing.url()).pathname);
    }
  });

  await page.goto("/");
  await page.locator("#token").fill(operatorToken);
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeVisible();

  const live = await page.locator("button,input,select,textarea").evaluateAll(elements => elements.map((element, index) => {
    const explicit = element.getAttribute("aria-label")?.trim();
    const labelledBy = (element.getAttribute("aria-labelledby") || "").trim().split(/\\s+/).filter(Boolean)
      .map(id => document.getElementById(id)?.textContent?.trim() || "").filter(Boolean).join(" ");
    const labels = element.labels ? [...element.labels].map(label => label.textContent?.trim() || "").filter(Boolean).join(" ") : "";
    const name = explicit || labelledBy || labels || (element.tagName === "BUTTON" ? element.innerText.trim() : "");
    return {
      index,
      id: element.id || null,
      tag: element.tagName.toLowerCase(),
      type: element.type || null,
      form: element.form?.id || null,
      name,
      disabled: element.disabled,
      readOnly: Boolean(element.readOnly),
      required: Boolean(element.required),
      pattern: element.getAttribute("pattern"),
      minLength: element.minLength,
      maxLength: element.maxLength,
      min: element.getAttribute("min")
    };
  }));
  expect(live, "live dashboard control count must match the source acceptance inventory").toHaveLength(121);

  const expected = matrix.controls.map(control => ({
    id: control.id || null,
    tag: control.tag,
    type: control.type === "submit-default" ? "submit" : control.type,
    form: control.form || null
  }));
  for (const control of matrix.controls) {
    const match = live.find(item => item.id === (control.id || null) && item.tag === control.tag &&
      item.form === (control.form || null) && (control.id || item.index === control.index - 1));
    expect(match, `DASH-C${String(control.index).padStart(3, "0")} must resolve to one live control`).toBeTruthy();
    expect(match.name, `DASH-C${String(control.index).padStart(3, "0")} must expose an accessible name`).toBeTruthy();
    if (control.tag === "button") {
      if (control.form) {
        expect(formJourneys[control.form], `button in #${control.form} must have a behavioral journey`).toBeTruthy();
      } else {
        expect(["refresh", "connect", "createStateBackup", "refreshStateBackups", "fbverifyPage", "instagramRefresh", "runTask"].includes(control.id),
          `standalone button #${control.id} must be an explicitly classified dashboard action`).toBe(true);
      }
    }
  }

  for (const control of live) {
    if (control.tag === "button") {
      const locator = page.locator("button,input,select,textarea").nth(control.index);
      if (control.disabled) await expect(locator).toBeDisabled();
      else await expect(locator).toBeEnabled();
      continue;
    }

    const locator = page.locator("button,input,select,textarea").nth(control.index);
    await locator.focus();
    if (control.disabled) {
      await expect(locator).toBeDisabled();
      continue;
    }
    if (control.readOnly) {
      await expect(locator).not.toBeEditable();
      continue;
    }

    if (control.tag === "select") {
      const options = await locator.locator("option").evaluateAll(items => items
        .filter(item => !item.disabled && item.value !== "")
        .map(item => item.value));
      if (options.length) {
        await locator.selectOption(options[0]);
        expect(await locator.inputValue(), `#${control.id} must retain a selectable value`).toBe(options[0]);
      } else {
        expect(await locator.inputValue()).toBe("");
      }
      continue;
    }

    if (control.type === "checkbox" || control.type === "radio") {
      if (control.type === "checkbox") {
        await locator.check();
        await expect(locator).toBeChecked();
        await locator.uncheck();
        await expect(locator).not.toBeChecked();
      } else {
        await locator.check();
        await expect(locator).toBeChecked();
      }
      continue;
    }

    if (control.type === "password") continue;

    const value = candidateFor(control);
    expect(value, `#${control.id} must have a deterministic valid-value fixture`).toBeTruthy();
    await locator.fill(value);
    const result = await locator.evaluate(element => ({
      value: element.value,
      valid: element.checkValidity(),
      validationMessage: element.validationMessage
    }));
    expect(result.value, `#${control.id} must retain keyboard-entered value`).toBe(value);
    if (control.required || control.pattern || control.minLength > 0) {
      expect(result.valid, `#${control.id} must accept its valid boundary fixture`).toBe(true);
    }
  }

  expect(mutationRequests, "field interaction and inspection must not submit forms or call mutation APIs").toEqual([]);
  const afterResponse = await request.get("/api/state", { headers });
  expect(afterResponse.status()).toBe(200);
  expect(await afterResponse.json(), "field interaction must not persist draft or approval state").toEqual(beforeState);
});

test("dashboard authorization rejects missing and invalid credentials with actionable feedback", async ({ page, request }) => {
  const missing = await request.get("/api/state");
  expect(missing.status()).toBe(401);
  const invalid = await request.get("/api/state", {
    headers: { "x-operator-token": "incorrect-test-token" }
  });
  expect(invalid.status()).toBe(401);

  const invalidMutation = await request.post("/api/drafts", {
    headers: { "content-type": "application/json", "x-operator-token": "incorrect-test-token" },
    data: {
      id: "unauthorized-dashboard-control-test",
      title: "Must not be persisted",
      topic: "Unauthorized write must be rejected",
      contentType: "long_form",
      scheduledDay: "Tuesday",
      scheduledDate: "2027-01-05"
    }
  });
  expect(invalidMutation.status()).toBe(401);

  await page.goto("/");
  await page.locator("#token").fill("incorrect-test-token");
  await page.locator("#connect").click();
  await expect(page.locator("#app")).toBeHidden();
  await expect(page.locator("#message")).toContainText(/unauthor|token|forbidden/i);
  await expect(page.locator("#message")).not.toContainText("incorrect-test-token");

  const validRead = await request.get("/api/state", {
    headers: { "x-operator-token": operatorToken }
  });
  expect(validRead.status()).toBe(200);
  const state = await validRead.json();
  expect(state.queueItems.some(item => item.id === "unauthorized-dashboard-control-test")).toBe(false);
});
