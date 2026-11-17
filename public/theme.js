/* EC Revisions: light / dark mode. Follows the computer's setting until someone taps the ☀/🌙 button,
   then remembers their choice on this device. Load it in <head> (not deferred) so there's no flash. */
(() => {
  const KEY = 'ec-theme', root = document.documentElement;
  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const apply = t => { if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); };
  apply(saved());
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const isDark = () => root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && mq && mq.matches);
  window.ecTheme = { apply, isDark };
  function label(b) {
    const d = isDark();
    b.innerHTML = '<span aria-hidden="true">' + (d ? '☀️' : '🌙') + '</span><span class="tl">' + (d ? 'Light' : 'Dark') + '</span>';
    b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
    b.title = d ? 'Switch to light mode' : 'Switch to dark mode';
  }
  function add() {
    if (document.querySelector('.theme-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-btn';
    b.onclick = () => { const t = isDark() ? 'light' : 'dark'; apply(t); try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ } label(b); };
    label(b);
    if (mq && mq.addEventListener) mq.addEventListener('change', () => label(b));
    const spot = document.querySelector('[data-theme-slot]') || document.querySelector('.top-tools') || document.querySelector('#whoBox');
    if (spot) { const out = spot.querySelector('#logoutBtn, #logout'); if (out) spot.insertBefore(b, out); else spot.appendChild(b); }
    else { b.classList.add('float'); document.body.appendChild(b); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  // One shared background check (pop-ups, study mode, Chat red numbers): every script on the page asks
  // window.ecLive() and they all share one request, at most once every 50 seconds.
  let liveP = null, liveAt = 0;
  window.ecLive = force => {
    if (!force && liveP && Date.now() - liveAt < 50000) return liveP;
    liveAt = Date.now();
    liveP = fetch('/api/live', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    return liveP;
  };
  // 🎨 someone's look: window.ecAv(span, look, name) puts their picture (or first letter) and frame on a round
  // avatar span; window.ecTitle(look) gives a small title pill (or null).
  const lookCss = document.createElement('style');
  lookCss.textContent = '.ec-lk{position:relative}.ec-lk.emo{background:var(--card-2,#f3f5f9)!important;color:var(--ink,#111)!important}.ec-prof .av.emo{font-size:1.15rem}'
    + '.ec-fr-bronze{box-shadow:0 0 0 3px #b8733a}.ec-fr-silver{box-shadow:0 0 0 3px #9aa6b5,0 0 0 5px #dfe5ee}.ec-fr-gold{box-shadow:0 0 0 3px #e0a800,0 0 8px 2px rgb(224 168 0 / .55)}'
    + '.ec-fr-diamond{box-shadow:0 0 0 3px #53c7f0,0 0 0 5px #b8ecff,0 0 10px 3px rgb(83 199 240 / .6)}.ec-fr-fire{box-shadow:0 0 0 3px #ff5a1f,0 0 10px 3px rgb(255 120 30 / .65)}'
    + '.ec-fr-rainbow{animation:ecRainbow 3s linear infinite}@keyframes ecRainbow{0%{box-shadow:0 0 0 3px #ff4d4d,0 0 9px 2px #ff4d4d}20%{box-shadow:0 0 0 3px #ffb700,0 0 9px 2px #ffb700}40%{box-shadow:0 0 0 3px #3ccf4e,0 0 9px 2px #3ccf4e}60%{box-shadow:0 0 0 3px #2fa8ff,0 0 9px 2px #2fa8ff}80%{box-shadow:0 0 0 3px #a34dff,0 0 9px 2px #a34dff}100%{box-shadow:0 0 0 3px #ff4d4d,0 0 9px 2px #ff4d4d}}'
    + '@media (prefers-reduced-motion:reduce){.ec-fr-rainbow{animation:none;box-shadow:0 0 0 3px #a34dff}}'
    + '.ec-title{display:inline-block;font-size:.75rem;font-weight:700;letter-spacing:.02em;color:var(--accent,#2453d6);background:var(--accent-soft,#e8eefc);border-radius:999px;padding:1px 8px;margin-left:6px;white-space:nowrap;vertical-align:middle}';
  document.head.appendChild(lookCss);
  window.ecAv = (span, look, name) => {
    if (!span) return span;
    [...span.classList].filter(c => c.startsWith('ec-fr-')).forEach(c => span.classList.remove(c));
    span.classList.add('ec-lk'); span.classList.toggle('emo', !!(look && look.a));
    const dot = span.querySelector('.dot'); span.textContent = look && look.a ? look.a : String(name || '?').trim().charAt(0).toUpperCase(); if (dot) span.appendChild(dot);
    if (look && look.f) span.classList.add('ec-fr-' + look.f);
    return span;
  };
  window.ecTitle = look => { if (!look || !look.t) return null; const s = document.createElement('span'); s.className = 'ec-title'; s.textContent = look.t; return s; };
  // 👤 Profile button, top right of every page once you're logged in (with a red number for new messages)
  const profile = async () => {
    const path = location.pathname; if (path.startsWith('/admin') || path.startsWith('/me')) return;
    const j = await window.ecLive(); if (!j || !j.me) return;
    if (!document.getElementById('ecProfile')) {
      const st = document.createElement('style');
      st.textContent = '.ec-prof{display:inline-flex;align-items:center;gap:8px;font:inherit;font-weight:600;font-size:.9375rem;color:var(--ink,#111);background:var(--card,#fff);border:1.5px solid var(--rule,#ccc);border-radius:999px;padding:4px 12px 4px 4px;min-height:40px;text-decoration:none;white-space:nowrap}'
        + '.ec-prof:hover{border-color:var(--accent,#2453d6)}.ec-prof .av{width:30px;height:30px;border-radius:50%;background:var(--accent,#2453d6);color:var(--accent-ink,#fff);display:grid;place-items:center;font-weight:800}'
        + '.ec-prof .nb{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.8125rem;font-weight:700}.ec-prof .nb[hidden]{display:none}'
        + '.ec-prof.float{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:14px;z-index:20}@media (max-width:560px){.ec-prof .nm{display:none}.ec-prof{padding-right:8px}}';
      document.head.appendChild(st);
      const a = document.createElement('a'); a.id = 'ecProfile'; a.className = 'ec-prof';
      const sub = path.startsWith('/maths') ? '?from=maths' : path.startsWith('/science') ? '?from=science' : '';
      a.href = j.me.admin ? '/admin/' : '/me/' + sub; a.title = j.me.admin ? 'Admin dashboard' : 'My profile: stats, friends and messages';
      a.innerHTML = '<span class="av" aria-hidden="true"></span><span class="nm"></span><span class="nb" hidden></span>';
      window.ecAv(a.querySelector('.av'), j.me.look, j.me.name); a.querySelector('.nm').textContent = j.me.admin ? 'Dashboard' : 'Profile';
      a.classList.add('float'); document.body.appendChild(a); // always the top right corner of the page
    }
    const a = document.getElementById('ecProfile'), c = j.chat, n = c ? (c.admin ? c.beau : c.requests + c.unreadDm + c.beau) : 0, nb = a.querySelector('.nb');
    nb.hidden = !n; nb.textContent = n > 99 ? '99+' : n; a.setAttribute('aria-label', (j.me.admin ? 'Admin dashboard' : 'My profile') + (n ? ', ' + n + ' new' : ''));
  };
  window.ecProfileCheck = profile;
  // 🎉 "New reward" pop-up: one at a time, a few seconds each, then they're marked as seen
  let rewardShowing = false;
  const rewardPop = async () => {
    if (rewardShowing) return; const j = await window.ecLive(); if (!j || !j.rewards || !j.rewards.length) return;
    rewardShowing = true;
    try { await fetch('/api/rewards/seen', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch (e) { /* offline */ }
    if (!document.getElementById('ecRewardCss')) { const st = document.createElement('style'); st.id = 'ecRewardCss';
      st.textContent = '.ec-reward{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2550;width:min(400px,calc(100vw - 24px));display:flex;align-items:center;gap:12px;background:var(--card,#fff);color:var(--ink,#111);border:2.5px solid #e0a800;border-radius:16px;padding:12px 14px;box-shadow:0 12px 34px rgb(0 0 0 / .28);animation:ecRwIn .35s ease-out}'
        + '.ec-reward .pic{flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:1.7rem;background:var(--card-2,#f3f5f9)}.ec-reward .tx{flex:1;min-width:0}.ec-reward b{display:block;font-size:1rem}.ec-reward span{font-size:.9375rem;color:var(--muted,#555)}'
        + '.ec-reward button{flex:none;border:0;background:none;color:var(--ink,#111);font-size:1.2rem;cursor:pointer;width:36px;height:36px;border-radius:10px}@keyframes ecRwIn{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.ec-reward{animation:none}}';
      document.head.appendChild(st); }
    const KIND = { a: 'profile picture', f: 'frame', t: 'title' }, FR = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎', fire: '🔥', rainbow: '🌈' };
    for (const r of j.rewards.slice(0, 5)) {
      await new Promise(done => {
        const box = document.createElement('div'); box.className = 'ec-reward'; box.setAttribute('role', 'status');
        const pic = document.createElement('span'); pic.className = 'pic'; pic.textContent = r.k === 'a' ? r.v : r.k === 'f' ? (FR[r.v] || '⭕') : '🏷️';
        const tx = document.createElement('div'); tx.className = 'tx';
        const b = document.createElement('b'); b.textContent = '🎉 New ' + KIND[r.k] + ': ' + r.name;
        const w = document.createElement('span'); w.textContent = 'Why: ' + r.why.charAt(0).toLowerCase() + r.why.slice(1);
        tx.append(b, w);
        const x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Close');
        box.append(pic, tx, x); document.body.appendChild(box);
        const end = () => { clearTimeout(tm); box.remove(); setTimeout(done, 300); }; const tm = setTimeout(end, 6000); x.onclick = end;
      });
    }
    rewardShowing = false;
  };
  window.ecRewardCheck = () => window.ecLive(true).then(rewardPop);
  const startRewards = () => { if (location.pathname.startsWith('/admin')) return; rewardPop(); setInterval(() => { if (document.visibilityState === 'visible') rewardPop(); }, 60000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRewards); else startRewards();
  const startProfile = () => { profile(); setInterval(() => { if (document.visibilityState === 'visible') profile(); }, 60000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startProfile); else startProfile();
  // "not an official school site" + privacy link at the bottom of every page
  const foot = () => {
    if (document.querySelector('.ec-foot') || location.pathname.startsWith('/admin')) return;
    const st = document.createElement('style');
    st.textContent = '.ec-foot{max-width:900px;margin:28px auto 0;padding:14px 16px calc(80px + env(safe-area-inset-bottom,0px));text-align:center;font-size:.875rem;line-height:1.6;color:var(--muted,#555);border-top:1px solid var(--rule,#ddd)}.ec-foot a{color:inherit;font-weight:600}';
    document.head.appendChild(st);
    const f = document.createElement('footer'); f.className = 'ec-foot';
    f.innerHTML = 'EC Revisions is made by a student. It is <b>not an official Emmanuel College website</b>. <a href="/privacy/">Privacy and safety</a>';
    document.body.appendChild(f);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', foot); else foot();
  // pop-up messages from Beau ("Message everyone") on every page
  ['/notice.js', '/study.js'].forEach(src => { const nj = document.createElement('script'); nj.src = src + '?v=' + (document.documentElement.dataset.build || '1'); nj.defer = true; document.head.appendChild(nj); });
})();
