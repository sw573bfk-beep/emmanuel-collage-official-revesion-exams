-- "Message Beau": a simple private chat between each student and the admin.
-- from_admin = 1 for Beau's replies. read_at is when the other side read it.
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  from_admin INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX messages_user ON messages (user_id, id);
CREATE INDEX messages_unread ON messages (from_admin, read_at);
