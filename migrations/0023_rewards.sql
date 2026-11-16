-- 🎨 Profile rewards: look = the picture, frame and title someone chose (reward ids, JSON).
-- rewards = the rewards they've unlocked so far (kept even if, say, their streak ends).
ALTER TABLE users ADD COLUMN look TEXT;
ALTER TABLE users ADD COLUMN rewards TEXT;
