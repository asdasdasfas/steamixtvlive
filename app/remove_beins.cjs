const fs = require('fs');
const c = fs.readFileSync('src/lib/rotation.ts','utf8');
const start = c.indexOf('rawM3U = ') + 10;
const end = c.lastIndexOf('`');
const before = c.substring(0, start);
const after = c.substring(end);
const lines = c.substring(start, end).split('\n');

const out = [];
let extinf = '';
let removed = 0;
let kept = 0;

for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) {
    extinf = t;
  } else if (t.startsWith('http') && extinf) {
    if (t.includes('aziz6486')) {
      const isBein = /be\*in/i.test(extinf);
      const isHaber = /haber/i.test(extinf);
      if (isBein && !isHaber) {
        removed++;
        extinf = '';
        continue;
      }
    }
    out.push(extinf);
    out.push(t);
    out.push('');
    kept++;
    extinf = '';
  }
}

const result = before + out.join('\n') + after;
fs.writeFileSync('src/lib/rotation.ts', result, 'utf8');

const total = result.split('\n').filter(l => l.trim().startsWith('#EXTINF:')).length;
console.log('Removed new beIN channels: ' + removed);
console.log('Kept: ' + kept);
console.log('Total channels: ' + total);
