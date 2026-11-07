/* EC Revisions: lets one browser be logged into several accounts at once (up to 5).
   Each tab remembers which account "slot" it is using, and every request to /api/ says so.
   Loaded first on every page, before anything talks to the server. */
(() => {
  const MAX = 5, KEY = 'ec:slot';
  const ok = n => Number.isInteger(n) && n >= 0 && n < MAX;
  let slot = NaN;
  try { slot = parseInt(sessionStorage.getItem(KEY), 10); } catch (e) { /* storage blocked */ }
  if (!ok(slot)) { try { slot = parseInt(localStorage.getItem(KEY), 10); } catch (e) { /* storage blocked */ } }
  if (!ok(slot)) slot = 0;
  const use = n => {
    slot = ok(n) ? n : 0; window.EC_SLOT = slot;
    try { sessionStorage.setItem(KEY, slot); localStorage.setItem(KEY, slot); } catch (e) { /* storage blocked */ }
  };
  use(slot);

  const realFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const api = url.startsWith('/api/') || url.startsWith(location.origin + '/api/');
    if (!api) return realFetch(input, init);
    init = Object.assign({}, init);
    const h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    h.set('x-ec-acct', String(slot));
    init.headers = h;
    return realFetch(input, init);
  };

  window.ecAcct = {
    max: MAX,
    slot: () => slot,
    use,
    // the accounts logged in in this browser: [{ slot, username }]
    list: async () => { try { const r = await realFetch('/api/accounts', { credentials: 'same-origin' }); return r.ok ? (await r.json()).accounts : []; } catch (e) { return []; } },
    // the local copy of progress for a slot uses its own keys, so two tabs on two accounts never mix
    prefix: (subj, n = slot) => 'y8' + subj + (n ? n : '') + ':'
  };
})();
