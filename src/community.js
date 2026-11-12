// Student chats (1-on-1 chats between friends that start with a friend request), the leaderboard,
// and Beau's moderation tools. Every student message goes through the strict filter in filter.js.
import { checkText, checkPieces } from './filter.js';

const MAX_LEN = 2000;
export const MAX_CORRECT_DAY = 400, MAX_BOOKLET_DAY = 250; // leaderboard points caps per person per day
// Messages that look like the site's own notes ("[game:…]", "[chat-allowed]"…) can't be typed by people
export const FAKE_NOTE = /^\s*\[[a-z-]+(:[^\]]*)?\]\s*$/i;
const now = () => Math.floor(Date.now() / 1000);
const QLD = 10 * 3600;
const dayKey = t => new Date((t + QLD) * 1000).toISOString().slice(0, 10);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (status, error) => json({ error }, status);
async function body(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('json');
  const t = await req.text(); if (t.length > 8000) throw new Error('big');
  return JSON.parse(t);
}
const isAdmin = (user, env) => !!user && user.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase();

export async function logBlocked(env, userId, place, why, text) {
  await env.DB.prepare('INSERT INTO filter_log (user_id, place, why, body, created_at) VALUES (?, ?, ?, ?, ?)').bind(userId || null, place, why, String(text || '').slice(0, 300), now()).run();
}

// Check a student's message: filter, length, mute and speed. Returns an error Response, or null if it's fine.
async function vet(env, user, place, text) {
  if (!text) return err(400, 'Type a message first.');
  if (text.length > MAX_LEN) return err(400, 'Messages can be up to ' + MAX_LEN + ' characters.');
  if (FAKE_NOTE.test(text)) return err(400, 'That message can’t be sent. Type it a different way.');
  const u = await env.DB.prepare('SELECT chat_muted FROM users WHERE id = ?').bind(user.id).first();
  if (u && u.chat_muted) return err(403, 'Beau has paused chatting on your account. You can still message Beau in the ✉️ Beau tab.');
  let r = checkText(text);
  if (r.ok) { // words sent a letter or two at a time across several messages
    const rec = await env.DB.prepare('SELECT body FROM dm_messages WHERE user_id = ? AND created_at > ? ORDER BY id DESC LIMIT 8').bind(user.id, now() - 180).all();
    r = checkPieces(rec.results.map(x => x.body).reverse(), text);
  }
  if (!r.ok) { await logBlocked(env, user.id, place, r.why, text); return err(422, r.message); }
  const t = now();
  const fast = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM group_messages WHERE user_id = ?1 AND created_at > ?2) + (SELECT COUNT(*) FROM dm_messages WHERE user_id = ?1 AND created_at > ?2) AS n, (SELECT MAX(created_at) FROM (SELECT created_at FROM group_messages WHERE user_id = ?1 UNION ALL SELECT created_at FROM dm_messages WHERE user_id = ?1)) AS last').bind(user.id, t - 60).first();
  if (fast.n >= 60) return err(429, 'Slow down a little, then send it again.'); // only stops spam bots: 60 messages in one minute
  return null;
}

const blockedEither = async (env, x, y) => !!(await env.DB.prepare('SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)').bind(x, y, y, x).first());
const pair = (x, y) => (x < y ? [x, y] : [y, x]);
const ONLINE_SECS = 180; // friends count as online if seen in the last 3 minutes
const GAME_MSG = /^\[game:(\d{6}):(speed|treasure|parkour):(science|maths)\]$/; // a game invite sent from Play with friends

// The leaderboard for this week (from Monday, Queensland time) or all time, and your place in it
export async function leaderboard(env, me, range, admin) {
  const t = now(); const dow = new Date((t + QLD) * 1000).getUTCDay();
  const from = range === 'all' ? '0000-00-00' : dayKey(t - ((dow + 6) % 7) * 86400); // Monday (Queensland time)
  const [people, mins, pts] = await env.DB.batch([
    env.DB.prepare('SELECT id, username, in_stats FROM users'),
    env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily WHERE day >= ? GROUP BY user_id').bind(from),
    env.DB.prepare('SELECT user_id, SUM(correct) AS c, SUM(booklet) AS b FROM points_daily WHERE day >= ? GROUP BY user_id').bind(from)
  ]);
  const M = Object.fromEntries(mins.results.map(r => [r.user_id, r.s || 0])), P = Object.fromEntries(pts.results.map(r => [r.user_id, r]));
  const adminName = String(env.ADMIN_USERNAME || '').toLowerCase();
  const rows = people.results.filter(u => u.in_stats && u.username.toLowerCase() !== adminName).map(u => {
    const minutes = Math.floor((M[u.id] || 0) / 60), correct = (P[u.id] || {}).c || 0, booklet = (P[u.id] || {}).b || 0;
    return { id: u.id, name: u.username, minutes, correct, booklet, points: minutes + 2 * correct + booklet };
  }).filter(r => r.points > 0).sort((a, b) => b.points - a.points || b.minutes - a.minutes || a.name.localeCompare(b.name));
  let rank = 0, prev = null;
  rows.forEach((r, i) => { if (r.points !== prev) { rank = i + 1; prev = r.points; } r.rank = rank; });
  const mine = rows.find(r => r.id === me);
  const meUser = people.results.find(u => u.id === me);
  return {
    range, from, total: rows.length,
    top: rows.slice(0, 50).map(r => ({ rank: r.rank, id: r.id, name: r.name, points: r.points, minutes: r.minutes, correct: r.correct, booklet: r.booklet, me: r.id === me })),
    me: mine ? { rank: mine.rank, points: mine.points, minutes: mine.minutes, correct: mine.correct, booklet: mine.booklet } : null,
    leftOut: !meUser || !meUser.in_stats || admin, admin
  };
}

export async function handleCommunity(req, env, url, user) {
  const path = url.pathname, method = req.method;
  const me = user.id, admin = isAdmin(user, env);

  /* ---------- leaderboard ---------- */
  if (path === '/api/leaderboard' && method === 'GET') return json(await leaderboard(env, me, url.searchParams.get('range') === 'all' ? 'all' : 'week', admin));

  if (!path.startsWith('/api/chat/')) return null;

  /* ---------- chat access: students ask Beau first ---------- */
  // Every chat between two students needs both of them to agree AND Beau to approve that pair (see 'approval' below),
  // so the old per-account "chat access" gate is no longer needed.
  const acc = { chat_req: null }, access = true;
  if (path === '/api/chat/access-request' && method === 'POST') {
    if (access) return json({ ok: true, access: true });
    if (acc.chat_req) return json({ ok: true, pending: true });
    const last = await env.DB.prepare("SELECT body, created_at FROM messages WHERE user_id = ? AND from_admin = 1 AND body IN ('[chat-declined]', '[chat-removed]') ORDER BY id DESC LIMIT 1").bind(me).first();
    if (last && now() - last.created_at < 86400) return err(429, 'Beau said not yet. You can ask again tomorrow, or send Beau a message.');
    const t = now();
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET chat_req = ? WHERE id = ?').bind(t, me),
      env.DB.prepare("INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 0, '[chat-request]', ?)").bind(me, t)
    ]);
    return json({ ok: true, pending: true }, 201);
  }
  if (!access) {
    if (path === '/api/chat/summary' && method === 'GET') {
      await env.DB.prepare('UPDATE users SET last_seen = ?1 WHERE id = ?2 AND (last_seen IS NULL OR last_seen < ?1 - 60)').bind(now(), me).run();
      return json({ access: false, requested: !!acc.chat_req, requests: 0, unreadDm: 0, unreadGroup: 0, muted: false, admin });
    }
    return json({ error: 'Ask Beau for chat access first. Go to Chat and tap “Ask Beau for chat access”.', locked: true }, 403);
  }

  /* ---------- badge counts ---------- */
  if (path === '/api/chat/summary' && method === 'GET') {
    const [req_, dm, u] = await env.DB.batch([
      env.DB.prepare("SELECT COUNT(*) AS n FROM dm_threads WHERE status = 'pending' AND requested_by != ?1 AND (a = ?1 OR b = ?1)").bind(me),
      env.DB.prepare("SELECT COUNT(*) AS n FROM dm_messages m JOIN dm_threads t ON t.id = m.thread_id WHERE t.status = 'active' AND (t.a = ?1 OR t.b = ?1) AND m.user_id != ?1 AND m.hidden = 0 AND m.id > (CASE WHEN t.a = ?1 THEN t.a_read ELSE t.b_read END)").bind(me),
      env.DB.prepare('SELECT chat_muted FROM users WHERE id = ?').bind(me)
    ]);
    await env.DB.prepare('UPDATE users SET last_seen = ?1 WHERE id = ?2 AND (last_seen IS NULL OR last_seen < ?1 - 60)').bind(now(), me).run();
    return json({ access: true, requests: req_.results[0].n, unreadDm: dm.results[0].n, unreadGroup: 0, muted: !!(u.results[0] || {}).chat_muted, admin });
  }

  /* ---------- 1-on-1 chats ---------- */
  if (path === '/api/chat/threads' && method === 'GET') {
    const [rows, blocked] = await env.DB.batch([
      env.DB.prepare(`SELECT t.id, t.status, t.requested_by, t.updated_at, CASE WHEN t.a = ?1 THEN t.b ELSE t.a END AS other, u.username AS name, u.last_seen AS seen,
        (SELECT CASE WHEN body LIKE '[game:%' THEN '🎮 Game invite' ELSE body END FROM dm_messages WHERE thread_id = t.id AND hidden = 0 ORDER BY id DESC LIMIT 1) AS last,
        (SELECT COUNT(*) FROM dm_messages m WHERE m.thread_id = t.id AND m.user_id != ?1 AND m.hidden = 0 AND m.id > (CASE WHEN t.a = ?1 THEN t.a_read ELSE t.b_read END)) AS unread
        FROM dm_threads t JOIN users u ON u.id = (CASE WHEN t.a = ?1 THEN t.b ELSE t.a END)
        WHERE (t.a = ?1 OR t.b = ?1) AND t.status IN ('pending', 'approval', 'active') ORDER BY t.updated_at DESC`).bind(me),
      env.DB.prepare('SELECT b.blocked_id AS id, u.username AS name FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.user_id = ? ORDER BY u.username').bind(me)
    ]);
    const t0 = now();
    return json({ now: t0, threads: rows.results.map(r => { const friend = r.status === 'active'; return { id: r.id, other: r.other, name: r.name, status: r.status, byMe: r.requested_by === me, last: friend ? r.last : null, unread: friend ? r.unread : 0, at: r.updated_at, seen: friend ? (r.seen || 0) : null, online: friend && t0 - (r.seen || 0) < ONLINE_SECS }; }), blocked: blocked.results });
  }
  if (path === '/api/chat/people' && method === 'GET') {
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 30);
    if (!q) return json({ people: [] });
    const adminName = String(env.ADMIN_USERNAME || '');
    const esc = q.replace(/[\\%_]/g, c => '\\' + c);
    const rows = await env.DB.prepare(`SELECT u.id, u.username, u.last_subject,
        t.id AS tid, t.status, t.requested_by
      FROM users u LEFT JOIN dm_threads t ON (t.a = MIN(u.id, ?2) AND t.b = MAX(u.id, ?2))
      WHERE u.username LIKE ?1 ESCAPE '\\' AND u.id != ?2 AND u.username != ?3 COLLATE NOCASE
        AND u.id NOT IN (SELECT blocked_id FROM blocks WHERE user_id = ?2) AND u.id NOT IN (SELECT user_id FROM blocks WHERE blocked_id = ?2)
      ORDER BY (u.username LIKE ?4 ESCAPE '\\') DESC, u.username COLLATE NOCASE LIMIT 12`)
      .bind('%' + esc + '%', me, adminName, esc + '%').all();
    const state = r => r.status === 'active' ? 'friend' : r.status === 'approval' ? 'waiting' : r.status === 'pending' ? (r.requested_by === me ? 'sent' : 'incoming') : 'none';
    return json({ people: rows.results.map(r => ({ id: r.id, name: r.username, subject: r.last_subject === 'maths' ? 'Maths' : r.last_subject === 'science' ? 'Science' : r.last_subject === 'english' ? 'English' : null, state: state(r), thread: r.tid || null })) });
  }
  // remove a friend, or cancel a request you sent (the messages stay for Beau to check)
  if (path === '/api/chat/unfriend' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const th = await env.DB.prepare('SELECT * FROM dm_threads WHERE id = ?').bind(+b.id || 0).first();
    if (!th || (th.a !== me && th.b !== me) || !(th.status === 'active' || th.status === 'approval' || (th.status === 'pending' && th.requested_by === me))) return err(404, 'That friend isn’t there any more.');
    await env.DB.prepare("UPDATE dm_threads SET status = 'ended', requested_by = ?, updated_at = ? WHERE id = ?").bind(me, now(), th.id).run();
    return json({ ok: true });
  }
  if (path === '/api/chat/request' && method === 'POST') {
    if (admin) return err(400, 'You can message students from the dashboard.');
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const target = b.id ? await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(+b.id).first()
      : await env.DB.prepare('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE').bind(String(b.name || '').trim()).first();
    if (!target) return err(404, 'There’s no student with that name.');
    if (target.id === me) return err(400, 'That’s you!');
    if (isAdmin(target, env)) return err(400, 'To talk to Beau, use the ✉️ Beau tab.');
    const mu = await env.DB.prepare('SELECT chat_muted FROM users WHERE id = ?').bind(me).first();
    if (mu && mu.chat_muted) return err(403, 'Beau has paused chatting on your account. You can still message Beau in the ✉️ Beau tab.');
    if (await blockedEither(env, me, target.id)) return err(403, 'You can’t chat with this person.');
    const [a, bb] = pair(me, target.id), t = now();
    const ex = await env.DB.prepare('SELECT * FROM dm_threads WHERE a = ? AND b = ?').bind(a, bb).first();
    if (ex) {
      if (ex.status === 'active' || ex.status === 'approval') return json({ ok: true, id: ex.id, status: ex.status });
      if (ex.status === 'pending' && ex.requested_by !== me) { // they asked you too: both agree, now Beau checks it
        await env.DB.prepare("UPDATE dm_threads SET status = 'approval', updated_at = ? WHERE id = ?").bind(t, ex.id).run();
        return json({ ok: true, id: ex.id, status: 'approval' });
      }
      if (ex.status === 'refused' && t - ex.updated_at < 7 * 86400) return err(429, 'Beau didn’t approve a chat between you two. You can ask again in a week.');
      if (ex.status === 'pending') return json({ ok: true, id: ex.id, status: 'pending' });
      if (ex.status === 'declined' && ex.requested_by === me && t - ex.updated_at < 7 * 86400) return err(429, target.username + ' said no for now. You can send another friend request in a week.');
    }
    const sent = await env.DB.prepare('SELECT COUNT(*) AS n FROM dm_threads WHERE requested_by = ? AND updated_at > ? AND status = \'pending\'').bind(me, t - 86400).first();
    if (sent.n >= 10) return err(429, 'You’ve sent a lot of friend requests today. Try again tomorrow.');
    if (ex) await env.DB.prepare("UPDATE dm_threads SET status = 'pending', requested_by = ?, updated_at = ? WHERE id = ?").bind(me, t, ex.id).run();
    else await env.DB.prepare("INSERT INTO dm_threads (a, b, status, requested_by, created_at, updated_at) VALUES (?, ?, 'pending', ?, ?, ?)").bind(a, bb, me, t, t).run();
    const th = await env.DB.prepare('SELECT id FROM dm_threads WHERE a = ? AND b = ?').bind(a, bb).first();
    return json({ ok: true, id: th.id, status: 'pending' }, 201);
  }
  if (path === '/api/chat/respond' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const th = await env.DB.prepare('SELECT * FROM dm_threads WHERE id = ?').bind(+b.id || 0).first();
    if (!th || (th.a !== me && th.b !== me) || th.status !== 'pending' || th.requested_by === me) return err(404, 'That request isn’t there any more.');
    // both agree → Beau has to approve the pair before they can chat
    await env.DB.prepare('UPDATE dm_threads SET status = ?, updated_at = ? WHERE id = ?').bind(b.accept ? 'approval' : 'declined', now(), th.id).run();
    return json({ ok: true, status: b.accept ? 'approval' : 'declined' });
  }
  const dm = path.match(/^\/api\/chat\/dm\/(\d+)$/);
  if (dm) {
    const th = await env.DB.prepare('SELECT t.*, u.username AS name FROM dm_threads t JOIN users u ON u.id = (CASE WHEN t.a = ?2 THEN t.b ELSE t.a END) WHERE t.id = ?1 AND (t.a = ?2 OR t.b = ?2)').bind(+dm[1], me).first();
    if (!th) return err(404, 'That chat isn’t there.');
    const other = th.a === me ? th.b : th.a;
    if (method === 'GET') {
      const after = Math.max(0, parseInt(url.searchParams.get('after') || '0', 10) || 0);
      const rows = th.status === 'active' ? (await env.DB.prepare('SELECT id, user_id, body, created_at FROM dm_messages WHERE thread_id = ? AND hidden = 0 AND id > ? ORDER BY id DESC LIMIT 200').bind(th.id, after).all()).results.reverse() : [];
      if (rows.length) await env.DB.prepare(`UPDATE dm_threads SET ${th.a === me ? 'a_read' : 'b_read'} = MAX(${th.a === me ? 'a_read' : 'b_read'}, ?) WHERE id = ?`).bind(rows[rows.length - 1].id, th.id).run();
      return json({ thread: { id: th.id, other, name: th.name, status: th.status, byMe: th.requested_by === me }, messages: rows.map(r => ({ id: r.id, mine: r.user_id === me, body: r.body, at: r.created_at })) });
    }
    if (method === 'POST') {
      if (th.status !== 'active') return err(403, th.status === 'pending' ? 'Wait for ' + th.name + ' to accept your friend request.' : th.status === 'approval' ? 'Beau needs to approve this chat first.' : 'This chat is closed.');
      if (await blockedEither(env, me, other)) return err(403, 'This chat is closed.');
      let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
      let text = String(b.body || '').replace(/\r\n?/g, '\n').trim();
      if (b.invite) {
        const g = await env.DB.prepare("SELECT g.code, g.mode, g.subject FROM games g JOIN game_players p ON p.game_id = g.id AND p.user_id = ? WHERE g.code = ? AND g.status != 'ended'").bind(me, String(b.invite)).first();
        if (!g) return err(404, 'That game has finished.');
        const mu = await env.DB.prepare('SELECT chat_muted FROM users WHERE id = ?').bind(me).first();
        if (mu && mu.chat_muted) return err(403, 'Beau has paused chatting on your account. You can still message Beau in the ✉️ Beau tab.');
        const dup = await env.DB.prepare('SELECT id FROM dm_messages WHERE thread_id = ? AND user_id = ? AND body LIKE ?').bind(th.id, me, '[game:' + g.code + ':%').first();
        if (dup) return json({ ok: true, id: dup.id, already: true });
        text = '[game:' + g.code + ':' + g.mode + ':' + g.subject + ']';
      } else { const bad = await vet(env, user, 'chat with ' + th.name, text); if (bad) return bad; }
      const t = now();
      const r = await env.DB.prepare('INSERT INTO dm_messages (thread_id, user_id, body, created_at) VALUES (?, ?, ?, ?)').bind(th.id, me, text, t).run();
      await env.DB.prepare(`UPDATE dm_threads SET updated_at = ?, ${th.a === me ? 'a_read' : 'b_read'} = ? WHERE id = ?`).bind(t, r.meta.last_row_id, th.id).run();
      return json({ ok: true, id: r.meta.last_row_id }, 201);
    }
  }
  if ((path === '/api/chat/block' || path === '/api/chat/unblock') && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const other = +b.userId || 0; if (!other || other === me) return err(400, 'Bad request');
    const [a, bb] = pair(me, other);
    if (path === '/api/chat/block') {
      await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO blocks (user_id, blocked_id, created_at) VALUES (?, ?, ?)').bind(me, other, now()),
        env.DB.prepare("UPDATE dm_threads SET status = 'blocked', updated_at = ? WHERE a = ? AND b = ?").bind(now(), a, bb)
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?').bind(me, other),
        env.DB.prepare("UPDATE dm_threads SET status = 'declined', requested_by = ?, updated_at = 0 WHERE a = ? AND b = ? AND status = 'blocked'").bind(other, a, bb)
      ]);
    }
    return json({ ok: true });
  }
  if (path === '/api/chat/report' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const kind = 'dm', id = +b.id || 0; // the everyone group chat was removed: only 1-on-1 messages can be reported
    const msg = await env.DB.prepare('SELECT m.id FROM dm_messages m JOIN dm_threads t ON t.id = m.thread_id WHERE m.id = ? AND (t.a = ? OR t.b = ?) AND m.user_id != ?').bind(id, me, me, me).first();
    if (!msg) return err(404, 'That message isn’t there.');
    const dup = await env.DB.prepare('SELECT id FROM chat_reports WHERE reporter_id = ? AND kind = ? AND message_id = ?').bind(me, kind, id).first();
    if (!dup) await env.DB.prepare('INSERT INTO chat_reports (reporter_id, kind, message_id, created_at) VALUES (?, ?, ?, ?)').bind(me, kind, id, now()).run();
    return json({ ok: true });
  }
  return err(404, 'Not found');
}

/* ---------- Beau's moderation (dashboard) ---------- */
export async function handleCommunityAdmin(req, env, url, role = 'owner') {
  const top = role === 'owner' || role === 'top'; // Basic admins can only restrict: no approving, unpausing or restoring
  const path = url.pathname, method = req.method;
  if (!path.startsWith('/api/admin/chat/')) return null;
  if (path === '/api/admin/chat/overview' && method === 'GET') {
    const [group, threads, reports, blocked, muted, people] = await env.DB.batch([
      env.DB.prepare('SELECT g.id, g.body, g.created_at, g.hidden, u.username AS name, u.id AS uid FROM group_messages g JOIN users u ON u.id = g.user_id ORDER BY g.id DESC LIMIT 200'),
      env.DB.prepare(`SELECT t.id, t.status, t.updated_at, ua.username AS a_name, ub.username AS b_name, (SELECT COUNT(*) FROM dm_messages WHERE thread_id = t.id) AS n
        FROM dm_threads t JOIN users ua ON ua.id = t.a JOIN users ub ON ub.id = t.b ORDER BY t.updated_at DESC LIMIT 200`),
      env.DB.prepare(`SELECT r.id, r.kind, r.message_id, r.created_at, r.status, ru.username AS reporter,
        CASE r.kind WHEN 'dm' THEN (SELECT body FROM dm_messages WHERE id = r.message_id) ELSE (SELECT body FROM group_messages WHERE id = r.message_id) END AS body,
        CASE r.kind WHEN 'dm' THEN (SELECT u.username FROM dm_messages m JOIN users u ON u.id = m.user_id WHERE m.id = r.message_id) ELSE (SELECT u.username FROM group_messages m JOIN users u ON u.id = m.user_id WHERE m.id = r.message_id) END AS author,
        CASE r.kind WHEN 'dm' THEN (SELECT hidden FROM dm_messages WHERE id = r.message_id) ELSE (SELECT hidden FROM group_messages WHERE id = r.message_id) END AS hidden,
        CASE r.kind WHEN 'dm' THEN (SELECT thread_id FROM dm_messages WHERE id = r.message_id) ELSE NULL END AS thread
        FROM chat_reports r JOIN users ru ON ru.id = r.reporter_id ORDER BY r.status = 'new' DESC, r.id DESC LIMIT 100`),
      env.DB.prepare('SELECT f.id, f.place, f.why, f.body, f.created_at, u.username AS name FROM filter_log f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.id DESC LIMIT 100'),
      env.DB.prepare('SELECT id, username AS name FROM users WHERE chat_muted = 1 ORDER BY username'),
      env.DB.prepare('SELECT id, username AS name, chat_access AS access, chat_req AS req, last_seen AS seen FROM users WHERE username != ? COLLATE NOCASE ORDER BY chat_req IS NULL, chat_req, username COLLATE NOCASE').bind(String(env.ADMIN_USERNAME || ''))
    ]);
    return json({ group: group.results, threads: threads.results, reports: reports.results, blocked: blocked.results, muted: muted.results, people: people.results });
  }
  const dm = path.match(/^\/api\/admin\/chat\/dm\/(\d+)$/);
  if (dm && method === 'GET') {
    const rows = await env.DB.prepare('SELECT m.id, m.body, m.created_at, m.hidden, u.username AS name FROM dm_messages m JOIN users u ON u.id = m.user_id WHERE m.thread_id = ? ORDER BY m.id').bind(+dm[1]).all();
    return json({ messages: rows.results });
  }
  if (method !== 'POST') return err(404, 'Not found');
  let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
  if (path === '/api/admin/chat/hide') {
    if (!b.hidden && !top) return err(403, 'Only Beau or a Top tier admin can restore a message.');
    const table = b.kind === 'dm' ? 'dm_messages' : 'group_messages';
    await env.DB.prepare('UPDATE ' + table + ' SET hidden = ? WHERE id = ?').bind(b.hidden ? 1 : 0, +b.id || 0).run();
    return json({ ok: true });
  }
  // allow / say not now to a chat access request, or take access away (the student gets a note in their Beau chat)
  if (path === '/api/admin/chat/access') {
    if (role !== 'owner') return err(403, 'Only Beau can do this.');
    const id = +b.id || 0, u = await env.DB.prepare('SELECT chat_access, chat_req FROM users WHERE id = ?').bind(id).first();
    if (!u) return err(404, 'No such user');
    const t = now(), allow = !!b.allow, note = allow ? '[chat-allowed]' : u.chat_access ? '[chat-removed]' : '[chat-declined]';
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET chat_access = ?, chat_req = NULL WHERE id = ?').bind(allow ? 1 : 0, id),
      env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 1, ?, ?)').bind(id, note, t),
      env.DB.prepare("UPDATE messages SET read_at = ? WHERE user_id = ? AND from_admin = 0 AND read_at IS NULL AND body = '[chat-request]'").bind(t, id)
    ]);
    return json({ ok: true, access: allow });
  }
  // a chat between two students: approve it, say not now, or end it
  if (path === '/api/admin/chat/pair') {
    const th = await env.DB.prepare('SELECT id, status FROM dm_threads WHERE id = ?').bind(+b.id || 0).first(); if (!th) return err(404, 'That chat isn’t there.');
    if (b.action === 'allow' && !top) return err(403, 'Only Beau or a Top tier admin can approve a chat.');
    const to = b.action === 'allow' ? 'active' : b.action === 'end' ? 'ended' : 'refused';
    await env.DB.prepare('UPDATE dm_threads SET status = ?, updated_at = ? WHERE id = ?').bind(to, now(), th.id).run();
    return json({ ok: true, status: to });
  }
  if (path === '/api/admin/chat/mute') {
    if (!b.muted && !top) return err(403, 'Only Beau or a Top tier admin can let someone chat again.');
    await env.DB.prepare('UPDATE users SET chat_muted = ? WHERE id = ?').bind(b.muted ? 1 : 0, +b.id || 0).run();
    return json({ ok: true });
  }
  if (path === '/api/admin/chat/report') {
    await env.DB.prepare('UPDATE chat_reports SET status = ? WHERE id = ?').bind(b.status === 'done' ? 'done' : 'new', +b.id || 0).run();
    return json({ ok: true });
  }
  return err(404, 'Not found');
}

// Leaderboard points: when progress is saved, count the newly correct answers and booklet marks for today.
export async function addPoints(env, userId, before, after, bookletGain) {
  const dc = Math.max(0, Math.min(100, after.correct - before.correct)), db = Math.max(0, Math.min(100, bookletGain ?? (after.bookletRight - before.bookletRight)));
  if (!dc && !db) return;
  // daily caps, so faked progress can't farm the leaderboard (far more than anyone really does in a day)
  await env.DB.prepare('INSERT INTO points_daily (user_id, day, correct, booklet) VALUES (?, ?, MIN(?, ?), MIN(?, ?)) ON CONFLICT(user_id, day) DO UPDATE SET correct = MIN(?, correct + excluded.correct), booklet = MIN(?, booklet + excluded.booklet)')
    .bind(userId, dayKey(now()), dc, MAX_CORRECT_DAY, db, MAX_BOOKLET_DAY, MAX_CORRECT_DAY, MAX_BOOKLET_DAY).run();
}
