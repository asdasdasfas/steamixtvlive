import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execSync } from 'node:child_process'
import { gunzipSync } from 'node:zlib'
import ffmpegPath from 'ffmpeg-static'
if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
  try { const r = execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>nul', { encoding: 'utf8' }); if (r.trim()) ffmpegPath = r.trim() } catch {}
}

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

function doRequest(reqHeaders, opts, body, redirectCount, res, extraHeaders) {
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
      const oldKey = opts.hostname + ':' + (opts.port || (opts.protocol === 'https:' ? 443 : 80))
      if (loc.includes('.m3u8') || loc.includes('.m3u')) {
        proxyReferers[key] = loc
        hlsDefaultTarget = 'http://' + key
        if (!hlsProxyKeys.includes(key)) hlsProxyKeys.push(key)
      } else if (key !== oldKey) {
        hlsDefaultTarget = 'http://' + key
        if (!hlsProxyKeys.includes(key)) hlsProxyKeys.push(key)
      }
      const hlsMatch = loc.match(/\/hls\/([^\/?#]+)/)
      if (hlsMatch) hlsTargets[hlsMatch[1]] = 'http://' + key
      proxyReq.destroy()
      const newOpts = makeHttpOpts(loc, opts.method, reqHeaders)
      doRequest(reqHeaders, newOpts, undefined, redirectCount + 1, res, extraHeaders)
      return
    }
    const headers = { ...proxyRes.headers, 'access-control-allow-origin': '*' }
    if (extraHeaders) Object.assign(headers, extraHeaders)
    delete headers['transfer-encoding']
    try { res.writeHead(sc, headers); proxyRes.pipe(res) } catch {}
  })
  proxyReq.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
  proxyReq.on('timeout', () => { if (done) return; done = true; proxyReq.destroy(); try { res.writeHead(504); res.end('Timeout') } catch {} })
  if (body) proxyReq.write(body)
  proxyReq.end()
}

function fetchAndProxy(req, res, targetBase, pathPrefix, extraHeaders) {
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
    doRequest(req.headers, opts, body, 0, res, extraHeaders)
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
            // Only rewrite URLs if they're on the same host as the M3U8 (same CDN serves both)
            // If a different host (e.g. TRT CDN from daioncdn M3U8), keep absolute URL — browser hits CDN directly
            if (u.host === m3u8Url.host) {
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
            } else {
              console.log(`[HLS-KEEP] ${absUrl.substring(0,60)} (different host, keeping absolute)`)
            }
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

// Audio transcoding: pipes source through ffmpeg (video copy, AC3/EAC3 -> AAC)
function transcodeStream(req, res, sourceUrl, hop) {
  if (hop === undefined) hop = 0
  if (hop > 5) { try { res.writeHead(502); res.end('Too many redirects') } catch {}; return }
  const opts = makeHttpOpts(sourceUrl, req.method, req.headers)
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    let done = false
    const proxyReq = httpModule(opts).request(opts, proxyRes => {
      if (done) return; done = true
      const sc = proxyRes.statusCode || 200
      if (sc >= 301 && sc <= 308 && proxyRes.headers.location) {
        let loc = proxyRes.headers.location
        if (!loc.startsWith('http://') && !loc.startsWith('https://')) {
          const u = new URL(sourceUrl); loc = u.protocol + '//' + u.host + (u.port ? ':' + u.port : '') + (loc.startsWith('/') ? loc : '/' + loc)
        }
        proxyReq.destroy(); transcodeStream(req, res, loc, hop + 1); return
      }
      if (sc >= 300) { const h = { ...proxyRes.headers, 'access-control-allow-origin': '*' }; try { res.writeHead(sc, h); proxyRes.pipe(res) } catch {}; return }
      const srcLower = sourceUrl.toLowerCase()
      const isMp4 = srcLower.includes('.mp4') || srcLower.includes('.mkv')
      const outFmt = isMp4 ? 'mp4' : 'mpegts'
      const outCt = isMp4 ? 'video/mp4' : 'video/mp2t'
      const extra = isMp4 ? ['-movflags', 'frag_keyframe+empty_moov'] : []
      if (!ffmpegPath) { console.log(`[FF] ffmpegPath null, proxy`); try { res.writeHead(502,{'Content-Type':'text/plain'}); res.end('FFmpeg not available') } catch {}; return }
      let ff
      try { ff = spawn(ffmpegPath, ['-nostats','-hide_banner','-i','pipe:0','-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-b:a','128k',...extra,'-f',outFmt,'-y','pipe:1']) } catch(e) { console.log(`[FF] spawn error: ${e.message}`); try { res.writeHead(502); res.end('Spawn error') } catch {}; return }
      let hs = false
      ff.stdout.on('data', d => { if (!hs) { hs = true; try { res.writeHead(200,{'Content-Type':outCt,'access-control-allow-origin':'*'}) } catch {} }; try { res.write(d) } catch {} })
      ff.stderr.on('data', d => { console.log(`[FF] ${d.toString().trim()}`) })
      ff.on('exit', (code, sig) => { console.log(`[FF] exit code=${code} sig=${sig} hs=${hs}`); if (hs) { try { res.end() } catch {} } else { try { res.writeHead(502); res.end(`FF exit ${code}`) } catch {} } })
      ff.on('error', (e) => { console.log(`[FF] spawn error: ${e.message}`); if (!hs) try { res.writeHead(502); res.end('Transcode error') } catch {} })
      proxyRes.pipe(ff.stdin); proxyRes.on('error', () => ff.kill()); req.on('close', () => ff.kill())
    })
    proxyReq.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
    if (body) proxyReq.write(body); proxyReq.end()
  })
}

// Direct file transcode (MKV/MP4) — ffmpeg fetches source with auth headers via -headers
function transcodeDirect(req, res, sourceUrl) {
  const bodyChunks = []
  req.on('data', c => bodyChunks.push(c))
  req.on('end', () => {
    if (!ffmpegPath) { res.writeHead(502,{'Content-Type':'text/plain'}); res.end('FFmpeg not available'); return }
    const h = req.headers || {}
    const ref = h['referer'] || h['origin'] || ''
    const ua = h['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const extra = ['-movflags', 'frag_keyframe+empty_moov']
    const ff = spawn(ffmpegPath, ['-nostats','-hide_banner','-probesize','4M','-analyzeduration','4M','-headers',`Referer: ${ref}\r\nUser-Agent: ${ua}\r\n`,'-i',sourceUrl,'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-b:a','128k',...extra,'-f','mp4','-y','pipe:1'])
    let hs = false
    let timer = setTimeout(() => { if (!hs) { console.log(`[FFDIR] timeout 120s`); ff.kill(); try { res.writeHead(504); res.end('Transcode timeout') } catch {} } }, 120000)
    ff.stdout.on('data', d => { if (!hs) { hs = true; clearTimeout(timer); try { res.writeHead(200,{'Content-Type':'video/mp4','access-control-allow-origin':'*'}) } catch {} }; try { res.write(d) } catch {} })
    ff.stderr.on('data', d => { console.log(`[FFDIR] ${d.toString().trim().substring(0,250)}`) })
    ff.on('exit', (code, sig) => { clearTimeout(timer); console.log(`[FFDIR] exit code=${code} hs=${hs}`); if (hs) { try { res.end() } catch {} } else { try { res.writeHead(502); res.end(`FF exit ${code}`) } catch {} } })
    ff.on('error', (e) => { clearTimeout(timer); console.log(`[FFDIR] error: ${e.message}`); if (!hs) { try { res.writeHead(502); res.end('Transcode error') } catch {} } })
    req.on('close', () => ff.kill())
  })
}

// Encode a URL for safe use in /audio-fix/ paths
function encodeUrl(url) {
  return Buffer.from(url).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}

// Rewrite M3U8 playlist: master → rewrite variants to /audio-fix/m/ , media → rewrite segments to /audio-fix/s/
function rewriteM3u8(body, base) {
  const isMaster = body.includes('#EXT-X-STREAM-INF')
  const prefix = isMaster ? '/audio-fix/m/' : '/audio-fix/s/'
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#')) {
      let su = line
      if (!su.startsWith('http://') && !su.startsWith('https://')) su = base + su
      lines[i] = prefix + encodeUrl(su)
    }
  }
  return lines.join('\n')
}

// Handle M3U8 VOD — fetches playlist, rewrites URLs
function handleM3u8Vod(req, res, playlistUrl) {
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    function fetchM3u8(url, hop) {
      if (hop > 5) { try { res.writeHead(502); res.end('Too many redirects') } catch {}; return }
      const opts = makeHttpOpts(url, req.method, req.headers)
      let done = false
      const pr = httpModule(opts).request(opts, proxyRes => {
        if (done) return; done = true
        const sc = proxyRes.statusCode || 200
        if (sc >= 301 && sc <= 308 && proxyRes.headers.location) {
          let loc = proxyRes.headers.location
          if (!loc.startsWith('http://') && !loc.startsWith('https://')) { const u = new URL(url); loc = u.protocol+'//'+u.host+(u.port?':'+u.port:'')+(loc.startsWith('/')?loc:'/'+loc) }
          pr.destroy(); fetchM3u8(loc, hop+1); return
        }
        if (sc >= 300) { const h = { ...proxyRes.headers, 'access-control-allow-origin': '*' }; try { res.writeHead(sc, h); proxyRes.pipe(res) } catch {}; return }
        const bc = []; proxyRes.on('data', c => bc.push(c))
        proxyRes.on('end', () => {
          let c = Buffer.concat(bc).toString('utf8')
          try {
            const m3u8Url = new URL(url)
            const base = m3u8Url.protocol+'//'+m3u8Url.host+(m3u8Url.port?':'+m3u8Url.port:'')+m3u8Url.pathname.substring(0,m3u8Url.pathname.lastIndexOf('/')+1)
            c = rewriteM3u8(c, base)
          } catch(e) { console.log(`[M3U8] rewrite err: ${e.message}`) }
          try { res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','access-control-allow-origin':'*'}); res.end(c) } catch {}
        })
      })
      pr.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
      if (body) pr.write(body); pr.end()
    }
    fetchM3u8(playlistUrl, 0)
  })
}

// Handle /audio-fix/m/{base64} — recursively resolves variant/media M3U8 playlists
function handleM3u8Playlist(req, res, targetUrl) {
  const chunks = []
  req.on('data', c => chunks.push(c))
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
    function fetchPlaylist(url, hop) {
      if (hop > 5) { try { res.writeHead(502); res.end('Too many redirects') } catch {}; return }
      const opts = makeHttpOpts(url, req.method, req.headers)
      let done = false
      const pr = httpModule(opts).request(opts, proxyRes => {
        if (done) return; done = true
        const sc = proxyRes.statusCode || 200
        if (sc >= 301 && sc <= 308 && proxyRes.headers.location) {
          let loc = proxyRes.headers.location
          if (!loc.startsWith('http://') && !loc.startsWith('https://')) { const u = new URL(url); loc = u.protocol+'//'+u.host+(u.port?':'+u.port:'')+(loc.startsWith('/')?loc:'/'+loc) }
          pr.destroy(); fetchPlaylist(loc, hop+1); return
        }
        if (sc >= 300) { const h = { ...proxyRes.headers, 'access-control-allow-origin': '*' }; try { res.writeHead(sc, h); proxyRes.pipe(res) } catch {}; return }
        const bc = []; proxyRes.on('data', c => bc.push(c))
        proxyRes.on('end', () => {
          let c = Buffer.concat(bc).toString('utf8')
          try {
            const m3u8Url = new URL(url)
            const base = m3u8Url.protocol+'//'+m3u8Url.host+(m3u8Url.port?':'+m3u8Url.port:'')+m3u8Url.pathname.substring(0,m3u8Url.pathname.lastIndexOf('/')+1)
            c = rewriteM3u8(c, base)
          } catch(e) { console.log(`[M3U8-M] rewrite err: ${e.message}`) }
          try { res.writeHead(200,{'Content-Type':'application/vnd.apple.mpegurl','access-control-allow-origin':'*'}); res.end(c) } catch {}
        })
      })
      pr.on('error', () => { if (done) return; done = true; try { res.writeHead(502); res.end('Proxy Error') } catch {} })
      if (body) pr.write(body); pr.end()
    }
    fetchPlaylist(targetUrl, 0)
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
    const qIdx = req.url.indexOf('?')
    const pathOnly = qIdx >= 0 ? req.url.slice(0, qIdx) : req.url
    const query = qIdx >= 0 ? req.url.slice(qIdx + 1) : ''
    const params = new URLSearchParams(query)
    const extraHeaders = params.has('dl') ? { 'content-disposition': 'attachment; filename="video.mkv"', 'content-type': 'application/octet-stream' } : null
    const afterDyn = pathOnly.slice(5)
    const slashIdx = afterDyn.indexOf('/')
    if (slashIdx > 0) {
      const encoded = afterDyn.slice(0, slashIdx)
      try {
        const decoded = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          const targetBase = decoded.replace(/\/+$/, '')
          const prefix = '/dyn/' + encoded
          return fetchAndProxy(req, res, targetBase, prefix, extraHeaders)
        }
      } catch {}
    }
    res.writeHead(502); res.end('Invalid proxy path'); return
  }

  // Audio-fix segment transcoding: /audio-fix/s/{base64(absolute_url)}
  if (req.url.startsWith('/audio-fix/s/')) {
    const encoded = req.url.slice('/audio-fix/s/'.length)
    console.log(`[AFIX-S] segment request: ${req.url.substring(0,80)}`)
    try {
      const target = Buffer.from(encoded.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()
      console.log(`[AFIX-S] decoded: ${target.substring(0,100)}`)
      if (target.startsWith('http://')||target.startsWith('https://')) return transcodeStream(req, res, target)
    } catch(e) { console.log(`[AFIX-S] error: ${e.message}`) }
    res.writeHead(502); res.end('Invalid segment'); return
  }

  // Audio-fix M3U8 playlist handler: /audio-fix/m/{base64(absolute_url)}
  // Handles variant and media playlists recursively
  if (req.url.startsWith('/audio-fix/m/')) {
    const encoded = req.url.slice('/audio-fix/m/'.length)
    console.log(`[AFIX-M] playlist request: ${req.url.substring(0,80)}`)
    try {
      const target = Buffer.from(encoded.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()
      console.log(`[AFIX-M] decoded: ${target.substring(0,100)}`)
      if (target.startsWith('http://')||target.startsWith('https://')) return handleM3u8Playlist(req, res, target)
    } catch(e) { console.log(`[AFIX-M] error: ${e.message}`) }
    res.writeHead(502); res.end('Invalid playlist'); return
  }

  // Audio-fix VOD proxy: /audio-fix/{base64(base_url)}/{path}
  if (req.url.startsWith('/audio-fix/')) {
    const rest = req.url.slice('/audio-fix/'.length); const si = rest.indexOf('/')
    console.log(`[AFIX] request: ${req.url.substring(0,100)}`)
    if (si > 0) {
      const encoded = rest.slice(0, si); const path = rest.slice(si)
      try {
        const dec = Buffer.from(encoded.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString()
        console.log(`[AFIX] base=${dec.substring(0,50)} path=${path.substring(0,80)}`)
        if (dec.startsWith('http://')||dec.startsWith('https://')) {
          const base = dec.replace(/\/+$/,''); const url = base + path
          const pathLower = (path.split('?')[0]).toLowerCase()
          const isM3u8 = pathLower.endsWith('.m3u8')||pathLower.endsWith('.m3u')
          const isDirect = pathLower.endsWith('.mkv')||pathLower.endsWith('.mp4')
          console.log(`[AFIX] fullUrl=${url.substring(0,120)} isM3u8=${isM3u8} isDirect=${isDirect}`)
          if (isM3u8) return handleM3u8Vod(req, res, url)
          if (isDirect) { console.log(`[AFIX] direct file -> transcodeStream (proxy+pipe)`); return transcodeStream(req, res, url) }
          console.log(`[AFIX] other -> transcodeStream (proxy+pipe)`)
          return transcodeStream(req, res, url)
        }
      } catch(e) { console.log(`[AFIX] decode error: ${e.message}`) }
    }
    res.writeHead(502); res.end('Invalid audio-fix path'); return
  }

  // Virtual M3U8 for VOD (MKV/MP4) — wraps direct video URL as HLS playlist
  // StreamVault opens this via intent with type=application/x-mpegurl
  if (req.url.startsWith('/m3u/')) {
    const encoded = req.url.slice('/m3u/'.length)
    try {
      const decoded = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        const playlist = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:86400\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:86400,\n${decoded}\n`
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(playlist)
        return
      }
    } catch {}
    res.writeHead(502); res.end('Invalid m3u path'); return
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
}).listen(PORT, () => {
  console.log(`Server on port ${PORT}`)
    const ffExists = ffmpegPath ? (()=>{try{fs.accessSync(ffmpegPath);return 'yes'}catch{return 'no'}})() : 'null'
    console.log(`[FFMPEG] path=${ffmpegPath} exists=${ffExists}`)
  // Periodic state cleanup to prevent memory leaks (every 30 min)
  setInterval(() => {
    const before = { pt: Object.keys(proxyTargets).length, ht: Object.keys(hlsTargets).length, pr: Object.keys(proxyReferers).length, mc: Object.keys(m3u8CdnMap).length, hk: hlsProxyKeys.length }
    // Keep only the most recent 50 proxy targets
    const ptKeys = Object.keys(proxyTargets)
    if (ptKeys.length > 50) {
      const toRemove = ptKeys.slice(0, ptKeys.length - 50)
      for (const k of toRemove) delete proxyTargets[k]
    }
    // Keep only the most recent 50 referers
    const prKeys = Object.keys(proxyReferers)
    if (prKeys.length > 50) {
      const toRemove = prKeys.slice(0, prKeys.length - 50)
      for (const k of toRemove) delete proxyReferers[k]
    }
    // Keep only the most recent 50 HLS targets
    const htKeys = Object.keys(hlsTargets)
    if (htKeys.length > 50) {
      const toRemove = htKeys.slice(0, htKeys.length - 50)
      for (const k of toRemove) delete hlsTargets[k]
    }
    // Keep only the most recent 100 CDN map entries (hashes + host mappings)
    const mcKeys = Object.keys(m3u8CdnMap)
    if (mcKeys.length > 100) {
      const toRemove = mcKeys.slice(0, mcKeys.length - 100)
      for (const k of toRemove) delete m3u8CdnMap[k]
    }
    if (hlsProxyKeys.length > 50) hlsProxyKeys.splice(0, hlsProxyKeys.length - 50)
    const after = { pt: Object.keys(proxyTargets).length, ht: Object.keys(hlsTargets).length, pr: Object.keys(proxyReferers).length, mc: Object.keys(m3u8CdnMap).length, hk: hlsProxyKeys.length }
    console.log(`[CLEANUP] before=${JSON.stringify(before)} after=${JSON.stringify(after)}`)
  }, 30 * 60 * 1000)
  // Self-keepalive: ping the site every 10 min to prevent Render free tier sleep
  const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
  if (host.startsWith('http://localhost')) {
    console.log('[KEEPALIVE] Skipped (local dev)')
  } else {
    console.log(`[KEEPALIVE] Starting for ${host}`)
    setInterval(() => {
      http.get(host + '/', () => {}).on('error', () => {})
    }, 10 * 60 * 1000)
  }
})
