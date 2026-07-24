import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'

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
// Keys in proxyTargets that were set by HLS (.m3u8) redirects (not polluted by movie/series)
const hlsProxyKeys = []
// CDN origin playlist URLs (used as Referer for TS segment auth)
const proxyReferers = {}
// M3U8 segment URL rewriting: maps a hash to { base (full CDN base URL), host, protocol }
const m3u8CdnMap = {}
let m3u8Counter = 0

function cleanHeaders(reqHeaders, targetHost, targetUrl) {
  return { ...reqHeaders, 'Host': targetHost }
}

function makeHttpOpts(urlStr, method, reqHeaders) {
  const u = new URL(urlStr)
  const isHttps = u.protocol === 'https:'
  return {
    hostname: u.hostname, port: u.port || (isHttps ? 443 : 80),
    path: u.pathname + u.search,
    method, headers: cleanHeaders(reqHeaders, u.host, urlStr),
    timeout: 15000, family: 4,
    protocol: u.protocol, // 'http:' or 'https:'
  }
}

function httpModule(opts) {
  return opts.protocol === 'https:' ? https : http
}

function doRequest(reqHeaders, opts, body, redirectCount, res) {
  if (redirectCount > 5) { try { res.writeHead(502); res.end('Too many redirects') } catch {}; return }
  let done = false
  const proxyReq = httpModule(opts).request(opts, proxyRes => {
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
      // Store CDN referer for TS auth: playlist URL → referer for subsequent TS segment requests to this host
      const oldKey = opts.hostname + ':' + (opts.port || (opts.protocol === 'https:' ? 443 : 80))
      if (loc.includes('.m3u8') || loc.includes('.m3u')) {
        proxyReferers[key] = loc
        hlsDefaultTarget = 'http://' + key
        if (!hlsProxyKeys.includes(key)) hlsProxyKeys.push(key)
      } else if (key !== oldKey) {
        // Host changed (redirect to CDN without .m3u8) — still update default target
        hlsDefaultTarget = 'http://' + key
        if (!hlsProxyKeys.includes(key)) hlsProxyKeys.push(key)
      }
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

// Like fetchAndProxy but intercepts m3u8 responses to extract CDN hosts
function hlsFetchAndProxy(req, res, targetBase, pathPrefix) {
  let path = req.url
  if (pathPrefix && req.url.startsWith(pathPrefix)) {
    path = '/' + req.url.slice(pathPrefix.length)
  }
  const pathNoQuery = path.split('?')[0]
  const isM3u8 = pathNoQuery.endsWith('.m3u8') || pathNoQuery.endsWith('.m3u')
  if (!isM3u8) {
    // Non-playlist → proxy normally through backend (maybe it serves TS too)
    return fetchAndProxy(req, res, targetBase, pathPrefix)
  }
  // Reset per-channel state so old CDN targets don't pollute TS proxy for this channel
  hlsProxyKeys.length = 0
  const url = targetBase + path
  const opts = makeHttpOpts(url, req.method, req.headers)
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    // Override doRequest to capture m3u8 body
    let done = false
    const proxyReq = httpModule(opts).request(opts, proxyRes => {
      if (done) return; done = true
      const sc = proxyRes.statusCode || 200
      if (sc >= 301 && sc <= 308 && proxyRes.headers.location) {
        // Redirect — let doRequest handle it (includes proxyTargets/proxyReferers update)
        doRequest(req.headers, opts, body, 0, res)
        return
      }
      // Buffer the body to extract CDN URLs
      const bodyChunks = []
      proxyRes.on('data', c => bodyChunks.push(c))
      proxyRes.on('end', () => {
        let fullBody = Buffer.concat(bodyChunks)
        // Decompress gzip if needed (some CDNs send gzip body without Content-Encoding header)
        const isGzip = fullBody.length > 2 && fullBody[0] === 0x1F && fullBody[1] === 0x8B
        if (isGzip) {
          try {
            fullBody = gunzipSync(fullBody)
          } catch (e) {
            console.log(`[HLS-GUNZIP-ERR] ${e.message}`)
          }
        }
        let bodyStr = fullBody.toString('utf8')
        // Get the M3U8's base directory for resolving relative URLs
        const m3u8Url = new URL(url)
        const m3u8Base = m3u8Url.protocol + '//' + m3u8Url.host + (m3u8Url.port ? ':' + m3u8Url.port : '') + m3u8Url.pathname.substring(0, m3u8Url.pathname.lastIndexOf('/') + 1)
        // Find all segment/sub-playlist URLs in the M3U8 (both absolute and relative)
        // Match URLs on their own line (not EXTINF lines)
        const allUrlMatches = bodyStr.match(/https?:\/\/[^\s?#]+/g) || []
        // Also find relative URLs (lines that don't start with # and aren't absolute)
        const lines = bodyStr.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line && !line.startsWith('#') && !line.startsWith('http://') && !line.startsWith('https://')) {
            const absUrl = m3u8Base + line
            if (!allUrlMatches.includes(absUrl)) allUrlMatches.push(absUrl)
          }
        }
        for (const absUrl of allUrlMatches) {
          try {
            const u = new URL(absUrl)
            const key = u.hostname + ':' + (u.port || (u.protocol === 'https:' ? 443 : 80))
            const proto = u.protocol // 'http:' or 'https:'
            // Store CDN base in proxyTargets (preserving protocol)
            if (!proxyTargets[key]) {
              proxyTargets[key] = proto + '//' + key
            }
            // Register in m3u8CdnMap with a short hash
            let hash = m3u8CdnMap[key]
            if (!hash) {
              hash = 'cdn' + (++m3u8Counter)
              m3u8CdnMap[key] = hash
              m3u8CdnMap[hash] = { base: proto + '//' + key, host: u.hostname, protocol: proto }
            }
            // Update default targets
            hlsDefaultTarget = proto + '//' + key
            if (!hlsProxyKeys.includes(key)) hlsProxyKeys.push(key)
            // Replace absolute URL with /hls/{hash}/path
            const urlPath = u.pathname + (u.search || '')
            const proxyPath = '/hls/' + hash + urlPath
            bodyStr = bodyStr.replace(absUrl, proxyPath)
            console.log(`[HLS-REWRITE] ${absUrl.substring(0,60)} -> ${proxyPath.substring(0,60)}`)
          } catch (e) {
            console.log(`[HLS-REWRITE-ERR] ${e.message} for ${absUrl.substring(0,60)}`)
          }
        }
        console.log(`[HLS-BODY] ${bodyStr.substring(0,200)}...`)
        const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
        delete headers['transfer-encoding']
        delete headers['content-encoding']
        try { res.writeHead(sc, headers); res.end(bodyStr) } catch {}
      })
    })
    proxyReq.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
    proxyReq.on('timeout', () => { if (done) return; done = true; proxyReq.destroy(); try { res.writeHead(504); res.end('Timeout') } catch {} })
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
  // Static proxy routes — capture m3u8 responses to discover CDN target
  if (req.url.startsWith('/xtream-api/')) return fetchAndProxy(req, res, 'http://ctn34.xyz:8080', '/xtream-api/')
  if (req.url.startsWith('/xtream/')) return fetchAndProxy(req, res, 'http://dzcvip1.xyz:2095', '/xtream/')
  // Virtual M3U8 handler for non-HLS streams (MPEG-TS from backends like ctn34)
  // /v/{base64}/{path}.m3u8 — returns a virtual M3U8 that wraps the continuous stream as HLS
  if (req.url.startsWith('/v/')) {
    const match = req.url.match(/^\/v\/([A-Za-z0-9\-_]+)(\/.*)\.m3u8$/)
    if (match) {
      const encoded = match[1]
      const pathNoExt = match[2]
      const target = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      const prefix = '/v/' + encoded
      const segUrl = '/s/' + encoded + pathNoExt + '.ts'
      const playlist = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:86400\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:86400,\n${segUrl}\n`
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.end(playlist)
      return
    }
  }
  // Segment stream handler for virtual HLS — streams MPEG-TS from backend
  if (req.url.startsWith('/s/')) {
    const match = req.url.match(/^\/s\/([A-Za-z0-9\-_]+)(\/.*)\.ts$/)
    if (match) {
      const encoded = match[1]
      const path = match[2] // Without .ts extension
      const target = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      const url = target + path
      const opts = makeHttpOpts(url, req.method, req.headers)
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => {
        const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
        doRequest(req.headers, opts, body, 0, res)
      })
      return
    }
  }
  // Generic /p/{base64}/{path} — any base URL (dzcvip1, ctn34, ccgbndrby11, dpsmartone, etc.)
  // base64 = protocol + "//" + host + ":" + port (e.g. "http://dzcvip1.xyz:2095" or "https://tv-trt1.medya.trt.com.tr:443")
  if (req.url.startsWith('/p/')) {
    const match = req.url.match(/^\/p\/([A-Za-z0-9\-_]+)(\/.*)$/)
    if (match) {
      const encoded = match[1]
      const path = match[2]
      const target = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      const prefix = '/p/' + encoded
      const pathNoQuery = path.split('?')[0]
      if (pathNoQuery.endsWith('.m3u8')) {
        return hlsFetchAndProxy(req, res, target, prefix)
      }
      return fetchAndProxy(req, res, target, prefix)
    }
  }
  if (req.url.startsWith('/p2095/')) return hlsFetchAndProxy(req, res, 'http://dzcvip1.xyz:2095', '/p2095/')
  if (req.url.startsWith('/p8080/')) return fetchAndProxy(req, res, 'http://dzcvip1.xyz:8080', '/p8080/')

  // HLS segments - proxy through the redirect-discovered CDN target
  if (req.url.startsWith('/hls/')) {
    const hashMatch = req.url.match(/\/hls\/([^\/?#]+)/)
    const hash = hashMatch ? hashMatch[1] : null
    // First check m3u8CdnMap (set by M3U8 URL rewriting)
    let target = null
    if (hash && m3u8CdnMap[hash]) {
      target = m3u8CdnMap[hash].base
    }
    if (!target && hash && hlsTargets[hash]) {
      target = hlsTargets[hash]
    }
    if (!target && hlsProxyKeys.length > 0) {
      target = proxyTargets[hlsProxyKeys[hlsProxyKeys.length - 1]] || hlsDefaultTarget
    }
    if (!target) target = hlsDefaultTarget
    res.setHeader('X-HLS-Target', target)
    res.setHeader('X-HLS-Keys', hlsProxyKeys.join(',') || '(empty)')
    console.log(`[HLS-PROXY] hash=${hash} target=${target} keys=${hlsProxyKeys.join(',')}`)
    // Set CDN referer/origin for auth (matches what CDN expects)
    if (target) {
      const cdnKey = target.replace(/^https?:\/\//, '')
      if (proxyReferers[cdnKey]) {
        req.headers['referer'] = proxyReferers[cdnKey]
        req.headers['origin'] = target.replace(/\/+$/, '')
      }
    }
    // For our custom hashes (cdn1, cdn2, etc), the path after /hls/{hash} is relative to target
    // For upstream hashes (MD5 from backend M3U8), keep the full /hls/{hash}/... path
    const isCustomHash = hash && m3u8CdnMap[hash] != null
    const pathPrefix = isCustomHash ? '/hls/' + hash : ''
    return fetchAndProxy(req, res, target, pathPrefix)
  }

  // Debug state endpoint
  if (req.url === '/__state') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      hlsDefaultTarget,
      hlsProxyKeys,
      proxyTargets: Object.keys(proxyTargets),
      proxyReferers: Object.keys(proxyReferers),
      m3u8CdnMap: Object.keys(m3u8CdnMap).filter(k => !k.startsWith('cdn') && k !== ''),
      m3u8Counter,
    }, null, 2))
    return
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
