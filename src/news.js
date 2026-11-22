// 📰 News: posts by admins (updates, idea shout-outs) plus automatic ones:
//   🏆 last week's top 3 (every Monday) · 🎉 milestones (accounts, questions answered, hours studied)
//   📊 records (most people studying at once, most questions in a day) · ⚡ yesterday's challenge stars
// Also: 🏠 saving each student's home-page shortcuts.
import { checkText } from './filter.js';
import { classBoard } from './community.js';

const now = () => Math.floor(Date.now() / 1000);
const QLD = 10 * 3600;
const dayKey = t => new Date((t + QLD) * 1000).toISOString().slice(0, 10);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (status, error) => json({ error }, status);
async function body(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('json');
  const t = await req.text(); if (t.length > 6000) throw new Error('big'); return JSON.parse(t);
}
const fmt = n => Number(n).toLocaleString('en-AU');
export const CHIP_IDS = ['streak', 'today', 'week', 'goal', 'timer', 'acc20', 'challenge', 'mistakes', 'leaderboard', 'chat', 'play', 'news', 'profile', 'feedback', 'maths', 'science', 'english'];

// newest news id (cached for 30 s): for the red dot on every page
let latest = { at: 0, id: 0 };
export async function latestNewsId(env) {
  if (Date.now() - latest.at < 30000) return latest.id;
  const r = await env.DB.prepare('SELECT MAX(id) AS id FROM news').first(); latest = { at: Date.now(), id: (r && r.id) || 0 }; return latest.id;
}
async function post(env, { kind, title, body: text = '', author = null, authorId = null, key = null, at = now(), pinned = 0 }) {
  const r = await env.DB.prepare('INSERT OR IGNORE INTO news (kind, title, body, author, author_id, pinned, key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(kind, title, text, author, authorId, pinned, key, at).run();
  latest.at = 0; return r.meta && r.meta.changes;
}
const hasKey = async (env, key) => !!(await env.DB.prepare('SELECT 1 FROM news WHERE key = ?').bind(key).first());

/* ---------- 📊 "most people studying at once" (checked from study pings, at most once a minute) ---------- */
let onlineCheckAt = 0;
export async function checkOnlineRecord(env) {
  if (Date.now() - onlineCheckAt < 60000) return; onlineCheckAt = Date.now();
  const t = now();
  const r = await env.DB.prepare('SELECT COUNT(DISTINCT v.user_id) AS n FROM visits v JOIN users u ON u.id = v.user_id AND u.in_stats = 1 WHERE v.last_seen > ?').bind(t - 120).first();
  const n = (r && r.n) || 0;
  const s = await env.DB.prepare("SELECT value FROM settings WHERE key = 'rec_online'").first();
  const best = s ? (JSON.parse(s.value).n || 0) : 0;
  if (n <= best) return;
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('rec_online', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify({ n, at: t })).run();
  if (n < 5) return; // too small to be news yet
  const key = 'record:online:' + dayKey(t), title = '📊 New record: ' + n + ' people studying at once!', text = 'At ' + new Date((t + QLD) * 1000).toISOString().slice(11, 16) + ' on ' + new Date((t + QLD) * 1000).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + ', ' + n + ' people were studying on EC Revisions at the same time. The old record was ' + best + '.';
  if (await hasKey(env, key)) await env.DB.prepare('UPDATE news SET title = ?, body = ?, created_at = ? WHERE key = ?').bind(title, text, t, key).run(); // beaten again today: update today's post
  else await post(env, { kind: 'record', title, body: text, key, at: t });
  latest.at = 0;
}

/* ---------- 🤖 the automatic posts (run nightly, and at most every 10 minutes when someone opens News) ---------- */
let autoAt = 0;
export async function autoNews(env, force) {
  if (!force && Date.now() - autoAt < 600000) return; autoAt = Date.now();
  const t = now(), today = dayKey(t), dow = new Date((t + QLD) * 1000).getUTCDay();
  // 🏆 last week's winners (Monday to Sunday), posted from Monday
  const thisMon = dayKey(t - ((dow + 6) % 7) * 86400), m0 = Date.parse(thisMon + 'T00:00:00Z');
  const lastMon = new Date(m0 - 7 * 86400000).toISOString().slice(0, 10), lastSun = new Date(m0 - 86400000).toISOString().slice(0, 10);
  if (!(await hasKey(env, 'winners:' + lastMon))) {
    const r = await env.DB.prepare(`SELECT u.username AS name, COALESCE(m.s, 0) / 60 + COALESCE(p.q, 0) + COALESCE(p.b, 0) AS pts FROM users u
      LEFT JOIN (SELECT user_id, SUM(seconds) AS s FROM daily WHERE day >= ?1 AND day <= ?2 GROUP BY user_id) m ON m.user_id = u.id
      LEFT JOIN (SELECT user_id, SUM(qpts) AS q, SUM(booklet) AS b FROM points_daily WHERE day >= ?1 AND day <= ?2 GROUP BY user_id) p ON p.user_id = u.id
      WHERE u.in_stats = 1 AND u.lb_hidden = 0 AND lower(u.username) != lower(?3) ORDER BY pts DESC LIMIT 3`).bind(lastMon, lastSun, String(env.ADMIN_USERNAME || '')).all();
    const top = r.results.filter(x => x.pts > 0);
    if (top.length) {
      const medal = ['🥇', '🥈', '🥉'], when = new Date(lastMon + 'T00:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' }) + ' – ' + new Date(lastSun + 'T00:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
      await post(env, { kind: 'winners', title: '🏆 Last week’s winners: ' + top[0].name + (top.length > 1 ? ', ' + top.slice(1).map(x => x.name).join(' and ') : ''), body: top.map((x, i) => medal[i] + ' ' + x.name + ': ' + fmt(Math.floor(x.pts)) + ' points').join('\n') + '\n\nThe leaderboard week ' + when + '. Well done! A new week has started, so everyone’s back to 0.', key: 'winners:' + lastMon });
    }
  }
  // 🏫 last week's class of the week (needs 2+ classes)
  if (!(await hasKey(env, 'classes:' + lastMon))) {
    const cb = await classBoard(env, 0, 'week', lastMon, lastSun), cl = cb.classes.filter(c => c.total > 0);
    if (cb.classes.length >= 2 && cl.length) {
      await post(env, { kind: 'winners', title: '🏫 Class of the week: ' + cl[0].name, body: cb.classes.slice(0, 5).map((c, i) => (['🥇', '🥈', '🥉'][i] || (i + 1) + '.') + ' ' + c.name + ': ' + fmt(c.avg) + ' points per student (' + c.students + ' students)').join('\n') + '\n\nClasses are ranked by average points per student, so every class has a fair chance.', key: 'classes:' + lastMon });
    }
  }
  // ⚡ yesterday's challenge stars
  const yday = dayKey(t - 86400);
  if (!(await hasKey(env, 'challenge:' + yday))) {
    const r = await env.DB.prepare('SELECT COUNT(*) AS n, SUM(c.score = 5) AS perfect FROM challenge c JOIN users u ON u.id = c.user_id AND u.in_stats = 1 WHERE c.day = ? AND c.done = 1').bind(yday).first();
    if (r && r.n >= 3) {
      const ps = await env.DB.prepare('SELECT u.username AS name FROM challenge c JOIN users u ON u.id = c.user_id AND u.in_stats = 1 AND u.lb_hidden = 0 WHERE c.day = ? AND c.done = 1 AND c.score = 5 ORDER BY c.done_at LIMIT 8').bind(yday).all();
      const names = ps.results.map(x => x.name);
      await post(env, { kind: 'challenge', title: '⚡ Yesterday’s challenge: ' + r.n + ' people played, ' + (r.perfect || 0) + ' got 5/5', body: (names.length ? '🌟 Perfect scores: ' + names.join(', ') + (r.perfect > names.length ? ' and more' : '') + '.' : 'Nobody got 5 out of 5. Can you do it today?') + '\n\nToday’s challenge is waiting for you on the home page.', key: 'challenge:' + yday });
    }
  }
  // 🎉 milestones (only the biggest one reached is posted, so nothing floods in)
  const [acc, qs, hrs, dayQ] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE in_stats = 1'),
    env.DB.prepare('SELECT COUNT(*) AS n FROM answers'),
    env.DB.prepare('SELECT COALESCE(SUM(seconds), 0) / 3600 AS n FROM daily'),
    env.DB.prepare("SELECT date(at + 36000, 'unixepoch') AS d, COUNT(*) AS n FROM answers WHERE at >= ? GROUP BY d ORDER BY n DESC LIMIT 1").bind(t - 40 * 86400)
  ]);
  const MS = [
    ['accounts', acc.results[0].n, [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000], n => '🎉 ' + fmt(n) + ' accounts!', (n, v) => 'EC Revisions has passed ' + fmt(n) + ' student accounts' + (v > n ? ' (it’s at ' + fmt(v) + ' now)' : '') + '. Thanks for spreading the word!'],
    ['questions', qs.results[0].n, [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000], n => '🎉 ' + fmt(n) + ' questions answered!', (n, v) => 'Together you’ve answered more than ' + fmt(n) + ' questions on EC Revisions' + (v > n ? ' (' + fmt(v) + ' so far)' : '') + '. Keep it up!'],
    ['hours', Math.floor(hrs.results[0].n), [50, 100, 250, 500, 1000, 2500, 5000], n => '🎉 ' + fmt(n) + ' hours of studying!', (n, v) => 'Everyone together has now studied for more than ' + fmt(n) + ' hours on EC Revisions' + (v > n ? ' (' + fmt(v) + ' hours so far)' : '') + '.']
  ];
  for (const [k, val, steps, title, text] of MS) {
    const hit = steps.filter(s => val >= s).pop(); if (!hit) continue;
    await post(env, { kind: 'milestone', title: title(hit), body: text(hit, val), key: 'milestone:' + k + ':' + hit });
  }
  // 📊 record: most questions answered in one day (checked for finished days only)
  const dq = dayQ.results[0];
  if (dq && dq.d < today && dq.n >= 200) {
    const s = await env.DB.prepare("SELECT value FROM settings WHERE key = 'rec_day_q'").first(), best = s ? JSON.parse(s.value) : { n: 0 };
    if (dq.n > best.n) {
      await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('rec_day_q', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify({ n: dq.n, d: dq.d })).run();
      await post(env, { kind: 'record', title: '📊 New record: ' + fmt(dq.n) + ' questions in one day!', body: 'On ' + new Date(dq.d + 'T00:00:00Z').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) + ', everyone together answered ' + fmt(dq.n) + ' questions.' + (best.n ? ' The old record was ' + fmt(best.n) + '.' : ''), key: 'record:dayq:' + dq.d });
    }
  }
}

export async function handleNews(req, env, url, user) {
  const path = url.pathname, method = req.method;
  if (path === '/api/news' && method === 'GET') {
    try { await autoNews(env); } catch (e) { console.error('autoNews', e); }
    const r = await env.DB.prepare('SELECT id, kind, title, body, author, pinned, created_at FROM news ORDER BY pinned DESC, created_at DESC, id DESC LIMIT 60').all();
    const seen = await env.DB.prepare('SELECT news_seen FROM users WHERE id = ?').bind(user.id).first();
    return json({ now: now(), list: r.results, seen: (seen && seen.news_seen) || 0 });
  }
  if (path === '/api/news/seen' && method === 'POST') {
    const id = await latestNewsId(env);
    await env.DB.prepare('UPDATE users SET news_seen = MAX(news_seen, ?) WHERE id = ?').bind(id, user.id).run();
    return json({ ok: true });
  }
  // 🏠 the shortcuts at the top of your home page
  if (path === '/api/home-chips' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const list = Array.isArray(b.chips) ? [...new Set(b.chips.map(String).filter(x => CHIP_IDS.includes(x)))].slice(0, 15) : null;
    if (!list) return err(400, 'Bad request');
    await env.DB.prepare('UPDATE users SET home_chips = ? WHERE id = ?').bind(JSON.stringify(list), user.id).run();
    return json({ ok: true, chips: list });
  }
  return null;
}

// admins (any admin level) post, pin and delete news
export async function handleNewsAdmin(req, env, url, me, role) {
  const path = url.pathname, method = req.method;
  if (path !== '/api/admin/news') return null;
  if (method === 'GET') {
    const r = await env.DB.prepare('SELECT id, kind, title, body, author, pinned, key, created_at FROM news ORDER BY created_at DESC, id DESC LIMIT 100').all();
    return json({ now: now(), list: r.results, role });
  }
  let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
  if (b.action === 'delete' || b.action === 'pin') {
    const id = Number(b.id); if (!Number.isInteger(id)) return err(400, 'Bad request');
    if (b.action === 'delete') await env.DB.prepare('DELETE FROM news WHERE id = ?').bind(id).run();
    else await env.DB.prepare('UPDATE news SET pinned = ? WHERE id = ?').bind(b.pinned ? 1 : 0, id).run();
    latest.at = 0; return json({ ok: true });
  }
  const kind = ['update', 'idea', 'shout'].includes(b.kind) ? b.kind : 'update';
  const title = String(b.title || '').replace(/\s+/g, ' ').trim(), text = String(b.body || '').replace(/\r\n?/g, '\n').trim(), who = String(b.who || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (title.length < 3) return err(400, 'Give it a title.'); if (title.length > 120) return err(400, 'Keep the title under 120 characters.'); if (text.length > 1500) return err(400, 'Keep it under 1500 characters.');
  if (role !== 'owner') { for (const s of [title, text, who]) { const f = checkText(s); if (s && !f.ok) return err(422, f.message); } }
  const fullTitle = kind === 'idea' && who && !title.includes(who) ? title + ' (idea from ' + who + ')' : title;
  await post(env, { kind, title: fullTitle, body: text, author: me.username, authorId: me.id, pinned: b.pinned ? 1 : 0 });
  return json({ ok: true }, 201);
}
