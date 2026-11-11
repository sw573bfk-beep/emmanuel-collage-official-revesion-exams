-- Codes that students type into their profile (5 letters/numbers, not case sensitive, each works once):
--   theory = unlocks the completed Science booklet, top = Top tier admin, basic = Basic admin, tester = Official tester banner
-- role: 'top' or 'basic' (helpers with a limited dashboard; Beau, the owner, is still ADMIN_USERNAME). tester: profile banner only.
ALTER TABLE users ADD COLUMN role TEXT;
ALTER TABLE users ADD COLUMN tester INTEGER NOT NULL DEFAULT 0;
-- the old 6-digit booklet codes that were never used are turned off (anyone already unlocked stays unlocked)
DELETE FROM codes WHERE redeemed_by IS NULL AND length(code) = 6;
