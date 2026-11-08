import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const stateDir = path.join(os.tmpdir(), "sonicvhibez-dashboard-playwright-" + process.pid);
fs.rmSync(stateDir, { recursive: true, force: true });

export default defineConfig({
  testDir: "./browser-tests",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:18787",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: "off",
    screenshot: "off",
    video: "off"
  },
  webServer: {
    command: "npm run dashboard",
    url: "http://127.0.0.1:18787/healthz",
    timeout: 30_000,
    reuseExistingServer: false,
    env: {
      DASHBOARD_HOST: "127.0.0.1",
      PORT: "18787",
      DASHBOARD_OPERATOR_TOKEN: "e2e-only-token-" + "x".repeat(40),
      DASHBOARD_OPERATOR_ID: "playwright-test-operator",
      DASHBOARD_STATE_DIR: stateDir,
      UPLOAD_LOG_DIR: path.join(stateDir, "run-logs")
    }
  }
});
