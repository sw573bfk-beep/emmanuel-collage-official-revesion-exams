// EC Revisions API on Cloudflare Workers + D1.
// Students: POST /api/signup, POST /api/login, POST /api/logout, GET /api/me, POST /api/ping,
//           GET|PUT /api/progress/:subject, POST /api/password, POST /api/delete-account.
// Admin (the ADMIN_USERNAME account only): GET /api/admin/overview, GET /api/admin/user/:id,
//           POST /api/admin/reset-password, POST /api/admin/delete-user.
// Everything else is one of the pages in ./public, bundled into this Worker below.

import indexHtml from '../public/index.html';
import siteCss from '../public/site.css';
import mathsHtml from '../public/maths/index.html';
import mathsJs from '../public/maths/app.js';
import scienceHtml from '../public/science/index.html';
import adminHtml from '../public/admin/index.html';
import notFoundHtml from '../public/404.html';

const HTML = 'text/html; charset=utf-8';
const PAGES = {
  '/': [indexHtml, HTML], '/index.html': [indexHtml, HTML],
  '/site.css': [siteCss, 'text/css; charset=utf-8'],
  '/maths/': [mathsHtml, HTML], '/maths/index.html': [mathsHtml, HTML], '/maths/app.js': [mathsJs, 'text/javascript; charset=utf-8'],
  '/science/': [scienceHtml, HTML], '/science/index.html': [scienceHtml, HTML],
  '/admin/': [adminHtml, HTML], '/admin/index.html': [adminHtml, HTML]
};
const SECURITY_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY' };
function servePage(url) {
  if (['/maths', '/science', '/admin'].includes(url.pathname)) return Response.redirect(url.origin + url.pathname + '/' + url.search, 301);
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
function sessionCookie(token, url, maxAge) {
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function startSession(env, userId, url) {
  const token = randomHex(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, now() + SESSION_DAYS * 86400).run();
  // Tidy up: drop this user's expired sessions.
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(userId, now()).run();
  return sessionCookie(token, url, SESSION_DAYS * 86400);
}
async function currentUser(req, env) {
  const token = getCookie(req, 'sid'); if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
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
    if (password.length < 8) return err(400, 'Passwords need at least 8 characters.');
    if (password.length > 200) return err(400, 'That password is too long.');
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (exists) return err(409, 'That name is already taken. If two people share a name, add a last initial or a number (e.g. Sam Smith 2).');
    const salt = randomHex(16); const hash = await hashPassword(password, salt);
    const res = await env.DB.prepare('INSERT INTO users (username, pass_hash, salt, created_at, last_login, login_count, last_seen) VALUES (?, ?, ?, ?, ?, 1, ?)').bind(username, hash, salt, now(), now(), now()).run();
    const cookie = await startSession(env, res.meta.last_row_id, url);
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
    return json({ username: user.username }, 200, { 'set-cookie': await startSession(env, user.id, url) });
  }

  const user = await currentUser(req, env);
  if (path === '/api/me' && method === 'GET') {
    if (!user) return err(401, 'Not logged in');
    const rows = await env.DB.prepare('SELECT subject, updated_at FROM progress WHERE user_id = ?').bind(user.id).all();
    return json({ username: user.username, admin: isAdmin(user, env), subjects: Object.fromEntries(rows.results.map(r => [r.subject, r.updated_at])) });
  }
  if (path === '/api/logout' && method === 'POST') {
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', url, 0) });
  }
  if (!user) return err(401, 'Not logged in');

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
      await env.DB.prepare('INSERT INTO progress (user_id, subject, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, subject) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(user.id, subject, text, t).run();
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
      env.DB.prepare('DELETE FROM visits WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM daily WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ]);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', url, 0) });
  }
  return err(404, 'Not found');
}

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
  const t = now(), today = dayKey(t);
  if (path === '/api/admin/overview' && method === 'GET') {
    const since30 = dayKey(t - 29 * 86400), since7 = dayKey(t - 6 * 86400);
    const [users, perUser, perUser7, today_, visits, daily, signups, progress] = await env.DB.batch([
      env.DB.prepare('SELECT id, username, created_at, last_login, login_count, last_seen, last_subject FROM users ORDER BY last_seen DESC'),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily GROUP BY user_id'),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily WHERE day >= ? GROUP BY user_id').bind(since7),
      env.DB.prepare('SELECT user_id, SUM(seconds) AS s FROM daily WHERE day = ? GROUP BY user_id').bind(today),
      env.DB.prepare('SELECT user_id, COUNT(*) AS n, MAX(device) AS device FROM visits GROUP BY user_id'),
      env.DB.prepare('SELECT day, COUNT(DISTINCT user_id) AS people, SUM(seconds) AS s FROM daily WHERE day >= ? GROUP BY day ORDER BY day').bind(since30),
      env.DB.prepare('SELECT created_at FROM users WHERE created_at >= ?').bind(t - 30 * 86400),
      env.DB.prepare("SELECT user_id, data FROM progress WHERE subject = 'maths'")
    ]);
    const map = r => Object.fromEntries(r.results.map(x => [x.user_id, x]));
    const all = map(perUser), wk = map(perUser7), td = map(today_), vs = map(visits), pr = map(progress);
    const list = users.results.map(u => {
      let data = null; try { data = pr[u.id] ? JSON.parse(pr[u.id].data) : null; } catch { /* bad row */ }
      return { id: u.id, name: u.username, joined: u.created_at, lastLogin: u.last_login, logins: u.login_count, lastSeen: u.last_seen, lastSubject: u.last_subject,
        online: t - u.last_seen <= 120 && !!u.last_subject, totalSeconds: (all[u.id] || {}).s || 0, weekSeconds: (wk[u.id] || {}).s || 0, todaySeconds: (td[u.id] || {}).s || 0,
        visits: (vs[u.id] || {}).n || 0, device: (vs[u.id] || {}).device || null, maths: mathsStats(data), admin: u.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase() };
    });
    const signupDays = {}; signups.results.forEach(r => { const d = dayKey(r.created_at); signupDays[d] = (signupDays[d] || 0) + 1; });
    const days = []; for (let i = 29; i >= 0; i--) { const d = dayKey(t - i * 86400); const row = daily.results.find(r => r.day === d); days.push({ day: d, people: row ? row.people : 0, seconds: row ? row.s : 0, signups: signupDays[d] || 0 }); }
    const sum = (arr, k) => arr.reduce((a, x) => a + (x[k] || 0), 0);
    return json({
      now: t, today,
      totals: { users: list.length, online: list.filter(u => u.online).length, activeToday: list.filter(u => u.todaySeconds > 0).length, activeWeek: list.filter(u => u.weekSeconds > 0).length,
        signupsToday: signupDays[today] || 0, signupsWeek: days.slice(-7).reduce((a, d) => a + d.signups, 0), secondsToday: sum(list, 'todaySeconds'), secondsWeek: sum(list, 'weekSeconds'), secondsAll: sum(list, 'totalSeconds'),
        questions: list.reduce((a, u) => a + u.maths.answered, 0) },
      days, users: list
    });
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
  if (path === '/api/admin/delete-user') {
    if (id === me.id) return err(400, 'You can’t delete your own admin account here.');
    await env.DB.batch(['progress', 'sessions', 'visits', 'daily'].map(tb => env.DB.prepare('DELETE FROM ' + tb + ' WHERE user_id = ?').bind(id)).concat([env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)]));
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
