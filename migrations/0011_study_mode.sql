-- Study mode: students can only use Maths, Science and Play with friends (no chat, Beau tab,
-- leaderboard or feedback). Beau sets it per person, or for everyone with the site-wide switch.
-- study_mode = Beau put this person in study mode; study_free = Beau let them out while the
-- site-wide switch is on; study_req = when they asked to leave study mode (cleared when answered).
ALTER TABLE users ADD COLUMN study_mode INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN study_free INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN study_req INTEGER;
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
