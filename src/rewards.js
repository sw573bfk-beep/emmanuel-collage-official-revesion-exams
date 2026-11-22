// 🎨 Profile rewards: pictures (a), frames (f) and titles (t). Each kind has ONE job, so there's always something clear to grind for:
//   ⭕ frames   = total questions right (the leaderboard's count, which has daily caps so it can't be farmed)
//   🖼️ pictures = showing up: your best streak and how many days you've studied
//   🏷️ titles   = achievements (subjects, tests, study time, friends, leaderboard, daily challenges, rolls)
//   🎲 lucky drops = titles you can only pull by luck (every right answer is a roll). Epic and rarer also unlock a frame and a picture.
// Anything someone unlocked before stays theirs forever, even if it's retired (it then shows under "Retired").
//
// s = { correct, answered, streak, best, days, hours, exams: [{n, p, lim}], explorer, booklet, friends, points,
//       weekRank, allRank, mathsCorrect, sciCorrect, chDone, rolls, tester, teacher, role, owner }

const R = (id, k, v, name, need, test, o = {}) => ({ id, k, v, name, need, test, g: o.g || 'free', special: !!o.special, rar: o.rar || null, ic: o.ic || null });
const ge = (have, n) => [Math.min(have || 0, n), n];
const flag = b => [b ? 1 : 0, 1];
const top = (rank, n) => [rank && rank <= n ? 1 : 0, 1];
const never = () => [0, 1];
const hrs = s => Math.floor(s.hours * 10) / 10;
const retired = (id, k, v, name, was) => R(id, k, v, name, 'Retired reward (was: ' + was + '). Yours forever.', never, { g: 'old', special: true });
const tests = (s, f) => s.exams.filter(f).length;

// the groups, in the order the profile shows them
export const GROUPS = {
  a: [['free', '🆓 Free'], ['streak', '🔥 Best streak'], ['days', '📅 Days studied'], ['drop', '🎲 Lucky drops'], ['role', '⭐ Special'], ['old', '🏛️ Retired (yours forever)']],
  f: [['free', '🆓 Free'], ['right', '✅ Questions right'], ['drop', '🎲 Lucky drops'], ['old', '🏛️ Retired (yours forever)']],
  t: [['free', '🆓 Free'], ['subj', '📚 Subjects'], ['mins', '⏱️ Minutes on EC Revisions'], ['test', '📝 Tests'], ['time', '🔥 Streaks'], ['social', '🏆 Friends and leaderboard'], ['grind', '⚡ Daily challenges and rolls'], ['drop', '🎲 Lucky drops'], ['role', '⭐ Special'], ['gift', '🎁 Gifts from Beau'], ['old', '🏛️ Retired (yours forever)']]
};

export const REWARDS = [
  // ---------- 🖼️ pictures ----------
  R('a_smile', 'a', '🙂', 'Smiley', 'Free', () => [1, 1]),
  R('a_book', 'a', '📖', 'Book', 'Free', () => [1, 1]),
  R('a_pencil', 'a', '✏️', 'Pencil', 'Free', () => [1, 1]),
  // best streak (days in a row with 1+ minute of study; your best ever counts, so a missed day never takes one away)
  ...[[2, 'a_s2', '🐣', 'Chick'], [3, 'a_fire', '🔥', 'Fire'], [5, 'a_s5', '🐺', 'Wolf'], [7, 'a_bolt', '⚡', 'Lightning'], [10, 'a_s10', '🦁', 'Lion'],
    [14, 'a_volcano', '🌋', 'Volcano'], [21, 'a_s21', '🦅', 'Eagle'], [30, 'a_s30', '🐲', 'Dragon head'], [50, 'a_s50', '☄️', 'Comet'], [100, 'a_s100', '🏔️', 'Summit']]
    .map(([n, id, v, name]) => R(id, 'a', v, name, 'Study ' + n + ' days in a row', s => ge(s.best, n), { g: 'streak' })),
  // days studied (any days, 1+ minute each)
  ...[[1, 'a_seed', '🌱', 'Sprout'], [3, 'a_d3', '🌿', 'Herb'], [5, 'a_d5', '🪴', 'Pot plant'], [7, 'a_d7', '🌳', 'Tree'], [10, 'a_d10', '🌻', 'Sunflower'], [15, 'a_d15', '🌸', 'Blossom'],
    [20, 'a_d20', '🍄', 'Mushroom'], [30, 'a_d30', '🌴', 'Palm tree'], [45, 'a_d45', '🌵', 'Cactus'], [60, 'a_d60', '🏝️', 'Island'], [100, 'a_d100', '🌍', 'The World']]
    .map(([n, id, v, name]) => R(id, 'a', v, name, 'Study on ' + n + (n === 1 ? ' day' : ' different days'), s => ge(s.days, n), { g: 'days' })),
  // 🎲 only from lucky drops
  R('a_x_epic', 'a', '🔮', 'Crystal Ball', 'Pull any EPIC drop (1 in 1,000)', never, { g: 'drop', special: true, rar: 'epic' }),
  R('a_x_leg', 'a', '🌌', 'Galaxy', 'Pull any LEGENDARY drop (1 in 10,000)', never, { g: 'drop', special: true, rar: 'leg' }),
  R('a_x_ins', 'a', '🌀', 'Singularity', 'Pull the INSANE drop (1 in 100,000)', never, { g: 'drop', special: true, rar: 'ins' }),
  // roles
  R('a_tube', 'a', '🧪', 'Test tube', 'Official testers only', s => flag(s.tester), { g: 'role' }),
  R('a_apple', 'a', '🍎', 'Apple', 'Teachers only', s => flag(s.teacher), { g: 'role' }),
  R('a_shield', 'a', '🛡️', 'Shield', 'Admins only', s => flag(s.role), { g: 'role' }),
  // retired pictures (only shown to people who already have them)
  retired('a_pizza', 'a', '🍕', 'Pizza', '50 answers right'), retired('a_cat', 'a', '🐱', 'Cat', '100 answers right'), retired('a_fox', 'a', '🦊', 'Fox', '250 answers right'),
  retired('a_dragon', 'a', '🐉', 'Dragon', '500 answers right'), retired('a_unicorn', 'a', '🦄', 'Unicorn', '1000 answers right'), retired('a_clock', 'a', '⏰', 'Alarm clock', '1 hour of study'),
  retired('a_owl', 'a', '🦉', 'Owl', '5 hours of study'), retired('a_brain', 'a', '🧠', 'Brain', '10 hours of study'), retired('a_rocket', 'a', '🚀', 'Rocket', '25 hours of study'),
  retired('a_memo', 'a', '📝', 'Test paper', 'finish a test'), retired('a_flag', 'a', '🏁', 'Chequered flag', 'a speedrun'), retired('a_trophy', 'a', '🏆', 'Trophy', '90%+ on a test'),
  retired('a_map', 'a', '🗺️', 'Map', 'practise every topic'), retired('a_blue', 'a', '📘', 'Blue book', '50 booklet questions'), retired('a_hands', 'a', '🤝', 'Handshake', 'make a friend'),
  retired('a_party', 'a', '🥳', 'Party', '5 friends'), retired('a_crown', 'a', '👑', 'Crown', 'top 3 weekly'), retired('a_goat', 'a', '🐐', 'GOAT', '#1 all time'),

  // ---------- ⭕ frames: questions right ----------
  R('f_none', 'f', 'none', 'No frame', 'Free', () => [1, 1]),
  ...[[10, 'f_wood', 'Wood'], [25, 'f_stone', 'Stone'], [50, 'f_copper', 'Copper'], [100, 'f_bronze', 'Bronze'], [200, 'f_silver', 'Silver'], [350, 'f_gold', 'Gold'],
    [500, 'f_plat', 'Platinum'], [750, 'f_emerald', 'Emerald'], [1000, 'f_sapphire', 'Sapphire'], [1500, 'f_ruby', 'Ruby'], [2000, 'f_diamond', 'Diamond'],
    [3000, 'f_obsidian', 'Obsidian'], [5000, 'f_aurora', 'Aurora (animated)'], [10000, 'f_celestial', 'Celestial (animated)']]
    .map(([n, id, name]) => R(id, 'f', id.slice(2), name, 'Get ' + n.toLocaleString('en-AU') + ' questions right', s => ge(s.correct, n), { g: 'right' })),
  R('f_x_epic', 'f', 'x_epic', 'Void (animated)', 'Pull any EPIC drop (1 in 1,000)', never, { g: 'drop', special: true, rar: 'epic' }),
  R('f_x_leg', 'f', 'x_leg', 'Supernova (animated)', 'Pull any LEGENDARY drop (1 in 10,000)', never, { g: 'drop', special: true, rar: 'leg' }),
  R('f_x_ins', 'f', 'x_ins', 'Prismatic (animated)', 'Pull the INSANE drop (1 in 100,000)', never, { g: 'drop', special: true, rar: 'ins' }),
  retired('f_fire', 'f', 'fire', 'On fire', '7 days in a row'), retired('f_rainbow', 'f', 'rainbow', 'Rainbow (animated)', '#1 on the weekly leaderboard'),

  // ---------- 🏷️ titles: achievements ----------
  R('t_none', 't', '', 'No title', 'Free', () => [1, 1]),
  R('t_student', 't', 'Student', 'Student', 'Free', () => [1, 1]),
  R('t_rookie', 't', 'Rookie', 'Rookie', 'Answer your first question', s => ge(s.answered, 1), { g: 'subj' }),
  R('t_sharp', 't', 'Sharp Shooter', 'Sharp Shooter', 'Get 50 answers right', s => ge(s.correct, 50), { g: 'subj' }),
  R('t_maths', 't', 'Equation Master', 'Equation Master', 'Get 100 Maths answers right', s => ge(s.mathsCorrect, 100), { g: 'subj' }),
  R('t_m500', 't', 'Algebra Ace', 'Algebra Ace', 'Get 500 Maths answers right', s => ge(s.mathsCorrect, 500), { g: 'subj' }),
  R('t_m2000', 't', 'Maths Machine', 'Maths Machine', 'Get 2,000 Maths answers right', s => ge(s.mathsCorrect, 2000), { g: 'subj' }),
  R('t_sci', 't', 'Chemistry Whiz', 'Chemistry Whiz', 'Get 100 Science answers right', s => ge(s.sciCorrect, 100), { g: 'subj' }),
  R('t_s500', 't', 'Lab Legend', 'Lab Legend', 'Get 500 Science answers right', s => ge(s.sciCorrect, 500), { g: 'subj' }),
  R('t_s2000', 't', 'Mad Scientist', 'Mad Scientist', 'Get 2,000 Science answers right', s => ge(s.sciCorrect, 2000), { g: 'subj' }),
  R('t_explorer', 't', 'Explorer', 'Explorer', 'Practise every topic in Maths or Science', s => flag(s.explorer), { g: 'subj' }),
  R('t_booklet', 't', 'Booklet Boss', 'Booklet Boss', 'Mark 50 booklet questions', s => ge(s.booklet, 50), { g: 'subj' }),
  R('t_test1', 't', 'Test Taker', 'Test Taker', 'Finish a timed test', s => ge(s.exams.length, 1), { g: 'test' }),
  R('t_test10', 't', 'Exam Veteran', 'Exam Veteran', 'Finish 10 timed tests', s => ge(s.exams.length, 10), { g: 'test' }),
  R('t_speed', 't', 'Speedrunner', 'Speedrunner', 'Finish a speedrun (5 minutes or less)', s => ge(tests(s, e => e.lim > 0 && e.lim <= 5), 1), { g: 'test' }),
  R('t_ace', 't', 'Top of the Class', 'Top of the Class', 'Score 90% or more on a test of 10+ questions', s => ge(tests(s, e => (e.n || 0) >= 10 && (e.p || 0) >= 90), 1), { g: 'test' }),
  R('t_perfect', 't', 'Perfectionist', 'Perfectionist', 'Score 100% on a test of 10+ questions', s => ge(tests(s, e => (e.n || 0) >= 10 && (e.p || 0) >= 100), 1), { g: 'test' }),
  // ⏱️ minutes on EC Revisions (study time: while Maths, Science or English is open and you're active)
  ...[[10, 't_m10', 'Just Visiting'], [30, 't_m30', 'Warming Up'], [60, 't_hour', 'Getting Started'], [120, 't_m120', 'Regular'], [300, 't_book', 'Bookworm'], [600, 't_ded', 'Dedicated'],
    [1000, 't_m1000', 'Thousand Club'], [1500, 't_scholar', 'Scholar'], [3000, 't_prof', 'Professor'], [5000, 't_m5000', 'Mastermind'], [7500, 't_m7500', 'Study Machine'], [10000, 't_m10000', '10,000 Minutes']]
    .map(([n, id, name]) => R(id, 't', name, name, 'Spend ' + n.toLocaleString('en-AU') + ' minutes studying on EC Revisions', s => ge(Math.floor(s.hours * 60), n), { g: 'mins' })),
  R('t_streak', 't', 'Streak Legend', 'Streak Legend', 'Study 14 days in a row', s => ge(s.best, 14), { g: 'time' }),
  R('t_unstop', 't', 'Unstoppable', 'Unstoppable', 'Study 30 days in a row', s => ge(s.best, 30), { g: 'time' }),
  R('t_friend', 't', 'Friendly', 'Friendly', 'Make a friend', s => ge(s.friends, 1), { g: 'social' }),
  R('t_social', 't', 'Social Butterfly', 'Social Butterfly', 'Have 5 friends', s => ge(s.friends, 5), { g: 'social' }),
  R('t_podium', 't', 'Podium', 'Podium', 'Be in the top 3 on the weekly leaderboard', s => top(s.weekRank, 3), { g: 'social' }),
  R('t_champ', 't', 'Champion', 'Champion', 'Be #1 on the weekly leaderboard', s => top(s.weekRank, 1), { g: 'social' }),
  R('t_goat', 't', 'GOAT', 'GOAT', 'Be #1 on the all-time leaderboard', s => top(s.allRank, 1), { g: 'social' }),
  R('t_legend', 't', 'Legend', 'Legend', 'Earn 4000 points (all time)', s => ge(s.points, 4000), { g: 'social' }),
  R('t_ch5', 't', 'Challenger', 'Challenger', 'Finish 5 daily challenges', s => ge(s.chDone, 5), { g: 'grind' }),
  R('t_ch30', 't', 'Daily Grinder', 'Daily Grinder', 'Finish 30 daily challenges', s => ge(s.chDone, 30), { g: 'grind' }),
  R('t_r1k', 't', 'Dice Roller', 'Dice Roller', 'Roll 1,000 times (1 roll per right answer)', s => ge(s.rolls, 1000), { g: 'grind' }),
  R('t_r10k', 't', 'High Roller', 'High Roller', 'Roll 10,000 times', s => ge(s.rolls, 10000), { g: 'grind' }),
  // roles and gifts
  R('t_tester', 't', 'Official Tester', 'Official Tester', 'Official testers only', s => flag(s.tester), { g: 'role' }),
  R('t_teacher', 't', 'Teacher', 'Teacher', 'Teachers only', s => flag(s.teacher), { g: 'role' }),
  R('t_admin', 't', 'Admin', 'Admin', 'Admins only', s => flag(s.role), { g: 'role' }),
  R('t_owner', 't', 'Owner', 'Owner', 'Beau only', s => flag(s.owner), { g: 'role' }),
  R('t_tizz', 't', 'Tizz Boy', 'Tizz Boy', 'A special title from Beau', never, { g: 'gift', special: true }),

  // ---------- 🎲 lucky drop titles (pulled, never earned) ----------
  ...[['t_x_lucky', 'Lucky', '🍀'], ['t_x_ticket', 'Golden Ticket', '🎫'], ['t_x_gem', 'Hidden Gem', '💎'], ['t_x_star', 'Shooting Star', '🌠'], ['t_x_d20', 'Natural 20', '🎲'], ['t_x_jackpot', 'Jackpot', '🎰']]
    .map(([id, name, ic]) => R(id, 't', name, name, 'RARE drop: 1 in 100 per roll', never, { g: 'drop', special: true, rar: 'rare', ic })),
  ...[['t_x_chosen', 'Chosen One', '✨'], ['t_x_thunder', 'Thunderstruck', '🌩️'], ['t_x_phantom', 'Phantom', '👻'], ['t_x_wild', 'Wildcard', '🃏']]
    .map(([id, name, ic]) => R(id, 't', name, name, 'EPIC drop: 1 in 1,000 per roll', never, { g: 'drop', special: true, rar: 'epic', ic })),
  ...[['t_x_myth', 'Mythical', '🐉'], ['t_x_ancient', 'Ancient One', '🗿'], ['t_x_starborn', 'Star Born', '🌟']]
    .map(([id, name, ic]) => R(id, 't', name, name, 'LEGENDARY drop: 1 in 10,000 per roll', never, { g: 'drop', special: true, rar: 'leg', ic })),
  R('t_x_ins', 't', 'One in 100,000', 'One in 100,000', 'INSANE drop: 1 in 100,000 per roll', never, { g: 'drop', special: true, rar: 'ins', ic: '🌀' })
];

const BY_ID = Object.fromEntries(REWARDS.map(r => [r.id, r]));
export const FREE = new Set(REWARDS.filter(r => r.need === 'Free').map(r => r.id));
// role rewards come and go with the role; everything else, once earned, is kept (stored in users.rewards)
const ROLE_ONLY = new Set(['a_tube', 'a_apple', 'a_shield', 't_tester', 't_teacher', 't_admin', 't_owner']);

const parse = (s, d) => { try { const v = JSON.parse(s || 'null'); return v == null ? d : v; } catch { return d; } };
export const savedRewards = json => new Set((parse(json, []) || []).filter(id => BY_ID[id] && !ROLE_ONLY.has(id)));

// every reward with its progress. kept = what this person has unlocked before (stays unlocked).
export function rewardStatus(s, kept) {
  return REWARDS.filter(r => !r.special || (kept && kept.has(r.id))).map(r => {
    let [have, need] = r.test(s); const earned = have >= need || (kept && kept.has(r.id));
    if (earned) have = need;
    return { id: r.id, k: r.k, v: r.v, name: r.name, need: r.need, have, needN: need, earned, g: r.g, rar: r.rar, ic: r.ic };
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
  const a = BY_ID[o.a], f = BY_ID[o.f];
  // a title as others see it (🎲 lucky drop titles add their rarity colour and pull count)
  const tv = (id, n) => { const t = BY_ID[id]; if (!t || t.k !== 't' || !t.v) return null; const x = { t: t.v }; if (t.rar) { x.tr = t.rar; x.ti = t.ic; if (n > 1) x.tn = Math.min(+n || 0, 99999); } return x; };
  let t1 = tv(o.t, o.tn), t2 = tv(o.t2, o.tn2); if (!t1 && t2) { t1 = t2; t2 = null; }
  const out = { a: a && a.k === 'a' ? a.v : null, f: f && f.k === 'f' && f.v !== 'none' ? f.v : null, ...(t1 || { t: null }) };
  if (t2) out.t2 = t2; // 🏷️🏷️ a second title
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
export const lookIds = json => { const o = parse(json, null); return o && typeof o === 'object' ? { a: o.a || 'a_smile', f: o.f || 'f_none', t: o.t || 't_none', ...(o.tn ? { tn: o.tn } : {}), ...(o.t2 ? { t2: o.t2 } : {}), ...(o.tn2 ? { tn2: o.tn2 } : {}) } : { a: null, f: 'f_none', t: 't_none' }; };
export const rewardById = id => BY_ID[id] || null;

// 🔥 best streak ever and days studied, from { 'YYYY-MM-DD': seconds }
export function streakInfo(D) {
  const days = Object.keys(D).filter(k => (D[k] || 0) >= 60).sort(); let best = 0, run = 0, prev = 0;
  for (const k of days) { const t = Date.parse(k + 'T00:00:00Z') / 86400000; run = prev && t - prev === 1 ? run + 1 : 1; prev = t; if (run > best) best = run; }
  return { best, days: days.length };
}

/* ---------- 🎲 lucky drops ---------- */
export const RARITY = [ // rarest first. Each roll: 1 in 100,000 INSANE, else 1 in 10,000 LEGENDARY, else 1 in 1,000 EPIC, else 1 in 100 RARE
  { id: 'ins', name: 'INSANE', odds: 100000 }, { id: 'leg', name: 'LEGENDARY', odds: 10000 }, { id: 'epic', name: 'EPIC', odds: 1000 }, { id: 'rare', name: 'RARE', odds: 100 }];
export const DROP_TITLES = REWARDS.filter(r => r.g === 'drop' && r.k === 't');
export const DROP_UNLOCKS = { epic: ['a_x_epic', 'f_x_epic'], leg: ['a_x_leg', 'f_x_leg'], ins: ['a_x_ins', 'f_x_ins'] };
export const dropCatalogue = () => DROP_TITLES.map(r => ({ id: r.id, name: r.name, ic: r.ic, rar: r.rar }));
