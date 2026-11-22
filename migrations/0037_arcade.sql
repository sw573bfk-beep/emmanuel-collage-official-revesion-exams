-- 🕹️ Arcade (just for fun: nothing here touches points, study time or stats)
CREATE TABLE IF NOT EXISTS arcade_runs (    -- a game in progress (so scores can be checked against real time)
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  day TEXT NOT NULL,
  started_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_arcade_runs_user ON arcade_runs (user_id, started_at);
CREATE TABLE IF NOT EXISTS arcade_scores (  -- each person's best per game per day
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  day TEXT NOT NULL,
  best INTEGER NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  at INTEGER,
  PRIMARY KEY (user_id, game, day)
);
CREATE INDEX IF NOT EXISTS idx_arcade_scores_day ON arcade_scores (game, day, best);
