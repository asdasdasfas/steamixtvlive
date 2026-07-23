import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = process.env.PORT || 5173
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')

// Console log capture
const consoleLogs = []
const MAX_LOGS = 500

const LOG_SCRIPT = `<script>
var __logs=[]; var __oL=console.log; var __oE=console.error; var __oW=console.warn
function __sl(l,a){try{
  var m=a.map(function(x){return typeof x==='object'?JSON.stringify(x).substring(0,200):String(x)}).join(' ')
  __logs.push({l:m,t:Date.now(),v:l}); if(__logs.length>200)__logs.shift()
  var img=new Image(); img.src='/__log?d='+encodeURIComponent(JSON.stringify({level:l,msg:m,time:Date.now()}))
}catch(e){}}
console.log=function(){__oL.apply(console,arguments);__sl('log',arguments)}
console.error=function(){__oE.apply(console,arguments);__sl('error',arguments)}
console.warn=function(){__oW.apply(console,arguments);__sl('warn',arguments)}
window.onerror=function(m,u,li){__sl('uncaught',[m,u+':'+li])}
window.addEventListener('unhandledrejection',function(e){__sl('promise',[e.reason?.message||String(e.reason)])})
console.log('%c[LOG] Console capture active','color:lime')
<\/script>`

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

function cleanHeaders(reqHeaders, targetHost) {
  const h = { ...reqHeaders, 'Host': targetHost, 'Connection': 'close', 'User-Agent': 'Mozilla/5.0' }
  const remove = ['origin', 'referer', 'cookie', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-user']
  for (const k of remove) delete h[k]
  return h
}

function makeHttpOpts(urlStr, method, reqHeaders) {
  const u = new URL(urlStr)
  return {
    hostname: u.hostname, port: u.port || 80,
    path: u.pathname + u.search,
    method, headers: cleanHeaders(reqHeaders, u.host),
    timeout: 15000, family: 4,
  }
}

function doRequest(reqHeaders, opts, body, redirectCount, res) {
  if (redirectCount > 5) { try { res.writeHead(502); res.end('Too many redirects') } catch {}; return }
  let done = false
  const proxyReq = http.request(opts, proxyRes => {
    if (done) return; done = true
    const sc = proxyRes.statusCode || 200
    if (sc >= 301 && sc <= 308 && proxyRes.headers.location) {
      let loc = proxyRes.headers.location
      if (!loc.startsWith('http://') && !loc.startsWith('https://')) {
        const base = opts.hostname + (opts.port && opts.port != 80 ? ':' + opts.port : '')
        loc = 'http://' + base + (loc.startsWith('/') ? loc : '/' + loc)
      }
      const redirectUrl = new URL(loc)
      const key = redirectUrl.hostname + ':' + (redirectUrl.port || 80)
      proxyTargets[key] = 'http://' + key
      const hlsMatch = loc.match(/\/hls\/([^\/?#]+)/)
      if (hlsMatch) hlsTargets[hlsMatch[1]] = 'http://' + key
      proxyReq.destroy()
      const newOpts = makeHttpOpts(loc, opts.method, reqHeaders)
      doRequest(reqHeaders, newOpts, undefined, redirectCount + 1, res)
      return
    }
    const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
    delete headers['transfer-encoding']
    try { res.writeHead(sc, headers); proxyRes.pipe(res) } catch {}
  })
  proxyReq.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
  proxyReq.on('timeout', () => { if (done) return; done = true; proxyReq.destroy(); try { res.writeHead(504); res.end('Timeout') } catch {} })
  if (body) proxyReq.write(body)
  proxyReq.end()
}

function fetchAndProxy(req, res, targetBase, pathPrefix) {
  let path = req.url
  if (pathPrefix && req.url.startsWith(pathPrefix)) {
    path = '/' + req.url.slice(pathPrefix.length)
  }
  const url = targetBase + path
  const opts = makeHttpOpts(url, req.method, req.headers)
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    doRequest(req.headers, opts, body, 0, res)
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

  // Console log view endpoint
  if (req.url === '/__logs') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(JSON.stringify(consoleLogs.slice(-200), null, 2))
    return
  }

  // Console log capture endpoint (GET via Image beacon or POST via fetch)
  if (req.url === '/__log' || req.url.startsWith('/__log?')) {
    if (req.method === 'POST') {
      let logData = ''
      req.on('data', c => logData += c)
      req.on('end', () => {
        try {
          const entry = JSON.parse(logData)
          consoleLogs.push(entry)
          if (consoleLogs.length > MAX_LOGS) consoleLogs.splice(0, consoleLogs.length - MAX_LOGS)
        } catch {}
        res.writeHead(200); res.end('ok')
      })
    } else {
      // GET from Image beacon
      const url = new URL(req.url, 'http://localhost')
      const d = url.searchParams.get('d')
      if (d) {
        try { const entry = JSON.parse(d); consoleLogs.push(entry); if (consoleLogs.length > MAX_LOGS) consoleLogs.splice(0, consoleLogs.length - MAX_LOGS) } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'image/gif' })
      res.end(Buffer.from('R0lGODlhAQABAAAAACwAAAAAAQABAAA=', 'base64')) // 1x1 transparent gif
    }
    return
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
        const html = data2.toString('utf8').replace('</head>', LOG_SCRIPT + '</head>')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      })
      return
    }
    let ext = path.extname(fullPath)
    if (ext === '.html') {
      const html = data.toString('utf8').replace('</head>', LOG_SCRIPT + '</head>')
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(html)
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      res.end(data)
    }
  })
}).listen(PORT, () => console.log(`Server on port ${PORT}`))
