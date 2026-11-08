// Builds the completed theory booklet from private/theory-part*.mjs and writes SQL to load it into the
// D1 `content` table. The booklet itself is kept out of this public repo (private/ is gitignored),
// so only accounts that have unlocked it can read it, through /api/theory.
//   node scripts/upload-theory.mjs > private/theory.sql
//   npx wrangler d1 execute ec-revisions-db --remote --file private/theory.sql
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Reuse the diagram helpers from the science app.
const ctx = { window: {}, localStorage: { getItem: () => null, setItem() {} }, document: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src/science/core.js'), 'utf8') + ';this.S = { atomSVG, energySVG, fireTriangleSVG, lineChartSVG };', ctx);
const S = ctx.S;

const part1 = (await import(path.join(root, 'private/theory-part1.mjs'))).default(S);
const part2 = (await import(path.join(root, 'private/theory-part2.mjs'))).default(S);
const sections = part1.concat(part2);
// The booklet page each question is on (worked out from the workbook file, lined up with its contents page),
// so the completed booklet can be read one page at a time.
const pagesFile = path.join(root, 'private/theory-pages.json');
if (fs.existsSync(pagesFile)) {
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
  if (pages.length !== sections.length) throw new Error('theory-pages.json has ' + pages.length + ' sections, the booklet has ' + sections.length);
  sections.forEach((s, i) => {
    if (pages[i].length !== s.items.length) throw new Error('theory-pages.json: ' + s.title + ' has ' + pages[i].length + ' pages listed for ' + s.items.length + ' questions');
    s.items.forEach((it, j) => { it.pg = String(pages[i][j]); });
  });
}
const now = Math.floor(Date.now() / 1000);
const q = s => "'" + s.replace(/'/g, "''") + "'";
let sql = 'DELETE FROM content;\n';
sections.forEach((s, i) => {
  const body = JSON.stringify(s);
  if (body.length > 90000) throw new Error('Section too big for one D1 statement: ' + s.title);
  sql += 'INSERT INTO content (key, ord, body, updated_at) VALUES (' + q('s' + String(i).padStart(2, '0')) + ', ' + i + ', ' + q(body) + ', ' + now + ');\n';
});
process.stdout.write(sql);
console.error(sections.length + ' sections, ' + sections.reduce((a, s) => a + s.items.length, 0) + ' items, ' + Math.round(sql.length / 1024) + ' KB');
