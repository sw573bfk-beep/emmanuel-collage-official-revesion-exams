-- 🎯 Focus mode: a student can hide everything except Maths, Science, English and Beau's announcements.
-- focus_until: 0 = off, -1 = on until they turn it off, otherwise the time it turns off by itself.
ALTER TABLE users ADD COLUMN focus_until INTEGER NOT NULL DEFAULT 0;
