import { test, expect } from "@playwright/test";

const operatorToken = "e2e-only-token-" + "x".repeat(40);

test("operator token has an accessible label and the dashboard can be connected with keyboard only", async ({ page }) => {
  await page.goto("/");

  const tokenField = page.getByLabel("Operator API token", { exact: true });
  await expect(tokenField).toBeVisible();
  await expect(tokenField).toHaveAttribute("type", "password");

  await tokenField.focus();
  await page.keyboard.type(operatorToken);
  await page.keyboard.press("Tab");
  await expect(page.locator("#connect")).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator("#message")).not.toContainText(operatorToken);
  await expect(page.getByText("PUBLIC PUBLISHING OFF", { exact: true })).toBeVisible();
});

test("all visible dashboard controls have programmatic accessible names after connection", async ({ page }) => {
  await page.goto("/");
  const tokenField = page.getByLabel("Operator API token", { exact: true });
  await tokenField.fill(operatorToken);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.locator("#app")).toBeVisible();

  const unnamed = await page.locator("button:visible, input:visible, select:visible, textarea:visible").evaluateAll((elements) => {
    const nameOf = (element) => {
      const explicit = element.getAttribute("aria-label")?.trim();
      if (explicit) return explicit;
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const name = labelledBy.split(/\\s+/).map(id => document.getElementById(id)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
        if (name) return name;
      }
      const labels = element.labels ? [...element.labels].map(label => label.textContent?.trim() ?? "").filter(Boolean).join(" ") : "";
      if (labels) return labels;
      if (element.tagName === "BUTTON") return element.innerText?.trim() ?? "";
      if (element.tagName === "INPUT" && ["submit", "button", "reset"].includes(element.type)) return element.value?.trim() ?? "";
      return "";
    };
    return elements.map(element => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      type: element.type || null,
      name: nameOf(element)
    })).filter(control => !control.name);
  });

  expect(unnamed, "visible interactive controls must expose an accessible name, not just a placeholder").toEqual([]);
});

test("connected dashboard fits a 320px mobile viewport without page-level horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.getByLabel("Operator API token", { exact: true }).fill(operatorToken);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.locator("#app")).toBeVisible();

  const overflow = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  expect(overflow.documentWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth);
  expect(overflow.bodyWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth);
});
