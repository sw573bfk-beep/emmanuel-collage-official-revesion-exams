/* EC Revisions: lets one browser be logged into several accounts at once (up to 5).
   Each tab remembers which account "slot" it is using, and every request to /api/ says so.
   Loaded first on every page, before anything talks to the server. */
(() => {
  const MAX = 5, KEY = 'ec:slot';
  const realFetch = window.fetch.bind(window);
  const ok = n => Number.isInteger(n) && n >= 0 && n < MAX;
  let slot = NaN;
  try { slot = parseInt(sessionStorage.getItem(KEY), 10); } catch (e) { /* storage blocked */ }
  if (!ok(slot)) { try { slot = parseInt(localStorage.getItem(KEY), 10); } catch (e) { /* storage blocked */ } }
  if (!ok(slot)) slot = 0;
  // The tab also remembers WHO it is logged in as, so a refresh never quietly turns it into
  // someone else (for example after another tab logged out and logged in as a different person).
  // null = new tab (take whoever is logged in), '' = this tab is logged out.
  const WHO = 'ec:who';
  const getWho = () => { try { return sessionStorage.getItem(WHO); } catch (e) { return null; } };
  const setWho = v => { try { sessionStorage.setItem(WHO, v); } catch (e) { /* storage blocked */ } };
  const use = (n, who) => {
    slot = ok(n) ? n : 0; window.EC_SLOT = slot;
    try { sessionStorage.setItem(KEY, slot); localStorage.setItem(KEY, slot); } catch (e) { /* storage blocked */ }
    if (who != null) setWho(who);
  };
  use(slot);
  const listAccounts = async () => { try { const r = await realFetch('/api/accounts', { credentials: 'same-origin' }); return r.ok ? (await r.json()).accounts : []; } catch (e) { return []; } };
  const notLoggedIn = () => new Response(JSON.stringify({ error: 'Not logged in' }), { status: 401, headers: { 'content-type': 'application/json' } });

  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const api = url.startsWith('/api/') || url.startsWith(location.origin + '/api/');
    if (!api) return realFetch(input, init);
    init = Object.assign({}, init);
    const h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    h.set('x-ec-acct', String(slot));
    const path = new URL(url, location.href).pathname, who0 = getWho();
    if (who0 && path !== '/api/login' && path !== '/api/signup') h.set('x-ec-who', encodeURIComponent(who0));
    init.headers = h;
    const res = realFetch(input, init);
    if (path === '/api/login' || path === '/api/signup') return res.then(async r => { if (r.ok) { try { setWho((await r.clone().json()).username); } catch (e) { /* no body */ } } return r; });
    if (path === '/api/logout' || path === '/api/delete-account') return res.then(r => { if (r.ok) setWho(''); return r; });
    if (path === '/api/me') return res.then(async r => {
      if (!r.ok) return r;
      let me; try { me = await r.clone().json(); } catch (e) { return r; }
      const who = getWho();
      if (who === null || who === me.username) { setWho(me.username); return r; }
      // Someone else is now in this tab's login spot. Find this tab's own account if it is still logged in…
      if (who) { const mine = (await listAccounts()).find(a => a.username === who); if (mine) { use(mine.slot); location.reload(); return new Promise(() => {}); } }
      // …otherwise this tab is logged out: show the login page, not the other person's account.
      return notLoggedIn();
    });
    return res;
  };

  window.ecAcct = {
    max: MAX,
    slot: () => slot,
    use,
    // the accounts logged in in this browser: [{ slot, username }]
    list: listAccounts,
    // the local copy of progress for a slot uses its own keys, so two tabs on two accounts never mix
    prefix: (subj, n = slot) => 'y8' + subj + (n ? n : '') + ':'
  };
})();
