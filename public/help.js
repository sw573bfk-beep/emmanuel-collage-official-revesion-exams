/* EC Revisions: "Don't know how to use the site?" help panel and guided tour.
   Shared by the login page, Maths, Science and Feedback. */
(() => {
  const path = location.pathname;
  const PAGE = path.startsWith('/science') ? 'science' : path.startsWith('/maths') ? 'maths' : path.startsWith('/feedback') ? 'feedback' : 'start';
  const label = el => el && (el.closest('label') || el);

  // shared steps for the top bar of Maths and Science
  const topBar = [
    { h: 'Feedback', t: 'Found a mistake, got an idea or something confusing? Tap <b>Feedback</b> to tell Beau. Every message is read.', sel: '.top-tools a[href^="/feedback"]' },
    { h: 'Message Beau', t: 'A private chat with Beau. Ask anything about the site or your revision. A red number appears on the button when Beau replies.', sel: '.top-tools a[data-msg]' },
    { h: 'Switch subject', t: '<b>Subjects</b> takes you back to pick Maths or Science. Your progress in each one is kept.', sel: '.top-tools a[href="/"]' },
    { h: 'Your progress is saved', t: 'Everything you do is saved to your account, so it follows you to any phone or computer. Your name shows which account this tab is using, and under it it says when it last saved. To use another account, go to <b>Subjects</b> and tap <b>Switch account</b>.', sel: '.top-tools .acct' }
  ];
  const helpStep = { h: 'This help button', t: 'Tap this any time to see this help again or take the tour.', sel: '#ecHelpBtn' };

  const GUIDE = {
    start: {
      title: 'How to use EC Revisions',
      intro: 'EC Revisions helps you revise for the Year 8 Maths and Science exams. Here’s how it works.',
      steps: [
        { h: 'Make an account', t: 'New here? Tap <b>Create account</b>. Please use your real name. Already have one? Just log in. Your progress is saved to your account.', sel: '#authCard' },
        { h: 'Pick a subject', t: 'Once you’re logged in, pick <b>Maths</b> or <b>Science</b> to start studying.', sel: ['#pickView .card:has(a[href="/maths/"])', '#pickView a[href="/maths/"]'] },
        { h: 'More than one account', t: 'Tap <b>Switch account</b> to add another account or swap between them. Each tab can use a different account, so you can be logged into two at once.', sel: '#switchBtn' },
        { h: 'Send feedback', t: 'Found a mistake or have an idea? Tell Beau here.', sel: ['#pickView a.card[href="/feedback/"]', '#whoBox a[href="/feedback/"]'] },
        { h: 'Message Beau', t: 'A private chat with Beau. A red number appears on the button when Beau replies.', sel: ['#whoBox a[data-msg]', '#pickView a.card[data-msg]'] },
        { h: 'Account settings', t: 'Change your password or delete your account here.', sel: '#pickView details.acct' },
        helpStep
      ],
      extra: [
        { h: 'Forgot your password?', t: 'Ask Beau. Beau can reset it for you.' }
      ]
    },
    science: {
      title: 'How to use Science',
      intro: 'Everything for the Year 8 Chemistry exam. The quickest way to start: do <b>Today’s plan</b> on Home.',
      steps: [
        { h: 'The tabs', t: '<b>Home</b>, then one tab for each of the <b>9 topics</b>, then <b>Practice</b> and <b>Booklet</b>. On a phone, swipe the tabs sideways to see them all.', sel: '#tabs' },
        { h: 'Today’s plan', t: 'Three things to do each day: read a topic, get 5 questions right, then do a timed test. It picks the topic you need most. Ticks appear as you go.', sel: '.plan' },
        { h: 'Exam countdown', t: 'Put in your exam date and it counts down the days.', sel: '#examDate', get: label },
        { h: 'The 9 topics', t: 'Tap a topic to open everything for it. The bar shows how many you’ve got right.', sel: '.topic-btns' },
        { h: 'Tap a skill', t: 'In the skills checklist, tap any skill (the underlined writing) for a simple explanation and 3 quick questions. A <b>Back to home</b> button brings you back to the same spot.', sel: 'table.check .skill-link' },
        { h: 'Booklet links', t: 'The small blue links (like <b>R2</b> or <b>T1</b>) jump straight to that question in the workbook.', sel: 'table.check .reflink' },
        { h: 'How sure are you?', t: 'Tap <b>Not yet</b>, <b>Nearly</b> or <b>Got it</b> for each skill. Work on anything that isn’t “Got it” yet.', sel: 'table.check .conf' },
        { h: 'A topic tab', t: 'Each topic tab has the notes, an example, common mistakes, flashcards (tap to flip), key words and questions.', sel: '#tabs a[data-v="t1"]' },
        { h: 'Practice', t: 'Three ways to practise: <b>Mixed</b> (all topics), <b>One topic</b>, or a <b>Timed test</b> like the real exam.', sel: '#tabs a[data-v="practice"]' },
        { h: 'Booklet', t: 'The revision workbook questions and the graph task. Try a question, then check your answer.', sel: '#tabs a[data-v="booklet"]' },
        ...topBar, helpStep
      ],
      extra: [
        { h: 'Answering questions', t: 'Type your answer or tap a choice, then press <b>Check</b>. Stuck? Tap <b>Hint</b>, or <b>Show answer &amp; working</b> to see how it’s done.' },
        { h: 'Word equations', t: 'Type them like <b>magnesium + oxygen → magnesium oxide</b>. You can type <b>-&gt;</b> for the arrow.' }
      ]
    },
    maths: {
      title: 'How to use Maths',
      intro: 'Everything for the Year 8 Maths exam. The quickest way to start: follow the 3 steps on Home.',
      steps: [
        { h: 'The tabs', t: 'Each tab is a different way to study. On a phone, swipe the tabs sideways to see them all.', sel: '#tabs' },
        { h: 'Start here', t: 'Three steps: <b>Learn</b> a topic, <b>Practise</b> until you get 5 in a row, then <b>Test yourself</b>.', sel: '.start-steps' },
        { h: 'Short on time?', t: '<b>Need to know</b> has everything on one page, plus a question on every topic.', sel: ['.need-tip', '#tabs a[data-v="need"]'] },
        { h: 'Exam countdown', t: 'Put in your exam date and it counts down the days.', sel: '#examDate', get: label },
        { h: 'Skills checklist', t: 'Tap any skill (the underlined writing) for a simple explanation and practice questions, one at a time. Tap how sure you feel about each skill. The blue links jump to the matching booklet question.', sel: ['table.check .skill-link', 'table.check'] },
        { h: 'Test yourself', t: 'A timed practice exam. Nothing is marked until you finish.', sel: '#tabs a[data-v="exam"]' },
        { h: 'Tools', t: 'Change the numbers and the answer and working update straight away.', sel: '#tabs a[data-v="tools"]' },
        { h: 'Ask', t: 'Type any maths question and get the answer with every step.', sel: '#tabs a[data-v="ask"]' },
        { h: 'Flashcards and Maths words', t: 'Flip cards to test yourself, and look up what every maths word means.', sel: '#tabs a[data-v="cards"]' },
        ...topBar, helpStep
      ],
      extra: [
        { h: 'Answering questions', t: 'Type your answer and press <b>Check</b>. Stuck? Use the hint or show the answer to see every step.' }
      ]
    },
    feedback: {
      title: 'How to send feedback',
      intro: 'Tell Beau about a mistake, an idea or anything confusing. Every message is read.',
      steps: [
        { h: '1. What kind?', t: 'Pick what your feedback is: a mistake, an idea, and so on.', sel: '#kinds' },
        { h: '2. What is it about?', t: 'Pick the subject or part of the site.', sel: '#subjects' },
        { h: '3. Rate it', t: 'Give EC Revisions a star rating. This one is optional.', sel: '#stars' },
        { h: '4. Tell us more', t: 'Explain what happened. For a wrong question, copy the question in so Beau can find it.', sel: '#msg' },
        { h: 'Send it', t: 'Press <b>Send feedback</b>. Your name is sent with it so Beau can follow it up.', sel: '#send' },
        helpStep
      ],
      extra: []
    }
  };
  const G = GUIDE[PAGE];

  /* ---------- styles ---------- */
  const css = `
#ecHelpBtn{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:900;writing-mode:vertical-rl;text-orientation:sideways;rotate:180deg;font:600 .9rem/1.2 var(--f-body,system-ui,sans-serif);color:var(--accent-ink,#fff);background:var(--accent,#2453d6);border:0;border-radius:0 10px 10px 0;padding:14px 8px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.18)}
#ecHelpBtn:hover{filter:brightness(1.08)}#ecHelpBtn:focus-visible{outline:3px solid var(--ink,#111);outline-offset:2px}
#ecHelpBtn .s{display:none}
@media (max-width:640px){#ecHelpBtn{padding:10px 6px;font-size:.8rem}#ecHelpBtn .l{display:none}#ecHelpBtn .s{display:inline}}
.ech-panel{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);z-index:1000;background:var(--card,#fff);color:var(--ink,#18202f);box-shadow:-6px 0 30px rgba(0,0,0,.18);display:flex;flex-direction:column;font-family:var(--f-body,system-ui,sans-serif);transform:translateX(100%);transition:transform .25s ease;visibility:hidden}
.ech-panel.open{transform:none;visibility:visible}
.ech-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:18px 18px 12px;border-bottom:1px solid var(--line,#e2e8f2)}
.ech-head h2{margin:0;font-family:var(--f-display,inherit);font-size:1.3rem;line-height:1.25}
.ech-x{border:1px solid var(--rule,#c9d3e4);background:var(--card,#fff);color:inherit;border-radius:8px;width:34px;height:34px;font-size:1.2rem;line-height:1;cursor:pointer;flex:none}
.ech-body{overflow-y:auto;padding:14px 18px 22px;display:flex;flex-direction:column;gap:12px}
.ech-body p{margin:0;line-height:1.55}
.ech-tour{font:600 1rem var(--f-body,system-ui,sans-serif);background:var(--accent,#2453d6);color:var(--accent-ink,#fff);border:0;border-radius:10px;padding:12px 16px;cursor:pointer}
.ech-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ech-item{border:1px solid var(--line,#e2e8f2);border-radius:10px;padding:10px 12px}
.ech-item h3{margin:0 0 3px;font-size:1rem}
.ech-item p{font-size:.95rem;color:var(--ink,#18202f)}
.ech-show{margin-top:6px;font:600 .85rem var(--f-body,system-ui,sans-serif);color:var(--accent,#2453d6);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.ech-small{font-size:.85rem;color:var(--muted,#566077)}
.ech-ring{position:fixed;z-index:1001;border-radius:10px;box-shadow:0 0 0 4px var(--accent,#2453d6),0 0 0 9999px rgba(10,15,30,.55);pointer-events:none;transition:all .2s ease}
.ech-bubble{position:fixed;z-index:1002;width:min(330px,calc(100vw - 24px));background:var(--card,#fff);color:var(--ink,#18202f);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3);padding:14px 16px;font-family:var(--f-body,system-ui,sans-serif)}
.ech-bubble h3{margin:0 0 4px;font-size:1.05rem}.ech-bubble p{margin:0 0 10px;line-height:1.5;font-size:.95rem}
.ech-nav{display:flex;align-items:center;gap:8px;justify-content:space-between}
.ech-nav .n{font-size:.82rem;color:var(--muted,#566077)}
.ech-nav button{font:600 .9rem var(--f-body,system-ui,sans-serif);border-radius:8px;padding:7px 12px;cursor:pointer;border:1px solid var(--rule,#c9d3e4);background:var(--card,#fff);color:inherit}
.ech-nav button.go{background:var(--accent,#2453d6);border-color:var(--accent,#2453d6);color:var(--accent-ink,#fff)}
.ech-block{position:fixed;inset:0;z-index:1000}
@media print{#ecHelpBtn,.ech-panel,.ech-ring,.ech-bubble,.ech-block{display:none!important}}
@media (prefers-reduced-motion:reduce){.ech-panel,.ech-ring{transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const mk = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const btn = mk('<button type="button" id="ecHelpBtn" aria-haspopup="dialog" aria-controls="ecHelpPanel"><span class="l">Don’t know how to use the site?</span><span class="s">Help ?</span></button>');
  const panel = mk('<aside class="ech-panel" id="ecHelpPanel" role="dialog" aria-modal="false" aria-labelledby="ecHelpTitle" tabindex="-1"></aside>');
  const items = [...G.steps.filter(s => s !== helpStep).map((s, i) => ({ ...s, i })), ...G.extra];
  panel.innerHTML = '<div class="ech-head"><div><span class="ech-small">Help</span><h2 id="ecHelpTitle">' + G.title + '</h2></div><button type="button" class="ech-x" aria-label="Close help">×</button></div>' +
    '<div class="ech-body"><p>' + G.intro + '</p><button type="button" class="ech-tour">Show me around (tour)</button>' +
    '<ul class="ech-list">' + items.map(s => '<li class="ech-item"><h3>' + s.h + '</h3><p>' + s.t + '</p>' + (s.sel ? '<button type="button" class="ech-show" data-i="' + s.i + '">Show me where</button>' : '') + '</li>').join('') + '</ul>' +
    '<p class="ech-small">Still stuck? Use Feedback to ask Beau.</p><button type="button" class="ech-tour ech-done" style="background:var(--card,#fff);color:var(--ink,#18202f);border:1px solid var(--rule,#c9d3e4)">Got it, close help</button></div>';
  document.body.append(btn, panel);

  let lastFocus = null;
  const openPanel = () => { lastFocus = document.activeElement; panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); setTimeout(() => panel.querySelector('.ech-x').focus(), 50); };
  const closePanel = (restore = true) => { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (restore && lastFocus && lastFocus.focus) lastFocus.focus(); };
  btn.onclick = () => panel.classList.contains('open') ? closePanel() : openPanel();
  panel.querySelector('.ech-x').onclick = () => closePanel();
  panel.querySelector('.ech-done').onclick = () => closePanel();
  panel.querySelector('.ech-tour').onclick = () => { closePanel(false); tour(0); };
  panel.querySelectorAll('.ech-show').forEach(b => b.onclick = () => { closePanel(false); tour(+b.dataset.i, true); });

  /* ---------- tour ---------- */
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const find = s => { for (const q of [].concat(s.sel)) { let el = null; try { el = document.querySelector(q); } catch (e) { } if (s.get) el = s.get(el); if (visible(el)) return el; } return null; };
  let T = null;
  function endTour() {
    if (!T) return; T.ring.remove(); T.bubble.remove(); T.block.remove();
    window.removeEventListener('resize', T.place); window.removeEventListener('scroll', T.place, true); document.removeEventListener('keydown', T.key);
    T = null; btn.focus();
  }
  async function tour(start, single) {
    endTour();
    if ((PAGE === 'science' || PAGE === 'maths') && location.hash.slice(1) !== 'home' && location.hash !== '') { location.hash = 'home'; await new Promise(r => setTimeout(r, 450)); }
    const list = G.steps.map(s => ({ s, el: find(s) })).filter(x => x.el);
    const target = G.steps[start]; let i = Math.max(0, list.findIndex(x => x.s === target));
    if (!list.length) return;
    const ring = mk('<div class="ech-ring"></div>'), bubble = mk('<div class="ech-bubble" role="dialog" aria-live="polite" tabindex="-1"></div>'), block = mk('<div class="ech-block"></div>');
    document.body.append(block, ring, bubble);
    T = { ring, bubble, block };
    T.place = () => {
      const el = list[i].el, r = el.getBoundingClientRect(), pad = 6;
      Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight, vw = innerWidth, vh = innerHeight;
      let top = r.bottom + 14; if (top + bh > vh - 10) top = r.top - bh - 14; if (top < 10) top = Math.min(vh - bh - 10, Math.max(10, r.top + 10));
      let left = r.left + r.width / 2 - bw / 2; left = Math.max(12, Math.min(vw - bw - 12, left));
      if (r.right > vw - 40 && r.width < 80) left = Math.max(12, r.left - bw - 16), top = Math.max(10, Math.min(vh - bh - 10, r.top + r.height / 2 - bh / 2));
      Object.assign(bubble.style, { left: left + 'px', top: top + 'px' });
    };
    const showStep = () => {
      const { s, el } = list[i]; const last = single || i === list.length - 1;
      bubble.innerHTML = '<h3>' + s.h + '</h3><p>' + s.t + '</p><div class="ech-nav"><span class="n">' + (single ? '' : (i + 1) + ' of ' + list.length) + '</span><span style="display:flex;gap:6px">' +
        (single ? '<button type="button" data-a="all">Full tour</button>' : (i > 0 ? '<button type="button" data-a="back">Back</button>' : '<button type="button" data-a="end">Skip</button>')) +
        '<button type="button" class="go" data-a="' + (last ? 'end' : 'next') + '">' + (last ? 'Done' : 'Next') + '</button></span></div>';
      bubble.querySelectorAll('button').forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'next') { i++; showStep(); } else if (a === 'back') { i--; showStep(); } else if (a === 'all') { single = false; i = 0; showStep(); } else endTour(); });
      const r = el.getBoundingClientRect();
      if (el.id !== 'ecHelpBtn' && (r.top < 70 || r.bottom > innerHeight - 140)) el.scrollIntoView({ block: r.height > innerHeight * 0.6 ? 'start' : 'center' });
      T.place(); setTimeout(() => T && T.place(), 60); bubble.querySelector('.go').focus();
    };
    T.key = e => { if (e.key === 'Escape') endTour(); else if (e.key === 'ArrowRight' && !single && i < list.length - 1) { i++; showStep(); } else if (e.key === 'ArrowLeft' && !single && i > 0) { i--; showStep(); } };
    block.onclick = endTour;
    window.addEventListener('resize', T.place); window.addEventListener('scroll', T.place, true); document.addEventListener('keydown', T.key);
    showStep();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open') && !T) closePanel(); });

  /* ---------- open once on a first visit ---------- */
  const KEY = 'ec-help-seen:' + PAGE;
  let seen = true; try { seen = !!localStorage.getItem(KEY); if (!seen) localStorage.setItem(KEY, '1'); } catch (e) { }
  if (!seen) setTimeout(() => { if (!T) openPanel(); }, PAGE === 'start' || PAGE === 'feedback' ? 600 : 1300);
  window.ecHelp = { open: openPanel, tour: () => tour(0) };
})();

/* Shared "Are you sure?" box, used by the Log out buttons. Resolves true or false. */
window.ecConfirm = ({ title = 'Are you sure?', text = '', yes = 'Yes', no = 'Cancel' } = {}) => new Promise(resolve => {
  if (!document.getElementById('ecConfirmCss')) {
    const st = document.createElement('style'); st.id = 'ecConfirmCss';
    st.textContent = `.ecc-back{position:fixed;inset:0;z-index:1100;background:rgba(10,15,30,.5);display:grid;place-items:center;padding:16px}
.ecc{width:min(380px,100%);background:var(--card,#fff);color:var(--ink,#18202f);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);padding:20px;font-family:var(--f-body,system-ui,sans-serif)}
.ecc h2{margin:0 0 6px;font-family:var(--f-display,inherit);font-size:1.25rem}.ecc p{margin:0 0 16px;line-height:1.5;color:var(--muted,#566077)}
.ecc .r{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.ecc button{font:600 1rem var(--f-body,system-ui,sans-serif);border-radius:10px;padding:10px 16px;cursor:pointer;border:1px solid var(--rule,#c9d3e4);background:var(--card,#fff);color:inherit}
.ecc button.y{background:var(--accent,#2453d6);border-color:var(--accent,#2453d6);color:var(--accent-ink,#fff)}`;
    document.head.appendChild(st);
  }
  const back = document.createElement('div'); back.className = 'ecc-back';
  back.innerHTML = '<div class="ecc" role="alertdialog" aria-modal="true" aria-labelledby="eccT" aria-describedby="eccP"><h2 id="eccT"></h2><p id="eccP"></p><div class="r"><button type="button" class="n"></button><button type="button" class="y"></button></div></div>';
  back.querySelector('h2').textContent = title; back.querySelector('p').textContent = text; back.querySelector('.n').textContent = no; back.querySelector('.y').textContent = yes;
  const prev = document.activeElement;
  const done = v => { document.removeEventListener('keydown', key, true); back.remove(); if (prev && prev.focus) prev.focus(); resolve(v); };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); done(false); } else if (e.key === 'Tab') { const b = [...back.querySelectorAll('button')]; const i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length].focus(); } };
  back.querySelector('.n').onclick = () => done(false); back.querySelector('.y').onclick = () => done(true);
  back.onclick = e => { if (e.target === back) done(false); };
  document.addEventListener('keydown', key, true); document.body.appendChild(back); back.querySelector('.n').focus();
});
window.ecConfirmLogout = () => window.ecConfirm({ title: 'Log out?', text: 'Are you sure you want to log out? Your progress is saved to your account. (Want to be in two accounts at once? Use Switch account on the Subjects page instead.)', yes: 'Yes, log out', no: 'Stay logged in' });
