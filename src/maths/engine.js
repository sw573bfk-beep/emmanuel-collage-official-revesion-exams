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
