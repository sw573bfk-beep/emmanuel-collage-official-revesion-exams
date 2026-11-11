/* EC Revisions: study mode. Loaded on every page by theme.js. When Beau has turned study mode on
   for this student (or for everyone), only Maths, Science and Play with friends work: the Chat,
   Leaderboard and Feedback buttons disappear, and those pages show a study-mode screen with a
   button to ask Beau to turn it off. The server blocks those features too. */
(() => {
  if (window.ecStudy) return; window.ecStudy = true;
  const path = location.pathname;
  if (path.startsWith('/admin')) return;
  const BLOCKED = ['/chat', '/leaderboard', '/feedback'].some(p => path.startsWith(p));
  const root = document.documentElement;
  const css = document.createElement('style');
  css.textContent = `
html.ec-study a[data-chat],html.ec-study a[data-msg],html.ec-study a[href^="/leaderboard"],html.ec-study a[href^="/feedback"],html.ec-study a[href^="/chat"]{display:none!important}
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
  const get = async () => { try { const r = await fetch('/api/study', { credentials: 'same-origin', cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } };

  function card(big) {
    const c = document.createElement('section'); c.className = 'ec-study-card'; c.id = 'ecStudyCard';
    const h = document.createElement(big ? 'h2' : 'h3'); h.textContent = '📚 Study mode is on';
    const p = document.createElement('p'); p.textContent = (state.why === 'everyone' ? 'Beau has turned on study mode for everyone. ' : 'Beau has turned on study mode for your account. ') + 'You can use Maths, Science and Play with friends. Chat, the leaderboard and feedback are turned off.';
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
      if (tools) { const pill = document.createElement('span'); pill.className = 'ec-study-pill'; pill.textContent = '📚 Study mode'; pill.title = 'Beau has turned on study mode: Maths, Science and Play with friends only.'; tools.insertBefore(pill, tools.firstChild); }
    }
  }
  async function check(first) {
    const s = await get();
    if (!s) { if (first) root.classList.remove('ec-study-wait'); return; }
    // study mode switched while the page is open: reload so every page starts clean
    if (state && state.study !== s.study) { location.reload(); return; }
    const changed = !state || state.requested !== s.requested || state.declined !== s.declined;
    state = s; if (changed) apply();
  }
  window.ecStudyCheck = () => check();
  const go = () => { check(true); setInterval(() => { if (document.visibilityState === 'visible') check(); }, 20000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
