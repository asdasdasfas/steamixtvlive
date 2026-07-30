const fs = require('fs');
const c = fs.readFileSync('src/lib/rotation.ts','utf8');
const s = c.indexOf('rawM3U = ') + 10;
const e = c.lastIndexOf('`');
const before = c.substring(0, s);
const after = c.substring(e);
let m3u = c.substring(s, e);

// Restore the 5 channels that were accidentally removed
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

// Find where to insert - before the first DE: SKY channel
const skyIdx = m3u.indexOf('DE: SKY SELECT');
m3u = m3u.substring(0, skyIdx) + restore + m3u.substring(skyIdx);

// Now clean up names for all new channels (aziz6486)
// Replace tvg-name="TR: XXX" -> tvg-name="XXX"
// Replace ,TR: XXX -> ,XXX
m3u = m3u.replace(/(tvg-name=")TR: /g, '$1');
m3u = m3u.replace(/,(TR: )/g, ',');

// Fix small caps ʜᴅ -> HD
m3u = m3u.replace(/ʜᴅ/g, 'HD');

// Fix belgesel channel name
m3u = m3u.replace(/tvg-name="BELGESEL"/, 'tvg-name="BELGESEL HD"');
m3u = m3u.replace(/,"BELGESEL"/, ',"BELGESEL HD"');

// Also update the be*IN name - remove asterisks for cleaner look
m3u = m3u.replace(/be\*IN/g, 'BEIN');
m3u = m3u.replace(/BE\*IN/g, 'BEIN');
m3u = m3u.replace(/bE\*IN/g, 'BEIN');

const result = before + m3u + after;
fs.writeFileSync('src/lib/rotation.ts', result, 'utf8');

const total = result.split('\n').filter(l => l.trim().startsWith('#EXTINF:')).length;
console.log('Total channels: ' + total);
console.log('Done - names cleaned, 5 channels restored');
