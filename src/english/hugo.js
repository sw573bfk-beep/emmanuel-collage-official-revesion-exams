// English: The Invention of Hugo Cabret exam study pack. Served only to people who have unlocked
// English with a code (GET /api/english), so none of this is in the public page.
// Paragraphs in examples are separated by blank lines.

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
  howTo: 'Each gap is marked 💭 Imagined (a moment the book doesn’t show, written from the character’s view) or 📖 In the book. Each gap has short notes, then a full example at about 200, 300 or 400 words.',
  checks: [
    'Chapter order and small details (like exactly when Georges is honoured) can differ in your teacher’s version, so check each 📖 In the book scene against your copy.',
    'The Station Inspector is a minor character, so his gaps are mostly imagined.',
    'If your class uses different themes or has a word count rule, tell Beau and this can be changed.'
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
        { title: 'Fired from the cinema', themes: ['isolation'], kind: 'imagined', words: 300,
          notes: [['Setting', 'the cinema near the station, in winter.'], ['Gap', 'the book only tells us that Étienne was fired for sneaking children in. His walk out is never shown.'], ['Theme', 'from Étienne’s view he loses his job, his place and his link to films.'], ['Climax link', 'his friendship with Hugo and Isabelle ends his isolation.']],
          example: `When Étienne is fired from the cinema, the book only tells us about it second-hand. We never see Étienne’s side, but we can imagine it, and from his perspective this moment shows the theme of isolation. The cinema is more than a job to him. It is the place where he is surrounded by stories, light and people. By letting children in secretly, he is acting out of kindness, because he wants others to feel the same wonder he does. The cinema does not see it that way and treats it as a crime.

Being fired cuts Étienne off from everything he loves. He loses his wage, his routine and the dark, magical room where he belongs. The imagined walk out of the building would be quiet and lonely, with no one defending him. Selznick shows isolation through empty spaces and silence, and this moment fits that pattern. Étienne is punished for being generous, which shows how cold the adult world can be to people who follow their hearts.

The theme matters because many characters in the book are isolated in different ways. Hugo hides in the walls, Georges hides from his past, and now Étienne is pushed out of the place he loves. However, the book does not leave him alone. He later helps Hugo and Isabelle at the Film Academy, which shows that isolation can be broken by friendship. Étienne’s firing shows how easily a person can be cut off, and his later kindness shows how connection can bring someone back in. This links to the climax, where the lonely characters finally come together as a family.` },
        { title: 'Sneaking into the movies', themes: ['awe'], kind: 'book', words: 200,
          notes: [['Setting', 'inside the cinema, as Hugo sees a film for the first time in a long while.'], ['Scene', 'Étienne used to sneak Isabelle in, but he has been fired, so Hugo picks the lock with one of Isabelle’s hairpins and they watch the Harold Lloyd comedy Safety Last.'], ['Theme', 'film is shown as magic that fills people with wonder.'], ['Climax link', 'Hugo’s awe at film prepares him to understand Georges.']],
          example: `Étienne’s secret kindness is the reason Isabelle has seen the magic of the cinema at all, and the cinema scene is a clear example of awe and amazement. Étienne used to sneak her in, but he has been fired for it, so this time Hugo picks the lock with one of Isabelle’s hairpins. Hugo has spent his days alone with clocks and gears, so sitting in a dark cinema is like entering another world. When he watches Safety Last, he sees an actor hanging from a clock high above the street, and the scene reminds him of his own life with the station clocks. The pictures, the music and the laughter make him forget his worries for a while.

Étienne’s rule-breaking shows he believed cinema should not be only for people with money, and that wonder is meant to be shared. Hugo and Isabelle carry on that idea. Later, when Hugo learns that Georges made the first magical films, his awe is already there because of this moment. This links to the climax, where the automaton’s drawing reveals the creator of that magic.` },
        { title: 'Helping Hugo at the Film Academy', themes: ['family'], kind: 'book', words: 400,
          notes: [['Setting', 'the Film Academy library.'], ['Scene', 'Étienne, a student at the Academy and Isabelle’s friend, helps Hugo find The Invention of Dreams.'], ['Theme', 'friends can act like a family and help us find the truth.'], ['Climax link', 'the book proves Georges was a famous filmmaker, which drives the climax.']],
          example: `The Film Academy scene shows the theme of family and friends in a powerful way. Hugo arrives as a nervous boy who trusts almost no one, because he has lived in secret since his uncle disappeared and he knows the Station Inspector could send him to an orphanage. Étienne has no reason to help a stranger, yet he welcomes Hugo and takes him to the library. He shows him how to use the card catalogue and helps him find the book The Invention of Dreams: The Story of the First Movies Ever Made. This is an act of friendship, and it gives Hugo something he badly needs: someone who is on his side.

The scene is important because it shows that family is not only about blood. Hugo lost his father, his uncle is gone, and Georges treats him like a thief. But in this room he finds a friend of a friend, and then a small group of helpers. Isabelle, who is Étienne’s friend, brings Hugo to him because she trusts him, and Étienne trusts them in return. Together they form a team, and that team is what makes the discovery possible.

The book they find holds the truth about the past. It reveals that Georges Méliès was one of the first great filmmakers, and it connects the automaton to the film A Trip to the Moon. Without Étienne’s help, Hugo might never have learned this. In this way, friendship leads directly to truth and to the climax. When the automaton draws the picture and signs Georges’s name, Hugo and Isabelle already understand why it matters, and that understanding comes from this library scene.

Selznick also uses a warm setting here. After the cold station and the empty streets, the library is quiet and safe, and the characters work together. The scene shows that support from friends can break isolation, open the door to the past, and begin to build a new family. Étienne is a minor character, but he is a key helper, and his kindness helps change Hugo’s life.` }
      ] },
    { id: 'jeanne', name: 'Mama Georges (Jeanne)', icon: '🎭', who: 'Mama Georges is Papa Georges’s wife and Isabelle’s godmother. She was once an actress in his films and is the gentle keeper of the family’s memory.',
      gaps: [
        { title: 'Watching Georges’s past disappear', themes: ['memory'], kind: 'imagined', words: 400,
          notes: [['Setting', 'the years after the war, in Georges’s old studio and then the Paris flat.'], ['Gap', 'the book tells us his films were melted down for shoe heels. We never see how Jeanne coped.'], ['Theme', 'she keeps the memory alive even when the world forgets.'], ['Climax link', 'she is the one who helps tell the truth at the end.']],
          example: `Mama Georges, whose real name is Jeanne, was once an actress in her husband’s films. This gives her a special link to the theme of memory and the past, because she lived through the golden age of cinema and then watched it be forgotten. The book tells us that after the war Georges’s studio closed and many of his films were melted down to make things like shoe heels. It does not show how Jeanne felt, so we must imagine it.

From her perspective, this would be a painful time. She would remember the glass studio, the costumes, the sets and the laughter, and then see all of it treated as scrap. She would also see her husband change from a joyful magician into a quiet man behind a toy booth. Yet she stays with him. Instead of letting the past vanish, she protects what she can, including his drawings and memories, which are kept hidden in the flat. This shows that memory can be a quiet kind of love.

The theme works because memory in the book is both a gift and a wound. Georges tries to bury the past because it hurts, but Jeanne understands it must not be lost. Her gentle patience is the opposite of his bitterness. She does not force him to remember, but she keeps the door open so that one day the past can return.

That day arrives when Hugo and Isabelle bring the truth about Georges to the flat. Jeanne helps explain what happened, and her calm voice allows the family to face their history. This links directly to the climax, where the hidden past finally comes out and is celebrated instead of hidden. Without Jeanne’s years of quiet protection, there would be less left to rediscover.

Selznick presents her as a gentle keeper of memory. Her gap in the story, those silent years, shows that remembering is not only about big events. It is also about small acts of loyalty, like keeping a box of drawings safe. The theme is explained through her: the past is painful, but it can heal people if someone is brave enough to carry it for them.` },
        { title: 'Welcoming Hugo into the family', themes: ['family'], kind: 'book', words: 300,
          notes: [['Setting', 'the flat, near the end of the story.'], ['Scene', 'Jeanne treats Hugo kindly and helps him belong.'], ['Theme', 'family is built by care, not just blood.'], ['Climax link', 'the Georges family takes Hugo in after the truth is revealed.']],
          example: `Mama Georges shows the theme of family and friends through her warmth toward Hugo. Hugo begins the story as an orphan who steals and hides, and most adults see him as a problem. Jeanne is different. She treats him as a child who needs care, and her kindness gives him his first real taste of family life since losing his father.

Her role is important because Papa Georges is angry and closed off for much of the book. Jeanne balances him. She is gentler, more patient and more willing to listen. When the truth about the automaton comes out, she helps calm the situation and guides the family towards understanding instead of more anger. This shows that family is not only about being related, but about choosing to look after each other.

By the end of the book, Hugo is taken in by Georges and Jeanne, and Isabelle becomes like a sister to him. Jeanne’s welcome is a big part of this. She gives Hugo a home when he has none, and she makes the Georges family bigger instead of smaller.

This links to the climax because the revealing of the past brings everyone together. Hugo gets a family, and the Georgeses get a boy who brings their history back to life. Selznick suggests that kindness can repair what loss has broken. Mama Georges, quiet and gentle, is the heart of that message.` },
        { title: 'Keeping the secret from Isabelle', themes: ['isolation', 'truth'], kind: 'imagined', words: 200,
          notes: [['Setting', 'the Georges family’s flat, over many years.'], ['Gap', 'why Jeanne and Georges never told Isabelle about his past.'], ['Theme', 'silence isolates people, and truth brings them back together.'], ['Climax link', 'the secret finally breaks open.']],
          example: `One gap in the book is the long time that Jeanne and Georges kept the truth hidden from Isabelle. Isabelle is forbidden from going to the cinema and does not know her godfather was a famous filmmaker. From Jeanne’s perspective, this silence is done out of love, because she wants to protect Georges from the pain of remembering. But it also creates isolation inside the home. Isabelle feels shut out of the family’s story, and Georges is alone with his memories.

This shows how secrets can separate people even when they live in the same house. The theme of truth is important because the book argues that hiding the past does not heal it. Only when Hugo brings the automaton to life and the signature appears is the silence broken. Jeanne’s imagined years of secrecy explain why the climax matters so much. When the truth finally comes out, the family stops being a house of secrets and becomes a real family.` }
      ] },
    { id: 'isabelle', name: 'Isabelle', icon: '🗝️', who: 'Isabelle is Georges’s goddaughter. She is adventurous, loves books, and wears the heart-shaped key that starts the automaton.',
      gaps: [
        { title: 'Becoming Hugo’s friend', themes: ['family'], kind: 'book', words: 200,
          notes: [['Setting', 'the station and the streets of Paris.'], ['Scene', 'Isabelle chooses to help Hugo even though he stole from her godfather.'], ['Theme', 'friendship makes a new family.'], ['Climax link', 'her loyalty brings the truth to light.']],
          example: `Isabelle shows the theme of family and friends by choosing to help Hugo even though he is a stranger who took things from her godfather’s booth. She is an adventurous girl who loves books and wants more from life than her quiet home allows. When she meets Hugo, she sees a person who needs a friend, and she acts on that instead of following the rules.

Her loyalty is strong. She goes with Hugo to the cinema and the Film Academy, and she brings her heart-shaped key to the automaton. She even risks upsetting her godparents to help him. This shows that friendship can sometimes matter more than obeying family rules, especially when the rules hide an important truth.

Isabelle is also the bridge between two families. She belongs to the Georges household, and she helps Hugo become part of it. Without her trust, Hugo would stay alone. In the climax her friendship leads to the truth about Georges, and in the ending it helps make Hugo her brother in all but name.` },
        { title: 'The automaton draws', themes: ['awe'], kind: 'book', words: 400,
          notes: [['Setting', 'Hugo’s hidden room in the station walls, with the automaton and Isabelle’s key.'], ['Scene', 'the heart-shaped key starts the machine and it draws a picture signed “Georges Méliès”.'], ['Theme', 'amazement at the hidden magic of the past.'], ['Climax link', 'this is the turning point of the whole story.']],
          example: `The moment when the automaton comes to life is the best example of awe and amazement in the book, and Isabelle is right at the centre of it. Her heart-shaped key has always been a mystery to her, just a strange piece of jewellery she wears. Hugo has searched for the missing piece for so long that the machine has become the most important thing in his life. When Isabelle’s key fits and the automaton begins to move, both children are stunned.

The automaton’s small hand starts to scratch across the paper, and the reader watches as slowly, line by line, a picture appears. It is a scene from A Trip to the Moon, the moon with a rocket in its eye, and the machine signs the picture with the name Georges Méliès. For a few seconds the children cannot believe what they are seeing. Hugo had hoped the automaton would carry a message from his father, and instead it reveals a name from the first days of film. Isabelle realises that the man she calls Papa Georges has a secret history she knew nothing about.

Selznick makes this moment powerful by slowing the story down. The pictures and the quiet around them give the reader the same sense of wonder that the characters feel. It is like watching a magic trick where the audience knows something amazing is happening but cannot yet explain it.

For Isabelle, the awe is double. She feels amazement at the machine itself, but she also feels amazement at her own family, because the signature changes how she sees her godfather. The boring man at the toy booth becomes a magician and a pioneer.

This moment links directly to the climax because it is the turning point. Once the drawing is signed, the truth about Georges can no longer be hidden, and the characters must face the past. The theme of awe and amazement shows that wonder is not just entertainment. It can also be the key that opens up memory, truth and love. Isabelle’s key, in the end, unlocks far more than a machine.` },
        { title: 'Life before Hugo', themes: ['isolation', 'truth'], kind: 'imagined', words: 300,
          notes: [['Setting', 'the Georges family’s flat.'], ['Gap', 'what Isabelle felt before she met Hugo, forbidden from cinema and surrounded by adults.'], ['Theme', 'isolation caused by secrets.'], ['Climax link', 'the truth ends her loneliness.']],
          example: `Before Isabelle meets Hugo, her life is quiet and limited, and the book does not show this period directly. We can imagine it, and it shows isolation. Isabelle lives with her godparents. She loves stories and adventure, yet she is forbidden from going to the cinema. To her, this rule makes no sense, because nobody explains it. She is surrounded by adults who hide something, and she is left curious and lonely.

From her perspective, the flat would feel like a place of secrets. Her godfather is withdrawn, her godmother is gentle but careful, and the only exciting things are in books. Without friends her own age, she is isolated even though she is not alone. This is an important idea in the book, because isolation is not only about being physically by yourself. It can also be about being kept away from the truth.

When Hugo appears, Isabelle finally has someone who shares her sense of adventure. He becomes her first real partner in mystery, and together they start asking questions about the past. Her loneliness turns into action, and she is brave enough to break the family’s silence.

This links to the climax because Isabelle’s discovery of the truth about Georges is the moment her isolation ends. She learns who her godfather really is, and the family stops hiding from its history. Selznick shows that truth, even when it is difficult, is what brings people close. Isabelle’s imagined years of waiting explain why her friendship with Hugo is so important.` }
      ] },
    { id: 'georges', name: 'Papa Georges (Georges Méliès)', icon: '🎩', who: 'Papa Georges was a famous magician and filmmaker. Now he is a forgotten old man selling toys in the station.',
      gaps: [
        { title: 'Remembering the glass studio', themes: ['memory'], kind: 'book', words: 300,
          notes: [['Setting', 'his old film studio and the present-day toy booth.'], ['Scene', 'Georges was a famous magician and filmmaker. After the war his films were melted down and he was forgotten.'], ['Theme', 'the past can be painful, but forgetting it is worse.'], ['Climax link', 'the automaton forces him to face his past.']],
          example: `Papa Georges is the main character connected to the theme of memory and the past. In the early days of cinema, he was a magician who built a glass studio and made hundreds of films, including A Trip to the Moon. People were amazed by his imagination. After the war, however, audiences lost interest, his studio closed, and many of his films were melted down for scrap. He ended up selling toys in a train station, forgotten by the world.

For Georges, memory is a source of grief. Every reminder of film hurts, because it shows him how much he lost. That is why he forbids Isabelle from going to the cinema and reacts so angrily when Hugo’s automaton appears. The machine was once his own creation, and seeing it forces him to remember a time of joy and a time of loss together.

The theme is explained through his change. At the start he is bitter and closed off, as if the past is a locked room. By the end he is willing to open that room, and he learns that people still remember him and value his work. The past, which seemed dead, returns as a gift.

This links to the climax. When the automaton draws the picture and signs his name, Georges can no longer hide. His breakdown is painful, but it is also the beginning of healing. Selznick suggests that memory can hurt, but it also keeps us human. A person who forgets the past loses part of himself, and Georges regains himself when his past is honoured.` },
        { title: 'The years behind the toy booth', themes: ['isolation'], kind: 'imagined', words: 400,
          notes: [['Setting', 'the toy booth in the station, year after year.'], ['Gap', 'what Georges felt as he sat alone every day, unseen.'], ['Theme', 'shame and loss shut him away from everyone.'], ['Climax link', 'the truth ends his isolation.']],
          example: `The book shows Georges as an old man selling toys, but it does not show the long period between losing his studio and meeting Hugo. This is a gap that clearly shows isolation. We can imagine the years in which he sat in the same small booth, repairing toys and seeing travellers rush past without a glance. In the past he was celebrated, and now he is invisible.

From Georges’s perspective, the isolation would come from shame as well as sadness. He believes the world has forgotten him and that his work no longer matters. Instead of fighting this, he withdraws. He hides his drawings, avoids films, and tries to live as if the past never happened. Even at home, he keeps his feelings closed. This is why he can be harsh with Hugo and with Isabelle. His anger is not really about them. It is the pain of a man who has been alone with his grief for too long.

Selznick often shows isolation using the station itself. It is a place full of people, but few of them truly connect with each other. The toy booth is like a small cage in the middle of the crowd, and Georges is trapped in it by his memories. Hugo is also hidden in the station walls, so the two characters mirror each other. One is a boy hiding from the world, and the other is an old man hiding from his past.

The theme matters because the book argues that isolation can be broken only through connection and truth. Hugo’s arrival, even though it begins with stealing, forces Georges to interact with someone. The automaton then drives him to face what he has hidden. By the climax, the old man who sat alone in a booth is surrounded by family and by people who honour his life.

This change shows the hope in the story. Georges’s imagined years of loneliness make his final recognition more moving. When he stands in front of a crowd that celebrates him, we feel how long he waited, and we understand that isolation does not have to be permanent.` },
        { title: 'Being honoured at the end', themes: ['awe'], kind: 'book', words: 200,
          notes: [['Setting', 'the Film Academy celebration, near the end.'], ['Scene', 'Georges’s films are shown and people applaud him.'], ['Theme', 'wonder returns when the past is honoured.'], ['Climax link', 'this is the resolution of the climax.']],
          example: `At the end of the book, Georges is honoured at a celebration of his films, and it is a moving example of awe and amazement. For years he believed that nobody remembered his work. Now he stands in a room full of people who admire the magic he created. The old films are shown again, and the audience reacts with the same wonder that people felt when they were first made.

For Georges, the amazement is also personal. He sees that his life’s work survived and that younger people, like Hugo, Isabelle and Étienne, helped bring it back. He is no longer a forgotten toy seller. He is a magician again.

This scene is the happy ending that follows the climax. The truth about the automaton opens the way, and the celebration completes it. The theme shows that wonder never really disappears. It can be lost for a while, but when memory and friendship bring it back, it fills people with joy again.` }
      ] },
    { id: 'inspector', name: 'The Station Inspector', icon: '👮', who: 'The Inspector is a minor character in the book, so these gaps are mostly imagined. Use the in-book facts (he chases Hugo and threatens the orphanage) and build on them.',
      gaps: [
        { title: 'Patrolling alone', themes: ['isolation'], kind: 'imagined', words: 200,
          notes: [['Setting', 'the station concourse, day after day.'], ['Gap', 'what his life is like outside work.'], ['Theme', 'rules and duty can leave a person lonely.'], ['Climax link', 'his chase pushes Hugo to the final confrontation.']],
          example: `The Station Inspector is mostly shown as a chaser, but we never see his private life, which is a gap that points to isolation. He walks around the station day after day, watching people, looking for lost children, and enforcing rules. He is surrounded by crowds but we never see him with a friend or family member.

From his perspective, the job may be the only thing that gives his life shape. By catching children he feels useful and in control. However, this also keeps people away from him. Hugo fears him, other characters avoid him, and he seems to have no one to share a laugh with. His strictness makes him lonely.

The Inspector shows a different kind of isolation from Hugo’s. Hugo is alone because he lost his family, while the Inspector is alone partly because of his own hard attitude. This contrast helps the book show that isolation can come from loss or from choices. His chase of Hugo drives the tension that leads to the climax, where Hugo must finally reveal the truth.` },
        { title: 'An outsider among friends', themes: ['family'], kind: 'imagined', words: 300,
          notes: [['Setting', 'the station, in contrast with the friendship scenes.'], ['Gap', 'the Inspector never joins the circle of helpers.'], ['Theme', 'friendship and family are what he lacks.'], ['Climax link', 'the others unite while he stays an outsider.']],
          example: `The Station Inspector helps highlight the theme of family and friends by being the character who stands outside it. Around him, people form bonds. Hugo and Isabelle become friends, Étienne helps them, and Georges and Jeanne become Hugo’s new family. The Inspector, by contrast, is always on the edge of these scenes, chasing, watching and threatening.

From his own perspective, this may feel natural. He sees himself as someone who keeps order, not someone who joins in. Yet the book suggests that something is missing. When he sees orphans, he treats them as a problem to be removed rather than as children who need care. This shows that he does not understand the value of family, perhaps because he has none or has forgotten what it feels like.

His role works as a contrast. Hugo has almost nothing, but he gains friends and a family. The Inspector has authority and a uniform, but he has no real connection with anyone. Selznick uses him to show that power is not the same as belonging.

This links to the climax because the friends work together to reveal the truth, and the Inspector cannot stop them. The strength of their bond defeats the fear he represents. The message is that people who stand together, even if they are small and poor, can overcome cold rules. Meanwhile, the Inspector reminds us what life looks like without friendship: it is orderly, but it is empty.` },
        { title: 'The threat of discovery', themes: ['truth'], kind: 'both', words: 400,
          notes: [['Setting', 'the station, during the chases.'], ['Scene', 'the Inspector threatens to send Hugo to the orphanage if he finds him.'], ['Theme', 'Hugo hides the truth to survive.'], ['Climax link', 'the truth finally comes out and ends the need to hide.']],
          example: `The Station Inspector is a living reminder of what could happen if the truth about Hugo is discovered. Hugo is a twelve-year-old boy living secretly in the station walls, winding the clocks so nobody notices that his uncle is gone. If the Inspector learns the truth, Hugo could be sent to an orphanage and lose his chance to finish the automaton. Because of this, Hugo spends much of the book hiding and avoiding questions, so the theme of truth appears as something dangerous to reveal.

From the Inspector’s perspective, he is only doing his job. He believes he is protecting children by taking them off the streets. He does not know that Hugo is keeping a mystery that links to the past of a famous filmmaker. This gap in his knowledge creates tension. The reader knows more than the Inspector does, and each chase feels like a race between a hidden truth and a rule that would crush it.

The theme works because truth in the book is complicated. Hugo’s lies protect him, but they also keep him lonely. Georges’s silence protects him from pain, but it also hides his greatness. Everyone is hiding something, and the Inspector represents the outside world that could expose them. He makes the characters afraid of the truth.

The climax changes this. When the automaton signs the drawing and Georges’s secret comes out, hiding is no longer necessary. The truth does not destroy the characters. It saves them. Hugo no longer has to run, and the family can openly accept him. The Inspector’s threat loses its power because Hugo now has a home and people who will stand up for him.

Selznick uses the Inspector to show that fear of discovery can make people hide for too long. His role is small, but it adds pressure to the story and makes the final honesty feel like a relief. The theme is explained clearly: truth can be frightening, but living in secrets is more painful. Once the truth is told, the characters can finally stop hiding and start belonging.` }
      ] }
  ],
  // ✍️ how every answer is built (the pattern the examples follow)
  recipe: [
    ['1. Name the gap', 'Say what moment it is and whether the book shows it or you are imagining it.'],
    ['2. Character’s view', 'Write from the character’s perspective: what they would feel and why.'],
    ['3. Setting', 'Place it: where and when (Paris, the station, the toy booth, the cinema, the flat, the Film Academy).'],
    ['4. Explain the theme', 'Name the theme and explain how this moment shows it. Compare with other characters if you can.'],
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
    ['How to build a gap answer', 'Name the gap → character’s view → setting → explain the theme → link to the climax.']
  ]
};
