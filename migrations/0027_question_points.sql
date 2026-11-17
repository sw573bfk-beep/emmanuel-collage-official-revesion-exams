-- Harder questions earn more: each right answer is worth 1-5 points (easy multiple choice 1 ... hard typed 5,
-- long response 5) instead of a flat 2. qpts = those points per day. Past days keep what they earned (2 each).
ALTER TABLE points_daily ADD COLUMN qpts INTEGER NOT NULL DEFAULT 0;
UPDATE points_daily SET qpts = 2 * correct;
-- the most question-points ever saved per topic (so they can't be counted twice, like topic_best.best)
ALTER TABLE topic_best ADD COLUMN bestp INTEGER NOT NULL DEFAULT 0;
