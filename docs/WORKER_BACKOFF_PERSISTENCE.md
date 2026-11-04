# Worker retry-backoff persistence

The scoped content-render worker persists both preflight-conflict and HTTP 429 rate-limit backoff so a process restart cannot reset a blocked job to an immediate retry.

## Configuration

- `WORKER_STATE_DIR` selects the private, persistent directory for worker state. It defaults to `run-logs`.
- `WORKER_BACKOFF_STATE_PATH` optionally overrides the exact retry-state file path. Its parent directory must already exist and must not contain symlinks.
- Without an explicit file path, the worker derives a worker-specific filename from the SHA-256 of `DASHBOARD_WORKER_ID`.

The worker writes retry state atomically with mode `0600`. Keep the directory on persistent storage and restrict it to the service account. Do not put it in a temporary directory or a source-controlled directory.

## Failure behavior

- A HTTP 409 preflight conflict receives bounded exponential backoff from 30 seconds to 15 minutes.
- A HTTP 429 rate-limit response from either queue listing or render dispatch honors numeric-seconds or HTTP-date `Retry-After` values, subject to a 15-minute maximum. Queue-listing rate limits delay the next poll; render-dispatch rate limits persist the job-specific cooldown across restarts. Invalid or expired values fall back to the bounded exponential delay.
- Attempt counts and absolute next-attempt timestamps are saved after each dispatch result. A successful dispatch clears that job's cooldown.
- A POST transport failure, timeout, unreadable response, HTTP 408 or HTTP 5xx is treated as an uncertain dispatch outcome. The worker stops and requires reconciliation instead of blindly retrying a possibly accepted render request.
- If retry-state persistence fails, the worker stops rather than polling and redispatching without a durable cooldown.

If the state file is corrupt, belongs to another worker identity, has an invalid schema, or is a symlink/non-regular file, the worker stops instead of silently clearing the retry delay. Repair the state file from a trusted backup or remove it only after an operator has confirmed that resetting the backoff is safe.

The worker remains least-privilege: it can list dispatchable jobs and call the renderer endpoint only. It does not upload or publish content.
