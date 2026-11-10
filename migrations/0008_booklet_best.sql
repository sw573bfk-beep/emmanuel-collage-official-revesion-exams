-- Leaderboard: booklet points are only given for beating your best number of booklet answers marked right
-- (so marking an answer wrong and then right again, or clearing and re-marking, can't farm points).
CREATE TABLE booklet_best (
  user_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  best INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, subject)
);
