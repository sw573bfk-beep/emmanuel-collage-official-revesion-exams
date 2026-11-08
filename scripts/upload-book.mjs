// Builds the completed theory booklet (one row per page, plus each page's picture) and writes SQL to load it
// into the D1 `content` table. Everything comes from private/ (gitignored), so only unlocked accounts can read it.
//   node scripts/upload-book.mjs > private/book.sql
//   npx wrangler d1 execute ec-revisions-db --remote --file private/book.sql
// private/theory-book.mjs = each page's questions with Minimal answers and Extra info;
// private/book-pages/page-NN.webp = the picture of each completed page (the Normal level).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = (await import(path.join(root, 'private/theory-book.mjs'))).default;
const now = Math.floor(Date.now() / 1000);
const q = s => "'" + s.replace(/'/g, "''") + "'";
const CHUNK = 80000; // D1 statements are limited to ~100 KB
let sql = 'DELETE FROM content;\n', bytes = 0, chunks = 0;
for (const p of pages) {
  const file = path.join(root, 'private/book-pages', 'page-' + String(p.n).padStart(2, '0') + '.webp');
  const img = fs.readFileSync(file);
  // WebP size: width/height are in the VP8/VP8L/VP8X header; simplest is to read them with a tiny parser
  const dims = webpSize(img);
  const meta = { n: p.n, sec: p.sec, landscape: dims.w > dims.h, items: p.items };
  sql += 'INSERT INTO content (key, ord, body, updated_at) VALUES (' + q('bk-' + String(p.n).padStart(2, '0')) + ', ' + p.n + ', ' + q(JSON.stringify(meta)) + ', ' + now + ');\n';
  const b64 = img.toString('base64'); bytes += img.length;
  for (let i = 0, k = 0; i < b64.length; i += CHUNK, k++) {
    sql += 'INSERT INTO content (key, ord, body, updated_at) VALUES (' + q('img-' + String(p.n).padStart(2, '0') + '-' + String(k).padStart(2, '0')) + ', ' + (1000 + p.n * 100 + k) + ', ' + q(b64.slice(i, i + CHUNK)) + ', ' + now + ');\n';
    chunks++;
  }
}
process.stdout.write(sql);
console.error(pages.length + ' pages, ' + pages.reduce((a, p) => a + p.items.length, 0) + ' questions, ' + Math.round(bytes / 1024) + ' KB of pictures in ' + chunks + ' pieces');

function webpSize(buf) {
  const t = buf.toString('ascii', 12, 16);
  if (t === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (t === 'VP8L') { const b = buf.readUInt32LE(21); return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) }; }
  return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
}
