CREATE TABLE IF NOT EXISTS runner_control (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  session_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'RELEASED')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  release_reason TEXT
);
