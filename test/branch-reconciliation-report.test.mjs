import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildBranchReconciliationReport, renderMarkdown } from "../scripts/branch-reconciliation-report.mjs";

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
}

test("branch reconciliation report inventories branch-only/base-only commits and per-commit files without mutation", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "branch-reconciliation-"));
  try {
    git(cwd, "init", "-b", "main");
    git(cwd, "config", "user.name", "Test User");
    git(cwd, "config", "user.email", "test@example.invalid");
    git(cwd, "remote", "add", "origin", "https://example.invalid/repo.git");
    fs.writeFileSync(path.join(cwd, "README.md"), "base\n");
    git(cwd, "add", "README.md");
    git(cwd, "commit", "-m", "base readme");
    git(cwd, "branch", "work");
    git(cwd, "checkout", "work");
    fs.mkdirSync(path.join(cwd, "scripts"));
    fs.writeFileSync(path.join(cwd, "scripts", "feature.mjs"), "export const value = 1;\n");
    fs.mkdirSync(path.join(cwd, "test"));
    fs.writeFileSync(path.join(cwd, "test", "feature.test.mjs"), "test fixture\n");
    git(cwd, "add", "scripts/feature.mjs", "test/feature.test.mjs");
    git(cwd, "commit", "-m", "implement feature with test");
    git(cwd, "checkout", "main");
    fs.writeFileSync(path.join(cwd, "main-only.txt"), "main-only\n");
    git(cwd, "add", "main-only.txt");
    git(cwd, "commit", "-m", "main-only change");
    const before = git(cwd, "status", "--porcelain");
    const report = buildBranchReconciliationReport({ baseRef: "main", headRef: "work", cwd });
    assert.equal(report.branchOnlyCommitCount, 1);
    assert.equal(report.baseOnlyCommitCount, 1);
    assert.equal(report.aheadBy, 1);
    assert.equal(report.behindBy, 1);
    assert.equal(report.branchOnlyCommits[0].category, "implementation-and-tests");
    assert.deepEqual(report.branchOnlyCommits[0].files.map(file => file.path).sort(), ["scripts/feature.mjs", "test/feature.test.mjs"]);
    assert.deepEqual(report.baseOnlyCommits[0].files.map(file => file.path), ["main-only.txt"]);
    assert.equal(report.safety.destructiveReconciliationPerformed, false);
    assert.match(renderMarkdown(report), /Branch-only commit inventory/);
    assert.equal(git(cwd, "status", "--porcelain"), before, "report generation must not mutate the worktree");
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
