-- Study mode for everyone can now turn on and off by itself at set times (Queensland time), and Beau can still
-- flip the switch whenever. study_free_at = when Beau let someone out; it only counts until study mode next turns on.
ALTER TABLE users ADD COLUMN study_free_at INTEGER NOT NULL DEFAULT 0;
INSERT OR IGNORE INTO settings (key, value) VALUES ('study_sched', '{"enabled":true,"on":"09:00","off":"15:10","days":[1,2,3,4,5]}');
