# EC Revisions

Year 8 exam revision with accounts. Students make an account (ideally with their real name), choose a subject and study. Their progress saves to their account, so it follows them to any device. The admin (**Beau**) gets a dashboard showing who is using the site, when, and for how long.

- **Maths:** ready. Notes, unlimited auto-marked practice, the full revision booklet with answers, exam mode, interactive tools and a step-by-step solver.
- **Science:** coming soon (the page, account support and tracking are already in place).

Everything runs on **Cloudflare** (free plan): a Worker serves the website and its API, and a D1 database stores accounts, progress and usage. This GitHub repo holds the code; the link you share is the Cloudflare one.

## Pages

| Address | What it is |
| --- | --- |
| `/` | Log in or create an account, then choose a subject |
| `/maths/` | Maths revision (built from `src/maths/`) |
| `/science/` | Science, coming soon |
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

## Code

| Path | What it is |
| --- | --- |
| `src/worker.js` | API: accounts, saving progress, study-time heartbeat, admin |
| `migrations/0001_init.sql` | Tables: `users`, `sessions`, `progress`, `visits`, `daily` |
| `public/` | The website files Cloudflare serves |
| `src/maths/` | Maths content and app source; `npm run build` rebuilds `public/maths/` |

Passwords are stored as salted PBKDF2 hashes, logins use an HttpOnly cookie, cross-site writes are blocked, and an account locks for 5 minutes after 8 wrong passwords.

## Putting it online

1. Make a free Cloudflare account at <https://dash.cloudflare.com/sign-up>.
2. `npm install`, then `npx wrangler login`.
3. `npx wrangler d1 create ec-revisions-db` and paste the `database_id` it prints into `wrangler.toml`.
4. `npm run deploy`. It prints the site's address, e.g. `https://ec-revisions.<your-subdomain>.workers.dev`.

### Automatic updates from GitHub

Add two repository secrets (**Settings → Secrets and variables → Actions**): `CLOUDFLARE_API_TOKEN` (a token from the "Edit Cloudflare Workers" template, plus **Account → D1 → Edit**) and `CLOUDFLARE_ACCOUNT_ID`. After that, every push to `main` updates the live site.

## Working on it locally

`npm run dev` runs the whole site at <http://localhost:8787> with a local database.
