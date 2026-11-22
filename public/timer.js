/* ⏲️ EC Revisions study timer: study for a while, take a short break, repeat (Charis's idea).
   It keeps running as you move between pages (saved in this browser), shows a small timer in the bottom-left corner,
   and chimes with a pop-up when it's time for a break or time to get back to it. Loaded on every page by theme.js.
   Study time on the leaderboard still only counts while you're actually studying on Maths, Science or English. */
(() => {
  if (window.ecTimer) return;
  const KEY = 'ec-timer';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const save = s => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } };
  let S = load(), pill = null, tick = null;
  const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const left = () => !S ? 0 : S.paused != null ? S.paused : Math.max(0, S.end - Date.now());
  const mmss = ms => { const s = Math.ceil(ms / 1000), m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };
  const css = document.createElement('style');
  css.textContent = `.ec-tmr{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:960;display:flex;align-items:center;gap:6px;background:var(--card,#fff);color:var(--ink,#111);border:2px solid var(--accent,#2453d6);border-radius:999px;padding:4px 6px 4px 12px;box-shadow:0 6px 20px rgb(0 0 0 / .18);font:inherit;font-weight:700}
.ec-tmr.brk{border-color:var(--good,#126b42)}
.ec-tmr .tm{font-variant-numeric:tabular-nums;font-size:1rem;cursor:pointer;background:none;border:0;color:inherit;font:inherit;padding:4px 2px}
.ec-tmr button.ic{width:34px;height:34px;border-radius:50%;border:0;background:var(--accent-soft,#e8eefc);color:var(--ink,#111);cursor:pointer;font-size:.95rem}
html.ec-has-tabs .ec-tmr{bottom:calc(74px + env(safe-area-inset-bottom,0px))}
@media (min-width:701px){html.ec-has-tabs .ec-tmr{bottom:calc(14px + env(safe-area-inset-bottom,0px))}}
.ec-tmr-pop{position:fixed;inset:0;z-index:2600;display:grid;place-items:center;padding:14px;background:rgb(10 14 30 / .55)}
.ec-tmr-box{width:min(100%,430px);background:var(--card,#fff);color:var(--ink,#111);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 50px rgb(0 0 0 / .3)}
.ec-tmr-box h2{margin:0;font-size:1.35rem}.ec-tmr-box p{margin:0}
.ec-tmr-opts{display:flex;flex-wrap:wrap;gap:6px}
.ec-tmr-opts button{font:inherit;font-size:.9375rem;font-weight:600;border-radius:999px;padding:6px 12px;border:1.5px solid var(--rule,#ccc);background:var(--card,#fff);color:var(--ink,#111);cursor:pointer}
.ec-tmr-opts button.sel{background:var(--accent,#2453d6);border-color:var(--accent,#2453d6);color:var(--accent-ink,#fff)}
.ec-tmr-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ec-tmr-big{font-size:2.6rem;font-weight:800;font-variant-numeric:tabular-nums;text-align:center}`;
  document.head.appendChild(css);
  function chime() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, 0.22, 0.44].forEach((d, i) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = [660, 880, 990][i]; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.0001, a.currentTime + d); g.gain.exponentialRampToValueAtTime(0.2, a.currentTime + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d + 0.35); o.start(a.currentTime + d); o.stop(a.currentTime + d + 0.4); }); } catch (e) { /* no sound */ } }
  function note(title, text) {
    chime(); const pop = mk('div', 'ec-tmr-pop'), box = mk('div', 'ec-tmr-box'); box.setAttribute('role', 'alertdialog');
    const ok = mk('button', 'btn', 'OK'); ok.type = 'button'; ok.onclick = () => pop.remove();
    const row = mk('div', 'ec-tmr-row'); row.appendChild(ok); box.append(mk('h2', '', title), mk('p', '', text), row); pop.appendChild(box); document.body.appendChild(pop); ok.focus();
  }
  function draw() {
    if (!S) { if (pill) { pill.remove(); pill = null; } return; }
    if (!pill) {
      pill = mk('div', 'ec-tmr'); pill.setAttribute('role', 'timer');
      const tm = mk('button', 'tm'); tm.type = 'button'; tm.title = 'Study timer'; tm.onclick = open;
      const pp = mk('button', 'ic pp'); pp.type = 'button'; pp.onclick = () => { if (S.paused != null) { S.end = Date.now() + S.paused; S.paused = null; } else { S.paused = left(); } save(S); draw(); };
      const st = mk('button', 'ic', '✕'); st.type = 'button'; st.title = 'Stop the timer'; st.setAttribute('aria-label', 'Stop the timer'); st.onclick = () => { S = null; save(null); draw(); };
      pill.append(tm, pp, st); document.body.appendChild(pill);
    }
    pill.classList.toggle('brk', S.phase === 'break');
    pill.querySelector('.tm').textContent = (S.phase === 'break' ? '☕ ' : '📚 ') + mmss(left()) + (S.rounds > 1 ? ' · ' + S.round + '/' + S.rounds : '');
    const pp = pill.querySelector('.pp'); pp.textContent = S.paused != null ? '▶' : '⏸'; pp.setAttribute('aria-label', S.paused != null ? 'Carry on' : 'Pause'); pp.title = pp.getAttribute('aria-label');
  }
  function step() {
    S = load(); // another tab may have changed it
    if (S && S.paused == null && Date.now() >= S.end) {
      if (S.phase === 'study') {
        if (S.round >= S.rounds) { save(null); S = null; note('🎉 Done!', 'You finished all your study rounds. Great work!'); }
        else { S.phase = 'break'; S.end = Date.now() + S.brk * 60000; save(S); note('☕ Break time!', 'Nice work. Take ' + S.brk + ' minutes: stretch, get some water, look away from the screen.'); }
      } else { S.phase = 'study'; S.round++; S.end = Date.now() + S.study * 60000; save(S); note('📚 Back to studying', 'Round ' + S.round + ' of ' + S.rounds + ': ' + S.study + ' minutes. You’ve got this!'); }
    }
    draw();
  }
  function open() {
    const pop = mk('div', 'ec-tmr-pop'), box = mk('div', 'ec-tmr-box'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Study timer');
    const close = () => pop.remove();
    box.appendChild(mk('h2', '', '⏲️ Study timer'));
    if (S) {
      box.append(mk('div', 'ec-tmr-big', (S.phase === 'break' ? '☕ ' : '📚 ') + mmss(left())), mk('p', '', (S.phase === 'break' ? 'Break' : 'Studying') + (S.rounds > 1 ? ', round ' + S.round + ' of ' + S.rounds : '') + (S.paused != null ? ' (paused)' : '') + '.'));
      const row = mk('div', 'ec-tmr-row'), stop = mk('button', 'btn quiet', 'Stop the timer'), ok = mk('button', 'btn', 'Close'); stop.type = ok.type = 'button';
      stop.onclick = () => { S = null; save(null); draw(); close(); }; ok.onclick = close; row.append(stop, ok); box.appendChild(row);
    } else {
      let study = 25, brk = 5, rounds = 4;
      box.appendChild(mk('p', 'small', 'Study for a set time, then take a short break. It keeps going as you move around the site, and chimes when it’s time to switch.'));
      const opt = (label, list, get, set, unit) => { box.appendChild(mk('b', '', label)); const r = mk('div', 'ec-tmr-opts'); list.forEach(v => { const b = mk('button', v === get() ? 'sel' : '', v + unit); b.type = 'button'; b.onclick = () => { set(v); [...r.children].forEach(x => x.classList.toggle('sel', x === b)); }; r.appendChild(b); }); box.appendChild(r); };
      opt('Study for', [15, 20, 25, 30, 45, 60], () => study, v => { study = v; }, ' min'); opt('Then a break of', [3, 5, 10, 15], () => brk, v => { brk = v; }, ' min'); opt('Rounds', [1, 2, 3, 4, 6], () => rounds, v => { rounds = v; }, '');
      const row = mk('div', 'ec-tmr-row'), cancel = mk('button', 'btn quiet', 'Cancel'), go = mk('button', 'btn', '▶ Start'); cancel.type = go.type = 'button';
      cancel.onclick = close; go.onclick = () => { S = { phase: 'study', end: Date.now() + study * 60000, study, brk, rounds, round: 1, paused: null }; save(S); draw(); close(); chime(); };
      row.append(cancel, go); box.appendChild(row);
    }
    pop.appendChild(box); pop.onclick = e => { if (e.target === pop) close(); };
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(pop); const f = box.querySelector('button'); if (f) f.focus();
  }
  window.ecTimer = { open, running: () => !!load() };
  const go = () => { step(); tick = setInterval(step, 1000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
