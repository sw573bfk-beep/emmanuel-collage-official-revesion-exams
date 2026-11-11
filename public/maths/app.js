'use strict';
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const nz = (a, b) => { let v; do { v = rnd(a, b); } while (v === 0); return v; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SP = 'y8m' + ((typeof window !== 'undefined' && window.EC_SLOT) || '') + ':'; // each logged-in account in this browser gets its own keys
const store = {
  get(k, d) { try { const v = localStorage.getItem(SP + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(SP + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } if (typeof window !== 'undefined' && window.onStoreChange) window.onStoreChange(k); }
};
function r2(x, dp) { const f = 10 ** dp; return Math.round(parseFloat((x * f).toPrecision(12))) / f; }
function fmt(x, dp = 4) {
  if (x instanceof Fr) return x.toString();
  if (!isFinite(x)) return String(x);
  let r = r2(x, dp); if (Object.is(r, -0)) r = 0;
  return String(r).replace('-', '−');
}
function money(x) { const r = r2(x, 2); const a = Math.abs(r); const s = Number.isInteger(a) ? String(a) : a.toFixed(2); return (r < 0 ? '−' : '') + '$' + s; }
function sgn(x) { return x < 0 ? '−' : '+'; }
const clean = s => String(s).replace(/[−–—]/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/\s+/g, ' ').trim();
const pretty = s => clean(s).replace(/<=/g, '≤').replace(/>=/g, '≥').replace(/\*/g, '×').replace(/-/g, '−');
const norm = s => clean(s).replace(/\s/g, '').replace(/\(1\/1\)/g, '');

/* ================= fractions ================= */
class Fr {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('You cannot divide by zero');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; this.n = n / g; this.d = d / g;
  }
  static of(x) {
    if (x instanceof Fr) return x;
    if (Number.isInteger(x)) return new Fr(x, 1);
    const s = String(x); if (/e/i.test(s)) return new Fr(Math.round(x * 1e9), 1e9);
    const k = Math.min((s.split('.')[1] || '').length, 9); return new Fr(Math.round(x * 10 ** k), 10 ** k);
  }
  static parse(s) {
    if (!/^\d*\.?\d*$/.test(s) || s === '.' || s === '') throw new Error('I can’t read the number “' + s + '”');
    const [i, f = ''] = s.split('.'); const k = Math.min(f.length, 9);
    return new Fr(parseInt((i || '0') + f.slice(0, k), 10), 10 ** k);
  }
  add(o) { o = Fr.of(o); return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Fr.of(o); return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Fr.of(o); return new Fr(this.n * o.n, this.d * o.d); }
  div(o) { o = Fr.of(o); if (o.n === 0) throw new Error('You cannot divide by zero'); return new Fr(this.n * o.d, this.d * o.n); }
  neg() { return new Fr(-this.n, this.d); }
  get v() { return this.n / this.d; }
  isZero() { return this.n === 0; }
  isInt() { return this.d === 1; }
  sign() { return Math.sign(this.n); }
  eq(o) { o = Fr.of(o); return this.n === o.n && this.d === o.d; }
  toString() { const s = this.d === 1 ? String(Math.abs(this.n)) : Math.abs(this.n) + '/' + this.d; return (this.n < 0 ? '−' : '') + s; }
  show() {
    if (this.d === 1) return this.toString();
    const ld = longDiv(this.n, this.d);
    return this.toString() + (ld.term ? ' = ' + fmt(this.v, 9) : ' ≈ ' + fmt(this.v, 2));
  }
}
function longDiv(n, d) {
  const neg = (n < 0) !== (d < 0); n = Math.abs(n); d = Math.abs(d);
  const ip = Math.floor(n / d); let r = n % d; const digits = []; const seen = new Map(); let rep = -1; let steps = 0;
  while (r !== 0 && steps < 80) { if (seen.has(r)) { rep = seen.get(r); break; } seen.set(r, digits.length); r *= 10; digits.push(Math.floor(r / d)); r %= d; steps++; }
  return { neg: neg && (n !== 0), ip, nonRep: rep < 0 ? digits.join('') : digits.slice(0, rep).join(''), rep: rep < 0 ? '' : digits.slice(rep).join(''), term: rep < 0 && r === 0 };
}
function decHTML(o) { let s = (o.neg ? '−' : '') + o.ip; if (o.nonRep || o.rep) s += '.' + o.nonRep; if (o.rep) s += '<span class="rep" title="these digits repeat">' + o.rep + '</span>'; return s; }
function decLong(o, reps = 3) { let s = (o.neg ? '−' : '') + o.ip; if (o.nonRep || o.rep) s += '.' + o.nonRep + o.rep.repeat(reps) + (o.rep ? '…' : ''); return s; }
function primeFactors(n) { const f = []; let d = 2; n = Math.abs(n); while (n > 1 && d <= n) { while (n % d === 0) { f.push(d); n /= d; } d++; } return f; }

/* ================= linear expression parser ================= */
class Lin {
  constructor(a, b) { this.a = Fr.of(a); this.b = Fr.of(b); this.v = null; }
  static c(x) { return new Lin(0, x); }
  add(o) { return new Lin(this.a.add(o.a), this.b.add(o.b)); }
  sub(o) { return new Lin(this.a.sub(o.a), this.b.sub(o.b)); }
  neg() { return new Lin(this.a.neg(), this.b.neg()); }
  isConst() { return this.a.isZero(); }
  scale(k) { return new Lin(this.a.mul(k), this.b.mul(k)); }
  mul(o) { if (this.isConst()) return o.scale(this.b); if (o.isConst()) return this.scale(o.b); throw new Error('That makes a squared term. Only linear (straight-line) expressions are supported.'); }
  div(o) { if (!o.isConst()) throw new Error('I can’t divide by an expression with the letter in it'); if (o.b.isZero()) throw new Error('You cannot divide by zero'); return this.scale(new Fr(1).div(o.b)); }
}
function tokenize(str) {
  const s = clean(str); const t = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; t.push({ k: 'n', v: Fr.parse(s.slice(i, j)) }); i = j; continue; }
    if (/[a-zA-Z]/.test(c)) { t.push({ k: 'v', v: c }); i++; continue; }
    if ('+-*/()^'.includes(c)) { t.push({ k: c }); i++; continue; }
    throw new Error('I don’t understand the symbol “' + c + '”');
  }
  return t;
}
function parseLin(str) {
  const t = tokenize(str); let p = 0; let varName = null;
  const peek = () => t[p];
  const eat = k => { if (t[p] && t[p].k === k) { p++; return true; } return false; };
  function expr() { let L = term(); for (;;) { if (eat('+')) L = L.add(term()); else if (eat('-')) L = L.sub(term()); else return L; } }
  function term() {
    let L = unary();
    for (;;) {
      if (eat('*')) L = L.mul(unary());
      else if (eat('/')) L = L.div(unary());
      else if (peek() && (peek().k === 'v' || peek().k === '(')) L = L.mul(power());
      else return L;
    }
  }
  function unary() { if (eat('-')) return unary().neg(); if (eat('+')) return unary(); return power(); }
  function power() {
    const b = primary();
    if (eat('^')) {
      const e = unary();
      if (!e.isConst() || !e.b.isInt()) throw new Error('Powers must be whole numbers');
      if (!b.isConst()) { if (e.b.n === 1) return b; throw new Error('Only linear expressions (no x²) are supported'); }
      const n = Math.abs(e.b.n); if (n > 40) throw new Error('That power is too big');
      let r = new Fr(1); for (let i = 0; i < n; i++) r = r.mul(b.b);
      if (e.b.n < 0) r = new Fr(1).div(r);
      return Lin.c(r);
    }
    return b;
  }
  function primary() {
    const k = peek(); if (!k) throw new Error('The expression ends too early');
    if (k.k === 'n') { p++; return Lin.c(k.v); }
    if (k.k === 'v') { p++; if (varName && varName !== k.v) throw new Error('Use only one letter (found ' + varName + ' and ' + k.v + ')'); varName = k.v; return new Lin(1, 0); }
    if (eat('(')) { const e = expr(); if (!eat(')')) throw new Error('A bracket is missing a “)”'); return e; }
    throw new Error('Something is out of place near “' + (k.k === 'n' ? k.v : k.k) + '”');
  }
  const r = expr(); if (p < t.length) throw new Error('I couldn’t read the whole expression');
  r.v = varName; return r;
}
function evalNum(s) { try { const L = parseLin(s); return L.isConst() ? L.b.v : NaN; } catch (e) { return NaN; } }
function numStr(f) { f = Fr.of(f); if (f.isInt()) return f.toString(); const ld = longDiv(f.n, f.d); if (ld.term && ld.nonRep.length <= 4) return fmt(f.v, 6); return f.toString(); }
function coefStr(a, v) {
  a = Fr.of(a); if (a.eq(1)) return v; if (a.eq(-1)) return '−' + v; if (a.isInt()) return a.toString() + v;
  if (Math.abs(a.n) === 1) return (a.n < 0 ? '−' : '') + v + '/' + a.d;
  const ld = longDiv(a.n, a.d); if (ld.term && ld.nonRep.length <= 4) return fmt(a.v, 6) + v;
  return (a.n < 0 ? '−' : '') + '(' + Math.abs(a.n) + '/' + a.d + ')' + v;
}
function fmtLin(a, b, v = 'x') {
  a = Fr.of(a); b = Fr.of(b); if (a.isZero()) return numStr(b);
  let s = coefStr(a, v); if (!b.isZero()) s += b.sign() > 0 ? ' + ' + numStr(b) : ' − ' + numStr(b.neg()); return s;
}
function ctxRule(c) { return c.L + ' = ' + (c.b < 0 ? fmtLinN(c.a, c.b, c.v) : fmt(c.b) + (c.a < 0 ? ' − ' : ' + ') + coefStr(Math.abs(c.a), c.v)); }
function fmtLinN(m, c, v = 'x') { return fmtLin(Fr.of(m), Fr.of(c), v); }

/* ================= relations ================= */
const OPD = { '<': '<', '>': '>', '<=': '≤', '>=': '≥', '=': '=' };
const opD = op => OPD[op] || op;
const flipOp = op => ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=', '=': '=' }[op]);
const opWords = op => ({ '<': 'less than', '>': 'greater than', '<=': 'less than or equal to', '>=': 'greater than or equal to', '=': 'equal to' }[op]);
function holds(l, op, r) { const e = 1e-9; return op === '<' ? l < r - e : op === '>' ? l > r + e : op === '<=' ? l <= r + e : op === '>=' ? l >= r - e : Math.abs(l - r) < e; }
function splitRel(str) {
  const s = clean(str); const m = s.match(/<=|>=|=|<|>/g); if (!m) return null;
  if (m.length > 1) throw new Error('Use just one = or inequality sign');
  const op = m[0]; const i = s.indexOf(op); return { L: s.slice(0, i).trim(), R: s.slice(i + op.length).trim(), op };
}
function solveRel(str) {
  const sp = splitRel(str); if (!sp) throw new Error('There is no = or inequality sign to solve');
  if (!sp.L || !sp.R) throw new Error('One side of the sign is empty');
  const L = parseLin(sp.L), R = parseLin(sp.R);
  if (L.v && R.v && L.v !== R.v) throw new Error('Use only one letter');
  const v = L.v || R.v; if (!v) throw new Error('There is no letter (pronumeral) to solve for');
  let op = sp.op; const ineq = op !== '=';
  const steps = []; const line = (t, why) => steps.push({ t, why });
  line(pretty(sp.L) + ' ' + opD(op) + ' ' + pretty(sp.R), ineq ? 'The inequality to solve' : 'The equation to solve');
  let a = L.a, b = L.b; let c = R.a; let d = R.b; let shown = steps[0].t;
  // "(x − 2)/3 = 5": multiply both sides by 3 first (clearer than splitting the fraction)
  const fr = sp.L.trim().match(/^\((.+)\)\s*\/\s*(\d+(?:\.\d+)?)$/) || sp.L.trim().match(/^(−?-?\d+(?:\.\d+)?[a-z])\s*\/\s*(\d+(?:\.\d+)?)$/i); // "(x − 2)/3" or "2x/3"
  if (fr && c.isZero()) {
    const k = Fr.of(+fr[2]), inner = parseLin(fr[1]);
    a = inner.a; b = inner.b; d = d.mul(k); shown = pretty(fr[1]) + ' ' + opD(op) + ' ' + numStr(d);
    line(shown, 'Multiply both sides by ' + fr[2] + ' (' + numStr(R.b) + ' × ' + fr[2] + ' = ' + numStr(d) + ')');
  }
  // only show a "simplify" step when something really changed (brackets expanded or like terms collected), not just the order
  const terms = t => norm(t).split(/(<=|>=|<|>|=)/).map(side => side.replace(/^(?=[^+-])/, '+').match(/[+-][^+-]+/g) || []).map(ts => ts.slice().sort().join('')).join('|');
  const s1 = fmtLin(a, b, v) + ' ' + opD(op) + ' ' + fmtLin(c, d, v);
  if (norm(s1) !== norm(shown) && terms(s1) !== terms(shown)) line(s1, 'Expand any brackets and simplify each side');
  // x on both sides of an equation, with more on the right: take away the smaller x term so x stays positive
  if (!ineq && !c.isZero() && !a.isZero() && c.v > a.v) {
    const why = a.sign() > 0 ? 'Subtract ' + coefStr(a, v) + ' from both sides' : 'Add ' + coefStr(a.neg(), v) + ' to both sides';
    c = c.sub(a); a = new Fr(0); line(numStr(b) + ' = ' + fmtLin(c, d, v), why);
    if (!d.isZero()) { const w2 = d.sign() > 0 ? 'Subtract ' + numStr(d) + ' from both sides' : 'Add ' + numStr(d.neg()) + ' to both sides'; b = b.sub(d); d = new Fr(0); line(numStr(b) + ' = ' + coefStr(c, v), w2); }
    const val = b.div(c);
    if (!c.eq(1)) line(v + ' = ' + val.show(), 'Divide both sides by ' + numStr(c));
    else line(v + ' = ' + val.show(), 'Swap the sides so ' + v + ' is on the left');
    const lv = L.a.mul(val).add(L.b), rv = R.a.mul(val).add(R.b);
    steps.push({ t: 'Check: left side = ' + numStr(lv) + ', right side = ' + numStr(rv) + ' ✓', why: 'Substitute ' + v + ' = ' + numStr(val) + ' back into the original' });
    return { v, op, val, kind: 'eq', steps };
  }
  if (!c.isZero()) {
    const why = c.sign() > 0 ? 'Subtract ' + coefStr(c, v) + ' from both sides' : 'Add ' + coefStr(c.neg(), v) + ' to both sides';
    a = a.sub(c); line(fmtLin(a, b, v) + ' ' + opD(op) + ' ' + numStr(d), why);
  }
  if (a.isZero()) {
    const ok = holds(b.v, op, d.v);
    if (steps.length && steps[steps.length - 1].t === numStr(b) + ' ' + opD(op) + ' ' + numStr(d)) steps.pop();
    line(numStr(b) + ' ' + opD(op) + ' ' + numStr(d), 'The ' + v + ' terms cancel out. This statement is ' + (ok ? 'always true, so every value of ' + v + ' works' : 'never true, so there is no solution'));
    return { v, op, val: null, special: ok ? 'all' : 'none', kind: ineq ? 'ineq' : 'eq', steps };
  }
  if (!b.isZero()) {
    const why = b.sign() > 0 ? 'Subtract ' + numStr(b) + ' from both sides' : 'Add ' + numStr(b.neg()) + ' to both sides';
    d = d.sub(b); b = new Fr(0); line(coefStr(a, v) + ' ' + opD(op) + ' ' + numStr(d), why);
  }
  let val = d;
  if (!a.eq(1)) {
    val = d.div(a); let why;
    if (a.eq(-1)) why = 'Multiply (or divide) both sides by −1';
    else if (Math.abs(a.n) === 1) why = 'Multiply both sides by ' + (a.n < 0 ? '−' : '') + a.d;
    else why = 'Divide both sides by ' + numStr(a);
    if (ineq && a.sign() < 0) { op = flipOp(op); why += ' — <b>this is a negative number, so reverse the inequality sign</b>'; }
    line(v + ' ' + opD(op) + ' ' + val.show(), why);
  }
  if (!ineq) {
    const lv = L.a.mul(val).add(L.b), rv = R.a.mul(val).add(R.b);
    steps.push({ t: 'Check: left side = ' + numStr(lv) + ', right side = ' + numStr(rv) + ' ✓', why: 'Substitute ' + v + ' = ' + numStr(val) + ' back into the original' });
  } else {
    const dir = op.includes('>') ? 1 : -1, start = op.includes('>') ? Math.floor(val.v) + 1 : Math.ceil(val.v) - 1;
    const neat = x => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9; let tv = start;
    for (let i = 0; i < 12; i++) { const t = start + dir * i; if (neat(L.a.v * t + L.b.v) && neat(R.a.v * t + R.b.v)) { tv = t; break; } }
    const lv = L.a.v * tv + L.b.v, rv = R.a.v * tv + R.b.v;
    steps.push({ t: 'Check: try ' + v + ' = ' + fmt(tv) + ' → ' + fmt(lv) + ' ' + opD(sp.op) + ' ' + fmt(rv) + ' is true ✓', why: 'Test a number from your answer in the original' });
  }
  return { v, op, val, kind: ineq ? 'ineq' : 'eq', steps };
}
function stepsHTML(steps) {
  const why = w => { if (!w) return ''; const sw = typeof simpleWhy === 'function' ? simpleWhy(w) : w; return sw !== w ? '<span class="why why-n">' + w + '</span><span class="why why-s">' + sw + '</span>' : '<span class="why">' + w + '</span>'; };
  return '<ol class="steps">' + steps.map(s => typeof s === 'string' ? '<li><span class="st" style="font-family:var(--f-body)">' + s + '</span></li>' : '<li><span class="st">' + s.t + '</span>' + why(s.why) + '</li>').join('') + '</ol>';
}

/* ================= answer parsing ================= */
function stripUnits(s) {
  return s.replace(/^[a-z]\s*=\s*/i, '').replace(/(\d)([a-z]{1,8}\b)/gi, '$1 $2') // "5cm" → "5 cm"
    .replace(/\$|%|°|degrees?|cm²|cm2|m²|km\/h|\bcm\b|\bmm\b|\bkm\b|\bkg\b|\bmg\b|\bml\b|\bkl\b|\bgb\b|\bg\b|\bm\b|\bl\b|\bh\b|hours?|hrs?|weeks?|days?|minutes?|mins?|seconds?|secs?|people|students|units?|dollars?|cents?|metres?|meters?|litres?|grams?|\bc\b/gi, '')
    .replace(/(increase|decrease|profit|loss|\binc\b|\bdec\b|\bup\b|\bdown\b|\bfall\b|\brise\b)/gi, '')
    .trim();
}
function parseNum(input) {
  let s = clean(input).toLowerCase();
  s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d) (\d{3})(?!\d|\/)/g, '$1$2');
  s = stripUnits(s);
  const m = s.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/); if (m) { const v = +m[2] + +m[3] / +m[4]; return m[1] ? -v : v; }
  if (!s) return NaN; return evalNum(s);
}
function parseFracInput(input) {
  const s = stripUnits(clean(input));
  let m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) { const w = +m[2], n = +m[3], d = +m[4]; if (!d) return null; const f = new Fr((w * d + n) * (m[1] ? -1 : 1), d); return { fr: f, simplest: gcd(n, d) === 1 }; }
  m = s.match(/^(-?)(\d+)\s*\/\s*(\d+)$/);
  if (m) { const n = +m[2], d = +m[3]; if (!d) return null; return { fr: new Fr(m[1] ? -n : n, d), simplest: gcd(n, d) === 1 }; }
  const v = evalNum(s); if (isNaN(v)) return null; return { fr: Fr.of(v), simplest: true };
}
function parseIneq(input) {
  let sp; try { sp = splitRel(input); } catch (e) { return null; }
  if (!sp || sp.op === '=') return null;
  const isVar = s => /^[a-zA-Z]$/.test(s);
  if (isVar(sp.L)) return { v: sp.L, op: sp.op, val: evalNum(sp.R) };
  if (isVar(sp.R)) return { v: sp.R, op: flipOp(sp.op), val: evalNum(sp.L) };
  return null;
}
function parseCoords(input) {
  const s = clean(input); const out = []; const re = /\(([^()]*)\)/g; let m;
  while ((m = re.exec(s))) { const parts = m[1].split(',').map(t => evalNum(t.trim())); if (parts.length < 2 || parts.some(isNaN)) return null; out.push(parts); }
  if (!out.length) { const parts = s.split(',').map(t => evalNum(t.trim())); if (parts.length >= 2 && parts.length <= 3 && !parts.some(isNaN)) out.push(parts); }
  return out;
}
function parseRule(input) {
  const s = clean(input); let lhs = null, rhs = s;
  const i = s.indexOf('=');
  if (i >= 0) { lhs = s.slice(0, i).trim(); rhs = s.slice(i + 1).trim(); }
  const L = parseLin(rhs); return { lhs, a: L.a, b: L.b, v: L.v };
}
const ptStr = p => '(' + p.map(n => fmt(n)).join(', ') + ')';

/* ================= checking ================= */
function checkAnswer(Q, input) {
  const raw = String(input || '').trim();
  if (Q.type === 'mcq') { if (input === null || input === undefined || input === '') return { ok: false, msg: 'Pick an answer first.', empty: true }; return { ok: +input === Q.ans }; }
  if (!raw) return { ok: false, msg: 'Type an answer first.', empty: true };
  try {
    switch (Q.type) {
      case 'num': {
        let x = parseNum(raw); if (isNaN(x)) return { ok: false, msg: 'Type a number, e.g. 12.5 or 7/4.', bad: true };
        if (Q.signed && /decrease|\bdec\b|loss|down|fall|drop/i.test(raw)) x = -Math.abs(x);
        const tol = Q.tol != null ? Q.tol : (Number.isInteger(Q.ans) ? 1e-9 : 0.0051);
        return { ok: Math.abs(x - Q.ans) <= tol + 1e-9 };
      }
      case 'nums': {
        const parts = clean(raw).split(/[,;]| (?=-?\d)/).map(t => t.trim()).filter(Boolean).map(parseNum);
        if (parts.some(isNaN)) return { ok: false, msg: 'Separate your numbers with commas, e.g. −5, −3, −1', bad: true };
        if (parts.length !== Q.ans.length) return { ok: false, msg: 'I expected ' + Q.ans.length + ' numbers.', bad: true };
        return { ok: parts.every((p, i) => Math.abs(p - Q.ans[i]) < 0.0051) };
      }
      case 'ineq': {
        const p = parseIneq(raw); if (!p || isNaN(p.val)) return { ok: false, msg: 'Write it like x > 4 or x ≤ −2.', bad: true };
        const okv = Math.abs(p.val - Q.ans.val) <= (Q.tol || 1e-6) && p.op === Q.ans.op;
        if (okv && Q.ans.v && p.v.toLowerCase() !== Q.ans.v.toLowerCase()) return { ok: false, msg: 'Right idea, but use the letter ' + Q.ans.v + '.' };
        return { ok: okv };
      }
      case 'coord': {
        const pts = parseCoords(raw); if (!pts || !pts.length) return { ok: false, msg: 'Write coordinates like (3, −2).', bad: true };
        if (pts.length !== Q.ans.length) return { ok: false, msg: 'I expected ' + Q.ans.length + ' point' + (Q.ans.length > 1 ? 's' : '') + '.', bad: true };
        return { ok: pts.every((p, i) => p.length === Q.ans[i].length && p.every((c, j) => Math.abs(c - Q.ans[i][j]) < 1e-6)) };
      }
      case 'rule': {
        let r; try { r = parseRule(raw); } catch (e) { return { ok: false, msg: e.message, bad: true }; }
        const ok = Math.abs(r.a.v - Q.ans.a) < 1e-6 && Math.abs(r.b.v - Q.ans.b) < 1e-6;
        if (ok && Q.ans.v && r.v && r.v !== Q.ans.v) return { ok: false, msg: 'The numbers are right; use the letter ' + Q.ans.v + ' on the right-hand side.' };
        if (ok && Q.ans.lhs && r.lhs && r.lhs !== Q.ans.lhs) return { ok: false, msg: 'Nearly: the rule should start with ' + Q.ans.lhs + ' = …' };
        return { ok };
      }
      case 'frac': {
        const p = parseFracInput(raw); if (!p) return { ok: false, msg: 'Write a fraction like 7/20 (or a mixed number like 1 1/4).', bad: true };
        const ok = p.fr.eq(Q.ans);
        if (ok && !p.simplest) return { ok: false, msg: 'That is equal, but simplify it fully.' };
        return { ok };
      }
      case 'text': {
        const n = x => String(x).toUpperCase().replace(/ANGLE|∠|△|TRIANGLE|\s|\.|′|'/g, '');
        const u = n(raw); return { ok: Q.accept.some(a => n(a) === u) };
      }
    }
  } catch (e) { return { ok: false, msg: e.message, bad: true }; }
  return { ok: false };
}

/* ================= SVG drawing ================= */
let svgN = 0;
function nlSVG(op, val, o = {}) {
  const v = val == null ? 0 : +val;
  let min = o.min != null ? o.min : Math.floor(v) - 6, max = o.max != null ? o.max : Math.floor(v) + 6;
  const W = o.w || 380, H = 58, pad = 22, X = x => pad + (x - min) / (max - min) * (W - 2 * pad);
  const step = (max - min) > 16 ? 2 : 1;
  let s = '<svg class="nl" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="' + esc(op ? 'Number line showing ' + (o.v || 'x') + ' ' + opD(op) + ' ' + fmt(v) : 'Blank number line') + '">';
  s += '<line class="ax" x1="6" y1="24" x2="' + (W - 6) + '" y2="24"/>';
  s += '<path class="axh" d="M2 24 l9 -5 v10z"/><path class="axh" d="M' + (W - 2) + ' 24 l-9 -5 v10z"/>';
  for (let i = min; i <= max; i++) { s += '<line class="ax" x1="' + X(i) + '" y1="19" x2="' + X(i) + '" y2="29"/>'; if ((i - min) % step === 0) s += '<text class="tk" x="' + X(i) + '" y="45">' + fmt(i) + '</text>'; }
  if (op) {
    const right = op.includes('>'), x0 = X(v), xe = right ? W - 8 : 8;
    s += '<line class="sol-line" x1="' + x0 + '" y1="24" x2="' + (right ? xe - 8 : xe + 8) + '" y2="24"/>';
    s += right ? '<path class="arrowh" d="M' + xe + ' 24 l-11 -7 v14z"/>' : '<path class="arrowh" d="M' + xe + ' 24 l11 -7 v14z"/>';
    s += '<circle class="dot ' + (op.includes('=') ? 'closed' : 'open') + '" cx="' + x0 + '" cy="24" r="6"/>';
  }
  return s + '</svg>';
}
function gridSVG(o = {}) {
  const xmin = o.xmin ?? -6, xmax = o.xmax ?? 6, ymin = o.ymin ?? -6, ymax = o.ymax ?? 6;
  const u = o.u ?? Math.max(15, Math.min(32, (o.size || 300) / Math.max(xmax - xmin, ymax - ymin)));
  const pad = 24, W = (xmax - xmin) * u + pad * 2, H = (ymax - ymin) * u + pad * 2;
  const X = x => pad + (x - xmin) * u, Y = y => pad + (ymax - y) * u; const id = 'gc' + (++svgN);
  let s = '<svg class="grid-svg" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="' + esc(o.label || 'Coordinate grid') + '">';
  s += '<defs><clipPath id="' + id + '"><rect x="' + X(xmin) + '" y="' + Y(ymax) + '" width="' + (xmax - xmin) * u + '" height="' + (ymax - ymin) * u + '"/></clipPath></defs>';
  for (let x = xmin; x <= xmax; x++) s += '<line class="gl" x1="' + X(x) + '" y1="' + Y(ymin) + '" x2="' + X(x) + '" y2="' + Y(ymax) + '"/>';
  for (let y = ymin; y <= ymax; y++) s += '<line class="gl" x1="' + X(xmin) + '" y1="' + Y(y) + '" x2="' + X(xmax) + '" y2="' + Y(y) + '"/>';
  const ax0 = ymin <= 0 && ymax >= 0, ay0 = xmin <= 0 && xmax >= 0; const step = Math.max(xmax - xmin, ymax - ymin) > 14 ? 2 : 1;
  if (ax0) s += '<line class="ax" x1="' + (X(xmin) - 4) + '" y1="' + Y(0) + '" x2="' + (X(xmax) + 6) + '" y2="' + Y(0) + '"/><text class="axl" x="' + (X(xmax) + 9) + '" y="' + (Y(0) + 4) + '">x</text>';
  if (ay0) s += '<line class="ax" x1="' + X(0) + '" y1="' + (Y(ymin) + 4) + '" x2="' + X(0) + '" y2="' + (Y(ymax) - 6) + '"/><text class="axl" x="' + (X(0) + 5) + '" y="' + (Y(ymax) - 10) + '">y</text>';
  for (let x = xmin; x <= xmax; x++) if (x !== 0 && x % step === 0) s += '<text class="tk" x="' + X(x) + '" y="' + ((ax0 ? Y(0) : Y(ymin)) + 13) + '">' + fmt(x) + '</text>';
  for (let y = ymin; y <= ymax; y++) if (y !== 0 && y % step === 0) s += '<text class="tk" style="text-anchor:end" x="' + ((ay0 ? X(0) : X(xmin)) - 4) + '" y="' + (Y(y) + 3.5) + '">' + fmt(y) + '</text>';
  if (ax0 && ay0) s += '<text class="tk" style="text-anchor:end" x="' + (X(0) - 4) + '" y="' + (Y(0) + 13) + '">0</text>';
  (o.mirrors || []).forEach(L => {
    if (L.t === 'x=k') s += '<line class="mirror" x1="' + X(L.k) + '" y1="' + Y(ymin) + '" x2="' + X(L.k) + '" y2="' + Y(ymax) + '"/>';
    else if (L.t === 'y=k') s += '<line class="mirror" x1="' + X(xmin) + '" y1="' + Y(L.k) + '" x2="' + X(xmax) + '" y2="' + Y(L.k) + '"/>';
    else if (L.t === 'y=x') s += '<line class="mirror" clip-path="url(#' + id + ')" x1="' + X(xmin - 1) + '" y1="' + Y(xmin - 1) + '" x2="' + X(xmax + 1) + '" y2="' + Y(xmax + 1) + '"/>';
    else if (L.t === 'y=-x') s += '<line class="mirror" clip-path="url(#' + id + ')" x1="' + X(xmin - 1) + '" y1="' + Y(-(xmin - 1)) + '" x2="' + X(xmax + 1) + '" y2="' + Y(-(xmax + 1)) + '"/>';
    else if (L.t === 'x-axis') s += '<line class="mirror" x1="' + X(xmin) + '" y1="' + Y(0) + '" x2="' + X(xmax) + '" y2="' + Y(0) + '"/>';
    else if (L.t === 'y-axis') s += '<line class="mirror" x1="' + X(0) + '" y1="' + Y(ymin) + '" x2="' + X(0) + '" y2="' + Y(ymax) + '"/>';
  });
  (o.lines || []).forEach(L => {
    if (L.vx != null) { s += '<line class="pl ' + (L.cls || '') + '" x1="' + X(L.vx) + '" y1="' + Y(ymin) + '" x2="' + X(L.vx) + '" y2="' + Y(ymax) + '"/>'; return; }
    const x1 = L.from ?? xmin - 1, x2 = L.to ?? xmax + 1;
    s += '<line class="pl ' + (L.cls || '') + '" clip-path="url(#' + id + ')" x1="' + X(x1) + '" y1="' + Y(L.m * x1 + L.c) + '" x2="' + X(x2) + '" y2="' + Y(L.m * x2 + L.c) + '"/>';
  });
  (o.polys || []).forEach(P => {
    s += (P.pts.length > 2 ? '<polygon' : '<polyline') + ' class="poly ' + (P.cls || '') + '" points="' + P.pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' ') + '"/>';
    (P.labels || []).forEach((lb, i) => { const p = P.pts[i]; s += '<circle class="pt ' + (P.cls || '') + '" cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3.5"/><text class="ptl" x="' + (X(p[0]) + 5) + '" y="' + (Y(p[1]) - 5) + '">' + lb + '</text>'; });
  });
  (o.points || []).forEach(p => { s += '<circle class="pt ' + (p.cls || '') + '" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4"/>' + (p.label ? '<text class="ptl" x="' + (X(p.x) + 6) + '" y="' + (Y(p.y) - 6) + '">' + p.label + '</text>' : ''); });
  return s + '</svg>';
}
function boxSVG(L, Wd, H, labels = true, show = null) {
  const u = show ? (Math.min(L, H) <= 1 ? 72 : Math.min(L, H) <= 2 ? 52 : 42) : 34, cx = 0.62 * u, cy = 0.42 * u, ox = Math.round((L + 1.3) * cx + (show ? 100 : 30)), oy = Math.round((H + 1.3) * u + 16); // room above for the z-axis, and on the left for the x direction (and coordinate labels)
  const P = (x, y, z) => [ox + y * u - x * cx, oy - z * u + x * cy];
  const V = { O: [0, 0, 0], A: [L, 0, 0], B: [L, Wd, 0], C: [0, Wd, 0], D: [0, 0, H], E: [L, 0, H], F: [L, Wd, H], G: [0, Wd, H] };
  const Wpx = ox + Wd * u + (show ? 120 : 60), Hpx = oy + L * cy + 30;
  let s = '<svg class="dia" viewBox="0 0 ' + Wpx + ' ' + Hpx + '" style="max-width:' + Wpx + 'px;width:100%" role="img" aria-label="Box ' + L + ' by ' + Wd + ' by ' + H + ' with a corner at the origin">';
  const ln = (a, b, cls = 'edge') => { const p = P(...V[a]), q = P(...V[b]); return '<line class="' + cls + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; };
  const o0 = P(0, 0, 0), xe = P(L + 1.3, 0, 0), ye = P(0, Wd + 1.2, 0), ze = P(0, 0, H + 0.9);
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + xe[0] + '" y2="' + xe[1] + '"/><text class="axl" x="' + (xe[0] - 12) + '" y="' + (xe[1] + 6) + '">x</text>';
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + ye[0] + '" y2="' + ye[1] + '"/><text class="axl" x="' + (ye[0] + 5) + '" y="' + (ye[1] - 4) + '">y</text>';
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + ze[0] + '" y2="' + ze[1] + '"/><text class="axl" x="' + (ze[0] + 5) + '" y="' + (ze[1] + 2) + '">z</text>';
  [['A', 'B'], ['B', 'C', 'edge dash'], ['O', 'A'], ['A', 'E'], ['B', 'F'], ['C', 'G', 'edge dash'], ['O', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'G', 'edge dash'], ['G', 'D', 'edge dash']].forEach(e => { s += ln(e[0], e[1], e[2]); });
  if (labels) Object.keys(V).forEach(k => {
    // labels sit outside the box: left-hand corners are right-aligned to the left of the point, the others start to the right
    const p = P(...V[k]); const left = k === 'O' || k === 'D' || k === 'A' || k === 'E', low = k === 'A' || k === 'B' || k === 'C' || k === 'O';
    s += '<circle class="pt3" cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"/><text class="lbl" text-anchor="' + (left ? 'end' : 'start') + '" x="' + (p[0] + (left ? -7 : 7)) + '" y="' + (p[1] + (low ? 15 : -7)) + '">' + k + (show && show[k] ? ' ' + ptStr(V[k]) : '') + '</text>';
  });
  return s + '</svg>';
}
function triPairSVG(o) {
  // generic labelled triangle (or two) diagram; o.tris = [{pts:[[x,y],...], names:['A','B','C'], sides:[label01,label12,label20], angles:[a0,a1,a2], right:index}]
  const W = o.w || 520, H = o.h || 200;
  let s = '<svg class="dia" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="' + esc(o.label || 'Triangle diagram') + '">';
  (o.tris || []).forEach(T => {
    const p = T.pts; s += '<polygon class="fillt" points="' + p.map(q => q.join(',')).join(' ') + '"/>';
    const cx = (p[0][0] + p[1][0] + p[2][0]) / 3, cy = (p[0][1] + p[1][1] + p[2][1]) / 3;
    p.forEach((q, i) => {
      const dx = q[0] - cx, dy = q[1] - cy, L = Math.hypot(dx, dy) || 1;
      if (T.names) s += '<text class="lbl" text-anchor="middle" x="' + (q[0] + dx / L * 14) + '" y="' + (q[1] + dy / L * 14 + 4) + '">' + T.names[i] + '</text>';
      if (T.angles && T.angles[i]) s += '<text class="it" text-anchor="middle" x="' + (q[0] - dx / L * 26) + '" y="' + (q[1] - dy / L * 26 + 4) + '">' + T.angles[i] + '</text>';
    });
    if (T.sides) T.sides.forEach((lb, i) => {
      if (!lb) return; const a = p[i], b = p[(i + 1) % 3]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = mx - cx, dy = my - cy, L = Math.hypot(dx, dy) || 1;
      s += '<text text-anchor="middle" x="' + (mx + dx / L * 14) + '" y="' + (my + dy / L * 14 + 4) + '">' + lb + '</text>';
    });
    if (T.right != null) {
      const q = p[T.right], a = p[(T.right + 1) % 3], b = p[(T.right + 2) % 3];
      const ua = [(a[0] - q[0]), (a[1] - q[1])], ub = [(b[0] - q[0]), (b[1] - q[1])]; const la = Math.hypot(...ua), lb2 = Math.hypot(...ub); const k = 10;
      const p1 = [q[0] + ua[0] / la * k, q[1] + ua[1] / la * k], p3 = [q[0] + ub[0] / lb2 * k, q[1] + ub[1] / lb2 * k], p2 = [p1[0] + ub[0] / lb2 * k, p1[1] + ub[1] / lb2 * k];
      s += '<polyline class="ra" points="' + [p1, p2, p3].map(z => z.join(',')).join(' ') + '"/>';
    }
  });
  (o.extra || []).forEach(x => { s += x; });
  return s + '</svg>';
}
function parallelTriSVG(lbl) {
  // triangle ABC with DE parallel to BC; lbl = {AD, AE, DE, DB, EC, BC}
  const A = [150, 22], B = [40, 180], C = [300, 180], t = 0.4; const D = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], E = [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let s = '<svg class="dia" viewBox="0 0 340 210" style="max-width:340px;width:100%" role="img" aria-label="Triangle ABC with DE parallel to BC">';
  s += '<polygon class="fillt" points="' + [A, B, C].map(p => p.join(',')).join(' ') + '"/><line class="edge" x1="' + D[0] + '" y1="' + D[1] + '" x2="' + E[0] + '" y2="' + E[1] + '"/>';
  s += '<text class="lbl" x="' + (A[0] - 4) + '" y="' + (A[1] - 6) + '">A</text><text class="lbl" x="' + (B[0] - 14) + '" y="' + (B[1] + 6) + '">B</text><text class="lbl" x="' + (C[0] + 5) + '" y="' + (C[1] + 6) + '">C</text><text class="lbl" x="' + (D[0] - 16) + '" y="' + (D[1] + 4) + '">D</text><text class="lbl" x="' + (E[0] + 6) + '" y="' + (E[1] + 4) + '">E</text>';
  const put = (p, txt, dx, dy) => { if (txt != null && txt !== '') s += '<text class="it" text-anchor="middle" x="' + (p[0] + dx) + '" y="' + (p[1] + dy) + '">' + txt + '</text>'; };
  put(mid(A, D), lbl.AD, -14, 0); put(mid(A, E), lbl.AE, 14, 0); put(mid(D, E), lbl.DE, 0, 15); put(mid(D, B), lbl.DB, -14, 0); put(mid(E, C), lbl.EC, 14, 0); put(mid(B, C), lbl.BC, 0, 18);
  s += '<path d="M' + (mid(D, E)[0] - 4) + ' ' + (D[1] - 4) + ' l6 4 l-6 4" class="ra"/><path d="M' + (mid(B, C)[0] - 4) + ' ' + (B[1] - 4) + ' l6 4 l-6 4" class="ra"/>';
  return s + '</svg>';
}
function tableHTML(xs, ys, xl = 'x', yl = 'y') {
  return '<div class="scroll-x"><table class="vals"><tr><th>' + xl + '</th>' + xs.map(x => '<td>' + fmt(x) + '</td>').join('') + '</tr><tr><th>' + yl + '</th>' + ys.map(y => '<td>' + (y === null ? '&nbsp;' : fmt(y)) + '</td>').join('') + '</tr></table></div>';
}

/* ================= transformations ================= */
function reflectPt(p, L) {
  const [x, y] = p;
  switch (L.t) {
    case 'x-axis': return [x, -y];
    case 'y-axis': return [-x, y];
    case 'y=x': return [y, x];
    case 'y=-x': return [-y, -x];
    case 'x=k': return [2 * L.k - x, y];
    case 'y=k': return [x, 2 * L.k - y];
  }
  return p;
}
function lineName(L) { return L.t === 'x-axis' ? 'x-axis' : L.t === 'y-axis' ? 'y-axis' : L.t === 'y=x' ? 'line y = x' : L.t === 'y=-x' ? 'line y = −x' : L.t === 'x=k' ? 'line x = ' + fmt(L.k) : 'line y = ' + fmt(L.k); }
function reflectRule(L) {
  switch (L.t) {
    case 'x-axis': return 'Reflecting in the x-axis keeps x the same and changes the sign of y: (x, y) → (x, −y).';
    case 'y-axis': return 'Reflecting in the y-axis changes the sign of x and keeps y the same: (x, y) → (−x, y).';
    case 'y=x': return 'Reflecting in the line y = x swaps the coordinates: (x, y) → (y, x).';
    case 'y=-x': return 'Reflecting in y = −x swaps the coordinates and changes both signs: (x, y) → (−y, −x).';
    case 'x=k': return 'The mirror is the vertical line x = ' + fmt(L.k) + '. The y-value stays the same; the image is the same distance on the other side of the line, so x′ = 2 × ' + (L.k < 0 ? '(' + fmt(L.k) + ')' : fmt(L.k)) + ' − x.';
    case 'y=k': return 'The mirror is the horizontal line y = ' + fmt(L.k) + '. The x-value stays the same; the image is the same distance on the other side, so y′ = 2 × ' + (L.k < 0 ? '(' + fmt(L.k) + ')' : fmt(L.k)) + ' − y.';
  }
}
function rotatePt(p, ang, dir, c = [0, 0]) {
  // ang 90/180/270; dir 'cw' | 'acw'
  let [x, y] = [p[0] - c[0], p[1] - c[1]]; let a = ((dir === 'cw' ? ang : 360 - ang) % 360 + 360) % 360; let r;
  if (a === 90) r = [y, -x]; else if (a === 180) r = [-x, -y]; else if (a === 270) r = [-y, x]; else r = [x, y];
  return [r[0] + c[0], r[1] + c[1]];
}
function rotRule(ang, dir) {
  let a = ((dir === 'cw' ? ang : 360 - ang) % 360 + 360) % 360;
  if (a === 90) return '90° clockwise about the origin: (x, y) → (y, −x).';
  if (a === 180) return '180° about the origin: (x, y) → (−x, −y). (Clockwise and anticlockwise give the same result.)';
  if (a === 270) return '90° anticlockwise about the origin: (x, y) → (−y, x).';
  return 'A full turn leaves every point where it started.';
}
const primes = n => '′'.repeat(n);

/* ================= question generators ================= */
const G = {};
function gen(id, topic, name, fn) { G[id] = { id, topic, name, fn }; }
// No repeats: remember the last questions seen for each generator (kept in this browser) and avoid them.
const SEEN_MAX = 300;
let SEEN = null, seenTimer = null;
function qKey(q) {
  const t = q.q + '|' + (q.choices ? q.choices.slice().sort().join('/') : '') + '|' + (q.fig || '');
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function makeQ(id) {
  const g = G[id];
  if (!SEEN) SEEN = store.get('seen', {}) || {};
  const list = SEEN[id] || (SEEN[id] = []);
  let q = null, k = '', fresh = false;
  for (let i = 0; i < 60 && !fresh; i++) { q = g.fn(); k = qKey(q); fresh = !list.includes(k); }
  if (!fresh) list.splice(0, Math.ceil(list.length / 2)); // seen them all: start a new round
  list.push(k); if (list.length > SEEN_MAX) list.splice(0, list.length - SEEN_MAX);
  if (typeof setTimeout !== 'undefined') { clearTimeout(seenTimer); seenTimer = setTimeout(() => store.set('seen', SEEN), 400); }
  q.gen = id; q.topic = g.topic; q.gname = g.name; return q;
}
// multiple choice from a right answer and a pool of believable wrong ones
function mcq4(q, right, wrongs, sol, hint, extra) {
  const pool = shuffle(wrongs.filter(w => w !== right)).filter((w, i, a) => a.indexOf(w) === i);
  const opts = shuffle([right].concat(pool.slice(0, 3)));
  return Object.assign({ type: 'mcq', q, choices: opts, ans: opts.indexOf(right), ansText: right, sol: Array.isArray(sol) ? sol : [sol], hint }, extra || {});
}
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const QUADS = ['ABCD', 'PQRS', 'WXYZ', 'EFGH', 'KLMN', 'JKLM', 'TUVW'];
const TRIS = [['ABC', 'DEF'], ['PQR', 'XYZ'], ['KLM', 'STU'], ['ABC', 'PQR'], ['DEF', 'JKL'], ['LMN', 'RST'], ['GHI', 'UVW']];
const ineqText = (v, op, val) => v + ' ' + opD(op) + ' ' + fmt(val);

/* ---------- 7I inequalities ---------- */
gen('ineqRead', '7I', 'Read an inequality from a number line', () => {
  const v = rnd(-5, 8), op = pick(['<', '>', '<=', '>=']);
  return { type: 'ineq', q: 'Write the inequality shown on the number line. Use <b>x</b>.', fig: nlSVG(op, v), ans: { v: 'x', op, val: v }, ansText: ineqText('x', op, v),
    hint: 'Open circle → &lt; or &gt; (the number is not included). Closed circle → ≤ or ≥ (included). The arrow shows which way the solutions go.',
    sol: ['The circle is at ' + fmt(v) + ' and it is <b>' + (op.includes('=') ? 'closed (filled in)' : 'open') + '</b>, so ' + fmt(v) + ' is ' + (op.includes('=') ? '' : '<b>not</b> ') + 'included.', 'The arrow points <b>' + (op.includes('>') ? 'right, to bigger numbers' : 'left, to smaller numbers') + '</b>.', 'So the inequality is <b>' + ineqText('x', op, v) + '</b>.'] };
});
gen('ineqWords', '7I', 'Write an inequality from words', () => {
  const items = [
    ['A lift can carry <b>at most</b> {v} people.', 'p', '<=', 6, 20], ['You must be <b>at least</b> {v} cm tall to go on the ride.', 'h', '>=', 110, 150],
    ['The temperature stayed <b>below</b> {v}°C.', 't', '<', -5, 12], ['The number is <b>greater than</b> {v}.', 'x', '>', -8, 15],
    ['Spend <b>no more than</b> ${v}.', 's', '<=', 10, 80], ['Score <b>more than</b> {v} points to win.', 's', '>', 20, 90],
    ['A bag can hold a <b>maximum</b> of {v} kg.', 'm', '<=', 5, 25], ['Free entry for children <b>under</b> {v} years old.', 'a', '<', 3, 6],
    ['A <b>minimum</b> of {v} players is needed.', 'n', '>=', 5, 11], ['The number is <b>less than</b> {v}.', 'x', '<', -6, 12],
    ['Speed must <b>not exceed</b> {v} km/h.', 's', '<=', 40, 110], ['There must be <b>no fewer than</b> {v} chairs.', 'c', '>=', 10, 40],
    ['You must be <b>at least</b> {v} years old.', 'a', '>=', 12, 18], ['The water is <b>colder than</b> {v}°C.', 't', '<', 2, 20]
  ];
  const [t, l, op, lo, hi] = pick(items); const v = rnd(lo, hi);
  return { type: 'ineq', q: t.replace('{v}', fmt(v)) + ' Write this as an inequality using <b>' + l + '</b>.', ans: { v: l, op, val: v }, ansText: ineqText(l, op, v),
    hint: 'at least → ≥ · at most / no more than / maximum / not exceed → ≤ · more than / greater than → &gt; · less than / below / under → &lt;',
    sol: ['Key words: ' + t.match(/<b>(.*?)<\/b>/)[1] + ' → <b>' + opD(op) + '</b>.', '<b>' + ineqText(l, op, v) + '</b>', nlSVG(op, v)] };
});
gen('ineqFlip', '7I', 'Reverse an inequality', () => {
  const v = rnd(-9, 9), op = pick(['<', '>', '<=', '>=']);
  return { type: 'ineq', q: 'Rewrite <b>' + fmt(v) + ' ' + opD(op) + ' x</b> so that x is on the left-hand side.', ans: { v: 'x', op: flipOp(op), val: v }, ansText: ineqText('x', flipOp(op), v),
    hint: 'When you swap the two sides, the sign turns around. The pointy end must still point at the smaller thing.',
    sol: [fmt(v) + ' ' + opD(op) + ' x says x is ' + opWords(flipOp(op)) + ' ' + fmt(v) + '.', 'Swapping sides reverses the sign: <b>' + ineqText('x', flipOp(op), v) + '</b>.'] };
});
gen('ineqNeg', '7I', 'Multiply or divide by a negative', () => {
  const k = rnd(2, 6), x0 = rnd(-6, 6), op = pick(['<', '>', '<=', '>=']);
  if (Math.random() < 0.6) {
    const c = -k * x0; const str = '−' + k + 'x ' + opD(op) + ' ' + fmt(c);
    return { type: 'ineq', q: 'Solve <b>' + str + '</b>.', ans: { v: 'x', op: flipOp(op), val: x0 }, ansText: ineqText('x', flipOp(op), x0),
      hint: 'Divide both sides by −' + k + '. Dividing by a negative reverses the sign.', sol: solveRel(str).steps };
  }
  const c = rnd(-5, 5); const str = '−x/' + k + ' ' + opD(op) + ' ' + fmt(c);
  return { type: 'ineq', q: 'Solve <b>' + str + '</b>.', ans: { v: 'x', op: flipOp(op), val: -k * c }, ansText: ineqText('x', flipOp(op), -k * c),
    hint: 'Multiply both sides by −' + k + ' and reverse the sign.', sol: solveRel(str).steps };
});
gen('ineqTest', '7I', 'Is it a solution?', () => {
  const v = rnd(-5, 6), op = pick(['<', '>', '<=', '>=']);
  const cands = shuffle([v, v - 1, v + 1, v - 3, v + 3, v + 0.5, v - 0.5]).slice(0, 4);
  if (!cands.includes(v) && Math.random() < 0.5) cands[0] = v;
  const goodIdx = cands.map((c, i) => holds(c, op, v) ? i : -1).filter(i => i >= 0);
  if (goodIdx.length === 0 || goodIdx.length === 4) return G.ineqTest.fn();
  const askTrue = goodIdx.length === 1 || (goodIdx.length !== 3 && Math.random() < 0.5);
  const target = askTrue ? goodIdx : [0, 1, 2, 3].filter(i => !goodIdx.includes(i));
  if (target.length !== 1) return G.ineqTest.fn();
  const ansI = target[0];
  return { type: 'mcq', q: 'Which number is <b>' + (askTrue ? '' : 'not ') + 'a solution</b> of <b>x ' + opD(op) + ' ' + fmt(v) + '</b>?', choices: cands.map(c => fmt(c)), ans: ansI, ansText: fmt(cands[ansI]),
    hint: 'Substitute each number. Remember: ' + fmt(v) + ' itself is included only for ≤ or ≥.', sol: cands.map(c => fmt(c) + ' ' + opD(op) + ' ' + fmt(v) + ' is ' + (holds(c, op, v) ? '<b>true</b>' : 'false')).concat([nlSVG(op, v)]) };
});
gen('ineqConcept', '7I', 'Inequality facts', () => {
  const k = rnd(0, 4), v = rnd(-9, 12);
  if (k === 0) {
    const op = pick(['<', '>', '<=', '>=']); const closed = op.includes('='), right = op[0] === '>';
    const opt = (c, r) => (c ? 'Closed (filled) circle' : 'Open circle') + ' at ' + fmt(v) + ', arrow pointing ' + (r ? 'right' : 'left');
    return mcq4('How do you show <b>x ' + opD(op) + ' ' + fmt(v) + '</b> on a number line?', opt(closed, right), [opt(!closed, right), opt(closed, !right), opt(!closed, !right)],
      'For &lt; and &gt; the number is not included (open circle); for ≤ and ≥ it is included (closed circle). x &gt; or ≥ means the arrow points right (bigger numbers).', 'Is ' + fmt(v) + ' itself included? Which way are the bigger numbers?');
  }
  if (k === 1) {
    let a = rnd(-6, 8), b = a + rnd(1, 6); const m = rnd(2, 6);
    return mcq4('Start with <b>' + fmt(a) + ' &lt; ' + fmt(b) + '</b> and multiply both sides by <b>−' + m + '</b>. Which statement is true?', fmt(-m * a) + ' &gt; ' + fmt(-m * b),
      [fmt(-m * a) + ' &lt; ' + fmt(-m * b), fmt(m * a) + ' &lt; ' + fmt(m * b), fmt(-m * a) + ' &lt; ' + fmt(m * b), fmt(m * a) + ' &gt; ' + fmt(m * b)],
      [fmt(a) + ' × (−' + m + ') = ' + fmt(-m * a) + ' and ' + fmt(b) + ' × (−' + m + ') = ' + fmt(-m * b) + '.', 'Multiplying by a negative reverses the order, so the sign flips: <b>' + fmt(-m * a) + ' &gt; ' + fmt(-m * b) + '</b>.'], 'Work out both sides, then compare.');
  }
  if (k === 2) {
    const op = pick(['<', '>', '<=', '>=']); const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' }[op];
    return mcq4('Which inequality means the same as <b>' + fmt(v) + ' ' + opD(op) + ' x</b>?', 'x ' + opD(flip) + ' ' + fmt(v), ['x ' + opD(op) + ' ' + fmt(v), 'x ' + opD({ '<': '<=', '>': '>=', '<=': '<', '>=': '>' }[flip]) + ' ' + fmt(v), 'x ' + opD({ '<': '<=', '>': '>=', '<=': '<', '>=': '>' }[op]) + ' ' + fmt(v)],
      'Read it starting from x: swap the sides and turn the sign around so it still points at the same number. ' + fmt(v) + ' ' + opD(op) + ' x is the same as <b>x ' + opD(flip) + ' ' + fmt(v) + '</b>.', 'Read it backwards, starting from x.');
  }
  if (k === 3) {
    const W = [['at most', '≤'], ['no more than', '≤'], ['a maximum of', '≤'], ['up to and including', '≤'], ['at least', '≥'], ['no less than', '≥'], ['a minimum of', '≥'], ['more than', '&gt;'], ['over', '&gt;'], ['greater than', '&gt;'], ['fewer than', '&lt;'], ['less than', '&lt;'], ['under', '&lt;']];
    const C = [['A lift can carry', 'people'], ['You must be', 'years old to ride'], ['The bag can hold', 'kg'], ['The class has', 'students'], ['The phone charges in', 'minutes'], ['The speed limit is', 'km/h'], ['A ticket costs', 'dollars'], ['The tank holds', 'litres']];
    const [w, sign] = pick(W), [c, u] = pick(C), n = rnd(3, 120);
    return mcq4('“' + c + ' <b>' + w + '</b> ' + n + ' ' + u + '.” Which sign should you use?', sign, ['&lt;', '&gt;', '≤', '≥'], '“' + w + '” means <b>' + sign + '</b>. Check whether ' + n + ' itself is allowed: if it is, use ≤ or ≥.', 'Is ' + n + ' itself allowed?');
  }
  const op = pick(['<', '>', '<=', '>=']), c = rnd(-8, 10), a = rnd(2, 9), neg = Math.random() < 0.5;
  const steps = neg ? 'divide both sides by −' + a : pick(['add ' + a + ' to both sides', 'subtract ' + a + ' from both sides', 'multiply both sides by ' + a, 'divide both sides by ' + a]);
  return mcq4('Solving <b>' + (neg ? '−' + a + 'x' : 'x') + ' ' + opD(op) + ' ' + fmt(c) + '</b>, you ' + steps + '. What happens to the inequality sign?', neg ? 'It reverses' : 'It stays the same',
    [neg ? 'It stays the same' : 'It reverses', 'It becomes an equals sign', neg ? 'It reverses only if the number on the right is negative' : 'It reverses because there is a negative number', 'It changes from &lt; to ≤'],
    'Only multiplying or dividing both sides by a <b>negative</b> number reverses the sign. Adding, subtracting, or multiplying/dividing by a positive never does.', 'Is it multiplying or dividing by a negative?');
});
/* ---------- 7J solving inequalities ---------- */
// a line rule like y = 0.5x + 3 (decimals for halves and quarters, as in y = mx + c), otherwise the usual form
function linStr(a, b, v = 'x') {
  const av = typeof a === 'number' ? a : Fr.of(a).v;
  if (!Number.isInteger(av) && Number.isInteger(av * 100)) { const bv = typeof b === 'number' ? b : Fr.of(b).v; return (av < 0 ? '−' : '') + fmt(Math.abs(av)) + v + (bv ? (bv > 0 ? ' + ' : ' − ') + fmt(Math.abs(bv)) : ''); }
  return fmtLinN(a, b, v);
}
function ineqProblem(opPool = ['<', '>', '<=', '>=']) {
  const op = pick(opPool), x0 = rnd(-6, 9); const f = rnd(1, 6); let str;
  if (f === 1) { const a = rnd(2, 7), b = nz(-12, 12); str = linStr(a, b) + ' ' + opD(op) + ' ' + fmt(a * x0 + b); }
  else if (f === 2) { const a = rnd(2, 6), b = rnd(1, 15); str = fmt(b) + ' − ' + (a === 1 ? '' : a) + 'x ' + opD(op) + ' ' + fmt(b - a * x0); }
  else if (f === 3) { const a = rnd(2, 5), k = rnd(-3, 4), b = nz(-6, 6); const xv = a * k; str = 'x/' + a + ' ' + sgn(b) + ' ' + Math.abs(b) + ' ' + opD(op) + ' ' + fmt(k + b); return { str, x0: xv, op }; }
  else if (f === 4) { const a = rnd(2, 5), b = nz(-6, 6); str = a + '(x ' + sgn(b) + ' ' + Math.abs(b) + ') ' + opD(op) + ' ' + fmt(a * (x0 + b)); }
  else if (f === 5) { const c = rnd(1, 4), a = c + rnd(1, 4), b = nz(-9, 9); const d = (a - c) * x0 + b; str = linStr(a, b) + ' ' + opD(op) + ' ' + linStr(c, d); }
  else { const a = rnd(2, 6); str = '−' + a + 'x ' + opD(op) + ' ' + fmt(-a * x0); }
  return { str, x0, op };
}
gen('ineqSolve', '7J', 'Solve an inequality', () => {
  const p = ineqProblem(); const r = solveRel(p.str);
  return { type: 'ineq', q: 'Solve <b>' + p.str + '</b>.', ans: { v: 'x', op: r.op, val: r.val.v }, ansText: ineqText('x', r.op, r.val.v),
    hint: 'Undo operations in reverse order, doing the same thing to both sides. Reverse the sign only if you multiply or divide by a negative.',
    sol: r.steps.concat([nlSVG(r.op, r.val.v)]) };
});
gen('ineqSolveGraph', '7J', 'Solve and pick the number line', () => {
  const p = ineqProblem(); const r = solveRel(p.str); const v = r.val.v;
  const opts = shuffle([[r.op, v], [flipOp(r.op), v], [r.op.includes('=') ? r.op[0] : r.op + '=', v], [r.op, -v || v + 2]]);
  const ai = opts.findIndex(o => o[0] === r.op && o[1] === v);
  return { type: 'mcq', q: 'Solve <b>' + p.str + '</b>, then choose the number line that shows the solution.', choices: opts.map(o => nlSVG(o[0], o[1], { w: 300 })), ans: ai, ansText: ineqText('x', r.op, v), sol: r.steps };
});
gen('ineqContext', '7J', 'Inequality word problem', () => {
  const ctx = pick([
    () => { const rate = rnd(10, 18), bonus = pick([20, 30, 40, 50]), goal = pick([200, 250, 300, 350]); const v = (goal - bonus) / rate; const need = Math.ceil(v - 1e-9);
      return { q: 'Sam is paid $' + rate + ' per hour plus a $' + bonus + ' bonus. Sam wants to earn <b>at least</b> $' + goal + '. What is the least number of <b>whole</b> hours Sam must work?', ans: need,
        sol: [{ t: rate + 'h + ' + bonus + ' ≥ ' + goal, why: 'Write the inequality' }, { t: rate + 'h ≥ ' + (goal - bonus), why: 'Subtract ' + bonus }, { t: 'h ≥ ' + fmt(v, 2) + (Number.isInteger(v * 100) ? '' : '…'), why: 'Divide by ' + rate }, { t: 'h = ' + need, why: 'Whole hours, so round up' }] }; },
    () => { const cost = rnd(4, 9), have = rnd(40, 90); const v = Math.floor(have / cost);
      return { q: 'Movie tickets cost $' + cost + ' each. Mia has $' + have + '. What is the greatest number of tickets she can buy?', ans: v,
        sol: [{ t: cost + 't ≤ ' + have, why: 'She can spend at most $' + have }, { t: 't ≤ ' + fmt(have / cost, 2) + (Number.isInteger(have / cost * 100) ? '' : '…'), why: 'Divide by ' + cost }, { t: 't = ' + v, why: 'Whole tickets, so round down' }] }; },
    () => { const per = rnd(5, 9), max = pick([40, 50, 60]), already = rnd(3, 12); const v = Math.floor((max - already) / per);
      return { q: 'A van can carry at most ' + max + ' boxes. It already has ' + already + ' boxes. Crates of ' + per + ' boxes are added. What is the greatest number of crates that can be added?', ans: v,
        sol: [{ t: already + ' + ' + per + 'c ≤ ' + max, why: 'At most ' + max }, { t: per + 'c ≤ ' + (max - already), why: 'Subtract ' + already }, { t: 'c ≤ ' + fmt((max - already) / per, 2) + (Number.isInteger((max - already) / per * 100) ? '' : '…'), why: 'Divide by ' + per }, { t: 'c = ' + v, why: 'Round down to a whole number' }] }; }
  ])();
  return { type: 'num', q: ctx.q, ans: ctx.ans, ansText: fmt(ctx.ans), hint: 'Write an inequality, solve it, then think about whether to round up or down.', sol: ctx.sol };
});

/* ---------- equations ---------- */
gen('eqSolve', 'EQ', 'Solve a linear equation', () => {
  const f = rnd(1, 8), x0 = rnd(-6, 12); let str;
  if (f === 1) { const a = rnd(2, 9), b = nz(-15, 15); str = linStr(a, b) + ' = ' + fmt(a * x0 + b); }
  else if (f === 2) { const c = rnd(1, 5), a = c + rnd(1, 5), b = nz(-10, 10); str = linStr(a, b) + ' = ' + linStr(c, (a - c) * x0 + b); }
  else if (f === 3) { const a = rnd(2, 6), b = nz(-6, 6); str = a + '(x ' + sgn(b) + ' ' + Math.abs(b) + ') = ' + fmt(a * (x0 + b)); }
  else if (f === 4) { const a = rnd(2, 6), k = rnd(-4, 6), b = nz(-6, 6); str = 'x/' + a + ' ' + sgn(b) + ' ' + Math.abs(b) + ' = ' + fmt(k + b); }
  else if (f === 5) { const a = rnd(2, 5), b = nz(-6, 6), k = rnd(-3, 6); str = '(x ' + sgn(b) + ' ' + Math.abs(b) + ')/' + a + ' = ' + fmt(k); }
  else if (f === 6) { const a = rnd(2, 6), b = rnd(5, 20); str = fmt(b) + ' − ' + a + 'x = ' + fmt(b - a * x0); }
  else if (f === 7) { const a = rnd(2, 4), b = nz(-4, 4), c = rnd(2, 5), d = nz(-9, 9); if (a * 2 === c) return G.eqSolve.fn(); const A = a * 2; str = a + '(2x ' + sgn(b) + ' ' + Math.abs(b) + ') = ' + linStr(c, d); if (A === c) return G.eqSolve.fn(); }
  else { const a = pick([3, 4, 6, 7, 8]), b = nz(-9, 9), c = rnd(-10, 20); if ((c - b) % a === 0) return G.eqSolve.fn(); str = linStr(a, b) + ' = ' + fmt(c); }
  const r = solveRel(str); if (r.special) return G.eqSolve.fn();
  const fr = str.match(/^\(x ([+−]) (\d+)\)\/(\d+) = (−?\d+)$/);
  if (fr) { const b = (fr[1] === '+' ? 1 : -1) * +fr[2], a = +fr[3], k = +fr[4].replace('−', '-'), x = a * k - b;
    r.steps = [{ t: str, why: 'The equation to solve' }, { t: 'x ' + fr[1] + ' ' + fr[2] + ' = ' + fmt(a * k), why: 'Multiply both sides by ' + a + ' (' + fmt(k) + ' × ' + a + ' = ' + fmt(a * k) + ')' }, { t: 'x = ' + fmt(x), why: (b > 0 ? 'Subtract ' + b + ' from' : 'Add ' + (-b) + ' to') + ' both sides' }, { t: 'Check: (' + fmt(x) + ' ' + fr[1] + ' ' + fr[2] + ') ÷ ' + a + ' = ' + fmt(x + b) + ' ÷ ' + a + ' = ' + fmt(k) + ' ✓', why: 'Substitute x = ' + fmt(x) + ' back into the original' }]; }
  const exact = r.val.isInt() || longDiv(r.val.n, r.val.d).term;
  return { type: 'num', q: 'Solve <b>' + str + '</b>' + (exact ? '.' : ' (give your answer as a fraction or to 2 decimal places).'), ans: r.val.v, ansText: 'x = ' + r.val.show(),
    hint: 'Expand brackets, collect the x terms on one side, then undo + and − before × and ÷.', sol: r.steps };
});
gen('eqWord', 'EQ', 'Equation word problem', () => {
  const k = rnd(1, 3);
  if (k === 1) { const w = rnd(3, 12), d = rnd(2, 6), P = 2 * (w + w + d);
    return { type: 'num', q: 'A rectangle is ' + d + ' cm longer than it is wide. Its perimeter is ' + P + ' cm. Let the width be x cm. Find x.', ans: w, ansText: 'x = ' + w,
      sol: solveRel('2(x + x + ' + d + ') = ' + P).steps.concat(['Width = ' + w + ' cm, length = ' + (w + d) + ' cm, area = ' + w * (w + d) + ' cm².']) }; }
  if (k === 2) { const x = rnd(8, 40); const a = rnd(2, 4), b = rnd(5, 30);
    return { type: 'num', q: 'I think of a number, multiply it by ' + a + ' and add ' + b + '. The answer is ' + (a * x + b) + '. What is the number?', ans: x, ansText: String(x), sol: solveRel(a + 'n + ' + b + ' = ' + (a * x + b)).steps }; }
  const x = rnd(15, 35), a1 = rnd(2, 3), b1 = rnd(5, 25), b2 = b1 + rnd(10, 60);
  const big = a1 * x + b1; void b2;
  return { type: 'num', q: 'The opposite angles of a parallelogram are (' + a1 + 'x + ' + b1 + ')° and (' + (a1 - 1 === 1 ? '' : a1 - 1) + 'x + ' + (b1 + x) + ')°. Find x.', ans: x, ansText: 'x = ' + x,
    sol: ['Opposite angles of a parallelogram are equal.'].concat(solveRel(a1 + 'x + ' + b1 + ' = ' + (a1 - 1 === 1 ? '' : a1 - 1) + 'x + ' + (b1 + x)).steps).concat(['Each of these angles is ' + big + '°; the other two are 180 − ' + big + ' = ' + (180 - big) + '° each.']) };
});

/* ---------- linear relations ---------- */
const br = v => (v < 0 ? '(' + fmt(v) + ')' : fmt(v)); // negative numbers go in brackets in working
// "m × x" written the way you'd write it by hand: 2 × (−3), −(−3), −1 × 0, or just 4 when m = 1
const mx = (m, x) => (m === 1 ? br(x) : m === -1 ? (x === 0 ? '−1 × 0' : '−' + br(x)) : fmt(m) + ' × ' + br(x));
const cTail = c => (c === 0 ? '' : ' ' + sgn(c) + ' ' + Math.abs(c)); // "+ 3", "− 2", or nothing when c = 0
gen('tableFill', 'L1', 'Complete a table of values', () => {
  const m = nz(-3, 4), c = rnd(-6, 8); const start = rnd(-2, 0); const xs = [0, 1, 2, 3, 4].map(i => start + i); const ys = xs.map(x => m * x + c);
  return { type: 'nums', q: 'Complete the table for <b>y = ' + linStr(m, c) + '</b>. Type the five y-values in order, separated by commas.', fig: tableHTML(xs, xs.map(() => null)), ans: ys, ansText: ys.map(y => fmt(y)).join(', '),
    hint: 'Substitute each x-value into the rule.', sol: xs.map(x => 'x = ' + fmt(x) + ': y = ' + mx(m, x) + cTail(c) + ' = ' + fmt(m * x + c)).concat([gridSVG({ xmin: -3, xmax: 5, ymin: Math.min(-2, ...ys) - 1, ymax: Math.max(2, ...ys) + 1, lines: [{ m, c }], points: xs.map((x, i) => ({ x, y: ys[i] })), size: 260 })]) };
});
gen('plotRead', 'L1', 'Read coordinates from a grid', () => {
  const x = nz(-5, 5), y = nz(-5, 5); const lb = pick(['A', 'B', 'P', 'Q', 'R', 'M']);
  return { type: 'coord', q: 'Write the coordinates of point <b>' + lb + '</b>.', fig: gridSVG({ points: [{ x, y, label: lb, cls: 'b' }], size: 260 }), ans: [[x, y]], ansText: ptStr([x, y]),
    hint: 'Go across first (x), then up or down (y).', sol: [lb + ' is ' + Math.abs(x) + ' ' + (x > 0 ? 'right' : 'left') + ' of the origin and ' + Math.abs(y) + ' ' + (y > 0 ? 'up' : 'down') + ', so ' + lb + ptStr([x, y]) + '.'] };
});
gen('quadrant', 'L1', 'Which quadrant?', () => {
  const x = nz(-9, 9), y = nz(-9, 9); const q = x > 0 ? (y > 0 ? 0 : 3) : (y > 0 ? 1 : 2);
  return { type: 'mcq', q: 'In which quadrant is the point <b>' + ptStr([x, y]) + '</b>?', choices: ['1st (top right)', '2nd (top left)', '3rd (bottom left)', '4th (bottom right)'], ans: q, ansText: ['1st', '2nd', '3rd', '4th'][q],
    sol: ['x is ' + (x > 0 ? 'positive (right)' : 'negative (left)') + ' and y is ' + (y > 0 ? 'positive (up)' : 'negative (down)') + '. Quadrants are numbered anticlockwise from the top right.'] };
});
gen('isLinear', 'L1', 'Is the table linear?', () => {
  const lin = Math.random() < 0.5; const m = nz(-4, 4), c = rnd(-5, 8); const xs = [0, 1, 2, 3, 4];
  const ys = lin ? xs.map(x => m * x + c) : xs.map(x => x * x + c);
  return { type: 'mcq', q: 'Do the points in this table lie on a straight line?', fig: tableHTML(xs, ys), choices: ['Yes, it is linear', 'No, it is not linear'], ans: lin ? 0 : 1, ansText: lin ? 'Yes' : 'No',
    sol: ['Look at the change in y each time x goes up by 1: ' + ys.slice(1).map((y, i) => fmt(y - ys[i])).join(', ') + '.', lin ? 'The change is constant, so the relation is linear.' : 'The change is not constant, so the points do not form a straight line.'] };
});
gen('gradient2', 'L2', 'Gradient between two points', () => {
  let x1 = rnd(-6, 6), y1 = rnd(-6, 8), x2 = rnd(-6, 6), y2 = rnd(-8, 10); if (x1 === x2) return G.gradient2.fn();
  const m = new Fr(y2 - y1, x2 - x1); if (Math.abs(m.d) > 4) return G.gradient2.fn();
  return { type: 'num', q: 'Find the gradient of the line through <b>' + ptStr([x1, y1]) + '</b> and <b>' + ptStr([x2, y2]) + '</b>.', ans: m.v, ansText: m.show(),
    hint: 'm = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁)', sol: [{ t: 'm = (y₂ − y₁) ÷ (x₂ − x₁)', why: 'Gradient = rise ÷ run' }, { t: 'm = (' + fmt(y2) + ' − ' + br(y1) + ') ÷ (' + fmt(x2) + ' − ' + br(x1) + ')', why: 'Substitute' }, { t: 'm = ' + fmt(y2 - y1) + ' ÷ ' + br(x2 - x1) + ' = ' + m.show(), why: m.isZero() ? 'Zero gradient: a horizontal line' : (m.sign() > 0 ? 'Positive: the line goes up from left to right' : 'Negative: the line goes down from left to right') }] };
});
gen('gradientType', 'L2', 'Gradient facts', () => {
  const k = rnd(0, 4); const line = (m, c) => 'y = ' + (m === 1 ? '' : m === -1 ? '−' : fmt(m)) + 'x' + (c ? (c > 0 ? ' + ' : ' − ') + fmt(Math.abs(c)) : '');
  if (k === 0) {
    const ms = shuffle([0.5, 1, 1.5, 2, 3, 4, 5, 0.25, 6]).slice(0, 4); const big = Math.max(...ms); const sgn = ms.map(m => (Math.random() < 0.5 ? -1 : 1) * m);
    const ls = sgn.map(m => line(m, rnd(-6, 6))); const right = ls[ms.indexOf(big)];
    return mcq4('Which line is the <b>steepest</b>?', right, ls.filter(l => l !== right), 'Steepness depends on the size of the gradient, ignoring the sign. ' + right + ' has the biggest size of m (' + big + ').', 'Compare the gradients, ignoring + or −.');
  }
  if (k === 1) {
    const m = pick([-4, -3, -2, -1, 2, 3, 4, 0.5, -0.5]), c1 = rnd(-6, 6), c2 = c1 + pick([-5, -3, -2, 2, 3, 5]);
    const others = [[-m, c2], [m + pick([1, -1]), c1], [c1 || 1, m], [1 / m, c2], [2 * m, c2]].filter(([g]) => g !== m && g !== 0);
    return mcq4('Which pair of lines is <b>parallel</b>?', line(m, c1) + ' and ' + line(m, c2), others.map(([g, c]) => line(m, c1) + ' and ' + line(g, c)),
      'Parallel lines have the <b>same gradient</b> (the number in front of x). The y-intercepts can be different.', 'Look at the number in front of x.');
  }
  if (k === 2) {
    const x1 = rnd(-5, 4), x2 = x1 + rnd(1, 5), y1 = rnd(-6, 6), dy = pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 0]); const y2 = y1 + dy;
    const right = dy > 0 ? 'Positive' : dy < 0 ? 'Negative' : 'Zero';
    return mcq4('A line passes through <b>' + ptStr([x1, y1]) + '</b> and <b>' + ptStr([x2, y2]) + '</b>. What kind of gradient does it have?', right, ['Positive', 'Negative', 'Zero', 'Undefined'],
      ['Rise = ' + fmt(y2) + ' − ' + br(y1) + ' = ' + fmt(dy) + ', run = ' + fmt(x2) + ' − ' + br(x1) + ' = ' + fmt(x2 - x1) + '.', 'Gradient = ' + fmt(dy) + ' ÷ ' + fmt(x2 - x1) + (dy === 0 ? ' = 0 (horizontal line).' : ', which is <b>' + right.toLowerCase() + '</b>.')], 'Does the line go up, down or stay level from left to right?');
  }
  if (k === 3) {
    const n = rnd(-8, 9), vert = Math.random() < 0.5;
    return mcq4('What is the gradient of the line <b>' + (vert ? 'x' : 'y') + ' = ' + fmt(n) + '</b>?', vert ? 'Undefined (it is vertical)' : '0 (it is horizontal)', [vert ? '0 (it is horizontal)' : 'Undefined (it is vertical)', fmt(n), '1', n ? fmt(-n) : '−1'].filter(v => v !== '0' || vert),
      vert ? 'x = ' + fmt(n) + ' is a vertical line. The run is 0 and you can’t divide by 0, so the gradient is undefined.' : 'y = ' + fmt(n) + ' is a horizontal line: the rise is 0, so the gradient is 0.', 'Sketch it: is it flat or straight up and down?');
  }
  const rise = rnd(-9, 9) || 4, run = rnd(1, 6);
  return mcq4('A line rises <b>' + fmt(rise) + '</b> for every <b>' + run + '</b> across' + (rise < 0 ? ' (it falls)' : '') + '. What is its gradient?', fmt(r2(rise / run, 4)), [fmt(r2(run / rise, 4)), fmt(r2(-rise / run, 4)), fmt(rise * run), fmt(rise + run)].filter(v => v !== fmt(r2(rise / run, 4))),
    'Gradient = rise ÷ run = ' + fmt(rise) + ' ÷ ' + run + ' = <b>' + fmt(r2(rise / run, 4)) + '</b>.', 'Rise over run.');
});
gen('gradientGraph', 'L2', 'Gradient from a graph', () => {
  const m = pick([-3, -2, -1, -0.5, 0.5, 1, 2, 3, 1.5, -1.5]), c = rnd(-3, 3);
  return { type: 'num', q: 'Find the gradient of this line.', fig: gridSVG({ xmin: -5, xmax: 5, ymin: -6, ymax: 6, lines: [{ m, c, cls: 'b' }], size: 270 }), ans: m, ansText: fmt(m),
    hint: 'Pick two points where the line crosses grid corners exactly. Count rise and run.', sol: ['Two exact points: ' + ptStr([0, c]) + ' and ' + ptStr([2, c + 2 * m]) + '.', 'Rise = ' + fmt(2 * m) + ', run = 2, so m = ' + fmt(2 * m) + ' ÷ 2 = <b>' + fmt(m) + '</b>.'] };
});
function ruleForms(m, c, v = 'x') {
  const forms = ['y = ' + linStr(m, c, v)];
  if (c !== 0) forms.push('y = ' + fmt(c) + (m > 0 ? ' + ' : ' − ') + coefStr(Math.abs(m), v));
  return forms;
}
gen('mcRule', 'L3', 'Gradient and y-intercept from a rule', () => {
  const m = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 0.5, 2.5, -0.5]), c = rnd(-9, 9); const form = pick(ruleForms(m, c)); const askM = Math.random() < 0.5;
  return { type: 'num', q: 'For the line <b>' + form + '</b>, state the ' + (askM ? '<b>gradient (m)</b>' : '<b>y-intercept (c)</b>') + '.', ans: askM ? m : c, ansText: askM ? 'm = ' + fmt(m) : 'c = ' + fmt(c),
    hint: 'Write it as y = mx + c. m is the number in front of x (with its sign); c is the number on its own.', sol: ['In the form y = mx + c: y = ' + linStr(m, c) + '.', 'Gradient m = <b>' + fmt(m) + '</b>, y-intercept c = <b>' + fmt(c) + '</b>.'] };
});
gen('ruleGraph', 'L3', 'Rule from a graph', () => {
  const m = pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]), c = rnd(-3, 4);
  return { type: 'rule', q: 'Write the rule for this line in the form <b>y = mx + c</b>.', fig: gridSVG({ xmin: -5, xmax: 5, ymin: -6, ymax: 6, lines: [{ m, c, cls: 'b' }], size: 270 }), ans: { lhs: 'y', a: m, b: c }, ansText: 'y = ' + linStr(m, c),
    hint: 'c is where the line crosses the y-axis. Then count rise ÷ run for m.', sol: ['It crosses the y-axis at ' + fmt(c) + ', so c = ' + fmt(c) + '.', 'From ' + ptStr([0, c]) + ' to ' + ptStr([2, c + 2 * m]) + ': rise ' + fmt(2 * m) + ', run 2, so m = ' + fmt(m) + '.', '<b>y = ' + linStr(m, c) + '</b>'] };
});
gen('rule2pts', 'L3', 'Rule through two points', () => {
  const m = pick([-3, -2, -1, 1, 2, 3, 4, 0.5]), c = rnd(-6, 6); let x1 = rnd(-3, 2), x2 = x1 + pick([2, 4]);
  const p1 = [x1, m * x1 + c], p2 = [x2, m * x2 + c];
  return { type: 'rule', q: 'Find the rule of the straight line through <b>' + ptStr(p1) + '</b> and <b>' + ptStr(p2) + '</b>.', ans: { lhs: 'y', a: m, b: c }, ansText: 'y = ' + linStr(m, c),
    hint: 'Find m first, then substitute one point into y = mx + c to find c.', sol: [{ t: 'm = (' + fmt(p2[1]) + ' − ' + br(p1[1]) + ') ÷ (' + fmt(x2) + ' − ' + br(x1) + ') = ' + fmt(p2[1] - p1[1]) + ' ÷ ' + fmt(x2 - x1) + ' = ' + fmt(m), why: 'Gradient = rise ÷ run' }, { t: fmt(p1[1]) + ' = ' + fmt(m) + ' × ' + br(x1) + ' + c', why: 'Substitute ' + ptStr(p1) }, { t: 'c = ' + fmt(c), why: 'Solve for c' }, { t: 'y = ' + linStr(m, c), why: 'Write the rule' }] };
});
gen('xint', 'L3', 'Find the x-intercept', () => {
  const m = nz(-5, 5), x0 = rnd(-6, 8); const c = -m * x0; if (c === 0) return G.xint.fn();
  return { type: 'num', q: 'Find the <b>x-intercept</b> of <b>y = ' + linStr(m, c) + '</b>.', ans: x0, ansText: 'x = ' + fmt(x0),
    hint: 'The x-intercept is where y = 0.', sol: solveRel(linStr(m, c) + ' = 0').steps.concat(['The line crosses the x-axis at ' + ptStr([x0, 0]) + '.']) };
});
gen('ruleTable', 'L4', 'Rule from a table', () => {
  const m = nz(-4, 5), c = rnd(-6, 12); const start = pick([0, 0, 1, -1]); const xs = [0, 1, 2, 3, 4].map(i => start + i); const ys = xs.map(x => m * x + c);
  return { type: 'rule', q: 'Find the rule for this table. Write it as <b>y = …</b>', fig: tableHTML(xs, ys), ans: { lhs: 'y', a: m, b: c }, ansText: 'y = ' + linStr(m, c),
    hint: 'How much does y change when x goes up by 1? That is m. The y-value when x = 0 is c.', sol: ['Each time x increases by 1, y changes by ' + fmt(m) + ', so m = ' + fmt(m) + '.', 'When x = 0, y = ' + fmt(c) + (start !== 0 ? ' (work backwards one step from x = 1)' : '') + ', so c = ' + fmt(c) + '.', '<b>y = ' + linStr(m, c) + '</b>'] };
});
const CONTEXTS = [
  () => { const f = rnd(3, 6), r = pick([1.5, 2, 2.5, 3]); return { t: 'A taxi charges a $' + f + ' flag fall plus $' + r.toFixed(2) + ' per kilometre.', L: 'C', v: 'd', a: r, b: f, lw: 'C for cost in dollars and d for distance in km', unit: '$', x: 'km', what: 'cost' }; },
  () => { const s = pick([80, 90, 100]), r = pick([4, 5, 8]); return { t: 'A phone battery is at ' + s + '% and drops ' + r + '% every hour.', L: 'B', v: 't', a: -r, b: s, lw: 'B for battery % and t for hours', unit: '%', x: 'hours', what: 'battery level' }; },
  () => { const f = pick([20, 25, 30, 50]), r = pick([10, 12, 15, 18]); return { t: 'A gym charges a $' + f + ' joining fee plus $' + r + ' per week.', L: 'C', v: 'w', a: r, b: f, lw: 'C for cost in dollars and w for weeks', unit: '$', x: 'weeks', what: 'cost' }; },
  () => { const s = pick([20, 30, 40]), r = pick([2, 4, 5]); return { t: 'A submarine is ' + s + ' m below sea level and rises ' + r + ' m every minute.', L: 'd', v: 't', a: r, b: -s, lw: 'd for depth in metres (negative below sea level) and t for minutes', unit: 'm', x: 'minutes', what: 'depth' }; },
  () => { const s = pick([30, 45, 60, 100]), r = pick([10, 15, 20, 25]); return { t: 'Ari has $' + s + ' saved and saves $' + r + ' every week.', L: 'A', v: 'w', a: r, b: s, lw: 'A for amount in dollars and w for weeks', unit: '$', x: 'weeks', what: 'amount saved' }; },
  () => { const s = pick([20, 30, 40]), r = pick([0.5, 0.8, 1.5, 2]); return { t: 'A phone plan includes ' + s + ' GB of data, used at ' + r + ' GB per day.', L: 'D', v: 'd', a: -r, b: s, lw: 'D for data left in GB and d for days', unit: 'GB', x: 'days', what: 'data left' }; },
  () => { const f = pick([40, 55, 65]), r = pick([0.2, 0.3, 0.25]); return { t: 'A car hire company charges a $' + f + ' fee plus $' + r.toFixed(2) + ' per kilometre.', L: 'C', v: 'k', a: r, b: f, lw: 'C for cost in dollars and k for kilometres', unit: '$', x: 'km', what: 'cost' }; },
  () => { const s = pick([500, 800, 1000]), r = pick([25, 40, 50]); return { t: 'A water tank holds ' + s + ' L and leaks ' + r + ' L per day.', L: 'W', v: 't', a: -r, b: s, lw: 'W for litres left and t for days', unit: 'L', x: 'days', what: 'water left' }; }
];
gen('ruleWords', 'L4', 'Rule from a worded situation', () => {
  const c = pick(CONTEXTS)();
  return { type: 'rule', q: c.t + ' Write a rule using ' + c.lw + '.', ans: { lhs: c.L, v: c.v, a: c.a, b: c.b }, ansText: ctxRule(c),
    hint: 'The starting amount (fixed fee) is c. The amount per unit is m — negative if it goes down.', sol: ['Start value (when ' + c.v + ' = 0): ' + fmt(c.b) + '. Change per unit: ' + fmt(c.a) + '.', '<b>' + ctxRule(c) + '</b>'] };
});
const withUnit = (v, u) => (u === '$' ? money(v) : u === '%' ? fmt(v, 2) + '%' : fmt(v, 2) + (u ? ' ' + u : ''));
gen('ruleUse', 'L5', 'Use a rule in context', () => {
  const c = pick(CONTEXTS)(); const ruleS = ctxRule(c);
  if (Math.random() < 0.5) {
    const xv = rnd(2, 12); const y = c.a * xv + c.b;
    return { type: 'num', q: c.t + ' The rule is <b>' + ruleS + '</b>. Find the ' + c.what + ' when ' + c.v + ' = ' + xv + '.', ans: r2(y, 4), ansText: withUnit(y, c.unit),
      sol: [{ t: c.L + ' = ' + fmt(c.b) + ' ' + (c.a < 0 ? '−' : '+') + ' ' + fmt(Math.abs(c.a)) + ' × ' + xv, why: 'Substitute ' + c.v + ' = ' + xv }, { t: c.L + ' = ' + fmt(c.b) + ' ' + (c.a < 0 ? '−' : '+') + ' ' + fmt(Math.abs(c.a * xv)) + ' = ' + fmt(y, 2), why: 'Multiply first, then ' + (c.a < 0 ? 'subtract' : 'add') }] };
  }
  const xv = rnd(2, 15); const target = r2(c.a * xv + c.b, 4); const r = solveRel(fmtLinN(c.a, c.b, c.v) + ' = ' + fmt(target).replace('−', '-'));
  return { type: 'num', q: c.t + ' The rule is <b>' + ruleS + '</b>. Find ' + c.v + ' when the ' + c.what + ' is ' + withUnit(target, c.unit) + '.', ans: xv, ansText: c.v + ' = ' + xv + ' ' + c.x, sol: r.steps };
});
gen('evalRule', 'L5', 'Substitute into a rule', () => {
  const m = nz(-5, 5), c = rnd(-9, 9), x = rnd(-6, 8);
  return { type: 'num', q: 'Use <b>y = ' + linStr(m, c) + '</b> to find y when <b>x = ' + fmt(x) + '</b>.', ans: m * x + c, ansText: 'y = ' + fmt(m * x + c),
    sol: c === 0 ? [{ t: 'y = ' + mx(m, x) + ' = ' + fmt(m * x), why: 'Substitute' + (Math.abs(m) === 1 ? '' : ' and multiply') }] : [{ t: 'y = ' + mx(m, x) + cTail(c), why: 'Substitute' }, { t: 'y = ' + fmt(m * x) + cTail(c) + ' = ' + fmt(m * x + c), why: 'Multiply first, then ' + (c > 0 ? 'add' : 'subtract') }] };
});
gen('solveRule', 'L5', 'Find x for a given y', () => {
  const m = nz(-5, 5), c = rnd(-9, 9), x = rnd(-6, 10); const y = m * x + c;
  return { type: 'num', q: 'Use <b>y = ' + linStr(m, c) + '</b> to find x when <b>y = ' + fmt(y) + '</b>.', ans: x, ansText: 'x = ' + fmt(x), sol: solveRel(linStr(m, c) + ' = ' + fmt(y)).steps };
});
gen('onLine', 'L5', 'Is the point on the line?', () => {
  const m = nz(-4, 4), c = rnd(-8, 8), x = rnd(-5, 6); const yes = Math.random() < 0.5; const y = m * x + c + (yes ? 0 : nz(-2, 2));
  return { type: 'mcq', q: 'Does the point <b>' + ptStr([x, y]) + '</b> lie on the line <b>y = ' + linStr(m, c) + '</b>?', choices: ['Yes', 'No'], ans: yes ? 0 : 1, ansText: yes ? 'Yes' : 'No',
    hint: 'Substitute the x-value. Do you get the y-value?', sol: ['Substitute x = ' + fmt(x) + ': y = ' + mx(m, x) + cTail(c) + ' = ' + fmt(m * x + c) + '.', yes ? 'This equals ' + fmt(y) + ', so <b>yes</b>, the point is on the line.' : 'This is not ' + fmt(y) + ', so <b>no</b>, the point is not on the line.'] };
});
gen('breakEven', 'L5', 'When do two plans cost the same?', () => {
  const f1 = rnd(4, 14) * 5, r1 = rnd(8, 15) * 3, f2 = rnd(0, 6) * 5, r2v = r1 + rnd(2, 6) * 2; if (f1 <= f2) return G.breakEven.fn();
  const t = (f1 - f2) / (r2v - r1); const nm = pick([['Plumber A', 'Plumber B', 'h', 'hours'], ['Gym A', 'Gym B', 'w', 'weeks'], ['Phone plan A', 'Phone plan B', 'm', 'months']]);
  return { type: 'num', q: nm[0] + ' charges $' + f1 + ' plus $' + r1 + ' per ' + nm[3].slice(0, -1) + '. ' + nm[1] + (f2 ? ' charges $' + f2 + ' plus $' + r2v : ' charges just $' + r2v) + ' per ' + nm[3].slice(0, -1) + '. After how many ' + nm[3] + ' do they cost the same? (2 d.p. if needed)', ans: r2(t, 2), tol: 0.011, ansText: fmt(t, 2) + ' ' + (t === 1 ? nm[3].slice(0, -1) : nm[3]),
    sol: [{ t: f1 + ' + ' + r1 + nm[2] + ' = ' + (f2 ? f2 + ' + ' : '') + r2v + nm[2], why: 'Set the two costs equal' }, { t: (f1 - f2) + ' = ' + (r2v - r1) + nm[2], why: 'Subtract ' + (f2 ? f2 + ' and ' : '') + r1 + nm[2] + ' from both sides' }, { t: nm[2] + ' = ' + fmt(t, 2), why: 'Divide by ' + (r2v - r1) }, 'For longer than this, ' + nm[0] + ' is cheaper because its rate per ' + nm[3].slice(0, -1) + ' is lower.'] };
});

/* ---------- 10A reflection ---------- */
gen('reflectPt', '10A', 'Reflect a point', () => {
  const x = nz(-6, 6), y = nz(-6, 6); const L = pick([{ t: 'x-axis' }, { t: 'y-axis' }, { t: 'x-axis' }, { t: 'y-axis' }, { t: 'x=k', k: nz(-3, 3) }, { t: 'y=k', k: nz(-3, 3) }, { t: 'y=x' }]);
  const r = reflectPt([x, y], L); if (Math.abs(r[0]) > 9 || Math.abs(r[1]) > 9 || (r[0] === x && r[1] === y)) return G.reflectPt.fn();
  return { type: 'coord', q: 'Reflect the point <b>' + ptStr([x, y]) + '</b> in the <b>' + lineName(L) + '</b>. Write the coordinates of the image.', ans: [r], ansText: ptStr(r),
    hint: reflectRule(L), sol: [reflectRule(L)].concat(L.t === 'x=k' ? ['x′ = 2 × ' + br(L.k) + ' − ' + br(x) + ' = ' + fmt(r[0]) + ', and y stays ' + fmt(y) + '.'] : L.t === 'y=k' ? ['y′ = 2 × ' + br(L.k) + ' − ' + br(y) + ' = ' + fmt(r[1]) + ', and x stays ' + fmt(x) + '.'] : []).concat(['Image: <b>' + ptStr(r) + '</b>', gridSVG({ xmin: -9, xmax: 9, ymin: -9, ymax: 9, mirrors: [L], points: [{ x, y, label: 'P' }, { x: r[0], y: r[1], label: 'P′', cls: 'b' }], size: 260 })]) };
});
const TRI_NAMES = [['A', 'B', 'C'], ['D', 'E', 'F'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['J', 'K', 'L']];
function randTri(lim = 5) {
  for (;;) { const p = [[rnd(-lim, lim), rnd(-lim, lim)], [rnd(-lim, lim), rnd(-lim, lim)], [rnd(-lim, lim), rnd(-lim, lim)]]; const area = Math.abs((p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1])); if (area >= 4) return p; }
}
gen('reflectShape', '10A', 'Reflect a triangle', () => {
  const nm = pick(TRI_NAMES), P = randTri(5), L = pick([{ t: 'x-axis' }, { t: 'y-axis' }]); const R = P.map(p => reflectPt(p, L));
  return { type: 'coord', q: 'Triangle ' + nm.join('') + ' has ' + nm.map((n, i) => n + ptStr(P[i])).join(', ') + '. Reflect it in the <b>' + lineName(L) + '</b>. Write the coordinates of ' + nm.map(n => n + '′').join(', ') + ' in order.', fig: gridSVG({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, polys: [{ pts: P, labels: nm }], size: 260 }),
    ans: R, ansText: nm.map((n, i) => n + '′' + ptStr(R[i])).join(', '), hint: reflectRule(L), sol: [reflectRule(L), nm.map((n, i) => n + ptStr(P[i]) + ' → ' + n + '′' + ptStr(R[i])).join('<br>'), gridSVG({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, mirrors: [L], polys: [{ pts: P, labels: nm }, { pts: R, labels: nm.map(n => n + '′'), cls: 'b' }], size: 260 })] };
});
gen('reflectWhich', '10A', 'Identify the mirror line', () => {
  const x = nz(-6, 6), y = nz(-6, 6); if (Math.abs(x) === Math.abs(y)) return G.reflectWhich.fn(); const opts = [{ t: 'x-axis' }, { t: 'y-axis' }, { t: 'y=x' }, { t: 'y=-x' }]; const i = rnd(0, 3); const r = reflectPt([x, y], opts[i]);
  return { type: 'mcq', q: 'The point ' + ptStr([x, y]) + ' is reflected to ' + ptStr(r) + '. What is the mirror line?', choices: opts.map(lineName), ans: i, ansText: lineName(opts[i]), sol: [reflectRule(opts[i])] };
});

/* ---------- 10B translation ---------- */
const vecWords = (a, b) => (a === 0 ? '' : Math.abs(a) + ' unit' + (Math.abs(a) === 1 ? '' : 's') + ' ' + (a > 0 ? 'right' : 'left')) + (a !== 0 && b !== 0 ? ' and ' : '') + (b === 0 ? '' : Math.abs(b) + ' unit' + (Math.abs(b) === 1 ? '' : 's') + ' ' + (b > 0 ? 'up' : 'down'));
gen('translatePt', '10B', 'Translate a point', () => {
  const x = rnd(-6, 6), y = rnd(-6, 6), a = nz(-5, 5), b = nz(-5, 5);
  return { type: 'coord', q: 'Translate <b>' + ptStr([x, y]) + '</b> by the vector <b>(' + fmt(a) + ', ' + fmt(b) + ')</b>.', ans: [[x + a, y + b]], ansText: ptStr([x + a, y + b]),
    hint: 'Add the vector: (x + a, y + b).', sol: ['The vector (' + fmt(a) + ', ' + fmt(b) + ') means ' + vecWords(a, b) + '.', '(' + fmt(x) + ' + ' + (a < 0 ? '(' + fmt(a) + ')' : fmt(a)) + ', ' + fmt(y) + ' + ' + (b < 0 ? '(' + fmt(b) + ')' : fmt(b)) + ') = <b>' + ptStr([x + a, y + b]) + '</b>'] };
});
gen('findVector', '10B', 'Find the translation vector', () => {
  const x = rnd(-6, 6), y = rnd(-6, 6), a = nz(-6, 6), b = nz(-6, 6);
  return { type: 'coord', q: 'A translation moves <b>' + ptStr([x, y]) + '</b> to <b>' + ptStr([x + a, y + b]) + '</b>. What is the vector? Write it like (a, b).', ans: [[a, b]], ansText: '(' + fmt(a) + ', ' + fmt(b) + ')',
    hint: 'Vector = image − original, for x and for y.', sol: ['a = ' + fmt(x + a) + ' − ' + (x < 0 ? '(' + fmt(x) + ')' : fmt(x)) + ' = ' + fmt(a) + ', b = ' + fmt(y + b) + ' − ' + (y < 0 ? '(' + fmt(y) + ')' : fmt(y)) + ' = ' + fmt(b) + '.', 'Vector <b>(' + fmt(a) + ', ' + fmt(b) + ')</b>: ' + vecWords(a, b) + '.'] };
});
gen('vectorWords', '10B', 'Describe a vector in words', () => {
  const a = nz(-6, 6), b = nz(-6, 6); const opts = shuffle([[a, b], [-a, b], [a, -b], [-a, -b]]); const i = opts.findIndex(o => o[0] === a && o[1] === b);
  return { type: 'mcq', q: 'A translation by the vector <b>(' + fmt(a) + ', ' + fmt(b) + ')</b> moves a shape…', choices: opts.map(o => vecWords(o[0], o[1])), ans: i, ansText: vecWords(a, b), sol: ['First number: positive = right, negative = left. Second number: positive = up, negative = down.'] };
});
gen('translateShape', '10B', 'Translate a triangle', () => {
  const nm = pick(TRI_NAMES), P = randTri(4), a = nz(-4, 4), b = nz(-4, 4); const R = P.map(p => [p[0] + a, p[1] + b]);
  return { type: 'coord', q: 'Triangle ' + nm.join('') + ' has ' + nm.map((n, i) => n + ptStr(P[i])).join(', ') + '. Translate it by <b>(' + fmt(a) + ', ' + fmt(b) + ')</b>. Write ' + nm.map(n => n + '′').join(', ') + ' in order.',
    ans: R, ansText: nm.map((n, i) => n + '′' + ptStr(R[i])).join(', '), hint: 'Add ' + fmt(a) + ' to every x and ' + fmt(b) + ' to every y.', sol: [nm.map((n, i) => n + ptStr(P[i]) + ' → ' + n + '′' + ptStr(R[i])).join('<br>'), gridSVG({ xmin: -9, xmax: 9, ymin: -9, ymax: 9, polys: [{ pts: P, labels: nm }, { pts: R, labels: nm.map(n => n + '′'), cls: 'b' }], size: 270 })] };
});

/* ---------- 10C rotation ---------- */
gen('rotatePt', '10C', 'Rotate a point about the origin', () => {
  const x = nz(-6, 6), y = nz(-6, 6), o = pick([[90, 'cw'], [90, 'acw'], [180, 'cw'], [270, 'cw'], [270, 'acw']]); const r = rotatePt([x, y], o[0], o[1]);
  const desc = o[0] + '° ' + (o[0] === 180 ? '' : o[1] === 'cw' ? 'clockwise ' : 'anticlockwise ') + 'about the origin';
  return { type: 'coord', q: 'Rotate <b>' + ptStr([x, y]) + '</b> ' + desc + '.', ans: [r], ansText: ptStr(r), hint: 'Sketch it, or use the rules: 90° clockwise (x, y) → (y, −x); 90° anticlockwise (x, y) → (−y, x); 180° (x, y) → (−x, −y).',
    sol: (o[0] === 270 ? ['270° ' + (o[1] === 'cw' ? 'clockwise' : 'anticlockwise') + ' is the same as 90° ' + (o[1] === 'cw' ? 'anticlockwise' : 'clockwise') + ' (270° + 90° = 360°, a full turn).'] : []).concat([rotRule(o[0], o[1]), ptStr([x, y]) + ' → <b>' + ptStr(r) + '</b>', gridSVG({ xmin: -7, xmax: 7, ymin: -7, ymax: 7, polys: [{ pts: [[0, 0], [x, y]], cls: '' }, { pts: [[0, 0], r], cls: 'b' }], points: [{ x, y, label: 'P' }, { x: r[0], y: r[1], label: 'P′', cls: 'b' }], size: 250 })]) };
});
gen('rotateShape', '10C', 'Rotate a triangle', () => {
  const nm = pick(TRI_NAMES), P = randTri(4), o = pick([[90, 'cw'], [90, 'acw'], [180, 'cw']]); const R = P.map(p => rotatePt(p, o[0], o[1]));
  const desc = o[0] + '° ' + (o[0] === 180 ? '' : o[1] === 'cw' ? 'clockwise ' : 'anticlockwise ') + 'about the origin';
  return { type: 'coord', q: 'Rotate triangle ' + nm.join('') + ' with ' + nm.map((n, i) => n + ptStr(P[i])).join(', ') + ' <b>' + desc + '</b>. Write ' + nm.map(n => n + '′').join(', ') + ' in order.', fig: gridSVG({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, polys: [{ pts: P, labels: nm }], size: 240 }),
    ans: R, ansText: nm.map((n, i) => n + '′' + ptStr(R[i])).join(', '), hint: rotRule(o[0], o[1]), sol: [rotRule(o[0], o[1]), nm.map((n, i) => n + ptStr(P[i]) + ' → ' + n + '′' + ptStr(R[i])).join('<br>'), gridSVG({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, polys: [{ pts: P, labels: nm }, { pts: R, labels: nm.map(n => n + '′'), cls: 'b' }], size: 240 })] };
});
gen('transFacts', '10C', 'Transformation facts', () => {
  const k = rnd(0, 3), x = rnd(-7, 7) || 3, y = rnd(-7, 7) || -2; const P = (a, b) => '(' + fmt(a) + ', ' + fmt(b) + ')';
  const cands = [P(-x, y), P(x, -y), P(-x, -y), P(y, x), P(-y, x), P(y, -x), P(-y, -x)];
  if (k === 0) {
    const t = pick([['reflect it in the x-axis', P(x, -y), 'Reflecting in the x-axis: (x, y) → (x, −y). x stays the same and y changes sign.'], ['reflect it in the y-axis', P(-x, y), 'Reflecting in the y-axis: (x, y) → (−x, y). x changes sign and y stays the same.'], ['rotate it 180° about the origin', P(-x, -y), 'Rotating 180° about the origin: (x, y) → (−x, −y). Both coordinates change sign.'], ['rotate it 90° clockwise about the origin', P(y, -x), 'Rotating 90° clockwise about the origin: (x, y) → (y, −x). Swap them, then change the sign of the new y.'], ['rotate it 90° anticlockwise about the origin', P(-y, x), 'Rotating 90° anticlockwise about the origin: (x, y) → (−y, x). Swap them, then change the sign of the new x.'], ['reflect it in the line y = x', P(y, x), 'Reflecting in the line y = x: (x, y) → (y, x). The coordinates swap.']]);
    return mcq4('Start with the point <b>' + P(x, y) + '</b> and ' + t[0] + '. Where does it end up?', t[1], cands, [t[2], P(x, y) + ' → <b>' + t[1] + '</b>'], 'Sketch it on a grid if you’re not sure.');
  }
  if (k === 1) {
    const a = rnd(-6, 6), b = rnd(-6, 6); const r = P(x + a, y + b);
    return mcq4('Translate <b>' + P(x, y) + '</b> by the vector <b>' + P(a, b) + '</b>. Where does it end up?', r, [P(x - a, y - b), P(x + b, y + a), P(x + a, y - b), P(x - a, y + b), P(a, b)],
      'Add the vector: (' + fmt(x) + ' + ' + br(a) + ', ' + fmt(y) + ' + ' + br(b) + ') = <b>' + r + '</b>.', 'The first number moves left/right, the second moves up/down.');
  }
  if (k === 2) {
    const ang = pick([90, 180, 270]), dir = pick(['clockwise', 'anticlockwise']); const other = dir === 'clockwise' ? 'anticlockwise' : 'clockwise';
    const right = ang === 180 ? '180° ' + other : (360 - ang) + '° ' + other;
    return mcq4('A rotation of <b>' + ang + '° ' + dir + '</b> about a point ends in the same place as…', right, [ang + '° ' + other, (360 - ang) + '° ' + dir, (ang === 180 ? 90 : 180) + '° ' + other, (ang + 90) + '° ' + dir].filter(o => o !== right),
      'Turning ' + ang + '° one way ends in the same place as turning ' + (360 - ang) + '° the other way (they add to 360°).', 'The two turns add to a full turn.');
  }
  return mcq4(pick(['Which transformation always gives a mirror image of the shape?', 'After which transformation is the image facing the opposite way (back to front)?']), 'Reflection', ['Rotation', 'Translation', 'Enlargement', 'Rotation of 180°'],
    'A reflection reverses the orientation (it is a mirror image). Rotations and translations keep it facing the same way; all three keep the size, so the image is congruent.', 'Which one flips it over?');
});
/* ---------- 10D congruent figures ---------- */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
function triNames() { const l = shuffle(LETTERS).slice(0, 6); return [l.slice(0, 3), l.slice(3, 6)]; }
gen('corrParts', '10D', 'Corresponding sides and angles', () => {
  const [A, B] = triNames(); const st = '△' + A.join('') + ' ≅ △' + B.join('');
  if (Math.random() < 0.5) { const i = rnd(0, 2), j = (i + 1) % 3; const s1 = A[i] + A[j], s2 = B[i] + B[j];
    return { type: 'text', q: '<b>' + st + '</b>. Which side corresponds to <b>' + s1 + '</b>?', ans: s2, accept: [s2, B[j] + B[i]], ansText: s2, hint: 'The letters are listed in matching order: ' + A.map((a, k) => a + '↔' + B[k]).join(', ') + '.', sol: ['Matching order: ' + A.map((a, k) => a + ' ↔ ' + B[k]).join(', ') + '.', s1 + ' ↔ <b>' + s2 + '</b>'] }; }
  const i = rnd(0, 2);
  return { type: 'text', q: '<b>' + st + '</b>. Which angle corresponds to <b>∠' + A[i] + '</b>?', ans: B[i], accept: [B[i], B[(i + 2) % 3] + B[i] + B[(i + 1) % 3], B[(i + 1) % 3] + B[i] + B[(i + 2) % 3]], ansText: '∠' + B[i], hint: 'Match the letters in order.', sol: ['Matching order: ' + A.map((a, k) => a + ' ↔ ' + B[k]).join(', ') + '.', '∠' + A[i] + ' ↔ <b>∠' + B[i] + '</b>'] };
});
gen('congFind', '10D', 'Unknown side or angle in congruent triangles', () => {
  const [A, B] = triNames(); const s = [rnd(5, 15), rnd(5, 15)]; const a1 = rnd(35, 80), a2 = rnd(35, 80); const a3 = 180 - a1 - a2; if (a3 < 20) return G.congFind.fn();
  const st = '△' + A.join('') + ' ≅ △' + B.join(''); const given = A[0] + A[1] + ' = ' + s[0] + ' cm, ' + A[1] + A[2] + ' = ' + s[1] + ' cm, ∠' + A[0] + ' = ' + a1 + '° and ∠' + A[1] + ' = ' + a2 + '°';
  const qs = [['the length of ' + B[0] + B[1], s[0], ' cm', B[0] + B[1] + ' matches ' + A[0] + A[1] + ' = ' + s[0] + ' cm.'], ['the length of ' + B[1] + B[2], s[1], ' cm', B[1] + B[2] + ' matches ' + A[1] + A[2] + ' = ' + s[1] + ' cm.'], ['the size of ∠' + B[1], a2, '°', '∠' + B[1] + ' matches ∠' + A[1] + ' = ' + a2 + '°.'], ['the size of ∠' + B[2], a3, '°', '∠' + B[2] + ' matches ∠' + A[2] + ' = 180° − ' + a1 + '° − ' + a2 + '° = ' + a3 + '° (angle sum of a triangle).']];
  const k = pick(qs);
  return { type: 'num', q: '<b>' + st + '</b> with ' + given + '. Find ' + k[0] + '.', ans: k[1], ansText: k[1] + k[2], hint: 'Match the vertices in order, then use the angle sum of 180° if needed.', sol: ['Matching order: ' + A.map((a, i) => a + ' ↔ ' + B[i]).join(', ') + '.', k[3]] };
});
gen('congConcept', '10D', 'Congruence facts', () => {
  const [T1, T2] = pick(TRIS); const i = rnd(0, 2), j = (i + rnd(1, 2)) % 3;
  if (Math.random() < 0.65) {
    if (Math.random() < 0.5) {
      const right = '∠' + T2[i]; return mcq4('If <b>△' + T1 + ' ≅ △' + T2 + '</b>, then ∠' + T1[i] + ' equals…', right, ['∠' + T2[(i + 1) % 3], '∠' + T2[(i + 2) % 3], '∠' + T1[(i + 1) % 3], 'You can’t tell'],
        'The letters are in matching order: ' + T1[0] + '↔' + T2[0] + ', ' + T1[1] + '↔' + T2[1] + ', ' + T1[2] + '↔' + T2[2] + '. So ∠' + T1[i] + ' = <b>' + right + '</b>.', 'Match the letters in the same positions.');
    }
    const s1 = T1[i] + T1[j], right = T2[i] + T2[j];
    return mcq4('If <b>△' + T1 + ' ≅ △' + T2 + '</b>, which side equals <b>' + s1 + '</b>?', right, [T2[i] + T2[3 - i - j], T2[j] + T2[3 - i - j], T1[i] + T1[3 - i - j], T2[(i + 1) % 3] + T2[(j + 1) % 3]].filter(x => x !== right && x.split('').sort().join('') !== right.split('').sort().join('')),
      'Match position by position: ' + T1[i] + '↔' + T2[i] + ' and ' + T1[j] + '↔' + T2[j] + ', so ' + s1 + ' = <b>' + right + '</b>.', 'Which letters sit in the same positions?');
  }
  return mcq4(pick(['Congruent figures have…', 'Two shapes are congruent if they have…']), 'the same shape and the same size', ['the same shape but can be different sizes', 'the same area', 'the same perimeter', 'the same angles'],
    'Congruent (≅) means identical in shape and size: one fits exactly on top of the other (it may need turning or flipping). Same angles only means similar.', 'Could one be placed exactly on top of the other?');
});
/* ---------- 10E congruent triangles ---------- */
const CONG_TESTS = ['SSS', 'SAS', 'AAS', 'RHS', 'Not enough information'];
gen('congTest', '10E', 'Which congruence test?', () => {
  const k = rnd(0, 5); const s = () => rnd(4, 15); let d, ans, why;
  if (k === 0) { const a = s(), b = s(), c = Math.min(a + b - 1, s() + 3); d = 'Both triangles have sides ' + a + ' cm, ' + b + ' cm and ' + c + ' cm.'; ans = 0; why = 'All three pairs of sides are equal: SSS.'; }
  else if (k === 1) { d = 'Both triangles have sides ' + s() + ' cm and ' + s() + ' cm with an angle of ' + rnd(30, 110) + '° <b>between</b> them.'; ans = 1; why = 'Two sides and the included angle (the angle between them): SAS.'; }
  else if (k === 2) { const x = rnd(30, 70), y = rnd(30, 70); d = 'Both triangles have angles of ' + x + '° and ' + y + '°, and a side of ' + s() + ' cm opposite the ' + y + '° angle.'; ans = 2; why = 'Two angles and a matching side: AAS.'; }
  else if (k === 3) { const t = pick([[5, 13], [8, 17], [6, 10], [9, 15], [7, 25]]); d = 'Both triangles have a right angle, a hypotenuse of ' + t[1] + ' cm and another side of ' + t[0] + ' cm.'; ans = 3; why = 'Right angle, hypotenuse and one other side: RHS.'; }
  else if (k === 4) { const x = rnd(30, 80), y = rnd(30, 70); d = 'Both triangles have angles of ' + x + '°, ' + y + '° and ' + (180 - x - y) + '°.'; ans = 4; why = 'Equal angles (AAA) only show the triangles are <b>similar</b> (same shape). They could be different sizes.'; }
  else { d = 'Both triangles have sides of ' + s() + ' cm and ' + s() + ' cm, and a ' + rnd(25, 50) + '° angle that is <b>not</b> between those two sides.'; ans = 4; why = 'Two sides and a non-included angle (SSA) is not a congruence test: two different triangles can be drawn.'; }
  return { type: 'mcq', q: 'Which test proves the triangles are congruent? ' + d, choices: CONG_TESTS, ans, ansText: CONG_TESTS[ans], hint: 'SSS · SAS (angle between the sides) · AAS · RHS (right angle + hypotenuse). AAA and SSA are not tests.', sol: [why] };
});
gen('congTestNamed', '10E', 'Congruence test with named triangles', () => {
  const [A, B] = triNames(); const k = rnd(0, 3); const a = rnd(4, 12), b = rnd(4, 12), c = rnd(4, 12), ang = rnd(35, 100), ang2 = rnd(30, 60);
  const opts = [
    [A[0] + A[1] + ' = ' + B[0] + B[1] + ' = ' + a + ' cm, ' + A[1] + A[2] + ' = ' + B[1] + B[2] + ' = ' + b + ' cm, ' + A[0] + A[2] + ' = ' + B[0] + B[2] + ' = ' + Math.min(a + b - 1, c + 2) + ' cm', 0],
    [A[0] + A[1] + ' = ' + B[0] + B[1] + ' = ' + a + ' cm, ∠' + A[1] + ' = ∠' + B[1] + ' = ' + ang + '°, ' + A[1] + A[2] + ' = ' + B[1] + B[2] + ' = ' + b + ' cm', 1],
    ['∠' + A[0] + ' = ∠' + B[0] + ' = ' + ang2 + '°, ∠' + A[1] + ' = ∠' + B[1] + ' = ' + (ang2 + 20) + '°, ' + A[1] + A[2] + ' = ' + B[1] + B[2] + ' = ' + b + ' cm', 2],
    ['∠' + A[2] + ' = ∠' + B[2] + ' = 90°, hypotenuse ' + A[0] + A[1] + ' = ' + B[0] + B[1] + ' = 13 cm, ' + A[1] + A[2] + ' = ' + B[1] + B[2] + ' = 5 cm', 3]
  ];
  const o = opts[k];
  return { type: 'mcq', q: 'In △' + A.join('') + ' and △' + B.join('') + ': ' + o[0] + '. Which test shows △' + A.join('') + ' ≅ △' + B.join('') + '?', choices: CONG_TESTS, ans: o[1], ansText: CONG_TESTS[o[1]], sol: ['The given equal parts are ' + ['three pairs of sides', 'two sides with the angle between them', 'two angles and a corresponding side', 'a right angle, the hypotenuse and one other side'][k] + ', so the test is <b>' + CONG_TESTS[o[1]] + '</b>.'] };
});

/* ---------- 10G quadrilaterals ---------- */
gen('quadAngles', '10G', 'Angles and sides in special quadrilaterals', () => {
  const k = rnd(0, 6);
  if (k === 0) { const p = rnd(50, 130); const w = pick(['Q', 'R']); const v = w === 'Q' ? 180 - p : p;
    return { type: 'num', q: 'In parallelogram PQRS, ∠P = ' + p + '°. Find ∠' + w + '.', ans: v, ansText: v + '°', sol: [w === 'Q' ? '∠P and ∠Q are co-interior angles between parallel sides, so they add to 180°: ∠Q = 180° − ' + p + '° = ' + v + '°.' : 'Opposite angles of a parallelogram are equal: ∠R = ∠P = ' + p + '°.'] }; }
  if (k === 1) { const s = rnd(4, 15); return { type: 'num', q: 'A rhombus has a perimeter of ' + 4 * s + ' cm. How long is one side?', ans: s, ansText: s + ' cm', sol: ['All four sides of a rhombus are equal: ' + 4 * s + ' ÷ 4 = ' + s + ' cm.'] }; }
  if (k === 2) { const a = rnd(90, 130), b = rnd(40, 80); if ((360 - a - b) % 2) return G.quadAngles.fn(); const v = (360 - a - b) / 2;
    return { type: 'num', q: 'A kite has angles of ' + a + '° and ' + b + '° at the ends of its line of symmetry. The other two angles are equal. Find one of them.', ans: v, ansText: v + '° each', sol: ['Angles in a quadrilateral add to 360°. The other two angles are equal: (360 − ' + a + ' − ' + b + ') ÷ 2 = ' + v + '°.'] }; }
  if (k === 3) { const a = rnd(55, 125); return { type: 'num', q: 'In trapezium ABCD, AB ∥ DC and ∠A = ' + a + '°. Find ∠D.', ans: 180 - a, ansText: (180 - a) + '°', sol: ['∠A and ∠D are co-interior angles between the parallel sides AB and DC, so they add to 180°: 180 − ' + a + ' = ' + (180 - a) + '°.'] }; }
  if (k === 4) { const d = rnd(6, 25); return { type: 'num', q: 'A rectangle has one diagonal of ' + d + ' cm. How long is the other diagonal?', ans: d, ansText: d + ' cm', sol: ['The diagonals of a rectangle are equal in length, so it is also ' + d + ' cm.'] }; }
  if (k === 5) { const b = rnd(50, 130); if (b % 2) return G.quadAngles.fn(); const w = pick(['BAD', 'BAC']); const v = w === 'BAD' ? 180 - b : (180 - b) / 2;
    return { type: 'num', q: 'In rhombus ABCD, ∠ABC = ' + b + '°. Find ∠' + w + (w === 'BAC' ? ' (the diagonal AC bisects ∠BAD)' : '') + '.', ans: v, ansText: v + '°', sol: ['∠BAD = 180° − ' + b + '° = ' + (180 - b) + '° (co-interior angles, AD ∥ BC).', w === 'BAC' ? 'AC bisects ∠BAD, so ∠BAC = ' + (180 - b) + ' ÷ 2 = ' + v + '°.' : ''] }; }
  const x = rnd(10, 30), a1 = rnd(2, 4), b1 = rnd(5, 20); const b2 = b1 + x; const ang = a1 * x + b1; if (ang >= 170) return G.quadAngles.fn();
  return { type: 'num', q: 'Opposite angles of a parallelogram are (' + a1 + 'x + ' + b1 + ')° and (' + (a1 - 1 === 1 ? '' : a1 - 1) + 'x + ' + b2 + ')°. Find x.', ans: x, ansText: 'x = ' + x, sol: ['Opposite angles are equal.'].concat(solveRel(a1 + 'x + ' + b1 + ' = ' + (a1 - 1 === 1 ? '' : a1 - 1) + 'x + ' + b2).steps) };
});
// properties of the special quadrilaterals: [statement, list of shapes it is always true for]
const QPROP = [
  ['both pairs of opposite sides are parallel', ['Parallelogram', 'Rectangle', 'Rhombus', 'Square']],
  ['exactly one pair of opposite sides is parallel', ['Trapezium']],
  ['all four sides are equal', ['Rhombus', 'Square']],
  ['all four angles are 90°', ['Rectangle', 'Square']],
  ['the diagonals are equal in length', ['Rectangle', 'Square']],
  ['the diagonals cross at right angles', ['Rhombus', 'Square', 'Kite']],
  ['the diagonals bisect each other', ['Parallelogram', 'Rectangle', 'Rhombus', 'Square']],
  ['opposite angles are equal', ['Parallelogram', 'Rectangle', 'Rhombus', 'Square']],
  ['two pairs of equal sides are next to each other', ['Kite', 'Rhombus', 'Square']],
  ['opposite sides are equal', ['Parallelogram', 'Rectangle', 'Rhombus', 'Square']],
  ['the diagonals bisect the angles at the corners', ['Rhombus', 'Square']],
  ['it has exactly one line of symmetry', ['Kite']]
];
const QSHAPES = ['Parallelogram', 'Rectangle', 'Rhombus', 'Square', 'Kite', 'Trapezium'];
gen('quadFacts', '10G', 'Which quadrilateral?', () => {
  if (Math.random() < 0.5) {
    const sh = pick(QSHAPES.filter(x => x !== 'Trapezium' || Math.random() < 0.5)); const tru = QPROP.filter(pr => pr[1].includes(sh)), fal = QPROP.filter(pr => !pr[1].includes(sh));
    if (tru.length && fal.length >= 3) { const r = pick(tru)[0]; return mcq4('Which of these is true for <b>every ' + sh.toLowerCase() + '</b>?', cap(r), fal.map(f => cap(f[0])), 'For a ' + sh.toLowerCase() + ': ' + tru.map(t => t[0]).join('; ') + '.', 'Picture a ' + sh.toLowerCase() + ' that is as “unusual” as possible.'); }
  }
  for (let t = 0; t < 30; t++) {
    const props = shuffle(QPROP).slice(0, 2); const fits = QSHAPES.filter(x => props.every(p => p[1].includes(x)));
    if (fits.length !== 1) continue; const right = fits[0];
    return mcq4('Which quadrilateral is this? <i>' + cap(props[0][0]) + ', and ' + props[1][0] + '.</i>', right, QSHAPES.filter(x => x !== right).sort((a, b) => props.filter(p => p[1].includes(b)).length - props.filter(p => p[1].includes(a)).length),
      'Only a <b>' + right.toLowerCase() + '</b> always has both of these properties.', 'Which shapes have the first property? Which of those also have the second?');
  }
  return mcq4('Which quadrilateral has exactly one pair of parallel sides?', 'Trapezium', ['Parallelogram', 'Kite', 'Rhombus'], 'A trapezium has exactly one pair of parallel sides.');
});
gen('quadProof', '10G', 'Proving properties with congruent triangles', () => {
  const L = pick(QUADS).split(''); const [A, B, C, D] = L; const T = ['SSS', 'SAS', 'AAS', 'RHS', 'Not enough information'];
  const bank = [
    ['The diagonal ' + A + C + ' of parallelogram ' + L.join('') + ' makes two triangles. Which test proves △' + A + B + C + ' ≅ △' + C + D + A + '?', 'AAS', 'Alternate angles: ∠' + B + A + C + ' = ∠' + D + C + A + ' and ∠' + B + C + A + ' = ∠' + D + A + C + ' (parallel sides), and ' + A + C + ' is common: AAS. So opposite sides are equal.'],
    ['Kite ' + L.join('') + ' has ' + A + B + ' = ' + A + D + ' and ' + B + C + ' = ' + D + C + '. Which test proves △' + A + B + C + ' ≅ △' + A + D + C + '?', 'SSS', A + B + ' = ' + A + D + ', ' + B + C + ' = ' + D + C + ' and ' + A + C + ' is common: SSS.'],
    ['In rhombus ' + L.join('') + ', the diagonal ' + B + D + ' makes △' + A + B + D + ' and △' + C + B + D + '. Which test proves they are congruent?', 'SSS', 'All sides of a rhombus are equal and ' + B + D + ' is common: SSS.'],
    ['Rectangle ' + L.join('') + '. Which test proves △' + A + B + C + ' ≅ △' + B + A + D + ' (to show the diagonals ' + A + C + ' and ' + B + D + ' are equal)?', 'SAS', A + B + ' is common, ' + B + C + ' = ' + A + D + ' (opposite sides), and the 90° angles at ' + B + ' and ' + A + ' are between them: SAS.'],
    ['In kite ' + L.join('') + ' (' + A + B + ' = ' + A + D + ') the diagonals meet at right angles at M. Which test proves △' + A + B + 'M ≅ △' + A + D + 'M?', 'RHS', 'Right angle at M, hypotenuse ' + A + B + ' = ' + A + D + ', and ' + A + 'M is common: RHS.'],
    ['In quadrilateral ' + L.join('') + ' you only know ' + A + B + ' = ' + C + D + '. Can you prove △' + A + B + C + ' ≅ △' + C + D + A + '?', 'Not enough information', 'One pair of equal sides plus the common side ' + A + C + ' is only two sides: you need a third side or the angle between them.']
  ];
  const [q, a, ex] = pick(bank); return { type: 'mcq', q, choices: T, ans: T.indexOf(a), ansText: a, sol: [ex], hint: 'List what is equal: sides (S), angles (A), right angle + hypotenuse (RH). Is there a common side?' };
});
gen('kiteTF', '10G', 'True or false: quadrilateral facts', () => {
  const pr = pick(QPROP), sh = pick(QSHAPES), t = pr[1].includes(sh);
  return { type: 'mcq', q: 'True or false? In every <b>' + sh.toLowerCase() + '</b>, ' + pr[0] + '.', choices: ['True', 'False'], ans: t ? 0 : 1, ansText: t ? 'True' : 'False',
    hint: 'Picture the most “stretched” version of the shape you can.', sol: [(t ? 'True.' : 'False.') + ' This is always true for: ' + pr[1].map(x => x.toLowerCase()).join(', ') + '.'] };
});
/* ---------- 10H / 10I similarity ---------- */
const KS = [1.5, 2, 2.5, 3, 4, 0.5, 1.25, 0.75];
gen('scaleFactor', '10H', 'Find the scale factor', () => {
  const k = pick(KS), a = pick([4, 6, 8, 10, 12, 16, 20]); const b = a * k;
  return { type: 'num', q: 'Two figures are similar. A side of ' + a + ' cm in the original matches a side of ' + fmt(b) + ' cm in the image. Find the scale factor (original → image).', ans: k, ansText: fmt(k), hint: 'Scale factor = image length ÷ original length.', sol: ['k = ' + fmt(b) + ' ÷ ' + a + ' = <b>' + fmt(k) + '</b>' + (k > 1 ? ' (an enlargement)' : ' (a reduction)') + '.'] };
});
gen('similarSide', '10H', 'Unknown side using the scale factor', () => {
  const k = pick(KS), a = pick([4, 6, 8, 10, 12]), c = pick([3, 5, 6, 7, 9, 14]); const s = pick(['rectangle', 'triangle', 'pentagon']);
  if (Math.random() < 0.5) return { type: 'num', q: 'Two ' + s + 's are similar. In the small one, two sides are ' + a + ' cm and ' + c + ' cm. The matching side to ' + a + ' cm in the other ' + s + ' is ' + fmt(a * k) + ' cm. Find the side matching ' + c + ' cm.', ans: c * k, ansText: fmt(c * k) + ' cm', sol: ['k = ' + fmt(a * k) + ' ÷ ' + a + ' = ' + fmt(k) + '.', 'Missing side = ' + c + ' × ' + fmt(k) + ' = <b>' + fmt(c * k) + ' cm</b>.'] };
  return { type: 'num', q: 'Shape B is an enlargement of shape A with scale factor ' + fmt(k) + '. A side of shape B is ' + fmt(c * k) + ' cm. How long is the matching side of shape A?', ans: c, ansText: c + ' cm', sol: ['Going from B back to A, divide by the scale factor: ' + fmt(c * k) + ' ÷ ' + fmt(k) + ' = <b>' + c + ' cm</b>.'] };
});
gen('similarCheck', '10H', 'Are the figures similar?', () => {
  const a = rnd(2, 8), b = rnd(3, 10); const k = pick([1.5, 2, 3, 2.5]); const yes = Math.random() < 0.5; const c = a * k, d = yes ? b * k : b * k + pick([1, 2, -1]);
  return { type: 'mcq', q: 'Rectangle A is ' + a + ' cm by ' + b + ' cm. Rectangle B is ' + fmt(c) + ' cm by ' + fmt(d) + ' cm. Are they similar?', choices: ['Yes', 'No'], ans: yes ? 0 : 1, ansText: yes ? 'Yes' : 'No',
    sol: ['Compare matching sides: ' + fmt(c) + ' ÷ ' + a + ' ' + (Number.isInteger(c / a * 1000) ? '=' : '≈') + ' ' + fmt(c / a, 3) + ' and ' + fmt(d) + ' ÷ ' + b + ' ' + (Number.isInteger(d / b * 1000) ? '=' : '≈') + ' ' + fmt(d / b, 3) + '.', yes ? 'The ratios are equal, so the rectangles are similar.' : 'The ratios are different, so they are not similar.'] };
});
gen('shadow', '10I', 'Shadows and heights', () => {
  const k = pick([1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12.5]), h = pick([1.2, 1.5, 1.6, 1.8, 2, 3, 4.5]), s = pick([1.2, 1.5, 2, 2.4, 3, 4]); const S = s * k;
  const it = pick(['tree', 'building', 'flagpole', 'tower']);
  return { type: 'num', q: 'A ' + fmt(h) + ' m post casts a shadow ' + fmt(s) + ' m long. At the same time a ' + it + ' casts a shadow ' + fmt(S) + ' m long. How tall is the ' + it + '?', ans: r2(h * k, 4), ansText: fmt(h * k, 2) + ' m',
    hint: 'The object and its shadow form similar right-angled triangles. Find the scale factor from the shadows.', sol: ['Scale factor = ' + fmt(S) + ' ÷ ' + fmt(s) + ' = ' + fmt(k) + '.', 'Height = ' + fmt(h) + ' × ' + fmt(k) + ' = <b>' + fmt(h * k, 2) + ' m</b>.'] };
});
gen('parallelTri', '10I', 'Overlapping similar triangles (DE ∥ BC)', () => {
  const k = pick([2, 2.5, 3, 1.5, 4]), AD = pick([2, 3, 4, 6]), AE = pick([3, 4, 5, 8]), DE = pick([4, 5, 6]);
  const ask = rnd(0, 2); const BC = DE * k, AB = AD * k, AC = AE * k;
  const lbl = { AD, AE, DE, BC: fmt(BC) };
  if (ask === 0) { lbl.DB = 'x'; return { type: 'num', q: 'DE ∥ BC. Find x (lengths in cm).', fig: parallelTriSVG(lbl), ans: AB - AD, ansText: 'x = ' + fmt(AB - AD), hint: 'Use whole sides: △ADE ~ △ABC. AB = AD + DB.', sol: ['∠A is common and ∠ADE = ∠ABC (corresponding angles, DE ∥ BC), so △ADE ~ △ABC.', 'k = BC ÷ DE = ' + fmt(BC) + ' ÷ ' + DE + ' = ' + fmt(k) + '.', 'AB = ' + AD + ' × ' + fmt(k) + ' = ' + fmt(AB) + ', so x = ' + fmt(AB) + ' − ' + AD + ' = <b>' + fmt(AB - AD) + '</b>.'] }; }
  if (ask === 1) { lbl.EC = 'y'; return { type: 'num', q: 'DE ∥ BC. Find y (lengths in cm).', fig: parallelTriSVG(lbl), ans: AC - AE, ansText: 'y = ' + fmt(AC - AE), sol: ['△ADE ~ △ABC (AA).', 'k = ' + fmt(BC) + ' ÷ ' + DE + ' = ' + fmt(k) + '.', 'AC = ' + AE + ' × ' + fmt(k) + ' = ' + fmt(AC) + ', so y = ' + fmt(AC) + ' − ' + AE + ' = <b>' + fmt(AC - AE) + '</b>.'] }; }
  return { type: 'num', q: 'DE ∥ BC. Find the scale factor from △ADE to △ABC.', fig: parallelTriSVG(lbl), ans: k, ansText: fmt(k), sol: ['k = BC ÷ DE = ' + fmt(BC) + ' ÷ ' + DE + ' = <b>' + fmt(k) + '</b>.'] };
});
gen('hourglass', '10I', 'Crossing (hourglass) triangles', () => {
  const k = pick([1.5, 2, 2.5, 3]), AB = pick([4, 6, 8]), AE = pick([3, 4, 5]), BE = pick([4, 5, 6]);
  const ask = Math.random() < 0.5; const v = ask ? AE * k : BE * k;
  return { type: 'num', q: 'AC and BD cross at E, and AB ∥ DC. AB = ' + AB + ' cm, DC = ' + fmt(AB * k) + ' cm, AE = ' + AE + ' cm and BE = ' + BE + ' cm. Find ' + (ask ? 'CE' : 'DE') + '.', ans: v, ansText: fmt(v) + ' cm',
    sol: ['∠AEB = ∠CED (vertically opposite) and ∠BAE = ∠DCE (alternate angles, AB ∥ DC), so △ABE ~ △CDE.', 'k = DC ÷ AB = ' + fmt(AB * k) + ' ÷ ' + AB + ' = ' + fmt(k) + '.', (ask ? 'CE matches AE: ' + AE : 'DE matches BE: ' + BE) + ' × ' + fmt(k) + ' = <b>' + fmt(v) + ' cm</b>.'] };
});
gen('simTest', '10I', 'Which similarity test?', () => {
  const k = rnd(0, 4); let d, a; const T = ['AAA', 'SSS', 'SAS', 'RHS', 'Not similar'];
  if (k === 0) { const x = rnd(30, 70), y = rnd(30, 70); d = 'Triangle 1 has angles ' + x + '° and ' + y + '°. Triangle 2 has angles ' + y + '° and ' + (180 - x - y) + '°.'; a = 0; }
  else if (k === 1) { const s = [rnd(3, 6), rnd(4, 8), rnd(6, 9)], f = pick([1.5, 2, 3]); d = 'Triangle 1 has sides ' + s.join(', ') + ' cm. Triangle 2 has sides ' + s.map(v => fmt(v * f)).join(', ') + ' cm.'; a = 1; }
  else if (k === 2) { const s = [rnd(3, 7), rnd(4, 9)], f = pick([2, 2.5, 3]), g = rnd(40, 100); d = 'Triangle 1 has sides ' + s[0] + ' cm and ' + s[1] + ' cm with a ' + g + '° angle between them. Triangle 2 has sides ' + fmt(s[0] * f) + ' cm and ' + fmt(s[1] * f) + ' cm with a ' + g + '° angle between them.'; a = 2; }
  else if (k === 3) { const f = pick([2, 3]); d = 'Both are right-angled. Triangle 1 has hypotenuse 10 cm and a side 6 cm. Triangle 2 has hypotenuse ' + 10 * f + ' cm and a side ' + 6 * f + ' cm.'; a = 3; }
  else { const x = rnd(30, 60); d = 'Triangle 1 has angles ' + x + '° and 75°. Triangle 2 has angles ' + x + '° and 65°.'; a = 4; }
  return { type: 'mcq', q: d + ' Which test shows they are similar?', choices: T, ans: a, ansText: T[a], sol: [a === 4 ? 'The third angles are ' + (180 - 75 - +d.match(/\d+/)[0]) + '° and ' + (180 - 65 - +d.match(/\d+/)[0]) + '°, so the angles are not all equal: not similar.' : 'Equal angles → AAA; all sides in the same ratio → SSS; two sides in the same ratio with equal included angles → SAS; right angle with hypotenuse and one side in the same ratio → RHS.'] };
});

/* ---------- 3D coordinates ---------- */
gen('boxCorner', 'XYZ', 'Coordinates of a box corner', () => {
  const L = rnd(1, 4), W = rnd(2, 5), H = rnd(1, 4); const V = { A: [L, 0, 0], B: [L, W, 0], C: [0, W, 0], D: [0, 0, H], E: [L, 0, H], F: [L, W, H], G: [0, W, H] }; const k = pick(Object.keys(V));
  return { type: 'coord', q: 'The box has one corner at O(0, 0, 0). It is ' + L + ' long in the x direction, ' + W + ' in the y direction and ' + H + ' high (z). Write the coordinates of <b>' + k + '</b>.', fig: boxSVG(L, W, H), ans: [V[k]], ansText: k + ptStr(V[k]),
    hint: 'Write (x, y, z): how far along x, then along y, then up.', sol: [k + ' is ' + V[k][0] + ' along x, ' + V[k][1] + ' along y and ' + V[k][2] + ' up, so <b>' + k + ptStr(V[k]) + '</b>.', boxSVG(L, W, H, true, V)] };
});
gen('axisPlane', 'XYZ', 'Where is the point in 3D?', () => {
  const opts = ['on the x-axis', 'on the y-axis', 'on the z-axis', 'on the floor (xy-plane), not on an axis', 'not on an axis or the floor'];
  const k = rnd(0, 4); const a = nz(1, 8), b = nz(1, 8), c = nz(1, 8); const p = [[a, 0, 0], [0, b, 0], [0, 0, c], [a, b, 0], [a, b, c]][k];
  return { type: 'mcq', q: 'Where is the point <b>' + ptStr(p) + '</b>?', choices: opts, ans: k, ansText: opts[k], sol: ['A point on an axis has the other two coordinates equal to 0. A point on the floor has z = 0.'] };
});
gen('move3d', 'XYZ', 'Moving in 3D', () => {
  const p = [rnd(0, 6), rnd(0, 6), rnd(1, 5)], d = pick([['rises', 2, 1], ['drops', 2, -1], ['moves along the x-axis by', 0, 1], ['moves along the y-axis by', 1, 1]]), n = rnd(1, 4); const q = p.slice(); q[d[1]] += d[2] * n; if (q[2] < 0) return G.move3d.fn();
  return { type: 'coord', q: 'A drone is at ' + ptStr(p) + '. It ' + d[0] + ' ' + n + ' unit' + (n > 1 ? 's' : '') + (d[1] === 2 ? ' straight ' + (d[2] > 0 ? 'up' : 'down') : '') + '. What are its new coordinates?', ans: [q], ansText: ptStr(q), sol: ['Only the ' + 'xyz'[d[1]] + '-coordinate changes: <b>' + ptStr(q) + '</b>.'] };
});

/* ---------- 3F decimals ---------- */
gen('fracDecT', '3F', 'Fraction to terminating decimal', () => {
  const d = pick([2, 4, 5, 8, 10, 16, 20, 25, 40, 50]); let n = rnd(1, d * 2 - 1); if (gcd(n, d) !== 1 || n === d) return G.fracDecT.fn();
  const ld = longDiv(n, d);
  return { type: 'num', q: 'Write <b>' + n + '/' + d + '</b> as a decimal.', ans: n / d, tol: 1e-9, ansText: decLong(ld), hint: 'Divide the numerator by the denominator, or make the denominator 10, 100 or 1000.', sol: [n + ' ÷ ' + d + ' = <b>' + decLong(ld) + '</b>', 'It terminates because ' + d + ' = ' + primeFactors(d).join(' × ') + ' (only 2s and 5s).'] };
});
gen('fracDecR', '3F', 'Fraction to recurring decimal (rounded)', () => {
  const d = pick([3, 6, 7, 9, 11, 12, 15, 13]); const n = rnd(1, d - 1); if (gcd(n, d) !== 1) return G.fracDecR.fn(); const dp = pick([1, 2, 3]);
  const ld = longDiv(n, d); const ans = r2(n / d, dp);
  return { type: 'num', q: 'Write <b>' + n + '/' + d + '</b> as a decimal, rounded to <b>' + dp + ' decimal place' + (dp > 1 ? 's' : '') + '</b>.', ans, tol: 1e-9, ansText: ans.toFixed(dp),
    hint: 'Divide to get a few more digits than you need, then look at the next digit to round.', sol: [n + ' ÷ ' + d + ' = ' + decLong(ld) + ' = ' + decHTML(ld) + ' (recurring)', 'The digit after the ' + dp + (dp === 1 ? 'st' : dp === 2 ? 'nd' : 'rd') + ' decimal place is ' + decLong(ld, 6).replace('…', '').split('.')[1][dp] + ', so round ' + (+decLong(ld, 6).replace('…', '').split('.')[1][dp] >= 5 ? 'up' : 'down') + ': <b>' + ans.toFixed(dp) + '</b>'] };
});
gen('termOrRec', '3F', 'Terminating or recurring?', () => {
  const d = pick([3, 4, 6, 7, 8, 12, 15, 16, 20, 25, 30, 40, 9, 11, 14, 24]); const n = rnd(1, d - 1); const g = gcd(n, d); const dd = d / g; const f = primeFactors(dd); const term = f.every(p => p === 2 || p === 5);
  return { type: 'mcq', q: 'Is <b>' + n + '/' + d + '</b> a terminating or a recurring decimal?', choices: ['Terminating', 'Recurring'], ans: term ? 0 : 1, ansText: term ? 'Terminating' : 'Recurring',
    hint: 'Simplify first. If the denominator only has prime factors 2 and 5, it terminates.', sol: [(g > 1 ? n + '/' + d + ' = ' + n / g + '/' + dd + '. ' : '') + 'Denominator ' + dd + ' = ' + (f.join(' × ') || '1') + '.', term ? 'Only 2s and 5s, so it <b>terminates</b>: ' + decLong(longDiv(n, d)) : 'It has a prime factor other than 2 or 5, so it <b>recurs</b>: ' + decHTML(longDiv(n, d))] };
});
gen('roundDec', '3F', 'Round a decimal', () => {
  const x = rnd(0, 99) + rnd(1, 99999) / 100000; const k = pick([[0, 'the nearest whole number'], [1, '1 decimal place'], [2, '2 decimal places'], [3, '3 decimal places']]); const ans = r2(x, k[0]);
  const s = x.toFixed(5).replace(/0+$/, '');
  return { type: 'num', q: 'Round <b>' + s + '</b> to ' + k[1] + '.', ans, tol: 1e-9, ansText: ans.toFixed(k[0]), sol: (() => { const pos = s.indexOf('.') + k[0] + (k[0] ? 1 : 1), nxt = s.charAt(pos) || '0', up = +nxt >= 5;
      return ['Look at the digit straight after the place you are rounding to. 5 or more → round up; 4 or less → leave it.', 'Rounding to ' + k[1] + ': the next digit is <b>' + nxt + '</b>, so ' + (up ? 'round up' : 'leave it') + ': <b>' + ans.toFixed(k[0]) + '</b>'];
    })() };
});
gen('recNotation', '3F', 'Recurring decimal notation', () => {
  const pairs = [[1, 3], [2, 3], [1, 6], [5, 6], [1, 9], [4, 9], [7, 9], [4, 11], [1, 11], [9, 11], [7, 12], [5, 12], [1, 7], [5, 7], [2, 15], [7, 15], [1, 12], [11, 12], [5, 18], [7, 18], [8, 33], [5, 33], [1, 15], [13, 30], [7, 30], [2, 9], [3, 11], [1, 18]]; const [n, d] = pick(pairs); const ld = longDiv(n, d); const right = decHTML(ld);
  const wrongs = [decHTML({ ...ld, nonRep: ld.nonRep + ld.rep, rep: '' }), decHTML({ ...ld, nonRep: '', rep: ld.nonRep + ld.rep }), decHTML({ ...ld, nonRep: ld.nonRep + ld.rep.slice(0, 1), rep: ld.rep.slice(1) || ld.rep })];
  const opts = shuffle([right, ...new Set(wrongs.filter(w => w !== right))].slice(0, 4)); const a = opts.indexOf(right);
  return { type: 'mcq', q: 'Which shows <b>' + n + '/' + d + '</b> correctly as a recurring decimal? (The line over digits means they repeat forever.)', choices: opts, ans: a, ansText: decLong(ld, 2),
    sol: [n + ' ÷ ' + d + ' = ' + decLong(ld, 4) + '. The repeating block is “' + ld.rep + '”.', 'In your book you may see dots over the first and last digit of the repeating block instead of a line.'] };
});

/* ---------- 3G converting ---------- */
gen('pctToFrac', '3G', 'Percentage → fraction', () => {
  const p = Math.random() < 0.75 ? rnd(1, 199) : pick([2.5, 7.5, 12.5, 17.5, 22.5, 37.5, 62.5, 87.5, 0.5, 1.5]); const f = Fr.of(p).div(100);
  return { type: 'frac', q: 'Write <b>' + fmt(p) + '%</b> as a fraction in simplest form.', ans: f, ansText: f.toString(), hint: 'Put it over 100, then simplify. For decimals like 12.5%, multiply top and bottom by 10 first.',
    sol: [fmt(p) + '% = ' + fmt(p) + '/100' + (Number.isInteger(p) ? '' : ' = ' + (p * 10) + '/1000') + (String(f) === fmt(p) + '/100' ? ' (already in simplest form) = <b>' + f + '</b>' : ' = <b>' + f + '</b>') + (f.n > f.d ? ' = ' + Math.floor(f.n / f.d) + ' ' + (f.n % f.d) + '/' + f.d : '')] };
});
gen('pctToDec', '3G', 'Percentage → decimal', () => {
  const p = Math.random() < 0.6 ? rnd(1, 350) : r2(rnd(1, 999) / 10, 1);
  return { type: 'num', q: 'Write <b>' + fmt(p) + '%</b> as a decimal.', ans: r2(p / 100, 6), tol: 1e-9, ansText: fmt(p / 100, 6), sol: ['Divide by 100 (move the decimal point 2 places left): ' + fmt(p) + ' ÷ 100 = <b>' + fmt(p / 100, 6) + '</b>'] };
});
gen('fracToPct', '3G', 'Fraction → percentage', () => {
  const d = pick([2, 4, 5, 8, 10, 20, 25, 40, 50, 3, 6, 12, 16]), n = rnd(1, Math.random() < 0.85 ? d - 1 : 2 * d); const p = n / d * 100; const ex = Number.isInteger(r2(p, 6)) || Number.isInteger(r2(p * 10, 6)) || Number.isInteger(r2(p * 100, 6));
  return { type: 'num', q: 'Write <b>' + n + '/' + d + '</b> as a percentage' + (ex ? '.' : ' (to 2 decimal places).'), ans: r2(p, 6), ansText: fmt(p, 2) + '%', sol: [n + '/' + d + ' × 100 = ' + n * 100 + '/' + d + ' = <b>' + fmt(p, 2) + '%</b>'] };
});
gen('decToPct', '3G', 'Decimal → percentage', () => {
  const x = pick([r2(rnd(1, 99) / 100, 2), r2(rnd(1, 999) / 1000, 3), r2(rnd(100, 350) / 100, 2), r2(rnd(1, 9) / 1000, 3)]);
  return { type: 'num', q: 'Write <b>' + fmt(x, 6) + '</b> as a percentage.', ans: r2(x * 100, 6), tol: 1e-9, ansText: fmt(x * 100, 4) + '%', sol: ['Multiply by 100 (move the decimal point 2 places right): ' + fmt(x, 6) + ' × 100 = <b>' + fmt(x * 100, 4) + '%</b>'] };
});
gen('decToFrac', '3G', 'Decimal → fraction', () => {
  const dp = pick([1, 2, 2, 3]); let x = r2(rnd(1, 10 ** dp - 1) / 10 ** dp + (Math.random() < 0.15 ? rnd(1, 2) : 0), dp); if (Number.isInteger(x)) x = 0.25;
  const f = Fr.of(x); const k = String(x).split('.')[1].length;
  return { type: 'frac', q: 'Write <b>' + x + '</b> as a fraction in simplest form.', ans: f, ansText: f.toString(), sol: [x + ' = ' + Math.round(x * 10 ** k) + '/' + 10 ** k + ' = <b>' + f + '</b>'] };
});
/* ---------- 3H finding / expressing ---------- */
gen('pctOf', '3H', 'Find a percentage of a quantity', () => {
  const p = pick([5, 10, 15, 20, 25, 30, 40, 60, 65, 75, 12.5, 7.5, 2.5, 120, 150, 35, 45, 8, 3]); let Q = pick([40, 60, 80, 120, 160, 240, 320, 350, 480, 64, 88, 200, 500, 45]);
  const isM = Math.random() < 0.6; const v = p / 100 * Q;
  return { type: 'num', q: 'Find <b>' + fmt(p) + '% of ' + (isM ? '$' + Q : Q + ' kg') + '</b>.', ans: r2(v, 4), ansText: isM ? money(v) : fmt(v) + ' kg', hint: 'Write the % as a fraction or decimal and multiply.',
    sol: [{ t: fmt(p) + '/100 × ' + Q, why: 'p% of Q = p/100 × Q' }, { t: '= ' + (isM ? money(v) : fmt(v) + ' kg'), why: 'Shortcut check: 10% of ' + Q + ' is ' + fmt(Q / 10) }] };
});
const UNIT_PAIRS = [['g', 'kg', 1000], ['mL', 'L', 1000], ['cm', 'm', 100], ['m', 'km', 1000], ['min', 'h', 60], ['s', 'min', 60], ['c', '$', 100], ['mm', 'cm', 10]];
gen('asPct', '3H', 'Express one quantity as a % of another', () => {
  if (Math.random() < 0.3) { const b = pick([20, 24, 25, 40, 50, 60, 80, 200]); const a = rnd(1, b - 1); const p = a / b * 100;
    return { type: 'num', q: 'Express <b>' + a + ' out of ' + b + '</b> as a percentage' + (Number.isInteger(r2(p, 4) * 4) ? '.' : ' (2 d.p.).'), ans: r2(p, 6), ansText: fmt(p, 2) + '%', sol: [{ t: a + '/' + b + ' × 100 = ' + fmt(p, 2) + '%', why: 'a ÷ b × 100' }] }; }
  for (let tries = 0; tries < 50; tries++) {
    const [s, B, c] = pick(UNIT_PAIRS); const W = pick([1, 1.2, 1.5, 2, 2.5, 3, 4, 5]); const p = pick([5, 10, 12.5, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80]);
    const part = r2(W * c * p / 100, 6); if (!Number.isInteger(part)) continue;
    const big = B === '$' ? '$' + W : fmt(W) + ' ' + B; const small = s === 'c' ? part + 'c' : part + ' ' + s;
    return { type: 'num', q: 'Express <b>' + small + '</b> as a percentage of <b>' + big + '</b>.', ans: p, ansText: fmt(p) + '%', hint: 'Convert to the same units first! 1 ' + B + ' = ' + c + ' ' + s + '.',
      sol: [{ t: big + ' = ' + fmt(W * c) + ' ' + s, why: 'Same units first' }, { t: part + '/' + fmt(W * c) + ' × 100 = ' + fmt(p) + '%', why: 'Divide and multiply by 100' }] };
  }
  return G.asPct.fn();
});

/* ---------- 3I increase / decrease ---------- */
gen('incDec', '3I', 'Increase or decrease by a percentage', () => {
  const A = pick([250, 85, 480, 1250, 64, 120, 75, 360, 48, 900, 32]), p = pick([5, 10, 12, 15, 20, 25, 30, 35, 7.5, 3.5, 40, 8]); const inc = Math.random() < 0.5; const mult = 1 + (inc ? 1 : -1) * p / 100; const v = A * mult;
  return { type: 'num', q: (inc ? 'Increase' : 'Decrease') + ' <b>$' + A + '</b> by <b>' + fmt(p) + '%</b>.', ans: r2(v, 4), ansText: money(v), hint: 'Multiply by ' + fmt(mult) + ' (that is ' + fmt(100 + (inc ? p : -p)) + '%).',
    sol: (() => { const amt = A * p / 100, cents = x => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9, $ = x => cents(x) ? money(x) : '$' + fmt(x, 4), end = cents(v) ? '' : ' ≈ <b>' + money(v) + '</b> (to the nearest cent)';
      return [{ t: fmt(p) + '% of $' + A + ' = ' + fmt(p / 100) + ' × ' + A + ' = ' + $(amt), why: 'Method 1: find the percentage amount' }, { t: '$' + A + ' ' + (inc ? '+' : '−') + ' ' + $(amt) + ' = ' + $(v) + end, why: inc ? 'Add it on' : 'Take it off' }, { t: '$' + A + ' × ' + fmt(mult) + ' = ' + $(v) + end, why: 'Method 2: multiplier ' + fmt(100 + (inc ? p : -p)) + '% = ' + fmt(mult) }]; })() };
});
gen('shopping', '3I', 'Discount, mark-up, GST and profit', () => {
  const k = rnd(0, 6);
  if (k === 0) { const P = pick([120, 80, 65, 240, 45, 360]), d = pick([10, 15, 20, 25, 30, 40]); const v = P * (1 - d / 100); return { type: 'num', q: 'Shoes cost $' + P + '. They are discounted by ' + d + '%. What is the sale price?', ans: v, ansText: money(v), sol: ['Sale price = ' + P + ' × ' + fmt(1 - d / 100) + ' = <b>' + money(v) + '</b> (discount = ' + money(P * d / 100) + ').'] }; }
  if (k === 1) { const P = pick([85, 120, 45, 250, 19, 72]); const v = P * 1.1; return { type: 'num', q: 'An item costs $' + P + ' before GST. GST of 10% is added. What is the total price?', ans: r2(v, 4), ansText: money(v), sol: ['Total = ' + P + ' × 1.1 = <b>' + money(v) + '</b>'] }; }
  if (k === 2) { const P = pick([160, 50, 80, 240, 35, 500]); const v = P * 1.1; return { type: 'num', q: 'A price <b>including</b> GST is ' + money(v) + '. What was the price before GST?', ans: P, ansText: money(P), hint: 'Including GST = 110% of the original. Divide by 1.1 (do not subtract 10%).', sol: ['Before GST = ' + money(v) + ' ÷ 1.1 = <b>' + money(P) + '</b>', 'Taking 10% off ' + money(v) + ' would give ' + money(v * 0.9) + ', which is wrong.'] }; }
  if (k === 3) { const C = pick([40, 250, 120, 60, 80]), m = pick([20, 25, 30, 45, 50, 60]); const v = C * (1 + m / 100); return { type: 'num', q: 'A shop buys a bike for $' + C + ' (cost price) and marks it up by ' + m + '%. What is the marked (retail) price?', ans: r2(v, 4), ansText: money(v), sol: ['Marked price = ' + C + ' × ' + fmt(1 + m / 100) + ' = <b>' + money(v) + '</b>'] }; }
  if (k === 4) { const C = pick([40, 200, 80, 125, 60]), S = C + pick([-30, -20, -10, 8, 12, 15, 25, 30, 50]); if (S <= 0 || S === C) return G.shopping.fn(); const p = (S - C) / C * 100;
    return { type: 'num', signed: true, q: 'A trader buys an item for $' + C + ' and sells it for $' + S + '. Calculate the ' + (S > C ? 'profit' : 'loss') + ' as a percentage of the cost price (2 d.p. if needed).', ans: r2(Math.abs(p), 6), ansText: fmt(Math.abs(p), 2) + '% ' + (S > C ? 'profit' : 'loss'), sol: [(S > C ? 'Profit' : 'Loss') + ' = ' + Math.abs(S - C) + '.', Math.abs(S - C) + ' ÷ ' + C + ' × 100 = <b>' + fmt(Math.abs(p), 2) + '%</b>'] }; }
  if (k === 5) { const S = pick([12500, 8000, 24000, 3600]), c = pick([2, 3, 4, 5, 2.5]); const v = S * c / 100; return { type: 'num', q: 'A salesperson earns ' + fmt(c) + '% commission on $' + S + ' of sales. How much commission is earned?', ans: v, ansText: money(v), sol: [fmt(c) + '% of ' + S + ' = ' + fmt(c / 100) + ' × ' + S + ' = <b>' + money(v) + '</b>'] }; }
  const P = pick([480, 300, 200, 640]); const g = P * 1.1, s = g * 0.85; return { type: 'num', q: 'A console costs $' + P + ' before GST. 10% GST is added, then 15% is taken off the GST-inclusive price. What is the final price?', ans: r2(s, 4), ansText: money(s), sol: ['With GST: ' + P + ' × 1.1 = ' + money(g) + '.', 'Sale: ' + money(g) + ' × 0.85 = <b>' + money(s) + '</b>.', 'Order does not matter: ' + P + ' × 0.85 × 1.1 gives the same answer.'] };
});
gen('vocab', '3I', 'Money words', () => {
  const T = [['Discount', 'the amount taken off the marked price'], ['Mark-up', 'the amount added to the cost price to set the selling price'], ['Profit', 'selling price minus cost price, when you sell for more than you paid'], ['Loss', 'cost price minus selling price, when you sell for less than you paid'], ['Selling price', 'the price the customer actually pays'], ['Cost price', 'the price the seller paid for the item'], ['Wholesale price', 'the price a shop pays its supplier'], ['Retail price', 'the price marked in the shop for customers'], ['GST', 'a 10% tax added to most goods and services in Australia'], ['Percentage profit', 'the profit written as a percentage of the cost price'], ['Sale price', 'the price after a discount has been taken off'], ['Commission', 'a percentage of the sales paid to the salesperson']];
  // words that overlap in meaning are never offered together (that would make two answers right)
  const SAME = [['Selling price', 'Sale price', 'Retail price'], ['Cost price', 'Wholesale price'], ['Profit', 'Percentage profit'], ['Discount', 'Sale price']];
  const i = rnd(0, T.length - 1); const ok = j => j !== i && !SAME.some(g => g.includes(T[i][0]) && g.includes(T[j][0]));
  const rest = T.filter((_, j) => ok(j));
  if (Math.random() < 0.5) return mcq4('Which word means: <i>' + T[i][1] + '</i>?', T[i][0], rest.map(x => x[0]), '<b>' + T[i][0] + '</b>: ' + T[i][1] + '.');
  return mcq4('What does <b>' + T[i][0].toLowerCase() + '</b> mean?', cap(T[i][1]), rest.map(x => cap(x[1])), '<b>' + T[i][0] + '</b>: ' + T[i][1] + '.');
});
/* ---------- 3J percentage change ---------- */
gen('pctChange', '3J', 'Percentage change', () => {
  const O = pick([80, 450, 52, 2.5, 1899, 50, 120, 64, 200, 35, 75, 250]); const p = pick([10, 20, 25, 24, 15, 30, 12.5, 40, 5, 8]) * (Math.random() < 0.5 ? 1 : -1); let N = r2(O * (1 + p / 100), 2);
  if (Math.random() < 0.25) N = r2(O * (1 + rnd(-35, 35) / 100), 0) || N;
  if (N === O) return G.pctChange.fn(); const pc = (N - O) / O * 100; const mon = O < 1000 && O !== 52;
  const f = v => mon ? money(v) : fmt(v) + ' kg';
  return { type: 'num', signed: true, q: 'A ' + (mon ? 'price' : 'mass') + ' changes from <b>' + f(O) + '</b> to <b>' + f(N) + '</b>. Calculate the percentage change. Type a number (use a minus sign or the word “decrease” for a decrease). 2 d.p. if needed.', ans: r2(pc, 6), ansText: fmt(Math.abs(pc), 2) + '% ' + (pc > 0 ? 'increase' : 'decrease'),
    hint: '% change = change ÷ ORIGINAL × 100', sol: [{ t: 'Change = ' + f(N) + ' − ' + f(O) + ' = ' + (pc > 0 ? '' : '−') + f(Math.abs(N - O)), why: pc > 0 ? 'Positive: an increase' : 'Negative: a decrease' }, { t: fmt(Math.abs(N - O), 2) + ' ÷ ' + fmt(O) + ' × 100 = ' + fmt(Math.abs(pc), 2) + '%', why: 'Divide by the original value' }, '<b>' + fmt(Math.abs(pc), 2) + '% ' + (pc > 0 ? 'increase' : 'decrease') + '</b>'] };
});
gen('pctChangeMcq', '3J', 'Percentage change (multiple choice)', () => {
  const O = pick([50, 40, 80, 200, 25]), p = pick([20, 25, 10, 50]), inc = Math.random() < 0.5; const N = O * (1 + (inc ? p : -p) / 100); const wrongP = Math.abs(N - O) / N * 100;
  const opts = shuffle([p + '% ' + (inc ? 'increase' : 'decrease'), p + '% ' + (inc ? 'decrease' : 'increase'), fmt(wrongP, 2) + '% ' + (inc ? 'increase' : 'decrease'), fmt(p / 2) + '% ' + (inc ? 'increase' : 'decrease')]); const a = opts.indexOf(p + '% ' + (inc ? 'increase' : 'decrease'));
  return { type: 'mcq', q: 'A price ' + (inc ? 'rises' : 'falls') + ' from $' + O + ' to $' + fmt(N) + '. The percentage change is:', choices: opts, ans: a, ansText: opts[a], sol: ['Change ÷ original: ' + fmt(Math.abs(N - O)) + ' ÷ ' + O + ' × 100 = ' + p + '%.', 'Dividing by the new price (' + fmt(N) + ') is the common mistake.'] };
});

/* ---------- 3K unitary ---------- */
gen('unitary', '3K', 'Unitary method', () => {
  const k = rnd(0, 1); const p = pick([25, 8, 15, 60, 35, 40, 12, 5, 20, 30]); const total = pick([240, 450, 180, 30, 80, 600, 120, 1200, 360]); const v = p / 100 * total; if (!Number.isInteger(v * 100)) return G.unitary.fn();
  if (k === 0) { return { type: 'num', q: '<b>' + p + '%</b> of a total is <b>' + fmt(v) + '</b>. Find the whole amount (100%).', ans: total, ansText: fmt(total), hint: 'Find 1% first: divide by ' + p + '.', sol: [{ t: p + '% = ' + fmt(v), why: 'Given' }, { t: '1% = ' + fmt(v) + ' ÷ ' + p + ' = ' + fmt(v / p, 4), why: 'Divide by ' + p }, { t: '100% = ' + fmt(v / p, 4) + ' × 100 = ' + fmt(total), why: 'Multiply by 100' }] }; }
  const q = pick([10, 4, 20, 50, 75, 1, 30]); const ans = q / 100 * total; if (q === p) return G.unitary.fn();
  return { type: 'num', q: '<b>' + p + '%</b> of a bill is <b>$' + fmt(v) + '</b>. How much is <b>' + q + '%</b> of the bill?', ans: r2(ans, 4), ansText: money(ans), hint: 'Find 1% first.', sol: [{ t: '1% = ' + fmt(v) + ' ÷ ' + p + ' = ' + fmt(v / p, 4), why: 'Find one unit (1%)' }, { t: q + '% = ' + fmt(v / p, 4) + ' × ' + q + ' = ' + money(ans), why: 'Multiply by ' + q }] };
});
gen('reversePct', '3K', 'Find the original amount', () => {
  const O = pick([120, 80, 2.4, 5000, 360, 250, 60, 45]), p = pick([20, 15, 5, 8, 10, 25, 12.5, 30]), inc = Math.random() < 0.5; const m = 1 + (inc ? p : -p) / 100; const N = r2(O * m, 2);
  if (Math.abs(N / m - O) > 0.001) return G.reversePct.fn();
  const what = O >= 1000 ? ['A town’s population ' + (inc ? 'grew' : 'fell') + ' by ' + fmt(p) + '% to ' + fmt(N) + '. What was it before?', fmt(O) + ' people'] : ['After a ' + fmt(p) + '% ' + (inc ? 'increase' : 'discount') + ', the price is ' + money(N) + '. What was the original price?', money(O)];
  return { type: 'num', q: what[0], ans: O, ansText: what[1], hint: 'The new amount is ' + fmt(100 + (inc ? p : -p)) + '% of the original. Divide by ' + fmt(m) + '.',
    sol: [{ t: fmt(100 + (inc ? p : -p)) + '% = ' + fmt(N), why: 'The new amount as a % of the original' }, { t: '1% = ' + fmt(N) + ' ÷ ' + fmt(100 + (inc ? p : -p)) + ' = ' + fmt(N / (100 + (inc ? p : -p)), 4), why: 'Unitary method' }, { t: '100% = ' + fmt(N / (100 + (inc ? p : -p)), 4) + ' × 100 = ' + (O >= 1000 ? fmt(O) : money(O)), why: 'Or in one step: ' + fmt(N) + ' ÷ ' + fmt(m) + ' = ' + fmt(O) }, 'Do not just ' + (inc ? 'subtract' : 'add') + ' ' + fmt(p) + '% of the new amount: that gives the wrong answer.'] };
});
gen('successive', '3K', 'Successive percentage changes', () => {
  const a = pick([10, 20, 25, 50, 30]), b = pick([10, 20, 25, 40]); const up = Math.random() < 0.5; const m1 = 1 + (up ? a : -a) / 100, m2 = 1 + (up ? -b : b) / 100; const m = m1 * m2; const pc = (m - 1) * 100;
  return { type: 'num', signed: true, q: 'A price ' + (up ? 'rises' : 'falls') + ' by ' + a + '%, then ' + (up ? 'falls' : 'rises') + ' by ' + b + '%. What is the overall percentage change? (Type a negative number for a decrease.)', ans: r2(pc, 6), ansText: (pc === 0 ? '0% (no change)' : fmt(Math.abs(pc), 2) + '% ' + (pc > 0 ? 'increase' : 'decrease')),
    hint: 'Multiply the multipliers. Start with $100 to check.', sol: [{ t: fmt(m1) + ' × ' + fmt(m2) + ' = ' + fmt(m, 4), why: 'Combine the multipliers' }, { t: '$100 → ' + money(100 * m1) + ' → ' + money(100 * m), why: 'Check with $100' }, 'Overall: <b>' + (pc === 0 ? 'no change' : fmt(Math.abs(pc), 2) + '% ' + (pc > 0 ? 'increase' : 'decrease')) + '</b>. The second % is taken from the new amount, so you cannot just add the percentages.'] };
});
gen('multiStepPct', '3K', 'Multi-step percentage problem', () => {
  const k = rnd(0, 2);
  if (k === 0) { const C = pick([250, 300, 200, 400]), m = pick([45, 30, 50, 40]), d = pick([10, 20, 15]); const sale = C * (1 + m / 100) * (1 - d / 100); const pr = sale - C; const pp = pr / C * 100;
    return { type: 'num', q: 'A shop buys a bike for $' + C + ', marks it up by ' + m + '%, then discounts the marked price by ' + d + '% in a sale. Find the profit as a percentage of the cost price (2 d.p. if needed).', ans: r2(pp, 6), ansText: fmt(pp, 2) + '%', sol: ['Marked price = ' + C + ' × ' + fmt(1 + m / 100) + ' = ' + money(C * (1 + m / 100)) + '.', 'Sale price = ' + money(C * (1 + m / 100)) + ' × ' + fmt(1 - d / 100) + ' = ' + money(sale) + '.', 'Profit = ' + money(pr) + '; ' + fmt(pr, 2) + ' ÷ ' + C + ' × 100 = <b>' + fmt(pp, 2) + '%</b>.'] }; }
  if (k === 1) { const S = pick([351, 234, 468]); const m = 1.3 * 0.9; const C = S / m; return { type: 'num', q: 'Boots were marked up by 30% for retail, then the retail price was discounted by 10%. The sale price was $' + S + '. What was the original cost price?', ans: r2(C, 4), ansText: money(C), sol: ['Overall multiplier: 1.30 × 0.90 = 1.17.', 'Cost price = ' + S + ' ÷ 1.17 = <b>' + money(C) + '</b>'] }; }
  const N = pick([300, 400, 500, 200]), w = pick([40, 30, 35]), b = pick([25, 20, 30]), bike = 5; const driven = 100 - w - b - bike; const n = N * driven / 100;
  return { type: 'num', q: 'In a survey, ' + w + '% walk to school, ' + b + '% catch the bus, ' + bike + '% ride a bike and the rest are driven. ' + n + ' students are driven. How many students were surveyed?', ans: N, ansText: String(N), sol: ['Driven = 100 − ' + w + ' − ' + b + ' − ' + bike + ' = ' + driven + '%.', driven + '% = ' + n + ', so 1% = ' + fmt(n / driven) + ' and 100% = <b>' + N + '</b>.'] };
});

/* ================= topic → generator map ================= */
const TOPIC_GENS = {
  '7I': ['ineqRead', 'ineqWords', 'ineqFlip', 'ineqNeg', 'ineqTest', 'ineqConcept'],
  '7J': ['ineqSolve', 'ineqSolve', 'ineqSolveGraph', 'ineqContext'],
  'EQ': ['eqSolve', 'eqSolve', 'eqWord'],
  'L1': ['tableFill', 'plotRead', 'quadrant', 'isLinear'],
  'L2': ['gradient2', 'gradient2', 'gradientGraph', 'gradientType'],
  'L3': ['mcRule', 'ruleGraph', 'rule2pts', 'xint'],
  'L4': ['ruleTable', 'ruleWords', 'ruleWords'],
  'L5': ['ruleUse', 'evalRule', 'solveRule', 'onLine', 'breakEven'],
  '10A': ['reflectPt', 'reflectPt', 'reflectShape', 'reflectWhich'],
  '10B': ['translatePt', 'findVector', 'vectorWords', 'translateShape'],
  '10C': ['rotatePt', 'rotatePt', 'rotateShape', 'transFacts'],
  '10D': ['corrParts', 'congFind', 'congFind', 'congConcept'],
  '10E': ['congTest', 'congTest', 'congTestNamed'],
  '10G': ['quadAngles', 'quadAngles', 'quadFacts', 'quadProof', 'kiteTF'],
  '10H': ['scaleFactor', 'similarSide', 'similarCheck'],
  '10I': ['shadow', 'parallelTri', 'hourglass', 'simTest'],
  'XYZ': ['boxCorner', 'axisPlane', 'move3d'],
  '3F': ['fracDecT', 'fracDecR', 'termOrRec', 'roundDec', 'recNotation'],
  '3G': ['pctToFrac', 'pctToDec', 'fracToPct', 'decToPct', 'decToFrac'],
  '3H': ['pctOf', 'pctOf', 'asPct', 'asPct'],
  '3I': ['incDec', 'shopping', 'shopping', 'vocab'],
  '3J': ['pctChange', 'pctChange', 'pctChangeMcq'],
  '3K': ['unitary', 'reversePct', 'successive', 'multiStepPct']
};
/* ================= "Super simple" explain mode =================
   A switch on every Working box. When it's on, each answer starts with the idea in plain words
   (what the question is really asking, and how to do it in tiny steps), the steps get more space,
   and the maths words in each step are explained in everyday words. Saved on this device. */
const SIMPLE = {
  // 7I inequalities
  ineqRead: { idea: 'The number line shows every number that works. Your job is to write that as x and a sign.', how: ['Find the circle: that’s the number in your answer.', 'Arrow going right means “bigger than” (>). Arrow going left means “smaller than” (<).', 'Filled-in circle ● means that number counts too, so add a line under the sign: ≥ or ≤. Empty circle ○ means it doesn’t count: just > or <.'] },
  ineqWords: { idea: 'Turn the words into a sign.', how: ['“More than” or “over” → >. “Less than” or “under” → <.', '“At least”, “minimum” or “or more” → ≥ (it can equal it).', '“At most”, “maximum”, “no more than” or “or less” → ≤ (it can equal it).'] },
  ineqFlip: { idea: 'You can write the same fact the other way round, like reading it backwards.', how: ['Swap the two sides.', 'Turn the sign around so its open mouth still faces the same thing. 5 < x means the same as x > 5.'] },
  ineqNeg: { idea: 'Times or divide by a negative number and the order of numbers flips, so the sign must flip too.', how: ['2 < 3 is true. Times both by −1: −2 and −3. Now −2 is the bigger one, so −2 > −3.', 'So whenever you × or ÷ both sides by a negative, turn < into > (or > into <).'] },
  ineqTest: { idea: 'Put the number in place of x and see if the sentence is true.', how: ['Swap x for the number.', 'Work out the left side.', 'Is the sign true? Yes → it’s a solution. No → it isn’t.'] },
  ineqConcept: { idea: 'An inequality says one side is bigger or smaller, not equal. Lots of numbers can work.', how: ['< smaller than, > bigger than, ≤ smaller or equal, ≥ bigger or equal.', 'Only × or ÷ by a negative flips the sign. Adding or taking away never flips it.'] },
  // 7J solving inequalities
  ineqSolve: { idea: 'Solve it just like an equation: get x on its own. Keep the sign the same, unless you × or ÷ by a negative.', how: ['Undo the + or − first by doing the opposite to both sides.', 'Then undo the × or ÷ by doing the opposite to both sides.', 'If you ÷ or × by a negative number, flip the sign.'] },
  ineqSolveGraph: { idea: 'Solve it to get x on its own, then pick the number line that matches.', how: ['Solve like an equation (flip the sign only if you × or ÷ by a negative).', '> or < → empty circle ○. ≥ or ≤ → filled circle ●.', '> or ≥ → arrow goes right. < or ≤ → arrow goes left.'] },
  ineqContext: { idea: 'Write a sentence with a sign from the story, then solve it.', how: ['“At most”, “no more than” → ≤. “At least” → ≥.', 'Solve it like an equation.', 'Think about the answer: you can’t buy half a ticket, so round to a whole number that still fits the rule.'] },
  // equations
  eqSolve: { idea: 'An equation is like balanced scales. Whatever you do to one side, do to the other, until the letter is on its own.', how: ['If there are brackets, multiply them out first.', 'Get all the letters on one side and the plain numbers on the other (by adding or taking away on both sides).', 'Then divide both sides by the number in front of the letter.', 'Check: put your answer back in. Both sides should match.'] },
  eqWord: { idea: 'Turn the story into an equation, then solve it.', how: ['Let a letter stand for the thing you don’t know.', 'Write the story as maths: “3 times”, “plus 5”, “equals 20”…', 'Solve it like any equation, then answer in words with units.'] },
  // linear relations
  tableFill: { idea: 'The rule tells you how to turn each x into a y.', how: ['Take the x number from the table.', 'Put it into the rule in place of x.', 'Do the times first, then the plus or minus. That’s the y.'] },
  plotRead: { idea: 'A point is written (across, up).', how: ['Start at the middle (0, 0).', 'Count across first: right is positive, left is negative. That’s x.', 'Then count up (positive) or down (negative). That’s y.'] },
  quadrant: { idea: 'The two axes cut the grid into 4 corners called quadrants, numbered anticlockwise from the top right.', how: ['Top right: (+, +) is 1st. Top left: (−, +) is 2nd.', 'Bottom left: (−, −) is 3rd. Bottom right: (+, −) is 4th.', 'A point with a 0 sits on an axis, not in a quadrant.'] },
  isLinear: { idea: 'A straight line goes up (or down) by the same amount every step.', how: ['Check the x values go up by the same amount each time.', 'Find how much y changes each step.', 'Same change every time → linear (a straight line). Different changes → not linear.'] },
  gradient2: { idea: 'Gradient is how steep a line is: how far up you go for each 1 step across.', how: ['Up (rise) = the second y take away the first y.', 'Across (run) = the second x take away the first x.', 'Gradient = up ÷ across. Going down gives a negative gradient.'] },
  gradientType: { idea: 'The gradient’s sign tells you which way the line slopes.', how: ['Positive → goes uphill from left to right.', 'Negative → goes downhill from left to right.', 'Zero → flat (horizontal). Vertical lines have no gradient (it’s undefined).'] },
  gradientGraph: { idea: 'Read two clear points off the line, then do up ÷ across.', how: ['Pick two points where the line crosses grid corners exactly.', 'Count how far up (or down) and how far across between them.', 'Gradient = up ÷ across. Downhill means negative.'] },
  mcRule: { idea: 'In y = mx + c, the number in front of x is the gradient (m) and the number on its own is where it crosses the y-axis (c).', how: ['m = the number stuck to x (including its sign).', 'c = the number added or taken away on its own.', 'Get y on its own first if it isn’t.'] },
  ruleGraph: { idea: 'Find where the line crosses the y-axis (that’s c) and how steep it is (that’s m). Then write y = mx + c.', how: ['c: where the line cuts the up-and-down axis.', 'm: up ÷ across between two clear points.', 'Put them into y = mx + c.'] },
  rule2pts: { idea: 'Two points are enough to find the whole line.', how: ['Find the gradient m = (difference in y) ÷ (difference in x).', 'Put m and one point into y = mx + c, then work out c.', 'Write y = mx + c, and check it works for the other point.'] },
  xint: { idea: 'The x-intercept is where the line crosses the x-axis. On the x-axis, y is always 0.', how: ['Put y = 0 into the rule.', 'Solve to find x.', 'The point is (that x, 0).'] },
  ruleTable: { idea: 'Find how much y goes up each time x goes up by 1 (that’s m), and what y is when x is 0 (that’s c).', how: ['m = the jump in y for each +1 in x.', 'c = the y value when x = 0 (count back if 0 isn’t in the table).', 'Write y = mx + c.'] },
  ruleWords: { idea: 'The amount that repeats (per hour, per km…) is m. The one-off starting amount is c.', how: ['m = the “per” amount (each, per, every). If it goes down, it’s negative.', 'c = the start amount or fixed fee.', 'Write the rule with the story’s letters, e.g. C = 2d + 5.'] },
  ruleUse: { idea: 'Use the rule like a recipe: put the number in and work it out, or work backwards.', how: ['To find the answer: put the number into the rule and calculate (× first, then + or −).', 'To find the input: set the rule equal to the answer and solve.'] },
  evalRule: { idea: 'Substitute just means swap the letter for a number.', how: ['Write the rule again with the number in brackets where x was.', 'Do the multiplying first.', 'Then add or take away.'] },
  solveRule: { idea: 'You know y. Put it in and solve for x.', how: ['Write the given y number = the rule.', 'Undo the + or − on both sides.', 'Undo the × by dividing both sides.'] },
  onLine: { idea: 'A point is on the line only if it makes the rule true.', how: ['Put the point’s x into the rule.', 'Work out what y should be.', 'Does it match the point’s y? Yes → on the line. No → not on it.'] },
  breakEven: { idea: 'Two plans cost the same when their rules give the same answer.', how: ['Write each plan as a rule.', 'Make the two rules equal to each other.', 'Solve for the letter. That’s when they cost the same.'] },
  // transformations
  reflectPt: { idea: 'A reflection is a mirror image: the same distance on the other side of the mirror line.', how: ['Mirror in the x-axis: keep x, flip the sign of y.', 'Mirror in the y-axis: flip the sign of x, keep y.', 'Mirror in y = x: swap the two numbers. Other lines: count the distance to the line, then go the same distance past it.'] },
  reflectShape: { idea: 'Reflect each corner on its own, then join them up.', how: ['Use the mirror rule on every corner.', 'Write the new corners with a dash: A becomes A′.', 'The shape is flipped over but stays the same size.'] },
  reflectWhich: { idea: 'Find the line that sits exactly halfway between each point and its image.', how: ['Compare the old and new points.', 'Only y changed sign → x-axis. Only x changed sign → y-axis. Numbers swapped → y = x.', 'Check: the mirror line is halfway between every pair.'] },
  translatePt: { idea: 'A translation is a slide. Nothing turns or flips.', how: ['The vector (a, b) means move a across and b up.', 'Add a to x. Add b to y.', 'Negative numbers mean left or down.'] },
  findVector: { idea: 'The vector says how far you slid: across, then up.', how: ['Across = new x − old x.', 'Up = new y − old y.', 'Write it as (across, up).'] },
  vectorWords: { idea: 'A vector (a, b) is just directions.', how: ['First number: positive → right, negative → left.', 'Second number: positive → up, negative → down.', 'Say both, e.g. (3, −2) = 3 right and 2 down.'] },
  translateShape: { idea: 'Slide every corner by the same vector.', how: ['Add the first vector number to every x.', 'Add the second vector number to every y.', 'Same shape, same way round, just moved.'] },
  rotatePt: { idea: 'A rotation turns the point around the middle (0, 0).', how: ['90° clockwise: (x, y) → (y, −x).', '90° anticlockwise: (x, y) → (−y, x).', '180°: (x, y) → (−x, −y). Both signs flip.'] },
  rotateShape: { idea: 'Turn every corner with the same rule.', how: ['Pick the rule for the turn (90° clockwise, 90° anticlockwise or 180°).', 'Use it on each corner.', 'The shape stays the same size; it just faces a new way.'] },
  transFacts: { idea: 'Reflections, slides (translations) and turns (rotations) never change a shape’s size or angles.', how: ['Reflection = flip. Translation = slide. Rotation = turn.', 'The image is always congruent (identical) to the original.'] },
  // congruence
  corrParts: { idea: 'Congruent shapes are identical twins. Matching parts are in the same position in the names.', how: ['△ABC ≡ △DEF means A↔D, B↔E, C↔F.', 'So side AB matches DE, and angle B matches angle E.'] },
  congFind: { idea: 'In identical (congruent) shapes, matching sides and angles are equal.', how: ['Match up the letters in order.', 'Find which part matches the one you want.', 'It has the same size, so copy that number.'] },
  congConcept: { idea: 'Congruent means exactly the same shape and size (≡). It can be turned or flipped and still count.', how: ['Same shape AND same size → congruent.', 'Same shape but different size → similar, not congruent.'] },
  congTest: { idea: 'You only need 3 matching facts to prove two triangles are identical, in one of 4 patterns.', how: ['SSS: all 3 sides match.', 'SAS: 2 sides and the angle between them match.', 'AAS: 2 angles and a side match. RHS: right angle, the longest side (hypotenuse) and one other side match.'] },
  congTestNamed: { idea: 'Look at which matching facts you’re given, then pick the test.', how: ['Count what matches: sides (S) and angles (A).', 'Is the angle between the two sides? Then it’s SAS.', 'Is there a right angle with the hypotenuse? Then it’s RHS.'] },
  // quadrilaterals
  quadAngles: { idea: 'Each special 4-sided shape has its own rules. Angles inside any 4-sided shape add to 360°.', how: ['Parallelogram: opposite sides equal and opposite angles equal.', 'Rhombus: all sides equal. Kite: two pairs of equal sides next to each other.', 'Use “angles add to 360°” to find a missing one.'] },
  quadFacts: { idea: 'Match the clues to the shape.', how: ['Square: all sides equal and all right angles.', 'Rectangle: all right angles. Rhombus: all sides equal.', 'Parallelogram: two pairs of parallel sides. Trapezium: one pair. Kite: two pairs of equal sides next to each other.'] },
  quadProof: { idea: 'Draw a diagonal to cut the shape into two triangles, show they are congruent, and then their matching parts are equal.', how: ['Find matching sides and angles in the two triangles.', 'Name the test (SSS, SAS, AAS or RHS).', 'Then matching parts are equal, which proves the fact.'] },
  kiteTF: { idea: 'Check each sentence against the shape’s rules.', how: ['Think of what the shape looks like.', 'Does the rule always work for that shape?', 'If it fails even once, the answer is false.'] },
  // similarity
  scaleFactor: { idea: 'The scale factor is how many times bigger (or smaller) the copy is.', how: ['Pick a matching pair of sides.', 'Scale factor = new length ÷ old length.', 'Bigger than 1 → enlargement. Between 0 and 1 → it shrank.'] },
  similarSide: { idea: 'In similar shapes, every side is multiplied by the same number (the scale factor).', how: ['Find the scale factor from a matching pair: big ÷ small.', 'Going to the bigger shape? × the scale factor.', 'Going to the smaller shape? ÷ the scale factor.'] },
  similarCheck: { idea: 'Shapes are similar if every side was multiplied by the same number.', how: ['Divide each pair of matching sides.', 'All the answers the same → similar.', 'Any different → not similar.'] },
  shadow: { idea: 'At the same time of day, objects and their shadows make similar triangles.', how: ['Height ÷ shadow is the same for both objects.', 'Write that as an equation with the unknown.', 'Solve by multiplying.'] },
  parallelTri: { idea: 'A line parallel to one side cuts off a small triangle that is a shrunk copy of the big one.', how: ['Match the small triangle’s sides with the big triangle’s sides.', 'Use whole sides of the big triangle (not just the bottom piece).', 'Scale factor = big ÷ small, then × or ÷ to find the missing side.'] },
  hourglass: { idea: 'The two triangles in an hourglass (bow-tie) are similar: one is a bigger copy, turned around.', how: ['Match the sides that face each other across the cross.', 'Scale factor = big side ÷ matching small side.', 'Use it to find the missing side.'] },
  simTest: { idea: 'Triangles are similar if they have the same shape. There are 4 ways to show it.', how: ['AAA: all angles match.', 'SSS: all sides are in the same ratio.', 'SAS: two sides in the same ratio with the same angle between. RHS: right angle and hypotenuse + one side in the same ratio.'] },
  // 3D
  boxCorner: { idea: 'In 3D a point has 3 numbers (x, y, z): how far along x, how far along y, and how high up.', how: ['Start at the corner O(0, 0, 0).', 'Count how far along the x edge, then the y edge, then up (z).', 'Corners on the floor have z = 0. Corners on top have z = the height.'] },
  axisPlane: { idea: 'Zeros tell you where the point sits.', how: ['Two zeros → it’s on an axis (the non-zero one names the axis).', 'One zero → it’s on a flat plane, e.g. z = 0 is the floor (the xy-plane).', 'All 0 → it’s the origin.'] },
  move3d: { idea: 'Moving in one direction changes only one of the three numbers.', how: ['Along the x-axis → change x. Along the y-axis → change y. Up or down → change z.', 'Add for moving up (or along), take away for moving down.', 'The other two numbers stay the same.'] },
  // 3F decimals
  fracDecT: { idea: 'A fraction is a divide: top ÷ bottom.', how: ['Do top ÷ bottom (short division).', 'Or make the bottom 10, 100 or 1000 by multiplying top and bottom by the same number.', 'It stops (terminates) when you run out of remainder.'] },
  fracDecR: { idea: 'Some fractions never stop dividing: the digits repeat forever.', how: ['Do top ÷ bottom.', 'Watch for the remainder repeating: then the digits repeat.', 'Round to the places asked (look at the next digit: 5 or more → round up).'] },
  termOrRec: { idea: 'Simplify the fraction, then look at the bottom number.', how: ['Break the bottom into prime factors (like 20 = 2 × 2 × 5).', 'Only 2s and 5s → the decimal stops (terminating).', 'Any other prime (3, 7, 11…) → it repeats forever (recurring).'] },
  roundDec: { idea: 'Rounding keeps the number nearly the same but shorter.', how: ['Find the last digit you keep.', 'Look at the next digit: 5 or more → add 1 to the kept digit. 4 or less → leave it.', 'Drop everything after.'] },
  recNotation: { idea: 'A dot (or bar) over digits means they repeat forever.', how: ['A dot over one digit: that digit repeats, so 0.3 with a dot = 0.3333…', 'A bar (or dots at each end) over a group: the whole group repeats, so 0.12 with a bar over 12 = 0.121212…'] },
  // 3G percentages
  pctToFrac: { idea: 'Percent means “out of 100”.', how: ['Write the number over 100.', 'Simplify by dividing top and bottom by the same number.', 'If there’s a decimal, multiply top and bottom by 10 until it’s gone.'] },
  pctToDec: { idea: 'Percent means “out of 100”, so divide by 100.', how: ['Move the decimal point 2 places to the left.', 'Example: 45% → 0.45. 7% → 0.07.'] },
  fracToPct: { idea: 'Turn the fraction into “out of 100”.', how: ['Fraction × 100 = the percent.', 'Or change the bottom to 100 and the top is the percent.'] },
  decToPct: { idea: 'Multiply by 100 to get the percent.', how: ['Move the decimal point 2 places to the right.', 'Example: 0.35 → 35%. 1.2 → 120%.'] },
  decToFrac: { idea: 'The last decimal place tells you the bottom number.', how: ['1 place → over 10. 2 places → over 100. 3 places → over 1000.', 'Write the digits on top.', 'Simplify.'] },
  // 3H
  pctOf: { idea: 'To find a percent of something, turn the percent into a decimal and multiply.', how: ['Percent ÷ 100 (e.g. 15% → 0.15).', 'Multiply by the amount.', 'Shortcut: 10% = ÷ 10, 1% = ÷ 100, then build up.'] },
  asPct: { idea: 'What part of the whole is it, out of 100?', how: ['Make sure both amounts use the same units.', 'Part ÷ whole.', '× 100 to make it a percent.'] },
  // 3I
  incDec: { idea: 'Increase = add the percent on. Decrease = take it off.', how: ['Work out the percent of the amount.', 'Add it (increase) or take it away (decrease).', 'Or in one step: × (100 + p)% for up, × (100 − p)% for down.'] },
  shopping: { idea: 'Shopping questions are percent questions with money words.', how: ['Discount = money off, so the price goes down. Mark-up = extra added, so the price goes up.', 'GST in Australia = 10% added on top. Commission = a % of the sales, paid to the seller.', 'Profit = selling price − cost price (a negative answer means a loss).', 'Find the % of the amount (÷ 100, × the %), then add it or take it away if the question asks for a new price.'] },
  vocab: { idea: 'Learn what each money word means.', how: ['Cost price = what the shop paid. Selling price = what you pay.', 'Profit = sold for more than cost. Loss = sold for less.', 'Discount = money off. GST = 10% tax added.'] },
  // 3J
  pctChange: { idea: 'Percentage change says how big the change was compared with where you started.', how: ['Change = new − old.', 'Divide the change by the OLD (original) amount.', '× 100. Positive = increase, negative = decrease.'] },
  pctChangeMcq: { idea: 'Change ÷ original × 100.', how: ['Find the change (new − old).', 'Divide by the original amount, not the new one.', '× 100 to get the percent.'] },
  // 3K
  unitary: { idea: 'Find what 1 is worth first, then multiply up.', how: ['Divide to get 1 unit (or 1%).', 'Multiply to get the amount you want.'] },
  reversePct: { idea: 'Work backwards to the original (100%).', how: ['Write what percent the new amount is (e.g. after a 20% discount you pay 80%).', 'Divide the new amount by that percent to get 1%.', '× 100 to get the original.'] },
  successive: { idea: 'Two changes in a row: the second change uses the new amount, so you can’t just add the percents.', how: ['Turn each change into a multiplier (up 10% → × 1.1, down 20% → × 0.8).', 'Multiply the amount by both multipliers.', 'Compare with the start to see the overall change.'] },
  multiStepPct: { idea: 'Do it one step at a time, in the order the story says.', how: ['Write down the starting amount.', 'Do each percent change on the newest amount.', 'Keep the units (like $) and round money to 2 decimal places at the end.'] }
};
// The maths words in each step, said in everyday words (only used when Super simple is on)
const SIMPLE_WHY = [
  [/^The equation to solve$/i, 'Start: write the question down'],
  [/^The inequality to solve$/i, 'Start: write the question down'],
  [/^Divide both sides by (.+?) — <b>this is a negative number, so reverse the inequality sign<\/b>$/i, 'Do ÷ $1 to both sides. It’s a negative number, so flip the sign around (< becomes >, > becomes <)'],
  [/^Multiply both sides by (.+?) — <b>this is a negative number, so reverse the inequality sign<\/b>$/i, 'Do × $1 to both sides. It’s a negative number, so flip the sign around (< becomes >, > becomes <)'],
  [/^Divide both sides by (.+)$/i, 'Do ÷ $1 to both sides so the letter is on its own'],
  [/^Multiply both sides by (\S+) \((.+)\)$/i, 'Do × $1 to both sides to undo the divide ($2)'],
  [/^Multiply both sides by (.+)$/i, 'Do × $1 to both sides to undo the divide'],
  [/^Subtract (.+?) from both sides$/i, 'Take $1 away from both sides (keeps it balanced)'],
  [/^Add (.+?) to both sides$/i, 'Add $1 to both sides (keeps it balanced)'],
  [/^Substitute (\w) = (.+?) back into the original$/i, 'Check: put $1 = $2 into the question. Both sides should match'],
  [/^Test a number from your answer in the original$/i, 'Check: pick a number that should work and test it'],
  [/^Gradient = rise ÷ run$/i, 'Steepness = how far up ÷ how far across'],
  [/^Substitute \((.+?), (.+?)\)$/i, 'Put in the point: x = $1 and y = $2'],
  [/^Substitute (\w) = (.+)$/i, 'Swap $1 for $2'],
  [/^Substitute$/i, 'Swap the letter for the number'],
  [/^Substitute and multiply$/i, 'Swap the letter for the number, then multiply'],
  [/^Expand any brackets and simplify each side$/i, 'Multiply out the brackets, then tidy up each side'],
  [/^Multiply first, then add$/i, 'Times first, then plus (order of operations)'],
  [/^Multiply first, then subtract$/i, 'Times first, then minus (order of operations)'],
  [/^Solve for c$/i, 'Work out c (where the line crosses the y-axis)'],
  [/^Unitary method$/i, 'Find what 1 is worth first, then times it up'],
  [/^Combine the multipliers$/i, 'Multiply the two multipliers together'],
  [/^Divide by the original value$/i, 'Divide by the starting amount (not the new one)'],
  [/^Set the two costs equal$/i, 'Make the two costs equal to each other'],
  [/^Positive: an increase$/i, 'It’s positive, so it went up'],
  [/^Negative: a decrease$/i, 'It’s negative, so it went down'],
  [/^Positive: the line goes up from left to right$/i, 'Positive, so the line goes uphill →'],
  [/^Negative: the line goes down from left to right$/i, 'Negative, so the line goes downhill →'],
  [/^Zero gradient: a horizontal line$/i, 'Zero, so the line is flat'],
  [/^Whole tickets, so round down$/i, 'You can’t buy part of a ticket, so round down'],
  [/^Whole hours, so round up$/i, 'Part of an hour isn’t enough, so round up to the next whole hour'],
  [/^Round down to a whole number$/i, 'Round down to a whole number (rounding up would go over)'],
  [/^Same units first$/i, 'Make both amounts the same units first'],
  [/^p% of Q = p\/100 × Q$/i, 'To find a percent of something: ÷ 100, then × the amount']
];
function simpleWhy(why) {
  if (!why) return why;
  for (const [re, to] of SIMPLE_WHY) if (re.test(why)) return why.replace(re, to);
  return why;
}
const simpleOn = () => { try { return localStorage.getItem('ec-simple') === '1'; } catch (e) { return false; } };
if (typeof document !== 'undefined' && simpleOn()) document.documentElement.classList.add('simple');
function simpleToggleHTML() { return '<button type="button" class="simple-btn" aria-pressed="' + simpleOn() + '" onclick="toggleSimple()"><span class="sw" aria-hidden="true"></span>🧒 Super simple</button>'; }
function toggleSimple() {
  const on = !simpleOn(); try { localStorage.setItem('ec-simple', on ? '1' : '0'); } catch (e) { /* storage blocked */ }
  document.documentElement.classList.toggle('simple', on);
  document.querySelectorAll('.simple-btn').forEach(b => b.setAttribute('aria-pressed', String(on)));
}
function simpleBox(id) {
  const s = SIMPLE[id]; if (!s) return '';
  return '<div class="simple-box"><b>In plain words</b><p>' + s.idea + '</p>' + (s.how && s.how.length ? '<ol>' + s.how.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '') + '</div>';
}
/* ================= units & topics ================= */
const UNITS = [
  { id: 'ineq', name: 'Equations & inequalities', ch: 'Chapter 7' },
  { id: 'lin', name: 'Linear relations', ch: 'Chapter 9 (9A–9H)' },
  { id: 'space', name: 'Transformations, congruence & similarity', ch: 'Chapter 10' },
  { id: 'pct', name: 'Decimals & percentages', ch: 'Chapter 3' }
];
const nl = (op, v, o) => '<div class="qfig">' + nlSVG(op, v, o) + '</div>';
const TOPICS = [
  { id: '7I', unit: 'ineq', name: 'Inequalities', tool: 'numline', bk: ['A8', 'D15'],
    cans: ['Represent and read inequalities on a number line', 'Understand that the sign is reversed when an inequality is reversed', 'Understand that an inequality sign is reversed if both sides are multiplied or divided by a negative number'],
    notes: () => `
<p>An <b>inequality</b> compares two amounts that are not necessarily equal. It has many solutions, often infinitely many.</p>
<table><tr><th>Sign</th><th>Means</th><th>Circle on number line</th></tr>
<tr><td class="m">&lt;</td><td>less than</td><td>open ○ (number not included)</td></tr>
<tr><td class="m">&gt;</td><td>greater than</td><td>open ○</td></tr>
<tr><td class="m">≤</td><td>less than or equal to</td><td>closed ● (number included)</td></tr>
<tr><td class="m">≥</td><td>greater than or equal to</td><td>closed ●</td></tr></table>
<p><span class="hl">x ≥ −2</span> on a number line: a closed circle at −2 and an arrow to the right.</p>${nl('>=', -2)}
<p><span class="hl">x &lt; 3</span>: an open circle at 3 and an arrow to the left.</p>${nl('<', 3)}
<div class="rule-box"><b>Reversing an inequality.</b> If you swap the two sides, the sign turns around: <span class="m">5 &lt; x</span> means the same as <span class="m">x &gt; 5</span>. The pointy end always points to the smaller amount.</div>
<div class="rule-box"><b>Multiplying or dividing by a negative reverses the sign.</b> 3 &lt; 5 is true. Multiply both sides by −2: −6 and −10. But −6 is <i>bigger</i> than −10, so <span class="m">−6 &gt; −10</span>. Adding or subtracting (even a negative number) never reverses the sign.</div>
<h4>Key words</h4>
<table><tr><th>Words</th><th>Sign</th></tr><tr><td>at least, no less than, minimum, no fewer than</td><td class="m">≥</td></tr><tr><td>at most, no more than, maximum, not exceed, up to</td><td class="m">≤</td></tr><tr><td>more than, greater than, above, over, exceeds</td><td class="m">&gt;</td></tr><tr><td>less than, below, under, fewer than</td><td class="m">&lt;</td></tr></table>`,
    ex: [{ q: 'Write “You must be at least 16 years old” as an inequality using a, and show it on a number line.', s: ['“At least 16” means 16 or more, so 16 is included: <b>a ≥ 16</b>.', 'Closed circle at 16, arrow to the right.' + nl('>=', 16, { min: 12, max: 20 })] },
      { q: 'Solve −2x &lt; 6.', s: ['Divide both sides by −2.', 'Dividing by a negative reverses the sign: <b>x &gt; −3</b>.', 'Check with x = 0: −2(0) = 0 &lt; 6 ✓'] },
      { q: 'Which number line shows x ≤ 1?', s: ['≤ includes 1 → closed circle. “Less than” → arrow to the left.' + nl('<=', 1)] }],
    mistakes: ['Drawing a closed circle for &lt; or &gt; (it should be open).', 'Forgetting to reverse the sign when multiplying or dividing by a negative.', 'Reversing the sign when you only <i>add</i> or <i>subtract</i> a negative number. That never reverses it.', 'Reading 5 &gt; x as “x is greater than 5”. It means x is less than 5.'] },

  { id: '7J', unit: 'ineq', name: 'Solving inequalities', tool: 'solver', bk: ['A9', 'E2', 'D5'],
    cans: ['Solve basic inequalities, using an algebraic approach', 'Solve inequalities where I divide or multiply by a negative and graph the solution'],
    notes: () => `
<p>Solve an inequality <b>exactly like an equation</b>: do the same thing to both sides, undoing operations in reverse order. Only one extra rule applies.</p>
<div class="rule-box"><b>The one extra rule.</b> When you multiply or divide both sides by a <b>negative</b> number, <b>reverse the inequality sign</b>.</div>
<table><tr><th>Operation on both sides</th><th>Sign</th></tr><tr><td>+ or − any number</td><td>stays the same</td></tr><tr><td>× or ÷ a positive number</td><td>stays the same</td></tr><tr><td>× or ÷ a negative number</td><td><b class="pen">reverses</b></td></tr></table>
<p><b>Tip.</b> You can avoid dividing by a negative by moving the x term to the other side so it is positive. 5 − 2x &lt; 11 → 5 − 11 &lt; 2x → −6 &lt; 2x → −3 &lt; x → x &gt; −3. Both methods give the same answer.</p>
<p><b>Always check</b> by testing a number from your answer in the original inequality.</p>
<p><b>Word problems:</b> write the inequality, solve it, then decide whether to round <b>up</b> (at least…) or <b>down</b> (at most…) if the answer must be a whole number.</p>`,
    ex: [{ q: 'Solve 4x − 3 ≥ 13 and graph it.', s: solveRel('4x - 3 >= 13').steps.concat([nlSVG('>=', 4)]) },
      { q: 'Solve 5 − 2x &lt; 11.', s: solveRel('5 - 2x < 11').steps.concat([nlSVG('>', -3)]) },
      { q: 'Solve x/3 + 2 ≤ 5.', s: solveRel('x/3 + 2 <= 5').steps.concat([nlSVG('<=', 9)]) },
      { q: 'Jess is paid $12 per hour plus a $50 bonus. She wants to earn at least $300. What is the least number of whole hours she must work?', s: [{ t: '12h + 50 ≥ 300', why: 'Write the inequality' }, { t: '12h ≥ 250', why: 'Subtract 50' }, { t: 'h ≥ 20.83', why: 'Divide by 12' }, { t: 'h = 21 hours', why: '20 hours only gives $290, so round up' }] }],
    mistakes: ['Writing “x = 4” as the answer to an inequality. Keep the sign: x &gt; 4.', 'Forgetting to flip when dividing by a negative (5 − 2x &lt; 11 → x &gt; −3, not x &lt; −3).', 'Rounding the wrong way in word problems.'] },

  { id: 'EQ', unit: 'ineq', name: 'Solving linear equations', tool: 'solver', bk: ['A10', 'E5', 'E7', 'E8'],
    cans: ['Solve linear equations, including fractional answers', 'Solve equations with brackets and with the pronumeral on both sides', 'Check a solution by substituting'],
    notes: () => `
<p>An <b>equation</b> says two expressions are equal. To solve it, keep it balanced: whatever you do to one side, do to the other.</p>
<ul><li><b>Brackets:</b> expand first. 3(x − 4) = 3x − 12.</li>
<li><b>Letter on both sides:</b> subtract the smaller x term from both sides.</li>
<li><b>Fractions:</b> multiply both sides by the denominator. (x − 2)/3 = 5 → x − 2 = 15.</li>
<li><b>Order:</b> undo + and − first, then × and ÷ (the reverse of BIDMAS).</li>
<li>Answers can be fractions: 3x = 4 → x = 4/3 ≈ 1.33.</li></ul>
<div class="rule-box">Check every answer by substituting it back into the original equation. Both sides must give the same number.</div>`,
    ex: [{ q: 'Solve 3(2x − 1) = 4x + 5.', s: solveRel('3(2x - 1) = 4x + 5').steps }, { q: 'Solve (x − 2)/3 = 5.', s: solveRel('(x - 2)/3 = 5').steps }, { q: 'Solve 5x + 1 = 2x + 5 (as a fraction and to 2 d.p.).', s: solveRel('5x + 1 = 2x + 5').steps },
      { q: 'A rectangle is 3 cm longer than it is wide. Its perimeter is 38 cm. Find the width x.', s: solveRel('2(x + x + 3) = 38').steps.concat(['Width 8 cm, length 11 cm, area 88 cm².']) }],
    mistakes: ['Only multiplying the first term in the bracket: 3(x − 4) ≠ 3x − 4.', 'Doing different things to each side.', 'Sign errors when subtracting a negative.'] },

  { id: 'L1', unit: 'lin', name: 'Cartesian plane, tables & plotting', tool: 'graph', bk: ['A4'],
    cans: ['Plot and read points on the Cartesian plane', 'Complete a table of values and graph a linear relation', 'Decide whether a set of points is linear'],
    notes: () => `
<p>The <b>Cartesian plane</b> has a horizontal <b>x-axis</b> and a vertical <b>y-axis</b> that cross at the <b>origin (0, 0)</b>. A point is written (x, y): go <b>across</b> first, then <b>up or down</b>.</p>
<p>The axes make four <b>quadrants</b>, numbered anticlockwise from the top right: 1st (+, +), 2nd (−, +), 3rd (−, −), 4th (+, −).</p>
<h4>Graphing a rule from a table</h4>
<ul><li>Choose x-values (e.g. −1 to 3) and substitute each into the rule to get y.</li><li>Plot the points (x, y).</li><li>If they lie in a straight line, the relation is <b>linear</b>. Rule a line through them and extend it with arrows.</li></ul>
<p>Example: y = 2x − 3</p>${tableHTML([-1, 0, 1, 2, 3], [-5, -3, -1, 1, 3])}
<div class="qfig">${gridSVG({ xmin: -3, xmax: 4, ymin: -7, ymax: 5, lines: [{ m: 2, c: -3 }], points: [-1, 0, 1, 2, 3].map(x => ({ x, y: 2 * x - 3 })), size: 230 })}</div>
<div class="rule-box">In a linear table, y changes by the <b>same amount</b> every time x goes up by 1. That amount is the gradient.</div>`,
    ex: [{ q: 'Complete the table for y = 6 − 2x for x = 0 to 4.', s: ['x = 0: y = 6; x = 1: y = 4; x = 2: y = 2; x = 3: y = 0; x = 4: y = −2.', 'The line falls (negative gradient) and crosses the y-axis at 6.'] }],
    mistakes: ['Plotting (y, x) instead of (x, y).', 'Forgetting that −2 × −1 = +2 when substituting negatives.'] },

  { id: 'L2', unit: 'lin', name: 'Gradient', tool: 'graph', bk: ['A1', 'A12', 'D7'],
    cans: ['Calculate the gradient between two points', 'Find the gradient from a graph', 'Describe positive, negative, zero and undefined gradients'],
    notes: () => `
<div class="rule-box"><span class="m">gradient m = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁)</span></div>
<ul><li><b>Positive</b> gradient: the line goes up from left to right.</li><li><b>Negative</b>: the line goes down from left to right.</li><li><b>Zero</b>: a horizontal line (y = c).</li><li><b>Undefined</b>: a vertical line (x = k), because the run is 0.</li><li>The bigger the number (ignoring the sign), the steeper the line. Parallel lines have equal gradients.</li></ul>
<p><b>From a graph:</b> pick two points where the line crosses grid corners exactly, then count the rise (up is +, down is −) and the run (always go left to right).</p>`,
    ex: [{ q: 'Find the gradient through (1, 2) and (4, 11).', s: ['m = (11 − 2) ÷ (4 − 1) = 9 ÷ 3 = <b>3</b>'] }, { q: 'Find the gradient through (−3, 4) and (−1, −8).', s: ['m = (−8 − 4) ÷ (−1 − (−3)) = −12 ÷ 2 = <b>−6</b>'] }, { q: 'Find the gradient through (2, 7) and (−4, 7).', s: ['m = (7 − 7) ÷ (−4 − 2) = 0 ÷ (−6) = <b>0</b>, a horizontal line.'] }],
    mistakes: ['Putting run over rise.', 'Subtracting the points in a different order on top and bottom.', 'Losing a negative sign when subtracting a negative coordinate.'] },

  { id: 'L3', unit: 'lin', name: 'y = mx + c and intercepts', tool: 'graph', bk: ['A2', 'A11', 'A12', 'D10'],
    cans: ['Identify the gradient and y-intercept from a rule', 'Find the gradient and rule from a graph', 'Find the x-intercept', 'Sketch a line from its rule'],
    notes: () => `
<div class="rule-box"><span class="m">y = mx + c</span> &nbsp; m = gradient, c = y-intercept (where the line crosses the y-axis, x = 0).</div>
<table><tr><th>Rule</th><th>m</th><th>c</th></tr><tr><td class="m">y = 4x − 7</td><td>4</td><td>−7</td></tr><tr><td class="m">y = 9 − 2x</td><td>−2</td><td>9</td></tr><tr><td class="m">y = (1/2)x + 3</td><td>1/2</td><td>3</td></tr><tr><td class="m">y = −x</td><td>−1</td><td>0</td></tr><tr><td class="m">y = 3x</td><td>3</td><td>0 (through the origin)</td></tr></table>
<p><b>Rule from a graph:</b> read c where it crosses the y-axis, find m from rise ÷ run, then write y = mx + c.</p>
<p><b>x-intercept:</b> where the line crosses the x-axis, so <b>put y = 0</b> and solve. For y = −2x + 8: 0 = −2x + 8 → x = 4.</p>
<p><b>Rule through two points:</b> find m, then substitute one point into y = mx + c to find c.</p>
<div class="qfig">${gridSVG({ xmin: -3, xmax: 4, ymin: -3, ymax: 6, lines: [{ m: -2, c: 3, cls: 'b' }], points: [{ x: 0, y: 3, label: '(0, 3)' }, { x: 2, y: -1, label: '(2, −1)' }], size: 220 })}</div>
<p>This line crosses the y-axis at 3 and drops 4 for every 2 across: m = −4 ÷ 2 = −2, so <b>y = −2x + 3</b>.</p>`,
    ex: [{ q: 'State m and c for y = 9 − 2x.', s: ['Rewrite as y = −2x + 9: m = −2, c = 9.'] }, { q: 'Find the x-intercept of y = −2x + 8.', s: solveRel('-2x + 8 = 0').steps }, { q: 'Line 2 passes through (0, −1) and (2, 0). Find its rule.', s: ['c = −1 (crosses the y-axis at −1).', 'm = (0 − (−1)) ÷ (2 − 0) = 1/2.', '<b>y = (1/2)x − 1</b>'] }],
    mistakes: ['Saying m = 9 for y = 9 − 2x. m is the number attached to x.', 'Mixing up the x- and y-intercepts.'] },

  { id: 'L4', unit: 'lin', name: 'Writing rules from tables & situations', tool: 'graph', bk: ['A3', 'A5', 'A6', 'A7', 'D9'],
    cans: ['Write a linear rule from a worded situation', 'Write a linear rule from a table of values', 'Define the pronumerals I use'],
    notes: () => `
<h4>From a table</h4>
<ul><li>If x goes up by 1 each time, the change in y each step is the gradient <b>m</b>.</li><li>The y-value when x = 0 is <b>c</b> (work backwards one step if x = 0 is not in the table).</li></ul>
${tableHTML([0, 1, 2, 3, 4], [5, 8, 11, 14, 17])}<p>Up 3 each time, starts at 5: <b>y = 3x + 5</b>.</p>
<h4>From words</h4>
<table><tr><th>Part of the story</th><th>Becomes</th></tr><tr><td>fixed fee, flag fall, joining fee, starting amount</td><td><b>c</b> (the constant)</td></tr><tr><td>per km, per hour, each week, every minute</td><td><b>m</b> (the gradient)</td></tr><tr><td>drops, uses, leaks, loses</td><td>m is <b>negative</b></td></tr></table>
<p>A taxi charges a $4 fee plus $2.50 per km: <b>C = 4 + 2.5d</b> (C = cost in $, d = distance in km).</p>
<p>A battery is at 80% and drops 5% per hour: <b>B = 80 − 5t</b>.</p>
<p>A submarine is 20 m below sea level and rises 4 m per minute: <b>d = −20 + 4t</b>.</p>`,
    ex: [{ q: 'Find the rule for x: 0, 1, 2, 3 and y: 10, 8, 6, 4.', s: ['y drops by 2 each time: m = −2. When x = 0, y = 10.', '<b>y = 10 − 2x</b>'] }, { q: 'A gym charges a $25 joining fee plus $12 per week. Write a rule.', s: ['C = 25 + 12w, where C is the cost in dollars and w is the number of weeks.'] }],
    mistakes: ['Swapping m and c (the fee is c, the rate is m).', 'Forgetting the negative for something that decreases.', 'Not saying what the letters stand for.'] },

  { id: 'L5', unit: 'lin', name: 'Using rules: substitute, solve & interpret', tool: 'graph', bk: ['A5', 'A6', 'A7', 'A11', 'E1', 'E6'],
    cans: ['Use a rule to find values', 'Solve for the unknown and interpret answers in context', 'Test whether a point is on a line', 'Compare two linear rules (when are they equal?)'],
    notes: () => `
<ul><li><b>Find the output:</b> substitute. A = 45 + 15w; after 8 weeks A = 45 + 15 × 8 = $165.</li>
<li><b>Find the input:</b> make an equation and solve. When is A = 300? 300 = 45 + 15w → w = 17 weeks.</li>
<li><b>Interpret m:</b> the rate (“she saves $15 per week”). <b>Interpret c:</b> the starting value or fixed fee.</li>
<li><b>Point on a line?</b> Substitute x. If you get the y-value, yes. (3, 2) on y = −2x + 8: −2(3) + 8 = 2 ✓.</li>
<li><b>Comparing two rules:</b> set them equal to find when they are the same, then check which is cheaper either side.</li>
<li><b>Is the model sensible?</b> Think about the real situation: a negative amount of data or a car-hire cost for 0 km may not make sense.</li></ul>`,
    ex: [{ q: 'Plumber A: $65 + $48/h. Plumber B: $30 + $60/h. When do they charge the same?', s: solveRel('65 + 48h = 30 + 60h').steps.concat(['After about 2.92 hours. For longer jobs Plumber A is cheaper because the hourly rate is lower.']) },
      { q: 'A phone plan has 20 GB, used at 0.8 GB per day. When will all the data be used?', s: solveRel('20 - 0.8d = 0').steps }],
    mistakes: ['Substituting into the wrong letter.', 'Giving 216.666… km instead of rounding as asked.'] },

  { id: '10A', unit: 'space', name: 'Reflection', tool: 'trans', bk: ['C1', 'C3', 'C14', 'D1'],
    cans: ['Draw the image of a point or shape that is reflected in a mirror line, or on a number plane'],
    notes: () => `
<p>A <b>reflection</b> flips a shape over a <b>mirror line</b>. Each image point is the same distance from the mirror as the original, on the opposite side, measured at right angles to the mirror. The image is congruent but faces the other way.</p>
<table><tr><th>Mirror line</th><th>Rule</th><th>Example</th></tr>
<tr><td>x-axis</td><td class="m">(x, y) → (x, −y)</td><td>(4, 1) → (4, −1)</td></tr>
<tr><td>y-axis</td><td class="m">(x, y) → (−x, y)</td><td>(−2, 5) → (2, 5)</td></tr>
<tr><td>y = x</td><td class="m">(x, y) → (y, x)</td><td>(3, −1) → (−1, 3)</td></tr>
<tr><td>x = k</td><td class="m">(x, y) → (2k − x, y)</td><td>in x = 2: (5, 1) → (−1, 1)</td></tr>
<tr><td>y = k</td><td class="m">(x, y) → (x, 2k − y)</td><td>in y = 1: (2, 4) → (2, −2)</td></tr></table>
<p>Points on the mirror line do not move. The image of A is called <b>A′</b> (“A prime” or “A dash”).</p>
<div class="qfig">${gridSVG({ xmin: -6, xmax: 6, ymin: -4, ymax: 5, mirrors: [{ t: 'y-axis' }], polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['D', 'E', 'F'] }, { pts: [[-1, 1], [-4, 1], [-1, 3]], labels: ['D′', 'E′', 'F′'], cls: 'b' }], size: 260 })}</div>`,
    ex: [{ q: 'Reflect (−6, −3) in the x-axis.', s: ['Change the sign of y: <b>(−6, 3)</b>.'] }, { q: 'Reflect triangle D(1, 1), E(4, 1), F(1, 3) in the y-axis.', s: ['Change the sign of each x: <b>D′(−1, 1), E′(−4, 1), F′(−1, 3)</b>.'] }],
    mistakes: ['Mixing up the axes: reflecting in the x-axis changes the y-coordinate.', 'Measuring the distance to the mirror diagonally instead of at right angles.'] },

  { id: '10B', unit: 'space', name: 'Translation', tool: 'trans', bk: ['C2', 'C3', 'C14', 'D4'],
    cans: ['Determine the vector that moves a given point to its image', 'Draw the image of an object after it has been translated by a vector', 'Describe a combination of two transformations'],
    notes: () => `
<p>A <b>translation</b> slides every point the same distance in the same direction. It is described by a <b>vector (a, b)</b>:</p>
<ul><li><b>a</b>: positive → right, negative → left</li><li><b>b</b>: positive → up, negative → down</li></ul>
<div class="rule-box"><span class="m">(x, y) → (x + a, y + b)</span> &nbsp;&nbsp; vector = image − original</div>
<p>(−5, 3) means 5 units left and 3 units up. (−3, −5) means 3 left and 5 down.</p>
<p><b>Finding the vector:</b> X(2, 1) → X′(−3, 5). a = −3 − 2 = −5, b = 5 − 1 = 4, so the vector is <b>(−5, 4)</b>. Apply the same vector to the other vertices.</p>
<p><b>Combinations:</b> do the first transformation, label the image with one prime (′), then apply the second to get the double-prime (″) image.</p>`,
    ex: [{ q: 'Translate A(1, 2), B(4, 2), C(3, 5) by (3, −2).', s: ['Add 3 to each x and subtract 2 from each y: <b>A′(4, 0), B′(7, 0), C′(6, 3)</b>.'] }, { q: 'A(2, 1) → A′(−2, 1) → A″(−2, −4). Describe the two steps.', s: ['Step 1: x changes sign, y stays: reflection in the y-axis.', 'Step 2: y drops by 5: translation by (0, −5).'] }],
    mistakes: ['Mixing up the order (a is horizontal, b is vertical).', 'Subtracting image − original the wrong way round when finding the vector.'] },

  { id: '10C', unit: 'space', name: 'Rotation', tool: 'trans', bk: [],
    cans: ['Draw the result of a rotation', 'State the centre, angle and direction of a rotation'],
    notes: () => `
<p>A <b>rotation</b> turns a shape about a fixed point, the <b>centre of rotation</b>. To describe it, give the <b>centre</b>, the <b>angle</b> and the <b>direction</b> (clockwise ↻ or anticlockwise ↺).</p>
<table><tr><th>About the origin</th><th>Rule</th><th>(2, 3) becomes</th></tr>
<tr><td>90° clockwise</td><td class="m">(x, y) → (y, −x)</td><td>(3, −2)</td></tr>
<tr><td>90° anticlockwise</td><td class="m">(x, y) → (−y, x)</td><td>(−3, 2)</td></tr>
<tr><td>180°</td><td class="m">(x, y) → (−x, −y)</td><td>(−2, −3)</td></tr></table>
<ul><li>90° clockwise is the same as 270° anticlockwise. 180° is the same either way.</li><li><b>Tracing-paper method:</b> trace the shape, pin the centre with your pencil, turn the paper through the angle, then mark the new corners.</li><li>Every point stays the same distance from the centre. The image is congruent.</li></ul>
<div class="qfig">${gridSVG({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['A', 'B', 'C'] }, { pts: [[1, -1], [1, -4], [3, -1]], labels: ['A′', 'B′', 'C′'], cls: 'b' }], size: 240 })}</div><p class="small muted">Triangle ABC rotated 90° clockwise about the origin.</p>`,
    ex: [{ q: 'Rotate (−4, 1) 180° about the origin.', s: ['Change both signs: <b>(4, −1)</b>.'] }, { q: 'Rotate (5, 2) 90° anticlockwise about the origin.', s: ['(x, y) → (−y, x): <b>(−2, 5)</b>.'] }],
    mistakes: ['Mixing the clockwise and anticlockwise rules.', 'Forgetting to say the centre of rotation when describing it.'] },

  { id: '10D', unit: 'space', name: 'Congruent figures', tool: 'cong', bk: ['C5', 'C14'],
    cans: ['Identify congruent figures (shapes)', 'Name corresponding pairs of vertices, sides and angles in congruent shapes', 'Find unknown sides and angles in congruent triangles'],
    notes: () => `
<p><b>Congruent</b> figures have exactly the same shape and size. One can be placed exactly on top of the other using reflections, rotations and translations. Symbol: <b>≅</b>.</p>
<div class="rule-box">In a congruence statement the vertices are listed in <b>matching order</b>. △ABC ≅ △PQR means A ↔ P, B ↔ Q, C ↔ R, so AB = PQ, BC = QR, AC = PR and ∠A = ∠P, ∠B = ∠Q, ∠C = ∠R.</div>
<p><b>Finding unknowns:</b> match the parts, copy the known value across, and use the angle sum of a triangle (180°) for missing angles.</p>
<p>Example: △JKL ≅ △MNP with JK = 8 cm, KL = 11 cm, ∠J = 52°, ∠K = 78°. Then MN = 8 cm, NP = 11 cm, ∠N = 78°, and ∠P = ∠L = 180 − 52 − 78 = 50°.</p>
<p>When a triangle has been reflected, the letters go the other way round. Match the parts using the equal sides and angles, not their position on the page.</p>`,
    ex: [{ q: 'Booklet C5: triangle ABC has AB = 6, BC = 11, AC = 9, ∠B = 45°, ∠C = 70°. Triangle DEF has DF = 9, FE = 11, DE = y, ∠F = 70°, ∠E = 45° and ∠D = x°. Find x and y.', s: ['Match by the equal angles: ∠B = ∠E = 45° and ∠C = ∠F = 70°, so A ↔ D, B ↔ E, C ↔ F and △ABC ≅ △DEF. (The second triangle is a reflection.)', 'x = ∠D = ∠A = 180 − 45 − 70 = <b>65</b> (angle sum).', 'y = DE, which matches AB = <b>6 cm</b>.'] }],
    mistakes: ['Matching parts by where they sit on the page rather than by the congruence statement.'] },

  { id: '10E', unit: 'space', name: 'Congruent triangles', tool: 'cong', bk: ['C4', 'D2'],
    cans: ['Determine which congruence test should be used to determine if two triangles are congruent (SSS, SAS, AAS and RHS)', 'Explain why AAA and SSA are not congruence tests'],
    notes: () => `
<table><tr><th>Test</th><th>You need</th></tr>
<tr><td><b>SSS</b></td><td>all three pairs of sides equal</td></tr>
<tr><td><b>SAS</b></td><td>two pairs of sides equal and the <b>included</b> angle (the angle between those sides) equal</td></tr>
<tr><td><b>AAS</b></td><td>two pairs of angles equal and one pair of <b>matching</b> sides equal</td></tr>
<tr><td><b>RHS</b></td><td>a right angle, the hypotenuse, and one other pair of sides equal</td></tr></table>
<div class="rule-box"><b>Not tests:</b> AAA only proves the triangles are <i>similar</i> (same shape, possibly different size). SSA, where the angle is not between the sides, can make two different triangles.</div>
<p><b>Setting out a proof:</b> list each pair of equal parts with a reason (given, common side, vertically opposite, alternate angles…), name the test, then write the statement with vertices in matching order.</p>`,
    ex: [{ q: 'Triangle PQR: PQ = 5, ∠Q = 40°, QR = 9. Triangle XYZ: XY = 5, ∠Y = 40°, YZ = 9.', s: ['Two sides and the angle between them: <b>SAS</b>. △PQR ≅ △XYZ.'] }, { q: 'Both triangles have angles 40°, 60°, 80°.', s: ['Not enough information: equal angles only show the triangles are similar.'] }],
    mistakes: ['Using SAS when the angle is not between the two sides.', 'Calling AAA a congruence test.'] },

  { id: '10G', unit: 'space', name: 'Congruence & quadrilaterals', tool: 'cong', bk: ['C10', 'C11', 'E5', 'D11', 'D16'],
    cans: ['Prove properties of special quadrilaterals using facts about congruent triangles', 'Use properties of parallelograms, rhombuses, kites, trapeziums and rectangles to find unknowns'],
    notes: () => `
<div class="scroll-x"><table><tr><th>Shape</th><th>Sides</th><th>Angles</th><th>Diagonals</th></tr>
<tr><td><b>Parallelogram</b></td><td>opposite sides parallel and equal</td><td>opposite angles equal; neighbouring angles add to 180°</td><td>bisect each other</td></tr>
<tr><td><b>Rectangle</b></td><td>as parallelogram</td><td>all 90°</td><td>bisect each other and are <b>equal</b></td></tr>
<tr><td><b>Rhombus</b></td><td>all four equal, opposite sides parallel</td><td>opposite angles equal</td><td>bisect each other at <b>90°</b> and bisect the vertex angles</td></tr>
<tr><td><b>Square</b></td><td>all equal</td><td>all 90°</td><td>equal, bisect each other at 90°</td></tr>
<tr><td><b>Kite</b></td><td>two pairs of equal <b>adjacent</b> sides</td><td>one pair of opposite angles equal (between the unequal sides)</td><td>meet at 90°; the diagonal that is the line of symmetry cuts the other one in half</td></tr>
<tr><td><b>Trapezium</b></td><td>one pair of parallel sides</td><td>co-interior angles between the parallel sides add to 180°</td><td>no special property</td></tr></table></div>
<h4>Angle facts you will use</h4>
<ul><li>Alternate angles (Z shape) are equal when lines are parallel. Corresponding angles (F shape) are equal. Co-interior angles (C shape) add to 180°.</li><li>Vertically opposite angles are equal. Angles in a quadrilateral add to 360°.</li></ul>
<h4>Proof example: opposite sides of a parallelogram are equal</h4>
<p>Draw diagonal AC in parallelogram ABCD. ∠BAC = ∠DCA (alternate, AB ∥ DC), ∠BCA = ∠DAC (alternate, AD ∥ BC), AC is common. So △ABC ≅ △CDA (AAS). Therefore AB = CD and BC = DA.</p>`,
    ex: [{ q: 'In parallelogram PQRS, ∠P = 68°. Find ∠Q, ∠R and ∠S.', s: ['∠R = 68° (opposite angles equal).', '∠Q = ∠S = 180 − 68 = 112° (co-interior angles).'] }, { q: 'Opposite angles of a parallelogram are (3x + 10)° and (2x + 30)°. Find x.', s: solveRel('3x + 10 = 2x + 30').steps.concat(['Angles: 70° each; the other two are 110° each.']) }],
    mistakes: ['Thinking both diagonals of a kite are bisected (only the short one is).', 'Thinking a rectangle’s diagonals meet at 90° (only in a square).'] },

  { id: '10H', unit: 'space', name: 'Similar figures', tool: 'sim', bk: ['D14'],
    cans: ['Remember that similar figures have the same shape (angles, ratio of sides) but different size', 'Identify corresponding features of similar figures', 'Find the scale factor in a pair of similar figures', 'Find unknown side lengths using scale factor'],
    notes: () => `
<p><b>Similar</b> figures have the same shape but can be different sizes. One is an enlargement or reduction of the other. Symbol: <b>~</b> (or |||).</p>
<ul><li>Matching angles are equal.</li><li>Matching sides are in the same ratio.</li></ul>
<div class="rule-box"><span class="m">scale factor k = image length ÷ original length</span><br>k &gt; 1 enlarges, 0 &lt; k &lt; 1 reduces, k = 1 means congruent.</div>
<ul><li>Small → big: <b>multiply</b> by k. Big → small: <b>divide</b> by k.</li><li>Check similarity by working out every ratio of matching sides. They must all be the same.</li></ul>
<p>A 4 × 6 rectangle and a 6 × 9 rectangle: 6 ÷ 4 = 1.5 and 9 ÷ 6 = 1.5, so they are similar with k = 1.5.</p>`,
    ex: [{ q: 'Two triangles are similar with scale factor 3. A side of 4 cm in the smaller one matches which length?', s: ['4 × 3 = <b>12 cm</b>.'] }, { q: '△KLM ~ △PQR. KL = 5, LM = 7, PQ = 12.5. Find QR.', s: ['k = 12.5 ÷ 5 = 2.5.', 'QR = 7 × 2.5 = <b>17.5 cm</b>.'] }],
    mistakes: ['Adding the difference instead of multiplying by the scale factor.', 'Dividing the wrong way (small ÷ big).'] },

  { id: '10I', unit: 'space', name: 'Similar triangles', tool: 'sim', bk: ['C6', 'C7', 'C8', 'C9', 'E8'],
    cans: ['Choose a similarity test (AAA, SSS, SAS, RHS), find the scale factor and write a similarity statement', 'Find unknown sides in similar triangles, including overlapping and crossing triangles', 'Solve shadow and height problems'],
    notes: () => `
<table><tr><th>Test</th><th>You need</th></tr><tr><td><b>AAA</b> (or AA)</td><td>all angles equal (two is enough, since the third must match)</td></tr><tr><td><b>SSS</b></td><td>all three pairs of sides in the same ratio</td></tr><tr><td><b>SAS</b></td><td>two pairs of sides in the same ratio and the included angles equal</td></tr><tr><td><b>RHS</b></td><td>right angle, and hypotenuses and one other pair of sides in the same ratio</td></tr></table>
<h4>Overlapping triangles (DE ∥ BC)</h4>
<div class="qfig">${parallelTriSVG({ AD: 4, AE: 5, DE: 6, DB: 'x', EC: 'y', BC: 15 })}</div>
<p>∠A is common and ∠ADE = ∠ABC (corresponding angles), so △ADE ~ △ABC. k = 15 ÷ 6 = 2.5. <b>Use whole sides:</b> AB = 4 × 2.5 = 10, so x = 10 − 4 = 6. AC = 5 × 2.5 = 12.5, so y = 7.5.</p>
<h4>Crossing (hourglass) triangles</h4>
<p>If AC and BD cross at E and AB ∥ DC: ∠AEB = ∠CED (vertically opposite) and ∠BAE = ∠DCE (alternate), so △ABE ~ △CDE.</p>
<h4>Shadows</h4>
<p>At the same time of day, objects and their shadows form similar triangles: height ÷ shadow is the same for all of them. A 4.5 m flagpole has a 3 m shadow; a tree’s shadow is 8 m. k = 8 ÷ 3, so the tree is 4.5 × 8 ÷ 3 = 12 m tall.</p>`,
    ex: [{ q: 'Right triangles: ABC with AB = 6, AC = 8, BC = 10; DEF with DE = 9, DF = 12, EF = 15. Similar?', s: ['9 ÷ 6 = 12 ÷ 8 = 15 ÷ 10 = 1.5, so they are similar by <b>SSS</b>, with k = 1.5. △ABC ~ △DEF.'] }, { q: 'DE ∥ BC, AD = 6, DB = x, AE = 9, AC = 3x. Find x.', s: ['AB/AD = AC/AE: (6 + x)/6 = 3x/9.', solveRel('9(6 + x) = 18x').steps.map(s => s.t).join(' → '), '<b>x = 6</b>'] }],
    mistakes: ['Using the part DB instead of the whole side AB in overlapping triangles.', 'Writing the similarity statement with the letters in the wrong order.'] },

  { id: 'XYZ', unit: 'space', name: '3D coordinates', tool: 'xyz', bk: ['C12', 'C13', 'D12'],
    cans: ['Locate and describe positions in 3D using (x, y, z) coordinates'],
    notes: () => `
<p>In 3D every point has three coordinates <b>(x, y, z)</b>. In the booklet the x-axis comes towards you, the y-axis goes to the right and the z-axis goes up. The origin is O(0, 0, 0).</p>
<ul><li>On the <b>x-axis</b>: y = 0 and z = 0, e.g. (4, 0, 0). On the <b>y-axis</b>: (0, 6, 0). On the <b>z-axis</b>: (0, 0, 5).</li><li>On the <b>floor</b> (the xy-plane): z = 0, e.g. (4, 2, 0).</li><li>To find (3, 5, 2): go 3 along x, 5 along y, then 2 up.</li><li>Moving straight up only changes z.</li></ul>
<div class="qfig">${boxSVG(2, 4, 3, true, { A: 1, B: 1, F: 1, G: 1 })}</div><p class="small muted">A box 2 long (x), 4 wide (y) and 3 high (z) with a corner at the origin.</p>`,
    ex: [{ q: 'A cube of side 3 sits at the origin. Find the corner furthest from the origin.', s: ['Go 3 along every axis: <b>(3, 3, 3)</b>. The corners on the axes are (3, 0, 0), (0, 3, 0) and (0, 0, 3).'] }],
    mistakes: ['Mixing up the order (x, y, z).', 'Changing x or y when something only moves up.'] },

  { id: '3F', unit: 'pct', name: 'Terminating, recurring & rounding decimals', tool: 'fdp', bk: [],
    cans: ['Convert fractions to terminating or recurring decimals', 'Round terminating or recurring decimals'],
    notes: () => `
<p>To change a fraction to a decimal, <b>divide the numerator by the denominator</b>. Short division works well: add a decimal point and zeros.</p>
<ul><li><b>Terminating</b> decimals stop: 5/8 = 0.625.</li><li><b>Recurring</b> decimals repeat forever: 1/3 = 0.333…, 3/11 = 0.2727…, 7/12 = 0.58333….</li></ul>
<div class="rule-box"><b>Notation.</b> Put a dot above a single repeating digit (0.3̇), or dots above the first and last digits of a repeating block (0.2̇7̇). Some books use a bar. On this page a line over the digits shows the repeat: 1/3 = 0.<span class="rep">3</span>, 3/11 = 0.<span class="rep">27</span>, 7/12 = 0.58<span class="rep">3</span>.</div>
<p><b>Will it terminate?</b> Simplify the fraction. If the denominator’s only prime factors are 2 and 5, it terminates (8 = 2 × 2 × 2 ✓; 12 = 2 × 2 × 3 ✗).</p>
<h4>Rounding</h4>
<ul><li>Find the place you are rounding to and look at the <b>next</b> digit. 5 or more: round up. 4 or less: leave it.</li><li>For recurring decimals, write out a few extra digits first: 2/3 = 0.6666… ≈ 0.667 (3 d.p.).</li><li>Keep trailing zeros that are asked for: 2.396 to 2 d.p. is 2.40.</li></ul>`,
    ex: [{ q: 'Write 3/8 as a decimal.', s: ['3 ÷ 8 = 0.375 (8 = 2³, so it terminates).'] }, { q: 'Write 5/6 as a decimal rounded to 2 d.p.', s: ['5 ÷ 6 = 0.8333… = 0.8<span class="rep">3</span>', 'The third digit is 3, so round down: <b>0.83</b>.'] }],
    mistakes: ['Dividing the denominator by the numerator.', 'Writing 0.83 for 5/6 and calling it exact.'] },

  { id: '3G', unit: 'pct', name: 'Converting fractions, decimals & percentages', tool: 'fdp', bk: [],
    cans: ['Convert percentages to fractions or decimals', 'Convert fractions to percentages', 'Convert decimals to percentages'],
    notes: () => `
<table><tr><th>From → to</th><th>How</th><th>Example</th></tr>
<tr><td>% → fraction</td><td>write over 100 and simplify</td><td>35% = 35/100 = 7/20</td></tr>
<tr><td>% → decimal</td><td>÷ 100 (point 2 places left)</td><td>7% = 0.07</td></tr>
<tr><td>fraction → %</td><td>× 100</td><td>3/8 × 100 = 37.5%</td></tr>
<tr><td>decimal → %</td><td>× 100 (point 2 places right)</td><td>0.625 = 62.5%</td></tr>
<tr><td>decimal → fraction</td><td>use place value, simplify</td><td>0.35 = 35/100 = 7/20</td></tr></table>
<p><b>Decimal percentages:</b> 12.5% = 12.5/100 = 125/1000 = 1/8.</p>
<h4>Learn these</h4>
<table><tr><th>Fraction</th><th>Decimal</th><th>%</th></tr><tr><td>1/2</td><td>0.5</td><td>50%</td></tr><tr><td>1/4</td><td>0.25</td><td>25%</td></tr><tr><td>3/4</td><td>0.75</td><td>75%</td></tr><tr><td>1/5</td><td>0.2</td><td>20%</td></tr><tr><td>1/8</td><td>0.125</td><td>12.5%</td></tr><tr><td>1/10</td><td>0.1</td><td>10%</td></tr><tr><td>1/20</td><td>0.05</td><td>5%</td></tr><tr><td>1/3</td><td>0.<span class="rep">3</span></td><td>33.<span class="rep">3</span>%</td></tr><tr><td>2/3</td><td>0.<span class="rep">6</span></td><td>66.<span class="rep">6</span>%</td></tr></table>`,
    ex: [{ q: 'Write 62.5% as a fraction.', s: ['62.5/100 = 625/1000 = <b>5/8</b>.'] }, { q: 'Write 7/20 as a percentage.', s: ['7/20 × 100 = 35%.'] }],
    mistakes: ['Writing 7% as 0.7 (it is 0.07).', 'Not simplifying the fraction fully.'] },

  { id: '3H', unit: 'pct', name: 'Finding & expressing percentages', tool: 'pct', bk: ['B1', 'B2', 'D3', 'D6', 'D13'],
    cans: ['Express one quantity as a percentage of another, including converting units', 'Find a certain percentage of a quantity (e.g. 35% of $80)', 'Express one quantity as a percentage of another by multiplying by 100/1'],
    notes: () => `
<div class="rule-box"><span class="m">p% of Q = p/100 × Q</span> &nbsp;&nbsp; <span class="m">a as a % of b = a/b × 100/1</span></div>
<h4>Mental shortcuts</h4><ul><li>10%: ÷ 10. 5%: half of 10%. 1%: ÷ 100. 20%: double 10%.</li><li>25%: ÷ 4. 50%: ÷ 2. 75%: 3 × 25%. 12.5%: ÷ 8.</li><li>35% of $80 = 30% ($24) + 5% ($4) = $28.</li></ul>
<h4>Same units first!</h4>
<table><tr><th>Convert</th><th></th></tr><tr><td>1 kg = 1000 g</td><td>1 L = 1000 mL</td></tr><tr><td>1 m = 100 cm</td><td>1 km = 1000 m</td></tr><tr><td>1 h = 60 min</td><td>1 min = 60 s</td></tr><tr><td>$1 = 100c</td><td>1 cm = 10 mm</td></tr></table>
<p>600 mL out of 2 L: 2 L = 2000 mL, so 600/2000 × 100 = <b>30%</b>.</p>
<p>80 seconds out of 4 minutes: 4 min = 240 s, so 80/240 × 100 = <b>33.33%</b>.</p>`,
    ex: [{ q: 'Find 7.5% of $80.', s: ['0.075 × 80 = <b>$6</b>.'] }, { q: 'Express 150 g as a percentage of 1.2 kg.', s: ['1.2 kg = 1200 g.', '150 ÷ 1200 × 100 = <b>12.5%</b>.'] }],
    mistakes: ['Not converting units first (45 cm of 3 m is 15%, not 1500%).', 'Dividing the wrong way round.'] },

  { id: '3I', unit: 'pct', name: 'Increasing & decreasing by a percentage', tool: 'pct', bk: ['B3', 'B6', 'B9', 'B10', 'B11'],
    cans: ['Understand the terms: discount, mark-up, profit, loss, selling price, retail price and wholesale price', 'Find the new value if an amount is increased or decreased by a given percentage', 'Solve profit, loss, discount and GST problems'],
    notes: () => `
<table><tr><th>Term</th><th>Meaning</th></tr>
<tr><td>Cost price / wholesale price</td><td>what the shop pays for the item</td></tr><tr><td>Retail price / marked price</td><td>the price on the label for customers</td></tr><tr><td>Selling price</td><td>what the customer actually pays</td></tr>
<tr><td>Mark-up</td><td>amount added to the cost price to get the retail price</td></tr><tr><td>Discount</td><td>amount taken off the marked price</td></tr>
<tr><td>Profit</td><td>selling price − cost price (when positive)</td></tr><tr><td>Loss</td><td>cost price − selling price (when you sell for less)</td></tr>
<tr><td>GST</td><td>Goods and Services Tax: 10% in Australia</td></tr><tr><td>Commission</td><td>a % of sales paid to a salesperson</td></tr></table>
<h4>Two methods</h4>
<p><b>1. Find the amount, then add or subtract:</b> 12% of $250 = $30, so $250 + $30 = $280.</p>
<p><b>2. Multiplier (fastest):</b></p>
<div class="rule-box">Increase by p%: × (1 + p/100). &nbsp; +12% → × 1.12 &nbsp; +10% GST → × 1.1<br>Decrease by p%: × (1 − p/100). &nbsp; −35% → × 0.65 &nbsp; 15% discount → × 0.85</div>
<p><b>Removing GST:</b> a GST-inclusive price is 110% of the original, so <b>divide by 1.1</b>. $176 ÷ 1.1 = $160. (Taking 10% off $176 gives $158.40, which is wrong.)</p>
<p><b>Profit or loss %</b> = profit (or loss) ÷ <b>cost price</b> × 100.</p>`,
    ex: [{ q: 'Decrease $1250 by 35%.', s: ['1250 × 0.65 = <b>$812.50</b>.'] }, { q: 'A shop buys an item for $40 and sells it for $52. Find the profit %.', s: ['Profit = $12. 12 ÷ 40 × 100 = <b>30%</b>.'] }, { q: 'A bike costs $250, is marked up 45%, then discounted 10%. Find the sale price.', s: ['250 × 1.45 = $362.50 (marked price).', '362.50 × 0.9 = <b>$326.25</b>.'] }],
    mistakes: ['Removing GST by taking off 10%.', 'Calculating profit % from the selling price instead of the cost price.'] },

  { id: '3J', unit: 'pct', name: 'Calculating percentage change', tool: 'pct', bk: ['B4', 'D8'],
    cans: ['Calculate the percentage increase when prices are increased', 'Calculate the percentage decrease when prices are decreased'],
    notes: () => `
<div class="rule-box"><span class="m">% change = change ÷ ORIGINAL × 100</span></div>
<ul><li>Change = new − original. Positive → increase; negative → decrease.</li><li>Always divide by the <b>original</b> (old, starting) value, never the new one.</li><li>State whether it is an increase or a decrease.</li></ul>
<p>$80 → $100: change $20, 20 ÷ 80 × 100 = <b>25% increase</b>.</p>
<p>$450 → $360: change −$90, 90 ÷ 450 × 100 = <b>20% decrease</b>.</p>
<p>$1899 → $1520: 379 ÷ 1899 × 100 = <b>19.96% decrease</b>.</p>`,
    ex: [{ q: '52 kg to 46.8 kg.', s: ['Change = 5.2 kg. 5.2 ÷ 52 × 100 = <b>10% decrease</b>.'] }, { q: '$2.50 to $3.10.', s: ['Change = $0.60. 0.6 ÷ 2.5 × 100 = <b>24% increase</b>.'] }],
    mistakes: ['Dividing by the new value: $50 → $40 is a 20% decrease, not 25%.'] },

  { id: '3K', unit: 'pct', name: 'Unitary method & reverse percentages', tool: 'pct', bk: ['B5', 'B7', 'B8', 'B12', 'B13', 'B14', 'E3', 'E4'],
    cans: ['Use the unitary method to find the value of one unit (e.g. 1%)', 'Solve percentage problems using the unitary method', 'Find the original amount after a percentage change', 'Solve multi-step worded percentage problems'],
    notes: () => `
<div class="rule-box"><b>Unitary method:</b> find <b>1%</b> first, then multiply to get the % you want.</div>
<p>8% of the students is 36. 1% = 36 ÷ 8 = 4.5, so 100% = 450 students.</p>
<p>15% of a bill is $27. 1% = $1.80, so 4% = $7.20.</p>
<h4>Finding the original amount (reverse percentage)</h4>
<p>After a 20% increase the price is $144. The new price is <b>120%</b> of the original. 1% = 144 ÷ 120 = 1.2, so 100% = $120. Shortcut: <b>new ÷ multiplier</b> = 144 ÷ 1.2 = $120.</p>
<p>After a 15% discount the price is $68: 68 ÷ 0.85 = $80.</p>
<div class="rule-box"><b>Successive changes multiply.</b> +25% then −20%: 1.25 × 0.8 = 1, so no change overall (0%), not +5%. The 20% is taken from the new, larger amount.</div>
<p>20% off, then a further 10% off: 0.8 × 0.9 = 0.72, which is a 28% discount overall (not 30%).</p>`,
    ex: [{ q: 'A town’s population fell by 8% to 4600. Find the population before.', s: ['4600 is 92% of the original. 4600 ÷ 0.92 = <b>5000</b>.'] }, { q: 'Boots were marked up 30% then discounted 10%. Sale price $351. Find the cost price.', s: ['1.30 × 0.90 = 1.17. 351 ÷ 1.17 = <b>$300</b>.'] }],
    mistakes: ['Taking the % off the new amount to get back (20% of $144 off gives $115.20, which is wrong).', 'Adding successive percentages.'] }
];
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));

/* ================= booklet checklist ================= */
const CHECKLIST = [
  ['Linear relations', [
    ['I can calculate the gradient between two points', 'A1', 'L2'], ['I can identify the gradient and y-intercept from a rule', 'A2', 'L3'],
    ['I can write a linear rule from a worded situation or table of values', 'A3, A5–A7', 'L4'], ['I can complete a table of values and graph a linear relation', 'A4', 'L1'],
    ['I can use a rule to find values, solve for the unknown and interpret answers in context', 'A5–A7, E1, E6', 'L5'], ['I can write an inequality from a situation and show it on a number line', 'A8, E2', '7I'],
    ['I can solve one-variable inequalities (including dividing by a negative) and graph them', 'A9', '7J'], ['I can solve linear equations, including fractional answers', 'A10, E7', 'EQ'],
    ['I can find the gradient and rule from a graph; test whether a point is on a line', 'A11, A12', 'L3']]],
  ['Percentage', [
    ['I can find a percentage of an amount', 'B1', '3H'], ['I can express one quantity as a percentage of another (convert units first)', 'B2', '3H'], ['I can increase or decrease an amount by a percentage', 'B3', '3I'],
    ['I can calculate percentage change (increase or decrease)', 'B4', '3J'], ['I can use the unitary method', 'B5', '3K'], ['I can solve profit, loss, discount and GST problems', 'B6, B9, B11', '3I'],
    ['I can find the original amount after a percentage change', 'B7, B13, B14', '3K'], ['I can solve multi-step worded percentage problems', 'B8–B14, E3, E4', '3K']]],
  ['Space', [
    ['I can reflect and translate points and shapes on the Cartesian plane', 'C1–C3, C14', '10A'], ['I can describe a transformation, including a combination of two', 'C2, C14', '10B'],
    ['I can choose and justify a congruence test (SSS, SAS, AAS, RHS)', 'C4', '10E'], ['I can find unknown sides and angles in congruent triangles', 'C5', '10D'],
    ['I can choose a similarity test, find the scale factor and write a similarity statement', 'C6', '10I'], ['I can find unknown sides in similar triangles (including overlapping and crossing triangles)', 'C7, C8, C9, E8', '10I'],
    ['I can use properties of parallelograms, rhombuses, kites, trapeziums and rectangles', 'C10, C11, E5', '10G'], ['I can locate and describe positions in 3D using (x, y, z) coordinates', 'C12, C13', 'XYZ']]]
];

/* ================= booklet ================= */
const fig = s => '<div class="qfig">' + s + '</div>';
const BK_DIAGRAMS = {
  A4: () => '<div class="grid2">' + fig(gridSVG({ xmin: -3, xmax: 4, ymin: -7, ymax: 5, size: 220 })) + fig(gridSVG({ xmin: -2, xmax: 5, ymin: -4, ymax: 8, size: 220 })) + '</div>',
  A12: () => '<div class="grid2"><div><b>Line 1</b>' + fig(gridSVG({ xmin: -3, xmax: 4, ymin: -3, ymax: 6, lines: [{ m: -2, c: 3, from: -1, to: 3, cls: 'b' }], size: 220 })) + '</div><div><b>Line 2</b>' + fig(gridSVG({ xmin: -3, xmax: 5, ymin: -3, ymax: 3, lines: [{ m: 0.5, c: -1, from: -2, to: 4, cls: 'b' }], size: 220 })) + '</div></div>',
  C3: () => fig(gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['D', 'E', 'F'] }], size: 300 })),
  C5: () => fig(triPairSVG({ w: 560, h: 190, label: 'Two congruent triangles ABC and DFE', tris: [
    { pts: [[60, 160], [130, 40], [270, 160]], names: ['B', 'A', 'C'], sides: ['6 cm', '9 cm', '11 cm'], angles: ['45°', '', '70°'] },
    { pts: [[320, 160], [470, 40], [530, 160]], names: ['F', 'D', 'E'], sides: ['9 cm', 'y cm', '11 cm'], angles: ['70°', 'x°', '45°'] }] })),
  C6: () => fig(triPairSVG({ w: 460, h: 175, label: 'Right triangles ABC and DEF', tris: [
    { pts: [[50, 150], [50, 78], [146, 150]], names: ['A', 'B', 'C'], sides: ['6 cm', '10 cm', '8 cm'], right: 0 },
    { pts: [[240, 150], [240, 42], [384, 150]], names: ['D', 'E', 'F'], sides: ['9 cm', '15 cm', '12 cm'], right: 0 }] })),
  C7: () => fig(parallelTriSVG({ AD: 4, AE: 5, DE: 6, DB: 'x', EC: 'y', BC: 15 })),
  C8: () => fig('<svg class="dia" viewBox="0 0 360 200" style="max-width:360px;width:100%" role="img" aria-label="AC and BD cross at E, AB parallel to DC"><line class="edge" x1="110" y1="30" x2="300" y2="170"/><line class="edge" x1="190" y1="30" x2="30" y2="170"/><line class="edge" x1="110" y1="30" x2="190" y2="30"/><line class="edge" x1="30" y1="170" x2="300" y2="170"/><text class="lbl" x="98" y="24">A</text><text class="lbl" x="194" y="24">B</text><text class="lbl" x="16" y="182">D</text><text class="lbl" x="304" y="182">C</text><text class="lbl" x="146" y="82">E</text><text class="it" x="146" y="22">6</text><text class="it" x="118" y="58">4</text><text class="it" x="174" y="58">5</text><text class="it" x="80" y="120">y</text><text class="it" x="232" y="120">x</text><text class="it" x="160" y="190">15</text></svg>'),
  C11: () => fig('<svg class="dia" viewBox="0 0 300 230" style="max-width:300px;width:100%" role="img" aria-label="Kite WXYZ with diagonals meeting at M"><polygon class="fillt" points="150,20 40,90 150,210 260,90"/><line class="edge dash" x1="150" y1="20" x2="150" y2="210"/><line class="edge dash" x1="40" y1="90" x2="260" y2="90"/><text class="lbl" x="145" y="14">W</text><text class="lbl" x="22" y="94">X</text><text class="lbl" x="145" y="226">Y</text><text class="lbl" x="266" y="94">Z</text><text class="lbl" x="156" y="84">M</text><line class="tick" x1="90" y1="50" x2="98" y2="60"/><line class="tick" x1="202" y1="50" x2="210" y2="60"/><line class="tick" x1="88" y1="148" x2="98" y2="140"/><line class="tick" x1="92" y1="152" x2="102" y2="144"/><line class="tick" x1="202" y1="140" x2="212" y2="148"/><line class="tick" x1="198" y1="144" x2="208" y2="152"/></svg>'),
  C12: () => fig(boxSVG(2, 4, 3)),
  C14: () => fig(gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 4, polys: [{ pts: [[2, 1], [5, 1], [5, 3]], labels: ['A', 'B', 'C'] }], size: 300 })),
  E8: () => fig(parallelTriSVG({ AD: 6, AE: 9, DB: 'x' })),
  A8: () => '<div class="grid2">' + [[10, 20], [-4, 8], [12, 20], [-6, 2]].map((r, i) => '<div><b>' + 'abcd'[i] + ')</b>' + nlSVG(null, null, { min: r[0], max: r[1], w: 320 }) + '</div>').join('') + '</div>'
};
const rule = (lhs, v, a, b) => ({ lhs, v, a, b });
const BOOKLET = [
  { id: 'A1', part: 'A', text: 'Find the gradient of the line joining each pair of points.', parts: [
    { l: 'a', q: '(1, 2) and (4, 11)', a: '3', n: 3, k: 'gradient (1,2) and (4,11)' }, { l: 'b', q: '(−2, 5) and (3, −5)', a: '−2', n: -2, k: 'gradient (-2,5) and (3,-5)' },
    { l: 'c', q: '(0, −4) and (6, 2)', a: '1', n: 1, k: 'gradient (0,-4) and (6,2)' }, { l: 'd', q: '(−5, −1) and (3, 3)', a: '1/2 (0.5)', n: 0.5, k: 'gradient (-5,-1) and (3,3)' },
    { l: 'e', q: '(2, 7) and (−4, 7)', a: '0 (horizontal line)', n: 0, k: 'gradient (2,7) and (-4,7)' }, { l: 'f', q: '(−3, 4) and (−1, −8)', a: '−6', n: -6, k: 'gradient (-3,4) and (-1,-8)' }] },
  { id: 'A2', part: 'A', text: 'State the gradient (m) and the y-intercept (c) of each line.', parts: [
    { l: 'a', q: 'y = 4x − 7', a: 'm = 4, c = −7', k: 'y = 4x - 7' }, { l: 'b', q: 'y = 9 − 2x', a: 'm = −2, c = 9', k: 'y = 9 - 2x' }, { l: 'c', q: 'y = (1/2)x + 3', a: 'm = 1/2, c = 3', k: 'y = (1/2)x + 3' },
    { l: 'd', q: 'y = −x', a: 'm = −1, c = 0', k: 'y = -x' }, { l: 'e', q: 'y = 3x', a: 'm = 3, c = 0', k: 'y = 3x' }, { l: 'f', q: 'y = 2.5x − 1', a: 'm = 2.5, c = −1', k: 'y = 2.5x - 1' }] },
  { id: 'A3', part: 'A', text: 'Write a linear rule for each situation or table. Define any pronumerals you use.', parts: [
    { l: 'a', q: 'A taxi charges a $4 fee plus $2.50 for every kilometre. (Use C for cost and d for distance.)', a: 'C = 4 + 2.5d', r: rule('C', 'd', 2.5, 4) },
    { l: 'b', q: 'A phone battery is at 80% and drops 5% every hour. (Use B and t.)', a: 'B = 80 − 5t', r: rule('B', 't', -5, 80) },
    { l: 'c', q: 'A gym charges a $25 joining fee plus $12 per week. (Use C and w.)', a: 'C = 25 + 12w', r: rule('C', 'w', 12, 25) },
    { l: 'd', q: 'A submarine is 20 m below sea level and rises 4 m every minute. (Use d for depth in metres and t.)', a: 'd = −20 + 4t', r: rule('d', 't', 4, -20) },
    { l: 'e', q: 'Find the rule for this table:' + tableHTML([0, 1, 2, 3, 4], [5, 8, 11, 14, 17]), a: 'y = 3x + 5', r: rule('y', 'x', 3, 5) },
    { l: 'f', q: 'Find the rule for this table:' + tableHTML([0, 1, 2, 3], [10, 8, 6, 4]), a: 'y = 10 − 2x', r: rule('y', 'x', -2, 10) }] },
  { id: 'A4', part: 'A', text: 'Complete each table of values, then plot the points and draw the line.', parts: [
    { l: 'a', q: 'y = 2x − 3 for x = −1, 0, 1, 2, 3 (type the five y-values)', a: 'y-values: −5, −3, −1, 1, 3 (line rises, crosses the y-axis at −3)', ns: [-5, -3, -1, 1, 3], as: () => gridSVG({ xmin: -3, xmax: 4, ymin: -7, ymax: 5, lines: [{ m: 2, c: -3 }], points: [-1, 0, 1, 2, 3].map(x => ({ x, y: 2 * x - 3 })), size: 220 }) },
    { l: 'b', q: 'y = 6 − 2x for x = 0, 1, 2, 3, 4', a: 'y-values: 6, 4, 2, 0, −2 (line falls, crosses the y-axis at 6)', ns: [6, 4, 2, 0, -2], as: () => gridSVG({ xmin: -2, xmax: 5, ymin: -4, ymax: 8, lines: [{ m: -2, c: 6 }], points: [0, 1, 2, 3, 4].map(x => ({ x, y: 6 - 2 * x })), size: 220 }) }] },
  { id: 'A5', part: 'A', text: 'Mia has $45 saved and puts away $15 every week.', parts: [
    { l: 'a', q: 'Write a rule for the amount, A dollars, after w weeks.', a: 'A = 45 + 15w', r: rule('A', 'w', 15, 45) }, { l: 'b', q: 'State the gradient and explain what it means in this situation.', a: 'm = 15: she saves $15 per week', n: 15 },
    { l: 'c', q: 'How much will she have after 8 weeks?', a: '45 + 120 = $165', n: 165 }, { l: 'd', q: 'After how many weeks will she have $300?', a: '300 = 45 + 15w, so w = 17 weeks', n: 17, k: '45 + 15w = 300' }] },
  { id: 'A6', part: 'A', text: 'A phone plan includes 20 GB of data. Data is used at 0.8 GB per day.', parts: [
    { l: 'a', q: 'Write a rule for the data remaining, D GB, after d days.', a: 'D = 20 − 0.8d', r: rule('D', 'd', -0.8, 20) }, { l: 'b', q: 'How much data is left after 12 days?', a: '20 − 9.6 = 10.4 GB', n: 10.4 },
    { l: 'c', q: 'After how many days will there be 4 GB left?', a: '4 = 20 − 0.8d, so d = 20 days', n: 20, k: '20 - 0.8d = 4' }, { l: 'd', q: 'After how many days will all the data be used?', a: '0 = 20 − 0.8d, so d = 25 days', n: 25, k: '20 - 0.8d = 0' }] },
  { id: 'A7', part: 'A', text: 'A car hire company charges a $55 fee plus $0.30 per kilometre.', parts: [
    { l: 'a', q: 'Write a rule for the cost, C dollars, of travelling k kilometres.', a: 'C = 55 + 0.3k', r: rule('C', 'k', 0.3, 55) }, { l: 'b', q: 'Find the cost of travelling 180 km.', a: '55 + 54 = $109', n: 109 },
    { l: 'c', q: 'Sam has a budget of $120. What is the greatest distance he can travel? (2 decimal places)', a: '120 = 55 + 0.3k, so k = 65 ÷ 0.3 = 216.67 km', n: 216.67, k: '55 + 0.3k = 120' },
    { l: 'd', q: 'Is the rule a sensible model for travelling 0 km? Explain.', a: 'Yes: the cost is $55, the fee, which you pay even if you do not drive (c = 55).' }] },
  { id: 'A8', part: 'A', text: 'Write each situation as an inequality (use the letter given) and show it on the number line.', parts: [
    { l: 'a', q: 'A bag can hold <b>at most</b> 15 kg. (x kg)', a: 'x ≤ 15: closed circle at 15, arrow left', iq: { v: 'x', op: '<=', val: 15 }, as: () => nlSVG('<=', 15, { min: 10, max: 20 }) },
    { l: 'b', q: 'Temperatures <b>below</b> 4°C. (t)', a: 't < 4: open circle at 4, arrow left', iq: { v: 't', op: '<', val: 4 }, as: () => nlSVG('<', 4, { min: -4, max: 8 }) },
    { l: 'c', q: 'You must be <b>at least</b> 16 years old. (a)', a: 'a ≥ 16: closed circle at 16, arrow right', iq: { v: 'a', op: '>=', val: 16 }, as: () => nlSVG('>=', 16, { min: 12, max: 20 }) },
    { l: 'd', q: 'A number <b>greater than</b> −2. (x)', a: 'x > −2: open circle at −2, arrow right', iq: { v: 'x', op: '>', val: -2 }, as: () => nlSVG('>', -2, { min: -6, max: 2 }) }] },
  { id: 'A9', part: 'A', text: 'Solve each inequality and show the solution on the number line.', parts: [
    { l: 'a', q: 'x + 6 > 10', a: 'x > 4 (open circle)', iq: { v: 'x', op: '>', val: 4 }, k: 'x + 6 > 10', as: () => nlSVG('>', 4, { min: -5, max: 10 }) },
    { l: 'b', q: '3x ≤ 21', a: 'x ≤ 7 (closed circle)', iq: { v: 'x', op: '<=', val: 7 }, k: '3x <= 21', as: () => nlSVG('<=', 7, { min: -5, max: 10 }) },
    { l: 'c', q: '5 − 2x < 11', a: 'x > −3 (open; flip the sign when dividing by −2)', iq: { v: 'x', op: '>', val: -3 }, k: '5 - 2x < 11', as: () => nlSVG('>', -3, { min: -5, max: 10 }) },
    { l: 'd', q: '4x − 3 ≥ 13', a: 'x ≥ 4 (closed)', iq: { v: 'x', op: '>=', val: 4 }, k: '4x - 3 >= 13', as: () => nlSVG('>=', 4, { min: -5, max: 10 }) },
    { l: 'e', q: 'x/3 + 2 ≤ 5', a: 'x ≤ 9 (closed)', iq: { v: 'x', op: '<=', val: 9 }, k: 'x/3 + 2 <= 5', as: () => nlSVG('<=', 9, { min: -5, max: 10 }) },
    { l: 'f', q: '10 − 3x ≥ 1', a: 'x ≤ 3 (closed; flip the sign when dividing by −3)', iq: { v: 'x', op: '<=', val: 3 }, k: '10 - 3x >= 1', as: () => nlSVG('<=', 3, { min: -5, max: 10 }) }] },
  { id: 'A10', part: 'A', text: 'Solve each equation. Show each step.', parts: [
    { l: 'a', q: '3x + 4 = 19', a: 'x = 5', n: 5, k: '3x + 4 = 19' }, { l: 'b', q: '5x − 7 = 2x + 11', a: 'x = 6', n: 6, k: '5x - 7 = 2x + 11' }, { l: 'c', q: '3(x − 4) = 12', a: 'x = 8', n: 8, k: '3(x - 4) = 12' },
    { l: 'd', q: 'x/4 − 1 = 2', a: 'x = 12', n: 12, k: 'x/4 - 1 = 2' }, { l: 'e', q: '4x + 3 = 10 (answer as a decimal)', a: 'x = 7/4 = 1.75', n: 1.75, k: '4x + 3 = 10' }, { l: 'f', q: '6 − 5x = 1', a: 'x = 1', n: 1, k: '6 - 5x = 1' },
    { l: 'g', q: '3(2x − 1) = 4x + 5', a: 'x = 4', n: 4, k: '3(2x - 1) = 4x + 5' }, { l: 'h', q: '(x − 2)/3 = 5', a: 'x = 17', n: 17, k: '(x - 2)/3 = 5' }, { l: 'i', q: '5x + 1 = 2x + 5 (answer as a fraction and to 2 d.p.)', a: 'x = 4/3 = 1.33', n: 4 / 3, k: '5x + 1 = 2x + 5' }] },
  { id: 'A11', part: 'A', text: 'Use the rule y = −2x + 8 to answer these questions.', parts: [
    { l: 'a', q: 'What is the y-intercept?', a: '8', n: 8 }, { l: 'b', q: 'Find the x-intercept (where y = 0).', a: '0 = −2x + 8, so x = 4', n: 4, k: '-2x + 8 = 0' },
    { l: 'c', q: 'Does the point (3, 2) lie on the line? Show why.', a: 'Yes: −2(3) + 8 = 2', ch: ['Yes', 'No'], ci: 0, k: 'does (3,2) lie on y = -2x + 8' }, { l: 'd', q: 'Does the point (5, −1) lie on the line? Show why.', a: 'No: −2(5) + 8 = −2, not −1', ch: ['Yes', 'No'], ci: 1, k: 'does (5,-1) lie on y = -2x + 8' },
    { l: 'e', q: 'Find y when x = −3.', a: '6 + 8 = 14', n: 14 }, { l: 'f', q: 'Find x when y = 20.', a: '20 = −2x + 8, so x = −6', n: -6, k: '-2x + 8 = 20' }] },
  { id: 'A12', part: 'A', text: 'For each line: find the gradient, state the y-intercept and write the rule in the form y = mx + c. Mark two points you can read exactly to help you.', parts: [
    { l: 'a', q: 'Line 1', a: 'Passes through (0, 3) and (2, −1): m = −4 ÷ 2 = −2, c = 3, so y = −2x + 3', r: rule('y', 'x', -2, 3) },
    { l: 'b', q: 'Line 2', a: 'Passes through (0, −1) and (2, 0): m = 1/2, c = −1, so y = (1/2)x − 1', r: rule('y', 'x', 0.5, -1) }] },

  { id: 'B1', part: 'B', text: 'Calculate.', parts: [
    { l: 'a', q: '10% of $350', a: '$35', n: 35, k: '10% of 350' }, { l: 'b', q: '25% of 88', a: '22', n: 22, k: '25% of 88' }, { l: 'c', q: '65% of $240', a: '$156', n: 156, k: '65% of 240' },
    { l: 'd', q: '7.5% of $80', a: '$6', n: 6, k: '7.5% of 80' }, { l: 'e', q: '120% of 45', a: '54', n: 54, k: '120% of 45' }, { l: 'f', q: '12.5% of 64', a: '8', n: 8, k: '12.5% of 64' }] },
  { id: 'B2', part: 'B', text: 'Express the first quantity as a percentage of the second. Convert to the same units first where needed.', parts: [
    { l: 'a', q: '18 out of 24', a: '75%', n: 75, k: '18 out of 24' }, { l: 'b', q: '$9 out of $40', a: '22.5%', n: 22.5, k: '9 out of 40' }, { l: 'c', q: '600 mL out of 2 L', a: '600 ÷ 2000 = 30%', n: 30, k: '600 mL out of 2 L' },
    { l: 'd', q: '45 cm out of 3 m', a: '45 ÷ 300 = 15%', n: 15, k: '45 cm out of 3 m' }, { l: 'e', q: '150 g out of 1.2 kg', a: '150 ÷ 1200 = 12.5%', n: 12.5, k: '150 g out of 1.2 kg' }, { l: 'f', q: '80 seconds out of 4 minutes (2 d.p.)', a: '80 ÷ 240 = 33.33%', n: 33.33, k: '80 s out of 4 min' }] },
  { id: 'B3', part: 'B', text: 'Complete each calculation.', parts: [
    { l: 'a', q: 'Increase $250 by 12%.', a: '$280', n: 280, k: 'increase 250 by 12%' }, { l: 'b', q: 'Decrease $85 by 20%.', a: '$68', n: 68, k: 'decrease 85 by 20%' }, { l: 'c', q: 'Increase 480 g by 7.5%.', a: '516 g', n: 516, k: 'increase 480 by 7.5%' },
    { l: 'd', q: 'Decrease $1250 by 35%.', a: '$812.50', n: 812.5, k: 'decrease 1250 by 35%' }, { l: 'e', q: 'Increase $64 by 3.5%.', a: '$66.24', n: 66.24, k: 'increase 64 by 3.5%' }] },
  { id: 'B4', part: 'B', text: 'Calculate the percentage change. State whether it is an increase or a decrease. (2 d.p. if needed)', parts: [
    { l: 'a', q: '$80 to $100', a: '25% increase', n: 25, sg: 1, k: 'percentage change from 80 to 100' }, { l: 'b', q: '$450 to $360', a: '20% decrease', n: -20, sg: 1, k: 'percentage change from 450 to 360' },
    { l: 'c', q: '52 kg to 46.8 kg', a: '10% decrease', n: -10, sg: 1, k: 'percentage change from 52 to 46.8' }, { l: 'd', q: '$2.50 to $3.10', a: '24% increase', n: 24, sg: 1, k: 'percentage change from 2.50 to 3.10' },
    { l: 'e', q: '$1899 to $1520', a: '379 ÷ 1899 × 100 = 19.96% decrease', n: -19.96, sg: 1, k: 'percentage change from 1899 to 1520' }] },
  { id: 'B5', part: 'B', text: 'Use the unitary method (find 1% first).', parts: [
    { l: 'a', q: '25% of an amount is $60. Find 10% of the amount.', a: '1% = $2.40, so 10% = $24', n: 24, k: '25% of an amount is 60, find 10%' }, { l: 'b', q: '8% of the students at a school is 36. How many students are there altogether?', a: '1% = 4.5, so 100% = 450 students', n: 450, k: '8% of the total is 36' },
    { l: 'c', q: '15% of a bill is $27. How much is 4% of the bill?', a: '1% = $1.80, so 4% = $7.20', n: 7.2, k: '15% of a bill is 27, find 4%' }, { l: 'd', q: '60% of a class is 18 students. How many are in the whole class?', a: '1% = 0.3, so 100% = 30 students', n: 30, k: '60% of a class is 18' },
    { l: 'e', q: '35% of a load is 28 kg. How much is 20% of the load?', a: '1% = 0.8 kg, so 20% = 16 kg', n: 16, k: '35% of a load is 28, find 20%' }] },
  { id: 'B6', part: 'B', text: 'Profit, loss, discount and GST (GST is 10%).', parts: [
    { l: 'a', q: 'A pair of shoes costs $120. They are discounted by 15%. What is the sale price?', a: '0.85 × 120 = $102', n: 102, k: 'decrease 120 by 15%' }, { l: 'b', q: 'A $85 item has 10% GST added. What is the total price?', a: '1.1 × 85 = $93.50', n: 93.5, k: 'add GST to 85' },
    { l: 'c', q: 'A price including GST is $176. What was the price before GST?', a: '176 ÷ 1.1 = $160', n: 160, k: 'price including GST is 176' }, { l: 'd', q: 'A salesperson earns 4% commission on $12 500 of sales. How much commission is earned?', a: '0.04 × 12 500 = $500', n: 500, k: '4% of 12500' },
    { l: 'e', q: 'A shop buys an item for $40 and sells it for $52. Calculate the profit as a percentage of the cost price.', a: '12 ÷ 40 = 30% profit', n: 30, k: 'percentage change from 40 to 52' }, { l: 'f', q: 'A trader buys an item for $200 and sells it for $170. Calculate the loss as a percentage of the cost price.', a: '30 ÷ 200 = 15% loss', n: 15, k: 'percentage change from 200 to 170' }] },
  { id: 'B7', part: 'B', text: 'Find the original amount.', parts: [
    { l: 'a', q: 'After a 20% increase the price is $144.', a: '144 ÷ 1.2 = $120', n: 120, k: 'after a 20% increase the price is 144' }, { l: 'b', q: 'After a 15% discount the sale price is $68.', a: '68 ÷ 0.85 = $80', n: 80, k: 'after a 15% discount the price is 68' },
    { l: 'c', q: 'After a 5% rise, the price of milk is $2.52.', a: '2.52 ÷ 1.05 = $2.40', n: 2.4, k: 'after a 5% increase the price is 2.52' }, { l: 'd', q: 'A town’s population fell by 8% to 4600.', a: '4600 ÷ 0.92 = 5000 people', n: 5000, k: 'after an 8% decrease it is 4600' }] },
  { id: 'B8', part: 'B', star: 'Multi-step', text: 'A survey asks students how they get to school. 40% walk, 25% catch the bus, 5% ride a bike and the rest are driven. 90 students are driven.', parts: [
    { l: 'a', q: 'What percentage of students are driven?', a: '100 − 40 − 25 − 5 = 30%', n: 30 }, { l: 'b', q: 'How many students were surveyed altogether?', a: '30% = 90, so 1% = 3 and 100% = 300 students', n: 300 }, { l: 'c', q: 'How many students walk?', a: '40% of 300 = 120', n: 120 }] },
  { id: 'B9', part: 'B', star: 'Multi-step', text: 'A games console costs $480 before GST. GST of 10% is added. During a sale, 15% is taken off the GST-inclusive price.', parts: [
    { l: 'a', q: 'What is the price including GST?', a: '480 × 1.1 = $528', n: 528 }, { l: 'b', q: 'What is the final sale price?', a: '528 × 0.85 = $448.80', n: 448.8 },
    { l: 'c', q: 'Would the final price change if the 15% was taken off first and the GST added afterwards? Explain.', a: 'No: 480 × 0.85 × 1.1 = $448.80. Multiplying in any order gives the same result.' }] },
  { id: 'B10', part: 'B', star: 'Multi-step', text: 'Shop A advertises 25% off an $80 jacket. Shop B sells the same jacket for $75 and offers $20 off.', parts: [
    { l: 'a', q: 'Which shop is cheaper, and by how much?', a: 'A: $60, B: $55. Shop B is cheaper by $5.', n: 5 }, { l: 'b', q: 'What percentage discount is Shop B giving? (2 d.p.)', a: '20 ÷ 75 × 100 = 26.67%', n: 26.67 }] },
  { id: 'B11', part: 'B', star: 'Multi-step', text: 'A shop buys a bike for $250 and marks the price up by 45%. During a sale the marked price is discounted by 10%.', parts: [
    { l: 'a', q: 'Find the marked price.', a: '250 × 1.45 = $362.50', n: 362.5 }, { l: 'b', q: 'Find the sale price.', a: '362.50 × 0.9 = $326.25', n: 326.25 }, { l: 'c', q: 'Find the profit made on the sale price.', a: '326.25 − 250 = $76.25', n: 76.25 }, { l: 'd', q: 'Express the profit as a percentage of the cost price.', a: '76.25 ÷ 250 = 30.5%', n: 30.5 }] },
  { id: 'B12', part: 'B', star: 'Challenge', text: 'The price of a concert ticket rises by 25%. A month later it falls by 20%.', parts: [
    { l: 'a', q: 'Start with a $100 ticket. What is its price after both changes?', a: '100 × 1.25 = 125, then 125 × 0.8 = $100', n: 100 }, { l: 'b', q: 'What is the overall percentage change?', a: '0% (no change)', n: 0 },
    { l: 'c', q: 'Explain why the overall change is not +5%.', a: 'The 20% is taken from the new, larger price ($125), not from the original $100, so the two percentages do not simply add.' }] },
  { id: 'B13', part: 'B', star: 'Challenge', text: 'The cost price of a pair of boots was marked up by 30% for retail. In a sale, the retail price was then discounted by 10%. The sale price was $351. What was the original cost price?', parts: [
    { l: '', q: '', a: 'Multiplier = 1.30 × 0.90 = 1.17. Cost price = 351 ÷ 1.17 = $300.', n: 300 }] },
  { id: 'B14', part: 'B', star: 'Challenge', text: 'A shop takes 20% off a jacket. At the register, a coupon takes a further 10% off the sale price. Fiona pays $259.20.', parts: [
    { l: 'a', q: 'What was the original price of the jacket?', a: 'Multiplier = 0.8 × 0.9 = 0.72. Original = 259.20 ÷ 0.72 = $360.', n: 360 }, { l: 'b', q: 'What single percentage discount is this equivalent to?', a: '1 − 0.72 = 0.28, so 28% (not 30%)', n: 28 }] },

  { id: 'C1', part: 'C', text: 'Each point is reflected across the axis shown. Write the coordinates of the new point.', parts: [
    { l: 'a', q: '(4, 1) is reflected across the x-axis.', a: '(4, −1)', co: [[4, -1]], k: 'reflect (4,1) in the x-axis' }, { l: 'b', q: '(−2, 5) is reflected across the y-axis.', a: '(2, 5)', co: [[2, 5]], k: 'reflect (-2,5) in the y-axis' },
    { l: 'c', q: '(−6, −3) is reflected across the x-axis.', a: '(−6, 3)', co: [[-6, 3]], k: 'reflect (-6,-3) in the x-axis' }, { l: 'd', q: '(7, −2) is reflected across the y-axis.', a: '(−7, −2)', co: [[-7, -2]], k: 'reflect (7,-2) in the y-axis' },
    { l: 'e', q: '(−3, 8) is reflected across the x-axis.', a: '(−3, −8)', co: [[-3, -8]], k: 'reflect (-3,8) in the x-axis' }] },
  { id: 'C2', part: 'C', text: 'Each shape is translated using the vector shown. Write the coordinates of the new shape.', parts: [
    { l: 'a', q: 'Triangle A(1, 2), B(4, 2), C(3, 5) is translated by the vector (3, −2).', a: 'A′(4, 0), B′(7, 0), C′(6, 3)', co: [[4, 0], [7, 0], [6, 3]] },
    { l: 'b', q: 'Square P(0, 0), Q(2, 0), R(2, 2), S(0, 2) is translated by the vector (−3, 4).', a: 'P′(−3, 4), Q′(−1, 4), R′(−1, 6), S′(−3, 6)', co: [[-3, 4], [-1, 4], [-1, 6], [-3, 6]] },
    { l: 'c', q: 'Triangle D(−2, 3), E(1, 3), F(−2, −1) is translated by the vector (4, −3).', a: 'D′(2, 0), E′(5, 0), F′(2, −4)', co: [[2, 0], [5, 0], [2, -4]] },
    { l: 'd', q: 'A shape is translated by the vector (−5, 3). Describe in words how the shape moves.', a: '5 units left and 3 units up' },
    { l: 'e', q: 'Triangle X(2, 1), Y(6, 1), Z(4, 4) is translated so that X moves to X′(−3, 5). Find the vector, then find Y′ and Z′. (Type the vector, then Y′, then Z′.)', a: 'vector (−5, 4); Y′(1, 5), Z′(−1, 8)', co: [[-5, 4], [1, 5], [-1, 8]] }] },
  { id: 'C3', part: 'C', text: 'Triangle DEF is drawn on the grid. Draw and label each image, and write its coordinates.', parts: [
    { l: 'a', q: 'Reflect DEF in the y-axis to get D′E′F′.', a: 'D′(−1, 1), E′(−4, 1), F′(−1, 3)', co: [[-1, 1], [-4, 1], [-1, 3]], as: () => gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, mirrors: [{ t: 'y-axis' }], polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['D', 'E', 'F'] }, { pts: [[-1, 1], [-4, 1], [-1, 3]], labels: ['D′', 'E′', 'F′'], cls: 'b' }], size: 260 }) },
    { l: 'b', q: 'Translate DEF by the vector (−2, −3) to get D″E″F″.', a: 'D″(−1, −2), E″(2, −2), F″(−1, 0)', co: [[-1, -2], [2, -2], [-1, 0]], as: () => gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['D', 'E', 'F'] }, { pts: [[-1, -2], [2, -2], [-1, 0]], labels: ['D″', 'E″', 'F″'], cls: 'c' }], size: 260 }) },
    { l: 'c', q: 'Reflect DEF in the x-axis to get D‴E‴F‴.', a: 'D‴(1, −1), E‴(4, −1), F‴(1, −3)', co: [[1, -1], [4, -1], [1, -3]], as: () => gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 5, mirrors: [{ t: 'x-axis' }], polys: [{ pts: [[1, 1], [4, 1], [1, 3]], labels: ['D', 'E', 'F'] }, { pts: [[1, -1], [4, -1], [1, -3]], labels: ['D‴', 'E‴', 'F‴'], cls: 'd' }], size: 260 }) }] },
  { id: 'C4', part: 'C', text: 'Which congruence test (SSS, SAS, AAS or RHS) shows that each pair of triangles is congruent? If no test works, write “Not enough information” and explain why.', parts: [
    { l: 'a', q: 'Triangle ABC has AB = 6 cm, BC = 8 cm, AC = 10 cm. Triangle DEF has DE = 6 cm, EF = 8 cm, DF = 10 cm.', a: 'SSS', ch: CONG_TESTS, ci: 0 },
    { l: 'b', q: 'Triangle PQR has PQ = 5 cm, ∠Q = 40°, QR = 9 cm. Triangle XYZ has XY = 5 cm, ∠Y = 40°, YZ = 9 cm.', a: 'SAS (the angle is between the two sides)', ch: CONG_TESTS, ci: 1 },
    { l: 'c', q: 'Both triangles have angles of 50° and 60°, and a side of 7 cm opposite the 60° angle.', a: 'AAS', ch: CONG_TESTS, ci: 2 },
    { l: 'd', q: 'Both triangles have a right angle, a hypotenuse of 17 cm and another side of 8 cm.', a: 'RHS', ch: CONG_TESTS, ci: 3 },
    { l: 'e', q: 'Both triangles have angles of 40°, 60° and 80°.', a: 'Not enough information: equal angles only tell you the triangles are similar (same shape), not that they are the same size.', ch: CONG_TESTS, ci: 4 },
    { l: 'f', q: 'Both triangles have sides of 6 cm and 7 cm, and a 30° angle that is <i>not</i> between those two sides.', a: 'Not enough information: two sides and a non-included angle is not a congruence test.', ch: CONG_TESTS, ci: 4 }] },
  { id: 'C5', part: 'C', text: 'The two triangles below are congruent. Find the values of the pronumerals. Give a reason for each. (Diagram not to scale.)', parts: [
    { l: 'a', q: 'x° = ?', a: '∠D matches ∠A = 180° − 45° − 70° = 65°, so x = 65 (angle sum of a triangle). Matching the equal angles (∠B = ∠E = 45°, ∠C = ∠F = 70°) gives △ABC ≅ △DEF; the second triangle is a reflection. (The printed answer sheet writes △DFE, but the angles show the order is D, E, F.)', n: 65 },
    { l: 'b', q: 'y cm = ?', a: 'DE matches AB, so y = 6.', n: 6 }] },
  { id: 'C5b', label: 'C5 (continued)', part: 'C', text: '△JKL ≅ △MNP, with JK = 8 cm, KL = 11 cm, JL = 13 cm, ∠J = 52° and ∠K = 78°. Find:', parts: [
    { l: 'a', q: 'the length of MN', a: 'MN = JK = 8 cm', n: 8 }, { l: 'b', q: 'the size of ∠N', a: '∠N = ∠K = 78°', n: 78 }, { l: 'c', q: 'the size of ∠P', a: '∠P = ∠L = 180 − 52 − 78 = 50°', n: 50 }, { l: 'd', q: 'the length of NP', a: 'NP = KL = 11 cm', n: 11 }] },
  { id: 'C6', part: 'C', text: 'Consider the two triangles below. (Diagram not to scale.)', parts: [
    { l: 'a', q: 'Which test (AAA, SSS, SAS or RHS) shows the triangles are similar?', a: 'SSS: 9 ÷ 6 = 12 ÷ 8 = 15 ÷ 10 = 1.5', ch: ['AAA', 'SSS', 'SAS', 'RHS'], ci: 1 },
    { l: 'b', q: 'Find the scale factor from △ABC to △DEF.', a: '1.5', n: 1.5 }, { l: 'c', q: 'Write the similarity statement.', a: '△ABC ~ △DEF' },
    { l: 'd', q: '△KLM ~ △PQR. KL = 5 cm, LM = 7 cm and PQ = 12.5 cm. Find QR.', a: 'Scale factor = 12.5 ÷ 5 = 2.5, so QR = 7 × 2.5 = 17.5 cm', n: 17.5 },
    { l: 'e', q: 'Triangle 1 has angles of 35° and 75°. Triangle 2 has angles of 35° and 65°. Are the triangles similar? Explain.', a: 'No. Triangle 1 has angles 35°, 75°, 70° and Triangle 2 has angles 35°, 65°, 80°. The angles are not the same, so they are not similar.', ch: ['Yes', 'No'], ci: 1 }] },
  { id: 'C7', part: 'C', text: 'In the diagram, DE is parallel to BC. (Not to scale.) Lengths are in centimetres.', parts: [
    { l: 'a', q: 'Explain why △ADE and △ABC are similar.', a: '∠A is common and ∠ADE = ∠ABC (corresponding angles, DE ∥ BC), so the triangles are similar (AA).' },
    { l: 'b', q: 'Find the scale factor from △ADE to △ABC.', a: '15 ÷ 6 = 2.5', n: 2.5 }, { l: 'c', q: 'Find the value of x.', a: 'AB = 4 × 2.5 = 10, so x = 10 − 4 = 6', n: 6 }, { l: 'd', q: 'Find the value of y.', a: 'AC = 5 × 2.5 = 12.5, so y = 12.5 − 5 = 7.5', n: 7.5 }] },
  { id: 'C8', part: 'C', star: 'Stretch', text: 'AC and BD cross at E. AB is parallel to DC. (Not to scale.) Lengths are in centimetres.', parts: [
    { l: 'a', q: 'Explain why △ABE and △CDE are similar.', a: '∠AEB = ∠CED (vertically opposite) and ∠BAE = ∠DCE (alternate angles, AB ∥ DC), so they are similar (AA).' },
    { l: 'b', q: 'Find the scale factor from △ABE to △CDE.', a: '15 ÷ 6 = 2.5', n: 2.5 }, { l: 'c', q: 'Find x.', a: 'x = CE = 4 × 2.5 = 10', n: 10 }, { l: 'd', q: 'Find y.', a: 'y = DE = 5 × 2.5 = 12.5', n: 12.5 }] },
  { id: 'C9', part: 'C', text: 'Use similar triangles to find the missing heights. (Objects and their shadows form similar triangles at the same time of day.)', parts: [
    { l: 'a', q: 'A flagpole of height 4.5 m casts a shadow 3 m long. At the same time a tree casts a shadow 8 m long. How tall is the tree?', a: 'Scale factor = 8 ÷ 3, so height = 4.5 × 8/3 = 12 m', n: 12 },
    { l: 'b', q: 'A person 1.8 m tall casts a shadow 2.4 m long. At the same time a building casts a shadow 30 m long. How tall is the building?', a: '1.8 ÷ 2.4 = 0.75, so height = 0.75 × 30 = 22.5 m', n: 22.5 }] },
  { id: 'C10', part: 'C', text: 'Use the properties of quadrilaterals to find the missing values. Give reasons.', parts: [
    { l: 'a', q: 'In parallelogram PQRS, ∠P = 68°. Find ∠Q, ∠R and ∠S.', a: '∠R = 68° (opposite angles equal), ∠Q = ∠S = 180 − 68 = 112° (co-interior angles)', ns: [112, 68, 112] },
    { l: 'b', q: 'In rhombus ABCD, ∠ABC = 70°. Find ∠BAD, and ∠BAC (the diagonal AC bisects ∠BAD).', a: '∠BAD = 180 − 70 = 110°, ∠BAC = 55°', ns: [110, 55] },
    { l: 'c', q: 'A kite has angles of 110° and 50° at the ends of its line of symmetry. Find the other two angles.', a: 'The two equal angles = (360 − 110 − 50) ÷ 2 = 100° each', n: 100 },
    { l: 'd', q: 'In trapezium ABCD, AB ∥ DC, ∠A = 75° and ∠B = 118°. Find ∠D and ∠C.', a: '∠D = 180 − 75 = 105°, ∠C = 180 − 118 = 62° (co-interior angles between parallel lines)', ns: [105, 62] },
    { l: 'e', q: 'A rhombus has a perimeter of 36 cm. Find the length of one side.', a: '36 ÷ 4 = 9 cm', n: 9 }, { l: 'f', q: 'A rectangle has one diagonal of 13 cm. What is the length of the other diagonal?', a: '13 cm (the diagonals of a rectangle are equal)', n: 13 }] },
  { id: 'C11', part: 'C', text: 'Kite WXYZ has WX = WZ and XY = ZY. The diagonals meet at M. (Not to scale.) Write TRUE or FALSE for each statement.', parts: [
    { l: 'a', q: '∠WXY = ∠WZY', a: 'TRUE', ch: ['TRUE', 'FALSE'], ci: 0 }, { l: 'b', q: 'WX = XY', a: 'FALSE', ch: ['TRUE', 'FALSE'], ci: 1 }, { l: 'c', q: 'XM = MZ', a: 'TRUE', ch: ['TRUE', 'FALSE'], ci: 0 },
    { l: 'd', q: '∠WMX = 90°', a: 'TRUE', ch: ['TRUE', 'FALSE'], ci: 0 }, { l: 'e', q: 'WM = MY', a: 'FALSE (WY is the line of symmetry; XZ cuts it, but not in half)', ch: ['TRUE', 'FALSE'], ci: 1 },
    { l: 'f', q: 'Name two pairs of congruent triangles in the kite and state the test for each.', a: '△WXY ≅ △WZY (SSS: WX = WZ, XY = ZY, WY common) and △WXM ≅ △WZM (RHS: right angle at M, WX = WZ, WM common). Also △XMY ≅ △ZMY (RHS).' }] },
  { id: 'C12', part: 'C', text: 'The box below sits on the floor with one corner at the origin O(0, 0, 0). The x-axis comes towards you, the y-axis goes to the right and the z-axis goes up. The box is 2 units long in the x direction, 4 units in the y direction and 3 units high. Write the coordinates of:', parts: [
    { l: 'a', q: 'point A', a: '(2, 0, 0)', co: [[2, 0, 0]] }, { l: 'b', q: 'point B', a: '(2, 4, 0)', co: [[2, 4, 0]] }, { l: 'c', q: 'point C', a: '(0, 4, 0)', co: [[0, 4, 0]] },
    { l: 'd', q: 'point E', a: 'E(2, 0, 3)', co: [[2, 0, 3]] }, { l: 'e', q: 'point F', a: 'F(2, 4, 3)', co: [[2, 4, 3]] }, { l: 'f', q: 'point G', a: 'G(0, 4, 3)', co: [[0, 4, 3]] }] },
  { id: 'C13', part: 'C', text: '3D coordinates.', parts: [
    { l: 'a', q: 'A cube of side length 3 sits with one corner at the origin and lies in the positive direction on all three axes. Write the coordinates of the corner furthest from the origin, and of the three corners on the axes.', a: '(3, 3, 3); axes corners (3, 0, 0), (0, 3, 0), (0, 0, 3)', co: [[3, 3, 3], [3, 0, 0], [0, 3, 0], [0, 0, 3]] },
    { l: 'b', q: 'On which axis does the point (0, 6, 0) lie?', a: 'the y-axis', ch: ['x-axis', 'y-axis', 'z-axis'], ci: 1 }, { l: 'c', q: 'The point (4, 2, 0) lies on the floor. How can you tell?', a: 'Its z-coordinate is 0, so it is at floor level.' },
    { l: 'd', q: 'Describe in words how to locate (3, 5, 2) starting from the origin.', a: '3 units along the x-axis, 5 units along the y-axis, then 2 units up.' }, { l: 'e', q: 'A drone is at (2, 3, 1). It rises 4 units straight up. What are its new coordinates?', a: '(2, 3, 5)', co: [[2, 3, 5]] }] },
  { id: 'C14', part: 'C', star: 'Challenge', text: 'Triangle ABC has A(2, 1), B(5, 1) and C(5, 3). It is transformed in two steps: A(2, 1) → A′(−2, 1) → A″(−2, −4), B(5, 1) → B′(−5, 1) → B″(−5, −4), C(5, 3) → C′(−5, 3) → C″(−5, −2).', parts: [
    { l: 'a', q: 'Describe the first transformation (ABC to A′B′C′).', a: 'Reflection in the y-axis (x-values change sign, y-values stay the same).', as: () => gridSVG({ xmin: -6, xmax: 6, ymin: -5, ymax: 4, mirrors: [{ t: 'y-axis' }], polys: [{ pts: [[2, 1], [5, 1], [5, 3]], labels: ['A', 'B', 'C'] }, { pts: [[-2, 1], [-5, 1], [-5, 3]], labels: ['A′', 'B′', 'C′'], cls: 'b' }, { pts: [[-2, -4], [-5, -4], [-5, -2]], labels: ['A″', 'B″', 'C″'], cls: 'c' }], size: 300 }) },
    { l: 'b', q: 'Describe the second transformation (A′B′C′ to A″B″C″).', a: 'Translation by the vector (0, −5), i.e. 5 units down.' },
    { l: 'c', q: 'Is △A″B″C″ congruent to △ABC? Give a reason.', a: 'Yes. Reflections and translations change position only, not size or shape.', ch: ['Yes', 'No'], ci: 0 }] },

  { id: 'D', part: 'D', text: 'Quick-fire multiple choice. Try these without a calculator first, then check.', mcq: [
    ['The point (6, −1) is reflected in the y-axis. The image is:', ['(−6, −1)', '(6, 1)', '(−6, 1)', '(6, −1)'], 0],
    ['Which statement is <b>not</b> a test for congruent triangles?', ['SAS', 'SSS', 'AAA', 'RHS'], 2],
    ['Calculate 15% of $60.', ['$4', '$15', '$90', '$9'], 3],
    ['A translation by the vector (−3, −5) moves a shape:', ['3 left and 5 down', '3 right and 5 down', '3 right and 5 up', '3 left and 5 up'], 0],
    ['Solve 2x − 6 &gt; 10.', ['x &lt; 8', 'x &gt; 16', 'x &gt; 2', 'x &gt; 8'], 3],
    ['Express 30 cm as a percentage of 1.5 m.', ['200%', '20%', '5%', '2%'], 1],
    ['The gradient of the line through (0, 5) and (4, 1) is:', ['−1', '1', '−4', '4'], 0],
    ['A price falls from $50 to $40. The percentage change is:', ['20% increase', '25% decrease', '20% decrease', '10% decrease'], 2],
    ['Which rule describes a quantity that starts at 8 and increases by 3 each step?', ['y = 3x + 8', 'y = 8 − 3x', 'y = 11x', 'y = 8x + 3'], 0],
    ['The y-intercept of y = 7 − 4x is:', ['−7', '7', '4', '−4'], 1],
    ['A quadrilateral has four equal sides, and its diagonals cross at right angles and bisect each other. It is a:', ['rectangle', 'kite', 'rhombus', 'trapezium'], 2],
    ['In a 3D coordinate system, the point (0, 0, 5) lies on the:', ['floor (xy-plane)', 'x-axis', 'z-axis', 'y-axis'], 2],
    ['8% of a number is 12. The number is:', ['100', '96', '150', '1.5'], 2],
    ['Two triangles are similar with scale factor 3. A side of length 4 cm in the smaller triangle matches a side of length:', ['0.75 cm', '1.33 cm', '12 cm', '7 cm'], 2],
    ['Which inequality is shown on the number line?' + '<div class="qfig">' + nlSVG('>', 2, { min: -4, max: 6, w: 320 }) + '</div>', ['x ≤ 2', 'x &lt; 2', 'x &gt; 2', 'x ≥ 2'], 2],
    ['In a parallelogram, one angle is 65°. An angle next to it is:', ['295°', '65°', '115°', '25°'], 2]
  ] },

  { id: 'E1', part: 'E', star: 'Multi-step', text: 'Plumber A charges a $65 call-out fee plus $48 per hour. Plumber B charges a $30 call-out fee plus $60 per hour.', parts: [
    { l: 'a', q: 'Write a rule for Plumber A’s cost, C dollars, for h hours of work.', a: 'C = 65 + 48h', r: rule('C', 'h', 48, 65) }, { l: 'b', q: 'How much does Plumber A charge for 3.5 hours?', a: '65 + 168 = $233', n: 233 },
    { l: 'c', q: 'A job costs $401 with Plumber A. How many hours did it take?', a: '401 = 65 + 48h, so h = 7 hours', n: 7, k: '65 + 48h = 401' }, { l: 'd', q: 'For how many hours do the two plumbers charge the same amount? (2 d.p.)', a: '65 + 48h = 30 + 60h, so 35 = 12h and h = 2.92 hours', n: 2.92, k: '65 + 48h = 30 + 60h' },
    { l: 'e', q: 'Which plumber is cheaper for a job longer than this time? Explain.', a: 'Plumber A: its hourly rate is lower, so it becomes cheaper after 2.92 hours.' }] },
  { id: 'E2', part: 'E', star: 'Multi-step', text: 'Jess is paid $12 per hour plus a $50 bonus. She wants to earn at least $300.', parts: [
    { l: 'a', q: 'Write an inequality for the number of hours, h, she must work.', a: '12h + 50 ≥ 300' }, { l: 'b', q: 'Solve the inequality (2 d.p.).', a: '12h ≥ 250, so h ≥ 20.83', iq: { v: 'h', op: '>=', val: 20.83 }, k: '12h + 50 >= 300' },
    { l: 'c', q: 'If she can only work whole hours, what is the least number of hours she must work?', a: '21 hours (20 hours would give only $290)', n: 21 }] },
  { id: 'E3', part: 'E', star: 'Multi-step', text: 'A school has 500 students. 45% are in the junior school. Of the junior students, 40% are in Year 8, and 60% of the Year 8 students are girls.', parts: [
    { l: 'a', q: 'How many students are in the junior school?', a: '0.45 × 500 = 225', n: 225 }, { l: 'b', q: 'How many students are in Year 8?', a: '0.4 × 225 = 90', n: 90 }, { l: 'c', q: 'How many Year 8 girls are there?', a: '0.6 × 90 = 54', n: 54 }, { l: 'd', q: 'What percentage of all the students are in Year 8?', a: '90 ÷ 500 × 100 = 18%', n: 18 }] },
  { id: 'E4', part: 'E', star: 'Challenge', text: 'The population of a town fell by 8% to 4600 people. The following year it grew by 10%.', parts: [
    { l: 'a', q: 'What was the population before the fall?', a: '4600 ÷ 0.92 = 5000', n: 5000 }, { l: 'b', q: 'What is the population after the growth?', a: '4600 × 1.1 = 5060 people', n: 5060 }] },
  { id: 'E5', part: 'E', star: 'Challenge', text: 'The opposite angles of a parallelogram are (3x + 10)° and (2x + 30)°.', parts: [
    { l: 'a', q: 'Write an equation and solve it to find x.', a: '3x + 10 = 2x + 30, so x = 20', n: 20, k: '3x + 10 = 2x + 30' }, { l: 'b', q: 'Find the size of each of these angles.', a: '3(20) + 10 = 70°', n: 70 }, { l: 'c', q: 'Find the size of the other two angles.', a: '180 − 70 = 110° each', n: 110 }] },
  { id: 'E6', part: 'E', star: 'Multi-step', text: 'Gym A charges a $20 joining fee plus $15 per week. Gym B has no joining fee but charges $19 per week.', parts: [
    { l: 'a', q: 'Write a rule for the cost of each gym after w weeks.', a: 'A: C = 20 + 15w; B: C = 19w' }, { l: 'b', q: 'Compare the costs after 10 weeks.', a: 'A: $170, B: $190', ns: [170, 190] },
    { l: 'c', q: 'After how many weeks do the gyms cost the same?', a: '20 + 15w = 19w, so 4w = 20 and w = 5 weeks', n: 5, k: '20 + 15w = 19w' }, { l: 'd', q: 'Which gym is cheaper for an 8-week membership? Show your working.', a: 'A: 20 + 120 = $140, B: 19 × 8 = $152, so Gym A is cheaper.', ch: ['Gym A', 'Gym B'], ci: 0 }] },
  { id: 'E7', part: 'E', star: 'Challenge', text: 'A rectangle is 3 cm longer than it is wide. Its perimeter is 38 cm. Let the width be x cm.', parts: [
    { l: 'a', q: 'Write an equation for the perimeter and solve it.', a: '2(x + x + 3) = 38, so 4x + 6 = 38 and x = 8', n: 8, k: '2(x + x + 3) = 38' }, { l: 'b', q: 'Find the length and the width.', a: 'width 8 cm, length 11 cm', ns: [11, 8] }, { l: 'c', q: 'Find the area of the rectangle.', a: '8 × 11 = 88 cm²', n: 88 }] },
  { id: 'E8', part: 'E', star: 'Challenge', text: 'In the diagram, DE is parallel to BC. AD = 6 cm, DB = x cm, AE = 9 cm and the whole side AC = 3x cm. (Not to scale.) Write an equation using the ratio of corresponding sides and solve it to find x.', parts: [
    { l: '', q: '', a: 'AB/AD = AC/AE: (6 + x)/6 = 3x/9, so 9(6 + x) = 18x, 54 + 9x = 18x, x = 6.', n: 6, k: '9(6 + x) = 18x' }] }
];
BOOKLET.forEach(q => { if (BK_DIAGRAMS[q.id]) q.dia = BK_DIAGRAMS[q.id]; });
const BK_PARTS = { A: 'Part A: Linear relations', B: 'Part B: Percentages', C: 'Part C: Space', D: 'Part D: Quick-fire multiple choice', E: 'Part E: Putting it all together' };

/* ================= flashcards ================= */
const FLASH = [
  ['7I', 'What does an open circle on a number line mean?', 'The number is NOT included. Use it for &lt; and &gt;.'], ['7I', 'What does a closed (filled) circle mean?', 'The number IS included. Use it for ≤ and ≥.'],
  ['7I', 'When do you reverse an inequality sign?', 'When you multiply or divide both sides by a negative number, or swap the two sides.'], ['7I', '“at least” and “at most”', 'at least → ≥ &nbsp; at most → ≤'],
  ['7J', 'Solve −3x ≥ 12', 'x ≤ −4 (divide by −3 and reverse the sign)'], ['EQ', 'First step for 3(x − 4) = 12?', 'Expand: 3x − 12 = 12 (or divide both sides by 3: x − 4 = 4)'],
  ['L2', 'Gradient formula', 'm = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁)'], ['L2', 'Gradient of a horizontal line? A vertical line?', 'Horizontal: 0. Vertical: undefined.'],
  ['L3', 'In y = mx + c, what are m and c?', 'm = gradient, c = y-intercept'], ['L3', 'How do you find the x-intercept?', 'Put y = 0 and solve for x.'], ['L3', 'm and c for y = 9 − 2x', 'm = −2, c = 9'],
  ['L4', 'In a worded rule, what is the fixed fee?', 'The constant c (the y-intercept).'], ['L4', 'Rule: $4 fee plus $2.50 per km', 'C = 4 + 2.5d'],
  ['L5', 'How do you test if a point is on a line?', 'Substitute its x into the rule. If you get its y, it is on the line.'], ['L1', 'Which quadrant is (−3, 4) in?', '2nd quadrant (top left)'],
  ['10A', 'Reflect (x, y) in the x-axis', '(x, −y)'], ['10A', 'Reflect (x, y) in the y-axis', '(−x, y)'], ['10A', 'Reflect (x, y) in y = x', '(y, x)'],
  ['10B', 'Translate (x, y) by vector (a, b)', '(x + a, y + b). a: right/left, b: up/down'], ['10B', 'How do you find a translation vector?', 'image − original (for x and for y)'],
  ['10C', 'Rotate (x, y) 90° clockwise about O', '(y, −x)'], ['10C', 'Rotate (x, y) 90° anticlockwise about O', '(−y, x)'], ['10C', 'Rotate (x, y) 180° about O', '(−x, −y)'],
  ['10D', 'What does ≅ mean?', 'is congruent to (same shape AND same size)'], ['10D', '△ABC ≅ △PQR. What matches BC?', 'QR (letters match in order)'],
  ['10E', 'The four congruence tests', 'SSS, SAS (included angle), AAS, RHS'], ['10E', 'Why is AAA not a congruence test?', 'Equal angles only show the same shape; the sizes could differ (similar).'],
  ['10G', 'Diagonals of a rhombus', 'Bisect each other at right angles and bisect the vertex angles.'], ['10G', 'Diagonals of a rectangle', 'Equal in length and bisect each other.'], ['10G', 'Kite diagonals', 'Meet at 90°. The diagonal that is the line of symmetry cuts the other one in half.'],
  ['10G', 'Co-interior angles between parallel lines', 'Add to 180°.'], ['10H', 'Scale factor formula', 'k = image length ÷ original length'], ['10H', 'What does ~ mean?', 'is similar to (same shape, can be a different size)'],
  ['10I', 'The four similarity tests', 'AAA, SSS (same ratio), SAS (two ratios + included angle), RHS'], ['10I', 'Overlapping triangles tip', 'Use whole sides: AB = AD + DB.'],
  ['XYZ', 'Point (0, 0, 5) lies on…', 'the z-axis'], ['XYZ', 'How can you tell a 3D point is on the floor?', 'Its z-coordinate is 0.'],
  ['3F', 'When does a fraction terminate as a decimal?', 'When (in simplest form) the denominator only has prime factors 2 and 5.'], ['3F', '1/3, 2/3 and 1/6 as decimals', '0.333…, 0.666…, 0.1666…'], ['3F', '3/11 as a decimal', '0.272727… (27 repeats)'],
  ['3G', '12.5% as a fraction', '1/8'], ['3G', '0.07 as a percentage', '7%'], ['3G', '3/8 as a percentage', '37.5%'],
  ['3H', 'Express a as a % of b', 'a ÷ b × 100 (same units first)'], ['3H', 'Find 10% quickly', 'Divide by 10.'],
  ['3I', 'Multiplier to increase by 12%', '× 1.12'], ['3I', 'Multiplier for a 35% discount', '× 0.65'], ['3I', 'Remove GST from a price', 'Divide by 1.1'], ['3I', 'Profit %', 'profit ÷ cost price × 100'],
  ['3J', '% change formula', 'change ÷ original × 100'], ['3K', 'Unitary method', 'Find 1% first, then multiply.'], ['3K', 'Original price if $144 is after a 20% rise', '144 ÷ 1.2 = $120'], ['3K', '+25% then −20% overall?', '1.25 × 0.8 = 1 → 0% change']
];

/* ================= glossary ================= */
const GLOSS = [
  ['Inequality', 'A statement that two amounts are not necessarily equal, using <, >, ≤ or ≥.', '7I'], ['Solution set', 'All the values that make an inequality true.', '7J'],
  ['Open circle', 'Used on a number line for < or >: the endpoint is not included.', '7I'], ['Closed circle', 'Used for ≤ or ≥: the endpoint is included.', '7I'],
  ['Pronumeral', 'A letter that stands for a number, like x or w.', 'EQ'], ['Equation', 'A statement that two expressions are equal.', 'EQ'], ['Inverse operation', 'The operation that undoes another: + and −, × and ÷.', 'EQ'],
  ['Cartesian plane', 'A grid with an x-axis and a y-axis, used to locate points (x, y).', 'L1'], ['Origin', 'The point (0, 0) where the axes cross.', 'L1'], ['Quadrant', 'One of the four regions made by the axes.', 'L1'],
  ['Linear relation', 'A relationship whose graph is a straight line; y changes by a constant amount.', 'L1'], ['Table of values', 'A table of x-values and the matching y-values from a rule.', 'L1'],
  ['Gradient (m)', 'The steepness of a line: rise ÷ run.', 'L2'], ['Rise', 'The vertical change between two points.', 'L2'], ['Run', 'The horizontal change between two points.', 'L2'],
  ['y-intercept (c)', 'Where a line crosses the y-axis (x = 0).', 'L3'], ['x-intercept', 'Where a line crosses the x-axis (y = 0).', 'L3'], ['Rule', 'An equation linking two variables, such as y = 2x + 3.', 'L4'],
  ['Transformation', 'A change in position or size: reflection, translation, rotation, enlargement.', '10A'], ['Image', 'The new figure after a transformation (A → A′).', '10A'], ['Object', 'The original figure before a transformation.', '10A'],
  ['Reflection', 'A flip over a mirror line.', '10A'], ['Mirror line', 'The line a shape is reflected in (axis of symmetry).', '10A'],
  ['Translation', 'A slide by a vector; every point moves the same distance and direction.', '10B'], ['Vector', 'An instruction (a, b): a across, b up/down.', '10B'],
  ['Rotation', 'A turn about a centre by an angle in a direction.', '10C'], ['Centre of rotation', 'The fixed point a shape turns around.', '10C'], ['Clockwise', 'The direction clock hands turn ↻.', '10C'],
  ['Congruent (≅)', 'Exactly the same shape and size.', '10D'], ['Corresponding', 'Matching parts in two figures.', '10D'],
  ['SSS', 'Side–side–side: all three pairs of sides equal.', '10E'], ['SAS', 'Side–angle–side: two sides and the included angle equal.', '10E'], ['AAS', 'Angle–angle–side: two angles and a matching side equal.', '10E'],
  ['RHS', 'Right angle–hypotenuse–side.', '10E'], ['Hypotenuse', 'The longest side of a right-angled triangle, opposite the right angle.', '10E'], ['Included angle', 'The angle between two given sides.', '10E'],
  ['Parallelogram', 'A quadrilateral with both pairs of opposite sides parallel.', '10G'], ['Rhombus', 'A parallelogram with all sides equal.', '10G'], ['Rectangle', 'A parallelogram with all angles 90°.', '10G'],
  ['Kite', 'A quadrilateral with two pairs of equal adjacent sides.', '10G'], ['Trapezium', 'A quadrilateral with one pair of parallel sides.', '10G'], ['Bisect', 'Cut into two equal parts.', '10G'],
  ['Alternate angles', 'Angles in a Z shape between parallel lines; they are equal.', '10G'], ['Corresponding angles', 'Angles in an F shape on parallel lines; they are equal.', '10G'], ['Co-interior angles', 'Angles in a C shape between parallel lines; they add to 180°.', '10G'], ['Vertically opposite angles', 'Opposite angles where two lines cross; they are equal.', '10I'],
  ['Similar (~)', 'Same shape, possibly different size; matching sides in the same ratio.', '10H'], ['Scale factor', 'How many times bigger the image is: image ÷ original.', '10H'], ['Enlargement', 'A transformation that changes size but keeps shape.', '10H'],
  ['3D coordinates', 'Three numbers (x, y, z) locating a point in space.', 'XYZ'], ['xy-plane', 'The flat “floor” where z = 0.', 'XYZ'],
  ['Terminating decimal', 'A decimal that stops, e.g. 0.625.', '3F'], ['Recurring decimal', 'A decimal with digits that repeat forever, e.g. 0.333….', '3F'], ['Decimal places (d.p.)', 'The number of digits after the decimal point.', '3F'],
  ['Percentage', 'A number out of 100 (per cent).', '3G'], ['Unitary method', 'Find the value of one unit (e.g. 1%) first, then scale up.', '3K'], ['Percentage change', 'change ÷ original × 100.', '3J'],
  ['Discount', 'The amount taken off a price.', '3I'], ['Mark-up', 'The amount added to the cost price to make the selling price.', '3I'], ['Profit', 'Selling price − cost price (when positive).', '3I'], ['Loss', 'Cost price − selling price (when you sell for less).', '3I'],
  ['Cost price', 'What a business pays for an item.', '3I'], ['Selling price', 'What the customer pays.', '3I'], ['Retail price', 'The price marked in a shop.', '3I'], ['Wholesale price', 'The price a shop pays a supplier.', '3I'],
  ['GST', 'Goods and Services Tax: 10% added to most prices in Australia.', '3I'], ['Commission', 'Pay calculated as a percentage of sales.', '3I'], ['Multiplier', 'The number you multiply by for a % change, e.g. 1.12 for +12%.', '3I']
];

/* ================= the quick version of every topic (shown first in Learn) ================= */
const QUICK = {
  '7I': { what: 'An inequality says one side is bigger or smaller than the other.', steps: ['<b>&lt;</b> means less than. <b>&gt;</b> means greater than.', '<b>≤</b> and <b>≥</b> include the number: draw a <b>filled dot ●</b>.', '<b>&lt;</b> and <b>&gt;</b> don’t include it: draw an <b>open dot ○</b>.', 'The arrow points the way the answers go.', 'Times or divide both sides by a <b>negative</b>? <b>Flip the sign.</b>'], eg: 'x ≥ 2 → filled dot at 2, arrow to the right.' },
  '7J': { what: 'Solve it the same way as an equation.', steps: ['Do the same thing to both sides.', 'Get x on its own.', 'Divided or multiplied by a negative? <b>Flip the sign.</b>', 'Check: put in a number from your answer.'], eg: '2x + 1 > 7 → 2x > 6 → x > 3' },
  'EQ': { what: 'Find the number the letter stands for.', steps: ['Expand any brackets.', 'Get all the x’s on one side.', 'Move the plain numbers to the other side.', 'Divide to get x on its own.', 'Check by putting your answer back in.'], eg: '3x + 4 = 19 → 3x = 15 → x = 5' },
  'L1': { what: 'A point is written (across, up).', steps: ['Start at (0, 0), the middle.', 'First number (x): go right if +, left if −.', 'Second number (y): go up if +, down if −.', 'To graph a rule: pick some x values, work out y, plot the points, join them with a ruler.'], eg: 'y = 2x − 3: x = 0 gives y = −3, x = 1 gives y = −1.' },
  'L2': { what: 'Gradient tells you how steep a line is.', steps: ['Pick two points on the line.', 'Rise = how much y changes.', 'Run = how much x changes.', '<b>Gradient = rise ÷ run.</b>', 'Line goes down from left to right? The gradient is negative.'], eg: '(1, 2) and (4, 11): rise 9, run 3, gradient = 9 ÷ 3 = 3' },
  'L3': { what: 'In <b>y = mx + c</b>, m is the gradient and c is where the line crosses the y-axis.', steps: ['m = the number in front of x (keep its sign).', 'c = the number on its own.', 'x-intercept: put y = 0 and solve.', 'From a graph: read c off the y-axis, then count rise ÷ run for m.'], eg: 'y = 9 − 2x → m = −2, c = 9' },
  'L4': { what: 'Turn a story or a table into a rule.', steps: ['The starting amount or fixed fee is <b>c</b>.', 'The amount per km / hour / week is <b>m</b>.', 'If it goes down, m is negative.', 'Write it as y = mx + c, using the letters you’re given.', 'From a table: m = how much y goes up each step, c = y when x is 0.'], eg: '$4 fee + $2.50 per km → C = 4 + 2.5d' },
  'L5': { what: 'Use a rule to answer questions.', steps: ['Know x? Put it into the rule and work it out.', 'Know the answer? Make an equation and solve it.', 'Is a point on the line? Put its x in. Do you get its y?', 'When are two plans the same? Make the rules equal and solve.'], eg: 'A = 45 + 15w. After 8 weeks: 45 + 15 × 8 = $165' },
  '10A': { what: 'A reflection flips a shape over a mirror line.', steps: ['Each point ends up the same distance away, on the other side.', 'Mirror on the <b>x-axis</b>: change the sign of <b>y</b>.', 'Mirror on the <b>y-axis</b>: change the sign of <b>x</b>.', 'Name the new points with a dash: A becomes A′.'], eg: '(4, 1) in the x-axis → (4, −1)' },
  '10B': { what: 'A translation slides a shape.', steps: ['A vector (a, b) tells you how far to move.', 'a: right if +, left if −.', 'b: up if +, down if −.', 'Add a to every x and b to every y.', 'To find the vector: new point − old point.'], eg: '(1, 2) moved by (3, −2) → (4, 0)' },
  '10C': { what: 'A rotation turns a shape around a point.', steps: ['You need the centre, the angle and the direction.', '90° clockwise: (x, y) → (y, −x)', '90° anticlockwise: (x, y) → (−y, x)', '180°: change both signs.'], eg: '(2, 3) turned 180° → (−2, −3)' },
  '10D': { what: 'Congruent means exactly the same shape and size.', steps: ['The symbol is <b>≅</b>.', 'Letters match in order: △ABC ≅ △PQR means A↔P, B↔Q, C↔R.', 'Matching sides are equal and matching angles are equal.', 'Missing angle? The angles in a triangle add to 180°.'], eg: '△ABC ≅ △PQR, so AB = PQ and ∠B = ∠Q.' },
  '10E': { what: 'There are four ways to prove two triangles are congruent.', steps: ['<b>SSS</b>: all 3 sides match.', '<b>SAS</b>: 2 sides and the angle <b>between</b> them match.', '<b>AAS</b>: 2 angles and a side match.', '<b>RHS</b>: right angle, longest side and one other side match.', '<b>AAA does not work</b>: same angles can be different sizes.'], eg: 'Sides 6, 8, 10 in both triangles → SSS.' },
  '10G': { what: 'Use the facts about each shape to find angles and sides.', steps: ['Parallelogram: opposite angles are equal, and angles next to each other add to 180°.', 'Rhombus: all 4 sides are equal.', 'Rectangle: the diagonals are equal.', 'Kite: the diagonals cross at 90°.', 'Any 4-sided shape: the angles add to 360°.'], eg: 'Parallelogram with one angle 68° → the others are 112°, 68° and 112°.' },
  '10H': { what: 'Similar means the same shape but a different size.', steps: ['Match up the sides.', '<b>Scale factor = new ÷ old.</b>', 'Making it bigger? Multiply by the scale factor.', 'Making it smaller? Divide by the scale factor.'], eg: '6 cm becomes 15 cm → scale factor 15 ÷ 6 = 2.5' },
  '10I': { what: 'Similar triangles have matching angles, and their sides grow by the same amount.', steps: ['Show the angles match (AAA), or the sides are in the same ratio (SSS, SAS, RHS).', 'Find the scale factor from one matching pair of sides.', 'Multiply or divide to find the missing side.', 'Triangles inside each other? Use the <b>whole</b> side.', 'Shadows: height ÷ shadow is the same for everything.'], eg: 'Pole 4.5 m with a 3 m shadow; tree shadow 8 m → tree = 4.5 × 8 ÷ 3 = 12 m' },
  'XYZ': { what: 'A 3D point is written (x, y, z).', steps: ['x first, then y, then z (z is up).', 'On the floor, z = 0.', 'On an axis, the other two numbers are 0.'], eg: '(3, 5, 2): 3 along x, 5 along y, then 2 up.' },
  '3F': { what: 'To turn a fraction into a decimal, divide the top by the bottom.', steps: ['Top ÷ bottom.', 'Decimal stops? It’s <b>terminating</b>. Repeats forever? It’s <b>recurring</b>.', 'To round: look at the next digit. 5 or more, round up. 4 or less, leave it.'], eg: '3/8 = 0.375 (terminating). 1/3 = 0.333… (recurring).' },
  '3G': { what: 'Fractions, decimals and percentages are three ways to write the same thing.', steps: ['% → decimal: ÷ 100', 'Decimal → %: × 100', '% → fraction: put it over 100 and simplify.', 'Fraction → %: × 100'], eg: '35% = 0.35 = 35/100 = 7/20' },
  '3H': { what: 'Find a percentage of something, or write one amount as a percentage.', steps: ['<b>p% of an amount</b> = p ÷ 100 × amount.', '<b>a as a % of b</b> = a ÷ b × 100.', 'Make the units the same first (e.g. 2 L = 2000 mL).'], eg: '35% of $80 = 0.35 × 80 = $28. 18 out of 24 = 75%.' },
  '3I': { what: 'Make an amount bigger or smaller by a percentage.', steps: ['Increase by p%: × (1 + p/100). e.g. +12% → × 1.12', 'Decrease by p%: × (1 − p/100). e.g. −35% → × 0.65', 'Add GST: × 1.1. Take GST off: ÷ 1.1', 'Profit % = profit ÷ cost price × 100.'], eg: 'Increase $250 by 12%: 250 × 1.12 = $280' },
  '3J': { what: 'How much did it change, as a percentage?', steps: ['Change = new − old.', 'Divide by the <b>old</b> amount.', 'Multiply by 100.', 'Say whether it’s an increase or a decrease.'], eg: '$80 → $100: 20 ÷ 80 × 100 = 25% increase' },
  '3K': { what: 'Find 1% first, then work out anything else.', steps: ['Divide to find 1%.', 'Multiply up to the % you want.', 'Original price before a change: new price ÷ multiplier.'], eg: '8% = 36 → 1% = 4.5 → 100% = 450' }
};

/* ================= skill pages (tap a skill in the Home checklist) =================
   One entry per checklist skill, in the same order: x = the simple explanation,
   eg = a worked example, g = the question generators used for its practice questions. */
const SKILL_INFO = [
  // Linear relations
  { x: 'Gradient tells you how steep a line is. <b>Gradient = rise ÷ run</b> = (y₂ − y₁) ÷ (x₂ − x₁). Take away the two y-values, then the two x-values in the same order, then divide.', eg: '(1, 2) and (4, 11): rise = 11 − 2 = 9, run = 4 − 1 = 3, gradient = 9 ÷ 3 = <b>3</b>.', g: ['gradient2', 'gradientType'] },
  { x: 'Write the rule as <b>y = mx + c</b>.<ul><li>The number in front of x is the <b>gradient (m)</b>.</li><li>The number on its own is the <b>y-intercept (c)</b>: where the line crosses the y-axis.</li></ul>Keep the sign that is in front of each number.', eg: 'y = 9 − 2x is the same as y = −2x + 9, so <b>m = −2</b> and <b>c = 9</b>.', g: ['mcRule'] },
  { x: 'Find two things:<ul><li>the <b>starting amount</b> (the value when x = 0). This is c.</li><li>how much it <b>goes up or down each step</b>. This is the gradient, m.</li></ul>Then write <b>y = mx + c</b>. In a table, the change from one y-value to the next is the gradient.', eg: 'A taxi charges a $4 fee plus $2.50 per km → <b>C = 2.5d + 4</b>.', g: ['ruleTable', 'ruleWords'] },
  { x: 'Put each x-value into the rule to work out y. Plot each (x, y) point, then join them with a ruler. If the points make a straight line, it is a linear relation.', eg: 'y = 2x − 3. When x = 2: y = 2 × 2 − 3 = 1, so plot the point <b>(2, 1)</b>.', g: ['tableFill', 'plotRead', 'isLinear'] },
  { x: '<b>To find y:</b> put the x-value into the rule.<br><b>To find x:</b> put in the y-value, then solve by undoing each step.<br>Finish with a sentence that answers the question, with units.', eg: 'A = 45 + 15w. When does A = 300? 15w = 255, so w = 17. <b>After 17 weeks.</b>', g: ['ruleUse', 'evalRule', 'solveRule', 'breakEven'] },
  { x: 'Words to signs:<ul><li><b>at least</b> → ≥ &nbsp; <b>at most / no more than</b> → ≤</li><li><b>more than</b> → &gt; &nbsp; <b>less than</b> → &lt;</li></ul>On a number line use an <b>open circle</b> for &lt; or &gt;, a <b>filled circle</b> for ≤ or ≥, and an arrow pointing to the numbers that work.', eg: 'You must be at least 12 → <b>a ≥ 12</b>: filled circle on 12, arrow to the right.', g: ['ineqWords', 'ineqRead', 'ineqConcept'] },
  { x: 'Solve it just like an equation. The one extra rule: if you <b>multiply or divide by a negative number, flip the sign</b> (&lt; becomes &gt;). Adding or subtracting never flips it.', eg: '−3x &gt; 12 → divide both sides by −3 and flip → <b>x &lt; −4</b>.', g: ['ineqSolve', 'ineqSolveGraph', 'ineqNeg', 'ineqFlip'] },
  { x: 'Undo what was done to x, in reverse order. Whatever you do to one side, do to the other side too. If the answer is a fraction, that’s fine: leave it as a fraction.', eg: '4x + 3 = 13 → take away 3: 4x = 10 → divide by 4: <b>x = 5/2</b> (2.5).', g: ['eqSolve', 'eqWord'] },
  { x: '<b>From a graph:</b> c is where the line crosses the y-axis. Pick two points on the line and find the gradient (rise ÷ run). Write y = mx + c.<br><b>Is a point on the line?</b> Put its x into the rule. If you get its y, it is on the line.', eg: 'The line goes through (0, 3) and (1, 1): m = −2, c = 3, so <b>y = −2x + 3</b>. Is (2, −1) on it? −2 × 2 + 3 = −1 ✓ yes.', g: ['ruleGraph', 'gradientGraph', 'onLine', 'rule2pts'] },
  // Percentage
  { x: 'Change the percentage to a decimal (divide by 100), then multiply by the amount.', eg: '15% of $80 = 0.15 × 80 = <b>$12</b>.', g: ['pctOf'] },
  { x: '<b>(part ÷ whole) × 100</b>. Make both amounts the same units first.', eg: '30 cm out of 2 m: 2 m = 200 cm, so 30 ÷ 200 × 100 = <b>15%</b>.', g: ['asPct'] },
  { x: 'Use a multiplier:<ul><li><b>Increase</b> by 20% → × 1.2 (100% + 20%)</li><li><b>Decrease</b> by 20% → × 0.8 (100% − 20%)</li></ul>', eg: '$50 decreased by 20% = 50 × 0.8 = <b>$40</b>.', g: ['incDec'] },
  { x: '<b>% change = change ÷ original × 100</b>. Always divide by the <b>original</b> (starting) amount, not the new one.', eg: '$40 goes up to $50: change = 10, so 10 ÷ 40 × 100 = <b>25% increase</b>.', g: ['pctChange', 'pctChangeMcq'] },
  { x: 'Find <b>1%</b> first (divide by the percentage), then multiply to get the percentage you want.', eg: '12% is $36 → 1% = 36 ÷ 12 = $3 → 100% = <b>$300</b>.', g: ['unitary'] },
  { x: '<ul><li><b>Profit</b> = selling price − cost price</li><li><b>Loss</b> = cost price − selling price</li><li><b>Discount</b> takes a percentage off the price</li><li><b>GST</b> adds 10%: multiply by 1.1</li></ul>', eg: '$200 plus GST = 200 × 1.1 = <b>$220</b>.', g: ['shopping', 'vocab'] },
  { x: 'Work out what percentage the new amount is of the original. Then divide by that multiplier (or use the unitary method).', eg: 'After a 20% discount a shirt costs $64. $64 is 80% of the original, so 64 ÷ 0.8 = <b>$80</b>.', g: ['reversePct'] },
  { x: 'Do one step at a time and write each answer down. For changes that happen one after another, multiply by each multiplier in turn. Don’t just add the percentages.', eg: '$100 goes up 10%, then down 10%: 100 × 1.1 × 0.9 = <b>$99</b> (not $100).', g: ['multiStepPct', 'successive'] },
  // Space
  { x: '<ul><li><b>Reflect in the x-axis:</b> (x, y) → (x, −y)</li><li><b>Reflect in the y-axis:</b> (x, y) → (−x, y)</li><li><b>Translate:</b> left/right changes x, up/down changes y</li></ul>', eg: '(2, 3) moved 4 left and 1 up → <b>(−2, 4)</b>.', g: ['reflectPt', 'translatePt', 'reflectShape', 'translateShape'] },
  { x: 'Name the type, then the details:<ul><li>a <b>reflection</b>: say the mirror line</li><li>a <b>translation</b>: say how far left/right and up/down</li></ul>For two moves, describe each one in order.', eg: '“Reflected in the y-axis, then translated 3 units down.”', g: ['reflectWhich', 'findVector', 'vectorWords'] },
  { x: 'Congruent means exactly the same shape and size. The tests:<ul><li><b>SSS</b>: all 3 sides match</li><li><b>SAS</b>: 2 sides and the angle between them</li><li><b>AAS</b>: 2 angles and a side</li><li><b>RHS</b>: right angle, hypotenuse and one side</li></ul>Say which parts match.', eg: 'Both triangles have sides 5, 7 and 9 → congruent by <b>SSS</b>.', g: ['congTest', 'congTestNamed', 'congConcept'] },
  { x: 'Match the corresponding parts: the letters are in the same order in the name. Matching sides are equal, and matching angles are equal.', eg: 'If △ABC ≅ △DEF, then <b>AB = DE</b> and <b>∠C = ∠F</b>.', g: ['corrParts', 'congFind'] },
  { x: 'Similar means the same shape but a different size.<ul><li><b>Scale factor</b> = big side ÷ matching small side</li><li>Tests: <b>AAA</b>, <b>SSS</b> (all sides in the same ratio), <b>SAS</b> (two sides in ratio and the angle between them equal), <b>RHS</b></li></ul>Write it with the letters in matching order, like △ABC ~ △DEF.', eg: 'Sides 6, 8, 10 and 9, 12, 15: every side × 1.5, so the scale factor is <b>1.5</b> → similar (SSS).', g: ['simTest', 'scaleFactor', 'similarCheck', 'shadow'] },
  { x: 'Find the scale factor from one pair of matching sides, then multiply (or divide) to find the missing side.<ul><li><b>Overlapping</b> triangles: draw them separately first.</li><li><b>Crossing</b> (hourglass) triangles: match the sides opposite equal angles.</li></ul>', eg: 'Small side 4, matching big side 6 → scale factor 1.5. Missing big side = 1.5 × 5 = <b>7.5</b>.', g: ['parallelTri', 'hourglass', 'similarSide', 'shadow'] },
  { x: '<ul><li><b>Parallelogram:</b> opposite sides parallel and equal, opposite angles equal</li><li><b>Rhombus:</b> all sides equal, diagonals cross at 90°</li><li><b>Rectangle:</b> all angles 90°, diagonals equal</li><li><b>Kite:</b> two pairs of equal sides next to each other, diagonals cross at 90°</li><li><b>Trapezium:</b> one pair of parallel sides</li></ul>', eg: 'A parallelogram has a 70° angle → the opposite angle is <b>70°</b>, and the other two are <b>110°</b> (70 + 110 = 180).', g: ['quadAngles', 'quadFacts', 'kiteTF', 'quadProof'] },
  { x: 'In 3D every point has three coordinates <b>(x, y, z)</b>. In the booklet the x-axis comes towards you, the y-axis goes to the right and the z-axis goes up. The origin is (0, 0, 0).', eg: 'Come 2 towards you, go 4 right and 3 up → <b>(2, 4, 3)</b>.', g: ['boxCorner', 'axisPlane', 'move3d'] }
];
/* ================= Maths: difficulty of each question type, and long-response questions ================= */
const DIFF = {
  ineqRead: 'e', ineqWords: 'm', ineqFlip: 'm', ineqNeg: 'm', ineqTest: 'e', ineqConcept: 'm',
  ineqSolve: 'm', ineqSolveGraph: 'm', ineqContext: 'h',
  eqSolve: 'm', eqWord: 'h',
  tableFill: 'e', plotRead: 'e', quadrant: 'e', isLinear: 'm',
  gradient2: 'm', gradientType: 'e', gradientGraph: 'm',
  mcRule: 'e', ruleGraph: 'm', rule2pts: 'h', xint: 'm',
  ruleTable: 'm', ruleWords: 'h',
  ruleUse: 'm', evalRule: 'e', solveRule: 'm', onLine: 'm', breakEven: 'h',
  reflectPt: 'e', reflectShape: 'm', reflectWhich: 'm',
  translatePt: 'e', findVector: 'm', vectorWords: 'e', translateShape: 'm',
  rotatePt: 'm', rotateShape: 'h', transFacts: 'm',
  corrParts: 'e', congFind: 'm', congConcept: 'e',
  congTest: 'm', congTestNamed: 'h',
  quadAngles: 'm', quadFacts: 'm', quadProof: 'h', kiteTF: 'e',
  scaleFactor: 'e', similarSide: 'm', similarCheck: 'm',
  shadow: 'm', parallelTri: 'h', hourglass: 'h', simTest: 'm',
  boxCorner: 'm', axisPlane: 'e', move3d: 'm',
  fracDecT: 'e', fracDecR: 'm', termOrRec: 'm', roundDec: 'e', recNotation: 'm',
  pctToFrac: 'm', pctToDec: 'e', fracToPct: 'e', decToPct: 'e', decToFrac: 'm',
  pctOf: 'e', asPct: 'm',
  incDec: 'm', shopping: 'h', vocab: 'e',
  pctChange: 'm', pctChangeMcq: 'm',
  unitary: 'm', reversePct: 'h', successive: 'h', multiStepPct: 'h'
};
const LONG = {};
function longGen(id, t, d, name, fn) { LONG[id] = { t, d, name, fn }; }
const lsg = v => (v < 0 ? '−' + Math.abs(v) : String(v));
const lterm = (m, c) => 'y = ' + (m === 1 ? '' : m === -1 ? '−' : lsg(m)) + 'x' + (c ? (c > 0 ? ' + ' + c : ' − ' + Math.abs(c)) : '');

longGen('lIneqNeg', '7J', 'h', 'Solve an inequality and explain', () => {
  const a = rnd(2, 6), x0 = rnd(-5, 6), b = rnd(-9, 9), op = pick(['<', '>', '≤', '≥']); const c = -a * x0 + b; const flip = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' }[op];
  const lhs = '−' + a + 'x' + (b ? (b > 0 ? ' + ' + b : ' − ' + Math.abs(b)) : '');
  return { q: 'Solve <b>' + lhs + ' ' + op.replace('<', '&lt;').replace('>', '&gt;') + ' ' + lsg(c) + '</b>. Show each step, explain what happens to the inequality sign, and describe how to show the answer on a number line.',
    model: (b ? (b > 0 ? 'Subtract ' + b + ' from' : 'Add ' + Math.abs(b) + ' to') + ' both sides: −' + a + 'x ' + op + ' ' + lsg(c - b) + '. ' : '') + 'Divide both sides by −' + a + '. Because we divided by a <b>negative</b>, the sign <b>reverses</b>: <b>x ' + flip + ' ' + lsg(x0) + '</b>. On a number line: ' + (flip.length === 1 && '<>'.includes(flip) ? 'an open circle' : 'a closed (filled) circle') + ' at ' + lsg(x0) + ' with an arrow pointing ' + ('>≥'.includes(flip) ? 'right' : 'left') + '.',
    points: [b ? 'Correctly deals with the ' + lsg(b) + ' first (−' + a + 'x ' + op + ' ' + lsg(c - b) + ')' : 'Sets up the division by −' + a, 'Divides by −' + a, 'Explains the sign reverses because of dividing by a negative', 'Correct answer: x ' + flip + ' ' + lsg(x0), 'Correct number line: ' + ('<>'.includes(flip) ? 'open' : 'closed') + ' circle, arrow ' + ('>≥'.includes(flip) ? 'right' : 'left')] };
});
longGen('lIneqWords', '7I', 'm', 'Write and explain an inequality', () => {
  const [w, s, open] = pick([['at least', '≥', false], ['at most', '≤', false], ['more than', '&gt;', true], ['less than', '&lt;', true], ['no more than', '≤', false], ['a minimum of', '≥', false]]);
  const [c, v, n] = pick([['You must be', 'a', rnd(10, 16) + ' years old to go on the ride'], ['The lift can carry', 'p', rnd(8, 20) + ' people'], ['The bag can hold', 'm', rnd(5, 25) + ' kg'], ['The test needs', 's', rnd(30, 60) + ' marks to pass']]);
  const num = parseInt(n);
  return { q: '“' + c + ' <b>' + w + '</b> ' + n + '.” Write an inequality using <b>' + v + '</b>, and explain how you would show it on a number line.',
    model: '<b>' + v + ' ' + s + ' ' + num + '</b>. “' + w + '” means ' + s + '. On a number line: ' + (open ? 'an open circle' : 'a closed circle') + ' at ' + num + ' (because ' + num + ' is ' + (open ? 'not ' : '') + 'included), with an arrow pointing ' + (s === '≥' || s === '&gt;' ? 'right' : 'left') + '.',
    points: ['Correct inequality: ' + v + ' ' + s + ' ' + num, 'Explains the meaning of “' + w + '”', (open ? 'Open' : 'Closed') + ' circle at ' + num + ', with the reason', 'Arrow in the correct direction'] };
});
longGen('lEquation', 'EQ', 'm', 'Solve and check an equation', () => {
  const a = rnd(2, 6), x = rnd(-6, 9), b = rnd(-8, 8) || 3; const c = a * (x + b);
  return { q: 'Solve <b>' + a + '(x ' + (b > 0 ? '+ ' + b : '− ' + Math.abs(b)) + ') = ' + lsg(c) + '</b>. Show each step and check your answer.',
    model: 'Divide both sides by ' + a + ': x ' + (b > 0 ? '+ ' + b : '− ' + Math.abs(b)) + ' = ' + lsg(c / a) + '. ' + (b > 0 ? 'Subtract ' + b : 'Add ' + Math.abs(b)) + ': <b>x = ' + lsg(x) + '</b>. Check: ' + a + '(' + lsg(x) + ' ' + (b > 0 ? '+ ' + b : '− ' + Math.abs(b)) + ') = ' + a + ' × ' + lsg(x + b) + ' = ' + lsg(c) + ' ✓',
    points: ['Divides by ' + a + ' (or expands the brackets) correctly', 'Undoes the ' + lsg(b) + ' correctly', 'Answer x = ' + lsg(x), 'Checks by substituting back in'] };
});
longGen('lEqWord', 'EQ', 'h', 'Write and solve an equation', () => {
  const each = rnd(3, 12), n = rnd(4, 15), fee = rnd(5, 40), tot = fee + each * n, nm = pick(['Mia', 'Leo', 'Isla', 'Kai', 'Ruby']);
  return { q: nm + ' pays a $' + fee + ' joining fee plus $' + each + ' per class. Altogether ' + nm + ' paid $' + tot + '. Write an equation and solve it to find how many classes ' + nm + ' went to. Explain your steps.',
    model: 'Let c = number of classes. <b>' + fee + ' + ' + each + 'c = ' + tot + '</b>. Subtract ' + fee + ': ' + each + 'c = ' + (tot - fee) + '. Divide by ' + each + ': <b>c = ' + n + '</b>. ' + nm + ' went to ' + n + ' classes.',
    points: ['Defines a pronumeral (e.g. c = number of classes)', 'Correct equation: ' + fee + ' + ' + each + 'c = ' + tot, 'Solves correctly: c = ' + n, 'Answers in words (' + n + ' classes)'] };
});
longGen('lPlot', 'L1', 'm', 'Table of values and the line', () => {
  const m = pick([-3, -2, -1, 1, 2, 3]), c = rnd(-4, 4); const xs = [-1, 0, 1, 2, 3]; const ys = xs.map(x => m * x + c);
  return { q: 'Complete a table of values for <b>' + lterm(m, c) + '</b> for x = −1, 0, 1, 2, 3. Then describe the line you would draw: is it linear, which way does it slope, and where does it cross the y-axis?',
    model: 'y-values: ' + ys.map(v => lsg(v)).join(', ') + ' (for x = −1, 0, 1, 2, 3). The points go up/down by the same amount each time (' + lsg(m) + '), so the relationship is <b>linear</b>. The line slopes <b>' + (m > 0 ? 'upwards' : 'downwards') + '</b> (gradient ' + lsg(m) + ') and crosses the y-axis at <b>(0, ' + lsg(c) + ')</b>.',
    points: ['Correct y-values: ' + ys.map(v => lsg(v)).join(', '), 'Says it is linear (constant change of ' + lsg(m) + ')', 'Slopes ' + (m > 0 ? 'up' : 'down') + ' from left to right', 'Crosses the y-axis at (0, ' + lsg(c) + ')'] };
});
longGen('lGradient', 'L2', 'm', 'Find and explain a gradient', () => {
  const x1 = rnd(-5, 3), y1 = rnd(-6, 6), run = rnd(1, 5), m = pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]); const x2 = x1 + run * (m % 1 ? 2 : 1), y2 = y1 + m * (x2 - x1);
  return { q: 'Find the gradient of the line through <b>(' + lsg(x1) + ', ' + lsg(y1) + ')</b> and <b>(' + lsg(x2) + ', ' + lsg(y2) + ')</b>. Show your working and explain what the gradient tells you.',
    model: 'Gradient = rise ÷ run = (' + lsg(y2) + ' − ' + (y1 < 0 ? '(' + lsg(y1) + ')' : y1) + ') ÷ (' + lsg(x2) + ' − ' + (x1 < 0 ? '(' + lsg(x1) + ')' : x1) + ') = ' + lsg(y2 - y1) + ' ÷ ' + (x2 - x1) + ' = <b>' + fmt(m) + '</b>. ' + (m > 0 ? 'Positive: the line goes up from left to right' : 'Negative: the line goes down from left to right') + ', changing by ' + fmt(Math.abs(m)) + ' for every 1 across.',
    points: ['Uses gradient = rise ÷ run', 'Correct rise: ' + lsg(y2 - y1), 'Correct run: ' + (x2 - x1), 'Correct gradient: ' + fmt(m), 'Explains what it means (direction and steepness)'] };
});
longGen('lRule2', 'L3', 'h', 'Rule through two points', () => {
  const m = pick([-3, -2, -1, 1, 2, 3]), c = rnd(-6, 6), x1 = rnd(-3, 1), x2 = x1 + rnd(1, 4); const y1 = m * x1 + c, y2 = m * x2 + c;
  return { q: 'Find the rule of the line through <b>(' + lsg(x1) + ', ' + lsg(y1) + ')</b> and <b>(' + lsg(x2) + ', ' + lsg(y2) + ')</b>. Show all working and check your rule.',
    model: 'm = (' + lsg(y2) + ' − ' + (y1 < 0 ? '(' + lsg(y1) + ')' : y1) + ') ÷ (' + lsg(x2) + ' − ' + (x1 < 0 ? '(' + lsg(x1) + ')' : x1) + ') = ' + lsg(y2 - y1) + ' ÷ ' + (x2 - x1) + ' = ' + lsg(m) + '. Substitute (' + lsg(x1) + ', ' + lsg(y1) + '): ' + lsg(y1) + ' = ' + lsg(m) + ' × ' + (x1 < 0 ? '(' + lsg(x1) + ')' : x1) + ' + c, so c = ' + lsg(c) + '. Rule: <b>' + lterm(m, c) + '</b>. Check with (' + lsg(x2) + ', ' + lsg(y2) + '): ' + lsg(m) + ' × ' + (x2 < 0 ? '(' + lsg(x2) + ')' : x2) + (c ? ' ' + (c > 0 ? '+ ' + c : '− ' + Math.abs(c)) : '') + ' = ' + lsg(y2) + ' ✓',
    points: ['Finds the gradient m = ' + lsg(m), 'Substitutes a point to find c', 'c = ' + lsg(c), 'Writes the rule ' + lterm(m, c), 'Checks with the other point'] };
});
longGen('lRuleWords', 'L4', 'h', 'Rule from a situation', () => {
  const fee = rnd(2, 10), per = pick([1.5, 2, 2.5, 3, 4, 5]), k = rnd(3, 12); const tot = fee + per * k;
  return { q: 'A taxi charges a flag fall of $' + fee + ' plus ' + money(per) + ' per km. Write a rule for the cost C after d km, explain what each part of the rule means, and use it to find the cost of ' + (k === 8 || k === 11 ? 'an ' : 'a ') + k + ' km trip.',
    model: '<b>C = ' + fmt(per) + 'd + ' + fee + '</b>. The gradient ' + fmt(per) + ' is the cost per km; the y-intercept ' + fee + ' is the starting fee (cost at 0 km). For d = ' + k + ': C = ' + fmt(per) + ' × ' + k + ' + ' + fee + ' = ' + fmt(per * k) + ' + ' + fee + ' = <b>' + money(tot) + '</b>.',
    points: ['Correct rule C = ' + fmt(per) + 'd + ' + fee, 'Explains ' + fmt(per) + ' is the cost per km (gradient)', 'Explains ' + fee + ' is the starting fee (y-intercept)', 'Correct cost for ' + k + ' km: ' + money(tot)] };
});
longGen('lBreakEven', 'L5', 'h', 'Compare two plans', () => {
  const a1 = rnd(10, 40), r1 = rnd(2, 6), r2_ = r1 + rnd(2, 5), a2 = a1 - (r2_ - r1) * rnd(3, 10); const x = (a1 - a2) / (r2_ - r1);
  const A = a2 < 0 ? null : a2; if (A === null) return LONG.lBreakEven.fn();
  const n = x + rnd(2, 5);
  const B = A ? r2_ + 'h + ' + A : r2_ + 'h';
  return { q: 'Plan A costs $' + a1 + ' plus $' + r1 + ' per hour. Plan B costs ' + (A ? '$' + A + ' plus $' + r2_ : 'just $' + r2_) + ' per hour. Write a rule for each plan, find when they cost the same, and explain which plan is cheaper for ' + n + ' hours.',
    model: 'A = ' + r1 + 'h + ' + a1 + ', B = ' + B + '. Same cost when ' + r1 + 'h + ' + a1 + ' = ' + B + ', so ' + (a1 - A) + ' = ' + (r2_ - r1) + 'h and <b>h = ' + x + '</b> hours. For ' + n + ' hours: A = $' + (r1 * n + a1) + ', B = $' + (r2_ * n + A) + ', so <b>Plan A</b> is cheaper (its hourly rate is lower, so after ' + x + ' hours it costs less).',
    points: ['Correct rules for both plans', 'Sets the rules equal to each other', 'Break-even at h = ' + x, 'Works out both costs for ' + n + ' hours', 'Concludes Plan A is cheaper, with a reason'] };
});
longGen('lTransform', '10C', 'h', 'Describe a transformation fully', () => {
  const x = rnd(1, 6), y = rnd(1, 6); const k = rnd(0, 3);
  const T = [['reflection in the y-axis', [-x, y], ['Names it a reflection', 'Gives the mirror line: the y-axis (x = 0)']], ['reflection in the x-axis', [x, -y], ['Names it a reflection', 'Gives the mirror line: the x-axis (y = 0)']], ['rotation of 180° about the origin', [-x, -y], ['Names it a rotation', 'Gives the angle 180°', 'Gives the centre: the origin (0, 0)']], ['rotation of 90° clockwise about the origin', [y, -x], ['Names it a rotation', 'Gives the angle 90° and the direction clockwise', 'Gives the centre: the origin (0, 0)']]][k];
  return { q: 'The point P(' + x + ', ' + y + ') is moved to P′(' + T[1].map(v => lsg(v)).join(', ') + '). <b>Describe fully</b> the single transformation, and explain how the coordinates show it.',
    model: 'It is a <b>' + T[0] + '</b>. ' + ['(x, y) → (−x, y): the x-coordinate changes sign, so it flips across the y-axis.', '(x, y) → (x, −y): the y-coordinate changes sign, so it flips across the x-axis.', '(x, y) → (−x, −y): both coordinates change sign.', '(x, y) → (y, −x): the coordinates swap and the new y changes sign.'][k],
    points: T[2].concat(['Explains the coordinate rule using P and P′']) };
});
longGen('lTranslate', '10B', 'm', 'Describe a translation', () => {
  const x = rnd(-5, 5), y = rnd(-5, 5), a = rnd(-6, 6) || 2, b = rnd(-6, 6) || -3;
  return { q: 'Triangle ABC is translated so that A(' + lsg(x) + ', ' + lsg(y) + ') moves to A′(' + lsg(x + a) + ', ' + lsg(y + b) + '). Find the translation vector, describe it in words, and find where B(' + lsg(x + 2) + ', ' + lsg(y + 1) + ') moves to.',
    model: 'Vector = (' + lsg(x + a) + ' − ' + (x < 0 ? '(' + lsg(x) + ')' : x) + ', ' + lsg(y + b) + ' − ' + (y < 0 ? '(' + lsg(y) + ')' : y) + ') = <b>(' + lsg(a) + ', ' + lsg(b) + ')</b>: ' + Math.abs(a) + (Math.abs(a) === 1 ? ' unit ' : ' units ') + (a > 0 ? 'right' : 'left') + ' and ' + Math.abs(b) + (Math.abs(b) === 1 ? ' unit ' : ' units ') + (b > 0 ? 'up' : 'down') + '. B′ = (' + lsg(x + 2 + a) + ', ' + lsg(y + 1 + b) + ').',
    points: ['Vector (' + lsg(a) + ', ' + lsg(b) + ')', 'Describes it in words: ' + Math.abs(a) + ' ' + (a > 0 ? 'right' : 'left') + ', ' + Math.abs(b) + ' ' + (b > 0 ? 'up' : 'down'), 'B′ = (' + lsg(x + 2 + a) + ', ' + lsg(y + 1 + b) + ')'] };
});
longGen('lReflect', '10A', 'm', 'Reflect and explain', () => {
  const x = rnd(-6, 6) || 4, y = rnd(-6, 6) || -2; const yAxis = Math.random() < 0.5;
  return { q: 'Reflect the point (' + lsg(x) + ', ' + lsg(y) + ') in the <b>' + (yAxis ? 'y' : 'x') + '-axis</b>. Give the image and explain the rule you used.',
    model: 'Image: <b>(' + lsg(yAxis ? -x : x) + ', ' + lsg(yAxis ? y : -y) + ')</b>. Reflecting in the ' + (yAxis ? 'y-axis keeps y the same and changes the sign of x: (x, y) → (−x, y)' : 'x-axis keeps x the same and changes the sign of y: (x, y) → (x, −y)') + '. The point is the same distance from the mirror line on the other side.',
    points: ['Correct image (' + lsg(yAxis ? -x : x) + ', ' + lsg(yAxis ? y : -y) + ')', 'States the rule ' + (yAxis ? '(x, y) → (−x, y)' : '(x, y) → (x, −y)'), 'Mentions the same distance from the mirror line'] };
});
longGen('lCongProof', '10E', 'h', 'Prove two triangles congruent', () => {
  const [T1, T2] = pick(TRIS); const k = rnd(0, 3);
  const P = [
    ['SSS', T1[0] + T1[1] + ' = ' + T2[0] + T2[1] + ', ' + T1[1] + T1[2] + ' = ' + T2[1] + T2[2] + ' and ' + T1[0] + T1[2] + ' = ' + T2[0] + T2[2], ['Lists all three pairs of equal sides', 'Names the test SSS']],
    ['SAS', T1[0] + T1[1] + ' = ' + T2[0] + T2[1] + ', ∠' + T1[1] + ' = ∠' + T2[1] + ' and ' + T1[1] + T1[2] + ' = ' + T2[1] + T2[2], ['Lists the two pairs of sides and the angle between them', 'Names the test SAS']],
    ['AAS', '∠' + T1[0] + ' = ∠' + T2[0] + ', ∠' + T1[1] + ' = ∠' + T2[1] + ' and ' + T1[1] + T1[2] + ' = ' + T2[1] + T2[2], ['Lists the two pairs of angles and the pair of sides', 'Names the test AAS']],
    ['RHS', '∠' + T1[1] + ' = ∠' + T2[1] + ' = 90°, hypotenuse ' + T1[0] + T1[2] + ' = ' + T2[0] + T2[2] + ' and ' + T1[1] + T1[2] + ' = ' + T2[1] + T2[2], ['Lists the right angles, the hypotenuses and the other pair of sides', 'Names the test RHS']]][k];
  return { q: 'In △' + T1 + ' and △' + T2 + ', you know that ' + P[1] + '. <b>Prove</b> that the triangles are congruent. Set out your proof clearly.',
    model: P[1].replace(/ and /, ', and ') + ' (given). So <b>△' + T1 + ' ≅ △' + T2 + '</b> (' + P[0] + ').',
    points: P[2].concat(['Concludes △' + T1 + ' ≅ △' + T2, 'Writes the vertices in matching order']) };
});
longGen('lCongFind', '10D', 'm', 'Use congruence to find a side', () => {
  const [T1, T2] = pick(TRIS); const s1 = rnd(3, 12), s2 = rnd(3, 12), ang = rnd(30, 110);
  return { q: '△' + T1 + ' ≅ △' + T2 + '. ' + T1[0] + T1[1] + ' = ' + s1 + ' cm, ' + T1[1] + T1[2] + ' = ' + s2 + ' cm and ∠' + T1[1] + ' = ' + ang + '°. Find ' + T2[0] + T2[1] + ', ' + T2[1] + T2[2] + ' and ∠' + T2[1] + ', explaining how you know.',
    model: 'Congruent triangles have matching sides and angles equal, and the letters are in matching order. So ' + T2[0] + T2[1] + ' = ' + T1[0] + T1[1] + ' = <b>' + s1 + ' cm</b>, ' + T2[1] + T2[2] + ' = ' + T1[1] + T1[2] + ' = <b>' + s2 + ' cm</b> and ∠' + T2[1] + ' = ∠' + T1[1] + ' = <b>' + ang + '°</b>.',
    points: [T2[0] + T2[1] + ' = ' + s1 + ' cm', T2[1] + T2[2] + ' = ' + s2 + ' cm', '∠' + T2[1] + ' = ' + ang + '°', 'Explains matching parts are equal (letters in the same order)'] };
});
longGen('lQuad', '10G', 'm', 'Explain quadrilateral properties', () => {
  const sh = pick(['Rhombus', 'Rectangle', 'Parallelogram', 'Kite', 'Square']); const tru = QPROP.filter(p => p[1].includes(sh)).map(p => p[0]);
  const ang = rnd(40, 80);
  return { q: 'List three properties of a <b>' + sh.toLowerCase() + '</b>.' + (sh === 'Parallelogram' || sh === 'Rhombus' ? ' One angle of a ' + sh.toLowerCase() + ' is ' + ang + '°. Find the other three angles and explain how.' : ''),
    model: 'Properties: ' + tru.slice(0, 4).join('; ') + '.' + (sh === 'Parallelogram' || sh === 'Rhombus' ? ' Opposite angles are equal and co-interior angles add to 180°, so the angles are <b>' + ang + '°, ' + (180 - ang) + '°, ' + ang + '° and ' + (180 - ang) + '°</b>.' : ''),
    points: ['First correct property', 'Second correct property', 'Third correct property'].concat(sh === 'Parallelogram' || sh === 'Rhombus' ? ['Angles: ' + ang + '°, ' + (180 - ang) + '°, ' + ang + '°, ' + (180 - ang) + '°', 'Explains opposite angles equal / co-interior angles add to 180°'] : []) };
});
longGen('lSimilar', '10H', 'm', 'Similar figures', () => {
  const k = pick([1.5, 2, 2.5, 3, 0.5]), a = pick([4, 6, 8, 10, 12]), b = pick([5, 7, 9, 14]);
  return { q: 'Two rectangles are similar. The small one is ' + a + ' cm by ' + b + ' cm. The longer side of the large one is ' + fmt(Math.max(a, b) * k) + ' cm. Find the scale factor and the other side of the large rectangle, explaining each step.',
    model: 'Scale factor = ' + fmt(Math.max(a, b) * k) + ' ÷ ' + Math.max(a, b) + ' = <b>' + fmt(k) + '</b> (matching sides: longest to longest). Other side = ' + Math.min(a, b) + ' × ' + fmt(k) + ' = <b>' + fmt(Math.min(a, b) * k) + ' cm</b>.',
    points: ['Matches the corresponding sides (longest with longest)', 'Scale factor ' + fmt(k), 'Other side ' + fmt(Math.min(a, b) * k) + ' cm', 'Shows the division and multiplication'] };
});
longGen('lShadow', '10I', 'h', 'Similar triangles in context', () => {
  const ph = pick([1.5, 1.6, 1.8, 2]), ps = pick([2, 2.4, 3, 1.2]), ts = pick([12, 15, 18, 24, 9]); const k = ts / ps;
  return { q: 'A person ' + fmt(ph) + ' m tall casts a shadow ' + fmt(ps) + ' m long. At the same time a tree casts a shadow ' + ts + ' m long. Explain why the triangles are similar and find the height of the tree.',
    model: 'The sun’s rays hit both at the same angle and both stand upright (90°), so the triangles have equal angles: they are <b>similar (AAA)</b>. Scale factor = ' + ts + ' ÷ ' + fmt(ps) + ' = ' + fmt(r2(k, 3)) + '. Tree height = ' + fmt(ph) + ' × ' + fmt(r2(k, 3)) + ' = <b>' + fmt(r2(ph * k, 2)) + ' m</b>.',
    points: ['Explains the angles are equal (same sun angle, right angles)', 'Names it similar (AAA)', 'Scale factor ' + fmt(r2(k, 3)), 'Tree height ' + fmt(r2(ph * k, 2)) + ' m'] };
});
longGen('l3D', 'XYZ', 'm', 'Positions in 3D', () => {
  const x = rnd(1, 6), y = rnd(1, 6), z = rnd(1, 6), dx = pick([-3, -2, -1, 1, 2, 3]), dz = rnd(1, 3); const u = n => n + (n === 1 ? ' unit' : ' units');
  return { q: 'A drone is at (' + x + ', ' + y + ', ' + z + '). Describe what each coordinate tells you. It then moves ' + u(Math.abs(dx)) + ' ' + (dx >= 0 ? 'in the positive' : 'in the negative') + ' x direction and rises ' + u(dz) + '. Give its new position.',
    model: 'x = ' + x + ' is how far along the x-axis, y = ' + y + ' is how far along the y-axis, and z = ' + z + ' is the height (z-axis). New position: <b>(' + lsg(x + dx) + ', ' + y + ', ' + (z + dz) + ')</b>.',
    points: ['Explains x, y as positions along the axes', 'Explains z as the height', 'New position (' + lsg(x + dx) + ', ' + y + ', ' + (z + dz) + ')'] };
});
longGen('lRecurring', '3F', 'm', 'Terminating or recurring?', () => {
  const [n, d, term_] = pick([[3, 8, true], [7, 20, true], [2, 3, false], [5, 6, false], [9, 40, true], [4, 11, false], [7, 12, false], [13, 25, true]]);
  return { q: 'Without a calculator, decide whether <b>' + n + '/' + d + '</b> is a terminating or recurring decimal. Explain how you know, then write it as a decimal.',
    model: 'The denominator ' + d + ' = ' + ({ 8: '2 × 2 × 2', 20: '2 × 2 × 5', 3: '3', 6: '2 × 3', 40: '2 × 2 × 2 × 5', 11: '11', 12: '2 × 2 × 3', 25: '5 × 5' }[d]) + (term_ ? ' has only 2s and 5s as prime factors' : ', which has a prime factor other than 2 or 5 (' + ({ 3: '3', 6: '3', 11: '11', 12: '3' }[d]) + ')') + ', so ' + n + '/' + d + ' is <b>' + (term_ ? 'terminating' : 'recurring') + '</b>. ' + n + ' ÷ ' + d + ' = <b>' + (term_ ? String(n / d) : (Math.floor(n / d * 1e4) / 1e4).toFixed(4) + '…') + '</b>.',
    points: ['Says ' + (term_ ? 'terminating' : 'recurring'), 'Explains using the prime factors of ' + d + ' (only 2s and 5s → terminating)', 'Correct decimal ' + (term_ ? String(n / d) : (Math.floor(n / d * 1e4) / 1e4).toFixed(4) + '…')] };
});
longGen('lConvert', '3G', 'm', 'Convert and explain', () => {
  const p = pick([12.5, 15, 35, 40, 62.5, 75, 8, 120]); const f = Fr.of(p).div(100);
  return { q: 'Write <b>' + fmt(p) + '%</b> as a decimal and as a fraction in simplest form. Explain each step.',
    model: 'Percent means “out of 100”. Decimal: ' + fmt(p) + ' ÷ 100 = <b>' + fmt(p / 100) + '</b>. Fraction: ' + fmt(p) + '/100' + (Number.isInteger(p) ? '' : ' = ' + (p * 10) + '/1000') + ' = <b>' + f + '</b> (dividing top and bottom by their highest common factor).',
    points: ['Decimal ' + fmt(p / 100), 'Writes it over 100 first', 'Simplifies to ' + f, 'Explains percent means out of 100'] };
});
longGen('lPctOf', '3H', 'm', 'Percentage of an amount', () => {
  const p = pick([15, 24, 35, 12.5, 8, 65]), amt = pick([80, 120, 240, 360, 48, 600]); const v = amt * p / 100;
  return { q: 'A school has <b>' + amt + '</b> Year 8 students and <b>' + fmt(p) + '%</b> walk to school. How many walk? Show two different methods.',
    model: 'Method 1: ' + fmt(p) + '% = ' + fmt(p / 100) + ', and ' + fmt(p / 100) + ' × ' + amt + ' = <b>' + fmt(v) + '</b>. Method 2: 1% of ' + amt + ' = ' + fmt(amt / 100) + ', so ' + fmt(p) + '% = ' + fmt(amt / 100) + ' × ' + fmt(p) + ' = <b>' + fmt(v) + '</b>.',
    points: ['Answer ' + fmt(v) + ' students', 'Method 1 (decimal or fraction × amount)', 'Method 2 (e.g. find 1% or 10% first)'] };
});
longGen('lDiscount', '3I', 'h', 'Discount and GST', () => {
  const price = pick([80, 120, 150, 240, 360]), d = pick([10, 15, 20, 25, 30]); const sale = price * (1 - d / 100);
  return { q: 'A jacket is marked $' + price + '. It is discounted by ' + d + '%. Find the sale price two ways and explain why both work. Then find how much GST (10%) is included if the sale price already includes GST.',
    model: 'Way 1: discount = ' + d + '% × ' + price + ' = ' + money(price * d / 100) + ', so sale price = ' + price + ' − ' + fmt(price * d / 100) + ' = <b>' + money(sale) + '</b>. Way 2: pay ' + (100 - d) + '%, so ' + fmt((100 - d) / 100) + ' × ' + price + ' = ' + money(sale) + '. GST included = ' + money(sale) + ' ÷ 11 ' + (Math.abs(sale / 11 * 100 - Math.round(sale / 11 * 100)) < 1e-9 ? '=' : '≈') + ' <b>' + money(sale / 11) + '</b> (the price is 110%, so 10% of it is 1/11).',
    points: ['Sale price ' + money(sale), 'Way 1: work out the discount and subtract', 'Way 2: multiply by ' + fmt((100 - d) / 100), 'GST included ≈ ' + money(sale / 11) + ' (divide by 11)'] };
});
longGen('lChange', '3J', 'm', 'Percentage change', () => {
  const o = pick([40, 50, 80, 120, 200, 250]), up = Math.random() < 0.5, ch = pick([10, 15, 20, 25, 30, 40]) * o / 100; const n = up ? o + ch : o - ch;
  return { q: 'A price changed from $' + o + ' to ' + money(n) + '. Calculate the percentage change, showing your working, and explain why you divide by $' + o + ' and not ' + money(n) + '.',
    model: 'Change = ' + fmt(n) + ' − ' + o + ' = ' + (up ? '' : '−') + fmt(ch) + '. % change = ' + fmt(ch) + ' ÷ ' + o + ' × 100 = <b>' + fmt(ch / o * 100) + '% ' + (up ? 'increase' : 'decrease') + '</b>. You divide by the <b>original</b> amount because the change is measured compared with where it started.',
    points: ['Change of ' + money(ch), 'Divides by the original ($' + o + ') and × 100', fmt(ch / o * 100) + '% ' + (up ? 'increase' : 'decrease'), 'Explains you compare with the original amount'] };
});
longGen('lReverse', '3K', 'h', 'Find the original price', () => {
  const orig = pick([40, 60, 80, 120, 150, 200]), d = pick([10, 20, 25, 30, 40]); const sale = orig * (1 - d / 100);
  return { q: 'After a ' + d + '% discount, shoes cost ' + money(sale) + '. Find the original price. Explain why taking ' + d + '% of ' + money(sale) + ' and adding it back does <b>not</b> work.',
    model: 'The sale price is ' + (100 - d) + '% of the original. 1% = ' + fmt(sale) + ' ÷ ' + (100 - d) + ' = ' + fmt(r2(sale / (100 - d), 4)) + ', so 100% = <b>' + money(orig) + '</b>. Adding ' + d + '% of ' + money(sale) + ' gives ' + money(sale * (1 + d / 100)) + ', which is wrong because the ' + d + '% was taken off the <b>original</b> price, not the sale price.',
    points: ['Says ' + money(sale) + ' is ' + (100 - d) + '% of the original', 'Uses the unitary method or divides by ' + fmt((100 - d) / 100), 'Original price ' + money(orig), 'Explains the percentage was of the original, not the sale price'] };
});
const LONG_GENS = {};
Object.keys(LONG).forEach(id => { (LONG_GENS[LONG[id].t] = LONG_GENS[LONG[id].t] || []).push(id); });
// topics without their own long questions borrow a related one
[['7I', '7J'], ['7J', '7I'], ['L1', 'L2'], ['L4', 'L3'], ['10A', '10C'], ['10B', '10C'], ['10C', '10A'], ['10D', '10E'], ['10E', '10D'], ['10H', '10I'], ['10I', '10H'], ['3F', '3G'], ['3H', '3G'], ['3I', '3J'], ['3J', '3K'], ['3K', '3I']].forEach(([t, other]) => { LONG_GENS[t] = (LONG_GENS[t] || []).concat(LONG_GENS[other] || []); });
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
function solHTML(Q) { return '<div class="sol"><div class="sol-head"><div class="sol-title">Working</div>' + simpleToggleHTML() + '</div>' + simpleBox(Q.gen) + stepsHTML(Q.sol || []) + '</div>'; }
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
    fb.appendChild(h('<div class="fb ' + (r.ok ? 'good' : r.gaveUp ? 'info answer-shown' : 'bad') + '">' + msg + '</div>'));
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
  const setup = h('<div class="card stack"><h3>Set up your exam</h3><div class="row"><label class="f">Questions<select id="exN"><option>5</option><option>10</option><option>15</option><option selected>20</option><option>30</option><option>40</option></select></label><label class="f">Time limit<select id="exT"><option value="0">No timer</option><option value="1">⚡ 1 min (speedrun)</option><option value="2">⚡ 2 min (speedrun)</option><option value="5">⚡ 5 min (speedrun)</option><option value="10">10 min</option><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="custom">Choose my own…</option></select></label><label class="f" id="exTCwrap" hidden>Minutes<input id="exTC" type="number" inputmode="decimal" min="0.5" max="180" step="0.5" value="3" style="width:110px"></label></div><div class="stack" id="exTopics"></div><div class="row"><button type="button" class="btn quiet sm" id="exAll">Select all</button><button type="button" class="btn quiet sm" id="exNone">Clear</button><button type="button" class="btn quiet sm" id="exWeak">My weakest 5</button></div><div><button type="button" class="btn" id="exGo">Start exam</button> <span class="small muted" id="exMsg"></span></div></div>');
  const tbox = $('#exTopics', setup);
  // ⚡ speedruns: pick 1, 2 or 5 minutes, or type your own time (½ minute to 3 hours)
  const lastT = store.get('examTime', null);
  if (lastT != null) { const o = [...$('#exT', setup).options].find(x => x.value === String(lastT)); if (o) $('#exT', setup).value = o.value; else { $('#exT', setup).value = 'custom'; $('#exTC', setup).value = lastT; } }
  const showCustom = () => { $('#exTCwrap', setup).hidden = $('#exT', setup).value !== 'custom'; };
  $('#exT', setup).onchange = () => { showCustom(); if ($('#exT', setup).value === 'custom') $('#exTC', setup).focus(); }; showCustom();
  UNITS.forEach(u => { const g = h('<div><div class="eyebrow" style="margin-bottom:4px">' + u.name + '</div><div class="row" style="gap:6px"></div></div>'); TOPICS.filter(t => t.unit === u.id).forEach(t => { const c = h('<button type="button" class="chip on" data-t="' + t.id + '" aria-pressed="true">' + t.id + ' ' + t.name + '</button>'); c.onclick = () => { c.classList.toggle('on'); c.setAttribute('aria-pressed', c.classList.contains('on')); }; g.lastChild.appendChild(c); }); tbox.appendChild(g); });
  $('#exAll', setup).onclick = () => $$('.chip', tbox).forEach(c => c.classList.add('on'));
  $('#exNone', setup).onclick = () => $$('.chip', tbox).forEach(c => c.classList.remove('on'));
  $('#exWeak', setup).onclick = () => { const w = TOPICS.map(t => [t.id, acc(t.id) ?? 0.5]).sort((a, b) => a[1] - b[1]).slice(0, 5).map(x => x[0]); $$('.chip', tbox).forEach(c => c.classList.toggle('on', w.includes(c.dataset.t))); };
  v.appendChild(setup);
  const hist = store.get('exams', []);
  if (hist.length) v.appendChild(h('<div class="card stack"><h3>Past exams</h3><div class="scroll-x"><table class="res"><tr><th>Date</th><th>Score</th><th>%</th><th>Time used</th></tr>' + hist.slice(-8).reverse().map(e => '<tr><td>' + e.d + '</td><td>' + e.s + '/' + e.n + '</td><td>' + e.p + '%</td><td>' + e.t + '</td></tr>').join('') + '</table></div></div>'));
  $('#exGo', setup).onclick = () => {
    const tops = $$('.chip.on', tbox).map(c => c.dataset.t); if (!tops.length) { $('#exMsg', setup).textContent = 'Pick at least one topic.'; return; }
    let mins = $('#exT', setup).value === 'custom' ? Math.round((+$('#exTC', setup).value || 0) * 2) / 2 : +$('#exT', setup).value;
    if ($('#exT', setup).value === 'custom' && !(mins >= 0.5 && mins <= 180)) { $('#exMsg', setup).textContent = 'Choose a time between 0.5 and 180 minutes.'; return; }
    store.set('examTime', $('#exT', setup).value === 'custom' ? mins : +$('#exT', setup).value);
    runExam(tops, +$('#exN', setup).value, mins);
  };
  function runExam(tops, n, mins) {
    v.innerHTML = '';
    const order = []; for (let i = 0; i < n; i++) order.push(tops[i % tops.length]);
    const Qs = shuffle(order).map(t => makeQ(pick(TOPIC_GENS[t])));
    const bar = h('<div class="exam-bar"><div><span class="timer" id="exClock">' + (mins ? Math.floor(mins * 60 / 60) + ':' + String(Math.round(mins * 60) % 60).padStart(2, '0') : '∞') + '</span> <span class="small muted" id="exProg">0/' + n + ' answered</span></div><div class="row"><button type="button" class="btn quiet sm" id="exQuit">Quit</button><button type="button" class="btn" id="exSub">Submit exam</button></div></div>');
    v.appendChild(bar);
    const cards = []; const list = h('<div class="stack"></div>'); v.appendChild(list);
    const prog = () => { $('#exProg', bar).textContent = cards.filter(c => c.answered()).length + '/' + n + ' answered'; };
    Qs.forEach((Q, i) => { const c = questionCard(Q, { mode: 'exam', num: i + 1, onChange: prog }); cards.push(c); const w = h('<div class="card"></div>'); w.appendChild(c.el); list.appendChild(w); });
    const bottom = h('<div class="row"><button type="button" class="btn">Submit exam</button></div>'); list.appendChild(bottom);
    const start = Date.now(); let left = mins * 60;
    const deadline = start + mins * 60000; // use the clock, so the timer stays right even if the tab is in the background
    if (mins) examTimer = setInterval(() => { left = Math.max(0, Math.round((deadline - Date.now()) / 1000)); const c = $('#exClock', bar); if (!c) { clearInterval(examTimer); return; } c.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); c.classList.toggle('low', left <= Math.min(60, mins * 15)); if (left <= 0) { clearInterval(examTimer); toast('Time is up'); submit(); } }, 1000);
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
// which "Super simple" explanation fits an Ask answer (worked out from its title)
function askSimpleId(t) {
  t = String(t).replace(/<[^>]+>/g, '');
  const R = [[/GST/, 'shopping'], [/^Original amount/, 'reversePct'], [/^(Increased|Decreased) amount/, 'incDec'], [/% (increase|decrease)$/, 'pctChange'], [/% of /, 'pctOf'], [/^Scale factor/, 'scaleFactor'],
    [/^Vector/, 'findVector'], [/^Gradient m/, 'rule2pts'], [/x-intercept/, 'xint'], [/y-intercept/, 'mcRule'], [/ is (on|in) /, 'axisPlane'], [/[<>≤≥]/, 'ineqSolve'],
    [/^-?[\d.]+% = /, 'pctToFrac'], [/^\d+\/\d+ = .*%/, 'fracToPct'], [/^\d+\/\d+ = /, 'fracDecT'], [/^-?\d*\.\d+ = .*%/, 'decToPct'], [/^-?\d*\.\d+ = /, 'decToFrac'], [/^[a-z] = /, 'eqSolve']];
  for (const [re, id] of R) if (re.test(t)) return id;
  return null;
}
function ansBlock(title, body) { return '<div class="card stack"><div class="sol-head"><span class="eyebrow">Answer</span>' + simpleToggleHTML() + '</div><h3>' + title + '</h3>' + simpleBox(askSimpleId(title)) + body + '</div>'; }
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
      const fa = UNITS_CONV[ua][1], fb = UNITS_CONV[ub][1]; const nice = u => ({ l: 'L', ml: 'mL', kl: 'kL' }[u] || u); ua = nice(ua); ub = nice(ub);
      if (fb > fa) { const nb = b * fb / fa; steps.push({ t: fmt(b) + ' ' + ub + ' = ' + fmt(nb) + ' ' + ua, why: 'Convert to the same units first' }); b = nb; }
      else { const na = a * fa / fb; steps.push({ t: fmt(a) + ' ' + ua + ' = ' + fmt(na) + ' ' + ub, why: 'Convert to the same units first' }); a = na; }
    }
    const p = a / b * 100; steps.push({ t: fmt(a) + ' ÷ ' + fmt(b) + ' × 100 = ' + fmt(p, 2) + '%', why: 'a ÷ b × 100' });
    return ansBlock(fmt(p, 2) + '%', stepsHTML(steps));
  }
  // p% of q
  if ((m = s.match(/(-?\d[\d.]*)\s*%\s*of\s*\$?(-?\d[\d.]*)/))) {
    const p = +m[1], q = +m[2]; const v = p / 100 * q; const cash = /%\s*of\s*\$/.test(s), V = x => cash ? money(x) : fmt(x, 4);
    return ansBlock(fmt(p) + '% of ' + (cash ? money(q) : fmt(q)) + ' = ' + V(v), stepsHTML([{ t: fmt(p) + '/100 × ' + fmt(q) + ' = ' + V(v), why: 'p% of Q = p/100 × Q' }, { t: '10% of ' + fmt(q) + ' = ' + fmt(q / 10, 4) + ', 1% = ' + fmt(q / 100, 4), why: 'Mental check' }]));
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
    const pc = f.v * 100, pcs = Number.isInteger(pc * 10000) ? fmt(pc, 4) + '%' : '≈ ' + fmt(pc, 2) + '%';
    if (/percent|%/.test(m[3] || '')) return ansBlock(n + '/' + d + ' = ' + pcs.replace('≈ ', '') + (pcs[0] === '≈' ? ' (to 2 d.p.)' : ''), stepsHTML([{ t: n + '/' + d + ' × 100 ' + (pcs[0] === '≈' ? pcs : '= ' + pcs), why: 'Fraction → percentage: multiply by 100' }, { t: n + ' ÷ ' + d + ' = ' + decLong(ld, 3), why: 'As a decimal' }]));
    return ansBlock(n + '/' + d + (f.n !== n ? ' = ' + f : '') + ' = ' + decHTML(ld), stepsHTML([f.n !== n ? { t: n + '/' + d + ' = ' + f, why: 'Simplest form (divide top and bottom by ' + gcd(n, d) + ')' } : null, { t: n + ' ÷ ' + d + ' = ' + decLong(ld, 3), why: ld.term ? 'Terminating: ' + f.d + ' = ' + (df.join(' × ') || '1') + ' (only 2s and 5s)' : 'Recurring: ' + (df.length > 1 ? f.d + ' = ' + df.join(' × ') + ', which' : f.d) + ' has a prime factor other than 2 or 5' }, ld.term ? null : { t: decHTML(ld), why: 'Line over the repeating digits (or dots above the first and last repeating digit)' }, { t: 'Rounded: ' + (n / d).toFixed(1) + ' (1 d.p.), ' + (n / d).toFixed(2) + ' (2 d.p.), ' + (n / d).toFixed(3) + ' (3 d.p.)', why: '' }, { t: n + '/' + d + ' × 100 ' + (pcs[0] === '≈' ? pcs + ' (to 2 d.p.)' : '= ' + pcs), why: 'As a percentage' }].filter(Boolean)));
  }
  // rounding
  if ((m = s.match(/round\s+(.+?)\s+to\s+(?:the\s+)?(?:(\d+)\s*(?:dp|d\.p\.?|decimal places?|decimal place)|nearest\s+(whole|whole number|integer|tenth|hundredth|thousandth|ten|hundred))/))) {
    const x = evalNum(m[1]); if (isNaN(x)) throw new Error('I could not read the number “' + m[1] + '”.');
    let dp = m[2] !== undefined ? +m[2] : { whole: 0, 'whole number': 0, integer: 0, tenth: 1, hundredth: 2, thousandth: 3, ten: -1, hundred: -2 }[m[3]];
    const r = dp >= 0 ? r2(x, dp).toFixed(dp) : String(Math.round(x / 10 ** -dp) * 10 ** -dp);
    const k = Math.max(dp, 0) + 3, cut = Math.floor(Math.abs(x) * 10 ** k + 1e-7) / 10 ** k, exact = Math.abs(cut - Math.abs(x)) < 1e-12;
    const digits = (x < 0 ? '−' : '') + cut.toFixed(k).replace(exact ? /0+$/ : /$^/, '').replace(/\.$/, '') + (exact ? '' : '…');
    const nxt = dp >= 0 ? cut.toFixed(k).split('.')[1].charAt(dp) : null;
    return ansBlock(r, stepsHTML([{ t: m[1] + ' = ' + digits, why: 'Write out a few extra digits (don’t round yet)' }, { t: r, why: nxt != null ? 'The next digit is ' + nxt + ', so ' + (+nxt >= 5 ? 'round up' : 'leave it') : 'Look at the next digit: 5 or more rounds up, 4 or less leaves it' }]));
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
    const [[x1, y1], [x2, y2]] = pts; if (x1 === x2 && y1 === y2) throw new Error('Those are the same point, so they don’t make a line. Use two different points.'); if (x1 === x2) return ansBlock('Vertical line x = ' + fmt(x1), '<p>The run is 0, so the gradient is undefined. The rule is x = ' + fmt(x1) + '.</p>');
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
      if (/x-?intercept/.test(s) && !wx && !wy) { if (!xi) return ansBlock('No x-intercept', '<p>y = ' + numStr(c) + ' is a horizontal line that never crosses the x-axis.</p>'); return ansBlock('x-intercept: x = ' + xi.show() + ', the point (' + xi.show() + ', 0)', stepsHTML(solveRel(fmtLin(mm, c) + ' = 0').steps.map((st, i) => i ? st : { t: '0 = ' + fmtLin(mm, c), why: 'The x-intercept is where y = 0' }))); }
      if (/y-?intercept/.test(s) && !wx && !wy) return ansBlock('y-intercept: c = ' + numStr(c) + ', the point (0, ' + numStr(c) + ')', stepsHTML([{ t: 'y = ' + fmtLin(mm, c), why: 'In y = mx + c, c is the y-intercept' }, { t: 'When x = 0: y = ' + numStr(c), why: 'Check: put x = 0' }]));
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
      return '<dl class="kv"><dt>Fraction (simplest)</dt><dd>' + fr + (Math.abs(fr.n) > fr.d && fr.d > 1 ? ' = ' + (fr.n < 0 ? '−' : '') + Math.floor(Math.abs(fr.n) / fr.d) + ' ' + (Math.abs(fr.n) % fr.d) + '/' + fr.d : '') + '</dd><dt>Decimal</dt><dd>' + decHTML(ld) + (ld.term ? ' (terminating)' : ' = ' + decLong(ld, 3) + ' (recurring)') + '</dd><dt>Percentage</dt><dd>' + (Number.isInteger(fr.v * 1e6) ? fmt(fr.v * 100, 4) + '%' : '≈ ' + fmt(fr.v * 100, 2) + '% (to 2 d.p.)') + '</dd><dt>Why</dt><dd style="font-family:var(--f-body)">' + (fr.d === 1 ? 'Whole number.' : 'Denominator ' + fr.d + ' = ' + df.join(' × ') + (ld.term ? ': only 2s and 5s, so it terminates.' : ': it has a prime factor other than 2 or 5, so it recurs.')) + '</dd><dt>Rounded</dt><dd>' + [0, 1, 2, 3].map(d => r2(fr.v, d).toFixed(d) + ' (' + d + ' d.p.)').join(', ') + '</dd></dl>';
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
// /maths/#practice-7I (from the profile) opens Practice on that topic
const boot = () => { const pm = /^practice-([A-Za-z0-9]+)$/.exec(location.hash.slice(1)); if (pm && typeof openPractice === 'function') { openPractice(pm[1]); return; } show(location.hash.slice(1) || 'home'); };
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot();
