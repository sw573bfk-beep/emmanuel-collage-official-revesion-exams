/* EC Revisions: "Message everyone" pop-ups from Beau. Loaded on every page by theme.js.
   A pop-up only shows for people who already had the site open when Beau sent it, stays until its
   time runs out (or Beau stops it), and can be closed with ✕. Checks every 45 seconds. */
(() => {
  if (window.ecNotice) return; window.ecNotice = true;
  const ss = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  // when this tab first reached the site (server time): pop-ups sent before that aren't for this tab
  let onSince = +ss('ec-on-since') || 0, skew = 0, shown = null, box = null, tick = null;
  const closed = () => (ls('ec-notice-closed') || '').split(',').filter(Boolean);
  const close = id => { ls('ec-notice-closed', [id].concat(closed()).slice(0, 20).join(',')); hide(); };
  const serverNow = () => Date.now() / 1000 + skew;

  const css = document.createElement('style');
  css.textContent = `
.ec-notice{position:fixed;z-index:2000;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(560px,calc(100vw - 24px));
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
    const t = document.createElement('span'); t.className = 'ec-n-ttl'; t.textContent = '📣 Message from Beau';
    const x = document.createElement('button'); x.type = 'button'; x.className = 'ec-n-x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Close this message'); x.onclick = () => close(n.id);
    top.append(t, x);
    const b = document.createElement('div'); b.className = 'ec-n-body'; b.textContent = n.body;
    const l = document.createElement('div'); l.className = 'ec-n-left';
    const bar = document.createElement('div'); bar.className = 'ec-n-bar'; const fill = document.createElement('i'); bar.appendChild(fill);
    box.append(top, b, l, bar); document.body.appendChild(box);
    const total = Math.max(1, n.ends - n.at);
    const step = () => {
      const r = n.ends - serverNow(); if (r <= 0) return hide();
      l.textContent = 'Closes by itself in ' + left(r) + ' · tap ✕ to close it now';
      fill.style.width = Math.max(0, Math.min(100, r / total * 100)) + '%';
    };
    step(); tick = setInterval(step, 1000);
  }
  async function check() {
    let j; try { const r = await fetch('/api/broadcast', { credentials: 'same-origin', cache: 'no-store' }); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    skew = j.now - Date.now() / 1000;
    if (!onSince) { onSince = j.now; ss('ec-on-since', String(onSince)); }
    const n = j.notice;
    if (!n || n.at < onSince - 2 || closed().includes(String(n.id))) { if (shown) hide(); return; }
    show(n);
  }
  const go = () => { check(); setInterval(() => { if (document.visibilityState === 'visible') check(); }, 45000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.ecNoticeCheck = check;
})();
