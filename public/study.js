/* EC Revisions: study mode. Loaded on every page by theme.js. When study mode is on for this student
   (Beau's switch, the automatic school-hours times, or just for them): Maths, Science, Play with friends,
   the leaderboard, their profile and messaging Beau all work. Chatting with friends and the Feedback form
   are turned off (the Chat page shows only the ✉️ Beau tab). There's a button to ask Beau to turn it off.
   The server blocks those features too. */
(() => {
  if (window.ecStudy) return; window.ecStudy = true;
  const path = location.pathname;
  if (path.startsWith('/admin')) return;
  const BLOCKED = ['/feedback'].some(p => path.startsWith(p));
  const root = document.documentElement;
  const css = document.createElement('style');
  css.textContent = `
html.ec-study a[href^="/feedback"]{display:none!important}
html.ec-study .ec-hide-study{display:none!important}
html.ec-study-wait main{visibility:hidden}
.ec-study-card{border:2.5px solid var(--accent,#2453d6);background:var(--accent-soft,#e8eefc);color:var(--ink,#1b1b1b);border-radius:16px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.ec-study-card h2,.ec-study-card h3{margin:0}
.ec-study-card .ec-s-row{display:flex;gap:8px;flex-wrap:wrap}
.ec-study-card .ec-s-msg{font-weight:600}
.ec-study-pill{display:inline-flex;align-items:center;gap:6px;font-size:.875rem;font-weight:700;color:var(--accent,#2453d6);background:var(--accent-soft,#e8eefc);border:1.5px solid var(--accent,#2453d6);border-radius:999px;padding:4px 12px;white-space:nowrap}`;
  document.head.appendChild(css);
  if (BLOCKED) root.classList.add('ec-study-wait');
  let state = null;
  // "until 3:10 pm" (or "until Mon 3:10 pm" if it's not today), Queensland time
  const until = () => {
    if (!state || !state.until) return '';
    const o = { timeZone: 'Australia/Brisbane' }, d = new Date(state.until * 1000);
    const t = d.toLocaleTimeString('en-AU', { ...o, hour: 'numeric', minute: '2-digit' }).replace(/\s/g, ' ');
    const same = d.toLocaleDateString('en-AU', o) === new Date().toLocaleDateString('en-AU', o);
    return ' until ' + (same ? '' : d.toLocaleDateString('en-AU', { ...o, weekday: 'short' }) + ' ') + t;
  };
  window.ecStudyUntil = until;
  const get = async force => { const j = window.ecLive ? await window.ecLive(force) : null; return j && j.study ? j.study : null; };

  function card(big) {
    const c = document.createElement('section'); c.className = 'ec-study-card'; c.id = 'ecStudyCard';
    const h = document.createElement(big ? 'h2' : 'h3'); h.textContent = '📚 Study mode is on' + until();
    const p = document.createElement('p'); p.textContent = (state.why === 'everyone' ? 'Study mode is on for everyone right now (it turns on by itself in school hours). ' : 'Beau has turned on study mode for your account. ') + 'You can use Maths, Science, Play with friends, the leaderboard and your profile, and you can still message Beau. Chatting with friends and the feedback form are turned off.';
    const row = document.createElement('div'); row.className = 'ec-s-row';
    const ask = document.createElement('button'); ask.type = 'button'; ask.className = 'btn' + (big ? '' : ' sm');
    const msg = document.createElement('p'); msg.className = 'ec-s-msg'; msg.setAttribute('role', 'status');
    const draw = () => {
      ask.disabled = state.requested || state.declined;
      ask.textContent = state.requested ? '🙋 Request sent' : '🙋 Ask Beau to turn off study mode';
      msg.textContent = state.requested ? 'Beau has your request. Everything comes back by itself when Beau says yes.' : state.declined ? 'Beau said not yet. You can ask again tomorrow.' : '';
      msg.hidden = !msg.textContent;
    };
    ask.onclick = async () => {
      ask.disabled = true;
      let j = {}, ok = false; try { const r = await fetch('/api/study/request', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }); ok = r.ok; j = await r.json(); } catch (e) { /* offline */ }
      if (ok && j.study === false) return location.reload();
      if (ok) state.requested = true; else { msg.textContent = j.error || 'Couldn’t send it. Check your connection.'; msg.hidden = false; ask.disabled = false; return; }
      draw();
    };
    row.appendChild(ask);
    if (big) [['/maths/', '📐 Maths'], ['/science/', '🧪 Science'], ['/play/', '🎮 Play with friends']].forEach(([href, t]) => { const a = document.createElement('a'); a.className = 'btn quiet'; a.href = href; a.textContent = t; row.appendChild(a); });
    c.append(h, p, row, msg); draw(); return c;
  }
  function apply() {
    root.classList.toggle('ec-study', !!state.study); root.classList.remove('ec-study-wait');
    const old = document.getElementById('ecStudyCard'); if (old) old.remove();
    document.querySelectorAll('.ec-study-pill').forEach(x => x.remove());
    if (!state.study) return;
    const main = document.querySelector('main');
    if (BLOCKED && main) {
      // replace the page with the study-mode screen (the server refuses these features anyway)
      [...main.children].forEach(ch => { if (!ch.classList.contains('brand')) ch.hidden = true; });
      const brand = main.querySelector('.brand'); if (brand) { const h1 = brand.querySelector('h1'); const p = brand.querySelector('p'); if (p) p.hidden = true; if (h1) h1.dataset.was = h1.dataset.was || h1.textContent; }
      main.appendChild(card(true));
    } else if (path === '/' || path === '/index.html') {
      const spot = document.querySelector('#pickView') || main; if (spot) spot.insertBefore(card(false), spot.firstChild);
    } else {
      const tools = document.querySelector('.top-tools');
      if (tools) { const pill = document.createElement('span'); pill.className = 'ec-study-pill'; pill.textContent = '📚 Study mode' + until(); pill.title = 'Study mode is on: chatting with friends and feedback are off for now.'; tools.insertBefore(pill, tools.firstChild); }
    }
  }
  async function check(first, force) {
    const s = await get(force);
    if (!s) { if (first) root.classList.remove('ec-study-wait'); return; }
    // study mode switched while the page is open: reload so every page starts clean
    if (state && state.study !== s.study) { location.reload(); return; }
    const changed = !state || state.requested !== s.requested || state.declined !== s.declined;
    state = s; if (changed) apply();
  }
  window.ecStudyCheck = () => check(false, true);
  const go = () => { check(true); setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

/* 🎯 Focus mode: a student turns it on themselves (a switch with a timer, in the 🎯 Focus menu at the top of
   Home, Maths, Science and English). While it's on, only Maths, Science, English and Beau's announcements show:
   chat, friends, the leaderboard, Play with friends, feedback, the profile and every red number are hidden. */
(() => {
  if (window.ecFocus) return; window.ecFocus = true;
  const path = location.pathname; if (path.startsWith('/admin')) return;
  const root = document.documentElement;
  const HIDDEN_PAGES = ['/chat', '/leaderboard', '/play', '/feedback', '/me', '/teacher'];
  const hiddenPage = HIDDEN_PAGES.some(p => path.startsWith(p));
  const KEY = 'ec-focus:' + (window.EC_SLOT || 0);
  const css = document.createElement('style');
  css.textContent = `
html.ec-focus a[href^="/chat"],html.ec-focus a[data-chat],html.ec-focus a[data-msg],html.ec-focus a[href^="/leaderboard"],html.ec-focus a[href^="/play"],html.ec-focus a[href^="/feedback"],html.ec-focus a[href^="/me"],html.ec-focus a[href^="/teacher"],html.ec-focus #ecProfile,html.ec-focus #friendsCard,html.ec-focus #adminCard,html.ec-focus .msg-badge,html.ec-focus .ec-study-pill{display:none!important}
html.ec-focus-wait main{visibility:hidden}
html.ec-focus-block main>*:not(.brand):not(.top):not(#ecFocusCard){display:none!important}
html.ec-focus-block .brand>p{display:none}
.ec-focus-btn{display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:600;font-size:.9375rem;min-height:36px;border-radius:999px;padding:4px 12px;border:1.5px solid var(--rule,#ccc);background:var(--card,#fff);color:var(--ink,#111);cursor:pointer;white-space:nowrap}
.ec-focus-btn.on{background:var(--good,#126b42);border-color:var(--good,#126b42);color:var(--card,#fff)}
.ec-focus-pop{position:fixed;inset:0;z-index:2500;display:grid;place-items:center;padding:16px;background:rgb(10 14 30 / .5)}
.ec-focus-box{width:min(100%,420px);background:var(--card,#fff);color:var(--ink,#111);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 50px rgb(0 0 0 / .3)}
.ec-focus-box h2{margin:0;font-size:1.35rem}.ec-focus-box p{margin:0}
.ec-focus-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1.5px solid var(--rule,#ccc);border-radius:12px;padding:10px 12px;font-weight:700}
.ec-focus-sw button{position:relative;width:54px;height:30px;border-radius:999px;border:0;background:var(--rule,#ccc);cursor:pointer;flex:none}
.ec-focus-sw button::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .15s}
.ec-focus-sw button[aria-checked="true"]{background:var(--good,#126b42)}.ec-focus-sw button[aria-checked="true"]::after{left:27px}
.ec-focus-times{display:flex;flex-wrap:wrap;gap:6px}
.ec-focus-times button{font:inherit;font-size:.9375rem;font-weight:600;border-radius:999px;padding:6px 12px;border:1.5px solid var(--rule,#ccc);background:var(--card,#fff);color:var(--ink,#111);cursor:pointer}
.ec-focus-times button.sel{background:var(--accent,#2453d6);border-color:var(--accent,#2453d6);color:var(--accent-ink,#fff)}
.ec-focus-custom{display:flex;align-items:center;gap:8px}.ec-focus-custom input{width:90px;font:inherit;padding:6px 8px;border-radius:8px;border:1.5px solid var(--rule,#ccc);background:var(--card,#fff);color:var(--ink,#111)}
.ec-focus-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ec-focus-card{border:2.5px solid var(--good,#126b42);background:var(--good-soft,#e2f3e9);color:var(--ink,#111);border-radius:16px;padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.ec-focus-card h2{margin:0}.ec-focus-card .row{display:flex;gap:8px;flex-wrap:wrap}`;
  document.head.appendChild(css);
  // remembered from last time, so hidden things don't flash up while we ask the server
  let F = null; try { F = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { F = null; }
  const isOn = f => !!f && (f.on && (f.until == null || f.until * 1000 > Date.now()));
  if (isOn(F)) { root.classList.add('ec-focus'); if (hiddenPage) root.classList.add('ec-focus-wait'); }
  const t = s => new Date(s * 1000).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const left = () => { if (!F || F.until == null) return ''; const m = Math.max(0, Math.ceil((F.until * 1000 - Date.now()) / 60000)); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60) + ' min' : m + ' min'; };
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  async function setFocus(body) {
    try { const r = await fetch('/api/focus', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) return false; const j = await r.json(); F = j.focus; try { localStorage.setItem(KEY, JSON.stringify(F)); } catch (e) { /* storage blocked */ } } catch (e) { return false; }
    location.reload(); return true;
  }
  // the 🎯 Focus menu
  function menu() {
    const on = isOn(F), pop = mk('div', 'ec-focus-pop'), box = mk('div', 'ec-focus-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Focus mode');
    box.append(mk('h2', '', '🎯 Focus mode'), mk('p', 'small', 'Hides chat, friends, the leaderboard, Play with friends, feedback, your profile and all red numbers. Only Maths, Science, English and Beau’s announcements stay.'));
    const sw = mk('div', 'ec-focus-sw'), lab = mk('span', '', on ? (F.until ? 'On until ' + t(F.until) + ' (' + left() + ' left)' : 'On until you turn it off') : 'Off'), tg = mk('button'); tg.type = 'button'; tg.setAttribute('role', 'switch'); tg.setAttribute('aria-checked', on ? 'true' : 'false'); tg.setAttribute('aria-label', 'Focus mode on or off');
    sw.append(lab, tg); box.append(sw);
    const times = mk('div', 'ec-focus-times'); let pick = 45;
    [[25, '25 min'], [45, '45 min'], [60, '1 hour'], [90, '1½ hours'], [120, '2 hours'], [-1, 'Until I turn it off']].forEach(([m, l]) => { const b = mk('button', m === pick ? 'sel' : '', l); b.type = 'button'; b.onclick = () => { pick = m; times.querySelectorAll('button').forEach(x => x.classList.toggle('sel', x === b)); cin.value = ''; }; times.append(b); });
    const cw = mk('label', 'ec-focus-custom'), cin = mk('input'); cin.type = 'number'; cin.min = 1; cin.max = 480; cin.placeholder = 'e.g. 30'; cin.oninput = () => { if (cin.value) { pick = +cin.value; times.querySelectorAll('button').forEach(x => x.classList.remove('sel')); } };
    cw.append(document.createTextNode('Or my own time:'), cin, document.createTextNode('minutes'));
    box.append(mk('b', '', on ? 'Change the time' : 'How long?'), times, cw);
    const msg = mk('p', 'small'); msg.style.color = 'var(--pen,#b3261e)'; msg.hidden = true;
    const row = mk('div', 'ec-focus-row'), close = mk('button', 'btn quiet', 'Close'), go = mk('button', 'btn', on ? 'Use this time' : '🎯 Start focus'); close.type = go.type = 'button';
    const start = async () => { const body = pick === -1 ? { forever: true } : { minutes: pick }; if (pick !== -1 && !(pick >= 1 && pick <= 480)) { msg.textContent = 'Pick between 1 minute and 8 hours (480 minutes).'; msg.hidden = false; return; } go.disabled = true; if (!(await setFocus(body))) { msg.textContent = 'Couldn’t change it. Check your connection.'; msg.hidden = false; go.disabled = false; } };
    tg.onclick = async () => { if (on) { tg.disabled = true; await setFocus({ off: true }); } else start(); };
    go.onclick = start; close.onclick = () => pop.remove();
    row.append(close, go); box.append(msg, row); pop.append(box); pop.onclick = e => { if (e.target === pop) pop.remove(); };
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { pop.remove(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(pop); tg.focus();
  }
  let btn = null;
  function drawBtn() {
    const spot = document.querySelector('.top-tools') || document.querySelector('#whoBox');
    if (!spot) return;
    if (!btn) { btn = mk('button', 'ec-focus-btn'); btn.type = 'button'; btn.id = 'ecFocusBtn'; btn.onclick = menu; spot.insertBefore(btn, spot.firstChild); }
    const on = isOn(F); btn.classList.toggle('on', on); btn.textContent = on ? '🎯 Focus' + (F.until ? ' · ' + left() : ' · on') : '🎯 Focus';
    btn.setAttribute('aria-label', on ? 'Focus mode is on. Open the focus menu' : 'Focus mode. Open the focus menu');
  }
  function apply() {
    const on = isOn(F); root.classList.toggle('ec-focus', on); root.classList.remove('ec-focus-wait');
    drawBtn();
    const old = document.getElementById('ecFocusCard'); if (old) old.remove();
    root.classList.remove('ec-focus-block');
    if (!on || !hiddenPage) return;
    const main = document.querySelector('main'); if (!main) return;
    root.classList.add('ec-focus-block'); // the page's own content is hidden by CSS, so nothing can bring it back
    const c = mk('section', 'ec-focus-card'); c.id = 'ecFocusCard';
    c.append(mk('h2', '', '🎯 Focus mode is on'), mk('p', '', 'This page is hidden while you focus' + (F.until ? ', until ' + t(F.until) + ' (' + left() + ' left)' : '') + '. Only Maths, Science and English are open.'));
    const r = mk('div', 'row'); [['/maths/', '📐 Maths'], ['/science/', '🧪 Science'], ['/english/', '📗 English']].forEach(([h, l]) => { const a = mk('a', 'btn quiet', l); a.href = h; r.append(a); });
    const end = mk('button', 'btn', 'End focus mode'); end.type = 'button'; end.onclick = () => setFocus({ off: true }); r.append(end);
    c.append(r); main.appendChild(c);
  }
  async function check(force) {
    const j = window.ecLive ? await window.ecLive(force) : null;
    if (!j || !j.me) { root.classList.remove('ec-focus', 'ec-focus-wait'); return; }
    const was = isOn(F); F = j.focus || { on: false, until: null };
    try { localStorage.setItem(KEY, JSON.stringify(F)); } catch (e) { /* storage blocked */ }
    if (was !== isOn(F) && document.readyState === 'complete' && btn) { location.reload(); return; }
    apply();
  }
  const go = () => {
    check(true);
    setInterval(() => { if (document.visibilityState !== 'visible') return; if (F && F.until && isOn(F) === false && root.classList.contains('ec-focus')) { location.reload(); return; } drawBtn(); }, 20000); // timer ran out: everything comes back
    setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
