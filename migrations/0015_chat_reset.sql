-- Fresh start for chat (Beau asked for this before showing the teachers).
-- Deleted: friendships, friend requests and 1-on-1 messages; chat reports; every "Message Beau" chat
-- (including old booklet / chat / study requests); the filter log; all feedback.
-- Kept: accounts, passwords, progress, booklet unlocks, study time, the leaderboard, and each student's Block list.
DELETE FROM chat_reports;
DELETE FROM dm_messages;
DELETE FROM dm_threads;
DELETE FROM group_messages;
DELETE FROM messages;
DELETE FROM filter_log;
DELETE FROM feedback;
UPDATE users SET chat_req = NULL, study_req = NULL, group_read = 0;
