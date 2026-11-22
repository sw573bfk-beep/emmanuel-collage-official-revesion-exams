-- 🍀 every lucky-drop pull, with when (for the weekly "Luckiest of the week" News post). Pruned after 60 days.
CREATE TABLE IF NOT EXISTS drop_log (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  rar TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drop_log_at ON drop_log (at);
