import http from 'node:http'
import httpProxy from 'http-proxy'
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

const proxy = httpProxy.createProxyServer({ changeOrigin: true, proxyTimeout: 30000 })

proxy.on('error', (err, req, res) => {
  try { res.writeHead(502, { 'Access-Control-Allow-Origin': '*' }); res.end('Bad Gateway') } catch {}
})

proxy.on('proxyReq', (proxyReq, req) => {
  const prefix = (req as any).__proxyPrefix
  if (prefix && req.url) {
    const newPath = '/' + req.url.slice(prefix.length)
    proxyReq.path = newPath
  }
})

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  for (const p of PROXIES) {
    if (req.url && req.url.startsWith(p.prefix)) {
      (req as any).__proxyPrefix = p.prefix
      proxy.web(req, res, { target: p.target })
      return
    }
  }

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
}).listen(PORT, () => console.log(`Server running on port ${PORT}`))
