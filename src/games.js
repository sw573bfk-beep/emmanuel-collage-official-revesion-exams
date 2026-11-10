// Live games with friends (/play). The host picks a subject, topic, level, mode and length and gets a
// 6-digit code. Everyone answers their own questions at their own pace; scores update live.
//   speed    – right answers score 500–1000 points (faster = more) plus a streak bonus
//   treasure – each right answer lets you open one of three chests (gold, double, steal, swap, oops…)
//   parkour  – right answers give energy; energy lets your runner move along a parkour course
// Questions are made in the browser; the server keeps the scores, so outcomes (chests) are decided here.

const now = () => Math.floor(Date.now() / 1000);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (status, error) => json({ error }, status);
async function body(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('json');
  const t = await req.text(); if (t.length > 4000) throw new Error('big');
  return JSON.parse(t);
}
export const FINISH = 300; // parkour course length in metres
const MODES = ['speed', 'treasure', 'parkour'];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

async function loadGame(env, code) { return env.DB.prepare('SELECT * FROM games WHERE code = ?').bind(code).first(); }
async function endIfDue(env, g) {
  if (g.status === 'live' && g.ends_at && now() >= g.ends_at) { await env.DB.prepare("UPDATE games SET status = 'ended' WHERE id = ?").bind(g.id).run(); g.status = 'ended'; }
  return g;
}
const event = (env, g, text) => env.DB.prepare('INSERT INTO game_events (game_id, at, text) VALUES (?, ?, ?)').bind(g.id, now(), text);

export async function handleGames(req, env, url, user) {
  const path = url.pathname, method = req.method;
  if (!path.startsWith('/api/game')) return null;
  const me = user.id;

  if (path === '/api/game/create' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const subject = b.subject === 'maths' ? 'maths' : 'science', mode = MODES.includes(b.mode) ? b.mode : 'speed';
    const diff = ['any', 'e', 'm', 'h'].includes(b.diff) ? b.diff : 'any', minutes = [3, 5, 8, 10].includes(+b.minutes) ? +b.minutes : 5;
    const topic = /^[A-Za-z0-9]{1,6}$/.test(String(b.topic || '')) ? String(b.topic) : 'all';
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM games WHERE host_id = ? AND created_at > ?').bind(me, now() - 3600).first();
    if (recent.n >= 15) return err(429, 'You’ve made a lot of games this hour. Try again soon.');
    let code; for (let i = 0; i < 20; i++) { code = String(rand(100000, 999999)); if (!(await env.DB.prepare('SELECT 1 FROM games WHERE code = ?').bind(code).first())) break; }
    const t = now();
    const r = await env.DB.prepare('INSERT INTO games (code, host_id, subject, topic, diff, mode, minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(code, me, subject, topic, diff, mode, minutes, t).run();
    await env.DB.prepare('INSERT INTO game_players (game_id, user_id, name, joined_at) VALUES (?, ?, ?, ?)').bind(r.meta.last_row_id, me, user.username, t).run();
    // tidy up: games older than 2 days
    const old = now() - 2 * 86400;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM game_events WHERE game_id IN (SELECT id FROM games WHERE created_at < ?)').bind(old),
      env.DB.prepare('DELETE FROM game_players WHERE game_id IN (SELECT id FROM games WHERE created_at < ?)').bind(old),
      env.DB.prepare('DELETE FROM games WHERE created_at < ?').bind(old)
    ]);
    return json({ ok: true, code }, 201);
  }
  if (path === '/api/game/join' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const code = String(b.code || '').replace(/\D/g, '');
    const g = code.length === 6 ? await loadGame(env, code) : null;
    if (!g) return err(404, 'There’s no game with that code. Check the 6 digits.');
    await endIfDue(env, g);
    if (g.status === 'ended') return err(410, 'That game has finished.');
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM game_players WHERE game_id = ?').bind(g.id).first();
    const already = await env.DB.prepare('SELECT 1 FROM game_players WHERE game_id = ? AND user_id = ?').bind(g.id, me).first();
    if (!already) {
      if (n.n >= 40) return err(403, 'That game is full (40 players).');
      await env.DB.batch([env.DB.prepare('INSERT INTO game_players (game_id, user_id, name, joined_at) VALUES (?, ?, ?, ?)').bind(g.id, me, user.username, now()), event(env, g, user.username + ' joined')]);
    }
    return json({ ok: true, code });
  }

  const m = path.match(/^\/api\/game\/(\d{6})(?:\/(start|end|answer|chest|run))?$/);
  if (!m) return err(404, 'Not found');
  const g = await loadGame(env, m[1]); if (!g) return err(404, 'There’s no game with that code.');
  await endIfDue(env, g);
  const p = await env.DB.prepare('SELECT * FROM game_players WHERE game_id = ? AND user_id = ?').bind(g.id, me).first();
  if (!p) return err(403, 'Join the game first.');
  const action = m[2] || 'state';

  if (action === 'state' && method === 'GET') {
    const since = Math.max(0, parseInt(url.searchParams.get('ev') || '0', 10) || 0);
    const [ps, ev] = await env.DB.batch([
      env.DB.prepare('SELECT user_id, name, score, dist, energy, correct, answered, streak, finished_at FROM game_players WHERE game_id = ?').bind(g.id),
      env.DB.prepare('SELECT id, at, text FROM game_events WHERE game_id = ? AND id > ? ORDER BY id DESC LIMIT 12').bind(g.id, since)
    ]);
    const players = ps.results.map(r => ({ id: r.user_id, name: r.name, score: r.score, dist: r.dist, correct: r.correct, answered: r.answered, streak: r.streak, done: r.finished_at || null, host: r.user_id === g.host_id, me: r.user_id === me }));
    players.sort(g.mode === 'parkour' ? (a, b) => (a.done && b.done ? a.done - b.done : a.done ? -1 : b.done ? 1 : b.dist - a.dist) : (a, b) => b.score - a.score || b.correct - a.correct);
    players.forEach((x, i) => { x.rank = i + 1; });
    return json({ code: g.code, subject: g.subject, topic: g.topic, diff: g.diff, mode: g.mode, minutes: g.minutes, status: g.status, isHost: g.host_id === me, now: Date.now(), endsAt: g.ends_at ? g.ends_at * 1000 : null, finish: FINISH,
      players, events: ev.results.reverse(), me: { score: p.score, energy: p.energy, dist: p.dist, streak: p.streak, chest: !!p.chest, correct: p.correct, answered: p.answered, done: p.finished_at || null } });
  }
  if (method !== 'POST') return err(404, 'Not found');
  if (action === 'start') {
    if (g.host_id !== me) return err(403, 'Only the host can start the game.');
    if (g.status !== 'lobby') return json({ ok: true });
    const t = now();
    await env.DB.batch([env.DB.prepare("UPDATE games SET status = 'live', started_at = ?, ends_at = ? WHERE id = ?").bind(t, t + g.minutes * 60, g.id), event(env, g, 'The game has started! Go!')]);
    return json({ ok: true });
  }
  if (action === 'end') {
    if (g.host_id !== me) return err(403, 'Only the host can end the game.');
    await env.DB.batch([env.DB.prepare("UPDATE games SET status = 'ended', ends_at = ? WHERE id = ?").bind(now(), g.id), event(env, g, 'The host ended the game.')]);
    return json({ ok: true });
  }
  if (g.status !== 'live') return err(409, g.status === 'lobby' ? 'The game hasn’t started yet.' : 'The game has finished.');
  let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
  const ms = Date.now();

  if (action === 'answer') {
    if (ms - p.last_ms < 900) return err(429, 'Too fast!');
    if (p.chest) return err(409, 'Open your chest first!');
    const ok = !!b.correct, took = Math.max(0, Math.min(60000, +b.ms || 60000));
    const streak = ok ? p.streak + 1 : 0;
    let add = 0, energy = p.energy, chest = 0;
    if (g.mode === 'speed' && ok) add = 500 + Math.round(500 * Math.max(0, 1 - took / 20000)) + Math.min(streak - 1, 5) * 50;
    if (g.mode === 'treasure' && ok) chest = 1;
    if (g.mode === 'parkour' && ok) energy = Math.min(60, energy + 3 + Math.min(streak - 1, 3));
    await env.DB.prepare('UPDATE game_players SET score = score + ?, energy = ?, streak = ?, correct = correct + ?, answered = answered + 1, chest = ?, last_ms = ? WHERE game_id = ? AND user_id = ?')
      .bind(add, energy, streak, ok ? 1 : 0, chest, ms, g.id, me).run();
    if (ok && streak > 0 && streak % 5 === 0) await event(env, g, p.name + ' is on a ' + streak + '-answer streak! 🔥').run();
    return json({ ok: true, add, score: p.score + add, streak, energy, chest: !!chest });
  }

  if (action === 'chest' && g.mode === 'treasure') {
    if (!p.chest) return err(409, 'Answer a question correctly to earn a chest.');
    const others = (await env.DB.prepare('SELECT user_id, name, score FROM game_players WHERE game_id = ? AND user_id != ?').bind(g.id, me).all()).results;
    const r = Math.random(); let text, mine = p.score, stmts = [], kind;
    const target = others.length ? (Math.random() < 0.6 ? others.reduce((a, x) => (x.score > a.score ? x : a), others[0]) : others[rand(0, others.length - 1)]) : null;
    if (r < 0.30) { const v = rand(2, 10) * 5; mine += v; kind = 'gold'; text = '+' + v + ' gold'; }
    else if (r < 0.45) { const v = rand(12, 25) * 5; mine += v; kind = 'big'; text = 'Jackpot! +' + v + ' gold'; }
    else if (r < 0.55) { const v = Math.max(20, mine); mine += v; kind = 'double'; text = 'Double gold! +' + v; }
    else if (r < 0.65) { const v = Math.round(mine * 0.25); mine -= v; kind = 'lose'; text = v ? 'Oops! A leaky chest: −' + v + ' gold' : 'Oops! An empty chest'; }
    else if (r < 0.77 && target && target.score > 0) {
      const v = Math.max(5, Math.round(target.score * (rand(15, 30) / 100))); mine += v; kind = 'steal'; text = 'You stole ' + v + ' gold from ' + target.name + '!';
      stmts.push(env.DB.prepare('UPDATE game_players SET score = MAX(0, score - ?) WHERE game_id = ? AND user_id = ?').bind(v, g.id, target.user_id), event(env, g, p.name + ' stole ' + v + ' gold from ' + target.name + '! 🏴‍☠️'));
    } else if (r < 0.83 && target && target.score !== mine) {
      kind = 'swap'; text = 'Swap! You swapped gold with ' + target.name + ' (' + mine + ' ↔ ' + target.score + ')';
      stmts.push(env.DB.prepare('UPDATE game_players SET score = ? WHERE game_id = ? AND user_id = ?').bind(mine, g.id, target.user_id), event(env, g, p.name + ' swapped gold with ' + target.name + '! 🔄'));
      mine = target.score;
    } else if (r < 0.92) { const v = rand(1, 3) * 5; kind = 'gift'; text = 'Gift for everyone: all players get +' + v + ' gold';
      stmts.push(env.DB.prepare('UPDATE game_players SET score = score + ? WHERE game_id = ? AND user_id != ?').bind(v, g.id, me), event(env, g, p.name + ' gave everyone +' + v + ' gold 🎁')); mine += v;
    } else { const v = rand(4, 8) * 5; mine += v; kind = 'gold'; text = '+' + v + ' gold'; }
    stmts.unshift(env.DB.prepare('UPDATE game_players SET score = ?, chest = 0 WHERE game_id = ? AND user_id = ?').bind(Math.max(0, mine), g.id, me));
    if (kind === 'big' || kind === 'double') stmts.push(event(env, g, p.name + ' found ' + (kind === 'big' ? 'a jackpot' : 'double gold') + '! 💰'));
    await env.DB.batch(stmts);
    return json({ ok: true, kind, text, score: Math.max(0, mine) });
  }

  if (action === 'run' && g.mode === 'parkour') {
    const spent = Math.max(0, Math.min(p.energy, Math.floor(+b.spent || 0))); let gain = Math.round(+b.dist || 0);
    gain = Math.max(-20, Math.min(gain, spent * 4 + (spent > 0 ? 3 : 0))); // 1 energy = 4 m at most (a little slack for part-used energy)
    const dist = Math.max(0, Math.min(FINISH, p.dist + gain)); const done = !p.finished_at && dist >= FINISH;
    const stmts = [env.DB.prepare('UPDATE game_players SET energy = energy - ?, dist = ?, finished_at = COALESCE(finished_at, ?) WHERE game_id = ? AND user_id = ?').bind(spent, dist, done ? ms : null, g.id, me)];
    if (done) {
      const place = (await env.DB.prepare('SELECT COUNT(*) AS n FROM game_players WHERE game_id = ? AND finished_at IS NOT NULL').bind(g.id).first()).n + 1;
      stmts.push(event(env, g, p.name + ' crossed the finish line' + (place === 1 ? ' first! 🏁' : ' in place ' + place + '! 🏁')));
    }
    await env.DB.batch(stmts);
    return json({ ok: true, energy: p.energy - spent, dist, done: done || !!p.finished_at });
  }
  return err(404, 'Not found');
}
