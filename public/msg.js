/* EC Revisions: the "Message Beau" buttons. Shows a red number when Beau has replied
   (or, for Beau, how many student messages are unread) and checks again every minute. */
(() => {
  const links = () => document.querySelectorAll('a[data-msg]');
  if (!links().length) return;
  const st = document.createElement('style');
  st.textContent = 'a[data-msg]{position:relative}.msg-badge{display:inline-grid;place-items:center;min-width:19px;height:19px;padding:0 5px;margin-left:6px;border-radius:999px;background:#d93025;color:#fff;font-size:.72rem;font-weight:700;line-height:1}.msg-badge[hidden]{display:none}';
  document.head.appendChild(st);
  async function check() {
    let j; try { const r = await fetch('/api/messages/unread', { credentials: 'same-origin' }); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    links().forEach(a => {
      if (j.admin && !a.dataset.adminDone) { a.dataset.adminDone = '1'; a.href = '/admin/#messages'; const t = a.querySelector('.msg-label') || a; t.textContent = 'Messages'; }
      let b = a.querySelector('.msg-badge'); if (!b) { b = document.createElement('span'); b.className = 'msg-badge'; a.appendChild(b); }
      b.hidden = !j.unread; b.textContent = j.unread > 99 ? '99+' : j.unread;
      a.setAttribute('aria-label', (j.admin ? 'Messages' : 'Message Beau') + (j.unread ? ' (' + j.unread + ' unread)' : ''));
    });
  }
  check();
  setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  window.ecMsgCheck = check;
})();
