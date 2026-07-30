const fs = require('fs');
let m3u = fs.readFileSync('src/lib/rotation.ts', 'utf8');

const m3uStart = m3u.indexOf('rawM3U = `') + 'rawM3U = `'.length;
const m3uEnd = m3u.lastIndexOf('`');
const before = m3u.substring(0, m3uStart);
const after = m3u.substring(m3uEnd);
let content = m3u.substring(m3uStart, m3uEnd);

// 1. Restore 5 channels before DE: SKY SELECT (find line start)
const skyIdx = content.indexOf('\nDE: SKY SELECT');
const insertPoint = skyIdx !== -1 ? skyIdx + 1 : content.length;

const restore = `#EXTINF:-1 tvg-id="TRVASATEXPLOREFHD" tvg-name="TR: VİASAT EXPLORE FHD" group-title="Belgesel" tvg-logo="https://bluelogo8990.duckdns.org:8080/LOGO.YENI/TR/BELGESELL/VIASAT.EXPLORE.png",TR: VİASAT EXPLORE FHD
http://ctn34.xyz:2095/live/aziz6486/aziz.6486/99775.m3u8

#EXTINF:-1 tvg-id="TRPOLSKAMERASIHD" tvg-name="TR: POLİS KAMERASI HD" group-title="Belgesel" tvg-logo="https://zorexlogo.dynuddns.com:8080/zrx/BELGESEL/POLIS.KAMERASI.png",TR: POLİS KAMERASI HD
http://ctn34.xyz:2095/live/aziz6486/aziz.6486/220392.m3u8

#EXTINF:-1 tvg-id="TRTRTGENC" tvg-name="TR: TRT GENC" group-title="Belgesel" tvg-logo="",TR: TRT GENC
http://ctn34.xyz:2095/live/aziz6486/aziz.6486/213805.m3u8

#EXTINF:-1 tvg-id="TRDOCUSCREENFHD" tvg-name="TR: DOCU SCREEN FHD" group-title="Belgesel" tvg-logo="https://bluelogo8990.duckdns.org:8080/LOGO.YENI/TR/SONRADAN/DOCUSCREEN.png",TR: DOCU SCREEN FHD
http://ctn34.xyz:2095/live/aziz6486/aziz.6486/173948.m3u8

#EXTINF:-1 tvg-id="TRLOVENATUREHD" tvg-name="TR: LOVE NATURE HD" group-title="Belgesel" tvg-logo="https://bluelogo8990.duckdns.org:8080/LOGO.YENI/TR/BELGESELL/LOVE.NATURE.png",TR: LOVE NATURE HD
http://ctn34.xyz:2095/live/aziz6486/aziz.6486/147538.m3u8

`;

content = content.substring(0, insertPoint) + restore + content.substring(insertPoint);

// 2. Clean names: Remove "TR: " prefix from tvg-name and display name (only for aziz6486 channels)
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
  
  if (t.startsWith('#EXTINF:') && nextLine.includes('aziz6486')) {
    // Remove TR:  prefix from tvg-name
    if (t.includes('tvg-name="TR: ')) {
      lines[i] = lines[i].replace(/tvg-name="TR: /g, 'tvg-name="');
    }
    // Remove TR:  prefix from display name (after last comma)
    const lastComma = lines[i].lastIndexOf(',');
    if (lastComma !== -1) {
      const before = lines[i].substring(0, lastComma);
      const after = lines[i].substring(lastComma);
      if (after.startsWith(',TR: ')) {
        lines[i] = before + ',' + after.substring(5);
      }
    }
    // Fix small caps HD
    lines[i] = lines[i].replace(/ʜᴅ/g, 'HD');
  }
}
content = lines.join('\n');

// 3. Fix be*IN -> BEIN (only in new channels area)
content = content.replace(/be\*IN/g, 'BEIN');
content = content.replace(/BE\*IN/g, 'BEIN');

const result = before + content + after;
fs.writeFileSync('src/lib/rotation.ts', result, 'utf8');

const total = result.split('\n').filter(l => l.trim().startsWith('#EXTINF:')).length;
console.log('Total channels: ' + total);
console.log('Done properly!');
