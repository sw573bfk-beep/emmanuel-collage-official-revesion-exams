-- ⭐ Rate the site: the 5-question form on every page (stars + four questions + anything else).
CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  stars INTEGER NOT NULL,
  liked TEXT, disliked TEXT, add_idea TEXT, control TEXT, other TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_surveys_created ON surveys (created_at);
