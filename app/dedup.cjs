const fs = require('fs');
const c = fs.readFileSync('src/lib/rotation.ts','utf8');
const s = c.indexOf('rawM3U = ') + 10;
const e = c.lastIndexOf('`');
const before = c.substring(0, s);
const after = c.substring(e);
const lines = c.substring(s, e).split('\n');

const removeNames = ['VİASAT EXPLORE FHD', 'POLİS KAMERASI HD', 'TRT GENC', 'DOCU SCREEN FHD', 'LOVE NATURE HD'];

const out = [];
let extinf = '', removed = 0, kept = 0;
let seen = new Set();

for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) extinf = t;
  else if (t.startsWith('http') && extinf) {
    if (t.includes('aziz6486')) {
      const n = (extinf.match(/tvg-name="([^"]*)"/) || [,''])[1];
      // Remove if it's in the remove list AND we've already seen it once
      if (removeNames.includes(n)) {
        if (seen.has(n)) {
          removed++;
          extinf = '';
          continue;
        }
        seen.add(n);
      }
    }
    out.push(extinf, t, '');
    kept++;
    extinf = '';
  }
}

const result = before + out.join('\n') + after;
fs.writeFileSync('src/lib/rotation.ts', result, 'utf8');

const total = result.split('\n').filter(l => l.trim().startsWith('#EXTINF:')).length;
console.log('Removed duplicates: ' + removed);
console.log('Total channels: ' + total);
