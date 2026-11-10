/* EC Revisions: the "Message Beau" buttons. Shows a red number when Beau has replied
   (or, for Beau, how many student messages are unread) and checks again every minute. */
(() => {
  const links = () => document.querySelectorAll('a[data-msg]');
  const chats = () => document.querySelectorAll('a[data-chat]');
  if (!links().length && !chats().length) return;
  const st = document.createElement('style');
  st.textContent = 'a[data-msg]{position:relative}.msg-badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;margin-left:6px;border-radius:999px;background:var(--pen,#b3261e);color:var(--card,#fff);font-size:.875rem;font-weight:700;line-height:1}.msg-badge[hidden]{display:none}';
  document.head.appendChild(st);
  // 💬 Chat: red number = new chat requests + unread 1-on-1 messages; a dot = new group chat messages
  async function checkChat() {
    if (!chats().length) return;
    let j; try { const r = await fetch('/api/chat/summary', { credentials: 'same-origin' }); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    const n = j.requests + j.unreadDm;
    chats().forEach(a => {
      let b = a.querySelector('.msg-badge'); if (!b) { b = document.createElement('span'); b.className = 'msg-badge'; a.appendChild(b); }
      b.hidden = !n && !j.unreadGroup; b.textContent = n ? (n > 99 ? '99+' : n) : '•';
      b.style.background = n ? '' : 'var(--accent,#2453d6)';
      a.setAttribute('aria-label', 'Chat' + (n ? ' (' + n + ' new)' : j.unreadGroup ? ' (new group messages)' : ''));
    });
  }
  async function check() {
    checkChat();
    if (!links().length) return;
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
