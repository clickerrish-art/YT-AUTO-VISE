import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sha256Json = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Creates a synthetic queue approval in a disposable test project only. */
export function writeTestQueueIdentityFixture(projectRoot) {
  const contentRoot = path.join(projectRoot, "content");
  fs.mkdirSync(contentRoot, { recursive: true });
  const operationalQueue = { items: [
    { id: "test-operational-long-1", contentType: "long_form" },
    { id: "test-operational-long-2", contentType: "long_form" },
    { id: "test-operational-short-1", contentType: "short" }
  ] };
  const detailedQueue = { items: [
    { id: "test-detailed-long-1", scriptPath: "content/test-long-1.md", publicationCyclePosition: 1 },
    { id: "test-detailed-long-2", scriptPath: "content/test-long-2.md", publicationCyclePosition: 2 }
  ] };
  const approval = {
    schemaVersion: 1, status: "OWNER_APPROVED", ownerApproved: true,
    approvedBy: "TEST FIXTURE ONLY — NOT A REAL OWNER",
    approvedAt: "2026-11-21T12:00:00.000Z",
    approvalReference: "TEST-FIXTURE-NOT-PRODUCTION-AUTHORIZATION",
    operationalQueueSha256: sha256Json(operationalQueue),
    detailedQueueSha256: sha256Json(detailedQueue),
    mappings: [
      { operationalItemId: "test-operational-long-1", detailedItemId: "test-detailed-long-1", cyclePosition: 1 },
      { operationalItemId: "test-operational-long-2", detailedItemId: "test-detailed-long-2", cyclePosition: 2 }
    ]
  };
  fs.writeFileSync(path.join(contentRoot, "queue.json"), JSON.stringify(operationalQueue, null, 2) + "\n");
  fs.writeFileSync(path.join(contentRoot, "long-form-queue.json"), JSON.stringify(detailedQueue, null, 2) + "\n");
  fs.writeFileSync(path.join(contentRoot, "queue-identity-approval.json"), JSON.stringify(approval, null, 2) + "\n");
}

export function createTestDashboardProject(prefix = "sonicvhibez-dashboard-fixture-") {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const directory of ["scripts", "config", "public", "content"]) {
    const source = path.join(process.cwd(), directory);
    const destination = path.join(projectRoot, directory);
    if (fs.existsSync(source)) fs.cpSync(source, destination, { recursive: true });
  }
  const packageFile = path.join(process.cwd(), "package.json");
  if (fs.existsSync(packageFile)) fs.copyFileSync(packageFile, path.join(projectRoot, "package.json"));
  const modules = path.join(process.cwd(), "node_modules");
  if (fs.existsSync(modules)) fs.symlinkSync(modules, path.join(projectRoot, "node_modules"), "dir");
  writeTestQueueIdentityFixture(projectRoot);
  return { root: projectRoot, cleanup: () => fs.rmSync(projectRoot, { recursive: true, force: true }) };
}
