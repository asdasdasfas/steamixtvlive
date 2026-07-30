const fs = require('fs');
const c = fs.readFileSync('src/lib/rotation.ts','utf8');
const start = c.indexOf('rawM3U = ') + 10;
const end = c.lastIndexOf('`');
const m3u = c.substring(start, end);
const lines = m3u.split('\n');
let i = 0;
let currentExtinf = '';
for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) {
    currentExtinf = t;
  } else if (t.startsWith('http') && currentExtinf) {
    if (t.includes('aziz6486')) {
      i++;
      const nameMatch = currentExtinf.match(/tvg-name="([^"]*)"/);
      const titleMatch = currentExtinf.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1] : (titleMatch ? titleMatch[1].trim() : '???');
      console.log(i + '. ' + name);
    }
  }
}
console.log('\nToplam: ' + i);
