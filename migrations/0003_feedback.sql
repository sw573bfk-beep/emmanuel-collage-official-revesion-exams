-- Feedback sent from the Feedback page. The name is copied in so it stays readable if the account is deleted.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_created ON feedback(created_at);
