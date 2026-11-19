-- 🙈 "Hide me from the leaderboard": hidden people still see their own place; nobody else sees them (Beau still does).
ALTER TABLE users ADD COLUMN lb_hidden INTEGER NOT NULL DEFAULT 0;
