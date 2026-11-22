-- 🛠️ Custom admins: Beau picks exactly what each one can do (Top tier admin stays as it was; Basic admin is replaced)
ALTER TABLE users ADD COLUMN perms TEXT; -- a JSON list of permission names, for role = 'custom'
-- everyone who was a Basic admin keeps exactly what they could do before
UPDATE users SET role = 'custom', perms = '["chats","chatDelete","studyOn","feedback","news"]' WHERE role = 'basic';
