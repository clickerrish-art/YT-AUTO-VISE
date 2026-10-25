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
