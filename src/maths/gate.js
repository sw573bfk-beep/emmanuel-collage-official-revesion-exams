// Runs before the maths app: checks you are logged in, loads your saved progress from the
// server into this browser, then starts the app and saves changes back automatically.
(async function gate() {
  const P = 'y8m:', LOCAL_ONLY = new Set(['theme']);
  const status = t => { const el = document.getElementById('syncStatus'); if (el) el.textContent = t; };
  const ours = k => k.startsWith(P) && !LOCAL_ONLY.has(k.slice(P.length));
  const clearLocal = () => { try { Object.keys(localStorage).filter(ours).forEach(k => localStorage.removeItem(k)); } catch (e) { /* storage blocked */ } };
  const home = document.getElementById('v-home');
  let me;
  try {
    const r = await fetch('/api/me', { credentials: 'same-origin' });
    if (r.status === 401) { location.replace('/?next=maths'); return; }
    if (!r.ok) throw new Error('server');
    me = await r.json();
    const pr = await fetch('/api/progress/maths', { credentials: 'same-origin' });
    if (!pr.ok) throw new Error('server');
    const { data } = await pr.json();
    clearLocal(); // start from this account's saved progress, not whoever used this browser before
    Object.entries(data || {}).forEach(([k, v]) => { if (!LOCAL_ONLY.has(k)) try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } });
  } catch (e) {
    home.innerHTML = '<div class="card stack"><h2>Can’t reach the server</h2><p>Your progress couldn’t be loaded. Check your internet connection, then reload the page.</p><p><button class="btn" type="button" onclick="location.reload()">Reload</button></p></div>';
    return;
  }
  document.getElementById('acctName').textContent = me.username;
  let timer = null, dirty = false, saving = false;
  const collect = () => { const o = {}; try { Object.keys(localStorage).filter(ours).forEach(k => { o[k.slice(P.length)] = JSON.parse(localStorage.getItem(k)); }); } catch (e) { /* storage blocked */ } return o; };
  async function save(keepalive) {
    if (!dirty || (saving && !keepalive)) return; dirty = false; saving = true; status('Saving…');
    try {
      const r = await fetch('/api/progress/maths', { method: 'PUT', credentials: 'same-origin', keepalive: !!keepalive, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: collect() }) });
      if (r.status === 401) { location.replace('/?next=maths'); return; }
      if (!r.ok) throw new Error('save');
      status('Saved');
    } catch (e) { dirty = true; status('Not saved yet, retrying'); clearTimeout(timer); timer = setTimeout(save, 8000); }
    finally { saving = false; if (dirty && !timer) timer = setTimeout(save, 1500); }
  }
  window.onStoreChange = k => { if (LOCAL_ONLY.has(k)) return; dirty = true; status('Unsaved changes'); clearTimeout(timer); timer = setTimeout(() => { timer = null; save(); }, 1200); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(true); });
  window.addEventListener('pagehide', () => save(true));
  document.getElementById('logoutBtn').onclick = async () => {
    if (!(window.ecConfirmLogout ? await window.ecConfirmLogout() : confirm('Are you sure you want to log out?'))) return;
    await save(true);
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch (e) { /* offline */ }
    clearLocal(); location.href = '/';
  };
  // Study-time heartbeat: while this tab is visible and you've touched the page in the last 3 minutes,
  // tell the server once a minute. Idle or background time is not counted.
  const visit = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  let lastInput = Date.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll', 'input'].forEach(ev => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  const ping = keepalive => {
    if (Date.now() - lastInput > 180000) return;
    fetch('/api/ping', { method: 'POST', credentials: 'same-origin', keepalive: !!keepalive, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: 'maths', visit }) }).catch(() => { /* offline */ });
  };
  ping(); setInterval(() => { if (document.visibilityState === 'visible') ping(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { lastInput = Date.now(); ping(); } else ping(true); });
  status('Saved');
  const s = document.createElement('script'); s.src = 'app.js?v=' + (document.documentElement.dataset.build || '1'); document.body.appendChild(s);
})();
