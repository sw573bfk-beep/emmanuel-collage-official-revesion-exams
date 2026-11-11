/* ================= "Super simple" explain mode (Science) =================
   The same switch as Maths: when it's on, every Working box starts with the idea in plain words and tiny
   steps, and the steps get more space. Saved on this device (shared with Maths). */
const SIMPLE = {
  // C1 physical and chemical change
  chgClassify: { idea: 'Ask one question: is a NEW substance made?', how: ['Yes → chemical change (like burning, rusting, cooking an egg).', 'No, it’s the same stuff in a different shape, size or state → physical change (like melting, freezing, dissolving, cutting).', 'Physical changes can usually be undone. Chemical changes are hard to undo.'] },
  chgPick: { idea: 'Look for the one where a new substance is made (chemical) or where it stays the same stuff (physical).', how: ['Melting, freezing, boiling, dissolving, tearing, crushing → physical.', 'Burning, rusting, cooking, rotting, fizzing reactions → chemical.'] },
  chgEvidence: { idea: 'Clues that a new substance has been made.', how: ['A colour change you didn’t expect.', 'Bubbles or fizzing (a gas is made).', 'It gets hotter or colder, or gives off light.', 'A solid appears in a liquid (a precipitate), or a new smell.'] },
  chgDefine: { idea: 'Physical change = same substance, new look. Chemical change = a brand new substance.', how: ['Physical: change of state, shape or size. Usually reversible.', 'Chemical: atoms rearrange to make new substances. Usually not reversible.'] },
  // C2 observing and justifying
  obsClassify: { idea: 'Use what you can see, hear, smell or measure, then say what it means.', how: ['Pick out the observation (e.g. “bubbles formed”).', 'Say what it shows (e.g. “a gas was made, so it’s a chemical change”).', 'Use “because” to link your answer to the evidence.'] },
  obsVsOpinion: { idea: 'Observation, inference or opinion?', how: ['Observation = what you directly see, hear, smell, feel or measure (“it turned blue”).', 'Inference = an explanation you work out from observations (“so a reaction happened”).', 'Opinion = what someone thinks or feels, which can’t be tested (“it looks cool”).'] },
  obsVerb: { idea: 'The first word of a question tells you what kind of answer to give.', how: ['Identify / state = name it. Describe = say what happens.', 'Explain = say how or why (use “because”). Justify = back it up with evidence.', 'Evaluate = judge how good it is. Investigate = plan and do a test.'] },
  // C3 reactants and products
  rpIdentify: { idea: 'In a word equation, the arrow means “turns into”.', how: ['Reactants = what you start with, on the LEFT of the arrow.', 'Products = what’s made, on the RIGHT of the arrow.'] },
  rpFacts: { idea: 'Reactants go in, products come out.', how: ['Reactants are used up in the reaction.', 'Products are the new substances made.', 'The atoms are the same; they’re just rearranged.'] },
  // C4 word equations
  eqConstruct: { idea: 'A word equation is the reaction written as a sentence with + and →.', how: ['Write what you start with on the left, joined with +.', 'Then the arrow → (means “react to make”).', 'Then what’s made on the right, joined with +.'] },
  eqMissing: { idea: 'Find the substance that’s missing from the sentence.', how: ['Read the story: what goes in, what comes out?', 'Check which name isn’t in the equation yet.', 'Put it on the correct side of the arrow.'] },
  eqChoose: { idea: 'Check each option against the story.', how: ['Are all the starting substances on the left?', 'Are all the new substances on the right?', 'Is anything on the wrong side of the arrow?'] },
  // C5 conservation of mass
  massClosed: { idea: 'In a sealed (closed) container, nothing gets in or out, so the total mass stays the same.', how: ['Total mass before = total mass after.', 'To find a missing mass: total − the masses you know.'] },
  massOpen: { idea: 'In an open container, gases can escape (or come in from the air), so the scale reading changes.', how: ['If a gas is made and escapes, the mass goes down.', 'Mass of gas = mass at the start − mass at the end.', 'The atoms didn’t disappear; they floated away.'] },
  massLaw: { idea: 'Atoms are never made or destroyed in a reaction. They just swap partners.', how: ['So the total mass of the products = the total mass of the reactants.', 'If the mass seems to change, something got in or out (usually a gas).'] },
  atomCount: { idea: 'Count the atoms like counting bags of lollies.', how: ['Small number AFTER a symbol = how many of that atom in one molecule (H₂O has 2 H and 1 O).', 'Big number IN FRONT = how many molecules (3H₂O = 3 molecules).', 'Multiply them: 3H₂O has 3 × 2 = 6 hydrogen atoms.'] },
  // C6 exothermic and endothermic
  tempClassify: { idea: 'Watch the thermometer.', how: ['Temperature goes UP → exothermic (energy is given out).', 'Temperature goes DOWN → endothermic (energy is taken in).'] },
  deltaT: { idea: 'ΔT just means “change in temperature”.', how: ['ΔT = final temperature − starting temperature.', 'Positive (+) → it got hotter → exothermic.', 'Negative (−) → it got colder → endothermic.'] },
  meanUnc: { idea: 'The mean is the average. The uncertainty says how spread out the results are.', how: ['Mean: add up the trials, then divide by how many trials.', 'Uncertainty: (highest − lowest) ÷ 2, and write it with ±.'] },
  energyDiagram: { idea: 'Compare the start (reactants) with the end (products).', how: ['Products LOWER than reactants → energy was released → exothermic.', 'Products HIGHER than reactants → energy was taken in → endothermic.'] },
  exoEndoFacts: { idea: 'EXO = exit (energy goes out). ENDO = enter (energy goes in).', how: ['Exothermic: gets hotter, e.g. burning, respiration.', 'Endothermic: gets colder, e.g. photosynthesis, instant cold packs.'] },
  // C7 combustion
  combEq: { idea: 'Combustion = burning = a fuel reacting with oxygen.', how: ['Fuel + oxygen → products.', 'Fuels made of carbon and hydrogen → carbon dioxide + water.', 'Carbon alone → carbon dioxide. Hydrogen alone → water.'] },
  combFacts: { idea: 'Burning is a chemical reaction with oxygen that gives out heat and light (exothermic).', how: ['Plenty of oxygen (complete combustion) → carbon dioxide and water.', 'Not enough oxygen (incomplete) → also carbon monoxide or soot.'] },
  combTriangle: { idea: 'A fire needs three things: heat, fuel and oxygen.', how: ['Take away any one and the fire goes out.', 'Water cools it (removes heat). A fire blanket smothers it (removes oxygen). Clearing bush removes fuel.'] },
  // C8 corrosion
  corrFacts: { idea: 'Corrosion is a metal slowly reacting with things around it, like oxygen and water.', how: ['Rusting is the corrosion of iron: iron + oxygen + water → hydrated iron oxide (rust).', 'Salt water makes it faster.', 'Stop it with paint, oil, plastic or a zinc coating (galvanising).'] },
  corrNails: { idea: 'Iron only rusts when it has BOTH oxygen and water.', how: ['No water (dry air) → no rust.', 'No oxygen (boiled water with oil on top) → no rust.', 'Salt water → rusts the most.'] },
  corrEq: { idea: 'Corrosion word equations: metal + oxygen (+ water) → a new substance.', how: ['Most metals: metal + oxygen → metal oxide.', 'Rusting: iron + oxygen + water → hydrated iron oxide.'] },
  // C9 exam skills
  verbs: { idea: 'The first word of a question tells you what kind of answer to give.', how: ['Identify / state = name it. Describe = say what happens.', 'Explain = say how or why (use “because”). Justify = back it up with evidence.', 'Evaluate = judge how good it is. Investigate = plan and do a test.'] },
  massNumber: { idea: 'An atom’s middle (nucleus) has protons and neutrons.', how: ['Atomic number = number of protons.', 'Mass number = protons + neutrons.', 'So neutrons = mass number − atomic number.'] },
  evidenceVsOpinion: { idea: 'A good conclusion is backed by data, not feelings.', how: ['Use the numbers or what you saw (“the temperature rose by 8 °C”).', 'Then say what it shows (“so the reaction is exothermic”).', 'Avoid “I think” or “it seems cool” with no evidence.'] }
};
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
