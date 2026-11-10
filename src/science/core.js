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
const SP = 'y8s' + ((typeof window !== 'undefined' && window.EC_SLOT) || '') + ':'; // each logged-in account in this browser gets its own keys
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
  const fr = sp.L.trim().match(/^\((.+)\)\s*\/\s*(\d+(?:\.\d+)?)$/);
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
  return '<ol class="steps">' + steps.map(s => typeof s === 'string' ? '<li><span class="st" style="font-family:var(--f-body)">' + s + '</span></li>' : '<li><span class="st">' + s.t + '</span>' + (s.why ? '<span class="why">' + s.why + '</span>' : '') + '</li>').join('') + '</ol>';
}

/* ================= answer parsing ================= */
function stripUnits(s) {
  return s.replace(/^[a-z]\s*=\s*/i, '')
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
      case 'eq': {
        const g = parseWordEq(raw);
        if (!g) return { ok: false, msg: 'Write it like: magnesium + oxygen → magnesium oxide (use → or ->).', bad: true };
        const R = sameTerms(g.r, Q.ans.r), P = sameTerms(g.p, Q.ans.p);
        if (R && P) return { ok: true };
        if (sameTerms(g.r, Q.ans.p) && sameTerms(g.p, Q.ans.r)) return { ok: false, msg: 'Your sides are swapped: reactants go on the left of the arrow, products on the right.' };
        if (R) return { ok: false, msg: 'Your reactants are right; check the products.' };
        if (P) return { ok: false, msg: 'Your products are right; check the reactants.' };
        return { ok: false };
      }
      case 'set': {
        const got = splitTerms(raw);
        if (!got.length) return { ok: false, msg: 'Type the names, separated by commas.', bad: true };
        return { ok: sameTerms(got, Q.ans) };
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
  const u = 34, ox = 70, oy = 40 + H * u + 6, cx = 0.62 * u, cy = 0.42 * u;
  const P = (x, y, z) => [ox + y * u - x * cx, oy - z * u + x * cy];
  const V = { O: [0, 0, 0], A: [L, 0, 0], B: [L, Wd, 0], C: [0, Wd, 0], D: [0, 0, H], E: [L, 0, H], F: [L, Wd, H], G: [0, Wd, H] };
  const Wpx = ox + Wd * u + 60, Hpx = oy + L * cy + 30;
  let s = '<svg class="dia" viewBox="0 0 ' + Wpx + ' ' + Hpx + '" style="max-width:' + Wpx + 'px;width:100%" role="img" aria-label="Box ' + L + ' by ' + Wd + ' by ' + H + ' with a corner at the origin">';
  const ln = (a, b, cls = 'edge') => { const p = P(...V[a]), q = P(...V[b]); return '<line class="' + cls + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>'; };
  const o0 = P(0, 0, 0), xe = P(L + 1.3, 0, 0), ye = P(0, Wd + 1.2, 0), ze = P(0, 0, H + 0.9);
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + xe[0] + '" y2="' + xe[1] + '"/><text class="axl" x="' + (xe[0] - 12) + '" y="' + (xe[1] + 6) + '">x</text>';
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + ye[0] + '" y2="' + ye[1] + '"/><text class="axl" x="' + (ye[0] + 5) + '" y="' + (ye[1] + 4) + '">y</text>';
  s += '<line class="ax" x1="' + o0[0] + '" y1="' + o0[1] + '" x2="' + ze[0] + '" y2="' + ze[1] + '"/><text class="axl" x="' + (ze[0] + 5) + '" y="' + (ze[1] + 2) + '">z</text>';
  [['A', 'B'], ['B', 'C', 'edge dash'], ['O', 'A'], ['A', 'E'], ['B', 'F'], ['C', 'G', 'edge dash'], ['O', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'G', 'edge dash'], ['G', 'D', 'edge dash']].forEach(e => { s += ln(e[0], e[1], e[2]); });
  if (labels) Object.keys(V).forEach(k => {
    const p = P(...V[k]); const dx = (k === 'O' || k === 'D' || k === 'A' || k === 'E') ? -16 : 6, dy = (k === 'A' || k === 'B' || k === 'C' || k === 'O') ? 14 : -6;
    s += '<circle class="pt3" cx="' + p[0] + '" cy="' + p[1] + '" r="3.2"/><text class="lbl" x="' + (p[0] + dx) + '" y="' + (p[1] + dy) + '">' + k + (show && show[k] ? ' ' + ptStr(V[k]) : '') + '</text>';
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
    case 'x=k': return 'The mirror is the vertical line x = ' + fmt(L.k) + '. The y-value stays the same; the image is the same distance on the other side of the line, so x′ = 2 × ' + fmt(L.k) + ' − x.';
    case 'y=k': return 'The mirror is the horizontal line y = ' + fmt(L.k) + '. The x-value stays the same; the image is the same distance on the other side, so y′ = 2 × ' + fmt(L.k) + ' − y.';
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


/* ================= science: word equations ================= */
const TERM_SYN = [[/sulph/g, 'sulf'], [/aluminum/g, 'aluminium'], [/\bsteam\b/g, 'water'], [/\bh2o\b/g, 'water'], [/\bco2\b/g, 'carbon dioxide'], [/\bo2\b/g, 'oxygen'], [/\bh2\b/g, 'hydrogen'], [/\bsoot\b/g, 'carbon'], [/\bethanoic\b/g, 'acetic']];
function normTerm(t) {
  t = String(t).toLowerCase().replace(/\(.*?\)/g, ' ');
  TERM_SYN.forEach(([a, b]) => { t = t.replace(a, b); });
  t = t.replace(/\b(solid|liquid|gases|gas|gaseous|aqueous|solution|dissolved|metal|powder|vapour|vapor|molecules?|the|some|a|an|in|of)\b/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  return t;
}
function splitTerms(side) { return String(side).split(/\+|,|;|\band\b|&/i).map(normTerm).filter(Boolean); }
function parseWordEq(raw) {
  const s = String(raw).replace(/[−–—]/g, '-');
  const parts = s.split(/→|⟶|-+>|=+>|=|\bgives\b|\bproduces\b|\bmakes\b|\bforms\b|\byields\b/i);
  if (parts.length !== 2) return null;
  const r = splitTerms(parts[0]), p = splitTerms(parts[1]);
  if (!r.length || !p.length) return null;
  return { r, p };
}
// expected: array of terms; each term is a string or an array of accepted alternatives
function sameTerms(got, expected) {
  const exp = expected.map(e => (Array.isArray(e) ? e : [e]).map(normTerm));
  if (got.length !== exp.length) return false;
  const used = new Array(got.length).fill(false);
  return exp.every(alts => { const i = got.findIndex((g, k) => !used[k] && alts.includes(g)); if (i < 0) return false; used[i] = true; return true; });
}
const eqText = (r, p) => r.map(x => Array.isArray(x) ? x[0] : x).join(' + ') + ' → ' + p.map(x => Array.isArray(x) ? x[0] : x).join(' + ');

/* ================= science: diagrams ================= */
function energySVG(type, labels = true) {
  const exo = type === 'exo'; const W = 320, H = 200;
  const yR = exo ? 70 : 140, yP = exo ? 140 : 70, peak = 30;
  let s = '<svg class="dia" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="' + (exo ? 'Exothermic' : 'Endothermic') + ' energy diagram">';
  s += '<line class="ax" x1="40" y1="180" x2="40" y2="12"/><path class="axh" d="M40 8 l-5 9 h10z" style="fill:var(--ink)"/><line class="ax" x1="40" y1="180" x2="305" y2="180"/><path d="M309 180 l-9 -5 v10z" style="fill:var(--ink)"/>';
  s += '<text x="14" y="100" transform="rotate(-90 14 100)" text-anchor="middle">Energy</text><text x="175" y="196" text-anchor="middle">Time (reaction progress)</text>';
  s += '<path class="edge" d="M50 ' + yR + ' H110 C150 ' + yR + ' 150 ' + peak + ' 175 ' + peak + ' S200 ' + yP + ' 240 ' + yP + ' H300" />';
  if (labels) {
    s += '<text x="80" y="' + (yR - 8) + '" text-anchor="middle" class="lbl">Reactants</text><text x="270" y="' + (yP - 8) + '" text-anchor="middle" class="lbl">Products</text>';
    s += '<line x1="268" y1="' + yR + '" x2="268" y2="' + yP + '" stroke="var(--pen)" stroke-width="2" stroke-dasharray="4 3"/><line x1="240" y1="' + yR + '" x2="300" y2="' + yR + '" stroke="var(--rule)" stroke-dasharray="3 3"/>';
    s += '<text x="262" y="' + ((yR + yP) / 2 + 4) + '" text-anchor="end" style="fill:var(--pen);font-size:11px">' + (exo ? 'energy released' : 'energy absorbed') + '</text>';
  }
  return s + '</svg>';
}
function fireTriangleSVG() {
  return '<svg class="dia" viewBox="0 0 300 200" style="max-width:300px;width:100%" role="img" aria-label="Fire triangle: fuel, oxygen, heat"><polygon class="fillt" points="150,20 280,185 20,185"/><text x="150" y="128" text-anchor="middle" class="lbl" style="font-size:15px">COMBUSTION</text><text x="58" y="100" text-anchor="middle" class="lbl" transform="rotate(-52 58 100)">FUEL</text><text x="242" y="100" text-anchor="middle" class="lbl" transform="rotate(52 242 100)">OXYGEN</text><text x="150" y="200" text-anchor="middle" class="lbl">HEAT (ignition energy)</text></svg>';
}
function lineChartSVG(o) {
  const W = o.w || 560, H = o.h || 320, pl = 52, pr = 16, pt = 18, pb = 46;
  const xmin = o.xmin ?? 0, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax, xs = o.xstep, ys = o.ystep;
  const X = x => pl + (x - xmin) / (xmax - xmin) * (W - pl - pr), Y = y => pt + (ymax - y) / (ymax - ymin) * (H - pt - pb);
  let s = '<svg class="dia chart-svg" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="' + esc(o.label || 'Line graph') + '">';
  for (let x = xmin; x <= xmax + 1e-9; x += xs) s += '<line class="gl" x1="' + X(x) + '" y1="' + Y(ymin) + '" x2="' + X(x) + '" y2="' + Y(ymax) + '"/><text class="tk" x="' + X(x) + '" y="' + (Y(ymin) + 14) + '">' + fmt(x) + '</text>';
  for (let y = ymin; y <= ymax + 1e-9; y += ys) s += '<line class="gl" x1="' + X(xmin) + '" y1="' + Y(y) + '" x2="' + X(xmax) + '" y2="' + Y(y) + '"/><text class="tk" style="text-anchor:end" x="' + (X(xmin) - 5) + '" y="' + (Y(y) + 3.5) + '">' + fmt(y) + '</text>';
  s += '<line class="ax" x1="' + X(xmin) + '" y1="' + Y(ymin) + '" x2="' + X(xmax) + '" y2="' + Y(ymin) + '"/><line class="ax" x1="' + X(xmin) + '" y1="' + Y(ymin) + '" x2="' + X(xmin) + '" y2="' + Y(ymax) + '"/>';
  s += '<text x="' + ((X(xmin) + X(xmax)) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xLabel || '') + '</text><text x="14" y="' + ((Y(ymin) + Y(ymax)) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((Y(ymin) + Y(ymax)) / 2) + ')">' + esc(o.yLabel || '') + '</text>';
  (o.series || []).forEach(se => {
    if (se.line !== false && se.pts.length > 1) s += '<polyline class="pl ' + (se.cls || '') + '" points="' + se.pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' ') + '"/>';
    se.pts.forEach(p => { s += se.shape === 'sq' ? '<rect class="pt ' + (se.cls || '') + '" x="' + (X(p[0]) - 4) + '" y="' + (Y(p[1]) - 4) + '" width="8" height="8"/>' : '<circle class="pt ' + (se.cls || '') + '" cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4.5"/>'; });
  });
  if (o.legend) s += o.series.map((se, i) => '<g transform="translate(' + (X(xmin) + 10) + ',' + (pt + 8 + i * 18) + ')"><line class="pl ' + (se.cls || '') + '" x1="0" y1="0" x2="22" y2="0"/><text x="28" y="4" style="font-size:11px">' + esc(se.name) + '</text></g>').join('');
  return s + '</svg>';
}
function atomSVG(labels = true) {
  let s = '<svg class="dia" viewBox="0 0 420 220" style="max-width:420px;width:100%" role="img" aria-label="Labelled atom"><circle cx="210" cy="110" r="90" fill="none" stroke="var(--ink)" stroke-width="1.5"/><circle cx="210" cy="110" r="55" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';
  [[198, 104, 'p'], [214, 100, 'n'], [222, 114, 'p'], [204, 118, 'n'], [212, 124, 'p'], [196, 120, 'n']].forEach(([x, y, k]) => { s += '<circle cx="' + x + '" cy="' + y + '" r="8" style="fill:' + (k === 'p' ? 'var(--pen)' : 'var(--good)') + '"/>'; });
  [[155, 110], [265, 110], [210, 20], [146, 176]].forEach(([x, y]) => { s += '<circle cx="' + x + '" cy="' + y + '" r="6" style="fill:var(--accent)"/>'; });
  if (labels) {
    const L = (x1, y1, x2, y2, t, anchor) => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--muted)"/><text x="' + x2 + '" y="' + (y2 + 4) + '" text-anchor="' + anchor + '" class="lbl">' + t + '</text>';
    s += L(222, 114, 330, 60, 'proton (+)', 'start') + L(204, 118, 330, 150, 'neutron (0)', 'start') + L(210, 20, 330, 18, 'electron (−)', 'start') + L(196, 104, 90, 70, 'nucleus', 'end') + L(120, 110, 90, 130, 'electron shell', 'end');
  }
  return s + '</svg>';
}
