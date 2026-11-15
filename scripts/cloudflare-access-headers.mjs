/**
 * Build Cloudflare Access service-token headers.
 * Caller-provided headers may add application credentials, but cannot replace
 * the Access identity that protects the staging Worker.
 */
export function createCloudflareAccessHeaders(clientId, clientSecret, extraHeaders = {}) {
  if (typeof clientId !== "string" || clientId.length === 0) {
    throw new Error("Cloudflare Access client ID is required");
  }
  if (typeof clientSecret !== "string" || clientSecret.length === 0) {
    throw new Error("Cloudflare Access client secret is required");
  }

  const headers = new Headers(extraHeaders);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  headers.set("CF-Access-Client-Id", clientId);
  headers.set("CF-Access-Client-Secret", clientSecret);
  return headers;
}
