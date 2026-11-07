# EC Revisions

Year 8 exam revision with accounts. Students make an account (ideally with their real name), choose a subject and study. Their progress saves to their account, so it follows them to any device. The admin (**Beau**) gets a dashboard showing who is using the site, when, and for how long.

- **Maths:** ready. Notes, unlimited auto-marked practice, the full revision booklet with answers, exam mode, interactive tools and a step-by-step solver.
- **Science (Chemistry):** built on Exam Checklist 2 (chemical changes and reactions): quick notes for all 9 checklist sections, practice questions (including a word-equation checker), workbook questions, the salts graph task with an interactive graph, flashcards and science words.
- **Completed theory booklet (locked):** the whole Year 8 Chemistry theory workbook completed at three levels (Minimal, Normal, Extra info). Unlocked per account with a one-use 6-digit code.

**Live site: <https://ec-revisions.sw573bfk.workers.dev>** (this is the link to share).

Everything runs on **Cloudflare** (free plan): a Worker serves the website and its API, and a D1 database stores accounts, progress and usage. This GitHub repo holds the code; the link you share is the Cloudflare one.

## Pages

| Address | What it is |
| --- | --- |
| `/` | Log in or create an account, then choose a subject |
| `/maths/` | Maths revision (built from `src/maths/`) |
| `/science/` | Science (Chemistry) revision, including the locked completed booklet |
| `/admin/` | Admin dashboard (only the `Beau` account can open it) |

## The admin dashboard

- **How many:** accounts, new sign-ups today and this week, people who studied today and this week, and who is **online right now**.
- **How long:** study time today, this week and all time, for everyone and per person. Time counts only while someone has a subject open and is active; idle or background tabs don't count.
- **Who:** a sortable, searchable table of everyone, with last time on, logins, visits, questions answered, accuracy, booklet progress and exam average.
- **Charts:** minutes studied and people studying per day for the last 30 days (also as a table).
- **Per person:** their visit history (when, which subject, how long, phone or computer), plus buttons to **reset their password** (there's no email, so this is how forgotten passwords get fixed) or **delete their account**.
- **Download CSV** to open the list in Excel or Google Sheets.

The sign-up form tells students that Beau can see their name, when they use the site, how long they study and their scores.

**Important:** the admin is whoever owns the account called `Beau`. As soon as the site is live, sign up as **Beau** before sharing the link, so nobody else can take that name. To change who the admin is, edit `ADMIN_USERNAME` in `wrangler.toml`.

## Unlock codes and the locked booklet

- Codes are 6 digits. Each works once; the account that uses it can open the completed booklet forever. Beau always has access.
- Beau's dashboard lists every code (used or not, by whom, when), can make 10 more at a time, and can unlock or lock any account by hand.
- An account that enters 5 wrong codes in an hour is blocked from trying until the hour is up.
- The completed booklet is **not** in this public repo. It lives in `private/` (gitignored) and in the D1 `content` table, and is only sent to unlocked accounts by `/api/theory`. To update it: `node scripts/upload-theory.mjs > private/theory.sql`, then `npx wrangler d1 execute ec-revisions-db --remote --file private/theory.sql`.

## Code

| Path | What it is |
| --- | --- |
| `src/worker.js` | API: accounts, saving progress, study-time heartbeat, admin |
| `migrations/` | Tables: `users`, `sessions`, `progress`, `visits`, `daily`, `codes`, `unlocks`, `unlock_attempts`, `content` |
| `public/` | The website files Cloudflare serves |
| `src/maths/`, `src/science/` | Content and app source for each subject; `npm run build` rebuilds `public/` |

Passwords are stored as salted PBKDF2 hashes, logins use an HttpOnly cookie, cross-site writes are blocked, and an account locks for 5 minutes after 8 wrong passwords.

## Updating the live site

The database (`ec-revisions-db`, Oceania region) and the Worker are already set up. After changing anything:

1. `npm install` (first time only)
2. If you changed the maths or science content: `npm run build`
3. `npm run deploy` (needs `npx wrangler login` first on a new computer)

The pages in `public/` are bundled into the Worker, so a deploy is one upload.

### Automatic updates from GitHub (optional)

Add two repository secrets (**Settings → Secrets and variables → Actions**): `CLOUDFLARE_API_TOKEN` (a token from the "Edit Cloudflare Workers" template, plus **Account → D1 → Edit**) and `CLOUDFLARE_ACCOUNT_ID` (`8859192e3ec70410341f57569d7da75f`). After that, every push to `main` updates the live site.

## Working on it locally

`npm run dev` runs the whole site at <http://localhost:8787> with a local database.
