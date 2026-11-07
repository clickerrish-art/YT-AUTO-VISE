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


## Operator retry authorization and dead-letter recovery

Worker-local cooldown persistence is not an authorization to retry a failed content job. The durable content-job lifecycle enforces a separate operator decision:

- A worker may claim only a `QUEUED` job. It cannot convert `FAILED` or `DEAD_LETTER` to `QUEUED`, even after `nextRetryAt` has elapsed.
- The generic `POST /api/jobs/transition` route rejects `FAILED → QUEUED` and `DEAD_LETTER → QUEUED`.
- An authenticated operator uses `POST /api/jobs/retry` with `jobId` and a review reason (8–1000 characters). The server derives the actor from the authenticated operator identity; a caller-supplied actor is not trusted.
- A retryable `FAILED` job may be authorized only after its persisted backoff timestamp has elapsed. The authorization is stored on the job and in the audit ledger, including actor, reason, attempt count, prior limit and timestamp.
- When a retryable failure reaches `maxAttempts`, the job enters `DEAD_LETTER`, retains its error evidence, clears its worker lease and records a dead-letter history entry. Non-retryable failures remain `FAILED`.
- A dead-letter job cannot be retried by an ordinary authorization. An operator must explicitly set `overrideRetryLimit: true` and record a review reason. This increases the attempt ceiling by exactly one; if that attempt fails retryably, the job returns to `DEAD_LETTER` and requires another explicit review.
- Dead-letter creation and recovery are durable audit events. The dashboard exposes the eligible failed/dead-letter jobs, operator reason and one-attempt override control. Dead-letter jobs can also be cancelled while retaining history.

The retry endpoint is operator-authenticated and is not in the worker-token route allowlist. The worker remains unable to upload or publish. The policy does not override the private-upload, emergency-stop, rights, metadata or human-review gates.
