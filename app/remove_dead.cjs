const fs = require('fs');

// Read working IDs
const workingIds = JSON.parse(fs.readFileSync('working_ids.json', 'utf8'));
console.log('Working IDs to keep:', workingIds.length);

// Read rotation.ts
const content = fs.readFileSync('src/lib/rotation.ts', 'utf8');

// Find the split point - before the first new channel  
const firstNewIdx = content.indexOf('#EXTINF:-1 tvg-id="BEINSPORTS"');
if (firstNewIdx === -1) { console.error('Not found'); process.exit(1); }

const beforePart = content.substring(0, firstNewIdx);
const backtickIdx = content.lastIndexOf('`');
const afterPart = content.substring(backtickIdx);

// Parse old channels to find their count
const oldM3U = beforePart.substring(beforePart.indexOf('`') + 1);
const oldCount = oldM3U.split('\n').filter(l => l.startsWith('#EXTINF:')).length;

// Parse all new channels from the current file
const fullM3U = content.substring(content.indexOf('rawM3U = `') + 'rawM3U = `'.length, backtickIdx);
const lines = fullM3U.split('\n');
let currentExtinf = '';
const keepLines = [];

for (const line of lines) {
  const t = line.trim();
  if (t.startsWith('#EXTINF:')) {
    currentExtinf = t;
  } else if (t.startsWith('http') && currentExtinf) {
    // Only filter new channels (aziz6486)
    if (t.includes('aziz6486')) {
      const urlMatch = t.match(/\/(\d+)\.m3u8/);
      const id = urlMatch ? urlMatch[1] : '';
      if (workingIds.includes(id)) {
        keepLines.push(currentExtinf);
        keepLines.push(t);
        keepLines.push('');
      }
    } else {
      // Keep old channels as-is
      keepLines.push(currentExtinf);
      keepLines.push(t);
      keepLines.push('');
    }
  }
}

const newContent = beforePart + keepLines.join('\n') + '\n' + afterPart;
fs.writeFileSync('src/lib/rotation.ts', newContent, 'utf8');

const newCount = beforePart.split('\n').filter(l => l.startsWith('#EXTINF:')).length + keepLines.filter(l => l.startsWith('#EXTINF:')).length;
console.log('Old channels:', oldCount);
console.log('New channels kept:', keepLines.filter(l => l.startsWith('#EXTINF:')).length);
console.log('Total:', newCount);
console.log('Done!');
