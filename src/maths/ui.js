/* ================= small UI helpers ================= */
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
const state = { learn: store.get('learnTopic', '7I'), practice: 'mix', tool: 'solver', bkPart: 'A' };
const tstats = store.get('tstats', {});
function record(topic, ok) { const s = tstats[topic] || (tstats[topic] = { a: 0, c: 0 }); s.a++; if (ok) s.c++; store.set('tstats', tstats); }
const acc = tid => { const s = tstats[tid]; return s && s.a ? s.c / s.a : null; };
const canStore = store.get('can', {});
const ckStore = store.get('check', {});
const bkMarks = store.get('bk', {});
function solHTML(Q) { return '<div class="sol"><div class="sol-title">Working</div>' + stepsHTML(Q.sol || []) + '</div>'; }
const KEYS = { ineq: ['<', '>', '≤', '≥', '−'], num: ['−', '/', '.', '$', '%'], coord: ['(', ')', ',', '−'], rule: ['=', 'x', '−', '/', '(', ')'], frac: ['/', '−'], nums: [',', '−', '.'], text: ['∠', '△'] };
function keypad(input, type) {
  const k = h('<div class="keys" aria-label="Symbol keys"></div>');
  (KEYS[type] || []).forEach(c => { const b = h('<button type="button" tabindex="-1">' + esc(c) + '</button>'); b.onclick = () => { const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s; input.value = input.value.slice(0, s) + c + input.value.slice(e); input.focus(); input.setSelectionRange(s + c.length, s + c.length); }; k.appendChild(b); });
  return k;
}
const PH = { ineq: 'e.g. x > 4', num: 'e.g. 12.5 or 7/4', coord: 'e.g. (3, −2)', rule: 'e.g. y = 3x + 5', frac: 'e.g. 7/20', nums: 'e.g. −5, −3, −1', text: 'e.g. QR' };

/* ================= question card ================= */
function questionCard(Q, opts = {}) {
  const el = h('<div class="qcard"></div>');
  el.innerHTML = '<div class="qhead"><span class="row" style="gap:6px"><span class="tag">' + Q.topic + '</span><span class="small muted">' + esc(Q.gname || '') + '</span></span>' + (opts.num ? '<span class="small muted">Q' + opts.num + '</span>' : '') + '</div>' +
    '<div class="qtext">' + Q.q + '</div>' + (Q.fig ? '<div class="qfig">' + Q.fig + '</div>' : '') + '<div class="qans stack"></div><div class="qfb stack" aria-live="polite"></div>';
  const ansEl = $('.qans', el), fb = $('.qfb', el); let sel = null, input = null, tries = 0;
  const exam = opts.mode === 'exam';
  if (Q.type === 'mcq') {
    const box = h('<div class="choices"></div>');
    Q.choices.forEach((c, i) => { const b = h('<button type="button" class="choice"><span class="lt">' + 'ABCDE'[i] + '</span>' + c + '</button>'); b.onclick = () => { if (el.dataset.done) return; sel = i; $$('.choice', box).forEach((x, j) => x.classList.toggle('sel', j === i)); if (!exam) doCheck(); else opts.onChange && opts.onChange(); }; box.appendChild(b); });
    ansEl.appendChild(box);
  } else {
    const id = 'in' + (++svgN);
    const row = h('<div class="row"><label class="sr" for="' + id + '">Your answer</label><input class="ans" type="text" id="' + id + '" autocomplete="off" spellcheck="false" placeholder="' + (PH[Q.type] || '') + '"></div>');
    input = $('input', row); ansEl.appendChild(row);
    if (!exam) { const cb = h('<button type="button" class="btn">Check</button>'); cb.onclick = doCheck; row.appendChild(cb); input.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(); }); }
    else input.addEventListener('input', () => opts.onChange && opts.onChange());
    ansEl.appendChild(keypad(input, Q.type));
  }
  if (!exam) {
    const tools = h('<div class="row"></div>');
    if (Q.hint) { const hb = h('<button type="button" class="btn ghost sm">Hint</button>'); hb.onclick = () => { if (!$('.hintbox', fb)) fb.prepend(h('<div class="fb info hintbox"><b>Hint:</b> ' + Q.hint + '</div>')); }; tools.appendChild(hb); }
    const sb = h('<button type="button" class="btn ghost sm">Show answer &amp; working</button>'); sb.onclick = () => finalize({ ok: false, gaveUp: true }); tools.appendChild(sb);
    ansEl.appendChild(tools);
  }
  function doCheck() {
    if (el.dataset.done) return;
    const r = checkAnswer(Q, Q.type === 'mcq' ? sel : input.value);
    if (r.empty || r.bad) { $('.tmp', fb)?.remove(); fb.appendChild(h('<div class="fb info tmp">' + r.msg + '</div>')); return; }
    tries++;
    if (r.ok || tries >= 2 || Q.type === 'mcq') return finalize(r);
    $('.tmp', fb)?.remove();
    fb.appendChild(h('<div class="fb bad tmp"><b>Not quite.</b> ' + (r.msg ? r.msg + ' ' : '') + 'Have another go, or tap “Show answer &amp; working”.</div>'));
  }
  function finalize(r) {
    if (el.dataset.done) return r; el.dataset.done = '1'; $('.tmp', fb)?.remove();
    if (r.empty) r = { ok: false, msg: 'No answer given.' };
    if (Q.type === 'mcq') $$('.choice', el).forEach((b, i) => { b.disabled = true; if (i === Q.ans) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); });
    if (input) input.readOnly = true;
    const msg = r.ok ? '<b>Correct!</b>' + (tries > 1 ? ' (second try)' : '') : (r.gaveUp ? '<b>Answer:</b> ' : '<b>Not this time.</b> ' + (r.msg ? esc(r.msg) + ' ' : '') + 'Answer: ') + (r.ok ? '' : '<span class="m">' + esc(Q.ansText) + '</span>');
    fb.appendChild(h('<div class="fb ' + (r.ok ? 'good' : 'bad') + '">' + msg + '</div>'));
    if (r.ok) { const d = h('<details class="ex"><summary>Show the working</summary></details>'); d.insertAdjacentHTML('beforeend', solHTML(Q)); fb.appendChild(d); }
    else fb.insertAdjacentHTML('beforeend', solHTML(Q));
    if (opts.onAnswer) opts.onAnswer(!!r.ok && (exam || tries <= 1), false, tries);
    return r;
  }
  return { el, finalize: () => finalize(checkAnswer(Q, Q.type === 'mcq' ? sel : (input ? input.value : ''))), answered: () => Q.type === 'mcq' ? sel !== null : !!(input && input.value.trim()), value: () => Q.type === 'mcq' ? (sel === null ? '' : Q.choices[sel]) : (input ? input.value : ''), focus: () => input && input.focus() };
}

/* ================= router ================= */
const VIEWS = ['home', 'need', 'learn', 'practice', 'booklet', 'exam', 'tools', 'ask', 'cards', 'glossary', 'skill'];
const RENDER = {}; const rendered = {};
function show(view, force) {
  if (!VIEWS.includes(view)) view = 'home';
  $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + view; });
  $$('#tabs a').forEach(a => { const on = a.dataset.v === view; a.classList.toggle('on', on); if (on) { a.setAttribute('aria-current', 'page'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } else a.removeAttribute('aria-current'); });
  if (!rendered[view] || force || view === 'home') { RENDER[view](); rendered[view] = true; }
}
function go(view, after) {
  if (location.hash.slice(1) === view) show(view, true); else { rendered[view] = false; location.hash = view; }
  if (after) setTimeout(after, 60);
}
window.addEventListener('hashchange', () => { show(location.hash.slice(1)); window.scrollTo(0, 0); });

/* ================= HOME ================= */
function confButtons(key, storeObj, storeName, labels = ['Not yet', 'Nearly', 'Got it']) {
  const v = storeObj[key];
  const box = h('<span class="conf" role="group" aria-label="How confident are you?"></span>');
  labels.forEach((l, i) => { const b = h('<button type="button" data-c="' + i + '" aria-pressed="' + (v === i) + '">' + l + '</button>'); if (v === i) b.classList.add('on'); b.onclick = () => { storeObj[key] = storeObj[key] === i ? undefined : i; store.set(storeName, storeObj); $$('button', box).forEach((x, j) => { x.classList.toggle('on', storeObj[key] === j); x.setAttribute('aria-pressed', storeObj[key] === j); }); }; box.appendChild(b); });
  return box;
}
function bkRefLinks(ref) {
  const out = h('<span></span>');
  ref.split(', ').forEach((r, i) => {
    if (i) out.appendChild(document.createTextNode(', '));
    const first = r.split('–')[0];
    const b = h('<button type="button" class="reflink">' + r + '</button>'); b.onclick = () => openBooklet(first); out.appendChild(b);
  });
  return out;
}
function openBooklet(id) {
  const q = BOOKLET.find(x => x.id === id) || BOOKLET.find(x => x.part === id[0]);
  state.bkPart = q ? q.part : 'A';
  go('booklet', () => { const t = document.getElementById('bk-' + id); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.animate?.([{ outline: '3px solid var(--accent)' }, { outline: '3px solid transparent' }], { duration: 1600 }); } });
}
/* ---------- one skill (opened from the checklist): explanation, then one question at a time ---------- */
const SKILLS = CHECKLIST.flatMap(c => c[1].map(it => [c[0], ...it]));
function openSkill(i) { state.skill = i; store.set('skillOpen', i); go('skill'); }
function backHome(i) { state.ckReturn = i; go('home'); }
RENDER.skill = () => {
  const v = $('#v-skill'); v.innerHTML = '';
  let i = state.skill ?? store.get('skillOpen', 0); if (!(i >= 0 && i < SKILLS.length)) i = 0;
  const [sec, skill, ref, tid] = SKILLS[i], info = SKILL_INFO[i], t = TOPIC[tid];
  const back = h('<button type="button" class="btn quiet sm" style="align-self:flex-start">← Back to home</button>'); back.onclick = () => backHome(i);
  v.appendChild(back);
  v.appendChild(h('<div class="view-head"><span class="eyebrow">' + sec + '</span><h2>' + skill.replace(/^I can (.)/, (_, c) => c.toUpperCase()) + '</h2></div>'));
  v.appendChild(h('<div class="card stack"><h3>In simple words</h3><div class="skill-x">' + info.x + '</div><div class="skill-eg"><b>Example:</b> ' + info.eg + '</div></div>'));
  const qc = h('<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Try a question</h3><span class="small muted skill-score"></span></div><div class="skill-q"></div><div class="row"><button type="button" class="btn" data-next>Next question →</button></div></div>');
  let n = 0, done = 0, right = 0, last = '';
  const upd = () => { $('.skill-score', qc).textContent = done ? right + ' right out of ' + done : 'Question ' + n; };
  const next = () => {
    let Q; for (let k = 0; k < 12; k++) { Q = makeQ(pick(info.g)); if (Q.q !== last) break; } last = Q.q; n++;
    const host = $('.skill-q', qc); host.innerHTML = '';
    host.appendChild(questionCard(Q, { num: n, onAnswer: (ok, partial) => { if (partial) return; record(tid, ok); done++; if (ok) right++; upd(); } }).el);
    upd();
  };
  $('[data-next]', qc).onclick = () => { next(); const inp = $('.skill-q input', qc); if (inp) inp.focus(); };
  next(); v.appendChild(qc);
  const cf = h('<div class="card stack"><h3>How sure are you now?</h3><p class="small muted">This updates the skills checklist on Home.</p><div class="cf-host"></div></div>');
  $('.cf-host', cf).appendChild(confButtons('k' + i, ckStore, 'check'));
  v.appendChild(cf);
  const more = h('<p class="small muted">Want more? <button type="button" class="reflink" data-learn>Learn ' + tid + (t ? ': ' + t.name : '') + '</button>, or try the booklet questions: </p>');
  $('[data-learn]', more).onclick = () => openLearn(tid); more.appendChild(bkRefLinks(ref));
  v.appendChild(more);
  const big = h('<button type="button" class="btn skill-home">← Back to home</button>'); big.onclick = () => backHome(i);
  v.appendChild(big);
};
function openPractice(tid) { state.practice = tid; go('practice'); }
function openLearn(tid) { state.learn = tid; store.set('learnTopic', tid); go('learn'); }
function openTool(t) { state.tool = t; go('tools'); }
RENDER.home = () => {
  const v = $('#v-home'); v.innerHTML = '';
  const totalA = Object.values(tstats).reduce((s, x) => s + x.a, 0), totalC = Object.values(tstats).reduce((s, x) => s + x.c, 0);
  const allParts = BOOKLET.flatMap(q => q.mcq ? q.mcq.map((_, i) => 'D' + (i + 1)) : q.parts.map(p => q.id + p.l));
  const bkDone = allParts.filter(k => bkMarks[k] !== undefined).length, bkRight = allParts.filter(k => bkMarks[k] === 1).length;
  const ckItems = CHECKLIST.flatMap(c => c[1]); const ckGot = ckItems.filter((_, i) => ckStore['k' + i] === 2).length;
  const examDate = store.get('examDate', '');
  let days = null; if (examDate) { const d = new Date(examDate + 'T09:00'); days = Math.ceil((d - new Date()) / 864e5); }
  const start = h(`<div class="card stack">
    <h2>Start here</h2>
    <p class="need-tip">Short on time? <button type="button" class="btn sm" data-go="need">Need to know</button> has everything on one page, plus a question on every topic.</p>
    <ol class="start-steps">
      <li><span class="n">1</span><div class="stack" style="gap:6px"><h3>Learn</h3><p>Pick a topic and read the quick version.</p><button type="button" class="btn" data-go="learn">Learn a topic</button></div></li>
      <li><span class="n">2</span><div class="stack" style="gap:6px"><h3>Practise</h3><p>Answer questions until you can get 5 in a row.</p><button type="button" class="btn" data-go="practice-mix">Practise</button></div></li>
      <li><span class="n">3</span><div class="stack" style="gap:6px"><h3>Test yourself</h3><p>Do the revision booklet, then a timed practice exam.</p><div class="row"><button type="button" class="btn" data-go="booklet">Booklet</button><button type="button" class="btn ghost" data-go="exam">Practice exam</button></div></div></li>
    </ol>
    <p class="small muted">Stuck on a question? Use <button type="button" class="reflink" data-go="ask">Ask a question</button> to see every step.</p>
  </div>`);
  v.appendChild(start);
  const stats = h(`<div class="card row" style="justify-content:space-between;gap:18px">
    <div class="row" style="gap:22px">
      <div><div class="bignum" style="font-size:1.6rem">${totalA ? Math.round(totalC / totalA * 100) + '%' : '—'}</div><div class="small muted">practice right (${totalA} done)</div></div>
      <div><div class="bignum" style="font-size:1.6rem">${bkRight}/${allParts.length}</div><div class="small muted">booklet right</div></div>
      <div><div class="bignum" style="font-size:1.6rem">${ckGot}/${ckItems.length}</div><div class="small muted">skills “Got it”</div></div>
    </div>
    <label class="f">${days === null ? 'When is your exam?' : days < 0 ? 'Exam date has passed' : '<b style="color:var(--ink);font-size:1.05rem">' + days + (days === 1 ? ' day' : ' days') + ' until your exam</b>'}<input type="date" id="examDate" value="${examDate}"></label>
  </div>`);
  v.appendChild(stats);
  $$('[data-go]', start).forEach(b => b.onclick = () => { const g = b.dataset.go; if (g === 'practice-mix') openPractice('mix'); else go(g); });
  $('#examDate', stats).onchange = e => { store.set('examDate', e.target.value); RENDER.home(); };

  // topic progress
  const prog = h('<div class="card stack"><div class="row" style="justify-content:space-between"><h3>All topics</h3><span class="small muted">Tap a topic to learn it. The bar shows how many you’ve got right.</span></div><div class="grid2" id="unitGrid"></div></div>');
  UNITS.forEach(u => {
    const box = h('<div class="stack" style="gap:8px"><div><span class="eyebrow">' + u.ch + '</span><h4>' + u.name + '</h4></div><div class="unit-prog"></div></div>');
    TOPICS.filter(t => t.unit === u.id).forEach(t => {
      const a = acc(t.id), s = tstats[t.id];
      const left = h('<div><button type="button" class="reflink" style="font-family:var(--f-body);font-size:.92rem;text-decoration:none;color:var(--ink);text-align:left"><span class="tag">' + t.id + '</span> ' + t.name + '</button><div class="bar ' + (a !== null && a >= 0.8 ? 'good' : '') + '" style="margin-top:4px"><i style="width:' + (a === null ? 0 : Math.round(a * 100)) + '%"></i></div></div>');
      $('button', left).onclick = () => openLearn(t.id);
      box.lastChild.appendChild(left);
      box.lastChild.appendChild(h('<span class="small muted" style="font-variant-numeric:tabular-nums">' + (s ? Math.round(a * 100) + '% of ' + s.a : 'not started') + '</span>'));
    });
    $('#unitGrid', prog).appendChild(box);
  });
  v.appendChild(prog);

  // checklist
  const ck = h('<div class="card stack"><div class="stack" style="gap:4px"><h3>Skills checklist</h3><p class="muted small">From the revision booklet. <b>Tap a skill</b> for a simple explanation and practice questions. Tap how sure you feel about each skill. Work on anything that isn’t “Got it” yet.</p></div><div class="scroll-x"><table class="check"><thead><tr><th>Skill</th><th>Practise with</th><th>Confidence</th><th></th></tr></thead><tbody></tbody></table></div></div>');
  const tb = $('tbody', ck); let idx = 0;
  CHECKLIST.forEach(([sec, items]) => {
    tb.appendChild(h('<tr class="sec"><td colspan="4">' + sec + '</td></tr>'));
    items.forEach(([skill, ref, tid]) => {
      const i = idx++; const tr = h('<tr id="ck-' + i + '"><td><button type="button" class="skill-link" title="Tap for a simple explanation and practice questions">' + skill + '</button></td><td></td><td></td><td></td></tr>');
      $('.skill-link', tr).onclick = () => openSkill(i);
      tr.children[1].appendChild(bkRefLinks(ref)); tr.children[2].appendChild(confButtons('k' + i, ckStore, 'check'));
      const pb = h('<button type="button" class="btn quiet sm">Practise ' + tid + '</button>'); pb.onclick = () => openPractice(tid); tr.children[3].appendChild(pb);
      tb.appendChild(tr);
    });
  });
  v.appendChild(ck);
  if (state.ckReturn != null) { const r = state.ckReturn; state.ckReturn = null; setTimeout(() => { const row = document.getElementById('ck-' + r); if (row) { row.scrollIntoView({ block: 'center' }); row.classList.add('ck-flash'); setTimeout(() => row.classList.remove('ck-flash'), 1800); } }, 80); }

  const tips = h(`<div class="row"><button type="button" class="btn quiet sm" id="resetAll">Reset all my progress</button><span class="small muted" id="resetMsg"></span></div>`);
  let armed = false;
  $('#resetAll', tips).onclick = () => {
    if (!armed) { armed = true; $('#resetMsg', tips).textContent = 'Tap again to erase practice stats, booklet marks, checklist and flashcards.'; $('#resetAll', tips).textContent = 'Yes, reset everything'; return; }
    ['tstats', 'can', 'check', 'bk', 'exams', 'cards'].forEach(k => store.set(k, k === 'exams' ? [] : {}));
    Object.keys(tstats).forEach(k => delete tstats[k]); Object.keys(canStore).forEach(k => delete canStore[k]); Object.keys(ckStore).forEach(k => delete ckStore[k]); Object.keys(bkMarks).forEach(k => delete bkMarks[k]);
    toast('Progress reset'); Object.keys(rendered).forEach(k => rendered[k] = false); RENDER.home();
  };
  v.appendChild(tips);
};

/* ================= LEARN ================= */
RENDER.learn = () => {
  const v = $('#v-learn'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Learn</h2><p>Pick a topic. Read the quick version, look at an example, then try a question.</p></div>'));
  const wrap = h('<div class="learn"><nav class="toc card" aria-label="Topics"></nav><div class="stack" style="min-width:0"><select class="toc-select" id="tocSel" aria-label="Choose a topic"></select><div id="learnBody" class="stack"></div></div></div>');
  const toc = $('.toc', wrap), sel = $('#tocSel', wrap);
  UNITS.forEach(u => {
    toc.appendChild(h('<h4>' + u.name + '</h4>'));
    const og = h('<optgroup label="' + u.name + '"></optgroup>');
    TOPICS.filter(t => t.unit === u.id).forEach(t => {
      const b = h('<button type="button" data-t="' + t.id + '"><span class="tag">' + t.id + '</span><span>' + t.name + '</span></button>'); b.onclick = () => showTopic(t.id); toc.appendChild(b);
      og.appendChild(h('<option value="' + t.id + '">' + t.id + ' · ' + t.name + '</option>'));
    });
    sel.appendChild(og);
  });
  sel.onchange = () => showTopic(sel.value);
  v.appendChild(wrap);
  function showTopic(id) {
    state.learn = id; store.set('learnTopic', id); sel.value = id;
    $$('button', toc).forEach(b => b.classList.toggle('on', b.dataset.t === id));
    const t = TOPIC[id]; const body = $('#learnBody', wrap); body.innerHTML = '';
    const head = h('<div class="card stack"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">' + UNITS.find(u => u.id === t.unit).name + '</span><h2><span class="pen">' + t.id + '</span> ' + t.name + '</h2></div><div class="row"></div></div></div>');
    const btns = $('.row .row', head) || head.querySelector('.row > .row');
    const pb = h('<button type="button" class="btn">Practise ' + t.id + '</button>'); pb.onclick = () => openPractice(t.id); btns.appendChild(pb);
    if (t.tool) { const tb = h('<button type="button" class="btn ghost">Open tool</button>'); tb.onclick = () => openTool(t.tool); btns.appendChild(tb); }
    body.appendChild(head);
    const Qk = QUICK[id];
    if (Qk) body.appendChild(h('<div class="card quick stack"><span class="eyebrow">The quick version</span><p class="quick-what">' + Qk.what + '</p><ol class="quick-steps">' + Qk.steps.map(x => '<li>' + x + '</li>').join('') + '</ol><p class="quick-eg"><b>Example:</b> <span class="m">' + Qk.eg + '</span></p></div>'));
    const exs = h('<div class="card stack"><h3>Worked examples</h3><p class="small muted">Tap an example to see every step.</p></div>');
    t.ex.forEach(e => { const d = h('<details class="ex"><summary>' + e.q + '</summary></details>'); d.insertAdjacentHTML('beforeend', stepsHTML(e.s)); exs.appendChild(d); });
    body.appendChild(exs);
    if (t.mistakes) body.appendChild(h('<div class="card stack"><h3>Watch out for</h3>' + t.mistakes.map(m => '<p class="mistake">' + m + '</p>').join('') + '</div>'));
    const qc = h('<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Try one</h3><button type="button" class="btn quiet sm">New question</button></div><div class="qhost"></div></div>');
    const load = () => { const host = $('.qhost', qc); host.innerHTML = ''; const Q = makeQ(pick(TOPIC_GENS[id])); host.appendChild(questionCard(Q, { onAnswer: (ok, partial) => { if (!partial) record(id, ok); } }).el); };
    $('button', qc).onclick = load; load(); body.appendChild(qc);
    const more = h('<details class="card more"><summary><b>More detail</b> <span class="muted small">All the rules, tables and diagrams for this topic</span></summary><div class="notes" style="margin-top:12px"></div></details>');
    $('.notes', more).insertAdjacentHTML('beforeend', t.notes()); body.appendChild(more);
    const rate = h('<div class="card stack"><h3>How confident are you?</h3><p class="small muted">Tap one for each. Your answers are saved.</p></div>');
    const cans = h('<ul class="cans"></ul>'); t.cans.forEach((c, i) => { const li = h('<li><span>I can ' + c.charAt(0).toLowerCase() + c.slice(1) + '</span></li>'); li.appendChild(confButtons(t.id + ':' + i, canStore, 'can')); cans.appendChild(li); });
    rate.appendChild(cans);
    if (t.bk.length) { const r = h('<p class="small">Booklet questions on this topic: </p>'); r.appendChild(bkRefLinks(t.bk.join(', '))); rate.appendChild(r); }
    body.appendChild(rate);
    const nav = h('<div class="row" style="justify-content:space-between"></div>'); const i = TOPICS.findIndex(x => x.id === id);
    if (i > 0) { const b = h('<button type="button" class="btn quiet">← ' + TOPICS[i - 1].id + ' ' + TOPICS[i - 1].name + '</button>'); b.onclick = () => { showTopic(TOPICS[i - 1].id); window.scrollTo(0, 0); }; nav.appendChild(b); } else nav.appendChild(h('<span></span>'));
    if (i < TOPICS.length - 1) { const b = h('<button type="button" class="btn quiet">' + TOPICS[i + 1].id + ' ' + TOPICS[i + 1].name + ' →</button>'); b.onclick = () => { showTopic(TOPICS[i + 1].id); window.scrollTo(0, 0); }; nav.appendChild(b); }
    body.appendChild(nav);
  }
  showTopic(TOPIC[state.learn] ? state.learn : '7I');
};

/* ================= PRACTICE ================= */
function topicSelect(id, value, extra = true) {
  let s = '<select id="' + id + '">';
  if (extra) s += '<option value="mix">All topics, mixed</option><option value="weak">My weak spots</option>';
  UNITS.forEach(u => { s += '<optgroup label="' + u.name + '">'; TOPICS.filter(t => t.unit === u.id).forEach(t => { s += '<option value="' + t.id + '"' + (t.id === value ? ' selected' : '') + '>' + t.id + ' · ' + t.name + '</option>'; }); s += '</optgroup>'; });
  return s + '</select>';
}
function pickTopic(sel) {
  if (TOPIC[sel]) return sel;
  if (sel === 'weak') {
    const w = TOPICS.map(t => { const a = acc(t.id), n = (tstats[t.id] || {}).a || 0; return [t.id, n < 3 ? 0.6 : 1.05 - a]; });
    const tot = w.reduce((s, x) => s + x[1], 0); let r = Math.random() * tot; for (const [id, x] of w) { r -= x; if (r <= 0) return id; } return w[0][0];
  }
  return pick(TOPICS).id;
}
const sess = { n: 0, c: 0, streak: 0, best: store.get('best', 0) };
RENDER.practice = () => {
  const v = $('#v-practice'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Practice</h2><p>Pick a topic, answer the question, press <b>Check</b>. You get two tries, and you can always see the working.</p></div>'));
  const ctr = h('<div class="card row" style="justify-content:space-between"><label class="f" style="flex:1 1 260px">Topic' + topicSelect('pSel', state.practice) + '</label><div class="row" id="pStats" style="gap:18px"></div></div>');
  v.appendChild(ctr);
  v.appendChild(practiceFilters(() => next()));
  const sel = $('#pSel', ctr); sel.value = state.practice;
  const host = h('<div class="card stack"></div>'); v.appendChild(host);
  const statsEl = $('#pStats', ctr);
  const drawStats = () => { statsEl.innerHTML = '<div><div class="bignum" style="font-size:1.5rem">' + sess.c + '/' + sess.n + '</div><div class="small muted">this session</div></div><div><div class="bignum" style="font-size:1.5rem">' + sess.streak + '</div><div class="small muted">streak</div></div><div><div class="bignum" style="font-size:1.5rem">' + sess.best + '</div><div class="small muted">best streak</div></div>'; };
  drawStats();
  function next() {
    const tid = pickTopic(sel.value);
    const got = pickPractice(tid, store.get('pDiff', 'any'), store.get('pType', 'any')); const Q = got.Q;
    host.innerHTML = '';
    if (!Q) { host.appendChild(h('<p class="muted">' + got.note + '</p>')); return; }
    if (got.note) host.appendChild(h('<p class="small muted pf-note">' + got.note + '</p>'));
    const lvl = Q.diff || diffOf(Q.gen); host.appendChild(h('<span class="pf-level pf-' + lvl + '">' + DIFF_NAME[lvl] + '</span>'));
    const card = (Q.type === 'long' ? longCard : questionCard)(Q, { onAnswer: (ok, partial) => {
      if (partial) return; record(tid, ok); sess.n++; if (ok) { sess.c++; sess.streak++; if (sess.streak > sess.best) { sess.best = sess.streak; store.set('best', sess.best); } if (sess.streak && sess.streak % 5 === 0) toast(sess.streak + ' in a row!'); } else sess.streak = 0; drawStats();
      nb.focus();
    } });
    host.appendChild(card.el);
    const foot = h('<div class="row" style="justify-content:space-between"><button type="button" class="btn quiet sm">Read the notes for ' + tid + '</button></div>');
    const nb = h('<button type="button" class="btn">Next question →</button>'); nb.onclick = next; foot.appendChild(nb);
    $('button', foot).onclick = () => openLearn(tid);
    host.appendChild(foot); card.focus();
  }
  sel.onchange = () => { state.practice = sel.value; next(); };
  next();
  const acc2 = h('<div class="card stack"><h3>Your accuracy by topic</h3><div class="grid3" id="accGrid"></div></div>');
  TOPICS.forEach(t => { const a = acc(t.id), s = tstats[t.id]; const b = h('<button type="button" class="choice"><span class="tag">' + t.id + '</span> ' + t.name + '<div class="bar" style="margin-top:6px"><i style="width:' + (a === null ? 0 : a * 100) + '%"></i></div><span class="small muted">' + (s ? Math.round(a * 100) + '% of ' + s.a : 'not started') + '</span></button>'); b.onclick = () => { sel.value = t.id; state.practice = t.id; next(); window.scrollTo({ top: 0, behavior: 'smooth' }); }; $('#accGrid', acc2).appendChild(b); });
  v.appendChild(acc2);
};

/* ================= BOOKLET ================= */
function bkQ(part) {
  if (part.n !== undefined) return { type: 'num', ans: part.n, signed: !!part.sg, tol: Number.isInteger(part.n) ? 1e-9 : 0.0051 };
  if (part.ns) return { type: 'nums', ans: part.ns };
  if (part.iq) return { type: 'ineq', ans: part.iq, tol: 0.0051 };
  if (part.co) return { type: 'coord', ans: part.co };
  if (part.r) return { type: 'rule', ans: part.r };
  return null;
}
function markRow(key, row, onChange) {
  const box = h('<span class="row" style="gap:4px"><span class="small muted">Mark:</span><button type="button" class="markbtn ok">✓ right</button><button type="button" class="markbtn no">✗ wrong</button></span>');
  const [ok, no] = $$('button', box);
  const paint = () => { ok.classList.toggle('on', bkMarks[key] === 1); no.classList.toggle('on', bkMarks[key] === 0); row.classList.remove('done-1', 'done-0'); if (bkMarks[key] !== undefined) row.classList.add('done-' + bkMarks[key]); };
  ok.onclick = () => { bkMarks[key] = bkMarks[key] === 1 ? undefined : 1; store.set('bk', bkMarks); paint(); onChange(); };
  no.onclick = () => { bkMarks[key] = bkMarks[key] === 0 ? undefined : 0; store.set('bk', bkMarks); paint(); onChange(); };
  paint(); box.paint = paint; return box;
}
RENDER.booklet = () => {
  const v = $('#v-booklet'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Revision booklet</h2><p>Every booklet question with answers. Try it first, then press <b>Check</b> or <b>Answer</b>. Stuck? <b>Solve it</b> shows every step.</p></div>'));
  const bar = h('<div class="card row" style="justify-content:space-between"><div class="row" id="bkTabs" role="tablist"></div><div class="row"><span class="small muted" id="bkSum"></span><button type="button" class="btn quiet sm" id="bkAll">Show all answers</button></div></div>');
  v.appendChild(bar);
  const list = h('<div class="stack"></div>'); v.appendChild(list);
  const keysFor = q => q.mcq ? q.mcq.map((_, i) => 'D' + (i + 1)) : q.parts.map(p => q.id + p.l);
  const sum = () => { const all = BOOKLET.flatMap(keysFor); const inPart = BOOKLET.filter(q => q.part === state.bkPart).flatMap(keysFor); const r = k => bkMarks[k] === 1; $('#bkSum', bar).textContent = 'This part: ' + inPart.filter(r).length + '/' + inPart.length + ' right · Booklet: ' + all.filter(r).length + '/' + all.length; };
  Object.keys(BK_PARTS).forEach(p => { const b = h('<button type="button" class="chip" role="tab">' + BK_PARTS[p].split(':')[0] + '<span class="small" style="opacity:.8">' + BK_PARTS[p].split(':')[1].replace(/^ /, ' ·&nbsp;') + '</span></button>'); b.onclick = () => { state.bkPart = p; draw(); }; b.dataset.p = p; $('#bkTabs', bar).appendChild(b); });
  let showAll = false;
  $('#bkAll', bar).onclick = () => { showAll = !showAll; $$('.ansbox', list).forEach(a => a.hidden = !showAll); $('#bkAll', bar).textContent = showAll ? 'Hide all answers' : 'Show all answers'; };
  function draw() {
    $$('#bkTabs .chip', bar).forEach(b => b.classList.toggle('on', b.dataset.p === state.bkPart));
    list.innerHTML = ''; showAll = false; $('#bkAll', bar).textContent = 'Show all answers';
    list.appendChild(h('<h3>' + BK_PARTS[state.bkPart] + '</h3>'));
    BOOKLET.filter(q => q.part === state.bkPart).forEach(q => {
      const card = h('<div class="card bk-q" id="bk-' + q.id + '"><div><span class="qid">' + (q.label || q.id) + '</span>' + (q.star ? '<span class="tag star">★ ' + q.star + '</span> ' : '') + '<span>' + q.text + '</span></div></div>');
      if (q.dia) card.insertAdjacentHTML('beforeend', q.dia());
      const parts = h('<div class="bk-parts"></div>'); card.appendChild(parts);
      if (q.mcq) {
        q.mcq.forEach(([qq, ch, ci], i) => {
          const key = 'D' + (i + 1); const row = h('<div class="bk-part" id="bk-' + key + '"><span class="pl-l">D' + (i + 1) + '</span><div>' + qq + '</div><div class="ctrl" style="display:block"></div><div class="ansbox small" hidden><b>Answer: ' + 'ABCD'[ci] + '</b> (' + ch[ci] + ')</div></div>');
          const box = h('<div class="choices"></div>');
          ch.forEach((c, j) => { const b = h('<button type="button" class="choice"><span class="lt">' + 'ABCD'[j] + '</span>' + c + '</button>'); b.onclick = () => { $$('.choice', box).forEach((x, k) => { x.classList.remove('right', 'wrong', 'sel'); if (k === ci) x.classList.add('right'); }); if (j !== ci) b.classList.add('wrong'); bkMarks[key] = j === ci ? 1 : 0; store.set('bk', bkMarks); row.classList.remove('done-1', 'done-0'); row.classList.add('done-' + bkMarks[key]); sum(); }; box.appendChild(b); });
          if (bkMarks[key] !== undefined) row.classList.add('done-' + bkMarks[key]);
          $('.ctrl', row).appendChild(box); parts.appendChild(row);
        });
      } else q.parts.forEach(p => {
        const key = q.id + p.l;
        const row = h('<div class="bk-part" id="bk-' + q.id + (p.l ? '-' + p.l : '') + '"><span class="pl-l">' + (p.l ? p.l + ')' : '') + '</span><div>' + (p.q || '') + '</div><div class="ctrl"></div><div class="ansbox fb info" hidden><b>Answer:</b> ' + p.a + (p.as ? '<div class="qfig" style="margin-top:6px">' + p.as() + '</div>' : '') + '</div></div>');
        const ctrl = $('.ctrl', row), ansbox = $('.ansbox', row);
        const mr = markRow(key, row, sum);
        const Qc = bkQ(p);
        if (p.ch) {
          const cs = h('<span class="row" style="gap:4px"></span>');
          p.ch.forEach((c, j) => { const b = h('<button type="button" class="markbtn">' + c + '</button>'); b.onclick = () => { $$('button', cs).forEach((x, k) => { x.classList.remove('on', 'ok', 'no'); if (k === p.ci) x.classList.add('on', 'ok'); }); if (j !== p.ci) b.classList.add('on', 'no'); bkMarks[key] = j === p.ci ? 1 : 0; store.set('bk', bkMarks); mr.paint(); ansbox.hidden = false; sum(); }; cs.appendChild(b); });
          ctrl.appendChild(cs);
        } else if (Qc) {
          const id = 'bk' + key; const inp = h('<input class="ans" type="text" id="' + id + '" autocomplete="off" spellcheck="false" style="width:min(100%,240px)" placeholder="' + (PH[Qc.type] || '') + '" aria-label="Your answer for ' + q.id + ' ' + p.l + '">');
          const cb = h('<button type="button" class="btn sm">Check</button>'); const msg = h('<span class="small"></span>');
          const doIt = () => { const r = checkAnswer(Qc, inp.value); if (r.empty || r.bad) { msg.textContent = r.msg; msg.className = 'small muted'; return; } bkMarks[key] = r.ok ? 1 : 0; store.set('bk', bkMarks); mr.paint(); msg.innerHTML = r.ok ? '<b class="result-good">✓ Correct</b>' : '<b class="result-bad">✗ Not quite</b>' + (r.msg ? ' ' + r.msg : ''); ansbox.hidden = false; sum(); };
          cb.onclick = doIt; inp.addEventListener('keydown', e => { if (e.key === 'Enter') doIt(); });
          ctrl.append(inp, cb, msg);
        }
        const sb = h('<button type="button" class="btn ghost sm">Answer</button>'); sb.onclick = () => { ansbox.hidden = !ansbox.hidden; }; ctrl.appendChild(sb);
        if (p.k) { const kb = h('<button type="button" class="btn ghost sm">Solve it</button>'); kb.onclick = () => { askQuery = p.k; go('ask'); }; ctrl.appendChild(kb); }
        if (!p.ch) ctrl.appendChild(mr); else { ctrl.appendChild(mr); }
        parts.appendChild(row);
      });
      list.appendChild(card);
    });
    const rs = h('<div class="row"><button type="button" class="btn quiet sm">Clear my marks for this part</button></div>');
    $('button', rs).onclick = () => { BOOKLET.filter(q => q.part === state.bkPart).flatMap(keysFor).forEach(k => delete bkMarks[k]); store.set('bk', bkMarks); draw(); toast('Marks cleared'); };
    list.appendChild(rs);
    sum();
  }
  draw();
};

/* ================= EXAM ================= */
let examTimer = null;
RENDER.exam = () => {
  const v = $('#v-exam'); v.innerHTML = ''; clearInterval(examTimer);
  v.appendChild(h('<div class="view-head"><h2>Test yourself</h2><p>A timed practice exam. Nothing is marked until you press <b>Submit</b>. Then you see your score and the working for every question.</p></div>'));
  const setup = h('<div class="card stack"><h3>Set up your exam</h3><div class="row"><label class="f">Questions<select id="exN"><option>10</option><option selected>20</option><option>30</option><option>40</option></select></label><label class="f">Time limit<select id="exT"><option value="0">No timer</option><option value="10">10 min</option><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label></div><div class="stack" id="exTopics"></div><div class="row"><button type="button" class="btn quiet sm" id="exAll">Select all</button><button type="button" class="btn quiet sm" id="exNone">Clear</button><button type="button" class="btn quiet sm" id="exWeak">My weakest 5</button></div><div><button type="button" class="btn" id="exGo">Start exam</button> <span class="small muted" id="exMsg"></span></div></div>');
  const tbox = $('#exTopics', setup);
  UNITS.forEach(u => { const g = h('<div><div class="eyebrow" style="margin-bottom:4px">' + u.name + '</div><div class="row" style="gap:6px"></div></div>'); TOPICS.filter(t => t.unit === u.id).forEach(t => { const c = h('<button type="button" class="chip on" data-t="' + t.id + '" aria-pressed="true">' + t.id + ' ' + t.name + '</button>'); c.onclick = () => { c.classList.toggle('on'); c.setAttribute('aria-pressed', c.classList.contains('on')); }; g.lastChild.appendChild(c); }); tbox.appendChild(g); });
  $('#exAll', setup).onclick = () => $$('.chip', tbox).forEach(c => c.classList.add('on'));
  $('#exNone', setup).onclick = () => $$('.chip', tbox).forEach(c => c.classList.remove('on'));
  $('#exWeak', setup).onclick = () => { const w = TOPICS.map(t => [t.id, acc(t.id) ?? 0.5]).sort((a, b) => a[1] - b[1]).slice(0, 5).map(x => x[0]); $$('.chip', tbox).forEach(c => c.classList.toggle('on', w.includes(c.dataset.t))); };
  v.appendChild(setup);
  const hist = store.get('exams', []);
  if (hist.length) v.appendChild(h('<div class="card stack"><h3>Past exams</h3><div class="scroll-x"><table class="res"><tr><th>Date</th><th>Score</th><th>%</th><th>Time used</th></tr>' + hist.slice(-8).reverse().map(e => '<tr><td>' + e.d + '</td><td>' + e.s + '/' + e.n + '</td><td>' + e.p + '%</td><td>' + e.t + '</td></tr>').join('') + '</table></div></div>'));
  $('#exGo', setup).onclick = () => {
    const tops = $$('.chip.on', tbox).map(c => c.dataset.t); if (!tops.length) { $('#exMsg', setup).textContent = 'Pick at least one topic.'; return; }
    runExam(tops, +$('#exN', setup).value, +$('#exT', setup).value);
  };
  function runExam(tops, n, mins) {
    v.innerHTML = '';
    const order = []; for (let i = 0; i < n; i++) order.push(tops[i % tops.length]);
    const Qs = shuffle(order).map(t => makeQ(pick(TOPIC_GENS[t])));
    const bar = h('<div class="exam-bar"><div><span class="timer" id="exClock">' + (mins ? mins + ':00' : '∞') + '</span> <span class="small muted" id="exProg">0/' + n + ' answered</span></div><div class="row"><button type="button" class="btn quiet sm" id="exQuit">Quit</button><button type="button" class="btn" id="exSub">Submit exam</button></div></div>');
    v.appendChild(bar);
    const cards = []; const list = h('<div class="stack"></div>'); v.appendChild(list);
    const prog = () => { $('#exProg', bar).textContent = cards.filter(c => c.answered()).length + '/' + n + ' answered'; };
    Qs.forEach((Q, i) => { const c = questionCard(Q, { mode: 'exam', num: i + 1, onChange: prog }); cards.push(c); const w = h('<div class="card"></div>'); w.appendChild(c.el); list.appendChild(w); });
    const bottom = h('<div class="row"><button type="button" class="btn">Submit exam</button></div>'); list.appendChild(bottom);
    const start = Date.now(); let left = mins * 60;
    if (mins) examTimer = setInterval(() => { left--; const c = $('#exClock', bar); if (!c) { clearInterval(examTimer); return; } c.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); c.classList.toggle('low', left <= 60); if (left <= 0) { clearInterval(examTimer); toast('Time is up'); submit(); } }, 1000);
    let armed = false;
    const trySubmit = btn => { const un = n - cards.filter(c => c.answered()).length; if (!armed && un > 0) { armed = true; btn.textContent = un + ' unanswered: tap again to submit'; setTimeout(() => { armed = false; btn.textContent = 'Submit exam'; }, 4000); return; } submit(); };
    $('#exSub', bar).onclick = e => trySubmit(e.target); $('button', bottom).onclick = e => trySubmit(e.target);
    $('#exQuit', bar).onclick = () => { clearInterval(examTimer); RENDER.exam(); };
    let done = false;
    function submit() {
      if (done) return; done = true; clearInterval(examTimer);
      const res = cards.map((c, i) => { const r = c.finalize(); record(Qs[i].topic, !!r.ok); return !!r.ok; });
      const s = res.filter(Boolean).length, p = Math.round(s / n * 100); const used = Math.round((Date.now() - start) / 1000);
      const hist = store.get('exams', []); hist.push({ d: new Date().toLocaleDateString('en-AU'), s, n, p, t: Math.floor(used / 60) + 'm ' + used % 60 + 's' }); store.set('exams', hist);
      bar.remove(); bottom.remove();
      const by = {}; Qs.forEach((Q, i) => { const b = by[Q.topic] || (by[Q.topic] = [0, 0]); b[1]++; if (res[i]) b[0]++; });
      const weak = Object.entries(by).filter(([, [a, b]]) => a / b < 0.7).map(([t]) => t);
      const sum = h('<div class="card stack"><span class="eyebrow">Result</span><div class="row" style="align-items:baseline"><span class="bignum ' + (p >= 70 ? 'result-good' : 'result-bad') + '">' + s + '/' + n + '</span><span class="muted">' + p + '% · ' + Math.floor(used / 60) + ' min ' + used % 60 + ' s</span></div><p>' + (p >= 90 ? 'Excellent. You are exam ready on these topics.' : p >= 70 ? 'Solid work. Review the questions you missed below.' : p >= 50 ? 'Getting there. Re-read the notes for your weaker topics and practise them.' : 'Keep going. Start with the notes and worked examples for the topics below, then practise.') + '</p><div class="scroll-x"><table class="res"><tr><th>Topic</th><th>Score</th><th></th></tr>' + Object.entries(by).map(([t, [a, b]]) => '<tr><td><span class="tag">' + t + '</span> ' + TOPIC[t].name + '</td><td class="' + (a / b >= 0.7 ? 'result-good' : 'result-bad') + '">' + a + '/' + b + '</td><td><button type="button" class="btn quiet sm" data-p="' + t + '">Practise</button></td></tr>').join('') + '</table></div><div class="row"><button type="button" class="btn" id="exAgain">New exam</button>' + (weak.length ? '<button type="button" class="btn ghost" id="exWeakAgain">Exam on my weak topics (' + weak.join(', ') + ')</button>' : '') + '</div><p class="small muted">Scroll down to see every question marked, with full working.</p></div>');
      $$('[data-p]', sum).forEach(b => b.onclick = () => openPractice(b.dataset.p));
      $('#exAgain', sum).onclick = () => RENDER.exam();
      if (weak.length) $('#exWeakAgain', sum).onclick = () => runExam(weak, Math.max(10, weak.length * 3), mins);
      v.prepend(sum); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};

/* ================= ASK ================= */
let askQuery = '';
const ASK_EXAMPLES = ['5 - 2x < 11', '3(2x - 1) = 4x + 5', 'gradient (1,2) and (4,11)', 'y = -2x + 8', 'does (3,2) lie on y = -2x + 8', 'reflect (4,1) in the x-axis', 'rotate (2,3) 90 clockwise', 'translate (1,2) by (3,-2)', '35% of 80', '600 mL out of 2 L', 'increase 250 by 12%', 'percentage change from 80 to 100', 'after a 20% increase the price is 144', '8% of the total is 36', 'price including GST is 176', '3/7 as a decimal', '62.5% as a fraction', 'round 2/3 to 3 dp', 'scale factor from 6 to 15', 'line through (0,3) and (2,-1)', 'what is SAS', '(3*4 - 2)/5'];
const UNITS_CONV = { mg: ['m', 0.001], g: ['m', 1], kg: ['m', 1000], t: ['m', 1e6], ml: ['v', 1], l: ['v', 1000], kl: ['v', 1e6], mm: ['l', 0.1], cm: ['l', 1], m: ['l', 100], km: ['l', 100000], s: ['t', 1], sec: ['t', 1], secs: ['t', 1], seconds: ['t', 1], second: ['t', 1], min: ['t', 60], mins: ['t', 60], minutes: ['t', 60], minute: ['t', 60], h: ['t', 3600], hr: ['t', 3600], hrs: ['t', 3600], hours: ['t', 3600], hour: ['t', 3600], c: ['c', 1], cents: ['c', 1], $: ['c', 100], dollars: ['c', 100] };
function ansBlock(title, body) { return '<div class="card stack"><span class="eyebrow">Answer</span><h3>' + title + '</h3>' + body + '</div>'; }
function askEngine(raw) {
  const s0 = clean(raw).replace(/[?]$/, '').trim(); const s = s0.toLowerCase().replace(/^(please |can you |how do i |what is |what's |find |calculate |work out |solve |convert |write |express |change )+/, '').trim();
  const N = '(-?\\d+(?:\\.\\d+)?)', P = '\\(\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*\\)', P3 = '\\(\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*\\)';
  let m;
  const pts = [...s.matchAll(new RegExp(P, 'g'))].map(x => [+x[1], +x[2]]);
  // GST
  if (/gst/.test(s)) {
    const num = +(s.match(/(\d[\d.]*)/) || [])[1];
    if (!isNaN(num)) {
      if (/includ|remove|before|without|inc\b|exclud/.test(s)) return ansBlock('Price before GST: ' + money(num / 1.1), stepsHTML([{ t: money(num) + ' = 110% of the original', why: 'GST adds 10%' }, { t: money(num) + ' ÷ 1.1 = ' + money(num / 1.1), why: 'Divide by 1.1 (do not take 10% off)' }, { t: 'GST amount = ' + money(num - num / 1.1), why: '' }]));
      return ansBlock('Price with GST: ' + money(num * 1.1), stepsHTML([{ t: 'GST = 10% of ' + money(num) + ' = ' + money(num * 0.1), why: 'GST is 10% in Australia' }, { t: money(num) + ' × 1.1 = ' + money(num * 1.1), why: 'Or add the GST on' }]));
    }
  }
  // reverse percentage
  if ((m = s.match(/after an? (\d[\d.]*)\s*% (increase|rise|mark-?up|growth|discount|decrease|fall|reduction|drop|loss)\D*?(\d[\d.]*)/)) || (m = s.match(/(?:fell|dropped|decreased|reduced|rose|increased|grew) by (\d[\d.]*)\s*% to \$?(\d[\d.]*)/))) {
    let p, up, v;
    if (m.length === 4) { p = +m[1]; up = /increase|rise|mark|growth/.test(m[2]); v = +m[3]; } else { p = +m[1]; up = /rose|increased|grew/.test(s); v = +m[2]; }
    const mult = 1 + (up ? p : -p) / 100, o = v / mult;
    return ansBlock('Original amount: ' + fmt(o, 2), stepsHTML([{ t: fmt(v) + ' = ' + fmt(100 + (up ? p : -p)) + '% of the original', why: 'After the change' }, { t: '1% = ' + fmt(v) + ' ÷ ' + fmt(100 + (up ? p : -p)) + ' = ' + fmt(v / (100 + (up ? p : -p)), 4), why: 'Unitary method' }, { t: '100% = ' + fmt(o, 2), why: 'Shortcut: ' + fmt(v) + ' ÷ ' + fmt(mult) + ' = ' + fmt(o, 2) }]) + '<p class="small muted">Common mistake: ' + (up ? 'subtracting' : 'adding') + ' ' + p + '% of ' + fmt(v) + ' gives ' + fmt(v * (1 + (up ? -p : p) / 100), 2) + ', which is wrong.</p>');
  }
  // unitary
  if ((m = s.match(/(\d[\d.]*)\s*% of (?:an? |the )?(?:amount|number|total|bill|class|load|students?|school|it|something|price)?\s*(?:is|=)\s*\$?(\d[\d.]*)\s*\w*(?:.*?(\d[\d.]*)\s*%)?/))) {
    const p = +m[1], v = +m[2], q = m[3] ? +m[3] : 100; const one = v / p;
    return ansBlock((q === 100 ? 'The whole amount (100%) is ' : q + '% is ') + fmt(one * q, 2), stepsHTML([{ t: p + '% = ' + fmt(v), why: 'Given' }, { t: '1% = ' + fmt(v) + ' ÷ ' + p + ' = ' + fmt(one, 4), why: 'Find 1% (one unit)' }, { t: q + '% = ' + fmt(one, 4) + ' × ' + q + ' = ' + fmt(one * q, 2), why: 'Multiply up' }]));
  }
  // increase / decrease by %
  if ((m = s.match(/(increase|decrease|reduce|raise|discount|mark up|markup)\s+\$?(\d[\d.]*)\s*(?:[a-z]+\s+)?by\s+(\d[\d.]*)\s*%/))) {
    const A = +m[2], p = +m[3], up = /increase|raise|mark/.test(m[1]); const mult = 1 + (up ? p : -p) / 100;
    return ansBlock((up ? 'Increased' : 'Decreased') + ' amount: ' + fmt(A * mult, 2), stepsHTML([{ t: p + '% of ' + fmt(A) + ' = ' + fmt(A * p / 100, 4), why: 'Find the percentage amount' }, { t: fmt(A) + (up ? ' + ' : ' − ') + fmt(A * p / 100, 4) + ' = ' + fmt(A * mult, 2), why: up ? 'Add it on' : 'Take it off' }, { t: fmt(A) + ' × ' + fmt(mult) + ' = ' + fmt(A * mult, 2), why: 'Same answer with the multiplier ' + fmt(mult) }]));
  }
  // percentage change
  if (/change|profit|loss|increase|decrease/.test(s) && (m = s.match(/from \$?(-?[\d.]+)\s*[a-z]*\s+to \$?(-?[\d.]+)/))) {
    const O = +m[1], Nw = +m[2], ch = Nw - O, p = ch / O * 100;
    return ansBlock(fmt(Math.abs(p), 2) + '% ' + (p >= 0 ? 'increase' : 'decrease'), stepsHTML([{ t: 'Change = ' + fmt(Nw) + ' − ' + fmt(O) + ' = ' + fmt(ch, 4), why: ch >= 0 ? 'Positive, so an increase' : 'Negative, so a decrease' }, { t: fmt(Math.abs(ch), 4) + ' ÷ ' + fmt(O) + ' × 100 = ' + fmt(Math.abs(p), 2) + '%', why: 'Divide by the ORIGINAL value' }]));
  }
  // a out of b (with units)
  if ((m = s.match(/\$?(\d[\d.]*)\s*([a-z$]*)\s+(?:out of|as an? (?:percentage|percent|%) of|as % of|of a total of)\s+\$?(\d[\d.]*)\s*([a-z$]*)/))) {
    let a = +m[1], ua = m[2], b = +m[3], ub = m[4]; const steps = [];
    if (ua && ub && UNITS_CONV[ua] && UNITS_CONV[ub] && ua !== ub) {
      if (UNITS_CONV[ua][0] !== UNITS_CONV[ub][0]) throw new Error('Those units measure different things (' + ua + ' and ' + ub + ').');
      const fa = UNITS_CONV[ua][1], fb = UNITS_CONV[ub][1];
      if (fb > fa) { const nb = b * fb / fa; steps.push({ t: fmt(b) + ' ' + ub + ' = ' + fmt(nb) + ' ' + ua, why: 'Convert to the same units first' }); b = nb; }
      else { const na = a * fa / fb; steps.push({ t: fmt(a) + ' ' + ua + ' = ' + fmt(na) + ' ' + ub, why: 'Convert to the same units first' }); a = na; }
    }
    const p = a / b * 100; steps.push({ t: fmt(a) + ' ÷ ' + fmt(b) + ' × 100 = ' + fmt(p, 2) + '%', why: 'a ÷ b × 100' });
    return ansBlock(fmt(p, 2) + '%', stepsHTML(steps));
  }
  // p% of q
  if ((m = s.match(/(-?\d[\d.]*)\s*%\s*of\s*\$?(-?\d[\d.]*)/))) {
    const p = +m[1], q = +m[2]; const v = p / 100 * q;
    return ansBlock(fmt(p) + '% of ' + fmt(q) + ' = ' + fmt(v, 4), stepsHTML([{ t: fmt(p) + '/100 × ' + fmt(q) + ' = ' + fmt(v, 4), why: 'p% of Q = p/100 × Q' }, { t: '10% of ' + fmt(q) + ' = ' + fmt(q / 10, 4) + ', 1% = ' + fmt(q / 100, 4), why: 'Mental check' }]));
  }
  // % to fraction/decimal
  if ((m = s.match(/^(-?\d[\d.]*)\s*%\s*(?:as|to|in|into)?\s*(?:an? )?(fraction|decimal)?$/))) {
    const p = +m[1]; const f = Fr.of(p).div(100);
    return ansBlock(fmt(p) + '% = ' + f + ' = ' + fmt(p / 100, 6), stepsHTML([{ t: fmt(p) + '% = ' + fmt(p) + '/100 = ' + f, why: 'Over 100, then simplify' }, { t: fmt(p) + ' ÷ 100 = ' + fmt(p / 100, 6), why: 'As a decimal: divide by 100' }]));
  }
  // decimal to fraction / %
  if ((m = s.match(/^(-?\d*\.\d+)\s*(?:as|to|in|into)?\s*(?:an? )?(fraction|percentage|percent|%)?$/))) {
    const x = +m[1]; const f = Fr.of(x); const k = m[1].split('.')[1].length;
    return ansBlock(m[1] + ' = ' + f + ' = ' + fmt(x * 100, 6) + '%', stepsHTML([{ t: m[1] + ' = ' + Math.round(x * 10 ** k) + '/' + 10 ** k + ' = ' + f, why: 'Use place value, then simplify' }, { t: m[1] + ' × 100 = ' + fmt(x * 100, 6) + '%', why: 'As a percentage' }]));
  }
  // fraction to decimal/%
  if ((m = s.match(/^(-?\d+)\s*\/\s*(\d+)\s*(?:as|to|in|into)?\s*(?:an? )?(decimal|percentage|percent|%|fraction|simplest form)?$/))) {
    const n = +m[1], d = +m[2]; if (!d) throw new Error('You cannot divide by zero.'); const f = new Fr(n, d); const ld = longDiv(f.n, f.d); const df = primeFactors(f.d);
    return ansBlock(n + '/' + d + (f.n !== n ? ' = ' + f : '') + ' = ' + decHTML(ld), stepsHTML([f.n !== n ? { t: n + '/' + d + ' = ' + f, why: 'Simplest form (divide top and bottom by ' + gcd(n, d) + ')' } : null, { t: n + ' ÷ ' + d + ' = ' + decLong(ld, 3), why: ld.term ? 'Terminating: ' + f.d + ' = ' + (df.join(' × ') || '1') + ' (only 2s and 5s)' : 'Recurring: ' + f.d + ' = ' + df.join(' × ') + ' has a factor other than 2 or 5' }, ld.term ? null : { t: decHTML(ld), why: 'Line over the repeating digits (or dots above the first and last repeating digit)' }, { t: 'Rounded: ' + (n / d).toFixed(1) + ' (1 d.p.), ' + (n / d).toFixed(2) + ' (2 d.p.), ' + (n / d).toFixed(3) + ' (3 d.p.)', why: '' }, { t: n + '/' + d + ' × 100 = ' + fmt(n / d * 100, 4) + '%', why: 'As a percentage' }].filter(Boolean)));
  }
  // rounding
  if ((m = s.match(/round\s+(.+?)\s+to\s+(?:the\s+)?(?:(\d+)\s*(?:dp|d\.p\.?|decimal places?|decimal place)|nearest\s+(whole|whole number|integer|tenth|hundredth|thousandth|ten|hundred))/))) {
    const x = evalNum(m[1]); if (isNaN(x)) throw new Error('I could not read the number “' + m[1] + '”.');
    let dp = m[2] !== undefined ? +m[2] : { whole: 0, 'whole number': 0, integer: 0, tenth: 1, hundredth: 2, thousandth: 3, ten: -1, hundred: -2 }[m[3]];
    const r = dp >= 0 ? r2(x, dp).toFixed(dp) : String(Math.round(x / 10 ** -dp) * 10 ** -dp);
    const digits = x.toFixed(Math.max(dp, 0) + 3);
    return ansBlock(r, stepsHTML([{ t: m[1] + ' = ' + digits + '…', why: 'Write out a few extra digits' }, { t: r, why: 'Look at the next digit: 5 or more rounds up, 4 or less leaves it' }]));
  }
  // scale factor
  if (/scale factor/.test(s) && (m = s.match(/(\d[\d.]*)\D+?(\d[\d.]*)/))) {
    const a = +m[1], b = +m[2];
    return ansBlock('Scale factor = ' + fmt(b / a, 4), stepsHTML([{ t: fmt(b) + ' ÷ ' + fmt(a) + ' = ' + fmt(b / a, 4), why: 'Image length ÷ original length' }, (b / a > 1 ? 'An enlargement.' : 'A reduction.') + ' Multiply other original lengths by ' + fmt(b / a, 4) + ' to get the matching image lengths.']));
  }
  // 3D point
  if ((m = s.match(new RegExp(P3)))) {
    const p = [+m[1], +m[2], +m[3]]; const z = p.map(v => v === 0); let where;
    if (z.every(Boolean)) where = 'the origin'; else if (z[1] && z[2]) where = 'the x-axis'; else if (z[0] && z[2]) where = 'the y-axis'; else if (z[0] && z[1]) where = 'the z-axis'; else if (z[2]) where = 'the floor (xy-plane)'; else if (z[0]) where = 'the yz wall (x = 0)'; else if (z[1]) where = 'the xz wall (y = 0)'; else where = 'in space, not on an axis or the floor';
    return ansBlock(ptStr(p) + ' is on ' + where, stepsHTML(['Start at the origin. Go ' + fmt(p[0]) + ' along the x-axis, ' + fmt(p[1]) + ' along the y-axis, then ' + fmt(p[2]) + ' up (z).']));
  }
  // reflect
  if (/reflect/.test(s) && pts.length) {
    let L = null; if (/x-?\s*axis/.test(s)) L = { t: 'x-axis' }; else if (/y-?\s*axis/.test(s)) L = { t: 'y-axis' }; else if (/y\s*=\s*-\s*x\b/.test(s)) L = { t: 'y=-x' }; else if (/y\s*=\s*x\b/.test(s)) L = { t: 'y=x' }; else if ((m = s.match(/x\s*=\s*(-?[\d.]+)/))) L = { t: 'x=k', k: +m[1] }; else if ((m = s.match(/y\s*=\s*(-?[\d.]+)/))) L = { t: 'y=k', k: +m[1] };
    if (!L) throw new Error('Say which mirror line, e.g. “in the x-axis”, “in the y-axis” or “in x = 2”.');
    const img = pts.map(p => reflectPt(p, L)); const lim = Math.max(6, ...pts.flat().map(Math.abs), ...img.flat().map(Math.abs)) + 1;
    return ansBlock('Image: ' + img.map(ptStr).join(', '), stepsHTML([reflectRule(L)].concat(pts.map((p, i) => ptStr(p) + ' → ' + ptStr(img[i])))) + '<div class="qfig">' + gridSVG({ xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, mirrors: [L], polys: pts.length > 1 ? [{ pts, labels: pts.map((_, i) => 'ABCDEFG'[i]) }, { pts: img, labels: pts.map((_, i) => 'ABCDEFG'[i] + '′'), cls: 'b' }] : [], points: pts.length === 1 ? [{ x: pts[0][0], y: pts[0][1], label: 'P' }, { x: img[0][0], y: img[0][1], label: 'P′', cls: 'b' }] : [], size: 280 }) + '</div>');
  }
  // rotate
  if (/rotat/.test(s) && pts.length) {
    const ang = +((s.match(/(90|180|270)/) || [])[1] || 0); if (!ang) throw new Error('Give the angle: 90°, 180° or 270°.');
    const dir = /anti|counter/.test(s) ? 'acw' : 'cw'; let c = [0, 0]; const cm = s.match(new RegExp('about\\s*(?:the point\\s*)?' + P));
    const shape = cm ? pts.slice(0, -1) : pts; if (cm) c = [+cm[1], +cm[2]];
    const img = shape.map(p => rotatePt(p, ang, dir, c)); const lim = Math.max(6, ...shape.flat().map(Math.abs), ...img.flat().map(Math.abs)) + 1;
    return ansBlock('Image: ' + img.map(ptStr).join(', '), stepsHTML([(c[0] || c[1] ? 'Centre ' + ptStr(c) + ': subtract the centre, rotate, then add it back. ' : '') + rotRule(ang, dir)].concat(shape.map((p, i) => ptStr(p) + ' → ' + ptStr(img[i])))) + '<div class="qfig">' + gridSVG({ xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, polys: shape.length > 1 ? [{ pts: shape, labels: shape.map((_, i) => 'ABCDEFG'[i]) }, { pts: img, labels: shape.map((_, i) => 'ABCDEFG'[i] + '′'), cls: 'b' }] : [], points: (shape.length === 1 ? [{ x: shape[0][0], y: shape[0][1], label: 'P' }, { x: img[0][0], y: img[0][1], label: 'P′', cls: 'b' }] : []).concat([{ x: c[0], y: c[1], cls: 'd' }]), size: 280 }) + '</div>');
  }
  // vector between points
  if (pts.length === 2 && /vector|moves? to|maps? to|→|->/.test(s)) {
    const [a, b] = pts; const vx = b[0] - a[0], vy = b[1] - a[1];
    return ansBlock('Vector (' + fmt(vx) + ', ' + fmt(vy) + ')', stepsHTML([{ t: '(' + fmt(b[0]) + ' − ' + fmt(a[0]) + ', ' + fmt(b[1]) + ' − ' + fmt(a[1]) + ') = (' + fmt(vx) + ', ' + fmt(vy) + ')', why: 'image − original' }, 'That is ' + (vecWords(vx, vy) || 'no movement') + '.']));
  }
  // translate
  if (/translat/.test(s) && pts.length >= 2) {
    const vec = pts[pts.length - 1], shape = pts.slice(0, -1); const img = shape.map(p => [p[0] + vec[0], p[1] + vec[1]]);
    return ansBlock('Image: ' + img.map(ptStr).join(', '), stepsHTML(['The vector (' + fmt(vec[0]) + ', ' + fmt(vec[1]) + ') means ' + vecWords(vec[0], vec[1]) + '.'].concat(shape.map((p, i) => ptStr(p) + ' → ' + ptStr(img[i])))));
  }
  // gradient / line through two points
  if (pts.length === 2 && /gradient|slope|line|rule|equation|through|join/.test(s)) {
    const [[x1, y1], [x2, y2]] = pts; if (x1 === x2) return ansBlock('Vertical line x = ' + fmt(x1), '<p>The run is 0, so the gradient is undefined. The rule is x = ' + fmt(x1) + '.</p>');
    const mm = Fr.of(y2).sub(y1).div(Fr.of(x2).sub(x1)); const c = Fr.of(y1).sub(mm.mul(x1));
    return ansBlock('Gradient m = ' + mm.show() + '; rule y = ' + fmtLin(mm, c), stepsHTML([{ t: 'm = (' + fmt(y2) + ' − ' + fmt(y1) + ') ÷ (' + fmt(x2) + ' − ' + fmt(x1) + ') = ' + fmt(y2 - y1) + ' ÷ ' + fmt(x2 - x1) + ' = ' + mm.show(), why: 'rise ÷ run' }, { t: fmt(y1) + ' = ' + numStr(mm) + ' × ' + (x1 < 0 ? '(' + fmt(x1) + ')' : fmt(x1)) + ' + c, so c = ' + numStr(c), why: 'Substitute a point into y = mx + c' }, { t: 'y = ' + fmtLin(mm, c), why: 'The rule' }]) + '<div class="qfig">' + gridSVG({ xmin: -8, xmax: 8, ymin: -8, ymax: 8, lines: [{ m: mm.v, c: c.v }], points: pts.map(p => ({ x: p[0], y: p[1], label: ptStr(p) })), size: 280 }) + '</div>');
  }
  // relation
  const main = s0.replace(/\s*,?\s+(?:when|if|for)\s+[xy]\s*=.*$/i, '');
  let sp = null; try { sp = splitRel(main); } catch (e) { /* not a relation */ }
  if (sp) {
    const Ls = sp.L.replace(/^.*?\b(?:solve|is)\s+/i, '').trim();
    if (/(^|\s)y$/i.test(Ls) && /x/.test(sp.R) && sp.op === '=') {
      const r = parseLin(sp.R.replace(new RegExp(P, 'g'), '').replace(/[?.]$/, '').trim()); const mm = r.a, c = r.b; const wx = s.match(/(?:when|if|for)\s*x\s*=\s*(-?[\d.]+)/), wy = s.match(/(?:when|if|for)\s*y\s*=\s*(-?[\d.]+)/);
      let extra = '';
      if (pts.length === 1) { const [px, py] = pts[0]; const yv = mm.mul(Fr.of(px)).add(c).v; return ansBlock(Math.abs(yv - py) < 1e-9 ? 'Yes, ' + ptStr(pts[0]) + ' is on the line' : 'No, ' + ptStr(pts[0]) + ' is not on the line', stepsHTML([{ t: 'y = ' + fmtLin(mm, c).replace(/x/g, '(' + fmt(px) + ')') + ' = ' + fmt(yv), why: 'Substitute x = ' + fmt(px) }, Math.abs(yv - py) < 1e-9 ? 'This equals ' + fmt(py) + ', so the point is on the line.' : 'This is not ' + fmt(py) + ', so the point is not on the line.'])); }
      if (wx) { const xv = +wx[1]; extra = stepsHTML([{ t: 'y = ' + fmtLin(mm, c).replace(/x/g, '(' + fmt(xv) + ')') + ' = ' + fmt(mm.v * xv + c.v), why: 'Substitute x = ' + fmt(xv) }]); }
      if (wy) { extra = stepsHTML(solveRel(fmtLin(mm, c) + ' = ' + wy[1]).steps); }
      const xs = [-2, -1, 0, 1, 2, 3, 4], ys = xs.map(x => mm.v * x + c.v); const xi = mm.isZero() ? null : c.neg().div(mm);
      return ansBlock('y = ' + fmtLin(mm, c), (extra ? '<div class="fb info">' + extra + '</div>' : '') + '<dl class="kv"><dt>Gradient m</dt><dd>' + mm.show() + (mm.isZero() ? ' (horizontal)' : mm.sign() > 0 ? ' (rises left to right)' : ' (falls left to right)') + '</dd><dt>y-intercept c</dt><dd>' + numStr(c) + ' → (0, ' + numStr(c) + ')</dd><dt>x-intercept</dt><dd>' + (xi ? 'put y = 0: x = ' + xi.show() : 'none (horizontal line)') + '</dd></dl>' + tableHTML(xs, ys) + '<div class="qfig">' + gridSVG({ xmin: -8, xmax: 8, ymin: -8, ymax: 8, lines: [{ m: mm.v, c: c.v }], size: 280 }) + '</div>');
    }
    const r = solveRel(Ls + ' ' + sp.op + ' ' + sp.R);
    const title = r.special ? (r.special === 'all' ? 'Every value works' : 'No solution') : r.v + ' ' + opD(r.op) + ' ' + r.val.show();
    return ansBlock(title, stepsHTML(r.steps) + (r.kind === 'ineq' && r.val ? '<div class="qfig">' + nlSVG(r.op, r.val.v) + '</div><p class="small">' + (r.op.includes('=') ? 'Closed' : 'Open') + ' circle at ' + numStr(r.val) + ', arrow pointing ' + (r.op.includes('>') ? 'right' : 'left') + '.</p>' : ''));
  }
  // plain arithmetic
  if (/^[\d\s.+\-*/()^]+$/.test(s) && /\d/.test(s)) {
    const L = parseLin(s); const f = L.b; return ansBlock(pretty(s) + ' = ' + (f.isInt() ? f.toString() : f.show()), '<p class="small muted">Worked out exactly with fractions, following BIDMAS (brackets, indices, × and ÷ left to right, + and − left to right).</p>');
  }
  // keywords
  const words = s.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !['what', 'the', 'how', 'does', 'and', 'for', 'with', 'mean', 'means', 'explain', 'tell', 'about', 'are', 'is'].includes(w));
  if (words.length) {
    const score = txt => { const t = txt.toLowerCase(); return words.reduce((n, w) => n + (t.includes(w) ? (w.length > 3 ? 2 : 1) : 0), 0); };
    const g = GLOSS.map(x => [score(x[0]) * 3 + score(x[1]), x]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, 4);
    const t = TOPICS.map(x => [score(x.name) * 3 + score(x.cans.join(' ')) + score(x.notes().replace(/<[^>]+>/g, ' ')) * 0.2, x]).filter(x => x[0] > 0.5).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const f = FLASH.map(x => [score(x[1]) * 2 + score(x[2]), x]).filter(x => x[0] > 1).sort((a, b) => b[0] - a[0]).slice(0, 3);
    if (g.length || t.length || f.length) {
      let html = '';
      if (g.length) html += '<dl class="stack">' + g.map(([, x]) => '<div><dt><b>' + x[0] + '</b> <span class="tag">' + x[2] + '</span></dt><dd style="margin:0">' + esc(x[1]) + '</dd></div>').join('') + '</dl>';
      if (f.length) html += '<div class="stack">' + f.map(([, x]) => '<p><b>' + x[1] + '</b> ' + x[2] + '</p>').join('') + '</div>';
      if (t.length) html += '<div class="row">' + t.map(([, x]) => '<button type="button" class="btn quiet sm" data-learn="' + x.id + '">Read ' + x.id + ' ' + x.name + '</button>').join('') + '</div>';
      return ansBlock('Here is what I found', html);
    }
  }
  return null;
}
function runAsk(q) {
  const out = $('#askOut'); if (!out) return; const inp = $('#askIn'); if (inp) inp.value = q;
  let html;
  try { html = askEngine(q); } catch (e) { html = '<div class="fb bad"><b>I couldn’t work that out.</b> ' + esc(e.message) + '</div>'; }
  if (!html) html = '<div class="fb info"><b>I’m not sure how to answer that one yet.</b> I can solve equations and inequalities, work with lines and points, do transformations, percentages, fractions, decimals and rounding, and look up any maths word. Try one of the examples below, or check the Glossary. If it is a worded problem, write the equation yourself (e.g. “65 + 48h = 401”) and I’ll solve it.</div>';
  const item = h('<div class="stack"><div class="row" style="justify-content:space-between"><span class="m">' + esc(pretty(q)) + '</span></div></div>');
  item.insertAdjacentHTML('beforeend', html);
  $$('[data-learn]', item).forEach(b => b.onclick = () => openLearn(b.dataset.learn));
  out.prepend(item);
}
RENDER.ask = () => {
  const v = $('#v-ask'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Ask a question</h2><p>Type a maths question and get the answer with every step. Not sure how to type it? Tap one of the examples.</p></div>'));
  const box = h('<div class="card stack"><form class="ask-box" id="askForm"><label class="sr" for="askIn">Your question</label><input id="askIn" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. 5 − 2x < 11   or   increase 250 by 12%"><button class="btn" type="submit">Ask</button></form><div class="stack" style="gap:6px"><span class="small muted">Try one:</span><div class="row" id="askEx" style="gap:6px"></div></div></div>');
  v.appendChild(box);
  ASK_EXAMPLES.forEach(e => { const c = h('<button type="button" class="chip">' + esc(pretty(e)) + '</button>'); c.onclick = () => runAsk(e); $('#askEx', box).appendChild(c); });
  $('#askIn', box).parentElement.insertBefore(keypad($('#askIn', box), 'ineq'), null);
  $('#askForm', box).onsubmit = e => { e.preventDefault(); const q = $('#askIn', box).value.trim(); if (q) runAsk(q); };
  v.appendChild(h('<div class="ask-out" id="askOut"></div>'));
  if (askQuery) { runAsk(askQuery); askQuery = ''; }
};

/* ================= TOOLS ================= */
const TOOLS = [
  ['solver', 'Equation & inequality solver'], ['numline', 'Number line'], ['graph', 'Linear graph plotter'], ['trans', 'Transformation lab'], ['cong', 'Congruence test finder'],
  ['sim', 'Similarity calculator'], ['xyz', '3D box coordinates'], ['fdp', 'Fraction · decimal · %'], ['pct', 'Percentage calculator'], ['calc', 'Calculator']
];
RENDER.tools = () => {
  const v = $('#v-tools'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Tools</h2><p>Pick a tool, change the numbers, and the answer and working update straight away.</p></div>'));
  const chips = h('<div class="row" role="tablist" style="gap:6px"></div>'); v.appendChild(chips);
  const panel = h('<div class="card stack"></div>'); v.appendChild(panel);
  TOOLS.forEach(([id, name]) => { const c = h('<button type="button" class="chip" role="tab" data-t="' + id + '">' + name + '</button>'); c.onclick = () => open(id); chips.appendChild(c); });
  function open(id) { state.tool = id; $$('.chip', chips).forEach(c => { c.classList.toggle('on', c.dataset.t === id); c.setAttribute('aria-selected', c.dataset.t === id); }); panel.innerHTML = ''; TOOL_FN[id](panel); }
  open(state.tool || 'solver');
};
function liveForm(panel, html, fn) {
  const f = h('<form class="stack">' + html + '</form>'); const out = h('<div class="tool-out" aria-live="polite"></div>'); panel.append(f, out);
  const run = () => { try { out.innerHTML = ''; const r = fn(f); if (typeof r === 'string') out.innerHTML = r; else if (r) out.appendChild(r); } catch (e) { out.innerHTML = '<div class="fb bad">' + esc(e.message) + '</div>'; } };
  f.addEventListener('input', run); f.addEventListener('change', run); f.onsubmit = e => { e.preventDefault(); run(); }; run(); return f;
}
const fv = (f, n) => f.elements[n].value;
const TOOL_FN = {
  solver(p) {
    p.appendChild(h('<div><h3>Equation &amp; inequality solver</h3><p class="small muted">Type any linear equation or inequality in one letter. Brackets, fractions like x/3 and decimals are fine. Use &lt;= or ≤ for “less than or equal to”.</p></div>'));
    const f = liveForm(p, '<label class="f">Equation or inequality<input type="text" name="q" id="solvIn" value="5 - 2x < 11" class="ans" style="width:100%"></label>', f => {
      const r = solveRel(fv(f, 'q'));
      return '<div class="fb info"><b>' + (r.special ? (r.special === 'all' ? 'Every value works' : 'No solution') : r.v + ' ' + opD(r.op) + ' ' + r.val.show()) + '</b></div>' + stepsHTML(r.steps) + (r.kind === 'ineq' && r.val ? '<div class="qfig">' + nlSVG(r.op, r.val.v) + '</div>' : '');
    });
    f.insertBefore(keypad(f.elements.q, 'ineq'), f.firstChild.nextSibling);
    const ex = h('<div class="row" style="gap:6px"></div>'); ['3(2x - 1) = 4x + 5', 'x/3 + 2 <= 5', '10 - 3x >= 1', '(x - 2)/3 = 5', '5x + 1 = 2x + 5', '12h + 50 >= 300', '0.8d + 4 = 20'].forEach(e => { const c = h('<button type="button" class="chip">' + esc(pretty(e)) + '</button>'); c.onclick = () => { f.elements.q.value = e; f.dispatchEvent(new Event('input')); }; ex.appendChild(c); });
    f.appendChild(ex);
  },
  numline(p) {
    p.appendChild(h('<div><h3>Number line builder</h3><p class="small muted">Build an inequality and see it on a number line, in words, with numbers that are and aren’t solutions.</p></div>'));
    liveForm(p, '<div class="row"><label class="f">Letter<input type="text" name="v" value="x" maxlength="1" style="width:60px"></label><label class="f">Sign<select name="op"><option value="<">&lt;</option><option value=">">&gt;</option><option value="<=">≤</option><option value=">=" selected>≥</option></select></label><label class="f">Number<input type="number" name="n" value="-2" step="any" style="width:110px"></label></div>', f => {
      const v = fv(f, 'v') || 'x', op = fv(f, 'op'), n = +fv(f, 'n'); if (isNaN(n)) throw new Error('Type a number.');
      const tests = [n - 2, n - 0.5, n, n + 0.5, n + 2];
      return '<div class="qfig">' + nlSVG(op, n) + '</div><p><b>' + v + ' ' + opD(op) + ' ' + fmt(n) + '</b> means ' + v + ' is ' + opWords(op) + ' ' + fmt(n) + '. ' + (op.includes('=') ? 'Closed circle: ' + fmt(n) + ' is included.' : 'Open circle: ' + fmt(n) + ' is not included.') + '</p><p class="small">Same meaning written backwards: <span class="m">' + fmt(n) + ' ' + opD(flipOp(op)) + ' ' + v + '</span></p><p class="small">' + tests.map(t => fmt(t) + (holds(t, op, n) ? ' ✓' : ' ✗')).join(' &nbsp; ') + '</p>';
    });
  },
  graph(p) {
    p.appendChild(h('<div><h3>Linear graph plotter</h3><p class="small muted">Type up to two rules in the form y = … to see the graph, a table of values, the gradient, the intercepts and where the lines meet.</p></div>'));
    liveForm(p, '<div class="grid2"><label class="f">Line 1<input type="text" name="a" value="y = 2x - 3" class="ans" style="width:100%"></label><label class="f">Line 2 (optional)<input type="text" name="b" value="y = 6 - 2x" class="ans" style="width:100%"></label></div>', f => {
      const lines = []; ['a', 'b'].forEach((k, i) => { const t = fv(f, k).trim(); if (!t) return; const r = parseRule(t); if (r.v && r.v !== 'x') throw new Error('Use x on the right-hand side of line ' + (i + 1) + '.'); lines.push({ m: r.a, c: r.b, cls: i ? 'b' : '' }); });
      if (!lines.length) return '';
      const xs = [-2, -1, 0, 1, 2, 3, 4]; let html = '<div class="grid2"><div class="qfig">' + gridSVG({ xmin: -8, xmax: 8, ymin: -8, ymax: 8, lines: lines.map(L => ({ m: L.m.v, c: L.c.v, cls: L.cls })), size: 320 }) + '</div><div class="stack">';
      lines.forEach((L, i) => { const xi = L.m.isZero() ? null : L.c.neg().div(L.m); html += '<div class="stack" style="gap:4px"><h4 class="' + (i ? 'pen' : '') + '" style="' + (i ? '' : 'color:var(--accent)') + '">Line ' + (i + 1) + ': y = ' + fmtLin(L.m, L.c) + '</h4><dl class="kv"><dt>gradient</dt><dd>' + L.m.show() + '</dd><dt>y-intercept</dt><dd>(0, ' + numStr(L.c) + ')</dd><dt>x-intercept</dt><dd>' + (xi ? '(' + xi.show() + ', 0)' : 'none') + '</dd></dl>' + tableHTML(xs, xs.map(x => L.m.v * x + L.c.v)) + '</div>'; });
      if (lines.length === 2) { const dm = lines[0].m.sub(lines[1].m); if (dm.isZero()) html += '<p class="fb info">Same gradient: the lines are parallel' + (lines[0].c.eq(lines[1].c) ? ' (in fact the same line)' : ' and never meet') + '.</p>'; else { const x = lines[1].c.sub(lines[0].c).div(dm), y = lines[0].m.mul(x).add(lines[0].c); html += '<p class="fb info">The lines meet at <b>(' + x.show() + ', ' + y.show() + ')</b>. Set the rules equal: ' + fmtLin(lines[0].m, lines[0].c) + ' = ' + fmtLin(lines[1].m, lines[1].c) + '.</p>'; } }
      return html + '</div></div>';
    });
    p.appendChild(h('<hr style="border:none;border-top:1px solid var(--rule);width:100%">'));
    p.appendChild(h('<h4>Gradient and rule from two points</h4>'));
    liveForm(p, '<div class="row"><label class="f">Point 1<input type="text" name="p1" value="(1, 2)" style="width:120px"></label><label class="f">Point 2<input type="text" name="p2" value="(4, 11)" style="width:120px"></label></div>', f => askEngine('line through ' + fv(f, 'p1') + ' and ' + fv(f, 'p2')) || '');
    p.appendChild(h('<h4>Is the point on the line?</h4>'));
    liveForm(p, '<div class="row"><label class="f">Point<input type="text" name="pt" value="(3, 2)" style="width:120px"></label><label class="f">Rule<input type="text" name="r" value="y = -2x + 8" style="width:180px"></label></div>', f => askEngine(fv(f, 'r') + ' ' + fv(f, 'pt')) || '');
  },
  trans(p) {
    p.appendChild(h('<div><h3>Transformation lab</h3><p class="small muted">Enter a shape, then apply reflections, translations and rotations one after another. Each image gets another prime (′). The grid shows every step.</p></div>'));
    const f = h('<form class="stack"><div class="row"><label class="f" style="flex:1 1 260px">Vertices<input type="text" name="pts" value="(1, 1), (4, 1), (1, 3)" class="ans" style="width:100%"></label><label class="f">Names<input type="text" name="nm" value="DEF" style="width:90px"></label></div>' +
      '<div class="row"><label class="f">Transformation<select name="op"><option value="rx">Reflect in the x-axis</option><option value="ry">Reflect in the y-axis</option><option value="ryx">Reflect in y = x</option><option value="rxk">Reflect in x = k</option><option value="ryk">Reflect in y = k</option><option value="t">Translate by vector (a, b)</option><option value="r90">Rotate 90° clockwise</option><option value="r-90">Rotate 90° anticlockwise</option><option value="r180">Rotate 180°</option></select></label><label class="f">k or a<input type="number" name="a" value="2" step="any" style="width:80px"></label><label class="f">b<input type="number" name="b" value="-3" step="any" style="width:80px"></label><label class="f">Centre (rotations)<input type="text" name="c" value="(0, 0)" style="width:100px"></label></div>' +
      '<div class="row"><button type="submit" class="btn">Apply to latest shape</button><button type="button" class="btn quiet" id="trUndo">Undo</button><button type="button" class="btn quiet" id="trReset">Start again</button></div></form>');
    const out = h('<div class="tool-out"></div>'); p.append(f, out);
    let steps = [];
    const base = () => { const c = parseCoords(f.elements.pts.value); if (!c || c.length < 1) throw new Error('Type vertices like (1, 1), (4, 1), (1, 3).'); return c.map(x => x.slice(0, 2)); };
    function draw() {
      try {
        const B = base(); const nm = (f.elements.nm.value || 'ABCDEFGH').replace(/\s/g, '').split('');
        const shapes = [B]; steps.forEach(s => shapes.push(shapes[shapes.length - 1].map(s.fn)));
        const lim = Math.max(6, ...shapes.flat(2).map(Math.abs)) + 1; const cls = ['', 'b', 'c', 'd', 'b', 'c', 'd'];
        let html = '<div class="grid2"><div class="qfig">' + gridSVG({ xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, mirrors: steps.filter(s => s.L).map(s => s.L), polys: shapes.map((S, i) => ({ pts: S, labels: S.map((_, j) => (nm[j] || '?') + primes(i)), cls: cls[i % cls.length] })), size: 340 }) + '</div><div class="stack">';
        html += '<p><b>Original:</b> ' + B.map((pt, j) => (nm[j] || '?') + ptStr(pt)).join(', ') + '</p>';
        steps.forEach((s, i) => { html += '<div class="stack" style="gap:2px"><b>Step ' + (i + 1) + ': ' + s.name + '</b><span class="small muted">' + s.rule + '</span><span class="m small">' + shapes[i + 1].map((pt, j) => (nm[j] || '?') + primes(i + 1) + ptStr(pt)).join(', ') + '</span></div>'; });
        if (!steps.length) html += '<p class="small muted">Choose a transformation and press “Apply”.</p>';
        out.innerHTML = html + '<p class="small muted">Reflections, translations and rotations never change size or shape, so every image is congruent to the original.</p></div></div>';
      } catch (e) { out.innerHTML = '<div class="fb bad">' + esc(e.message) + '</div>'; }
    }
    f.onsubmit = e => {
      e.preventDefault(); const op = f.elements.op.value, a = +f.elements.a.value || 0, b = +f.elements.b.value || 0; const cc = (parseCoords(f.elements.c.value) || [[0, 0]])[0] || [0, 0]; const cen = [cc[0], cc[1]];
      const atC = cen[0] || cen[1] ? ' about ' + ptStr(cen) : ' about the origin';
      const M = { rx: { L: { t: 'x-axis' } }, ry: { L: { t: 'y-axis' } }, ryx: { L: { t: 'y=x' } }, rxk: { L: { t: 'x=k', k: a } }, ryk: { L: { t: 'y=k', k: a } } }[op];
      if (M) steps.push({ name: 'Reflect in the ' + lineName(M.L), rule: reflectRule(M.L), fn: pt => reflectPt(pt, M.L), L: M.L });
      else if (op === 't') steps.push({ name: 'Translate by (' + fmt(a) + ', ' + fmt(b) + ')', rule: 'Move ' + (vecWords(a, b) || 'nowhere') + ': (x, y) → (x + ' + fmt(a) + ', y + ' + fmt(b) + ')', fn: pt => [pt[0] + a, pt[1] + b] });
      else { const ang = op === 'r180' ? 180 : 90, dir = op === 'r-90' ? 'acw' : 'cw'; steps.push({ name: 'Rotate ' + ang + '°' + (ang === 180 ? '' : dir === 'cw' ? ' clockwise' : ' anticlockwise') + atC, rule: (cen[0] || cen[1] ? 'Shift so the centre is at the origin, rotate, shift back. ' : '') + rotRule(ang, dir), fn: pt => rotatePt(pt, ang, dir, cen) }); }
      draw();
    };
    $('#trUndo', f).onclick = () => { steps.pop(); draw(); }; $('#trReset', f).onclick = () => { steps = []; draw(); };
    f.elements.pts.addEventListener('input', draw); f.elements.nm.addEventListener('input', draw); draw();
  },
  cong(p) {
    p.appendChild(h('<div><h3>Congruence test finder</h3><p class="small muted">Tell it which matching parts you know are equal and it names the test, or explains why there isn’t one.</p></div>'));
    liveForm(p, '<div class="row"><label class="f">Pairs of equal sides<select name="s"><option>0</option><option>1</option><option selected>2</option><option>3</option></select></label><label class="f">Pairs of equal angles<select name="a"><option>0</option><option selected>1</option><option>2</option><option>3</option></select></label><label class="f">Is the known angle between the two sides?<select name="inc"><option value="y">Yes (included)</option><option value="n">No</option></select></label><label class="f">Right angle in both, with equal hypotenuses?<select name="rh"><option value="n">No</option><option value="y">Yes</option></select></label></div>', f => {
      const s = +fv(f, 's'), a = +fv(f, 'a'), inc = fv(f, 'inc') === 'y', rh = fv(f, 'rh') === 'y';
      let t, why, good = true;
      if (rh && s >= 2) { t = 'RHS'; why = 'A right angle, the hypotenuse and one other side.'; }
      else if (s === 3) { t = 'SSS'; why = 'All three pairs of sides are equal.'; }
      else if (s >= 2 && a >= 1 && inc) { t = 'SAS'; why = 'Two sides and the angle between them.'; }
      else if (a >= 2 && s >= 1) { t = 'AAS'; why = 'Two angles and a matching side (the side must be in the same position in both triangles).'; }
      else if (a === 3 && s === 0) { good = false; t = 'Not congruent by any test'; why = 'Three equal angles (AAA) only prove the triangles are <b>similar</b>. They could be different sizes.'; }
      else if (s === 2 && a === 1 && !inc) { good = false; t = 'Not enough information'; why = 'Two sides and a non-included angle (SSA) can make two different triangles.'; }
      else { good = false; t = 'Not enough information'; why = 'You need at least three matching facts that fit SSS, SAS, AAS or RHS.'; }
      return '<div class="fb ' + (good ? 'good' : 'bad') + '"><b>' + t + '</b>: ' + why + '</div><p class="small">Write it like: “AB = PQ (given), ∠B = ∠Q (given), BC = QR (given), so △ABC ≅ △PQR (SAS).”</p>';
    });
  },
  sim(p) {
    p.appendChild(h('<div><h3>Similarity calculator</h3></div>'));
    p.appendChild(h('<h4>Scale factor and missing sides</h4>'));
    liveForm(p, '<div class="row"><label class="f">Original side<input type="number" name="o" value="6" step="any" style="width:110px"></label><label class="f">Matching image side<input type="number" name="i" value="15" step="any" style="width:110px"></label><label class="f">Another original side<input type="number" name="o2" value="4" step="any" style="width:110px"></label><label class="f">Another image side<input type="number" name="i2" value="12.5" step="any" style="width:110px"></label></div>', f => {
      const o = +fv(f, 'o'), i = +fv(f, 'i'); if (!o || !i) throw new Error('Type both matching sides.'); const k = i / o; const o2 = +fv(f, 'o2'), i2 = +fv(f, 'i2');
      return stepsHTML([{ t: 'k = ' + fmt(i) + ' ÷ ' + fmt(o) + ' = ' + fmt(k, 4), why: 'Scale factor = image ÷ original (' + (k > 1 ? 'enlargement' : k < 1 ? 'reduction' : 'congruent') + ')' }, o2 ? { t: fmt(o2) + ' × ' + fmt(k, 4) + ' = ' + fmt(o2 * k, 4), why: 'Original → image: multiply by k' } : null, i2 ? { t: fmt(i2) + ' ÷ ' + fmt(k, 4) + ' = ' + fmt(i2 / k, 4), why: 'Image → original: divide by k' } : null].filter(Boolean));
    });
    p.appendChild(h('<h4>Are two triangles similar? (SSS)</h4>'));
    liveForm(p, '<div class="grid2"><label class="f">Triangle 1 sides<input type="text" name="a" value="6, 8, 10"></label><label class="f">Triangle 2 sides<input type="text" name="b" value="9, 12, 15"></label></div>', f => {
      const A = fv(f, 'a').split(/[,\s]+/).filter(Boolean).map(Number).sort((x, y) => x - y), B = fv(f, 'b').split(/[,\s]+/).filter(Boolean).map(Number).sort((x, y) => x - y);
      if (A.length !== 3 || B.length !== 3 || A.concat(B).some(x => !(x > 0))) throw new Error('Type three positive side lengths for each triangle.');
      const r = A.map((x, i) => B[i] / x); const same = r.every(x => Math.abs(x - r[0]) < 1e-9);
      return stepsHTML(['Match smallest with smallest, and so on: ' + A.map((x, i) => fmt(B[i]) + ' ÷ ' + fmt(x) + ' = ' + fmt(r[i], 4)).join(', '), same ? '<b>Similar (SSS)</b> with scale factor ' + fmt(r[0], 4) + '.' : '<b>Not similar</b>: the ratios are not all equal.']);
    });
    p.appendChild(h('<h4>Shadows</h4>'));
    liveForm(p, '<div class="row"><label class="f">Object height<input type="number" name="h" value="4.5" step="any" style="width:110px"></label><label class="f">Its shadow<input type="number" name="s" value="3" step="any" style="width:110px"></label><label class="f">Other shadow<input type="number" name="S" value="8" step="any" style="width:110px"></label></div>', f => {
      const hh = +fv(f, 'h'), s = +fv(f, 's'), S = +fv(f, 'S'); if (!hh || !s || !S) throw new Error('Fill in all three.');
      return stepsHTML([{ t: 'k = ' + fmt(S) + ' ÷ ' + fmt(s) + ' = ' + fmt(S / s, 4), why: 'Shadows are matching sides' }, { t: 'height = ' + fmt(hh) + ' × ' + fmt(S / s, 4) + ' = ' + fmt(hh * S / s, 2) + ' m', why: 'Multiply by the scale factor' }]);
    });
  },
  xyz(p) {
    p.appendChild(h('<div><h3>3D box coordinates</h3><p class="small muted">A box with one corner at O(0, 0, 0). The x-axis comes towards you, y goes right, z goes up.</p></div>'));
    liveForm(p, '<div class="row"><label class="f">Length (x)<input type="number" name="l" value="2" min="1" max="8" style="width:90px"></label><label class="f">Width (y)<input type="number" name="w" value="4" min="1" max="8" style="width:90px"></label><label class="f">Height (z)<input type="number" name="h" value="3" min="1" max="8" style="width:90px"></label></div>', f => {
      const L = Math.max(1, Math.min(8, +fv(f, 'l') || 1)), W = Math.max(1, Math.min(8, +fv(f, 'w') || 1)), H = Math.max(1, Math.min(8, +fv(f, 'h') || 1));
      const V = { O: [0, 0, 0], A: [L, 0, 0], B: [L, W, 0], C: [0, W, 0], D: [0, 0, H], E: [L, 0, H], F: [L, W, H], G: [0, W, H] };
      return '<div class="grid2"><div class="qfig">' + boxSVG(L, W, H) + '</div><dl class="kv">' + Object.entries(V).map(([k, v]) => '<dt>' + k + '</dt><dd>' + ptStr(v) + '</dd>').join('') + '</dl></div>';
    });
  },
  fdp(p) {
    p.appendChild(h('<div><h3>Fraction · decimal · percentage converter</h3><p class="small muted">Type a fraction (3/8), a mixed number (1 1/4), a decimal (0.375) or a percentage (37.5%).</p></div>'));
    liveForm(p, '<label class="f">Number<input type="text" name="x" value="7/12" class="ans"></label>', f => {
      const raw = clean(fv(f, 'x')); let fr;
      if (/%$/.test(raw)) { const v = evalNum(raw.slice(0, -1)); if (isNaN(v)) throw new Error('Type a number before the %.'); fr = Fr.of(v).div(100); }
      else { const pf = parseFracInput(raw); if (!pf) throw new Error('Type a fraction, decimal or percentage.'); fr = pf.fr; }
      const ld = longDiv(fr.n, fr.d); const df = primeFactors(fr.d);
      return '<dl class="kv"><dt>Fraction (simplest)</dt><dd>' + fr + (Math.abs(fr.n) > fr.d && fr.d > 1 ? ' = ' + (fr.n < 0 ? '−' : '') + Math.floor(Math.abs(fr.n) / fr.d) + ' ' + (Math.abs(fr.n) % fr.d) + '/' + fr.d : '') + '</dd><dt>Decimal</dt><dd>' + decHTML(ld) + (ld.term ? ' (terminating)' : ' = ' + decLong(ld, 3) + ' (recurring)') + '</dd><dt>Percentage</dt><dd>' + fmt(fr.v * 100, 6) + '%</dd><dt>Why</dt><dd style="font-family:var(--f-body)">' + (fr.d === 1 ? 'Whole number.' : 'Denominator ' + fr.d + ' = ' + df.join(' × ') + (ld.term ? ': only 2s and 5s, so it terminates.' : ': has a factor other than 2 or 5, so it recurs.')) + '</dd><dt>Rounded</dt><dd>' + [0, 1, 2, 3].map(d => fr.v.toFixed(d) + ' (' + d + ' d.p.)').join(', ') + '</dd></dl>';
    });
  },
  pct(p) {
    p.appendChild(h('<div><h3>Percentage calculator</h3><p class="small muted">Pick the type of problem; the working is shown step by step.</p></div>'));
    const modes = { of: ['Find p% of an amount', ['p (%)', 35], ['Amount', 80]], as: ['Express a as a % of b', ['a', 18], ['b', 24]], inc: ['Increase by p%', ['Amount', 250], ['p (%)', 12]], dec: ['Decrease by p%', ['Amount', 1250], ['p (%)', 35]], chg: ['Percentage change', ['Original', 80], ['New', 100]], ori: ['Original before a % change', ['New amount', 144], ['% change (− for decrease)', 20]], uni: ['Unitary: p% is v, find q%', ['p (%)', 15], ['v', 27], ['q (%)', 4]], gstA: ['Add GST', ['Price before GST', 85]], gstR: ['Remove GST', ['Price including GST', 176]], prof: ['Profit or loss %', ['Cost price', 40], ['Selling price', 52]] };
    liveForm(p, '<label class="f">Problem<select name="m">' + Object.entries(modes).map(([k, v]) => '<option value="' + k + '">' + v[0] + '</option>').join('') + '</select></label><div class="row"><label class="f" id="l1">A<input type="number" name="a" value="35" step="any" style="width:130px"></label><label class="f" id="l2">B<input type="number" name="b" value="80" step="any" style="width:130px"></label><label class="f" id="l3">C<input type="number" name="c" value="4" step="any" style="width:130px"></label></div>', f => {
      const m = fv(f, 'm'), M = modes[m];
      if (f.dataset.m !== m) { f.dataset.m = m; ['a', 'b', 'c'].forEach((k, i) => { const lab = $('#l' + (i + 1), f); if (M[i + 1]) { lab.hidden = false; lab.firstChild.textContent = M[i + 1][0]; f.elements[k].value = M[i + 1][1]; } else lab.hidden = true; }); }
      const a = fv(f, 'a'), b = fv(f, 'b'), c = fv(f, 'c');
      const q = { of: a + '% of ' + b, as: a + ' out of ' + b, inc: 'increase ' + a + ' by ' + b + '%', dec: 'decrease ' + a + ' by ' + b + '%', chg: 'percentage change from ' + a + ' to ' + b, ori: 'after a ' + Math.abs(+b) + '% ' + (+b < 0 ? 'decrease' : 'increase') + ' it is ' + a, uni: a + '% of the total is ' + b + ' find ' + c + '%', gstA: 'add gst to ' + a, gstR: 'price including gst is ' + a, prof: 'profit from ' + a + ' to ' + b }[m];
      return askEngine(q) || '';
    });
  },
  calc(p) {
    p.appendChild(h('<div><h3>Calculator</h3><p class="small muted">Exact answers with fractions. Use + − × ÷ ( ) and ^ for powers. Example: (3 × 4 − 2) ÷ 5 or 2/3 + 1/4.</p></div>'));
    const f = liveForm(p, '<label class="f">Expression<input type="text" name="e" value="2/3 + 1/4" class="ans" style="width:100%"></label>', f => {
      const s = fv(f, 'e').trim(); if (!s) return ''; const L = parseLin(s); if (!L.isConst()) throw new Error('Use the Solver for expressions with letters.');
      const r = L.b; return '<div class="fb info"><span class="m" style="font-size:1.2rem">' + esc(pretty(s)) + ' = <b>' + (r.isInt() ? r.toString() : r.toString() + ' = ' + decHTML(longDiv(r.n, r.d))) + '</b></span></div>' + (r.isInt() ? '' : '<p class="small">≈ ' + fmt(r.v, 6) + '</p>');
    });
    f.appendChild(keypad(f.elements.e, 'rule'));
  }
};

/* ================= FLASHCARDS ================= */
RENDER.cards = () => {
  const v = $('#v-cards'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Flashcards</h2><p>Tap the card to flip it. Then tap <b>I knew it</b> or <b>Still learning</b>.</p></div>'));
  const known = store.get('cards', {});
  const ctr = h('<div class="card row" style="justify-content:space-between"><label class="f">Deck<select id="fcDeck"><option value="all">All topics</option>' + UNITS.map(u => '<option value="' + u.id + '">' + u.name + '</option>').join('') + '<option value="learning">Only cards I’m still learning</option></select></label><span class="small muted" id="fcProg"></span><button type="button" class="btn quiet sm" id="fcShuf">Shuffle</button></div>');
  v.appendChild(ctr);
  const area = h('<div class="stack" style="align-items:center"></div>'); v.appendChild(area);
  let deck = [], i = 0;
  function build() { const d = $('#fcDeck', ctr).value; deck = FLASH.map((c, k) => ({ c, k })).filter(({ c, k }) => d === 'all' ? true : d === 'learning' ? known[k] !== 1 : TOPIC[c[0]].unit === d); deck = shuffle(deck); i = 0; draw(); }
  function draw() {
    const kn = FLASH.filter((_, k) => known[k] === 1).length; $('#fcProg', ctr).textContent = kn + '/' + FLASH.length + ' known';
    area.innerHTML = '';
    if (!deck.length) { area.appendChild(h('<div class="card"><p>No cards here. Every card in this deck is marked as known. Pick another deck.</p></div>')); return; }
    const { c, k } = deck[i % deck.length];
    const card = h('<div class="flash"><div class="flash-in" tabindex="0" role="button" aria-label="Flip card"><div class="flash-face"><span class="tag" style="align-self:center">' + c[0] + ' · ' + TOPIC[c[0]].name + '</span><div class="fl-t">' + c[1] + '</div><span class="small muted">Tap to flip</span></div><div class="flash-face back"><div class="fl-t">' + c[2] + '</div></div></div></div>');
    const flip = () => card.classList.toggle('flipped'); $('.flash-in', card).onclick = flip; $('.flash-in', card).onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
    area.appendChild(card);
    const row = h('<div class="row" style="justify-content:center"><button type="button" class="btn quiet">Still learning</button><button type="button" class="btn">I knew it</button></div>');
    const [no, yes] = $$('button', row);
    no.onclick = () => { known[k] = 0; store.set('cards', known); deck.splice(Math.min(deck.length, i + 3), 0, deck[i]); i++; draw(); };
    yes.onclick = () => { known[k] = 1; store.set('cards', known); i++; if (i >= deck.length) { toast('Deck finished. Shuffling.'); build(); return; } draw(); };
    area.appendChild(row);
    area.appendChild(h('<span class="small muted">Card ' + (i % deck.length + 1) + ' of ' + deck.length + '</span>'));
  }
  $('#fcDeck', ctr).onchange = build; $('#fcShuf', ctr).onclick = build; build();
};

/* ================= GLOSSARY ================= */
RENDER.glossary = () => {
  const v = $('#v-glossary'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Maths words</h2><p>What every maths word means. Tap the topic code to learn more.</p></div>'));
  const s = h('<div class="card row"><label class="sr" for="glS">Search the glossary</label><input type="search" id="glS" placeholder="Search, e.g. gradient, kite, GST" style="flex:1 1 260px"></div>'); v.appendChild(s);
  const list = h('<dl class="gl-list"></dl>'); v.appendChild(list);
  const draw = () => {
    const q = $('#glS', s).value.toLowerCase().trim(); list.innerHTML = '';
    GLOSS.slice().sort((a, b) => a[0].localeCompare(b[0])).filter(g => !q || (g[0] + ' ' + g[1]).toLowerCase().includes(q)).forEach(g => {
      const it = h('<div class="gl-item"><dt><span>' + esc(g[0]) + '</span><button type="button" class="reflink">' + g[2] + '</button></dt><dd>' + esc(g[1]) + '</dd></div>'); $('button', it).onclick = () => openLearn(g[2]); list.appendChild(it);
    });
    if (!list.children.length) list.appendChild(h('<p class="muted">No matches. Try the Ask page for a fuller search.</p>'));
  };
  $('#glS', s).oninput = draw; draw();
};


/* ================= NEED TO KNOW (everything on one page + one question per topic) ================= */
RENDER.need = () => {
  const v = $('#v-need'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Need to know</h2><p>Everything for the exam on one page. Read each topic, then do the quick questions at the bottom: one on every topic.</p></div>'));
  const jump = h('<div class="row" style="gap:6px"></div>');
  UNITS.forEach(u => { const c = h('<button type="button" class="chip">' + u.name + '</button>'); c.onclick = () => document.getElementById('needU-' + u.id).scrollIntoView({ behavior: 'smooth', block: 'start' }); jump.appendChild(c); });
  const qc = h('<button type="button" class="chip on">Quick questions ↓</button>'); qc.onclick = () => document.getElementById('needQs').scrollIntoView({ behavior: 'smooth', block: 'start' }); jump.appendChild(qc);
  v.appendChild(jump);
  UNITS.forEach(u => {
    const card = h('<section class="card stack need-unit" id="needU-' + u.id + '"><div><span class="eyebrow">' + u.ch + '</span><h3>' + u.name + '</h3></div><div class="need-grid"></div></section>');
    TOPICS.filter(t => t.unit === u.id).forEach(t => {
      const Q = QUICK[t.id]; if (!Q) return;
      const el = h('<article class="need-topic"><div class="row" style="gap:8px;justify-content:space-between;align-items:baseline"><h4><span class="tag">' + t.id + '</span> ' + t.name + '</h4><button type="button" class="reflink">More detail</button></div><p class="need-what">' + Q.what + '</p><ol class="need-steps">' + Q.steps.map(x => '<li>' + x + '</li>').join('') + '</ol><p class="need-eg"><b>Example:</b> ' + Q.eg + '</p></article>');
      $('button', el).onclick = () => openLearn(t.id);
      $('.need-grid', card).appendChild(el);
    });
    v.appendChild(card);
  });
  const qq = h('<section class="card stack" id="needQs"><div class="row" style="justify-content:space-between"><div><h3>Quick questions</h3><p class="small muted">One question on every topic. Answer them all, then check your score.</p></div><div class="row"><div><div class="bignum" style="font-size:1.5rem" id="needScore">0/0</div><div class="small muted">right so far</div></div><button type="button" class="btn quiet sm" id="needNew">New set</button></div></div><div class="stack" id="needList" style="gap:16px"></div></section>');
  v.appendChild(qq);
  const load = () => {
    const list = $('#needList', qq); list.innerHTML = ''; let right = 0, done = 0; const total = TOPICS.length;
    const upd = () => { $('#needScore', qq).textContent = right + '/' + done; };
    upd();
    TOPICS.forEach((t, i) => {
      const Q = makeQ(pick(TOPIC_GENS[t.id]));
      const c = questionCard(Q, { num: (i + 1) + ' of ' + total, onAnswer: (ok, partial) => { if (partial) return; record(t.id, ok); done++; if (ok) right++; upd(); if (done === total) toast('All done: ' + right + ' out of ' + total); } });
      const w = h('<div class="need-q"></div>'); w.appendChild(c.el); list.appendChild(w);
    });
  };
  $('#needNew', qq).onclick = () => { load(); document.getElementById('needQs').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  load();
};

/* ================= theme + boot ================= */
document.documentElement.removeAttribute('data-theme');
const boot = () => show(location.hash.slice(1) || 'home');
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot();
