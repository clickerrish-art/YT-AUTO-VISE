export const HISTORY_EVIDENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * A remote channel-history snapshot is usable for at most 24 elapsed hours.
 * Keep the clock injectable so freshness boundaries can be tested deterministically.
 */
export function isFreshHistoryEvidence(value, now = Date.now()) {
  const timestamp = Date.parse(value);
  const nowTimestamp = now instanceof Date ? now.getTime() : Number(now);
  return Number.isFinite(timestamp)
    && Number.isFinite(nowTimestamp)
    && timestamp <= nowTimestamp
    && nowTimestamp - timestamp <= HISTORY_EVIDENCE_MAX_AGE_MS;
}
