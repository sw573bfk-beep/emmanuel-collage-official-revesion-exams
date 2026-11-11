-- Chat access: students must ask Beau before they can see or use the group chat and friends.
-- chat_access = 1 once Beau allows it; chat_req = when they asked (cleared when Beau answers).
ALTER TABLE users ADD COLUMN chat_access INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN chat_req INTEGER;
