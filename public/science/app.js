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
  return '<ol class="steps">' + steps.map(s => typeof s === 'string' ? '<li><span class="st" style="font-family:var(--f-body)">' + s + '</span></li>' : '<li><span class="st">' + s.t + '</span>' + (s.why ? '<span class="why">' + s.why + '</span>' : '') + '</li>').join('') + '</ol>';
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
  return '<svg class="dia" viewBox="0 0 300 210" style="max-width:300px;width:100%" role="img" aria-label="Fire triangle: fuel, oxygen, heat"><polygon class="fillt" points="150,20 280,185 20,185"/><text x="150" y="128" text-anchor="middle" class="lbl" style="font-size:15px">COMBUSTION</text><text x="58" y="100" text-anchor="middle" class="lbl" transform="rotate(-52 58 100)">FUEL</text><text x="242" y="100" text-anchor="middle" class="lbl" transform="rotate(52 242 100)">OXYGEN</text><text x="150" y="200" text-anchor="middle" class="lbl">HEAT (ignition energy)</text></svg>';
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
/* ================= science question generators =================
   Every generator builds questions from parts (substances, reactions, numbers, scenarios), so there is
   a very large supply. makeQ also remembers what this student has seen recently and avoids repeats.
   Multiple-choice wrong answers are deliberately close: common mistakes, right idea with the wrong
   reason, or a physical clue offered as chemical evidence. */
const G = {};
function gen(id, topic, name, fn) { G[id] = { id, topic, name, fn }; }

// ---- no repeats: remember the last questions seen for each generator (kept in this browser) ----
const SEEN_MAX = 300;
let SEEN = null, seenTimer = null;
function qKey(q) {
  const s = q.q + '|' + (q.choices ? q.choices.slice().sort().join('/') : '') + '|' + (q.fig || '');
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
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
  clearTimeout(seenTimer); seenTimer = setTimeout(() => store.set('seen', SEEN), 400);
  q.gen = id; q.topic = g.topic; q.gname = g.name; return q;
}
function mcqFrom(q, right, wrongs, sol, hint, extra) {
  const pool = shuffle(wrongs.filter(w => w !== right)).filter((w, i, a) => a.indexOf(w) === i);
  const opts = shuffle([right].concat(pool.slice(0, 3)));
  return Object.assign({ type: 'mcq', q, choices: opts, ans: opts.indexOf(right), ansText: right, sol: Array.isArray(sol) ? sol : [sol], hint }, extra || {});
}
function bankQ(bank) { const [q, right, wrongs, sol] = pick(bank); return mcqFrom(q, right, wrongs, sol); }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const NAMES = ['Ava', 'Noah', 'Mia', 'Leo', 'Isla', 'Jack', 'Zara', 'Kai', 'Ruby', 'Eli', 'Chloe', 'Max', 'Sienna', 'Ari', 'Lily', 'Finn', 'Grace', 'Theo', 'Amelia', 'Hugo'];

/* ---------- reactions used across many questions ---------- */
const RX = [
  { d: 'Magnesium metal is added to hydrochloric acid. Bubbles of hydrogen gas form and magnesium chloride is left in the solution.', r: ['magnesium', 'hydrochloric acid'], p: ['magnesium chloride', 'hydrogen'], obs: ['bubbles of gas', 'the magnesium disappears', 'the test tube gets warm'] },
  { d: 'Zinc metal is added to hydrochloric acid. Bubbles of hydrogen gas are produced and zinc chloride remains in the solution.', r: ['zinc', 'hydrochloric acid'], p: ['zinc chloride', 'hydrogen'], obs: ['bubbles of gas', 'the zinc slowly disappears'] },
  { d: 'Iron filings are added to hydrochloric acid. Hydrogen gas bubbles off and iron chloride forms in the solution.', r: ['iron', 'hydrochloric acid'], p: ['iron chloride', 'hydrogen'], obs: ['bubbles of gas', 'the solution turns pale green'] },
  { d: 'Magnesium ribbon is added to sulfuric acid. It fizzes, giving off hydrogen gas, and magnesium sulfate forms in the solution.', r: ['magnesium', 'sulfuric acid'], p: ['magnesium sulfate', 'hydrogen'], obs: ['fizzing', 'the magnesium disappears'] },
  { d: 'Sodium sulfate solution and barium chloride solution react to form solid barium sulfate and sodium chloride, which stays dissolved.', r: ['sodium sulfate', 'barium chloride'], p: ['barium sulfate', 'sodium chloride'], obs: ['a white precipitate forms'] },
  { d: 'Steel wool (iron) is placed in copper sulfate solution. It forms iron sulfate solution and copper metal.', r: ['iron', 'copper sulfate'], p: ['iron sulfate', 'copper'], obs: ['a brown-red coating forms on the steel wool', 'the blue solution fades'] },
  { d: 'Copper carbonate is heated. It breaks down to form copper oxide and carbon dioxide.', r: ['copper carbonate'], p: ['copper oxide', 'carbon dioxide'], obs: ['the green powder turns black', 'a gas is given off'] },
  { d: 'Calcium carbonate (limestone) is heated strongly. It breaks down into calcium oxide (quicklime) and carbon dioxide.', r: ['calcium carbonate'], p: ['calcium oxide', 'carbon dioxide'], obs: ['a gas is given off that turns limewater cloudy'] },
  { d: 'Magnesium ribbon is burned in oxygen. It gives a bright white light and forms a white powder called magnesium oxide.', r: ['magnesium', 'oxygen'], p: ['magnesium oxide'], obs: ['a bright white light', 'a white powder forms', 'heat is released'] },
  { d: 'Methane (natural gas) burns in oxygen to form carbon dioxide and water.', r: ['methane', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a blue flame', 'heat is released'] },
  { d: 'Iron reacts with oxygen to form iron oxide (rust).', r: ['iron', 'oxygen'], p: [['iron oxide', 'rust', 'hydrated iron oxide']], obs: ['an orange-brown flaky coating forms'] },
  { d: 'Hydrogen gas reacts with oxygen gas to form water.', r: ['hydrogen', 'oxygen'], p: ['water'], obs: ['a squeaky pop', 'droplets of liquid form'] },
  { d: 'Calcium carbonate (marble chips) reacts with hydrochloric acid to form calcium chloride, water and carbon dioxide.', r: ['calcium carbonate', 'hydrochloric acid'], p: ['calcium chloride', 'water', 'carbon dioxide'], obs: ['fizzing', 'the marble chips get smaller'] },
  { d: 'Sodium hydroxide reacts with hydrochloric acid to form sodium chloride and water.', r: ['sodium hydroxide', 'hydrochloric acid'], p: ['sodium chloride', 'water'], obs: ['the mixture gets warmer'] },
  { d: 'Potassium hydroxide solution is added to nitric acid. They react to form potassium nitrate and water.', r: ['potassium hydroxide', 'nitric acid'], p: ['potassium nitrate', 'water'], obs: ['the mixture warms up'] },
  { d: 'Silver nitrate solution is added to sodium chloride solution. Solid silver chloride forms, and sodium nitrate stays in solution.', r: ['silver nitrate', 'sodium chloride'], p: ['silver chloride', 'sodium nitrate'], obs: ['a white precipitate forms'] },
  { d: 'Lead nitrate solution is mixed with potassium iodide solution. Bright yellow lead iodide and potassium nitrate form.', r: ['lead nitrate', 'potassium iodide'], p: ['lead iodide', 'potassium nitrate'], obs: ['a bright yellow precipitate forms'] },
  { d: 'Copper sulfate solution is mixed with sodium hydroxide solution. A blue solid, copper hydroxide, forms and sodium sulfate stays dissolved.', r: ['copper sulfate', 'sodium hydroxide'], p: ['copper hydroxide', 'sodium sulfate'], obs: ['a pale blue precipitate forms'] },
  { d: 'Zinc is placed in copper sulfate solution. It forms zinc sulfate and copper.', r: ['zinc', 'copper sulfate'], p: ['zinc sulfate', 'copper'], obs: ['the blue colour fades', 'a brown solid forms', 'the solution warms up'] },
  { d: 'Magnesium powder is added to copper sulfate solution. It forms magnesium sulfate and copper.', r: ['magnesium', 'copper sulfate'], p: ['magnesium sulfate', 'copper'], obs: ['the blue colour fades', 'a brown solid forms'] },
  { d: 'Hydrogen peroxide breaks down to form water and oxygen gas.', r: ['hydrogen peroxide'], p: ['water', 'oxygen'], obs: ['bubbles of gas', 'a glowing splint relights'] },
  { d: 'Carbon (charcoal) burns in oxygen to form carbon dioxide.', r: ['carbon', 'oxygen'], p: ['carbon dioxide'], obs: ['glowing', 'heat is released'] },
  { d: 'Sulfur burns in oxygen with a blue flame, forming the choking gas sulfur dioxide.', r: ['sulfur', 'oxygen'], p: ['sulfur dioxide'], obs: ['a blue flame', 'a sharp smell'] },
  { d: 'Copper is heated in air and reacts with oxygen to form copper oxide.', r: ['copper', 'oxygen'], p: ['copper oxide'], obs: ['the shiny copper turns black'] },
  { d: 'Zinc powder is heated in air and reacts with oxygen to form zinc oxide.', r: ['zinc', 'oxygen'], p: ['zinc oxide'], obs: ['a white-yellow powder forms'] },
  { d: 'Iron wool is heated and pushed into a jar of oxygen. It sparkles and forms iron oxide.', r: ['iron', 'oxygen'], p: ['iron oxide'], obs: ['bright sparks'] },
  { d: 'Propane (barbecue gas) burns in oxygen to form carbon dioxide and water.', r: ['propane', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a flame', 'heat is released'] },
  { d: 'Butane (lighter fuel) burns in oxygen to form carbon dioxide and water.', r: ['butane', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a flame'] },
  { d: 'Ethanol (alcohol fuel) burns in oxygen to form carbon dioxide and water.', r: ['ethanol', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a pale blue flame'] },
  { d: 'Glucose reacts with oxygen in your cells (respiration) to form carbon dioxide and water.', r: ['glucose', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['energy is released'] },
  { d: 'In photosynthesis, plants use light to turn carbon dioxide and water into glucose and oxygen.', r: ['carbon dioxide', 'water'], p: ['glucose', 'oxygen'], obs: ['oxygen bubbles off pondweed in sunlight'] },
  { d: 'Candle wax burns in oxygen to form carbon dioxide and water vapour.', r: [['wax', 'candle wax', 'paraffin wax'], 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a flame', 'light and heat', 'the wax gets used up'] },
  { d: 'Sodium hydrogen carbonate (baking soda) reacts with ethanoic acid (vinegar) to form sodium ethanoate, water and carbon dioxide.', r: [['sodium hydrogen carbonate', 'baking soda', 'sodium bicarbonate'], ['ethanoic acid', 'vinegar', 'acetic acid']], p: [['sodium ethanoate', 'sodium acetate'], 'water', 'carbon dioxide'], obs: ['fizzing', 'the mixture gets colder'] },
  { d: 'Sodium metal is dropped into water. It fizzes across the surface, forming sodium hydroxide and hydrogen gas.', r: ['sodium', 'water'], p: ['sodium hydroxide', 'hydrogen'], obs: ['fizzing', 'the sodium melts into a ball'] },
  { d: 'Calcium is added to water. It fizzes, forming calcium hydroxide and hydrogen gas.', r: ['calcium', 'water'], p: ['calcium hydroxide', 'hydrogen'], obs: ['fizzing', 'the water turns cloudy'] },
  { d: 'Carbon dioxide is bubbled through limewater (calcium hydroxide solution). Calcium carbonate and water form.', r: ['carbon dioxide', 'calcium hydroxide'], p: ['calcium carbonate', 'water'], obs: ['the limewater turns cloudy (milky)'] },
  { d: 'Iron and sulfur powders are heated together. They glow and form iron sulfide.', r: ['iron', 'sulfur'], p: ['iron sulfide'], obs: ['the mixture glows red', 'a black solid forms'] },
  { d: 'Aluminium foil is placed in copper chloride solution. It forms aluminium chloride and copper.', r: ['aluminium', 'copper chloride'], p: ['aluminium chloride', 'copper'], obs: ['the blue-green colour fades', 'a brown solid forms', 'the mixture gets hot'] }
];
const first = t => Array.isArray(t) ? t[0] : t;
// names that are easy to mix up: used to make tricky wrong answers
// (real chemical names only, so the trap is believable)
const NEAR = [[/\bhydroxide\b/, 'oxide'], [/\boxide\b/, 'hydroxide'], [/\bchloride\b/, 'chlorate'], [/\bsulfate\b/, 'sulfide'], [/\bsulfide\b/, 'sulfate'], [/\bnitrate\b/, 'nitrite'], [/\bcarbonate\b/, 'oxide'], [/^carbon dioxide$/, 'carbon monoxide']];
const NEAR_EXACT = { hydrogen: 'oxygen', oxygen: 'hydrogen', water: 'hydrogen', copper: 'carbon' };
function nearName(name) {
  if (NEAR_EXACT[name]) return NEAR_EXACT[name];
  for (const [re, to] of NEAR) if (re.test(name)) return name.replace(re, to);
  return null;
}

/* ---------- C1 physical and chemical changes ---------- */
const CHANGES = [
  ['melting chocolate', 'P'], ['toasting bread', 'C'], ['burning a candle wick', 'C'], ['a light bulb glowing', 'P'], ['dissolving salt in water', 'P'], ['burning wood', 'C'], ['baking chicken', 'C'], ['boiling water', 'P'],
  ['water evaporating from a river', 'P'], ['condensation on a window', 'P'], ['cutting paper', 'P'], ['milk turning sour', 'C'], ['breaking glass', 'P'], ['using a battery', 'C'], ['photosynthesis', 'C'], ['digesting food', 'C'],
  ['an iron nail rusting', 'C'], ['ice melting', 'P'], ['frying an egg', 'C'], ['crushing a can', 'P'], ['mixing sand and water', 'P'], ['a firework exploding', 'C'], ['baking a cake', 'C'], ['freezing juice into an ice block', 'P'],
  ['sharpening a pencil', 'P'], ['fruit rotting', 'C'], ['tearing paper', 'P'], ['dissolving sugar in tea', 'P'], ['an antacid tablet fizzing in water', 'C'], ['mixing vinegar and baking soda', 'C'], ['bending a wire', 'P'], ['a silver spoon tarnishing', 'C'],
  ['grinding coffee beans', 'P'], ['whipping cream', 'P'], ['striking a match', 'C'], ['a bicycle chain going rusty', 'C'], ['melting butter', 'P'], ['cooking a pancake', 'C'], ['stretching a rubber band', 'P'], ['a leaf changing colour in autumn', 'C'],
  ['magnesium burning with a white flame', 'C'], ['dry ice turning straight into a gas', 'P'], ['a copper roof turning green', 'C'], ['bread dough rising because of yeast', 'C'], ['shaping clay into a pot', 'P'], ['firing a clay pot in a kiln', 'C'],
  ['filtering sand out of water', 'P'], ['distilling salty water', 'P'], ['petrol burning in a car engine', 'C'], ['a glow stick being snapped and glowing', 'C'], ['melting wax (without burning it)', 'P'], ['hair dye changing hair colour', 'C'],
  ['concrete setting hard', 'C'], ['an egg going rotten', 'C'], ['dew forming on grass', 'P'], ['chopping vegetables', 'P'], ['caramelising sugar in a pan', 'C'], ['mixing cordial into water', 'P'], ['a banana turning brown', 'C'], ['steam fogging up a mirror', 'P']
];
gen('chgClassify', 'C1', 'Physical or chemical change?', () => {
  const [c, k] = pick(CHANGES); const chem = k === 'C';
  return { type: 'mcq', q: 'Is <b>' + c + '</b> a physical change or a chemical change?', choices: ['Physical change', 'Chemical change'], ans: chem ? 1 : 0, ansText: chem ? 'Chemical change' : 'Physical change',
    hint: 'Ask: is a new substance made? If yes, it is chemical.', sol: [chem ? 'A <b>new substance</b> is made, so it is a <b>chemical change</b>. It usually can’t be reversed.' : 'No new substance is made; it is the same substance in a different form, shape or state. It is a <b>physical change</b> and can usually be reversed.'] };
});
gen('chgPick', 'C1', 'Spot the chemical (or physical) change', () => {
  const chemWanted = Math.random() < 0.5;
  const right = pick(CHANGES.filter(c => (c[1] === 'C') === chemWanted))[0];
  const wrongs = shuffle(CHANGES.filter(c => (c[1] === 'C') !== chemWanted)).slice(0, 3).map(c => c[0]);
  return mcqFrom('Which of these is a <b>' + (chemWanted ? 'chemical' : 'physical') + '</b> change?', right, wrongs,
    chemWanted ? '<b>' + cap(right) + '</b> makes a new substance. The others only change shape, size or state.' : '<b>' + cap(right) + '</b> makes no new substance. The others all produce new substances.',
    'Is a new substance made?');
});
const EVIDENCE = ['a gas was produced that was not there before', 'the blue solution turned colourless', 'a white solid appeared when two clear solutions were mixed', 'the temperature rose by 9 °C with no heating', 'a smell of rotten eggs was given off', 'it gave off light and a flame', 'the green powder turned black and could not be changed back', 'the shiny metal became coated in a dull brown layer', 'the mixture fizzed and the solid got smaller', 'a yellow solid formed in the liquid', 'the mixture got colder by 6 °C on its own', 'the clear limewater turned milky'];
const TRAPS = ['bubbles appeared while the water was boiling', 'the ice turned to liquid when it was warmed', 'the sugar disappeared when it was stirred into water', 'the wax became soft and runny when heated', 'steam rose from the hot water', 'the solid was ground into a fine powder', 'the cordial looked paler after adding more water', 'droplets formed on a cold window', 'the metal rod expanded when it was heated', 'the salt reappeared when the water evaporated', 'the chocolate melted in the sun', 'the glass shattered into small pieces', 'the gas took up less space when squeezed', 'the butter went from solid to liquid in the pan'];
gen('chgEvidence', 'C1', 'Evidence of a chemical change', () => {
  if (Math.random() < 0.55) return mcqFrom('Which observation is the best <b>evidence that a chemical change</b> happened?', pick(EVIDENCE), TRAPS,
    ['Chemical evidence: a new gas, colour change, precipitate, temperature change without heating, a new smell, or light. Melting, dissolving, boiling and grinding make no new substance.', 'Careful: bubbles in <i>boiling</i> water are just water vapour, so they are not evidence of a chemical change.'], 'Look for signs that a new substance formed.');
  return mcqFrom('Which observation is <b>not</b> evidence of a chemical change?', pick(TRAPS), EVIDENCE,
    'That one is only a change of state, size or shape (or dissolving), so no new substance formed. All the others are clues that a new substance was made.', 'Which one could you undo easily with no new substance made?');
});
const WHY_CHEM_WRONG = ['it gets hotter while it happens', 'its shape changes', 'it changes state, like solid to liquid', 'it happens quickly', 'it looks different afterwards', 'it can easily be turned back'];
const WHY_PHYS_WRONG = ['it needs heat to happen', 'it can’t be reversed', 'a new substance forms', 'its colour or appearance changes', 'energy is involved', 'the particles break into new atoms'];
gen('chgDefine', 'C1', 'Physical and chemical change ideas', () => Math.random() < 0.55 ? (() => {
  const [c, k] = pick(CHANGES); const chem = k === 'C';
  return chem ? mcqFrom('Why is <b>' + c + '</b> a <b>chemical</b> change?', 'new substances form that can’t easily be turned back', WHY_CHEM_WRONG, 'The key test is whether a <b>new substance</b> forms. Heat, speed and appearance are not enough on their own.', 'What makes any change chemical?')
    : mcqFrom('Why is <b>' + c + '</b> a <b>physical</b> change?', 'it is still the same substance, just in a different form', WHY_PHYS_WRONG, 'No new substance forms; only the form, shape, size or state changes, so it can usually be reversed.', 'Is it still the same stuff afterwards?');
})() : bankQ([
  ['A <b>chemical change</b> is a change where…', 'one or more new substances are produced', ['the substance changes state, e.g. solid to liquid', 'energy is always given out as heat', 'the particles move faster and spread out'], 'A chemical change always produces at least one new substance. Not all chemical changes give out heat.'],
  ['A <b>physical change</b> is a change where…', 'no new substance is produced', ['a new substance is produced', 'the change can never be reversed', 'bubbles of a new gas appear'], 'In a physical change the substance stays the same; only its form, shape or state changes.'],
  ['What is the only way to be <b>certain</b> a chemical change has happened?', 'Show that a new substance has formed', ['Show that the temperature changed', 'Show that bubbles appeared', 'Show that the colour changed'], 'Clues like bubbles or colour change are evidence, but only a new substance proves it. Boiling water makes bubbles too.'],
  ['Melting ice is a physical change because…', 'it is still water, just in a different state', ['heat energy has to be added to melt it', 'it happens slowly', 'the particles break apart into new atoms'], 'Ice and liquid water are the same substance (H₂O).'],
  ['Why is dissolving salt in water a <b>physical</b> change?', 'The salt can be got back by evaporating the water', ['The salt disappears completely', 'The water changes colour', 'The mixture gets warmer'], 'No new substance forms: evaporate the water and the salt is still there.'],
  ['Why is burning paper a <b>chemical</b> change?', 'New substances such as ash, carbon dioxide and water vapour form', ['The paper changes shape as it curls up', 'The paper gets hot', 'It happens quickly'], 'The paper turns into new substances, and it can’t be turned back into paper.'],
  ['Boiling water produces bubbles. Why is this <b>not</b> evidence of a chemical change?', 'The bubbles are just water vapour, the same substance in a gas state', ['Because boiling is too hot', 'Because the bubbles are oxygen', 'Because the water gets less'], 'Bubbles only count as evidence when the gas is a new substance.'],
  ['Which is usually <b>easy to reverse</b>?', 'Freezing water into ice', ['Cooking an egg', 'Burning a match', 'Rusting an iron nail'], 'Physical changes such as freezing are usually reversible. Chemical changes usually aren’t.'],
  ['Which statement about chemical changes is <b>true</b>?', 'The atoms are rearranged to make new substances', ['Atoms are destroyed', 'New atoms are created', 'The atoms change into different elements'], 'Atoms are not made or destroyed; they join up in new ways.'],
  ['Cooking an egg is a chemical change because…', 'the egg white changes into a new substance that can’t be turned back', ['the egg gets hot', 'the egg changes from liquid to solid like ice does', 'the shell cracks'], 'Unlike freezing, cooking makes a new substance; you can’t uncook an egg.']
]));

/* ---------- C2 observing, analysing and justifying ---------- */
const SCEN = [
  { what: 'Students added a piece of magnesium to hydrochloric acid.', obs: 'bubbles formed, the magnesium got smaller, and the temperature rose from 21 °C to 29 °C', ev: 'gas bubbles formed and the temperature rose by 8 °C', k: 'C' },
  { what: 'Students heated a beaker of ice.', obs: 'the ice turned to liquid water and the temperature stayed at 0 °C while it melted', ev: 'the ice only changed state to liquid water and could be frozen again', k: 'P' },
  { what: 'Students mixed two clear, colourless solutions.', obs: 'a white solid appeared and slowly sank to the bottom', ev: 'a white precipitate formed, a new solid substance', k: 'C' },
  { what: 'Students stirred salt into water.', obs: 'the salt crystals disappeared and the water stayed clear', ev: 'the salt only dissolved and could be recovered by evaporating the water', k: 'P' },
  { what: 'Students heated green copper carbonate powder.', obs: 'the powder turned black and a gas was given off that turned limewater cloudy', ev: 'the colour changed from green to black and carbon dioxide gas was produced', k: 'C' },
  { what: 'Students dissolved citric acid and baking soda in water.', obs: 'it fizzed and the temperature fell from 22 °C to 14 °C', ev: 'a gas was produced and the temperature fell by 8 °C', k: 'C' },
  { what: 'Students crushed a sugar cube.', obs: 'it turned into small white grains that still tasted sweet', ev: 'only the size and shape changed; it was still sugar', k: 'P' },
  { what: 'Students left an iron nail in salty water for a week.', obs: 'an orange-brown flaky coating formed on the nail', ev: 'a new orange-brown substance (rust) formed on the nail', k: 'C' },
  { what: 'Students heated some candle wax gently in a test tube.', obs: 'the solid wax turned into a clear liquid, then went solid again when it cooled', ev: 'the wax only melted and turned back into solid wax on cooling', k: 'P' },
  { what: 'Students added zinc to blue copper sulfate solution.', obs: 'the blue colour faded, a brown solid formed and the temperature rose by 5 °C', ev: 'the colour changed, a new brown solid appeared and the temperature rose', k: 'C' },
  { what: 'Students boiled some water in a kettle.', obs: 'large bubbles formed and steam came out of the spout', ev: 'the water only changed into water vapour (steam) and could condense back', k: 'P' },
  { what: 'Students added lead nitrate solution to potassium iodide solution.', obs: 'a bright yellow solid appeared instantly', ev: 'a bright yellow precipitate, a new substance, formed', k: 'C' },
  { what: 'Students left a cut apple on the bench.', obs: 'the white flesh turned brown after 20 minutes', ev: 'the colour changed because a new brown substance formed on the surface', k: 'C' },
  { what: 'Students cooled some steam on a cold metal plate.', obs: 'droplets of clear liquid formed on the plate', ev: 'the water vapour only condensed into liquid water', k: 'P' },
  { what: 'Students added a drop of hydrogen peroxide to some yeast.', obs: 'it bubbled and a glowing splint relit in the gas', ev: 'oxygen gas was produced, shown by the glowing splint relighting', k: 'C' },
  { what: 'Students dropped a marble chip into hydrochloric acid.', obs: 'it fizzed, got smaller, and the gas turned limewater milky', ev: 'carbon dioxide gas was produced and the marble chip was used up', k: 'C' }
];
gen('obsClassify', 'C2', 'Analyse observations and justify', () => {
  const s = pick(SCEN), chem = s.k === 'C', T = chem ? 'Chemical' : 'Physical', W = chem ? 'Physical' : 'Chemical';
  const right = T + ': ' + s.ev + '.';
  const wrongs = [
    W + ': ' + s.ev + '.',                                   // right evidence, wrong type
    T + ': ' + pick(['it was done in a 250 mL glass beaker', 'the students wore safety glasses', 'the experiment took about 5 minutes', 'the equipment was set up on the bench']) + '.', // irrelevant evidence
    T + ': ' + pick(['it looked like a big reaction', 'something definitely happened to it', 'it seemed different afterwards', 'that is what usually happens']) + '.', // opinion, no evidence
    W + ': ' + pick(SCEN.filter(x => x.k !== s.k)).ev + '.'    // evidence from a different experiment
  ];
  return mcqFrom(s.what + ' They observed that <b>' + s.obs + '</b>. Which answer correctly classifies the change <b>and</b> justifies it with evidence?', right, wrongs,
    ['A good justification names the type of change <b>and</b> uses the specific observations from this experiment as evidence.', right], 'Check both parts: the type of change, and evidence from <i>these</i> observations.');
});
gen('obsVsOpinion', 'C2', 'Observation, inference or opinion?', () => {
  const s = { what: pick(['Students added a metal to an acid in a beaker.', 'Students mixed two solutions in a beaker.', 'Students added a powder to a solution in a test tube.', 'Students dropped a tablet into a beaker of water.']) }, t0 = rnd(18, 24), dT = rnd(3, 14), up = Math.random() < 0.5, t1 = up ? t0 + dT : t0 - dT, secs = rnd(3, 12) * 10;
  const OBS = ['The temperature ' + (up ? 'rose' : 'fell') + ' from ' + t0 + ' °C to ' + t1 + ' °C in ' + secs + ' seconds.', 'Bubbles formed for about ' + secs + ' seconds.', 'The ' + pick(['solution', 'mixture', 'liquid']) + ' changed from ' + pick(['blue to colourless', 'clear to cloudy white', 'green to black', 'colourless to yellow']) + '.'];
  const INF = ['A new substance must have formed.', 'The gas was probably carbon dioxide.', 'The reaction must be ' + (up ? 'exothermic' : 'endothermic') + '.', 'The atoms were rearranged.'];
  const OPI = ['The reaction was really impressive.', 'It was the best experiment we have done.', 'The colour looked nice.', 'I think chemistry is fun.'];
  const VAG = ['It got ' + (up ? 'a bit hotter' : 'a bit colder') + '.', 'The temperature changed heaps.', 'Some stuff happened in the beaker.', 'It bubbled a lot.'];
  const ask = rnd(0, 3);
  if (ask === 0) return mcqFrom(s.what + ' Which is a <b>scientific observation</b>?', pick(OBS), INF.concat(OPI), 'An observation is something you directly see, hear, smell, feel or measure. Inferences are conclusions; opinions are feelings.', 'Could you see or measure it directly?');
  if (ask === 1) return mcqFrom(s.what + ' Which statement is an <b>inference</b> (a conclusion), not an observation?', pick(INF), OBS.concat([pick(OPI)]), 'An inference explains the observations (e.g. “a new substance formed”). The others are things you directly saw or measured, or an opinion.', 'Which one did nobody actually see?');
  if (ask === 2) return mcqFrom(s.what + ' Which observation is recorded most <b>accurately</b>?', OBS[0], VAG.concat([pick(OPI)]), 'Accurate observations include measurements with numbers and units.', 'Look for numbers and units.');
  return mcqFrom(s.what + ' Which is an <b>opinion</b>, not scientific evidence?', pick(OPI), OBS.concat([pick(INF)]), 'Opinions are feelings or judgements; they can’t be used as scientific evidence.', 'Which one depends on what someone likes?');
});
const VERBS = [
  ['Identify', 'Recognise and name something, or pick out the right answer'], ['Distinguish', 'Recognise and point out how two things are different'], ['Observe', 'Notice what happens using your senses or instruments'], ['Record', 'Write down observations or measurements accurately'],
  ['Analyse', 'Break information into parts and explain what each part shows'], ['Justify', 'Support an answer or conclusion with evidence or reasons'], ['Construct', 'Put together something specific, e.g. a graph or a word equation'], ['Demonstrate', 'Show by example or evidence that something is true'],
  ['Classify', 'Sort things into groups using a rule'], ['Define', 'Give the exact meaning of a word or term'], ['Explain', 'Make clear how or why something happens, giving reasons'], ['Describe', 'Give an account of what something is like or what happened'],
  ['Compare', 'Show how things are similar and different'], ['Calculate', 'Work out a number answer, showing working'], ['Evaluate', 'Judge the value or quality of something, using criteria'], ['Predict', 'Say what you think will happen, based on evidence'],
  ['Interpret', 'Explain what data or information means'], ['Summarise', 'Give the main points briefly'], ['Discuss', 'Give points for and against, then a conclusion'], ['Contrast', 'Show how things are different'],
  ['Recall', 'Remember and state facts'], ['State', 'Give a short, clear fact with no explanation'], ['Investigate', 'Plan and carry out an inquiry to find out something'], ['Propose', 'Put forward an idea or plan for others to consider'],
  ['Outline', 'Give the main features without much detail'], ['Deduce', 'Reach a conclusion from the information given']
];
// verbs that are easy to mix up, so the wrong answers are close
const VERB_TWINS = { Describe: ['Explain', 'Outline', 'Summarise'], Explain: ['Describe', 'Justify', 'Analyse'], Justify: ['Explain', 'Evaluate', 'Analyse'], Compare: ['Contrast', 'Distinguish', 'Describe'], Contrast: ['Compare', 'Describe', 'Explain'], Distinguish: ['Compare', 'Classify', 'Describe'], Identify: ['Define', 'Describe', 'Classify'], State: ['Explain', 'Describe', 'Define'], Analyse: ['Interpret', 'Explain', 'Evaluate'], Evaluate: ['Justify', 'Discuss', 'Analyse'], Interpret: ['Analyse', 'Explain', 'Deduce'], Predict: ['Deduce', 'Propose', 'Explain'], Outline: ['Describe', 'Explain', 'Discuss'], Summarise: ['Describe', 'Explain', 'Evaluate'], Define: ['Describe', 'State', 'Identify'], Classify: ['Distinguish', 'Identify', 'Compare'] };
// pairs that mean almost the same thing are never shown together (that would make two answers right)
const VERB_SAME = [['Contrast', 'Distinguish'], ['Outline', 'Summarise'], ['State', 'Recall'], ['Identify', 'State']];
const sameAs = (a, b) => VERB_SAME.some(p => p.includes(a) && p.includes(b));
const verbWrongs = v => (VERB_TWINS[v] || []).concat(shuffle(VERBS.map(x => x[0]))).filter((w, i, a) => w !== v && !sameAs(v, w) && a.indexOf(w) === i).slice(0, 6);
gen('obsVerb', 'C2', 'What does the question want?', () => {
  const [v, d] = pick(VERBS); const tasks = ['the results', 'why mass seemed to decrease', 'the two types of change', 'your answer', 'the observations', 'the reaction'];
  return mcqFrom('A test question begins: <b>“' + v + ' ' + pick(tasks) + '.”</b> What should your answer do?', d, verbWrongs(v).map(w => VERBS.find(x => x[0] === w)[1]), '<b>' + v + '</b>: ' + d + '.', 'Some of these verbs sound similar. Focus on exactly what this one asks for.');
});

/* ---------- C3 reactants and products ---------- */
gen('rpIdentify', 'C3', 'Identify reactants or products', () => {
  const x = pick(RX); const askR = Math.random() < 0.5; const list = askR ? x.r : x.p;
  return { type: 'set', q: 'Look at this word equation:<div class="eqbox">' + eqText(x.r, x.p) + '</div>List the <b>' + (askR ? 'reactants' : 'products') + '</b>, separated by commas.', ans: list, ansText: list.map(first).join(', '),
    hint: 'Reactants are before the arrow. Products are after the arrow.', sol: ['Reactants (before the arrow): <b>' + x.r.map(first).join(', ') + '</b>.', 'Products (after the arrow): <b>' + x.p.map(first).join(', ') + '</b>.'] };
});
gen('rpFacts', 'C3', 'Reactants and products', () => {
  if (Math.random() < 0.65) {
    const x = pick(RX.filter(y => y.r.length + y.p.length >= 3)); const askP = Math.random() < 0.5;
    const right = first(pick(askP ? x.p : x.r)); const other = (askP ? x.r : x.p).map(first);
    const near = [right, ...other].map(nearName).filter(n => n && n !== right && !x.r.concat(x.p).map(first).includes(n));
    const extra = ['oxygen', 'water', 'carbon dioxide', 'hydrogen'].filter(n => !x.r.concat(x.p).map(first).includes(n));
    const named = x.r.concat(x.p).map(first), base = [...new Set(other.concat(near))].filter(n => n !== right);
    const fill = extra.concat(['nitrogen', 'sodium chloride', 'sulfur dioxide', 'iron oxide']).filter(n => n !== right && !base.includes(n) && !named.includes(n));
    return mcqFrom(x.d + '<br>Which substance is a <b>' + (askP ? 'product' : 'reactant') + '</b>?', right, base.length >= 3 ? base : base.concat(fill.slice(0, 3 - base.length)),
      ['Reactants (what you start with): <b>' + x.r.map(first).join(', ') + '</b>.', 'Products (what is made): <b>' + x.p.map(first).join(', ') + '</b>.'], 'Reactants are used up; products are made.');
  }
  return bankQ([
    ['A <b>reactant</b> is…', 'a substance that is used up in a chemical reaction', ['a substance that is made in a chemical reaction', 'a substance that speeds up a reaction but isn’t used up', 'the energy given out by a reaction'], 'Reactants are the starting substances; they get used up.'],
    ['A <b>product</b> is…', 'a new substance made in a chemical reaction', ['a substance you start with', 'a substance that is used up', 'any substance that is a gas'], 'Products are the new substances formed.'],
    ['In a word equation, the reactants are written…', 'on the left, before the arrow', ['on the right, after the arrow', 'above the arrow', 'on both sides of the arrow'], 'Reactants → products.'],
    ['What does the arrow <b>→</b> mean in a word equation?', 'reacts to form', ['is equal to', 'is the same as', 'is mixed with'], 'Read “→” as “react to form”. It is not an equals sign.'],
    ['During a reaction, the amount of reactants…', 'decreases as they are used up', ['increases', 'stays the same', 'decreases, then increases again'], 'Reactants are used up while products are made.'],
    ['Why isn’t <b>heat</b> written in a word equation?', 'It is energy, not a substance', ['It is always a reactant', 'It is always a product', 'It has no effect on reactions'], 'Word equations only list substances. Energy changes are described separately.']
  ]);
});

/* ---------- C4 word equations ---------- */
gen('eqConstruct', 'C4', 'Construct a word equation', () => {
  const x = pick(RX);
  return { type: 'eq', q: x.d + '<br><b>Write the word equation.</b>', ans: { r: x.r, p: x.p }, ansText: eqText(x.r, x.p),
    hint: 'Find what you start with (reactants) and what is made (products). Write: reactants → products, with + between substances.', sol: ['Reactants: ' + x.r.map(first).join(', ') + '. Products: ' + x.p.map(first).join(', ') + '.', '<b>' + eqText(x.r, x.p) + '</b>'] };
});
gen('eqMissing', 'C4', 'Complete a word equation', () => {
  const x = pick(RX.filter(y => y.r.length + y.p.length >= 3)); const all = x.r.map((t, i) => ['r', i]).concat(x.p.map((t, i) => ['p', i])); const [side, i] = pick(all);
  const missing = side === 'r' ? x.r[i] : x.p[i];
  const show = (arr, s) => arr.map((t, k) => (s === side && k === i) ? '<b>________</b>' : first(t)).join(' + ');
  return { type: 'text', q: x.d + '<br>Fill in the missing ' + (side === 'r' ? 'reactant' : 'product') + ':<div class="eqbox">' + show(x.r, 'r') + ' → ' + show(x.p, 'p') + '</div>', accept: (Array.isArray(missing) ? missing : [missing]).flatMap(m => [m, m.replace(/sulf/g, 'sulph')]), ansText: first(missing),
    hint: 'Read the description again. Which substance isn’t in the equation yet?', sol: ['Full equation: <b>' + eqText(x.r, x.p) + '</b>'] };
});
gen('eqChoose', 'C4', 'Pick the correct word equation', () => {
  const x = pick(RX.filter(y => y.r.length + y.p.length >= 3)); const R = x.r.map(first), P = x.p.map(first); const right = eqText(R, P);
  const wrongs = [eqText(P, R)];
  if (P.length > 1) wrongs.push(eqText(R, P.slice(0, -1)));                     // a product left out
  if (R.length > 1) wrongs.push(eqText([R[0]], P.concat([R[1]])));               // a reactant written as a product
  const near = P.map(nearName).findIndex(n => n); if (near >= 0) { const P2 = P.slice(); P2[near] = nearName(P[near]); wrongs.push(eqText(R, P2)); }
  const nr = R.map(nearName).findIndex(n => n); if (nr >= 0) { const R2 = R.slice(); R2[nr] = nearName(R[nr]); wrongs.push(eqText(R2, P)); }
  if (!R.includes('oxygen')) wrongs.push(eqText(R.concat(['oxygen']), P));
  if (wrongs.length < 3) wrongs.push(eqText(R, P.concat(['oxygen'])), eqText(R, P.concat(['water'])));
  return mcqFrom(x.d + ' Which word equation is correct?', right, wrongs, ['Reactants (what you start with) go on the left; products (what is made) go on the right. Check every substance and its exact name.', right], 'Check all three things: each side, nothing missing, and the exact names (e.g. chloride vs chlorine).');
});

/* ---------- C5 conservation of mass ---------- */
gen('massClosed', 'C5', 'Find the missing mass (closed system)', () => {
  const x = pick(RX.filter(y => y.r.length + y.p.length >= 3));
  const rm = x.r.map(() => r2(rnd(20, 150) / 10, 1)); const total = r2(rm.reduce((a, b) => a + b, 0), 1);
  const pm = x.p.map(() => 0); let left = total; for (let i = 0; i < pm.length - 1; i++) { pm[i] = r2(left * (rnd(30, 70) / 100), 1); left = r2(left - pm[i], 1); } pm[pm.length - 1] = r2(left, 1);
  const all = x.r.map((t, i) => ['r', i, rm[i]]).concat(x.p.map((t, i) => ['p', i, pm[i]])); const [side, mi, mv] = pick(all);
  const lab = (arr, ms, s) => arr.map((t, k) => first(t) + ' (' + ((s === side && k === mi) ? '<b>? g</b>' : fmt(ms[k]) + ' g') + ')').join(' + ');
  return { type: 'num', q: 'This reaction happens in a <b>sealed (closed) container</b>:<div class="eqbox">' + lab(x.r, rm, 'r') + ' → ' + lab(x.p, pm, 'p') + '</div>Find the missing mass in grams.', ans: mv, tol: 0.051, ansText: fmt(mv) + ' g',
    hint: 'In a closed system, total mass of reactants = total mass of products.', sol: (() => {
      const os = side === 'r' ? pm : rm, same = (side === 'r' ? rm : pm).filter((v, k) => k !== mi), osName = side === 'r' ? 'products' : 'reactants';
      return ['Law of conservation of mass: total mass of reactants = total mass of products.',
        'Total mass of the ' + osName + ' = ' + (os.length > 1 ? os.map(v => fmt(v)).join(' + ') + ' = ' : '') + fmt(total) + ' g.',
        same.length ? 'Missing mass = ' + fmt(total) + ' − ' + (same.length > 1 ? '(' + same.map(v => fmt(v)).join(' + ') + ')' : fmt(same[0])) + ' = <b>' + fmt(mv) + ' g</b>' : 'The missing substance is the only ' + (side === 'r' ? 'reactant' : 'product') + ', so its mass is <b>' + fmt(mv) + ' g</b>.'];
    })() };
});
gen('massOpen', 'C5', 'Open system: where did the mass go?', () => {
  const start = r2(rnd(800, 1600) / 10, 1), gas = r2(rnd(5, 40) / 10, 1), end = r2(start - gas, 1); const acid = pick(['marble chips (calcium carbonate) and hydrochloric acid', 'magnesium and hydrochloric acid', 'baking soda and vinegar', 'zinc and sulfuric acid', 'an antacid tablet and water']);
  if (Math.random() < 0.5) return { type: 'num', q: 'A beaker of ' + acid + ' has a mass of ' + fmt(start) + ' g at the start. The beaker is <b>open</b>. After the reaction, its mass is ' + fmt(end) + ' g. What mass of gas escaped?', ans: gas, tol: 0.051, ansText: fmt(gas) + ' g', sol: ['The mass that seems to disappear is the gas that escaped into the air.', fmt(start) + ' − ' + fmt(end) + ' = <b>' + fmt(gas) + ' g</b>'] };
  return mcqFrom('A beaker of ' + acid + ' reacts in an <b>open</b> beaker on a balance. The mass goes down from ' + fmt(start) + ' g to ' + fmt(end) + ' g. Why?', 'A gas was produced and escaped into the air',
    ['Some atoms were used up and destroyed in the reaction', 'Mass is only conserved in physical changes', 'The balance always reads less when a liquid gets warm', 'The products are always lighter than the reactants'],
    ['Mass is always conserved. In an open system, a gas product escapes, so the balance reading drops. In a sealed (closed) system the mass would stay the same.'], 'What could leave an open beaker?');
});
gen('massLaw', 'C5', 'Conservation of mass ideas', () => {
  if (Math.random() < 0.5) {
    const a = rnd(20, 90) / 10, b = rnd(20, 90) / 10, x = pick(RX.filter(y => y.r.length === 2)); const tot = r2(a + b, 1);
    return mcqFrom('In a <b>sealed flask</b>, ' + fmt(a) + ' g of ' + first(x.r[0]) + ' reacts completely with ' + fmt(b) + ' g of ' + first(x.r[1]) + '. What is the total mass of the products?', fmt(tot) + ' g',
      [fmt(r2(Math.abs(a - b), 1)) + ' g', fmt(Math.max(a, b)) + ' g', fmt(r2(tot - rnd(2, 9) / 10, 1)) + ' g', fmt(r2(tot + rnd(2, 9) / 10, 1)) + ' g'],
      ['In a closed system: mass of products = mass of reactants = ' + fmt(a) + ' + ' + fmt(b) + ' = <b>' + fmt(tot) + ' g</b>.'], 'Nothing can get in or out of a sealed flask.');
  }
  return bankQ([
    ['The <b>law of conservation of mass</b> says…', 'mass is not created or destroyed in a chemical reaction', ['mass is conserved only in physical changes', 'the mass of each substance stays the same', 'mass is lost as heat energy'], 'Total mass of reactants = total mass of products (in a closed system).'],
    ['During a chemical reaction, atoms are…', 'rearranged to make new substances', ['destroyed and replaced with new ones', 'changed into atoms of different elements', 'turned into energy'], 'Atoms are not created, destroyed or changed into other elements; they just join up in new ways.'],
    ['How could you <b>demonstrate</b> conservation of mass?', 'React the chemicals in a sealed container and weigh it before and after', ['Weigh the reactants, then weigh only the solid product', 'React the chemicals in an open beaker and weigh it after', 'Measure the temperature before and after'], 'A sealed container stops gas escaping, so the mass before and after should be equal.'],
    ['Steel wool is heated in air and its mass <b>increases</b>. Why?', 'It combines with oxygen from the air to form iron oxide', ['Heat energy has mass', 'New iron atoms are made', 'The steel wool absorbs water from the flame'], 'The oxygen atoms from the air add to the mass. Mass is still conserved overall.'],
    ['A log burns and leaves only a small pile of ash. Where did most of the mass go?', 'Into gases such as carbon dioxide and water vapour', ['It was destroyed by the fire', 'It turned into heat and light', 'Into the ash, which became lighter'], 'The products are mostly gases that drift away, so the ash weighs less than the log.'],
    ['A closed system is one where…', 'nothing can get in or out, including gases', ['heat can’t get in or out', 'only solids are used', 'the reaction is stopped'], 'Sealing it stops gases escaping, so you can see that mass is conserved.'],
    ['In Lavoisier’s experiments, why did he use <b>sealed</b> glass vessels?', 'So no gas could get in or out, letting him show the total mass stayed the same', ['So the reaction would go faster', 'So he could see the colour change', 'Because glass stops heat escaping'], 'Sealed vessels make a closed system.']
  ]);
});
const FORMULAS = [['CO₂', { C: 1, O: 2 }], ['H₂O', { H: 2, O: 1 }], ['CH₄', { C: 1, H: 4 }], ['NH₃', { N: 1, H: 3 }], ['MgO', { Mg: 1, O: 1 }], ['NaCl', { Na: 1, Cl: 1 }], ['HCl', { H: 1, Cl: 1 }], ['MgCl₂', { Mg: 1, Cl: 2 }], ['CaCO₃', { Ca: 1, C: 1, O: 3 }], ['H₂SO₄', { H: 2, S: 1, O: 4 }],
  ['C₆H₁₂O₆', { C: 6, H: 12, O: 6 }], ['C₃H₈', { C: 3, H: 8 }], ['C₄H₁₀', { C: 4, H: 10 }], ['CuSO₄', { Cu: 1, S: 1, O: 4 }], ['NaOH', { Na: 1, O: 1, H: 1 }], ['Ca(OH)₂', { Ca: 1, O: 2, H: 2 }], ['Al₂O₃', { Al: 2, O: 3 }], ['Fe₂O₃', { Fe: 2, O: 3 }], ['HNO₃', { H: 1, N: 1, O: 3 }], ['C₂H₅OH', { C: 2, H: 6, O: 1 }],
  ['O₂', { O: 2 }], ['H₂', { H: 2 }], ['N₂', { N: 2 }], ['Cl₂', { Cl: 2 }], ['CuCO₃', { Cu: 1, C: 1, O: 3 }], ['KNO₃', { K: 1, N: 1, O: 3 }], ['ZnCl₂', { Zn: 1, Cl: 2 }], ['SO₂', { S: 1, O: 2 }], ['H₂O₂', { H: 2, O: 2 }], ['NaHCO₃', { Na: 1, H: 1, C: 1, O: 3 }]];
const FORMULA_EQ = [
  ['2H₂ + O₂ → 2H₂O', { H: [4, 4], O: [2, 2] }], ['C + O₂ → CO₂', { C: [1, 1], O: [2, 2] }], ['2Mg + O₂ → 2MgO', { Mg: [2, 2], O: [2, 2] }], ['CH₄ + 2O₂ → CO₂ + 2H₂O', { C: [1, 1], H: [4, 4], O: [4, 4] }],
  ['Mg + 2HCl → MgCl₂ + H₂', { Mg: [1, 1], H: [2, 2], Cl: [2, 2] }], ['3H₂ + N₂ → 2NH₃', { H: [6, 6], N: [2, 2] }], ['CuCO₃ → CuO + CO₂', { Cu: [1, 1], C: [1, 1], O: [3, 3] }], ['C + 2Cl₂ → CCl₄', { C: [1, 1], Cl: [4, 4] }],
  ['C₃H₈ + 5O₂ → 3CO₂ + 4H₂O', { C: [3, 3], H: [8, 8], O: [10, 10] }], ['2H₂O₂ → 2H₂O + O₂', { H: [4, 4], O: [4, 4] }], ['Zn + 2HCl → ZnCl₂ + H₂', { Zn: [1, 1], H: [2, 2], Cl: [2, 2] }], ['4Fe + 3O₂ → 2Fe₂O₃', { Fe: [4, 4], O: [6, 6] }],
  ['NaOH + HCl → NaCl + H₂O', { Na: [1, 1], O: [1, 1], H: [2, 2], Cl: [1, 1] }], ['CaCO₃ → CaO + CO₂', { Ca: [1, 1], C: [1, 1], O: [3, 3] }], ['2Na + 2H₂O → 2NaOH + H₂', { Na: [2, 2], H: [4, 4], O: [2, 2] }], ['C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', { C: [6, 6], H: [12, 12], O: [18, 18] }]
];
gen('atomCount', 'C5', 'Count the atoms', () => {
  if (Math.random() < 0.55) {
    const [f, c] = pick(FORMULAS); const n = rnd(1, 6); const el = pick(Object.keys(c)); const tot = n * c[el];
    const shown = (n > 1 ? n : '') + f;
    return { type: 'num', q: 'How many <b>' + el + '</b> atoms are in <b>' + shown + '</b>?', ans: tot, ansText: String(tot), hint: 'Big number in front = number of molecules. Small number after a symbol = atoms of that element in one molecule. Multiply them.',
      sol: ['Each ' + f + ' has ' + c[el] + ' ' + el + ' atom' + (c[el] > 1 ? 's' : '') + '.', n + ' × ' + c[el] + ' = <b>' + tot + '</b>'] };
  }
  const [eq, counts] = pick(FORMULA_EQ); const el = pick(Object.keys(counts)); const left = Math.random() < 0.6; const n = counts[el][left ? 0 : 1];
  return { type: 'num', q: 'In the balanced equation <b>' + eq + '</b>, how many <b>' + el + '</b> atoms are on the <b>' + (left ? 'reactant (left)' : 'product (right)') + '</b> side?', ans: n, ansText: String(n), hint: 'Big number in front = number of molecules. Small number after a symbol = atoms in each molecule. Multiply, then add up every ' + el + ' on that side.',
    sol: [el + ' atoms on the left: ' + counts[el][0] + '. On the right: ' + counts[el][1] + '.', 'The numbers match because atoms are only rearranged, never created or destroyed. That is why mass is conserved.'] };
});

/* ---------- C6 exothermic and endothermic ---------- */
gen('tempClassify', 'C6', 'Classify from temperature data', () => {
  const start = rnd(17, 25); const exo = Math.random() < 0.5; const dT = rnd(2, 18); const end = exo ? start + dT : start - dT;
  const thing = pick(['dissolved a salt in water', 'mixed two solutions', 'added a powder to water', 'reacted a metal with an acid', 'added citric acid to baking soda solution', 'mixed an acid and an alkali', 'added iron powder to copper sulfate solution']);
  return { type: 'mcq', q: 'Students ' + thing + '. The temperature went from <b>' + start + ' °C</b> to <b>' + fmt(end) + ' °C</b>. Classify the reaction.', choices: ['Exothermic', 'Endothermic'], ans: exo ? 0 : 1, ansText: exo ? 'Exothermic' : 'Endothermic',
    hint: 'Temperature up = exothermic (energy out). Temperature down = endothermic (energy in).', sol: [(exo ? 'The temperature increased by ' : 'The temperature decreased by ') + dT + ' °C.', exo ? '<b>Exothermic</b>: energy was released to the surroundings, so they got hotter.' : '<b>Endothermic</b>: energy was absorbed from the surroundings, so they got colder.'] };
});
gen('deltaT', 'C6', 'Calculate the temperature change (ΔT)', () => {
  const start = r2(rnd(170, 250) / 10, 1); const exo = Math.random() < 0.5; const ext = r2(exo ? start + rnd(20, 220) / 10 : start - rnd(20, 120) / 10, 1); const d = r2(ext - start, 1);
  return { type: 'num', signed: true, q: 'A reaction starts at <b>' + fmt(start) + ' °C</b> and reaches a ' + (exo ? 'maximum' : 'minimum') + ' of <b>' + fmt(ext) + ' °C</b>. Calculate the temperature change, ΔT. (Use a minus sign for a decrease.)', ans: d, tol: 0.051, ansText: (d > 0 ? '+' : '') + fmt(d) + ' °C',
    hint: 'ΔT = final temperature − starting temperature.', sol: ['ΔT = ' + fmt(ext) + ' − ' + fmt(start) + ' = <b>' + (d > 0 ? '+' : '') + fmt(d) + ' °C</b>', d > 0 ? 'Positive: the temperature rose, so it is exothermic.' : 'Negative: the temperature fell, so it is endothermic.'] };
});
gen('meanUnc', 'C6', 'Mean and uncertainty of trials', () => {
  const base = rnd(120, 380) / 10; const t = [0, 0, 0].map(() => r2(base + rnd(-12, 12) / 10, 1)); const mean = (t[0] + t[1] + t[2]) / 3; const unc = (Math.max(...t) - Math.min(...t)) / 2;
  if (Math.random() < 0.5) return { type: 'num', q: 'Three trials gave temperatures of <b>' + t.map(v => v.toFixed(1)).join(' °C, ') + ' °C</b>. Calculate the mean (1 decimal place).', ans: r2(mean, 1), tol: 0.051, ansText: fmt(r2(mean, 1)) + ' °C', sol: ['Mean = (' + t.map(v => v.toFixed(1)).join(' + ') + ') ÷ 3', '= ' + fmt(r2(t[0] + t[1] + t[2], 1)) + ' ÷ 3 = <b>' + fmt(r2(mean, 1)) + ' °C</b>'] };
  return { type: 'num', q: 'Three trials gave temperatures of <b>' + t.map(v => v.toFixed(1)).join(' °C, ') + ' °C</b>. Calculate the uncertainty. (Uncertainty = (highest − lowest) ÷ 2)', ans: r2(unc, 2), tol: 0.051, ansText: '± ' + fmt(r2(unc, 2)) + ' °C', sol: ['Highest = ' + Math.max(...t).toFixed(1) + ', lowest = ' + Math.min(...t).toFixed(1) + '.', '(' + Math.max(...t).toFixed(1) + ' − ' + Math.min(...t).toFixed(1) + ') ÷ 2 = <b>± ' + fmt(r2(unc, 2)) + ' °C</b>'] };
});
// energy diagram with numbers (kJ), so every one is different
function energyNumSVG(R, P, peak) {
  const W = 330, H = 210, y = v => 185 - v / 400 * 165;
  let s = '<svg class="dia" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;width:100%" role="img" aria-label="Energy diagram: reactants ' + R + ' kJ, peak ' + peak + ' kJ, products ' + P + ' kJ">';
  s += '<line class="ax" x1="46" y1="190" x2="46" y2="10"/><line class="ax" x1="46" y1="190" x2="320" y2="190"/><text x="14" y="100" transform="rotate(-90 14 100)" text-anchor="middle">Energy (kJ)</text><text x="185" y="206" text-anchor="middle">Reaction progress</text>';
  [0, 100, 200, 300, 400].forEach(v => { s += '<line x1="42" y1="' + y(v) + '" x2="46" y2="' + y(v) + '" stroke="var(--ink)"/><text x="38" y="' + (y(v) + 4) + '" text-anchor="end" style="font-size:10px">' + v + '</text><line x1="46" y1="' + y(v) + '" x2="320" y2="' + y(v) + '" stroke="var(--line)" stroke-dasharray="2 3"/>'; });
  s += '<path class="edge" d="M56 ' + y(R) + ' H115 C150 ' + y(R) + ' 155 ' + y(peak) + ' 185 ' + y(peak) + ' S220 ' + y(P) + ' 255 ' + y(P) + ' H312" />';
  s += '<text x="85" y="' + (y(R) - 6) + '" text-anchor="middle" class="lbl">Reactants</text><text x="284" y="' + (y(P) - 6) + '" text-anchor="middle" class="lbl">Products</text>';
  return s + '</svg>';
}
gen('energyDiagram', 'C6', 'Read an energy diagram', () => {
  const exo = Math.random() < 0.5; const R = exo ? rnd(16, 34) * 10 : rnd(6, 18) * 10, P = exo ? R - rnd(6, 16) * 10 : R + rnd(6, 18) * 10, peak = Math.max(R, P) + rnd(4, 8) * 10;
  const P2 = Math.max(10, Math.min(390, P)); const diff = Math.abs(R - P2), fig = energyNumSVG(R, P2, Math.min(400, peak));
  const k = rnd(0, 2);
  if (k === 0) return { type: 'mcq', q: 'Is this reaction exothermic or endothermic?', fig, choices: ['Exothermic', 'Endothermic'], ans: exo ? 0 : 1, ansText: exo ? 'Exothermic' : 'Endothermic', hint: 'Compare the energy of the reactants (left) with the products (right).',
    sol: [exo ? 'Products (' + P2 + ' kJ) have <b>less</b> energy than reactants (' + R + ' kJ), so energy was <b>released</b>: exothermic.' : 'Products (' + P2 + ' kJ) have <b>more</b> energy than reactants (' + R + ' kJ), so energy was <b>absorbed</b>: endothermic.'] };
  if (k === 1) return { type: 'num', q: 'How much energy is ' + (exo ? 'released' : 'absorbed') + ' in this reaction, in kJ?', fig, ans: diff, ansText: diff + ' kJ', hint: 'Energy change = difference between the reactants’ level and the products’ level (not the peak).', sol: ['Energy change = products − reactants = ' + P2 + ' − ' + R + ' = ' + (P2 > R ? '+' : '') + fmt(P2 - R) + ' kJ.', (exo ? 'Negative, so energy is released' : 'Positive, so energy is absorbed') + ': <b>' + diff + ' kJ</b>.'] };
  const right = (exo ? 'Exothermic: ' + diff + ' kJ released' : 'Endothermic: ' + diff + ' kJ absorbed');
  return mcqFrom('Which statement correctly describes this reaction?', right,
    [(exo ? 'Endothermic: ' + diff + ' kJ absorbed' : 'Exothermic: ' + diff + ' kJ released'), (exo ? 'Exothermic: ' : 'Endothermic: ') + (Math.min(400, peak) - Math.min(R, P2)) + ' kJ ' + (exo ? 'released' : 'absorbed'), (exo ? 'Exothermic: ' : 'Endothermic: ') + (R + P2) + ' kJ ' + (exo ? 'released' : 'absorbed'), (exo ? 'Endothermic: ' : 'Exothermic: ') + (Math.min(400, peak) - R) + ' kJ ' + (exo ? 'absorbed' : 'released')],
    ['Energy change = products − reactants = ' + P2 + ' − ' + R + ' = ' + fmt(P2 - R) + ' kJ. ' + (exo ? 'Negative: energy released (exothermic).' : 'Positive: energy absorbed (endothermic).'), 'The peak is the energy needed to start the reaction; it is not the overall energy change.'], 'Use the reactant and product levels, not the peak.', { fig });
});
const EXO_EX = ['burning wood', 'a hand warmer heating up', 'respiration in your cells', 'magnesium reacting with acid', 'an acid neutralising an alkali', 'petrol burning in an engine', 'fireworks exploding', 'iron slowly rusting', 'concrete setting', 'a candle burning', 'water freezing into ice', 'steam condensing on a mirror'];
const ENDO_EX = ['photosynthesis', 'an instant cold pack working', 'baking a cake', 'cooking an egg', 'thermal decomposition of copper carbonate', 'citric acid reacting with baking soda', 'ice melting', 'water evaporating', 'dissolving ammonium nitrate in water', 'splitting water into hydrogen and oxygen with electricity', 'sherbet fizzing on your tongue (feels cold)', 'heating limestone to make quicklime'];
gen('exoEndoFacts', 'C6', 'Exothermic and endothermic', () => {
  const k = rnd(0, 3);
  if (k === 0) return mcqFrom('Which of these is <b>endothermic</b>?', pick(ENDO_EX), EXO_EX, 'Endothermic processes take in energy from the surroundings (e.g. cooking, photosynthesis, melting, cold packs).', 'Does it need a constant supply of energy, or make things colder?');
  if (k === 1) return mcqFrom('Which of these is <b>exothermic</b>?', pick(EXO_EX), ENDO_EX, 'Exothermic processes give out energy to the surroundings (e.g. burning, respiration, neutralisation, freezing).', 'Does it give out heat or light?');
  return bankQ([
    ['An <b>exothermic</b> reaction…', 'releases energy, so the surroundings get warmer', ['absorbs energy, so the surroundings get warmer', 'releases energy, so the surroundings get colder', 'absorbs energy, so the surroundings get colder'], 'Exo = exit: energy goes out to the surroundings, which warm up.'],
    ['An <b>endothermic</b> reaction…', 'absorbs energy, so the surroundings get colder', ['releases energy, so the surroundings get colder', 'absorbs energy, so the surroundings get warmer', 'releases energy, so the surroundings get warmer'], 'Endo = enter: energy goes in from the surroundings, which cool down.'],
    ['In an exothermic reaction, the products have…', 'less energy than the reactants', ['more energy than the reactants', 'the same energy as the reactants', 'no energy at all'], 'The extra energy was released to the surroundings.'],
    ['In an endothermic reaction, the products have…', 'more energy than the reactants', ['less energy than the reactants', 'the same energy as the reactants', 'less mass than the reactants'], 'The products gained the energy that was absorbed.'],
    ['Breaking chemical bonds…', 'takes in energy', ['gives out energy', 'has no energy change', 'always produces light'], 'Breaking bonds needs energy; making bonds releases energy.'],
    ['Making new chemical bonds…', 'gives out energy', ['takes in energy', 'has no energy change', 'destroys atoms'], 'Energy is released when bonds form.'],
    ['A reaction gives out more energy making bonds than it takes in breaking bonds. It is…', 'exothermic', ['endothermic', 'neither: the energy cancels out', 'a physical change'], 'More energy released than absorbed → exothermic overall.'],
    ['Why does an instant cold pack feel cold?', 'The process inside absorbs heat energy from your skin', ['It releases cold energy', 'It contains ice', 'It releases heat into the pack'], 'There is no “cold energy”: heat flows from your skin into the pack.']
  ]);
});

/* ---------- C7 combustion ---------- */
const FUELS = [['methane', ['methane', 'natural gas']], ['propane', ['propane']], ['butane', ['butane']], ['candle wax', ['wax', 'candle wax', 'paraffin wax']], ['petrol (octane)', ['petrol', 'octane']], ['ethanol', ['ethanol']], ['natural gas', ['natural gas', 'methane']], ['methanol', ['methanol']], ['hexane', ['hexane']], ['kerosene', ['kerosene', 'paraffin']], ['diesel', ['diesel']], ['glucose', ['glucose']], ['pentane', ['pentane']], ['LPG (liquefied petroleum gas)', ['lpg', 'liquefied petroleum gas', 'propane', 'butane']]];
gen('combEq', 'C7', 'Combustion word equation', () => {
  const r = Math.random();
  if (r < 0.12) return { type: 'eq', q: '<b>Carbon</b> (charcoal) burns completely in oxygen. Write the word equation.', ans: { r: [['carbon', 'charcoal'], 'oxygen'], p: ['carbon dioxide'] }, ansText: 'carbon + oxygen → carbon dioxide', hint: 'Carbon contains no hydrogen, so no water is made.', sol: ['<b>carbon + oxygen → carbon dioxide</b>', 'There is no hydrogen in carbon, so there is no water product.'] };
  if (r < 0.22) return { type: 'eq', q: '<b>Hydrogen</b> gas burns in oxygen (it is used as a rocket fuel). Write the word equation.', ans: { r: ['hydrogen', 'oxygen'], p: ['water'] }, ansText: 'hydrogen + oxygen → water', hint: 'Hydrogen contains no carbon, so no carbon dioxide is made.', sol: ['<b>hydrogen + oxygen → water</b>', 'No carbon in the fuel means no carbon dioxide: that is why hydrogen is called a clean fuel.'] };
  const [name, alts] = pick(FUELS);
  return { type: 'eq', q: '<b>' + cap(name) + '</b> burns completely in plenty of oxygen. Write the word equation for this combustion reaction.', ans: { r: [alts, 'oxygen'], p: ['carbon dioxide', 'water'] }, ansText: alts[0] + ' + oxygen → carbon dioxide + water',
    hint: 'Fuel + oxygen → carbon dioxide + water (for fuels made of carbon and hydrogen).', sol: ['Complete combustion of a fuel containing carbon and hydrogen:', '<b>' + alts[0] + ' + oxygen → carbon dioxide + water</b>', 'Energy is released as heat and light (exothermic).'] };
});
gen('combFacts', 'C7', 'Combustion ideas', () => {
  if (Math.random() < 0.35) {
    const [name] = pick(FUELS);
    return mcqFrom('What are the products when <b>' + name + '</b> burns completely in plenty of oxygen?', 'carbon dioxide and water', ['carbon monoxide and water', 'carbon dioxide and hydrogen', 'oxygen and water', 'carbon and water', 'carbon dioxide only'],
      'Complete combustion of a fuel containing carbon and hydrogen makes <b>carbon dioxide and water</b>. Carbon monoxide and soot only form when oxygen is short.', 'The carbon becomes … and the hydrogen becomes …');
  }
  return bankQ([
    ['<b>Combustion</b> is…', 'a reaction where a substance reacts with oxygen, releasing energy as heat and light', ['a reaction where a substance reacts with oxygen, absorbing heat', 'a reaction where a metal slowly reacts with oxygen and water', 'a substance melting when it is heated strongly'], 'Combustion = burning: fuel + oxygen → products + energy.'],
    ['Which three things are needed for combustion?', 'Fuel, oxygen and heat', ['Fuel, carbon dioxide and heat', 'Oxygen, water and heat', 'Fuel, oxygen and water'], 'This is the fire triangle. Remove any one and the fire goes out.'],
    ['Why do you need a match to light a gas stove?', 'It provides the energy needed to start the reaction', ['It provides the fuel', 'It provides the oxygen', 'It makes the reaction endothermic'], 'The ignition energy starts combustion; after that, the reaction releases enough energy to keep itself going.'],
    ['Putting a lid on a burning pan puts the fire out because…', 'it stops oxygen reaching the fuel', ['it removes the fuel', 'it cools the fuel below its ignition temperature', 'it traps the carbon dioxide, which is the fuel'], 'No oxygen, no combustion.'],
    ['When there is <b>not enough oxygen</b> (incomplete combustion), a fuel can produce…', 'carbon monoxide and soot as well as water', ['only carbon dioxide and water', 'hydrogen and oxygen', 'only water'], 'This is why a yellow, sooty flame is a sign of incomplete combustion.'],
    ['Why is incomplete combustion dangerous?', 'It can make carbon monoxide, a poisonous gas you can’t see or smell', ['It makes extra oxygen', 'It makes the flame too hot', 'It produces pure carbon dioxide'], 'Carbon monoxide stops your blood carrying oxygen.'],
    ['A blue Bunsen flame is hotter and cleaner than a yellow one because…', 'more oxygen is mixed in, so the combustion is complete', ['less oxygen is mixed in', 'it uses a different fuel', 'it is endothermic'], 'Opening the air hole lets in more oxygen.'],
    ['Combustion reactions are…', 'exothermic, because they release heat and light', ['endothermic, because they need a match', 'physical changes, because the fuel changes state', 'reversible chemical changes'], 'They release energy to the surroundings.']
  ]);
});
const FIRE = [
  ['fuel', 'Turning off the gas at a stove'], ['fuel', 'Clearing a strip of bush ahead of a bushfire (a firebreak)'], ['fuel', 'Letting a candle burn until all its wax is used up'], ['fuel', 'Turning off the gas tap on a Bunsen burner'], ['fuel', 'Removing the logs from a campfire'], ['fuel', 'Letting a barbecue’s gas bottle run empty'],
  ['oxygen', 'Smothering a fire with a fire blanket'], ['oxygen', 'Putting a lid on a pan of burning oil'], ['oxygen', 'Covering a campfire with sand'], ['oxygen', 'Putting a jar over a burning candle'], ['oxygen', 'A carbon dioxide fire extinguisher pushing the air away'], ['oxygen', 'Closing the air vents on a wood heater'],
  ['heat', 'Spraying water on burning wood'], ['heat', 'Blowing out a match'], ['heat', 'Pouring water over campfire coals'], ['heat', 'Sprinklers spraying water on a burning shed'], ['heat', 'Licking your fingers and pinching out a candle wick'], ['heat', 'A wet towel cooling a small paper fire']
];
gen('combTriangle', 'C7', 'The fire triangle', () => {
  const [part, act] = pick(FIRE);
  return { type: 'mcq', q: act + ' puts the fire out. Which part of the fire triangle does it <b>mainly</b> remove?', fig: fireTriangleSVG(), choices: ['Fuel', 'Oxygen', 'Heat'], ans: ['fuel', 'oxygen', 'heat'].indexOf(part), ansText: cap(part),
    hint: 'Is the thing that burns taken away, is air kept out, or is it cooled down?', sol: ['It removes the <b>' + part + '</b>. Without all three (fuel, oxygen, heat), combustion stops.'] };
});

/* ---------- C8 corrosion ---------- */
gen('corrFacts', 'C8', 'Corrosion ideas', () => Math.random() < 0.5 ? (() => {
  const fast = Math.random() < 0.5;
  for (let t = 0; t < 20; t++) {
    const set = shuffle(TUBES).slice(0, 4); const rates = set.map(x => x[1]); const best = fast ? Math.max(...rates) : Math.min(...rates);
    if (rates.filter(r => r === best).length !== 1) continue;
    const right = set[rates.indexOf(best)][0];
    return mcqFrom('Which iron nail will rust the <b>' + (fast ? 'fastest' : 'least') + '</b>?', cap(right), set.filter(x => x[0] !== right).map(x => cap(x[0])),
      'Rusting needs <b>oxygen and water</b>. Salt and warmth speed it up; coatings (paint, oil, zinc), no water or no oxygen stop it.', 'Check each one for oxygen, water, salt, warmth and coatings.');
  }
  return bankQ([['Which two things are needed for iron to rust?', 'Oxygen and water', ['Oxygen and salt', 'Water and salt', 'Oxygen and heat'], 'Salt and warmth speed it up, but oxygen and water are both needed.']]);
})() : bankQ([
  ['<b>Corrosion</b> is…', 'a chemical reaction where a metal is slowly damaged by substances around it', ['a metal melting when it gets hot', 'a physical change where a metal changes colour', 'a metal reacting quickly with oxygen and bursting into flame'], 'Substances like oxygen and water react with the metal and slowly damage it.'],
  ['Rusting is a <b>chemical</b> change because…', 'a new substance, iron oxide, forms', ['the iron changes colour', 'it happens slowly', 'the iron gets weaker'], 'The colour change and weakening are clues, but the proof is the new substance.'],
  ['Which two things are needed for iron to rust?', 'Oxygen and water', ['Oxygen and salt', 'Water and salt', 'Oxygen and heat'], 'Salt and warmth speed it up, but oxygen and water are both needed.'],
  ['Which helps <b>prevent</b> rusting?', 'Painting the iron so air and water can’t reach it', ['Keeping the iron in salty water', 'Scratching the paint off', 'Storing the iron in a damp shed'], 'A coating keeps oxygen and water away from the iron.'],
  ['Why does a car rust faster near the beach?', 'Salt in the air and water speeds up corrosion', ['There is less oxygen near the sea', 'The sand protects the paint', 'Sea air is colder'], 'Salt and moisture make iron corrode faster.'],
  ['Galvanising protects iron by…', 'coating it with zinc', ['coating it with copper', 'heating it until it melts', 'keeping it wet'], 'The zinc coating keeps air and water away, and corrodes instead of the iron.'],
  ['Why isn’t rust a good protective layer?', 'It is flaky and falls off, so fresh iron underneath keeps rusting', ['It is too shiny', 'It conducts electricity', 'It makes the iron heavier'], 'Unlike the oxide on aluminium, rust doesn’t seal the surface.'],
  ['Aluminium doesn’t corrode much because…', 'it forms a thin, tough oxide layer that seals the surface', ['it doesn’t react with oxygen', 'it is a non-metal', 'it is coated in rust'], 'The oxide layer sticks and protects the metal underneath.'],
  ['The word equation for rusting is…', 'iron + oxygen + water → hydrated iron oxide', ['iron + water → iron oxide + hydrogen', 'iron + carbon dioxide → iron oxide', 'iron oxide → iron + oxygen'], 'Iron reacts with oxygen and water; rust is hydrated iron oxide.'],
  ['Which metal object is <b>least</b> likely to rust?', 'A plastic-coated iron dish rack', ['An uncoated iron nail outside', 'A scratched iron gate near the beach', 'Steel wool left in a wet sink'], 'The coating keeps oxygen and water off the iron.'],
  ['Which will make an iron nail rust <b>fastest</b>?', 'Warm salty water open to the air', ['Dry air in a sealed jar', 'Boiled water with oil on top', 'Cold tap water with no air'], 'Water, oxygen, salt and warmth all speed up rusting.']
]));
const TUBES = [['nail in dry air with a drying agent', 0, 'there is no water'], ['nail in boiled water with a layer of oil on top', 0, 'there is no oxygen'], ['nail in tap water open to the air', 2, ''], ['nail in salty water open to the air', 3, ''], ['painted nail in tap water', 0, 'the paint keeps water and air off'], ['nail half in tap water, half in air', 2, ''], ['nail in warm salty water open to the air', 4, ''], ['nail coated in oil, in tap water', 0, 'the oil keeps water and air off'], ['galvanised (zinc-coated) nail in salty water', 0, 'the zinc coating protects it']];
gen('corrNails', 'C8', 'Which nail rusts?', () => {
  const set = shuffle(TUBES).slice(0, 4); const letters = ['A', 'B', 'C', 'D'];
  const list = '<ul>' + set.map((t, i) => '<li><b>' + letters[i] + ':</b> ' + t[0] + '</li>').join('') + '</ul>';
  const most = set.reduce((m, t, i) => t[1] > set[m][1] ? i : m, 0); const zeros = set.map((t, i) => t[1] === 0 ? i : -1).filter(i => i >= 0);
  const sol = ['Rusting needs <b>oxygen and water</b>; salt and warmth speed it up. ' + set.map((t, i) => letters[i] + ': ' + (t[1] === 0 ? 'no rust (' + t[2] + ')' : t[1] >= 3 ? 'rusts a lot' : 'rusts')).join('. ') + '.'];
  if (Math.random() < 0.55 && set.filter(t => t[1] === set[most][1]).length === 1) return { type: 'mcq', q: 'Four test tubes each contain an iron nail:' + list + 'Which nail rusts the <b>most</b>?', choices: letters, ans: most, ansText: letters[most], sol, hint: 'Which one has oxygen, water and something that speeds rusting up?' };
  if (zeros.length === 1) return { type: 'mcq', q: 'Four test tubes each contain an iron nail:' + list + 'Which nail will <b>not</b> rust?', choices: letters, ans: zeros[0], ansText: letters[zeros[0]], sol, hint: 'Rusting needs both oxygen and water.' };
  const i = pick(set.map((t, i) => i)); const t = set[i];
  const one = ['Rusting needs <b>oxygen and water</b>; salt and warmth speed it up.', 'This nail ' + (t[1] === 0 ? '<b>does not rust</b>: ' + t[2] + '.' : t[1] >= 3 ? '<b>rusts quickly</b>: it has oxygen and water, plus salt or warmth to speed it up.' : '<b>rusts</b>: it has both oxygen and water.')];
  return mcqFrom('An iron nail is set up like this: <b>' + t[0] + '</b>. What happens?', t[1] === 0 ? 'It does not rust, because ' + t[2] : t[1] >= 3 ? 'It rusts quickly, because salt or warmth speeds up rusting' : 'It rusts, because it has both oxygen and water',
    ['It does not rust, because there is no salt', 'It rusts, because it has both oxygen and water', 'It rusts quickly, because salt or warmth speeds up rusting', 'It does not rust, because ' + (t[2] || 'there is no oxygen'), 'It rusts, because iron always rusts in a few days'].filter(s => s !== (t[1] === 0 ? 'It does not rust, because ' + t[2] : '')), one, 'Check: is there oxygen? Is there water? Anything that speeds it up or blocks it?');
});
const METAL_OX = [['iron', [['iron oxide', 'rust']], 'rusts (forms flaky orange-brown iron oxide)'], ['zinc', ['zinc oxide'], 'slowly forms a dull white layer'], ['copper', [['copper oxide', 'copper carbonate']], 'slowly turns dull brown, then green'], ['aluminium', ['aluminium oxide'], 'forms a thin protective oxide layer'], ['magnesium', ['magnesium oxide'], 'slowly goes dull and white'], ['silver', [['silver oxide', 'silver sulfide']], 'tarnishes and goes dark']];
gen('corrEq', 'C8', 'Corrosion word equations', () => {
  const r = Math.random();
  if (r < 0.3) return { type: 'eq', q: 'Rust is <b>hydrated iron oxide</b>. Write the word equation for iron rusting, including both of the substances it needs.', ans: { r: ['iron', 'oxygen', 'water'], p: [['hydrated iron oxide', 'rust', 'iron oxide']] }, ansText: 'iron + oxygen + water → hydrated iron oxide', hint: 'Rusting needs two things from the surroundings.', sol: ['<b>iron + oxygen + water → hydrated iron oxide (rust)</b>'] };
  const [m, prod, note] = pick(METAL_OX.slice(0, 5));
  return { type: 'eq', q: cap(m) + ' ' + note + ' when it reacts with <b>oxygen</b> in the air. Write the word equation for this reaction with oxygen.', ans: { r: [m, 'oxygen'], p: prod }, ansText: m + ' + oxygen → ' + first(prod[0]), hint: 'Metal + oxygen → metal oxide.', sol: ['<b>' + m + ' + oxygen → ' + first(prod[0]) + '</b>'] };
});

/* ---------- C9 mixed exam skills ---------- */
gen('verbs', 'C9', 'Cognitive verbs', () => {
  const [v, d] = pick(VERBS);
  if (Math.random() < 0.5) return mcqFrom('What does <b>“' + v + '”</b> ask you to do?', d, verbWrongs(v).map(w => VERBS.find(x => x[0] === w)[1]), '<b>' + v + '</b>: ' + d + '.', 'Several verbs sound similar. Which matches this one exactly?');
  return mcqFrom('Which verb means: <i>' + d + '</i>?', v, verbWrongs(v), '<b>' + v + '</b>: ' + d + '.');
});
const ELEMS = [['hydrogen', 'H', 1, 1], ['helium', 'He', 2, 4], ['lithium', 'Li', 3, 7], ['beryllium', 'Be', 4, 9], ['boron', 'B', 5, 11], ['carbon', 'C', 6, 12], ['nitrogen', 'N', 7, 14], ['oxygen', 'O', 8, 16], ['fluorine', 'F', 9, 19], ['neon', 'Ne', 10, 20],
  ['sodium', 'Na', 11, 23], ['magnesium', 'Mg', 12, 24], ['aluminium', 'Al', 13, 27], ['silicon', 'Si', 14, 28], ['phosphorus', 'P', 15, 31], ['sulfur', 'S', 16, 32], ['chlorine', 'Cl', 17, 35], ['argon', 'Ar', 18, 40], ['potassium', 'K', 19, 39], ['calcium', 'Ca', 20, 40],
  ['iron', 'Fe', 26, 56], ['copper', 'Cu', 29, 64], ['zinc', 'Zn', 30, 65], ['bromine', 'Br', 35, 80], ['silver', 'Ag', 47, 108], ['iodine', 'I', 53, 127], ['gold', 'Au', 79, 197], ['lead', 'Pb', 82, 207]];
gen('massNumber', 'C9', 'Mass number calculations', () => {
  const [name, sym, Z, A] = pick(ELEMS); const N = A - Z; const k = rnd(0, 4); const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  if (k === 0) return { type: 'num', q: 'An atom of ' + name + ' (' + sym + ') has atomic number <b>' + Z + '</b> and mass number <b>' + A + '</b>. How many <b>neutrons</b> does it have?', ans: N, ansText: String(N), hint: 'Neutrons = mass number − atomic number.', sol: ['N = A − Z = ' + A + ' − ' + Z + ' = <b>' + N + '</b>'] };
  if (k === 1) return { type: 'num', q: 'An atom has <b>' + pl(Z, 'proton') + '</b> and <b>' + pl(N, 'neutron') + '</b>. What is its mass number?', ans: A, ansText: String(A), hint: 'Mass number = protons + neutrons.', sol: ['A = Z + N = ' + Z + ' + ' + N + ' = <b>' + A + '</b> (this is ' + name + ', ' + sym + ')'] };
  if (k === 2) return { type: 'num', q: 'A neutral atom has a mass number of <b>' + A + '</b> and <b>' + N + ' neutrons</b>. How many <b>electrons</b> does it have?', ans: Z, ansText: String(Z), hint: 'Protons = A − N. In a neutral atom, electrons = protons.', sol: ['Protons = ' + A + ' − ' + N + ' = ' + Z + '.', 'Neutral atom, so electrons = protons = <b>' + Z + '</b> (' + name + ')'] };
  if (k === 3 && Z > 1) return mcqFrom('An atom of ' + name + ' has mass number <b>' + A + '</b> and atomic number <b>' + Z + '</b>. Which is correct?', pl(Z, 'proton') + ', ' + pl(N, 'neutron') + ', ' + pl(Z, 'electron'),
    [[Z, A, Z], [N, Z, N], [Z, N, N], [A, N, A], [Z, A + Z, Z], [Z, N, A], [A, Z, Z], [Z + 1, N - 1, Z + 1]].map(t => pl(t[0], 'proton') + ', ' + pl(t[1], 'neutron') + ', ' + pl(t[2], 'electron')),
    ['Protons = atomic number = ' + Z + '. Neutrons = ' + A + ' − ' + Z + ' = ' + N + '. Neutral atom, so electrons = protons = ' + Z + '.'], 'Which number tells you the protons? Then subtract for the neutrons.');
  return { type: 'num', q: 'A neutral atom of ' + name + ' has ' + pl(Z, 'proton') + ', ' + pl(N, 'neutron') + ' and ' + pl(Z, 'electron') + '. How many <b>subatomic particles</b> does it have altogether?', ans: 2 * Z + N, ansText: String(2 * Z + N), sol: [Z + ' + ' + N + ' + ' + Z + ' = <b>' + (2 * Z + N) + '</b>'] };
});
gen('evidenceVsOpinion', 'C9', 'Conclusions with evidence', () => {
  const nm = pick(NAMES), t0 = rnd(18, 24), dT = rnd(4, 16), exo = Math.random() < 0.5, t1 = exo ? t0 + dT : t0 - dT, label = exo ? 'exothermic' : 'endothermic';
  if (Math.random() < 0.5) return mcqFrom(nm + '’s reaction went from ' + t0 + ' °C to ' + t1 + ' °C. Which conclusion is <b>best supported by evidence</b>?', 'It was ' + label + ' because the temperature ' + (exo ? 'rose' : 'fell') + ' by ' + dT + ' °C.',
    ['It was ' + (exo ? 'endothermic' : 'exothermic') + ' because the temperature ' + (exo ? 'rose' : 'fell') + ' by ' + dT + ' °C.', 'It was ' + label + ' because most reactions are.', 'It was ' + label + ' because the beaker ' + (exo ? 'felt warm' : 'felt cold') + ' to ' + nm + '.', 'It was ' + label + ' because the temperature changed by ' + (t0 + t1) + ' °C.'],
    ['Use the measurement as evidence, and link it correctly: temperature up = exothermic; down = endothermic. ΔT = ' + t1 + ' − ' + t0 + ' = ' + (t1 > t0 ? '+' : '') + fmt(t1 - t0) + ' °C.'], 'Check the direction of the change and the size of ΔT.');
  const gas = pick(['carbon dioxide', 'hydrogen', 'oxygen']); const start = r2(rnd(800, 1500) / 10, 1), lost = r2(rnd(5, 35) / 10, 1);
  return mcqFrom('In an open beaker, the mass fell from ' + fmt(start) + ' g to ' + fmt(r2(start - lost, 1)) + ' g while ' + gas + ' gas bubbled off. Which explanation is <b>best</b>?', 'The ' + gas + ' produced escaped into the air, so ' + fmt(lost) + ' g less was left on the balance.',
    ['Mass was destroyed in the reaction, so ' + fmt(lost) + ' g disappeared.', 'The reaction released heat, and heat weighs ' + fmt(lost) + ' g.', 'The atoms got smaller during the reaction.', 'The ' + gas + ' escaped, so the total mass of everything really went down.'],
    ['Mass is conserved: the missing ' + fmt(lost) + ' g is the gas that escaped from the open beaker. In a sealed container the reading would not change.'], 'Was mass destroyed, or did it go somewhere?');
});

const TOPIC_GENS = {
  C1: ['chgClassify', 'chgPick', 'chgEvidence', 'chgEvidence', 'chgDefine'],
  C2: ['obsClassify', 'obsClassify', 'obsVsOpinion', 'obsVsOpinion', 'obsVerb'],
  C3: ['rpIdentify', 'rpIdentify', 'rpFacts', 'rpFacts'],
  C4: ['eqConstruct', 'eqConstruct', 'eqMissing', 'eqChoose', 'eqChoose'],
  C5: ['massClosed', 'massOpen', 'massLaw', 'atomCount', 'atomCount'],
  C6: ['tempClassify', 'deltaT', 'meanUnc', 'energyDiagram', 'energyDiagram', 'exoEndoFacts', 'exoEndoFacts'],
  C7: ['combEq', 'combFacts', 'combFacts', 'combTriangle'],
  C8: ['corrFacts', 'corrNails', 'corrNails', 'corrEq'],
  C9: ['verbs', 'verbs', 'massNumber', 'massNumber', 'evidenceVsOpinion']
};
/* ================= Science: difficulty of each question type, and long-response questions ================= */
const DIFF = {
  chgClassify: 'e', chgPick: 'e', chgEvidence: 'm', chgDefine: 'm',
  obsClassify: 'h', obsVsOpinion: 'm', obsVerb: 'm',
  rpIdentify: 'e', rpFacts: 'e',
  eqConstruct: 'h', eqMissing: 'm', eqChoose: 'm',
  massClosed: 'm', massOpen: 'm', massLaw: 'e', atomCount: 'm',
  tempClassify: 'e', deltaT: 'm', meanUnc: 'h', energyDiagram: 'm', exoEndoFacts: 'e',
  combEq: 'm', combFacts: 'e', combTriangle: 'e',
  corrFacts: 'e', corrNails: 'm', corrEq: 'm',
  verbs: 'e', massNumber: 'm', evidenceVsOpinion: 'h'
};
// Long response: q (question), model (model answer), points (marking checklist). Built from parts, so they vary.
const LONG = {};
function longGen(id, t, d, name, fn) { LONG[id] = { t, d, name, fn }; }

longGen('lChange', 'C1', 'h', 'Explain a change', () => {
  const [c, k] = pick(CHANGES); const chem = k === 'C';
  return { q: 'Explain whether <b>' + c + '</b> is a physical change or a chemical change. Justify your answer.',
    model: chem ? cap(c) + ' is a <b>chemical change</b> because a <b>new substance</b> is formed. You might see clues such as a colour change, gas, heat or light, a new smell, or a solid forming. The new substance can’t easily be turned back into what you started with, so the change is <b>irreversible</b>.'
      : cap(c) + ' is a <b>physical change</b> because <b>no new substance</b> is formed. Only the form, shape, size or state changes; it is still the same substance. It can usually be <b>reversed</b> (e.g. by cooling, heating or evaporating).',
    points: ['States the correct type: <b>' + (chem ? 'chemical' : 'physical') + '</b>', chem ? 'Says a new substance forms' : 'Says no new substance forms (still the same substance)', chem ? 'Gives a piece of evidence (e.g. colour change, gas, heat, light, smell)' : 'Says only the form, shape or state changes', chem ? 'Says it can’t easily be reversed' : 'Says it can usually be reversed'] };
});
longGen('lDistinguish', 'C1', 'm', 'Distinguish physical and chemical change', () => {
  const p = pick(CHANGES.filter(x => x[1] === 'P'))[0], c = pick(CHANGES.filter(x => x[1] === 'C'))[0];
  return { q: '<b>Distinguish</b> between a physical change and a chemical change. Give one example of each.',
    model: 'In a <b>physical change</b> no new substance is made; only the shape, size or state changes, and it can usually be reversed (e.g. ' + p + '). In a <b>chemical change</b> a new substance is made, and it usually can’t be reversed (e.g. ' + c + ').',
    points: ['Physical change: no new substance', 'Chemical change: a new substance forms', 'Mentions reversible vs irreversible', 'A correct example of a physical change', 'A correct example of a chemical change'] };
});
longGen('lObsJustify', 'C2', 'h', 'Analyse observations', () => {
  const s = pick(SCEN), chem = s.k === 'C';
  return { q: s.what + ' They observed that <b>' + s.obs + '</b>.<br><b>Analyse</b> the observations and <b>justify</b> whether a chemical change happened.',
    model: (chem ? 'A <b>chemical change</b> happened. ' : 'This was a <b>physical change</b>. ') + cap(s.ev) + '. ' + (chem ? 'These observations are evidence that a new substance formed.' : 'No new substance formed, so it can be reversed.'),
    points: ['Correctly classifies it as <b>' + (chem ? 'chemical' : 'physical') + '</b>', 'Uses a specific observation from this experiment as evidence', 'Uses a number or measurement if one was given (e.g. a temperature change)', chem ? 'Links the evidence to a new substance forming' : 'Links the evidence to no new substance forming'] };
});
longGen('lObsRecord', 'C2', 'm', 'Improve an observation', () => {
  const t0 = rnd(18, 24), dT = rnd(4, 15), secs = rnd(3, 12) * 10, nm = pick(NAMES);
  return { q: nm + ' wrote this observation: <i>“It got heaps hotter and was kind of bubbly.”</i> The temperature actually went from ' + t0 + ' °C to ' + (t0 + dT) + ' °C, and bubbles formed for ' + secs + ' seconds.<br>Rewrite it as an accurate scientific observation and explain why yours is better.',
    model: '“The temperature rose from ' + t0 + ' °C to ' + (t0 + dT) + ' °C (an increase of ' + dT + ' °C) and bubbles of gas were produced for ' + secs + ' seconds.” This is better because it uses <b>measurements with units</b> and describes exactly what was seen, instead of vague words like “heaps” or opinions.',
    points: ['Includes the temperature measurements with °C', 'Includes the time (' + secs + ' s) or the temperature change (' + dT + ' °C)', 'Describes the bubbles/gas clearly', 'Explains that numbers and units make it accurate and objective (not vague)'] };
});
longGen('lReactProd', 'C3', 'm', 'Reactants and products', () => {
  const x = pick(RX);
  return { q: x.d + '<br><b>Identify</b> the reactants and the products, and explain how you decided.',
    model: 'Reactants: <b>' + x.r.map(first).join(', ') + '</b>. Products: <b>' + x.p.map(first).join(', ') + '</b>. Reactants are the substances you start with, which get used up; products are the new substances made in the reaction.',
    points: ['Lists the reactants: ' + x.r.map(first).join(', '), 'Lists the products: ' + x.p.map(first).join(', '), 'Explains that reactants are the starting substances (used up)', 'Explains that products are the new substances made'] };
});
longGen('lWordEq', 'C4', 'h', 'Word equation and meaning', () => {
  const x = pick(RX.filter(y => y.r.length + y.p.length >= 3));
  return { q: x.d + '<br>Write the <b>word equation</b>, then explain what the arrow (→) and the plus signs (+) mean.',
    model: '<b>' + eqText(x.r, x.p) + '</b>. The arrow means “reacts to form”: reactants are on the left and products on the right. The plus signs separate the different substances on each side.',
    points: ['Reactants on the left: ' + x.r.map(first).join(' + '), 'Products on the right: ' + x.p.map(first).join(' + '), 'Explains the arrow means “reacts to form” / produces', 'Explains + separates the substances'] };
});
longGen('lMassClaim', 'C5', 'h', 'Evaluate a claim about mass', () => {
  const start = r2(rnd(800, 1600) / 10, 1), lost = r2(rnd(5, 40) / 10, 1), gas = pick(['carbon dioxide', 'hydrogen']), what = gas === 'hydrogen' ? 'magnesium and hydrochloric acid' : 'marble chips and hydrochloric acid', nm = pick(NAMES);
  return { q: 'In an open beaker, ' + what + ' reacted and the mass fell from ' + fmt(start) + ' g to ' + fmt(r2(start - lost, 1)) + ' g. ' + nm + ' says: <i>“This proves mass was destroyed.”</i><br><b>Evaluate</b> this claim.',
    model: 'The claim is <b>wrong</b>. Mass is never created or destroyed in a chemical reaction (law of conservation of mass). The ' + fmt(lost) + ' g that seemed to disappear is the <b>' + gas + ' gas</b> that was produced and escaped from the <b>open</b> beaker. In a <b>sealed (closed)</b> container the mass would stay at ' + fmt(start) + ' g.',
    points: ['Says the claim is incorrect', 'States the law of conservation of mass', 'Explains a gas (' + gas + ') escaped because the beaker was open', 'Uses the numbers: ' + fmt(lost) + ' g lost', 'Says a closed/sealed container would show no change'] };
});
longGen('lMassAtoms', 'C5', 'm', 'Conservation of mass with atoms', () => {
  const [eq, counts] = pick(FORMULA_EQ); const el = pick(Object.keys(counts));
  return { q: 'Use the balanced equation <b>' + eq + '</b> to explain why mass is conserved in a chemical reaction.',
    model: 'Atoms are not created or destroyed in a chemical reaction; they are only <b>rearranged</b> into new substances. In this equation there are ' + counts[el][0] + ' ' + el + ' atoms on each side (and the same is true for every element), so the total mass of the products equals the total mass of the reactants.',
    points: ['States mass is conserved (not created or destroyed)', 'Says atoms are rearranged, not created or destroyed', 'Uses the equation: the same number of each type of atom on both sides (e.g. ' + counts[el][0] + ' ' + el + ')', 'Concludes total mass of reactants = total mass of products'] };
});
longGen('lExoEndo', 'C6', 'h', 'Classify and explain energy change', () => {
  const t0 = rnd(17, 25), dT = rnd(3, 16), exo = Math.random() < 0.5, t1 = exo ? t0 + dT : t0 - dT, what = pick(['two solutions were mixed', 'a powder was added to water', 'a metal was added to an acid', 'citric acid was mixed with baking soda solution']);
  return { q: 'When ' + what + ', the temperature went from ' + t0 + ' °C to ' + t1 + ' °C. <b>Classify</b> the reaction and <b>explain</b> the energy transfer.',
    model: 'ΔT = ' + t1 + ' − ' + t0 + ' = ' + (exo ? '+' : '') + fmt(t1 - t0) + ' °C. The temperature ' + (exo ? 'rose' : 'fell') + ', so the reaction is <b>' + (exo ? 'exothermic' : 'endothermic') + '</b>: energy was ' + (exo ? 'released to' : 'absorbed from') + ' the surroundings, making them ' + (exo ? 'hotter' : 'colder') + '. The products have ' + (exo ? 'less' : 'more') + ' energy than the reactants.',
    points: ['Classifies it as <b>' + (exo ? 'exothermic' : 'endothermic') + '</b>', 'Calculates the change: ' + (exo ? '+' : '') + fmt(t1 - t0) + ' °C', 'Says energy was ' + (exo ? 'released to' : 'absorbed from') + ' the surroundings', 'Says the products have ' + (exo ? 'less' : 'more') + ' energy than the reactants'] };
});
longGen('lFire', 'C7', 'm', 'Use the fire triangle', () => {
  const [part, act] = pick(FIRE);
  return { q: '<b>' + act + '</b> puts the fire out. Use the fire triangle to explain why.', fig: fireTriangleSVG(),
    model: 'Combustion needs all three parts of the fire triangle: <b>fuel, oxygen and heat</b>. ' + act + ' removes the <b>' + part + '</b>, so the fire triangle is broken and the combustion reaction stops.',
    points: ['Names the three parts: fuel, oxygen, heat', 'Identifies that it removes the <b>' + part + '</b>', 'Explains combustion stops when one part is removed'] };
});
longGen('lCombust', 'C7', 'h', 'Describe combustion', () => {
  const [name, alts] = pick(FUELS);
  return { q: 'Describe what happens when <b>' + name + '</b> burns completely in plenty of oxygen. Include the word equation and explain why it is exothermic.',
    model: 'The ' + name + ' reacts with oxygen (combustion) to make carbon dioxide and water: <b>' + alts[0] + ' + oxygen → carbon dioxide + water</b>. It is <b>exothermic</b> because it releases energy to the surroundings as heat and light.',
    points: ['Says the fuel reacts with oxygen', 'Correct word equation: ' + alts[0] + ' + oxygen → carbon dioxide + water', 'Says it is exothermic', 'Explains energy is released as heat and light'] };
});
longGen('lRustPredict', 'C8', 'h', 'Predict and explain rusting', () => {
  let set, rates; do { set = shuffle(TUBES).slice(0, 3); rates = set.map(x => x[1]); } while (new Set(rates).size < 3 || Math.min(...rates) !== 0);
  const L = ['A', 'B', 'C']; const most = rates.indexOf(Math.max(...rates)), none = rates.indexOf(0);
  return { q: 'Three iron nails are set up:<ul>' + set.map((t, i) => '<li><b>' + L[i] + ':</b> ' + t[0] + '</li>').join('') + '</ul><b>Predict</b> which nail rusts most and which does not rust. <b>Explain</b> your predictions.',
    model: 'Rusting needs <b>oxygen and water</b>. Nail <b>' + L[most] + '</b> rusts most because it has oxygen and water' + (set[most][1] >= 3 ? ', and salt/warmth speeds rusting up' : '') + '. Nail <b>' + L[none] + '</b> does not rust because ' + set[none][2] + '.',
    points: ['Says rusting needs both oxygen and water', 'Predicts ' + L[most] + ' rusts most, with a reason', 'Predicts ' + L[none] + ' does not rust', 'Explains why ' + L[none] + ' doesn’t rust (' + set[none][2] + ')'] };
});
longGen('lRustPrevent', 'C8', 'm', 'Prevent rusting', () => {
  const thing = pick(['a steel bike chain', 'an iron garden gate', 'a car body', 'steel nails in a deck', 'a ship’s hull', 'an iron barbecue grill', 'a steel bridge', 'a metal letterbox near the beach']);
  return { q: 'Suggest <b>two</b> ways to stop <b>' + thing + '</b> from rusting, and explain how each one works.',
    model: 'Rusting needs oxygen and water. You could <b>paint it</b> (or oil/grease it, or coat it in plastic), which forms a barrier keeping oxygen and water off the iron. You could <b>galvanise</b> it (coat it in zinc), which keeps air and water out and corrodes instead of the iron. Keeping it dry also helps.',
    points: ['A correct first method (e.g. paint, oil, grease, plastic coating, galvanising)', 'A correct second, different method', 'Explains the method stops oxygen and/or water reaching the iron', 'States rusting needs oxygen and water'] };
});
longGen('lAtom', 'C9', 'm', 'Explain an atom’s particles', () => {
  const [name, sym, Z, A] = pick(ELEMS); const N = A - Z;
  return { q: 'An atom of ' + name + ' (' + sym + ') has atomic number ' + Z + ' and mass number ' + A + '. Find the number of protons, neutrons and electrons, and explain how you worked each one out.',
    model: 'Protons = atomic number = <b>' + Z + '</b>. Neutrons = mass number − atomic number = ' + A + ' − ' + Z + ' = <b>' + N + '</b>. Electrons = protons = <b>' + Z + '</b>, because the atom is neutral.',
    points: ['Protons = ' + Z + ' (from the atomic number)', 'Neutrons = ' + A + ' − ' + Z + ' = ' + N, 'Electrons = ' + Z, 'Explains electrons = protons because the atom is neutral'] };
});
longGen('lEvidence', 'C9', 'h', 'Write a justified conclusion', () => {
  const nm = pick(NAMES), t0 = rnd(18, 24), dT = rnd(4, 16), exo = Math.random() < 0.5, t1 = exo ? t0 + dT : t0 - dT; const trials = [0, 0, 0].map(() => r2(t1 + rnd(-6, 6) / 10, 1)); const sum = r2(trials[0] + trials[1] + trials[2], 1), mean = r2(sum / 3, 1), chg = r2(mean - t0, 1);
  return { q: nm + ' repeated a reaction three times. The starting temperature was ' + t0 + ' °C each time and the final temperatures were ' + trials.map(v => v.toFixed(1)).join(' °C, ') + ' °C. Write a conclusion that is <b>justified with evidence</b>.',
    model: 'Mean final temperature = (' + trials.map(v => v.toFixed(1)).join(' + ') + ') ÷ 3 = ' + sum.toFixed(1) + ' ÷ 3 = ' + mean.toFixed(1) + ' °C (to 1 decimal place). Temperature change = ' + mean.toFixed(1) + ' − ' + t0 + ' = ' + (chg > 0 ? '+' : '−') + Math.abs(chg).toFixed(1) + ' °C. Because the temperature ' + (exo ? 'rose' : 'fell') + ', the reaction is <b>' + (exo ? 'exothermic' : 'endothermic') + '</b>. The three results are close together, so they are reliable.',
    points: ['Calculates or uses the mean final temperature', 'States the temperature change', 'Concludes ' + (exo ? 'exothermic' : 'endothermic') + ' and links it to the rise/fall', 'Comments that the repeated results are close (reliable/consistent)'] };
});
const LONG_GENS = {};
Object.keys(LONG).forEach(id => { (LONG_GENS[LONG[id].t] = LONG_GENS[LONG[id].t] || []).push(id); });
/* ================= science topics (Exam Checklist 2: Chemical changes and reactions) ================= */
const UNITS = [
  { id: 'chg', name: 'Physical and chemical change', ch: 'Checklist 1–2' },
  { id: 'rx', name: 'Reactions and word equations', ch: 'Checklist 3–5' },
  { id: 'types', name: 'Energy, combustion and corrosion', ch: 'Checklist 6–8' },
  { id: 'skills', name: 'Exam skills', ch: 'Checklist 9' }
];
const eqbox = s => '<div class="eqbox">' + s + '</div>';
const TOPICS = [
  { id: 'C1', unit: 'chg', name: 'Physical and chemical changes', bk: ['E1', 'E2', 'P1'],
    cans: ['Identify evidence that indicates a physical or chemical change', 'Identify evidence such as gas production, colour change, precipitate formation, temperature change or new smell', 'Distinguish between a physical and chemical change', 'Explain that a physical change does not produce a new substance', 'Explain that a chemical change produces one or more new substances'],
    notes: () => `
<table><tr><th></th><th>Physical change</th><th>Chemical change</th></tr>
<tr><td><b>New substance?</b></td><td>No. Same substance, new shape, size or state</td><td><b>Yes</b>, one or more new substances</td></tr>
<tr><td><b>Reversible?</b></td><td>Usually easy to reverse</td><td>Usually can’t be reversed</td></tr>
<tr><td><b>Examples</b></td><td>melting, freezing, boiling, dissolving, cutting, bending</td><td>burning, rusting, cooking, rotting, fizzing tablets</td></tr></table>
<h4>Evidence of a chemical change</h4>
<ul><li><b>Gas produced</b>: bubbles or fizzing</li><li><b>Colour change</b></li><li><b>Precipitate</b>: a solid forms when two liquids are mixed</li><li><b>Temperature change</b>: gets hotter or colder</li><li><b>New smell</b></li><li><b>Light or flame</b> given off</li><li>A reactant ‘disappears’, or you can’t get the starting substances back</li></ul>
<div class="rule-box">The only way to be <b>certain</b> it is a chemical change is that a <b>new substance</b> has formed. Bubbles alone don’t prove it: boiling water bubbles too, and that is physical.</div>`,
    ex: [{ q: 'Is frying an egg a physical or chemical change? Explain.', s: ['Chemical. The egg white changes from clear to white and becomes solid, and you can’t turn it back. A new substance has formed.'] }, { q: 'Is dissolving sugar in tea a physical or chemical change?', s: ['Physical. The sugar is still sugar (the tea tastes sweet), and evaporating the water would get the sugar back. No new substance forms.'] }],
    mistakes: ['Calling every change with bubbles “chemical”: boiling is physical.', 'Saying dissolving is chemical: it is physical, because the substance is still there.', 'Forgetting to say “a new substance forms” when explaining a chemical change.'] },
  { id: 'C2', unit: 'chg', name: 'Observing, analysing and justifying', bk: ['E2'], tool: 'graph',
    cans: ['Observe and accurately record evidence from an experiment', 'Identify relevant observations rather than simply describing what happened', 'Analyse observations to determine whether a physical or chemical change occurred', 'Justify a conclusion using specific scientific evidence', 'Use evidence such as gas production, temperature change, colour change or precipitate formation to support a conclusion'],
    notes: () => `
<ul><li><b>Observation</b>: something you see, hear, smell, feel or measure. “The solution turned blue.” “The temperature rose to 29 °C.”</li><li><b>Inference / conclusion</b>: what you decide from the observations. “A new substance formed.”</li><li><b>Opinion</b>: not evidence. “It was cool.” “I think it worked.”</li></ul>
<h4>Record accurately</h4><p>Use numbers and units: “The temperature rose from 21.0 °C to 35.2 °C in 90 s”, not “it got hot”.</p>
<h4>Relevant observations</h4><p>Only record what helps answer the question: gas, colour, precipitate, temperature, smell. The size of the beaker or the colour of the spatula don’t matter.</p>
<div class="rule-box"><b>How to justify:</b> say what type of change it is, give the specific evidence (with numbers), then link it back: “… which shows a new substance formed.”</div>
<p class="eqbox" style="text-align:left">Chemical change: bubbles of gas were produced and the temperature rose from 21 °C to 29 °C, which shows a new substance (hydrogen gas) formed.</p>`,
    ex: [{ q: 'Two clear liquids are mixed and a yellow solid appears. Classify the change and justify it.', s: ['Chemical change.', 'Evidence: a yellow precipitate (a new solid) formed when two clear solutions were mixed.', 'A precipitate is a new substance, so it is a chemical change.'] }],
    mistakes: ['Describing everything that happened instead of picking the relevant evidence.', 'Giving a conclusion with no evidence: “It’s chemical because it reacted.”', 'Leaving out numbers and units.'] },
  { id: 'C3', unit: 'rx', name: 'Reactants and products', bk: ['R2', 'R3', 'R6'],
    cans: ['Define a reactant', 'Define a product', 'Identify the reactants in a chemical reaction', 'Identify the products in a chemical reaction', 'Recognise that reactants are shown before the arrow in a word equation', 'Recognise that products are shown after the arrow in a word equation'],
    notes: () => `
<ul><li><b>Reactants</b>: the substances you <b>start</b> with. They get used up.</li><li><b>Products</b>: the <b>new</b> substances that are made.</li></ul>
${eqbox('<b>reactants</b> → <b>products</b>')}
<p>The arrow means “react to form”. Reactants go <b>before</b> the arrow (left). Products go <b>after</b> the arrow (right).</p>
${eqbox('magnesium + hydrochloric acid → magnesium chloride + hydrogen')}
<p>Reactants: magnesium, hydrochloric acid. Products: magnesium chloride, hydrogen.</p>`,
    ex: [{ q: 'In “copper carbonate → copper oxide + carbon dioxide”, name the reactant(s) and product(s).', s: ['Reactant: copper carbonate (before the arrow).', 'Products: copper oxide and carbon dioxide (after the arrow).'] }],
    mistakes: ['Swapping reactants and products.', 'Thinking the arrow means “equals”.'] },
  { id: 'C4', unit: 'rx', name: 'Word equations', bk: ['R3', 'T1', 'T4'],
    cans: ['Represent a chemical reaction using a word equation', 'Write the reactants on the left side of the arrow', 'Write the products on the right side of the arrow', 'Complete missing reactants or products in a word equation', 'Construct word equations from a written description of a reaction'],
    notes: () => `
<h4>How to write a word equation from a description</h4>
<ol style="margin:0;padding-left:1.3em"><li>Underline what you <b>start with</b> (reactants).</li><li>Circle what is <b>made</b> (products).</li><li>Write: reactants → products, with <b>+</b> between each substance.</li><li>Leave out the extra words like “solid”, “solution” or “gas”.</li></ol>
<p><i>Zinc metal is added to hydrochloric acid. Bubbles of hydrogen gas are produced, and zinc chloride remains in the solution.</i></p>
${eqbox('zinc + hydrochloric acid → zinc chloride + hydrogen')}
<h4>Handy patterns</h4>
<table><tr><th>Type</th><th>Pattern</th></tr><tr><td>Combustion</td><td>fuel + oxygen → carbon dioxide + water</td></tr><tr><td>Metal + oxygen</td><td>metal + oxygen → metal oxide</td></tr><tr><td>Metal + acid</td><td>metal + acid → salt + hydrogen</td></tr><tr><td>Rusting</td><td>iron + oxygen → iron oxide</td></tr></table>`,
    ex: [{ q: 'Heating copper carbonate forms copper oxide and carbon dioxide. Write the word equation.', s: ['Start with: copper carbonate. Made: copper oxide, carbon dioxide.', 'copper carbonate → copper oxide + carbon dioxide'] }, { q: 'Complete: magnesium + oxygen → ________', s: ['A metal reacting with oxygen makes the metal oxide: <b>magnesium oxide</b>.'] }],
    mistakes: ['Using “=” or “and” instead of the arrow.', 'Putting a product on the left.', 'Forgetting oxygen in combustion.'] },
  { id: 'C5', unit: 'rx', name: 'Conservation of mass', bk: ['R5', 'R6'],
    cans: ['State the law of conservation of mass', 'Explain that atoms are rearranged during a chemical reaction', 'Explain that atoms are not created or destroyed during a chemical reaction', 'Explain why the total mass of reactants equals the total mass of products in a closed system', 'Use mass data to determine a missing mass', 'Explain why mass can appear to decrease in an open system when a gas escapes', 'Describe how to experimentally demonstrate conservation of mass'],
    notes: () => `
<div class="rule-box"><b>Law of conservation of mass:</b> mass cannot be created or destroyed in a chemical reaction. Total mass of reactants = total mass of products.</div>
<ul><li>In a reaction, <b>atoms are rearranged</b>: bonds break and new bonds form. No atoms are made or lost, so the mass stays the same.</li><li><b>Closed system</b> (sealed): nothing gets in or out, so the mass before = the mass after.</li><li><b>Open system</b>: if a <b>gas</b> is produced it escapes into the air, so the mass on the scale <b>seems</b> to go down. The mass isn’t destroyed; it just left.</li></ul>
<h4>Finding a missing mass</h4>
${eqbox('magnesium (2.4 g) + oxygen (? g) → magnesium oxide (4.0 g)')}
<p>Reactants = products, so oxygen = 4.0 − 2.4 = <b>1.6 g</b>.</p>
<h4>Demonstrating it</h4><p>Put the reactants in a flask, seal it (a stopper or a balloon over the top), weigh it, let them react, then weigh it again. The mass stays the same.</p>
<p>Counting atoms: in 2H₂ + O₂ → 2H₂O there are 4 H and 2 O atoms on <b>both</b> sides.</p>`,
    ex: [{ q: 'Marble chips and acid in an open beaker: 125.0 g at the start, 122.8 g at the end. Explain.', s: ['Carbon dioxide gas was produced and escaped into the air.', 'Mass of gas = 125.0 − 122.8 = 2.2 g.', 'Mass was not destroyed; in a sealed container the reading would stay at 125.0 g.'] }],
    mistakes: ['Saying mass is lost or destroyed.', 'Forgetting to say the system must be closed (sealed).'] },
  { id: 'C6', unit: 'types', name: 'Exothermic and endothermic reactions', bk: ['N1', 'N2', 'N3'], tool: 'graph',
    cans: ['Define an exothermic reaction', 'Define an endothermic reaction', 'Explain that exothermic reactions release energy to the surroundings', 'Explain that endothermic reactions absorb energy from the surroundings', 'Classify a reaction as exothermic when experimental temperature increases', 'Classify a reaction as endothermic when experimental temperature decreases', 'Use temperature data as evidence to classify a reaction'],
    notes: () => `
<table><tr><th></th><th>Exothermic</th><th>Endothermic</th></tr><tr><td>Energy</td><td><b>Released</b> to the surroundings (“exo” = exit)</td><td><b>Absorbed</b> from the surroundings (“endo” = enter)</td></tr><tr><td>Temperature of surroundings</td><td><b>Rises</b> (feels hot)</td><td><b>Falls</b> (feels cold)</td></tr><tr><td>Energy diagram</td><td>Products lower than reactants</td><td>Products higher than reactants</td></tr><tr><td>Examples</td><td>combustion, respiration, hand warmers, calcium chloride dissolving</td><td>photosynthesis, cold packs, ammonium nitrate dissolving, cooking an egg</td></tr></table>
<div class="grid2"><div class="qfig">${energySVG('exo')}</div><div class="qfig">${energySVG('endo')}</div></div>
<h4>Using data</h4><p>ΔT = final − starting temperature. A positive ΔT means exothermic; a negative ΔT means endothermic.</p>
<p>Mean of trials = add them ÷ number of trials. Uncertainty = (highest − lowest) ÷ 2.</p>`,
    ex: [{ q: 'Calcium chloride in water: 21.0 °C → 36.1 °C. Classify and justify.', s: ['ΔT = 36.1 − 21.0 = +15.1 °C.', 'The temperature increased, so energy was released to the surroundings: <b>exothermic</b>.'] }],
    mistakes: ['Mixing up the words: exo = energy exits.', 'Saying an endothermic reaction “releases cold”: it absorbs heat.'] },
  { id: 'C7', unit: 'types', name: 'Combustion', bk: ['T3', 'T4'],
    cans: ['Define combustion', 'Identify oxygen as a requirement for combustion', 'Identify a fuel as a requirement for combustion', 'Explain the role of ignition energy/temperature in starting combustion', 'Construct a word equation for a combustion reaction', 'Recognise that combustion commonly releases energy'],
    notes: () => `
<p><b>Combustion</b> is a chemical reaction where a substance (a fuel) reacts with <b>oxygen</b> and releases energy, usually as <b>heat and light</b>. It is exothermic.</p>
<div class="qfig">${fireTriangleSVG()}</div>
<ul><li><b>Fuel</b>: the substance that burns (wood, gas, wax, petrol).</li><li><b>Oxygen</b>: from the air.</li><li><b>Heat (ignition energy)</b>: needed to <b>start</b> it (a match or spark). Once burning, the heat it releases keeps it going.</li><li>Take away any one of the three and the fire goes out.</li></ul>
${eqbox('fuel + oxygen → carbon dioxide + water')}
${eqbox('methane + oxygen → carbon dioxide + water')}
<p>With not enough oxygen (incomplete combustion, e.g. the yellow part of a candle flame), carbon monoxide and soot (carbon) also form.</p>`,
    ex: [{ q: 'Write the word equation for wax burning in the blue zone of a candle flame.', s: ['wax + oxygen → carbon dioxide + water'] }],
    mistakes: ['Forgetting oxygen as a reactant.', 'Forgetting that ignition energy is needed to start it.'] },
  { id: 'C8', unit: 'types', name: 'Corrosion', bk: ['T1', 'T2'],
    cans: ['Define corrosion', 'Explain that corrosion is a chemical change', 'Identify rusting of iron as an example of corrosion', 'Identify oxygen and environmental moisture as conditions that encourage iron corrosion', 'Construct a word equation representing iron reacting with oxygen to form iron oxide'],
    notes: () => `
<p><b>Corrosion</b> is a chemical reaction where substances around a metal (like oxygen and water) react with it and slowly eat it away.</p>
<p><b>Rusting</b> is the corrosion of iron. It is a <b>chemical change</b> because a new substance, iron oxide (rust), forms.</p>
${eqbox('iron + oxygen → iron oxide')}
<ul><li>Iron needs <b>oxygen</b> and <b>water (moisture)</b> to rust.</li><li><b>Salt</b> and warmth make it rust faster (cars near the beach rust quickly).</li><li><b>Prevent it</b> by keeping oxygen and water away: paint, oil or grease, plastic coating, or galvanising (a zinc coating).</li></ul>`,
    ex: [{ q: 'Why doesn’t a nail in boiled water with oil on top rust?', s: ['Boiling removes the dissolved oxygen, and the oil stops more oxygen getting in. Without oxygen, iron can’t rust.'] }],
    mistakes: ['Saying rust is a physical change.', 'Forgetting water is needed too.'] },
  { id: 'C9', unit: 'skills', name: 'Mixed exam skills', bk: ['M1', 'M2', 'M3'],
    cans: ['Use the cognitive verbs identify, distinguish, observe, record, analyse, justify, construct, demonstrate, classify and define correctly', 'Use observations as scientific evidence rather than unsupported opinions', 'Explain your reasoning when asked to justify an answer', 'Complete calculations involving mass number, particle numbers and conservation of mass', 'Construct and interpret word equations accurately'],
    notes: () => `
<h4>Cognitive verbs: what the question wants</h4>
<table><tr><th>Verb</th><th>What to do</th></tr>${VERBS.map(v => '<tr><td><b>' + v[0] + '</b></td><td>' + v[1] + '</td></tr>').join('')}</table>
<h4>Mass number calculations</h4>
<div class="rule-box">Mass number (A) = protons (Z) + neutrons (N)<br>Neutrons = A − Z<br>In a neutral atom: electrons = protons = atomic number</div>
<p>Sodium: Z = 11, A = 23 → 11 protons, 11 electrons, 23 − 11 = 12 neutrons.</p>`,
    ex: [{ q: 'An atom has a mass number of 35 and 17 protons. How many neutrons?', s: ['N = A − Z = 35 − 17 = <b>18</b> (it is chlorine).'] }],
    mistakes: ['Adding instead of subtracting for neutrons.', 'Answering “describe” questions without the reason when they asked you to “explain”.'] }
];
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));

const QUICK = {
  C1: { what: 'A chemical change makes a new substance. A physical change doesn’t.', steps: ['Ask: is there a <b>new substance</b>?', 'Look for evidence: <b>gas, colour change, precipitate, temperature change, new smell, light</b>.', 'Melting, freezing, dissolving, cutting and bending are <b>physical</b>.', 'Burning, rusting, cooking and rotting are <b>chemical</b>.'], eg: 'Burning wood → ash and smoke (new substances) → chemical.' },
  C2: { what: 'Use what you saw and measured as evidence for your answer.', steps: ['Write down what you see, hear, smell or measure, <b>with numbers and units</b>.', 'Pick only the observations that help answer the question.', 'Decide: physical or chemical?', 'Justify: type of change + evidence + “which shows a new substance formed”.'], eg: 'Chemical: bubbles formed and the temperature rose from 21 °C to 29 °C, which shows a new substance formed.' },
  C3: { what: 'Reactants are what you start with. Products are what you make.', steps: ['Reactants go <b>before</b> the arrow.', 'Products go <b>after</b> the arrow.', 'The arrow means “react to form”.'], eg: 'magnesium + oxygen → magnesium oxide: reactants magnesium and oxygen; product magnesium oxide.' },
  C4: { what: 'A word equation shows a reaction in words.', steps: ['Find what you <b>start with</b> (reactants).', 'Find what is <b>made</b> (products).', 'Write: reactants <b>→</b> products.', 'Put <b>+</b> between substances on the same side.'], eg: 'zinc + hydrochloric acid → zinc chloride + hydrogen' },
  C5: { what: 'Mass is never created or destroyed in a reaction.', steps: ['Atoms are just <b>rearranged</b>.', 'Closed (sealed) system: mass before = mass after.', 'Missing mass: total reactants − the products you know.', 'Open system: a gas escapes, so the mass <b>looks</b> lower.'], eg: '2.4 g magnesium + ? g oxygen → 4.0 g magnesium oxide → oxygen = 1.6 g' },
  C6: { what: 'Exothermic gives out heat. Endothermic takes in heat.', steps: ['<b>Temperature goes up</b> → exothermic (energy released).', '<b>Temperature goes down</b> → endothermic (energy absorbed).', 'ΔT = final − start.', 'Use the numbers as your evidence.'], eg: '21 °C → 36 °C, so ΔT = +15 °C: exothermic.' },
  C7: { what: 'Combustion is burning: a fuel reacts with oxygen and releases heat and light.', steps: ['You need <b>fuel + oxygen + heat</b> (the fire triangle).', 'The heat (ignition energy) starts it.', 'Equation: <b>fuel + oxygen → carbon dioxide + water</b>.', 'It releases energy, so it is exothermic.'], eg: 'methane + oxygen → carbon dioxide + water' },
  C8: { what: 'Corrosion is a metal being slowly eaten away by a chemical reaction.', steps: ['Rusting is corrosion of iron.', 'Iron needs <b>oxygen and water</b> to rust. Salt speeds it up.', 'It is <b>chemical</b>: a new substance (iron oxide) forms.', 'Equation: <b>iron + oxygen → iron oxide</b>.'], eg: 'A bike left out in the rain gets orange rust: iron + oxygen → iron oxide.' },
  C9: { what: 'Know what each question word wants, and how to do mass number sums.', steps: ['<b>Identify</b> = name it. <b>Define</b> = exact meaning.', '<b>Explain</b> = how or why. <b>Justify</b> = back it up with evidence.', 'Mass number = protons + neutrons.', 'Neutrons = mass number − atomic number.'], eg: 'Mass number 23, atomic number 11 → 12 neutrons.' }
};

/* ================= checklist (Exam Checklist 2) ================= */
const CHECKLIST = TOPICS.map((t, i) => [(i + 1) + '. ' + t.name, t.cans.map(c => [c, t.bk.join(', '), t.id])]);

/* ================= booklet questions (Year 8 Chemistry theory workbook, Part 2, plus mass number) ================= */
const BK_PARTS = { P: 'Properties: Physical and chemical properties', E: 'Evidence: Physical and chemical change', R: 'Reactions: Chemical reactions', N: 'Energy: Energy change in reactions', T: 'Types: Combustion and corrosion', M: 'Mass number: Calculations' };
const chg = (l, item, k) => ({ l, q: item, a: k === 'C' ? 'Chemical change' : 'Physical change', ch: ['Physical', 'Chemical'], ci: k === 'C' ? 1 : 0 });
const BOOKLET = [
  { id: 'P1', part: 'P', text: 'Fill in the gaps: All objects are made up of ____. Matter cannot be ____ nor ____. Matter has both ____ and ____ properties.', parts: [{ l: '', q: 'Type the five missing words in order, separated by commas.', a: 'matter, created, destroyed, physical, chemical', ss: ['matter', 'created', 'destroyed', 'physical', 'chemical'] }] },
  { id: 'P2', part: 'P', text: 'Physical and chemical properties.', parts: [
    { l: 'a', q: 'Physical properties are…', a: 'Properties you can observe or measure without changing the substance into a new substance, e.g. colour, hardness, melting point, density, transparency, conductivity.' },
    { l: 'b', q: 'Chemical properties are…', a: 'Properties that describe how a substance reacts to form new substances, e.g. flammability, reactivity with acid or oxygen, ability to rust.' }] },
  { id: 'P3', part: 'P', text: 'For each material, state what it could be used to make and the property that makes it useful. (Glass → windows → transparency is done for you.)', parts: [
    { l: 'a', q: 'Styrofoam', a: 'Cups or food boxes: a good heat insulator, and light.' }, { l: 'b', q: 'steel', a: 'Bridges or building frames: strong and hard.' }, { l: 'c', q: 'gold', a: 'Jewellery: shiny and doesn’t corrode (also used in electronics because it conducts electricity).' },
    { l: 'd', q: 'aluminium', a: 'Drink cans or foil: light, malleable and doesn’t rust.' }, { l: 'e', q: 'foam rubber', a: 'Mattresses or cushions: soft and squashes then springs back.' }, { l: 'f', q: 'sugar', a: 'Sweetening food: sweet and dissolves in water.' },
    { l: 'g', q: 'wood', a: 'Furniture: strong, light and easy to cut and shape.' }, { l: 'h', q: 'plastic', a: 'Water bottles: waterproof, light and can be moulded into shapes.' }, { l: 'i', q: 'elastic', a: 'Waistbands: stretchy (elastic) and returns to its shape.' }] },
  { id: 'P4', part: 'P', text: 'Give reasons why you wouldn’t use:', parts: [
    { l: 'a', q: 'plastic to make a frying pan', a: 'Plastic melts (low melting point) and is a heat insulator, so it wouldn’t cook food and could melt.' },
    { l: 'b', q: 'wood to make pillows', a: 'Wood is hard and rigid, not soft, so it would be uncomfortable.' },
    { l: 'c', q: 'rubber to make a bridge', a: 'Rubber is too flexible and stretchy and not strong or rigid enough to hold heavy loads.' }] },
  { id: 'E1', part: 'E', text: 'Evidence for chemical change.', parts: [
    { l: 'a', q: 'List the clues that a chemical change has taken place.', a: 'A precipitate forms, an odour (smell), bubbles appear, the temperature goes up or down, light or a flame is given off, a change in colour, a reactant disappears, and you can’t reverse it.' },
    { l: 'b', q: 'What is the only way to be certain a chemical reaction has taken place?', a: 'Identify that a new substance (product) has been formed.' }] },
  { id: 'E2', part: 'E', text: 'Exit ticket: decide whether each change is physical or chemical.', parts: [
    chg('a', 'melting chocolate', 'P'), chg('b', 'toasting bread', 'C'), chg('c', 'burning candle', 'C'), chg('d', 'glowing light bulb', 'P'), chg('e', 'dissolving salt', 'P'), chg('f', 'burning wood', 'C'), chg('g', 'baking chicken', 'C'), chg('h', 'boiling water', 'P'),
    chg('i', 'water evaporating from a river', 'P'), chg('j', 'condensation on the window', 'P'), chg('k', 'cutting paper', 'P'), chg('l', 'milk turning sour', 'C'), chg('m', 'breaking glass', 'P'), chg('n', 'using a battery', 'C'), chg('o', 'photosynthesis', 'C'), chg('p', 'digesting food', 'C')] },
  { id: 'R1', part: 'R', text: 'A chemical reaction is a chemical change in which a completely ____ ____ or substances are produced. Chemical reactions follow the equation ____ → ____.', parts: [
    { l: 'a', q: 'Fill the first gap (two words).', a: 'new substance', ss: ['new substance'] }, { l: 'b', q: 'Complete the general equation.', a: 'reactants → products', wq: { r: ['reactants'], p: ['products'] } }] },
  { id: 'R2', part: 'R', text: 'Refer to the magnesium and hydrochloric acid diagrams: describe in your own words how magnesium chloride is formed.', parts: [{ l: '', q: '', a: 'When magnesium is placed in hydrochloric acid, the bonds between the hydrogen and chlorine atoms break. New bonds form: chlorine atoms bond to magnesium atoms to make magnesium chloride, and the hydrogen atoms bond together to make hydrogen gas.' }] },
  { id: 'R3', part: 'R', text: 'Write the word equation for each reaction, then label the reactants and products.', parts: [
    { l: '1', q: 'Sodium sulphate and barium chloride in solution react to form solid barium sulphate and sodium chloride, which remains dissolved in the solution.', a: 'sodium sulphate + barium chloride → barium sulphate + sodium chloride', wq: { r: ['sodium sulfate', 'barium chloride'], p: ['barium sulfate', 'sodium chloride'] } },
    { l: '2', q: 'Steel wool (which is made of iron) dissolves in copper sulphate solution to form iron sulphate solution and copper metal.', a: 'iron + copper sulphate → iron sulphate + copper', wq: { r: [['iron', 'steel wool'], 'copper sulfate'], p: ['iron sulfate', 'copper'] } },
    { l: '3', q: 'Heating copper carbonate forms copper oxide and carbon dioxide.', a: 'copper carbonate → copper oxide + carbon dioxide', wq: { r: ['copper carbonate'], p: ['copper oxide', 'carbon dioxide'] } },
    { l: '4', q: 'Magnesium ribbon is burned in oxygen. It produces a bright white light and forms a white powder called magnesium oxide.', a: 'magnesium + oxygen → magnesium oxide', wq: { r: ['magnesium', 'oxygen'], p: ['magnesium oxide'] } },
    { l: '5', q: 'Zinc metal is added to hydrochloric acid. Bubbles of hydrogen gas are produced, and zinc chloride remains in the solution.', a: 'zinc + hydrochloric acid → zinc chloride + hydrogen', wq: { r: ['zinc', 'hydrochloric acid'], p: ['zinc chloride', 'hydrogen'] } }] },
  { id: 'R4', part: 'R', text: 'Hydrogen and oxygen react to produce water (2H₂ + O₂ → 2H₂O). Analyse the diagram and describe what evidence there is that the mass of the reactants would equal the mass of the products.', parts: [
    { l: 'a', q: 'How many hydrogen atoms are on each side?', a: '4', n: 4 }, { l: 'b', q: 'How many oxygen atoms are on each side?', a: '2', n: 2 },
    { l: 'c', q: 'Describe the evidence.', a: 'There are 4 hydrogen atoms and 2 oxygen atoms before and after the reaction. The atoms are only rearranged into water molecules; none are created or destroyed, so the total mass stays the same.' }] },
  { id: 'R5', part: 'R', text: 'Bonds task: for each reaction, list the reactants and the products. (Description wording is copied exactly from the booklet.)', parts: [
    { l: 'a', q: 'Burning Carbon in air (Oxygen gas) to form Carbon Dioxide. C + O₂ → CO₂. List the products.', a: 'carbon dioxide (CO₂). Bonds: the O=O bond in oxygen breaks; new bonds form between the carbon atom and each oxygen atom.', ss: ['carbon dioxide'] },
    { l: 'b', q: 'Combing Hydrogen with Sulphur to form Dihydrogen Sulphide. H₂ + S → H₂S. List the reactants.', a: 'hydrogen and sulphur. Bonds: the H–H bond breaks; each hydrogen atom bonds to the sulphur atom. <i>(“Combing” in the booklet is a typo for “Combining”.)</i>', ss: ['hydrogen', 'sulfur'] },
    { l: 'c', q: 'Burning Magnesium in air (Oxygen gas) to form Water. 2Mg + O₂ → 2MgO. List the products.', a: 'magnesium oxide (MgO). Bonds: the O=O bond breaks and each oxygen atom bonds to a magnesium atom. <i>(The booklet says “to form Water”, but the equation shows the product is magnesium oxide, MgO.)</i>', ss: ['magnesium oxide'] },
    { l: 'd', q: 'Heating Hydrogen and Nitrogen to form Ammonia. 3H₂ + N₂ → 2NH₃. List the reactants.', a: 'hydrogen and nitrogen. Bonds: the H–H bonds and the N≡N triple bond break; each nitrogen bonds to three hydrogen atoms.', ss: ['hydrogen', 'nitrogen'] },
    { l: 'e', q: 'Reacting Carbon and Chlorine gas to make Carbon Tetrachloride. C + 2Cl₂ → CCl₄. List the products.', a: 'carbon tetrachloride (CCl₄). Bonds: the Cl–Cl bonds break; the carbon atom bonds to four chlorine atoms.', ss: ['carbon tetrachloride'] },
    { l: 'f', q: 'Dissolving Magnesium in Hydrochloric Acid to form Magnesium Chloride and Hydrogen gas. Mg + 2HCl → MgCl₂ + H₂. List the products.', a: 'magnesium chloride and hydrogen. Bonds: the H–Cl bonds break; chlorine bonds to magnesium and the hydrogen atoms bond together.', ss: ['magnesium chloride', 'hydrogen'] },
    { l: 'g', q: 'Heating Copper Carbonate to form Copper Oxide & Carbon Dioxide. CuCO₃ → CuO + CO₂. List the products.', a: 'copper oxide and carbon dioxide. Bonds: bonds in copper carbonate break, forming copper oxide and carbon dioxide molecules.', ss: ['copper oxide', 'carbon dioxide'] }] },
  { id: 'N1', part: 'N', text: 'Energy change in chemical reactions.', parts: [
    { l: 'a', q: 'Summarise the key idea.', a: 'Chemical reactions involve energy changes. Breaking bonds takes in energy and forming bonds releases energy. If more energy is released than taken in, the reaction is exothermic; if more is taken in, it is endothermic.' },
    { l: 'b', q: 'Compare exothermic and endothermic reactions.', a: 'Exothermic: releases energy to the surroundings, the temperature rises, products have less energy than reactants (e.g. combustion). Endothermic: absorbs energy from the surroundings, the temperature falls, products have more energy than reactants (e.g. photosynthesis).' }] },
  { id: 'N2', part: 'N', text: 'Classify each reaction.', parts: [
    { l: 'a', q: 'A reaction where the temperature rises from 20 °C to 34 °C.', a: 'Exothermic', ch: ['Exothermic', 'Endothermic'], ci: 0 }, { l: 'b', q: 'A reaction where the temperature falls from 21 °C to 12 °C.', a: 'Endothermic', ch: ['Exothermic', 'Endothermic'], ci: 1 },
    { l: 'c', q: 'Burning wood.', a: 'Exothermic', ch: ['Exothermic', 'Endothermic'], ci: 0 }, { l: 'd', q: 'Photosynthesis.', a: 'Endothermic', ch: ['Exothermic', 'Endothermic'], ci: 1 }] },
  { id: 'N3', part: 'N', text: 'Complete the graphs to show the energy in reactants and products before and after a reaction.', parts: [
    { l: 'a', q: 'Exothermic reaction', a: 'The reactants start high; the line rises a little (to start the reaction) then falls to the products, which are lower. The difference is the energy released.', as: () => energySVG('exo') },
    { l: 'b', q: 'Endothermic reaction', a: 'The reactants start low; the line rises then levels off at the products, which are higher. The difference is the energy absorbed.', as: () => energySVG('endo') }] },
  { id: 'T1', part: 'T', text: 'Corrosion.', parts: [
    { l: 'a', q: 'Write the general word equation for rusting.', a: 'iron + oxygen → iron oxide (water is also needed)', wq: { r: ['iron', 'oxygen'], p: [['iron oxide', 'rust', 'hydrated iron oxide']] } },
    { l: 'b', q: 'Summarise the key ideas about corrosion.', a: 'Corrosion is a chemical reaction where substances in the air or water eat away a metal. Rusting is the corrosion of iron: iron reacts with oxygen and water to form iron oxide (rust), which is weak and flaky.' }] },
  { id: 'T2', part: 'T', text: 'Describe why the rate of rusting can vary.', parts: [{ l: '', q: '', a: 'Iron rusts faster with more water and oxygen, in salty water (e.g. near the sea), at warmer temperatures, and in acidic conditions. It rusts slower or not at all if it is kept dry, coated (paint, oil, plastic) or galvanised with zinc.' }] },
  { id: 'T3', part: 'T', text: 'Combustion is a chemical reaction where a substance reacts with ____ and releases energy, usually as heat and light.', parts: [{ l: '', q: 'Fill the gap.', a: 'oxygen', ss: ['oxygen'] }] },
  { id: 'T4', part: 'T', text: 'A burning candle.', parts: [
    { l: 'a', q: 'In the blue zone of the flame, the wax molecules are burning in oxygen to form carbon dioxide and water vapour. Write this as a word equation.', a: 'wax + oxygen → carbon dioxide + water', wq: { r: [['wax', 'candle wax', 'paraffin wax'], 'oxygen'], p: ['carbon dioxide', 'water'] } },
    { l: 'b', q: 'In the yellow zone of the flame, the wax is burning in oxygen to form a mixture of carbon dioxide, carbon monoxide, carbon (soot) and water vapour. Write this as a word equation.', a: 'wax + oxygen → carbon dioxide + carbon monoxide + carbon + water', wq: { r: [['wax', 'candle wax', 'paraffin wax'], 'oxygen'], p: ['carbon dioxide', 'carbon monoxide', 'carbon', 'water'] } }] },
  { id: 'M1', part: 'M', text: 'Mass number.', parts: [
    { l: '1', q: 'Which subatomic particles make up the mass number?', a: 'Protons and neutrons', ss: ['protons', 'neutrons'] },
    { l: '2', q: 'Complete the formula: Mass number (A) = …', a: 'protons (Z) + neutrons (N)' },
    { l: '3', q: 'Write the formula for the number of neutrons.', a: 'N = A − Z (mass number − atomic number)' }] },
  { id: 'M2', part: 'M', text: 'Complete the missing values in the table.', parts: [
    { l: '9', q: 'Helium (He): Z = 2, A = 4. Protons and neutrons? (type both, e.g. 2, 2)', a: '2 protons, 2 neutrons', ns: [2, 2] },
    { l: '10', q: 'Carbon (C): Z = 6, 6 protons, 6 neutrons. Mass number?', a: '12', n: 12 },
    { l: '11', q: 'Nitrogen (N): A = 15, 7 protons. Atomic number and neutrons? (type both)', a: 'Z = 7, 8 neutrons', ns: [7, 8] }] },
  { id: 'M3', part: 'M', text: 'Calculate.', parts: [
    { l: '5', q: 'An atom has a mass number of 23 and contains 11 protons. Calculate the number of neutrons.', a: '23 − 11 = 12', n: 12 },
    { l: '6', q: 'An atom has a mass number of 40 and contains 20 protons. Calculate the number of neutrons.', a: '40 − 20 = 20', n: 20 },
    { l: '7', q: 'An atom has a mass number of 35 and contains 17 protons. Calculate the number of neutrons.', a: '35 − 17 = 18', n: 18 },
    { l: '8a', q: 'Neutral atom Q has a mass number of 31 and 16 neutrons. How many protons?', a: '31 − 16 = 15', n: 15 },
    { l: '8b', q: 'How many electrons orbit its nucleus?', a: '15 (neutral, so electrons = protons; it is phosphorus)', n: 15 },
    { l: 'X1', q: 'Extension: an element has twice as many neutrons as protons and a mass number of 36. How many protons?', a: 'P + 2P = 36, so 3P = 36 and P = 12. Neutrons = 24, atomic number = 12: magnesium.', n: 12 },
    { l: 'X2', q: 'Extension: an atom has a mass number of 40 and 4 more neutrons than protons. How many protons?', a: 'P + (P + 4) = 40, so P = 18, N = 22, atomic number 18: argon', n: 18 }] }
];

/* ================= flashcards ================= */
const FLASH = [
  ['C1', 'What is a chemical change?', 'A change that produces one or more new substances.'], ['C1', 'What is a physical change?', 'A change where no new substance is made (shape, size or state changes).'], ['C1', 'Six clues of a chemical change', 'Gas, colour change, precipitate, temperature change, new smell, light.'],
  ['C1', 'Is dissolving physical or chemical?', 'Physical: the substance is still there and can be recovered.'], ['C1', 'What is a precipitate?', 'A solid that forms when two solutions are mixed.'],
  ['C2', 'Observation vs inference', 'Observation: what you see or measure. Inference: what you conclude from it.'], ['C2', 'How do you justify a conclusion?', 'State the answer + specific evidence (with numbers) + link it to the science.'],
  ['C3', 'Reactants', 'The substances you start with (before the arrow).'], ['C3', 'Products', 'The new substances made (after the arrow).'], ['C3', 'What does → mean?', 'React to form.'],
  ['C4', 'Word equation for burning magnesium', 'magnesium + oxygen → magnesium oxide'], ['C4', 'Metal + acid →', 'salt + hydrogen (e.g. zinc + hydrochloric acid → zinc chloride + hydrogen)'], ['C4', 'Heating copper carbonate', 'copper carbonate → copper oxide + carbon dioxide'],
  ['C5', 'Law of conservation of mass', 'Mass is not created or destroyed in a chemical reaction; mass of reactants = mass of products.'], ['C5', 'What happens to atoms in a reaction?', 'They are rearranged (bonds break and form), not created or destroyed.'],
  ['C5', 'Why does mass drop in an open beaker?', 'A gas is produced and escapes into the air.'], ['C5', 'How to show mass is conserved', 'React in a sealed container and weigh before and after.'],
  ['C6', 'Exothermic', 'Releases energy to the surroundings; the temperature rises.'], ['C6', 'Endothermic', 'Absorbs energy from the surroundings; the temperature falls.'], ['C6', 'ΔT formula', 'ΔT = final temperature − starting temperature'], ['C6', 'Uncertainty formula', '(highest − lowest) ÷ 2'],
  ['C6', 'Exo energy diagram', 'Products are lower than reactants.'], ['C6', 'Example of an endothermic reaction', 'Photosynthesis, or an instant cold pack.'],
  ['C7', 'Combustion', 'A substance reacts with oxygen and releases energy as heat and light.'], ['C7', 'Fire triangle', 'Fuel, oxygen and heat.'], ['C7', 'Combustion word equation', 'fuel + oxygen → carbon dioxide + water'], ['C7', 'Why is a match needed?', 'To provide ignition energy to start the reaction.'],
  ['C8', 'Corrosion', 'A chemical reaction where a metal is slowly eaten away by substances around it.'], ['C8', 'What does iron need to rust?', 'Oxygen and water.'], ['C8', 'Rusting word equation', 'iron + oxygen → iron oxide'], ['C8', 'How to prevent rust', 'Paint, oil, coat or galvanise the iron to keep oxygen and water out.'],
  ['C9', 'Mass number', 'Protons + neutrons.'], ['C9', 'Neutrons =', 'Mass number − atomic number'], ['C9', 'Justify', 'Support your answer with evidence.'], ['C9', 'Classify', 'Sort into groups using a rule.'], ['C9', 'Distinguish', 'Show how two things are different.']
];

/* ================= science words ================= */
const GLOSS = [
  ['Physical change', 'A change where no new substance forms (e.g. melting, dissolving).', 'C1'], ['Chemical change', 'A change where one or more new substances form.', 'C1'], ['Precipitate', 'A solid that forms when two solutions react.', 'C1'], ['Reversible', 'Can be changed back.', 'C1'],
  ['Observation', 'Something you notice with your senses or measure.', 'C2'], ['Inference', 'A conclusion drawn from observations.', 'C2'], ['Evidence', 'Observations or data that support a conclusion.', 'C2'], ['Relevant', 'Connected to the question being asked.', 'C2'],
  ['Reactant', 'A substance you start with in a chemical reaction.', 'C3'], ['Product', 'A new substance made in a chemical reaction.', 'C3'], ['Chemical reaction', 'A chemical change where new substances are produced.', 'C3'],
  ['Word equation', 'A reaction written in words: reactants → products.', 'C4'], ['Conservation of mass', 'Mass is not created or destroyed in a chemical reaction.', 'C5'], ['Closed system', 'A sealed container where nothing can get in or out.', 'C5'], ['Open system', 'A container where gases can escape or enter.', 'C5'],
  ['Atom', 'The smallest particle of an element.', 'C5'], ['Bond', 'The link that holds atoms together.', 'C5'],
  ['Exothermic', 'A reaction that releases energy to the surroundings (temperature rises).', 'C6'], ['Endothermic', 'A reaction that absorbs energy from the surroundings (temperature falls).', 'C6'], ['ΔT', 'Temperature change: final − start.', 'C6'], ['Mean', 'Average: add the values and divide by how many there are.', 'C6'], ['Uncertainty', 'How much results vary: (highest − lowest) ÷ 2.', 'C6'],
  ['Independent variable', 'What you change on purpose.', 'C6'], ['Dependent variable', 'What you measure.', 'C6'], ['Control variable', 'What you keep the same to make it a fair test.', 'C6'], ['Anomaly', 'A result that doesn’t fit the pattern.', 'C6'],
  ['Combustion', 'A reaction with oxygen that releases heat and light (burning).', 'C7'], ['Fuel', 'A substance that burns to release energy.', 'C7'], ['Ignition energy', 'The energy needed to start combustion.', 'C7'], ['Incomplete combustion', 'Burning with too little oxygen, making carbon monoxide and soot.', 'C7'],
  ['Corrosion', 'A metal being slowly eaten away by a chemical reaction.', 'C8'], ['Rust', 'Iron oxide, formed when iron corrodes.', 'C8'], ['Galvanising', 'Coating iron with zinc to stop rusting.', 'C8'],
  ['Mass number (A)', 'The number of protons + neutrons in an atom.', 'C9'], ['Atomic number (Z)', 'The number of protons in an atom.', 'C9'], ['Proton', 'Positive particle in the nucleus.', 'C9'], ['Neutron', 'Neutral particle in the nucleus.', 'C9'], ['Electron', 'Negative particle in shells around the nucleus.', 'C9']
].concat(VERBS.map(v => [v[0] + ' (question word)', v[1] + '.', 'C9']));

/* ================= one entry per checklist skill (same order as CHECKLIST): simple explanation, example, matching question types ================= */
const SKILL_INFO = [
  // 1. Physical and chemical changes
  { x: 'Look for clues. A chemical change makes something new, so you might see <b>gas bubbles, a colour change, a solid forming, a temperature change, a new smell or light</b>. A physical change only changes the shape, size or state, like melting.', eg: 'Vinegar + baking soda fizzes → chemical. Ice melting → physical.', g: ['chgEvidence', 'chgClassify'] },
  { x: 'These are the main clues of a chemical change:<ul><li><b>Gas</b>: bubbles or fizzing</li><li><b>Colour change</b></li><li><b>Precipitate</b>: a solid appears when two liquids are mixed</li><li><b>Temperature change</b>: gets hotter or colder</li><li><b>New smell</b></li></ul>', eg: 'Two clear liquids are mixed and a yellow solid appears → a precipitate → chemical change.', g: ['chgEvidence'] },
  { x: '<b>Physical:</b> it is still the same substance, just a new shape, size or state. Usually easy to undo.<br><b>Chemical:</b> a new substance forms. Usually can’t be undone.', eg: 'Melting chocolate (physical) vs toasting bread (chemical).', g: ['chgClassify', 'chgDefine'] },
  { x: 'In a physical change the particles don’t change. Ice, liquid water and steam are all still water (H₂O), just arranged differently. Nothing new is made.', eg: 'Dissolve salt in water, then evaporate the water: the salt is still there.', g: ['chgDefine', 'chgClassify'] },
  { x: 'In a chemical change the atoms rearrange to make <b>new substances</b> with different properties. A new substance is the only sure sign of a chemical change.', eg: 'Burning wood makes ash, smoke and carbon dioxide. It isn’t wood any more.', g: ['chgDefine', 'chgClassify'] },
  // 2. Observing, analysing and justifying
  { x: 'Write down what you <b>see, hear, smell or measure</b>, using numbers and units. Don’t write feelings or guesses.', eg: 'Not “it got hot”, but “the temperature rose from 21 °C to 35 °C in 90 seconds”.', g: ['obsVsOpinion'] },
  { x: 'Only write the observations that help answer the question: gas, colour, a solid forming, temperature, smell. Things like the size of the beaker don’t matter.', eg: 'Relevant: “bubbles formed”. Not relevant: “we used a blue spatula”.', g: ['obsVsOpinion', 'obsClassify'] },
  { x: 'Look at each observation and ask: <b>does it show a new substance formed?</b> If yes, it’s chemical. If it only melted, dissolved or changed shape, it’s physical.', eg: 'Bubbles + temperature rise when metal is added to acid → chemical.', g: ['obsClassify'] },
  { x: 'Give your answer, then the evidence (with numbers), then link it back to the science.', eg: '“Chemical, because bubbles formed and the temperature rose by 8 °C, which shows a new substance formed.”', g: ['obsClassify', 'evidenceVsOpinion'] },
  { x: 'Use the clues of a chemical change (gas, temperature change, colour change, precipitate) as your <b>reasons</b> when you say what type of change it was.', eg: '“A white precipitate formed when the two solutions were mixed, so a new substance was made: chemical change.”', g: ['obsClassify', 'chgEvidence'] },
  // 3. Reactants and products
  { x: 'A <b>reactant</b> is a substance you <b>start</b> with. It gets used up in the reaction.', eg: 'In magnesium + oxygen → magnesium oxide, the reactants are magnesium and oxygen.', g: ['rpFacts', 'rpIdentify'] },
  { x: 'A <b>product</b> is a <b>new</b> substance made by the reaction.', eg: 'In magnesium + oxygen → magnesium oxide, the product is magnesium oxide.', g: ['rpFacts', 'rpIdentify'] },
  { x: 'The reactants are everything written <b>before</b> the arrow.', eg: 'zinc + hydrochloric acid → zinc chloride + hydrogen: reactants are zinc and hydrochloric acid.', g: ['rpIdentify'] },
  { x: 'The products are everything written <b>after</b> the arrow.', eg: 'copper carbonate → copper oxide + carbon dioxide: products are copper oxide and carbon dioxide.', g: ['rpIdentify'] },
  { x: 'In a word equation, reactants are always on the <b>left</b>, before the arrow.', eg: '<b>reactants</b> → products', g: ['rpFacts', 'rpIdentify'] },
  { x: 'In a word equation, products are always on the <b>right</b>, after the arrow.', eg: 'reactants → <b>products</b>', g: ['rpFacts', 'rpIdentify'] },
  // 4. Word equations
  { x: 'A word equation shows a reaction in words: <b>reactants → products</b>, with a + between substances on the same side.', eg: 'magnesium + oxygen → magnesium oxide', g: ['eqConstruct', 'eqChoose'] },
  { x: 'Everything you <b>start with</b> goes on the left of the arrow.', eg: '<b>iron + oxygen</b> → iron oxide', g: ['eqChoose', 'rpFacts'] },
  { x: 'Everything that is <b>made</b> goes on the right of the arrow.', eg: 'iron + oxygen → <b>iron oxide</b>', g: ['eqChoose', 'rpFacts'] },
  { x: 'Read the description again and find which substance isn’t in the equation yet. Ask: is it something you start with, or something that is made?', eg: 'magnesium + ______ → magnesium oxide → the missing reactant is oxygen.', g: ['eqMissing'] },
  { x: '1. Find what you start with. 2. Find what is made. 3. Write reactants → products with + between them. Leave out words like “solid” or “gas”.', eg: '“Zinc is added to hydrochloric acid, making hydrogen gas and zinc chloride” → zinc + hydrochloric acid → zinc chloride + hydrogen', g: ['eqConstruct'] },
  // 5. Conservation of mass
  { x: '<b>Mass is not created or destroyed in a chemical reaction.</b> The total mass of the reactants equals the total mass of the products.', eg: '10 g of reactants always makes 10 g of products (in a sealed container).', g: ['massLaw'] },
  { x: 'In a reaction the bonds between atoms break and new bonds form. The <b>same atoms</b> just join up in new ways.', eg: '2H₂ + O₂ → 2H₂O: 4 H and 2 O atoms before, 4 H and 2 O atoms after.', g: ['massLaw', 'atomCount'] },
  { x: 'No atoms appear and none disappear in a reaction. That is why the mass stays the same.', eg: 'Count the atoms on both sides of an equation: the numbers always match.', g: ['massLaw', 'atomCount'] },
  { x: 'In a <b>closed (sealed)</b> system nothing can get in or out, so the same atoms (and the same mass) are there before and after.', eg: 'A sealed flask weighs 150.0 g before and 150.0 g after the reaction.', g: ['massLaw', 'massClosed'] },
  { x: 'Add up the masses you know. Total reactants = total products, so subtract to find the missing one.', eg: 'magnesium 2.4 g + oxygen ? g → magnesium oxide 4.0 g → oxygen = 4.0 − 2.4 = 1.6 g', g: ['massClosed'] },
  { x: 'In an <b>open</b> container a gas product can escape into the air, so the scale reading goes down. The mass isn’t destroyed; it just left.', eg: 'Marble chips + acid in an open beaker: 125.0 g → 122.8 g, so 2.2 g of carbon dioxide escaped.', g: ['massOpen'] },
  { x: 'Put the reactants in a <b>sealed</b> container (a stopper or a balloon over the top), weigh it, let them react, then weigh it again. The mass stays the same.', eg: 'Vinegar and baking soda in a flask with a balloon over the top: same mass before and after.', g: ['massLaw', 'massOpen'] },
  // 6. Exothermic and endothermic
  { x: 'An <b>exothermic</b> reaction gives out energy (usually heat). “Exo” = exit.', eg: 'Burning wood, hand warmers.', g: ['exoEndoFacts'] },
  { x: 'An <b>endothermic</b> reaction takes in energy (usually heat). “Endo” = enter.', eg: 'Instant cold packs, photosynthesis.', g: ['exoEndoFacts'] },
  { x: 'Exothermic reactions <b>release</b> energy to the surroundings, so the surroundings (the beaker, the air, your hand) get <b>hotter</b>.', eg: 'A hand warmer feels warm because its reaction releases heat.', g: ['exoEndoFacts', 'energyDiagram'] },
  { x: 'Endothermic reactions <b>absorb</b> energy from the surroundings, so the surroundings get <b>colder</b>.', eg: 'A cold pack feels cold because its reaction takes heat from your skin.', g: ['exoEndoFacts', 'energyDiagram'] },
  { x: 'If the measured temperature <b>goes up</b>, the reaction is exothermic.', eg: '21 °C → 36 °C, so it is exothermic.', g: ['tempClassify'] },
  { x: 'If the measured temperature <b>goes down</b>, the reaction is endothermic.', eg: '21 °C → 13 °C, so it is endothermic.', g: ['tempClassify'] },
  { x: 'Use the numbers as your evidence. ΔT = final − start. Positive means exothermic; negative means endothermic.', eg: '“Exothermic, because the temperature rose from 21.0 °C to 36.1 °C (ΔT = +15.1 °C).”', g: ['tempClassify', 'deltaT', 'meanUnc'] },
  // 7. Combustion
  { x: '<b>Combustion</b> is burning: a substance reacts with <b>oxygen</b> and releases energy as heat and light.', eg: 'A gas stove flame, a campfire, a candle.', g: ['combFacts'] },
  { x: 'Combustion needs <b>oxygen</b>. Take the oxygen away and the fire goes out.', eg: 'A fire blanket smothers a fire by stopping oxygen reaching it.', g: ['combFacts', 'combTriangle'] },
  { x: 'Combustion needs a <b>fuel</b>: the substance that burns.', eg: 'Wood, gas, wax, petrol. Turning off the gas puts out a stove flame.', g: ['combTriangle', 'combFacts'] },
  { x: 'A fuel needs some <b>heat to get started</b> (ignition energy), like a match or a spark. After that, the heat from burning keeps it going.', eg: 'A gas stove needs a spark to light, then keeps burning by itself.', g: ['combFacts', 'combTriangle'] },
  { x: 'For a fuel made of carbon and hydrogen: <b>fuel + oxygen → carbon dioxide + water</b>.', eg: 'methane + oxygen → carbon dioxide + water', g: ['combEq'] },
  { x: 'Combustion gives out energy as heat and light, so it is <b>exothermic</b>.', eg: 'That’s why we burn fuels to cook and to heat homes.', g: ['combFacts', 'exoEndoFacts'] },
  // 8. Corrosion
  { x: '<b>Corrosion</b> is when a metal is slowly eaten away by a chemical reaction with things around it, like oxygen and water.', eg: 'An old iron gate going rusty.', g: ['corrFacts'] },
  { x: 'Corrosion is <b>chemical</b> because a new substance forms (like rust, iron oxide).', eg: 'Shiny iron turns into flaky orange rust: a new substance.', g: ['corrFacts'] },
  { x: '<b>Rusting</b> is the corrosion of iron (and steel).', eg: 'A bike chain left out in the rain goes rusty.', g: ['corrFacts', 'corrEq'] },
  { x: 'Iron needs <b>oxygen and water (moisture)</b> to rust. Salt makes it rust faster.', eg: 'A nail in dry air doesn’t rust; a nail in salty water rusts the most.', g: ['corrNails', 'corrFacts'] },
  { x: 'Rusting written as a word equation: <b>iron + oxygen → iron oxide</b>.', eg: 'iron + oxygen → iron oxide', g: ['corrEq', 'corrFacts', 'corrNails'] },
  // 9. Mixed exam skills
  { x: 'Question words tell you what to do:<ul><li><b>Identify</b> = name it</li><li><b>Define</b> = exact meaning</li><li><b>Classify</b> = sort into groups</li><li><b>Distinguish</b> = show the difference</li><li><b>Analyse</b> = break it down</li><li><b>Justify</b> = back it up with evidence</li></ul>', eg: '“Justify” means you must give evidence, not just the answer.', g: ['verbs'] },
  { x: 'Science answers need <b>evidence</b> (what you saw or measured), not opinions like “it felt like it”.', eg: 'Good: “the temperature rose from 20 °C to 31 °C”. Bad: “it seemed hot”.', g: ['evidenceVsOpinion', 'obsVsOpinion'] },
  { x: 'When asked to justify, say <b>why</b>: answer + evidence + the science that links them.', eg: '“Endothermic, because the temperature fell by 7 °C, so energy was absorbed from the surroundings.”', g: ['obsVerb', 'evidenceVsOpinion'] },
  { x: '<b>Mass number = protons + neutrons.</b> Neutrons = mass number − atomic number. In a neutral atom, electrons = protons. For conservation of mass: mass before = mass after.', eg: 'Mass number 23, atomic number 11 → 12 neutrons.', g: ['massNumber', 'massClosed'] },
  { x: 'Be able to write a word equation from a description, and read one to find the reactants and products.', eg: 'hydrogen + oxygen → water: reactants hydrogen and oxygen, product water.', g: ['eqConstruct', 'rpIdentify', 'eqMissing'] }
];
if (SKILL_INFO.length !== CHECKLIST.reduce((a, c) => a + c[1].length, 0)) console.error('SKILL_INFO does not match the checklist length');
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
const state = { learn: store.get('learnTopic', 'C1'), practice: 'mix', tool: 'solver', bkPart: Object.keys(BK_PARTS)[0] };
const tstats = store.get('tstats', {});
function record(topic, ok) { const s = tstats[topic] || (tstats[topic] = { a: 0, c: 0 }); s.a++; if (ok) s.c++; store.set('tstats', tstats); if (ok) planTick('right', topic); }
/* ---------- today's plan (Home) ---------- */
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function pickFocus() {
  const rows = TOPICS.map(t => ({ t, s: tstats[t.id] }));
  const tried = rows.filter(x => x.s && x.s.a >= 3).sort((a, b) => a.s.c / a.s.a - b.s.c / b.s.a);
  const fresh = rows.find(x => !x.s || x.s.a < 3);
  if (tried.length && tried[0].s.c / tried[0].s.a < 0.8) return { id: tried[0].t.id, why: 'it’s your lowest score so far (' + Math.round(tried[0].s.c / tried[0].s.a * 100) + '% right)' };
  if (fresh) return { id: fresh.t.id, why: 'you haven’t practised it yet' };
  return { id: tried[0].t.id, why: 'it’s your lowest score, so keep it sharp' };
}
function getPlan() {
  let pl = store.get('plan', null);
  if (!pl || pl.d !== todayKey() || !TOPIC[pl.focus]) { const f = pickFocus(); pl = { d: todayKey(), focus: f.id, why: f.why, read: false, right: 0, tested: false }; store.set('plan', pl); }
  return pl;
}
function planTick(what, topic) {
  const pl = getPlan();
  if (what === 'read' && topic === pl.focus && !pl.read) { pl.read = true; store.set('plan', pl); }
  if (what === 'right' && topic === pl.focus) { pl.right = (pl.right || 0) + 1; store.set('plan', pl); }
  if (what === 'tested' && !pl.tested) { pl.tested = true; store.set('plan', pl); }
}
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
    fb.appendChild(h('<div class="fb ' + (r.ok ? 'good' : r.gaveUp ? 'info answer-shown' : 'bad') + '">' + msg + '</div>'));
    if (r.ok) { const d = h('<details class="ex"><summary>Show the working</summary></details>'); d.insertAdjacentHTML('beforeend', solHTML(Q)); fb.appendChild(d); }
    else fb.insertAdjacentHTML('beforeend', solHTML(Q));
    if (opts.onAnswer) opts.onAnswer(!!r.ok && (exam || tries <= 1), false, tries);
    return r;
  }
  return { el, finalize: () => finalize(checkAnswer(Q, Q.type === 'mcq' ? sel : (input ? input.value : ''))), answered: () => Q.type === 'mcq' ? sel !== null : !!(input && input.value.trim()), value: () => Q.type === 'mcq' ? (sel === null ? '' : Q.choices[sel]) : (input ? input.value : ''), focus: () => input && input.focus() };
}

/* ================= router ================= */
const VIEWS = ['home', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 'practice', 'booklet', 'skill'];
const topicTab = tid => 't' + (Math.max(0, TOPICS.findIndex(x => x.id === tid)) + 1);
// old addresses and buttons still work: they go to where that thing lives now
const ALIAS = { need: 'home', learn: () => topicTab(state.learn), exam: () => { state.pmode = 'test'; return 'practice'; }, graph: () => { state.bmode = 'graph'; return 'booklet'; }, theory: () => { state.bmode = 'theory'; return 'booklet'; }, cards: 'home', glossary: 'home', tools: 'home', ask: 'home' };
const RENDER = {}; const rendered = {};
function show(view, force) {
  if (ALIAS[view]) { const tgt = typeof ALIAS[view] === 'function' ? ALIAS[view]() : ALIAS[view]; rendered[tgt] = false; location.replace('#' + tgt); return; }
  if (!VIEWS.includes(view)) view = 'home';
  $$('main > .view').forEach(s => { s.hidden = s.id !== 'v-' + view; });
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
  state.bkPart = q ? q.part : Object.keys(BK_PARTS)[0]; state.bmode = 'work';
  go('booklet', () => { const t = document.getElementById('bk-' + id); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.animate?.([{ outline: '3px solid var(--accent)' }, { outline: '3px solid transparent' }], { duration: 1600 }); } });
}
function openPractice(tid) { state.practice = tid; state.pmode = tid === 'mix' || tid === 'weak' ? 'mix' : 'topic'; go('practice'); }
function openLearn(tid) { state.learn = tid; store.set('learnTopic', tid); go(topicTab(tid)); }
function openTool() { state.bmode = 'graph'; go('booklet'); }
RENDER.home = () => {
  const v = $('#v-home'); v.innerHTML = '';
  const totalA = Object.values(tstats).reduce((s, x) => s + x.a, 0), totalC = Object.values(tstats).reduce((s, x) => s + x.c, 0);
  const allParts = BOOKLET.flatMap(q => q.mcq ? q.mcq.map((_, i) => 'D' + (i + 1)) : q.parts.map(p => q.id + p.l));
  const bkDone = allParts.filter(k => bkMarks[k] !== undefined).length, bkRight = allParts.filter(k => bkMarks[k] === 1).length;
  const ckItems = CHECKLIST.flatMap(c => c[1]); const ckGot = ckItems.filter((_, i) => ckStore['k' + i] === 2).length;
  const examDate = store.get('examDate', '');
  let days = null; if (examDate) { const d = new Date(examDate + 'T09:00'); days = Math.ceil((d - new Date()) / 864e5); }
  const pl = getPlan(); const ft = TOPIC[pl.focus]; const need = 5; const got = Math.min(pl.right || 0, need);
  const steps = [
    { done: pl.read, title: 'Read', text: 'Read the quick version of <b>' + ft.id + ' ' + ft.name + '</b>.', btn: '<button type="button" class="btn" data-plan="read">Read it</button>' },
    { done: got >= need, title: 'Practise', text: 'Get <b>5 questions right</b> on ' + ft.name + '. <span class="plan-count">' + got + ' / ' + need + '</span>', btn: '<button type="button" class="btn" data-plan="practise">Practise</button>' },
    { done: pl.tested, title: 'Test yourself', text: 'Do a timed practice test on everything.', btn: '<button type="button" class="btn" data-go="exam">Start a test</button>' }
  ];
  const allDone = steps.every(x => x.done);
  const start = h(`<div class="card stack plan">
    <div><span class="eyebrow">Today’s plan</span><h2>${allDone ? 'All done for today!' : 'Do these 3 things today'}</h2>
    <p class="muted">${allDone ? 'Great work. Come back tomorrow for a new plan, or keep going with anything below.' : 'Today’s focus is <b>' + ft.name + '</b>, because ' + pl.why + '.'}</p></div>
    <ol class="plan-steps">${steps.map((x, i) => '<li class="' + (x.done ? 'done' : '') + '"><span class="n">' + (x.done ? '✓' : i + 1) + '</span><div class="stack" style="gap:6px"><h3>' + x.title + '</h3><p>' + x.text + '</p>' + (x.done ? '<span class="small" style="color:var(--good);font-weight:600">Done</span>' : x.btn) + '</div></li>').join('')}</ol>
    <p class="small muted">Want something else? Pick a topic below or in the tabs, or open <button type="button" class="reflink" data-go="practice">Practice</button> or the <button type="button" class="reflink" data-go="booklet">Booklet</button> (workbook questions, graph task and the completed booklet).</p>
  </div>`);
  v.appendChild(start);
  const rd = $('[data-plan="read"]', start); if (rd) rd.onclick = () => openLearn(pl.focus);
  const pr = $('[data-plan="practise"]', start); if (pr) pr.onclick = () => openPractice(pl.focus);
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

  // the 9 topics as big buttons
  const prog = h('<div class="card stack"><div class="row" style="justify-content:space-between"><h3>The 9 topics</h3><span class="small muted">Tap a topic to open everything for it. The bar shows how many you’ve got right.</span></div><div class="topic-btns"></div></div>');
  TOPICS.forEach((t, i) => {
    const a = acc(t.id), st = tstats[t.id];
    const btn = h('<button type="button" class="topic-btn"><span class="tn">' + (i + 1) + '</span><span class="tt">' + t.name + '</span><span class="bar ' + (a !== null && a >= 0.8 ? 'good' : '') + '"><i style="width:' + (a === null ? 0 : Math.round(a * 100)) + '%"></i></span><span class="small muted">' + (st ? Math.round(a * 100) + '% right of ' + st.a : 'not started') + '</span></button>');
    btn.onclick = () => go('t' + (i + 1)); $('.topic-btns', prog).appendChild(btn);
  });
  v.appendChild(prog);

  // checklist
  const ck = h('<div class="card stack"><div class="stack" style="gap:4px"><h3>Skills checklist</h3><p class="muted small">From the revision booklet. <b>Tap a skill</b> for a simple explanation and 3 quick questions. Tap how sure you feel about each skill. Work on anything that isn’t “Got it” yet.</p></div><div class="scroll-x"><table class="check"><thead><tr><th>Skill</th><th>Practise with</th><th>Confidence</th><th></th></tr></thead><tbody></tbody></table></div></div>');
  const tb = $('tbody', ck); let idx = 0;
  CHECKLIST.forEach(([sec, items]) => {
    tb.appendChild(h('<tr class="sec"><td colspan="4">' + sec + '</td></tr>'));
    items.forEach(([skill, ref, tid]) => {
      const i = idx++; const tr = h('<tr id="ck-' + i + '"><td><button type="button" class="skill-link" title="Tap for a simple explanation and 3 questions">' + skill + '</button></td><td></td><td></td><td></td></tr>');
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

/* ================= ONE SKILL (opened from the checklist) ================= */
const SKILLS = CHECKLIST.flatMap(c => c[1].map(it => [c[0], ...it]));
function openSkill(i) { state.skill = i; store.set('skillOpen', i); go('skill'); }
function backHome(i) { state.ckReturn = i; go('home'); }
RENDER.skill = () => {
  const v = $('#v-skill'); v.innerHTML = '';
  let i = state.skill ?? store.get('skillOpen', 0); if (!(i >= 0 && i < SKILLS.length)) i = 0;
  const [sec, skill, ref, tid] = SKILLS[i], info = SKILL_INFO[i], t = TOPIC[tid];
  const back = h('<button type="button" class="btn quiet sm">← Back to home</button>'); back.onclick = () => backHome(i);
  v.appendChild(back);
  v.appendChild(h('<div class="view-head"><span class="eyebrow">' + sec + '</span><h2>' + skill + '</h2></div>'));
  v.appendChild(h('<div class="card stack"><h3>In simple words</h3><div class="skill-x">' + info.x + '</div>' + (info.eg ? '<div class="skill-eg"><b>Example:</b> ' + info.eg + '</div>' : '') + '</div>'));
  const qc = h('<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Try 3 questions</h3><span class="small muted skill-score"></span></div><div class="stack skill-qs"></div><div class="row"><button type="button" class="btn quiet" data-new>New questions</button></div></div>');
  const load = () => {
    const list = $('.skill-qs', qc); list.innerHTML = ''; const seen = new Set(), Qs = [];
    for (let tries = 0; Qs.length < 3 && tries < 20; tries++) { const Q = makeQ(pick(info.g)); if (seen.has(Q.q) && tries < 15) continue; seen.add(Q.q); Qs.push(Q); }
    let done = 0, right = 0; const sc = $('.skill-score', qc); const upd = () => { sc.textContent = done ? right + ' / ' + done + ' right' + (done === 3 ? (right === 3 ? ' · nice!' : '') : '') : '0 / 3 done'; }; upd();
    Qs.forEach((Q, n) => { const c = questionCard(Q, { num: (n + 1) + ' of 3', onAnswer: (ok, partial) => { if (partial) return; record(tid, ok); done++; if (ok) right++; upd(); } }); list.appendChild(c.el); });
  };
  $('[data-new]', qc).onclick = load; load();
  v.appendChild(qc);
  const cf = h('<div class="card stack"><h3>How sure are you now?</h3><p class="small muted">This updates the skills checklist on Home.</p><div class="cf-host"></div></div>');
  $('.cf-host', cf).appendChild(confButtons('k' + i, ckStore, 'check'));
  v.appendChild(cf);
  const more = h('<p class="small muted">Want more? Open <button type="button" class="reflink" data-topic>topic ' + (TOPICS.indexOf(t) + 1) + ': ' + t.name + '</button> or the booklet questions: </p>');
  $('[data-topic]', more).onclick = () => go(topicTab(tid)); more.appendChild(bkRefLinks(ref));
  v.appendChild(more);
  const big = h('<button type="button" class="btn skill-home">← Back to home</button>'); big.onclick = () => backHome(i);
  v.appendChild(big);
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
    planTick('read', id);
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
const practiceInto = (v) => {
  v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Practice</h2><p>Pick a topic, answer the question, press <b>Check</b>. For word equations, type them like <i>magnesium + oxygen → magnesium oxide</i>. You get two tries, and you can always see the working.</p></div>'));
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
const bookletInto = (v) => {
  v.innerHTML = '';
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
const examInto = (v) => {
  v.innerHTML = ''; clearInterval(examTimer);
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
    const deadline = start + mins * 60000; // use the clock, so the timer stays right even if the tab is in the background
    if (mins) examTimer = setInterval(() => { left = Math.max(0, Math.round((deadline - Date.now()) / 1000)); const c = $('#exClock', bar); if (!c) { clearInterval(examTimer); return; } c.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); c.classList.toggle('low', left <= 60); if (left <= 0) { clearInterval(examTimer); toast('Time is up'); submit(); } }, 1000);
    let armed = false;
    const trySubmit = btn => { const un = n - cards.filter(c => c.answered()).length; if (!armed && un > 0) { armed = true; btn.textContent = un + ' unanswered: tap again to submit'; setTimeout(() => { armed = false; btn.textContent = 'Submit exam'; }, 4000); return; } submit(); };
    $('#exSub', bar).onclick = e => trySubmit(e.target); $('button', bottom).onclick = e => trySubmit(e.target);
    $('#exQuit', bar).onclick = () => { clearInterval(examTimer); examInto(v); };
    let done = false;
    function submit() {
      if (done) return; done = true; clearInterval(examTimer);
      const res = cards.map((c, i) => { const r = c.finalize(); record(Qs[i].topic, !!r.ok); return !!r.ok; });
      planTick('tested');
      const s = res.filter(Boolean).length, p = Math.round(s / n * 100); const used = Math.round((Date.now() - start) / 1000);
      const hist = store.get('exams', []); hist.push({ d: new Date().toLocaleDateString('en-AU'), s, n, p, t: Math.floor(used / 60) + 'm ' + used % 60 + 's' }); store.set('exams', hist);
      bar.remove(); bottom.remove();
      const by = {}; Qs.forEach((Q, i) => { const b = by[Q.topic] || (by[Q.topic] = [0, 0]); b[1]++; if (res[i]) b[0]++; });
      const weak = Object.entries(by).filter(([, [a, b]]) => a / b < 0.7).map(([t]) => t);
      const sum = h('<div class="card stack"><span class="eyebrow">Result</span><div class="row" style="align-items:baseline"><span class="bignum ' + (p >= 70 ? 'result-good' : 'result-bad') + '">' + s + '/' + n + '</span><span class="muted">' + p + '% · ' + Math.floor(used / 60) + ' min ' + used % 60 + ' s</span></div><p>' + (p >= 90 ? 'Excellent. You are exam ready on these topics.' : p >= 70 ? 'Solid work. Review the questions you missed below.' : p >= 50 ? 'Getting there. Re-read the notes for your weaker topics and practise them.' : 'Keep going. Start with the notes and worked examples for the topics below, then practise.') + '</p><div class="scroll-x"><table class="res"><tr><th>Topic</th><th>Score</th><th></th></tr>' + Object.entries(by).map(([t, [a, b]]) => '<tr><td><span class="tag">' + t + '</span> ' + TOPIC[t].name + '</td><td class="' + (a / b >= 0.7 ? 'result-good' : 'result-bad') + '">' + a + '/' + b + '</td><td><button type="button" class="btn quiet sm" data-p="' + t + '">Practise</button></td></tr>').join('') + '</table></div><div class="row"><button type="button" class="btn" id="exAgain">New exam</button>' + (weak.length ? '<button type="button" class="btn ghost" id="exWeakAgain">Exam on my weak topics (' + weak.join(', ') + ')</button>' : '') + '</div><p class="small muted">Scroll down to see every question marked, with full working.</p></div>');
      $$('[data-p]', sum).forEach(b => b.onclick = () => openPractice(b.dataset.p));
      $('#exAgain', sum).onclick = () => examInto(v);
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
const graphInto = (v) => {
  v.innerHTML = '';
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
let theoryData = null; const theoryPics = {};
const theoryInto = async (v) => {
  v.innerHTML = '';
  v.appendChild(h('<div class="view-head"><h2>Completed theory booklet</h2><p>The whole Year 8 Chemistry theory workbook, completed, page by page. <b>Normal</b> shows each completed page, <b>Minimal</b> gives short answers, <b>Extra info</b> adds explanations.</p></div>'));
  const body = h('<div class="stack"><p class="muted">Checking access…</p></div>'); v.appendChild(body);
  let st; try { st = await (await fetch('/api/unlock/theory', { credentials: 'same-origin' })).json(); } catch (e) { body.innerHTML = '<div class="fb bad">Can’t reach the server. Check your connection and try again.</div>'; return; }
  if (!st.unlocked) return lockedView(body, st.requested);
  loadTheory(body);
};
let unlockPoll = null;
function lockedView(body, requested) {
  body.innerHTML = '';
  const c = h('<div class="card stack lock-card"><span class="eyebrow">Locked</span><h3>Enter your unlock code</h3><p>Got a 6-digit code? Type it below. Each code works once, and then this account can open the completed booklet forever.</p><form class="row" id="unlockForm"><label class="sr" for="codeIn">Unlock code</label><input id="codeIn" class="ans" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="e.g. 482913" style="width:min(100%,200px);font-size:1.2rem;letter-spacing:.15em"><button class="btn" type="submit">Unlock</button></form><div id="unlockMsg"></div><div class="ask-beau stack" id="askBeau"><b>Don’t have a code? Ask Beau for one.</b><p class="small muted">Tap the button and Beau gets a notification. When Beau says yes, the booklet opens here by itself.</p><div class="row"><button type="button" class="btn" id="askBtn">🔔 Ask Beau to unlock it</button><a class="btn quiet" href="/message/?from=science">💬 Message Beau</a></div><div id="askOut" role="status"></div></div></div>');
  body.appendChild(c);
  const ask = () => {};
  const waiting = () => {
    $('#askBtn', c).disabled = true; $('#askBtn', c).textContent = '🔔 Request sent';
    $('#askOut', c).innerHTML = '<div class="fb info">Beau has been asked. You’ll see a red number on <b>💬 Chat</b> when Beau answers, and this page unlocks by itself.</div>';
    clearInterval(unlockPoll);
    unlockPoll = setInterval(async () => {
      if (!c.isConnected) { clearInterval(unlockPoll); return; }
      if (document.visibilityState !== 'visible') return;
      try { const s = await (await fetch('/api/unlock/theory', { credentials: 'same-origin' })).json(); if (s.unlocked) { clearInterval(unlockPoll); toast('Beau unlocked the booklet for you'); loadTheory(body); } else if (!s.requested) { clearInterval(unlockPoll); $('#askBtn', c).disabled = false; $('#askBtn', c).textContent = '🔔 Ask Beau to unlock it'; $('#askOut', c).innerHTML = '<div class="fb info">Beau said not yet. Check <b>💬 Chat → ✉️ Beau</b> for a reply.</div>'; } } catch (e) { /* try again */ }
    }, 15000);
  };
  if (requested) waiting();
  $('#askBtn', c).onclick = async () => {
    $('#askBtn', c).disabled = true; $('#askOut', c).innerHTML = '';
    try {
      const r = await fetch('/api/unlock/request', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' });
      const j = await r.json();
      if (j.unlocked) { loadTheory(body); return; }
      if (!r.ok) { $('#askBtn', c).disabled = false; $('#askOut', c).innerHTML = '<div class="fb bad">' + esc(j.error || 'That didn’t work.') + '</div>'; return; }
      waiting();
    } catch (e) { $('#askBtn', c).disabled = false; $('#askOut', c).innerHTML = '<div class="fb bad">Can’t reach the server. Try again.</div>'; }
  };
  $('#unlockForm', c).onsubmit = async e => {
    e.preventDefault(); const m = $('#unlockMsg', c); m.innerHTML = '';
    try {
      const r = await fetch('/api/unlock', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: $('#codeIn', c).value }) });
      const j = await r.json();
      if (!r.ok) { ask(); m.innerHTML = '<div class="fb bad">' + esc(j.error || 'That didn’t work.') + '</div>'; return; }
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
  // Normal = the picture of each completed page. Minimal = short answers to that page's questions.
  // Extra info = the picture plus extra explanation. Pages with no questions show the picture at every level.
  const PAGES = theoryData.pages || [];
  if (!PAGES.length) { body.innerHTML = '<div class="fb bad">The booklet isn’t available right now. Try again later.</div>'; return; }
  let level = store.get('theoryLevel', 'norm');
  let at = Math.max(0, PAGES.findIndex(p => String(p.n) === String(store.get('theoryPage', ''))));
  body.innerHTML = '';
  const bar = h('<div class="card row level-bar" style="justify-content:space-between"><div class="row" role="radiogroup" aria-label="Answer level"></div><select id="thJump" aria-label="Go to a page" style="max-width:100%;width:auto"></select></div>');
  const lv = $('.row', bar);
  LEVELS.forEach(([k, n]) => { const b = h('<button type="button" class="chip" role="radio" data-l="' + k + '">' + n + '</button>'); b.onclick = () => { if (level === k) return; level = k; store.set('theoryLevel', k); paint(); }; lv.appendChild(b); });
  body.appendChild(bar);
  const sel = $('#thJump', bar);
  PAGES.forEach((p, i) => { const cont = i > 0 && PAGES[i - 1].sec === p.sec; sel.appendChild(h('<option value="' + i + '">' + esc('Page ' + p.n + ' · ' + p.sec + (cont ? ' (continued)' : '')) + '</option>')); });
  sel.onchange = () => goPage(+sel.value);
  const nav = () => h('<div class="th-nav"><button type="button" class="btn quiet" data-d="-1">◀ Previous page</button><span class="th-where"></span><button type="button" class="btn quiet" data-d="1">Next page ▶</button></div>');
  const navTop = nav(), list = h('<div class="stack"></div>'), navBot = nav();
  body.append(navTop, list, navBot);
  [navTop, navBot].forEach(nb => $$('[data-d]', nb).forEach(b => b.onclick = () => goPage(at + +b.dataset.d, nb === navBot)));

  // page pictures are locked, so they're fetched with this tab's account (an <img> can't send it) and kept as blobs
  const pics = theoryPics;
  const picUrl = n => {
    if (!pics[n]) pics[n] = fetch('/api/theory/page/' + n + '?v=' + (theoryData.ver || 0), { credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error('page'); return r.blob(); })
      .then(b => URL.createObjectURL(b))
      .catch(e => { delete pics[n]; throw e; });
    return pics[n];
  };
  function picture(p) {
    const fig = h('<figure class="bk-pg' + (p.landscape ? ' land' : '') + '"><div class="bk-ph">Loading page ' + p.n + '…</div><img alt="Page ' + p.n + ' of the completed booklet: ' + esc(p.sec) + '" hidden><figcaption class="small muted">Tap the page to zoom in.</figcaption></figure>');
    const img = $('img', fig), ph = $('.bk-ph', fig);
    picUrl(p.n).then(u => { img.src = u; img.hidden = false; ph.remove(); }).catch(() => { ph.textContent = 'Couldn’t load this page. Check your connection and try again.'; });
    img.onclick = () => zoom(img.src, p);
    return fig;
  }
  function zoom(src, p) {
    if (!src) return;
    const ov = h('<div class="bk-zoom" role="dialog" aria-modal="true" aria-label="Page ' + p.n + ', zoomed in"><div class="bk-zoom-bar"><b>Page ' + p.n + '</b><span class="small">Scroll or pinch to move around</span><button type="button" class="btn sm">Close ✕</button></div><div class="bk-zoom-in"><img alt="Page ' + p.n + ' of the completed booklet"></div></div>');
    $('img', ov).src = src;
    const close = () => { ov.remove(); document.removeEventListener('keydown', key, true); };
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    $('button', ov).onclick = close; document.addEventListener('keydown', key, true);
    document.body.appendChild(ov); $('button', ov).focus();
  }
  function textPage(p, i) {
    const card = h('<section class="stack th-sec" id="th-page"></section>');
    const cont = i > 0 && PAGES[i - 1].sec === p.sec;
    card.appendChild(cont ? h('<div class="th-cont">' + esc(p.sec) + ' (continued)</div>') : h('<div class="th-head"><h3>' + esc(p.sec) + '</h3></div>'));
    p.items.forEach(it => card.appendChild(h('<div class="th-item"><div class="th-q">' + it.q + '</div><div class="th-a">' + it.a + '</div></div>')));
    card.appendChild(h('<div class="th-foot"><span>Year 8 Chemistry · Minimal answers</span><span>Page <b>' + p.n + '</b></span></div>'));
    return card;
  }
  function extraBox(p) {
    const xs = p.items.filter(it => it.x);
    if (!xs.length) return h('<p class="small muted">No extra info for this page.</p>');
    const box = h('<section class="card stack th-extra"><span class="eyebrow">Extra info for page ' + p.n + '</span></section>');
    xs.forEach(it => box.appendChild(h('<div class="th-item"><div class="th-q">' + it.q + '</div><div class="th-plus"><div>' + it.x + '</div></div></div>')));
    return box;
  }
  function goPage(n, fromBottom) {
    if (n < 0 || n >= PAGES.length || n === at) return;
    at = n; store.set('theoryPage', PAGES[n].n); paint();
    const top = navTop.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 70;
    if (fromBottom || window.scrollY > top) window.scrollTo({ top: Math.max(0, top) });
  }
  function paint() {
    const p = PAGES[at];
    $$('[data-l]', bar).forEach(b => { const on = b.dataset.l === level; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    sel.value = String(at);
    [navTop, navBot].forEach(nb => { $('[data-d="-1"]', nb).disabled = at === 0; $('[data-d="1"]', nb).disabled = at === PAGES.length - 1; $('.th-where', nb).innerHTML = '<b>Page ' + p.n + '</b> <span class="muted">(' + (at + 1) + ' of ' + PAGES.length + ')</span>'; });
    list.innerHTML = '';
    if (level === 'min' && p.items.length) list.appendChild(textPage(p, at));
    else {
      list.appendChild(picture(p));
      if (level === 'extra' && p.items.length) list.appendChild(extraBox(p));
    }
    // get the next page ready so turning the page is instant
    if (at + 1 < PAGES.length && level !== 'min') picUrl(PAGES[at + 1].n).catch(() => {});
  }
  // arrow keys turn the page (not while typing or zoomed in)
  document.addEventListener('keydown', e => {
    if (!document.body.contains(list) || list.offsetParent === null || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('.bk-zoom')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '')) return;
    if (e.key === 'ArrowRight') goPage(at + 1); else if (e.key === 'ArrowLeft') goPage(at - 1);
  });
  paint();
}


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


/* ================= TOPIC TABS (1–9): everything for one topic on one page ================= */
function topicPage(id, v) {
  const t = TOPIC[id]; const n = TOPICS.indexOf(t) + 1; const Q = QUICK[id];
  v.innerHTML = ''; planTick('read', id); state.learn = id; store.set('learnTopic', id);
  const head = h('<div class="card stack"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Topic ' + n + ' of ' + TOPICS.length + ' · Checklist section ' + n + '</span><h2>' + t.name + '</h2></div><div class="row"></div></div><div class="row topic-jump" style="gap:6px"></div></div>');
  const btns = $('.row .row', head);
  const pb = h('<button type="button" class="btn">Practise this topic</button>'); pb.onclick = () => openPractice(id); btns.appendChild(pb);
  if (t.tool) { const gb = h('<button type="button" class="btn ghost">Graph task</button>'); gb.onclick = () => openTool(); btns.appendChild(gb); }
  [['tq', 'Quick version'], ['tn', 'Notes'], ['tx', 'Examples'], ['tw', 'Key words'], ['tf', 'Flashcards'], ['tp', 'Questions'], ['tb', 'Workbook']].forEach(([k, l]) => { const c = h('<button type="button" class="chip">' + l + '</button>'); c.onclick = () => document.getElementById(k + '-' + id).scrollIntoView({ behavior: 'smooth', block: 'start' }); $('.topic-jump', head).appendChild(c); });
  v.appendChild(head);
  if (Q) v.appendChild(h('<div class="card quick stack topic-sec" id="tq-' + id + '"><span class="eyebrow">1 · The quick version</span><p class="quick-what">' + Q.what + '</p><ol class="quick-steps">' + Q.steps.map(x => '<li>' + x + '</li>').join('') + '</ol><p class="quick-eg"><b>Example:</b> ' + Q.eg + '</p></div>'));
  const notes = h('<div class="card notes topic-sec" id="tn-' + id + '"><span class="eyebrow">2 · Notes and diagrams</span></div>'); notes.insertAdjacentHTML('beforeend', t.notes()); v.appendChild(notes);
  const ex = h('<div class="card stack topic-sec" id="tx-' + id + '"><span class="eyebrow">3 · Worked examples</span><p class="small muted">Tap an example to see every step.</p></div>');
  t.ex.forEach(e => { const d = h('<details class="ex"><summary>' + e.q + '</summary></details>'); d.insertAdjacentHTML('beforeend', stepsHTML(e.s)); ex.appendChild(d); });
  if (t.mistakes) ex.insertAdjacentHTML('beforeend', '<h4 style="margin-top:6px">Watch out for</h4>' + t.mistakes.map(m => '<p class="mistake">' + m + '</p>').join(''));
  v.appendChild(ex);
  const words = GLOSS.filter(g => g[2] === id);
  const wc = h('<div class="card stack topic-sec" id="tw-' + id + '"><span class="eyebrow">4 · Key words</span><dl class="gl-list"></dl></div>');
  if (!words.length) wc.appendChild(h('<p class="muted small">No special words for this topic.</p>'));
  words.forEach(g => { const it = h('<div class="gl-item"><dt><span></span></dt><dd></dd></div>'); $('dt span', it).textContent = g[0]; $('dd', it).textContent = g[1]; $('dl', wc).appendChild(it); });
  v.appendChild(wc);
  const cards = FLASH.filter(f => f[0] === id);
  const fc = h('<div class="card stack topic-sec" id="tf-' + id + '"><span class="eyebrow">5 · Flashcards</span><p class="small muted">Tap a card to flip it.</p><div class="mini-cards"></div></div>');
  cards.forEach(c => { const b = h('<button type="button" class="mini-card"><span class="front"></span><span class="back" hidden></span></button>'); $('.front', b).innerHTML = c[1]; $('.back', b).innerHTML = c[2]; b.onclick = () => { const f = $('.front', b), k = $('.back', b); f.hidden = !f.hidden; k.hidden = !k.hidden; b.classList.toggle('flipped', !k.hidden); }; $('.mini-cards', fc).appendChild(b); });
  if (!cards.length) fc.appendChild(h('<p class="muted small">No flashcards for this topic.</p>'));
  v.appendChild(fc);
  const qc = h('<div class="card stack topic-sec" id="tp-' + id + '"><div class="row" style="justify-content:space-between"><span class="eyebrow">6 · Practice questions</span><button type="button" class="btn quiet sm">New questions</button></div><div class="stack tq-list" style="gap:16px"></div><button type="button" class="btn ghost sm" style="align-self:flex-start">Keep practising this topic in Practice →</button></div>');
  const loadQs = () => { const host = $('.tq-list', qc); host.innerHTML = ''; for (let i = 0; i < 3; i++) { const w = h('<div class="need-q"></div>'); w.appendChild(questionCard(makeQ(pick(TOPIC_GENS[id])), { num: (i + 1) + ' of 3', onAnswer: (ok, partial) => { if (!partial) record(id, ok); } }).el); host.appendChild(w); } };
  $('.row .btn', qc).onclick = loadQs; qc.lastElementChild.onclick = () => openPractice(id); loadQs(); v.appendChild(qc);
  const bq = BOOKLET.filter(q => t.bk.includes(q.id));
  const bc = h('<div class="card stack topic-sec" id="tb-' + id + '"><span class="eyebrow">7 · Workbook questions on this topic</span></div>');
  if (!bq.length) bc.appendChild(h('<p class="muted small">No workbook questions for this topic. Use the practice questions above.</p>'));
  bq.forEach(q => { const r = h('<div class="row" style="justify-content:space-between;border-top:1px dotted var(--rule);padding-top:8px"><span><b>' + q.id + '</b> ' + q.text + '</span><button type="button" class="btn quiet sm">Open in Booklet</button></div>'); $('button', r).onclick = () => openBooklet(q.id); bc.appendChild(r); });
  const cans = h('<div class="stack" style="gap:6px;margin-top:6px"><h4>Checklist: how confident are you?</h4><ul class="cans"></ul></div>');
  t.cans.forEach((c, i) => { const li = h('<li><span>I can ' + c.charAt(0).toLowerCase() + c.slice(1) + '</span></li>'); li.appendChild(confButtons(t.id + ':' + i, canStore, 'can')); $('ul', cans).appendChild(li); });
  bc.appendChild(cans); v.appendChild(bc);
  const nav = h('<div class="row" style="justify-content:space-between"></div>');
  if (n > 1) { const b = h('<button type="button" class="btn quiet">← ' + (n - 1) + '. ' + TOPICS[n - 2].name + '</button>'); b.onclick = () => go('t' + (n - 1)); nav.appendChild(b); } else nav.appendChild(h('<span></span>'));
  if (n < TOPICS.length) { const b = h('<button type="button" class="btn quiet">' + (n + 1) + '. ' + TOPICS[n].name + ' →</button>'); b.onclick = () => go('t' + (n + 1)); nav.appendChild(b); }
  v.appendChild(nav);
}
TOPICS.forEach((t, i) => { RENDER['t' + (i + 1)] = () => topicPage(t.id, $('#v-t' + (i + 1))); });

/* ================= PRACTICE tab: Mixed / One topic / Timed test ================= */
RENDER.practice = () => {
  const v = $('#v-practice'); v.innerHTML = '';
  const modes = [['mix', 'Mixed', 'Questions from all 9 topics'], ['topic', 'One topic', 'Pick a topic'], ['test', 'Timed test', 'Marked at the end, like the exam']];
  if (!state.pmode) state.pmode = 'mix';
  const bar = h('<div class="mode-bar" role="tablist" aria-label="Practice mode"></div>'); v.appendChild(bar);
  const host = h('<div class="view"></div>'); v.appendChild(host);
  const draw = () => {
    bar.innerHTML = '';
    modes.forEach(([k, l, sub]) => { const b = h('<button type="button" class="mode" role="tab"><b>' + l + '</b><span>' + sub + '</span></button>'); b.classList.toggle('on', state.pmode === k); b.setAttribute('aria-selected', state.pmode === k); b.onclick = () => { state.pmode = k; if (k === 'mix') state.practice = 'mix'; if (k === 'topic' && !TOPIC[state.practice]) state.practice = getPlan().focus; draw(); }; bar.appendChild(b); });
    if (state.pmode === 'test') examInto(host);
    else { if (state.pmode === 'mix' && TOPIC[state.practice]) state.practice = 'mix'; if (state.pmode === 'topic' && !TOPIC[state.practice]) state.practice = getPlan().focus; practiceInto(host); }
  };
  draw();
};

/* ================= BOOKLET tab: Workbook questions / Graph task / Completed booklet ================= */
RENDER.booklet = () => {
  const v = $('#v-booklet'); v.innerHTML = '';
  const modes = [['work', 'Workbook questions', 'Part 2 and mass number'], ['graph', 'Graph task', 'The salts worksheet'], ['theory', 'Completed booklet 🔒', 'Needs an unlock code']];
  if (!state.bmode) state.bmode = store.get('bookletMode', 'work');
  const bar = h('<div class="mode-bar" role="tablist" aria-label="Booklet section"></div>'); v.appendChild(bar);
  const host = h('<div class="view"></div>'); v.appendChild(host);
  const draw = () => {
    bar.innerHTML = '';
    modes.forEach(([k, l, sub]) => { const b = h('<button type="button" class="mode" role="tab"><b>' + l + '</b><span>' + sub + '</span></button>'); b.classList.toggle('on', state.bmode === k); b.setAttribute('aria-selected', state.bmode === k); b.onclick = () => { state.bmode = k; store.set('bookletMode', k); draw(); }; bar.appendChild(b); });
    if (state.bmode === 'graph') graphInto(host); else if (state.bmode === 'theory') theoryInto(host); else bookletInto(host);
  };
  draw();
};

/* ================= theme + boot ================= */
// /maths/#practice-7I (from the profile) opens Practice on that topic
const boot = () => { const pm = /^practice-([A-Za-z0-9]+)$/.exec(location.hash.slice(1)); if (pm && typeof openPractice === 'function') { openPractice(pm[1]); return; } show(location.hash.slice(1) || 'home'); };
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot); else boot();
