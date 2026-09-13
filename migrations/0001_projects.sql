CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  updated_at TEXT NOT NULL,
  document TEXT NOT NULL
);

CREATE INDEX projects_owner_id ON projects (owner_id);
