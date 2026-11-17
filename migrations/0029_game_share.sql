-- 🎮 Beau can share a game to everyone's screen: the pop-up carries the game's code and a Join button.
ALTER TABLE broadcasts ADD COLUMN game TEXT;
-- a shared game takes more players than a friends' game
ALTER TABLE games ADD COLUMN shared INTEGER NOT NULL DEFAULT 0;
