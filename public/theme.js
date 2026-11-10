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
})();
