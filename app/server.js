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

const PROXIES = [
  { prefix: '/xtream-api/', target: 'http://ctn34.xyz:8080' },
  { prefix: '/p8080/', target: 'http://ctn34.xyz:8080' },
  { prefix: '/xtream/', target: 'http://dzcvip1.xyz:2095' },
  { prefix: '/p2095/', target: 'http://dzcvip1.xyz:2095' },
]

function proxyRequest(req, res, target) {
  const url = new URL(target + req.url)
  const opts = {
    hostname: url.hostname, port: url.port,
    path: url.pathname + url.search, method: req.method,
    headers: { ...req.headers, host: url.host },
  }
  const proxyReq = http.request(opts, proxyRes => {
    const headers = { ...proxyRes.headers }
    delete headers['transfer-encoding']
    res.writeHead(proxyRes.statusCode, headers)
    proxyRes.pipe(res)
  })
  req.pipe(proxyReq)
  proxyReq.on('error', () => { res.writeHead(502); res.end('Bad Gateway') })
}

http.createServer((req, res) => {
  for (const p of PROXIES) {
    if (req.url.startsWith(p.prefix)) {
      return proxyRequest(req, res, p.target)
    }
  }
  let url = req.url.split('?')[0]
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
}).listen(PORT, () => console.log(`Server running on port ${PORT}`))
