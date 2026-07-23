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

// Dynamic proxy cache for redirect targets
const proxyTargets = {}
// HLS targets keyed by the hash segment from /hls/{hash}/ paths
const hlsTargets = {}
let hlsDefaultTarget = 'http://dzcvip1.xyz:2095'

function fetchAndProxy(req, res, targetBase, pathPrefix) {
  let path = req.url
  if (pathPrefix && req.url.startsWith(pathPrefix)) {
    path = '/' + req.url.slice(pathPrefix.length)
  }
  const url = targetBase + path
  const u = new URL(url)
  const opts = {
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search,
    method: req.method,
    headers: { ...req.headers, 'Host': u.host, 'Connection': 'close' },
    timeout: 15000,
    family: 4,
  }
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    const proxyReq = http.request(opts, proxyRes => {
      // Handle redirect: rewrite Location to go through our proxy
      if (proxyRes.statusCode >= 301 && proxyRes.statusCode <= 308 && proxyRes.headers.location) {
        const loc = proxyRes.headers.location
        // If redirect is HTTP, rewrite to HTTPS via our proxy
        if (loc.startsWith('http://')) {
          const redirectUrl = new URL(loc)
          const proxyPath = '/_p/' + redirectUrl.hostname + ':' + (redirectUrl.port || 80) + redirectUrl.pathname + redirectUrl.search
          // Cache this target
           const key = redirectUrl.hostname + ':' + (redirectUrl.port || 80)
           const targetUrl = 'http://' + key
           proxyTargets[key] = targetUrl
           // Also cache under original target host
           const origUrl = new URL(targetBase)
           const origKey = origUrl.hostname + ':' + (origUrl.port || 80)
           proxyTargets[origKey] = targetUrl
           // Track per-hash for /hls/ segments
           const hlsMatch = loc.match(/\/hls\/([^\/?#]+)/)
           if (hlsMatch) hlsTargets[hlsMatch[1]] = targetUrl
          const headers = { ...proxyRes.headers, location: proxyPath, 'access-control-allow-origin': '*' }
          delete headers['transfer-encoding']
          res.writeHead(proxyRes.statusCode, headers)
          res.end()
          return
        }
      }
      // Normal response
      const ct = proxyRes.headers['content-type'] || ''
      let data = Buffer.alloc(0)
      proxyRes.on('data', c => data = Buffer.concat([data, c]))
      proxyRes.on('end', () => {
        const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
        delete headers['transfer-encoding']
        res.writeHead(proxyRes.statusCode || 200, headers)
        res.end(data)
      })
    })
    proxyReq.on('error', () => { try { res.writeHead(502); res.end('Proxy Error') } catch {} })
    proxyReq.on('timeout', () => { proxyReq.destroy(); try { res.writeHead(504); res.end('Timeout') } catch {} })
    if (body) proxyReq.write(body)
    proxyReq.end()
  })
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  // Dynamic proxy for redirect targets: /_p/host:port/path
  if (req.url.startsWith('/_p/')) {
    const rest = req.url.slice(4)
    const slashIdx = rest.indexOf('/')
    if (slashIdx > 0) {
      const hostPort = rest.slice(0, slashIdx)
      let target = proxyTargets[hostPort]
      // Fallback: try any known proxy target
      if (!target) {
        const values = Object.values(proxyTargets)
        if (values.length > 0) target = values[values.length - 1]
      }
      if (target) {
        return fetchAndProxy(req, res, target, '/_p/' + hostPort)
      }
    }
    // Cache miss - return error
    res.writeHead(502); res.end('Proxy target not found'); return
  }

  // Dynamic proxy: /dyn/{base64url(base_url)}/{path}
  if (req.url.startsWith('/dyn/')) {
    const afterDyn = req.url.slice(5) // skip '/dyn/'
    const slashIdx = afterDyn.indexOf('/')
    if (slashIdx > 0) {
      const encoded = afterDyn.slice(0, slashIdx)
      try {
        const decoded = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          const targetBase = decoded.replace(/\/+$/, '')
          const prefix = '/dyn/' + encoded
          return fetchAndProxy(req, res, targetBase, prefix)
        }
      } catch {}
    }
    res.writeHead(502); res.end('Invalid proxy path'); return
  }

  // Static proxy routes
  if (req.url.startsWith('/xtream-api/')) return fetchAndProxy(req, res, 'http://ctn34.xyz:8080', '/xtream-api/')
  if (req.url.startsWith('/xtream/')) return fetchAndProxy(req, res, 'http://dzcvip1.xyz:2095', '/xtream/')
  if (req.url.startsWith('/p2095/')) return fetchAndProxy(req, res, 'http://dzcvip1.xyz:2095', '/p2095/')
  if (req.url.startsWith('/p8080/')) return fetchAndProxy(req, res, 'http://dzcvip1.xyz:8080', '/p8080/')

  // HLS segments - try hash-specific target, fallback to any known target, then default
  if (req.url.startsWith('/hls/')) {
    const hashMatch = req.url.match(/\/hls\/([^\/?#]+)/)
    const hash = hashMatch ? hashMatch[1] : null
    let target = (hash && hlsTargets[hash]) || null
    if (!target) {
      const values = Object.values(proxyTargets)
      if (values.length > 0) target = values[values.length - 1]
    }
    if (!target) target = hlsDefaultTarget
    return fetchAndProxy(req, res, target, '')
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
