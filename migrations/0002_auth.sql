CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE external_identities (
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  picture_url TEXT,
  PRIMARY KEY (provider, subject)
);

CREATE INDEX external_identities_user_id ON external_identities (user_id);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX sessions_user_id ON sessions (user_id);

CREATE TABLE auth_handoffs (
  id TEXT PRIMARY KEY,
  poll_token_hash TEXT NOT NULL,
  oauth_state TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  session_token TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
