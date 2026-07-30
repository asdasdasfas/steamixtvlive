const http = require('http');
const https = require('https');
const fs = require('fs');

const SERVER = 'ctn34.xyz', PORT = 2095, USER = 'aziz6486', PASS = 'aziz.6486';
const TIMEOUT = 15000;
const MAX_REDIRECTS = 5;

function fetchFollow(url, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > MAX_REDIRECTS) return resolve({ ok: false, reason: 'MAX_REDIRECTS', m3u: false, segments: false });
    
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: TIMEOUT, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location) {
        // Follow redirect
        let loc = res.headers.location;
        if (!loc.startsWith('http')) {
          const u = new URL(url);
          loc = u.protocol + '//' + u.host + loc;
        }
        req.destroy();
        return resolve(fetchFollow(loc, redirects + 1));
      }
      
      let data = '';
      res.on('data', c => { if (data.length < 500) data += c; });
      res.on('end', () => {
        const m3u = data.includes('#EXTM3U');
        const segments = data.includes('#EXTINF:');
        const endlist = data.includes('#EXT-X-ENDLIST');
        resolve({ ok: m3u, status: res.statusCode, m3u, segments, endlist, size: data.length });
      });
    });
    req.on('error', (e) => resolve({ ok: false, reason: e.message, m3u: false, segments: false }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, reason: 'TIMEOUT', m3u: false, segments: false }); });
  });
}

async function main() {
  const content = fs.readFileSync('src/lib/rotation.ts', 'utf8');
  const start = content.indexOf('rawM3U = `') + 'rawM3U = `'.length;
  const end = content.lastIndexOf('`');
  const m3u = content.substring(start, end);
  
  const lines = m3u.split('\n');
  const newChannels = [];
  let currentExtinf = '';
  
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('#EXTINF:')) currentExtinf = t;
    else if (t.startsWith('http') && currentExtinf && t.includes('aziz6486')) {
      const idMatch = currentExtinf.match(/tvg-id="([^"]*)"/);
      const nameMatch = currentExtinf.match(/tvg-name="([^"]*)"/);
      const groupMatch = currentExtinf.match(/group-title="([^"]*)"/);
      const urlMatch = t.match(/\/(\d+)\.m3u8/);
      if (urlMatch) {
        newChannels.push({
          id: urlMatch[1], url: t,
          tvgId: idMatch ? idMatch[1] : '',
          name: nameMatch ? nameMatch[1] : '',
          group: groupMatch ? groupMatch[1] : ''
        });
      }
    }
  }
  
  console.log('Testing ' + newChannels.length + ' channels (follows redirects)...\n');
  
  const working = [];
  const dead = [];
  
  for (let i = 0; i < newChannels.length; i++) {
    const ch = newChannels[i];
    const result = await fetchFollow(ch.url);
    
    if (result.ok) {
      working.push(ch);
      if ((i+1) % 20 === 0) process.stderr.write('.');
    } else {
      dead.push(ch);
      console.log('DEAD[' + (i+1) + '/' + newChannels.length + '] id=' + ch.id + ' ' + ch.name.substring(0,45) + ' | reason=' + (result.reason || 'status='+result.status));
    }
  }
  
  console.log('\n\n=== RESULTS ===');
  console.log('Working channels: ' + working.length);
  console.log('Dead channels: ' + dead.length + '\n');
  
  console.log('=== DEAD CHANNELS ===');
  for (const ch of dead) {
    console.log(ch.id + ' | ' + ch.name.substring(0,50) + ' | group=' + ch.group);
  }
  
  // Save working channels list
  const workingIds = working.map(c => c.id);
  fs.writeFileSync('working_ids.json', JSON.stringify(workingIds), 'utf8');
  console.log('\nWorking IDs saved to working_ids.json');
}

main().catch(e => console.error(e));
