// 🎨 Profile rewards: pictures (a), frames (f) and titles (t) that students unlock by studying, then show off
// on the leaderboard, in chat and on their profile button. Everything is worked out from points and progress
// they already have. Correct answers use the leaderboard's count (it has daily caps, so it can't be farmed).
//
// s = { correct, answered, streak, hours, exams: [{n, p, lim}], explorer, booklet, friends, points,
//       weekRank, allRank, mathsCorrect, sciCorrect, tester, teacher, role, owner }

const R = (id, k, v, name, need, test) => ({ id, k, v, name, need, test });
const ge = (have, n) => [Math.min(have || 0, n), n];
const flag = b => [b ? 1 : 0, 1];
const top = (rank, n) => [rank && rank <= n ? 1 : 0, 1];

export const REWARDS = [
  // 🖼️ profile pictures
  R('a_smile', 'a', '🙂', 'Smiley', 'Free', () => [1, 1]),
  R('a_book', 'a', '📖', 'Book', 'Free', () => [1, 1]),
  R('a_pencil', 'a', '✏️', 'Pencil', 'Free', () => [1, 1]),
  R('a_seed', 'a', '🌱', 'Sprout', 'Answer your first question', s => ge(s.answered, 1)),
  R('a_pizza', 'a', '🍕', 'Pizza', 'Get 50 answers right', s => ge(s.correct, 50)),
  R('a_cat', 'a', '🐱', 'Cat', 'Get 100 answers right', s => ge(s.correct, 100)),
  R('a_fox', 'a', '🦊', 'Fox', 'Get 250 answers right', s => ge(s.correct, 250)),
  R('a_dragon', 'a', '🐉', 'Dragon', 'Get 500 answers right', s => ge(s.correct, 500)),
  R('a_unicorn', 'a', '🦄', 'Unicorn', 'Get 1000 answers right', s => ge(s.correct, 1000)),
  R('a_fire', 'a', '🔥', 'Fire', 'Study 3 days in a row', s => ge(s.streak, 3)),
  R('a_bolt', 'a', '⚡', 'Lightning', 'Study 7 days in a row', s => ge(s.streak, 7)),
  R('a_volcano', 'a', '🌋', 'Volcano', 'Study 14 days in a row', s => ge(s.streak, 14)),
  R('a_clock', 'a', '⏰', 'Alarm clock', 'Study for 1 hour in total', s => ge(Math.floor(s.hours * 10) / 10, 1)),
  R('a_owl', 'a', '🦉', 'Owl', 'Study for 5 hours in total', s => ge(Math.floor(s.hours * 10) / 10, 5)),
  R('a_brain', 'a', '🧠', 'Brain', 'Study for 10 hours in total', s => ge(Math.floor(s.hours * 10) / 10, 10)),
  R('a_rocket', 'a', '🚀', 'Rocket', 'Study for 25 hours in total', s => ge(Math.floor(s.hours * 10) / 10, 25)),
  R('a_memo', 'a', '📝', 'Test paper', 'Finish a timed test', s => ge(s.exams.length, 1)),
  R('a_flag', 'a', '🏁', 'Chequered flag', 'Finish a speedrun (5 minutes or less)', s => ge(s.exams.filter(e => e.lim > 0 && e.lim <= 5).length, 1)),
  R('a_trophy', 'a', '🏆', 'Trophy', 'Score 90% or more on a test of 10+ questions', s => ge(s.exams.filter(e => (e.n || 0) >= 10 && (e.p || 0) >= 90).length, 1)),
  R('a_map', 'a', '🗺️', 'Map', 'Practise every topic in Maths or Science', s => flag(s.explorer)),
  R('a_blue', 'a', '📘', 'Blue book', 'Mark 50 booklet questions', s => ge(s.booklet, 50)),
  R('a_hands', 'a', '🤝', 'Handshake', 'Make a friend', s => ge(s.friends, 1)),
  R('a_party', 'a', '🥳', 'Party', 'Have 5 friends', s => ge(s.friends, 5)),
  R('a_crown', 'a', '👑', 'Crown', 'Be in the top 3 on the weekly leaderboard', s => top(s.weekRank, 3)),
  R('a_goat', 'a', '🐐', 'GOAT', 'Be #1 on the all-time leaderboard', s => top(s.allRank, 1)),
  R('a_tube', 'a', '🧪', 'Test tube', 'Official testers only', s => flag(s.tester)),
  R('a_apple', 'a', '🍎', 'Apple', 'Teachers only', s => flag(s.teacher)),
  R('a_shield', 'a', '🛡️', 'Shield', 'Admins only', s => flag(s.role)),
  // 🖼️ frames (rings around the picture)
  R('f_none', 'f', 'none', 'No frame', 'Free', () => [1, 1]),
  R('f_bronze', 'f', 'bronze', 'Bronze', 'Earn 100 points (all time)', s => ge(s.points, 100)),
  R('f_silver', 'f', 'silver', 'Silver', 'Earn 500 points (all time)', s => ge(s.points, 500)),
  R('f_gold', 'f', 'gold', 'Gold', 'Earn 1500 points (all time)', s => ge(s.points, 1500)),
  R('f_diamond', 'f', 'diamond', 'Diamond', 'Earn 4000 points (all time)', s => ge(s.points, 4000)),
  R('f_fire', 'f', 'fire', 'On fire', 'Study 7 days in a row', s => ge(s.streak, 7)),
  R('f_rainbow', 'f', 'rainbow', 'Rainbow (animated)', 'Be #1 on the weekly leaderboard', s => top(s.weekRank, 1)),
  // 🏷️ titles (under your name)
  R('t_none', 't', '', 'No title', 'Free', () => [1, 1]),
  R('t_student', 't', 'Student', 'Student', 'Free', () => [1, 1]),
  R('t_rookie', 't', 'Rookie', 'Rookie', 'Answer your first question', s => ge(s.answered, 1)),
  R('t_sharp', 't', 'Sharp Shooter', 'Sharp Shooter', 'Get 50 answers right', s => ge(s.correct, 50)),
  R('t_maths', 't', 'Equation Master', 'Equation Master', 'Get 100 Maths answers right', s => ge(s.mathsCorrect, 100)),
  R('t_sci', 't', 'Chemistry Whiz', 'Chemistry Whiz', 'Get 100 Science answers right', s => ge(s.sciCorrect, 100)),
  R('t_book', 't', 'Bookworm', 'Bookworm', 'Study for 5 hours in total', s => ge(Math.floor(s.hours * 10) / 10, 5)),
  R('t_streak', 't', 'Streak Legend', 'Streak Legend', 'Study 14 days in a row', s => ge(s.streak, 14)),
  R('t_speed', 't', 'Speedrunner', 'Speedrunner', 'Finish a speedrun (5 minutes or less)', s => ge(s.exams.filter(e => e.lim > 0 && e.lim <= 5).length, 1)),
  R('t_ace', 't', 'Top of the Class', 'Top of the Class', 'Score 90% or more on a test of 10+ questions', s => ge(s.exams.filter(e => (e.n || 0) >= 10 && (e.p || 0) >= 90).length, 1)),
  R('t_explorer', 't', 'Explorer', 'Explorer', 'Practise every topic in Maths or Science', s => flag(s.explorer)),
  R('t_social', 't', 'Social Butterfly', 'Social Butterfly', 'Have 5 friends', s => ge(s.friends, 5)),
  R('t_legend', 't', 'Legend', 'Legend', 'Earn 4000 points (all time)', s => ge(s.points, 4000)),
  R('t_champ', 't', 'Champion', 'Champion', 'Be #1 on the weekly leaderboard', s => top(s.weekRank, 1)),
  R('t_tester', 't', 'Official Tester', 'Official Tester', 'Official testers only', s => flag(s.tester)),
  R('t_teacher', 't', 'Teacher', 'Teacher', 'Teachers only', s => flag(s.teacher)),
  R('t_admin', 't', 'Admin', 'Admin', 'Admins only', s => flag(s.role)),
  R('t_owner', 't', 'Owner', 'Owner', 'Beau only', s => flag(s.owner))
];
const BY_ID = Object.fromEntries(REWARDS.map(r => [r.id, r]));
export const FREE = new Set(REWARDS.filter(r => r.need === 'Free').map(r => r.id));
// role rewards come and go with the role; everything else, once earned, is kept (stored in users.rewards)
const ROLE_ONLY = new Set(['a_tube', 'a_apple', 'a_shield', 't_tester', 't_teacher', 't_admin', 't_owner']);

const parse = (s, d) => { try { const v = JSON.parse(s || 'null'); return v == null ? d : v; } catch { return d; } };
export const savedRewards = json => new Set((parse(json, []) || []).filter(id => BY_ID[id] && !ROLE_ONLY.has(id)));

// every reward with its progress. kept = what this person has unlocked before (stays unlocked).
export function rewardStatus(s, kept) {
  return REWARDS.map(r => {
    let [have, need] = r.test(s); const earned = have >= need || (kept && kept.has(r.id));
    if (earned) have = need;
    return { id: r.id, k: r.k, v: r.v, name: r.name, need: r.need, have, needN: need, earned };
  });
}
// ids that should now be stored as unlocked (role-only ones are worked out fresh each time)
export const keepIds = status => status.filter(x => x.earned && !FREE.has(x.id) && !ROLE_ONLY.has(x.id)).map(x => x.id);
// may this person use reward id? (free, unlocked before, or their role allows it)
export function canUse(id, kept, roleFlags) {
  const r = BY_ID[id]; if (!r) return false;
  if (FREE.has(id) || kept.has(id)) return true;
  if (ROLE_ONLY.has(id)) return r.test({ ...roleFlags, exams: [] })[0] >= 1;
  return false;
}
// what other people see: { a: '🍕', f: 'gold', t: 'Equation Master' } (or null if they haven't chosen anything)
export function lookView(json) {
  const o = parse(json, null); if (!o || typeof o !== 'object') return null;
  const a = BY_ID[o.a], f = BY_ID[o.f], t = BY_ID[o.t];
  const out = { a: a && a.k === 'a' ? a.v : null, f: f && f.k === 'f' && f.v !== 'none' ? f.v : null, t: t && t.k === 't' && t.v ? t.v : null };
  return out.a || out.f || out.t ? out : null;
}
// 🎉 what the pop-up says: "You got 50 answers right."
const PAST = [[/^Get /, 'You got '], [/^Study /, 'You studied '], [/^Answer /, 'You answered '], [/^Finish /, 'You finished '], [/^Score /, 'You scored '], [/^Practise /, 'You practised '],
  [/^Mark /, 'You marked '], [/^Make /, 'You made '], [/^Have /, 'You have '], [/^Be /, 'You were '], [/^Earn /, 'You earned ']];
export function rewardPopup(id) {
  const r = BY_ID[id]; if (!r) return null;
  let why = r.need; for (const [re, to] of PAST) if (re.test(why)) { why = why.replace(re, to); break; }
  return { id, k: r.k, v: r.v, name: r.name, why: why.replace(/^You were be /, 'You were ') + '.' };
}
export const lookIds = json => { const o = parse(json, null); return o && typeof o === 'object' ? { a: o.a || 'a_smile', f: o.f || 'f_none', t: o.t || 't_none' } : { a: null, f: 'f_none', t: 't_none' }; };
