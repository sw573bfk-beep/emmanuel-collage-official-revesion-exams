// Strict content filter for EC Revisions (a Year 8 site). Used for account names, student chats,
// "Message Beau" and feedback. Anything that fails is blocked, not starred out.
// checkText(text) -> { ok: true } | { ok: false, why: 'words' | 'personal', message }
// It catches disguised spellings: f.u.c.k, f u c k, fuuuck, 5h1t, $hit, sh!t, accented letters.

const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g', '€': 'e' };

// Matched anywhere inside a word (each letter may repeat: fuuuck). Kept to words with no innocent
// look-alikes, so normal science words are not blocked.
const INSIDE = [
  'fuck', 'fuk', 'fck', 'fcuk', 'phuck', 'shit', 'shite', 'cunt', 'bitch', 'biatch', 'nigger', 'nigga', 'niggah', 'faggot', 'fagot',
  'whore', 'slut', 'pussy', 'penis', 'vagina', 'porn', 'wank', 'bastard', 'bollock', 'twat', 'asshole', 'arsehole', 'dickhead',
  'motherf', 'cocksuck', 'dildo', 'boob', 'tittie', 'titty', 'nudes', 'sexting', 'horny', 'rapist', 'killyourself', 'killurself',
  'kilyourself', 'neckyourself', 'retard', 'spastic', 'jizz', 'blowjob', 'handjob', 'masturbat', 'orgasm', 'erection', 'condom',
  'cocaine', 'heroin', 'meth', 'ecstasy', 'weed', 'stoned', 'onlyfans', 'pornhub', 'xvideos', 'hentai', 'nazi', 'hitler', 'kkk'
].map(w => new RegExp(w.split('').map(c => c + '+').join(''), ''));

// Whole words only (with endings like s, es, ed, ing, er, y): short or common words that would
// wrongly match inside innocent words (class, grape, cocktail, Sussex, hello).
const WHOLE = [
  'ass', 'arse', 'arsed', 'dick', 'dicks', 'cock', 'cocks', 'cum', 'sex', 'sexy', 'sexual', 'rape', 'raping', 'tit', 'tits', 'piss',
  'pissed', 'crap', 'crappy', 'damn', 'dammit', 'hell', 'bugger', 'bloody', 'wtf', 'stfu', 'gtfo', 'omfg', 'kys', 'kms', 'fag', 'fags',
  'homo', 'tard', 'idiot', 'idiots', 'stupid', 'dumb', 'dumbass', 'loser', 'losers', 'moron', 'ugly', 'fatso', 'fatty', 'freak',
  'pig', 'cow', 'skank', 'hoe', 'hoes', 'thot', 'simp', 'nude', 'naked', 'drunk', 'vape', 'vaping', 'vapes', 'bong', 'joint', 'pot',
  'die', 'dead', 'kill', 'murder', 'stab', 'shoot', 'gun', 'knife', 'bomb', 'suicide', 'suicidal', 'hate', 'dumbo', 'nob', 'knob',
  'wanker', 'prick', 'pricks', 'douche', 'scum', 'trash', 'gay', 'lesbo', 'shag', 'shagging', 'horn', 'bum', 'butt', 'butthole'
];
const WHOLE_SET = new Set(WHOLE);
const ENDINGS = ['', 's', 'es', 'ed', 'd', 'ing', 'er', 'ers', 'y', 'ies', 'ie'];
// a few science and everyday words that share a stem with the list above
const ALLOW = new Set(['retardant', 'retardants', 'retardation', 'dieting', 'diet', 'dies', 'died', 'dying', 'hello', 'shell', 'shells', 'killer', 'dice', 'potassium', 'potato', 'pots', 'butter', 'button', 'bumble', 'cowl', 'pigment', 'horns', 'hornet', 'gunpowder']);

// Phrases (checked on the cleaned-up message with single spaces)
const PHRASES = [
  'shut up', 'shutup', 'kill you', 'kill u', 'kill yourself', 'kill your self', 'go die', 'hope you die', 'i will kill', 'ill kill', 'hate you',
  'hate u', 'you suck', 'u suck', 'end yourself', 'neck yourself', 'no one likes you', 'nobody likes you', 'kill myself', 'hurt you',
  'beat you up', 'bash you', 'son of a', 'go to hell', 'piece of'
];

// Personal details and ways to contact someone off the site
const CONTACT = [
  /(?:\+?\d[\s\-().\/]*){8,}/, // phone numbers (8+ digits, with or without spaces)
  /\b0?4\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/, // Australian mobiles
  /[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\{at\})\s*[a-z0-9-]+/i, // emails
  /(?:^|\s)@[a-z0-9_.]{2,}/i, // @handles
  /\b(?:https?:\/\/|www\.)/i, // links
  /\b[a-z0-9-]{2,}\s*(?:\.|\(dot\)|\sdot\s)\s*(?:com|net|org|au|io|gg|me|co|ly|tv|app|xyz|info|link|ru|uk|us)\b/i,
  /\b(?:gmail|hotmail|outlook|icloud|yahoo|bigpond|protonmail)\b/i,
  /\b(?:snap ?chat|snap me|my snap|insta(?:gram)?|tik ?tok|discord|whats ?app|messenger|facebook|fb|telegram|kik|signal app|wechat|line app|twitter|x\.com|threads|youtube channel|twitch|roblox|minecraft server|xbox|psn|steam|bereal)\b/i,
  /\b(?:add me|dm me|message me on|text me|call me|ring me|my number|phone number|mobile number|my user ?name|username is|my address|where do you live|where u live|come to my house|meet up|meet me|my house is|i live (?:at|on|in))\b/i,
  /\b\d+\s+[a-z]+(?:\s+[a-z]+)?\s+(?:street|st|road|rd|avenue|ave|drive|dr|court|ct|crescent|cres|place|pl|lane|ln|parade|pde|terrace|tce|boulevard|blvd|way|close|circuit|cct|highway|hwy)\b/i
];
const NUMBER_WORDS = /\b(?:zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/gi;

function clean(text) {
  let s = String(text || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/[0-9!|@$+€]/g, c => LEET[c] || c);
  return s.replace(/[^a-z]+/g, ' ').trim();
}

// "f u c k", "f.u.c.k" and "f-u-c-k" become one word so they are checked too
function words(text) {
  const raw = clean(text).split(' ').filter(Boolean);
  const out = []; let run = '';
  for (const w of raw) {
    if (w.length === 1) { run += w; continue; }
    if (run) { out.push(run); run = ''; }
    out.push(w);
  }
  if (run) out.push(run);
  return out;
}

const squeeze = w => w.replace(/(.)\1+/g, '$1'); // fuuuck -> fuck, assss -> as (also try with doubles kept)

function badWord(w) {
  if (ALLOW.has(w)) return false;
  if (INSIDE.some(re => re.test(w))) return true;
  for (const v of [w, squeeze(w)]) {
    if (WHOLE_SET.has(v)) return true;
    for (const e of ENDINGS) if (e && v.endsWith(e) && WHOLE_SET.has(v.slice(0, -e.length)) && !ALLOW.has(v)) return true;
  }
  return false;
}

export const FILTER_WORDS_MSG = 'That has words that aren’t allowed on EC Revisions. Please rewrite it kindly.';
export const FILTER_CONTACT_MSG = 'For your safety, don’t share phone numbers, emails, links, social media, usernames or where you live.';

export function checkText(text) {
  const t = String(text || '');
  if (CONTACT.some(re => re.test(t))) return { ok: false, why: 'personal', message: FILTER_CONTACT_MSG };
  if ((t.match(NUMBER_WORDS) || []).length >= 6) return { ok: false, why: 'personal', message: FILTER_CONTACT_MSG };
  const ws = words(t);
  if (ws.some(badWord)) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  const joined = ' ' + ws.join(' ') + ' ';
  if (PHRASES.some(p => joined.includes(' ' + p + ' '))) return { ok: false, why: 'words', message: FILTER_WORDS_MSG };
  return { ok: true };
}

// Account names: the same rules, plus no contact details and nothing that looks like Beau or staff
export function checkName(name, adminName) {
  const r = checkText(name);
  if (!r.ok) return { ok: false, message: 'That name isn’t allowed. Please use your real first and last name.' };
  const c = clean(name).replace(/\s+/g, '');
  if (/(admin|moderator|teacher|staff|official|ecrevisions|support)/.test(c)) return { ok: false, message: 'That name isn’t allowed. Please use your real first and last name.' };
  if (adminName && c === clean(adminName).replace(/\s+/g, '')) return { ok: false, message: 'That name is already taken.' };
  return { ok: true };
}
