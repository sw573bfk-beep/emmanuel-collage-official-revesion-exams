-- One new account per browser ("laptop"). Each browser keeps a random ID (acct.js) and sends it with every request.
-- made_on = the browser an account was made on. user_devices = every browser an account has logged in from.
-- device_allow = Beau let this browser make extra accounts.
ALTER TABLE users ADD COLUMN made_on TEXT;
CREATE INDEX IF NOT EXISTS idx_users_made_on ON users (made_on);
CREATE TABLE IF NOT EXISTS user_devices (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (user_id, device)
);
CREATE INDEX IF NOT EXISTS idx_user_devices_device ON user_devices (device);
CREATE TABLE IF NOT EXISTS device_allow (device TEXT PRIMARY KEY, extra INTEGER NOT NULL DEFAULT 0);
