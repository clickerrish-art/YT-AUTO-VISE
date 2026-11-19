-- Durable dashboard state and immutable backup snapshots.
CREATE TABLE IF NOT EXISTS dashboard_state (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dashboard_backups (
  backup_id TEXT PRIMARY KEY,
  source_revision INTEGER NOT NULL,
  state_json TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS dashboard_backups_created_at_idx ON dashboard_backups (created_at DESC);
