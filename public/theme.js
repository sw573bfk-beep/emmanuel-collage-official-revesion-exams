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
      a.querySelector('.av').textContent = j.me.name.trim().charAt(0).toUpperCase(); a.querySelector('.nm').textContent = j.me.admin ? 'Dashboard' : 'Profile';
      a.classList.add('float'); document.body.appendChild(a); // always the top right corner of the page
    }
    const a = document.getElementById('ecProfile'), c = j.chat, n = c ? (c.admin ? c.beau : c.requests + c.unreadDm + c.beau) : 0, nb = a.querySelector('.nb');
    nb.hidden = !n; nb.textContent = n > 99 ? '99+' : n; a.setAttribute('aria-label', (j.me.admin ? 'Admin dashboard' : 'My profile') + (n ? ', ' + n + ' new' : ''));
  };
  window.ecProfileCheck = profile;
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
