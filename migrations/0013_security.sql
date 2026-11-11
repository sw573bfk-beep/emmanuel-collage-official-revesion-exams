-- Security hardening.
-- 1. Play with friends: the server makes each player's question and keeps the right answer here,
--    so the browser can't claim answers were right.
ALTER TABLE game_players ADD COLUMN q TEXT;
-- 2. Study time: a per-person clock, so several tabs (or fake pings) can't count the same minute twice.
ALTER TABLE users ADD COLUMN study_clock INTEGER NOT NULL DEFAULT 0;
-- 3. Limits per device (IP address, stored only as a hash) for logins, sign-ups and unlock codes.
CREATE TABLE IF NOT EXISTS rate_hits (
  k TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_hits_k ON rate_hits(k, at);
-- 4. A log of admin logins (and failed tries on the admin account) so Beau can spot anyone trying.
CREATE TABLE IF NOT EXISTS admin_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  ok INTEGER NOT NULL,
  ip_hash TEXT,
  place TEXT,
  device TEXT
);
