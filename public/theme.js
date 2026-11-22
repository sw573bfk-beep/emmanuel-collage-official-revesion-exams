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
  // 📲 install like an app: the app description and icons on every page, and the small offline helper
  (() => {
    const add = (tag, attrs) => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); document.head.appendChild(e); };
    if (!document.querySelector('link[rel="manifest"]')) add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
    add('meta', { name: 'theme-color', content: '#2453d6' }); add('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }); add('meta', { name: 'apple-mobile-web-app-title', content: 'EC Revisions' });
    if (!document.querySelector('link[rel="icon"]')) add('link', { rel: 'icon', type: 'image/png', href: '/icons/favicon-32.png' });
    if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.ecInstallPrompt = e; const it = document.getElementById('ecMenuInstall'); if (it) it.hidden = false; });
    window.addEventListener('appinstalled', () => { window.ecInstallPrompt = null; const it = document.getElementById('ecMenuInstall'); if (it) it.hidden = true; });
  })();
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  async function installApp() {
    if (window.ecInstallPrompt) { const p = window.ecInstallPrompt; window.ecInstallPrompt = null; p.prompt(); try { await p.userChoice; } catch (e) { /* closed */ } const it = document.getElementById('ecMenuInstall'); if (it) it.hidden = true; return; }
    const msg = isIOS() ? 'On iPhone or iPad (in Safari): tap the Share button (the square with an arrow), then “Add to Home Screen”.' : 'In Chrome or Edge: open the browser menu (⋮), then “Install EC Revisions” or “Add to Home screen”. On a laptop there may also be an install icon at the right of the address bar.';
    if (window.ecConfirm) await window.ecConfirm({ title: '📲 Install EC Revisions', text: msg, yes: 'Got it', no: 'Close' }); else alert(msg);
  }
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
  // 👤 Profile button, top right of every page once you're logged in (with a red number for new messages).
  // On Maths, Science and English it's a plain link to your profile (those pages have their own buttons).
  // Everywhere else it opens a menu with everything else, and phones also get a bottom tab bar.
  const SUBJECT_PAGE = /^\/(maths|science|english)(\/|$)/.test(location.pathname);
  const profileCss = () => {
    if (document.getElementById('ecProfCss')) return;
    const st = document.createElement('style'); st.id = 'ecProfCss';
    st.textContent = '.ec-prof{display:inline-flex;align-items:center;gap:8px;font:inherit;font-weight:600;font-size:.9375rem;color:var(--ink,#111);background:var(--card,#fff);border:1.5px solid var(--rule,#ccc);border-radius:999px;padding:4px 12px 4px 4px;min-height:40px;text-decoration:none;white-space:nowrap;cursor:pointer}'
      + '.ec-prof:hover,.ec-prof[aria-expanded="true"]{border-color:var(--accent,#2453d6)}.ec-prof .av{width:30px;height:30px;border-radius:50%;background:var(--accent,#2453d6);color:var(--accent-ink,#fff);display:grid;place-items:center;font-weight:800}'
      + '.ec-prof .nb{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.8125rem;font-weight:700}.ec-prof .nb[hidden]{display:none}'
      + '.ec-prof .car{font-size:.75rem;color:var(--muted,#555)}'
      + '.ec-prof.float{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:14px;z-index:20}@media (max-width:560px){.ec-prof .nm{display:none}.ec-prof{padding-right:8px}}'
      + '.ec-menu{position:absolute;top:calc(60px + env(safe-area-inset-top,0px));right:14px;z-index:2450;width:min(290px,calc(100vw - 28px));background:var(--card,#fff);color:var(--ink,#111);border:1.5px solid var(--rule,#ccc);border-radius:16px;box-shadow:0 16px 40px rgb(0 0 0 / .22);padding:8px;display:flex;flex-direction:column;gap:2px}'
      + '.ec-menu[hidden]{display:none}.ec-menu .hd{display:flex;align-items:center;gap:10px;padding:8px 10px 10px;border-bottom:1px solid var(--rule,#ddd);margin-bottom:4px}.ec-menu .hd .av{width:36px;height:36px;border-radius:50%;background:var(--accent,#2453d6);color:var(--accent-ink,#fff);display:grid;place-items:center;font-weight:800;flex:none}'
      + '.ec-menu .hd b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ec-menu .hd small{color:var(--muted,#555)}'
      + '.ec-menu .it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;font:inherit;font-size:1rem;font-weight:600;color:var(--ink,#111);background:none;border:0;border-radius:10px;padding:10px 12px;min-height:44px;text-decoration:none;cursor:pointer}'
      + '.ec-menu .it:hover,.ec-menu .it:focus-visible{background:var(--accent-soft,#e8eefc);outline:none}.ec-menu .it .ic{width:24px;text-align:center;flex:none}.ec-menu .it .nb{margin-left:auto;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.8125rem;font-weight:700;display:inline-grid;place-items:center}'
      + '.ec-menu .it[hidden]{display:none}.ec-menu .it.out{color:var(--pen,#b3261e)}.ec-menu hr{border:0;border-top:1px solid var(--rule,#ddd);margin:4px 6px}'
      + 'html.ec-menu-on .theme-btn.float{display:none}'
      + '.ec-topr{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));right:14px;z-index:20;display:flex;gap:8px;align-items:center}.ec-topr .ec-prof.float{position:static}'
      + '.ec-news{position:relative;display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:600;font-size:.9375rem;color:var(--ink,#111);background:var(--card,#fff);border:1.5px solid var(--rule,#ccc);border-radius:999px;padding:4px 14px;min-height:40px;text-decoration:none;white-space:nowrap}'
      + '.ec-news:hover{border-color:var(--accent,#2453d6)}.ec-news .dot{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:var(--pen,#b3261e);border:2px solid var(--card,#fff)}.ec-news .dot[hidden]{display:none}'
      + '@media (max-width:560px){.ec-news .nt{display:none}.ec-news{padding:4px 10px;font-size:1.05rem}}html.ec-focus #ecNews{display:none!important}'
      + '.ec-tabs{display:none}@media (max-width:700px){html.ec-has-tabs body{padding-bottom:calc(66px + env(safe-area-inset-bottom,0px))}'
      + '.ec-tabs{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:0;right:0;bottom:0;z-index:950;background:var(--card,#fff);border-top:1.5px solid var(--rule,#ddd);padding:4px 4px calc(4px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 16px rgb(0 0 0 / .08)}'
      + '.ec-tabs a{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:52px;border-radius:12px;text-decoration:none;color:var(--muted,#555);font-size:.75rem;font-weight:700}'
      + '.ec-tabs a .ic{font-size:1.35rem;line-height:1.1}.ec-tabs a.on{color:var(--accent,#2453d6);background:var(--accent-soft,#e8eefc)}'
      + '.ec-tabs a .nb{position:absolute;top:3px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.6875rem;display:grid;place-items:center}.ec-tabs a .nb[hidden]{display:none}'
      + 'html.ec-has-tabs #ecHelpBtn{bottom:calc(74px + env(safe-area-inset-bottom,0px))}html.ec-has-tabs .ec-reward{bottom:calc(78px + env(safe-area-inset-bottom,0px))}}';
    document.head.appendChild(st);
  };
  const mkEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function menuItem(ic, label, act, extra) {
    const it = typeof act === 'string' ? mkEl('a', 'it') : mkEl('button', 'it'); if (typeof act === 'string') it.href = act; else { it.type = 'button'; it.onclick = act; }
    it.setAttribute('role', 'menuitem'); it.append(mkEl('span', 'ic', ic), mkEl('span', '', label)); if (extra) it.appendChild(extra); return it;
  }
  function buildMenu(j) {
    const path = location.pathname, home = path === '/' || path === '/index.html', admin = !!j.me.admin, staff = admin || !!j.me.role;
    const m = mkEl('div', 'ec-menu'); m.id = 'ecMenu'; m.setAttribute('role', 'menu'); m.hidden = true;
    const hd = mkEl('div', 'hd'), av = mkEl('span', 'av'); window.ecAv(av, j.me.look, j.me.name); const who = mkEl('div'); who.append(mkEl('b', '', j.me.name), mkEl('small', '', admin ? 'Admin' : j.me.role ? 'Helper admin' : 'Logged in')); hd.append(av, who); m.appendChild(hd);
    if (!home) m.appendChild(menuItem('🏠', 'Home (subjects)', '/'));
    if (!admin) m.appendChild(menuItem('👤', 'My profile', '/me/'));
    if (staff) m.appendChild(menuItem('🛠️', 'Admin dashboard', '/admin/'));
    m.appendChild(menuItem('⚡', 'Daily challenge', '/challenge/'));
    m.appendChild(menuItem('🏆', 'Leaderboard', '/leaderboard/'));
    const cn = mkEl('span', 'nb'); cn.hidden = true; cn.id = 'ecMenuChatN'; m.appendChild(menuItem('💬', 'Chat', '/chat/', cn));
    m.appendChild(menuItem('🎮', 'Play with friends', '/play/'));
    m.appendChild(menuItem('💡', 'Feedback', '/feedback/'));
    m.appendChild(mkEl('hr'));
    const fo = menuItem('🎯', 'Focus mode', () => { closeMenu(); const f = document.getElementById('ecFocusBtn'); if (f) f.click(); }); fo.id = 'ecMenuFocus'; fo.hidden = true; m.appendChild(fo);
    const dk = menuItem(isDark() ? '☀️' : '🌙', isDark() ? 'Light mode' : 'Dark mode', () => { const t = isDark() ? 'light' : 'dark'; apply(t); try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ } const b = document.querySelector('.theme-btn'); if (b) label(b); dk.querySelector('.ic').textContent = isDark() ? '☀️' : '🌙'; dk.lastChild.textContent = isDark() ? 'Light mode' : 'Dark mode'; });
    m.appendChild(dk);
    const inst = menuItem('📲', 'Install the app', () => { closeMenu(); installApp(); }); inst.id = 'ecMenuInstall'; inst.hidden = standalone() || !(window.ecInstallPrompt || isIOS()); m.appendChild(inst);
    m.appendChild(menuItem('🔁', 'Switch account', () => { closeMenu(); if (window.ecSwitchAccounts) window.ecSwitchAccounts(); else location.href = '/?switch=1'; }));
    const out = menuItem('🚪', 'Log out', () => { closeMenu(); if (window.ecLogout) window.ecLogout(); else location.href = '/?logout=1'; }); out.classList.add('out'); m.appendChild(out);
    return m;
  }
  function closeMenu() { const m = document.getElementById('ecMenu'), b = document.getElementById('ecProfile'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  function toggleMenu(e) {
    e.preventDefault(); const m = document.getElementById('ecMenu'), b = document.getElementById('ecProfile'); if (!m) return;
    m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden));
    if (!m.hidden) { const fo = document.getElementById('ecMenuFocus'); if (fo) fo.hidden = !document.getElementById('ecFocusBtn'); const r = b.getBoundingClientRect(); m.style.top = (r.bottom + window.scrollY + 8) + 'px'; const f = m.querySelector('.it'); if (f) f.focus(); }
  }
  document.addEventListener('click', e => { const m = document.getElementById('ecMenu'); if (m && !m.hidden && !m.contains(e.target) && !e.target.closest('#ecProfile')) closeMenu(); });
  document.addEventListener('keydown', e => {
    const m = document.getElementById('ecMenu'); if (!m || m.hidden) return;
    if (e.key === 'Escape') { closeMenu(); document.getElementById('ecProfile').focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const its = [...m.querySelectorAll('.it')], i = its.indexOf(document.activeElement); its[(i + (e.key === 'ArrowDown' ? 1 : its.length - 1)) % its.length].focus(); }
  });
  function buildTabs(j) {
    const path = location.pathname, admin = !!j.me.admin, nav = mkEl('nav', 'ec-tabs'); nav.id = 'ecTabs'; nav.setAttribute('aria-label', 'Main');
    const T = [['🏠', 'Home', '/', p => p === '/' || p === '/index.html'], ['🏆', 'Leaderboard', '/leaderboard/', p => p.startsWith('/leaderboard')], ['💬', 'Chat', '/chat/', p => p.startsWith('/chat')], [admin ? '🛠️' : '👤', admin ? 'Admin' : 'Me', admin ? '/admin/' : '/me/', p => p.startsWith('/me') || p.startsWith('/admin')]];
    T.forEach(([ic, l, href, on]) => { const a = mkEl('a', on(path) ? 'on' : ''); a.href = href; if (on(path)) a.setAttribute('aria-current', 'page'); a.append(mkEl('span', 'ic', ic), mkEl('span', '', l)); if (l === 'Chat') { const nb = mkEl('span', 'nb'); nb.hidden = true; nb.id = 'ecTabChatN'; a.appendChild(nb); } nav.appendChild(a); });
    document.body.appendChild(nav); root.classList.add('ec-has-tabs');
  }
  const profile = async () => {
    const path = location.pathname; if (path.startsWith('/admin')) return;
    const j = await window.ecLive(); if (!j || !j.me) return;
    profileCss();
    if (!document.getElementById('ecProfile')) {
      const sub = path.startsWith('/maths') ? '?from=maths' : path.startsWith('/science') ? '?from=science' : '';
      const a = document.createElement(SUBJECT_PAGE ? 'a' : 'button'); a.id = 'ecProfile'; a.className = 'ec-prof';
      if (SUBJECT_PAGE) { a.href = j.me.admin ? '/admin/' : '/me/' + sub; a.title = j.me.admin ? 'Admin dashboard' : 'My profile: stats, friends and messages'; }
      else { a.type = 'button'; a.setAttribute('aria-haspopup', 'menu'); a.setAttribute('aria-expanded', 'false'); a.setAttribute('aria-controls', 'ecMenu'); a.title = 'Menu: profile, leaderboard, chat and more'; a.onclick = toggleMenu; }
      a.innerHTML = '<span class="av" aria-hidden="true"></span><span class="nm"></span><span class="nb" hidden></span>' + (SUBJECT_PAGE ? '' : '<span class="car" aria-hidden="true">▾</span>');
      window.ecAv(a.querySelector('.av'), j.me.look, j.me.name); a.querySelector('.nm').textContent = SUBJECT_PAGE ? (j.me.admin ? 'Dashboard' : 'Profile') : 'Menu';
      a.classList.add('float'); // always the top right corner of the page, with 📰 News next to it
      const wrap = document.createElement('div'); wrap.className = 'ec-topr'; wrap.id = 'ecTopRight';
      const nw = document.createElement('a'); nw.id = 'ecNews'; nw.className = 'ec-news'; nw.href = '/news/'; nw.innerHTML = '<span aria-hidden="true">📰</span><span class="nt">News</span><span class="dot" hidden></span>';
      wrap.append(nw, a); document.body.appendChild(wrap);
      if (!SUBJECT_PAGE) { document.body.appendChild(buildMenu(j)); root.classList.add('ec-menu-on'); buildTabs(j); }
    }
    const a = document.getElementById('ecProfile'), c = j.chat, n = c ? (c.admin ? c.beau : c.requests + c.unreadDm + c.beau) : 0, nb = a.querySelector('.nb');
    nb.hidden = !n; nb.textContent = n > 99 ? '99+' : n; a.setAttribute('aria-label', (SUBJECT_PAGE ? (j.me.admin ? 'Admin dashboard' : 'My profile') : 'Menu') + (n ? ', ' + n + ' new' : ''));
    const nd = document.querySelector('#ecNews .dot'), fresh = !!(j.news && j.news.latest > j.news.seen) && !location.pathname.startsWith('/news');
    if (nd) { nd.hidden = !fresh; document.getElementById('ecNews').setAttribute('aria-label', fresh ? 'News: something new' : 'News'); }
    for (const id of ['ecMenuChatN', 'ecTabChatN']) { const x = document.getElementById(id); if (x) { x.hidden = !n; x.textContent = n > 99 ? '99+' : n; } }
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
