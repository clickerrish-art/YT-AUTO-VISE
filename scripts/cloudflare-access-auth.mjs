/** Build the Cloudflare Access service-token headers required before the Worker can receive OIDC-authenticated requests. */
export function buildCloudflareAccessHeaders(env = process.env) {
  const clientId = typeof env.DASHBOARD_STATE_ACCESS_CLIENT_ID === "string"
    ? env.DASHBOARD_STATE_ACCESS_CLIENT_ID.trim() : "";
  const clientSecret = typeof env.DASHBOARD_STATE_ACCESS_CLIENT_SECRET === "string"
    ? env.DASHBOARD_STATE_ACCESS_CLIENT_SECRET.trim() : "";
  if (!clientId || !clientSecret) {
    throw new Error("Both DASHBOARD_STATE_ACCESS_CLIENT_ID and DASHBOARD_STATE_ACCESS_CLIENT_SECRET are required for Cloudflare Access");
  }
  if (/[\r\n]/.test(clientId) || /[\r\n]/.test(clientSecret)) {
    throw new Error("Cloudflare Access service-token credentials contain invalid header characters");
  }
  return {
    "cf-access-client-id": clientId,
    "cf-access-client-secret": clientSecret
  };
}
