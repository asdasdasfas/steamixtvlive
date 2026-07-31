const http = require('http')
const cats = {
  'beinsmart': 9,
  'sportarena': 7,
  'belgesel': 8,
  'cinemaximum': 10,
  'cineverse': 11,
  'marvel': 12,
  'netflixclub': 13,
  'exxenshow': 14
}

async function getStreams(catId, label) {
  return new Promise((resolve, reject) => {
    const url = `http://ctn34.xyz:2095/player_api.php?username=aziz6486&password=aziz.6486&action=get_live_streams&category_id=${catId}`
    http.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const streams = JSON.parse(data)
          console.log(`\n=== ${label} (cat ${catId}) ===`)
          streams.forEach(s => {
            console.log(`ID:${s.stream_id} | ${s.name} | logo:${s.stream_icon || 'yok'}`)
          })
          resolve(streams)
        } catch(e) { reject(e) }
      })
    }).on('error', reject)
  })
}

;(async () => {
  for (const [key, id] of Object.entries(cats)) {
    await getStreams(id, key)
  }
})()
