-- Chats between students now need both students to agree AND Beau to approve the pair.
-- Chats that were already open go back to "waiting for Beau" so every pair is checked once.
UPDATE dm_threads SET status = 'approval' WHERE status = 'active';
