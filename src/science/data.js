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
