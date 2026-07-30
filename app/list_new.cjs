const fs = require('fs');
const c = fs.readFileSync('src/lib/rotation.ts','utf8');
const start = c.indexOf('rawM3U = ') + 10;
const end = c.lastIndexOf('`');
const lines = c.substring(start, end).split('\n');
let i = 0, extinf = '';
for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) extinf = t;
  else if (t.startsWith('http') && extinf) {
    if (t.includes('aziz6486')) {
      i++;
      const m1 = extinf.match(/tvg-name="([^"]*)"/);
      const m2 = extinf.match(/,(.+)$/);
      const name = m1 ? m1[1] : (m2 ? m2[1].trim() : '???');
      console.log(i + '. ' + name);
    }
  }
}
console.log('\nToplam yeniler: ' + i);
