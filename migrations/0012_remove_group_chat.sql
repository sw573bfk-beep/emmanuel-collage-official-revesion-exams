-- The everyone group chat was removed (students only chat 1-on-1 with friends now).
-- Its old messages and any reports about them are deleted, as Beau asked.
DELETE FROM chat_reports WHERE kind = 'group';
DELETE FROM group_messages;
