-- Beau can change someone's name. prev_name keeps their old one so they can still log in with it
-- and their open tabs and saved logins keep working.
ALTER TABLE users ADD COLUMN prev_name TEXT;
