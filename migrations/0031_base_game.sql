-- 🏰 Study Base (admin test version): each player's base, saved as one JSON document
CREATE TABLE IF NOT EXISTS base_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
