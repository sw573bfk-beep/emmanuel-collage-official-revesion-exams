-- 🎲 Lucky drops: every right answer is a roll (1 in 100 RARE, 1 in 1,000 EPIC, 1 in 10,000 LEGENDARY, 1 in 100,000 INSANE)
CREATE TABLE IF NOT EXISTS drops (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,            -- the drop title's reward id (t_x_...)
  n INTEGER NOT NULL DEFAULT 0, -- times pulled
  first_at INTEGER,
  last_at INTEGER,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_drops_id ON drops (id);
ALTER TABLE users ADD COLUMN rolls INTEGER NOT NULL DEFAULT 0;   -- rolls ever
ALTER TABLE users ADD COLUMN roll_state TEXT;                    -- {"day":"2026-11-22","a":12,"t":1}: today's answer rolls and test bonuses
ALTER TABLE users ADD COLUMN ch_done INTEGER NOT NULL DEFAULT 0; -- daily challenges finished (the challenge table is pruned)
-- challenges finished so far count too
UPDATE users SET ch_done = (SELECT COUNT(*) FROM challenge c WHERE c.user_id = users.id AND c.done = 1);
