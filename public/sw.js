/* EC Revisions app helper (lets the site be installed like an app). It doesn't save any pages or answers:
   everything still comes fresh from the site. If there's no internet, it shows a friendly "you're offline" page. */
const OFFLINE = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · EC Revisions</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f4f6fb;color:#18202f;text-align:center;padding:24px}.b{max-width:360px}h1{font-size:1.6rem;margin:12px 0 6px}p{color:#566077;line-height:1.5}button{font:600 1rem system-ui;border:0;border-radius:10px;padding:12px 20px;background:#2453d6;color:#fff;cursor:pointer;margin-top:8px}@media (prefers-color-scheme:dark){body{background:#0f1420;color:#e8edf7}p{color:#a6b0c3}}</style></head><body><div class="b"><div style="font-size:3rem">📡</div><h1>You’re offline</h1><p>EC Revisions needs the internet to load and save your progress. Check your Wi-Fi, then try again.</p><button onclick="location.reload()">Try again</button></div></body></html>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return; // only pages; everything else goes straight to the network
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
});
