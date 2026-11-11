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
