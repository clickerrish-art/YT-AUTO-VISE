import { timingSafeEqual } from "node:crypto";

/**
 * Compare operator tokens without leaking equality through ordinary string
 * comparison. Buffer lengths, not JavaScript string lengths, must match before
 * timingSafeEqual is called; UTF-8 strings can have different byte lengths even
 * when their JavaScript .length values match.
 */
export function matchesOperatorToken(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;

  const providedBytes = Buffer.from(provided, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(providedBytes, expectedBytes);
}
