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

    // ⭕ frames for questions right (wood → celestial), then the lucky-drop ones
    + '.ec-fr-wood{box-shadow:0 0 0 3px #8b5a2b,0 0 0 5px #c69c6d}.ec-fr-stone{box-shadow:0 0 0 3px #6f7782,0 0 0 5px #b5bcc6}.ec-fr-copper{box-shadow:0 0 0 3px #c0622d,0 0 0 5px #e9a27a}'
    + '.ec-fr-plat{box-shadow:0 0 0 3px #c9d6e3,0 0 0 5px #7f97b0,0 0 9px 2px rgb(160 190 220 / .6)}.ec-fr-emerald{box-shadow:0 0 0 3px #12a150,0 0 0 5px #7fe0a8,0 0 10px 2px rgb(18 161 80 / .5)}'
    + '.ec-fr-sapphire{box-shadow:0 0 0 3px #1f4fd1,0 0 0 5px #7ea2ff,0 0 10px 3px rgb(31 79 209 / .55)}.ec-fr-ruby{box-shadow:0 0 0 3px #c8102e,0 0 0 5px #ff7a8c,0 0 12px 3px rgb(200 16 46 / .55)}'
    + '.ec-fr-obsidian{box-shadow:0 0 0 3px #1b1030,0 0 0 6px #6b3fa0,0 0 16px 5px rgb(107 63 160 / .7)}'
    + '.ec-fr-aurora{animation:ecAur 4s ease-in-out infinite}@keyframes ecAur{0%,100%{box-shadow:0 0 0 3px #2fe6a6,0 0 0 6px #1b8cff,0 0 16px 5px rgb(47 230 166 / .7)}50%{box-shadow:0 0 0 3px #a35cff,0 0 0 6px #2fe6a6,0 0 18px 6px rgb(163 92 255 / .7)}}'
    + '.ec-fr-celestial{animation:ecCel 2.4s ease-in-out infinite}@keyframes ecCel{0%,100%{box-shadow:0 0 0 3px #fff7d1,0 0 0 6px #f4c542,0 0 0 8px #fff,0 0 18px 6px rgb(255 220 120 / .8)}50%{box-shadow:0 0 0 3px #f4c542,0 0 0 6px #fff7d1,0 0 0 8px #f4c542,0 0 26px 10px rgb(255 240 190 / .95)}}'
    + '.ec-fr-x_epic{animation:ecVoid 1.8s ease-in-out infinite}@keyframes ecVoid{0%,100%{box-shadow:0 0 0 3px #7c3aed,0 0 0 6px #2e1065,0 0 12px 4px rgb(124 58 237 / .7)}50%{box-shadow:0 0 0 3px #c084fc,0 0 0 6px #7c3aed,0 0 24px 9px rgb(192 132 252 / .8)}}'
    + '.ec-fr-x_leg{animation:ecNova 1.6s ease-in-out infinite}@keyframes ecNova{0%,100%{box-shadow:0 0 0 3px #ffb300,0 0 0 6px #ff5e00,0 0 16px 6px rgb(255 140 0 / .75)}50%{box-shadow:0 0 0 3px #fff3b0,0 0 0 6px #ffb300,0 0 30px 12px rgb(255 200 60 / .9)}}'
    + '.ec-fr-x_ins{box-shadow:0 0 18px 6px rgb(255 255 255 / .55)}.ec-fr-x_ins::before{content:"";position:absolute;inset:-6px;border-radius:50%;padding:4px;background:conic-gradient(#ff3b3b,#ffb300,#fff200,#3cff6b,#2fd0ff,#4d5bff,#d23bff,#ff3b3b);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:ecSpin 2.2s linear infinite;pointer-events:none}@keyframes ecSpin{to{transform:rotate(360deg)}}'
    + '@media (prefers-reduced-motion:reduce){.ec-fr-aurora,.ec-fr-celestial,.ec-fr-x_epic,.ec-fr-x_leg,.ec-fr-x_ins::before{animation:none}}'
    // 🎲 lucky-drop titles are coloured by rarity
    + '.ec-title.r-rare{background:#dbeafe;color:#1d4ed8;box-shadow:inset 0 0 0 1px #60a5fa}.ec-title.r-epic{background:linear-gradient(90deg,#7c3aed,#c026d3);color:#fff}'
    + '.ec-title.r-leg{background:linear-gradient(90deg,#f59e0b,#fde047,#f59e0b);background-size:200% 100%;color:#3b2300;animation:ecShim 2.5s linear infinite}'
    + '.ec-title.r-ins{background:linear-gradient(90deg,#ff3b3b,#ffb300,#3cff6b,#2fd0ff,#d23bff,#ff3b3b);background-size:300% 100%;color:#fff;text-shadow:0 1px 2px rgb(0 0 0 / .6);animation:ecShim 3s linear infinite}'
    + '@keyframes ecShim{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.ec-title.r-leg,.ec-title.r-ins{animation:none}}'
    + ':root[data-theme="dark"] .ec-title.r-rare{background:#1e3a8a;color:#bfdbfe}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ec-title.r-rare{background:#1e3a8a;color:#bfdbfe}}'
    + '.ec-title.shiny{position:relative;overflow:hidden;box-shadow:0 0 0 1.5px #f5c518,0 0 8px 1px rgb(245 197 24 / .65)}.ec-title.shiny::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgb(255 255 255 / .8) 50%,transparent 65%);background-size:250% 100%;animation:ecGl 2.4s linear infinite;pointer-events:none}@keyframes ecGl{from{background-position:150% 0}to{background-position:-100% 0}}@media (prefers-reduced-motion:reduce){.ec-title.shiny::after{animation:none;opacity:0}}'
    + '.ec-titles{display:inline-flex;flex-wrap:wrap;gap:4px 0;align-items:center;margin-left:6px;vertical-align:middle}.ec-titles .ec-title{margin-left:0}'
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
  window.ecTitle = look => { if (!look || !look.t) return null; const one = pill(look); if (!look.t2) return one; const w = document.createElement('span'); w.className = 'ec-titles'; const two = pill(look.t2); two.style.marginLeft = '4px'; w.append(one, two); return w; }; // 🏷️🏷️ up to 2 titles
  const pill = look => { const s = document.createElement('span'); const shiny = look.tr && look.tn >= 5; s.className = 'ec-title' + (look.tr ? ' r-' + look.tr : '') + (shiny ? ' shiny' : ''); s.textContent = (shiny ? '✨' : '') + (look.ti ? look.ti + ' ' : '') + look.t + (look.tn > 1 ? ' ×' + look.tn : ''); if (look.tr) s.title = ({ rare: 'RARE drop (1 in 100)', epic: 'EPIC drop (1 in 1,000)', leg: 'LEGENDARY drop (1 in 10,000)', ins: 'INSANE drop (1 in 100,000)' })[look.tr] + (look.tn > 1 ? ', pulled ' + look.tn + ' times' : ''); return s; };
  // 🍞 a small note at the bottom of the screen
  window.ecToast = (text, ms = 3500) => { const d = document.createElement('div'); d.setAttribute('role', 'status'); d.textContent = text; d.style.cssText = 'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2600;background:var(--ink,#111);color:var(--card,#fff);border-radius:12px;padding:10px 16px;font-weight:600;box-shadow:0 8px 24px rgb(0 0 0 / .25);max-width:calc(100vw - 24px)'; document.body.appendChild(d); setTimeout(() => d.remove(), ms); };
  // 🎲 LUCKY DROP pop-up. RARE: a card at the bottom. EPIC and rarer: the whole screen, with a burst.
  const dropQ = []; let dropOn = false;
  const RAR = { rare: { n: 'RARE', c: '#2563eb', odds: '1 in 100' }, epic: { n: 'EPIC', c: '#9333ea', odds: '1 in 1,000' }, leg: { n: 'LEGENDARY', c: '#f59e0b', odds: '1 in 10,000' }, ins: { n: 'INSANE', c: '#ff3b8d', odds: '1 in 100,000' } };
  window.ecDrops = list => { (list || []).forEach(d => dropQ.push(d)); if (!dropOn) nextDrop(); };
  function nextDrop() {
    const d = dropQ.shift(); if (!d) { dropOn = false; return; } dropOn = true;
    if (!document.getElementById('ecDropCss')) { const st = document.createElement('style'); st.id = 'ecDropCss';
      st.textContent = '.ec-drop-bg{position:fixed;inset:0;z-index:2700;display:grid;place-items:center;padding:16px;background:rgb(8 6 20 / .72);animation:ecDf .25s ease-out}'
        + '.ec-drop{position:relative;width:min(380px,100%);text-align:center;background:var(--card,#fff);color:var(--ink,#111);border-radius:22px;padding:26px 20px 18px;border:3px solid var(--rc);box-shadow:0 0 0 6px color-mix(in srgb,var(--rc) 30%,transparent),0 20px 60px rgb(0 0 0 / .45);animation:ecDp .55s cubic-bezier(.2,1.6,.4,1)}'
        + '.ec-drop.toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2700;padding:14px 16px;display:flex;align-items:center;gap:12px;text-align:left;animation:ecDt .45s cubic-bezier(.2,1.4,.4,1)}'
        + '.ec-drop .lab{display:inline-block;font:800 .8rem/1 var(--f-body,system-ui);letter-spacing:.14em;color:#fff;background:var(--rc);border-radius:999px;padding:6px 12px}'
        + '.ec-drop .big{font-size:4.2rem;line-height:1.1;margin:14px 0 4px;display:block;animation:ecDb 1.4s ease-in-out infinite}.ec-drop.toast .big{font-size:2.2rem;margin:0;animation:none}'
        + '.ec-drop h2{margin:6px 0 2px;font-size:1.6rem}.ec-drop.toast h2{font-size:1.1rem;margin:4px 0 0}.ec-drop p{margin:4px 0;color:var(--muted,#555);font-size:.95rem}'
        + '.ec-drop .acts{display:flex;gap:8px;justify-content:center;margin-top:14px}.ec-drop.toast .acts{margin:0;flex:none;flex-direction:column}'
        + '.ec-drop button{font:700 1rem var(--f-body,system-ui);border-radius:12px;padding:10px 16px;cursor:pointer;border:1.5px solid var(--rule,#ccc);background:var(--card,#fff);color:inherit}.ec-drop button.w{background:var(--rc);border-color:var(--rc);color:#fff}.ec-drop.toast button{padding:7px 12px;font-size:.875rem}'
        + '.ec-drop .rays{position:absolute;inset:-60px;z-index:-1;border-radius:50%;background:repeating-conic-gradient(from 0deg,color-mix(in srgb,var(--rc) 55%,transparent) 0 10deg,transparent 10deg 20deg);animation:ecSpin 8s linear infinite;-webkit-mask:radial-gradient(closest-side,#000 40%,transparent);mask:radial-gradient(closest-side,#000 40%,transparent)}'
        + '.ec-drop.ins{background:linear-gradient(160deg,#1a0b2e,#3b0f5c 50%,#0b2a4a);color:#fff}.ec-drop.ins p{color:#e9d5ff}.ec-drop.ins button:not(.w){background:rgb(255 255 255 / .12);color:#fff;border-color:rgb(255 255 255 / .45)}.ec-drop.ins .lab{background:linear-gradient(90deg,#ff3b3b,#ffb300,#3cff6b,#2fd0ff,#d23bff);background-size:300% 100%;animation:ecShim 2s linear infinite}'
        + '@keyframes ecDf{from{opacity:0}}@keyframes ecDp{from{opacity:0;transform:scale(.4) rotate(-6deg)}}@keyframes ecDt{from{opacity:0;transform:translate(-50%,30px)}}@keyframes ecDb{50%{transform:scale(1.12) rotate(4deg)}}'
        + '@media (prefers-reduced-motion:reduce){.ec-drop,.ec-drop-bg,.ec-drop .big,.ec-drop .rays{animation:none}}';
      document.head.appendChild(st); }
    const R0 = RAR[d.rar] || RAR.rare, big = d.rar !== 'rare';
    const box = mkEl('div', 'ec-drop' + (big ? '' : ' toast') + (d.rar === 'ins' ? ' ins' : '')); box.style.setProperty('--rc', R0.c); box.setAttribute('role', big ? 'alertdialog' : 'status'); box.setAttribute('aria-label', R0.n + ' drop: ' + d.name);
    const txt = mkEl('div'); txt.append(mkEl('span', 'lab', '🎲 ' + R0.n + ' DROP'), mkEl('h2', '', d.name), mkEl('p', '', R0.odds + ' per roll · ' + (d.n > 1 ? 'you’ve pulled it ×' + d.n : 'your first one!')));
    if (d.n === 5) txt.append(mkEl('p', '', '✨ That’s 5! It’s SHINY now: it sparkles wherever you wear it.')); else if (d.n < 5) txt.append(mkEl('p', '', '✨ ' + d.n + ' / 5 to make it shiny'));
    (d.unlocks || []).forEach(u => txt.append(mkEl('p', '', '🔓 Also unlocked the ' + (u.k === 'f' ? 'frame' : 'picture') + ': ' + (u.k === 'a' ? u.v + ' ' : '') + u.name)));
    const acts = mkEl('div', 'acts'), wear = mkEl('button', 'w', 'Wear it'), ok = mkEl('button', '', big ? 'Nice!' : '✕'); wear.type = ok.type = 'button'; if (!big) ok.setAttribute('aria-label', 'Close');
    acts.append(wear, ok);
    let bg = null; const end = () => { clearTimeout(tm); (bg || box).remove(); setTimeout(nextDrop, 350); };
    wear.onclick = async () => { wear.disabled = true; try { const r = await fetch('/api/look', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t: d.id }) }); wear.textContent = r.ok ? '✅ Wearing it' : 'Couldn’t'; if (r.ok && window.ecLive) window.ecLive(true); } catch (e) { wear.textContent = 'Couldn’t'; } setTimeout(end, 900); };
    ok.onclick = end;
    if (big) { box.append(mkEl('span', 'rays'), mkEl('span', 'big', d.ic || '🎲'), txt, acts); bg = mkEl('div', 'ec-drop-bg'); bg.appendChild(box); bg.onclick = e => { if (e.target === bg) end(); }; document.body.appendChild(bg); ok.focus(); }
    else { box.append(mkEl('span', 'big', d.ic || '🎲'), txt, acts); document.body.appendChild(box); }
    const tm = setTimeout(end, big ? 20000 : 8000);
  }
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
    m.appendChild(menuItem('🏂', 'Arcade: Peak Rider', '/arcade/'));
    m.appendChild(menuItem('💡', 'Feedback', '/feedback/'));
    m.appendChild(mkEl('hr'));
    const hp = menuItem('❓', 'Help for this page', () => { closeMenu(); if (window.ecHelp) window.ecHelp.open(); }); hp.id = 'ecMenuHelp'; m.appendChild(hp);
    m.appendChild(menuItem('⏲️', 'Study timer', () => { closeMenu(); if (window.ecTimer) window.ecTimer.open(); }));
    const fo = menuItem('🎯', 'Focus mode', () => { closeMenu(); const f = document.getElementById('ecFocusBtn'); if (f) f.click(); }); fo.id = 'ecMenuFocus'; fo.hidden = true; m.appendChild(fo);
    const dk = menuItem(isDark() ? '☀️' : '🌙', isDark() ? 'Light mode' : 'Dark mode', () => { const t = isDark() ? 'light' : 'dark'; apply(t); try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ } const b = document.querySelector('.theme-btn'); if (b) label(b); dk.querySelector('.ic').textContent = isDark() ? '☀️' : '🌙'; dk.lastChild.textContent = isDark() ? 'Light mode' : 'Dark mode'; });
    m.appendChild(dk);
    const inst = menuItem('📲', 'Install the app', () => { closeMenu(); installApp(); }); inst.id = 'ecMenuInstall'; inst.hidden = standalone() || !(window.ecInstallPrompt || isIOS()); m.appendChild(inst);
    const mp = menuItem('🔔', '', () => { const on = !popsOn(); try { localStorage.setItem('ec-msgpop', on ? 'on' : 'off'); } catch (e) { /* storage blocked */ } mp.lastChild.textContent = 'Message pop-ups: ' + (on ? 'On' : 'Off'); });
    mp.lastChild.textContent = 'Message pop-ups: ' + (popsOn() ? 'On' : 'Off'); m.appendChild(mp);
    m.appendChild(menuItem('🔁', 'Switch account', () => { closeMenu(); if (window.ecSwitchAccounts) window.ecSwitchAccounts(); else location.href = '/?switch=1'; }));
    const out = menuItem('🚪', 'Log out', () => { closeMenu(); if (window.ecLogout) window.ecLogout(); else location.href = '/?logout=1'; }); out.classList.add('out'); m.appendChild(out);
    return m;
  }
  function closeMenu() { const m = document.getElementById('ecMenu'), b = document.getElementById('ecProfile'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  function toggleMenu(e) {
    e.preventDefault(); const m = document.getElementById('ecMenu'), b = document.getElementById('ecProfile'); if (!m) return;
    m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden));
    if (!m.hidden) { const fo = document.getElementById('ecMenuFocus'); if (fo) fo.hidden = !document.getElementById('ecFocusBtn'); const hp = document.getElementById('ecMenuHelp'); if (hp) hp.hidden = !window.ecHelp; const r = b.getBoundingClientRect(); m.style.top = (r.bottom + window.scrollY + 8) + 'px'; const f = m.querySelector('.it'); if (f) f.focus(); }
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
  // 💬 "new message" pop-ups (switch them off in the menu). Not on the Chat page, not in Focus mode; in study mode only Beau's.
  const popsOn = () => { try { return localStorage.getItem('ec-msgpop') !== 'off'; } catch (e) { return true; } };
  function msgPop(j) {
    const L = j.chat && j.chat.latest; if (!L || !popsOn() || location.pathname.startsWith('/chat') || root.classList.contains('ec-focus')) return;
    const study = j.study && j.study.study; if (study && !L.beau) return;
    let seen = ''; try { seen = localStorage.getItem('ec-msgpop-seen') || ''; } catch (e) { /* storage blocked */ }
    if (seen === L.key) return; try { localStorage.setItem('ec-msgpop-seen', L.key); } catch (e) { /* storage blocked */ }
    if (!document.getElementById('ecPopCss')) { const st = document.createElement('style'); st.id = 'ecPopCss'; st.textContent = '.ec-mpop{position:fixed;top:calc(64px + env(safe-area-inset-top,0px));right:14px;z-index:2450;width:min(320px,calc(100vw - 28px));display:flex;align-items:center;gap:10px;background:var(--card,#fff);color:var(--ink,#111);border:2px solid var(--accent,#2453d6);border-radius:14px;padding:10px 12px;box-shadow:0 12px 30px rgb(0 0 0 / .22);animation:ecMp .3s ease-out}.ec-mpop .tx{flex:1;min-width:0;font-weight:600}.ec-mpop a{flex:none}.ec-mpop button{flex:none;border:0;background:none;color:var(--ink,#111);font-size:1.1rem;cursor:pointer;width:32px;height:32px;border-radius:8px}@keyframes ecMp{from{opacity:0;transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.ec-mpop{animation:none}}'; document.head.appendChild(st); }
    const old = document.querySelector('.ec-mpop'); if (old) old.remove();
    const box = mkEl('div', 'ec-mpop'); box.setAttribute('role', 'status');
    const who = L.name && !study ? L.name + (L.beau ? ' and Beau' : '') : 'Beau';
    const go = mkEl('a', 'btn sm', 'Open'); go.href = L.name && !study ? '/chat/?thread=' + L.thread : '/chat/?tab=beau';
    const x = mkEl('button', '', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = () => box.remove();
    box.append(mkEl('span', '', L.name && !study ? '💬' : '✉️'), mkEl('span', 'tx', 'New message from ' + who), go, x);
    document.body.appendChild(box); setTimeout(() => box.remove(), 12000);
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
    msgPop(j);
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
        const pic = document.createElement('span'); pic.className = 'pic'; pic.textContent = r.k === 'a' ? r.v : r.k === 'f' ? ((j.me && j.me.look && j.me.look.a) || '🙂') : '🏷️'; if (r.k === 'f') pic.classList.add('ec-lk', 'ec-fr-' + r.v);
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
  // ← Home: the same easy-to-find button at the top of every page except Home, the subjects and the admin page
  const back = () => {
    const path = location.pathname; if (path === '/' || path === '/index.html' || SUBJECT_PAGE || path.startsWith('/admin') || document.getElementById('ecBack')) return;
    const main = document.querySelector('main'); if (!main) return;
    const st = document.createElement('style');
    st.textContent = '.ec-back{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;width:max-content;font:inherit;font-weight:600;font-size:.9375rem;color:var(--ink,#111);background:var(--card,#fff);border:1.5px solid var(--rule,#ccc);border-radius:999px;padding:6px 14px 6px 10px;min-height:40px;text-decoration:none;margin:0 0 10px}.ec-back:hover{border-color:var(--accent,#2453d6)}.ec-back .ar{font-size:1.1rem;line-height:1}';
    document.head.appendChild(st);
    const from = new URLSearchParams(location.search).get('from'), SUBJ = { maths: 'Maths', science: 'Science', english: 'English' }; // came from a subject? go back to it
    const a = document.createElement('a'); a.id = 'ecBack'; a.className = 'ec-back'; a.href = SUBJ[from] ? '/' + from + '/' : '/';
    a.innerHTML = '<span class="ar" aria-hidden="true">←</span> ' + (SUBJ[from] ? 'Back to ' + SUBJ[from] : 'Home');
    a.setAttribute('aria-label', SUBJ[from] ? 'Back to ' + SUBJ[from] : 'Back to the home page');
    main.insertBefore(a, main.firstChild);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', back); else back();
  // pop-up messages from Beau ("Message everyone") on every page
  ['/notice.js', '/study.js', '/timer.js'].forEach(src => { const nj = document.createElement('script'); nj.src = src + '?v=' + (document.documentElement.dataset.build || '1'); nj.defer = true; document.head.appendChild(nj); });
})();
