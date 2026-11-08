CREATE TABLE IF NOT EXISTS runner_state (
  worker_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
