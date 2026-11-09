-- Student chats (one group chat + 1-on-1 chats that start with a request), blocking, reports,
-- moderation, a log of messages the filter stopped, and points for the leaderboard.
ALTER TABLE users ADD COLUMN chat_muted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN group_read INTEGER NOT NULL DEFAULT 0;

CREATE TABLE dm_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a INTEGER NOT NULL,              -- the two students, a < b
  b INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | declined | blocked
  requested_by INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  a_read INTEGER NOT NULL DEFAULT 0, -- last message id each side has read
  b_read INTEGER NOT NULL DEFAULT 0,
  UNIQUE (a, b)
);
CREATE TABLE dm_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX dm_messages_thread ON dm_messages (thread_id, id);

CREATE TABLE group_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE blocks (
  user_id INTEGER NOT NULL,
  blocked_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, blocked_id)
);

CREATE TABLE chat_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  kind TEXT NOT NULL,              -- dm | group
  message_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

-- what the filter stopped (for Beau to keep an eye on bullying); text is kept short
CREATE TABLE filter_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  place TEXT NOT NULL,
  why TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- leaderboard points earned each day (study minutes come from the existing daily table)
CREATE TABLE points_daily (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  correct INTEGER NOT NULL DEFAULT 0,
  booklet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
