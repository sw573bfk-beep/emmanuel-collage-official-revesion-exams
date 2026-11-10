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
  ['fuel', 'Turning off the gas at a stove'], ['fuel', 'Firefighters clearing a strip of bush ahead of a bushfire (a firebreak)'], ['fuel', 'Letting a candle burn until all its wax is used up'], ['fuel', 'Turning off the gas tap on a Bunsen burner'], ['fuel', 'Removing the logs from a campfire'], ['fuel', 'Letting a barbecue’s gas bottle run empty'],
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
