-- Accounts can be left out of the admin dashboard's stats (the admin's own account, test accounts).
ALTER TABLE users ADD COLUMN in_stats INTEGER NOT NULL DEFAULT 1;
UPDATE users SET in_stats = 0 WHERE username IN ('Beau', 'test 1');
