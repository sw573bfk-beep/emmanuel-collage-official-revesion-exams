-- "Message everyone": a pop-up announcement from Beau. It shows for anyone who has the site open
-- when it's sent, until ends_at (or until Beau stops it early, which sets ends_at to that moment).
CREATE TABLE broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  stopped_at INTEGER
);
CREATE INDEX broadcasts_ends ON broadcasts(ends_at);
