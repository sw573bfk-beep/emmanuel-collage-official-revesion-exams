-- One-use unlock codes for the completed theory booklet.
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,
  feature TEXT NOT NULL DEFAULT 'theory',
  created_at INTEGER NOT NULL,
  redeemed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at INTEGER
);

-- Which accounts have unlocked what. Permanent once added.
CREATE TABLE IF NOT EXISTS unlocks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  code TEXT,
  PRIMARY KEY (user_id, feature)
);

-- Wrong code attempts, to stop people guessing 6-digit codes.
CREATE TABLE IF NOT EXISTS unlock_attempts (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS unlock_attempts_user ON unlock_attempts(user_id, at);

-- Locked content (the completed theory booklet). It lives only here, never in the public code.
CREATE TABLE IF NOT EXISTS content (
  key TEXT PRIMARY KEY,
  ord INTEGER NOT NULL,
  body TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
