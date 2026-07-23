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

function proxyTo(req, res, hostname, port, prefix) {
  const path = req.url.startsWith(prefix) ? '/' + req.url.slice(prefix.length) : req.url
  const opts = {
    hostname, port,
    path: path,
    method: req.method,
    headers: {
      ...req.headers,
      'Host': hostname + (port ? ':' + port : ''),
      'Connection': 'close',
    },
    timeout: 30000,
  }
  const proxyReq = http.request(opts, proxyRes => {
    const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
    res.writeHead(proxyRes.statusCode || 200, headers)
    proxyRes.pipe(res)
  })
  proxyReq.on('error', () => { try { res.writeHead(502); res.end('Proxy Error') } catch {} })
  proxyReq.on('timeout', () => { proxyReq.destroy(); try { res.writeHead(504); res.end('Timeout') } catch {} })
  req.pipe(proxyReq)
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
