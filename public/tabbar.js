/* EC Revisions: a visible sliding bar under the tabs, so it's clear there are more tabs
   to the side. Drag it, tap the track, swipe the tabs, or use the mouse wheel over them. */
(() => {
  const nav = document.querySelector('nav.tabs'), tabs = document.getElementById('tabs');
  if (!nav || !tabs) return;
  const st = document.createElement('style');
  st.textContent = `.tabbar{max-width:1180px;margin:0 auto;padding:0 max(10px,env(safe-area-inset-right,0px)) 6px max(10px,env(safe-area-inset-left,0px));display:flex;align-items:center;gap:8px}
.tabbar[hidden]{display:none}
.tabbar-rail{position:relative;flex:1;height:8px;border-radius:999px;background:var(--line,#e2e8f2);cursor:pointer;touch-action:none}
.tabbar-thumb{position:absolute;top:0;left:0;height:100%;border-radius:999px;background:var(--accent,#2453d6);opacity:.75;cursor:grab;touch-action:none}
.tabbar-thumb:hover,.tabbar-thumb.drag{opacity:1}.tabbar-thumb.drag{cursor:grabbing}
.tabbar-arrow{flex:none;border:1px solid var(--rule,#c9d3e4);background:var(--card,#fff);color:var(--ink,#18202f);border-radius:999px;width:26px;height:22px;line-height:1;font-size:.8rem;cursor:pointer;padding:0}
.tabbar-arrow:disabled{opacity:.35;cursor:default}
@media print{.tabbar{display:none!important}}`;
  document.head.appendChild(st);
  const bar = document.createElement('div'); bar.className = 'tabbar';
  bar.innerHTML = '<button type="button" class="tabbar-arrow" data-d="-1" aria-label="Scroll tabs left">◀</button><div class="tabbar-rail" aria-hidden="true"><div class="tabbar-thumb"></div></div><button type="button" class="tabbar-arrow" data-d="1" aria-label="Scroll tabs right">▶</button>';
  nav.appendChild(bar);
  const rail = bar.querySelector('.tabbar-rail'), thumb = bar.querySelector('.tabbar-thumb'), [left, right] = bar.querySelectorAll('.tabbar-arrow');
  let tw = 0, thw = 0;
  function update() {
    const sw = tabs.scrollWidth, cw = tabs.clientWidth, max = sw - cw;
    bar.hidden = max <= 2; if (bar.hidden) return;
    tw = rail.clientWidth; thw = Math.max(36, tw * cw / sw);
    thumb.style.width = thw + 'px';
    thumb.style.transform = 'translateX(' + ((tw - thw) * (tabs.scrollLeft / max)) + 'px)';
    left.disabled = tabs.scrollLeft <= 1; right.disabled = tabs.scrollLeft >= max - 1;
  }
  const ratio = () => (tabs.scrollWidth - tabs.clientWidth) / Math.max(1, tw - thw);
  tabs.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (window.ResizeObserver) new ResizeObserver(update).observe(tabs);
  // drag the thumb
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); thumb.setPointerCapture(e.pointerId); thumb.classList.add('drag');
    const x0 = e.clientX, s0 = tabs.scrollLeft, r = ratio();
    const move = ev => { tabs.scrollLeft = s0 + (ev.clientX - x0) * r; };
    const up = () => { thumb.classList.remove('drag'); thumb.removeEventListener('pointermove', move); thumb.removeEventListener('pointerup', up); thumb.removeEventListener('pointercancel', up); };
    thumb.addEventListener('pointermove', move); thumb.addEventListener('pointerup', up); thumb.addEventListener('pointercancel', up);
  });
  // tap the track: jump there
  rail.addEventListener('pointerdown', e => { if (e.target === thumb) return; const x = e.clientX - rail.getBoundingClientRect().left - thw / 2; tabs.scrollTo({ left: x * ratio(), behavior: 'smooth' }); });
  // arrows: one screen of tabs at a time
  [left, right].forEach(b => b.onclick = () => tabs.scrollBy({ left: +b.dataset.d * tabs.clientWidth * 0.7, behavior: 'smooth' }));
  // mouse wheel over the tabs scrolls them sideways
  tabs.addEventListener('wheel', e => { if (bar.hidden || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; e.preventDefault(); tabs.scrollLeft += e.deltaY; }, { passive: false });
  update(); setTimeout(update, 300); if (document.fonts) document.fonts.ready.then(update);

  // "You are here": names the open tab, and for numbered topics shows Topic n of N with a row of pips
  const here = document.createElement('div'); here.className = 'here'; here.setAttribute('aria-live', 'polite');
  nav.appendChild(here);
  function where() {
    const all = Array.from(tabs.querySelectorAll('a')), on = tabs.querySelector('a.on'); if (!on) { here.hidden = true; return; }
    here.hidden = false;
    const topics = all.filter(a => a.querySelector('.tabn')), i = topics.indexOf(on);
    const name = Array.from(on.childNodes).filter(n => !(n.classList && n.classList.contains('tabn'))).map(n => n.textContent).join('').trim();
    if (i >= 0) {
      here.innerHTML = '<span>You are here: <b>Topic ' + (i + 1) + ' of ' + topics.length + '</b> · <b></b></span><span class="pips" aria-hidden="true">' + topics.map((a, j) => '<i class="' + (j < i ? 'done' : j === i ? 'now' : '') + '"></i>').join('') + '</span>';
      here.querySelectorAll('b')[1].textContent = name;
    } else { here.innerHTML = '<span>You are here: <b></b></span>'; here.querySelector('b').textContent = name; }
  }
  new MutationObserver(where).observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });
  where();
  // let sticky bars further down sit just under the tab bar, whatever its height
  const navH = () => document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
  if (window.ResizeObserver) new ResizeObserver(navH).observe(nav); else window.addEventListener('resize', navH);
  navH();
})();
