/* ================= science question generators ================= */
const G = {};
function gen(id, topic, name, fn) { G[id] = { id, topic, name, fn }; }
function makeQ(id) { const g = G[id]; const q = g.fn(); q.gen = id; q.topic = g.topic; q.gname = g.name; return q; }
function mcqFrom(q, right, wrongs, sol, hint) {
  const opts = shuffle([right].concat(shuffle(wrongs).slice(0, 3)));
  return { type: 'mcq', q, choices: opts, ans: opts.indexOf(right), ansText: right, sol: Array.isArray(sol) ? sol : [sol], hint };
}
function bankQ(bank) { const [q, right, wrongs, sol] = pick(bank); return mcqFrom(q, right, wrongs, sol); }

/* ---------- reactions used across many questions ---------- */
const RX = [
  { d: 'Magnesium metal is added to hydrochloric acid. Bubbles of hydrogen gas form and magnesium chloride is left in the solution.', r: ['magnesium', 'hydrochloric acid'], p: ['magnesium chloride', 'hydrogen'], obs: ['bubbles of gas', 'the magnesium disappears', 'the test tube gets warm'] },
  { d: 'Zinc metal is added to hydrochloric acid. Bubbles of hydrogen gas are produced and zinc chloride remains in the solution.', r: ['zinc', 'hydrochloric acid'], p: ['zinc chloride', 'hydrogen'], obs: ['bubbles of gas', 'the zinc slowly disappears'] },
  { d: 'Sodium sulfate solution and barium chloride solution react to form solid barium sulfate and sodium chloride, which stays dissolved.', r: ['sodium sulfate', 'barium chloride'], p: ['barium sulfate', 'sodium chloride'], obs: ['a white precipitate forms'] },
  { d: 'Steel wool (iron) is placed in copper sulfate solution. It forms iron sulfate solution and copper metal.', r: ['iron', 'copper sulfate'], p: ['iron sulfate', 'copper'], obs: ['a brown-red coating forms on the steel wool', 'the blue solution fades'] },
  { d: 'Copper carbonate is heated. It breaks down to form copper oxide and carbon dioxide.', r: ['copper carbonate'], p: ['copper oxide', 'carbon dioxide'], obs: ['the green powder turns black', 'a gas is given off'] },
  { d: 'Magnesium ribbon is burned in oxygen. It gives a bright white light and forms a white powder called magnesium oxide.', r: ['magnesium', 'oxygen'], p: ['magnesium oxide'], obs: ['a bright white light', 'a white powder forms', 'heat is released'] },
  { d: 'Methane (natural gas) burns in oxygen to form carbon dioxide and water.', r: ['methane', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a blue flame', 'heat is released'] },
  { d: 'Iron reacts with oxygen to form iron oxide (rust).', r: ['iron', 'oxygen'], p: [['iron oxide', 'rust', 'hydrated iron oxide']], obs: ['an orange-brown flaky coating forms'] },
  { d: 'Hydrogen gas reacts with oxygen gas to form water.', r: ['hydrogen', 'oxygen'], p: ['water'], obs: ['a squeaky pop', 'droplets of liquid form'] },
  { d: 'Calcium carbonate (marble chips) reacts with hydrochloric acid to form calcium chloride, water and carbon dioxide.', r: ['calcium carbonate', 'hydrochloric acid'], p: ['calcium chloride', 'water', 'carbon dioxide'], obs: ['fizzing', 'the marble chips get smaller'] },
  { d: 'Sodium hydroxide reacts with hydrochloric acid to form sodium chloride and water.', r: ['sodium hydroxide', 'hydrochloric acid'], p: ['sodium chloride', 'water'], obs: ['the mixture gets warmer'] },
  { d: 'Silver nitrate solution is added to sodium chloride solution. Solid silver chloride forms, and sodium nitrate stays in solution.', r: ['silver nitrate', 'sodium chloride'], p: ['silver chloride', 'sodium nitrate'], obs: ['a white precipitate forms'] },
  { d: 'Lead nitrate solution is mixed with potassium iodide solution. Bright yellow lead iodide and potassium nitrate form.', r: ['lead nitrate', 'potassium iodide'], p: ['lead iodide', 'potassium nitrate'], obs: ['a bright yellow precipitate forms'] },
  { d: 'Zinc is placed in copper sulfate solution. It forms zinc sulfate and copper.', r: ['zinc', 'copper sulfate'], p: ['zinc sulfate', 'copper'], obs: ['the blue colour fades', 'a brown solid forms', 'the solution warms up'] },
  { d: 'Hydrogen peroxide breaks down to form water and oxygen gas.', r: ['hydrogen peroxide'], p: ['water', 'oxygen'], obs: ['bubbles of gas', 'a glowing splint relights'] },
  { d: 'Carbon (charcoal) burns in oxygen to form carbon dioxide.', r: ['carbon', 'oxygen'], p: ['carbon dioxide'], obs: ['glowing', 'heat is released'] },
  { d: 'Copper is heated in air and reacts with oxygen to form copper oxide.', r: ['copper', 'oxygen'], p: ['copper oxide'], obs: ['the shiny copper turns black'] },
  { d: 'Propane (barbecue gas) burns in oxygen to form carbon dioxide and water.', r: ['propane', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['a flame', 'heat is released'] },
  { d: 'Glucose reacts with oxygen in your cells (respiration) to form carbon dioxide and water.', r: ['glucose', 'oxygen'], p: ['carbon dioxide', 'water'], obs: ['energy is released'] },
  { d: 'Candle wax burns in oxygen to form carbon dioxide and water vapour.', r: [['wax', 'candle wax', 'paraffin wax']], p: ['carbon dioxide', 'water'], obs: ['a flame', 'light and heat', 'the wax gets used up'] }
];
RX.forEach(x => { if (x.r.length === 1 && Array.isArray(x.r[0])) { x.r = [x.r[0], 'oxygen']; } });
const first = t => Array.isArray(t) ? t[0] : t;

/* ---------- C1 physical and chemical changes ---------- */
const CHANGES = [
  ['melting chocolate', 'P'], ['toasting bread', 'C'], ['burning a candle', 'C'], ['a light bulb glowing', 'P'], ['dissolving salt in water', 'P'], ['burning wood', 'C'], ['baking chicken', 'C'], ['boiling water', 'P'],
  ['water evaporating from a river', 'P'], ['condensation on a window', 'P'], ['cutting paper', 'P'], ['milk turning sour', 'C'], ['breaking glass', 'P'], ['using a battery', 'C'], ['photosynthesis', 'C'], ['digesting food', 'C'],
  ['an iron nail rusting', 'C'], ['ice melting', 'P'], ['frying an egg', 'C'], ['crushing a can', 'P'], ['mixing sand and water', 'P'], ['fireworks exploding', 'C'], ['baking a cake', 'C'], ['freezing juice into an ice block', 'P'],
  ['sharpening a pencil', 'P'], ['fruit rotting', 'C'], ['tearing paper', 'P'], ['dissolving sugar in tea', 'P'], ['an antacid tablet fizzing in water', 'C'], ['mixing vinegar and baking soda', 'C'], ['bending a wire', 'P'], ['a silver spoon tarnishing', 'C'],
  ['grinding coffee beans', 'P'], ['whipping cream', 'P'], ['striking a match', 'C'], ['a bicycle chain going rusty', 'C'], ['melting butter', 'P'], ['cooking a pancake', 'C'], ['stretching a rubber band', 'P'], ['leaves changing colour in autumn', 'C']
];
gen('chgClassify', 'C1', 'Physical or chemical change?', () => {
  const [c, k] = pick(CHANGES); const chem = k === 'C';
  return { type: 'mcq', q: 'Is <b>' + c + '</b> a physical change or a chemical change?', choices: ['Physical change', 'Chemical change'], ans: chem ? 1 : 0, ansText: chem ? 'Chemical change' : 'Physical change',
    hint: 'Ask: is a new substance made? If yes, it is chemical.', sol: [chem ? 'A <b>new substance</b> is made, so it is a <b>chemical change</b>. It usually can’t be reversed.' : 'No new substance is made; it is the same substance in a different form, shape or state. It is a <b>physical change</b> and can usually be reversed.'] };
});
const EVIDENCE = ['bubbles of gas are produced', 'the colour changes', 'a precipitate (solid) forms in a liquid', 'the temperature goes up or down', 'a new smell is produced', 'light or a flame is given off'];
const NOT_EVIDENCE = ['the shape changes', 'the substance melts', 'the substance dissolves', 'the substance is cut into pieces', 'the substance changes state', 'water evaporates'];
gen('chgEvidence', 'C1', 'Evidence of a chemical change', () => {
  if (Math.random() < 0.5) return mcqFrom('Which observation is <b>evidence of a chemical change</b>?', pick(EVIDENCE), NOT_EVIDENCE, 'Evidence of a chemical change: gas produced, colour change, precipitate, temperature change, new smell, or light. Changes of shape or state, dissolving and melting are physical.');
  return mcqFrom('Which observation is <b>not</b> evidence of a chemical change?', pick(NOT_EVIDENCE), EVIDENCE, 'Melting, dissolving, cutting and changes of shape or state make no new substance, so they are physical changes.');
});
gen('chgDefine', 'C1', 'Physical and chemical change facts', () => bankQ([
  ['A <b>chemical change</b> is a change where…', 'one or more new substances are produced', ['no new substance is produced', 'only the shape changes', 'the substance changes state'], 'A chemical change always produces at least one new substance.'],
  ['A <b>physical change</b> is a change where…', 'no new substance is produced', ['a new substance is produced', 'atoms are destroyed', 'a precipitate forms'], 'In a physical change the substance stays the same; only its form, shape or state changes.'],
  ['What is the only way to be <b>certain</b> a chemical change has happened?', 'A new substance has been formed', ['The temperature changed', 'Bubbles appeared', 'The colour changed'], 'Clues like bubbles or colour change are evidence, but only a new substance proves it. (Boiling water also makes bubbles, for example.)'],
  ['Melting ice is a physical change because…', 'it is still water, just in a different state', ['heat is needed', 'it can’t be reversed', 'a new substance forms'], 'Ice and liquid water are the same substance (H₂O).'],
  ['Which is usually <b>easy to reverse</b>?', 'A physical change', ['A chemical change', 'Burning', 'Rusting'], 'Physical changes are usually reversible (freeze it again, evaporate the water). Chemical changes usually aren’t.']
]));

/* ---------- C2 observing, analysing and justifying ---------- */
const SCEN = [
  { what: 'Students added a piece of magnesium to hydrochloric acid.', obs: 'bubbles formed, the magnesium got smaller, and the temperature rose from 21 °C to 29 °C', k: 'C', just: 'Chemical: gas bubbles were produced and the temperature rose by 8 °C, which shows a new substance (hydrogen gas) formed.' },
  { what: 'Students heated a beaker of ice.', obs: 'the ice turned to liquid water and the temperature stayed at 0 °C while it melted', k: 'P', just: 'Physical: the ice only changed state to liquid water; no new substance formed and it can be frozen again.' },
  { what: 'Students mixed two clear, colourless solutions.', obs: 'a white solid appeared and slowly sank to the bottom', k: 'C', just: 'Chemical: a white precipitate formed, which is a new solid substance.' },
  { what: 'Students stirred salt into water.', obs: 'the salt crystals disappeared and the water stayed clear', k: 'P', just: 'Physical: the salt dissolved but is still salt; evaporating the water would get it back.' },
  { what: 'Students heated green copper carbonate powder.', obs: 'the powder turned black and a gas was given off that turned limewater cloudy', k: 'C', just: 'Chemical: the colour changed from green to black and a gas (carbon dioxide) was produced, so new substances formed.' },
  { what: 'Students dissolved ammonium nitrate in water.', obs: 'the beaker felt cold and the temperature fell from 22 °C to 14 °C', k: 'C', just: 'Chemical (as treated in this unit): the temperature fell by 8 °C, showing energy was absorbed (endothermic).' },
  { what: 'Students crushed a sugar cube.', obs: 'it turned into small white grains that still tasted sweet', k: 'P', just: 'Physical: only the size and shape changed; it is still sugar.' },
  { what: 'Students left an iron nail in salty water for a week.', obs: 'an orange-brown flaky coating formed on the nail', k: 'C', just: 'Chemical: a new orange-brown substance (rust, iron oxide) formed and the colour changed.' }
];
gen('obsClassify', 'C2', 'Analyse observations and justify', () => {
  const s = pick(SCEN); const others = SCEN.filter(x => x !== s);
  const wrong = [(s.k === 'C' ? 'Physical' : 'Chemical') + ': ' + pick(['it looked different afterwards.', 'something happened to it.', 'it was mixed with something.']), 'Chemical: because it is science.', pick(others).just];
  return mcqFrom(s.what + ' They observed that <b>' + s.obs + '</b>. Which answer correctly classifies the change <b>and</b> justifies it with evidence?', s.just, wrong, ['A good justification names the type of change and uses the specific observations (with numbers if you have them) as evidence.', s.just]);
});
gen('obsVsOpinion', 'C2', 'Observation or opinion?', () => bankQ([
  ['Which is a <b>scientific observation</b>?', 'The solution turned from blue to colourless.', ['The reaction was really cool.', 'I think it was a chemical change.', 'It probably made a gas.'], 'An observation is something you can see, hear, smell, feel or measure. Opinions and guesses are not observations.'],
  ['Which is the most <b>useful, relevant</b> observation for deciding if a chemical change happened?', 'Bubbles of gas formed and the temperature rose by 6 °C.', ['The beaker was 250 mL.', 'We used a blue spatula.', 'It happened on Tuesday.'], 'Relevant observations are evidence about the change itself (gas, temperature, colour, precipitate, smell).'],
  ['Which observation is <b>recorded accurately</b>?', 'The temperature rose from 21.0 °C to 35.2 °C in 90 seconds.', ['It got a bit hot.', 'The temperature went up heaps.', 'It was warm.'], 'Accurate records include measurements and units.'],
  ['Which statement is an <b>inference</b>, not an observation?', 'A new substance must have formed.', ['Bubbles appeared.', 'The liquid turned yellow.', 'The temperature dropped to 15 °C.'], 'An inference is a conclusion you draw from observations; the others are things you directly saw or measured.']
]));
gen('obsVerb', 'C2', 'What does the question want?', () => bankQ([
  ['A question says <b>“Justify your answer.”</b> What should you do?', 'Give your answer and back it up with specific evidence', ['Just give the answer', 'Draw a diagram', 'Write the definition only'], 'Justify = support your answer with evidence or reasons.'],
  ['A question says <b>“Analyse the observations.”</b> What should you do?', 'Break the observations down and explain what each one shows', ['Copy the observations out', 'Guess the answer', 'Draw the equipment'], 'Analyse = examine the parts and explain what they mean.'],
  ['A question says <b>“Distinguish between physical and chemical change.”</b> What should you do?', 'Explain the difference between them', ['Give one example of each only', 'Define only chemical change', 'List the equipment'], 'Distinguish = show how they are different.']
]));

/* ---------- C3 reactants and products ---------- */
gen('rpIdentify', 'C3', 'Identify reactants or products', () => {
  const x = pick(RX); const askR = Math.random() < 0.5; const list = askR ? x.r : x.p;
  return { type: 'set', q: 'Look at this word equation:<div class="eqbox">' + eqText(x.r, x.p) + '</div>List the <b>' + (askR ? 'reactants' : 'products') + '</b>, separated by commas.', ans: list, ansText: list.map(first).join(', '),
    hint: 'Reactants are before the arrow. Products are after the arrow.', sol: ['Reactants (before the arrow): <b>' + x.r.map(first).join(', ') + '</b>.', 'Products (after the arrow): <b>' + x.p.map(first).join(', ') + '</b>.'] };
});
gen('rpFacts', 'C3', 'Reactant and product facts', () => bankQ([
  ['A <b>reactant</b> is…', 'a substance you start with in a chemical reaction', ['a substance made in a chemical reaction', 'the arrow in an equation', 'a type of energy'], 'Reactants are the starting substances; they get used up.'],
  ['A <b>product</b> is…', 'a new substance made in a chemical reaction', ['a substance you start with', 'the container the reaction happens in', 'a type of physical change'], 'Products are the new substances formed.'],
  ['In a word equation, the reactants are written…', 'on the left, before the arrow', ['on the right, after the arrow', 'above the arrow', 'anywhere'], 'Reactants → products.'],
  ['In a word equation, the products are written…', 'on the right, after the arrow', ['on the left, before the arrow', 'under the arrow', 'in brackets'], 'Reactants → products.'],
  ['What does the arrow <b>→</b> mean in a word equation?', 'reacts to form / produces', ['equals', 'is the same as', 'plus'], 'Read “→” as “react to form”.']
]));

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
  const x = pick(RX.filter(y => y.p.length >= 1 && y.r.length >= 2)); const right = eqText(x.r, x.p);
  const wrongs = [eqText(x.p, x.r), eqText([x.r[0]], x.p.concat([first(x.r[1])])), eqText(x.r, [first(x.p[0]) === 'water' ? 'hydrogen' : 'water'].concat(x.p.slice(1)))];
  return mcqFrom(x.d + ' Which word equation is correct?', right, wrongs.filter(w => w !== right), ['Reactants (what you start with) go on the left; products (what is made) go on the right.', right]);
});

/* ---------- C5 conservation of mass ---------- */
gen('massClosed', 'C5', 'Find the missing mass (closed system)', () => {
  const x = pick(RX.filter(y => y.r.length + y.p.length >= 3));
  const rm = x.r.map(() => r2(rnd(20, 150) / 10, 1)); const total = r2(rm.reduce((a, b) => a + b, 0), 1);
  const pm = x.p.map(() => 0); let left = total; for (let i = 0; i < pm.length - 1; i++) { pm[i] = r2(left * (rnd(30, 70) / 100), 1); left = r2(left - pm[i], 1); } pm[pm.length - 1] = r2(left, 1);
  const all = x.r.map((t, i) => ['r', i, rm[i]]).concat(x.p.map((t, i) => ['p', i, pm[i]])); const [side, mi, mv] = pick(all);
  const lab = (arr, ms, s) => arr.map((t, k) => first(t) + ' (' + ((s === side && k === mi) ? '<b>? g</b>' : fmt(ms[k]) + ' g') + ')').join(' + ');
  return { type: 'num', q: 'This reaction happens in a <b>sealed (closed) container</b>:<div class="eqbox">' + lab(x.r, rm, 'r') + ' → ' + lab(x.p, pm, 'p') + '</div>Find the missing mass in grams.', ans: mv, tol: 0.051, ansText: fmt(mv) + ' g',
    hint: 'In a closed system, total mass of reactants = total mass of products.', sol: ['Law of conservation of mass: mass of reactants = mass of products.', 'Total mass = ' + fmt(total) + ' g.', 'Missing mass = ' + fmt(total) + ' − ' + fmt(r2(total - mv, 1)) + ' = <b>' + fmt(mv) + ' g</b>'] };
});
gen('massOpen', 'C5', 'Open system: where did the mass go?', () => {
  const start = r2(rnd(800, 1600) / 10, 1), gas = r2(rnd(5, 40) / 10, 1), end = r2(start - gas, 1); const acid = pick(['marble chips (calcium carbonate) and hydrochloric acid', 'magnesium and hydrochloric acid', 'baking soda and vinegar']);
  if (Math.random() < 0.5) return { type: 'num', q: 'A beaker of ' + acid + ' has a mass of ' + fmt(start) + ' g at the start. The beaker is <b>open</b>. After the reaction, its mass is ' + fmt(end) + ' g. What mass of gas escaped?', ans: gas, tol: 0.051, ansText: fmt(gas) + ' g', sol: ['The mass that seems to disappear is the gas that escaped into the air.', fmt(start) + ' − ' + fmt(end) + ' = <b>' + fmt(gas) + ' g</b>'] };
  return mcqFrom('A beaker of ' + acid + ' is weighed while it reacts in an <b>open</b> beaker. The mass goes down from ' + fmt(start) + ' g to ' + fmt(end) + ' g. Why?', 'A gas was produced and escaped into the air', ['Atoms were destroyed in the reaction', 'Mass is not conserved in chemical reactions', 'The liquid got lighter when it got warm'], ['Mass is always conserved. In an open system, a gas product escapes, so the scale reading drops. In a sealed (closed) system the mass would stay the same.']);
});
gen('massLaw', 'C5', 'Law of conservation of mass', () => bankQ([
  ['The <b>law of conservation of mass</b> says…', 'mass is not created or destroyed in a chemical reaction', ['mass always increases in a reaction', 'mass is lost as heat', 'products are always lighter'], 'Total mass of reactants = total mass of products (in a closed system).'],
  ['During a chemical reaction, atoms are…', 'rearranged to make new substances', ['destroyed', 'created', 'turned into energy'], 'Atoms are not created or destroyed; they just join up in new ways.'],
  ['How could you <b>demonstrate</b> conservation of mass in an experiment?', 'React the chemicals in a sealed container and weigh it before and after', ['Weigh only the products', 'Use an open beaker and watch the bubbles', 'Measure the temperature'], 'A sealed (closed) container stops gas escaping, so the mass before and after should be equal.'],
  ['Why do the reactants and products have the same mass in a <b>closed system</b>?', 'The same atoms are there before and after, just rearranged', ['Energy has mass', 'The container adds mass', 'Gases have no mass'], 'Same atoms → same total mass.'],
  ['A closed system is one where…', 'nothing can get in or out, including gases', ['the lid is off', 'it is open to the air', 'only liquids are used'], 'Sealing it stops gases escaping, so you can see that mass is conserved.']
]));
const FORMULA_EQ = [
  ['2H₂ + O₂ → 2H₂O', { H: [4, 4], O: [2, 2] }], ['C + O₂ → CO₂', { C: [1, 1], O: [2, 2] }], ['2Mg + O₂ → 2MgO', { Mg: [2, 2], O: [2, 2] }], ['CH₄ + 2O₂ → CO₂ + 2H₂O', { C: [1, 1], H: [4, 4], O: [4, 4] }],
  ['Mg + 2HCl → MgCl₂ + H₂', { Mg: [1, 1], H: [2, 2], Cl: [2, 2] }], ['3H₂ + N₂ → 2NH₃', { H: [6, 6], N: [2, 2] }], ['CuCO₃ → CuO + CO₂', { Cu: [1, 1], C: [1, 1], O: [3, 3] }], ['C + 2Cl₂ → CCl₄', { C: [1, 1], Cl: [4, 4] }]
];
gen('atomCount', 'C5', 'Count the atoms', () => {
  const [eq, counts] = pick(FORMULA_EQ); const el = pick(Object.keys(counts)); const n = counts[el][0];
  return { type: 'num', q: 'In the balanced equation <b>' + eq + '</b>, how many <b>' + el + '</b> atoms are there on the reactant side?', ans: n, ansText: String(n), hint: 'Big number in front = number of molecules. Small number after a symbol = atoms in each molecule. Multiply them.',
    sol: [el + ' atoms on the left: ' + n + '. On the right: ' + counts[el][1] + '.', 'The numbers match because atoms are only rearranged, never created or destroyed. That is why mass is conserved.'] };
});

/* ---------- C6 exothermic and endothermic ---------- */
gen('tempClassify', 'C6', 'Classify from temperature data', () => {
  const start = rnd(19, 23); const exo = Math.random() < 0.5; const dT = rnd(4, 15); const end = exo ? start + dT : start - dT;
  const thing = pick(['dissolved a salt in water', 'mixed two solutions', 'added a powder to water', 'reacted a metal with an acid']);
  return { type: 'mcq', q: 'Students ' + thing + '. The temperature went from <b>' + start + ' °C</b> to <b>' + end + ' °C</b>. Classify the reaction.', choices: ['Exothermic', 'Endothermic'], ans: exo ? 0 : 1, ansText: exo ? 'Exothermic' : 'Endothermic',
    hint: 'Temperature up = exothermic (energy out). Temperature down = endothermic (energy in).', sol: [(exo ? 'The temperature increased by ' : 'The temperature decreased by ') + dT + ' °C.', exo ? '<b>Exothermic</b>: energy was released to the surroundings, so they got hotter.' : '<b>Endothermic</b>: energy was absorbed from the surroundings, so they got colder.'] };
});
gen('deltaT', 'C6', 'Calculate the temperature change (ΔT)', () => {
  const start = r2(rnd(190, 230) / 10, 1); const exo = Math.random() < 0.5; const ext = r2(exo ? start + rnd(30, 160) / 10 : start - rnd(30, 100) / 10, 1); const d = r2(ext - start, 1);
  return { type: 'num', signed: true, q: 'A reaction starts at <b>' + fmt(start) + ' °C</b> and reaches a ' + (exo ? 'maximum' : 'minimum') + ' of <b>' + fmt(ext) + ' °C</b>. Calculate the temperature change, ΔT. (Use a minus sign for a decrease.)', ans: d, tol: 0.051, ansText: (d > 0 ? '+' : '') + fmt(d) + ' °C',
    hint: 'ΔT = final temperature − starting temperature.', sol: ['ΔT = ' + fmt(ext) + ' − ' + fmt(start) + ' = <b>' + (d > 0 ? '+' : '') + fmt(d) + ' °C</b>', d > 0 ? 'Positive: the temperature rose, so it is exothermic.' : 'Negative: the temperature fell, so it is endothermic.'] };
});
gen('meanUnc', 'C6', 'Mean and uncertainty of trials', () => {
  const base = rnd(120, 380) / 10; const t = [0, 0, 0].map(() => r2(base + rnd(-12, 12) / 10, 1)); const mean = (t[0] + t[1] + t[2]) / 3; const unc = (Math.max(...t) - Math.min(...t)) / 2;
  if (Math.random() < 0.5) return { type: 'num', q: 'Three trials gave temperatures of <b>' + t.map(fmt).join(' °C, ') + ' °C</b>. Calculate the mean (1 decimal place).', ans: r2(mean, 1), tol: 0.051, ansText: fmt(r2(mean, 1)) + ' °C', sol: ['Mean = (' + t.map(fmt).join(' + ') + ') ÷ 3', '= ' + fmt(r2(t[0] + t[1] + t[2], 1)) + ' ÷ 3 = <b>' + fmt(r2(mean, 1)) + ' °C</b>'] };
  return { type: 'num', q: 'Three trials gave temperatures of <b>' + t.map(fmt).join(' °C, ') + ' °C</b>. Calculate the uncertainty. (Uncertainty = (highest − lowest) ÷ 2)', ans: r2(unc, 2), tol: 0.051, ansText: '± ' + fmt(r2(unc, 2)) + ' °C', sol: ['Highest = ' + fmt(Math.max(...t)) + ', lowest = ' + fmt(Math.min(...t)) + '.', '(' + fmt(Math.max(...t)) + ' − ' + fmt(Math.min(...t)) + ') ÷ 2 = <b>± ' + fmt(r2(unc, 2)) + ' °C</b>'] };
});
gen('energyDiagram', 'C6', 'Read an energy diagram', () => {
  const exo = Math.random() < 0.5;
  return { type: 'mcq', q: 'Is this reaction exothermic or endothermic?', fig: energySVG(exo ? 'exo' : 'endo', false), choices: ['Exothermic', 'Endothermic'], ans: exo ? 0 : 1, ansText: exo ? 'Exothermic' : 'Endothermic',
    hint: 'Compare the energy at the start (reactants, left) with the end (products, right).', sol: [exo ? 'The products have <b>less</b> energy than the reactants, so energy was <b>released</b>: exothermic.' : 'The products have <b>more</b> energy than the reactants, so energy was <b>absorbed</b>: endothermic.', energySVG(exo ? 'exo' : 'endo')] };
});
gen('exoEndoFacts', 'C6', 'Exothermic and endothermic facts', () => bankQ([
  ['An <b>exothermic</b> reaction…', 'releases energy to the surroundings', ['absorbs energy from the surroundings', 'has no energy change', 'only happens in fridges'], 'Exo = exit: energy goes out, so the surroundings get warmer.'],
  ['An <b>endothermic</b> reaction…', 'absorbs energy from the surroundings', ['releases energy to the surroundings', 'always makes a flame', 'creates new atoms'], 'Endo = enter: energy goes in, so the surroundings get colder.'],
  ['Which is an <b>exothermic</b> reaction?', 'Burning wood', ['Photosynthesis', 'An instant cold pack', 'Cooking an egg'], 'Combustion releases heat and light.'],
  ['Which is an <b>endothermic</b> process?', 'An instant cold pack working', ['A hand warmer working', 'Burning gas', 'Respiration'], 'Cold packs absorb heat from your skin.'],
  ['The temperature of a reaction mixture <b>drops</b>. This is evidence that the reaction is…', 'endothermic', ['exothermic', 'physical', 'combustion'], 'It took in energy from the surroundings, so the temperature fell.'],
  ['Photosynthesis needs energy from sunlight. It is…', 'endothermic', ['exothermic', 'a physical change', 'combustion'], 'It absorbs light energy.']
]));

/* ---------- C7 combustion ---------- */
const FUELS = [['methane', ['methane', 'natural gas']], ['propane', ['propane']], ['butane', ['butane']], ['candle wax', ['wax', 'candle wax', 'paraffin wax']], ['petrol (octane)', ['petrol', 'octane']], ['ethanol', ['ethanol']], ['natural gas', ['natural gas', 'methane']]];
gen('combEq', 'C7', 'Combustion word equation', () => {
  const [name, alts] = pick(FUELS);
  return { type: 'eq', q: '<b>' + name.charAt(0).toUpperCase() + name.slice(1) + '</b> burns completely in plenty of oxygen. Write the word equation for this combustion reaction.', ans: { r: [alts, 'oxygen'], p: ['carbon dioxide', 'water'] }, ansText: alts[0] + ' + oxygen → carbon dioxide + water',
    hint: 'Fuel + oxygen → carbon dioxide + water (for fuels made of carbon and hydrogen).', sol: ['Complete combustion of a fuel containing carbon and hydrogen:', '<b>' + alts[0] + ' + oxygen → carbon dioxide + water</b>', 'Energy is released as heat and light (exothermic).'] };
});
gen('combFacts', 'C7', 'Combustion facts', () => bankQ([
  ['<b>Combustion</b> is…', 'a reaction where a substance reacts with oxygen and releases energy as heat and light', ['a reaction that absorbs heat', 'when a metal rusts slowly', 'a physical change'], 'Combustion = burning: fuel + oxygen → products + energy.'],
  ['Which three things are needed for combustion?', 'Fuel, oxygen and heat (ignition energy)', ['Fuel, water and light', 'Oxygen, carbon dioxide and heat', 'Fuel, nitrogen and cold'], 'This is the fire triangle. Remove any one and the fire goes out.'],
  ['Why do you need a match to light a gas stove?', 'It provides ignition energy to start the reaction', ['It provides the fuel', 'It provides the oxygen', 'It cools the gas'], 'The ignition energy (heat) starts combustion; after that, the reaction releases enough energy to keep itself going.'],
  ['Putting a lid on a burning pan of oil puts the fire out because…', 'it stops oxygen getting to the fuel', ['it removes the fuel', 'it adds heat', 'it adds water'], 'No oxygen, no combustion.'],
  ['Combustion reactions are usually…', 'exothermic', ['endothermic', 'physical changes', 'reversible'], 'They release heat and light energy.'],
  ['When there is <b>not enough oxygen</b> (incomplete combustion), a fuel can produce…', 'carbon monoxide and soot (carbon) as well as water', ['only oxygen', 'only carbon dioxide', 'iron oxide'], 'This is why the yellow part of a candle flame is sooty.']
]));
gen('combTriangle', 'C7', 'The fire triangle', () => {
  const remove = pick([['fuel', 'Turning off the gas at a stove'], ['oxygen', 'Smothering a fire with a fire blanket'], ['heat', 'Spraying water on burning wood']]);
  return { type: 'mcq', q: remove[1] + ' puts the fire out. Which part of the fire triangle does it remove?', fig: fireTriangleSVG(), choices: ['Fuel', 'Oxygen', 'Heat'], ans: ['fuel', 'oxygen', 'heat'].indexOf(remove[0]), ansText: remove[0], sol: ['It removes the <b>' + remove[0] + '</b>. Without all three (fuel, oxygen, heat), combustion stops.'] };
});

/* ---------- C8 corrosion ---------- */
gen('corrFacts', 'C8', 'Corrosion facts', () => bankQ([
  ['<b>Corrosion</b> is…', 'a chemical reaction where a metal is slowly eaten away by substances around it', ['a metal melting', 'a physical change to a metal', 'polishing a metal'], 'Substances like oxygen and water react with the metal and damage it.'],
  ['Rusting is a <b>chemical</b> change because…', 'a new substance (iron oxide) forms', ['the iron changes shape', 'it happens slowly', 'it can be reversed easily'], 'Iron turns into a new orange-brown substance, iron oxide.'],
  ['Which two things are needed for iron to rust?', 'Oxygen and water', ['Oxygen and salt', 'Water and heat', 'Carbon dioxide and light'], 'Salt and warmth speed it up, but oxygen and water are needed.'],
  ['Which is an example of corrosion?', 'An iron gate rusting', ['Ice melting', 'Wood burning', 'Salt dissolving'], 'Rusting is the corrosion of iron.'],
  ['Which helps <b>prevent</b> rusting?', 'Painting or oiling the iron', ['Leaving it in salty water', 'Scratching the surface', 'Keeping it wet'], 'A coating keeps oxygen and water away from the iron.'],
  ['Why does a car rust faster near the beach?', 'Salt water speeds up corrosion', ['There is less oxygen at the beach', 'Sand protects the metal', 'It is colder'], 'Salt and moisture make iron corrode faster.']
]));
gen('corrNails', 'C8', 'Which nail rusts most?', () => {
  const tubes = [['A', 'nail in dry air (with a drying agent)', 0], ['B', 'nail in boiled water with a layer of oil on top (no oxygen)', 0], ['C', 'nail in tap water open to the air', 1], ['D', 'nail in salty water open to the air', 2]];
  const askMost = Math.random() < 0.6; const ansI = askMost ? 3 : pick([0, 1]);
  return { type: 'mcq', q: 'Four test tubes each have an iron nail:<ul>' + tubes.map(t => '<li><b>' + t[0] + ':</b> ' + t[1] + '</li>').join('') + '</ul>' + (askMost ? 'Which nail rusts the <b>most</b>?' : 'Which nail does <b>not</b> rust because it is missing ' + (ansI === 0 ? 'water' : 'oxygen') + '?'), choices: tubes.map(t => t[0]), ans: ansI, ansText: tubes[ansI][0],
    sol: ['Rusting needs <b>oxygen and water</b>. A has no water; B has no oxygen (boiling removes it, oil stops more getting in). C rusts. D rusts most because salt speeds up corrosion.'] };
});
gen('corrEq', 'C8', 'Rusting word equation', () => ({ type: 'eq', q: 'Write the word equation for iron reacting with oxygen to form rust (iron oxide).', ans: { r: ['iron', 'oxygen'], p: [['iron oxide', 'rust', 'hydrated iron oxide']] }, ansText: 'iron + oxygen → iron oxide', hint: 'Reactants: the metal and the gas. Product: the metal oxide.', sol: ['<b>iron + oxygen → iron oxide</b>', 'Water is also needed for rusting to happen; the rust that forms is hydrated iron oxide.'] }));

/* ---------- C9 mixed exam skills ---------- */
const VERBS = [
  ['Identify', 'Give the name or the correct answer'], ['Distinguish', 'Show how two things are different'], ['Observe', 'Use your senses (or instruments) to notice what happens'], ['Record', 'Write down observations or measurements accurately'],
  ['Analyse', 'Break information into parts and explain what they show'], ['Justify', 'Support your answer with evidence or reasons'], ['Construct', 'Build or put together (e.g. a graph or word equation)'], ['Demonstrate', 'Show that you can do it, or show evidence that it is true'],
  ['Classify', 'Sort into groups using a rule'], ['Define', 'Give the exact meaning of a word'], ['Explain', 'Say how or why, using reasons'], ['Describe', 'Say what something is like or what happened'], ['Compare', 'Say what is the same and what is different'], ['Calculate', 'Work out a number answer, showing working']
];
gen('verbs', 'C9', 'Cognitive verbs', () => {
  const [v, d] = pick(VERBS); const others = VERBS.filter(x => x[0] !== v);
  if (Math.random() < 0.5) return mcqFrom('What does <b>“' + v + '”</b> ask you to do?', d, others.map(x => x[1]), '<b>' + v + '</b>: ' + d + '.');
  return mcqFrom('Which verb means: <i>' + d + '</i>?', v, others.map(x => x[0]), '<b>' + v + '</b>: ' + d + '.');
});
const ELEMS = [['hydrogen', 'H', 1, 1], ['helium', 'He', 2, 4], ['lithium', 'Li', 3, 7], ['beryllium', 'Be', 4, 9], ['boron', 'B', 5, 11], ['carbon', 'C', 6, 12], ['nitrogen', 'N', 7, 14], ['oxygen', 'O', 8, 16], ['fluorine', 'F', 9, 19], ['neon', 'Ne', 10, 20],
  ['sodium', 'Na', 11, 23], ['magnesium', 'Mg', 12, 24], ['aluminium', 'Al', 13, 27], ['silicon', 'Si', 14, 28], ['phosphorus', 'P', 15, 31], ['sulfur', 'S', 16, 32], ['chlorine', 'Cl', 17, 35], ['argon', 'Ar', 18, 40], ['potassium', 'K', 19, 39], ['calcium', 'Ca', 20, 40]];
gen('massNumber', 'C9', 'Mass number calculations', () => {
  const [name, sym, Z, A] = pick(ELEMS); const N = A - Z; const k = rnd(0, 3);
  if (k === 0) return { type: 'num', q: 'An atom of ' + name + ' (' + sym + ') has atomic number <b>' + Z + '</b> and mass number <b>' + A + '</b>. How many <b>neutrons</b> does it have?', ans: N, ansText: String(N), hint: 'Neutrons = mass number − atomic number.', sol: ['N = A − Z = ' + A + ' − ' + Z + ' = <b>' + N + '</b>'] };
  if (k === 1) return { type: 'num', q: 'An atom has <b>' + Z + ' protons</b> and <b>' + N + ' neutrons</b>. What is its mass number?', ans: A, ansText: String(A), hint: 'Mass number = protons + neutrons.', sol: ['A = Z + N = ' + Z + ' + ' + N + ' = <b>' + A + '</b> (this is ' + name + ', ' + sym + ')'] };
  if (k === 2) return { type: 'num', q: 'A neutral atom has a mass number of <b>' + A + '</b> and <b>' + N + ' neutrons</b>. How many <b>electrons</b> does it have?', ans: Z, ansText: String(Z), hint: 'Protons = A − N. In a neutral atom, electrons = protons.', sol: ['Protons = ' + A + ' − ' + N + ' = ' + Z + '.', 'Neutral atom, so electrons = protons = <b>' + Z + '</b> (' + name + ')'] };
  return { type: 'num', q: 'A neutral atom of ' + name + ' has ' + Z + ' protons, ' + N + ' neutrons and ' + Z + ' electrons. How many <b>subatomic particles</b> does it have altogether?', ans: 2 * Z + N, ansText: String(2 * Z + N), sol: [Z + ' + ' + N + ' + ' + Z + ' = <b>' + (2 * Z + N) + '</b>'] };
});
gen('evidenceVsOpinion', 'C9', 'Evidence, not opinion', () => bankQ([
  ['Which conclusion uses <b>scientific evidence</b>?', 'It was exothermic because the temperature rose from 20 °C to 31 °C.', ['It was exothermic because it felt like it.', 'It was exothermic because my friend said so.', 'It was exothermic because reactions are hot.'], 'Use measurements and observations as evidence, not feelings or opinions.'],
  ['Which answer best <b>explains</b> why mass seemed to drop in an open beaker?', 'Carbon dioxide gas was produced and escaped into the air, so less mass was left on the scale.', ['Mass was destroyed.', 'It just got lighter.', 'The scale was wrong.'], 'Explain = give the reason (cause and effect) using science words.']
]));

const TOPIC_GENS = {
  C1: ['chgClassify', 'chgClassify', 'chgEvidence', 'chgDefine'],
  C2: ['obsClassify', 'obsClassify', 'obsVsOpinion', 'obsVerb'],
  C3: ['rpIdentify', 'rpIdentify', 'rpFacts'],
  C4: ['eqConstruct', 'eqConstruct', 'eqMissing', 'eqChoose'],
  C5: ['massClosed', 'massOpen', 'massLaw', 'atomCount'],
  C6: ['tempClassify', 'deltaT', 'meanUnc', 'energyDiagram', 'exoEndoFacts'],
  C7: ['combEq', 'combFacts', 'combTriangle'],
  C8: ['corrFacts', 'corrNails', 'corrEq'],
  C9: ['verbs', 'verbs', 'massNumber', 'massNumber', 'evidenceVsOpinion']
};
