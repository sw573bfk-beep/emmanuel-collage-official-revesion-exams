-- 🎯 each student's weekly goals, e.g. {"minutes":60,"questions":50} (0 or missing = no goal)
ALTER TABLE users ADD COLUMN goals TEXT;
