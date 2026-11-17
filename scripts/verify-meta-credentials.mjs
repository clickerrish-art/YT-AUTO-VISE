import fs from "node:fs";
import path from "node:path";
import { verifyMetaPageIdentity, verifyMetaPagePermissions } from "./meta-page-adapter.mjs";

function defaultConfig() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "config/facebook-publishing.json"), "utf8"));
}
function safeFailure(error) {
  return {
    status: "FAIL",
    httpStatus: Number.isInteger(error?.status) ? error.status : null,
    errorCode: Number.isInteger(error?.code) ? error.code : null,
    reason: typeof error?.message === "string" ? error.message.slice(0, 300) : "Meta credential verification failed"
  };
}

/**
 * Independently verify the Meta user token and the stored Page token.
 * Read-only GET requests only. Never refresh, exchange, print, or persist tokens.
 */
export async function verifyMetaCredentials({
  env = process.env,
  config = defaultConfig(),
  fetchImpl = fetch
} = {}) {
  const pageId = env.NATURE_FRONTIERS_FACEBOOK_PAGE_ID ?? "";
  const report = {
    result: "BLOCKED",
    mode: "READ_ONLY_NO_PUBLISH",
    pageId: /^\d{5,30}$/.test(pageId) && pageId === config.destinationPageId ? pageId : null,
    userToken: { status: "NOT_CHECKED" },
    pageToken: { status: "NOT_CHECKED" },
    safety: {
      publishingEnabled: config.publishingEnabled === true,
      dryRun: config.dryRun === true,
      emergencyStop: config.emergencyStop === true
    }
  };

  if (!/^\d{5,30}$/.test(pageId) || pageId !== config.destinationPageId) {
    report.userToken = { status: "BLOCKED_CONFIG", reason: "Configured Page ID is missing or does not match the owner-verified allowlist" };
    report.pageToken = { status: "BLOCKED_CONFIG", reason: "Configured Page ID is missing or does not match the owner-verified allowlist" };
    return report;
  }

  const userToken = env.META_USER_ACCESS_TOKEN ?? "";
  if (userToken.length < 20) {
    report.userToken = { status: "NOT_CONFIGURED", reason: "META_USER_ACCESS_TOKEN is not configured" };
  } else {
    try {
      const permissions = await verifyMetaPagePermissions({
        pageId,
        userAccessToken: userToken,
        apiVersion: config.apiVersion,
        fetchImpl
      });
      report.userToken = {
        status: "PASS",
        grantedPermissions: permissions.grantedPermissions,
        pageTasks: permissions.tasks,
        managedPageId: permissions.pageId,
        managedPageName: permissions.pageName
      };
    } catch (error) {
      report.userToken = safeFailure(error);
    }
  }

  const pageToken = env.META_PAGE_ACCESS_TOKEN ?? "";
  if (pageToken.length < 20) {
    report.pageToken = { status: "NOT_CONFIGURED", reason: "META_PAGE_ACCESS_TOKEN is not configured" };
  } else {
    try {
      const identity = await verifyMetaPageIdentity({
        pageId,
        expectedPageId: config.destinationPageId,
        expectedPageName: config.destinationPageName,
        accessToken: pageToken,
        apiVersion: config.apiVersion,
        fetchImpl
      });
      report.pageToken = {
        status: "PASS",
        verifiedPageId: identity.pageId,
        verifiedPageName: identity.pageName
      };
    } catch (error) {
      report.pageToken = safeFailure(error);
    }
  }

  const userPassed = report.userToken.status === "PASS";
  const pagePassed = report.pageToken.status === "PASS";
  const namesMatch = !userPassed || !pagePassed || report.userToken.managedPageName === report.pageToken.verifiedPageName;
  report.identityNamesMatch = namesMatch;
  report.result = userPassed && pagePassed && namesMatch ? "PASS" : "BLOCKED";
  if (!namesMatch) report.identityMismatch = "User-token managed-Page lookup and stored Page-token identity returned different names";
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const report = await verifyMetaCredentials();
  console.log(JSON.stringify(report, null, 2));
  if (report.result !== "PASS") process.exitCode = 1;
}
