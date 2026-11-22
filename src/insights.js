// 📈 Insights. Every answered Maths/Science question is logged here, which gives:
//   • students: real stats (last 20 questions, by difficulty, by subject, best run…) and a "My mistakes" list
//   • everyone: the 🎯 Daily challenge (5 mixed questions a day, the same for everyone, made and marked here)
//   • Beau: lots more admin numbers, a student search with each student's stats, and a "problem questions" list
import * as MathsQ from './gen/maths-game.js';
import * as SciQ from './gen/sci-game.js';
import { addPoints } from './community.js';

const now = () => Math.floor(Date.now() / 1000);
const QLD = 10 * 3600;
const dayKey = t => new Date((t + QLD) * 1000).toISOString().slice(0, 10);
const dayStart = t => { const d = dayKey(t); return Math.floor(Date.parse(d + 'T00:00:00Z') / 1000) - QLD; };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (status, error) => json({ error }, status);
async function body(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) throw new Error('json');
  const t = await req.text(); if (t.length > 8000) throw new Error('big'); return JSON.parse(t);
}
const plain = (s, n) => String(s == null ? '' : s).replace(/<svg[\s\S]*?<\/svg>/gi, ' [diagram] ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim().slice(0, n);
const TOPIC_NAME = Object.fromEntries([...MathsQ.TOPICS.map(t => ['maths:' + t.id, t.name]), ...SciQ.TOPICS.map(t => ['science:' + t.id, t.name])]);
const topicName = (subject, id) => TOPIC_NAME[subject + ':' + id] || id;
const pct = (c, n) => n ? Math.round(c * 100 / n) : null;

// the stats for one student, from their logged answers (newest first)
function statsOf(rows, t) {
  const today = dayStart(t), week = t - 7 * 86400, nc = list => ({ n: list.length, c: list.filter(r => r.ok).length });
  const out = { all: nc(rows), last20: nc(rows.slice(0, 20)), prev20: nc(rows.slice(20, 40)), last50: nc(rows.slice(0, 50)), today: nc(rows.filter(r => r.at >= today)), week: nc(rows.filter(r => r.at >= week)) };
  out.bySubject = { maths: nc(rows.filter(r => r.subject === 'maths')), science: nc(rows.filter(r => r.subject === 'science')) };
  out.byDiff = { e: nc(rows.filter(r => r.diff === 'e')), m: nc(rows.filter(r => r.diff === 'm')), h: nc(rows.filter(r => r.diff === 'h')) };
  let run = 0, best = 0; for (let i = rows.length - 1; i >= 0; i--) { run = rows[i].ok ? run + 1 : 0; if (run > best) best = run; }
  let cur = 0; for (const r of rows) { if (!r.ok) break; cur++; }
  out.bestRun = best; out.currentRun = cur;
  const days = new Set(rows.map(r => dayKey(r.at))); out.activeDays = days.size; out.perDay = days.size ? Math.round(rows.length / days.size) : 0;
  out.since = rows.length ? rows[rows.length - 1].at : null;
  const T = {}; rows.forEach(r => { const k = r.subject + ':' + r.topic, x = T[k] || (T[k] = { subject: r.subject, id: r.topic, name: topicName(r.subject, r.topic), n: 0, c: 0 }); x.n++; if (r.ok) x.c++; });
  const tl = Object.values(T).filter(x => x.n >= 5).map(x => ({ ...x, p: pct(x.c, x.n) }));
  out.strongest = tl.slice().sort((a, b) => b.p - a.p || b.n - a.n).slice(0, 3);
  out.weakest = tl.slice().sort((a, b) => a.p - b.p || b.n - a.n).slice(0, 3);
  const H = Array(24).fill(0); rows.forEach(r => { H[new Date((r.at + QLD) * 1000).getUTCHours()]++; }); out.hours = H;
  return out;
}
// questions you got wrong and haven't since got right (one per question type), newest first
function mistakesOf(rows) {
  const fixed = new Set(), seen = new Set(), todo = [], done = [];
  for (const r of rows) { // newest first
    const k = r.subject + ':' + r.gen;
    if (r.ok) { if (!seen.has(k)) fixed.add(k); continue; }
    if (seen.has(k)) continue; seen.add(k);
    const m = { id: r.id, at: r.at, subject: r.subject, topic: r.topic, topicName: topicName(r.subject, r.topic), gen: r.gen, gname: r.gname || '', q: r.q, given: r.given, correct: r.correct };
    (fixed.has(k) ? done : todo).push(m);
  }
  return { todo: todo.slice(0, 40), fixed: done.slice(0, 20) };
}
async function challengeStreak(env, uid, t) {
  const r = await env.DB.prepare('SELECT day FROM challenge WHERE user_id = ? AND done = 1 ORDER BY day DESC LIMIT 400').bind(uid).all();
  const days = new Set(r.results.map(x => x.day)); let n = 0, d = t;
  if (!days.has(dayKey(d))) d -= 86400; // today not done yet: the streak can still be kept
  while (days.has(dayKey(d))) { n++; d -= 86400; }
  return { streak: n, total: days.size };
}

/* ---------- 🎯 the daily challenge ---------- */
function seededRandom(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const hashDay = d => { let h = 2166136261; for (const ch of 'ec-challenge:' + d) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const CH_CACHE = new Map();
function challengeQs(day) { // the same 5 questions for everyone today (made with a random seed from the date)
  if (CH_CACHE.has(day)) return CH_CACHE.get(day);
  const orig = Math.random; Math.random = seededRandom(hashDay(day)); const out = [];
  try {
    for (let i = 0; i < 5; i++) {
      const subject = (i + hashDay(day)) % 2 ? 'science' : 'maths', X = subject === 'maths' ? MathsQ : SciQ, topics = Object.keys(X.TOPIC_GENS);
      let Q = null;
      for (let k = 0; k < 20 && !Q; k++) { const tid = topics[Math.floor(Math.random() * topics.length)], r = X.pickPractice(tid, 'any', 'mcq'); if (r.Q && r.Q.type === 'mcq' && Array.isArray(r.Q.choices) && !out.some(o => o.gen === r.Q.gen)) Q = { ...r.Q, topic: r.Q.topic || tid }; }
      if (!Q) { const q2 = X.asMCQ(X.makeQ(X.pick(X.TOPIC_GENS[topics[0]]))); Q = { ...q2, topic: q2.topic || topics[0] }; }
      out.push({ subject, topic: Q.topic, topicName: topicName(subject, Q.topic), gen: Q.gen, gname: Q.gname || '', q: Q.q, fig: Q.fig || '', choices: Q.choices, ans: Q.ans, ansText: Q.ansText, sol: (Q.sol || []).map(s => typeof s === 'string' ? s : (s.t || '') + (s.why ? ' <span class="why">(' + s.why + ')</span>' : '')) });
    }
  } finally { Math.random = orig; }
  CH_CACHE.set(day, out); if (CH_CACHE.size > 5) CH_CACHE.delete(CH_CACHE.keys().next().value);
  return out;
}
const CH_POINTS = score => score * 4 + 5 + (score === 5 ? 5 : 0); // 4 per right answer, +5 for finishing, +5 more for 5/5

export async function handleInsights(req, env, url, user) {
  const path = url.pathname, method = req.method, t = now(), uid = user.id;
  // log one answered question (from practice, tests and topic quizzes on the Maths and Science pages)
  if (path === '/api/answer' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const subject = b.subject === 'science' ? 'science' : b.subject === 'maths' ? 'maths' : null;
    const topic = String(b.topic || ''), gen = String(b.gen || '');
    if (!subject || !/^[A-Za-z0-9]{1,12}$/.test(topic) || !/^[A-Za-z0-9_]{1,40}$/.test(gen)) return err(400, 'Bad request');
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM answers WHERE user_id = ? AND at > ?').bind(uid, t - 86400).first();
    if (n.n >= 1500) return json({ ok: true, skipped: true }); // far more than anyone really answers in a day
    await env.DB.prepare('INSERT INTO answers (user_id, at, subject, topic, gen, gname, diff, typ, ok, q, given, correct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(uid, t, subject, topic, gen, plain(b.gname, 80), ['e', 'm', 'h'].includes(b.diff) ? b.diff : 'm', plain(b.type, 10), b.ok ? 1 : 0, plain(b.q, 300), plain(b.given, 150), plain(b.correct, 150)).run();
    return json({ ok: true });
  }
  // 📈 your stats
  if (path === '/api/mystats' && method === 'GET') {
    const rows = (await env.DB.prepare('SELECT at, subject, topic, diff, ok FROM answers WHERE user_id = ? ORDER BY id DESC LIMIT 3000').bind(uid).all()).results;
    return json({ now: t, stats: statsOf(rows, t), challenge: await challengeStreak(env, uid, t) });
  }
  // ❌ My mistakes
  if (path === '/api/mistakes' && method === 'GET') {
    const rows = (await env.DB.prepare('SELECT id, at, subject, topic, gen, gname, ok, q, given, correct FROM answers WHERE user_id = ? AND at > ? ORDER BY id DESC LIMIT 3000').bind(uid, t - 60 * 86400).all()).results;
    return json({ now: t, ...mistakesOf(rows) });
  }
  // 🎯 the daily challenge
  if (path === '/api/challenge' && method === 'GET') {
    const day = dayKey(t), qs = challengeQs(day);
    const [row, count] = await env.DB.batch([env.DB.prepare('SELECT answers, score, pts, done FROM challenge WHERE user_id = ? AND day = ?').bind(uid, day), env.DB.prepare('SELECT COUNT(*) AS n, ROUND(AVG(score), 1) AS avg FROM challenge WHERE day = ? AND done = 1').bind(day)]);
    const r = row.results[0], given = r ? JSON.parse(r.answers) : [];
    const view = qs.map((q, i) => { const g = given[i]; const v = { subject: q.subject, topicName: q.topicName, gname: q.gname, q: q.q, fig: q.fig, choices: q.choices }; if (g != null) Object.assign(v, { pick: g, right: g === q.ans, ans: q.ans, ansText: q.ansText, sol: q.sol }); return v; });
    return json({ day, questions: view, done: !!(r && r.done), score: r ? r.score : 0, pts: r ? r.pts : 0, everyone: { done: count.results[0].n, avg: count.results[0].avg }, ...(await challengeStreak(env, uid, t)), resetIn: dayStart(t) + 86400 - t });
  }
  if (path === '/api/challenge/answer' && method === 'POST') {
    let b; try { b = await body(req); } catch { return err(400, 'Bad request'); }
    const day = dayKey(t), qs = challengeQs(day), i = b.i, pick = b.pick;
    if (!Number.isInteger(i) || i < 0 || i >= qs.length || !Number.isInteger(pick) || pick < 0 || pick >= qs[i].choices.length) return err(400, 'Bad request');
    const r = await env.DB.prepare('SELECT answers, done FROM challenge WHERE user_id = ? AND day = ?').bind(uid, day).first();
    const given = r ? JSON.parse(r.answers) : [];
    if (given[i] != null) return err(409, 'You’ve already answered that one.');
    given[i] = pick; while (given.length < qs.length) given.push(null);
    const score = qs.reduce((s, q, k) => s + (given[k] === q.ans ? 1 : 0), 0), done = given.every(g => g != null), pts = done ? CH_POINTS(score) : 0;
    await env.DB.prepare('INSERT INTO challenge (user_id, day, answers, score, pts, done, done_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET answers = excluded.answers, score = excluded.score, pts = excluded.pts, done = excluded.done, done_at = excluded.done_at')
      .bind(uid, day, JSON.stringify(given), score, pts, done ? 1 : 0, done ? t : null).run();
    if (done) await addPoints(env, uid, { correct: 0, bookletRight: 0 }, { correct: 0, bookletRight: 0 }, 0, pts);
    const q = qs[i];
    // the challenge counts as practice too (stats and My mistakes)
    await env.DB.prepare('INSERT INTO answers (user_id, at, subject, topic, gen, gname, diff, typ, ok, q, given, correct) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(uid, t, q.subject, String(q.topic), String(q.gen), plain(q.gname, 80), 'm', 'mcq', pick === q.ans ? 1 : 0, plain(q.q, 300), plain(q.choices[pick], 150), plain(q.ansText, 150)).run();
    return json({ right: pick === q.ans, ans: q.ans, ansText: q.ansText, sol: q.sol, done, score, pts });
  }
  return null;
}

/* ---------- 🛠️ admin (Beau only: worker.js checks) ---------- */
export async function handleInsightsAdmin(req, env, url) {
  const path = url.pathname, t = now();
  if (path === '/api/admin/insights') {
    const today = dayStart(t), week = t - 7 * 86400, month = t - 30 * 86400;
    const S = 'JOIN users u ON u.id = a.user_id AND u.in_stats = 1';
    const q = (sql, ...b) => env.DB.prepare(sql).bind(...b);
    const [ansToday, ansWeek, ansAll, bySubj, hours, wdays, topics, hard, studyToday, studyWeek, perStudent, newAcc, multiDay, chToday, ratings, fbOpen, pointsWeek, chatToday, lastSeen] = await env.DB.batch([
      q('SELECT COUNT(*) AS n, SUM(a.ok) AS c, COUNT(DISTINCT a.user_id) AS p FROM answers a ' + S + ' WHERE a.at >= ?', today),
      q('SELECT COUNT(*) AS n, SUM(a.ok) AS c, COUNT(DISTINCT a.user_id) AS p FROM answers a ' + S + ' WHERE a.at >= ?', week),
      q('SELECT COUNT(*) AS n, SUM(a.ok) AS c, MIN(a.at) AS since FROM answers a ' + S),
      q('SELECT a.subject, COUNT(*) AS n, SUM(a.ok) AS c FROM answers a ' + S + ' WHERE a.at >= ? GROUP BY a.subject', week),
      q("SELECT CAST(strftime('%H', a.at + 36000, 'unixepoch') AS INTEGER) AS h, COUNT(*) AS n FROM answers a " + S + ' WHERE a.at >= ? GROUP BY h', week),
      q("SELECT CAST(strftime('%w', a.at + 36000, 'unixepoch') AS INTEGER) AS d, COUNT(*) AS n FROM answers a " + S + ' WHERE a.at >= ? GROUP BY d', month),
      q('SELECT a.subject, a.topic, COUNT(*) AS n, SUM(a.ok) AS c FROM answers a ' + S + ' WHERE a.at >= ? GROUP BY a.subject, a.topic ORDER BY n DESC', week),
      q('SELECT a.subject, a.topic, COUNT(*) AS n, SUM(a.ok) AS c FROM answers a ' + S + ' WHERE a.at >= ? GROUP BY a.subject, a.topic HAVING n >= 15 ORDER BY (1.0 * SUM(a.ok) / COUNT(*)) ASC LIMIT 6', month),
      q('SELECT COUNT(DISTINCT d.user_id) AS p, COALESCE(SUM(d.seconds), 0) AS s FROM daily d JOIN users u ON u.id = d.user_id AND u.in_stats = 1 WHERE d.day = ?', dayKey(t)),
      q('SELECT COUNT(DISTINCT d.user_id) AS p, COALESCE(SUM(d.seconds), 0) AS s FROM daily d JOIN users u ON u.id = d.user_id AND u.in_stats = 1 WHERE d.day >= ?', dayKey(week)),
      q('SELECT d.user_id, SUM(d.seconds) AS s FROM daily d JOIN users u ON u.id = d.user_id AND u.in_stats = 1 WHERE d.day >= ? GROUP BY d.user_id ORDER BY s DESC', dayKey(week)),
      q("SELECT date(created_at + 36000, 'unixepoch') AS d, COUNT(*) AS n FROM users WHERE created_at >= ? AND in_stats = 1 GROUP BY d ORDER BY d", t - 7 * 86400),
      q('SELECT COUNT(*) AS n FROM (SELECT d.user_id FROM daily d JOIN users u ON u.id = d.user_id AND u.in_stats = 1 WHERE d.day >= ? GROUP BY d.user_id HAVING COUNT(DISTINCT d.day) >= 3)', dayKey(week)),
      q('SELECT COUNT(*) AS n, ROUND(AVG(score), 1) AS avg FROM challenge WHERE day = ? AND done = 1', dayKey(t)),
      q('SELECT COUNT(*) AS n, ROUND(AVG(stars), 2) AS avg FROM surveys'),
      q("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'"),
      q('SELECT COALESCE(SUM(p.qpts), 0) AS q FROM points_daily p JOIN users u ON u.id = p.user_id AND u.in_stats = 1 WHERE p.day >= ?', dayKey(week)),
      q('SELECT (SELECT COUNT(*) FROM dm_messages WHERE created_at >= ?) AS n', today),
      q('SELECT SUM(last_seen >= ?) AS day, SUM(last_seen >= ?) AS week, COUNT(*) AS all_ FROM users WHERE in_stats = 1', t - 86400, week)
    ]);
    const one = r => r.results[0] || {}, H = Array(24).fill(0), W = Array(7).fill(0);
    hours.results.forEach(r => { H[r.h] = r.n; }); wdays.results.forEach(r => { W[r.d] = r.n; });
    const ps = perStudent.results.map(r => r.s).sort((a, b) => a - b), median = ps.length ? ps[Math.floor(ps.length / 2)] : 0;
    const tp = r => ({ subject: r.subject, id: r.topic, name: topicName(r.subject, r.topic), n: r.n, p: pct(r.c, r.n) });
    return json({ now: t, answers: { today: one(ansToday), week: one(ansWeek), all: one(ansAll), bySubject: bySubj.results, hours: H, weekdays: W },
      topics: topics.results.slice(0, 8).map(tp), hardest: hard.results.map(tp),
      study: { today: one(studyToday), week: one(studyWeek), medianWeek: median, topWeek: ps.length ? ps[ps.length - 1] : 0, threePlusDays: one(multiDay).n || 0 },
      people: one(lastSeen), newAccounts: newAcc.results, challenge: one(chToday), ratings: one(ratings), feedbackOpen: one(fbOpen).n || 0, pointsWeek: one(pointsWeek).q || 0, chatToday: one(chatToday).n || 0 });
  }
  if (path === '/api/admin/problems') {
    const since = t - 60 * 86400;
    const [gens, reps] = await env.DB.batch([
      env.DB.prepare('SELECT subject, topic, gen, MAX(gname) AS gname, COUNT(*) AS n, SUM(ok) AS c FROM answers WHERE at >= ? GROUP BY subject, gen HAVING n >= 8').bind(since),
      env.DB.prepare("SELECT json_extract(context, '$.gen') AS gen, COUNT(*) AS n, SUM(status = 'new') AS open FROM feedback WHERE context IS NOT NULL GROUP BY gen")
    ]);
    const R = Object.fromEntries(reps.results.filter(r => r.gen).map(r => [r.gen, r]));
    const list = gens.results.map(r => ({ subject: r.subject, topic: r.topic, topicName: topicName(r.subject, r.topic), gen: r.gen, gname: r.gname || r.gen, n: r.n, wrong: r.n - r.c, wrongPct: pct(r.n - r.c, r.n), reports: R[r.gen] ? R[r.gen].n : 0, open: R[r.gen] ? R[r.gen].open : 0 }));
    // reported question types that haven't been answered 8 times yet still show up
    Object.values(R).forEach(r => { if (!list.some(x => x.gen === r.gen)) list.push({ subject: '', topic: '', topicName: '', gen: r.gen, gname: r.gen, n: 0, wrong: 0, wrongPct: null, reports: r.n, open: r.open }); });
    list.sort((a, b) => (b.open - a.open) || ((b.wrongPct ?? -1) - (a.wrongPct ?? -1)) || (b.reports - a.reports));
    const top = list.filter(x => x.n).slice(0, 25);
    if (top.length) {
      const ex = await env.DB.batch(top.map(x => env.DB.prepare("SELECT given, MAX(correct) AS correct, COUNT(*) AS k FROM answers WHERE gen = ? AND subject = ? AND ok = 0 AND at >= ? AND given != '' GROUP BY lower(given) ORDER BY k DESC LIMIT 4").bind(x.gen, x.subject, since)));
      top.forEach((x, i) => { x.wrongAnswers = ex[i].results; });
    }
    return json({ now: t, list: list.slice(0, 60) });
  }
  if (path === '/api/admin/student-search') {
    const term = String(url.searchParams.get('q') || '').trim().slice(0, 40);
    if (term.length < 1) return json({ people: [] });
    const r = await env.DB.prepare("SELECT id, username, last_seen, created_at FROM users WHERE username LIKE ? ESCAPE '\\' ORDER BY (lower(username) = lower(?)) DESC, last_seen DESC LIMIT 15").bind('%' + term.replace(/[\\%_]/g, c => '\\' + c) + '%', term).all();
    return json({ people: r.results });
  }
  const sm = path.match(/^\/api\/admin\/student\/(\d+)$/);
  if (sm) {
    const id = +sm[1], week = dayKey(t - 6 * 86400);
    const u = await env.DB.prepare('SELECT id, username, created_at, last_seen, last_subject, in_stats, lb_hidden FROM users WHERE id = ?').bind(id).first();
    if (!u) return err(404, 'No such student');
    const [rows, recent, study, pts, days] = await env.DB.batch([
      env.DB.prepare('SELECT at, subject, topic, diff, ok FROM answers WHERE user_id = ? ORDER BY id DESC LIMIT 3000').bind(id),
      env.DB.prepare('SELECT id, at, subject, topic, gname, ok, q, given, correct FROM answers WHERE user_id = ? ORDER BY id DESC LIMIT 25').bind(id),
      env.DB.prepare('SELECT COALESCE(SUM(seconds), 0) AS all_, COALESCE(SUM(CASE WHEN day >= ? THEN seconds END), 0) AS week, COALESCE(SUM(CASE WHEN day = ? THEN seconds END), 0) AS today FROM daily WHERE user_id = ?').bind(week, dayKey(t), id),
      env.DB.prepare('SELECT COALESCE(SUM(qpts), 0) AS q, COALESCE(SUM(booklet), 0) AS b, COALESCE(SUM(CASE WHEN day >= ? THEN qpts + booklet END), 0) AS wk FROM points_daily WHERE user_id = ?').bind(week, id),
      env.DB.prepare('SELECT day, SUM(seconds) AS s FROM daily WHERE user_id = ? GROUP BY day ORDER BY day DESC LIMIT 14').bind(id)
    ]);
    const st = study.results[0], p = pts.results[0];
    return json({ now: t, user: u, stats: statsOf(rows.results, t), recent: recent.results.map(r => ({ ...r, topicName: topicName(r.subject, r.topic) })),
      study: { today: st.today, week: st.week, all: st.all_, days: days.results }, points: { answers: p.q, booklet: p.b, week: p.wk }, challenge: await challengeStreak(env, id, t) });
  }
  return null;
}
