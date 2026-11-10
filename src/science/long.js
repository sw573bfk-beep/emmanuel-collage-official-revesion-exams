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
