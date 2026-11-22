// 🏰 Study Base (admin test version): the server side. Only Beau can use it for now (worker.js checks that).
// Your base is saved here, and the server decides everything: what studying has earned you, what you can build,
// and the result of every battle (it runs the same simulation the page draws, from rules.js).
import { BLD, TROOP, MAX_TH, WAR_LOCK, FIRST_RAID, RAID_EVERY, GOLD_PER_POINT, N, newBase, botBase, botRaid, runBattle, rates, caps, armyCap, armySize, fits, canDeploy, hallLvl, maxCount, upgradeCost, maxLevel } from './rules.js';

const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (status, error) => json({ error }, status);
const newSeed = () => (Math.random() * 2147483647) >>> 0;
async function readBody(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('json');
  const t = await req.text(); if (t.length > 20000) throw new Error('big'); return JSON.parse(t);
}
async function load(env, uid) { const r = await env.DB.prepare('SELECT data FROM base_state WHERE user_id = ?').bind(uid).first(); return r ? JSON.parse(r.data) : null; }
async function save(env, uid, st) { await env.DB.prepare('INSERT INTO base_state (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(uid, JSON.stringify(st), now()).run(); }
// everything you've ever studied: seconds of study time and leaderboard answer points
async function totals(env, uid) {
  const [a, b] = await env.DB.batch([env.DB.prepare('SELECT COALESCE(SUM(seconds), 0) AS s FROM daily WHERE user_id = ?').bind(uid), env.DB.prepare('SELECT COALESCE(SUM(qpts), 0) AS q FROM points_daily WHERE user_id = ?').bind(uid)]);
  return { sec: a.results[0].s || 0, pts: b.results[0].q || 0 };
}
// what your farms and houses have made from the studying you've done since you last collected
// (plus anything that didn't fit in storage last time: it waits here instead of being wasted)
function pending(st, tot) {
  const r = rates(st.blds), min = Math.max(0, tot.sec - st.seenSec) / 60, pts = Math.max(0, tot.pts - st.seenPts);
  return { gold: Math.floor(min * r.gold + pts * GOLD_PER_POINT) + (st.bankGold || 0), food: Math.floor(min * r.food) + (st.bankFood || 0), minutes: Math.floor(min), points: pts };
}
function ensureBots(st) {
  const th = hallLvl(st.blds), want = [Math.max(1, 2 * th - 1), Math.min(10, 2 * th), Math.min(10, 2 * th + 2)];
  for (let i = 0; i < 3; i++) if (!st.bots[i]) st.bots[i] = { seed: newSeed(), diff: want[i] };
}
// in war mode, bots raid you every few hours (worked out when you next open the game; at most 3 at once)
function applyRaids(st, t) {
  if (!st.war.on || !st.raidAt) return 0;
  let n = 0;
  while (st.raidAt <= t && n < 3) {
    const seed = newSeed(), deploys = botRaid(seed, hallLvl(st.blds)), res = runBattle(st.blds, deploys);
    const lostGold = Math.floor(st.gold * 0.3 * res.pct / 100), lostFood = Math.floor(st.food * 0.3 * res.pct / 100);
    st.gold -= lostGold; st.food -= lostFood;
    st.reports.unshift({ at: st.raidAt, deploys, layout: st.blds.map(b => ({ ...b })), pct: res.pct, stars: res.stars, lostGold, lostFood, seen: false });
    st.raidAt += RAID_EVERY; n++;
  }
  if (st.raidAt <= t) st.raidAt = t + RAID_EVERY; // away for ages: skip the rest
  st.reports = st.reports.slice(0, 12);
  return n;
}
function view(st, tot, t, extra = {}) {
  const c = caps(st.blds);
  return { now: t, base: st, pending: pending(st, tot), rates: rates(st.blds), caps: c, armyCap: armyCap(st.blds), armySize: armySize(st.army), th: hallLvl(st.blds), studied: { minutes: Math.floor(tot.sec / 60), points: tot.pts }, ...extra };
}
const int = v => Number.isInteger(v) ? v : NaN;

export async function handleBase(req, env, url, user) {
  const path = url.pathname, method = req.method, uid = user.id, t = now();
  let st = await load(env, uid); const fresh = !st; if (!st) st = newBase();
  ensureBots(st);
  const raided = applyRaids(st, t);
  const tot = await totals(env, uid);
  if (path === '/api/base' && method === 'GET') { if (fresh || raided) await save(env, uid, st); return json(view(st, tot, t)); }
  if (method !== 'POST') return err(404, 'Not found');
  let b; try { b = await readBody(req); } catch { return err(400, 'Bad request'); }
  const action = path.slice('/api/base/'.length), war = st.war.on;
  const needWar = what => err(409, 'Switch to ⚔️ war mode to ' + what + '. In peace mode you can collect, train troops and move buildings.');
  let extra = {};

  if (action === 'collect') {
    const p = pending(st, tot), c = caps(st.blds);
    const g = Math.max(0, Math.min(p.gold, c.gold - st.gold)), f = Math.max(0, Math.min(p.food, c.food - st.food));
    st.gold += g; st.food += f; st.bankGold = p.gold - g; st.bankFood = p.food - f; st.seenSec = tot.sec; st.seenPts = tot.pts;
    extra = { got: { gold: g, food: f, minutes: p.minutes, points: p.points, leftGold: st.bankGold, leftFood: st.bankFood } };
  } else if (action === 'move') {
    const bl = st.blds.find(x => x.id === int(b.id)); if (!bl) return err(404, 'No such building');
    if (!fits(st.blds, bl.type, int(b.x), int(b.y), bl.id)) return err(409, 'It doesn’t fit there.');
    bl.x = b.x; bl.y = b.y;
  } else if (action === 'build') {
    if (!war) return needWar('build');
    const type = String(b.type || ''), k = BLD[type]; if (!k || type === 'hall') return err(400, 'Pick a building.');
    const th = hallLvl(st.blds), have = st.blds.filter(x => x.type === type).length;
    if (have >= maxCount(type, th)) return err(409, 'You have the most ' + k.name.toLowerCase() + 's your Town Hall allows. Upgrade the Town Hall for more.');
    if (st.gold < k.cost) return err(409, 'You need ' + k.cost + ' gold.');
    if (!fits(st.blds, type, int(b.x), int(b.y))) return err(409, 'It doesn’t fit there.');
    st.gold -= k.cost; st.blds.push({ id: st.nextId++, type, x: b.x, y: b.y, lvl: 1 });
  } else if (action === 'upgrade') {
    if (!war) return needWar('upgrade');
    const bl = st.blds.find(x => x.id === int(b.id)); if (!bl) return err(404, 'No such building');
    const th = hallLvl(st.blds), top = maxLevel(bl, th);
    if (bl.lvl >= top) return err(409, bl.type === 'hall' ? 'Your Town Hall is already the top level.' : 'Upgrade your Town Hall first: buildings can’t be a higher level than it.');
    const cost = upgradeCost(bl); if (st.gold < cost) return err(409, 'You need ' + cost + ' gold.');
    st.gold -= cost; bl.lvl++;
    if (bl.type === 'hall') { st.bots = []; ensureBots(st); } // tougher bots to match
  } else if (action === 'train') {
    const type = String(b.type || ''), k = TROOP[type], n = int(b.n); if (!k || !(n >= 1 && n <= 50)) return err(400, 'Pick a troop.');
    if (armySize(st.army) + k.space * n > armyCap(st.blds)) return err(409, 'Not enough room in your army. Build or upgrade a Barracks.');
    if (st.food < k.food * n) return err(409, 'You need ' + k.food * n + ' food.');
    st.food -= k.food * n; st.army[type] = (st.army[type] || 0) + n;
  } else if (action === 'mode') {
    if (b.war && !war) { st.war = { on: true, lockUntil: t + WAR_LOCK }; st.raidAt = t + FIRST_RAID; }
    else if (!b.war && war) {
      if (t < st.war.lockUntil) return err(409, 'War mode is locked on for 24 hours after you turn it on.');
      st.war = { on: false, lockUntil: 0 }; st.raidAt = 0;
    }
  } else if (action === 'attack') {
    if (!war) return needWar('attack');
    const i = int(b.bot), bot = st.bots[i]; if (!bot) return err(400, 'Pick a village to attack.');
    const deploys = Array.isArray(b.deploys) ? b.deploys : []; if (!deploys.length || deploys.length > 200) return err(400, 'Drop some troops first.');
    const village = botBase(bot.seed, bot.diff), used = {};
    for (const d of deploys) {
      if (!TROOP[d.t] || typeof d.x !== 'number' || typeof d.y !== 'number' || !canDeploy(village.blds, d.x, d.y)) return err(400, 'Troops can only be dropped in the open, away from buildings.');
      used[d.t] = (used[d.t] || 0) + 1;
    }
    for (const k of Object.keys(used)) if (used[k] > (st.army[k] || 0)) return err(409, 'You don’t have that many ' + TROOP[k].name.toLowerCase() + 's.');
    const clean = deploys.map(d => ({ t: d.t, x: Math.round(d.x * 100) / 100, y: Math.round(d.y * 100) / 100 }));
    const res = runBattle(village.blds, clean), c = caps(st.blds);
    const loot = { gold: Math.floor(village.loot.gold * res.pct / 100), food: Math.floor(village.loot.food * res.pct / 100) };
    st.gold = Math.min(c.gold, st.gold + loot.gold); st.food = Math.min(c.food, st.food + loot.food);
    for (const k of Object.keys(used)) st.army[k] -= used[k];
    if (res.stars) st.wins++; st.stars += res.stars;
    st.bots[i] = null; ensureBots(st); // a new village takes its place
    extra = { battle: { ...res, loot, seed: bot.seed, diff: bot.diff, deploys: clean } };
  } else if (action === 'seen') {
    st.reports.forEach(r => { r.seen = true; });
  } else return err(404, 'Not found');
  await save(env, uid, st);
  return json(view(st, tot, t, extra));
}
export { N };
