import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = process.env.PORT || 5173
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t', '.mp4': 'video/mp4', '.mkv': 'video/x-matroska',
}

function fetchUrl(url, method, headers, body, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const u = new URL(url)
    const opts = {
      hostname: u.hostname, port: u.port || 80,
      path: u.pathname + u.search,
      method, headers: { ...headers, 'Host': u.host, 'Connection': 'close' },
      timeout: 30000,
    }
    const req = http.request(opts, res => {
      if (res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location) {
        const loc = res.headers.location
        const nextUrl = loc.startsWith('http') ? loc : `${u.protocol}//${u.host}${loc}`
        res.resume()
        return fetchUrl(nextUrl, method, headers, body, redirects - 1).then(resolve).catch(reject)
      }
      resolve(res)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    if (body) req.write(body)
    req.end()
  })
}

function proxyTo(req, res, hostname, port, prefix) {
  const path = req.url.startsWith(prefix) ? '/' + req.url.slice(prefix.length) : req.url
  const url = `http://${hostname}${port ? ':' + port : ''}${path}`
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    fetchUrl(url, req.method, req.headers, body)
      .then(proxyRes => {
        const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
        delete headers['transfer-encoding']
        res.writeHead(proxyRes.statusCode || 200, headers)
        proxyRes.pipe(res)
      })
      .catch(() => { try { res.writeHead(502); res.end('Proxy Error') } catch {} })
  })
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  // Proxy Xtream API → ctn34.xyz:8080
  if (req.url.startsWith('/xtream-api/')) {
    return proxyTo(req, res, 'ctn34.xyz', 8080, '/xtream-api/')
  }
  // Proxy Xtream → dzcvip1.xyz:2095
  if (req.url.startsWith('/xtream/')) {
    return proxyTo(req, res, 'dzcvip1.xyz', 2095, '/xtream/')
  }
  // Proxy p2095 → dzcvip1.xyz:2095
  if (req.url.startsWith('/p2095/')) {
    return proxyTo(req, res, 'dzcvip1.xyz', 2095, '/p2095/')
  }
  // Proxy p8080 → dzcvip1.xyz:8080
  if (req.url.startsWith('/p8080/')) {
    return proxyTo(req, res, 'dzcvip1.xyz', 8080, '/p8080/')
  }
  // Proxy /hls/* → dzcvip1.xyz:2095 (HLS TS segments from m3u8)
  if (req.url.startsWith('/hls/')) {
    return proxyTo(req, res, 'dzcvip1.xyz', 2095, '/hls/')
  }

  // Static files
  let url = (req.url || '/').split('?')[0]
  let filePath = url === '/' ? '/index.html' : url
  let fullPath = path.join(DIST, filePath)
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
        if (err2) { res.writeHead(404); res.end('Not Found'); return }
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(data2)
      })
      return
    }
    let ext = path.extname(fullPath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(PORT, () => console.log(`Server on port ${PORT}`))
