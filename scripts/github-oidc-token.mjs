/** Create a short-lived GitHub Actions OIDC token provider that refreshes before token expiry. */
export function createGitHubOidcTokenProvider({
  env = process.env,
  fetchImpl = fetch,
  now = () => Date.now(),
  refreshSkewMs = 60_000
} = {}) {
  let cachedToken = null;
  let cachedExpiresAt = 0;

  return async function getGitHubOidcToken() {
    const currentTime = now();
    if (cachedToken && cachedExpiresAt > currentTime + refreshSkewMs) return cachedToken;

    const requestUrlValue = env.ACTIONS_ID_TOKEN_REQUEST_URL;
    const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
    if (typeof requestUrlValue !== "string" || !requestUrlValue ||
        typeof requestToken !== "string" || !requestToken) {
      throw new Error("GitHub Actions OIDC is unavailable; grant this workflow id-token: write permission");
    }

    let requestUrl;
    try { requestUrl = new URL(requestUrlValue); }
    catch { throw new Error("GitHub Actions OIDC request URL is invalid"); }
    if (requestUrl.protocol !== "https:" || requestUrl.hostname !== "pipelines.actions.githubusercontent.com" ||
        requestUrl.username || requestUrl.password || requestUrl.hash) {
      throw new Error("GitHub Actions OIDC request URL is not trusted");
    }
    requestUrl.searchParams.set("audience", "sonicvhibez-dashboard-runner");

    const response = await fetchImpl(requestUrl, {
      headers: { authorization: "Bearer " + requestToken, accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error("GitHub Actions OIDC token request failed with HTTP " + response.status);

    const payload = await response.json();
    if (typeof payload.value !== "string" || payload.value.length < 100) {
      throw new Error("GitHub Actions did not return a valid OIDC token");
    }
    const parts = payload.value.split(".");
    if (parts.length !== 3) throw new Error("GitHub Actions OIDC token has an invalid JWT structure");

    let claims;
    try { claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); }
    catch { throw new Error("GitHub Actions OIDC token payload is unreadable"); }
    const expiresAt = Number(claims?.exp) * 1000;
    if (!Number.isFinite(expiresAt) || expiresAt <= currentTime + refreshSkewMs) {
      throw new Error("GitHub Actions OIDC token is expired or too close to expiry");
    }

    cachedToken = payload.value;
    cachedExpiresAt = expiresAt;
    return cachedToken;
  };
}
