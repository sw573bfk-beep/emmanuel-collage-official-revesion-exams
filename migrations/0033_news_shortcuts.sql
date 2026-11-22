-- 🏠 the shortcuts each student picked for the top of their home page (JSON list; empty = the usual three)
ALTER TABLE users ADD COLUMN home_chips TEXT;
-- 📰 the newest news post each person has seen (for the red dot)
ALTER TABLE users ADD COLUMN news_seen INTEGER NOT NULL DEFAULT 0;
-- 📰 News: posts by admins, plus automatic ones (weekly winners, milestones, records, challenge stars).
-- `key` stops an automatic post being made twice (e.g. 'winners:2026-11-16').
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  author TEXT,
  author_id INTEGER,
  pinned INTEGER NOT NULL DEFAULT 0,
  key TEXT UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_news_created ON news (created_at);
-- the first posts (about what's new), from Beau
INSERT OR IGNORE INTO news (kind, title, body, author, pinned, key, created_at) VALUES
('update', '📰 Welcome to News!', 'This is where you''ll find everything new on EC Revisions: new features, the weekly leaderboard winners, milestones, records, and shout-outs for people whose ideas get added to the site. Got an idea? Send it with Feedback or ⭐ Rate the site, and if it gets added, your name goes up here!', 'Beau', 1, 'seed:welcome', CAST(strftime('%s','now') AS INTEGER)),
('update', '🆕 A new, simpler home page', 'Tap your picture in the top right for everything: your profile, the leaderboard, chat, Play with friends, feedback, Focus mode, dark mode and more. On phones there are tabs along the bottom, and your streak, minutes today and place this week are at the top of the home page.', 'Beau', 0, 'seed:home', CAST(strftime('%s','now') AS INTEGER) - 60),
('update', '⚡ The Daily challenge is here', '5 mixed Maths and Science questions every day, the same for everyone. 4 points for every right answer, +5 for finishing and +5 more for 5 out of 5 (up to 30 points a day). Keep your challenge streak going!', 'Beau', 0, 'seed:challenge', CAST(strftime('%s','now') AS INTEGER) - 120),
('update', '📈 Your stats and ❌ My mistakes', 'Your profile now shows how many you got right in your last 20 questions, how you do on easy, medium and hard questions, your strongest topics and what to work on. My mistakes lists the questions you got wrong, so you can practise them until you get them right.', 'Beau', 0, 'seed:stats', CAST(strftime('%s','now') AS INTEGER) - 180),
('update', '📲 Install EC Revisions like an app', 'Put EC Revisions on your home screen. Android, Chrome or Edge: Menu → 📲 Install the app. iPhone: Safari → Share → Add to Home Screen.', 'Beau', 0, 'seed:app', CAST(strftime('%s','now') AS INTEGER) - 240),
('idea', '💡 Your ideas, now on the site', 'Thanks to Connor (press Enter to answer a question), King Charles (tap a number to jump to any question in a test), Keola Camacho (🙈 hide yourself from the leaderboard) and Yakov Yuan (choose your own time for a test). Keep the ideas coming!', 'Beau', 0, 'seed:ideas1', CAST(strftime('%s','now') AS INTEGER) - 300);
