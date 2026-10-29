#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

export function parseGitLogWithFiles(raw) {
  const commits = [];
  let current = null;
  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    const match = line.match(/^([a-f0-9]{40})\x1f([^\x1f]*)\x1f([^\x1f]*)\x1f(.*)$/);
    if (match) {
      current = { sha: match[1], parents: match[2] ? match[2].split(" ") : [], authoredAt: match[3], subject: match[4], files: [] };
      commits.push(current);
      continue;
    }
    if (!current) continue;
    const fileMatch = line.match(/^([A-Z][0-9]*)\t(.+)$/);
    if (fileMatch) current.files.push({ status: fileMatch[1], path: fileMatch[2] });
  }
  return commits;
}

export function classifyCommit(commit, patchEquivalent = false) {
  const files = commit.files.map(file => file.path);
  const deleted = commit.files.some(file => file.status === "D");
  let category = "mixed";
  if (patchEquivalent) category = "patch-equivalent-to-base";
  else if (files.length && files.every(file => file.startsWith("docs/") || /\.(md|rst|txt)$/i.test(file))) category = "documentation-only";
  else if (files.length && files.every(file => /(^|\/)(test|tests|browser-tests)\//.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) category = "test-only";
  else if (files.length && files.every(file => file.startsWith(".github/workflows/"))) category = "workflow-only";
  else if (files.length && files.every(file => /(^|\/)(config|content)\//.test(file) || /\.json$/i.test(file))) category = "config-content";
  else if (files.length && files.every(file => /(^|\/)(dist|build|coverage|artifacts)\//.test(file) || /(^|\/)(package-lock\.json|npm-shrinkwrap\.json)$/.test(file))) category = "generated-or-lockfile";
  else if (files.some(file => /(^|\/)(test|tests|browser-tests)\//.test(file)) && files.some(file => /\.(mjs|cjs|js|py|ts)$/i.test(file) && !/(^|\/)(test|tests|browser-tests)\//.test(file))) category = "implementation-and-tests";
  else if (files.some(file => /\.(mjs|cjs|js|py|ts)$/i.test(file))) category = "implementation";
  return { category, hasDeletion: deleted, changedFileCount: files.length };
}

export function buildBranchReconciliationReport({ baseRef = "origin/main", headRef = "HEAD", cwd = process.cwd() } = {}) {
  const baseSha = git(["rev-parse", "--verify", baseRef + "^{commit}"], cwd).trim();
  const headSha = git(["rev-parse", "--verify", headRef + "^{commit}"], cwd).trim();
  const mergeBaseSha = git(["merge-base", baseSha, headSha], cwd).trim();
  const baseOnly = parseGitLogWithFiles(git(["log", "--format=%H%x1f%P%x1f%aI%x1f%s", "--name-status", "--no-renames", headSha + ".." + baseSha], cwd));
  const headOnly = parseGitLogWithFiles(git(["log", "--format=%H%x1f%P%x1f%aI%x1f%s", "--name-status", "--no-renames", baseSha + ".." + headSha], cwd));
  const cherry = git(["cherry", "-v", baseSha, headSha], cwd);
  const equivalent = new Set(cherry.split(/\r?\n/).map(line => line.match(/^- ([a-f0-9]{40})\b/)?.[1]).filter(Boolean));
  for (const commit of headOnly) Object.assign(commit, classifyCommit(commit, equivalent.has(commit.sha)));
  for (const commit of baseOnly) Object.assign(commit, classifyCommit(commit, false));
  const changedRaw = git(["diff", "--name-status", "--no-renames", baseSha, headSha], cwd);
  const changedFiles = changedRaw.split(/\r?\n/).filter(Boolean).map(line => {
    const tab = line.indexOf("\t");
    return tab < 0 ? { status: "?", path: line } : { status: line.slice(0, tab), path: line.slice(tab + 1) };
  });
  const criticalPattern = /(^|\/)(public\/dashboard\.html|scripts\/(dashboard-server|dashboard-inventory|operator-auth|production-readiness|content-job-lifecycle|human-review|upload-private|youtube-history-gate|facebook-pipeline|facebook-autonomous-publisher|meta-page-adapter|schedule-policy|backup-state|restore-state)\.mjs|test\/restore-facebook-draft-history\.test\.mjs|tests\/restore-state\.test\.mjs)$/;
  const criticalChanges = changedFiles.filter(file => criticalPattern.test(file.path));
  const worktree = git(["status", "--porcelain=v1"], cwd).split(/\r?\n/).filter(Boolean);
  const aheadBehind = git(["rev-list", "--left-right", "--count", baseSha + "..." + headSha], cwd).trim().split(/\s+/).map(Number);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repository: git(["remote", "get-url", "origin"], cwd).trim(),
    base: { ref: baseRef, sha: baseSha },
    head: { ref: headRef, sha: headSha },
    mergeBaseSha,
    aheadBy: aheadBehind[1],
    behindBy: aheadBehind[0],
    branchOnlyCommitCount: headOnly.length,
    baseOnlyCommitCount: baseOnly.length,
    patchEquivalentCommitCount: headOnly.filter(commit => commit.category === "patch-equivalent-to-base").length,
    branchOnlyCommits: headOnly,
    baseOnlyCommits: baseOnly,
    finalTreeChangedFiles: changedFiles,
    criticalModuleChanges: criticalChanges,
    deletions: changedFiles.filter(file => file.status === "D"),
    workingTree: { clean: worktree.length === 0, porcelain: worktree },
    safety: {
      destructiveReconciliationPerformed: false,
      integrationDecision: "REQUIRES_REVIEW",
      note: "This inventory does not authorize merge/rebase/reset/force-push. Patch equivalence is heuristic evidence, not proof of semantic equivalence. Human review is required for repeated, superseded, generated and potentially destructive changes."
    }
  };
}

export function renderMarkdown(report) {
  const lines = [
    "# Branch reconciliation inventory",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Repository: ${report.repository}`,
    `- Base: \`${report.base.ref}\` (${report.base.sha})`,
    `- Head: \`${report.head.ref}\` (${report.head.sha})`,
    `- Merge base: ${report.mergeBaseSha}`,
    `- Divergence: ${report.aheadBy} ahead / ${report.behindBy} behind`,
    `- Branch-only commits inventoried: ${report.branchOnlyCommitCount}`,
    `- Base-only commits inventoried: ${report.baseOnlyCommitCount}`,
    `- Patch-equivalent branch commits: ${report.patchEquivalentCommitCount}`,
    `- Final tree changes: ${report.finalTreeChangedFiles.length}`,
    `- Critical module changes: ${report.criticalModuleChanges.length}`,
    `- Final-tree deletions: ${report.deletions.length}`,
    `- Working tree clean: ${report.workingTree.clean}`,
    "",
    "> **Decision: review required.** This report is an inventory, not permission to reconcile history. No destructive Git operation was performed.",
    "",
    "## Critical module changes",
    "",
    ...(report.criticalModuleChanges.length ? report.criticalModuleChanges.map(file => `- ${file.status} \`${file.path}\``) : ["- None detected by the configured critical-path pattern."]),
    "",
    "## Final-tree deletions",
    "",
    ...(report.deletions.length ? report.deletions.map(file => `- \`${file.path}\``) : ["- No deleted paths in the final base-to-head tree diff."]),
    "",
    "## Branch-only commit inventory",
    "",
    "| SHA | Authored at | Category | Files | Subject |",
    "|---|---|---|---:|---|",
    ...report.branchOnlyCommits.map(commit => `| ${commit.sha} | ${commit.authoredAt} | ${commit.category} | ${commit.changedFileCount} | ${commit.subject.replace(/\|/g, "\\|")} |`),
    "",
    "## Main/base-only commit inventory",
    "",
    "| SHA | Authored at | Category | Files | Subject |",
    "|---|---|---|---:|---|",
    ...report.baseOnlyCommits.map(commit => `| ${commit.sha} | ${commit.authoredAt} | ${commit.category} | ${commit.changedFileCount} | ${commit.subject.replace(/\|/g, "\\|")} |`),
    "",
    "## Interpretation limits",
    "",
    "- Each commit record contains the changed-file status/path list in the JSON report.",
    "- Patch-equivalent means Git's `git cherry` found a patch-id equivalent in the base history; it does not prove behavior is equivalent or that the change is not superseded.",
    "- Generated/config/test/documentation classifications are heuristics. Review commit diffs and final module behavior before integration.",
    "- Branch protection and required-check settings must be verified separately through GitHub administration/API permissions."
  ];
  return lines.join("\n") + "\n";
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  try {
    const base = argValue("--base", "origin/main");
    const head = argValue("--head", "HEAD");
    const jsonPath = path.resolve(argValue("--json", "branch-reconciliation-report.json"));
    const markdownPath = path.resolve(argValue("--markdown", "branch-reconciliation-report.md"));
    const report = buildBranchReconciliationReport({ baseRef: base, headRef: head });
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.mkdirSync(path.dirname(markdownPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    fs.writeFileSync(markdownPath, renderMarkdown(report), { mode: 0o600 });
    console.log(`Branch inventory written: ${report.branchOnlyCommitCount} branch-only commits, ${report.baseOnlyCommitCount} base-only commits, ${report.finalTreeChangedFiles.length} final-tree file changes.`);
    console.log("Decision: REQUIRES_REVIEW; no history mutation performed.");
  } catch (error) {
    console.error("Branch reconciliation inventory failed: " + (error instanceof Error ? error.message : "unknown error"));
    process.exitCode = 1;
  }
}
