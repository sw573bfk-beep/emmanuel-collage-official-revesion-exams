-- 📣 Message everyone: remind = 1 means "keep reminding people who haven't rated the site": it pops up again
-- every hour for them (even after ✕) and stops once they've sent a ⭐ rating.
ALTER TABLE broadcasts ADD COLUMN remind INTEGER NOT NULL DEFAULT 0;
