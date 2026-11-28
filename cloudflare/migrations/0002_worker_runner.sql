-- Durable render-worker control, retry state, and multipart artifact ledger.
CREATE TABLE IF NOT EXISTS runner_state (
  worker_id TEXT PRIMARY KEY, revision INTEGER NOT NULL CHECK (revision >= 1),
  state_json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS runner_control (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1), session_id TEXT NOT NULL,
  worker_id TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('ACTIVE','RELEASED')),
  started_at TEXT NOT NULL, completed_at TEXT, release_reason TEXT
);
CREATE TABLE IF NOT EXISTS runner_artifacts (
  artifact_id TEXT PRIMARY KEY, job_id TEXT NOT NULL, source_path TEXT NOT NULL,
  artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('video','thumbnail','metadata')),
  filename TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, upload_id TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64), size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  part_size_bytes INTEGER NOT NULL CHECK (part_size_bytes >= 5242880),
  expected_parts INTEGER NOT NULL CHECK (expected_parts >= 1), content_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('UPLOADING','READY','FAILED')),
  etag TEXT, created_at TEXT NOT NULL, completed_at TEXT, UNIQUE (job_id,source_path,sha256)
);
CREATE TABLE IF NOT EXISTS runner_artifact_parts (
  artifact_id TEXT NOT NULL, part_number INTEGER NOT NULL CHECK (part_number >= 1), etag TEXT NOT NULL,
  PRIMARY KEY (artifact_id,part_number),
  FOREIGN KEY (artifact_id) REFERENCES runner_artifacts (artifact_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS runner_artifacts_job_status_idx ON runner_artifacts (job_id,status);
