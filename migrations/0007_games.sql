-- Live games with friends: a host makes a game with a 6-digit code, friends join, everyone answers
-- questions at their own pace. Modes: speed (quick answers score more), treasure (open a chest after
-- each right answer) and parkour (right answers give energy to run a parkour course).
CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  host_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  diff TEXT NOT NULL,
  mode TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby', -- lobby | live | ended
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  ends_at INTEGER
);
CREATE TABLE game_players (
  game_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,   -- points (speed) or gold (treasure)
  energy INTEGER NOT NULL DEFAULT 0,  -- parkour
  dist INTEGER NOT NULL DEFAULT 0,    -- parkour metres
  streak INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  answered INTEGER NOT NULL DEFAULT 0,
  chest INTEGER NOT NULL DEFAULT 0,   -- a chest is waiting to be opened (treasure)
  last_ms INTEGER NOT NULL DEFAULT 0, -- time of the last answer (ms), to stop spamming
  finished_at INTEGER,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (game_id, user_id)
);
CREATE TABLE game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  at INTEGER NOT NULL,
  text TEXT NOT NULL
);
CREATE INDEX game_events_game ON game_events (game_id, id);
