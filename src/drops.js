// 🎲 Lucky drops. Every right answer (Maths, Science, the daily challenge) is 1 roll; finishing the daily challenge is +10 rolls
// and finishing a test is +5 (up to 3 tests a day). The SERVER rolls (crypto random), so nobody can fake a pull.
// Answer rolls are capped at 300 a day so spamming answers can't farm drops.
// Odds per roll: 1 in 100,000 INSANE, 1 in 10,000 LEGENDARY, 1 in 1,000 EPIC, 1 in 100 RARE (each its own chance).
import { RARITY, DROP_TITLES, DROP_UNLOCKS, rewardById } from './rewards.js';
import { post as postNews } from './news.js';

const QLD = 10 * 3600;
const now = () => Math.floor(Date.now() / 1000);
const dayKey = t => new Date((t + QLD) * 1000).toISOString().slice(0, 10);
export const ANSWER_CAP = 300, TEST_BONUS = 5, TEST_CAP = 3, CHALLENGE_BONUS = 10;

function rand() { const a = new Uint32Array(2); crypto.getRandomValues(a); return (a[0] * 2097152 + (a[1] >>> 11)) / 9007199254740992; } // [0, 1), 53 bits
// one roll: the rarity pulled, or null
export function rollOnce(r = rand()) {
  let acc = 0; for (const x of RARITY) { acc += 1 / x.odds; if (r < acc) return x.id; } return null;
}
const pickIn = rar => { const list = DROP_TITLES.filter(d => d.rar === rar); const a = new Uint32Array(1); crypto.getRandomValues(a); return list[a[0] % list.length]; };
const parse = (s, d) => { try { const v = JSON.parse(s || 'null'); return v == null ? d : v; } catch { return d; } };

// roll n times for this person. kind: 'answer' (capped 300/day), 'test' (+5, 3 a day), 'bonus' (no cap; server-checked things only)
// returns { rolls, today: {a, cap}, drops: [{ id, name, ic, rar, rarName, odds, n, unlocks: [{id, k, v, name}] }] }
export async function roll(env, user, n, kind = 'answer', force = null) {
  const t = now(), day = dayKey(t), uid = user.id;
  const u = await env.DB.prepare('SELECT rolls, roll_state, rewards, look FROM users WHERE id = ?').bind(uid).first(); if (!u) return null;
  let st = parse(u.roll_state, {}); if (st.day !== day) st = { day, a: 0, t: 0 };
  if (kind === 'answer') { n = Math.max(0, Math.min(n, ANSWER_CAP - st.a)); st.a += n; }
  else if (kind === 'test') { if (st.t >= TEST_CAP) n = 0; else { st.t++; n = TEST_BONUS; } }
  const out = { rolls: (u.rolls || 0) + n, today: { a: st.a, cap: ANSWER_CAP, tests: st.t, testCap: TEST_CAP }, added: n, drops: [] };
  if (!n) return out;
  if (!force && env.DROP_FORCE) force = env.DROP_FORCE; // (local testing only: never set on the live site)
  const pulled = []; for (let i = 0; i < n; i++) { const r = force && i === 0 ? force : rollOnce(); if (r) pulled.push(pickIn(r)); }
  const W = [env.DB.prepare('UPDATE users SET rolls = rolls + ?, roll_state = ? WHERE id = ?').bind(n, JSON.stringify(st), uid)];
  if (!pulled.length) { await W[0].run(); return out; }
  // 🎉 something dropped: count it, unlock it (and the frame + picture for EPIC and rarer), keep an equipped title's ×count fresh
  const kept = new Set(parse(u.rewards, [])), look = parse(u.look, null);
  const counts = {}; pulled.forEach(d => { counts[d.id] = (counts[d.id] || 0) + 1; });
  pulled.forEach(d => W.push(env.DB.prepare('INSERT INTO drop_log (user_id, id, rar, at) VALUES (?, ?, ?, ?)').bind(uid, d.id, d.rar, t))); // 🍀 for "Luckiest of the week"
  for (const [id, c] of Object.entries(counts)) W.push(env.DB.prepare('INSERT INTO drops (user_id, id, n, first_at, last_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, id) DO UPDATE SET n = n + excluded.n, last_at = excluded.last_at').bind(uid, id, c, t, t));
  await env.DB.batch(W);
  const have = Object.fromEntries((await env.DB.prepare('SELECT id, n FROM drops WHERE user_id = ? AND id IN (' + Object.keys(counts).map(() => '?').join(',') + ')').bind(uid, ...Object.keys(counts)).all()).results.map(r => [r.id, r.n]));
  const seen = new Set();
  for (const d of pulled) {
    const unlocks = [];
    for (const id of [d.id, ...(DROP_UNLOCKS[d.rar] || [])]) if (!kept.has(id)) { kept.add(id); if (id !== d.id) { const r = rewardById(id); unlocks.push({ id, k: r.k, v: r.v, name: r.name }); } }
    const R = RARITY.find(x => x.id === d.rar);
    if (!seen.has(d.id)) { seen.add(d.id); out.drops.push({ id: d.id, name: d.name, ic: d.ic, rar: d.rar, rarName: R.name, odds: R.odds, n: have[d.id] || 1, unlocks }); }
  }
  const upd = ['rewards = ?'], args = [JSON.stringify([...kept])];
  if (look && ((look.t && have[look.t]) || (look.t2 && have[look.t2]))) { if (have[look.t]) look.tn = have[look.t]; if (have[look.t2]) look.tn2 = have[look.t2]; upd.push('look = ?'); args.push(JSON.stringify(look)); }
  await env.DB.prepare('UPDATE users SET ' + upd.join(', ') + ' WHERE id = ?').bind(...args, uid).run();
  // 📰 only the INSANE one goes in the News
  for (const d of out.drops.filter(x => x.rar === 'ins'))
    await postNews(env, { kind: 'drop', title: '🌀 ' + user.username + ' pulled a 1 in 100,000!', body: user.username + ' just pulled “' + d.name + '”, the rarest drop on EC Revisions, after ' + out.rolls.toLocaleString('en-AU') + ' rolls. That’s a 0.001% chance per roll.', key: 'ins:' + uid + ':' + t });
  return out;
}

// what the profile's 🎲 Drops tab shows
export async function dropSummary(env, uid) {
  const t = now(), day = dayKey(t);
  const [u, mine, all] = await env.DB.batch([
    env.DB.prepare('SELECT rolls, roll_state FROM users WHERE id = ?').bind(uid),
    env.DB.prepare('SELECT id, n, first_at, last_at FROM drops WHERE user_id = ?').bind(uid),
    env.DB.prepare('SELECT id, COUNT(*) AS people, SUM(n) AS pulls FROM drops GROUP BY id')
  ]);
  const r = u.results[0] || {}; let st = parse(r.roll_state, {}); if (st.day !== day) st = { day, a: 0, t: 0 };
  const M = Object.fromEntries(mine.results.map(x => [x.id, x])), A = Object.fromEntries(all.results.map(x => [x.id, x]));
  return {
    rolls: r.rolls || 0, today: { a: st.a, cap: ANSWER_CAP, tests: st.t, testCap: TEST_CAP }, bonus: { test: TEST_BONUS, challenge: CHALLENGE_BONUS },
    rarities: RARITY.map(x => ({ id: x.id, name: x.name, odds: x.odds })),
    list: DROP_TITLES.map(d => { const m = M[d.id], a = A[d.id]; return { id: d.id, rar: d.rar, ic: m ? d.ic : null, name: m || d.rar === 'rare' || d.rar === 'epic' ? d.name : null, n: m ? m.n : 0, first: m ? m.first_at : null, people: a ? a.people : 0, pulls: a ? a.pulls : 0 }; })
  };
}
