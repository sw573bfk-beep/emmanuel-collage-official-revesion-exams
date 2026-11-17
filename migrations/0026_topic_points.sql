-- Stop farming right-answer points:
-- topic_best = the most right answers ever saved for each topic, so the same answers never earn points twice
--              (re-saving, a second tab or an old copy). Filled in from everyone's saved progress now.
-- topic_daily = right answers that earned points per topic per day (max 25 per topic per day).
CREATE TABLE IF NOT EXISTS topic_best (user_id INTEGER NOT NULL, subject TEXT NOT NULL, topic TEXT NOT NULL, best INTEGER NOT NULL, PRIMARY KEY (user_id, subject, topic));
CREATE TABLE IF NOT EXISTS topic_daily (user_id INTEGER NOT NULL, day TEXT NOT NULL, subject TEXT NOT NULL, topic TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (user_id, day, subject, topic));
INSERT OR IGNORE INTO topic_best (user_id, subject, topic, best)
  SELECT p.user_id, p.subject, j.key, CAST(COALESCE(json_extract(j.value, '$.c'), 0) AS INTEGER)
  FROM progress p, json_each(p.data, '$.tstats') j WHERE p.subject IN ('maths', 'science') AND json_valid(p.data);
