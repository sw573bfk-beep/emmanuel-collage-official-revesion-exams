/* EC Revisions: the red number on the 💬 Chat buttons. Counts friend requests, unread 1-on-1 messages
   and unread messages from Beau (for Beau: unread student messages). Checks again every minute. Old "Message Beau" links (data-msg) get the Beau count too. */
(() => {
  const chats = () => document.querySelectorAll('a[data-chat]');
  const links = () => document.querySelectorAll('a[data-msg]');
  if (!links().length && !chats().length) return;
  const st = document.createElement('style');
  st.textContent = 'a[data-msg],a[data-chat]{position:relative}.msg-badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;margin-left:6px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.875rem;font-weight:700;line-height:1}.msg-badge[hidden]{display:none}';
  document.head.appendChild(st);
  const badge = a => { let b = a.querySelector('.msg-badge'); if (!b) { b = document.createElement('span'); b.className = 'msg-badge'; a.appendChild(b); } return b; };
  async function check(force) {
    const live = window.ecLive ? await window.ecLive(force) : null, c = live && live.chat; if (!c) return;
    const beau = c.beau || 0, n = (c.admin ? 0 : c.requests + c.unreadDm) + beau;
    chats().forEach(a => {
      const b = badge(a); b.hidden = !n; b.textContent = n > 99 ? '99+' : n; b.style.background = '';
      a.setAttribute('aria-label', 'Chat' + (n ? ' (' + n + ' new)' : ''));
    });
    links().forEach(a => {
      if (c.admin && !a.dataset.adminDone) { a.dataset.adminDone = '1'; a.href = '/admin/#chats'; }
      const b = badge(a); b.hidden = !beau; b.textContent = beau > 99 ? '99+' : beau;
    });
  }
  check();
  setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  window.ecMsgCheck = () => check(true);
})();
