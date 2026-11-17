/* EC Revisions: "Message everyone" pop-ups from Beau. Loaded on every page by theme.js.
   A pop-up shows for everyone who has the site open, or opens it, before its time runs out (or Beau
   stops it). Each person can close it with ✕ and then won't see that one again. Checks once a minute (shared with the other background checks). */
(() => {
  if (window.ecNotice) return; window.ecNotice = true;
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  // when this tab first reached the site (server time): pop-ups sent before that aren't for this tab
  let skew = 0, shown = null, box = null, tick = null;
  const closed = () => (ls('ec-notice-closed') || '').split(',').filter(Boolean);
  const close = id => { ls('ec-notice-closed', [id].concat(closed()).slice(0, 20).join(',')); hide(); };
  // 🔁 "rate the site" reminders come back an hour after you close them (until you've rated the site)
  const snoozed = id => { const at = +ls('ec-notice-snooze-' + id) || 0; return Date.now() - at < 3600000; };
  const snooze = id => { ls('ec-notice-snooze-' + id, String(Date.now())); hide(); };
  const serverNow = () => Date.now() / 1000 + skew;

  const css = document.createElement('style');
  css.textContent = `
.ec-notice{position:fixed;z-index:2500;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(560px,calc(100vw - 24px));
  background:var(--card,#fff);color:var(--ink,#1b1b1b);border:2.5px solid var(--accent,#2453d6);border-radius:16px;box-shadow:0 14px 40px rgb(0 0 0 / .28);
  padding:14px 14px 0 18px;display:flex;flex-direction:column;gap:6px;overflow:hidden;animation:ecNoticeIn .35s ease-out;font-family:inherit}
.ec-notice .ec-n-top{display:flex;align-items:center;gap:10px}
.ec-notice .ec-n-ttl{flex:1;font-weight:800;font-size:1rem;color:var(--accent,#2453d6);letter-spacing:.01em}
.ec-notice .ec-n-x{flex:none;width:44px;height:44px;margin:-8px -6px -8px 0;border:0;border-radius:12px;background:transparent;color:var(--ink,#1b1b1b);font-size:1.4rem;line-height:1;cursor:pointer}
.ec-notice .ec-n-x:hover,.ec-notice .ec-n-x:focus-visible{background:var(--accent-soft,#e8eefc);outline:none}
.ec-notice .ec-n-body{font-size:1.125rem;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;padding-right:4px}
.ec-notice .ec-n-left{font-size:.875rem;color:var(--muted,#555);padding-bottom:10px}
.ec-notice .ec-n-bar{height:5px;margin:0 -14px 0 -18px;background:var(--accent-soft,#e8eefc)}
.ec-notice .ec-n-bar i{display:block;height:100%;background:var(--accent,#2453d6);transition:width 1s linear}
@keyframes ecNoticeIn{from{opacity:0;transform:translate(-50%,-16px)}to{opacity:1;transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.ec-notice{animation:none}.ec-notice .ec-n-bar i{transition:none}}`;
  document.head.appendChild(css);

  const left = s => { s = Math.max(0, Math.ceil(s)); if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h + ' h' + (m ? ' ' + m + ' min' : ''); } if (s >= 60) { const m = Math.floor(s / 60), r = s % 60; return m + ':' + String(r).padStart(2, '0'); } return s + ' sec'; };
  function hide() { clearInterval(tick); tick = null; if (box) box.remove(); box = null; shown = null; }
  function show(n) {
    if (shown && shown.id === n.id && shown.ends === n.ends) return;
    hide(); shown = n;
    box = document.createElement('div'); box.className = 'ec-notice'; box.setAttribute('role', 'alert'); box.setAttribute('aria-live', 'assertive');
    const top = document.createElement('div'); top.className = 'ec-n-top';
    const t = document.createElement('span'); t.className = 'ec-n-ttl'; t.textContent = n.game ? '🎮 Game from Beau' : '📣 Message from Beau';
    const x = document.createElement('button'); x.type = 'button'; x.className = 'ec-n-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Close this message'); x.onclick = () => (n.rate ? snooze(n.id) : close(n.id));
    top.append(t, x);
    const b = document.createElement('div'); b.className = 'ec-n-body'; b.textContent = n.body;
    const l = document.createElement('div'); l.className = 'ec-n-left';
    const bar = document.createElement('div'); bar.className = 'ec-n-bar'; const fill = document.createElement('i'); bar.appendChild(fill);
    box.append(top, b);
    if (n.rate) { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding-bottom:4px'; const go = document.createElement('button'); go.type = 'button'; go.className = 'btn sm'; go.textContent = '⭐ Rate now'; go.onclick = () => { snooze(n.id); if (window.ecRateOpen) window.ecRateOpen(); }; const sm = document.createElement('span'); sm.style.cssText = 'font-size:.8125rem;color:var(--muted,#555)'; sm.textContent = 'This comes back every hour until you’ve rated the site.'; row.append(go, sm); box.appendChild(row); }
    if (n.game) { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:2px 0 4px'; const go = document.createElement('a'); go.className = 'btn'; go.href = '/play/?code=' + encodeURIComponent(n.game); go.textContent = '🎮 Join game'; go.style.cssText = 'font-size:1.05rem;padding:10px 22px;text-decoration:none'; go.onclick = () => { ls('ec-notice-closed', [n.id].concat(closed()).slice(0, 20).join(',')); }; const c = document.createElement('span'); c.style.cssText = 'font-family:var(--f-mono,monospace);font-size:.95rem;color:var(--muted,#555)'; c.textContent = 'Code ' + n.game; row.append(go, c); box.appendChild(row); }
    box.append(l, bar); document.body.appendChild(box);
    const total = Math.max(1, n.ends - n.at);
    const step = () => {
      const r = n.ends - serverNow(); if (r <= 0) return hide();
      l.textContent = 'Closes by itself in ' + left(r) + ' · tap ✕ to close it now';
      fill.style.width = Math.max(0, Math.min(100, r / total * 100)) + '%';
    };
    step(); tick = setInterval(step, 1000);
  }
  async function check(force) {
    const j = window.ecLive ? await window.ecLive(force) : null; if (!j) return;
    skew = j.now - Date.now() / 1000;
    const n = j.notice;
    const inIt = n && n.game && location.pathname.startsWith('/play') && new URLSearchParams(location.search).get('code') === n.game; // already in that game
    if (!n || inIt || (n.rate ? snoozed(n.id) : closed().includes(String(n.id)))) { if (shown) hide(); return; } // latecomers see it too, until they close it
    show(n);
  }
  const go = () => { check(); setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.ecNoticeCheck = () => check(true);
  window.addEventListener('ec-rated', () => { if (shown && shown.rate) hide(); }); // they just rated the site
})();
