/**
 * Redact secrets and local filesystem locations from operator-facing output.
 * This is defense in depth; commands must still avoid printing secrets.
 */
import path from "node:path";

const SECRET_ENV_KEY = /(TOKEN|SECRET|PASSWORD|REFRESH_TOKEN|ACCESS_KEY|API_KEY|PRIVATE_KEY)/i;
const MIN_SECRET_LENGTH = 8;

export function redactOperationalText(value, { env = process.env, roots = [] } = {}) {
  let output = String(value ?? "");
  const secrets = Object.entries(env ?? {})
    .filter(([key, secret]) => SECRET_ENV_KEY.test(key) && typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH)
    .sort((a, b) => b[1].length - a[1].length);
  for (const [key, secret] of secrets) {
    output = output.split(secret).join("[REDACTED:" + key + "]");
  }
  output = output.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]{12,}/gi, "Bearer [REDACTED]");
  output = output.replace(/((?:access_token|refresh_token|client_secret|api_key|password)\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;]+)/gi, "$1[REDACTED]");
  const normalizedRoots = [...new Set((roots ?? []).filter(Boolean).map(root => path.resolve(String(root))))].sort((a, b) => b.length - a.length);
  for (const root of normalizedRoots) {
    output = output.split(root).join(root === normalizedRoots.at(-1) ? "<local-path>" : "<local-path>");
  }
  return output;
}
