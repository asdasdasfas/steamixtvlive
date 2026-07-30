const fs = require('fs');

const workingIds = JSON.parse(fs.readFileSync('working_ids.json', 'utf8'));
const content = fs.readFileSync('src/lib/rotation.ts', 'utf8');

// Find rawM3U boundaries
const m3uStart = content.indexOf('rawM3U = `') + 'rawM3U = `'.length;
const m3uEnd = content.lastIndexOf('`');

const beforeM3U = content.substring(0, m3uStart);
const afterM3U = content.substring(m3uEnd);

const m3uLines = content.substring(m3uStart, m3uEnd).split('\n');

const outLines = [];
let currentExtinf = '';
let skipped = 0;
let kept = 0;

for (const line of m3uLines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) {
    currentExtinf = t;
    outLines.push(line);
  } else if (t.startsWith('http') && currentExtinf) {
    if (t.includes('aziz6486')) {
      const m = t.match(/(\d+)\.m3u8/);
      const id = m ? m[1] : '';
      if (workingIds.includes(id)) {
        outLines.push(line);
        kept++;
      } else {
        // Remove the EXTINF line we just pushed
        outLines.pop();
        skipped++;
      }
    } else {
      outLines.push(line);
    }
  } else {
    outLines.push(line);
  }
}

const newM3U = outLines.join('\n');
const result = beforeM3U + newM3U + afterM3U;
fs.writeFileSync('src/lib/rotation.ts', result, 'utf8');

const totalExtinf = result.split('\n').filter(l => l.trim().startsWith('#EXTINF:')).length;
console.log('Old channels: 144');
console.log('New channels kept: ' + kept);
console.log('New channels removed: ' + skipped);
console.log('Total channels: ' + totalExtinf);
console.log('Done!');
