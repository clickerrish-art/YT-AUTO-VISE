import snapshotWorker, {
  authenticate,
  constantTimeEqual,
  handleRequest as handleSnapshotRequest,
  operatorIdentity,
  validateDashboardState,
  verifyRepositoryRunnerToken
} from "./staging-snapshot/worker.js";

const OPERATOR_ONLY_RUNNER_ROUTES = new Set([
  "GET /api/runner/session/status",
  "POST /api/runner/session/release"
]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

/**
 * Single source entrypoint for the full staging Worker contract.
 *
 * Runner persistence endpoints are delegated to the recovered, tracked
 * staging implementation. They remain fail-closed unless RUNNER_OIDC_ENABLED
 * is explicitly set to "true" after branch protection and OIDC trust review.
 * Operator-only status/release routes retain the snapshot's operator auth.
 * Provider publishing routes remain blocked by the snapshot's provider gates.
 */
async function handleRequest(request, env, options = {}) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const route = `${method} ${url.pathname}`;

  if (url.pathname.startsWith("/api/runner/") &&
      !OPERATOR_ONLY_RUNNER_ROUTES.has(route) &&
      env.RUNNER_OIDC_ENABLED !== "true") {
    return json({
      error: "Repository runner OIDC is disabled until the protected-branch workflow and trust policy are verified.",
      code: "RUNNER_OIDC_DISABLED",
      publishingEnabled: false
    }, 503);
  }

  return handleSnapshotRequest(request, env, options);
}

export {
  authenticate,
  constantTimeEqual,
  handleRequest,
  operatorIdentity,
  validateDashboardState,
  verifyRepositoryRunnerToken
};

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, { ctx });
  }
};
