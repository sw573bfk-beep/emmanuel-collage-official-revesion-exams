// Runs before the science app: checks you are logged in, loads your saved progress from the
// server into this browser, then starts the app and saves changes back automatically.
(async function gate() {
  const P = window.ecAcct ? ecAcct.prefix('s') : 'y8s:', LOCAL_ONLY = new Set(['theme', 'seen']);
  const status = t => { const el = document.getElementById('syncStatus'); if (el) el.textContent = t; };
  const ours = k => k.startsWith(P) && !LOCAL_ONLY.has(k.slice(P.length));
  const clearLocal = () => { try { Object.keys(localStorage).filter(ours).forEach(k => localStorage.removeItem(k)); } catch (e) { /* storage blocked */ } };
  const home = document.getElementById('v-home');
  let me;
  try {
    const r = await fetch('/api/me', { credentials: 'same-origin' });
    if (r.status === 401) { location.replace('/?next=science'); return; }
    if (!r.ok) throw new Error('server');
    me = await r.json();
    const pr = await fetch('/api/progress/science', { credentials: 'same-origin' });
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
      const r = await fetch('/api/progress/science', { method: 'PUT', credentials: 'same-origin', keepalive: !!keepalive, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: collect() }) });
      if (r.status === 401) { location.replace('/?next=science'); return; }
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
    if (asleep || Date.now() - lastInput > 180000) return;
    fetch('/api/ping', { method: 'POST', credentials: 'same-origin', keepalive: !!keepalive, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject: 'science', visit }) }).catch(() => { /* offline */ });
  };
  // 💤 Sleep mode: after 10 minutes of doing nothing, a screen covers the page and no study time is counted
  // (so nobody can leave a tab open overnight to farm points) until they tap "I'm back".
  let asleep = false, sleepEl = null;
  const SLEEP_MS = 10 * 60000;
  function sleep() {
    if (asleep) return; asleep = true;
    if (!sleepEl) {
      const st = document.createElement('style');
      st.textContent = '.ec-sleep{position:fixed;inset:0;z-index:3000;display:grid;place-items:center;padding:20px;background:rgb(10 14 30 / .72);backdrop-filter:blur(4px)}.ec-sleep .box{max-width:420px;width:100%;background:var(--card,#fff);color:var(--ink,#111);border-radius:18px;padding:26px 24px;text-align:center;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 50px rgb(0 0 0 / .35)}.ec-sleep .z{font-size:3rem;line-height:1}.ec-sleep h2{margin:0}.ec-sleep p{margin:0}';
      document.head.appendChild(st);
      sleepEl = document.createElement('div'); sleepEl.className = 'ec-sleep'; sleepEl.setAttribute('role', 'dialog'); sleepEl.setAttribute('aria-modal', 'true'); sleepEl.setAttribute('aria-labelledby', 'ecSleepH');
      sleepEl.innerHTML = '<div class="box"><div class="z" aria-hidden="true">💤</div><h2 id="ecSleepH">Sleep mode</h2><p>You haven’t done anything for 10 minutes, so your study time has stopped counting.</p><button type="button" class="btn">I’m back, keep studying</button></div>';
      sleepEl.querySelector('button').onclick = wake;
    }
    document.body.appendChild(sleepEl); sleepEl.querySelector('button').focus();
  }
  function wake() { asleep = false; lastInput = Date.now(); if (sleepEl) sleepEl.remove(); ping(); }
  setInterval(() => { if (!asleep && Date.now() - lastInput > SLEEP_MS) sleep(); }, 15000);
  ping(); setInterval(() => { if (document.visibilityState === 'visible' && !asleep) ping(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (asleep) return; if (document.visibilityState === 'visible') { if (Date.now() - lastInput > SLEEP_MS) return sleep(); lastInput = Date.now(); ping(); } else ping(true); });
  status('Saved');
  const s = document.createElement('script'); s.src = 'app.js?v=' + (document.documentElement.dataset.build || '1'); document.body.appendChild(s);
})();
