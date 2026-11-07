/* ================= small UI helpers ================= */
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
const state = { learn: store.get('learnTopic', 'C1'), practice: 'mix', tool: 'solver', bkPart: 'A' };
const tstats = store.get('tstats', {});
function record(topic, ok) { const s = tstats[topic] || (tstats[topic] = { a: 0, c: 0 }); s.a++; if (ok) s.c++; store.set('tstats', tstats); }
const acc = tid => { const s = tstats[tid]; return s && s.a ? s.c / s.a : null; };
const canStore = store.get('can', {});
const ckStore = store.get('check', {});
const bkMarks = store.get('bk', {});
function solHTML(Q) { return '<div class="sol"><div class="sol-title">Working</div>' + stepsHTML(Q.sol || []) + '</div>'; }
const KEYS = { eq: ['→', '+'], set: [','], ineq: ['<', '>', '≤', '≥', '−'], num: ['−', '/', '.', '$', '%'], coord: ['(', ')', ',', '−'], rule: ['=', 'x', '−', '/', '(', ')'], frac: ['/', '−'], nums: [',', '−', '.'], text: ['∠', '△'] };
function keypad(input, type) {
  const k = h('<div class="keys" aria-label="Symbol keys"></div>');
  (KEYS[type] || []).forEach(c => { const b = h('<button type="button" tabindex="-1">' + esc(c) + '</button>'); b.onclick = () => { const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s; input.value = input.value.slice(0, s) + c + input.value.slice(e); input.focus(); input.setSelectionRange(s + c.length, s + c.length); }; k.appendChild(b); });
  return k;
}
const PH = { eq: 'e.g. magnesium + oxygen → magnesium oxide', set: 'e.g. magnesium, oxygen', ineq: 'e.g. x > 4', num: 'e.g. 12.5 or 7/4', coord: 'e.g. (3, −2)', rule: 'e.g. y = 3x + 5', frac: 'e.g. 7/20', nums: 'e.g. −5, −3, −1', text: 'e.g. QR' };

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
const VIEWS = ['home', 'learn', 'practice', 'booklet', 'graph', 'exam', 'cards', 'glossary', 'theory'];
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
function openPractice(tid) { state.practice = tid; go('practice'); }
function openLearn(tid) { state.learn = tid; store.set('learnTopic', tid); go('learn'); }
function openTool() { go('graph'); }
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
    <ol class="start-steps">
      <li><span class="n">1</span><div class="stack" style="gap:6px"><h3>Learn</h3><p>Pick a topic and read the quick version.</p><button type="button" class="btn" data-go="learn">Learn a topic</button></div></li>
      <li><span class="n">2</span><div class="stack" style="gap:6px"><h3>Practise</h3><p>Answer questions until you can get 5 in a row.</p><button type="button" class="btn" data-go="practice-mix">Practise</button></div></li>
      <li><span class="n">3</span><div class="stack" style="gap:6px"><h3>Test yourself</h3><p>Do the workbook questions, the graph task, then a timed practice exam.</p><div class="row"><button type="button" class="btn" data-go="booklet">Workbook Qs</button><button type="button" class="btn ghost" data-go="graph">Graph task</button><button type="button" class="btn ghost" data-go="exam">Practice exam</button></div></div></li>
    </ol>
    <p class="small muted">Have an unlock code? Open the <button type="button" class="reflink" data-go="theory">completed theory booklet</button>.</p>
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
  const ck = h('<div class="card stack"><div class="stack" style="gap:4px"><h3>Skills checklist</h3><p class="muted small">From the revision booklet. Tap how sure you feel about each skill. Work on anything that isn’t “Got it” yet.</p></div><div class="scroll-x"><table class="check"><thead><tr><th>Skill</th><th>Practise with</th><th>Confidence</th><th></th></tr></thead><tbody></tbody></table></div></div>');
  const tb = $('tbody', ck); let idx = 0;
  CHECKLIST.forEach(([sec, items]) => {
    tb.appendChild(h('<tr class="sec"><td colspan="4">' + sec + '</td></tr>'));
    items.forEach(([skill, ref, tid]) => {
      const i = idx++; const tr = h('<tr><td>' + skill + '</td><td></td><td></td><td></td></tr>');
      tr.children[1].appendChild(bkRefLinks(ref)); tr.children[2].appendChild(confButtons('k' + i, ckStore, 'check'));
      const pb = h('<button type="button" class="btn quiet sm">Practise ' + tid + '</button>'); pb.onclick = () => openPractice(tid); tr.children[3].appendChild(pb);
      tb.appendChild(tr);
    });
  });
  v.appendChild(ck);

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
    if (t.tool) { const tb = h('<button type="button" class="btn ghost">Graph task</button>'); tb.onclick = () => openTool(t.tool); btns.appendChild(tb); }
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
  showTopic(TOPIC[state.learn] ? state.learn : TOPICS[0].id);
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
  v.appendChild(h('<div class="view-head"><h2>Practice</h2><p>Pick a topic, answer the question, press <b>Check</b>. For word equations, type them like <i>magnesium + oxygen → magnesium oxide</i>. You get two tries, and you can always see the working.</p></div>'));
  const ctr = h('<div class="card row" style="justify-content:space-between"><label class="f" style="flex:1 1 260px">Topic' + topicSelect('pSel', state.practice) + '</label><div class="row" id="pStats" style="gap:18px"></div></div>');
  v.appendChild(ctr);
  const sel = $('#pSel', ctr); sel.value = state.practice;
  const host = h('<div class="card stack"></div>'); v.appendChild(host);
  const statsEl = $('#pStats', ctr);
  const drawStats = () => { statsEl.innerHTML = '<div><div class="bignum" style="font-size:1.5rem">' + sess.c + '/' + sess.n + '</div><div class="small muted">this session</div></div><div><div class="bignum" style="font-size:1.5rem">' + sess.streak + '</div><div class="small muted">streak</div></div><div><div class="bignum" style="font-size:1.5rem">' + sess.best + '</div><div class="small muted">best streak</div></div>'; };
  drawStats();
  function next() {
    const tid = pickTopic(sel.value); const Q = makeQ(pick(TOPIC_GENS[tid]));
    host.innerHTML = '';
    const card = questionCard(Q, { onAnswer: (ok, partial) => {
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
  if (part.wq) return { type: 'eq', ans: part.wq };
  if (part.ss) return { type: 'set', ans: part.ss };
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
  v.appendChild(h('<div class="view-head"><h2>Workbook questions</h2><p>Questions from your Chemistry theory workbook (Part 2) plus the mass number questions. Try it first, then press <b>Check</b> or <b>Answer</b>. For full worked answers at three levels, open the <b>Completed booklet</b> tab.</p></div>'));
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

let askQuery = '';
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
  v.appendChild(h('<div class="view-head"><h2>Science words</h2><p>What every science word and question word means. Tap the topic code to learn more.</p></div>'));
  const s = h('<div class="card row"><label class="sr" for="glS">Search the glossary</label><input type="search" id="glS" placeholder="Search, e.g. precipitate, exothermic, justify" style="flex:1 1 260px"></div>'); v.appendChild(s);
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


/* ================= GRAPH TASK (Exothermic and endothermic graphing practice) ================= */
const SALT_T = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
const SALT_A = [21.0, 28.4, 32.8, 35.2, null, 35.8, 35.2, 34.6, 34.0, 33.5, 33.0];
const SALT_B = [21.0, 16.6, 14.3, 13.5, null, 17.9, 14.1, 14.6, 15.0, 15.5, 15.9];
const A120 = 36.1, B120 = 13.4;
const GRAPH_QS = [
  { id: 'g1', q: '<b>1. Identify</b> the independent and dependent variables shown in Table 1. (2 marks)', a: '<b>Independent:</b> time (s). <b>Dependent:</b> temperature of the solution (°C).' },
  { id: 'g2', q: '<b>2. Identify</b> two control variables in this investigation. (2 marks)', a: 'Any two: mass of salt (5.0 g), volume of water (50 mL), starting temperature (room temperature), type of cup (polystyrene), using distilled water, stirring the same way.' },
  { id: 'g3a', q: '<b>3a. Calculate</b> the mean temperature for Salt A at 120 s (trials 35.4, 36.9, 36.0 °C).', n: 36.1, a: '(35.4 + 36.9 + 36.0) ÷ 3 = 108.3 ÷ 3 = <b>36.1 °C</b>' },
  { id: 'g3b', q: '<b>3b. Calculate</b> the uncertainty for Salt A.', n: 0.75, tol: 0.06, a: '(36.9 − 35.4) ÷ 2 = <b>± 0.75 °C</b> (± 0.8 °C to 1 d.p.)' },
  { id: 'g3c', q: '<b>3c. Calculate</b> the mean temperature for Salt B at 120 s (trials 12.6, 14.6, 13.0 °C).', n: 13.4, a: '(12.6 + 14.6 + 13.0) ÷ 3 = 40.2 ÷ 3 = <b>13.4 °C</b>' },
  { id: 'g3d', q: '<b>3d. Calculate</b> the uncertainty for Salt B.', n: 1.0, a: '(14.6 − 12.6) ÷ 2 = <b>± 1.0 °C</b>' },
  { id: 'g5a', q: '<b>5a. Calculate</b> the maximum temperature change (ΔT) for Salt A. (Use the 120 s mean.)', n: 15.1, signed: true, a: 'Highest temperature 36.1 °C (120 s). ΔT = 36.1 − 21.0 = <b>+15.1 °C</b>' },
  { id: 'g5b', q: '<b>5b. Calculate</b> the maximum temperature change (ΔT) for Salt B. (Use a minus sign for a decrease.)', n: -7.6, signed: true, a: 'Lowest temperature 13.4 °C (120 s). ΔT = 13.4 − 21.0 = <b>−7.6 °C</b> (a decrease of 7.6 °C)' },
  { id: 'g6', q: '<b>6. Classify</b> each salt as dissolving exothermically or endothermically. <b>Justify</b> your answer using data. (2 marks)', a: '<b>Salt A (calcium chloride) is exothermic:</b> the temperature rose from 21.0 °C to 36.1 °C, so energy was released to the surroundings.<br><b>Salt B (ammonium nitrate) is endothermic:</b> the temperature fell from 21.0 °C to 13.4 °C, so energy was absorbed from the surroundings.' },
  { id: 'g7', q: '<b>7. Describe</b> the trend shown for Salt A. Use data to support your answer. (2 marks)', a: 'The temperature rose quickly at first, from 21.0 °C to 35.2 °C in the first 90 s, peaked at about 36.1 °C at 120 s, then slowly fell to 33.0 °C by 300 s as heat was lost to the surroundings.' },
  { id: 'g8', q: '<b>Extra:</b> is there a result that doesn’t fit the pattern?', a: 'Salt B at 150 s (17.9 °C) looks like an <b>anomaly</b>: the readings around it are 13.4 °C and 14.1 °C. It may be a recording or measuring error, so it is best left out of the trend line.' }
];
RENDER.graph = () => {
  const v = $('#v-graph'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Graph task</h2><p>The salts worksheet: temperature changes when two salts dissolve. Answer the questions, then build the graph by tapping the grid.</p></div>'));
  const tbl = (rows) => '<div class="scroll-x"><table class="vals">' + rows + '</table></div>';
  v.appendChild(h('<div class="card stack"><h3>The investigation</h3><p>5.0 g of each salt was added to 50 mL of distilled water at room temperature in a polystyrene cup. The mixture was stirred and the temperature was recorded every 30 s for 5 minutes. Each experiment was repeated three times and the mean was calculated. <b>Salt A:</b> calcium chloride. <b>Salt B:</b> ammonium nitrate.</p><p class="small"><b>Table 1:</b> Mean temperature (°C)</p>' +
    tbl('<tr><th>Time (s)</th>' + SALT_T.map(t => '<td>' + t + '</td>').join('') + '</tr><tr><th>Salt A</th>' + SALT_A.map(x => '<td>' + (x == null ? '?' : x.toFixed(1)) + '</td>').join('') + '</tr><tr><th>Salt B</th>' + SALT_B.map(x => '<td>' + (x == null ? '?' : x.toFixed(1)) + '</td>').join('') + '</tr>') +
    '<p class="small"><b>Table 2:</b> Trial results at 120 s</p>' + tbl('<tr><th>Salt</th><th>Trial 1</th><th>Trial 2</th><th>Trial 3</th></tr><tr><th>A</th><td>35.4</td><td>36.9</td><td>36.0</td></tr><tr><th>B</th><td>12.6</td><td>14.6</td><td>13.0</td></tr>') +
    '<p class="small muted">Uncertainty = (highest − lowest) ÷ 2</p></div>'));
  const qs = h('<div class="card stack"><h3>Questions</h3></div>');
  GRAPH_QS.forEach(g => {
    const row = h('<div class="stack" style="gap:6px;border-top:1px dotted var(--rule);padding-top:10px"><div>' + g.q + '</div><div class="row ctrl"></div><div class="fb info" hidden>' + g.a + '</div></div>');
    const ctrl = $('.ctrl', row), ans = $('.fb', row);
    if (g.n !== undefined) {
      const inp = h('<input class="ans" type="text" style="width:min(100%,180px)" placeholder="e.g. 36.1" aria-label="Your answer">'); const cb = h('<button type="button" class="btn sm">Check</button>'); const msg = h('<span class="small"></span>');
      const go_ = () => { const r = checkAnswer({ type: 'num', ans: g.n, tol: g.tol || 0.051, signed: g.signed }, inp.value); if (r.empty || r.bad) { msg.textContent = r.msg; return; } msg.innerHTML = r.ok ? '<b class="result-good">✓ Correct</b>' : '<b class="result-bad">✗ Not quite</b>'; ans.hidden = false; };
      cb.onclick = go_; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go_(); }); ctrl.append(inp, cb, msg);
    }
    const sb = h('<button type="button" class="btn ghost sm">Answer</button>'); sb.onclick = () => { ans.hidden = !ans.hidden; }; ctrl.appendChild(sb);
    qs.appendChild(row);
  });
  v.appendChild(qs);
  // interactive graph
  const card = h('<div class="card stack"><h3>4. Construct the graph</h3><p class="small">Pick a salt, then tap the grid to plot each point (it snaps to the nearest 30 s and 0.1 °C). Tap a point again to remove it. Include your 120 s means. Then press <b>Check my graph</b>.</p><div class="row"><span class="small muted">Plotting:</span><button type="button" class="chip on" data-s="A">Salt A: calcium chloride</button><button type="button" class="chip" data-s="B">Salt B: ammonium nitrate</button></div><div class="graph-host"></div><div class="row"><button type="button" class="btn" id="gCheck">Check my graph</button><button type="button" class="btn ghost" id="gShow">Show the correct graph</button><button type="button" class="btn quiet" id="gClear">Clear</button></div><div id="gMsg" class="stack"></div></div>');
  v.appendChild(card);
  let cur = 'A', show = false; const mine = store.get('graphPts', { A: [], B: [] });
  const full = s => SALT_T.map((t, i) => [t, (s === 'A' ? SALT_A : SALT_B)[i] ?? (s === 'A' ? A120 : B120)]);
  const W = 560, H = 340, pl = 52, pr = 16, pt = 18, pb = 46, xmax = 300, ymin = 10, ymax = 40;
  const X = x => pl + x / xmax * (W - pl - pr), Y = y => pt + (ymax - y) / (ymax - ymin) * (H - pt - pb);
  function draw() {
    const series = [{ name: 'Salt A (yours)', pts: mine.A.slice().sort((a, b) => a[0] - b[0]), cls: '' }, { name: 'Salt B (yours)', pts: mine.B.slice().sort((a, b) => a[0] - b[0]), cls: 'b', shape: 'sq' }];
    if (show) { series.push({ name: 'Salt A (answer)', pts: full('A'), cls: 'c', line: true }); series.push({ name: 'Salt B (answer)', pts: full('B'), cls: 'd', line: true, shape: 'sq' }); }
    $('.graph-host', card).innerHTML = lineChartSVG({ w: W, h: H, xmin: 0, xmax, xstep: 30, ymin, ymax, ystep: 5, xLabel: 'Time (s)', yLabel: 'Temperature (°C)', series, legend: true, label: 'Temperature of the solution over time' });
    const svg = $('svg', card); svg.style.cursor = 'crosshair';
    svg.addEventListener('click', e => {
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse());
      const t = Math.round(((q.x - pl) / (W - pl - pr) * xmax) / 30) * 30; const temp = Math.round((ymax - (q.y - pt) / (H - pt - pb) * (ymax - ymin)) * 10) / 10;
      if (t < 0 || t > xmax || temp < ymin || temp > ymax) return;
      const arr = mine[cur]; const near = arr.findIndex(a => a[0] === t && Math.abs(a[1] - temp) < 0.8);
      if (near >= 0) arr.splice(near, 1); else { const same = arr.findIndex(a => a[0] === t); if (same >= 0) arr.splice(same, 1); arr.push([t, temp]); }
      store.set('graphPts', mine); draw();
    });
  }
  $$('[data-s]', card).forEach(b => b.onclick = () => { cur = b.dataset.s; $$('[data-s]', card).forEach(x => x.classList.toggle('on', x === b)); });
  $('#gClear', card).onclick = () => { mine.A = []; mine.B = []; store.set('graphPts', mine); $('#gMsg', card).innerHTML = ''; draw(); };
  $('#gShow', card).onclick = () => { show = !show; $('#gShow', card).textContent = show ? 'Hide the correct graph' : 'Show the correct graph'; draw(); };
  $('#gCheck', card).onclick = () => {
    const res = ['A', 'B'].map(s => { const want = full(s); let ok = 0; want.forEach(([t, y]) => { if (mine[s].some(([mt, my]) => mt === t && Math.abs(my - y) <= 0.6)) ok++; }); return [s, ok, want.length]; });
    const all = res.every(r => r[1] === r[2]);
    $('#gMsg', card).innerHTML = '<div class="fb ' + (all ? 'good' : 'info') + '">' + res.map(([s, ok, n]) => '<b>Salt ' + s + ':</b> ' + ok + ' of ' + n + ' points correct').join('<br>') + (all ? '<br>Great graph. Remember a title (e.g. “Temperature of salt solutions over 5 minutes”), labelled axes with units, a smooth trend line for each salt and a legend.' : '<br>Check the points that are missing or off. Use 36.1 °C (A) and 13.4 °C (B) at 120 s.') + '</div>';
  };
  draw();
};

/* ================= COMPLETED THEORY BOOKLET (locked) ================= */
const LEVELS = [['min', 'Minimal'], ['norm', 'Normal'], ['extra', 'Extra info']];
let theoryData = null;
RENDER.theory = async () => {
  const v = $('#v-theory'); v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Completed theory booklet</h2><p>The whole Year 8 Chemistry theory workbook, completed. Switch between <b>Minimal</b>, <b>Normal</b> and <b>Extra info</b> answers.</p></div>'));
  const body = h('<div class="stack"><p class="muted">Checking access…</p></div>'); v.appendChild(body);
  let st; try { st = await (await fetch('/api/unlock/theory', { credentials: 'same-origin' })).json(); } catch (e) { body.innerHTML = '<div class="fb bad">Can’t reach the server. Check your connection and try again.</div>'; return; }
  if (!st.unlocked) return lockedView(body);
  loadTheory(body);
};
function lockedView(body) {
  body.innerHTML = '';
  const c = h('<div class="card stack lock-card"><span class="eyebrow">Locked</span><h3>Enter your unlock code</h3><p>Got a 6-digit code? Type it below. Each code works once, and then this account can open the completed booklet forever.</p><form class="row" id="unlockForm"><label class="sr" for="codeIn">Unlock code</label><input id="codeIn" class="ans" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="e.g. 482913" style="width:min(100%,200px);font-size:1.2rem;letter-spacing:.15em"><button class="btn" type="submit">Unlock</button></form><div id="unlockMsg"></div></div>');
  body.appendChild(c);
  $('#unlockForm', c).onsubmit = async e => {
    e.preventDefault(); const m = $('#unlockMsg', c); m.innerHTML = '';
    try {
      const r = await fetch('/api/unlock', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: $('#codeIn', c).value }) });
      const j = await r.json();
      if (!r.ok) { m.innerHTML = '<div class="fb bad">' + esc(j.error || 'That didn’t work.') + '</div>'; return; }
      toast('Unlocked'); loadTheory(body);
    } catch (err) { m.innerHTML = '<div class="fb bad">Can’t reach the server. Try again.</div>'; }
  };
}
async function loadTheory(body) {
  body.innerHTML = '<p class="muted">Loading the completed booklet…</p>';
  if (!theoryData) {
    const r = await fetch('/api/theory', { credentials: 'same-origin' });
    if (r.status === 403) return lockedView(body);
    if (!r.ok) { body.innerHTML = '<div class="fb bad">Couldn’t load the booklet. Try again later.</div>'; return; }
    theoryData = await r.json();
  }
  let level = store.get('theoryLevel', 'norm');
  body.innerHTML = '';
  const bar = h('<div class="card row level-bar" style="justify-content:space-between"><div class="row" role="radiogroup" aria-label="Answer level"></div><select id="thJump" aria-label="Jump to a section" style="max-width:100%;width:auto"><option value="">Jump to a section…</option></select></div>');
  const lv = $('.row', bar);
  LEVELS.forEach(([k, n]) => { const b = h('<button type="button" class="chip" role="radio" data-l="' + k + '">' + n + '</button>'); b.onclick = () => { level = k; store.set('theoryLevel', k); paint(); }; lv.appendChild(b); });
  body.appendChild(bar);
  const list = h('<div class="stack"></div>'); body.appendChild(list);
  const sel = $('#thJump', bar);
  theoryData.sections.forEach((s, i) => sel.appendChild(h('<option value="th-' + i + '">' + esc((s.part ? s.part + ' · ' : '') + s.title) + '</option>')));
  sel.onchange = () => { const t = document.getElementById(sel.value); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); sel.value = ''; };
  function paint() {
    $$('[data-l]', bar).forEach(b => { const on = b.dataset.l === level; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    list.innerHTML = '';
    theoryData.sections.forEach((s, i) => {
      const card = h('<section class="card stack th-sec" id="th-' + i + '"><div><span class="eyebrow">' + esc(s.part || '') + '</span><h3>' + s.title + '</h3>' + (s.intro ? '<p class="small muted">' + s.intro + '</p>' : '') + '</div></section>');
      s.items.forEach(it => {
        const ans = level === 'min' ? (it.min || it.norm) : it.norm;
        const el = h('<div class="th-item"><div class="th-q">' + it.q + '</div><div class="th-a">' + ans + '</div></div>');
        if (it.fig && level !== 'min') el.insertAdjacentHTML('beforeend', '<div class="qfig">' + it.fig + '</div>');
        if (level === 'extra' && it.plus) el.insertAdjacentHTML('beforeend', '<div class="th-plus"><span class="eyebrow">Extra info</span><div>' + it.plus + '</div></div>');
        card.appendChild(el);
      });
      list.appendChild(card);
    });
  }
  paint();
}

/* ================= theme + boot ================= */
document.documentElement.removeAttribute('data-theme');
const boot = () => show(location.hash.slice(1) || 'home');
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot();
