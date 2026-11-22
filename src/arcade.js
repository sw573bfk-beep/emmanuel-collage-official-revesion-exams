// 🕹️ Arcade: just-for-fun games on the same site. Nothing here touches points, study time, rewards or stats.
// ⚡ Neon Rush: an endless runner. Scores are checked against real time: a run must be started first (single-use
// token), and a score can't grow faster than the game allows (distance at top speed, plus every coin and boost).
import { lookView } from './rewards.js';

const QLD = 10 * 3600;
const now = () => Math.floor(Date.now() / 1000);
const dayKey = t => new Date((t + QLD) * 1000).toISOString().slice(0, 10);
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (s, m) => json({ error: m }, s);
// the most points a second of running can earn (top speed with a boost, plus a coin every few metres), plus a little slack
const GAMES = { neon: { maxRate: 450, slack: 3000, maxScore: 10000000 } };
const DAILY_STARTS = 600;

async function body(req) { const t = await req.text(); if (t.length > 2000) throw new Error('too big'); return JSON.parse(t || '{}'); }
function monday(t) { const dow = new Date((t + QLD) * 1000).getUTCDay(); return dayKey(t - ((dow + 6) % 7) * 86400); }

async function board(env, game, from, to, me) {
  const rows = (await env.DB.prepare(`SELECT s.user_id AS id, u.username AS name, u.look, MAX(s.best) AS best FROM arcade_scores s JOIN users u ON u.id = s.user_id
    WHERE s.game = ? AND s.day >= ? AND s.day <= ? AND s.best > 0 GROUP BY s.user_id ORDER BY best DESC, MIN(s.at) ASC LIMIT 100`).bind(game, from, to).all()).results;
  const list = rows.map((r, i) => ({ rank: i + 1, name: r.name, look: lookView(r.look), best: r.best, me: r.id === me }));
  return { top: list.slice(0, 20), me: list.find(x => x.me) || null };
}

export async function handleArcade(req, env, url, user) {
  const path = url.pathname, method = req.method, t = now(), today = dayKey(t), uid = user.id;
  if (path === '/api/arcade/start' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const game = String(b.game || ''); if (!GAMES[game]) return err(400, 'No such game');
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM arcade_runs WHERE user_id = ? AND started_at > ?').bind(uid, t - 86400).first();
    if (n.n >= DAILY_STARTS) return err(429, 'That’s a lot of games today! Have a break and come back tomorrow.');
    const a = new Uint8Array(16); crypto.getRandomValues(a); const token = [...a].map(x => x.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare('INSERT INTO arcade_runs (token, user_id, game, day, started_at) VALUES (?, ?, ?, ?, ?)').bind(token, uid, game, today, t).run();
    return json({ token });
  }
  if (path === '/api/arcade/finish' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const token = String(b.token || ''); if (!/^[0-9a-f]{32}$/.test(token)) return err(400, 'Bad request');
    const run = await env.DB.prepare('SELECT * FROM arcade_runs WHERE token = ? AND user_id = ?').bind(token, uid).first();
    if (!run) return err(404, 'That game wasn’t found. Start a new one.');
    await env.DB.prepare('DELETE FROM arcade_runs WHERE token = ?').bind(token).run();
    const G = GAMES[run.game]; if (!G) return err(400, 'No such game');
    const secs = Math.max(0, t - run.started_at), score = Math.floor(+b.score || 0);
    const ok = score > 0 && score <= G.maxScore && score <= G.maxRate * (secs + 2) + G.slack;
    if (ok) await env.DB.prepare(`INSERT INTO arcade_scores (user_id, game, day, best, plays, at) VALUES (?1, ?2, ?3, ?4, 1, ?5)
      ON CONFLICT(user_id, game, day) DO UPDATE SET plays = plays + 1, best = MAX(best, excluded.best), at = CASE WHEN excluded.best > best THEN excluded.at ELSE at END`).bind(uid, run.game, today, score, t).run();
    const [d, w] = [await board(env, run.game, today, today, uid), await board(env, run.game, monday(t), today, uid)];
    return json({ saved: ok, score, today: d.me, week: w.me });
  }
  if (path === '/api/arcade/board' && method === 'GET') {
    const game = String(url.searchParams.get('game') || 'neon'); if (!GAMES[game]) return err(400, 'No such game');
    return json({ today: await board(env, game, today, today, uid), week: await board(env, game, monday(t), today, uid) });
  }
  return null;
}
