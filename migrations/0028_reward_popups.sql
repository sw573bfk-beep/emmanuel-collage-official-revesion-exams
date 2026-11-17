-- 🎉 reward pop-ups: rewards_new = rewards just unlocked that the person hasn't been shown yet;
-- rewards_at = when we last checked (so the check runs at most every 90 seconds).
ALTER TABLE users ADD COLUMN rewards_new TEXT;
ALTER TABLE users ADD COLUMN rewards_at INTEGER NOT NULL DEFAULT 0;
