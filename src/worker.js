// EC Revisions API on Cloudflare Workers + D1.
// Students: POST /api/signup, POST /api/login, POST /api/logout, GET /api/me, POST /api/ping,
//           GET|PUT /api/progress/:subject, POST /api/password, POST /api/delete-account.
//           GET /api/unlock/theory, POST /api/unlock, GET /api/theory (locked content), POST /api/feedback.
// Admin (the ADMIN_USERNAME account only): GET /api/admin/overview, GET /api/admin/user/:id,
//           POST /api/admin/reset-password, POST /api/admin/delete-user,
//           GET|POST /api/admin/codes, POST /api/admin/set-unlock, POST /api/admin/set-stats,
//           GET /api/admin/messages, GET /api/admin/messages/:id, POST /api/admin/messages, GET /api/admin/feedback, POST /api/admin/feedback-status.
// Everything else is one of the pages in ./public, bundled into this Worker below.

import indexHtml from '../public/index.html';
import siteCss from '../public/site.css';
import mathsHtml from '../public/maths/index.html';
import mathsJs from '../public/maths/app.js';
import scienceHtml from '../public/science/index.html';
import scienceJs from '../public/science/app.js';
import adminHtml from '../public/admin/index.html';
import feedbackHtml from '../public/feedback/index.html';
import notFoundHtml from '../public/404.html';
import helpJs from '../public/help.js';
import acctJs from '../public/acct.js';
import tabbarJs from '../public/tabbar.js';
import messageHtml from '../public/message/index.html';
import msgJs from '../public/msg.js';
import chatHtml from '../public/chat/index.html';
import boardHtml from '../public/leaderboard/index.html';
import { checkText, checkName } from './filter.js';
import { handleCommunity, handleCommunityAdmin, addPoints, logBlocked } from './community.js';

const HTML = 'text/html; charset=utf-8';
const PAGES = {
  '/': [indexHtml, HTML], '/index.html': [indexHtml, HTML],
  '/site.css': [siteCss, 'text/css; charset=utf-8'],
  '/help.js': [helpJs, 'text/javascript; charset=utf-8'],
  '/acct.js': [acctJs, 'text/javascript; charset=utf-8'],
  '/tabbar.js': [tabbarJs, 'text/javascript; charset=utf-8'],
  '/msg.js': [msgJs, 'text/javascript; charset=utf-8'],
  '/message/': [messageHtml, HTML], '/message/index.html': [messageHtml, HTML],
  '/chat/': [chatHtml, HTML], '/chat/index.html': [chatHtml, HTML],
  '/leaderboard/': [boardHtml, HTML], '/leaderboard/index.html': [boardHtml, HTML],
  '/maths/': [mathsHtml, HTML], '/maths/index.html': [mathsHtml, HTML], '/maths/app.js': [mathsJs, 'text/javascript; charset=utf-8'],
  '/science/': [scienceHtml, HTML], '/science/index.html': [scienceHtml, HTML], '/science/app.js': [scienceJs, 'text/javascript; charset=utf-8'],
  '/admin/': [adminHtml, HTML], '/admin/index.html': [adminHtml, HTML],
  '/feedback/': [feedbackHtml, HTML], '/feedback/index.html': [feedbackHtml, HTML]
};
const SECURITY_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY' };
function servePage(url) {
  if (['/maths', '/science', '/admin', '/feedback', '/message', '/chat', '/leaderboard'].includes(url.pathname)) return Response.redirect(url.origin + url.pathname + '/' + url.search, 301);
  const page = PAGES[url.pathname];
  if (!page) return new Response(notFoundHtml, { status: 404, headers: { 'content-type': HTML, ...SECURITY_HEADERS } });
  const [body, type] = page;
  const cache = type === HTML ? 'no-cache' : 'public, max-age=300';
  return new Response(body, { headers: { 'content-type': type, 'cache-control': cache, ...SECURITY_HEADERS } });
}

const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000; // the maximum Workers allows
const SUBJECTS = new Set(['maths', 'science']);
const MAX_PROGRESS_BYTES = 256 * 1024;
// Names: 2–30 characters, letters, numbers, spaces and ' . _ - (so real names like "Sam O'Neil" work).
const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9 '._-]{1,29}$/;
const cleanName = s => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const QLD_OFFSET = 10 * 3600; // Queensland is UTC+10 all year
const dayKey = t => new Date((t + QLD_OFFSET) * 1000).toISOString().slice(0, 10);
const deviceOf = req => { const ua = req.headers.get('user-agent') || ''; return /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'phone' : 'computer'; };
const isAdmin = (user, env) => !!user && user.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase();

const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
const now = () => Math.floor(Date.now() / 1000);

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
const err = (status, message) => json({ error: message }, status);

async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS }, key, 256);
  return toHex(bits);
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const sha256 = async s => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const randomHex = n => toHex(crypto.getRandomValues(new Uint8Array(n)));

function getCookie(req, name) {
  const c = req.headers.get('cookie') || '';
  for (const part of c.split(';')) { const [k, ...v] = part.trim().split('='); if (k === name) return v.join('='); }
  return null;
}
// Several accounts can be logged in at once in one browser (like Google). Each one has its own
// "slot" cookie: sid, sid1 … sid4. Every page sends the slot its tab is using in the x-ec-acct header.
const MAX_SLOTS = 5;
const slotOf = req => { const n = parseInt(req.headers.get('x-ec-acct') || '0', 10); return n >= 0 && n < MAX_SLOTS ? n : 0; };
const sidName = slot => slot ? 'sid' + slot : 'sid';
function sessionCookie(token, url, maxAge, slot = 0) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `${sidName(slot)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function startSession(env, userId, url, slot = 0) {
  const token = randomHex(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, now() + SESSION_DAYS * 86400).run();
  // Tidy up: drop this user's expired sessions.
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(userId, now()).run();
  return sessionCookie(token, url, SESSION_DAYS * 86400, slot);
}
async function currentUser(req, env, slot = slotOf(req)) {
  const token = getCookie(req, sidName(slot)); if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await env.DB.prepare('SELECT u.id, u.username, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').bind(await sha256(token)).first();
  if (!row || row.expires_at < now()) return null;
  return { id: row.id, username: row.username, tokenHash: await sha256(token) };
}
async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected JSON');
  const text = await req.text(); if (text.length > MAX_PROGRESS_BYTES + 1024) throw new Error('Too large');
  return JSON.parse(text);
}

async function handleApi(req, env, url) {
  const path = url.pathname, method = req.method;
  // Block cross-site writes: browsers always send Origin on POST/PUT.
  if (method !== 'GET') { const origin = req.headers.get('origin'); if (origin && origin !== url.origin) return err(403, 'Cross-site request blocked'); }

  if (path === '/api/signup' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const username = cleanName(body.username), password = String(body.password || '');
    if (!USERNAME_RE.test(username)) return err(400, 'Names are 2–30 characters: letters, numbers, spaces, apostrophes, dots, dashes or underscores.');
    const nameOk = checkName(username, env.ADMIN_USERNAME);
    if (!nameOk.ok) { await logBlocked(env, null, 'new account name', 'name', username); return err(400, nameOk.message); }
    if (password.length < 8) return err(400, 'Passwords need at least 8 characters.');
    if (password.length > 200) return err(400, 'That password is too long.');
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (exists) return err(409, 'That name is already taken. If two people share a name, add a last initial or a number (e.g. Sam Smith 2).');
    const salt = randomHex(16); const hash = await hashPassword(password, salt);
    const res = await env.DB.prepare('INSERT INTO users (username, pass_hash, salt, created_at, last_login, login_count, last_seen) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(username, hash, salt, now(), now(), now()).run();
    const cookie = await startSession(env, res.meta.last_row_id, url, slotOf(req));
    return json({ username }, 201, { 'set-cookie': cookie });
  }

  if (path === '/api/login' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const username = cleanName(body.username), password = String(body.password || '');
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) { await hashPassword(password, randomHex(16)); return err(401, 'Wrong username or password.'); }
    if (user.locked_until > now()) return err(429, 'Too many wrong tries. Wait a few minutes and try again.');
    const hash = await hashPassword(password, user.salt);
    if (!safeEqual(hash, user.pass_hash)) {
      const fails = user.failed_logins + 1;
      await env.DB.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').bind(fails >= 8 ? 0 : fails, fails >= 8 ? now() + 300 : 0, user.id).run();
      return err(401, 'Wrong username or password.');
    }
    await env.DB.prepare('UPDATE users SET failed_logins = 0, locked_until = 0, last_login = ?, login_count = login_count + 1, last_seen = ? WHERE id = ?').bind(now(), now(), user.id).run();
    return json({ username: user.username }, 200, { 'set-cookie': await startSession(env, user.id, url, slotOf(req)) });
  }

  if (path === '/api/accounts' && method === 'GET') {
    // which accounts are logged in in this browser, and in which slot
    const out = [];
    for (let s = 0; s < MAX_SLOTS; s++) { const u = await currentUser(req, env, s); if (u) out.push({ slot: s, username: u.username }); }
    return json({ accounts: out, max: MAX_SLOTS });
  }
  const user = await currentUser(req, env);
  // A tab says which person it thinks it is. If a different person is now logged in on its slot
  // (another tab logged out and in as someone else), refuse, so it can't save into the wrong account.
  let expect = null; try { expect = decodeURIComponent(req.headers.get('x-ec-who') || ''); } catch { expect = null; }
  if (user && expect && expect !== user.username && path !== '/api/me') return err(401, 'Not logged in');
  if (path === '/api/me' && method === 'GET') {
    if (!user) return err(401, 'Not logged in');
    const rows = await env.DB.prepare('SELECT subject, updated_at FROM progress WHERE user_id = ?').bind(user.id).all();
    return json({ username: user.username, admin: isAdmin(user, env), subjects: Object.fromEntries(rows.results.map(r => [r.subject, r.updated_at])) });
  }
  if (path === '/api/logout' && method === 'POST') {
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', url, 0, slotOf(req)) });
  }
  if (!user) return err(401, 'Not logged in');
  const cm = await handleCommunity(req, env, url, user); if (cm) return cm;

  if (path === '/api/ping' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const subject = String(body.subject || ''), visit = String(body.visit || '');
    if (!SUBJECTS.has(subject) || !/^[0-9a-f]{16,64}$/.test(visit)) return err(400, 'Bad request');
    const id = user.id + ':' + visit, t = now();
    const row = await env.DB.prepare('SELECT last_seen FROM visits WHERE id = ?').bind(id).first();
    let add = 0;
    if (!row) {
      await env.DB.prepare('INSERT INTO visits (id, user_id, subject, started_at, last_seen, seconds, device) VALUES (?, ?, ?, ?, ?, 0, ?)').bind(id, user.id, subject, t, t, deviceOf(req)).run();
    } else {
      const gap = t - row.last_seen;
      if (gap < 10) return json({ ok: true });
      // Pings come every minute while someone is active; a longer gap means they were away, so it isn't counted.
      add = gap <= 150 ? Math.min(gap, 75) : 0;
      await env.DB.prepare('UPDATE visits SET last_seen = ?, seconds = seconds + ? WHERE id = ?').bind(t, add, id).run();
    }
    const stmts = [env.DB.prepare('UPDATE users SET last_seen = ?, last_subject = ? WHERE id = ?').bind(t, subject, user.id)];
    if (add > 0) stmts.push(env.DB.prepare('INSERT INTO daily (user_id, day, subject, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, day, subject) DO UPDATE SET seconds = seconds + excluded.seconds').bind(user.id, dayKey(t), subject, add));
    await env.DB.batch(stmts);
    return json({ ok: true, counted: add });
  }

  if (path === '/api/unlock/theory' && method === 'GET') return json({ unlocked: await hasUnlock(env, user, 'theory') });
  if (path === '/api/unlock' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    if (await hasUnlock(env, user, 'theory')) return json({ ok: true, already: true });
    const t = now();
    const fails = await env.DB.prepare('SELECT COUNT(*) AS n FROM unlock_attempts WHERE user_id = ? AND at > ?').bind(user.id, t - 3600).first();
    if (fails.n >= 5) return err(429, 'Too many wrong codes. Wait an hour and try again.');
    const code = String(body.code || '').replace(/\D/g, '');
    const fail = async msg => { await env.DB.prepare('INSERT INTO unlock_attempts (user_id, at) VALUES (?, ?)').bind(user.id, t).run(); return err(400, msg + ' (' + (4 - fails.n) + ' tries left this hour)'); };
    if (!/^\d{6}$/.test(code)) return fail('Codes are 6 digits.');
    const row = await env.DB.prepare("SELECT code, redeemed_by FROM codes WHERE code = ? AND feature = 'theory'").bind(code).first();
    if (!row) return fail('That code isn’t right.');
    if (row.redeemed_by !== null) return fail('That code has already been used.');
    const claim = await env.DB.prepare('UPDATE codes SET redeemed_by = ?, redeemed_at = ? WHERE code = ? AND redeemed_by IS NULL').bind(user.id, t, code).run();
    if (!claim.meta.changes) return fail('That code has already been used.');
    await env.DB.prepare("INSERT OR IGNORE INTO unlocks (user_id, feature, unlocked_at, code) VALUES (?, 'theory', ?, ?)").bind(user.id, t, code).run();
    return json({ ok: true });
  }
  if (path === '/api/theory' && method === 'GET') {
    if (!(await hasUnlock(env, user, 'theory'))) return err(403, 'Locked. Enter a code to unlock the completed booklet.');
    // the completed booklet, page by page: each page's questions (Minimal and Extra info); pictures come from /api/theory/page/:n
    const rows = await env.DB.prepare("SELECT body, updated_at FROM content WHERE key LIKE 'bk-%' ORDER BY ord").all();
    const ver = rows.results.reduce((a, r) => Math.max(a, r.updated_at), 0);
    return new Response('{"ver":' + ver + ',"pages":[' + rows.results.map(r => r.body).join(',') + ']}', { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' } });
  }
  const tp = path.match(/^\/api\/theory\/page\/(\d{1,2})$/);
  if (tp && method === 'GET') {
    if (!(await hasUnlock(env, user, 'theory'))) return err(403, 'Locked. Enter a code to unlock the completed booklet.');
    const rows = await env.DB.prepare('SELECT body FROM content WHERE key LIKE ? ORDER BY key').bind('img-' + tp[1].padStart(2, '0') + '-%').all();
    if (!rows.results.length) return err(404, 'No such page');
    const bin = atob(rows.results.map(r => r.body).join(''));
    const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    // private: only this browser may keep it; the page asks with ?v=<version>, so a new upload is fetched fresh
    return new Response(bytes, { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=2592000', 'x-content-type-options': 'nosniff' } });
  }

  if (path === '/api/feedback' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const kind = String(body.kind || ''), subject = String(body.subject || ''), rating = Math.round(+body.rating || 0), message = String(body.message || '').trim();
    if (!['problem', 'idea', 'question', 'compliment', 'other'].includes(kind)) return err(400, 'Pick what kind of feedback it is.');
    if (!['maths', 'science', 'site'].includes(subject)) return err(400, 'Pick which part of the site it’s about.');
    if (rating < 0 || rating > 5) return err(400, 'Bad rating');
    if (message.length < 3) return err(400, 'Write a little bit about it first.');
    if (message.length > 2000) return err(400, 'That’s too long. Keep it under 2000 characters.');
    const ff = checkText(message); if (!ff.ok) { await logBlocked(env, user.id, 'feedback', ff.why, message); return err(422, ff.message); }
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE user_id = ? AND created_at > ?').bind(user.id, now() - 86400).first();
    if (recent.n >= 20) return err(429, 'You’ve sent a lot of feedback today. Thanks! Try again tomorrow.');
    await env.DB.prepare('INSERT INTO feedback (user_id, name, kind, subject, rating, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(user.id, user.username, kind, subject, rating, message, now()).run();
    return json({ ok: true }, 201);
  }

  // "Message Beau" chat. GET returns the conversation (and marks Beau's replies read when read=1).
  if (path === '/api/messages/unread' && method === 'GET') {
    if (isAdmin(user, env)) { const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE from_admin = 0 AND read_at IS NULL').first(); return json({ unread: r.n || 0, admin: true }); }
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL').bind(user.id).first();
    return json({ unread: r.n || 0, admin: false });
  }
  if (path === '/api/messages' && method === 'GET') {
    const after = Math.max(0, parseInt(url.searchParams.get('after') || '0', 10) || 0);
    const rows = await env.DB.prepare('SELECT id, from_admin, body, created_at, read_at FROM messages WHERE user_id = ? AND id > ? ORDER BY id LIMIT 500').bind(user.id, after).all();
    if (url.searchParams.get('read') === '1') await env.DB.prepare('UPDATE messages SET read_at = ? WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL').bind(now(), user.id).run();
    return json({ messages: rows.results.map(r => ({ id: r.id, mine: !r.from_admin, body: r.body, at: r.created_at, read: !!r.read_at })), admin: isAdmin(user, env) });
  }
  if (path === '/api/messages' && method === 'POST') {
    if (isAdmin(user, env)) return err(400, 'Reply to people from the dashboard.');
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const text = String(body.body || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return err(400, 'Type a message first.');
    if (text.length > 1000) return err(400, 'Messages can be up to 1000 characters.');
    const fm = checkText(text); if (!fm.ok) { await logBlocked(env, user.id, 'Message Beau', fm.why, text); return err(422, fm.message); }
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 0 AND created_at > ?').bind(user.id, now() - 3600).first();
    if (recent.n >= 30) return err(429, 'That’s a lot of messages. Wait a little and try again.');
    const r = await env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 0, ?, ?)').bind(user.id, text, now()).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }

  if (path.startsWith('/api/admin/')) {
    if (!isAdmin(user, env)) return err(403, 'Only the site admin can see this.');
    return handleAdmin(req, env, path, method, user);
  }

  const m = path.match(/^\/api\/progress\/([a-z]+)$/);
  if (m) {
    const subject = m[1]; if (!SUBJECTS.has(subject)) return err(404, 'Unknown subject');
    if (method === 'GET') {
      const row = await env.DB.prepare('SELECT data, updated_at FROM progress WHERE user_id = ? AND subject = ?').bind(user.id, subject).first();
      return json({ data: row ? JSON.parse(row.data) : {}, updated_at: row ? row.updated_at : 0 });
    }
    if (method === 'PUT') {
      let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
      if (!body || typeof body.data !== 'object' || Array.isArray(body.data)) return err(400, 'Bad request');
      const text = JSON.stringify(body.data); if (text.length > MAX_PROGRESS_BYTES) return err(413, 'Progress is too large');
      const t = now();
      const old = await env.DB.prepare('SELECT data FROM progress WHERE user_id = ? AND subject = ?').bind(user.id, subject).first();
      let before = null; try { before = old ? JSON.parse(old.data) : null; } catch { before = null; }
      await env.DB.prepare('INSERT INTO progress (user_id, subject, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, subject) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(user.id, subject, text, t).run();
      await addPoints(env, user.id, mathsStats(before), mathsStats(body.data)); // leaderboard: newly correct answers and booklet marks
      return json({ ok: true, updated_at: t });
    }
  }

  if (path === '/api/password' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const row = await env.DB.prepare('SELECT pass_hash, salt FROM users WHERE id = ?').bind(user.id).first();
    if (!safeEqual(await hashPassword(String(body.current || ''), row.salt), row.pass_hash)) return err(401, 'Your current password is wrong.');
    const next = String(body.next || ''); if (next.length < 8 || next.length > 200) return err(400, 'Passwords need at least 8 characters.');
    const salt = randomHex(16);
    await env.DB.prepare('UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?').bind(await hashPassword(next, salt), salt, user.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(user.id, user.tokenHash).run();
    return json({ ok: true });
  }
  if (path === '/api/delete-account' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const row = await env.DB.prepare('SELECT pass_hash, salt FROM users WHERE id = ?').bind(user.id).first();
    if (!safeEqual(await hashPassword(String(body.password || ''), row.salt), row.pass_hash)) return err(401, 'That password is wrong.');
    await env.DB.batch([
      env.DB.prepare('UPDATE codes SET redeemed_by = NULL WHERE redeemed_by = ?').bind(user.id),
      env.DB.prepare('UPDATE feedback SET user_id = NULL WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM unlocks WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM unlock_attempts WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM visits WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM daily WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM messages WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM dm_messages WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM dm_messages WHERE thread_id IN (SELECT id FROM dm_threads WHERE a = ? OR b = ?)').bind(user.id, user.id),
      env.DB.prepare('DELETE FROM dm_threads WHERE a = ? OR b = ?').bind(user.id, user.id),
      env.DB.prepare('DELETE FROM group_messages WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM blocks WHERE user_id = ? OR blocked_id = ?').bind(user.id, user.id),
      env.DB.prepare('DELETE FROM chat_reports WHERE reporter_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM points_daily WHERE user_id = ?').bind(user.id),
      env.DB.prepare('UPDATE filter_log SET user_id = NULL WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ]);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', url, 0, slotOf(req)) });
  }
  return err(404, 'Not found');
}

async function hasUnlock(env, user, feature) {
  if (isAdmin(user, env)) return true;
  const row = await env.DB.prepare('SELECT 1 AS ok FROM unlocks WHERE user_id = ? AND feature = ?').bind(user.id, feature).first();
  return !!row;
}
function newCode() { const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000; return String(n).padStart(6, '0'); }

// Summarise one student's saved maths progress for the dashboard.
function mathsStats(data) {
  const out = { answered: 0, correct: 0, bookletDone: 0, bookletRight: 0, exams: 0, examAvg: null, gotIt: 0 };
  if (!data) return out;
  Object.values(data.tstats || {}).forEach(s => { out.answered += s.a || 0; out.correct += s.c || 0; });
  Object.values(data.bk || {}).forEach(v => { if (v === 0 || v === 1) { out.bookletDone++; if (v === 1) out.bookletRight++; } });
  const ex = Array.isArray(data.exams) ? data.exams : [];
  out.exams = ex.length; if (ex.length) out.examAvg = Math.round(ex.reduce((a, e) => a + (e.p || 0), 0) / ex.length);
  out.gotIt = Object.values(data.check || {}).filter(v => v === 2).length;
  return out;
}

async function handleAdmin(req, env, path, method, me) {
  const t = now(), today = dayKey(t), url = new URL(req.url);
  const cma = await handleCommunityAdmin(req, env, url); if (cma) return cma;
  if (path === '/api/admin/overview' && method === 'GET') {
    const since30 = dayKey(t - 29 * 86400), since7 = dayKey(t - 6 * 86400);
    const [users, perUser, perUser7, today_, visits, daily, signups, progress, sciProgress, unlockRows, codeCount, fbCount] = await env.DB.batch([
      env.DB.prepare('SELECT id, username, created_at, last_login, login_count, last_seen, last_subject, in_stats, chat_muted FROM users ORDER BY last_seen DESC'),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily GROUP BY user_id'),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily WHERE day >= ? GROUP BY user_id').bind(since7),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily WHERE day = ? GROUP BY user_id').bind(today),
      env.DB.prepare('SELECT user_id, COUNT(*) AS n, MAX(device) AS device FROM visits GROUP BY user_id'),
      env.DB.prepare('SELECT day, user_id, SUM(seconds) AS s FROM daily WHERE day >= ? GROUP BY day, user_id').bind(since30),
      env.DB.prepare('SELECT created_at FROM users WHERE created_at >= ? AND in_stats = 1').bind(t - 30 * 86400),
      env.DB.prepare("SELECT user_id, data FROM progress WHERE subject = 'maths'"),
      env.DB.prepare("SELECT user_id, data FROM progress WHERE subject = 'science'"),
      env.DB.prepare("SELECT user_id FROM unlocks WHERE feature = 'theory'"),
      env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN redeemed_by IS NULL THEN 0 ELSE 1 END) AS used FROM codes"),
      env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS fresh FROM feedback")
    ]);
    const map = r => Object.fromEntries(r.results.map(x => [x.user_id, x]));
    const all = map(perUser), wk = map(perUser7), td = map(today_), vs = map(visits), pr = map(progress), spr = map(sciProgress);
    // accounts left out of the stats (the admin's own, test accounts) still show in the table, but count for nothing
    const left = new Set(users.results.filter(u => !u.in_stats).map(u => u.id));
    const unlocked = new Set(unlockRows.results.map(r => r.user_id).filter(id => !left.has(id)));
    const list = users.results.map(u => {
      let data = null; try { data = pr[u.id] ? JSON.parse(pr[u.id].data) : null; } catch { /* bad row */ }
      let sdata = null; try { sdata = spr[u.id] ? JSON.parse(spr[u.id].data) : null; } catch { /* bad row */ }
      return { id: u.id, name: u.username, joined: u.created_at, lastLogin: u.last_login, logins: u.login_count, lastSeen: u.last_seen, lastSubject: u.last_subject,
        online: t - u.last_seen <= 120 && !!u.last_subject, totalSeconds: (all[u.id] || {}).s || 0, weekSeconds: (wk[u.id] || {}).s || 0, todaySeconds: (td[u.id] || {}).s || 0,
        visits: (vs[u.id] || {}).n || 0, device: (vs[u.id] || {}).device || null, maths: mathsStats(data), science: mathsStats(sdata), unlocked: unlockRows.results.some(r => r.user_id === u.id), inStats: !left.has(u.id), chatMuted: !!u.chat_muted, admin: u.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase() };
    });
    const signupDays = {}; signups.results.forEach(r => { const d = dayKey(r.created_at); signupDays[d] = (signupDays[d] || 0) + 1; });
    const counted = daily.results.filter(r => !left.has(r.user_id));
    const days = []; for (let i = 29; i >= 0; i--) { const d = dayKey(t - i * 86400); const rows = counted.filter(r => r.day === d); days.push({ day: d, people: rows.length, seconds: rows.reduce((a, r) => a + r.s, 0), signups: signupDays[d] || 0 }); }
    const inc = list.filter(u => u.inStats);
    const sum = (arr, k) => arr.reduce((a, x) => a + (x[k] || 0), 0);
    return json({
      now: t, today,
      totals: { users: inc.length, leftOut: list.length - inc.length, online: inc.filter(u => u.online).length, activeToday: inc.filter(u => u.todaySeconds > 0).length, activeWeek: inc.filter(u => u.weekSeconds > 0).length,
        signupsToday: signupDays[today] || 0, signupsWeek: days.slice(-7).reduce((a, d) => a + d.signups, 0), secondsToday: sum(inc, 'todaySeconds'), secondsWeek: sum(inc, 'weekSeconds'), secondsAll: sum(inc, 'totalSeconds'),
        questions: inc.reduce((a, u) => a + u.maths.answered, 0), scienceQuestions: inc.reduce((a, u) => a + u.science.answered, 0),
        unlocked: unlocked.size, codesTotal: codeCount.results[0].total || 0, codesUsed: codeCount.results[0].used || 0, feedback: fbCount.results[0].n || 0, feedbackNew: fbCount.results[0].fresh || 0 },
      days, users: list
    });
  }
  if (path === '/api/admin/feedback' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, name, kind, subject, rating, message, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 500').all();
    return json({ feedback: rows.results });
  }
  if (path === '/api/admin/codes' && method === 'GET') {
    const rows = await env.DB.prepare("SELECT c.code, c.created_at, c.redeemed_at, u.username AS redeemed_name FROM codes c LEFT JOIN users u ON u.id = c.redeemed_by WHERE c.feature = 'theory' ORDER BY c.redeemed_at IS NOT NULL, c.redeemed_at DESC, c.created_at, c.code").all();
    return json({ codes: rows.results });
  }
  if (path === '/api/admin/codes' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const want = Math.max(1, Math.min(100, Math.floor(+body.count || 0)));
    const made = [];
    for (let tries = 0; made.length < want && tries < want * 20; tries++) {
      const c = newCode();
      const r = await env.DB.prepare("INSERT OR IGNORE INTO codes (code, feature, created_at) VALUES (?, 'theory', ?)").bind(c, t).run();
      if (r.meta.changes) made.push(c);
    }
    return json({ ok: true, codes: made });
  }
  if (path === '/api/admin/messages' && method === 'GET') {
    const rows = await env.DB.prepare(`SELECT u.id, u.username, m.body AS last, m.from_admin AS lastFromAdmin, m.created_at AS at,
        (SELECT COUNT(*) FROM messages x WHERE x.user_id = u.id AND x.from_admin = 0 AND x.read_at IS NULL) AS unread
      FROM users u JOIN messages m ON m.id = (SELECT MAX(id) FROM messages WHERE user_id = u.id) ORDER BY m.id DESC`).all();
    return json({ conversations: rows.results });
  }
  const mm = path.match(/^\/api\/admin\/messages\/(\d+)$/);
  if (mm && method === 'GET') {
    const uid = +mm[1], after = Math.max(0, parseInt(url.searchParams.get('after') || '0', 10) || 0);
    const who = await env.DB.prepare('SELECT id, username FROM users WHERE id = ?').bind(uid).first(); if (!who) return err(404, 'No such user');
    const rows = await env.DB.prepare('SELECT id, from_admin, body, created_at, read_at FROM messages WHERE user_id = ? AND id > ? ORDER BY id LIMIT 500').bind(uid, after).all();
    await env.DB.prepare('UPDATE messages SET read_at = ? WHERE user_id = ? AND from_admin = 0 AND read_at IS NULL').bind(t, uid).run();
    return json({ user: who, messages: rows.results.map(r => ({ id: r.id, mine: !!r.from_admin, body: r.body, at: r.created_at, read: !!r.read_at })) });
  }
  const um = path.match(/^\/api\/admin\/user\/(\d+)$/);
  if (um && method === 'GET') {
    const id = +um[1];
    const [u, vis, days] = await env.DB.batch([
      env.DB.prepare('SELECT id, username, created_at, last_login, login_count, last_seen FROM users WHERE id = ?').bind(id),
      env.DB.prepare('SELECT subject, started_at, last_seen, seconds, device FROM visits WHERE user_id = ? ORDER BY started_at DESC LIMIT 60').bind(id),
      env.DB.prepare('SELECT day, SUM(seconds) AS s FROM daily WHERE user_id = ? GROUP BY day ORDER BY day DESC LIMIT 30').bind(id)
    ]);
    if (!u.results.length) return err(404, 'No such user');
    return json({ user: u.results[0], visits: vis.results, days: days.results });
  }
  if (method !== 'POST') return err(404, 'Not found');
  let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
  const id = +body.id; if (!Number.isInteger(id)) return err(400, 'Bad request');
  if (path === '/api/admin/reset-password') {
    const pw = String(body.password || ''); if (pw.length < 8 || pw.length > 200) return err(400, 'Passwords need at least 8 characters.');
    const salt = randomHex(16);
    const r = await env.DB.prepare('UPDATE users SET pass_hash = ?, salt = ?, failed_logins = 0, locked_until = 0 WHERE id = ?').bind(await hashPassword(pw, salt), salt, id).run();
    if (!r.meta.changes) return err(404, 'No such user');
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
    return json({ ok: true });
  }
  if (path === '/api/admin/feedback-status') {
    if (body.status === 'delete') await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
    else if (['new', 'done'].includes(body.status)) await env.DB.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(body.status, id).run();
    else return err(400, 'Bad status');
    return json({ ok: true });
  }
  if (path === '/api/admin/messages') {
    const text = String(body.body || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return err(400, 'Type a message first.'); if (text.length > 2000) return err(400, 'Messages can be up to 2000 characters.');
    if (id === me.id) return err(400, 'You can’t message yourself.');
    if (!await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first()) return err(404, 'No such user');
    const r = await env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 1, ?, ?)').bind(id, text, t).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }
  if (path === '/api/admin/set-stats') {
    const r = await env.DB.prepare('UPDATE users SET in_stats = ? WHERE id = ?').bind(body.inStats ? 1 : 0, id).run();
    if (!r.meta.changes) return err(404, 'No such user');
    return json({ ok: true });
  }
  if (path === '/api/admin/set-unlock') {
    if (body.unlock) await env.DB.prepare("INSERT OR IGNORE INTO unlocks (user_id, feature, unlocked_at, code) VALUES (?, 'theory', ?, 'admin')").bind(id, t).run();
    else await env.DB.prepare("DELETE FROM unlocks WHERE user_id = ? AND feature = 'theory'").bind(id).run();
    return json({ ok: true });
  }
  if (path === '/api/admin/delete-user') {
    if (id === me.id) return err(400, 'You can’t delete your own admin account here.');
    await env.DB.prepare('UPDATE codes SET redeemed_by = NULL WHERE redeemed_by = ?').bind(id).run();
    await env.DB.prepare('UPDATE feedback SET user_id = NULL WHERE user_id = ?').bind(id).run();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM dm_messages WHERE user_id = ?').bind(id),
      env.DB.prepare('DELETE FROM dm_messages WHERE thread_id IN (SELECT id FROM dm_threads WHERE a = ? OR b = ?)').bind(id, id),
      env.DB.prepare('DELETE FROM dm_threads WHERE a = ? OR b = ?').bind(id, id),
      env.DB.prepare('DELETE FROM group_messages WHERE user_id = ?').bind(id),
      env.DB.prepare('DELETE FROM blocks WHERE user_id = ? OR blocked_id = ?').bind(id, id),
      env.DB.prepare('DELETE FROM chat_reports WHERE reporter_id = ?').bind(id),
      env.DB.prepare('DELETE FROM points_daily WHERE user_id = ?').bind(id),
      env.DB.prepare('UPDATE filter_log SET user_id = NULL WHERE user_id = ?').bind(id)
    ]);
    await env.DB.batch(['progress', 'sessions', 'visits', 'daily', 'unlocks', 'unlock_attempts', 'messages'].map(tb => env.DB.prepare('DELETE FROM ' + tb + ' WHERE user_id = ?').bind(id)).concat([env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)]));
    return json({ ok: true });
  }
  return err(404, 'Not found');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await handleApi(req, env, url); }
      catch (e) { console.error(e); return err(500, 'Something went wrong on the server. Try again.'); }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return servePage(url);
  }
};
