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
import themeCss from '../public/theme.css';
import themeJs from '../public/theme.js';
import noticeJs from '../public/notice.js';
import privacyHtml from '../public/privacy/index.html';
import meHtml from '../public/me/index.html';
import studyJs from '../public/study.js';
import msgJs from '../public/msg.js';
import chatHtml from '../public/chat/index.html';
import boardHtml from '../public/leaderboard/index.html';
import playHtml from '../public/play/index.html';
import playSciJs from '../public/play/sci.js';
import playMathsJs from '../public/play/maths.js';
import { checkText, checkName, checkPieces } from './filter.js';
import { handleCommunity, handleCommunityAdmin, addPoints, logBlocked, FAKE_NOTE, leaderboard } from './community.js';
import { TOPICS as MATHS_TOPICS } from './gen/maths-game.js';
import { TOPICS as SCI_TOPICS } from './gen/sci-game.js';
import { handleGames } from './games.js';

const HTML = 'text/html; charset=utf-8';
const PAGES = {
  '/': [indexHtml, HTML], '/index.html': [indexHtml, HTML],
  '/site.css': [siteCss, 'text/css; charset=utf-8'],
  '/help.js': [helpJs, 'text/javascript; charset=utf-8'],
  '/acct.js': [acctJs, 'text/javascript; charset=utf-8'],
  '/tabbar.js': [tabbarJs, 'text/javascript; charset=utf-8'],
  '/theme.css': [themeCss, 'text/css; charset=utf-8'],
  '/theme.js': [themeJs, 'text/javascript; charset=utf-8'],
  '/msg.js': [msgJs, 'text/javascript; charset=utf-8'],
  '/notice.js': [noticeJs, 'text/javascript; charset=utf-8'],
  '/privacy/': [privacyHtml, HTML], '/privacy/index.html': [privacyHtml, HTML],
  '/me/': [meHtml, HTML], '/me/index.html': [meHtml, HTML],
  '/study.js': [studyJs, 'text/javascript; charset=utf-8'],
  '/chat/': [chatHtml, HTML], '/chat/index.html': [chatHtml, HTML],
  '/leaderboard/': [boardHtml, HTML], '/leaderboard/index.html': [boardHtml, HTML],
  '/play/': [playHtml, HTML], '/play/index.html': [playHtml, HTML], '/play/sci.js': [playSciJs, 'text/javascript; charset=utf-8'], '/play/maths.js': [playMathsJs, 'text/javascript; charset=utf-8'],
  '/maths/': [mathsHtml, HTML], '/maths/index.html': [mathsHtml, HTML], '/maths/app.js': [mathsJs, 'text/javascript; charset=utf-8'],
  '/science/': [scienceHtml, HTML], '/science/index.html': [scienceHtml, HTML], '/science/app.js': [scienceJs, 'text/javascript; charset=utf-8'],
  '/admin/': [adminHtml, HTML], '/admin/index.html': [adminHtml, HTML],
  '/feedback/': [feedbackHtml, HTML], '/feedback/index.html': [feedbackHtml, HTML]
};
// Browser protections on every page: no framing (clickjacking), no scripts or connections to other sites,
// HTTPS only, no camera/mic/location. Pages only ever talk to this site.
const CSP = ["default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'", "worker-src 'none'", "manifest-src 'self'"].join('; ');
const SECURITY_HEADERS = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY', 'content-security-policy': CSP,
  'strict-transport-security': 'max-age=31536000; includeSubDomains', 'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin' };
// Every shared script and style gets a fingerprint of its contents in its URL (theme.js?v=3f2a…), added to each
// page as it's served. Browsers keep these files (so moving between pages costs almost no requests), and the
// moment a file changes its URL changes too, so nobody is ever stuck with an old copy.
const fp = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
const SHARED = ['/acct.js', '/theme.js', '/msg.js', '/help.js', '/tabbar.js', '/notice.js', '/study.js', '/site.css', '/theme.css'];
const VER = Object.fromEntries(SHARED.map(f => [f, fp(PAGES[f][0])]));
const SHARED_RE = /(["'])\/(acct|theme|msg|help|tabbar|notice|study)\.js(?:\?v=[^"']*)?\1|(["'])\/(site|theme)\.css(?:\?v=[^"']*)?\3/g;
const versioned = html => html.replace(SHARED_RE, (m, q1, js, q2, css) => js ? q1 + '/' + js + '.js?v=' + VER['/' + js + '.js'] + q1 : q2 + '/' + css + '.css?v=' + VER['/' + css + '.css'] + q2);
const BODY = {};
for (const [k, [body, type]] of Object.entries(PAGES)) BODY[k] = type === HTML ? versioned(body) : body;
// theme.js loads notice.js and study.js itself: give it their fingerprints too
BODY['/theme.js'] = BODY['/theme.js'].replace("src + '?v=' + (document.documentElement.dataset.build || '1')", "src + '?v=' + ({ '/notice.js': '" + VER['/notice.js'] + "', '/study.js': '" + VER['/study.js'] + "' })[src]");
function servePage(url) {
  // "Message Beau" is now the ✉️ Beau tab of the Chat page
  if (url.pathname === '/message' || url.pathname.startsWith('/message/')) { const q = new URLSearchParams(url.search); q.set('tab', 'beau'); return Response.redirect(url.origin + '/chat/?' + q, 302); }
  if (['/maths', '/science', '/admin', '/feedback', '/chat', '/privacy', '/me', '/leaderboard', '/play'].includes(url.pathname)) return Response.redirect(url.origin + url.pathname + '/' + url.search, 301);
  const page = PAGES[url.pathname];
  if (!page) return new Response(notFoundHtml, { status: 404, headers: { 'content-type': HTML, ...SECURITY_HEADERS } });
  const type = page[1];
  // Pages are checked every time. Fingerprinted files (?v=…) are kept for a week; anything else for 5 minutes.
  const cache = type === HTML ? 'no-cache' : url.searchParams.has('v') ? 'public, max-age=604800' : 'public, max-age=300';
  return new Response(BODY[url.pathname], { headers: { 'content-type': type, 'cache-control': cache, ...SECURITY_HEADERS } });
}

// Booklet unlock requests live in the Beau chat (Chat page, ✉️ Beau tab) as these special messages
const REQ_ASK = '[unlock-request]', REQ_YES = '[unlock-allowed]', REQ_NO = '[unlock-declined]';
async function lastUnlockNote(env, userId) {
  const r = await env.DB.prepare('SELECT body FROM messages WHERE user_id = ? AND ((body = ? AND from_admin = 0) OR (body IN (?, ?) AND from_admin = 1)) ORDER BY id DESC LIMIT 1').bind(userId, REQ_ASK, REQ_YES, REQ_NO).first();
  return r ? r.body : null;
}
// The live pop-up announcement, cached for a few seconds so every open page checking it stays cheap.
let noticeCache = { at: 0, v: null };
async function liveNotice(env, fresh) {
  const t = now(); if (!fresh && Date.now() - noticeCache.at < 4000) return noticeCache.v && noticeCache.v.ends > t ? noticeCache.v : null;
  const r = await env.DB.prepare('SELECT id, body, created_at, ends_at FROM broadcasts WHERE ends_at > ? ORDER BY id DESC LIMIT 1').bind(t).first();
  noticeCache = { at: Date.now(), v: r ? { id: r.id, body: r.body, at: r.created_at, ends: r.ends_at } : null };
  return noticeCache.v;
}
// Study mode. The site-wide switch is cached for a few seconds (every request checks it).
let studyAllCache = { at: 0, on: false };
async function studyAll(env, fresh) {
  if (!fresh && Date.now() - studyAllCache.at < 5000) return studyAllCache.on;
  const r = await env.DB.prepare("SELECT value FROM settings WHERE key = 'study_all'").first();
  studyAllCache = { at: Date.now(), on: !!r && r.value === '1' }; return studyAllCache.on;
}
async function studyState(env, user) {
  if (isAdmin(user, env)) return { study: false, requested: false, site: await studyAll(env) };
  const [u, site] = await Promise.all([env.DB.prepare('SELECT study_mode, study_free, study_req FROM users WHERE id = ?').bind(user.id).first(), studyAll(env)]);
  const study = !!u && (!!u.study_mode || (site && !u.study_free));
  return { study, requested: study && !!(u && u.study_req), site, why: !u ? null : u.study_mode ? 'you' : site ? 'everyone' : null };
}
async function studyPayload(env, user) {
  const st = await studyState(env, user);
  let declined = false;
  if (st.study && !st.requested) { const n = await env.DB.prepare("SELECT created_at FROM messages WHERE user_id = ? AND from_admin = 1 AND body = '[study-declined]' ORDER BY id DESC LIMIT 1").bind(user.id).first(); declined = !!n && now() - n.created_at < 86400; }
  return { ...st, declined };
}
// the red numbers on the Chat button, in one go (friend requests, unread chats, unread messages from/to Beau)
async function liveChat(env, user) {
  const me = user.id, admin = isAdmin(user, env);
  const [req_, dm, beau, mu] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM dm_threads WHERE status = 'pending' AND requested_by != ?1 AND (a = ?1 OR b = ?1)").bind(me),
    env.DB.prepare("SELECT COUNT(*) AS n FROM dm_messages m JOIN dm_threads t ON t.id = m.thread_id WHERE t.status = 'active' AND (t.a = ?1 OR t.b = ?1) AND m.user_id != ?1 AND m.hidden = 0 AND m.id > (CASE WHEN t.a = ?1 THEN t.a_read ELSE t.b_read END)").bind(me),
    admin ? env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE from_admin = 0 AND read_at IS NULL') : env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL').bind(me),
    env.DB.prepare('SELECT chat_muted FROM users WHERE id = ?').bind(me)
  ]);
  await env.DB.prepare('UPDATE users SET last_seen = ?1 WHERE id = ?2 AND (last_seen IS NULL OR last_seen < ?1 - 60)').bind(now(), me).run();
  return { requests: req_.results[0].n, unreadDm: dm.results[0].n, beau: beau.results[0].n, admin, muted: !!(mu.results[0] || {}).chat_muted };
}
const STUDY_BLOCKED = p => p.startsWith('/api/chat/') || p.startsWith('/api/messages') || p === '/api/leaderboard' || p === '/api/feedback';
// ---------- limits per device (IP address, only ever stored as a short hash) ----------
const ipOf = req => req.headers.get('cf-connecting-ip') || 'local';
const ipKey = async req => (await sha256('ec-ip:' + ipOf(req))).slice(0, 20);
// Returns true when this device has hit `max` in the last `secs` seconds. `count` = false only checks.
async function overLimit(env, key, max, secs, count = true) {
  const t = now();
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_hits WHERE k = ? AND at > ?').bind(key, t - secs).first();
  if (r.n >= max) return true;
  if (count) await env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind(key, t).run();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_hits WHERE at < ?').bind(t - 2 * 86400).run();
  return false;
}
const hit = (env, key) => env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind(key, now()).run();
async function adminLog(env, req, ok) {
  await env.DB.prepare('INSERT INTO admin_log (at, ok, ip_hash, place, device) VALUES (?, ?, ?, ?, ?)')
    .bind(now(), ok ? 1 : 0, (await ipKey(req)).slice(0, 8), [req.cf && req.cf.city, req.cf && req.cf.country].filter(Boolean).join(', ') || null, deviceOf(req)).run();
}
// A quick flood guard per server instance: one device can't hammer the API with thousands of requests.
const flood = new Map();
function flooding(req) {
  const ip = ipOf(req), t = Date.now(), w = flood.get(ip);
  if (!w || t - w.start > 60000) { flood.set(ip, { start: t, n: 1 }); if (flood.size > 5000) flood.clear(); return false; }
  return ++w.n > 1500; // a whole class on one school network stays far below this
}
const SESSION_DAYS = 30, ADMIN_SESSION_DAYS = 7;
// Today's (UTC day = from 10 am Queensland time) and this month's usage, from Cloudflare's analytics. Cached 2 minutes.
let cfCache = { at: 0, v: null };
async function cfUsage(env) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) return { connected: false };
  if (Date.now() - cfCache.at < 120000 && cfCache.v) return cfCache.v;
  const d = new Date(), day = d.toISOString().slice(0, 10), month = day.slice(0, 8) + '01';
  const q = 'query($a:String!,$d:Date!,$m:Date!,$db:String!){viewer{accounts(filter:{accountTag:$a}){'
    + 'today:d1AnalyticsAdaptiveGroups(limit:5,filter:{date_geq:$d,databaseId:$db}){sum{readQueries writeQueries rowsRead rowsWritten}} '
    + 'month:d1AnalyticsAdaptiveGroups(limit:40,filter:{date_geq:$m,databaseId:$db}){sum{rowsRead rowsWritten}} '
    + 'wToday:workersInvocationsAdaptive(limit:20,filter:{date_geq:$d,scriptName:"ec-revisions"}){sum{requests errors}} '
    + 'wMonth:workersInvocationsAdaptive(limit:100,filter:{date_geq:$m,scriptName:"ec-revisions"}){sum{requests errors}}}}}';
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: { authorization: 'Bearer ' + env.CF_API_TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { a: env.CF_ACCOUNT_ID, d: day, m: month, db: env.D1_DATABASE_ID || '' } }) });
    const j = await res.json(); const a = j && j.data && j.data.viewer && j.data.viewer.accounts && j.data.viewer.accounts[0];
    if (!a) return { connected: false, error: (j && j.errors && j.errors[0] && j.errors[0].message) || 'Cloudflare didn’t answer' };
    const add = (list, k) => (list || []).reduce((s, x) => s + ((x.sum && x.sum[k]) || 0), 0);
    cfCache = { at: Date.now(), v: { connected: true, day, requests: add(a.wToday, 'requests'), errors: add(a.wToday, 'errors'), rowsRead: add(a.today, 'rowsRead'), rowsWritten: add(a.today, 'rowsWritten'),
      monthRequests: add(a.wMonth, 'requests'), monthRowsRead: add(a.month, 'rowsRead'), monthRowsWritten: add(a.month, 'rowsWritten') } };
    return cfCache.v;
  } catch (e) { return { connected: false, error: 'Couldn’t reach Cloudflare' }; }
}
const PBKDF2_ITERATIONS = 100000; // the maximum Workers allows
const SUBJECTS = new Set(['maths', 'science']);
const MAX_PROGRESS_BYTES = 256 * 1024;
// Names: 2–30 characters, letters, numbers, spaces and ' . _ - (so real names like "Sam O'Neil" work).
const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9 '._-]{1,29}$/;
const cleanName = s => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
const QLD_OFFSET = 10 * 3600; // Queensland is UTC+10 all year
const dayKey = t => new Date((t + QLD_OFFSET) * 1000).toISOString().slice(0, 10);
const deviceOf = req => { const ua = req.headers.get('user-agent') || ''; return /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'phone' : 'computer'; };
// Dashboard access: 'owner' (Beau), 'top' (Top tier admin) or 'basic' (Basic admin), from the codes below. Otherwise null.
const staffRole = (user, env) => !user ? null : isAdmin(user, env) ? 'owner' : user.role === 'top' || user.role === 'basic' ? user.role : null;
const ROLE_NAME = { owner: 'Owner', top: 'Top tier admin', basic: 'Basic admin' };
const isAdmin = (user, env) => !!user && user.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase();

const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
const now = () => Math.floor(Date.now() / 1000);

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'same-origin', ...headers } });
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

async function startSession(env, userId, url, slot = 0, days = SESSION_DAYS) {
  const token = randomHex(32);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, now() + days * 86400).run();
  // Tidy up: drop this user's expired sessions.
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(userId, now()).run();
  return sessionCookie(token, url, days * 86400, slot);
}
async function currentUser(req, env, slot = slotOf(req)) {
  const token = getCookie(req, sidName(slot)); if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await env.DB.prepare('SELECT u.id, u.username, u.role, u.tester, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').bind(await sha256(token)).first();
  if (!row || row.expires_at < now()) return null;
  return { id: row.id, username: row.username, role: row.role || null, tester: !!row.tester, tokenHash: await sha256(token) };
}
async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected JSON');
  const text = await req.text(); if (text.length > MAX_PROGRESS_BYTES + 1024) throw new Error('Too large');
  return JSON.parse(text);
}

async function handleApi(req, env, url) {
  const path = url.pathname, method = req.method;
  if (flooding(req)) return err(429, 'Too many requests. Slow down a little.');
  // Block cross-site writes: browsers always send Origin on POST/PUT.
  if (method !== 'GET') { const origin = req.headers.get('origin'); if (origin && origin !== url.origin) return err(403, 'Cross-site request blocked'); }

  if (path === '/api/signup' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    // new accounts per device: plenty for a class signing up on one school network, but stops mass sign-ups
    const ik = await ipKey(req);
    if (await overLimit(env, 'signup:' + ik, 40, 3600, false) || await overLimit(env, 'signupday:' + ik, 120, 86400, false)) return err(429, 'Lots of accounts have been made from here recently. Try again later.');
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
    await env.DB.batch([env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind('signup:' + ik, now()), env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind('signupday:' + ik, now())]);
    const cookie = await startSession(env, res.meta.last_row_id, url, slotOf(req));
    return json({ username }, 201, { 'set-cookie': cookie });
  }

  if (path === '/api/login' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const username = cleanName(body.username), password = String(body.password || '');
    const ik = await ipKey(req);
    // wrong passwords per device: a whole class can make typos, but nobody can keep guessing
    if (await overLimit(env, 'loginfail:' + ik, 60, 900, false)) return err(429, 'Too many wrong tries from here. Wait 15 minutes and try again.');
    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!user) { await hashPassword(password, randomHex(16)); await hit(env, 'loginfail:' + ik); return err(401, 'Wrong username or password.'); }
    const adminTry = isAdmin(user, env);
    // Beau's account: a device gets only 5 wrong tries an hour. (There's no account-wide lock, so nobody can lock Beau out.)
    if (adminTry && await overLimit(env, 'adminfail:' + ik, 5, 3600, false)) { await adminLog(env, req, false); return err(429, 'Too many wrong tries. Wait an hour and try again.'); }
    if (!adminTry && user.locked_until > now()) return err(429, 'Too many wrong tries. Wait a few minutes and try again.');
    const hash = await hashPassword(password, user.salt);
    if (!safeEqual(hash, user.pass_hash)) {
      await hit(env, 'loginfail:' + ik);
      if (adminTry) { await hit(env, 'adminfail:' + ik); await adminLog(env, req, false); return err(401, 'Wrong username or password.'); }
      const fails = user.failed_logins + 1;
      await env.DB.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').bind(fails >= 8 ? 0 : fails, fails >= 8 ? now() + 300 : 0, user.id).run();
      return err(401, 'Wrong username or password.');
    }
    await env.DB.prepare('UPDATE users SET failed_logins = 0, locked_until = 0, last_login = ?, login_count = login_count + 1, last_seen = ? WHERE id = ?').bind(now(), now(), user.id).run();
    if (adminTry) await adminLog(env, req, true);
    return json({ username: user.username }, 200, { 'set-cookie': await startSession(env, user.id, url, slotOf(req), adminTry ? ADMIN_SESSION_DAYS : SESSION_DAYS) });
  }

  // "Message everyone": the pop-up announcement every open page checks for (no login needed).
  if (path === '/api/broadcast' && method === 'GET') return json({ now: now(), notice: await liveNotice(env) });
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
    return json({ username: user.username, admin: isAdmin(user, env), role: staffRole(user, env), tester: user.tester, subjects: Object.fromEntries(rows.results.map(r => [r.subject, r.updated_at])) });
  }
  if (path === '/api/logout' && method === 'POST') {
    if (user) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(user.tokenHash).run();
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', url, 0, slotOf(req)) });
  }
  // One background check for every open page, once a minute: the pop-up from Beau, study mode and the red numbers
  // on the Chat button. (It replaces three separate checks, so the site uses far fewer requests.)
  if (path === '/api/live' && method === 'GET') {
    const out = { now: now(), notice: await liveNotice(env), study: null, chat: null, me: null };
    if (user) {
      out.me = { name: user.username, admin: isAdmin(user, env), role: staffRole(user, env) };
      out.study = await studyPayload(env, user);
      if (!out.study.study) out.chat = await liveChat(env, user);
    }
    return json(out);
  }
  if (!user) return err(401, 'Not logged in');
  // Study mode: only Maths, Science and Play with friends. Students can ask Beau to turn it off.
  if (path === '/api/study' && method === 'GET') return json(await studyPayload(env, user));
  if (path === '/api/study/request' && method === 'POST') {
    const st = await studyState(env, user); if (!st.study) return json({ ok: true, study: false });
    if (st.requested) return json({ ok: true, pending: true });
    const n = await env.DB.prepare("SELECT created_at FROM messages WHERE user_id = ? AND from_admin = 1 AND body = '[study-declined]' ORDER BY id DESC LIMIT 1").bind(user.id).first();
    if (n && now() - n.created_at < 86400) return err(429, 'Beau said not yet. You can ask again tomorrow.');
    const t = now();
    await env.DB.batch([env.DB.prepare('UPDATE users SET study_req = ? WHERE id = ?').bind(t, user.id), env.DB.prepare("INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 0, '[study-request]', ?)").bind(user.id, t)]);
    return json({ ok: true, pending: true }, 201);
  }
  if (STUDY_BLOCKED(path) && !isAdmin(user, env) && (await studyState(env, user)).study) {
    if (path === '/api/messages/unread') return json({ unread: 0, admin: false, study: true });
    return json({ error: 'Study mode is on, so this is turned off. You can use Maths, Science and Play with friends.', study: true }, 403);
  }
  const cm = await handleCommunity(req, env, url, user); if (cm) return cm;
  const gm = await handleGames(req, env, url, user); if (gm) return gm;

  // Your profile (only ever your own): study time and streak, leaderboard place, scores by topic, friends (a number) and messages
  if (path === '/api/profile' && method === 'GET') {
    const t = now(), me = user.id, today = dayKey(t), study = (await studyState(env, user)).study;
    const [u, days, all, prog, fr, thr, beau, beauN] = await env.DB.batch([
      env.DB.prepare('SELECT username, created_at FROM users WHERE id = ?').bind(me),
      env.DB.prepare('SELECT day, SUM(seconds) AS s FROM daily WHERE user_id = ? GROUP BY day ORDER BY day DESC LIMIT 400').bind(me),
      env.DB.prepare('SELECT SUM(seconds) AS s FROM daily WHERE user_id = ?').bind(me),
      env.DB.prepare('SELECT subject, data FROM progress WHERE user_id = ?').bind(me),
      env.DB.prepare("SELECT COUNT(*) AS n FROM dm_threads WHERE status = 'active' AND (a = ?1 OR b = ?1)").bind(me),
      env.DB.prepare(`SELECT t.id, u.username AS name, u.last_seen AS seen,
        (SELECT CASE WHEN body LIKE '[game:%' THEN '🎮 Game invite' ELSE body END FROM dm_messages WHERE thread_id = t.id AND hidden = 0 ORDER BY id DESC LIMIT 1) AS last,
        (SELECT MAX(created_at) FROM dm_messages WHERE thread_id = t.id AND hidden = 0) AS at,
        (SELECT COUNT(*) FROM dm_messages m WHERE m.thread_id = t.id AND m.user_id != ?1 AND m.hidden = 0 AND m.id > (CASE WHEN t.a = ?1 THEN t.a_read ELSE t.b_read END)) AS unread
        FROM dm_threads t JOIN users u ON u.id = (CASE WHEN t.a = ?1 THEN t.b ELSE t.a END) WHERE (t.a = ?1 OR t.b = ?1) AND t.status = 'active'`).bind(me),
      env.DB.prepare('SELECT body, from_admin, created_at FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT 1').bind(me),
      env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL').bind(me)
    ]);
    const D = Object.fromEntries(days.results.map(r => [r.day, r.s || 0])), back = n => dayKey(t - n * 86400);
    const last14 = Array.from({ length: 14 }, (_, i) => ({ day: back(13 - i), s: D[back(13 - i)] || 0 }));
    let streak = 0; for (let i = D[today] >= 60 ? 0 : 1; i < 400 && (D[back(i)] || 0) >= 60; i++) streak++;
    const NAMES = { maths: Object.fromEntries(MATHS_TOPICS.map(x => [x.id, x.name])), science: Object.fromEntries(SCI_TOPICS.map(x => [x.id, x.name])) };
    const topics = [];
    prog.results.forEach(r => { let d = {}; try { d = JSON.parse(r.data); } catch { d = {}; } Object.entries(d.tstats || {}).forEach(([id, x]) => { if (x && x.a > 0 && NAMES[r.subject] && NAMES[r.subject][id]) topics.push({ subject: r.subject, id, name: NAMES[r.subject][id], a: x.a, c: Math.min(x.c || 0, x.a) }); }); });
    const lb = study ? null : { week: (await leaderboard(env, me, 'week', isAdmin(user, env))).me, all: (await leaderboard(env, me, 'all', isAdmin(user, env))).me };
    const NOTE = { '[unlock-request]': '🔔 You asked to unlock the booklet', '[unlock-allowed]': '✅ Beau unlocked the booklet', '[unlock-declined]': 'Beau said not yet', '[chat-request]': '🙋 You asked to use Chat', '[chat-allowed]': '✅ Beau let you into Chat', '[chat-declined]': 'Beau said not yet', '[chat-removed]': 'Chat turned off', '[study-request]': '📚 You asked to leave study mode', '[study-allowed]': '✅ Study mode off', '[study-declined]': 'Beau said not yet' };
    const b0 = beau.results[0];
    return json({ now: t, name: u.results[0].username, joined: u.results[0].created_at, study, role: staffRole(user, env), roleName: ROLE_NAME[staffRole(user, env)] || null, tester: user.tester, booklet: await hasUnlock(env, user, 'theory'),
      time: { today: D[today] || 0, week: Array.from({ length: 7 }, (_, i) => D[back(i)] || 0).reduce((a, x) => a + x, 0), all: all.results[0].s || 0, last14, streak },
      leaderboard: lb, topics, friends: fr.results[0].n,
      messages: study ? null : { beau: { last: b0 ? (NOTE[b0.body] || b0.body) : null, mine: b0 ? !b0.from_admin : false, at: b0 ? b0.created_at : null, unread: beauN.results[0].n },
        chats: thr.results.map(r => ({ id: r.id, name: r.name, last: r.last, at: r.at || 0, unread: r.unread, online: t - (r.seen || 0) < 180 })).sort((a, b) => (b.unread - a.unread) || (b.at - a.at)) } });
  }
  if (path === '/api/ping' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const subject = String(body.subject || ''), visit = String(body.visit || '');
    if (!SUBJECTS.has(subject) || !/^[0-9a-f]{16,64}$/.test(visit)) return err(400, 'Bad request');
    const id = user.id + ':' + visit, t = now();
    const row = await env.DB.prepare('SELECT last_seen FROM visits WHERE id = ?').bind(id).first();
    let add = 0;
    if (!row) {
      const open = await env.DB.prepare('SELECT COUNT(*) AS n FROM visits WHERE user_id = ? AND started_at > ?').bind(user.id, t - 3600).first();
      if (open.n >= 30) return json({ ok: true, counted: 0 }); // no flood of made-up visits
      await env.DB.prepare('INSERT INTO visits (id, user_id, subject, started_at, last_seen, seconds, device) VALUES (?, ?, ?, ?, ?, 0, ?)').bind(id, user.id, subject, t, t, deviceOf(req)).run();
    } else {
      const gap = t - row.last_seen;
      if (gap < 10) return json({ ok: true });
      // Pings come every minute while someone is active; a longer gap means they were away, so it isn't counted.
      add = gap <= 150 ? Math.min(gap, 75) : 0;
      // One clock per person: two tabs (or made-up pings) can't count the same minute twice
      const clk = await env.DB.prepare('SELECT study_clock FROM users WHERE id = ?').bind(user.id).first();
      add = Math.max(0, Math.min(add, t - ((clk && clk.study_clock) || 0)));
      await env.DB.prepare('UPDATE visits SET last_seen = ?, seconds = seconds + ? WHERE id = ?').bind(t, add, id).run();
    }
    const stmts = [env.DB.prepare('UPDATE users SET last_seen = ?, last_subject = ?' + (add > 0 ? ', study_clock = ?' : '') + ' WHERE id = ?').bind(...(add > 0 ? [t, subject, t, user.id] : [t, subject, user.id]))];
    if (add > 0) stmts.push(env.DB.prepare('INSERT INTO daily (user_id, day, subject, seconds) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, day, subject) DO UPDATE SET seconds = seconds + excluded.seconds').bind(user.id, dayKey(t), subject, add));
    await env.DB.batch(stmts);
    return json({ ok: true, counted: add });
  }

  if (path === '/api/unlock/theory' && method === 'GET') {
    const unlocked = await hasUnlock(env, user, 'theory');
    return json({ unlocked, requested: !unlocked && (await lastUnlockNote(env, user.id)) === REQ_ASK });
  }
  // "Ask Beau to unlock it": a request in Message Beau that Beau can allow with one tap
  if (path === '/api/unlock/request' && method === 'POST') {
    if (await hasUnlock(env, user, 'theory')) return json({ ok: true, unlocked: true });
    if (isAdmin(user, env)) return err(400, 'You’re the admin.');
    const lastNote = await env.DB.prepare('SELECT body, created_at FROM messages WHERE user_id = ? AND ((body = ? AND from_admin = 0) OR (body IN (?, ?) AND from_admin = 1)) ORDER BY id DESC LIMIT 1').bind(user.id, REQ_ASK, REQ_YES, REQ_NO).first();
    if (lastNote && lastNote.body === REQ_ASK) return json({ ok: true, pending: true });
    if (lastNote && lastNote.body === REQ_NO && now() - lastNote.created_at < 86400) return err(429, 'Beau said not yet. You can ask again tomorrow, or send Beau a message.');
    await env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 0, ?, ?)').bind(user.id, REQ_ASK, now()).run();
    return json({ ok: true, pending: true }, 201);
  }
  if (path === '/api/unlock' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    if (await hasUnlock(env, user, 'theory')) return json({ ok: true, already: true });
    const t = now();
    const fails = await env.DB.prepare('SELECT COUNT(*) AS n FROM unlock_attempts WHERE user_id = ? AND at > ?').bind(user.id, t - 3600).first();
    if (fails.n >= 5) return err(429, 'Too many wrong codes. Wait an hour and try again.');
    const ik = await ipKey(req); // and per device, so making lots of accounts doesn't give more guesses
    if (await overLimit(env, 'codefail:' + ik, 15, 3600, false)) return err(429, 'Too many wrong codes from here. Wait an hour and try again.');
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const fail = async msg => { await env.DB.batch([env.DB.prepare('INSERT INTO unlock_attempts (user_id, at) VALUES (?, ?)').bind(user.id, t), env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind('codefail:' + ik, t)]); return err(400, msg + ' (' + (4 - fails.n) + ' tries left this hour)'); };
    if (!/^[A-Z0-9]{5}$/.test(code)) return fail('Codes are 5 letters and numbers.');
    const row = await env.DB.prepare("SELECT code, feature, redeemed_by FROM codes WHERE code = ? AND feature = 'theory'").bind(code).first();
    if (!row) return fail('That isn’t a booklet code. (Other codes go in your profile.)');
    if (row.redeemed_by !== null) return fail('That code has already been used.');
    const r = await useCode(env, user, row, t); if (r.error) return err(400, r.error);
    return json({ ok: true });
  }
  // 🎟️ Codes typed into your profile: booklet, Top tier admin, Basic admin or Official tester
  if (path === '/api/code' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const t = now();
    const fails = await env.DB.prepare('SELECT COUNT(*) AS n FROM unlock_attempts WHERE user_id = ? AND at > ?').bind(user.id, t - 3600).first();
    if (fails.n >= 5) return err(429, 'Too many wrong codes. Wait an hour and try again.');
    const ik = await ipKey(req);
    if (await overLimit(env, 'codefail:' + ik, 15, 3600, false)) return err(429, 'Too many wrong codes from here. Wait an hour and try again.');
    const fail = async msg => { await env.DB.batch([env.DB.prepare('INSERT INTO unlock_attempts (user_id, at) VALUES (?, ?)').bind(user.id, t), env.DB.prepare('INSERT INTO rate_hits (k, at) VALUES (?, ?)').bind('codefail:' + ik, t)]); return err(400, msg + ' (' + (4 - fails.n) + ' tries left this hour)'); };
    const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z0-9]{5}$/.test(code)) return fail('Codes are 5 letters and numbers.');
    const row = await env.DB.prepare('SELECT code, feature, redeemed_by FROM codes WHERE code = ?').bind(code).first();
    if (!row || !CODE_TYPES[row.feature]) return fail('That code isn’t right.');
    if (row.redeemed_by !== null) return fail('That code has already been used.');
    const r = await useCode(env, user, row, t); if (r.error) return err(400, r.error);
    return json({ ok: true, type: row.feature, message: r.message });
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
    if (FAKE_NOTE.test(text)) return err(400, 'That message can’t be sent. Type it a different way.');
    let fm = checkText(text);
    if (fm.ok) { const rec = await env.DB.prepare('SELECT body FROM messages WHERE user_id = ? AND from_admin = 0 AND created_at > ? ORDER BY id DESC LIMIT 8').bind(user.id, now() - 180).all(); fm = checkPieces(rec.results.map(x => x.body).reverse(), text); }
    if (!fm.ok) { await logBlocked(env, user.id, 'Message Beau', fm.why, text); return err(422, fm.message); }
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 0 AND created_at > ?').bind(user.id, now() - 3600).first();
    if (recent.n >= 30) return err(429, 'That’s a lot of messages. Wait a little and try again.');
    const r = await env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 0, ?, ?)').bind(user.id, text, now()).run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  }

  if (path.startsWith('/api/admin/')) {
    const role = staffRole(user, env);
    if (!role) return err(403, 'Only the site admin can see this.');
    return handleAdmin(req, env, path, method, user, role);
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
      // leaderboard: newly correct answers, and booklet answers marked right beyond your best so far (no farming by re-marking)
      const was = mathsStats(before), now_ = mathsStats(body.data);
      const bb = await env.DB.prepare('SELECT best FROM booklet_best WHERE user_id = ? AND subject = ?').bind(user.id, subject).first();
      const best = bb ? bb.best : was.bookletRight;
      if (!bb || now_.bookletRight > best) await env.DB.prepare('INSERT INTO booklet_best (user_id, subject, best) VALUES (?, ?, ?) ON CONFLICT(user_id, subject) DO UPDATE SET best = MAX(best, excluded.best)').bind(user.id, subject, Math.max(best, now_.bookletRight)).run();
      await addPoints(env, user.id, was, now_, Math.max(0, now_.bookletRight - best));
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
// 5-character codes from letters and numbers that can't be mixed up (no 0/O, 1/I/L), typed in any case
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() { const b = crypto.getRandomValues(new Uint8Array(5)); return Array.from(b, x => CODE_CHARS[x % CODE_CHARS.length]).join(''); }
const CODE_TYPES = { theory: '📘 Science booklet', top: '⭐ Top tier admin', basic: '🛡️ Basic admin', tester: '🧪 Official tester' };
// What a code does. Codes are only used up if they actually give you something new.
async function useCode(env, user, row, t) {
  const f = row.feature, owner = isAdmin(user, env);
  if (f === 'theory' && await hasUnlock(env, user, 'theory')) return { error: 'You already have the completed booklet, so this code wasn’t used. Give it to someone else.' };
  if ((f === 'top' || f === 'basic') && owner) return { error: 'You’re the owner already.' };
  if (f === 'top' && user.role === 'top') return { error: 'You’re already a Top tier admin, so this code wasn’t used.' };
  if (f === 'basic' && (user.role === 'top' || user.role === 'basic')) return { error: 'You already have ' + (user.role === 'top' ? 'Top tier' : 'Basic') + ' admin, so this code wasn’t used.' };
  if (f === 'tester' && user.tester) return { error: 'You’re already an Official tester, so this code wasn’t used.' };
  const claim = await env.DB.prepare('UPDATE codes SET redeemed_by = ?, redeemed_at = ? WHERE code = ? AND redeemed_by IS NULL').bind(user.id, t, row.code).run();
  if (!claim.meta.changes) return { error: 'That code has already been used.' };
  if (f === 'theory') await env.DB.prepare("INSERT OR IGNORE INTO unlocks (user_id, feature, unlocked_at, code) VALUES (?, 'theory', ?, ?)").bind(user.id, t, row.code).run();
  if (f === 'top' || f === 'basic') await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(f, user.id).run();
  if (f === 'tester') await env.DB.prepare('UPDATE users SET tester = 1 WHERE id = ?').bind(user.id).run();
  return { message: { theory: '📘 The completed Science booklet is unlocked! Open Science → Booklet.', top: '⭐ You’re now a Top tier admin. Open the dashboard from your profile.', basic: '🛡️ You’re now a Basic admin. Open the dashboard from your profile.', tester: '🧪 You’re now an Official tester! Check out your profile banner.' }[f] };
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

async function handleAdmin(req, env, path, method, me, role = 'owner') {
  const t = now(), today = dayKey(t), url = new URL(req.url);
  // Helpers (Top tier and Basic admins) only get chat moderation, study mode and feedback. Everything else is Beau's.
  const owner = role === 'owner';
  if (!owner && !/^\/api\/admin\/(overview|chat\/|study|study-all|feedback|feedback-status)$/.test(path) && !path.startsWith('/api/admin/chat/')) return err(403, 'Only Beau can do this.');
  if (!owner && path === '/api/admin/overview') return json({ now: t, role, roleName: ROLE_NAME[role], staff: true });
  const cma = await handleCommunityAdmin(req, env, url, role); if (cma) return cma;
  if (path === '/api/admin/overview' && method === 'GET') {
    const since30 = dayKey(t - 29 * 86400), since7 = dayKey(t - 6 * 86400);
    const [users, perUser, perUser7, today_, visits, daily, signups, progress, sciProgress, unlockRows, codeCount, fbCount] = await env.DB.batch([
      env.DB.prepare('SELECT id, username, created_at, last_login, login_count, last_seen, last_subject, in_stats, chat_muted, chat_access, chat_req FROM users ORDER BY last_seen DESC'),
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
        visits: (vs[u.id] || {}).n || 0, device: (vs[u.id] || {}).device || null, maths: mathsStats(data), science: mathsStats(sdata), unlocked: unlockRows.results.some(r => r.user_id === u.id), inStats: !left.has(u.id), chatMuted: !!u.chat_muted, chatAccess: !!u.chat_access, chatReq: !!u.chat_req, admin: u.username.toLowerCase() === String(env.ADMIN_USERNAME || '').toLowerCase() };
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
    const [rows, staff] = await env.DB.batch([
      env.DB.prepare("SELECT c.code, c.feature, c.created_at, c.redeemed_at, u.username AS redeemed_name FROM codes c LEFT JOIN users u ON u.id = c.redeemed_by ORDER BY c.feature, c.redeemed_at IS NOT NULL, c.redeemed_at DESC, c.created_at, c.code"),
      env.DB.prepare("SELECT id, username AS name, role, tester FROM users WHERE role IS NOT NULL OR tester = 1 ORDER BY username COLLATE NOCASE")
    ]);
    return json({ codes: rows.results, types: CODE_TYPES, people: staff.results });
  }
  if (path === '/api/admin/role' && method === 'POST') {
    let b; try { b = await readJson(req); } catch { return err(400, 'Bad request'); }
    const id = +b.id || 0, set = [];
    if ('role' in b) set.push(env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(b.role === 'top' || b.role === 'basic' ? b.role : null, id));
    if ('tester' in b) set.push(env.DB.prepare('UPDATE users SET tester = ? WHERE id = ?').bind(b.tester ? 1 : 0, id));
    if (set.length) await env.DB.batch(set);
    return json({ ok: true });
  }
  if (path === '/api/admin/codes' && method === 'POST') {
    let body; try { body = await readJson(req); } catch { return err(400, 'Bad request'); }
    const want = Math.max(1, Math.min(100, Math.floor(+body.count || 0))), type = CODE_TYPES[body.type] ? body.type : 'theory';
    const made = [];
    for (let tries = 0; made.length < want && tries < want * 20; tries++) {
      const c = newCode();
      const r = await env.DB.prepare('INSERT OR IGNORE INTO codes (code, feature, created_at) VALUES (?, ?, ?)').bind(c, type, t).run();
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
    const ul = await env.DB.prepare("SELECT 1 FROM unlocks WHERE user_id = ? AND feature = 'theory'").bind(uid).first();
    const ca = await env.DB.prepare('SELECT chat_access, chat_req, study_req FROM users WHERE id = ?').bind(uid).first();
    return json({ user: who, unlocked: !!ul, chatAccess: !!ca.chat_access, chatReq: !!ca.chat_req, studyReq: !!ca.study_req, messages: rows.results.map(r => ({ id: r.id, mine: !!r.from_admin, body: r.body, at: r.created_at, read: !!r.read_at })) });
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
  // Limits & usage: database size, accounts, and (with a CF_API_TOKEN secret) today's requests and database reads/writes
  if (path === '/api/admin/usage' && method === 'GET') {
    const r = await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM progress) AS progress, (SELECT COUNT(*) FROM messages) + (SELECT COUNT(*) FROM dm_messages) AS messages,
      (SELECT COUNT(*) FROM visits) AS visits, (SELECT COUNT(*) FROM games) AS games, (SELECT value FROM settings WHERE key = 'cf_plan') AS plan`).all();
    const row = r.results[0];
    return json({ now: t, dbBytes: (r.meta && (r.meta.size_after || r.meta.size)) || null, counts: row, plan: row.plan === 'paid' ? 'paid' : 'free', cf: await cfUsage(env) });
  }
  if (path === '/api/admin/usage-plan' && method === 'POST') {
    let b; try { b = await readJson(req); } catch { return err(400, 'Bad request'); }
    await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('cf_plan', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(b.plan === 'paid' ? 'paid' : 'free').run();
    return json({ ok: true });
  }
  // Security: recent admin sign-ins (and wrong tries), and "log out everywhere else"
  if (path === '/api/admin/security' && method === 'GET') {
    const [log, sess] = await env.DB.batch([
      env.DB.prepare('SELECT at, ok, ip_hash, place, device FROM admin_log ORDER BY id DESC LIMIT 30'),
      env.DB.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND expires_at > ?').bind(me.id, t)
    ]);
    return json({ now: t, log: log.results, sessions: sess.results[0].n, here: (await ipKey(req)).slice(0, 8) });
  }
  if (path === '/api/admin/logout-others' && method === 'POST') {
    const r = await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').bind(me.id, me.tokenHash).run();
    return json({ ok: true, ended: r.meta.changes || 0 });
  }
  // Study mode: the site-wide switch, one person on/off (answers their request if they asked)
  if (path === '/api/admin/study' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, username AS name, study_mode, study_free, study_req, last_seen, chat_muted FROM users WHERE username != ? COLLATE NOCASE ORDER BY study_req IS NULL, study_req, username COLLATE NOCASE').bind(String(env.ADMIN_USERNAME || '')).all();
    const site = await studyAll(env, true);
    return json({ now: t, site, people: rows.results.map(u => ({ id: u.id, name: u.name, study: !!u.study_mode || (site && !u.study_free), own: !!u.study_mode, req: u.study_req, seen: u.last_seen, muted: !!u.chat_muted })), role });
  }
  if (path === '/api/admin/study-all' && method === 'POST') {
    let b; try { b = await readJson(req); } catch { return err(400, 'Bad request'); }
    const on = !!b.on;
    if (!on && role === 'basic') return err(403, 'Only Beau or a Top tier admin can turn study mode off.');
    const stmts = [env.DB.prepare("INSERT INTO settings (key, value) VALUES ('study_all', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(on ? '1' : '0')];
    if (on) stmts.push(env.DB.prepare('UPDATE users SET study_free = 0'));
    await env.DB.batch(stmts); await studyAll(env, true);
    return json({ ok: true, site: on });
  }
  if (path === '/api/admin/study' && method === 'POST') {
    let b; try { b = await readJson(req); } catch { return err(400, 'Bad request'); }
    const id = +b.id || 0, u = await env.DB.prepare('SELECT study_req FROM users WHERE id = ?').bind(id).first(); if (!u) return err(404, 'No such user');
    if (!b.on && role === 'basic') return err(403, 'Only Beau or a Top tier admin can take someone out of study mode.');
    const on = !!b.on, stmts = [on ? env.DB.prepare('UPDATE users SET study_mode = 1, study_free = 0, study_req = NULL WHERE id = ?').bind(id) : env.DB.prepare('UPDATE users SET study_mode = 0, study_free = 1, study_req = NULL WHERE id = ?').bind(id)];
    if (u.study_req) stmts.push(env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 1, ?, ?)').bind(id, on ? '[study-declined]' : '[study-allowed]', t),
      env.DB.prepare("UPDATE messages SET read_at = ? WHERE user_id = ? AND from_admin = 0 AND read_at IS NULL AND body = '[study-request]'").bind(t, id));
    await env.DB.batch(stmts);
    return json({ ok: true, study: on });
  }
  // "Message everyone" pop-up: send one (replaces any that's showing), stop it early, see recent ones
  if (path === '/api/admin/broadcast' && method === 'GET') {
    const [rec, on] = await env.DB.batch([
      env.DB.prepare('SELECT id, body, created_at, ends_at, stopped_at FROM broadcasts ORDER BY id DESC LIMIT 8'),
      env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE last_seen > ?').bind(t - 180)
    ]);
    return json({ now: t, live: await liveNotice(env, true), recent: rec.results, onNow: on.results[0].n });
  }
  if (path === '/api/admin/broadcast' && method === 'POST') {
    let b; try { b = await readJson(req); } catch { return err(400, 'Bad request'); }
    const text = String(b.body || '').replace(/\r\n?/g, '\n').trim(), secs = Math.round(+b.seconds || 0);
    if (!text) return err(400, 'Type a message first.'); if (text.length > 300) return err(400, 'Keep it to 300 characters so it fits in the pop-up.');
    if (!(secs >= 5 && secs <= 86400)) return err(400, 'Pick a time between 5 seconds and 24 hours.');
    const fr = checkText(text); if (!fr.ok) { await logBlocked(env, me.id, 'message everyone', fr.why, text); return err(422, fr.message); }
    await env.DB.batch([
      env.DB.prepare('UPDATE broadcasts SET ends_at = ?, stopped_at = ? WHERE ends_at > ?').bind(t, t, t),
      env.DB.prepare('INSERT INTO broadcasts (body, created_at, ends_at) VALUES (?, ?, ?)').bind(text, t, t + secs)
    ]);
    return json({ ok: true, live: await liveNotice(env, true) }, 201);
  }
  if (path === '/api/admin/broadcast/stop' && method === 'POST') {
    await env.DB.prepare('UPDATE broadcasts SET ends_at = ?, stopped_at = ? WHERE ends_at > ?').bind(t, t, t).run();
    await liveNotice(env, true); return json({ ok: true });
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
    if (body.status === 'delete' && !owner) return err(403, 'Only Beau can delete feedback.');
    if (body.status === 'delete') await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
    else if (['new', 'done'].includes(body.status)) await env.DB.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(body.status, id).run();
    else return err(400, 'Bad status');
    return json({ ok: true });
  }
  if (path === '/api/admin/messages') {
    const text = String(body.body || '').replace(/\r\n?/g, '\n').trim();
    if (!text) return err(400, 'Type a message first.'); if (text.length > 2000) return err(400, 'Messages can be up to 2000 characters.');
    const fr = checkText(text); if (!fr.ok) { await logBlocked(env, me.id, 'reply from Beau', fr.why, text); return err(422, fr.message); }
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
  if (path === '/api/admin/unlock-answer') {
    if (!await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first()) return err(404, 'No such user');
    const stmts = [env.DB.prepare('INSERT INTO messages (user_id, from_admin, body, created_at) VALUES (?, 1, ?, ?)').bind(id, body.allow ? REQ_YES : REQ_NO, t),
      env.DB.prepare('UPDATE messages SET read_at = ? WHERE user_id = ? AND from_admin = 0 AND read_at IS NULL').bind(t, id)];
    if (body.allow) stmts.unshift(env.DB.prepare("INSERT OR IGNORE INTO unlocks (user_id, feature, unlocked_at, code) VALUES (?, 'theory', ?, 'admin')").bind(id, t));
    await env.DB.batch(stmts);
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
