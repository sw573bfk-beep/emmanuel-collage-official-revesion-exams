/* EC Revisions app helper (lets the site be installed like an app, and work offline for notes).
   It keeps a copy of the Maths, Science and English pages (and the scripts and styles they use) each time you open them,
   so they still open with no internet. Everything else, and anything with your account (answers, points, chat), always
   comes fresh from the site. If a page isn't saved and there's no internet, it shows a friendly "you're offline" page. */
const CACHE = 'ec-offline-v1';
const KEEP_PAGES = ['/maths/', '/science/', '/english/'];
const OFFLINE = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · EC Revisions</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f4f6fb;color:#18202f;text-align:center;padding:24px}.b{max-width:380px}h1{font-size:1.6rem;margin:12px 0 6px}p{color:#566077;line-height:1.5}a,button{font:600 1rem system-ui;border:0;border-radius:10px;padding:12px 18px;background:#2453d6;color:#fff;cursor:pointer;margin:6px 4px 0;display:inline-block;text-decoration:none}@media (prefers-color-scheme:dark){body{background:#0f1420;color:#e8edf7}p{color:#a6b0c3}}</style></head><body><div class="b"><div style="font-size:3rem">📡</div><h1>You’re offline</h1><p>This page needs the internet. Maths, Science and English still work offline if you’ve opened them on this device before.</p><button onclick="location.reload()">Try again</button><br><a href="/maths/">📐 Maths</a><a href="/science/">🧪 Science</a><a href="/english/">📖 English</a></div></body></html>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
const pageKey = u => { const p = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/'; return KEEP_PAGES.includes(p) ? p : null; };
async function keep(req, res, key) {
  const c = await caches.open(CACHE), u = new URL(req.url);
  if (!key) for (const old of await c.keys()) { const o = new URL(old.url); if (o.pathname === u.pathname && o.search !== u.search) await c.delete(old); } // only the newest version of each file
  await c.put(key || req, res);
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url); if (u.origin !== self.location.origin || u.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    const key = pageKey(u);
    e.respondWith(fetch(req).then(res => { if (key && res.ok && !res.redirected) { const copy = res.clone(); e.waitUntil(keep(req, copy, key)); } return res; })
      .catch(async () => (key && await caches.match(key)) || new Response(OFFLINE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
    return;
  }
  if (/\.(js|css)$/.test(u.pathname)) { // scripts and styles: from the site when online, from the saved copy when not
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); e.waitUntil(keep(req, copy)); } return res; }).catch(async () => (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true })) || Response.error()));
  }
});
