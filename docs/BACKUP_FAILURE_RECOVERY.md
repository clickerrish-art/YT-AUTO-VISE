# Backup failure and interrupted-process recovery

Backup creation is atomic at the final filename. The backup is first written to a unique same-directory temporary file, flushed, and linked to the final destination without overwriting an existing backup. A handled write failure removes its temporary file and releases the shared state-operation lock.

A hard process kill cannot run cleanup handlers. In that case, the final backup filename is not published, the staged `*.tmp` file may remain, and `state/.restore-operation.lock` remains in place. This is deliberate fail-closed behavior: another backup or restore must not assume the interrupted operation completed.

## Operator recovery after an interrupted backup

1. Stop the backup service or command and confirm that no backup/restore process is still running.
2. Read `state/.restore-operation.lock`. Confirm `operation` is `backup`, record its `pid` and `createdAt`, and inspect the process with `ps -p <pid> -o pid,stat,args`. Do not remove the lock while that process is alive. If the PID has been reused or the process identity is uncertain, investigate before proceeding.
3. Inspect the configured backup output directory for a temporary file matching the interrupted backup's destination prefix and timestamp. Do not remove unrelated `*.tmp` files.
4. Confirm the final backup file was never created and that the original state files remain present. If a final backup exists, verify its complete JSON, entry checksums and top-level SHA-256 before treating it as usable.
5. Remove only the identified temporary backup file. Re-read the lock and confirm its token, PID and operation are unchanged; then remove that exact stale lock only after the owning process is confirmed dead.
6. Run a new backup to a fresh destination and verify the resulting checksums before relying on it.

Never delete a lock merely because it is old. Never overwrite an existing backup. If the temporary file, lock owner or final backup cannot be unambiguously identified, preserve all files and escalate for manual recovery.
