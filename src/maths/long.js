/* ================= Maths: difficulty of each question type, and long-response questions ================= */
const DIFF = {
  ineqRead: 'e', ineqWords: 'm', ineqFlip: 'm', ineqNeg: 'h', ineqTest: 'e', ineqConcept: 'm',
  ineqSolve: 'm', ineqSolveGraph: 'm', ineqContext: 'h',
  eqSolve: 'e', eqWord: 'h',
  tableFill: 'e', plotRead: 'e', quadrant: 'e', isLinear: 'm',
  gradient2: 'm', gradientType: 'e', gradientGraph: 'm',
  mcRule: 'e', ruleGraph: 'm', rule2pts: 'h', xint: 'h',
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
    model: (b ? (b > 0 ? 'Subtract ' + b : 'Add ' + Math.abs(b)) + ' from both sides: −' + a + 'x ' + op + ' ' + lsg(c - b) + '. ' : '') + 'Divide both sides by −' + a + '. Because we divided by a <b>negative</b>, the sign <b>reverses</b>: <b>x ' + flip + ' ' + lsg(x0) + '</b>. On a number line: ' + (flip.length === 1 && '<>'.includes(flip) ? 'an open circle' : 'a closed (filled) circle') + ' at ' + lsg(x0) + ' with an arrow pointing ' + ('>≥'.includes(flip) ? 'right' : 'left') + '.',
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
    model: 'y-values: ' + ys.map(sgn).join(', ') + '. The points go up/down by the same amount each time (' + lsg(m) + '), so the relationship is <b>linear</b>. The line slopes <b>' + (m > 0 ? 'upwards' : 'downwards') + '</b> (gradient ' + lsg(m) + ') and crosses the y-axis at <b>(0, ' + lsg(c) + ')</b>.',
    points: ['Correct y-values: ' + ys.map(sgn).join(', '), 'Says it is linear (constant change of ' + lsg(m) + ')', 'Slopes ' + (m > 0 ? 'up' : 'down') + ' from left to right', 'Crosses the y-axis at (0, ' + lsg(c) + ')'] };
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
    model: 'm = (' + lsg(y2) + ' − ' + (y1 < 0 ? '(' + lsg(y1) + ')' : y1) + ') ÷ (' + x2 + ' − ' + (x1 < 0 ? '(' + lsg(x1) + ')' : x1) + ') = ' + lsg(y2 - y1) + ' ÷ ' + (x2 - x1) + ' = ' + lsg(m) + '. Substitute (' + lsg(x1) + ', ' + lsg(y1) + '): ' + lsg(y1) + ' = ' + lsg(m) + ' × ' + lsg(x1) + ' + c, so c = ' + lsg(c) + '. Rule: <b>' + lterm(m, c) + '</b>. Check with (' + lsg(x2) + ', ' + lsg(y2) + '): ' + lsg(m) + ' × ' + lsg(x2) + ' ' + (c >= 0 ? '+ ' + c : '− ' + Math.abs(c)) + ' = ' + lsg(y2) + ' ✓',
    points: ['Finds the gradient m = ' + lsg(m), 'Substitutes a point to find c', 'c = ' + lsg(c), 'Writes the rule ' + lterm(m, c), 'Checks with the other point'] };
});
longGen('lRuleWords', 'L4', 'h', 'Rule from a situation', () => {
  const fee = rnd(2, 10), per = pick([1.5, 2, 2.5, 3, 4, 5]), k = rnd(3, 12); const tot = fee + per * k;
  return { q: 'A taxi charges a flag fall of $' + fee + ' plus $' + fmt(per) + ' per km. Write a rule for the cost C after d km, explain what each part of the rule means, and use it to find the cost of a ' + k + ' km trip.',
    model: '<b>C = ' + fmt(per) + 'd + ' + fee + '</b>. The gradient ' + fmt(per) + ' is the cost per km; the y-intercept ' + fee + ' is the starting fee (cost at 0 km). For d = ' + k + ': C = ' + fmt(per) + ' × ' + k + ' + ' + fee + ' = <b>$' + fmt(tot) + '</b>.',
    points: ['Correct rule C = ' + fmt(per) + 'd + ' + fee, 'Explains ' + fmt(per) + ' is the cost per km (gradient)', 'Explains ' + fee + ' is the starting fee (y-intercept)', 'Correct cost for ' + k + ' km: $' + fmt(tot)] };
});
longGen('lBreakEven', 'L5', 'h', 'Compare two plans', () => {
  const a1 = rnd(10, 40), r1 = rnd(2, 6), r2_ = r1 + rnd(2, 5), a2 = a1 - (r2_ - r1) * rnd(3, 10); const x = (a1 - a2) / (r2_ - r1);
  const A = a2 < 0 ? null : a2; if (A === null) return LONG.lBreakEven.fn();
  const n = x + rnd(2, 5);
  return { q: 'Plan A costs $' + a1 + ' plus $' + r1 + ' per hour. Plan B costs $' + A + ' plus $' + r2_ + ' per hour. Write a rule for each plan, find when they cost the same, and explain which plan is cheaper for ' + n + ' hours.',
    model: 'A = ' + r1 + 'h + ' + a1 + ', B = ' + r2_ + 'h + ' + A + '. Same cost when ' + r1 + 'h + ' + a1 + ' = ' + r2_ + 'h + ' + A + ', so ' + (a1 - A) + ' = ' + (r2_ - r1) + 'h and <b>h = ' + x + '</b> hours. For ' + n + ' hours: A = $' + (r1 * n + a1) + ', B = $' + (r2_ * n + A) + ', so <b>Plan A</b> is cheaper (its hourly rate is lower, so after ' + x + ' hours it costs less).',
    points: ['Correct rules for both plans', 'Sets the rules equal to each other', 'Break-even at h = ' + x, 'Works out both costs for ' + n + ' hours', 'Concludes Plan A is cheaper, with a reason'] };
});
longGen('lTransform', '10C', 'h', 'Describe a transformation fully', () => {
  const x = rnd(1, 6), y = rnd(1, 6); const k = rnd(0, 3);
  const T = [['reflection in the y-axis', [-x, y], ['Names it a reflection', 'Gives the mirror line: the y-axis (x = 0)']], ['reflection in the x-axis', [x, -y], ['Names it a reflection', 'Gives the mirror line: the x-axis (y = 0)']], ['rotation of 180° about the origin', [-x, -y], ['Names it a rotation', 'Gives the angle 180°', 'Gives the centre: the origin (0, 0)']], ['rotation of 90° clockwise about the origin', [y, -x], ['Names it a rotation', 'Gives the angle 90° and the direction clockwise', 'Gives the centre: the origin (0, 0)']]][k];
  return { q: 'The point P(' + x + ', ' + y + ') is moved to P′(' + T[1].map(sgn).join(', ') + '). <b>Describe fully</b> the single transformation, and explain how the coordinates show it.',
    model: 'It is a <b>' + T[0] + '</b>. ' + ['(x, y) → (−x, y): the x-coordinate changes sign, so it flips across the y-axis.', '(x, y) → (x, −y): the y-coordinate changes sign, so it flips across the x-axis.', '(x, y) → (−x, −y): both coordinates change sign.', '(x, y) → (y, −x): the coordinates swap and the new y changes sign.'][k],
    points: T[2].concat(['Explains the coordinate rule using P and P′']) };
});
longGen('lTranslate', '10B', 'm', 'Describe a translation', () => {
  const x = rnd(-5, 5), y = rnd(-5, 5), a = rnd(-6, 6) || 2, b = rnd(-6, 6) || -3;
  return { q: 'Triangle ABC is translated so that A(' + lsg(x) + ', ' + lsg(y) + ') moves to A′(' + lsg(x + a) + ', ' + lsg(y + b) + '). Find the translation vector, describe it in words, and find where B(' + lsg(x + 2) + ', ' + lsg(y + 1) + ') moves to.',
    model: 'Vector = (' + lsg(x + a) + ' − ' + (x < 0 ? '(' + lsg(x) + ')' : x) + ', ' + lsg(y + b) + ' − ' + (y < 0 ? '(' + lsg(y) + ')' : y) + ') = <b>(' + lsg(a) + ', ' + lsg(b) + ')</b>: ' + Math.abs(a) + ' units ' + (a > 0 ? 'right' : 'left') + ' and ' + Math.abs(b) + ' units ' + (b > 0 ? 'up' : 'down') + '. B′ = (' + lsg(x + 2 + a) + ', ' + lsg(y + 1 + b) + ').',
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
  const x = rnd(1, 6), y = rnd(1, 6), z = rnd(1, 6), dx = rnd(-3, 3), dz = rnd(1, 3);
  return { q: 'A drone is at (' + x + ', ' + y + ', ' + z + '). Describe what each coordinate tells you. It then moves ' + Math.abs(dx) + ' units ' + (dx >= 0 ? 'in the positive' : 'in the negative') + ' x direction and rises ' + dz + ' units. Give its new position.',
    model: 'x = ' + x + ' is how far along the x-axis, y = ' + y + ' is how far along the y-axis, and z = ' + z + ' is the height (z-axis). New position: <b>(' + (x + dx) + ', ' + y + ', ' + (z + dz) + ')</b>.',
    points: ['Explains x, y as positions along the axes', 'Explains z as the height', 'New position (' + (x + dx) + ', ' + y + ', ' + (z + dz) + ')'] };
});
longGen('lRecurring', '3F', 'm', 'Terminating or recurring?', () => {
  const [n, d, term_] = pick([[3, 8, true], [7, 20, true], [2, 3, false], [5, 6, false], [9, 40, true], [4, 11, false], [7, 12, false], [13, 25, true]]);
  return { q: 'Without a calculator, decide whether <b>' + n + '/' + d + '</b> is a terminating or recurring decimal. Explain how you know, then write it as a decimal.',
    model: 'The denominator ' + d + ' has ' + (term_ ? 'only 2s and 5s as prime factors' : 'a prime factor other than 2 or 5') + ', so ' + n + '/' + d + ' is <b>' + (term_ ? 'terminating' : 'recurring') + '</b>. ' + n + ' ÷ ' + d + ' = <b>' + (n / d).toFixed(term_ ? String(n / d).split('.')[1].length : 4) + (term_ ? '' : '…') + '</b>.',
    points: ['Says ' + (term_ ? 'terminating' : 'recurring'), 'Explains using the prime factors of ' + d + ' (only 2s and 5s → terminating)', 'Correct decimal ' + (n / d).toFixed(term_ ? String(n / d).split('.')[1].length : 4) + (term_ ? '' : '…')] };
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
    model: 'Way 1: discount = ' + d + '% × ' + price + ' = $' + fmt(price * d / 100) + ', so sale price = ' + price + ' − ' + fmt(price * d / 100) + ' = <b>$' + fmt(sale) + '</b>. Way 2: pay ' + (100 - d) + '%, so ' + fmt((100 - d) / 100) + ' × ' + price + ' = $' + fmt(sale) + '. GST included = $' + fmt(sale) + ' ÷ 11 = <b>$' + fmt(r2(sale / 11, 2)) + '</b> (the price is 110%, so 10% of it is 1/11).',
    points: ['Sale price $' + fmt(sale), 'Way 1: work out the discount and subtract', 'Way 2: multiply by ' + fmt((100 - d) / 100), 'GST included ≈ $' + fmt(r2(sale / 11, 2)) + ' (divide by 11)'] };
});
longGen('lChange', '3J', 'm', 'Percentage change', () => {
  const o = pick([40, 50, 80, 120, 200, 250]), up = Math.random() < 0.5, ch = pick([10, 15, 20, 25, 30, 40]) * o / 100; const n = up ? o + ch : o - ch;
  return { q: 'A price changed from $' + o + ' to $' + fmt(n) + '. Calculate the percentage change, showing your working, and explain why you divide by $' + o + ' and not $' + fmt(n) + '.',
    model: 'Change = ' + fmt(n) + ' − ' + o + ' = ' + (up ? '' : '−') + fmt(ch) + '. % change = ' + fmt(ch) + ' ÷ ' + o + ' × 100 = <b>' + fmt(ch / o * 100) + '% ' + (up ? 'increase' : 'decrease') + '</b>. You divide by the <b>original</b> amount because the change is measured compared with where it started.',
    points: ['Change of $' + fmt(ch), 'Divides by the original ($' + o + ') and × 100', fmt(ch / o * 100) + '% ' + (up ? 'increase' : 'decrease'), 'Explains you compare with the original amount'] };
});
longGen('lReverse', '3K', 'h', 'Find the original price', () => {
  const orig = pick([40, 60, 80, 120, 150, 200]), d = pick([10, 20, 25, 30, 40]); const sale = orig * (1 - d / 100);
  return { q: 'After a ' + d + '% discount, shoes cost $' + fmt(sale) + '. Find the original price. Explain why taking ' + d + '% of $' + fmt(sale) + ' and adding it back does <b>not</b> work.',
    model: 'The sale price is ' + (100 - d) + '% of the original. 1% = ' + fmt(sale) + ' ÷ ' + (100 - d) + ' = ' + fmt(r2(sale / (100 - d), 4)) + ', so 100% = <b>$' + fmt(orig) + '</b>. Adding ' + d + '% of $' + fmt(sale) + ' gives $' + fmt(r2(sale * (1 + d / 100), 2)) + ', which is wrong because the ' + d + '% was taken off the <b>original</b> price, not the sale price.',
    points: ['Says $' + fmt(sale) + ' is ' + (100 - d) + '% of the original', 'Uses the unitary method or divides by ' + fmt((100 - d) / 100), 'Original price $' + fmt(orig), 'Explains the percentage was of the original, not the sale price'] };
});
const LONG_GENS = {};
Object.keys(LONG).forEach(id => { (LONG_GENS[LONG[id].t] = LONG_GENS[LONG[id].t] || []).push(id); });
// topics without their own long questions borrow a related one
[['7I', '7J'], ['7J', '7I'], ['L1', 'L2'], ['L4', 'L3'], ['10A', '10C'], ['10B', '10C'], ['10C', '10A'], ['10D', '10E'], ['10E', '10D'], ['10H', '10I'], ['10I', '10H'], ['3F', '3G'], ['3H', '3G'], ['3I', '3J'], ['3J', '3K'], ['3K', '3I']].forEach(([t, other]) => { LONG_GENS[t] = (LONG_GENS[t] || []).concat(LONG_GENS[other] || []); });
