export function startWorkerLeaseHeartbeat({
  heartbeat,
  intervalMs = 30_000,
  onFailure = () => {},
  schedule = setTimeout,
  cancel = clearTimeout
} = {}) {
  if (typeof heartbeat !== "function") throw new TypeError("heartbeat must be a function");
  if (!Number.isInteger(intervalMs) || intervalMs < 100 || intervalMs > 14 * 60_000) {
    throw new RangeError("heartbeat interval must be between 100ms and 14 minutes");
  }
  if (typeof onFailure !== "function" || typeof schedule !== "function" || typeof cancel !== "function") {
    throw new TypeError("heartbeat callbacks must be functions");
  }
  let stopped = false;
  let failure = null;
  let timer = null;
  let inFlight = Promise.resolve();
  const tick = async () => {
    if (stopped || failure) return;
    inFlight = Promise.resolve().then(heartbeat).catch(error => {
      failure = error instanceof Error ? error : new Error(String(error));
      try { onFailure(failure); } catch {}
    });
    await inFlight;
    if (!stopped && !failure) timer = schedule(tick, intervalMs);
  };
  timer = schedule(tick, intervalMs);
  timer?.unref?.();
  return {
    async stop() {
      stopped = true;
      if (timer !== null) cancel(timer);
      await inFlight;
      return failure;
    },
    get failure() { return failure; }
  };
}
