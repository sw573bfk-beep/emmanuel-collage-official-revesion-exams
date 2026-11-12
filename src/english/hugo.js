// English: The Invention of Hugo Cabret exam study pack. Served only to people who have unlocked
// English with a code (GET /api/english), so none of this is in the public page.
// Each gap has 3 example answers (ex1-3.js): short ~200, medium ~300, long ~400 words. Paragraphs are separated by blank lines.
import { EX1 } from './ex1.js';
import { EX2 } from './ex2.js';
import { EX3 } from './ex3.js';
const EXAMPLES = { ...EX1, ...EX2, ...EX3 };

export const HUGO = {
  title: 'The Invention of Hugo Cabret',
  sub: 'Exam study pack',
  // 🏠 Overview
  key: 'The story is set in Paris in the early 1930s, mostly inside the Gare Montparnasse train station, and its climax is the moment the automaton signs Georges Méliès’s name.',
  setting: [
    ['📍 Place', 'Paris, France. Most of the story happens in the Gare Montparnasse train station, where Hugo secretly lives in the walls behind the clocks. Other key places are Papa Georges’s toy booth in the station, the Georges family’s flat where Isabelle lives, the cinema, and the Film Academy library.'],
    ['🕰️ Time', 'The early 1930s, in winter. The story also flashes back to the early days of cinema, when Georges Méliès made his films.'],
    ['🌫️ Mood', 'Cold, grey and lonely at first, then warmer and more magical as secrets come out.']
  ],
  climax: [
    'Hugo’s automaton finally works with Isabelle’s heart-shaped key. It draws a picture from A Trip to the Moon and signs it “Georges Méliès”, which proves Papa Georges was the famous filmmaker.',
    'When the children find his hidden box of drawings, Papa Georges breaks down, and Mama Georges, Isabelle and Hugo bring the hidden past into the open. After the Station Inspector’s chase, the family takes Hugo in and Georges is honoured at the Film Academy.',
    'The climax is where isolation turns into family and truth, and the past is remembered again.'
  ],
  howTo: 'Each gap is marked 💭 Imagined (a moment the book doesn’t show, written from the character’s view) or 📖 In the book. Each gap has short notes, then three example answers written at Year 8 level: 📝 Short (about 200 words, simpler), 📄 Medium (about 300 words) and 📚 Long (about 400 words, the strongest).',
  checks: [
    'Chapter order and small details (like exactly when Georges is honoured) can differ in your teacher’s version, so check each 📖 In the book scene against your copy.',
    'The Station Inspector is a minor character, so his gaps are mostly imagined.',
    'Every answer must link to one of the 5 themes: Family and friends, Awe and amazement, Memory and the past, Isolation, or Truth.',
    'English on EC Revisions is not perfect and could be wrong. If something doesn’t match your book or what your teacher says, go with your book and teacher, and tell Beau.'
  ],
  // 💡 the big ideas (themes)
  themes: [
    { id: 'isolation', icon: '🧱', name: 'Isolation', idea: 'Almost everyone in the book is cut off in some way: Hugo hides in the walls, Georges hides from his past, Étienne is pushed out of the cinema, Isabelle is kept from the truth, and the Inspector is alone because of his own hard attitude.',
      points: ['Isolation can come from loss (Hugo, Étienne) or from choices and shame (Georges, the Inspector).', 'You can be isolated without being alone: Isabelle lives with her godparents but is shut out of the family’s story.', 'Selznick shows it with empty spaces, silence and the crowded station where few people truly connect.', 'It is broken by friendship and truth, which is what the climax does.'] },
    { id: 'awe', icon: '✨', name: 'Awe and amazement', idea: 'Film and machines are shown as real magic that fills people with wonder, and that wonder is meant to be shared.',
      points: ['The cinema (Safety Last) lets Hugo forget his worries and prepares him to understand Georges.', 'The automaton drawing is the biggest moment of wonder, and it is also the turning point.', 'Georges’s films amaze audiences again at the Film Academy celebration.', 'Wonder is not just entertainment: it opens up memory, truth and love.'] },
    { id: 'family', icon: '🫶', name: 'Family and friends', idea: 'Family is built by care and choice, not just blood. Lonely characters become a family by helping each other.',
      points: ['Isabelle chooses to help Hugo even though he stole from her godfather.', 'Étienne helps a stranger at the Film Academy, and the helpers form a team.', 'Mama Georges welcomes Hugo, and the Georges family takes him in at the end.', 'The Station Inspector shows the opposite: power and rules without belonging.'] },
    { id: 'memory', icon: '🎞️', name: 'Memory and the past', idea: 'The past can be painful, but forgetting it is worse. Remembering heals the characters.',
      points: ['Georges’s films were melted down after the war and he was forgotten, so memory hurts him.', 'Mama Georges quietly keeps the memory safe until it can return.', 'The automaton forces Georges to face his past, and his breakdown is the start of healing.', 'At the end, the past returns as a gift when Georges is honoured.'] },
    { id: 'truth', icon: '🔑', name: 'Truth', idea: 'Secrets protect people for a while, but they also keep them apart. When the truth comes out, it saves the characters instead of destroying them.',
      points: ['Hugo hides that his uncle is gone so he isn’t sent to an orphanage.', 'Georges and Jeanne keep his past secret from Isabelle to protect him from pain.', 'The Station Inspector represents the outside world that could expose them.', 'The signature breaks the silence, and the family stops being a house of secrets.'] }
  ],
  // 👥 the five characters, three gaps each. kind: 'imagined' | 'book' | 'both'
  characters: [
    { id: 'etienne', name: 'Étienne', icon: '🎬', who: 'Étienne is Isabelle’s friend. He used to work at the cinema and sneak her in, until he was fired. Later he is a student at the Film Academy, where he helps Hugo.',
      gaps: [
        { title: 'Fired from the cinema', themes: ['isolation'], kind: 'imagined',
          notes: [['Setting', 'the cinema near the station, in winter.'], ['Gap', 'the book only tells us that Étienne was fired for sneaking children in. His walk out is never shown.'], ['Theme', 'from Étienne’s view he loses his job, his place and his link to films.'], ['Climax link', 'his friendship with Hugo and Isabelle ends his isolation.']] },
        { title: 'Sneaking into the movies', themes: ['awe'], kind: 'book',
          notes: [['Setting', 'inside the cinema, as Hugo sees a film for the first time in a long while.'], ['Scene', 'Étienne used to sneak Isabelle in, but he has been fired, so Hugo picks the lock with one of Isabelle’s hairpins and they watch the Harold Lloyd comedy Safety Last.'], ['Theme', 'film is shown as magic that fills people with wonder.'], ['Climax link', 'Hugo’s awe at film prepares him to understand Georges.']] },
        { title: 'Helping Hugo at the Film Academy', themes: ['family'], kind: 'book',
          notes: [['Setting', 'the Film Academy library.'], ['Scene', 'Étienne, a student at the Academy and Isabelle’s friend, helps Hugo find The Invention of Dreams.'], ['Theme', 'friends can act like a family and help us find the truth.'], ['Climax link', 'the book proves Georges was a famous filmmaker, which drives the climax.']] }
      ] },
    { id: 'jeanne', name: 'Mama Georges (Jeanne)', icon: '🎭', who: 'Mama Georges is Papa Georges’s wife and Isabelle’s godmother. She was once an actress in his films and is the gentle keeper of the family’s memory.',
      gaps: [
        { title: 'Watching Georges’s past disappear', themes: ['memory'], kind: 'imagined',
          notes: [['Setting', 'the years after the war, in Georges’s old studio and then the Paris flat.'], ['Gap', 'the book tells us his films were melted down for shoe heels. We never see how Jeanne coped.'], ['Theme', 'she keeps the memory alive even when the world forgets.'], ['Climax link', 'she is the one who helps tell the truth at the end.']] },
        { title: 'Welcoming Hugo into the family', themes: ['family'], kind: 'book',
          notes: [['Setting', 'the flat, near the end of the story.'], ['Scene', 'Jeanne treats Hugo kindly and helps him belong.'], ['Theme', 'family is built by care, not just blood.'], ['Climax link', 'the Georges family takes Hugo in after the truth is revealed.']] },
        { title: 'Keeping the secret from Isabelle', themes: ['isolation', 'truth'], kind: 'imagined',
          notes: [['Setting', 'the Georges family’s flat, over many years.'], ['Gap', 'why Jeanne and Georges never told Isabelle about his past.'], ['Theme', 'silence isolates people, and truth brings them back together.'], ['Climax link', 'the secret finally breaks open.']] }
      ] },
    { id: 'isabelle', name: 'Isabelle', icon: '🗝️', who: 'Isabelle is Georges’s goddaughter. She is adventurous, loves books, and wears the heart-shaped key that starts the automaton.',
      gaps: [
        { title: 'Becoming Hugo’s friend', themes: ['family'], kind: 'book',
          notes: [['Setting', 'the station and the streets of Paris.'], ['Scene', 'Isabelle chooses to help Hugo even though he stole from her godfather.'], ['Theme', 'friendship makes a new family.'], ['Climax link', 'her loyalty brings the truth to light.']] },
        { title: 'The automaton draws', themes: ['awe'], kind: 'book',
          notes: [['Setting', 'Hugo’s hidden room in the station walls, with the automaton and Isabelle’s key.'], ['Scene', 'the heart-shaped key starts the machine and it draws a picture signed “Georges Méliès”.'], ['Theme', 'amazement at the hidden magic of the past.'], ['Climax link', 'this is the turning point of the whole story.']] },
        { title: 'Life before Hugo', themes: ['isolation', 'truth'], kind: 'imagined',
          notes: [['Setting', 'the Georges family’s flat.'], ['Gap', 'what Isabelle felt before she met Hugo, forbidden from cinema and surrounded by adults.'], ['Theme', 'isolation caused by secrets.'], ['Climax link', 'the truth ends her loneliness.']] }
      ] },
    { id: 'georges', name: 'Papa Georges (Georges Méliès)', icon: '🎩', who: 'Papa Georges was a famous magician and filmmaker. Now he is a forgotten old man selling toys in the station.',
      gaps: [
        { title: 'Remembering the glass studio', themes: ['memory'], kind: 'book',
          notes: [['Setting', 'his old film studio and the present-day toy booth.'], ['Scene', 'Georges was a famous magician and filmmaker. After the war his films were melted down and he was forgotten.'], ['Theme', 'the past can be painful, but forgetting it is worse.'], ['Climax link', 'the automaton forces him to face his past.']] },
        { title: 'The years behind the toy booth', themes: ['isolation'], kind: 'imagined',
          notes: [['Setting', 'the toy booth in the station, year after year.'], ['Gap', 'what Georges felt as he sat alone every day, unseen.'], ['Theme', 'shame and loss shut him away from everyone.'], ['Climax link', 'the truth ends his isolation.']] },
        { title: 'Being honoured at the end', themes: ['awe'], kind: 'book',
          notes: [['Setting', 'the Film Academy celebration, near the end.'], ['Scene', 'Georges’s films are shown and people applaud him.'], ['Theme', 'wonder returns when the past is honoured.'], ['Climax link', 'this is the resolution of the climax.']] }
      ] },
    { id: 'inspector', name: 'The Station Inspector', icon: '👮', who: 'The Inspector is a minor character in the book, so these gaps are mostly imagined. Use the in-book facts (he chases Hugo and threatens the orphanage) and build on them.',
      gaps: [
        { title: 'Patrolling alone', themes: ['isolation'], kind: 'imagined',
          notes: [['Setting', 'the station concourse, day after day.'], ['Gap', 'what his life is like outside work.'], ['Theme', 'rules and duty can leave a person lonely.'], ['Climax link', 'his chase pushes Hugo to the final confrontation.']] },
        { title: 'An outsider among friends', themes: ['family'], kind: 'imagined',
          notes: [['Setting', 'the station, in contrast with the friendship scenes.'], ['Gap', 'the Inspector never joins the circle of helpers.'], ['Theme', 'friendship and family are what he lacks.'], ['Climax link', 'the others unite while he stays an outsider.']] },
        { title: 'The threat of discovery', themes: ['truth'], kind: 'both',
          notes: [['Setting', 'the station, during the chases.'], ['Scene', 'the Inspector threatens to send Hugo to the orphanage if he finds him.'], ['Theme', 'Hugo hides the truth to survive.'], ['Climax link', 'the truth finally comes out and ends the need to hide.']] }
      ] }
  ],
  // ✍️ how every answer is built (the pattern the examples follow)
  recipe: [
    ['1. Name the gap', 'Say what moment it is and whether the book shows it or you are imagining it.'],
    ['2. Character’s view', 'Write from the character’s perspective: what they would feel and why.'],
    ['3. Setting', 'Place it: where and when (Paris, the station, the toy booth, the cinema, the flat, the Film Academy).'],
    ['4. ⭐ Link to the theme (most important)', 'Name one of the 5 themes (Family and friends, Awe and amazement, Memory and the past, Isolation, Truth). Say “this shows the theme of …” and explain how this moment shows it. Compare with other characters if you can.'],
    ['5. Link to the climax', 'Finish by connecting it to the automaton signing Georges Méliès’s name and what that changes.']
  ],
  // ❓ quiz: a = index of the right answer
  quiz: [
    { q: 'Where does most of the story take place?', o: ['The Gare Montparnasse train station in Paris', 'A cinema in London', 'The Film Academy library', 'A toy factory in Paris'], a: 0, why: 'Hugo secretly lives in the walls of the Gare Montparnasse station, behind the clocks.' },
    { q: 'When is the story set?', o: ['The early 1930s, in winter', 'The 1890s, in summer', 'During the Second World War', 'The 1960s'], a: 0, why: 'It is set in the early 1930s in winter, with flashbacks to the early days of cinema.' },
    { q: 'What is the mood at the start of the story?', o: ['Cold, grey and lonely', 'Bright and cheerful', 'Scary and violent', 'Busy and exciting'], a: 0, why: 'It starts cold, grey and lonely, then gets warmer and more magical as secrets come out.' },
    { q: 'What makes the automaton finally work?', o: ['Isabelle’s heart-shaped key', 'A new gear from the toy booth', 'Hugo’s father’s notebook', 'A key from the Station Inspector'], a: 0, why: 'Isabelle wears the heart-shaped key on a necklace, and it fits the automaton.' },
    { q: 'What does the automaton draw?', o: ['A scene from A Trip to the Moon', 'A picture of Hugo’s father', 'A map of Paris', 'The station clock'], a: 0, why: 'It draws the moon with a rocket in its eye, from A Trip to the Moon.' },
    { q: 'What name does the automaton sign?', o: ['Georges Méliès', 'Hugo Cabret', 'Harold Lloyd', 'Étienne'], a: 0, why: 'The signature proves Papa Georges was the famous filmmaker Georges Méliès.' },
    { q: 'Where does the automaton draw its picture?', o: ['Hugo’s hidden room in the station walls', 'The Film Academy', 'The toy booth', 'The cinema'], a: 0, why: 'The automaton is kept in Hugo’s hidden room, and that’s where the key brings it to life.' },
    { q: 'Which film do Hugo and Isabelle watch at the cinema?', o: ['Safety Last, a Harold Lloyd comedy', 'A Trip to the Moon', 'The Invention of Dreams', 'A film about trains'], a: 0, why: 'In Safety Last an actor hangs from a clock high above the street, which reminds Hugo of his life with the station clocks.' },
    { q: 'Why was Étienne fired from the cinema?', o: ['He snuck children in', 'He stole from the till', 'He fell asleep at work', 'He broke the projector'], a: 0, why: 'He let children in secretly because he wanted them to feel the wonder of film.' },
    { q: 'Where is Étienne later a student?', o: ['The Film Academy', 'A clockmaking school', 'A magic school', 'A university in London'], a: 0, why: 'At the Film Academy he helps Hugo find The Invention of Dreams in the library.' },
    { q: 'Which book does Étienne help Hugo find?', o: ['The Invention of Dreams', 'Safety Last', 'A Trip to the Moon', 'The Clockmaker’s Notebook'], a: 0, why: 'The Invention of Dreams: The Story of the First Movies Ever Made reveals Georges Méliès was one of the first great filmmakers.' },
    { q: 'What happened to many of Georges’s films after the war?', o: ['They were melted down, for things like shoe heels', 'They were sold to America', 'They burned in a station fire', 'They were hidden in the station walls'], a: 0, why: 'Audiences lost interest, his studio closed and many films were melted down for scrap.' },
    { q: 'What did Georges build to make his films?', o: ['A glass studio', 'A cinema', 'A train station', 'A toy shop'], a: 0, why: 'He built a glass studio and made hundreds of films there.' },
    { q: 'What was Mama Georges (Jeanne) before?', o: ['An actress in Georges’s films', 'A clockmaker', 'A librarian', 'A station worker'], a: 0, why: 'She was an actress in his films, which links her to the theme of memory and the past.' },
    { q: 'How is Isabelle related to Papa Georges?', o: ['She is his goddaughter', 'She is his daughter', 'She is his niece', 'She is not related'], a: 0, why: 'Isabelle lives with her godparents, Papa Georges and Mama Georges.' },
    { q: 'What is Isabelle forbidden from doing?', o: ['Going to the cinema', 'Reading books', 'Visiting the station', 'Talking to Hugo'], a: 0, why: 'Georges forbids it because film reminds him of everything he lost.' },
    { q: 'Where does Papa Georges work now?', o: ['A toy booth in the station', 'The cinema', 'The Film Academy', 'A clock shop'], a: 0, why: 'The once-famous filmmaker is now a forgotten old man selling toys.' },
    { q: 'What does the Station Inspector threaten to do to Hugo?', o: ['Send him to the orphanage', 'Send him to prison', 'Make him work at the toy booth', 'Take his notebook'], a: 0, why: 'This is why Hugo hides the truth that his uncle is gone.' },
    { q: 'Why does Hugo keep winding the station clocks?', o: ['So nobody notices his uncle is gone', 'Because Georges pays him', 'Because the Inspector told him to', 'To fix the automaton'], a: 0, why: 'If the clocks stopped, people would find out he is living alone in the walls.' },
    { q: 'What happens to Georges at the end of the story?', o: ['He is honoured at the Film Academy', 'He leaves Paris', 'He opens a new cinema', 'He sells the automaton'], a: 0, why: 'His films are shown again and people applaud him. He is a magician again.' },
    { q: 'What is the climax of the story?', o: ['The automaton signs Georges Méliès’s name', 'Hugo watches Safety Last', 'Étienne is fired', 'Hugo steals from the toy booth'], a: 0, why: 'It is the moment the truth can no longer be hidden, where isolation turns into family and truth.' },
    { q: 'What does Papa Georges do when his hidden box of drawings is found?', o: ['He breaks down', 'He laughs', 'He calls the Inspector', 'He leaves the flat'], a: 0, why: 'Facing his past is painful, but it is the beginning of healing.' },
    { q: 'Who takes Hugo in at the end?', o: ['Papa Georges and Mama Georges', 'Étienne', 'The Station Inspector', 'Nobody, he stays in the walls'], a: 0, why: 'The Georges family gives Hugo a home, and Isabelle becomes like a sister to him.' },
    { q: 'Étienne being fired mostly shows which theme?', o: ['Isolation', 'Awe and amazement', 'Truth', 'Memory and the past'], a: 0, why: 'He loses his job, his place and his link to films.' },
    { q: 'The automaton drawing the picture mostly shows which theme?', o: ['Awe and amazement', 'Isolation', 'Family and friends', 'Memory and the past'], a: 0, why: 'It’s the biggest moment of wonder, and it’s also the turning point.' },
    { q: 'Jeanne quietly protecting Georges’s drawings mostly shows which theme?', o: ['Memory and the past', 'Awe and amazement', 'Isolation', 'Family and friends'], a: 0, why: 'She keeps the memory alive even when the world forgets.' },
    { q: 'Étienne helping Hugo at the Film Academy mostly shows which theme?', o: ['Family and friends', 'Isolation', 'Truth', 'Memory and the past'], a: 0, why: 'Friends can act like a family and help us find the truth.' },
    { q: 'What does “Imagined” mean for a gap?', o: ['A moment the book doesn’t show, written from the character’s view', 'A scene copied from the book', 'A dream Hugo has', 'A made-up character'], a: 0, why: 'You imagine what the character would think and feel, built on facts from the book.' },
    { q: 'Which character’s gaps are mostly imagined because he is a minor character?', o: ['The Station Inspector', 'Papa Georges', 'Isabelle', 'Mama Georges'], a: 0, why: 'Use the in-book facts (he chases Hugo and threatens the orphanage) and build on them.' },
    { q: 'Which of these gaps is Imagined, not In the book?', o: ['Georges’s years behind the toy booth', 'The automaton draws', 'Étienne helping at the Film Academy', 'Georges being honoured'], a: 0, why: 'The book never shows those long lonely years, so you imagine them from his view.' },
    { q: 'Why did Jeanne and Georges keep his past secret from Isabelle?', o: ['To protect Georges from the pain of remembering', 'Because Isabelle was too young to read', 'Because the Inspector told them to', 'Because they forgot'], a: 0, why: 'It was done out of love, but it also created isolation inside the home.' },
    { q: 'What is the most important thing every gap answer must do?', o: ['Link to one of the 5 themes', 'Use exactly 300 words', 'Quote the film Safety Last', 'Describe every character'], a: 0, why: 'Every answer must name a theme (Family and friends, Awe and amazement, Memory and the past, Isolation or Truth) and explain how the moment shows it.' },
    { q: 'What should every gap answer finish with?', o: ['A link to the climax', 'A list of characters', 'A quote from the film', 'The word count'], a: 0, why: 'Connect the moment to the automaton signing Georges Méliès’s name and what that changes.' }
  ],
  // 🃏 flashcards
  cards: [
    ['Setting: place', 'Paris, mostly the Gare Montparnasse train station. Also the toy booth, the Georges family’s flat, the cinema and the Film Academy library.'],
    ['Setting: time', 'The early 1930s, in winter, with flashbacks to the early days of cinema.'],
    ['Mood', 'Cold, grey and lonely at first, then warmer and more magical as secrets come out.'],
    ['The climax', 'The automaton, started by Isabelle’s heart-shaped key, draws a picture from A Trip to the Moon and signs it “Georges Méliès”.'],
    ['What the climax changes', 'Isolation turns into family and truth, and the past is remembered again.'],
    ['Étienne', 'Isabelle’s friend. He used to sneak children into the cinema and was fired for it. Later a Film Academy student who helps Hugo.'],
    ['Mama Georges (Jeanne)', 'Papa Georges’s wife and Isabelle’s godmother. Once an actress in his films. The gentle keeper of the family’s memory.'],
    ['Isabelle', 'Georges’s goddaughter. Adventurous, loves books, wears the heart-shaped key. Forbidden from the cinema.'],
    ['Papa Georges', 'Georges Méliès: once a famous magician and filmmaker, now a forgotten old man selling toys in the station.'],
    ['The Station Inspector', 'A minor character who chases Hugo and threatens to send him to the orphanage. His gaps are mostly imagined.'],
    ['🧱 Isolation', 'Characters are cut off by loss, shame, secrets or their own hard attitude. Broken by friendship and truth.'],
    ['✨ Awe and amazement', 'Film and machines are real magic, and wonder is meant to be shared. It opens up memory, truth and love.'],
    ['🫶 Family and friends', 'Family is built by care and choice, not just blood. The lonely characters become a family.'],
    ['🎞️ Memory and the past', 'The past can be painful, but forgetting it is worse. Remembering heals Georges.'],
    ['🔑 Truth', 'Secrets protect people for a while but keep them apart. When the truth comes out, it saves them.'],
    ['Safety Last', 'The Harold Lloyd comedy Hugo and Isabelle watch. An actor hangs from a clock, which reminds Hugo of the station clocks.'],
    ['The Invention of Dreams', 'The book Étienne helps Hugo find at the Film Academy. It reveals Georges Méliès was one of the first great filmmakers.'],
    ['A Trip to the Moon', 'Georges Méliès’s famous film. The automaton draws the moon with a rocket in its eye.'],
    ['The glass studio', 'Where Georges made hundreds of films in the early days of cinema.'],
    ['What happened to Georges’s films', 'After the war audiences lost interest, his studio closed and many films were melted down for things like shoe heels.'],
    ['Why Hugo winds the clocks', 'So nobody notices his uncle is gone and he isn’t sent to the orphanage.'],
    ['The heart-shaped key', 'Isabelle’s necklace. It is the missing piece that starts the automaton.'],
    ['The ending', 'The Georges family takes Hugo in, and Georges is honoured at the Film Academy.'],
    ['💭 Imagined gap', 'A moment the book doesn’t show, written from the character’s view and built on facts from the book.'],
    ['📖 In the book gap', 'A real scene from the book, explained through a theme and linked to the climax.'],
    ['How to build a gap answer', 'Name the gap → character’s view → setting → link to the theme (most important) → link to the climax.']
  ]
};
// attach the three examples to every gap (curly apostrophes, like the rest of the site)
HUGO.characters.forEach(c => c.gaps.forEach((g, i) => {
  const e = EXAMPLES[c.id + '-' + i];
  g.examples = Object.fromEntries(['short', 'medium', 'long'].map(k => [k, e[k].replace(/'/g, '’')]));
}));
