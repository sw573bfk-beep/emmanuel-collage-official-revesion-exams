/* EC Revisions: light / dark mode. Follows the computer's setting until someone taps the ☀/🌙 button,
   then remembers their choice on this device. Load it in <head> (not deferred) so there's no flash. */
(() => {
  const KEY = 'ec-theme', root = document.documentElement;
  const saved = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const apply = t => { if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); };
  apply(saved());
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  const isDark = () => root.getAttribute('data-theme') === 'dark' || (!root.getAttribute('data-theme') && mq && mq.matches);
  window.ecTheme = { apply, isDark };
  function label(b) {
    const d = isDark();
    b.innerHTML = '<span aria-hidden="true">' + (d ? '☀️' : '🌙') + '</span><span class="tl">' + (d ? 'Light' : 'Dark') + '</span>';
    b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode');
    b.title = d ? 'Switch to light mode' : 'Switch to dark mode';
  }
  function add() {
    if (document.querySelector('.theme-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'theme-btn';
    b.onclick = () => { const t = isDark() ? 'light' : 'dark'; apply(t); try { localStorage.setItem(KEY, t); } catch (e) { /* storage blocked */ } label(b); };
    label(b);
    if (mq && mq.addEventListener) mq.addEventListener('change', () => label(b));
    const spot = document.querySelector('[data-theme-slot]') || document.querySelector('.top-tools') || document.querySelector('#whoBox');
    if (spot) { const out = spot.querySelector('#logoutBtn, #logout'); if (out) spot.insertBefore(b, out); else spot.appendChild(b); }
    else { b.classList.add('float'); document.body.appendChild(b); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  // "not an official school site" + privacy link at the bottom of every page
  const foot = () => {
    if (document.querySelector('.ec-foot') || location.pathname.startsWith('/admin')) return;
    const st = document.createElement('style');
    st.textContent = '.ec-foot{max-width:900px;margin:28px auto 0;padding:14px 16px calc(80px + env(safe-area-inset-bottom,0px));text-align:center;font-size:.875rem;line-height:1.6;color:var(--muted,#555);border-top:1px solid var(--rule,#ddd)}.ec-foot a{color:inherit;font-weight:600}';
    document.head.appendChild(st);
    const f = document.createElement('footer'); f.className = 'ec-foot';
    f.innerHTML = 'EC Revisions is made by a student. It is <b>not an official Emmanuel College website</b>. <a href="/privacy/">Privacy and safety</a>';
    document.body.appendChild(f);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', foot); else foot();
  // pop-up messages from Beau ("Message everyone") on every page
  ['/notice.js', '/study.js'].forEach(src => { const nj = document.createElement('script'); nj.src = src; nj.defer = true; document.head.appendChild(nj); });
})();
