// 🏰 Study Base (admin test version): the rules and the battle simulation.
// Shared by the server (it runs every battle and decides the result) and the game page (it draws the same battle).
// Everything here is deterministic: the same base and the same troop drops always give the same battle.
// scripts/build-base.sh copies this file into the page with the `export` words taken off.

export const N = 22;            // the map is N × N tiles
export const MAX_TH = 5;        // highest Town Hall level
export const WAR_LOCK = 86400;  // war mode can't be turned off for 24 hours
export const FIRST_RAID = 3 * 3600, RAID_EVERY = 4 * 3600; // bots raid you in war mode
export const GOLD_PER_POINT = 3; // gold for each leaderboard answer point

// w × h in tiles; max = how many you can have at Town Hall level 1..5
export const BLD = {
  hall:     { name: 'Town Hall',    w: 3, h: 3, hp: 1500, cost: 0,   max: [1, 1, 1, 1, 1], about: 'The heart of your base. Its level sets how far everything else can be upgraded, and how much it can store.' },
  house:    { name: 'House',        w: 2, h: 2, hp: 300,  cost: 100, max: [2, 3, 4, 5, 6], about: 'Pays taxes: more gold for every minute you study.' },
  farm:     { name: 'Farm',         w: 2, h: 2, hp: 300,  cost: 100, max: [2, 3, 4, 5, 6], about: 'Grows food for every minute you study. Food trains troops.' },
  store:    { name: 'Storehouse',   w: 2, h: 2, hp: 500,  cost: 200, max: [1, 1, 2, 2, 3], about: 'Lets you keep more gold and food.' },
  barracks: { name: 'Barracks',     w: 3, h: 3, hp: 600,  cost: 250, max: [1, 1, 1, 2, 2], about: 'Room for a bigger army.' },
  cannon:   { name: 'Cannon',       w: 2, h: 2, hp: 500,  cost: 250, max: [1, 2, 2, 3, 4], def: { range: 5.5, dmg: 22, rate: 1.0 }, about: 'Heavy shots at the closest attacker.' },
  tower:    { name: 'Archer Tower', w: 2, h: 2, hp: 400,  cost: 300, max: [0, 1, 2, 2, 3], def: { range: 7, dmg: 12, rate: 0.7 }, about: 'Long range, quick arrows.' },
  wall:     { name: 'Wall',         w: 1, h: 1, hp: 250,  cost: 20,  max: [10, 20, 30, 40, 50], about: 'Attackers have to break through walls before they can get past.' }
};
export const BUILD_ORDER = ['house', 'farm', 'store', 'barracks', 'cannon', 'tower', 'wall'];
export const TH_COST = [0, 500, 1200, 2500, 5000]; // gold to take the Town Hall from level L to L + 1 is TH_COST[L]

// dmg per hit, rate = seconds between hits, range/speed in tiles, food to train, space in the army
export const TROOP = {
  warrior: { name: 'Warrior', hp: 110, dmg: 14, rate: 1.0, range: 0.8, speed: 1.4, food: 25,  space: 1, about: 'Tough all-rounder. Attacks whatever is closest.' },
  archer:  { name: 'Archer',  hp: 50,  dmg: 10, rate: 1.0, range: 3.5, speed: 1.5, food: 30,  space: 1, about: 'Shoots from range, even over walls. Fragile.' },
  brute:   { name: 'Brute',   hp: 520, dmg: 30, rate: 1.4, range: 0.9, speed: 0.9, food: 120, space: 5, prefers: 'def', about: 'Huge and slow. Goes for cannons and towers first.' }
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const hallOf = blds => blds.find(b => b.type === 'hall');
export const hallLvl = blds => (hallOf(blds) || { lvl: 1 }).lvl;
export const hpOf = b => Math.round(BLD[b.type].hp * (1 + 0.5 * (b.lvl - 1)));
export const dmgOf = (type, lvl) => BLD[type].def ? BLD[type].def.dmg * (1 + 0.35 * (lvl - 1)) : 0;
export const maxCount = (type, th) => BLD[type].max[Math.min(th, MAX_TH) - 1];
export const upgradeCost = b => b.type === 'hall' ? TH_COST[b.lvl] : BLD[b.type].cost * (b.lvl + 1);
export const maxLevel = (b, th) => b.type === 'hall' ? MAX_TH : b.type === 'wall' ? th : th;
export function rates(blds) { let gold = 2, food = 2; for (const b of blds) { if (b.type === 'house') gold += 2 * b.lvl; if (b.type === 'farm') food += 2 * b.lvl; } return { gold, food }; }
export function caps(blds) { let c = 600 * hallLvl(blds); for (const b of blds) if (b.type === 'store') c += 500 * b.lvl; return { gold: c, food: c }; }
export function armyCap(blds) { let c = 15; for (const b of blds) if (b.type === 'barracks') c += 10 * b.lvl; return c; }
export const armySize = army => Object.keys(TROOP).reduce((s, k) => s + (army[k] || 0) * TROOP[k].space, 0);

export function fits(blds, type, x, y, ignoreId) {
  const { w, h } = BLD[type];
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x + w > N || y + h > N) return false;
  return !blds.some(b => b.id !== ignoreId && x < b.x + BLD[b.type].w && b.x < x + w && y < b.y + BLD[b.type].h && b.y < y + h);
}
export function freeSpot(blds, type) { // the free spot closest to the middle
  const { w, h } = BLD[type], c = N / 2; let best = null, bd = 1e9;
  for (let y = 0; y + h <= N; y++) for (let x = 0; x + w <= N; x++) if (fits(blds, type, x, y)) { const d = (x + w / 2 - c) ** 2 + (y + h / 2 - c) ** 2; if (d < bd) { bd = d; best = { x, y }; } }
  return best;
}
const rd = (px, py, x, y, w, h) => Math.hypot(Math.max(x - px, 0, px - (x + w)), Math.max(y - py, 0, py - (y + h)));
// troops can only be dropped away from buildings (more than 1.5 tiles from any of them), inside the map
export const canDeploy = (blds, x, y) => x >= 0.3 && y >= 0.3 && x <= N - 0.3 && y <= N - 0.3 && blds.every(b => rd(x, y, b.x, b.y, BLD[b.type].w, BLD[b.type].h) > 1.5);

// a brand-new base: everyone starts with the same small village and nothing in store (resources come from studying)
export function newBase() {
  return { v: 1, gold: 0, food: 0, seenSec: 0, seenPts: 0, nextId: 6,
    blds: [{ id: 1, type: 'hall', x: 9, y: 9, lvl: 1 }, { id: 2, type: 'house', x: 5, y: 7, lvl: 1 }, { id: 3, type: 'farm', x: 15, y: 7, lvl: 1 }, { id: 4, type: 'barracks', x: 5, y: 13, lvl: 1 }, { id: 5, type: 'cannon', x: 14, y: 14, lvl: 1 }],
    army: { warrior: 0, archer: 0, brute: 0 }, war: { on: false, lockUntil: 0 }, raidAt: 0, bots: [], reports: [], wins: 0, stars: 0 };
}

// a bot village for difficulty 1–10 (the same seed always makes the same village)
export function botBase(seed, diff) {
  const r = rng(seed), th = Math.min(MAX_TH, Math.max(1, Math.ceil(diff / 2)));
  const lv = () => Math.max(1, th - (r() < 0.45 ? 1 : 0));
  const blds = []; let id = 1;
  const add = (type, x, y, lvl) => { if (!fits(blds, type, x, y)) return false; blds.push({ id: id++, type, x, y, lvl }); return true; };
  add('hall', 9, 9, th);
  const walled = diff >= 3, core = 4 + Math.floor(diff / 3), lo = 11 - core, hi = 10 + core;
  if (walled) for (let i = lo; i <= hi; i++) for (const [x, y] of [[i, lo], [i, hi], [lo, i], [hi, i]]) add('wall', x, y, lv());
  const a = walled ? lo + 1 : lo - 1, b = walled ? hi - 1 : hi + 1;
  const place = (type, n, inside = true) => {
    for (let k = 0; k < n; k++) for (let tries = 0; tries < 80; tries++) {
      const w = BLD[type].w, x = inside ? a + Math.floor(r() * (b - a - w + 2)) : 1 + Math.floor(r() * (N - w - 2)), y = inside ? a + Math.floor(r() * (b - a - w + 2)) : 1 + Math.floor(r() * (N - w - 2));
      if (!inside && x > lo - 3 && x < hi + 2 && y > lo - 3 && y < hi + 2) continue;
      if (add(type, x, y, lv())) break;
    }
  };
  place('cannon', Math.min(5, 1 + Math.floor(diff / 2))); place('tower', Math.min(4, Math.floor(diff / 3)));
  place('store', diff >= 4 ? 1 : 0); place('barracks', diff >= 6 ? 1 : 0);
  place('house', 1 + Math.floor(r() * 2)); place('farm', 1 + Math.floor(r() * 2));
  place('house', Math.floor(r() * 2), false); place('farm', 1, false);
  return { blds, th, loot: { gold: 120 + diff * 110, food: 80 + diff * 80 } };
}
// the bots' army when they raid you (bigger as your Town Hall grows)
export function botRaid(seed, th) {
  const r = rng(seed), cap = 6 + 6 * th, list = []; let left = cap;
  for (let i = 0; i < Math.floor(cap / 18); i++) { list.push('brute'); left -= 5; }
  const na = Math.floor(left * 0.4); for (let i = 0; i < na; i++) list.push('archer'); left -= na;
  for (let i = 0; i < left; i++) list.push('warrior');
  const side = Math.floor(r() * 4), r2 = v => Math.round(v * 100) / 100;
  return list.map(t => { const p = 2 + r() * (N - 4); const [x, y] = side === 0 ? [p, 0.6] : side === 1 ? [N - 0.6, p] : side === 2 ? [p, N - 0.6] : [0.6, p]; return { t, x: r2(x), y: r2(y) }; });
}

/* ---------- the battle ---------- */
export const DT = 0.1, MAX_TICKS = 1500; // 0.1 s per tick, 2½ minutes at most
export function battle(blds, deploys) {
  const B = blds.map((b, i) => { const k = BLD[b.type], hp = hpOf(b); return { i, id: b.id, type: b.type, x: b.x, y: b.y, w: k.w, h: k.h, lvl: b.lvl, hp, max: hp, cd: 0, aim: -Math.PI / 2, dead: false, def: k.def || null, cx: b.x + k.w / 2, cy: b.y + k.h / 2 }; });
  const occ = new Int16Array(N * N).fill(-1);
  B.forEach(b => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) occ[y * N + x] = b.i; });
  return { B, occ, T: [], queue: deploys.slice(0, 250), t: 0, shots: [], over: false };
}
function hitB(s, b, dmg) { b.hp -= dmg; if (b.hp <= 0) { b.hp = 0; b.dead = true; for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (s.occ[y * N + x] === b.i) s.occ[y * N + x] = -1; } }
function pickTarget(s, u) {
  const k = TROOP[u.type], defsLeft = k.prefers === 'def' && s.B.some(b => !b.dead && b.def);
  let best = -1, bd = 1e9;
  for (const b of s.B) { if (b.dead || b.type === 'wall' || (defsLeft && !b.def)) continue; const d = rd(u.x, u.y, b.x, b.y, b.w, b.h); if (d < bd - 1e-9) { bd = d; best = b.i; } }
  return best;
}
function troopTick(s, u) {
  const k = TROOP[u.type];
  u.cd = Math.max(0, u.cd - DT);
  if (u.tgt < 0 || s.B[u.tgt].dead) u.tgt = pickTarget(s, u);
  if (u.tgt < 0) return;
  const b = s.B[u.tgt], d = rd(u.x, u.y, b.x, b.y, b.w, b.h);
  const px = Math.max(b.x, Math.min(u.x, b.x + b.w)), py = Math.max(b.y, Math.min(u.y, b.y + b.h));
  if (d <= k.range) {
    u.face = Math.atan2(py - u.y, px - u.x);
    if (u.cd <= 0) { hitB(s, b, k.dmg); u.cd = k.rate; s.shots.push({ k: u.type, x1: u.x, y1: u.y, x2: px, y2: py }); }
    return;
  }
  const dx = px - u.x, dy = py - u.y, L = Math.hypot(dx, dy) || 1, st = k.speed * DT;
  const nx = u.x + dx / L * st, ny = u.y + dy / L * st; u.face = Math.atan2(dy, dx);
  const tx = Math.floor(nx), ty = Math.floor(ny); // something in the way (a wall or another building)? Break it first.
  if (tx >= 0 && ty >= 0 && tx < N && ty < N) { const o = s.occ[ty * N + tx]; if (o >= 0 && o !== b.i && !s.B[o].dead) { u.tgt = o; return; } }
  u.x = nx; u.y = ny;
}
function defTick(s, b) {
  b.cd = Math.max(0, b.cd - DT);
  let best = null, bd = 1e9;
  for (const u of s.T) { if (u.dead) continue; const d = Math.hypot(u.x - b.cx, u.y - b.cy); if (d <= b.def.range && d < bd) { bd = d; best = u; } }
  if (!best) return;
  b.aim = Math.atan2(best.y - b.cy, best.x - b.cx);
  if (b.cd > 0) return;
  best.hp -= dmgOf(b.type, b.lvl); b.cd = b.def.rate; s.shots.push({ k: b.type, x1: b.cx, y1: b.cy, x2: best.x, y2: best.y });
  if (best.hp <= 0) { best.hp = 0; best.dead = true; }
}
// one tick (0.1 s). Returns false once the battle is over.
export function step(s) {
  if (s.over) return false;
  s.shots = [];
  if (s.queue.length && s.t % 2 === 0) { const d = s.queue.shift(), k = TROOP[d.t]; if (k) s.T.push({ id: s.T.length, type: d.t, x: d.x, y: d.y, hp: k.hp, max: k.hp, cd: 0, tgt: -1, dead: false, face: 0 }); }
  for (const u of s.T) if (!u.dead) troopTick(s, u);
  for (const b of s.B) if (!b.dead && b.def) defTick(s, b);
  s.t++;
  if ((!s.queue.length && !s.T.some(u => !u.dead)) || !s.B.some(b => !b.dead && b.type !== 'wall') || s.t >= MAX_TICKS) s.over = true;
  return !s.over;
}
export function result(s) {
  const nw = s.B.filter(b => b.type !== 'wall'), dead = nw.filter(b => b.dead).length;
  const pct = nw.length ? Math.floor(dead * 100 / nw.length) : 0, hallDown = s.B.some(b => b.type === 'hall' && b.dead);
  return { pct, hallDown, stars: (pct >= 50 ? 1 : 0) + (hallDown ? 1 : 0) + (pct === 100 ? 1 : 0), ticks: s.t };
}
export function runBattle(blds, deploys) { const s = battle(blds, deploys); while (step(s)); return result(s); }
