/* ================= Practice filters (shared by Maths and Science) =================
   Difficulty: each question type has a level in DIFF (easy e / medium m / hard h, set in long.js).
   Type: multiple choice, short answer (typed), or long response (explain, self-marked with a checklist).
   Typed questions can be turned into multiple choice with believable wrong answers (common slips),
   and two-option questions can be turned into a short typed answer, so every topic offers every type. */
const PDIFF = [['any', 'Any level'], ['e', 'Easy'], ['m', 'Medium'], ['h', 'Hard']];
const PTYPE = [['any', 'Any type'], ['mcq', 'Multiple choice'], ['short', 'Short answer'], ['long', 'Long response']];
const DIFF_NAME = { e: 'Easy', m: 'Medium', h: 'Hard' };
const diffOf = id => (typeof DIFF !== 'undefined' && DIFF[id]) || 'm';
const near = { e: ['e', 'm', 'h'], m: ['m', 'e', 'h'], h: ['h', 'm', 'e'] };

// numbers as the site shows them (keeps − signs tidy)
const showNum = v => (typeof fmt === 'function' ? fmt(v) : String(v)).replace(/^-/, '−');
function numWrongs(a) {
  const out = new Set(); const w = v => { if (isFinite(v) && Math.abs(v - a) > 1e-9) out.add(showNum(Math.round(v * 10000) / 10000)); };
  w(-a); w(a + 1); w(a - 1); w(a * 2); w(a / 2); w(a * 10); w(a / 10); w(a + 10); w(a - 10); w(100 - a); w(a + 2); w(a - 2);
  if (Number.isInteger(a) && Math.abs(a) > 3) { w(a + (a > 0 ? 5 : -5)); w(Math.round(a * 1.1)); }
  return [...out];
}
// Turn a typed-answer question into multiple choice. Returns null when it can't be done sensibly.
function asMCQ(Q) {
  if (!Q) return null;
  if (Q.type === 'mcq') return Q;
  let right = null, wrongs = [];
  if (Q.type === 'num' && typeof Q.ans === 'number') { right = showNum(Q.ans); wrongs = numWrongs(Q.ans); }
  else if (Q.type === 'coord' && Array.isArray(Q.ans) && Q.ans.length >= 2 && Q.ans.length <= 3 && Q.ans.every(v => typeof v === 'number')) {
    const [x, y, z] = Q.ans; const P = (...c) => '(' + c.map(showNum).join(', ') + ')';
    right = z === undefined ? P(x, y) : P(x, y, z);
    wrongs = z === undefined ? [P(y, x), P(-x, y), P(x, -y), P(-x, -y), P(-y, x), P(y, -x)] : [P(y, x, z), P(x, z, y), P(z, y, x), P(-x, y, z), P(x, -y, z)];
  } else if (Q.type === 'text' && Q.accept && Q.ansText) return null;
  else if (typeof Q.ansText === 'string' && Q.ansText && Q.type === 'frac') {
    const [n, d] = Q.ansText.split('/'); right = Q.ansText;
    if (d) wrongs = [d + '/' + n, n + '/' + (+d * 2), (+n + 1) + '/' + d, (+n * 2) + '/' + (+d * 2) === right ? (+n + 1) + '/' + (+d + 1) : (+n * 2) + '/' + d, n + '/' + (+d + 1)];
  } else if (typeof Q.ansText === 'string' && Q.ansText && (Q.type === 'rule' || Q.type === 'ineq')) {
    right = Q.ansText; const t = right;
    const swaps = [[/ \+ /, ' − '], [/ − /, ' + '], [/=\s*−/, '= '], [/= (?=\d)/, '= −'], [/&lt;=|≤/, '&lt;'], [/&gt;=|≥/, '&gt;'], [/&lt;(?!=)/, '&gt;'], [/&gt;(?!=)/, '&lt;'], [/≤/, '≥'], [/≥/, '≤'], [/</, '>'], [/>/, '<']];
    swaps.forEach(([re, to]) => { if (re.test(t)) wrongs.push(t.replace(re, to)); });
    // swap the gradient and the intercept (a common slip), written tidily: no "1x", no dangling "+"
    const m = t.match(/=\s*(−?[\d.]*)x\s*([+−])\s*([\d.]+)/);
    if (m) { const g = m[1].replace('−', '') || '1'; wrongs.push(t.replace(m[0], '= ' + (m[2] === '−' ? '−' : '') + (m[3] === '1' ? '' : m[3]) + 'x + ' + g)); }
  } else return null;
  wrongs = [...new Set(wrongs.filter(w => w && w !== right))];
  if (wrongs.length < 3 || !right) return null;
  const opts = shuffle([right].concat(shuffle(wrongs).slice(0, 3)));
  return Object.assign({}, Q, { type: 'mcq', choices: opts, ans: opts.indexOf(right), ansText: right, hint: Q.hint });
}
// Turn a short two/three-option multiple choice (e.g. Physical/Chemical, True/False) into a typed answer.
function asShort(Q) {
  if (!Q) return null;
  if (Q.type !== 'mcq') return Q;
  if (Q.choices.length <= 5 && Q.choices.every(c => !/[<>]/.test(c) && c.split(' ').length <= 3 && c.length <= 26)) {
    const a = Q.choices[Q.ans]; const short = a.replace(/ change$/i, '');
    return Object.assign({}, Q, { type: 'text', q: Q.q + '<br><span class="small muted">Type your answer: ' + Q.choices.map(c => '<i>' + c.replace(/ change$/i, '') + '</i>').join(' or ') + '.</span>', accept: [a, short, a.toLowerCase(), short.toLowerCase()], ansText: a, choices: undefined });
  }
  return null;
}
let TYPE_CAN = null; // which kinds each generator can produce (worked out once by sampling)
function typeCan(id) {
  if (!TYPE_CAN) TYPE_CAN = {};
  if (!TYPE_CAN[id]) { const s = new Set(); for (let i = 0; i < 8; i++) { try { const q = G[id].fn(); s.add(q.type === 'mcq' ? 'mcq' : 'short'); if (q.type !== 'mcq' && asMCQ(q)) s.add('mcq?'); if (q.type === 'mcq' && asShort(q)) s.add('short?'); } catch (e) { /* skip */ } } TYPE_CAN[id] = s; }
  return TYPE_CAN[id];
}
// Pick a question for a topic with the chosen level and type. Returns { Q, note } (note explains any fallback).
function pickPractice(tid, diff, type) {
  if (type === 'long') {
    const pool = (LONG_GENS[tid] || []);
    if (!pool.length) return { Q: null, note: 'There are no long-response questions for this topic yet.' };
    for (const d of diff === 'any' ? ['any'] : near[diff]) {
      const ok = pool.filter(id => d === 'any' || LONG[id].d === d);
      if (ok.length) return { Q: makeLong(pick(ok)), note: d !== diff && diff !== 'any' ? 'No ' + DIFF_NAME[diff].toLowerCase() + ' long-response questions here yet, so this one is ' + DIFF_NAME[d].toLowerCase() + '.' : '' };
    }
  }
  const gens = TOPIC_GENS[tid];
  for (const d of diff === 'any' ? ['any'] : near[diff]) {
    const ok = gens.filter(id => d === 'any' || diffOf(id) === d);
    if (!ok.length) continue;
    for (let i = 0; i < 40; i++) {
      const id = pick(ok);
      if (type !== 'any') { const can = typeCan(id); if (type === 'mcq' && !can.has('mcq') && !can.has('mcq?')) continue; if (type === 'short' && !can.has('short') && !can.has('short?')) continue; }
      let Q = makeQ(id);
      if (type === 'mcq') Q = asMCQ(Q); else if (type === 'short') Q = asShort(Q);
      if (Q) return { Q, note: d !== diff && diff !== 'any' ? 'This topic has no ' + DIFF_NAME[diff].toLowerCase() + (type === 'any' ? '' : ' ' + PTYPE.find(t => t[0] === type)[1].toLowerCase()) + ' questions, so this one is ' + DIFF_NAME[d].toLowerCase() + '.' : '' };
    }
  }
  // nothing fits that type: say so and give a normal question
  return { Q: makeQ(pick(gens)), note: 'This topic doesn’t have ' + PTYPE.find(t => t[0] === type)[1].toLowerCase() + ' questions, so here’s a different kind.' };
}
function makeLong(id) { const L = LONG[id]; const q = L.fn(); q.type = 'long'; q.gen = id; q.topic = L.t; q.gname = L.name; q.diff = L.d; return q; }

// Long response: write, then compare with the model answer and tick off the marking points.
function longCard(Q, opts = {}) {
  const el = h('<div class="qcard"></div>');
  el.innerHTML = '<div class="qhead"><span class="row" style="gap:6px"><span class="tag">' + Q.topic + '</span><span class="small muted">' + esc(Q.gname || '') + ' · long response</span></span><span class="small muted">' + Q.points.length + ' marks</span></div>' +
    '<div class="qtext">' + Q.q + '</div>' + (Q.fig ? '<div class="qfig">' + Q.fig + '</div>' : '') +
    '<label class="sr" for="lr' + (++svgN) + '">Your answer</label><textarea id="lr' + svgN + '" class="long-ans" rows="6" placeholder="Write your answer in full sentences. Use science/maths words and any numbers you have."></textarea>' +
    '<div class="row"><button type="button" class="btn" data-check>Check my answer</button><span class="small muted">You’ll see a model answer and tick off the marking points yourself.</span></div><div class="lr-mark stack" hidden></div>';
  const ta = $('textarea', el), mark = $('.lr-mark', el);
  $('[data-check]', el).onclick = () => {
    if (ta.value.trim().length < 15 && !confirm('Your answer is very short. Check it anyway?')) return;
    $('[data-check]', el).disabled = true; ta.readOnly = true; mark.hidden = false;
    mark.innerHTML = '<div class="fb info"><b>Model answer:</b> ' + Q.model + '</div><b>Tick each marking point your answer includes:</b><div class="lr-points stack"></div><div class="row"><button type="button" class="btn" data-done>Done marking</button></div><div class="lr-score" aria-live="polite"></div>';
    const pts = $('.lr-points', mark);
    Q.points.forEach((p, i) => pts.appendChild(h('<label class="lr-pt"><input type="checkbox" data-i="' + i + '"> <span>' + p + '</span></label>')));
    $('[data-done]', mark).onclick = () => {
      const got = $$('input:checked', pts).length, tot = Q.points.length; const ok = got / tot >= 0.6;
      $$('input', pts).forEach(x => x.disabled = true); $('[data-done]', mark).disabled = true;
      $('.lr-score', mark).innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '"><b>' + got + ' / ' + tot + ' marks.</b> ' + (ok ? 'Nice work.' : 'Compare your answer with the model answer and see what was missing.') + '</div>';
      el.dataset.done = '1'; if (opts.onAnswer) opts.onAnswer(ok, false);
    };
  };
  return { el, focus: () => ta.focus() };
}
// Filter bar shown at the top of Practice
function practiceFilters(onChange) {
  const bar = h('<div class="pfilters"><div class="pf-row" role="group" aria-label="Difficulty"><span class="small muted">Difficulty</span></div><div class="pf-row" role="group" aria-label="Question type"><span class="small muted">Question type</span></div></div>');
  const rows = $$('.pf-row', bar);
  const subj = location.pathname.startsWith('/maths') ? 'maths' : 'science';
  bar.appendChild(h('<a class="pf-play" href="/play/?subject=' + subj + '"><span><b>🎮 Play with friends</b> <span class="small muted">Make a game code, your friends join, and you race to answer.</span></span><span class="btn sm">Play →</span></a>'));
  [[PDIFF, 'pDiff', rows[0]], [PTYPE, 'pType', rows[1]]].forEach(([list, key, row]) => {
    list.forEach(([k, n]) => {
      const b = h('<button type="button" class="chip">' + n + '</button>'); b.dataset.k = k;
      const on = () => (store.get(key, 'any') === k); b.classList.toggle('on', on()); b.setAttribute('aria-pressed', on());
      b.onclick = () => { store.set(key, k); $$('.chip', row).forEach(x => { const o = x.dataset.k === k; x.classList.toggle('on', o); x.setAttribute('aria-pressed', o); }); onChange(); };
      row.appendChild(b);
    });
  });
  return bar;
}

/* ---------- 🚩 Report a mistake: on every question card ---------- */
function reportMistakeBtn(Q) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'rep-btn'; b.textContent = '🚩 Report a mistake'; b.title = 'Tell Beau if something about this question is wrong';
  b.onclick = () => {
    const card = b.closest('.qcard'); if (!card || card.querySelector('.rep-box')) return;
    const plain = x => { const d = document.createElement('div'); d.innerHTML = String(x || ''); d.querySelectorAll('svg').forEach(v => v.remove()); return d.textContent.replace(/\s+/g, ' ').trim(); };
    const box = document.createElement('form'); box.className = 'rep-box'; box.noValidate = true;
    box.innerHTML = '<b>What’s wrong with this question?</b><div class="rep-opts">' + [['answer', 'The answer is wrong'], ['working', 'The working is wrong'], ['question', 'The question doesn’t make sense'], ['typo', 'There’s a typo'], ['other', 'Something else']]
      .map(([v, t], i) => '<label><input type="radio" name="why" value="' + v + '"' + (i === 0 ? ' checked' : '') + '> ' + t + '</label>').join('') + '</div>'
      + '<label class="rep-note">Tell Beau more (optional)<textarea maxlength="400" rows="2" placeholder="e.g. I think the answer should be 12"></textarea></label>'
      + '<div class="rep-row"><button type="submit" class="btn sm">Send to Beau</button><button type="button" class="btn quiet sm rep-x">Cancel</button><span class="rep-out" role="status"></span></div>';
    box.querySelector('.rep-x').onclick = () => box.remove();
    box.onsubmit = async e => {
      e.preventDefault(); const out = box.querySelector('.rep-out'), send = box.querySelector('button[type=submit]'); send.disabled = true; out.textContent = '';
      const body = { subject: location.pathname.startsWith('/science') ? 'science' : 'maths', gen: Q.gen || '', topic: Q.topic || '', gname: Q.gname || '', q: plain(Q.q), ans: plain(Q.ansText), why: box.querySelector('input[name=why]:checked').value, note: box.querySelector('textarea').value };
      let ok = false, j = {}; try { const r = await fetch('/api/report-question', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); ok = r.ok; j = await r.json(); } catch (err) { j = { error: 'Can’t reach the server.' }; }
      if (!ok) { send.disabled = false; out.textContent = j.error || 'Couldn’t send it.'; return; }
      box.innerHTML = '<b>✅ Thanks! Beau has the question and will check it.</b>'; b.disabled = true; b.textContent = '🚩 Reported';
      setTimeout(() => box.remove(), 4000);
    };
    card.appendChild(box); box.querySelector('textarea').focus({ preventScroll: true });
  };
  return b;
}
