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
