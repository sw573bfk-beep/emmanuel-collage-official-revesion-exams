-- 📈 Every answered practice/test question (for stats, "My mistakes", problem questions and the admin student search)
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  gen TEXT NOT NULL,
  gname TEXT,
  diff TEXT,
  typ TEXT,
  ok INTEGER NOT NULL,
  q TEXT,
  given TEXT,
  correct TEXT
);
CREATE INDEX IF NOT EXISTS idx_answers_user ON answers (user_id, id);
CREATE INDEX IF NOT EXISTS idx_answers_at ON answers (at);
CREATE INDEX IF NOT EXISTS idx_answers_gen ON answers (gen, at);
-- 🎯 Daily challenge: 5 mixed questions a day (the same for everyone), marked by the server
CREATE TABLE IF NOT EXISTS challenge (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  answers TEXT NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  pts INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  done_at INTEGER,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_challenge_day ON challenge (day, done);
