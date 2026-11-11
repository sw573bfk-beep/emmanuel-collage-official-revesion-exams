// Strict content filter for EC Revisions (a Year 8 site). Only letters, numbers, . , ? ! ’, maths symbols and a few
// friendly emojis can be typed at all (see ALLOWED_CHARS). Used for account names, every chat (including
// Beau's), "Message Beau", Beau's replies and feedback. Anything that fails is blocked, never starred out.
// checkText(text) -> { ok: true } | { ok: false, why: 'words' | 'personal', message }
//
// It sees through the usual tricks before checking:
//  - look-alike letters from other alphabets (Cyrillic/Greek), full-width letters, accents: fսck, ｆｕｃｋ, fück
//  - invisible characters hidden between letters
//  - numbers and symbols used as letters: 5h1t, $hit, sh!t, a55, f@g
//  - symbols standing in for a letter: f*ck, f#ck, c*nt, bullsh*t
//  - letters spread out or split: f u c k, f.u.c.k, f-u-c-k, fu ck, f uck, sh it
//  - stretched letters: fuuuuck, shiiiit
//  - sound-alike spellings: fvck, phuck, phuk, fuq, fux, kunt, azz

// ---------- 1. turn the text into plain a–z letters ----------
const HOMOGLYPH = {
  'а': 'a', 'ɑ': 'a', 'α': 'a', 'в': 'b', 'ь': 'b', 'β': 'b', 'с': 'c', 'ϲ': 'c', 'ⅽ': 'c', 'ԁ': 'd', 'ⅾ': 'd', 'е': 'e', 'ё': 'e', 'ε': 'e', 'є': 'e', 'ғ': 'f', 'ƒ': 'f', 'ɡ': 'g', 'һ': 'h', 'н': 'h', 'і': 'i', 'ı': 'i', 'ι': 'i', 'ӏ': 'l', 'ј': 'j',
  'к': 'k', 'κ': 'k', 'ⅼ': 'l', 'м': 'm', 'ⅿ': 'm', 'п': 'n', 'η': 'n', 'о': 'o', 'ο': 'o', 'σ': 'o', 'р': 'p', 'ρ': 'p', 'ԛ': 'q', 'г': 'r', 'ѕ': 's', 'т': 't', 'τ': 't', 'ս': 'u', 'υ': 'u', 'μ': 'u', 'ν': 'v', 'ѵ': 'v', 'ԝ': 'w', 'ω': 'w', 'х': 'x', 'χ': 'x', 'у': 'y', 'γ': 'y', 'ү': 'y', 'ʐ': 'z', 'ᴢ': 'z'
};
const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g', '€': 'e', '£': 'e', '¢': 'c', '6': 'g' };
const WILD = '*#%?'; // a symbol standing in for a missing letter (f*ck)

function clean(text) {
  let s = String(text || '').normalize('NFKC');
  s = s.replace(/[​-‏⁠-⁤﻿­͏᠎]/g, ''); // invisible characters
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/[^\x00-\x7f]/g, c => HOMOGLYPH[c] || c);
  s = s.replace(/[’'`´]/g, ''); // it's → its (so apostrophes don't split words)
  // numbers and symbols only count as letters inside a word that has real letters (a55, 5h1t), so "455 points" is fine
  s = s.split(/\s+/).map(ch => ch.replace(/[!?.,:;]+$/, '')).map(ch => /[a-z]/.test(ch) ? ch.replace(/[0-9!|@$+€£¢]/g, c => LEET[c] || c) : ch.replace(/[0-9]+/g, ' ')).join(' ');
  s = s.replace(/[*#%?]/g, '?');
  return s.replace(/[^a-z?]+/g, ' ').trim();
}
const squeeze = w => w.replace(/(.)\1+/g, '$1'); // fuuuck -> fuck
// sound-alike spellings: try these versions of each word too
const variants = w => {
  const out = new Set([w, squeeze(w)]);
  for (const v of [...out]) {
    out.add(v.replace(/ph/g, 'f')); out.add(v.replace(/v/g, 'u')); if (/^(?:f|ph)/.test(v) && v.length >= 3) out.add(v.replace(/(?:q|x|kk)$/, 'k')); out.add(v.replace(/z/g, 's'));
    out.add(v.replace(/ck/g, 'k')); out.add(v.replace(/^k(?=u)/, 'c'));
  }
  for (const v of [...out]) out.add(squeeze(v));
  return [...out];
};

// ---------- 2. the word lists ----------
// Matched anywhere inside a word. Only words with no innocent look-alikes.
const INSIDE = ['fuck', 'fuk', 'fck', 'fcuk', 'fukk', 'motherf', 'shit', 'cunt', 'bitch', 'biatch', 'nigger', 'nigga', 'niggah', 'nibba', 'faggot', 'fagot', 'whore', 'slut', 'pussy', 'penis', 'vagina', 'porn', 'wank',
  'bastard', 'bollock', 'twat', 'asshole', 'arsehole', 'dickhead', 'cocksuck', 'dildo', 'boob', 'tittie', 'titty', 'nudes', 'sexting', 'horny', 'rapist', 'killyourself', 'killurself', 'kilyourself', 'neckyourself',
  'killyoself', 'retard', 'spastic', 'jizz', 'blowjob', 'handjob', 'masturbat', 'orgasm', 'erection', 'condom', 'cocaine', 'heroin', 'ecstasy', 'onlyfans', 'pornhub', 'xvideos', 'hentai', 'nazi', 'hitler',
  'tranny', 'shithead', 'dumbass', 'jackass', 'smartass', 'badass', 'bullshit', 'goddamn', 'stfu', 'gtfo', 'wtf',
  'fatass', 'seggs', 'secks', 'sexx', 'segs', 'gyat', 'milf', 'dilf', 'thicc', 'pedo', 'paedo', 'pedophil', 'paedophil', 'unalive', 'molest', 'incest', 'groomer', 'boner', 'penus', 'peenus', 'vagene', 'testicle',
  'ballsack', 'nutsack', 'scrotum', 'clitoris', 'nipple', 'bdsm', 'fetish', 'kinky', 'stripper', 'hooker', 'prostitut', 'xanax', 'mdma', 'vodka', 'tequila', 'whiskey', 'worthless', 'braindead', 'beaner', 'wetback', 'kike',
  // racism and hate
  'golliwog', 'jigaboo', 'jiggaboo', 'towelhead', 'raghead', 'dothead', 'terrorist', 'jihad', 'chingchong', 'currymuncher', 'junglebunny', 'porchmonkey', 'uncletom', 'whitetrash', 'redskin', 'muzzie', 'muzrat',
  'gyppo', 'negroid', 'darkie', 'darky', 'blackie', 'halfcaste', 'chinaman', 'polack', 'monkey', 'gorilla', 'baboon', 'chimpanzee',
  // Nazi and extremism
  'swastika', 'fuhrer', 'fuehrer', 'auschwitz', 'holocaust', 'aryan', 'klansman', 'kukluxklan', 'whitepower', 'whitepride', 'masterrace', 'siegheil', 'genocide', 'ethniccleansing', 'neonazi',
  // drugs, smoking and alcohol
  'marijuana', 'marihuana', 'cannabis', 'ganja', 'nicotine', 'cigarette', 'ciggie', 'ciggy', 'ketamine', 'fentanyl', 'codeine', 'adderall', 'oxycodone', 'oxycontin', 'percocet', 'druggie', 'junkie', 'stoner', 'opium',
  'cocaine', 'amphetamine', 'methamphetamine', 'shrooms', 'magicmushroom', 'smokeweed', 'gethigh', 'gettinghigh', 'gotstoned'];
// Whole words only (a few endings allowed): short or common words that also hide inside innocent words.
const WHOLE = ['ass', 'asses', 'arse', 'azz', 'dick', 'dik', 'dikk', 'cock', 'cok', 'cum', 'cumming', 'sex', 'sexy', 'sexual', 'rape', 'raping', 'raped', 'tit', 'tits', 'piss', 'pissed', 'crap', 'crappy', 'damn', 'dammit', 'damnit',
  'hell', 'bugger', 'bloody', 'omfg', 'fag', 'fags', 'tard', 'idiot', 'stupid', 'dumb', 'loser', 'moron', 'ugly', 'fatso', 'fatty', 'freak', 'pig', 'cow', 'skank', 'hoe', 'thot', 'simp', 'nude', 'naked',
  'kys', 'drunk', 'vape', 'vaping', 'bong', 'weed', 'stoned', 'meth', 'die', 'dead', 'kill', 'murder', 'stab', 'shoot', 'gun', 'knife', 'bomb', 'suicide', 'suicidal', 'hate', 'dumbo', 'nob', 'knob', 'wanker', 'prick',
  'douche', 'scum', 'trash', 'gay', 'lesbo', 'dyke', 'shag', 'bum', 'butt', 'butthole', 'fk', 'fkn', 'fkin', 'fking', 'fkd', 'fked', 'fuq', 'fux', 'fuc', 'mf', 'mfs', 'mofo', 'mfer', 'sht', 'shyt', 'shiet',
  'btch', 'bich', 'bish', 'cnt', 'kunt', 'puss', 'pusy', 'noods', 'noodz', 'nudez', 'spaz', 'spazz', 'coon', 'gook', 'chink', 'wog', 'abo', 'boong', 'paki', 'sybau', 'wth', 'effing', 'effin', 'fing', 'fooking', 'fookin', 'fook', 'feck', 'fecking', 'frickin', 'fcken', 'af', 'lmfao', 'ffs', 'jfc',
  'pp', 'peen', 'pecker', 'schlong', 'dong', 'willy', 'cooch', 'coochie', 'kms', 'nonce', 'bozo', 'fat', 'slag', 'cracker', 'spic', 'heil', 'balls', 'ballz', 'nutz', 'booty', 'bussy', 'weirdo', 'creep',
  'pathetic', 'lsd', 'shrooms', 'smex', 'sexting', 'horni', 'hornee', 'erotic', 'naughty', 'lewd', 'hottie', 'thot', 'gooner', 'goon', 'gooning', 'edging', 'pimp', 'sugardaddy', 'dih', 'dihh', 'deez',
  'jew', 'jewish', 'jewy', 'ape', 'chimp', 'coon', 'sambo', 'jap', 'japs', 'yid', 'heeb', 'hymie', 'gypsy', 'gypsies', 'pikey', 'negro', 'nig', 'nigs', 'nog', 'honky', 'squaw', 'abbo', 'lebo', 'kraut', 'dago', 'eyetie',
  'isis', 'kkk', 'klan', 'reich', 'sieg', 'hitlers', 'heil', 'nazis', 'natzi', 'nazy',
  'weed', 'kush', 'thc', 'cbd', 'vapes', 'vaper', 'durry', 'durries', 'cig', 'cigs', 'coke', 'oxy', 'drug', 'drugs', 'beer', 'beers', 'wine', 'rum', 'alcoholic', 'xtc', 'pills', 'dealer', 'smoked', 'smoking', 'stoned', 'tipsy', 'hungover'];
const ENDINGS = ['', 's', 'es', 'ed', 'd', 'ing', 'in', 'n', 'er', 'ers', 'y', 'ies', 'ie', 'z'];
// real words that contain or look like a listed word
const ALLOW = new Set(['retardant', 'retardants', 'retardation', 'therapist', 'therapists', 'scunthorpe', 'snigger', 'sniggers', 'sniggering', 'shiitake', 'shitake', 'cocktail', 'cocktails', 'peacock', 'hancock', 'cockatoo',
  'cockpit', 'dickens', 'hello', 'shell', 'shells', 'killer', 'dice', 'diet', 'dies', 'died', 'dying', 'dieting', 'potassium', 'potato', 'potatoes', 'pots', 'butter', 'button', 'buttons', 'bumble', 'cowl', 'pigment', 'horns',
  'hornet', 'gunpowder', 'assess', 'assist', 'class', 'bass', 'pass', 'mass', 'grass', 'glass', 'brass', 'passage', 'fuchsia', 'shift', 'hitch', 'pitch', 'hitchhike', 'arsenal', 'arsenic', 'parsec', 'title', 'titanic',
  'titan', 'titanium', 'constitution', 'petite', 'drape', 'grape', 'grapes', 'grapefruit', 'scrape', 'scraper', 'therapy', 'amsterdam', 'damsel', 'cocoa', 'sextant', 'essex', 'sussex', 'cucumber', 'circumference',
  'document', 'accumulate', 'spazio', 'cunning', 'potion', 'spot', 'pothole', 'hotpot', 'depot', 'ensure', 'scumble', 'cumulus', 'cumulative', 'homogeneous', 'homophone', 'homosapiens', 'homework', 'helium', 'shellfish',
  'fukushima', 'shittu', 'cook', 'cooks', 'cooked', 'cooking', 'cooker', 'cookie', 'cookies', 'jewel', 'jewels', 'jewelry', 'jewellery', 'maryann', 'maryanne', 'maryan', 'aryana', 'aryanna', 'apex', 'aper', 'drugstore', 'nigh', 'finger', 'fingers', 'spicy', 'spice', 'stripes', 'striped', 'torpedo', 'torpedoes', 'pedometer', 'fate', 'fated', 'fathom', 'dongle', 'goons', 'crackers', 'cox', 'heroine', 'heroines', 'swank', 'swanky', 'thorny', 'condominium', 'skys', 'huskys', 'fuel', 'fun', 'full', 'future', 'fusion', 'fuse', 'fudge', 'fur', 'fund', 'fuss', 'fax', 'fox', 'fix', 'fact', 'facts', 'focus', 'after', 'afternoon', 'half', 'safe', 'cafe', 'leaf', 'loaf', 'deaf']);
const INSIDE_RE = INSIDE.map(w => new RegExp(w.split('').map(c => '(?:' + c + '|\\?)+').join('')));
const INSIDE_SET = new Set(INSIDE), WHOLE_SET = new Set(WHOLE);

function badWord(w) {
  if (!w || ALLOW.has(w)) return false;
  for (const v of variants(w)) {
    if (ALLOW.has(v)) continue;
    if (/[a-z]/.test(v) && INSIDE_RE.some(re => re.test(v)) && (v.match(/[a-z]/g) || []).length >= 2) return true;
    for (const e of ENDINGS) { const base = e ? (v.endsWith(e) ? v.slice(0, -e.length) : null) : v; if (base && WHOLE_SET.has(base)) return true; }
    if (v.includes('?') && WHOLE.some(b => b.length >= 3 && new RegExp('^' + b.split('').map(c => '(?:' + c + '|\\?)').join('') + '(?:s|es|ed|ing|er)?$').test(v))) return true;
  }
  return false;
}
// the worst words written backwards (kcid, kcuf, tihs …)
const BACKWARDS = new Set(['fuck', 'fuk', 'shit', 'cunt', 'dick', 'cock', 'bitch', 'slut', 'whore', 'penis', 'porn', 'pussy', 'nigger', 'nigga', 'fag', 'twat', 'wank', 'boob', 'boobs', 'sex', 'rape', 'tits'].map(w => w.split('').reverse().join('')));
const badBackwards = w => !!w && variants(w).some(v => BACKWARDS.has(v) || BACKWARDS.has(v.replace(/s$/, '')));
// a word made by joining split-up pieces must BE a bad word (not just contain one), so "is hit" stays fine
function badExact(w) {
  if (!w || ALLOW.has(w)) return false;
  for (const v of variants(w)) for (const e of ENDINGS) {
    const base = e ? (v.endsWith(e) ? v.slice(0, -e.length) : null) : v;
    if (base && (WHOLE_SET.has(base) || INSIDE_SET.has(base))) return true;
  }
  return false;
}

// Phrases (checked on the cleaned-up message with single spaces)
const PHRASES = ['shut up', 'shutup', 'kill you', 'kill u', 'kill yourself', 'kill your self', 'kill ur self', 'kill urself', 'go die', 'hope you die', 'hope u die', 'i will kill', 'ill kill', 'hate you', 'hate u',
  'you suck', 'u suck', 'end yourself', 'neck yourself', 'no one likes you', 'nobody likes you', 'kill myself', 'hurt you', 'beat you up', 'bash you', 'son of a', 'go to hell', 'piece of', 'what the f', 'what the fk',
  'black people', 'white people', 'brown people', 'asian people', 'chinese people', 'indian people', 'african people', 'aboriginal people', 'muslim people', 'jewish people', 'arab people', 'mexican people',
  'black ppl', 'white ppl', 'asians are', 'blacks are', 'whites are', 'chinese are', 'indians are', 'muslims are', 'jews are', 'arabs are', 'africans are', 'mexicans are', 'aboriginals are', 'go back to your country',
  'gas them', 'gas chamber', 'gas chambers', 'jungle bunny', 'uncle tom', 'master race', 'white trash', 'porch monkey', 'half caste', 'sand n', 'slanty eyes', 'slant eyes', 'ching chong', 'curry muncher', 'get high', 'smoke weed', 'smoke a', 'got high', 'crack cocaine', 'magic mushroom', 'heil hitler', 'sieg heil', 'white power', 'white pride',
  'the f word', 'f off', 'f you', 'f u', 'go f yourself', 'f yourself', 'neck urself', 'neck ur self', 'only fans', 'onlyfans', 'eff off', 'sod off', 'get lost loser', 'your mum', 'ur mum', 'yo mama', 'your mom', 'ur mom', 'suck my', 'suck it', 'blow me', 'up yours', 'screw you', 'screw u', 'drop dead'];

// Personal details and ways to contact someone off the site
const CONTACT = [
  /(?:\+?\d[\s\-().\/]*){8,}/, // phone numbers (8+ digits, with or without spaces)
  /\b0?4\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/, // Australian mobiles
  /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\{at\})\s*[a-z0-9-]+/i, // emails
  /(?:^|\s)@[a-z0-9_.]{2,}/i, // @handles
  /\b(?:https?:\/\/|www\.)/i, // links
  /\b[a-z0-9-]{2,}\s*(?:\.|\(dot\)|\sdot\s)\s*(?:com|net|org|au|io|gg|me|co|ly|tv|app|xyz|info|link|ru|uk|us)\b/i,
  /\b(?:gmail|hotmail|outlook|icloud|yahoo|bigpond|protonmail)\b/i,
  /\b(?:snap ?chat|snap me|my snap|sc me|insta(?:gram)?|tik ?tok|discord|whats ?app|messenger|facebook|fb|telegram|kik|signal app|wechat|line app|twitter|x\.com|youtube channel|twitch|roblox|minecraft server|xbox|psn|steam account|bereal)\b/i,
  /\b(?:add me|dm me|message me on|text me|call me|ring me|my number|phone number|mobile number|my user ?name|username is|my address|where do you live|where u live|come to my house|meet up|meet me|my house is|i live (?:at|on|in))\b/i,
  /\b\d+\s+[a-z]+(?:\s+[a-z]+)?\s+(?:street|st|road|rd|avenue|ave|drive|dr|court|ct|crescent|cres|place|pl|lane|ln|parade|pde|terrace|tce|boulevard|blvd|way|close|circuit|cct|highway|hwy)\b/i
];
const NUMBER_WORDS = /\b(?:zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/gi;

export const FILTER_WORDS_MSG = 'That has words that aren’t allowed on EC Revisions. Please rewrite it kindly.';
export const FILTER_CONTACT_MSG = 'For your safety, don’t share phone numbers, emails, links, social media, usernames or where you live.';

// ---------- 0. only these characters can be typed at all ----------
// Letters, numbers, spaces and new lines, . , ? ! ' and maths symbols, plus a short list of friendly emojis.
// Everything else (other alphabets, fancy letters, symbols, other emojis like 🍆 🖕) is refused outright.
const SAFE_EMOJI = ['😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊', '🙂', '😉', '😍', '🥰', '😎', '🤩', '🤔', '😮', '😲', '😢', '😭', '😅', '🙃', '😴', '🥳', '😬', '🤗',
  '👍', '👎', '👏', '🙌', '💪', '👋', '🤝', '🙏', '❤️', '❤', '💙', '💚', '💛', '💜', '🧡', '🎉', '✅', '❌', '🔥', '⭐', '🌟', '✨', '💯', '📚', '✏️', '✏', '🧪', '📐', '📏', '🧠', '🏆', '🥇', '🎮', '⚽', '🏀', '🏈', '🐶', '🐱', '🌈', '☀️', '☀', '🍕', '🎂', '😇', '🍀', '🤞', '💡', '📝', '⏰', '🎯', '🙂'];
const SAFE_EMOJI_RE = new RegExp(SAFE_EMOJI.slice().sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gu');
const ALLOWED_CHARS = /^[A-Za-z0-9 \n.,?!'’‘+\-−–=\/()%×÷<>≤≥^:$°²³½¼¾π]*$/;
export const FILTER_CHARS_MSG = 'You can only use letters, numbers, . , ? ! ’ and maths symbols (+ − × ÷ = / ( ) % < > : $ °), plus a few friendly emojis. Please take out any other symbols.';
// numbers people use as rude codes, when they stand on their own
const RUDE_NUMBERS = /(?:^|[^0-9.])(?:69|420|1488|88|8008|80085|58008|5318008|8==+d)(?:$|[^0-9.])/i;
const ALWAYS_RUDE = /(?:^|[^0-9.])(?:6969|696969|8008|80085|58008|5318008|8==+d)(?:$|[^0-9.])/i;
const OP = '[=+\\-−–×÷/^<>≤≥%*]';
const MATHS_NEAR = new RegExp([
  OP + '\\s*\\$?\\(?\\s*(?:69|420|1488|88)\\b', '\\b(?:69|420|1488|88)\\s*\\)?\\s*' + OP,                       // = 69, 69 + 1, 2 × (69)
  '\\b(?:69|420|1488|88)\\s*(?:%|°|cm|mm|km|m|kg|g|ml|l|s|sec|seconds|min|minutes|hours|h|degrees|dollars|cents|points|marks|students|people)\\b', '\\$\\s*(?:69|420|1488|88)\\b', '\\b(?:69|420|1488|88)\\s*%',
  '\\b(?:q|question|questions|qn|no|number|page|p|part|ex|exercise|answer|answers|ans|is it|equals|got|get|score|scored|score is|mark|marks|total|sum|out of|=)\\.?\\s*(?:is\\s*|was\\s*)?(?:69|420|1488|88)\\b', '\\b(?:69|420|1488|88)\\s*(?:is the answer|is right|is wrong|is correct|right|wrong|correct|or|out of)\\b'
].join('|'), 'i');

export function checkText(text) {
  const raw = String(text || '');
  if (!ALLOWED_CHARS.test(raw.replace(SAFE_EMOJI_RE, ''))) return { ok: false, why: 'words', message: FILTER_CHARS_MSG };
  if (ALWAYS_RUDE.test(raw) || (RUDE_NUMBERS.test(raw) && !MATHS_NEAR.test(raw))) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  const plain = raw.normalize('NFKC').replace(/[​-‏⁠-⁤﻿­]/g, '');
  if (CONTACT.some(re => re.test(plain))) return { ok: false, why: 'personal', message: FILTER_CONTACT_MSG };
  if ((plain.match(NUMBER_WORDS) || []).length >= 6) return { ok: false, why: 'personal', message: FILTER_CONTACT_MSG };
  const toks = clean(raw).split(' ').filter(Boolean);
  // each word on its own
  if (toks.some(badWord) || toks.some(badBackwards)) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  // split-up words: join 2–6 neighbouring pieces when any piece is very short (f uck, fu ck, s h i t)
  for (let i = 0; i < toks.length; i++) {
    let w = '', short = false;
    for (let j = i; j < Math.min(toks.length, i + 6); j++) {
      w += toks[j]; if (toks[j].length <= 2) short = true;
      if (j > i && short && w.length <= 14 && (badExact(w) || badBackwards(w))) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
    }
  }
  const joined = ' ' + toks.join(' ') + ' ';
  if (PHRASES.some(p => joined.includes(' ' + p + ' '))) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  return { ok: true };
}

// Account names: the same rules, plus nothing that pretends to be Beau or staff
export function checkName(name, adminName) {
  const r = checkText(String(name || '').replace(/_/g, ' ')); // names may use _ (the name rules allow it)
  if (!r.ok) return { ok: false, message: 'That name isn’t allowed. Please use your real first and last name.' };
  const c = clean(name).replace(/[\s?]+/g, '');
  if (/(admin|moderator|teacher|staff|official|ecrevisions|support|owner)/.test(c)) return { ok: false, message: 'That name isn’t allowed. Please use your real first and last name.' };
  if (adminName && c === clean(adminName).replace(/\s+/g, '')) return { ok: false, message: 'That name is already taken.' };
  return { ok: true };
}

// Someone sending a word one piece at a time ("d", "i", "c", "k" as separate messages): join the newest
// short messages (oldest first) and check the result. recent = this person's last few messages, oldest first.
export function checkPieces(recent, text) {
  const pieces = recent.concat([text]).map(x => clean(x).replace(/\s+/g, ''));
  let w = '';
  for (let i = pieces.length - 1; i >= 0 && pieces.length - i <= 8; i--) {
    if (pieces[i].length > 4) break;
    w = pieces[i] + w;
    if (i < pieces.length - 1 && (badExact(w) || badBackwards(w) || INSIDE_RE.some(re => re.test(w)))) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  }
  return { ok: true };
}
